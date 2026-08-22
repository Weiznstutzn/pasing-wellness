import { validateSelection, OPENING, BUFFER, SLOT_STEP, json } from '../_common.js';
export async function onRequestGet({request,env}){
  if(!env.DB)return json({error:'Buchungsdatenbank ist noch nicht verbunden.'},503);
  const u=new URL(request.url), date=u.searchParams.get('date'), service=u.searchParams.get('service'), duration=Number(u.searchParams.get('duration')), addon=u.searchParams.get('addon')==='1';
  const base=validateSelection({service,duration,addon,date,time:'00:00'},env);
  // validateSelection checks a time; determine opening separately and validate each candidate.
  const dp=(()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date||'');if(!m)return null;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return {weekday:d.getUTCDay()}})();
  if(!dp||!OPENING[dp.weekday])return json({times:[]});
  const bookings=await env.DB.prepare("SELECT start_minute, blocked_end_minute FROM bookings WHERE date=? AND status='confirmed'").bind(date).all();
  const rows=bookings.results||[], treatment=duration+(addon?30:0), [open,close]=OPENING[dp.weekday], times=[];
  for(let start=open; start+treatment<=close; start+=SLOT_STEP){
    const time=`${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')}`;
    const check=validateSelection({service,duration,addon,date,time},env); if(check.error)continue;
    const overlap=rows.some(b=>start < Number(b.blocked_end_minute) && Number(b.start_minute) < start+treatment+BUFFER);
    if(!overlap) times.push(time);
  }
  return json({times});
}
