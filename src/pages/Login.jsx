import {useEffect,useState} from 'react'
import {useNavigate,useSearchParams} from 'react-router-dom'
import {supabase,configured} from '../lib/supabase'
import {useAuth} from '../lib/auth'
import Toast from '../components/Toast'
export default function Login(){const [q]=useSearchParams(),staff=q.get('staff'),nav=useNavigate(),{profile}=useAuth()
 const [signup,setSignup]=useState(false),[f,setF]=useState({name:'',email:'',password:''}),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{if(profile)nav(profile.role==='staff'?'/kitchen':'/student')},[profile,nav])
 async function submit(e){e.preventDefault();if(f.password.length<6)return setMsg('Password needs 6+ characters');setBusy(true)
  const r=signup?await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{name:f.name||'Student'}}}):await supabase.auth.signInWithPassword({email:f.email,password:f.password})
  setBusy(false);if(r.error)setMsg(r.error.message);else if(signup&&!r.data.session)setMsg('Check your email to confirm, then log in.')}
 return <div className="center"><form className="card auth" onSubmit={submit}><h2>{staff?'Staff login':signup?'Student sign up':'Student login'}</h2>
 {!configured&&<p className="err">Add Supabase keys to .env first.</p>}
 {signup&&!staff&&<input placeholder="Your name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/>}
 <input type="email" placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} required/>
 <input type="password" placeholder="Password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} required/>
 <button className="btn" disabled={busy}>{busy?'Please wait…':signup?'Sign up':'Log in'}</button>
 {!staff&&<button type="button" className="link" onClick={()=>setSignup(!signup)}>{signup?'Have an account? Log in':'New student? Sign up'}</button>}
 <Toast msg={msg} onClose={()=>setMsg('')}/></form></div>}
