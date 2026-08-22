export const SERVICES = {
  wellness: {name:'Wellness- & Entspannungsmassage', prices:{60:65,90:90,120:120}},
  full: {name:'Ganzkörpermassage', prices:{60:70,90:95,120:125}},
  aroma: {name:'Thai-Aromaölmassage', prices:{60:70,90:95,120:125}},
  thai: {name:'Thai-Massage', prices:{60:75,90:105,120:135}}
};
export const BUFFER=15, SLOT_STEP=15;
export const OPENING={0:[10*60,16*60],1:[14*60,20*60],2:[14*60,20*60]};
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
export function parseTime(v){if(!/^\d{2}:\d{2}$/.test(v||''))return null;const [h,m]=v.split(':').map(Number);if(h>23||m>59)return null;return h*60+m}
export function localDateParts(dateStr){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr||'');if(!m)return null;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));if(d.getUTCFullYear()!=+m[1]||d.getUTCMonth()!=+m[2]-1||d.getUTCDate()!=+m[3])return null;return {y:+m[1],mo:+m[2],d:+m[3],weekday:d.getUTCDay()}}
export function todayMunich(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export function daysBetween(a,b){const A=Date.parse(a+'T00:00:00Z'),B=Date.parse(b+'T00:00:00Z');return Math.round((B-A)/86400000)}
export function validateSelection({service,duration,addon,date,time}, env){
  if(!SERVICES[service])return {error:'Unbekannte Behandlung.'}; duration=Number(duration); if(![60,90,120].includes(duration))return {error:'Ungültige Behandlungsdauer.'};
  const dp=localDateParts(date); if(!dp||!OPENING[dp.weekday])return {error:'An diesem Tag sind keine Online-Termine verfügbar.'};
  const today=todayMunich(), delta=daysBetween(today,date); if(delta<0||delta>14)return {error:'Termine sind maximal 14 Tage im Voraus buchbar.'};
  if(env.BOOKING_START_DATE && date < env.BOOKING_START_DATE)return {error:'Die Online-Terminbuchung ist für dieses Datum noch nicht freigeschaltet.'};
  const start=parseTime(time); if(start===null)return {error:'Ungültige Startzeit.'};
  if(date===today){ const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()); const vals=Object.fromEntries(parts.map(p=>[p.type,p.value])); const nowMin=Number(vals.hour)*60+Number(vals.minute); if(start<=nowMin)return {error:'Dieser Termin liegt bereits in der Vergangenheit.'}; }
  if(start%SLOT_STEP!==0)return {error:'Ungültige Startzeit.'};
  const treatment=duration+(addon?30:0), [open,close]=OPENING[dp.weekday]; if(start<open||start+treatment>close)return {error:'Der Termin liegt außerhalb der Behandlungszeiten.'};
  return {service,duration,addon:!!addon,date,time,start,treatment,blockedEnd:start+treatment+BUFFER,serviceData:SERVICES[service]};
}
export function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
export async function sha256(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
