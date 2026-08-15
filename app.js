const items = [];

let paymentMethod = "Bank Transfer";

let invoiceCounter =
  Number(localStorage.getItem("invoiceCounter")) || 1;


/* =========================
   ELEMENTS
========================= */

const itemName = document.getElementById("itemName");
const itemQuantity = document.getElementById("itemQuantity");
const itemPrice = document.getElementById("itemPrice");

const addItemButton = document.getElementById("addItem");
const itemList = document.getElementById("itemList");

const discountInput = document.getElementById("discount");

const subtotalElement = document.getElementById("subtotal");
const totalElement = document.getElementById("total");

const previewButton = document.getElementById("previewButton");
const backButton = document.getElementById("backButton");
const newInvoiceButton = document.getElementById("newInvoice");

const invoiceForm = document.getElementById("invoiceForm");
const previewSection = document.getElementById("previewSection");

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");


/* =========================
   MONEY FORMAT
========================= */

function money(value) {
  return "₦" + Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}


/* =========================
   ADD ITEM
========================= */

addItemButton.addEventListener("click", function () {

  const name = itemName.value.trim();
  const quantity = Number(itemQuantity.value);
  const price = Number(itemPrice.value);

  if (!name) {
    alert("Please enter the item name.");
    itemName.focus();
    return;
  }

  if (quantity <= 0 || !quantity) {
    alert("Please enter a valid quantity.");
    itemQuantity.focus();
    return;
  }

  if (price < 0 || !Number.isFinite(price)) {
    alert("Please enter a valid price.");
    itemPrice.focus();
    return;
  }

  items.push({
    name: name,
    quantity: quantity,
    price: price
  });

  itemName.value = "";
  itemQuantity.value = "1";
  itemPrice.value = "";

  renderItems();

  itemName.focus();
});


/* =========================
   DISPLAY ITEMS
========================= */

function renderItems() {

  itemList.innerHTML = "";

  if (items.length === 0) {

    itemList.innerHTML =
      '<div class="empty">No items added yet.</div>';

    updateTotals();

    return;
  }


  items.forEach(function (item, index) {

    const itemTotal = item.quantity * item.price;

    const div = document.createElement("div");

    div.className = "item";

    div.innerHTML = `
      <div class="item-info">
        <strong>${escapeHTML(item.name)}</strong>
        <span>
          ${item.quantity} × ${money(item.price)}
        </span>
      </div>

      <div class="item-total">
        <strong>${money(itemTotal)}</strong>

        <button
          type="button"
          class="delete-item"
          data-index="${index}"
          aria-label="Delete item"
        >
          ×
        </button>
      </div>
    `;

    itemList.appendChild(div);
  });


  document.querySelectorAll(".delete-item").forEach(function (button) {

    button.addEventListener("click", function () {

      const index = Number(button.dataset.index);

      items.splice(index, 1);

      renderItems();
    });

  });


  updateTotals();
}


/* =========================
   CALCULATE TOTALS
========================= */

function getSubtotal() {

  return items.reduce(function (sum, item) {

    return sum + item.quantity * item.price;

  }, 0);
}


function getDiscount() {

  const discount = Number(discountInput.value) || 0;

  return Math.max(0, discount);
}


function getTotal() {

  const subtotal = getSubtotal();
  const discount = getDiscount();

  return Math.max(0, subtotal - discount);
}


function updateTotals() {

  const subtotal = getSubtotal();
  const total = getTotal();

  subtotalElement.textContent = money(subtotal);
  totalElement.textContent = money(total);
}


discountInput.addEventListener("input", updateTotals);


/* =========================
   PAYMENT METHOD
========================= */

document.querySelectorAll(".payment").forEach(function (button) {

  button.addEventListener("click", function () {

    document.querySelectorAll(".payment").forEach(function (item) {
      item.classList.remove("active");
    });

    button.classList.add("active");

    paymentMethod = button.dataset.method;
  });

});


/* =========================
   PREVIEW INVOICE
========================= */

previewButton.addEventListener("click", function () {

  if (items.length === 0) {
    alert("Please add at least one item.");
    return;
  }

  createInvoicePreview();

  invoiceForm.classList.add("hidden");
  previewSection.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

});


/* =========================
   CREATE PREVIEW
========================= */

function createInvoicePreview() {

  const number = "INV-" +
    String(invoiceCounter).padStart(6, "0");

  const date = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });


  document.getElementById("invoiceNumber").textContent = number;
  document.getElementById("invoiceDate").textContent = date;


  /* Customer */

  const customerBox =
    document.getElementById("customerDetails");

  const name = customerName.value.trim();
  const phone = customerPhone.value.trim();


  if (name || phone) {

    customerBox.innerHTML = `
      <strong>Customer</strong><br>
      ${name ? escapeHTML(name) : "Customer"} 
      ${phone ? " · " + escapeHTML(phone) : ""}
    `;

  } else {

    customerBox.innerHTML =
      "<strong>Customer:</strong> Walk-in Customer";

  }


  /* Items */

  const invoiceItems =
    document.getElementById("invoiceItems");

  invoiceItems.innerHTML = "";


  items.forEach(function (item) {

    const row = document.createElement("tr");

    const itemTotal =
      item.quantity * item.price;

    row.innerHTML = `
      <td>${escapeHTML(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(itemTotal)}</td>
    `;

    invoiceItems.appendChild(row);
  });


  /* Totals */

  document.getElementById("invoiceSubtotal")
    .textContent = money(getSubtotal());

  document.getElementById("invoiceDiscount")
    .textContent = money(getDiscount());

  document.getElementById("invoiceTotal")
    .textContent = money(getTotal());


  /* Payment */

  document.getElementById("invoicePayment")
    .textContent = paymentMethod;
}


/* =========================
   BACK TO EDIT
========================= */

backButton.addEventListener("click", function () {

  previewSection.classList.add("hidden");
  invoiceForm.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

});


/* =========================
   NEW INVOICE
========================= */

newInvoiceButton.addEventListener("click", function () {

  items.length = 0;

  customerName.value = "";
  customerPhone.value = "";

  itemName.value = "";
  itemQuantity.value = "1";
  itemPrice.value = "";

  discountInput.value = "";

  paymentMethod = "Bank Transfer";


  document.querySelectorAll(".payment").forEach(function (button) {

    button.classList.remove("active");

    if (button.dataset.method === "Bank Transfer") {
      button.classList.add("active");
    }

  });


  invoiceCounter++;

  localStorage.setItem(
    "invoiceCounter",
    invoiceCounter
  );


  renderItems();


  previewSection.classList.add("hidden");
  invoiceForm.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

});


/* =========================
   SHARE
========================= */

const shareButton =
  document.getElementById("shareButton");


shareButton.addEventListener("click", async function () {

  const invoiceNumber =
    document.getElementById("invoiceNumber").textContent;

  const total =
    document.getElementById("invoiceTotal").textContent;


  let message =
    "Luggage & Luxury Affairs%0A%0A" +
    "Invoice: " + invoiceNumber + "%0A" +
    "Total: " + total + "%0A%0A" +
    "Thank you for your patronage.";


  if (navigator.share) {

    try {

      await navigator.share({
        title: "Luggage & Luxury Affairs Invoice",
        text:
          "Invoice " +
          invoiceNumber +
          "\nTotal: " +
          total +
          "\n\nThank you for your patronage."
      });

    } catch (error) {
      console.log("Share cancelled.");
    }

  } else {

    window.open(
      "https://wa.me/?text=" + message,
      "_blank"
    );

  }

});


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


/* =========================
   START APP
========================= */

renderItems();
updateTotals();
