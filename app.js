const items = [];

let paymentMethod = "Bank Transfer";

let documentType = "invoice"; // "invoice" | "loan"

let invoiceCounter =
  Number(localStorage.getItem("invoiceCounter")) || 1;

const STORAGE_KEY = "llaSlips";

// The slip currently being built in the form. Reused across
// repeated Preview clicks so previewing twice doesn't create
// two saved records — only "+ New Invoice" finalizes it and
// clears this so the next Preview starts a fresh slip.
let currentSlip = null;

// True when the preview screen is showing a record opened
// from History (read-only, not the live form draft).
let isHistoryView = false;


/* =========================
   GET ELEMENTS
========================= */

const itemName =
  document.getElementById("itemName");

const itemQuantity =
  document.getElementById("itemQuantity");

const itemPrice =
  document.getElementById("itemPrice");

const addItemButton =
  document.getElementById("addItem");

const itemList =
  document.getElementById("itemList");

const discountInput =
  document.getElementById("discount");

const subtotalElement =
  document.getElementById("subtotal");

const totalElement =
  document.getElementById("total");

const previewButton =
  document.getElementById("previewButton");

const backButton =
  document.getElementById("backButton");

const newInvoiceButton =
  document.getElementById("newInvoice");

const deleteSlipButton =
  document.getElementById("deleteSlipButton");

const invoiceForm =
  document.getElementById("invoiceForm");

const previewSection =
  document.getElementById("previewSection");

const historySection =
  document.getElementById("historySection");

const historyList =
  document.getElementById("historyList");

const historySearch =
  document.getElementById("historySearch");

const customerName =
  document.getElementById("customerName");

const customerPhone =
  document.getElementById("customerPhone");

const invoice =
  document.getElementById("invoice");

const shareButton =
  document.getElementById("shareButton");

const pdfButton =
  document.getElementById("pdfButton");

const formLabel =
  document.getElementById("formLabel");

const formHeading =
  document.getElementById("formHeading");

const formTotalLabel =
  document.getElementById("formTotalLabel");

const dueDateWrap =
  document.getElementById("dueDateWrap");

const dueDateInput =
  document.getElementById("dueDate");

const invoiceTypeHeading =
  document.getElementById("invoiceTypeHeading");

const invoiceNoLabel =
  document.getElementById("invoiceNoLabel");

const invoiceDueDateRow =
  document.getElementById("invoiceDueDateRow");

const invoiceDueDateElement =
  document.getElementById("invoiceDueDate");

const invoiceSlipIdElement =
  document.getElementById("invoiceSlipId");

const loanBadge =
  document.getElementById("loanBadge");

const grandTotalLabel =
  document.getElementById("grandTotalLabel");

const thankYouTitle =
  document.getElementById("thankYouTitle");

const thankYouSubtitle =
  document.getElementById("thankYouSubtitle");

const viewTabs =
  document.querySelectorAll(".view-tab");


/* =========================
   MONEY FORMAT
========================= */

function money(value) {

  return "₦" +
    Number(value || 0).toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );

}


/* =========================
   SAFE TEXT
========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* =========================
   STORAGE (LOCAL DEVICE)
========================= */

function getSavedSlips() {

  try {

    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || [];

  } catch (error) {

    return [];

  }

}


function upsertSlip(slip) {

  const slips =
    getSavedSlips();

  const index =
    slips.findIndex(
      function (existing) {

        return existing.slipId ===
          slip.slipId;

      }
    );


  if (index >= 0) {

    slips[index] = slip;

  } else {

    slips.unshift(slip);

  }


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(slips)
  );

}


function deleteSlip(slipId) {

  const slips =
    getSavedSlips().filter(
      function (slip) {

        return slip.slipId !==
          slipId;

      }
    );


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(slips)
  );

}


function findSlipById(slipId) {

  return getSavedSlips().find(
    function (slip) {

      return slip.slipId ===
        slipId;

    }
  );

}


/* =========================
   UNIQUE SLIP ID
========================= */

function generateSlipId() {

  const time =
    Date.now()
      .toString(36)
      .toUpperCase()
      .slice(-6);

  const random =
    Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();


  return "SLP-" +
    time +
    random;

}


/* =========================
   DOCUMENT TYPE TOGGLE
========================= */

document
  .querySelectorAll(".doctype")
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(".doctype")
            .forEach(
              function (item) {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          documentType =
            button.dataset.type;


          updateFormForType();

        }
      );

    }
  );


function updateFormForType() {

  if (documentType === "loan") {

    formLabel.textContent =
      "LOAN / IOU";

    formHeading.textContent =
      "Create New Loan Slip";

    formTotalLabel.textContent =
      "Amount Owed";

    dueDateWrap.classList.remove(
      "hidden"
    );

  } else {

    formLabel.textContent =
      "INVOICE";

    formHeading.textContent =
      "Create New Invoice";

    formTotalLabel.textContent =
      "Total";

    dueDateWrap.classList.add(
      "hidden"
    );

  }

}


/* =========================
   VIEW TABS (NEW / HISTORY)
========================= */

viewTabs.forEach(
  function (tab) {

    tab.addEventListener(
      "click",
      function () {

        viewTabs.forEach(
          function (item) {

            item.classList.remove(
              "active"
            );

          }
        );


        tab.classList.add(
          "active"
        );


        previewSection.classList.add(
          "hidden"
        );


        if (tab.dataset.view === "history") {

          invoiceForm.classList.add(
            "hidden"
          );


          historySection.classList.remove(
            "hidden"
          );


          renderHistoryList();

        } else {

          historySection.classList.add(
            "hidden"
          );


          invoiceForm.classList.remove(
            "hidden"
          );

        }

      }
    );

  }
);


function goToTab(view) {

  viewTabs.forEach(
    function (tab) {

      tab.classList.toggle(
        "active",
        tab.dataset.view === view
      );

    }
  );

}


/* =========================
   ADD ITEM
========================= */

addItemButton.addEventListener(
  "click",
  function () {

    const name =
      itemName.value.trim();

    const quantity =
      Number(itemQuantity.value);

    const price =
      Number(itemPrice.value);


    if (!name) {

      alert(
        "Please enter the item name."
      );

      itemName.focus();

      return;
    }


    if (
      !quantity ||
      quantity <= 0
    ) {

      alert(
        "Please enter a valid quantity."
      );

      itemQuantity.focus();

      return;
    }


    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      alert(
        "Please enter a valid price."
      );

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

  }
);
/* =========================
   DISPLAY ITEMS
========================= */

function renderItems() {

  itemList.innerHTML = "";


  if (items.length === 0) {

    itemList.innerHTML =
      `
      <div class="empty">
        No items added yet.
      </div>
      `;

    updateTotals();

    return;
  }


  items.forEach(
    function (item, index) {

      const itemTotal =
        item.quantity *
        item.price;


      const div =
        document.createElement(
          "div"
        );


      div.className = "item";


      div.innerHTML = `

        <div class="item-info">

          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <span>
            ${item.quantity}
            ×
            ${money(item.price)}
          </span>

        </div>


        <div class="item-total">

          <strong>
            ${money(itemTotal)}
          </strong>

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

    }
  );


  document
    .querySelectorAll(".delete-item")
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const index =
              Number(
                button.dataset.index
              );


            items.splice(
              index,
              1
            );


            renderItems();

          }
        );

      }
    );


  updateTotals();

}


/* =========================
   CALCULATIONS
========================= */

function getSubtotal() {

  return items.reduce(
    function (sum, item) {

      return sum +
        (
          item.quantity *
          item.price
        );

    },
    0
  );

}


function getDiscount() {

  return Math.max(
    0,
    Number(
      discountInput.value
    ) || 0
  );

}


function getTotal() {

  return Math.max(
    0,
    getSubtotal() -
    getDiscount()
  );

}


function updateTotals() {

  subtotalElement.textContent =
    money(
      getSubtotal()
    );


  totalElement.textContent =
    money(
      getTotal()
    );

}


discountInput.addEventListener(
  "input",
  updateTotals
);


/* =========================
   PAYMENT METHOD
========================= */

document
  .querySelectorAll(".payment")
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(".payment")
            .forEach(
              function (item) {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          paymentMethod =
            button.dataset.method;

        }
      );

    }
  );


/* =========================
   BUILD / UPDATE CURRENT SLIP
========================= */

function buildOrUpdateCurrentSlip() {

  const isLoan =
    documentType === "loan";


  if (!currentSlip) {

    currentSlip = {

      slipId:
        generateSlipId(),

      invoiceNumber:
        (isLoan ? "LN-" : "INV-") +
        String(invoiceCounter)
          .padStart(6, "0"),

      createdAt:
        new Date().toISOString()

    };

  }


  const date =
    new Date().toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );


  let dueDateText = "";

  if (
    isLoan &&
    dueDateInput.value
  ) {

    dueDateText =
      new Date(
        dueDateInput.value +
        "T00:00:00"
      ).toLocaleDateString(
        "en-NG",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );

  }


  currentSlip.type = documentType;

  currentSlip.date = date;

  currentSlip.dueDate = dueDateText;

  currentSlip.customerName =
    customerName.value.trim();

  currentSlip.customerPhone =
    customerPhone.value.trim();

  currentSlip.items =
    items.map(
      function (item) {

        return {

          name: item.name,

          quantity: item.quantity,

          price: item.price

        };

      }
    );

  currentSlip.subtotal =
    getSubtotal();

  currentSlip.discount =
    getDiscount();

  currentSlip.total =
    getTotal();

  currentSlip.paymentMethod =
    paymentMethod;


  upsertSlip(currentSlip);


  return currentSlip;

}


/* =========================
   RENDER A SLIP INTO THE PAPER
========================= */

function renderInvoice(data) {

  const isLoan =
    data.type === "loan";


  document.getElementById(
    "invoiceNumber"
  ).textContent =
    data.invoiceNumber;


  document.getElementById(
    "invoiceDate"
  ).textContent =
    data.date;


  invoiceSlipIdElement.textContent =
    data.slipId;


  invoiceTypeHeading.textContent =
    isLoan
      ? "LOAN SLIP"
      : "INVOICE";


  invoiceNoLabel.textContent =
    isLoan
      ? "Loan No:"
      : "Invoice No:";


  grandTotalLabel.textContent =
    isLoan
      ? "AMOUNT OWED"
      : "TOTAL";


  if (isLoan) {

    loanBadge.classList.remove(
      "hidden"
    );


    thankYouTitle.textContent =
      "Items collected on loan.";


    thankYouSubtitle.textContent =
      "Please return or settle this " +
      "balance by the due date above.";

  } else {

    loanBadge.classList.add(
      "hidden"
    );


    thankYouTitle.textContent =
      "Thank you for your patronage.";


    thankYouSubtitle.textContent =
      "Please make payment using " +
      "the account details above.";

  }


  if (
    isLoan &&
    data.dueDate
  ) {

    invoiceDueDateElement.textContent =
      data.dueDate;


    invoiceDueDateRow.classList.remove(
      "hidden"
    );

  } else {

    invoiceDueDateRow.classList.add(
      "hidden"
    );

  }


  /* CUSTOMER */

  const customerBox =
    document.getElementById(
      "customerDetails"
    );


  if (
    data.customerName ||
    data.customerPhone
  ) {

    customerBox.innerHTML = `

      <strong>
        Customer
      </strong>

      <br>

      ${
        data.customerName
          ? escapeHTML(data.customerName)
          : "Customer"
      }

      ${
        data.customerPhone
          ? " · " +
            escapeHTML(data.customerPhone)
          : ""
      }

    `;

  } else {

    customerBox.innerHTML =
      `
      <strong>
        Customer:
      </strong>
      Walk-in Customer
      `;

  }


  /* ITEMS */

  const invoiceItemsBody =
    document.getElementById(
      "invoiceItems"
    );


  invoiceItemsBody.innerHTML = "";


  data.items.forEach(
    function (item) {

      const row =
        document.createElement(
          "tr"
        );


      const itemTotal =
        item.quantity *
        item.price;


      row.innerHTML = `

        <td>
          ${escapeHTML(item.name)}
        </td>

        <td>
          ${item.quantity}
        </td>

        <td>
          ${money(item.price)}
        </td>

        <td>
          ${money(itemTotal)}
        </td>

      `;


      invoiceItemsBody.appendChild(row);

    }
  );


  /* TOTALS */

  document.getElementById(
    "invoiceSubtotal"
  ).textContent =
    money(data.subtotal);


  document.getElementById(
    "invoiceDiscount"
  ).textContent =
    money(data.discount);


  document.getElementById(
    "invoiceTotal"
  ).textContent =
    money(data.total);


  document.getElementById(
    "invoicePayment"
  ).textContent =
    data.paymentMethod;

      }
/* =========================
   PREVIEW (FROM FORM)
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


    const slip =
      buildOrUpdateCurrentSlip();


    renderInvoice(slip);


    isHistoryView = false;

    backButton.textContent =
      "← Edit";

    newInvoiceButton.classList.remove(
      "hidden"
    );

    deleteSlipButton.classList.add(
      "hidden"
    );


    invoiceForm.classList.add(
      "hidden"
    );


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
   BACK BUTTON
========================= */

backButton.addEventListener(
  "click",
  function () {

    previewSection.classList.add(
      "hidden"
    );


    if (isHistoryView) {

      historySection.classList.remove(
        "hidden"
      );

    } else {

      invoiceForm.classList.remove(
        "hidden"
      );

    }


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

    dueDateInput.value = "";


    paymentMethod =
      "Bank Transfer";


    document
      .querySelectorAll(".payment")
      .forEach(
        function (button) {

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

        }
      );


    invoiceCounter++;


    localStorage.setItem(
      "invoiceCounter",
      invoiceCounter
    );


    currentSlip = null;


    renderItems();


    previewSection.classList.add(
      "hidden"
    );


    invoiceForm.classList.remove(
      "hidden"
    );


    goToTab("form");


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);


/* =========================
   HISTORY LIST
========================= */

function renderHistoryList() {

  const query =
    (historySearch.value || "")
      .trim()
      .toLowerCase();


  const slips =
    getSavedSlips();


  const filtered =
    !query
      ? slips
      : slips.filter(
          function (slip) {

            return (
              slip.slipId
                .toLowerCase()
                .includes(query) ||
              slip.invoiceNumber
                .toLowerCase()
                .includes(query) ||
              (
                slip.customerName || ""
              )
                .toLowerCase()
                .includes(query)
            );

          }
        );


  historyList.innerHTML = "";


  if (slips.length === 0) {

    historyList.innerHTML =
      `
      <div class="empty">
        No slips saved yet.
      </div>
      `;

    return;

  }


  if (filtered.length === 0) {

    historyList.innerHTML =
      `
      <div class="empty">
        No matching slips found.
      </div>
      `;

    return;

  }


  filtered.forEach(
    function (slip) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "history-card";


      const isLoan =
        slip.type === "loan";


      card.innerHTML = `

        <div class="history-card-top">

          <span class="history-badge ${isLoan ? "loan" : "invoice"}">
            ${isLoan ? "LOAN" : "INVOICE"}
          </span>

          <span class="history-date">
            ${escapeHTML(slip.date || "")}
          </span>

        </div>


        <div class="history-card-mid">

          <strong>
            ${escapeHTML(slip.customerName || "Walk-in Customer")}
          </strong>

          <span>
            ${escapeHTML(slip.invoiceNumber)} · ${escapeHTML(slip.slipId)}
          </span>

        </div>


        <div class="history-card-bottom">

          ${money(slip.total)}

        </div>

      `;


      card.addEventListener(
        "click",
        function () {

          openSlipFromHistory(
            slip.slipId
          );

        }
      );


      historyList.appendChild(card);

    }
  );

}


historySearch.addEventListener(
  "input",
  renderHistoryList
);


function openSlipFromHistory(slipId) {

  const slip =
    findSlipById(slipId);


  if (!slip) {

    return;

  }


  renderInvoice(slip);


  isHistoryView = true;

  currentSlip = null;


  backButton.textContent =
    "← Back to History";

  newInvoiceButton.classList.add(
    "hidden"
  );

  deleteSlipButton.classList.remove(
    "hidden"
  );

  deleteSlipButton.dataset.slipId =
    slip.slipId;


  historySection.classList.add(
    "hidden"
  );

  invoiceForm.classList.add(
    "hidden"
  );

  previewSection.classList.remove(
    "hidden"
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


deleteSlipButton.addEventListener(
  "click",
  function () {

    const slipId =
      deleteSlipButton.dataset.slipId;


    if (!slipId) {

      return;

    }


    const confirmed =
      confirm(
        "Delete this saved slip? " +
        "This cannot be undone."
      );


    if (!confirmed) {

      return;

    }


    deleteSlip(slipId);


    previewSection.classList.add(
      "hidden"
    );


    historySection.classList.remove(
      "hidden"
    );


    renderHistoryList();

  }
);


/* =========================
   LOAD HTML2CANVAS
========================= */

function loadHtml2Canvas() {

  return new Promise(function (resolve, reject) {

    if (window.html2canvas) {
      resolve();
      return;
    }

    const urls = [
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
    ];

    let current = 0;

    function tryNext() {

      if (current >= urls.length) {
        reject(
          new Error("Image generator could not be loaded.")
        );
        return;
      }

      const script =
        document.createElement("script");

      script.src = urls[current];

      script.onload = function () {

        if (window.html2canvas) {
          resolve();
        } else {
          current++;
          tryNext();
        }

      };

      script.onerror = function () {

        current++;
        tryNext();

      };

      document.head.appendChild(script);

    }

    tryNext();

  });

}
/* =========================
   WAIT FOR LOGO
========================= */

function waitForLogo() {

  const logo =
    document.querySelector(
      ".invoice-logo img"
    );


  if (!logo) {

    return Promise.resolve();

  }


  if (logo.complete) {

    return Promise.resolve();

  }


  return new Promise(
    function (resolve) {

      logo.onload = resolve;

      logo.onerror = resolve;

    }
  );

}


/* =========================
   LOAD JSPDF
========================= */

function loadJsPDF() {

  return new Promise(function (resolve, reject) {

    if (
      window.jspdf &&
      window.jspdf.jsPDF
    ) {
      resolve();
      return;
    }

    const urls = [
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
    ];

    let current = 0;

    function tryNext() {

      if (current >= urls.length) {
        reject(
          new Error("PDF generator could not be loaded.")
        );
        return;
      }

      const script =
        document.createElement("script");

      script.src = urls[current];

      script.onload = function () {

        if (
          window.jspdf &&
          window.jspdf.jsPDF
        ) {
          resolve();
        } else {
          current++;
          tryNext();
        }

      };

      script.onerror = function () {

        current++;
        tryNext();

      };

      document.head.appendChild(script);

    }

    tryNext();

  });

}


/* =========================
   RENDER INVOICE TO CANVAS
   (shared by image + PDF export)
========================= */

async function createInvoiceCanvas() {

  await loadHtml2Canvas();

  await waitForLogo();


  const invoiceElement =
    document.getElementById(
      "invoice"
    );


  return await html2canvas(
    invoiceElement,
    {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth:
        invoiceElement.scrollWidth
    }
  );

}


/* =========================
   CREATE INVOICE IMAGE
========================= */

async function createInvoiceImage() {

  const canvas =
    await createInvoiceCanvas();


  return new Promise(
    function (resolve, reject) {

      canvas.toBlob(
        function (blob) {

          if (blob) {

            resolve(blob);

          } else {

            reject(
              new Error(
                "Could not create image."
              )
            );

          }

        },
        "image/png"
      );

    }
  );

}


/* =========================
   CREATE INVOICE PDF
   Sized to match the receipt's own
   pixel dimensions, not A4 — so the
   PDF stays the same narrow shape
   as the on-screen slip.
========================= */

async function createInvoicePDF() {

  await loadJsPDF();


  const canvas =
    await createInvoiceCanvas();


  const jsPDFCtor =
    window.jspdf.jsPDF;


  const pdf =
    new jsPDFCtor({
      unit: "px",
      format: [
        canvas.width,
        canvas.height
      ],
      hotfixes: ["px_scaling"]
    });


  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    0,
    0,
    canvas.width,
    canvas.height
  );


  return pdf.output("blob");

}


/* =========================
   SHARE INVOICE
========================= */

shareButton.addEventListener(
  "click",
  async function () {

    try {

      shareButton.disabled = true;

      shareButton.textContent =
        "Preparing...";


      const imageBlob =
        await createInvoiceImage();


      const number =
        document.getElementById(
          "invoiceNumber"
        ).textContent;


      const isLoan =
        !loanBadge.classList.contains(
          "hidden"
        );


      const filePrefix =
        isLoan
          ? "Loan-Slip-"
          : "Luggage-Luxury-";


      const file =
        new File(
          [
            imageBlob
          ],
          filePrefix +
          number +
          ".png",
          {
            type: "image/png"
          }
        );


      /*
       ANDROID FILE SHARING
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
            (
              isLoan
                ? "Loan Slip "
                : "Invoice "
            ) +
            number,

          files: [file]

        });


      } else {

        /*
         FALLBACK:
         DOWNLOAD ACTUAL IMAGE
        */

        const url =
          URL.createObjectURL(
            imageBlob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href = url;


        link.download =
          filePrefix +
          number +
          ".png";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
          url
        );


        alert(
          "The image was downloaded. You can attach it to WhatsApp."
        );

      }

    } catch (error) {

      console.error(
        "Share error:",
        error
      );


      if (
        error.name !==
        "AbortError"
      ) {

        alert(
          "Unable to create the image. Please try again."
        );

      }

    } finally {

      shareButton.disabled = false;

      shareButton.textContent =
        "Share Image";

    }

  }
);


/* =========================
   SAVE / SHARE AS PDF
========================= */

pdfButton.addEventListener(
  "click",
  async function () {

    try {

      pdfButton.disabled = true;

      pdfButton.textContent =
        "Preparing...";


      const pdfBlob =
        await createInvoicePDF();


      const number =
        document.getElementById(
          "invoiceNumber"
        ).textContent;


      const isLoan =
        !loanBadge.classList.contains(
          "hidden"
        );


      const filePrefix =
        isLoan
          ? "Loan-Slip-"
          : "Luggage-Luxury-";


      const file =
        new File(
          [
            pdfBlob
          ],
          filePrefix +
          number +
          ".pdf",
          {
            type: "application/pdf"
          }
        );


      /*
       ANDROID FILE SHARING
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
            (
              isLoan
                ? "Loan Slip "
                : "Invoice "
            ) +
            number,

          files: [file]

        });


      } else {

        /*
         FALLBACK:
         DOWNLOAD ACTUAL PDF
        */

        const url =
          URL.createObjectURL(
            pdfBlob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href = url;


        link.download =
          filePrefix +
          number +
          ".pdf";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
          url
        );


        alert(
          "The PDF was downloaded. You can attach it to WhatsApp."
        );

      }

    } catch (error) {

      console.error(
        "PDF error:",
        error
      );


      if (
        error.name !==
        "AbortError"
      ) {

        alert(
          "Unable to create the PDF. Please try again."
        );

      }

    } finally {

      pdfButton.disabled = false;

      pdfButton.textContent =
        "📄 Save as PDF";

    }

  }
);


/* =========================
   START APP
========================= */

renderItems();

updateTotals();

updateFormForType();
