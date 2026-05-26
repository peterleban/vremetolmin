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
    moonset:          cleanWD(f[20]),
    moonIllum:        cleanWD(f[21]),
    moonPhase,
    pm2p5:            parseWD(f[22]),
    pm10:             parseWD(f[23]),
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
    rainYest:         parseWD(f[49]),
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
    tempChange:       cleanWD(f[88]),
    rainlasth:        cleanWD(f[89]),
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

// ── Forecast from napoved.json ────────────────────────────────────────────────
function parseForecast(data) {
  return {
    updated: data.updated || null,

    forecast: (data.forecast || []).slice(0, 3).map(day => ({
      period: day.period || "",
      condition: day.condition || "",
      icon: mapConditionToIcon(day.condition),

      tempHigh: day.high ?? null,
      tempLow: day.low ?? null,

      precipitation: day.precipitation ?? 0
    }))
  };
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
  let htmlSL = '';

  await Promise.all([
    fetch(`${BASE}/`, { headers: HEADERS, signal: timer(8000) })
      .then(r => r.ok ? r.text() : '')
      .then(h => { htmlSL = h; }).catch(() => {}),

    async function loadForecast() {
      const res = await fetch("https://www.vremetolmin.si/napoved.json");
      const data = await res.json();
  
      console.log("RAW WEATHER DATA:", data);
      const parsed = parseForecast(data);
      console.log("PARSED FORECAST:", parsed);

      return parseForecast(data);
    }


  ]);

  const nearbyStations = parseNearbyStations(htmlSL);
  const arsoStations   = parseArsoStations(htmlSL);
  const forecast = parseForecast(napoved);

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
