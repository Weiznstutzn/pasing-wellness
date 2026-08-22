import { json, sha256 } from '../_common.js';
function munichNowParts(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  return Object.fromEntries(parts.map(p=>[p.type,p.value]));
}
function minutesUntil(date,time){
  // Safe enough for the 24h rule: construct local appointment and compare using timezone offset via Intl search.
  const targetLabel=`${date}T${time}`; let lo=Date.now()-86400000, hi=Date.now()+20*86400000;
  for(let i=0;i<45;i++){const mid=Math.floor((lo+hi)/2);const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(mid)).replace(' ','T'); if(p<targetLabel)lo=mid+1;else hi=mid;}
  return (hi-Date.now())/60000;
}
export async function onRequestPost({request,env}){
  if(!env.DB)return json({error:'Buchungsdatenbank ist nicht verbunden.'},503);
  let body;try{body=await request.json()}catch{return json({error:'Ungültige Anfrage.'},400)}
  const token=String(body.token||'');if(token.length<30)return json({error:'Ungültiger Stornierungslink.'},400);const hash=await sha256(token);
  const b=await env.DB.prepare("SELECT id,date,start_time,status FROM bookings WHERE cancellation_token_hash=?").bind(hash).first();
  if(!b)return json({error:'Buchung wurde nicht gefunden.'},404); if(b.status==='cancelled')return json({ok:true,alreadyCancelled:true});
  if(minutesUntil(b.date,b.start_time)<24*60)return json({error:'Online-Stornierungen sind nur bis 24 Stunden vor Terminbeginn möglich.'},403);
  await env.DB.prepare("UPDATE bookings SET status='cancelled',cancelled_at=? WHERE id=? AND status='confirmed'").bind(new Date().toISOString(),b.id).run();
  return json({ok:true});
}
