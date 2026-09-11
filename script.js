const defaults={
"NETFLIX":[["BASIC","Rp5.000",true],["VIP","Rp10.000",true],["RESELLER","Rp25.000",true]],
"CANVA":[["BASIC","Rp5.000",true],["VIP","Rp10.000",true]],
"ALIGHT MOTION":[["VIP 1 TAHUN","Rp2.000",true],["GENERATOR APK","Rp15.000",true]]
};
let products=load(),admin=false;
function load(){try{let x=localStorage.getItem("ndrex_products");return x?JSON.parse(x):structuredClone(defaults)}catch{return structuredClone(defaults)}}
function type(){let s="NDREX PROJECT",i=0,e=document.getElementById("typingText");(function t(){if(i<s.length){e.textContent+=s[i++];setTimeout(t,105)}})()}type();
function goToStore(){document.getElementById("slide1").style.display="none";document.getElementById("slide2").classList.add("show");window.scrollTo(0,0)}
function openTiers(p){modal("tierModal");document.getElementById("modalTitle").textContent=p;let l=document.getElementById("tierList");l.innerHTML="";products[p].forEach(x=>{let b=document.createElement("button");b.className="tier";b.disabled=!x[2];b.innerHTML=`<span>${x[0]}</span><span class="tier-price">${x[1]}${x[2]?"":" • HABIS"}</span>`;if(x[2])b.onclick=openPayment;l.appendChild(b)})}
function modal(id){document.getElementById(id).classList.add("show")}
function closeModal(){document.getElementById("tierModal").classList.remove("show")}
function openPayment(){closeModal();modal("paymentModal")} function closePayment(){document.getElementById("paymentModal").classList.remove("show")}
async function copyNumber(){try{await navigator.clipboard.writeText("085718558667");document.getElementById("copyStatus").textContent=" Tersalin ✓"}catch{}setTimeout(()=>document.getElementById("copyStatus").textContent="",1800)}
function openAdminLogin(){document.getElementById("adminPassword").value="";document.getElementById("adminError").textContent="";modal("adminLoginModal")}
function closeAdminLogin(){document.getElementById("adminLoginModal").classList.remove("show")}
function loginAdmin(){if(document.getElementById("adminPassword").value!=="ndrex123"){document.getElementById("adminError").textContent="Password salah.";return}admin=true;closeAdminLogin();renderAdmin();modal("adminModal")}
function renderAdmin(){let c=document.getElementById("adminProducts");c.innerHTML="";Object.entries(products).forEach(([p,arr])=>{let s=document.createElement("div");s.className="admin-section";s.innerHTML=`<h3>${p}</h3>`;arr.forEach((x,i)=>s.innerHTML+=`<div class="admin-row"><input class="an" data-p="${p}" data-i="${i}" value="${esc(x[0])}"><input class="ap" data-p="${p}" data-i="${i}" value="${esc(x[1])}"><label class="admin-stock"><input type="checkbox" class="as" data-p="${p}" data-i="${i}" ${x[2]?"checked":""}> STOK</label></div>`);c.appendChild(s)})}
function saveAdminData(){document.querySelectorAll(".an").forEach(e=>products[e.dataset.p][e.dataset.i][0]=e.value);document.querySelectorAll(".ap").forEach(e=>products[e.dataset.p][e.dataset.i][1]=e.value);document.querySelectorAll(".as").forEach(e=>products[e.dataset.p][e.dataset.i][2]=e.checked);localStorage.setItem("ndrex_products",JSON.stringify(products));document.getElementById("adminSaved").textContent="Perubahan tersimpan ✓";setTimeout(()=>document.getElementById("adminSaved").textContent="",1800)}
function resetAdminData(){products=structuredClone(defaults);localStorage.setItem("ndrex_products",JSON.stringify(products));renderAdmin()}
function closeAdmin(){document.getElementById("adminModal").classList.remove("show")}
function esc(x){return String(x).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
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
goToStore = function(){
  playTransition();
  setTimeout(originalGoToStore,160);
};
