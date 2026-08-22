import { validateSelection, json, sha256, escapeHtml } from '../_common.js';
async function verifyTurnstile(env,token,ip){
  if(!env.TURNSTILE_SECRET)return true;
  if(!token)return false;
  const fd=new FormData();fd.append('secret',env.TURNSTILE_SECRET);fd.append('response',token);if(ip)fd.append('remoteip',ip);
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:fd});const d=await r.json();return !!d.success;
}
async function sendEmail(env,{to,subject,html,replyTo}){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)throw new Error('E-Mail-Versand ist noch nicht konfiguriert.');
  const payload={from:env.EMAIL_FROM,to:[to],subject,html};if(replyTo)payload.reply_to=replyTo;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('E-Mail konnte nicht versendet werden.');
}
function deDate(date){const [y,m,d]=date.split('-');return `${d}.${m}.${y}`}
export async function onRequestPost({request,env}){
  if(!env.DB)return json({error:'Buchungsdatenbank ist noch nicht verbunden.'},503);
  let body;try{body=await request.json()}catch{return json({error:'Ungültige Anfrage.'},400)}
  const sel=validateSelection(body,env);if(sel.error)return json({error:sel.error},400);
  const name=String(body.name||'').trim().slice(0,120), email=String(body.email||'').trim().toLowerCase().slice(0,180), phone=String(body.phone||'').trim().slice(0,80), note=String(body.note||'').trim().slice(0,1500);
  if(!name||!phone||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Bitte Name, E-Mail und Telefonnummer vollständig angeben.'},400);
  const human=await verifyTurnstile(env,body.turnstileToken,request.headers.get('CF-Connecting-IP'));if(!human)return json({error:'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.'},400);
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return json({error:'Der E-Mail-Versand ist noch nicht vollständig eingerichtet.'},503);

  let price=sel.serviceData.prices[sel.duration], promo=false; const firstVisit=!!body.firstVisit;
  if(sel.service==='full'&&sel.duration===60&&firstVisit){price=59;promo=true} if(sel.addon)price+=25;
  const id=crypto.randomUUID(), token=crypto.randomUUID()+'-'+crypto.randomUUID(), tokenHash=await sha256(token), created=new Date().toISOString();
  const insert=await env.DB.prepare(`INSERT INTO bookings (id,created_at,date,start_time,start_minute,treatment_minutes,blocked_end_minute,service_key,service_name,base_duration,addon_ear_candles,first_visit,price_eur,customer_name,customer_email,customer_phone,customer_note,cancellation_token_hash,status)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'confirmed' WHERE NOT EXISTS (
      SELECT 1 FROM bookings WHERE date=? AND status='confirmed' AND start_minute < ? AND ? < blocked_end_minute
    )`).bind(id,created,sel.date,sel.time,sel.start,sel.treatment,sel.blockedEnd,sel.service,sel.serviceData.name,sel.duration,sel.addon?1:0,firstVisit?1:0,price,name,email,phone,note||null,tokenHash,sel.date,sel.blockedEnd,sel.start).run();
  if(!insert.success||!insert.meta?.changes)return json({error:'Dieser Termin wurde gerade vergeben.'},409);

  const origin=new URL(request.url).origin, cancelUrl=`${origin}/stornieren.html?token=${encodeURIComponent(token)}`;
  const addonLine=sel.addon?'<p><strong>Zusatz:</strong> Ohrenkerzenbehandlung · 30 Min. · 25 €</p>':'';
  const promoLine=promo?'<p><strong>Eröffnungsangebot:</strong> Neukundenpreis berücksichtigt.</p>':'';
  const customerHtml=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#3e2c24"><h2>Ihr Termin bei Pasing Wellness ist gebucht</h2><p>Vielen Dank, ${escapeHtml(name)}.</p><p><strong>${escapeHtml(sel.serviceData.name)}</strong><br>${sel.duration} Minuten${sel.addon?' + 30 Minuten Ohrenkerzen':''}<br><strong>${deDate(sel.date)} · ${sel.time} Uhr</strong><br>Preis: ${price} € · Barzahlung vor Ort</p>${addonLine}${promoLine}<p>Adresse:<br><strong>Balance Flow<br>Bodenseestraße 73c<br>81243 München-Pasing</strong></p><p>Eine Stornierung ist bis 24 Stunden vor Terminbeginn möglich:</p><p><a href="${cancelUrl}">Termin stornieren</a></p><p>Viele Grüße<br>Pasing Wellness</p></div>`;
  const operator=env.OPERATOR_EMAIL||'stark.stefan@gmx.net';
  const operatorHtml=`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Neue Buchung – Pasing Wellness</h2><p><strong>${escapeHtml(sel.serviceData.name)}</strong><br>${sel.duration} Min.${sel.addon?' + Ohrenkerzen 30 Min.':''}<br><strong>${deDate(sel.date)} · ${sel.time} Uhr</strong><br>Blockiert inkl. Puffer bis ${String(Math.floor(sel.blockedEnd/60)).padStart(2,'0')}:${String(sel.blockedEnd%60).padStart(2,'0')} Uhr<br>Preis: ${price} €</p><p><strong>Kunde:</strong> ${escapeHtml(name)}<br><strong>Telefon:</strong> ${escapeHtml(phone)}<br><strong>E-Mail:</strong> ${escapeHtml(email)}<br><strong>Neukunde:</strong> ${firstVisit?'Ja':'Nein'}</p>${note?`<p><strong>Nachricht:</strong><br>${escapeHtml(note).split('\n').join('<br>')}</p>`:''}</div>`;
  try{
    await sendEmail(env,{to:operator,subject:`Neue Buchung: ${deDate(sel.date)} ${sel.time} – ${sel.serviceData.name}`,html:operatorHtml,replyTo:email});
    await sendEmail(env,{to:email,subject:`Ihre Buchung bei Pasing Wellness am ${deDate(sel.date)}`,html:customerHtml,replyTo:operator});
  }catch(e){
    // Booking remains valid even if email provider has a transient failure; operator can still see it in D1.
    console.error('Mail error',e);
    return json({ok:true,id,emailWarning:true});
  }
  return json({ok:true,id});
}
