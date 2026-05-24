/**
 * /api/weather.js  –  Vercel serverless function
 *
 * Primary data source:
 *   https://www.vremetolmin.si/tag_main.html
 *   Weather Display pipe-separated format, updated every minute.
 *
 * Field index mapping confirmed from live data:
 *  [0]  date              "8/5/2026"
 *  [1]  time              "10:28"
 *  [2]  condition (SL)    "Jasno"
 *  [3]  temp °C           "16,4"   (comma decimal)
 *  [4]  humidity %        "73"
 *  [5]  dew point °C      "11.5"
 *  [6]  wind speed km/h   "3.5"
 *  [7]  wind gust km/h    "6.4"
 *  [8]  wind bearing °    "108"
 *  [9]  rain today mm     "0,0"    (comma decimal)
 *  [10] rain rate mm/h    "0.00"
 *  [11] pressure hPa      "1015.9"
 *  [12] pressure trend    "-0.6"
 *  [13] solar W/m²        "677"
 *  [14] feels like °C     "15.1"
 *  [15] UV index          "0.5"
 *  [16] sunrise           "05:41"
 *  [17] sunset            "20:22"
 *  [18] day length        "14:41"
 *  [19] moonrise          "01:53"
 *  [21] moon illumination "65%"
 *  [22] wind speed m/s    "0.9"
 *  [23] wind gust m/s     "1.3"
 *  [24] Beaufort          "2"
 *  [28] wind dir string   "JV"     (already Slovenian)
 *  [30] today max temp    "16.4"
 *  [31] time of max       "10:24"
 *  [32] today min temp    "7.1"
 *  [33] time of min       "03:42"
 *  [34] yesterday max     "22.1"
 *  [35] time yest max     "15:13"
 *  [36] yesterday min     "9.2"
 *  [37] time yest min     "23:59"
 *  [38] rain yesterday mm "0"
 *  [41] humidity max %    "97"
 *  [42] time hum max      "05:20"
 *  [43] humidity min %    "72"
 *  [44] time hum min      "10:16"
 *  [50] rain this month   "75.4"
 *  [51] rain this year    "496.3"
 *  [57] max gust text     "**9 km/h** (03:07)"
 *  [68] solar kWh today   "1.4kwh"
 *  [69] solar kWh month   "38.0kwh"
 *  [70] solar kWh year    "360.6kwh"
 *  [82] moon age string   "Moon age: 20 days,17 hours,33 minutes,65%"
 *  [86] pressure mmHg     "762"
 *  [87] forecast (SL)     "Soncno/Brez padavin"
 *  [88] pressure change   "+2.8"
 */

const BASE = 'https://www.vremetolmin.si';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; VremeTolminApp/1.0)' };

function timer(ms) { return AbortSignal.timeout(ms); }
function parseI(v) { const n = parseInt(String(v ?? '').trim(), 10); return isNaN(n) ? null : n; }

// Weather Display uses comma as decimal in some fields
function parseWD(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Strip markdown bold markers, trim whitespace
function cleanWD(v) {
  if (v == null) return null;
  const s = String(v).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return s || null;
}

// Decode HTML entities
function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&deg;/gi, '°').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ').replace(/&rarr;/gi, '→').replace(/&larr;/gi, '←')
    .replace(/&ndash;/gi, '–').replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function cleanCell(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function pressureTrendText(val) {
  if (val == null) return 'Stabilno';
  if (val >  1.5) return 'Hitro raste';
  if (val >  0.3) return 'Počasi raste';
  if (val < -1.5) return 'Hitro pada';
  if (val < -0.3) return 'Počasi pada';
  return 'Stabilno';
}

function bearingToSL(deg) {
  if (deg == null) return '—';
  const dirs = ['S','SSV','SV','VSV','V','VJV','JV','JJV','J','JJZ','JZ','ZJZ','Z','ZSZ','SZ','SSZ'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

// ── Main tag_main.html parser ─────────────────────────────────────────────────
function parseTagMain(text) {
  const f = text.split('|').map(v => v.trim());

  const bearing = parseI(f[8]);

  // Wind direction from field [28] (pre-built Slovenian string e.g. "JV")
  const windDirRaw = cleanWD(f[28]) ?? '';
  const windDir = (windDirRaw.length >= 1 && windDirRaw.length <= 4 && /^[A-ZŠŽČJ]+$/i.test(windDirRaw))
    ? windDirRaw.toUpperCase()
    : bearingToSL(bearing);

  // Max gust: strip markdown "**9 km/h** (03:07)"
  const gustRaw  = cleanWD(f[57]) ?? '';
  const gustM    = gustRaw.match(/([\d,.]+)\s*km\/h.*?(\d{2}:\d{2})/);
  const windMaxToday = gustM ? parseWD(gustM[1]) : null;
  const windMaxTime  = gustM ? gustM[2] : null;

  // Moon from field [82]: "Moon age: 20 days,17 hours,33 minutes,65%"
  const moonStr  = cleanWD(f[82]) ?? '';
  const moonDaysM = moonStr.match(/(\d+)\s*days?/i);
  const moonPctM  = moonStr.match(/(\d+)%/);
  const moonPhase = moonDaysM
    ? `${moonDaysM[1]}. dan${moonPctM ? ' (' + moonPctM[1] + '% osvetljenosti)' : ''}`
    : (moonPctM ? `${moonPctM[1]}% osvetljenosti` : null);

  // Solar energy — strip "kwh" suffix
  const solarToday = parseWD((f[68] ?? '').replace(/kwh/i, ''));
  const solarMonth = parseWD((f[69] ?? '').replace(/kwh/i, ''));
  const solarYear  = parseWD((f[70] ?? '').replace(/kwh/i, ''));

  return {
    date:             cleanWD(f[0]),
    time:             cleanWD(f[1]),
    conditionSL:      cleanWD(f[2]),
    temp:             parseWD(f[3]),
    humidity:         parseI(f[4]),
    dewPoint:         parseWD(f[5]),
    windSpeed:        parseWD(f[26]),
    windGust:         parseWD(f[27]),
    windBearing:      bearing,
    windDir,
    rain:             parseWD(f[9]),
    rainRate:         parseWD(f[10]),
    pressure:         parseWD(f[11]),
    pressureTrendRaw: parseWD(f[12]),
    pressureTrend:    pressureTrendText(parseWD(f[12])),
    solar:            parseI(f[13]),
    feelsLike:        parseWD(f[14]),
    uv:               parseWD(f[29]),
    sunrise:          cleanWD(f[16]),
    sunset:           cleanWD(f[17]),
    dayLength:        cleanWD(f[18]),
    moonrise:         cleanWD(f[19]),
    moonIllum:        cleanWD(f[21]),
    moonPhase,
    windSpeedMS:      parseWD(f[22]),
    windGustMS:       parseWD(f[23]),
    beaufort:         parseI(f[24]),
    windMaxToday,
    windMaxTime,
    tempMax:          parseWD(f[30]),
    tempMaxTime:      cleanWD(f[31]),
    tempMin:          parseWD(f[32]),
    tempMinTime:      cleanWD(f[33]),
    tempYestMax:      parseWD(f[34]),
    tempYestMaxTime:  cleanWD(f[35]),
    tempYestMin:      parseWD(f[36]),
    tempYestMinTime:  cleanWD(f[37]),
    rainYest:         parseWD(f[38]),
    humMax:           parseI(f[41]),
    humMaxTime:       cleanWD(f[42]),
    humMin:           parseI(f[43]),
    humMinTime:       cleanWD(f[44]),
    rainMonth:        parseWD(f[50]),
    rainYear:         parseWD(f[51]),
    solarKWhToday:    solarToday,
    solarKWhMonth:    solarMonth,
    solarKWhYear:     solarYear,
    forecastCondition: cleanWD(f[87]),
    pressureMmHg:     parseI(f[86]),
    pressureChange:   cleanWD(f[88]),
    lastUpdate:       `${cleanWD(f[0])} ${cleanWD(f[1])}`,
    source:           'tag_main.html',
  };
}

// ── Nearby amateur stations ───────────────────────────────────────────────────
function parseNearbyStations(html) {
  const stations = [];
  const secMatch =
    html.match(/AMATERSKE POSTAJE([\s\S]*?)(?:vir:|ARSO POSTAJE|uradne postaje)/i) ||
    html.match(/amateur stations?([\s\S]*?)(?:source:|official)/i);
  if (!secMatch) return stations;
  const section = secMatch[1];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowM;
  while ((rowM = rowRe.exec(section)) !== null) {
    if (/<th/i.test(rowM[1])) continue;
    const cells = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdM;
    while ((tdM = tdRe.exec(rowM[1])) !== null) cells.push(cleanCell(tdM[1]));
    if (cells.length < 4 || !cells[0]) continue;
    const linkM = rowM[1].match(/href="([^"]+)"/);
    const tempM = cells[1].match(/-?\d+(?:\.\d+)?/);
    const rainM = cells[3].match(/-?\d+(?:\.\d+)?/);
    const name  = cells[0].trim();
    if (!name || name.length > 40) continue;
    stations.push({
      name,
      temp: tempM ? parseFloat(tempM[0]) : null,
      wind: cells[2] || '—',
      rain: rainM ? parseFloat(rainM[0]) : null,
      time: cells[4] || null,
      link: linkM ? linkM[1] : null,
    });
  }
  return stations;
}

// ── ARSO official stations ────────────────────────────────────────────────────
function parseArsoStations(html) {
  const stations = [];
  const secMatch =
    html.match(/ARSO POSTAJE([\s\S]*?)(?:vir:|ZADNJA SATELITSKA|POGLED V NEBO|OPOZORILO|webcam)/i) ||
    html.match(/official stations?([\s\S]*?)(?:source:|webcam|satellite)/i);
  if (!secMatch) return stations;
  const section = secMatch[1];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowM;
  while ((rowM = rowRe.exec(section)) !== null) {
    if (/<th/i.test(rowM[1])) continue;
    const cells = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdM;
    while ((tdM = tdRe.exec(rowM[1])) !== null) cells.push(cleanCell(tdM[1]));
    if (cells.length >= 3 && cells[0] && cells[0].length < 40) {
      stations.push({
        name: cells[0],
        temp: cells[1] || '—',
        wind: (cells[2] && cells[2] !== '-') ? cells[2] : '—',
        rain: cells[3] || '0 mm',
        snow: cells[4] || '—',
      });
    }
  }
  return stations;
}

// ── Forecast from index_en.php ────────────────────────────────────────────────
function parseForecast(html) {
  const result = {
    updated: null,
    tonight: null, tonightLow: null,
    tomorrowDesc: null, tomorrowHigh: null, tomorrowLow: null,
    tomorrowNight: null, tomorrowNightLow: null,
  };
  const updM = html.match(/Updated:\s*([^\n|<]+)/i);
  if (updM) result.updated = decodeEntities(updM[1].trim());

  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trM;
  while ((trM = trRe.exec(html)) !== null) {
    const cells = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdM;
    while ((tdM = tdRe.exec(trM[1])) !== null) cells.push(cleanCell(tdM[1]));
    if (cells.length < 2 || cells[1].length < 15) continue;
    if (/^[\d°\s\/\-\.→]+$/.test(cells[1])) continue;
    const label = cells[0].toLowerCase().trim();
    const desc  = cells[1].trim();
    const hiM = desc.match(/High[:\s]+(-?\d+)/i);
    const loM = desc.match(/Low[:\s]+(-?\d+)/i);
    if (label.includes('tonight') || label.includes('rest of')) {
      result.tonight = desc;
      if (loM) result.tonightLow = parseInt(loM[1], 10);
    } else if (label.includes('night') || label.includes('evening')) {
      if (!result.tomorrowNight) {
        result.tomorrowNight = desc;
        if (loM) result.tomorrowNightLow = parseInt(loM[1], 10);
      }
    } else if (label.length > 0 && label.length < 30) {
      if (!result.tomorrowDesc) {
        result.tomorrowDesc = desc;
        if (hiM) result.tomorrowHigh = parseInt(hiM[1], 10);
        if (loM) result.tomorrowLow  = parseInt(loM[1], 10);
      }
    }
  }
  if (!result.tonightLow) {
    const m = html.match(/Low[:\s]+(\d+)°/i);
    if (m) result.tonightLow = parseInt(m[1], 10);
  }
  if (!result.tomorrowHigh) {
    const m = html.match(/High[:\s]+(\d+)°/i);
    if (m) result.tomorrowHigh = parseInt(m[1], 10);
  }
  return result;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  // Primary: tag_main.html
  let weatherData = null;
  try {
    const r = await fetch(`${BASE}/tag_main.html`, { headers: HEADERS, signal: timer(6000) });
    if (r.ok) weatherData = parseTagMain(await r.text());
  } catch (e) {
    console.error('tag_main.html failed:', e.message);
  }

  // Secondary: HTML pages for stations + forecast
  let htmlSL = '', htmlEN = '', htmlN1 = '';

  await Promise.all([
    fetch(`${BASE}/`, { headers: HEADERS, signal: timer(8000) })
      .then(r => r.ok ? r.text() : '')
      .then(h => { htmlSL = h; }).catch(() => {}),

    fetch(`${BASE}/index_en.php`, { headers: HEADERS, signal: timer(8000) })
      .then(r => r.ok ? r.text() : '')
      .then(h => { htmlEN = h; }).catch(() => {}),

      //fetch(`${BASE}/n1.php`, { headers: HEADERS, signal: timer(8000) })
      fetch(`${BASE}/n1.php`, { headers: HEADERS, signal: timer(8000) })
      .then(r => r.ok ? r.text() : '')
      .then(h => { htmlN1 = h; }).catch(() => {}),
  ]);

  const nearbyStations = parseNearbyStations(htmlSL || htmlEN);
  const arsoStations   = parseArsoStations(htmlSL || htmlEN);
  const forecast = parseForecast(htmlN1 || htmlEN);

  res.status(200).json({
    ...(weatherData || {}),
    forecast,
    nearbyStations,
    arsoStations,
    scrapedAt: new Date().toISOString(),
    _debug: {
      source:         weatherData?.source ?? 'FAILED — tag_main.html not reached',
      temp:           weatherData?.temp ?? null,
      windDir:        weatherData?.windDir ?? null,
      conditionSL:    weatherData?.conditionSL ?? null,
      nearbyCount:    nearbyStations.length,
      arsoCount:      arsoStations.length,
      forecastParsed: !!(forecast.tonight || forecast.tomorrowDesc),
      htmlSLbytes:    htmlSL.length,
      htmlENbytes:    htmlEN.length,
    },
  });
}
