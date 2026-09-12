const defaultApps=[
  {id:"netflix",name:"NETFLIX",icon:"N",category:"STREAMING",description:"Basic • VIP • Reseller",
    tiers:[["BASIC","Rp5.000",true],["VIP","Rp10.000",true],["RESELLER","Rp25.000",true]]},
  {id:"canva",name:"CANVA",icon:"C",category:"DESIGN",description:"Basic • VIP",
    tiers:[["BASIC","Rp5.000",true],["VIP","Rp10.000",true]]},
  {id:"alight-motion",name:"ALIGHT MOTION",icon:"A",category:"EDITING",description:"VIP 1 Tahun • Generator APK",
    tiers:[["VIP 1 TAHUN","Rp2.000",true],["GENERATOR APK","Rp15.000",true]]}
];
let apps=load(),admin=false;
function load(){
  try{
    let x=localStorage.getItem("ndrex_apps");
    if(x) return JSON.parse(x);
    let old=localStorage.getItem("ndrex_products");
    if(old){
      let o=JSON.parse(old);
      return Object.entries(o).map(([name,tiers])=>{
        let d=defaultApps.find(a=>a.name===name);
        return {id:d?d.id:slugify(name),name,icon:d?d.icon:name[0].toUpperCase(),category:d?d.category:"PRODUK",description:d?d.description:"",tiers};
      });
    }
    return structuredClone(defaultApps);
  }catch{return structuredClone(defaultApps)}
}
function slugify(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||("app-"+Date.now())}
function type(){let s="NDREX PROJECT",i=0,e=document.getElementById("typingText");(function t(){if(i<s.length){e.textContent+=s[i++];setTimeout(t,105)}})()}

/* ===== SPACE DOOR INTRO ===== */
const doorIntro = document.getElementById("doorIntro");
function openDoors(){
  if(!doorIntro){ type(); return; }
  requestAnimationFrame(()=>doorIntro.classList.add("opening"));
  setTimeout(()=>{
    doorIntro.style.display="none";
    type();
  },1150);
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",openDoors);
}else{
  openDoors();
}

function goToStore(){document.getElementById("slide1").style.display="none";document.getElementById("slide2").classList.add("show");window.scrollTo(0,0)}

function renderProductGrid(){
  const grid=document.getElementById("productGrid");
  if(!grid) return;
  grid.innerHTML="";
  if(!apps.length){
    grid.innerHTML=`<div class="grid-empty">Belum ada aplikasi. Tambahkan lewat panel admin.</div>`;
    return;
  }
  apps.forEach(a=>{
    const b=document.createElement("button");
    b.className="product-card";
    b.onclick=()=>openTiers(a.id);
    b.innerHTML=`<div class="icon">${esc(a.icon||a.name[0]||"?")}</div><small>${esc(a.category||"PRODUK")}</small><h3>${esc(a.name)}</h3><p>${esc(a.description||"")}</p><b>→</b>`;
    grid.appendChild(b);
  });
}

function openTiers(id){
  const a=apps.find(x=>x.id===id);
  if(!a) return;
  modal("tierModal");
  document.getElementById("modalTitle").textContent=a.name;
  let l=document.getElementById("tierList");l.innerHTML="";
  if(!a.tiers.length){l.innerHTML=`<p class="note">Belum ada tier untuk produk ini.</p>`;return}
  a.tiers.forEach(x=>{let b=document.createElement("button");b.className="tier";b.disabled=!x[2];b.innerHTML=`<span>${esc(x[0])}</span><span class="tier-price">${esc(x[1])}${x[2]?"":" • HABIS"}</span>`;if(x[2])b.onclick=openPayment;l.appendChild(b)})
}
function modal(id){document.getElementById(id).classList.add("show")}
function closeModal(){document.getElementById("tierModal").classList.remove("show")}
function openPayment(){closeModal();modal("paymentModal")} function closePayment(){document.getElementById("paymentModal").classList.remove("show")}
async function copyNumber(){try{await navigator.clipboard.writeText("085718558667");document.getElementById("copyStatus").textContent=" Tersalin ✓"}catch{}setTimeout(()=>document.getElementById("copyStatus").textContent="",1800)}
function openAdminLogin(){document.getElementById("adminPassword").value="";document.getElementById("adminError").textContent="";modal("adminLoginModal")}
function closeAdminLogin(){document.getElementById("adminLoginModal").classList.remove("show")}
function loginAdmin(){if(document.getElementById("adminPassword").value!=="ndrex123"){document.getElementById("adminError").textContent="Password salah.";return}admin=true;closeAdminLogin();renderAdmin();modal("adminModal")}

function renderAdmin(){
  const c=document.getElementById("adminProducts");
  c.innerHTML="";
  if(!apps.length){
    c.innerHTML=`<p class="note">Belum ada aplikasi. Klik "+ Tambah Aplikasi" di bawah.</p>`;
  }
  apps.forEach((a,ai)=>{
    const s=document.createElement("div");
    s.className="admin-section";
    s.innerHTML=`
      <div class="admin-app-head">
        <div class="admin-icon-preview">${esc((a.icon||"?").slice(0,2))}</div>
        <div class="admin-app-fields">
          <input class="aa-name" data-ai="${ai}" placeholder="Nama aplikasi" value="${esc(a.name)}">
          <div class="admin-app-sub">
            <input class="aa-cat" data-ai="${ai}" placeholder="Kategori" value="${esc(a.category)}">
            <input class="aa-icon" data-ai="${ai}" placeholder="Ikon" maxlength="2" value="${esc(a.icon)}">
          </div>
        </div>
        <button type="button" class="app-delete" title="Hapus aplikasi" onclick="deleteApp(${ai})">×</button>
      </div>
      <input class="aa-desc" data-ai="${ai}" placeholder="Deskripsi singkat (mis. Basic • VIP)" value="${esc(a.description)}">
      <div class="tier-edit-list" data-ai="${ai}"></div>
      <button type="button" class="add-tier-btn" onclick="addTier(${ai})">+ Tambah Tier</button>
    `;
    const tierWrap=s.querySelector(".tier-edit-list");
    a.tiers.forEach((x,i)=>{
      const row=document.createElement("div");
      row.className="admin-row";
      row.innerHTML=`<input class="an" data-ai="${ai}" data-i="${i}" value="${esc(x[0])}" placeholder="Nama tier"><input class="ap" data-ai="${ai}" data-i="${i}" value="${esc(x[1])}" placeholder="Harga"><label class="admin-stock"><input type="checkbox" class="as" data-ai="${ai}" data-i="${i}" ${x[2]?"checked":""}> STOK</label><button type="button" class="tier-delete" title="Hapus tier" onclick="deleteTier(${ai},${i})">×</button>`;
      tierWrap.appendChild(row);
    });
    c.appendChild(s);
  });
}

function syncFromDOM(){
  document.querySelectorAll(".aa-name").forEach(e=>apps[e.dataset.ai].name=e.value);
  document.querySelectorAll(".aa-cat").forEach(e=>apps[e.dataset.ai].category=e.value);
  document.querySelectorAll(".aa-icon").forEach(e=>apps[e.dataset.ai].icon=e.value);
  document.querySelectorAll(".aa-desc").forEach(e=>apps[e.dataset.ai].description=e.value);
  document.querySelectorAll(".an").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][0]=e.value);
  document.querySelectorAll(".ap").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][1]=e.value);
  document.querySelectorAll(".as").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][2]=e.checked);
}

function addNewApp(){
  syncFromDOM();
  apps.push({id:"app-"+Date.now(),name:"",icon:"?",category:"",description:"",tiers:[["TIER BARU","Rp0",true]]});
  renderAdmin();
  const sections=document.querySelectorAll(".admin-section");
  sections[sections.length-1]?.scrollIntoView({behavior:"smooth",block:"center"});
}

function deleteApp(ai){
  syncFromDOM();
  apps.splice(ai,1);
  renderAdmin();
}

function addTier(ai){
  syncFromDOM();
  apps[ai].tiers.push(["TIER BARU","Rp0",true]);
  renderAdmin();
}

function deleteTier(ai,i){
  syncFromDOM();
  apps[ai].tiers.splice(i,1);
  renderAdmin();
}

function saveAdminData(){
  syncFromDOM();
  apps.forEach(a=>{ if(!a.id) a.id=slugify(a.name); });
  localStorage.setItem("ndrex_apps",JSON.stringify(apps));
  renderAdmin();
  renderProductGrid();
  document.getElementById("adminSaved").textContent="Perubahan tersimpan ✓";
  setTimeout(()=>document.getElementById("adminSaved").textContent="",1800);
}

function resetAdminData(){
  apps=structuredClone(defaultApps);
  localStorage.setItem("ndrex_apps",JSON.stringify(apps));
  renderAdmin();
  renderProductGrid();
}
function closeAdmin(){document.getElementById("adminModal").classList.remove("show")}
function esc(x){return String(x??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closePayment();closeAdminLogin();closeAdmin()}})

function confirmPayment(){
  const message = encodeURIComponent(
    "Halo admin NDREX PROJECT, saya ingin konfirmasi pembelian. Saya sudah melakukan pembayaran dan akan mengirimkan bukti pembayaran."
  );
  window.open("https://wa.me/6285715559734?text=" + message, "_blank");
}

/* ===== CLICK / TRANSITION ANIMATIONS ===== */
const transitionEl = document.getElementById("pageTransition");
const rippleLayer = document.getElementById("clickRipples");

function playTransition(){
  transitionEl.classList.remove("active");
  void transitionEl.offsetWidth;
  transitionEl.classList.add("active");
  setTimeout(()=>transitionEl.classList.remove("active"),700);
}

document.addEventListener("click", (e)=>{
  const target = e.target.closest("button, .intro");
  if(!target) return;
  const ripple = document.createElement("span");
  ripple.className = "click-ripple";
  ripple.style.left = e.clientX + "px";
  ripple.style.top = e.clientY + "px";
  rippleLayer.appendChild(ripple);
  setTimeout(()=>ripple.remove(),700);
});

const originalGoToStore = goToStore;
const starLoader = document.getElementById("starLoader");
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STAR_LOADER_MS = prefersReducedMotion ? 200 : 1600;

goToStore = function(){
  playTransition();
  if(!starLoader){ setTimeout(originalGoToStore,160); return; }
  starLoader.classList.add("show");
  setTimeout(()=>{
    originalGoToStore();
    setTimeout(()=>{ starLoader.classList.remove("show"); },250);
  },STAR_LOADER_MS);
};

/* ===== PWA: SERVICE WORKER + INSTALL PROMPT (ANDROID) ===== */
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

let deferredInstallPrompt = null;
const installToast = document.getElementById("installToast");

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(localStorage.getItem("ndrex_install_dismissed")) return;
  setTimeout(()=>{ if(installToast) installToast.classList.add("show"); },1200);
});

function installApp(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(()=>{
    deferredInstallPrompt = null;
    installToast.classList.remove("show");
  });
}

function dismissInstall(){
  installToast.classList.remove("show");
  localStorage.setItem("ndrex_install_dismissed","1");
}

window.addEventListener("appinstalled",()=>{
  if(installToast) installToast.classList.remove("show");
});

/* ===== INTRO PORTAL PARALLAX ===== */
const introSection = document.getElementById("slide1");
const portalEl = document.querySelector(".portal");
if(introSection && portalEl){
  introSection.addEventListener("mousemove",(e)=>{
    const r = introSection.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - .5;
    const y = (e.clientY - r.top)/r.height - .5;
    portalEl.style.transform = `translate(${x*-16}px,${y*-16}px)`;
  });
  introSection.addEventListener("mouseleave",()=>{ portalEl.style.transform = ""; });
}

renderProductGrid();
