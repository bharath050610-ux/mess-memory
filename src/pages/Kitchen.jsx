import {useEffect,useState,useCallback,useMemo} from 'react'
import {QRCodeSVG} from 'qrcode.react'
import {LineChart,Line,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer} from 'recharts'
import {supabase,today} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import {sum,pct,served,suggested} from '../lib/calc'
import Toast from '../components/Toast'
const num=v=>v!==''&&!isNaN(v)&&Number(v)>=0
const REASON_ROWS=[['Portion','Portion too large'],['Taste','Taste issue'],['Food','Food cold'],["Didn't","Didn't like dish"],['Other','Other']]
export default function Kitchen(){const {signOut}=useAuth()
 const [meals,setMeals]=useState([]),[recs,setRecs]=useState([]),[fbs,setFbs]=useState([]),[mid,setMid]=useState(''),[stats,setStats]=useState(null),[loading,setLoading]=useState(true),[msg,setMsg]=useState('')
 const [adj,setAdj]=useState(0),[buffer,setBuffer]=useState(()=>Number(localStorage.getItem('mm_buffer')||5)),[target,setTarget]=useState(()=>Number(localStorage.getItem('mm_target')||10)),[q,setQ]=useState('')
 const [nm,setNm]=useState({type:'lunch',menu:'Rice, Dal, Aloo Gobi'}),blank={dish:'',prep:'',unit:'kg',uns:'',att:'',plate:'',notes:''},[f,setF]=useState(blank)
 const load=useCallback(async()=>{setLoading(true)
  const [m,r,b]=await Promise.all([supabase.from('meals').select('*').order('date',{ascending:false}).limit(40),supabase.from('kitchen_records').select('*,meals(date,meal_type)').order('created_at',{ascending:false}).limit(400),supabase.from('feedback').select('reason,left_food')])
  const err=m.error||r.error||b.error;if(err)setMsg(err.message)
  setMeals(m.data||[]);setRecs(r.data||[]);setFbs(b.data||[]);setMid(p=>p||(m.data?.find(x=>x.date===today())||m.data?.[0])?.id||'');setLoading(false)},[])
 useEffect(()=>{load()},[load])
 useEffect(()=>{if(mid)supabase.rpc('meal_stats',{p_meal:mid}).then(({data})=>setStats(data))},[mid,recs])
 const mine=recs.filter(r=>r.meal_id===mid&&r.unit==='kg')
 const prep=sum(mine,'prepared_quantity'),uns=sum(mine,'unserved_quantity'),plate=sum(mine,'plate_waste'),total=uns+plate,att=Math.max(0,...mine.map(r=>r.actual_attendance))
 const noResp=stats?Math.max(0,stats.students-stats.eating-stats.skipping):0,expected=(stats?.eating||0)+Number(adj||0)
 const dishes=useMemo(()=>{const m={};recs.forEach(r=>{(m[r.dish_name]=m[r.dish_name]||[]).push(r)});return Object.entries(m).filter(([n])=>n.toLowerCase().includes(q.toLowerCase()))},[recs,q])
 const byDate=useMemo(()=>{const m={};recs.filter(r=>r.unit==='kg').forEach(r=>{const d=r.meals.date;m[d]=m[d]||{date:d,Unserved:0,'Plate waste':0};m[d].Unserved+=Number(r.unserved_quantity);m[d]['Plate waste']+=Number(r.plate_waste)});return Object.values(m).sort((a,b)=>a.date<b.date?-1:1)},[recs])
 const tw=d=>d.Unserved+d['Plate waste'],last7=byDate.slice(-7).reduce((s,d)=>s+tw(d),0),prev7=byDate.slice(-14,-7).reduce((s,d)=>s+tw(d),0),avoided=Math.max(0,prev7-last7)
 const leftFb=fbs.filter(x=>x.left_food),cnt=k=>leftFb.filter(x=>x.reason?.startsWith(k)).length
 async function addMeal(e){e.preventDefault();const menu=nm.menu.split(',').map(s=>s.trim()).filter(Boolean);if(!menu.length)return setMsg('Add at least one dish')
  const t={breakfast:['08:00','09:30'],lunch:['12:30','14:30'],dinner:['19:30','21:00']}[nm.type]
  const {error}=await supabase.from('meals').insert({date:today(),meal_type:nm.type,menu,start_time:t[0],end_time:t[1]});if(error)setMsg(error.message);else{setMsg('Meal published');load()}}
 async function save(e){e.preventDefault();if(!mid||!f.dish.trim())return setMsg('Choose a meal and dish')
  if(![f.prep,f.uns,f.att,f.plate].every(num))return setMsg('Numbers must be filled and not negative');if(Number(f.uns)>Number(f.prep))return setMsg('Unserved cannot exceed prepared')
  const {error}=await supabase.from('kitchen_records').insert({meal_id:mid,dish_name:f.dish.trim(),prepared_quantity:+f.prep,unit:f.unit,unserved_quantity:+f.uns,actual_attendance:parseInt(f.att),plate_waste:+f.plate,notes:f.notes||null});if(error)setMsg(error.message);else{setMsg('Record saved ✅');setF(blank);load()}}
 async function removeDemo(){if(!confirm('Delete all demo data?'))return;const {error}=await supabase.from('meals').delete().eq('is_demo',true);setMsg(error?error.message:'Demo data removed');load()}
 const F=(k,p,t='number')=><input type={t} min="0" step="any" placeholder={p} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>
 return <div className="wrap"><div className="bar"><b>🍱 Kitchen Dashboard</b><span><button className="link" onClick={load}>↻ Refresh</button><button className="link" onClick={signOut}>Log out</button></span></div>
 <select value={mid} onChange={e=>setMid(e.target.value)}>{meals.map(m=><option key={m.id} value={m.id}>{m.date} · {m.meal_type}{m.is_demo?' (demo)':''}</option>)}</select>
 {loading?<div className="skel"/>:<>
 <h2>Food waste for this meal (kg dishes)</h2><div className="grid">{[['Expected students',expected],['Actual students',att],['Prepared',prep.toFixed(1)+' kg'],['Served',(prep-uns).toFixed(1)+' kg'],['Unserved',uns.toFixed(1)+' kg'],['Plate waste',plate.toFixed(1)+' kg'],['Total waste',total.toFixed(1)+' kg'],['Waste / student',att?(total/att*1000).toFixed(0)+' g':'—']].map(([l,v])=><div className="card stat" key={l}><b>{v}</b><small>{l}</small></div>)}</div>
 <div className="card"><h3>Student responses (anonymous)</h3><p>Eating {stats?.eating??0} · Skipping {stats?.skipping??0} · No response {noResp} · Portions S/R/L: {stats?`${pct(stats.small,stats.eating)}/${pct(stats.regular,stats.eating)}/${pct(stats.large,stats.eating)}%`:'—'}</p>
 <label>No-response adjustment (estimated extra diners) <input type="number" value={adj} onChange={e=>setAdj(e.target.value)}/></label> <label>Safety buffer % <input type="number" min="0" value={buffer} onChange={e=>{setBuffer(+e.target.value);localStorage.setItem('mm_buffer',e.target.value)}}/></label></div>
 <h2>Recommendations</h2><input placeholder="Search dish…" value={q} onChange={e=>setQ(e.target.value)}/>
 {dishes.length===0&&<div className="card empty">No records yet. Enter kitchen data below.</div>}
 <div className="grid">{dishes.map(([n,rs])=>{const s=suggested(rs[0],expected,buffer),p=sum(rs,'prepared_quantity'),u=sum(rs,'unserved_quantity')
  return <div className="card" key={n}><h3>{n}</h3>{s!==null?<p className="big">Recommended preparation: {s.toFixed(1)} {rs[0].unit}</p>:<p>Not enough data</p>}
  <small>Based on recent consumption ({(served(rs[0])/rs[0].actual_attendance||0).toFixed(3)} {rs[0].unit}/student) and expected attendance {expected}. Review before confirming.</small>
  {rs.length>=3&&p>0&&u/p>0.1&&<p className="warn">Unserved food averages {pct(u,p)}% of prepared: consider reducing preparation quantity.</p>}</div>})}</div>
 {leftFb.length>0&&<div className="card"><h3>Feedback insights ({leftFb.length} plates left food)</h3>{REASON_ROWS.map(([k,l])=><div key={k}>{l}: {cnt(k)}<div className="prog"><i style={{width:pct(cnt(k),leftFb.length)+'%'}}/></div></div>)}
 {cnt('Portion')/leftFb.length>0.3&&<p className="warn">Many students say portions are too large: consider smaller first servings with optional refills.</p>}
 {cnt('Taste')/leftFb.length>0.3&&<p className="warn">Taste feedback is high: review feedback with the kitchen team.</p>}</div>}
 <h2>Waste over time (kg)</h2><div className="card" style={{height:280}}><ResponsiveContainer><LineChart data={byDate}><XAxis dataKey="date"/><YAxis/><Tooltip/><Legend/><Line dataKey="Unserved" stroke="#f28c28" strokeWidth={3}/><Line dataKey="Plate waste" stroke="#2f7d4f" strokeWidth={3}/></LineChart></ResponsiveContainer></div>
 <div className="card"><h3>♻️ Waste Impact</h3><p>Calculated from recorded data: last 7 recorded days {last7.toFixed(1)} kg vs previous 7 days {prev7.toFixed(1)} kg. The mess avoided <b>{avoided.toFixed(1)} kg</b> of waste.</p>
 <label>Weekly reduction target (kg) <input type="number" min="1" value={target} onChange={e=>{setTarget(+e.target.value||1);localStorage.setItem('mm_target',e.target.value)}}/></label><div className="prog"><i style={{width:Math.min(100,pct(avoided,target))+'%'}}/></div><small>{Math.min(100,pct(avoided,target))}% of target · {new Set(recs.map(r=>r.meal_id)).size} meals tracked</small></div>
 <div className="grid"><form className="card" onSubmit={save}><h3>Enter kitchen data</h3><select value={f.dish} onChange={e=>setF({...f,dish:e.target.value})}><option value="">Dish…</option>{(meals.find(m=>m.id===mid)?.menu||[]).map(d=><option key={d}>{d}</option>)}</select>
 {F('prep','Prepared quantity')}<select value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}><option>kg</option><option>litres</option><option>portions</option></select>{F('uns','Unserved quantity')}{F('att','Actual attendance')}{F('plate','Plate waste')}{F('notes','Notes','text')}<button className="btn full">Save record</button></form>
 <form className="card" onSubmit={addMeal}><h3>Publish today's meal</h3><select value={nm.type} onChange={e=>setNm({...nm,type:e.target.value})}><option>breakfast</option><option>lunch</option><option>dinner</option></select><input value={nm.menu} onChange={e=>setNm({...nm,menu:e.target.value})} placeholder="Comma-separated dishes"/><button className="btn full">Publish meal</button>
 <h3>Invite Students</h3><QRCodeSVG value={window.location.origin+'/student'} size={130}/><small>Scan to tell the mess you're eating.</small><button type="button" className="link" onClick={removeDemo}>Remove demo data</button></form></div></>}
 <Toast msg={msg} onClose={()=>setMsg('')}/></div>}
