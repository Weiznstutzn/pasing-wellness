import { json, sha256, escapeHtml } from '../_common.js';

function minutesUntil(date,time){
  // Appointment is interpreted in Europe/Berlin so the 24-hour cancellation rule also works across DST changes.
  const targetLabel=`${date}T${time}`; let lo=Date.now()-86400000, hi=Date.now()+20*86400000;
  for(let i=0;i<45;i++){
    const mid=Math.floor((lo+hi)/2);
    const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(mid)).replace(' ','T');
    if(p<targetLabel)lo=mid+1;else hi=mid;
  }
  return (hi-Date.now())/60000;
}

function deDate(date){const [y,m,d]=date.split('-');return `${d}.${m}.${y}`}

async function sendEmail(env,{to,subject,html,replyTo}){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)throw new Error('E-Mail-Versand ist noch nicht konfiguriert.');
  const payload={from:env.EMAIL_FROM,to:[to],subject,html};
  if(replyTo)payload.reply_to=replyTo;
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  if(!r.ok){
    const detail=await r.text().catch(()=> '');
    console.error('Resend error',r.status,detail);
    throw new Error('E-Mail konnte nicht versendet werden.');
  }
}

export async function onRequestPost({request,env}){
  if(!env.DB)return json({error:'Buchungsdatenbank ist nicht verbunden.'},503);
  let body;try{body=await request.json()}catch{return json({error:'Ungültige Anfrage.'},400)}
  const token=String(body.token||'');
  if(token.length<30)return json({error:'Ungültiger Stornierungslink.'},400);
  const hash=await sha256(token);

  const b=await env.DB.prepare(`SELECT id,date,start_time,status,service_name,base_duration,addon_ear_candles,price_eur,customer_name,customer_email,customer_phone
    FROM bookings WHERE cancellation_token_hash=?`).bind(hash).first();
  if(!b)return json({error:'Buchung wurde nicht gefunden.'},404);
  if(b.status==='cancelled')return json({ok:true,alreadyCancelled:true});
  if(minutesUntil(b.date,b.start_time)<24*60)return json({error:'Online-Stornierungen sind nur bis 24 Stunden vor Terminbeginn möglich.'},403);

  const cancelledAt=new Date().toISOString();
  const update=await env.DB.prepare("UPDATE bookings SET status='cancelled',cancelled_at=? WHERE id=? AND status='confirmed'").bind(cancelledAt,b.id).run();
  if(!update.success||!update.meta?.changes)return json({ok:true,alreadyCancelled:true});

  const operator=env.OPERATOR_EMAIL||'stark.stefan@gmx.net';
  const addon=b.addon_ear_candles?'<p><strong>Zusatz:</strong> Ohrenkerzenbehandlung · 30 Min. · 25 €</p>':'';
  const durationText=`${b.base_duration} Minuten${b.addon_ear_candles?' + 30 Minuten Ohrenkerzen':''}`;
  const customerHtml=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#3e2c24"><h2>Ihr Termin bei Pasing Wellness wurde storniert</h2><p>Hallo ${escapeHtml(b.customer_name)},</p><p>Ihre Stornierung war erfolgreich.</p><p><strong>${escapeHtml(b.service_name)}</strong><br>${durationText}<br><strong>${deDate(b.date)} · ${escapeHtml(b.start_time)} Uhr</strong><br>Preis: ${b.price_eur} € · Barzahlung vor Ort</p>${addon}<p>Der Termin ist wieder für andere Kunden freigegeben.</p><p>Wenn Sie einen neuen Termin wünschen, können Sie jederzeit über unsere Website erneut buchen.</p><p>Viele Grüße<br>Pasing Wellness</p></div>`;
  const operatorHtml=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#3e2c24"><h2>Termin storniert – Pasing Wellness</h2><p><strong>${escapeHtml(b.service_name)}</strong><br>${durationText}<br><strong>${deDate(b.date)} · ${escapeHtml(b.start_time)} Uhr</strong><br>Preis: ${b.price_eur} €</p><p><strong>Kunde:</strong> ${escapeHtml(b.customer_name)}<br><strong>Telefon:</strong> ${escapeHtml(b.customer_phone)}<br><strong>E-Mail:</strong> ${escapeHtml(b.customer_email)}</p><p>Der Zeitraum wurde wieder für neue Buchungen freigegeben.</p></div>`;

  let emailWarning=false;
  try{
    await sendEmail(env,{to:b.customer_email,subject:`Ihre Stornierung bei Pasing Wellness am ${deDate(b.date)}`,html:customerHtml,replyTo:operator});
    await sendEmail(env,{to:operator,subject:`Stornierung: ${deDate(b.date)} ${b.start_time} – ${b.service_name}`,html:operatorHtml,replyTo:b.customer_email});
  }catch(e){
    // The cancellation remains valid even if the mail provider has a transient problem.
    console.error('Cancellation mail error',e);
    emailWarning=true;
  }

  return json({ok:true,emailWarning});
}
