const defaultProducts = {
  "NETFLIX": [
    { name: "BASIC", price: "Rp5.000", stock: true },
    { name: "VIP", price: "Rp10.000", stock: true },
    { name: "RESELLER", price: "Rp25.000", stock: true }
  ],
  "CANVA": [
    { name: "BASIC", price: "Rp5.000", stock: true },
    { name: "VIP", price: "Rp10.000", stock: true }
  ],
  "ALIGHT MOTION": [
    { name: "VIP 1 TAHUN", price: "Rp2.000", stock: true },
    { name: "GENERATOR APK", price: "Rp15.000", stock: true }
  ]
};

let products = loadProducts();
let adminLoggedIn = false;

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultProducts));
}

function loadProducts() {
  try {
    const saved = localStorage.getItem("ndrex_products");
    if (saved) return JSON.parse(saved);
  } catch {}
  return cloneDefaults();
}

function saveProducts() {
  localStorage.setItem("ndrex_products", JSON.stringify(products));
}

const typing = "NDREX PROJECT";
let i = 0;

function typeText() {
  const el = document.getElementById("typingText");
  if (i < typing.length) {
    el.textContent += typing.charAt(i);
    i++;
    setTimeout(typeText, 105);
  }
}
typeText();

function goToStore() {
  document.getElementById("slide1").style.display = "none";
  document.getElementById("slide2").classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTiers(product) {
  const modal = document.getElementById("tierModal");
  const title = document.getElementById("modalTitle");
  const list = document.getElementById("tierList");

  title.textContent = product;
  list.innerHTML = "";

  products[product].forEach(item => {
    const button = document.createElement("button");
    button.className = "tier" + (item.stock ? "" : " sold-out");
    button.disabled = !item.stock;
    button.innerHTML = `
      <span class="tier-name">${item.name}</span>
      <span class="tier-price">${item.price}</span>
      ${item.stock ? "" : '<span class="sold-label">HABIS</span>'}
    `;
    if (item.stock) {
      button.onclick = () => openPayment(item.name, product, item.price);
    }
    list.appendChild(button);
  });

  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("tierModal").classList.remove("show");
}

function openPayment() {
  closeModal();
  document.getElementById("paymentModal").classList.add("show");
}

function closePayment() {
  document.getElementById("paymentModal").classList.remove("show");
}

async function copyNumber() {
  const number = "085718558667";
  try {
    await navigator.clipboard.writeText(number);
    document.getElementById("copyStatus").textContent = "Tersalin ✓";
  } catch {
    document.getElementById("copyStatus").textContent = number;
  }
  setTimeout(() => {
    document.getElementById("copyStatus").textContent = "";
  }, 2000);
}

/* ADMIN */
function openAdminLogin() {
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminError").textContent = "";
  document.getElementById("adminLoginModal").classList.add("show");
  setTimeout(() => document.getElementById("adminPassword").focus(), 100);
}

function closeAdminLogin() {
  document.getElementById("adminLoginModal").classList.remove("show");
}

function loginAdmin() {
  const password = document.getElementById("adminPassword").value;
  // Ganti password ini sebelum website dipublikasikan.
  const ADMIN_PASSWORD = "ndrex123";

  if (password !== ADMIN_PASSWORD) {
    document.getElementById("adminError").textContent = "Password salah.";
    return;
  }

  adminLoggedIn = true;
  closeAdminLogin();
  renderAdmin();
  document.getElementById("adminModal").classList.add("show");
}

function renderAdmin() {
  const container = document.getElementById("adminProducts");
  container.innerHTML = "";

  Object.entries(products).forEach(([productName, tiers]) => {
    const section = document.createElement("div");
    section.className = "admin-product";

    const title = document.createElement("div");
    title.className = "admin-product-title";
    title.textContent = productName;
    section.appendChild(title);

    tiers.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "admin-tier-row";
      row.innerHTML = `
        <input class="admin-tier-name" value="${escapeHtml(item.name)}" data-product="${productName}" data-index="${index}">
        <input class="admin-tier-price" value="${escapeHtml(item.price)}" data-product="${productName}" data-index="${index}">
        <label class="stock-toggle">
          <input type="checkbox" class="admin-stock" ${item.stock ? "checked" : ""} data-product="${productName}" data-index="${index}">
          Stok tersedia
        </label>
      `;
      section.appendChild(row);
    });

    container.appendChild(section);
  });
}

function saveAdminData() {
  if (!adminLoggedIn) return;

  document.querySelectorAll(".admin-tier-name").forEach(input => {
    const p = input.dataset.product;
    const idx = Number(input.dataset.index);
    products[p][idx].name = input.value.trim() || products[p][idx].name;
  });

  document.querySelectorAll(".admin-tier-price").forEach(input => {
    const p = input.dataset.product;
    const idx = Number(input.dataset.index);
    products[p][idx].price = input.value.trim() || products[p][idx].price;
  });

  document.querySelectorAll(".admin-stock").forEach(input => {
    const p = input.dataset.product;
    const idx = Number(input.dataset.index);
    products[p][idx].stock = input.checked;
  });

  saveProducts();

  const saved = document.getElementById("adminSaved");
  saved.textContent = "Perubahan berhasil disimpan ✓";
  setTimeout(() => saved.textContent = "", 2200);
}

function resetAdminData() {
  products = cloneDefaults();
  saveProducts();
  renderAdmin();

  const saved = document.getElementById("adminSaved");
  saved.textContent = "Data kembali ke harga/stok default.";
  setTimeout(() => saved.textContent = "", 2200);
}

function logoutAdmin() {
  adminLoggedIn = false;
  closeAdmin();
}

function closeAdmin() {
  document.getElementById("adminModal").classList.remove("show");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
    closePayment();
    closeAdminLogin();
    closeAdmin();
  }
});

document.getElementById("tierModal").addEventListener("click", e => {
  if (e.target.id === "tierModal") closeModal();
});

document.getElementById("paymentModal").addEventListener("click", e => {
  if (e.target.id === "paymentModal") closePayment();
});

document.getElementById("adminLoginModal").addEventListener("click", e => {
  if (e.target.id === "adminLoginModal") closeAdminLogin();
});

document.getElementById("adminModal").addEventListener("click", e => {
  if (e.target.id === "adminModal") closeAdmin();
});
