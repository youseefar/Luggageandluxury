const items = [];

let paymentMethod = "Bank Transfer";

let documentType = "invoice"; // "invoice" | "loan"

let invoiceCounter =
  Number(localStorage.getItem("invoiceCounter")) || 1;


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

const invoiceForm =
  document.getElementById("invoiceForm");

const previewSection =
  document.getElementById("previewSection");

const customerName =
  document.getElementById("customerName");

const customerPhone =
  document.getElementById("customerPhone");

const invoice =
  document.getElementById("invoice");

const shareButton =
  document.getElementById("shareButton");

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

const loanBadge =
  document.getElementById("loanBadge");

const grandTotalLabel =
  document.getElementById("grandTotalLabel");

const thankYouTitle =
  document.getElementById("thankYouTitle");

const thankYouSubtitle =
  document.getElementById("thankYouSubtitle");


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
   CREATE PREVIEW
========================= */

function createInvoicePreview() {

  const isLoan =
    documentType === "loan";


  const invoiceNumber =
    (isLoan ? "LN-" : "INV-") +
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
  ).textContent =
    invoiceNumber;


  document.getElementById(
    "invoiceDate"
  ).textContent =
    date;


  /* TYPE-SPECIFIC LABELS */

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


  /* DUE DATE */

  if (
    isLoan &&
    dueDateInput.value
  ) {

    const due =
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


    invoiceDueDateElement.textContent =
      due;


    invoiceDueDateRow.classList.remove(
      "hidden"
    );

  } else {

    invoiceDueDateRow.classList.add(
      "hidden"
    );

  }


  /* CUSTOMER */

  const name =
    customerName.value.trim();

  const phone =
    customerPhone.value.trim();


  const customerBox =
    document.getElementById(
      "customerDetails"
    );


  if (name || phone) {

    customerBox.innerHTML = `

      <strong>
        Customer
      </strong>

      <br>

      ${
        name
          ? escapeHTML(name)
          : "Customer"
      }

      ${
        phone
          ? " · " +
            escapeHTML(phone)
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

  const invoiceItems =
    document.getElementById(
      "invoiceItems"
    );


  invoiceItems.innerHTML = "";


  items.forEach(
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


      invoiceItems.appendChild(row);

    }
  );


  /* TOTALS */

  document.getElementById(
    "invoiceSubtotal"
  ).textContent =
    money(
      getSubtotal()
    );


  document.getElementById(
    "invoiceDiscount"
  ).textContent =
    money(
      getDiscount()
    );


  document.getElementById(
    "invoiceTotal"
  ).textContent =
    money(
      getTotal()
    );


  document.getElementById(
    "invoicePayment"
  ).textContent =
    paymentMethod;

}


/* =========================
   BACK BUTTON
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
   CREATE INVOICE IMAGE
========================= */

async function createInvoiceImage() {

  await loadHtml2Canvas();

  await waitForLogo();


  const invoiceElement =
    document.getElementById(
      "invoice"
    );


  const canvas =
    await html2canvas(
      invoiceElement,
      {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      }
    );


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


      const filePrefix =
        documentType === "loan"
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
              documentType === "loan"
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
        "Share";

    }

  }
);


/* =========================
   START APP
========================= */

renderItems();

updateTotals();

updateFormForType();
