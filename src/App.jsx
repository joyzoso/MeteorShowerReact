import { useState, useMemo, useCallback } from "react";

const KEY  = "1290565aa718de2bd3044b1c6b79ec2b";
const OWM  = "https://api.openweathermap.org";

// ── Annual meteor showers ──────────────────────────────────────────────────
const SHOWERS = [
  { name: "Quadrantids",        peak:[1,3],   rate:120, radiant:"Boötes",    duration:2 },
  { name: "Lyrids",             peak:[4,22],  rate:18,  radiant:"Lyra",       duration:3 },
  { name: "Eta Aquariids",      peak:[5,6],   rate:60,  radiant:"Aquarius",   duration:5 },
  { name: "S. Delta Aquariids", peak:[7,30],  rate:25,  radiant:"Aquarius",   duration:7 },
  { name: "Perseids",           peak:[8,12],  rate:100, radiant:"Perseus",    duration:5 },
  { name: "Draconids",          peak:[10,8],  rate:10,  radiant:"Draco",      duration:2 },
  { name: "Orionids",           peak:[10,21], rate:20,  radiant:"Orion",      duration:5 },
  { name: "Leonids",            peak:[11,17], rate:15,  radiant:"Leo",        duration:3 },
  { name: "Geminids",           peak:[12,13], rate:120, radiant:"Gemini",     duration:5 },
  { name: "Ursids",             peak:[12,22], rate:10,  radiant:"Ursa Minor", duration:3 },
];

function nextShower() {
  const now = new Date(); now.setHours(0,0,0,0);
  const y = now.getFullYear();
  const candidates = [];
  for (const yr of [y, y+1]) {
    for (const s of SHOWERS) {
      const peak = new Date(yr, s.peak[0]-1, s.peak[1]);
      const end  = new Date(peak);
      end.setDate(peak.getDate() + Math.ceil(s.duration/2));
      if (end >= now) candidates.push({ ...s, peakDate: peak });
    }
  }
  return candidates.sort((a,b) => a.peakDate - b.peakDate)[0];
}

// ── Viewing score (0–100) ──────────────────────────────────────────────────
function calcScore({ clouds=50, pop=0, wind=5 }) {
  return Math.round(
    Math.max(0, 60*(1 - clouds/100)) +
    30*(1 - Math.min(1, pop)) +
    (wind < 5 ? 10 : wind < 10 ? 7 : wind < 20 ? 4 : 1)
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
    const d = new Date(item.dt * 1000);
    const key = d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    const h = d.getHours();
    if (h >= 19 || h <= 4) {
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
  }
  return Object.entries(map).slice(0,5).map(([date, items]) => {
    if (!items.length) return { date: date.split(",")[0], score:40, clouds:50, pop:0 };
    const best = items.reduce((a,b) =>
      calcScore({clouds:a.clouds?.all,pop:a.pop,wind:a.wind?.speed}) >=
      calcScore({clouds:b.clouds?.all,pop:b.pop,wind:b.wind?.speed}) ? a : b
    );
    return {
      date:  date.split(",")[0],
      score: calcScore({clouds:best.clouds?.all,pop:best.pop,wind:best.wind?.speed}),
      clouds: best.clouds?.all ?? 50,
      pop:    Math.round((best.pop??0)*100),
    };
  });
}

// ── Deterministic star field ───────────────────────────────────────────────
const STARS = Array.from({length:100}, (_,i) => ({
  x: ((i*137.508)%100).toFixed(1),
  y: ((i*91.204 )%100).toFixed(1),
  r: i%7===0 ? 1.3 : i%3===0 ? 0.8 : 0.5,
  o: (0.15 + (i%5)*0.08).toFixed(2),
}));

// ── Component ──────────────────────────────────────────────────────────────
export default function App() {
  const [zipVal,  setZipVal]  = useState("");
  const [loc,     setLoc]     = useState(null);
  const [wx,      setWx]      = useState(null);
  const [fc,      setFc]      = useState(null);
  const [nearby,  setNearby]  = useState([]);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");

  const shower   = useMemo(() => nextShower(), []);
  const daysAway = useMemo(() => {
    if (!shower) return 0;
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((shower.peakDate - now) / 86400000);
  }, [shower]);

  const load = useCallback(async (lat, lon, name) => {
    setBusy(true); setErr(""); setNearby([]);
    try {
      const [wr, fr] = await Promise.all([
        fetch(`${OWM}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=imperial`),
        fetch(`${OWM}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${KEY}&units=imperial`),
      ]);
      const [w, f] = await Promise.all([wr.json(), fr.json()]);
      if (w.cod !== 200) throw new Error(w.message || "API error");
      setWx(w); setFc(f);
      setLoc({ lat, lon, name: name || w.name });

      if ((w.clouds?.all ?? 0) > 60) {
        const offsets = [[.8,0],[-.8,0],[0,1.0],[0,-1.0]];
        const res = await Promise.allSettled(
          offsets.map(([dl,dlo]) =>
            fetch(`${OWM}/data/2.5/weather?lat=${lat+dl}&lon=${lon+dlo}&appid=${KEY}&units=imperial`).then(r=>r.json())
          )
        );
        const clearer = res
          .filter(r => r.status==="fulfilled" && r.value.cod===200 && (r.value.clouds?.all??101) < (w.clouds?.all??100))
          .map(r => r.value)
          .sort((a,b)=>(a.clouds?.all??100)-(b.clouds?.all??100))
          .slice(0,3);
        setNearby(clearer);
      }
    } catch(e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, []);

  const onZip = async e => {
    e.preventDefault();
    const z = zipVal.trim();
    if (!z || z.length < 5) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${OWM}/geo/1.0/zip?zip=${z},US&appid=${KEY}`);
      const d = await r.json();
      if (!d.lat) throw new Error("Zip code not found");
      await load(d.lat, d.lon, d.name);
    } catch(e) {
      setBusy(false); setErr(e.message);
    }
  };

  const onGeo = () => {
    if (!navigator.geolocation) return setErr("Geolocation not supported by this browser");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      p => load(p.coords.latitude, p.coords.longitude, null),
      () => { setBusy(false); setErr("Location denied — try entering a zip code"); }
    );
  };

  const days         = useMemo(()=> fc ? parseForecast(fc.list) : [], [fc]);
  const clouds       = wx?.clouds?.all ?? 0;
  const tonightScore = wx ? calcScore({ clouds, pop:0, wind: wx.wind?.speed??5 }) : null;
  const tonightGrade = tonightScore !== null ? grade(tonightScore) : null;
  const isCloudyHere = clouds > 60;

  const peakStr = shower?.peakDate.toLocaleDateString("en-US",{month:"long",day:"numeric"});
  const daysStr = daysAway < 0
    ? `${Math.abs(daysAway)}d past peak`
    : daysAway === 0 ? "Tonight!" : `${daysAway} days`;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#070a10",color:"#e2e8f0",fontFamily:"system-ui,-apple-system,sans-serif",padding:"24px 16px 48px",position:"relative",overflowX:"hidden"}}>

      <style>{`
        .zi:focus{border-color:#f59e0b!important;outline:none;}
        .bp{background:#f59e0b;color:#070a10;border:none;border-radius:10px;padding:10px 20px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .bp:hover:not(:disabled){opacity:.82;}
        .bp:disabled{opacity:.35;cursor:not-allowed;}
        .bg{background:rgba(255,255,255,.05);color:#94a3b8;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .bg:hover:not(:disabled){background:rgba(255,255,255,.09);}
        .bg:disabled{opacity:.35;cursor:not-allowed;}
        @keyframes blink{0%,100%{opacity:.9}50%{opacity:.2}}
      `}</style>

      {/* Starfield SVG */}
      <svg style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.r*0.4} fill="#fff" opacity={s.o}/>)}
      </svg>

      <div style={{maxWidth:760,margin:"0 auto",position:"relative",zIndex:1}}>

        {/* ── Header ── */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:11,letterSpacing:"0.2em",color:"#f59e0b",textTransform:"uppercase",marginBottom:8}}>★ Night sky planner</div>
          <h1 style={{fontSize:clamp(32,40),fontWeight:800,background:"linear-gradient(135deg,#fbbf24 30%,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",margin:0,lineHeight:1.1}}>
            Meteor Shower
          </h1>
          <div style={{fontSize:13,color:"#475569",marginTop:8}}>Weather forecasts for dark sky events</div>
        </div>

        {/* ── Location input ── */}
        <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:20,marginBottom:20,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <form style={{display:"flex",gap:8,flex:1,minWidth:180}} onSubmit={onZip}>
            <input
              className="zi"
              style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",color:"#e2e8f0",fontFamily:"'SF Mono','Fira Code',monospace",fontSize:14,minWidth:0}}
              type="text" inputMode="numeric" placeholder="Enter zip code"
              value={zipVal}
              onChange={e=>setZipVal(e.target.value.replace(/\D/g,"").slice(0,5))}
            />
            <button className="bp" type="submit" disabled={busy||zipVal.length<5}>{busy?"···":"Go"}</button>
          </form>
          <span style={{color:"#1e293b",fontSize:12,whiteSpace:"nowrap"}}>or</span>
          <button className="bg" onClick={onGeo} disabled={busy}>⌖ My location</button>
        </div>

        {/* ── Error ── */}
        {err && (
          <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.22)",borderRadius:10,padding:"12px 16px",color:"#fca5a5",fontSize:13,marginBottom:16}}>
            ⚠ {err}
          </div>
        )}

        {/* ── Shower banner ── */}
        {shower && (
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,.12),rgba(249,115,22,.05))",border:"1px solid rgba(245,158,11,.22)",borderRadius:20,padding:"24px 28px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,background:"radial-gradient(circle,rgba(245,158,11,.09) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
            <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"#f59e0b",marginBottom:10}}>☄ Next meteor shower</div>
            <div style={{fontSize:32,fontWeight:800,color:"#fef3c7",marginBottom:18,letterSpacing:"-0.5px"}}>{shower.name}</div>
            <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
              {[["Peak date",peakStr],["Days away",daysStr],[`Peak rate`,`${shower.rate}/hr`],["Radiant",shower.radiant]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:10,color:"#78716c",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>{l}</div>
                  <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:17,color:"#fbbf24",fontWeight:700}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Weather + Score grid ── */}
        {wx && tonightGrade && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

              {/* Current weather */}
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:20}}>
                <div style={LABEL}>Conditions — {loc?.name}</div>
                <div style={{fontSize:56,fontWeight:800,color:"#e2e8f0",lineHeight:1,marginBottom:4}}>{Math.round(wx.main?.temp)}°</div>
                <div style={{fontSize:13,color:"#64748b",textTransform:"capitalize",marginBottom:18}}>{wx.weather?.[0]?.description}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    ["Cloud cover",`${clouds}%`],
                    ["Humidity",`${wx.main?.humidity}%`],
                    ["Wind",`${Math.round(wx.wind?.speed)} mph`],
                    ["Feels like",`${Math.round(wx.main?.feels_like)}°`],
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                      <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:15,color:"#cbd5e1"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viewing score */}
              <div style={{background:`${tonightGrade.col}10`,border:`1px solid ${tonightGrade.col}28`,borderRadius:16,padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                <div style={LABEL}>Tonight's viewing score</div>
                <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:72,fontWeight:800,color:tonightGrade.col,lineHeight:1,marginBottom:8}}>{tonightScore}</div>
                <div style={{fontSize:17,fontWeight:700,color:tonightGrade.col,marginBottom:12}}>{tonightGrade.label}</div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>
                  {clouds < 30 ? "Clear skies — ideal for meteor watching" :
                   clouds < 60 ? "Partly cloudy — look for clear windows" :
                   "Heavy clouds — check nearby locations ↓"}
                </div>
              </div>
            </div>

            {/* ── Nearby clear-sky locations ── */}
            {isCloudyHere && nearby.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.18)",borderRadius:12,padding:"11px 16px",marginBottom:12,fontSize:13,color:"#fca5a5"}}>
                  ☁ {clouds}% cloud cover at {loc?.name}. Clearer spots within ~55 miles:
                </div>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${nearby.length},1fr)`,gap:10}}>
                  {nearby.map((n,i)=>{
                    const nc = n.clouds?.all ?? 0;
                    const ng = grade(calcScore({clouds:nc,pop:0,wind:n.wind?.speed??5}));
                    return (
                      <div key={i} style={{background:`${ng.col}0c`,border:`1px solid ${ng.col}28`,borderRadius:12,padding:16,textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:8}}>{n.name}</div>
                        <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:30,color:ng.col,marginBottom:2}}>{nc}%</div>
                        <div style={{fontSize:10,color:"#475569",marginBottom:8}}>cloud cover</div>
                        <div style={{fontSize:11,color:"#64748b",textTransform:"capitalize"}}>{n.weather?.[0]?.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 5-night forecast ── */}
            {days.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={LABEL}>5-night viewing forecast</div>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(days.length,5)},1fr)`,gap:10}}>
                  {days.map((day,i)=>{
                    const g = grade(day.score);
                    return (
                      <div key={i} style={{background:"rgba(255,255,255,.025)",border:`1px solid ${g.col}20`,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
                        <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{day.date}</div>
                        <div style={{fontFamily:"'SF Mono','Fira Code',monospace",fontSize:28,fontWeight:800,color:g.col,marginBottom:3}}>{day.score}</div>
                        <div style={{fontSize:10,color:g.col,marginBottom:10}}>{g.label}</div>
                        <div style={{fontSize:10,color:"#334155"}}>{day.clouds}% clouds</div>
                        {day.pop > 0 && <div style={{fontSize:10,color:"#334155"}}>{day.pop}% precip</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Empty / loading states ── */}
        {!wx && !busy && (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:44,marginBottom:14}}>🔭</div>
            <div style={{fontSize:14,color:"#334155"}}>Enter your location to see tonight's sky conditions</div>
          </div>
        )}
        {busy && (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:28,marginBottom:14,animation:"blink 1.4s ease-in-out infinite",display:"inline-block"}}>✦</div>
            <div style={{fontSize:14,color:"#334155"}}>Scanning the skies…</div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────
const LABEL = {
  fontFamily:"'SF Mono','Fira Code',monospace",
  fontSize:10,
  letterSpacing:"0.15em",
  textTransform:"uppercase",
  color:"#475569",
  marginBottom:16,
};

function clamp(min, max) {
  return `clamp(${min}px, 5vw, ${max}px)`;
}
