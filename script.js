let products = {};
let adminToken = sessionStorage.getItem("ndrex_admin_token") || "";

async function loadProducts() {
  const res = await fetch("/api/products");
  products = await res.json();
}

async function boot() {
  await loadProducts();
  renderStoreProducts();
  typeText();
}
boot();

const typing = "NDREX PROJECT";
let i = 0;
function typeText() {
  const el = document.getElementById("typingText");
  if (i < typing.length) {
    el.textContent += typing.charAt(i++);
    setTimeout(typeText, 105);
  }
}

function goToStore() {
  document.getElementById("slide1").style.display = "none";
  document.getElementById("slide2").classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStoreProducts() {
  const grid = document.querySelector(".product-grid");
  grid.innerHTML = "";
  const meta = {
    "NETFLIX": ["N","STREAMING","Basic • VIP • Reseller"],
    "CANVA": ["C","DESIGN","Basic • VIP"],
    "ALIGHT MOTION": ["A","EDITING","VIP 1 Tahun • Generator APK"]
  };
  Object.keys(products).forEach((name) => {
    const [icon, small, desc] = meta[name] || [name[0], "DIGITAL", "Digital product"];
    const card = document.createElement("button");
    card.className = "product-card";
    card.onclick = () => openTiers(name);
    card.innerHTML = `<div class="product-icon">${icon}</div>
      <div><small>${small}</small><h3>${name}</h3><p>${desc}</p></div>
      <span class="arrow">→</span>`;
    grid.appendChild(card);
  });
}

function openTiers(product) {
  const modal = document.getElementById("tierModal");
  document.getElementById("modalTitle").textContent = product;
  const list = document.getElementById("tierList");
  list.innerHTML = "";

  (products[product] || []).forEach(item => {
    const button = document.createElement("button");
    button.className = "tier" + (item.stock ? "" : " sold-out");
    button.disabled = !item.stock;
    button.innerHTML = `<span class="tier-name">${escapeHtml(item.name)}</span>
      <span class="tier-price">${escapeHtml(item.price)}</span>
      ${item.stock ? "" : '<span class="sold-label">HABIS</span>'}`;
    if (item.stock) button.onclick = () => openPayment(item.name, product, item.price);
    list.appendChild(button);
  });
  modal.classList.add("show");
}

function closeModal() { document.getElementById("tierModal").classList.remove("show"); }
function openPayment() { closeModal(); document.getElementById("paymentModal").classList.add("show"); }
function closePayment() { document.getElementById("paymentModal").classList.remove("show"); }

async function copyNumber() {
  const number = "085718558667";
  await navigator.clipboard.writeText(number).catch(()=>{});
  document.getElementById("copyStatus").textContent = "Tersalin ✓";
  setTimeout(() => document.getElementById("copyStatus").textContent = "", 2000);
}

function openAdminLogin() {
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminEmail").value = "";
  document.getElementById("adminError").textContent = "";
  document.getElementById("adminLoginModal").classList.add("show");
}
function closeAdminLogin() { document.getElementById("adminLoginModal").classList.remove("show"); }

async function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const err = document.getElementById("adminError");
  err.textContent = "";
  try {
    const res = await fetch("/api/login", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login gagal");
    adminToken = data.token;
    sessionStorage.setItem("ndrex_admin_token", adminToken);
    closeAdminLogin();
    await loadProducts();
    renderAdmin();
    document.getElementById("adminModal").classList.add("show");
  } catch (e) { err.textContent = e.message; }
}

function renderAdmin() {
  const container = document.getElementById("adminProducts");
  container.innerHTML = "";
  Object.entries(products).forEach(([productName, tiers]) => {
    const section = document.createElement("div");
    section.className = "admin-product";
    section.innerHTML = `<div class="admin-product-title">${escapeHtml(productName)}</div>`;
    tiers.forEach(item => {
      const row = document.createElement("div");
      row.className = "admin-tier-row";
      row.innerHTML = `<input class="admin-tier-name" value="${escapeHtml(item.name)}">
        <input class="admin-tier-price" value="${escapeHtml(item.price)}">
        <label class="stock-toggle"><input type="checkbox" class="admin-stock" ${item.stock ? "checked":""}> Stok tersedia</label>
        <button class="copy-btn delete-tier" data-id="${item.id}">HAPUS</button>`;
      row.querySelector(".admin-tier-name").dataset.id = item.id;
      row.querySelector(".admin-tier-price").dataset.id = item.id;
      row.querySelector(".admin-stock").dataset.id = item.id;
      row.querySelector(".delete-tier").onclick = () => deleteTier(item.id);
      section.appendChild(row);
    });
    container.appendChild(section);
  });
}

async function saveAdminData() {
  const rows = [...document.querySelectorAll(".admin-tier-row")];
  try {
    for (const row of rows) {
      const name = row.querySelector(".admin-tier-name");
      const price = row.querySelector(".admin-tier-price");
      const stock = row.querySelector(".admin-stock");
      const res = await fetch(`/api/tiers/${name.dataset.id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json", "Authorization": `Bearer ${adminToken}`},
        body: JSON.stringify({name:name.value, price:price.value, stock:stock.checked})
      });
      if (res.status === 401) throw new Error("Sesi admin habis. Login lagi.");
      if (!res.ok) throw new Error("Gagal menyimpan perubahan.");
    }
    await loadProducts();
    renderStoreProducts();
    renderAdmin();
    document.getElementById("adminSaved").textContent = "Perubahan tersimpan ke database ✓";
    setTimeout(()=>document.getElementById("adminSaved").textContent="",2500);
  } catch(e) {
    document.getElementById("adminSaved").textContent = e.message;
  }
}

async function deleteTier(id) {
  if (!confirm("Hapus tier ini?")) return;
  const res = await fetch(`/api/tiers/${id}`, {
    method:"DELETE", headers:{"Authorization":`Bearer ${adminToken}`}
  });
  if (res.status === 401) return logoutAdmin();
  if (!res.ok) return alert("Gagal menghapus tier.");
  await loadProducts();
  renderStoreProducts();
  renderAdmin();
}

function logoutAdmin() {
  adminToken = "";
  sessionStorage.removeItem("ndrex_admin_token");
  closeAdmin();
}

function closeAdmin() { document.getElementById("adminModal").classList.remove("show"); }

function escapeHtml(value) {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal(); closePayment(); closeAdminLogin(); closeAdmin();
  }
});
for (const id of ["tierModal","paymentModal","adminLoginModal","adminModal"]) {
  document.getElementById(id).addEventListener("click", e => {
    if (e.target.id === id) {
      if (id === "tierModal") closeModal();
      if (id === "paymentModal") closePayment();
      if (id === "adminLoginModal") closeAdminLogin();
      if (id === "adminModal") closeAdmin();
    }
  });
}
