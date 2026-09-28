import React from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import {AuthProvider,useAuth} from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Student from './pages/Student'
import Kitchen from './pages/Kitchen'
import './styles.css'
function Guard({role,children}){const {session,profile,loading}=useAuth()
 if(loading)return <div className="center">Loading…</div>
 if(!session)return <Navigate to="/login" replace/>
 if(role==='staff'&&profile?.role!=='staff')return <Navigate to="/student" replace/>
 return children}
createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><Routes>
 <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/>
 <Route path="/student" element={<Guard><Student/></Guard>}/><Route path="/kitchen" element={<Guard role="staff"><Kitchen/></Guard>}/>
 <Route path="*" element={<Navigate to="/"/>}/></Routes></AuthProvider></BrowserRouter>)
