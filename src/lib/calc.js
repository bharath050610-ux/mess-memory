export const sum=(a,k)=>a.reduce((s,x)=>s+Number(x[k]||0),0)
export const pct=(n,t)=>t?Math.round(100*n/t):0
// Served = prepared - unserved
export const served=r=>r.prepared_quantity-r.unserved_quantity
// Suggested = expected attendance x (served / actual attendance) x (1 + buffer%)
export const suggested=(r,expected,buffer)=>r.actual_attendance>0?(served(r)/r.actual_attendance)*expected*(1+buffer/100):null
