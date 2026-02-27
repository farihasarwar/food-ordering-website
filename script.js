// Simple in-memory "database" of foods (admin can modify)
let foodItems = [
  {
    id: "margherita",
    name: "Margherita Pizza",
    category: "pizza",
    price: 9.99,
    rating: 4.7,
    time: "25–30 min",
    image:
      "https://images.unsplash.com/photo-1601924582971-d6618e9664a4?auto=format&fit=crop&w=800&q=80",
    tag: "Best Seller",
  },
  {
    id: "pepperoni",
    name: "Spicy Pepperoni Pizza",
    category: "pizza",
    price: 11.49,
    rating: 4.8,
    time: "20–25 min",
    image:
      "https://images.unsplash.com/photo-1548369937-47519962c11a?auto=format&fit=crop&w=800&q=80",
    tag: "Hot & Spicy",
  },
  {
    id: "veggie-burger",
    name: "Crispy Veggie Burger",
    category: "burger",
    price: 7.99,
    rating: 4.5,
    time: "15–20 min",
    image:
      "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&w=800&q=80",
    tag: "Veg Favorite",
  },
  {
    id: "cheese-burger",
    name: "Double Cheese Burger",
    category: "burger",
    price: 8.99,
    rating: 4.6,
    time: "20–25 min",
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    tag: "Extra Cheese",
  },
  {
    id: "classic-sushi",
    name: "Classic Sushi Platter",
    category: "sushi",
    price: 14.99,
    rating: 4.9,
    time: "35–40 min",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    tag: "Chef's Choice",
  },
  {
    id: "salmon-roll",
    name: "Salmon Avocado Rolls",
    category: "sushi",
    price: 12.49,
    rating: 4.7,
    time: "30–35 min",
    image:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",
    tag: "Fresh Catch",
  },
  {
    id: "choco-lava",
    name: "Chocolate Lava Cake",
    category: "dessert",
    price: 5.49,
    rating: 4.8,
    time: "15–20 min",
    image:
      "https://images.unsplash.com/photo-1511381939415-dc51a22f3d69?auto=format&fit=crop&w=800&q=80",
    tag: "Sweet Tooth",
  },
  {
    id: "berry-cheesecake",
    name: "Berry Cheesecake Slice",
    category: "dessert",
    price: 4.99,
    rating: 4.6,
    time: "15–20 min",
    image:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
    tag: "Limited",
  },
];

const deliveryFee = 2.5;
const orderStatuses = [
  "Order placed",
  "Being prepared",
  "Out for delivery",
  "Delivered",
];

// State
let currentUser = null;
let cart = {}; // { foodId: quantity }
let activeCategory = "all";
let lastOrder = null; // latest placed order
let adminUnlocked = false;

// Helpers
const $ = (id) => document.getElementById(id);

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function getCartTotals() {
  let itemCount = 0;
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const item = foodItems.find((f) => f.id === id);
    if (!item) return;
    itemCount += qty;
    subtotal += item.price * qty;
  });
  const total = subtotal + deliveryFee;
  return { itemCount, subtotal, total };
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Auth logic (front-end only)
function handleSignIn(e) {
  e.preventDefault();
  const email = $("signin-email").value.trim();
  const password = $("signin-password").value.trim();
  if (!email || !password) {
    showToast("Please fill in email and password.");
    return;
  }

  // Demo only: accept any credentials
  currentUser = {
    firstName: email.split("@")[0] || "Guest",
    email,
  };
  $("nav-user-name").textContent = currentUser.firstName;
  $("auth-screen").classList.remove("active");
  $("main-screen").classList.add("active");
  showToast("Signed in successfully.");
}

function handleSignUp(e) {
  e.preventDefault();
  const firstName = $("signup-first-name").value.trim();
  const lastName = $("signup-last-name").value.trim();
  const email = $("signup-email").value.trim();
  const phone = $("signup-phone").value.trim();
  const password = $("signup-password").value.trim();
  const confirm = $("signup-password-confirm").value.trim();

  if (!firstName || !lastName || !email || !phone || !password || !confirm) {
    showToast("Please fill in all sign up fields.");
    return;
  }
  if (password !== confirm) {
    showToast("Passwords do not match.");
    return;
  }

  currentUser = { firstName, lastName, email, phone };
  $("nav-user-name").textContent = currentUser.firstName;
  $("auth-screen").classList.remove("active");
  $("main-screen").classList.add("active");
  showToast("Account created. Welcome to FlavorFast!");
}

function handleSignOut() {
  currentUser = null;
  cart = {};
  updateCartUI();
  lastOrder = null;
  $("auth-screen").classList.add("active");
  $("main-screen").classList.remove("active");
  $("signin-form").reset();
  $("signup-form").reset();
  renderTrackingView();
  renderAdminTrackingControls();
}

// Food list
function createFoodCard(item) {
  const card = document.createElement("article");
  card.className = "food-card";
  card.innerHTML = `
    <div class="food-card-image">
      <img src="${item.image}" alt="${item.name}" />
      <span class="food-card-badge">${item.tag}</span>
    </div>
    <div class="food-card-body">
      <div class="food-title-row">
        <h3 class="food-name">${item.name}</h3>
        <span class="food-price">${formatPrice(item.price)}</span>
      </div>
      <div class="food-meta">
        <span>${item.time}</span>
        <span>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
      </div>
      <div class="food-actions">
        <span class="food-rating">⭐ ${item.rating.toFixed(1)}</span>
        <button class="btn add" data-id="${item.id}">
          + Add to cart
        </button>
      </div>
    </div>
  `;
  return card;
}

function renderFoodList() {
  const container = $("food-list");
  container.innerHTML = "";

  const searchTerm = $("search-input").value.trim().toLowerCase();

  const filtered = foodItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    container.innerHTML =
      '<p style="color:#9ca3af;font-size:14px;">No dishes found. Try a different search or category.</p>';
    return;
  }

  filtered.forEach((item) => container.appendChild(createFoodCard(item)));
}

// Cart
function addToCart(id) {
  if (!cart[id]) {
    cart[id] = 1;
  } else {
    cart[id] += 1;
  }
  updateCartUI();
  const item = foodItems.find((f) => f.id === id);
  if (item) {
    showToast(`${item.name} added to cart.`);
  }
}

function updateCartUI() {
  const itemsContainer = $("cart-items");
  const countEl = $("cart-count");
  const subtotalEl = $("cart-subtotal");
  const deliveryEl = $("cart-delivery");
  const totalEl = $("cart-total");
  const checkoutTotalEl = $("checkout-total");
  const checkoutBtn = $("checkout-btn");

  const entries = Object.entries(cart);
  if (!entries.length) {
    itemsContainer.innerHTML =
      '<p class="cart-empty">Your cart is empty. Add something tasty!</p>';
    countEl.textContent = "0";
    subtotalEl.textContent = "$0.00";
    deliveryEl.textContent = formatPrice(deliveryFee);
    totalEl.textContent = formatPrice(deliveryFee);
    checkoutTotalEl.textContent = formatPrice(deliveryFee);
    checkoutBtn.disabled = true;
    return;
  }

  let itemCount = 0;
  let subtotal = 0;
  itemsContainer.innerHTML = "";

  entries.forEach(([id, qty]) => {
    const item = foodItems.find((f) => f.id === id);
    if (!item) return;
    itemCount += qty;
    subtotal += item.price * qty;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-meta">${qty} × ${formatPrice(item.price)}</div>
        <div class="cart-item-actions">
          <div class="qty-controls" data-id="${item.id}">
            <button class="qty-btn" data-action="dec">-</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn" data-action="inc">+</button>
          </div>
          <button class="remove-btn" data-remove="${item.id}">Remove</button>
        </div>
      </div>
      <div class="cart-item-price">${formatPrice(item.price * qty)}</div>
    `;
    itemsContainer.appendChild(row);
  });

  const totals = getCartTotals();
  countEl.textContent = String(totals.itemCount);
  subtotalEl.textContent = formatPrice(totals.subtotal);
  deliveryEl.textContent = formatPrice(deliveryFee);
  totalEl.textContent = formatPrice(totals.total);
  checkoutTotalEl.textContent = formatPrice(totals.total);
  checkoutBtn.disabled = false;
}

function openCheckoutModal() {
  if (!Object.keys(cart).length) return;
  $("checkout-modal").classList.add("show");
}

function closeCheckoutModal() {
  $("checkout-modal").classList.remove("show");
}

function handleConfirmOrder() {
  const address = $("delivery-address").value.trim();
  const city = $("delivery-city").value.trim();
  const zip = $("delivery-zip").value.trim();
  const payment = $("payment-method").value;

  if (!address || !city || !zip) {
    showToast("Please fill in delivery address details.");
    return;
  }

  if (payment === "card") {
    const cardNumber = $("card-number").value.trim();
    const expiry = $("card-expiry").value.trim();
    const cvc = $("card-cvc").value.trim();
    if (!cardNumber || !expiry || !cvc) {
      showToast("Please fill in card details or choose cash on delivery.");
      return;
    }
  }

  const totals = getCartTotals();
  lastOrder = {
    id: `FF-${Date.now().toString().slice(-6)}`,
    total: totals.total,
    statusIndex: 0,
    placedAt: new Date().toLocaleString(),
  };

  showToast("Order placed! Your food is on the way.");
  cart = {};
  updateCartUI();
  closeCheckoutModal();
  $("delivery-address").value = "";
  $("delivery-city").value = "";
  $("delivery-zip").value = "";
  $("card-number").value = "";
  $("card-expiry").value = "";
  $("card-cvc").value = "";
  renderTrackingView();
  renderAdminTrackingControls();
}

// Tracking UI
function renderTrackingView() {
  const emptyEl = $("track-empty");
  const contentEl = $("track-content");
  if (!emptyEl || !contentEl) return;

  if (!lastOrder) {
    emptyEl.classList.remove("hidden");
    contentEl.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  const idEl = $("track-order-id");
  const totalEl = $("track-order-total");
  const statusListEl = $("track-status-list");
  const currentStatusEl = $("track-current-status");

  if (idEl) idEl.textContent = lastOrder.id;
  if (totalEl) totalEl.textContent = formatPrice(lastOrder.total);

  if (statusListEl) {
    statusListEl.innerHTML = "";
    orderStatuses.forEach((status, index) => {
      const li = document.createElement("li");
      li.className = "track-status-item";
      if (index < lastOrder.statusIndex) {
        li.classList.add("done");
      } else if (index === lastOrder.statusIndex) {
        li.classList.add("current");
      }
      li.innerHTML = `
        <span class="track-status-dot"></span>
        <span>${status}</span>
      `;
      statusListEl.appendChild(li);
    });
  }

  if (currentStatusEl) {
    currentStatusEl.textContent = orderStatuses[lastOrder.statusIndex] || orderStatuses[0];
  }
}

// Admin panel
function renderAdminFoods() {
  const listEl = $("admin-food-list");
  if (!listEl) return;

  if (!foodItems.length) {
    listEl.innerHTML =
      '<p style="font-size:13px;color:#9ca3af;margin:0;">No foods posted yet.</p>';
    return;
  }

  listEl.innerHTML = "";
  foodItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-food-row";
    row.innerHTML = `
      <div>
        <div class="admin-food-name">${item.name}</div>
        <div class="admin-food-meta">${item.category} • ${item.time}</div>
      </div>
      <div class="admin-food-price">${formatPrice(item.price)}</div>
      <button class="admin-food-delete" data-id="${item.id}">Delete</button>
    `;
    listEl.appendChild(row);
  });
}

function renderAdminTrackingControls() {
  const emptyEl = $("admin-tracking-empty");
  const formEl = $("admin-tracking-form");
  if (!emptyEl || !formEl) return;

  if (!lastOrder) {
    emptyEl.classList.remove("hidden");
    formEl.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  formEl.classList.remove("hidden");

  const orderIdEl = $("admin-order-id");
  const selectEl = $("admin-status-select");
  if (orderIdEl) orderIdEl.textContent = lastOrder.id;
  if (selectEl) {
    selectEl.innerHTML = "";
    orderStatuses.forEach((status, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = status;
      if (index === lastOrder.statusIndex) {
        option.selected = true;
      }
      selectEl.appendChild(option);
    });
  }
}

function handleAdminUnlock() {
  const passwordInput = $("admin-password");
  if (!passwordInput) return;
  const value = passwordInput.value.trim();
  if (!value) {
    showToast("Enter the admin password.");
    return;
  }
  if (value !== "admin123") {
    showToast("Incorrect password. Try admin123.");
    return;
  }
  adminUnlocked = true;
  const lockedMsg = $("admin-locked-message");
  const panels = $("admin-panels");
  if (lockedMsg) lockedMsg.classList.add("hidden");
  if (panels) panels.classList.remove("hidden");
  showToast("Admin panel unlocked.");
  renderAdminFoods();
  renderAdminTrackingControls();
}

function handleAdminAddFood(e) {
  e.preventDefault();
  if (!adminUnlocked) {
    showToast("Unlock admin panel first.");
    return;
  }

  const name = $("admin-food-name").value.trim();
  const category = $("admin-food-category").value;
  const priceRaw = $("admin-food-price").value.trim();
  const time = $("admin-food-time").value.trim() || "20–25 min";
  const image = $("admin-food-image").value.trim();
  const tag = $("admin-food-tag").value.trim() || "New";

  if (!name || !category || !priceRaw) {
    showToast("Fill in name, category and price.");
    return;
  }

  const price = parseFloat(priceRaw);
  if (Number.isNaN(price) || price <= 0) {
    showToast("Enter a valid positive price.");
    return;
  }

  const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const id = `${baseId}-${Date.now().toString().slice(-4)}`;

  const item = {
    id,
    name,
    category,
    price,
    rating: 4.5,
    time,
    image:
      image ||
      "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80",
    tag,
  };
  foodItems.push(item);
  renderFoodList();
  renderAdminFoods();
  showToast("Food posted to menu.");

  $("admin-add-food-form").reset();
}

function handleAdminFoodClick(e) {
  const deleteBtn = e.target.closest(".admin-food-delete");
  if (!deleteBtn) return;
  if (!adminUnlocked) {
    showToast("Unlock admin panel first.");
    return;
  }
  const id = deleteBtn.getAttribute("data-id");
  foodItems = foodItems.filter((item) => item.id !== id);
  if (cart[id]) {
    delete cart[id];
    updateCartUI();
  }
  renderFoodList();
  renderAdminFoods();
  showToast("Food removed from menu.");
}

function handleAdminStatusChange(e) {
  if (!adminUnlocked) {
    showToast("Unlock admin panel first.");
    return;
  }
  if (!lastOrder) {
    showToast("No active order to update.");
    return;
  }
  const value = parseInt(e.target.value, 10);
  if (Number.isNaN(value)) return;
  lastOrder.statusIndex = Math.max(0, Math.min(orderStatuses.length - 1, value));
  renderTrackingView();
  renderAdminTrackingControls();
  showToast("Parcel tracking updated.");
}

// Event wiring
function initAuthTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.getAttribute("data-target");
      forms.forEach((form) => {
        form.classList.toggle("active", form.id === targetId);
      });
    });
  });
}

function initCategoryTags() {
  const tags = document.querySelectorAll(".tag");
  tags.forEach((tag) => {
    tag.addEventListener("click", () => {
      tags.forEach((t) => t.classList.remove("active"));
      tag.classList.add("active");
      activeCategory = tag.getAttribute("data-category") || "all";
      renderFoodList();
    });
  });
}

function initMainSectionsTabs() {
  const tabs = document.querySelectorAll(".section-tab");
  const sections = {
    catalog: document.getElementById("catalog-section"),
    track: document.getElementById("track-section"),
    admin: document.getElementById("admin-section"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const sectionKey = tab.getAttribute("data-section");
      if (!sectionKey || !sections[sectionKey]) return;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      Object.values(sections).forEach((sec) => sec && sec.classList.remove("active"));
      sections[sectionKey].classList.add("active");
    });
  });
}

function initSearch() {
  $("search-btn").addEventListener("click", renderFoodList);
  $("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renderFoodList();
    }
  });
}

function initFoodClick() {
  $("food-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    addToCart(id);
  });
}

function initCartInteractions() {
  $("cart-items").addEventListener("click", (e) => {
    const qtyControl = e.target.closest(".qty-controls");
    if (qtyControl && e.target.matches(".qty-btn")) {
      const id = qtyControl.getAttribute("data-id");
      const action = e.target.getAttribute("data-action");
      if (!id || !action) return;

      const current = cart[id] || 0;
      if (action === "inc") {
        cart[id] = current + 1;
      } else if (action === "dec") {
        cart[id] = Math.max(1, current - 1);
      }
      updateCartUI();
      return;
    }

    const removeBtn = e.target.closest("button[data-remove]");
    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove");
      delete cart[id];
      updateCartUI();
    }
  });
}

function initCartToggle() {
  const panel = $("cart-panel");
  $("cart-toggle").addEventListener("click", () => {
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function initCheckout() {
  $("checkout-btn").addEventListener("click", openCheckoutModal);
  $("modal-close").addEventListener("click", closeCheckoutModal);
  $("confirm-order-btn").addEventListener("click", handleConfirmOrder);

  $("payment-method").addEventListener("change", (e) => {
    const showCard = e.target.value === "card";
    $("card-details").style.display = showCard ? "block" : "none";
  });
  $("card-details").style.display = "block";

  $("checkout-modal").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      closeCheckoutModal();
    }
  });
}

function initAuthHandlers() {
  $("signin-form").addEventListener("submit", handleSignIn);
  $("signup-form").addEventListener("submit", handleSignUp);
  $("signout-btn").addEventListener("click", handleSignOut);
}

function initAdminPanel() {
  const unlockBtn = $("admin-unlock-btn");
  const addFoodForm = $("admin-add-food-form");
  const foodList = $("admin-food-list");
  const statusSelect = $("admin-status-select");
  if (unlockBtn) unlockBtn.addEventListener("click", handleAdminUnlock);
  if (addFoodForm) addFoodForm.addEventListener("submit", handleAdminAddFood);
  if (foodList) foodList.addEventListener("click", handleAdminFoodClick);
  if (statusSelect) statusSelect.addEventListener("change", handleAdminStatusChange);
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthTabs();
  initAuthHandlers();
  initMainSectionsTabs();
  initCategoryTags();
  initSearch();
  initFoodClick();
  initCartInteractions();
  initCartToggle();
  initCheckout();
  initAdminPanel();

  renderFoodList();
  updateCartUI();
  renderTrackingView();
  renderAdminTrackingControls();
});

