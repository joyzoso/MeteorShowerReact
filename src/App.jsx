import { useState, useMemo, useCallback, useEffect } from "react";

const OWM_KEY  = "1290565aa718de2bd3044b1c6b79ec2b";
const NASA_KEY = import.meta.env.VITE_NASA_KEY;
const OWM      = "https://api.openweathermap.org";

// ── Meteor showers ─────────────────────────────────────────────────────────
const SHOWERS = [
  { name:"Quadrantids",        peak:[1,3],   rate:120, radiant:"Boötes",     duration:2 },
  { name:"Lyrids",             peak:[4,22],  rate:18,  radiant:"Lyra",       duration:3 },
  { name:"Eta Aquariids",      peak:[5,6],   rate:60,  radiant:"Aquarius",   duration:5 },
  { name:"S. Delta Aquariids", peak:[7,30],  rate:25,  radiant:"Aquarius",   duration:7 },
  { name:"Perseids",           peak:[8,12],  rate:100, radiant:"Perseus",    duration:5 },
  { name:"Draconids",          peak:[10,8],  rate:10,  radiant:"Draco",      duration:2 },
  { name:"Orionids",           peak:[10,21], rate:20,  radiant:"Orion",      duration:5 },
  { name:"Leonids",            peak:[11,17], rate:15,  radiant:"Leo",        duration:3 },
  { name:"Geminids",           peak:[12,13], rate:120, radiant:"Gemini",     duration:5 },
  { name:"Ursids",             peak:[12,22], rate:10,  radiant:"Ursa Minor", duration:3 },
];

// ── Astronomy facts — rotates daily ───────────────────────────────────────
const FACTS = [
  { text:"In 1610, Galileo discovered Jupiter's four largest moons using a homemade telescope — forever changing humanity's view of the cosmos.", credit:"Galileo Galilei, 1610" },
  { text:"Light from the Sun takes 8 minutes and 20 seconds to reach Earth, meaning we always see the Sun as it was 8 minutes in the past.", credit:"Solar science" },
  { text:"Saturn's rings are made of billions of ice chunks and rocky debris, ranging from tiny grains to objects the size of houses.", credit:"Cassini mission, 2004" },
  { text:"Voyager 1, launched in 1977, has traveled over 23 billion kilometers — the most distant human-made object ever built.", credit:"NASA Voyager program" },
  { text:"A day on Venus (243 Earth days) is longer than a year on Venus (225 Earth days) — it rotates slower than it orbits the Sun.", credit:"Planetary science" },
  { text:"Jupiter's Great Red Spot is a storm wider than Earth that has been continuously raging for at least 350 years.", credit:"Jupiter observations, 1665–present" },
  { text:"Neutron stars can spin up to 700 times per second and are so dense that a teaspoon of their material would weigh about a billion tons.", credit:"Pulsar astronomy" },
  { text:"The Milky Way and Andromeda galaxies are on a collision course — but the merger won't happen for another 4.5 billion years.", credit:"Hubble Space Telescope" },
  { text:"Einstein predicted gravitational waves in 1916, but they weren't directly detected until LIGO captured two colliding black holes in 2015.", credit:"LIGO collaboration, 2015" },
  { text:"The James Webb Space Telescope can see galaxies that formed just 300 million years after the Big Bang — 13.4 billion years into the past.", credit:"NASA JWST, 2022" },
  { text:"There are more stars in the observable universe than grains of sand on all of Earth's beaches combined — roughly 10²⁴ stars.", credit:"Cosmological estimates" },
  { text:"Olympus Mons on Mars is the tallest volcano in the solar system — nearly three times the height of Mount Everest.", credit:"Mars Global Surveyor" },
  { text:"The first photograph of a black hole was captured in 2019 by the Event Horizon Telescope — a network of eight observatories worldwide.", credit:"Event Horizon Telescope, 2019" },
  { text:"Mercury has no atmosphere to retain heat, so temperatures swing from 430°C during the day to −180°C at night.", credit:"MESSENGER mission" },
];
const todayFact = () => FACTS[Math.floor(Date.now() / 86400000) % FACTS.length];

// ── Stars (deterministic) ──────────────────────────────────────────────────
const STARS = Array.from({ length:180 }, (_,i) => ({
  x: ((i * 137.508) % 100).toFixed(2),
  y: ((i * 91.204)  % 100).toFixed(2),
  r: i % 11 === 0 ? 1.9 : i % 5 === 0 ? 1.1 : 0.55,
  o: (0.1 + (i % 8) * 0.08).toFixed(2),
}));

// ── KP → Aurora info ──────────────────────────────────────────────────────
function kpInfo(kp) {
  if (kp === null) return null;
  if (kp >= 8) return { label:"Severe storm",   color:"#f87171", visibility:"Visible as far south as Texas and Florida" };
  if (kp >= 7) return { label:"Strong storm",   color:"#fb923c", visibility:"Visible across most of the continental US" };
  if (kp >= 6) return { label:"Moderate storm", color:"#fbbf24", visibility:"Visible from northern half of the US" };
  if (kp >= 5) return { label:"Minor storm",    color:"#a3e635", visibility:"Visible from northern US border states" };
  if (kp >= 4) return { label:"Active",         color:"#34d399", visibility:"Visible from Canada and Alaska" };
  if (kp >= 3) return { label:"Unsettled",      color:"#22d3ee", visibility:"Visible from far northern latitudes only" };
  return        { label:"Quiet",                color:"#475569", visibility:"Aurora unlikely — geomagnetic activity is low" };
}

// ── Shower helpers ─────────────────────────────────────────────────────────
function nextShower() {
  const now = new Date(); now.setHours(0,0,0,0);
  const y   = now.getFullYear();
  const candidates = [];
  for (const yr of [y, y+1]) {
    for (const s of SHOWERS) {
      const peak = new Date(yr, s.peak[0]-1, s.peak[1]);
      const end  = new Date(peak); end.setDate(peak.getDate() + Math.ceil(s.duration/2));
      if (end >= now) candidates.push({...s, peakDate:peak});
    }
  }
  return candidates.sort((a,b) => a.peakDate - b.peakDate)[0];
}

function calcScore({ clouds=50, pop=0, wind=5 }) {
  return Math.round(
    Math.max(0, 60*(1-clouds/100)) +
    30*(1-Math.min(1,pop)) +
    (wind<5?10:wind<10?7:wind<20?4:1)
  );
}

const GRADES = [
  { min:75, label:"Excellent", col:"#4ade80" },
  { min:55, label:"Good",      col:"#a3e635" },
  { min:35, label:"Fair",      col:"#fbbf24" },
  { min:0,  label:"Poor",      col:"#f87171" },
];
const grade = s => GRADES.find(g => s >= g.min) || GRADES[3];

function parseForecast(list) {
  const map = {};
  for (const item of list) {
    const d   = new Date(item.dt*1000);
    const key = d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    const h   = d.getHours();
    if (h >= 19 || h <= 4) {
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
  }
  return Object.entries(map).slice(0,5).map(([date,items]) => {
    if (!items.length) return {date:date.split(",")[0],score:40,clouds:50,pop:0};
    const best = items.reduce((a,b) =>
      calcScore({clouds:a.clouds?.all,pop:a.pop,wind:a.wind?.speed}) >=
      calcScore({clouds:b.clouds?.all,pop:b.pop,wind:b.wind?.speed}) ? a : b
    );
    return {
      date:   date.split(",")[0],
      score:  calcScore({clouds:best.clouds?.all,pop:best.pop,wind:best.wind?.speed}),
      clouds: best.clouds?.all ?? 50,
      pop:    Math.round((best.pop??0)*100),
    };
  });
}

// ── Cosmic background with illustrated planets ────────────────────────────
function CosmicBackground() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,background:"#03050d",overflow:"hidden"}}>
      <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sg" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#f8eab8"/>
            <stop offset="20%"  stopColor="#eacf78"/>
            <stop offset="50%"  stopColor="#c9962e"/>
            <stop offset="80%"  stopColor="#9a6320"/>
            <stop offset="100%" stopColor="#5c3208"/>
          </radialGradient>
          <clipPath id="sclip"><circle cx="0" cy="0" r="112"/></clipPath>
          <mask id="ringBehind">
            <rect x="-600" y="-400" width="1200" height="800" fill="white"/>
            <ellipse cx="0" cy="0" rx="114" ry="112" fill="black"/>
          </mask>
          <mask id="ringFront">
            <ellipse cx="0" cy="0" rx="114" ry="112" fill="white"/>
            <rect x="-300" y="-115" width="600" height="115" fill="black"/>
          </mask>

          <radialGradient id="jg" cx="36%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#f2c898"/>
            <stop offset="30%"  stopColor="#d4804a"/>
            <stop offset="65%"  stopColor="#aa5020"/>
            <stop offset="100%" stopColor="#6a2808"/>
          </radialGradient>
          <clipPath id="jclip"><circle cx="0" cy="0" r="76"/></clipPath>

          <radialGradient id="bpg" cx="38%" cy="34%" r="65%">
            <stop offset="0%"   stopColor="#b8e0f8"/>
            <stop offset="30%"  stopColor="#4898d8"/>
            <stop offset="70%"  stopColor="#1855a0"/>
            <stop offset="100%" stopColor="#081e50"/>
          </radialGradient>

          <radialGradient id="neb1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a0a40" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#03050d" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="neb2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#081a38" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#03050d" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="neb3" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0a2810" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#03050d" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Nebula atmosphere */}
        <ellipse cx="950" cy="120" rx="420" ry="280" fill="url(#neb1)"/>
        <ellipse cx="180" cy="680" rx="320" ry="220" fill="url(#neb2)"/>
        <ellipse cx="600" cy="400" rx="500" ry="300" fill="url(#neb3)"/>

        {/* Star field */}
        {STARS.map((s,i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o}/>
        ))}
        <circle cx="110" cy="90"  r="2.4" fill="#fff"    opacity="0.95"/>
        <circle cx="420" cy="38"  r="1.9" fill="#ffe8a0" opacity="0.88"/>
        <circle cx="760" cy="110" r="2.1" fill="#fff"    opacity="0.82"/>
        <circle cx="290" cy="720" r="2.0" fill="#a8d8ff" opacity="0.72"/>
        <circle cx="940" cy="660" r="2.5" fill="#fff"    opacity="0.68"/>
        <circle cx="560" cy="55"  r="1.6" fill="#ffd0b0" opacity="0.75"/>

        {/* Small blue/ice planet — upper left */}
        <g transform="translate(130,155)">
          <circle cx="0" cy="0" r="40" fill="url(#bpg)"/>
          <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(80,160,255,0.18)" strokeWidth="9"/>
          <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(60,140,255,0.08)" strokeWidth="16"/>
          <ellipse cx="-11" cy="-13" rx="13" ry="9" fill="rgba(255,255,255,0.18)" transform="rotate(-28)"/>
        </g>

        {/* Jupiter — mid upper right */}
        <g transform="translate(1042,268)">
          <circle cx="0" cy="0" r="76" fill="url(#jg)"/>
          <g clipPath="url(#jclip)">
            {[-30,-18,-6,6,18,30,42,-42].map((y,i) => (
              <rect key={i} x="-76" y={y-5} width="152" height={i%2===0?9:7}
                fill={i%2===0?"rgba(160,75,25,0.28)":"rgba(245,185,110,0.18)"}/>
            ))}
            <ellipse cx="20" cy="14" rx="18" ry="11" fill="rgba(185,55,25,0.5)"/>
            <ellipse cx="20" cy="14" rx="13" ry="7"  fill="rgba(210,70,30,0.3)"/>
          </g>
          <circle cx="0" cy="0" r="76" fill="none" stroke="rgba(200,130,60,0.12)" strokeWidth="6"/>
          <ellipse cx="-22" cy="-24" rx="24" ry="17" fill="rgba(255,255,255,0.12)" transform="rotate(-22)"/>
        </g>

        {/* Saturn — large hero, bottom right */}
        <g transform="translate(990,655) rotate(-16)">
          <g clipPath="url(#sclip)">
            <ellipse cx="0" cy="14" rx="170" ry="28" fill="rgba(80,50,15,0.45)"/>
          </g>
          <g mask="url(#ringBehind)">
            <ellipse cx="0" cy="12" rx="208" ry="44" fill="none" stroke="rgba(220,190,120,0.22)" strokeWidth="28"/>
            <ellipse cx="0" cy="12" rx="178" ry="36" fill="none" stroke="rgba(215,182,105,0.55)" strokeWidth="20"/>
            <ellipse cx="0" cy="12" rx="152" ry="30" fill="none" stroke="rgba(200,162,88,0.38)"  strokeWidth="12"/>
            <ellipse cx="0" cy="12" rx="130" ry="24" fill="none" stroke="rgba(185,148,72,0.20)"  strokeWidth="6"/>
          </g>
          <circle cx="0" cy="0" r="112" fill="url(#sg)"/>
          <g clipPath="url(#sclip)">
            {[-48,-32,-18,-5,9,22,36,50].map((y,i) => (
              <rect key={i} x="-112" y={y-4} width="224" height={i%3===0?8:6}
                fill={i%2===0?"rgba(175,115,35,0.22)":"rgba(245,205,120,0.12)"}/>
            ))}
          </g>
          <circle cx="0" cy="0" r="112" fill="none" stroke="rgba(240,200,120,0.1)" strokeWidth="6"/>
          <g mask="url(#ringFront)">
            <ellipse cx="0" cy="12" rx="208" ry="44" fill="none" stroke="rgba(225,194,124,0.28)" strokeWidth="28"/>
            <ellipse cx="0" cy="12" rx="178" ry="36" fill="none" stroke="rgba(230,196,118,0.72)" strokeWidth="20"/>
            <ellipse cx="0" cy="12" rx="152" ry="30" fill="none" stroke="rgba(210,170,95,0.48)"  strokeWidth="12"/>
            <ellipse cx="0" cy="12" rx="130" ry="24" fill="none" stroke="rgba(195,155,78,0.25)"  strokeWidth="6"/>
          </g>
          <ellipse cx="-34" cy="-40" rx="38" ry="28" fill="rgba(255,250,225,0.13)" transform="rotate(16)"/>
        </g>
      </svg>
    </div>
  );
}

// ── Aurora widget ──────────────────────────────────────────────────────────
function AuroraWidget({ kp }) {
  const info = kpInfo(kp);
  if (!info) return (
    <div style={CARD}>
      <div style={LABEL}>⊙ Aurora / KP index</div>
      <div style={{fontSize:12,color:"#334155"}}>Loading geomagnetic data…</div>
    </div>
  );
  return (
    <div style={{...CARD, background:`${info.color}0e`, border:`1px solid ${info.color}30`}}>
      <div style={LABEL}>⊙ Aurora / KP index</div>
      <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"monospace",fontSize:64,fontWeight:800,color:info.color,lineHeight:1}}>
            {kp.toFixed(1)}
          </div>
          <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>kp index</div>
        </div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{fontSize:16,fontWeight:700,color:info.color,marginBottom:6}}>{info.label}</div>
          <div style={{fontSize:12,color:"#64748b",lineHeight:1.6,marginBottom:10}}>{info.visibility}</div>
          <div style={{display:"flex",gap:3,alignItems:"center"}}>
            {[0,1,2,3,4,5,6,7,8,9].map(n => (
              <div key={n} style={{
                flex:1,height:6,borderRadius:3,
                background: n<=kp
                  ? (n>=8?"#f87171":n>=6?"#fbbf24":n>=4?"#34d399":"#334155")
                  : "rgba(255,255,255,.07)"
              }}/>
            ))}
            <div style={{fontSize:9,color:"#475569",marginLeft:4,whiteSpace:"nowrap"}}>0–9</div>
          </div>
        </div>
      </div>
      {kp >= 5 && (
        <div style={{marginTop:12,padding:"8px 12px",background:`${info.color}14`,borderRadius:8,fontSize:11,color:info.color}}>
          ✦ Active aurora conditions — check spaceweather.com or Dark Sky Finder for your nearest viewing site
        </div>
      )}
    </div>
  );
}

// ── APOD + daily fact ──────────────────────────────────────────────────────
function APODCard({ apod }) {
  const fact = useMemo(() => todayFact(), []);
  return (
    <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      <div style={{...CARD,display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:200}}>
        <div>
          <div style={LABEL}>✦ Astronomy fact of the day</div>
          <div style={{fontSize:13,color:"#cbd5e1",lineHeight:1.78,fontStyle:"italic"}}>"{fact.text}"</div>
        </div>
        <div style={{marginTop:14,fontSize:10,color:"#334155",fontFamily:"monospace",letterSpacing:"0.04em"}}>
          — {fact.credit}
        </div>
      </div>
      {apod ? (
        <div style={{...CARD,padding:0,overflow:"hidden"}}>
          {apod.media_type==="image"
            ? <img src={apod.url} alt={apod.title} style={{width:"100%",height:155,objectFit:"cover",display:"block"}}/>
            : apod.url.includes("youtube.com") || apod.url.includes("youtu.be") || apod.url.includes("vimeo.com")
              ? <iframe src={apod.url} title={apod.title} allowFullScreen
                  style={{width:"100%",height:155,border:"none",display:"block",background:"#000"}}/>
              : <video src={apod.url} controls style={{width:"100%",height:155,display:"block",background:"#000"}}/>
          }
          <div style={{padding:"14px 16px"}}>
            <div style={LABEL}>NASA · Picture of the day</div>
            <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:6}}>{apod.title}</div>
            <div style={{fontSize:11,color:"#475569",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
              {apod.explanation}
            </div>
          </div>
        </div>
      ) : (
        <div style={{...CARD,display:"flex",alignItems:"center",justifyContent:"center",minHeight:200}}>
          <div style={{fontSize:12,color:"#334155"}}>Loading NASA picture of the day…</div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const CARD = {
  background:"rgba(255,255,255,.03)",
  border:"1px solid rgba(255,255,255,.07)",
  borderRadius:16,
  padding:20,
};
const LABEL = {
  fontFamily:"monospace",
  fontSize:10,
  letterSpacing:"0.15em",
  textTransform:"uppercase",
  color:"#475569",
  marginBottom:12,
};

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [zipVal,  setZipVal]  = useState("");
  const [loc,     setLoc]     = useState(null);
  const [wx,      setWx]      = useState(null);
  const [fc,      setFc]      = useState(null);
  const [nearby,  setNearby]  = useState([]);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const [kp,      setKp]      = useState(null);
  const [apod,    setApod]    = useState(null);

  const shower   = useMemo(() => nextShower(), []);
  const daysAway = useMemo(() => {
    if (!shower) return 0;
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((shower.peakDate - now) / 86400000);
  }, [shower]);

  useEffect(() => {
    fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
      .then(r => r.json())
      .then(d => { const row = d[d.length-1]; if (row) setKp(parseFloat(row[1])); })
      .catch(() => {});
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setApod(d); })
      .catch(() => {});
  }, []);

  const load = useCallback(async (lat, lon, name) => {
    setBusy(true); setErr(""); setNearby([]);
    try {
      const [wr,fr] = await Promise.all([
        fetch(`${OWM}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=imperial`),
        fetch(`${OWM}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=imperial`),
      ]);
      const [w,f] = await Promise.all([wr.json(), fr.json()]);
      if (w.cod !== 200) throw new Error(w.message || "API error");
      setWx(w); setFc(f);
      setLoc({lat,lon,name:name||w.name});
      if ((w.clouds?.all??0) > 60) {
        const offsets = [[0.8,0],[-0.8,0],[0,1.0],[0,-1.0]];
        const res = await Promise.allSettled(
          offsets.map(([dl,dlo]) =>
            fetch(`${OWM}/data/2.5/weather?lat=${lat+dl}&lon=${lon+dlo}&appid=${OWM_KEY}&units=imperial`).then(r=>r.json())
          )
        );
        setNearby(
          res.filter(r => r.status==="fulfilled"&&r.value.cod===200&&(r.value.clouds?.all??101)<(w.clouds?.all??100))
             .map(r => r.value)
             .sort((a,b) => (a.clouds?.all??100)-(b.clouds?.all??100))
             .slice(0,3)
        );
      }
    } catch(e) {
      setErr(e.message||"Something went wrong");
    } finally {
      setBusy(false);
    }
  }, []);

  const onZip = async e => {
    e.preventDefault();
    const z = zipVal.trim();
    if (!z||z.length<5) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${OWM}/geo/1.0/zip?zip=${z},US&appid=${OWM_KEY}`);
      const d = await r.json();
      if (!d.lat) throw new Error("Zip code not found");
      await load(d.lat, d.lon, d.name);
    } catch(e) { setBusy(false); setErr(e.message); }
  };

  const onGeo = () => {
    if (!navigator.geolocation) return setErr("Geolocation not supported by this browser");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      p => load(p.coords.latitude, p.coords.longitude, null),
      () => { setBusy(false); setErr("Location denied — try a zip code instead"); }
    );
  };

  const days         = useMemo(() => fc ? parseForecast(fc.list) : [], [fc]);
  const clouds       = wx?.clouds?.all ?? 0;
  const tonightScore = wx ? calcScore({clouds, pop:0, wind:wx.wind?.speed??5}) : null;
  const tonightGrade = tonightScore !== null ? grade(tonightScore) : null;

  const peakStr = shower?.peakDate.toLocaleDateString("en-US",{month:"long",day:"numeric"});
  const daysStr = daysAway<0 ? `${Math.abs(daysAway)}d past peak`
    : daysAway===0 ? "Tonight!"
    : daysAway===1 ? "Tomorrow"
    : `${daysAway} days away`;

  return (
    <div style={{minHeight:"100vh",color:"#e2e8f0",fontFamily:"system-ui,-apple-system,sans-serif",padding:"24px 16px 64px",position:"relative",overflowX:"hidden"}}>
      <CosmicBackground/>
      <style>{`
        .zi:focus{border-color:#f59e0b!important;outline:none;}
        .bp{background:#f59e0b;color:#040810;border:none;border-radius:10px;padding:10px 20px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .bp:hover:not(:disabled){opacity:.82;} .bp:disabled{opacity:.35;cursor:not-allowed;}
        .bg{background:rgba(255,255,255,.05);color:#94a3b8;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .bg:hover:not(:disabled){background:rgba(255,255,255,.09);} .bg:disabled{opacity:.35;cursor:not-allowed;}
        @keyframes blink{0%,100%{opacity:.9}50%{opacity:.15}}
        @media(max-width:600px){.two-col{grid-template-columns:1fr!important}.five-col{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      <div style={{maxWidth:820,margin:"0 auto",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32,paddingTop:8}}>
          <div style={{fontFamily:"monospace",fontSize:11,letterSpacing:"0.22em",color:"#f59e0b",textTransform:"uppercase",marginBottom:8}}>★ Night sky planner</div>
          <h1 style={{fontSize:"clamp(28px,5vw,46px)",fontWeight:800,background:"linear-gradient(135deg,#fbbf24 25%,#f97316 75%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",margin:0,lineHeight:1.1}}>
            Astronomical Events
          </h1>
          <div style={{fontSize:13,color:"#2d3748",marginTop:8}}>Weather · Aurora · Meteor showers · Sky conditions</div>
        </div>

        {/* Location input */}
        <div style={{...CARD,marginBottom:20,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <form style={{display:"flex",gap:8,flex:1,minWidth:180}} onSubmit={onZip}>
            <input className="zi"
              style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",color:"#e2e8f0",fontFamily:"monospace",fontSize:14,minWidth:0}}
              type="text" inputMode="numeric" placeholder="Enter zip code"
              value={zipVal} onChange={e=>setZipVal(e.target.value.replace(/\D/g,"").slice(0,5))}/>
            <button className="bp" type="submit" disabled={busy||zipVal.length<5}>{busy?"···":"Go"}</button>
          </form>
          <span style={{color:"#1e2d40",fontSize:12}}>or</span>
          <button className="bg" onClick={onGeo} disabled={busy}>⌖ My location</button>
        </div>

        {err && (
          <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.22)",borderRadius:10,padding:"12px 16px",color:"#fca5a5",fontSize:13,marginBottom:16}}>⚠ {err}</div>
        )}

        {/* Shower banner */}
        {shower && (
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,.12),rgba(249,115,22,.05))",border:"1px solid rgba(245,158,11,.22)",borderRadius:20,padding:"24px 28px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,background:"radial-gradient(circle,rgba(245,158,11,.09) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
            <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"#f59e0b",marginBottom:10}}>☄ Next meteor shower</div>
            <div style={{fontSize:34,fontWeight:800,color:"#fef3c7",marginBottom:20,letterSpacing:"-0.5px"}}>{shower.name}</div>
            <div style={{display:"flex",gap:32,flexWrap:"wrap"}}>
              {[["Peak date",peakStr],["Countdown",daysStr],["Peak rate",`${shower.rate}/hr`],["Radiant",shower.radiant]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,color:"#78716c",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>{l}</div>
                  <div style={{fontFamily:"monospace",fontSize:17,color:"#fbbf24",fontWeight:700}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aurora */}
        <div style={{marginBottom:20}}><AuroraWidget kp={kp}/></div>

        {/* APOD + Fact */}
        <APODCard apod={apod}/>

        {/* Weather */}
        {wx && tonightGrade && (
          <>
            <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div style={CARD}>
                <div style={LABEL}>Conditions — {loc?.name}</div>
                <div style={{fontSize:58,fontWeight:800,color:"#e2e8f0",lineHeight:1,marginBottom:4}}>{Math.round(wx.main?.temp)}°</div>
                <div style={{fontSize:13,color:"#64748b",textTransform:"capitalize",marginBottom:18}}>{wx.weather?.[0]?.description}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["Cloud cover",`${clouds}%`],["Humidity",`${wx.main?.humidity}%`],["Wind",`${Math.round(wx.wind?.speed)} mph`],["Feels like",`${Math.round(wx.main?.feels_like)}°`]].map(([l,v])=>(
                    <div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                      <div style={{fontFamily:"monospace",fontSize:15,color:"#cbd5e1"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{...CARD,background:`${tonightGrade.col}10`,border:`1px solid ${tonightGrade.col}28`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                <div style={LABEL}>Tonight's viewing score</div>
                <div style={{fontFamily:"monospace",fontSize:76,fontWeight:800,color:tonightGrade.col,lineHeight:1,marginBottom:8}}>{tonightScore}</div>
                <div style={{fontSize:18,fontWeight:700,color:tonightGrade.col,marginBottom:12}}>{tonightGrade.label}</div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.65}}>
                  {clouds<30?"Clear skies — ideal for meteor watching":clouds<60?"Partly cloudy — look for clear windows overnight":"Heavy clouds — see nearby locations below"}
                </div>
              </div>
            </div>

            {clouds>60 && nearby.length>0 && (
              <div style={{marginBottom:20}}>
                <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.18)",borderRadius:12,padding:"11px 16px",marginBottom:12,fontSize:13,color:"#fca5a5"}}>
                  ☁ {clouds}% cloud cover at {loc?.name}. Clearer spots within ~55 miles:
                </div>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${nearby.length},1fr)`,gap:10}}>
                  {nearby.map((n,i)=>{
                    const nc=n.clouds?.all??0, ng=grade(calcScore({clouds:nc,pop:0,wind:n.wind?.speed??5}));
                    return (
                      <div key={i} style={{...CARD,background:`${ng.col}0c`,border:`1px solid ${ng.col}28`,textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:8}}>{n.name}</div>
                        <div style={{fontFamily:"monospace",fontSize:32,color:ng.col,marginBottom:2}}>{nc}%</div>
                        <div style={{fontSize:10,color:"#475569",marginBottom:8}}>cloud cover</div>
                        <div style={{fontSize:11,color:"#64748b",textTransform:"capitalize"}}>{n.weather?.[0]?.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {days.length>0 && (
              <div style={{marginBottom:20}}>
                <div style={LABEL}>5-night viewing forecast</div>
                <div className="five-col" style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(days.length,5)},1fr)`,gap:10}}>
                  {days.map((day,i)=>{
                    const g=grade(day.score);
                    return (
                      <div key={i} style={{...CARD,border:`1px solid ${g.col}20`,textAlign:"center"}}>
                        <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{day.date}</div>
                        <div style={{fontFamily:"monospace",fontSize:30,fontWeight:800,color:g.col,marginBottom:3}}>{day.score}</div>
                        <div style={{fontSize:10,color:g.col,marginBottom:10}}>{g.label}</div>
                        <div style={{fontSize:10,color:"#334155"}}>{day.clouds}% clouds</div>
                        {day.pop>0&&<div style={{fontSize:10,color:"#334155"}}>{day.pop}% precip</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!wx&&!busy&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:46,marginBottom:14}}>🔭</div>
            <div style={{fontSize:14,color:"#2d3748"}}>Enter your location to see tonight's sky conditions</div>
          </div>
        )}
        {busy&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:28,marginBottom:14,animation:"blink 1.4s ease-in-out infinite",display:"inline-block"}}>✦</div>
            <div style={{fontSize:14,color:"#2d3748"}}>Scanning the skies…</div>
          </div>
        )}
      </div>
    </div>
  );
}
