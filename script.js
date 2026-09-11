let products = {};
let adminToken = sessionStorage.getItem("ndrex_admin_token") || "";

async function loadProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Gagal mengambil produk.");
  products = await res.json();
}

const typing = "NDREX PROJECT";
let i = 0;
function typeText() {
  const el = document.getElementById("typingText");
  if (i < typing.length) {
    el.textContent += typing.charAt(i++);
    setTimeout(typeText, 105);
  }
}
function startIntro() {
  typeText();
  loadProducts().catch(console.error);
}
startIntro();

function goToStore() {
  document.getElementById("slide1").style.display = "none";
  document.getElementById("slide2").classList.add("show");
  renderStoreProducts();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderStoreProducts() {
  const grid=document.querySelector(".product-grid");
  if(!grid) return;
  const meta={"NETFLIX":["N","STREAMING","Basic • VIP • Reseller"],
              "CANVA":["C","DESIGN","Basic • VIP"],
              "ALIGHT MOTION":["A","EDITING","VIP 1 Tahun • Generator APK"]};
  grid.innerHTML="";
  Object.keys(meta).forEach(name=>{
    const [icon,small,desc]=meta[name];
    const b=document.createElement("button");
    b.className="product-card";
    b.onclick=()=>openTiers(name);
    b.innerHTML=`<div class="product-icon">${icon}</div><div><small>${small}</small><h3>${name}</h3><p>${desc}</p></div><span class="arrow">→</span>`;
    grid.appendChild(b);
  });
}

function openTiers(product) {
  const list=document.getElementById("tierList");
  document.getElementById("modalTitle").textContent=product;
  list.innerHTML="";
  (products[product]||[]).forEach(item=>{
    const b=document.createElement("button");
    b.className="tier"+(item.stock?"":" sold-out");
    b.disabled=!item.stock;
    b.innerHTML=`<span class="tier-name">${escapeHtml(item.name)}</span><span class="tier-price">${escapeHtml(item.price)}</span>${item.stock?"":'<span class="sold-label">HABIS</span>'}`;
    if(item.stock) b.onclick=()=>openPayment();
    list.appendChild(b);
  });
  document.getElementById("tierModal").classList.add("show");
}
function closeModal(){document.getElementById("tierModal").classList.remove("show");}
function openPayment(){closeModal();document.getElementById("paymentModal").classList.add("show");}
function closePayment(){document.getElementById("paymentModal").classList.remove("show");}

async function copyNumber(){
  try{await navigator.clipboard.writeText("085718558667");}catch{}
  document.getElementById("copyStatus").textContent="Tersalin ✓";
  setTimeout(()=>document.getElementById("copyStatus").textContent="",2000);
}

/* REAL ADMIN LOGIN */
function openAdminLogin(){
  document.getElementById("adminEmail").value="";
  document.getElementById("adminPassword").value="";
  document.getElementById("adminError").textContent="";
  document.getElementById("adminLoginModal").classList.add("show");
}
function closeAdminLogin(){document.getElementById("adminLoginModal").classList.remove("show");}

async function loginAdmin(){
  const email=document.getElementById("adminEmail").value.trim();
  const password=document.getElementById("adminPassword").value;
  try{
    const res=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Login gagal.");
    adminToken=data.token;
    sessionStorage.setItem("ndrex_admin_token",adminToken);
    closeAdminLogin();
    await loadProducts();
    renderAdmin();
    document.getElementById("adminModal").classList.add("show");
  }catch(e){document.getElementById("adminError").textContent=e.message;}
}

function renderAdmin(){
  const c=document.getElementById("adminProducts");
  c.innerHTML="";
  Object.entries(products).forEach(([p,tiers])=>{
    const section=document.createElement("div");
    section.className="admin-product";
    section.innerHTML=`<div class="admin-product-title">${escapeHtml(p)}</div>`;
    tiers.forEach(item=>{
      const row=document.createElement("div");
      row.className="admin-tier-row";
      row.innerHTML=`<input class="admin-tier-name" data-id="${item.id}" value="${escapeHtml(item.name)}">
        <input class="admin-tier-price" data-id="${item.id}" value="${escapeHtml(item.price)}">
        <label class="stock-toggle"><input class="admin-stock" data-id="${item.id}" type="checkbox" ${item.stock?"checked":""}> Stok tersedia</label>
        <button class="copy-btn delete-tier">HAPUS</button>`;
      row.querySelector(".delete-tier").onclick=()=>deleteTier(item.id);
      section.appendChild(row);
    });
    c.appendChild(section);
  });
}

async function saveAdminData(){
  try{
    const rows=[...document.querySelectorAll(".admin-tier-row")];
    for(const row of rows){
      const name=row.querySelector(".admin-tier-name"),price=row.querySelector(".admin-tier-price"),stock=row.querySelector(".admin-stock");
      const res=await fetch(`/api/tiers/${name.dataset.id}`,{
        method:"PUT",headers:{"Content-Type":"application/json","Authorization":`Bearer ${adminToken}`},
        body:JSON.stringify({name:name.value,price:price.value,stock:stock.checked})
      });
      if(res.status===401){logoutAdmin();throw new Error("Sesi admin habis.");}
      if(!res.ok) throw new Error("Gagal menyimpan.");
    }
    await loadProducts(); renderStoreProducts(); renderAdmin();
    document.getElementById("adminSaved").textContent="Tersimpan ke database ✓";
    setTimeout(()=>document.getElementById("adminSaved").textContent="",2200);
  }catch(e){document.getElementById("adminSaved").textContent=e.message;}
}

async function deleteTier(id){
  if(!confirm("Hapus tier ini?")) return;
  const res=await fetch(`/api/tiers/${id}`,{method:"DELETE",headers:{"Authorization":`Bearer ${adminToken}`}});
  if(res.status===401){logoutAdmin();return;}
  if(!res.ok){alert("Gagal menghapus.");return;}
  await loadProducts(); renderStoreProducts(); renderAdmin();
}

function logoutAdmin(){adminToken="";sessionStorage.removeItem("ndrex_admin_token");closeAdmin();}
function closeAdmin(){document.getElementById("adminModal").classList.remove("show");}

function escapeHtml(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeModal();closePayment();closeAdminLogin();closeAdmin();}
});
["tierModal","paymentModal","adminLoginModal","adminModal"].forEach(id=>{
  document.getElementById(id).addEventListener("click",e=>{
    if(e.target.id!==id)return;
    if(id==="tierModal")closeModal();
    if(id==="paymentModal")closePayment();
    if(id==="adminLoginModal")closeAdminLogin();
    if(id==="adminModal")closeAdmin();
  });
});
