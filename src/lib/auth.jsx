import {createContext,useContext,useEffect,useState} from 'react'
import {supabase} from './supabase'
const Ctx=createContext(null)
export const useAuth=()=>useContext(Ctx)
export function AuthProvider({children}){
 const [session,setSession]=useState(undefined),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true)
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session)).catch(()=>setSession(null))
  const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>l.subscription.unsubscribe()},[])
 useEffect(()=>{if(session===undefined)return
  if(!session){setProfile(null);setLoading(false);return}
  supabase.from('profiles').select('*').eq('id',session.user.id).single().then(({data})=>{setProfile(data);setLoading(false)})},[session])
 return <Ctx.Provider value={{session,profile,loading,signOut:()=>supabase.auth.signOut()}}>{children}</Ctx.Provider>}
