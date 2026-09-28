import {useEffect,useState,useCallback} from 'react'
import {supabase,today} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import {pct} from '../lib/calc'
import Toast from '../components/Toast'
const REASONS=['Portion was too large','Taste issue','Food was cold',"Didn't like the dish",'Other']
export default function Student(){const {session,signOut}=useAuth(),uid=session.user.id
 const [meals,setMeals]=useState(null),[mid,setMid]=useState(null),[stats,setStats]=useState(null),[eat,setEat]=useState(null),[portion,setPortion]=useState('regular'),[done,setDone]=useState(false)
 const [fb,setFb]=useState({left:null,reason:'',comment:''}),[fbDone,setFbDone]=useState(false),[msg,setMsg]=useState('')
 const meal=meals?.find(m=>m.id===mid)
 useEffect(()=>{supabase.from('meals').select('*').eq('date',today()).order('start_time').then(({data,error})=>{if(error)setMsg(error.message);setMeals(data||[]);if(data?.length)setMid(data[0].id)})},[])
 const loadStats=useCallback(()=>{if(mid)supabase.rpc('meal_stats',{p_meal:mid}).then(({data})=>setStats(data))},[mid])
 useEffect(()=>{if(!mid)return;loadStats();setDone(false);setEat(null);setFbDone(false)
  supabase.from('student_responses').select('*').eq('meal_id',mid).eq('student_id',uid).maybeSingle().then(({data})=>{if(data){setEat(data.will_eat);setPortion(data.portion_size||'regular');setDone(true)}})},[mid,uid,loadStats])
 async function submit(){const {error}=await supabase.from('student_responses').upsert({meal_id:mid,student_id:uid,will_eat:eat,portion_size:eat?portion:null},{onConflict:'meal_id,student_id'})
  if(error)return setMsg(error.message);setDone(true);loadStats()}
 async function sendFb(){if(fb.left===null)return setMsg('Please choose Yes or No');if(fb.left&&!fb.reason)return setMsg('Please pick a reason')
  const {error}=await supabase.from('feedback').insert({meal_id:mid,student_id:uid,left_food:fb.left,reason:fb.left?fb.reason:null,comment:fb.comment||null});if(error)setMsg(error.message);else setFbDone(true)}
 const noResp=stats?Math.max(0,stats.students-stats.eating-stats.skipping):0
 return <div className="wrap narrow"><div className="bar"><b>🍱 Mess Memory</b><button className="link" onClick={signOut}>Log out</button></div>
 {meals===null&&<div className="skel"/>}
 {meals?.length===0&&<div className="card empty">🍽️ No meal has been published for today yet.</div>}
 {meal&&<><div className="tabs">{meals.map(m=><button key={m.id} className={m.id===mid?'on':''} onClick={()=>setMid(m.id)}>{m.meal_type}</button>)}</div>
 <div className="card"><h2>Today's Meal · {meal.meal_type}</h2><p>{meal.date} · {meal.start_time?.slice(0,5)}–{meal.end_time?.slice(0,5)}</p><p className="chips">{meal.menu.map(d=><span key={d}>{d}</span>)}</p>
 {done?<div className="ok">✅ Thanks! Your response helps the kitchen prepare smarter. <button className="link" onClick={()=>setDone(false)}>Change</button></div>:<>
 <h3>Are you eating this meal?</h3><div className="row"><button className={'btn '+(eat===true?'':'alt')} onClick={()=>setEat(true)}>Yes, I'll eat</button><button className={'btn '+(eat===false?'':'alt')} onClick={()=>setEat(false)}>No, I'll skip</button></div>
 {eat&&<><h3>How much would you like?</h3><div className="row">{['small','regular','large'].map(p=><button key={p} className={'btn '+(portion===p?'':'alt')} onClick={()=>setPortion(p)}>{p}</button>)}</div></>}
 {eat!==null&&<button className="btn full" onClick={submit}>Submit response</button>}</>}</div>
 {stats&&<div className="card"><h3>Our Mess Today</h3><p>{stats.eating} students planning to eat</p>
 {[['Eating',stats.eating],['Skipping',stats.skipping],['No response',noResp]].map(([l,n])=><div key={l}>{l} {pct(n,stats.students)}%<div className="prog"><i style={{width:pct(n,stats.students)+'%'}}/></div></div>)}
 <h4>Portion preference</h4><p>{['small','regular','large'].map(p=>`${p}: ${pct(stats[p],stats.eating)}%`).join(' · ')}</p></div>}
 <div className="card"><h3>After the meal</h3>{fbDone?<div className="ok">💚 Thank you for your feedback!</div>:<><p>Did you leave any food?</p>
 <div className="row"><button className={'btn '+(fb.left===false?'':'alt')} onClick={()=>setFb({...fb,left:false})}>No</button><button className={'btn '+(fb.left?'':'alt')} onClick={()=>setFb({...fb,left:true})}>Yes</button></div>
 {fb.left&&<><p>Why did you leave food?</p><select value={fb.reason} onChange={e=>setFb({...fb,reason:e.target.value})}><option value="">Select…</option>{REASONS.map(r=><option key={r}>{r}</option>)}</select></>}
 <textarea placeholder="Optional comments" value={fb.comment} onChange={e=>setFb({...fb,comment:e.target.value})}/><button className="btn full" onClick={sendFb}>Send feedback</button></>}</div></>}
 <Toast msg={msg} onClose={()=>setMsg('')}/></div>}
