const menu=document.querySelector('.menu'),mobile=document.querySelector('.mobile-nav');
menu?.addEventListener('click',()=>mobile.classList.toggle('open'));
mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobile.classList.remove('open')));
document.querySelectorAll('[data-placeholder="true"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const n=document.querySelector('.notice');n.classList.add('show');setTimeout(()=>n.classList.remove('show'),3200)}));
