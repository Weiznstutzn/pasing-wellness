export async function onRequestGet({env}){
  return Response.json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||null},{headers:{'cache-control':'no-store'}});
}
