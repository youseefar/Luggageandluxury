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

const invoice = document.getElementById("invoice");

const shareButton =
  document.getElementById("shareButton");


/* =========================
   MONEY
========================= */

function money(value) {
  return "₦" + Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}


/* =========================
   SAFE TEXT
========================= */

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

  if (!quantity || quantity <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert("Please enter a valid price.");
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
   RENDER ITEMS
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

    const itemTotal =
      item.quantity * item.price;

    const div =
      document.createElement("div");

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
        >
          ×
        </button>
      </div>
    `;

    itemList.appendChild(div);
  });


  document
    .querySelectorAll(".delete-item")
    .forEach(function (button) {

      button.addEventListener("click", function () {

        items.splice(
          Number(button.dataset.index),
          1
        );

        renderItems();
      });

    });


  updateTotals();
}


/* =========================
   CALCULATIONS
========================= */

function getSubtotal() {

  return items.reduce(function (sum, item) {

    return sum +
      item.quantity * item.price;

  }, 0);
}


function getDiscount() {

  return Math.max(
    0,
    Number(discountInput.value) || 0
  );
}


function getTotal() {

  return Math.max(
    0,
    getSubtotal() - getDiscount()
  );
}


function updateTotals() {

  subtotalElement.textContent =
    money(getSubtotal());

  totalElement.textContent =
    money(getTotal());
}


discountInput.addEventListener(
  "input",
  updateTotals
);


/* =========================
   PAYMENT
========================= */

document
  .querySelectorAll(".payment")
  .forEach(function (button) {

    button.addEventListener("click", function () {

      document
        .querySelectorAll(".payment")
        .forEach(function (b) {
          b.classList.remove("active");
        });

      button.classList.add("active");

      paymentMethod =
        button.dataset.method;

    });

  });


/* =========================
   PREVIEW
========================= */

previewButton.addEventListener(
  "click",
  function () {

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

  }
);


/* =========================
   CREATE PREVIEW
========================= */

function createInvoicePreview() {

  const number =
    "INV-" +
    String(invoiceCounter).padStart(6, "0");

  const date =
    new Date().toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );


  document.getElementById(
    "invoiceNumber"
  ).textContent = number;


  document.getElementById(
    "invoiceDate"
  ).textContent = date;


  /* CUSTOMER */

  const customerBox =
    document.getElementById(
      "customerDetails"
    );

  const name =
    customerName.value.trim();

  const phone =
    customerPhone.value.trim();


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


  /* ITEMS */

  const invoiceItems =
    document.getElementById(
      "invoiceItems"
    );

  invoiceItems.innerHTML = "";


  items.forEach(function (item) {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(
        item.quantity * item.price
      )}</td>
    `;

    invoiceItems.appendChild(row);

  });


  /* TOTALS */

  document.getElementById(
    "invoiceSubtotal"
  ).textContent =
    money(getSubtotal());


  document.getElementById(
    "invoiceDiscount"
  ).textContent =
    money(getDiscount());


  document.getElementById(
    "invoiceTotal"
  ).textContent =
    money(getTotal());


  document.getElementById(
    "invoicePayment"
  ).textContent =
    paymentMethod;


  /* LOGO */

  const logo =
    document.querySelector(".invoice-logo");

  if (logo) {

    logo.innerHTML = `
      <img
        src="logo.png"
        alt="Luggage & Luxury Affairs"
        crossorigin="anonymous"
      >
    `;

    logo.style.overflow = "hidden";

  }
}


/* =========================
   BACK
========================= */

backButton.addEventListener(
  "click",
  function () {

    previewSection.classList.add("hidden");
    invoiceForm.classList.remove("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);


/* =========================
   NEW INVOICE
========================= */

newInvoiceButton.addEventListener(
  "click",
  function () {

    items.length = 0;

    customerName.value = "";
    customerPhone.value = "";

    itemName.value = "";
    itemQuantity.value = "1";
    itemPrice.value = "";

    discountInput.value = "";

    paymentMethod = "Bank Transfer";

    document
      .querySelectorAll(".payment")
      .forEach(function (button) {

        button.classList.remove("active");

        if (
          button.dataset.method ===
          "Bank Transfer"
        ) {
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

  }
);


/* =========================
   LOAD HTML2CANVAS
========================= */

function loadCanvasLibrary() {

  return new Promise(function (resolve, reject) {

    if (window.html2canvas) {
      resolve();
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

    script.onload = resolve;

    script.onerror = function () {
      reject(
        new Error(
          "Could not load invoice image library."
        )
      );
    };

    document.head.appendChild(script);

  });
}


/* =========================
   CREATE INVOICE IMAGE
========================= */

async function makeInvoiceImage() {

  await loadCanvasLibrary();

  const logo =
    document.querySelector(".invoice-logo img");

  /*
    Wait for the logo to finish loading
    before taking the screenshot.
  */

  if (logo && !logo.complete) {

    await new Promise(function (resolve) {

      logo.onload = resolve;
      logo.onerror = resolve;

    });

  }


  const canvas =
    await html2canvas(invoice, {

      scale: 2,

      backgroundColor: "#ffffff",

      useCORS: true,

      allowTaint: false

    });


  return new Promise(function (resolve) {

    canvas.toBlob(
      function (blob) {

        if (!blob) {
          resolve(null);
          return;
        }

        resolve(blob);

      },
      "image/png"
    );

  });

}


/* =========================
   SHARE ACTUAL IMAGE
========================= */

shareButton.addEventListener(
  "click",
  async function () {

    try {

      shareButton.disabled = true;
      shareButton.textContent =
        "Preparing Invoice...";


      const blob =
        await makeInvoiceImage();


      if (!blob) {
        throw new Error(
          "Invoice image could not be created."
        );
      }


      const invoiceNumber =
        document.getElementById(
          "invoiceNumber"
        ).textContent;


      const file =
        new File(
          [blob],
          "Luggage-Luxury-" +
          invoiceNumber +
          ".png",
          {
            type: "image/png"
          }
        );


      /*
        Android's native share sheet.
        WhatsApp should appear among
        the available sharing apps.
      */

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file]
        })
      ) {

        await navigator.share({

          title:
            "Luggage & Luxury Affairs",

          text:
            "Invoice " +
            invoiceNumber,

          files: [file]

        });


      } else {

        /*
          Fallback:
          download the actual invoice image.
        */

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          "Luggage-Luxury-" +
          invoiceNumber +
          ".png";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        alert(
          "Your invoice image has been downloaded. Open WhatsApp and attach the image."
        );

      }


    } catch (error) {

      console.error(
        "Share error:",
        error
      );


      /*
        Do not show an error when
        the user simply cancels sharing.
      */

      if (
        error.name !== "AbortError"
      ) {

        alert(
          "The invoice could not be shared. Please try again."
        );

      }

    } finally {

      shareButton.disabled = false;

      shareButton.textContent =
        "Share";

    }

  }
);


/* =========================
   START
========================= */

renderItems();
updateTotals();
