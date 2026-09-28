import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {supabase} from '../lib/supabase'
export default function Landing(){const [s,setS]=useState(null)
 useEffect(()=>{supabase.rpc('public_stats').then(({data})=>setS(data))},[])
 const cards=[['🍽️','Kitchen records tracked',s?.meals],['🎓','Students participating',s?.students],['♻️','kg waste measured',s&&Math.round(s.waste)]]
 return <div><header className="hero"><div className="logo">🍱🧠</div><h1>Mess Memory</h1><p className="tag">Smarter meals. Less waste. Better mess.</p>
 <p>Messes cook by guesswork. Food is left in the pot <b>and</b> on plates. Mess Memory predicts attendance, learns portions and tells the kitchen what to cook.</p>
 <div className="row"><Link className="btn" to="/login">I'm a Student</Link><Link className="btn alt" to="/login?staff=1">Kitchen Dashboard</Link></div></header>
 <section className="grid wrap">{cards.map(([i,l,v])=><div className="card stat" key={l}><span>{i}</span><b>{v??'—'}</b><small>{l}</small></div>)}</section>
 <section className="wrap"><h2>How it works</h2><div className="grid">{['Students answer: eating? what portion?','Kitchen sees expected attendance','Staff logs prepared, unserved, plate waste',"Mess Memory recommends tomorrow's quantity"].map((t,i)=><div className="card" key={t}><b className="num">{i+1}</b><p>{t}</p></div>)}</div>
 <h2>Why it matters</h2><p>Unserved food (left in the kitchen) and plate waste (left by students) are different problems, so we track them separately.</p></section>
 <footer>Mess Memory · built for a hackathon 🌱</footer></div>}
