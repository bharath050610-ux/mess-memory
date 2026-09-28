import {useEffect} from 'react'
export default function Toast({msg,onClose}){useEffect(()=>{if(!msg)return;const t=setTimeout(onClose,3500);return()=>clearTimeout(t)},[msg,onClose]);return msg?<div className="toast" role="status">{msg}</div>:null}
