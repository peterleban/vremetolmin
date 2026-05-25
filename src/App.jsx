import { useState, useEffect } from 'react'

async function fetchWeather() {
  const res = await fetch('/api/weather', {
  cache: 'no-store'})
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ── Forecast translation EN → SL ──────────────────────────────────────────────
function translateForecast(text) {
  if (!text) return null
  return text
    .replace(/Mostly clear/gi, 'Pretežno jasno')
    .replace(/Mostly sunny/gi, 'Pretežno sončno')
    .replace(/Partly cloudy/gi, 'Delno oblačno')
    .replace(/Mostly cloudy/gi, 'Pretežno oblačno')
    .replace(/Clear/gi, 'Jasno')
    .replace(/Sunny/gi, 'Sončno')
    .replace(/Cloudy/gi, 'Oblačno')
    .replace(/Overcast/gi, 'Oblačno')
    .replace(/Rain/gi, 'Dež')
    .replace(/Showers/gi, 'Plohe')
    .replace(/Thunderstorm/gi, 'Nevihta')
    .replace(/Snow/gi, 'Sneg')
    .replace(/Fog/gi, 'Megla')
    .replace(/Windy/gi, 'Vetrovno')
    .replace(/Warm/gi, 'Toplo').replace(/Hot/gi, 'Vroče').replace(/Cool/gi, 'Hladno').replace(/Cold/gi, 'Mrzlo')
    .replace(/High[:\s]+(-?\d+)°?/gi, 'Maks. $1°')
    .replace(/Low[:\s]+(-?\d+)°?/gi, 'Min. $1°')
    .replace(/Wind chill ranging from (\d+) to (\d+)/gi, 'Občutek mraza $1–$2°')
    .replace(/east-northeast/gi,'VSV').replace(/east-southeast/gi,'VJV')
    .replace(/west-northwest/gi,'ZSZ').replace(/west-southwest/gi,'ZJZ')
    .replace(/north-northeast/gi,'SSV').replace(/north-northwest/gi,'SSZ')
    .replace(/south-southeast/gi,'JJV').replace(/south-southwest/gi,'JJZ')
    .replace(/northeast/gi,'SV').replace(/northwest/gi,'SZ')
    .replace(/southeast/gi,'JV').replace(/southwest/gi,'JZ')
    .replace(/\bnorth\b/gi,'S').replace(/\bsouth\b/gi,'J')
    .replace(/\beast\b/gi,'V').replace(/\bwest\b/gi,'Z')
    .replace(/\bnear calm\b/gi,'skoraj mirno').replace(/\bcalm\b/gi,'mirno')
    .replace(/gusting to (\d+) kph/gi,'sunki do $1 km/h')
    .replace(/(\d+)-(\d+)\s*kph/gi,'$1–$2 km/h').replace(/(\d+)\s*kph/gi,'$1 km/h')
    .replace(/UV index up to (\d+)/gi,'UV indeks do $1').replace(/UV index/gi,'UV indeks')
    .replace(/in the morning/gi,'dopoldne').replace(/in the afternoon/gi,'popoldne')
    .replace(/in the evening/gi,'zvečer').replace(/after midnight/gi,'po polnoči')
    .replace(/becoming/gi,'nato').replace(/around/gi,'okoli')
}

// ── Weather condition → theme ─────────────────────────────────────────────────
const THEMES = {
  sunny: {
    bg: 'linear-gradient(175deg,#1a6fa8 0%,#3b9fd4 16%,#6ec6f0 32%,#b8e4f9 48%,#fde99a 64%,#f9c74f 78%,#e8a020 90%,#c47a0a 100%)',
    orb: 'radial-gradient(ellipse 70% 40% at 50% 8%,rgba(255,228,80,.6) 0%,rgba(255,180,30,.28) 45%,transparent 72%)',
    sun:true,
    card:'rgba(255,255,255,0.72)',
    cardBorder:'rgba(255,255,255,0.88)',
    tabBar:'rgba(255,255,255,0.88)',
    tabBarBorder:'rgba(180,140,60,0.28)',
    accent:'#92400e',
    textPrimary:'#111827',
    textMuted:'#374151',
    textDim:'#4b5563',
    heroTemp:'#7c2d12',
    heroLow:'#1e3a8a',
    heroHigh:'#991b1b',
    heroDew:'#312e81',
    label:'JASNO ☀️',
  },

  partly_cloudy: {
    bg: 'linear-gradient(175deg,#1b5e8a 0%,#2e86c1 18%,#5aaddc 36%,#a8d8ea 54%,#d4eaf7 68%,#b8d8ee 84%,#7aafc8 100%)',
    orb: 'radial-gradient(ellipse 65% 38% at 50% 6%,rgba(200,230,255,.5) 0%,rgba(150,200,240,.22) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.68)',
    cardBorder:'rgba(255,255,255,0.84)',
    tabBar:'rgba(255,255,255,0.84)',
    tabBarBorder:'rgba(120,170,210,0.28)',
    accent:'#0f5f8f',
    textPrimary:'#0f172a',
    textMuted:'#334155',
    textDim:'#475569',
    heroTemp:'#0c4a6e',
    heroLow:'#1e3a8a',
    heroHigh:'#7f1d1d',
    heroDew:'#1e3a5f',
    label:'DELNO OBLAČNO 🌤️',
  },

  cloudy: {
    bg: 'linear-gradient(175deg,#2d3a4a 0%,#3d5168 18%,#546880 36%,#6b7f92 54%,#8595a4 70%,#9aaab6 85%,#7a8e9c 100%)',
    orb: 'radial-gradient(ellipse 70% 35% at 50% 5%,rgba(180,200,220,.35) 0%,rgba(140,165,185,.15) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.72)',
    cardBorder:'rgba(255,255,255,0.86)',
    tabBar:'rgba(255,255,255,0.82)',
    tabBarBorder:'rgba(160,180,200,0.24)',
    accent:'#334e68',
    textPrimary:'#111827',
    textMuted:'#374151',
    textDim:'#4b5563',
    heroTemp:'#111827',
    heroLow:'#1d4ed8',
    heroHigh:'#b91c1c',
    heroDew:'#334155',
    label:'OBLAČNO ☁️',
  },

  rain: {
    bg: 'linear-gradient(175deg,#1a2a3a 0%,#253650 16%,#2e4a6a 32%,#3a5c7a 50%,#4a6e8a 66%,#5a7e96 82%,#4a6878 100%)',
    orb: 'radial-gradient(ellipse 65% 32% at 50% 4%,rgba(120,170,220,.32) 0%,rgba(80,130,180,.14) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.78)',
    cardBorder:'rgba(255,255,255,0.90)',
    tabBar:'rgba(255,255,255,0.86)',
    tabBarBorder:'rgba(100,150,190,0.24)',
    accent:'#1d4ed8',
    textPrimary:'#0f172a',
    textMuted:'#334155',
    textDim:'#475569',
    heroTemp:'#0f172a',
    heroLow:'#1d4ed8',
    heroHigh:'#b91c1c',
    heroDew:'#334155',
    label:'DEŽ 🌧️',
    rain:true,
  },

  heavy_rain: {
    bg: 'linear-gradient(175deg,#0f1a28 0%,#182438 16%,#203050 32%,#283a5c 50%,#304468 66%,#384e72 82%,#283e58 100%)',
    orb: 'radial-gradient(ellipse 60% 28% at 50% 3%,rgba(80,120,180,.25) 0%,rgba(50,90,140,.1) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.82)',
    cardBorder:'rgba(255,255,255,0.92)',
    tabBar:'rgba(255,255,255,0.88)',
    tabBarBorder:'rgba(80,120,180,0.22)',
    accent:'#2563eb',
    textPrimary:'#0f172a',
    textMuted:'#334155',
    textDim:'#475569',
    heroTemp:'#0f172a',
    heroLow:'#2563eb',
    heroHigh:'#b91c1c',
    heroDew:'#334155',
    label:'MOČAN DEŽ 🌧️',
    rain:true,
    heavy:true,
  },

  storm: {
    bg: 'linear-gradient(175deg,#080e18 0%,#0e1828 14%,#152035 28%,#1a2848 44%,#222e52 60%,#1e2a48 76%,#141e38 100%)',
    orb: 'radial-gradient(ellipse 55% 25% at 50% 3%,rgba(100,80,190,.3) 0%,rgba(60,50,140,.12) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.84)',
    cardBorder:'rgba(255,255,255,0.94)',
    tabBar:'rgba(255,255,255,0.90)',
    tabBarBorder:'rgba(100,80,200,0.22)',
    accent:'#6366f1',
    textPrimary:'#111827',
    textMuted:'#374151',
    textDim:'#4b5563',
    heroTemp:'#111827',
    heroLow:'#4338ca',
    heroHigh:'#b91c1c',
    heroDew:'#334155',
    label:'NEVIHTA ⛈️',
    rain:true,
    heavy:true,
    storm:true,
  },

  snow: {
    bg: 'linear-gradient(175deg,#c8dff0 0%,#daeaf6 18%,#eef5fb 38%,#f4f8fc 55%,#e8f0f8 70%,#d4e4f4 85%,#c0d4e8 100%)',
    orb: 'radial-gradient(ellipse 70% 40% at 50% 6%,rgba(255,255,255,.65) 0%,rgba(210,235,255,.32) 45%,transparent 72%)',
    card:'rgba(255,255,255,0.74)',
    cardBorder:'rgba(255,255,255,0.90)',
    tabBar:'rgba(255,255,255,0.88)',
    tabBarBorder:'rgba(180,210,240,0.30)',
    accent:'#1e5080',
    textPrimary:'#0f172a',
    textMuted:'#334155',
    textDim:'#475569',
    heroTemp:'#1e3a8a',
    heroLow:'#2563eb',
    heroHigh:'#1e3a8a',
    heroDew:'#334155',
    label:'SNEG ❄️',
    snow:true,
  },

  fog: {
    bg: 'linear-gradient(175deg,#6b7a88 0%,#7d8d9c 18%,#919fac 36%,#a5b0ba 54%,#b5bec6 70%,#c2cad0 85%,#aab4bc 100%)',
    orb: 'radial-gradient(ellipse 80% 40% at 50% 5%,rgba(210,220,230,.4) 0%,rgba(180,195,210,.18) 50%,transparent 72%)',
    card:'rgba(255,255,255,0.74)',
    cardBorder:'rgba(255,255,255,0.88)',
    tabBar:'rgba(255,255,255,0.84)',
    tabBarBorder:'rgba(150,170,190,0.24)',
    accent:'#2d4a5a',
    textPrimary:'#111827',
    textMuted:'#374151',
    textDim:'#4b5563',
    heroTemp:'#111827',
    heroLow:'#2563eb',
    heroHigh:'#b91c1c',
    heroDew:'#334155',
    label:'MEGLA 🌫️',
  },
}

function deriveCondition(W) {
  // Prefer the Slovenian condition text from tag_main.html [2]
  const sl = (W.conditionSL ?? '').toLowerCase()
  if (sl.includes('nevihta') || sl.includes('storm'))     return 'storm'
  if (sl.includes('sneg') || sl.includes('snow'))         return 'snow'
  if (sl.includes('megla') || sl.includes('fog'))         return 'fog'
  if (sl.includes('dež') || sl.includes('plohe') || sl.includes('rain')) {
    const rate = W.rainRate ?? 0
    return rate > 3 ? 'heavy_rain' : 'rain'
  }
  if (sl.includes('oblačno') || sl.includes('pokrito') || sl.includes('cloud')) return 'cloudy'
  if (sl.includes('delno') || sl.includes('partly'))      return 'partly_cloudy'
  if (sl.includes('jasno') || sl.includes('sončno') || sl.includes('sunny') || sl.includes('clear')) return 'sunny'
  // Fallback to numeric
  const solar = W.solar ?? 500, rain = W.rain ?? 0, rate = W.rainRate ?? 0
  if (rate > 5) return 'storm'
  if (rain > 0 || rate > 0) return 'rain'
  if (solar < 100) return 'cloudy'
  if (solar < 380) return 'partly_cloudy'
  return 'sunny'
}

// ── Particles ──────────────────────────────────────────────────────────────────
function RainParticles({ heavy, storm }) {
  const count = storm ? 55 : heavy ? 40 : 22
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden' }}>
      <style>{`@keyframes fall{0%{transform:translateY(-20px) translateX(0);opacity:0}10%{opacity:.6}90%{opacity:.35}100%{transform:translateY(110vh) translateX(${storm?'-32px':'-10px'});opacity:0}}`}</style>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} style={{
          position:'absolute', left:`${Math.random()*100}%`, top:`-${Math.random()*20}px`,
          width:storm?'1.5px':'1px', height:storm?'18px':'12px',
          background:storm?'rgba(180,190,255,0.5)':'rgba(160,200,255,0.45)', borderRadius:1,
          animation:`fall ${0.55+Math.random()*0.8}s linear ${Math.random()*2}s infinite`,
          transform:`rotate(${storm?'-20deg':'-10deg'})`,
        }}/>
      ))}
    </div>
  )
}
function SnowParticles() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden' }}>
      <style>{`@keyframes snowfall{0%{transform:translateY(-10px);opacity:0}10%{opacity:.85}100%{transform:translateY(108vh) translateX(28px);opacity:0}}`}</style>
      {Array.from({length:32}).map((_,i) => {
        const s = 3+Math.random()*4
        return <div key={i} style={{position:'absolute',left:`${Math.random()*100}%`,top:`-${Math.random()*20}px`,width:s,height:s,borderRadius:'50%',background:'rgba(255,255,255,0.85)',animation:`snowfall ${2+Math.random()*3}s ease-in ${Math.random()*3}s infinite`}}/>
      })}
    </div>
  )
}
function LightningFlash() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const go = () => { const d=4000+Math.random()*9000; return setTimeout(()=>{setOn(true);setTimeout(()=>setOn(false),110);go()},d) }
    const t = go(); return ()=>clearTimeout(t)
  }, [])
  return <div style={{position:'fixed',inset:0,zIndex:3,pointerEvents:'none',background:'rgba(210,215,255,0.38)',opacity:on?1:0,transition:on?'none':'opacity 0.18s ease'}}/>
}

// ── Coloured tab icons ─────────────────────────────────────────────────────────
const TabIcons = {
  zdaj:     () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26" stroke="#e5e7eb"/><circle cx="11.5" cy="18" r="3.5" fill="#ef4444" stroke="#ef4444"/></svg>,
  veter:    () => <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>,
  padavine: () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" fill="#3b82f6" stroke="#3b82f6"/><path d="M8.2 8.5 Q9 7.2 9.5 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1" fill="none" strokeLinecap="round"/></svg>,
  napoved:  () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="#fbbf24"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="#fbbf24"/></svg>,
  radar:    () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" stroke="#fbbf24"/></svg>,
  postaje:  () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="#ef4444" stroke="#ef4444"/><circle cx="12" cy="10" r="3" fill="white" stroke="white"/></svg>,
  donacija: () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#f43f5e" stroke="#f43f5e"/></svg>,
}
const Ico = {
  Therm:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  Wind: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>,
  Drop: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/></svg>,
  Sun:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  Leaf: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  Pin:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Bolt: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Heart:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Spin: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  Wave: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 12c.5-2 2.5-2 3-2s2.5 0 3 2 2.5 2 3 2 2.5 0 3-2 2.5-2 3-2"/><path d="M2 18c.5-2 2.5-2 3-2s2.5 0 3 2 2.5 2 3 2 2.5 0 3-2 2.5-2 3-2"/></svg>,
  Cam:  ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
}

const TABS = [
  {id:'zdaj',     label:'Zdaj',     Icon:TabIcons.zdaj},
  {id:'veter',    label:'Veter',    Icon:TabIcons.veter},
  {id:'padavine', label:'Padavine', Icon:TabIcons.padavine},
  {id:'napoved',  label:'Napoved',  Icon:TabIcons.napoved},
  {id:'radar',    label:'Radar',    Icon:TabIcons.radar},
  {id:'postaje',  label:'Postaje',  Icon:TabIcons.postaje},
  {id:'donacija', label:'Donacija', Icon:TabIcons.donacija},
]

// ── Wind compass (Slovenian labels) ───────────────────────────────────────────
function WindCompass({ dir, T }) {
  const angles = {S:0,SSV:22.5,SV:45,VSV:67.5,V:90,VJV:112.5,JV:135,JJV:157.5,J:180,JJZ:202.5,JZ:225,ZJZ:247.5,Z:270,ZSZ:292.5,SZ:315,SSZ:337.5,
                  N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,SW:225,WSW:247.5,W:270,WNW:292.5,NW:315,NNW:337.5}
  const deg = angles[dir] ?? 0
  return (
    <svg viewBox="0 0 80 80" style={{width:80,height:80}}>
      <circle cx="40" cy="40" r="38" fill={T.card} stroke={T.cardBorder} strokeWidth="1"/>
      <circle cx="40" cy="40" r="27" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3 4"/>
      {[['S',0],['V',90],['J',180],['Z',270]].map(([l,i])=>{
        const a=i*Math.PI/180
        return <text key={l} x={40+33*Math.sin(a)} y={40-33*Math.cos(a)} textAnchor="middle" dominantBaseline="central"
          fill={l==='S'?T.accent:T.textDim} fontSize="9" fontFamily="'DM Mono',monospace" fontWeight={l==='S'?'600':'400'}>{l}</text>
      })}
      <g transform={`rotate(${deg},40,40)`}>
        <polygon points="40,10 43.5,38 40,45 36.5,38" fill={T.accent} opacity="0.9"/>
        <polygon points="40,70 43.5,42 40,45 36.5,42" fill="rgba(0,0,0,0.12)"/>
      </g>
      <circle cx="40" cy="40" r="4" fill={T.card} stroke={T.accent} strokeWidth="1.5" opacity="0.8"/>
    </svg>
  )
}

// ── Gauge arc ──────────────────────────────────────────────────────────────────
function Arc({ value, min, max, color, label, unit, T }) {
  const safeVal = value != null ? Math.max(0, value) : null
  const pct = Math.min(1,Math.max(0,((safeVal??min)-min)/(max-min)))
  const r=30,cx=40,cy=42
  const pt=deg=>{const rad=(deg-90)*Math.PI/180;return[cx+r*Math.cos(rad),cy+r*Math.sin(rad)]}
  const arc=(a,b)=>{const[x1,y1]=pt(a),[x2,y2]=pt(b);return`M${x1},${y1} A${r},${r} 0 ${b-a>180?1:0} 1 ${x2},${y2}`}
  const displayVal = safeVal==null?'—':label==='Tlak'?Math.round(safeVal):safeVal
  const fontSize = label==='Tlak'?11:13
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <svg viewBox="0 0 80 60" style={{width:76,height:56}}>
        <path d={arc(-130,130)} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="5" strokeLinecap="round"/>
        {safeVal!=null&&<path d={arc(-130,-130+pct*260)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85"/>}
        <text x={cx} y={cy-8} textAnchor="middle" fill={T.textPrimary} fontSize={fontSize} fontFamily="'DM Mono',monospace" fontWeight="600">{displayVal}</text>
        <text x={cx} y={cy+4} textAnchor="middle" fill={T.textDim} fontSize="7">{unit}</text>
      </svg>
      <span style={{fontSize:10,color:T.textDim,letterSpacing:'0.05em',textTransform:'uppercase'}}>{label}</span>
    </div>
  )
}

function Card({children,style,T}) {
  return <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:18,padding:'16px 15px',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',...style}}>{children}</div>
}
function CardTitle({icon,children,right,T}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:13}}>
      <span style={{width:15,height:15,color:T.accent,flexShrink:0,display:'inline-flex'}}>{icon}</span>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.07em',color:T.textMuted,textTransform:'uppercase'}}>{children}</span>
      {right&&<span style={{marginLeft:'auto',fontSize:10,color:T.textDim}}>{right}</span>}
    </div>
  )
}
function Row({label,value,sub,T}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'8px 0',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
      <span style={{fontSize:12,color:T.textMuted}}>{label}</span>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.textPrimary,textAlign:'right'}}>
        {value}{sub&&<span style={{fontSize:10,color:T.textDim,marginLeft:3}}>{sub}</span>}
      </span>
    </div>
  )
}
function LiveImage({src,alt,imgStyle,fallbackText,T}) {
  const [key,setKey] = useState(Date.now())
  const [err,setErr] = useState(false)
  useEffect(()=>{const id=setInterval(()=>{setKey(Date.now());setErr(false)},60000);return()=>clearInterval(id)},[])
  if(err) return <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center',color:T.textDim,fontSize:12}}>{fallbackText||'Slika ni dosegljiva'}</div>
  return <img key={key} src={`${src}?t=${key}`} alt={alt} style={{display:'block',width:'100%',...imgStyle}} onError={()=>setErr(true)}/>
}

// safe display helpers
function d(v)  { return v != null ? v : '—' }
function nn(v) { return v != null ? Math.max(0, v) : 0 }  // non-null, non-negative
function dn(v) { return v != null ? Math.max(0, v) : '—' } // display non-negative or dash

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]         = useState('zdaj')
  const [W,setW]             = useState({})
  const [loading,setLoading] = useState(true)
  const [refreshing,setRefreshing] = useState(false)
  const [lastRefresh,setLastRefresh] = useState(null)
  const [condition,setCondition]    = useState('sunny')
  const [error,setError]     = useState(null)
  const [debug,setDebug]     = useState(null)
  const [showDebug,setShowDebug] = useState(false)

  const load = async (isRefresh=false) => {
    if(isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const data = await fetchWeather()
      setW(data)
      setDebug(data._debug??null)
      setCondition(deriveCondition(data))
      setLastRefresh(new Date())
    } catch { setError('Napaka pri nalaganju podatkov.') }
    finally { setLoading(false); setRefreshing(false) }
  }
 // useEffect(()=>{load()},[])
  useEffect(() => {

    // initial load
    load()
    // auto refresh every 60s
    const interval = setInterval(() => {
      load(true)
    }, 60000)

    // cleanup
    return () => clearInterval(interval)

  }, [])

  const T = THEMES[condition]||THEMES.sunny

  // Pull values — all from tag_main.html now
  const temp      = W.temp       ?? '—'
  const tempChange= W.tempChange ?? '—'  
  const tempMin   = W.tempMin    ?? '—'
  const tempMax   = W.tempMax    ?? '—'
  const humidity  = W.humidity   != null ? Math.max(0,W.humidity) : null
  const windSpeed = W.windSpeed  != null ? Math.max(0,W.windSpeed) : null
  const windDir   = W.windDir    ?? 'S'
  const windGust  = W.windGust   != null ? Math.max(0,W.windGust) : '—'
  const pressure  = W.pressure   != null ? Math.max(0,W.pressure) : null
  const rain      = W.rain       != null ? Math.max(0,W.rain) : 0
  const rainRate  = W.rainRate   != null ? Math.max(0,W.rainRate) : 0
  const uv        = W.uv         != null ? Math.max(0,W.uv) : null
  const solar     = W.solar      != null ? Math.max(0,W.solar) : null
  const dewPoint  = W.dewPoint   ?? '—'
  const windMaxToday = W.windMaxToday ?? '—'
  const nearby    = W.nearbyStations ?? []
  const arso      = W.arsoStations   ?? []
  const forecast  = W.forecast       ?? {}

  const tempNum = parseFloat(temp)
  const tempCol = isNaN(tempNum)?T.heroTemp:tempNum<0?'#93c5fd':tempNum<10?'#67e8f9':tempNum<20?T.heroTemp:tempNum<28?'#fbbf24':'#fb923c'
  const dateStr = new Date().toLocaleDateString('sl-SI',{weekday:'long',day:'numeric',month:'long'})

  return (
    <div style={{minHeight:'100vh',maxWidth:430,margin:'0 auto',fontFamily:"'Outfit',system-ui,sans-serif",color:T.textPrimary,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .fade-up{animation:fadeUp .22s cubic-bezier(0.22,1,0.36,1) forwards;will-change:transform,opacity}
        .scroll-area{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;scroll-behavior:auto;will-change:scroll-position}
        .tab-scroll::-webkit-scrollbar{display:none}.tab-scroll{scrollbar-width:none}
        a{color:inherit;text-decoration:none}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:2px}
        .fixed-bg{will-change:transform;transform:translateZ(0)}
      `}</style>

      {/* Backgrounds */}
      <div className="fixed-bg" style={{position:'fixed',inset:0,zIndex:0,background:T.bg,transition:'background 2.5s ease'}}/>
      <div className="fixed-bg" style={{position:'fixed',inset:0,zIndex:1,background:T.orb,transition:'background 2.5s ease',pointerEvents:'none'}}/>
      {T.sun&&<div className="fixed-bg" style={{position:'fixed',top:38,left:'50%',transform:'translateX(-50%) translateZ(0)',width:88,height:88,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,240,120,.92) 0%,rgba(255,200,50,.55) 44%,transparent 72%)',filter:'blur(3px)',zIndex:1,pointerEvents:'none'}}/>}
      {(T.rain||T.heavy||T.storm)&&<RainParticles heavy={T.heavy} storm={T.storm}/>}
      {T.snow&&<SnowParticles/>}
      {T.storm&&<LightningFlash/>}

      {/* Status bar */}
      <div style={{position:'relative',zIndex:20,padding:'16px 18px 0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div onClick={()=>setShowDebug(v=>!v)} style={{cursor:'pointer'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#16a34a',animation:'blink 2.4s infinite',flexShrink:0}}/>
            <span style={{fontSize:11,color:T.textMuted,letterSpacing:'0.08em',fontFamily:"'DM Mono',monospace"}}>VREME TOLMIN · TOLMINKA</span>
            <span style={{fontSize:10,color:T.accent,fontWeight:700,marginLeft:4}}>{T.label}</span>
          </div>
          <div style={{fontSize:11,color:T.textDim,marginTop:2,textTransform:'capitalize'}}>{dateStr}</div>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,color:T.textMuted,cursor:'pointer',padding:'6px 11px',display:'flex',alignItems:'center',gap:5,fontSize:11,fontFamily:"'Outfit',sans-serif",backdropFilter:'blur(10px)'}}>
          <span style={{width:13,height:13,display:'inline-flex',animation:refreshing?'spin .8s linear infinite':'none'}}><Ico.Spin/></span>
          {refreshing?'...':'Osveži'}
        </button>
      </div>

      {lastRefresh&&(
        <div style={{position:'relative',zIndex:20,textAlign:'right',paddingRight:18,marginTop:2}}>
          <span style={{fontSize:10,color:T.textDim,fontFamily:"'DM Mono',monospace"}}>
            {W.lastUpdate?`Postaja: ${W.lastUpdate}`:`Osveženo: ${lastRefresh.toLocaleTimeString('sl-SI',{hour:'2-digit',minute:'2-digit'})}`}
          </span>
        </div>
      )}

      {error&&<div style={{margin:'8px 15px 0',padding:'10px 14px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:12,fontSize:12,color:'#b91c1c',position:'relative',zIndex:20}}>
        {error} <a href="https://vremetolmin.si" target="_blank" rel="noopener noreferrer" style={{color:T.accent,marginLeft:6}}>Odpri ↗</a>
      </div>}

      {showDebug&&debug&&<div style={{margin:'6px 15px 0',padding:'10px 14px',background:'rgba(0,0,0,0.82)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:12,fontSize:11,color:'#ddd',position:'relative',zIndex:20,fontFamily:"'DM Mono',monospace",lineHeight:1.7}}>
        <div style={{color:'#aaa',marginBottom:4,fontSize:10}}>API DEBUG (tapni za zapiranje)</div>
        {Object.entries(debug).map(([k,v])=><div key={k}><span style={{color:'#888'}}>{k}:</span> <span style={{color:'#fff'}}>{String(v)}</span></div>)}
      </div>}

      {/* ── Content ── */}
      <div className="scroll-area" style={{flex:1,overflowY:'auto',position:'relative',zIndex:10,padding:'0 0 76px'}}>

        {/* ━━ ZDAJ ━━ */}
        {tab==='zdaj'&&(
          <div className="fade-up" style={{padding:'4px 15px 0'}}>
            <div style={{padding:'16px 4px 14px'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:4}}>
                {loading
                  ?<div style={{width:130,height:76,borderRadius:8,background:T.card,animation:'pulse 1.5s infinite'}}/>
                  :<><span style={{fontFamily:"'DM Mono',monospace",fontSize:84,lineHeight:1,fontWeight:400,color:tempCol,letterSpacing:'-0.03em',textShadow:'0 2px 12px rgba(0,0,0,0.25)'}}>{temp}</span>
                    <span style={{fontSize:30,color:T.textDim,marginBottom:12}}>°C</span>
                    <span style={{fontSize:12,color:T.textDim,marginBottom:12}}>{tempChange}°C/h</span>
                    </>
                }
              </div>
              <div style={{display:'flex',gap:14,marginTop:6,flexWrap:'wrap'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.heroLow,fontWeight:600,textShadow:'0 1px 6px rgba(0,0,0,0.3)'}}>↓ {tempMin}°</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.heroHigh,fontWeight:600,textShadow:'0 1px 6px rgba(0,0,0,0.3)'}}>↑ {tempMax}°</span>
                {W.conditionSL&&<span style={{fontSize:12,color:T.accent,fontWeight:500}}>{W.conditionSL}</span>}
              </div>
            </div>

            <Card T={T} style={{marginBottom:11}}>
              <div style={{display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:2}}>
                <Arc value={humidity}  min={0}   max={100}  color="#0284c7" label="Vlaga"   unit="%" T={T}/>
                <Arc value={dewPoint}  min={-25} max={25}   color="#d97706" label="Rosišče" unit="°C" T={T}/>
                <Arc value={pressure}  min={980} max={1040} color="#7c3aed" label="Tlak"    unit="mb" T={T}/>
              </div>
            </Card>

            <div style={{marginBottom:11}}>
            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Wind/>} T={T}>Veter</CardTitle>

              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:20,
                  justifyContent:'center',
                  padding:'8px 0'
                }}
              >
                <WindCompass dir={windDir} T={T}/>

                <div style={{display:'flex',flexDirection:'column'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:'#0284c7',marginTop:6}}>
                    {windDir}
                  </div>

                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,color:T.textPrimary}}>
                    {d(windSpeed)}
                  </div>

                  <div style={{fontSize:11,color:T.textDim}}>
                    km/h povp.
                  </div>

                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:36,color:T.accent,marginTop:6}}>
                    {windGust}
                  </div>

                  <div style={{fontSize:11,color:T.textDim}}>
                    km/h sunki
                  </div>

                  {/* now at bottom */}
                  <div style={{fontSize:11,color:T.textDim,marginTop:10}}>
                    Najmočnejši sunek danes: {windMaxToday} km/h
                  </div>
                </div>
              </div>
            </Card>
            </div>

            <div style={{marginBottom:11}}>
            <Card T={T} style={{marginBottom:11}}>
            <CardTitle icon={<Ico.Drop/>} T={T}>Padavine</CardTitle>
               <div  style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10}}>
               {[['Danes',`${rain} mm`],['Trenutno',`${rainRate} mm/h`]].map(([l,v])=>(
                <Card key={l} T={T}>
                  <div style={{fontSize:10,color:T.textDim,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{l}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,color:'#1d4ed8'}}>{v}</div>
                </Card>
              ))}
              </div>
            </Card>
            </div>

            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Therm/>}  T={T}>Temperatura podrobno</CardTitle>
              <Row label="Maks. danes"        value={`${d(W.tempMax)}°C`} sub={W.tempMaxTime?`ob ${W.tempMaxTime}`:''} T={T}/>
              <Row label="Min. danes"         value={`${d(W.tempMin)}°C`} sub={W.tempMinTime?`ob ${W.tempMinTime}`:''} T={T}/>
            </Card>

            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Sun/>} T={T}>Sonce in luna</CardTitle>
              <Row label="Sončni vzhod"    value={d(W.sunrise)} T={T}/>
              <Row label="Sončni zahod"    value={d(W.sunset)} T={T}/>
              <Row label="Dolžina dneva"   value={d(W.dayLength)} T={T}/>
              <Row label="Luna (vzhod)"    value={d(W.moonrise)} T={T}/>
              <Row label="Faza lune"       value={d(W.moonPhase)} T={T}/>
            </Card>

            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Leaf/>} T={T}>Kakovost zraka</CardTitle>
              <Row label="PM10 (zdaj)"      value={W.pm10!=null?Math.max(0,W.pm10):'—'} sub={W.pm10!=null?'µg/m³':''} T={T}/>
              <Row label="PM2.5 (zdaj)"     value={W.pm25!=null?Math.max(0,W.pm25):'—'} sub={W.pm25!=null?'µg/m³':''} T={T}/>
              <div style={{marginTop:10,padding:'8px 10px',background:'rgba(5,150,105,0.1)',borderRadius:10,border:'1px solid rgba(5,150,105,0.2)',fontSize:12,color:'#065f46',textAlign:'center'}}>
                Kakovost zraka: Dobra
              </div>
            </Card>


          </div>
        )}

        {/* ━━ VETER ━━ */}
        {tab==='veter'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Wind/>} right="Postaja Tolminka" T={T}>Veter zdaj</CardTitle>
              <div style={{display:'flex',alignItems:'center',gap:20,justifyContent:'center',padding:'8px 0'}}>
                <WindCompass dir={windDir} T={T}/>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:36,color:T.textPrimary}}>{d(windSpeed)}</div>
                  <div style={{fontSize:11,color:T.textDim}}>km/h povp.</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,color:T.accent,marginTop:6}}>{windGust}</div>
                  <div style={{fontSize:11,color:T.textDim}}>km/h sunki</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:'#0284c7',marginTop:6}}>{windDir}</div>
                  {W.windSpeedMS!=null&&<div style={{fontSize:11,color:T.textDim,marginTop:4}}>{W.windSpeedMS} m/s · Beaufort {d(W.beaufort)}</div>}
                </div>
              </div>
            </Card>
            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Wind/>} T={T}>Podrobnosti vetra</CardTitle>
              <Row label="Najmočnejši sunek danes" value={W.windMaxToday!=null?`${W.windMaxToday} km/h`:'—'} sub={W.windMaxTime?`ob ${W.windMaxTime}`:''} T={T}/>
              <Row label="Beaufortova lestvica"    value={d(W.beaufort)} T={T}/>
              <Row label="Hitrost (m/s)"           value={W.windSpeedMS!=null?`${W.windSpeedMS}`:'—'} sub={W.windSpeedMS!=null?'m/s':''} T={T}/>
              <Row label="Sunki (m/s)"             value={W.windGustMS!=null?`${W.windGustMS}`:'—'} sub={W.windGustMS!=null?'m/s':''} T={T}/>
              <Row label="Smer"                    value={windDir} T={T}/>
              <Row label="Tlak zraka"              value={pressure!=null?`${pressure}`:'—'} sub={pressure!=null?'hPa':''} T={T}/>
              <Row label="Trend tlaka"             value={d(W.pressureTrend)} T={T}/>
              <Row label="Sprememba temperature"         value={W.tempChange!=null?`${W.tempChange}`:'—'} sub={W.tempChange!=null?'°C':''} T={T}/>
            </Card>
          </div>
        )}

        {/* ━━ PADAVINE ━━ */}
        {tab==='padavine'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:11}}>
              {[['Danes',`${rain} mm`],['Včeraj',`${nn(W.rainYest)} mm`],['Ta mesec',W.rainMonth!=null?`${W.rainMonth} mm`:'—'],['Letos',W.rainYear!=null?`${W.rainYear} mm`:'—']].map(([l,v])=>(
                <Card key={l} T={T}>
                  <div style={{fontSize:10,color:T.textDim,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{l}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,color:'#1d4ed8'}}>{v}</div>
                </Card>
              ))}
            </div>
            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Drop/>} right="Davis koritce" T={T}>Intenzivnost padavin</CardTitle>
              <Row label="Trenutna intenzivnost"   value={rainRate} sub="mm/h" T={T}/>
              <Row label="Skupaj danes"            value={rain} sub="mm" T={T}/>
              <Row label="Padavine včeraj"         value={nn(W.rainYest)} sub="mm" T={T}/>
              <Row label="Ta mesec"                value={W.rainMonth!=null?W.rainMonth:0} sub="mm" T={T}/>
              <Row label="Letos skupaj"            value={W.rainYear!=null?W.rainYear:0} sub="mm" T={T}/>
              <Row label="Zaporedni deževni dnevi" value={W.rainDays!=null?W.rainDays:0} T={T}/>
              <Row label="Zaporedni suhi dnevi"    value={W.dryDays!=null?W.dryDays:0} T={T}/>
            </Card>
            <Card T={T}>
              <CardTitle icon={<Ico.Wave/>} right="ARSO" T={T}>Reka Tolminka</CardTitle>
              <Row label="Višina vode"     value={W.riverLevel!=null?`${W.riverLevel}`:'—'} sub={W.riverLevel!=null?'cm':''} T={T}/>
              <Row label="Temperatura"    value={W.riverTemp!=null?`${W.riverTemp}`:'—'}   sub={W.riverTemp!=null?'°C':''} T={T}/>
              <Row label="Zadnje merjenje" value={d(W.riverTime)} T={T}/>
            </Card>
          </div>
        )}

        {/* ━━ NAPOVED ━━ */}
        {tab==='napoved'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            {/* Condition from tag_main.html [87] — already Slovenian */}
            {W.forecastCondition&&(
              <Card T={T} style={{marginBottom:10,textAlign:'center'}}>
                <div style={{fontSize:14,color:T.accent,fontWeight:600}}>{W.forecastCondition}</div>
                <div style={{fontSize:11,color:T.textDim,marginTop:4}}>Weather Display napoved</div>
              </Card>
            )}
            {[
              {day:'Nocoj',   icon:'🌙',high:null,               low:forecast.tonightLow??tempMin, desc:translateForecast(forecast.tonight)??'Pretežno jasno. Hladno.'},
              {day:'Jutri',   icon:'☀️',high:forecast.tomorrowHigh, low:forecast.tomorrowLow,     desc:translateForecast(forecast.tomorrowDesc)??'Sončno. Toplo.'},
              ...(forecast.tomorrowNight?[{day:'Jutri zvečer',icon:'🌙',high:null,low:forecast.tomorrowNightLow,desc:translateForecast(forecast.tomorrowNight)}]:[]),
            ].map(({day,icon,high,low,desc})=>(
              <Card key={day} T={T} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:9}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:22}}>{icon}</span>
                    <span style={{fontWeight:600,fontSize:15,color:T.textPrimary}}>{day}</span>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {high!=null&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:20,color:'#b91c1c'}}>↑ {high}°</div>}
                    {low!=null&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:16,color:'#1d6fa0'}}>↓ {low}°</div>}
                  </div>
                </div>
                <div style={{fontSize:13,color:T.textMuted,lineHeight:1.65}}>{desc}</div>
              </Card>
            ))}
            {forecast.updated&&<div style={{fontSize:10,color:T.textDim,marginBottom:12,paddingLeft:4}}>Napoved osvežena: {forecast.updated}</div>}
            {arso.length>0&&(
              <Card T={T} style={{marginTop:4}}>
                <CardTitle icon={<Ico.Pin/>} right="ARSO" T={T}>Uradne postaje</CardTitle>
                {arso.map((s,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1.3fr 0.8fr 0.9fr 0.6fr',gap:4,padding:'7px 0',borderBottom:'1px solid rgba(0,0,0,0.07)',alignItems:'baseline'}}>
                    <span style={{fontSize:12,color:T.textPrimary}}>{s.name}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:'#d97706'}}>{s.temp||'—'}</span>
                    <span style={{fontSize:11,color:T.textDim}}>{s.wind&&s.wind!=='-'?s.wind:'—'}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'#1d6fa0'}}>{s.rain||'0 mm'}</span>
                  </div>
                ))}
              </Card>
            )}
            <p style={{fontSize:10,color:T.textDim,marginTop:12,lineHeight:1.6,padding:'0 4px'}}>
              Napoved WXSIM (hobi)</p>
          </div>
        )}

        {/* ━━ RADAR ━━ */}
        {tab==='radar'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            <Card T={T} style={{marginBottom:11,padding:14}}>
              <CardTitle icon={<Ico.Bolt/>} right="ARSO · 5 min" T={T}>Radar padavin</CardTitle>
              <div style={{borderRadius:12,overflow:'hidden',background:'rgba(0,0,0,0.08)'}}>
                <LiveImage src="https://vremetolmin.si/radar.png" alt="Radar padavin"
                  imgStyle={{borderRadius:12,maxHeight:260,objectFit:'contain'}}
                  fallbackText="Radar ni dosegljiv" T={T}/>
              </div>
              <div style={{marginTop:6,fontSize:10,color:T.textDim,textAlign:'right'}}>Samodejno osvežuje vsako minuto</div>
            </Card>
            <Card T={T} style={{marginBottom:11,padding:14}}>
              <CardTitle icon={<Ico.Bolt/>} right="Boltek detektor" T={T}>Strele — StormVue</CardTitle>
              <div style={{borderRadius:12,overflow:'hidden',background:'rgba(0,0,0,0.06)'}}>
                <iframe src="https://vremetolmin.si/stormvue.html" title="StormVue strele"
                  style={{width:'100%',height:300,border:'none',display:'block',borderRadius:12}}
                  sandbox="allow-scripts allow-same-origin"/>
              </div>
              <div style={{marginTop:10}}>
                <Row label="Zadnja minuta" value={W.lightning1min!=null?W.lightning1min:0} T={T}/>
                <Row label="Zadnja ura"    value={W.lightning1h!=null?W.lightning1h:0} T={T}/>
                <Row label="Danes skupaj"  value={W.lightningDay!=null?W.lightningDay:0} T={T}/>
              </div>
            </Card>
            <Card T={T} style={{marginBottom:11,padding:14}}>
              <CardTitle icon={<Ico.Cam/>} T={T}>Kamera Zatolmin JV</CardTitle>
              <div style={{borderRadius:12,overflow:'hidden',marginBottom:10}}>
                <LiveImage src="https://www.vremetolmin.si/webcam5.jpg" alt="Webcam Zatolmin"
                  imgStyle={{borderRadius:12,maxHeight:200,objectFit:'cover',objectPosition:'50% 55%'}}
                  fallbackText="Kamera ni dosegljiva" T={T}/>
              </div>
              <div style={{fontSize:11,color:T.textDim,textAlign:'center',marginBottom:10}}>Živo · Osvežuje se vsako minuto</div>
              {[['Severni pogled','https://vremetolmin.si/aurora/'],['Vsenebna kamera','https://vremetolmin.si/allsky/'],['Zadnji satelit','https://vremetolmin.si/sateliti/sat_zadnja.jpg']].map(([l,u])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
                  <span style={{fontSize:12,color:T.textMuted}}>{l}</span>
                  <a href={u} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:T.accent}}>Odpri ↗</a>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ━━ POSTAJE ━━ */}
        {tab==='postaje'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            <Card T={T} style={{marginBottom:11}}>
              <CardTitle icon={<Ico.Pin/>} right="vremetolmin.si" T={T}>Amaterske postaje</CardTitle>
              <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr',gap:'3px 8px',alignItems:'center'}}>
                {['Postaja','Temp','Veter','Dež'].map(h=>(
                  <div key={h} style={{fontSize:10,color:T.textDim,textTransform:'uppercase',letterSpacing:'0.05em',paddingBottom:6,textAlign:h==='Postaja'?'left':'center'}}>{h}</div>
                ))}
                {(nearby.length>0?nearby:[{name:'Nalaganje...',temp:null,wind:'—',rain:null}]).map((s,i)=>[
                  <div key={i+'n'} style={{fontSize:12,padding:'7px 0',borderTop:i>0?'1px solid rgba(0,0,0,0.07)':'none',color:T.textPrimary}}>
                    {s.link?<a href={s.link} target="_blank" rel="noopener noreferrer" style={{color:T.accent}}>{s.name}</a>:s.name}
                  </div>,
                  <div key={i+'t'} style={{fontFamily:"'DM Mono',monospace",fontSize:12,textAlign:'center',borderTop:i>0?'1px solid rgba(0,0,0,0.07)':'none',color:s.temp==null?T.textDim:s.temp<5?'#1d6fa0':s.temp<15?'#0e7490':s.temp<25?'#166534':'#b91c1c'}}>
                    {s.temp!=null?`${s.temp}°`:'—'}
                  </div>,
                  <div key={i+'w'} style={{fontSize:11,textAlign:'center',color:T.textDim,borderTop:i>0?'1px solid rgba(0,0,0,0.07)':'none'}}>{s.wind||'—'}</div>,
                  <div key={i+'r'} style={{fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:'center',color:'#1d4ed8',borderTop:i>0?'1px solid rgba(0,0,0,0.07)':'none'}}>
                    {s.rain!=null?`${s.rain}`:'—'}<span style={{fontSize:9,color:T.textDim}}>mm</span>
                  </div>,
                ])}
              </div>
            </Card>
            {arso.length>0&&(
              <Card T={T}>
                <CardTitle icon={<Ico.Pin/>} right="ARSO" T={T}>Uradne postaje ARSO</CardTitle>
                {arso.map((s,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1.3fr 0.9fr 0.9fr 0.6fr',gap:4,padding:'7px 0',borderBottom:'1px solid rgba(0,0,0,0.07)',fontSize:12}}>
                    <span style={{color:T.textPrimary}}>{s.name}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",color:'#d97706'}}>{s.temp||'—'}</span>
                    <span style={{color:T.textDim,fontSize:11}}>{s.wind&&s.wind!=='-'?s.wind:'—'}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",color:'#1d6fa0',fontSize:11}}>{s.rain||'0 mm'}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ━━ DONACIJA ━━ */}
        {tab==='donacija'&&(
          <div className="fade-up" style={{padding:'20px 15px 0'}}>
            <Card T={T} style={{textAlign:'center',marginBottom:13}}>
              <div style={{fontSize:34,marginBottom:11}}>☁️</div>
              <div style={{fontSize:19,fontWeight:600,marginBottom:8,color:T.textPrimary}}>Podprite vremetolmin.si</div>
              <div style={{fontSize:13,color:T.textMuted,lineHeight:1.7,maxWidth:270,margin:'0 auto'}}>
                Brezplačna, neprofitna vremenska storitev za dolino Tolminke — vzdržuje jo ena oseba za celotno skupnost.
              </div>
              <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',margin:'18px 0'}}>
                {['€5','€10','€20','Drugo'].map((v,i)=>(
                  <button key={v} onClick={e=>{document.querySelectorAll('.amt-btn').forEach(b=>{b.style.background='transparent';b.style.color=T.textPrimary});e.currentTarget.style.background=T.accent+'22';e.currentTarget.style.color=T.accent}}
                    className="amt-btn" style={{padding:'9px 17px',borderRadius:10,border:`1px solid ${T.cardBorder}`,background:i===0?T.accent+'22':'transparent',color:i===0?T.accent:T.textPrimary,fontFamily:"'Outfit',sans-serif",fontSize:14,cursor:'pointer',transition:'all .15s'}}>
                    {v}
                  </button>
                ))}
              </div>
              <a href="https://vremetolmin.si/i.html" target="_blank" rel="noopener noreferrer"
                style={{display:'block',padding:13,background:T.accent,borderRadius:13,fontSize:15,fontWeight:600,color:'#fff'}}>
                Donirajte na vremetolmin.si ↗
              </a>
            </Card>
            {[
              {icon:'🌡️',title:'Davis vremenska postaja',desc:'Profesionalni senzorji za temperaturo, vlago, veter, dež, solarno in UV — vzdrževanje kot hobi.'},
              {icon:'⚡',title:'Boltek detektor strel',desc:'Zaznavanje strel v realnem času za dolino Soče.'},
              {icon:'📡',title:'Satelitski sprejemnik',desc:'Neposredni sprejem posnetkov METEOR M2-3 in M2-4 v Tolminu.'},
              {icon:'📍',title:'Več postaj v dolini',desc:'Podatki iz Tolminke, požarnega stolpa in okoliških postaj — brezplačno za vso skupnost.'},
            ].map(({icon,title,desc})=>(
              <Card key={title} T={T} style={{marginBottom:10,display:'flex',alignItems:'flex-start',gap:14}}>
                <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{icon}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:T.textPrimary}}>{title}</div>
                  <div style={{fontSize:12,color:T.textMuted,lineHeight:1.65}}>{desc}</div>
                </div>
              </Card>
            ))}
            <p style={{fontSize:10,color:T.textDim,textAlign:'center',marginTop:14,lineHeight:1.7}}>
              Podpira novagorica.eu in društvo ZEVS<br/>
              Amaterski instrumenti · Ne za nujne primere
            </p>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%) translateZ(0)',width:'100%',maxWidth:430,background:T.tabBar,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:`1px solid ${T.tabBarBorder}`,zIndex:50,paddingBottom:'env(safe-area-inset-bottom,0px)',transition:'background 2s ease',boxShadow:'0 -4px 20px rgba(0,0,0,0.1)',willChange:'transform'}}>
        <div className="tab-scroll" style={{display:'flex',overflowX:'auto',width:'100%',padding:'5px 2px'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'6px 11px',background:'none',border:'none',cursor:'pointer',minWidth:54,fontFamily:"'Outfit',sans-serif"}}>
              <span style={{width:20,height:20,display:'inline-flex',opacity:tab===t.id?1:0.45,transition:'opacity .15s'}}>
                <t.Icon/>
              </span>
              <span style={{fontSize:10,fontWeight:tab===t.id?700:400,color:tab===t.id?T.accent:T.textDim,letterSpacing:'0.02em',transition:'color .15s'}}>{t.label}</span>
              {tab===t.id&&<div style={{width:14,height:2,borderRadius:1,background:T.accent,marginTop:1}}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
