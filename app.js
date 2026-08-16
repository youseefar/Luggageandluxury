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
   ESCAPE HTML
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
    itemQuantity.focus();
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    alert("Please enter a valid price.");
    itemPrice.focus();
    return;
  }

  items.push({
    name,
    quantity,
    price
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

        const index =
          Number(button.dataset.index);

        items.splice(index, 1);

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

    button.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(".payment")
          .forEach(function (item) {
            item.classList.remove("active");
          });

        button.classList.add("active");

        paymentMethod =
          button.dataset.method;

      }
    );

  });


/* =========================
   PREVIEW
========================= */

previewButton.addEventListener(
  "click",
  function () {

    if (items.length === 0) {

      alert(
        "Please add at least one item."
      );

      return;
    }

    createInvoicePreview();

    invoiceForm.classList.add("hidden");

    previewSection.classList.remove(
      "hidden"
    );

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
    String(invoiceCounter)
      .padStart(6, "0");

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


  /* PAYMENT */

  document.getElementById(
    "invoicePayment"
  ).textContent =
    paymentMethod;
}


/* =========================
   BACK
========================= */

backButton.addEventListener(
  "click",
  function () {

    previewSection.classList.add(
      "hidden"
    );

    invoiceForm.classList.remove(
      "hidden"
    );

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

    paymentMethod =
      "Bank Transfer";


    document
      .querySelectorAll(".payment")
      .forEach(function (button) {

        button.classList.remove(
          "active"
        );

        if (
          button.dataset.method ===
          "Bank Transfer"
        ) {
          button.classList.add(
            "active"
          );
        }

      });


    invoiceCounter++;

    localStorage.setItem(
      "invoiceCounter",
      invoiceCounter
    );


    renderItems();


    previewSection.classList.add(
      "hidden"
    );

    invoiceForm.classList.remove(
      "hidden"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);


/* =========================
   LOAD LOGO
========================= */

function loadLogo() {

  const logo =
    document.querySelector(
      ".invoice-logo"
    );

  if (!logo) return;

  logo.innerHTML = `
    <img
      src="logo.png"
      alt="Luggage and Luxury Affairs"
      style="
        width:100%;
        height:100%;
        object-fit:cover;
        border-radius:50%;
      "
    >
  `;
}

loadLogo();


/* =========================
   LOAD PDF LIBRARY
========================= */

function loadScript(src) {

  return new Promise(
    function (resolve, reject) {

      const script =
        document.createElement("script");

      script.src = src;

      script.onload = resolve;

      script.onerror = reject;

      document.head.appendChild(script);

    }
  );
}


async function prepareLibraries() {

  if (!window.html2canvas) {

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    );

  }


  if (!window.jspdf) {

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    );

  }

}


/* =========================
   CREATE IMAGE
========================= */

async function createInvoiceImage() {

  await prepareLibraries();

  const canvas =
    await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

  return new Promise(
    function (resolve) {

      canvas.toBlob(
        function (blob) {
          resolve(blob);
        },
        "image/png"
      );

    }
  );

}


/* =========================
   DOWNLOAD IMAGE
========================= */

document
  .getElementById("downloadImageButton")
  .addEventListener(
    "click",
    async function () {

      try {

        const blob =
          await createInvoiceImage();

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          getInvoiceFileName() +
          ".png";

        link.click();

        URL.revokeObjectURL(url);

      } catch (error) {

        console.error(error);

        alert(
          "Could not create the invoice image."
        );

      }

    }
  );


/* =========================
   CREATE PDF
========================= */

async function createInvoicePDF() {

  await prepareLibraries();

  const canvas =
    await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

  const image =
    canvas.toDataURL(
      "image/png"
    );

  const {
    jsPDF
  } = window.jspdf;


  const pdf =
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });


  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();


  const margin = 10;

  const availableWidth =
    pageWidth - margin * 2;


  const imageRatio =
    canvas.height / canvas.width;


  let imageHeight =
    availableWidth * imageRatio;


  const maxHeight =
    pageHeight - margin * 2;


  if (imageHeight > maxHeight) {

    imageHeight = maxHeight;

  }


  pdf.addImage(
    image,
    "PNG",
    margin,
    margin,
    availableWidth,
    imageHeight
  );


  return pdf;
}


/* =========================
   DOWNLOAD PDF
========================= */

document
  .getElementById("downloadPdfButton")
  .addEventListener(
    "click",
    async function () {

      try {

        const pdf =
          await createInvoicePDF();

        pdf.save(
          getInvoiceFileName() +
          ".pdf"
        );

      } catch (error) {

        console.error(error);

        alert(
          "Could not create the PDF."
        );

      }

    }
  );


/* =========================
   SHARE INVOICE
========================= */

document
  .getElementById("shareButton")
  .addEventListener(
    "click",
    async function () {

      try {

        const blob =
          await createInvoiceImage();

        const file =
          new File(
            [blob],
            getInvoiceFileName() +
            ".png",
            {
              type: "image/png"
            }
          );


        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({
            files: [file]
          })
        ) {

          await navigator.share({
            title:
              "Luggage & Luxury Affairs Invoice",

            text:
              "Invoice " +
              document.getElementById(
                "invoiceNumber"
              ).textContent,

            files: [file]
          });

          return;

        }


        /* FALLBACK */

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          getInvoiceFileName() +
          ".png";

        link.click();

        URL.revokeObjectURL(url);


        setTimeout(function () {

          const message =
            encodeURIComponent(
              "Invoice " +
              document.getElementById(
                "invoiceNumber"
              ).textContent +
              "\nTotal: " +
              document.getElementById(
                "invoiceTotal"
              ).textContent
            );


          window.open(
            "https://wa.me/?text=" +
            message,
            "_blank"
          );

        }, 500);


        alert(
          "The invoice image has been downloaded. You can attach it to WhatsApp."
        );

      } catch (error) {

        console.error(error);

        alert(
          "Could not prepare the invoice for sharing."
        );

      }

    }
  );


/* =========================
   FILE NAME
========================= */

function getInvoiceFileName() {

  const number =
    document.getElementById(
      "invoiceNumber"
    ).textContent;

  return (
    "Luggage-Luxury-" +
    number
  );

}


/* =========================
   START
========================= */

renderItems();
updateTotals();
loadLogo();
