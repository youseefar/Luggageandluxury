const state = {
    items: [],
    paymentMethod: "Bank Transfer",
    documentType: "invoice",
    invoiceCounter: Number(localStorage.getItem("invoiceCounter")) || 1,
    currentSlip: null,
    displayedSlip: null,
    isHistoryView: false,
    isEditing: false,
    editingSlipId: null,
    historyFilter: "all"
};

const STORAGE_KEY = "llaSlips";
const SETTINGS_KEY = "llaBusinessSettings";

const DEFAULT_SETTINGS = {
    name: "LUGGAGE & LUXURY AFFAIRS",
    tagline: "WHERE LUXURY AND AFFORDABILITY MEET",
    address: "No. 11 & 12 Asada Plaza, Behind A•Y Maikifi Filling Station, Maiduguri Road, Kano.",
    phone: "08032013137 · 09075475562",
    bank: "Moniepoint",
    accountName: "Usman Salamatu",
    accountNumber: "5214643891"
};

// ============================
// DOM REFERENCES
// ============================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const DOM = {
    itemName: $('#itemName'),
    itemQuantity: $('#itemQuantity'),
    itemPrice: $('#itemPrice'),
    addItemButton: $('#addItem'),
    itemList: $('#itemList'),
    discountInput: $('#discount'),
    subtotalElement: $('#subtotal'),
    totalElement: $('#total'),
    previewButton: $('#previewButton'),
    backButton: $('#backButton'),
    newInvoiceButton: $('#newInvoice'),
    deleteSlipButton: $('#deleteSlipButton'),
    editSlipButton: $('#editSlipButton'),
    duplicateSlipButton: $('#duplicateSlipButton'),
    markSettledButton: $('#markSettledButton'),
    invoiceForm: $('#invoiceForm'),
    previewSection: $('#previewSection'),
    historySection: $('#historySection'),
    historyList: $('#historyList'),
    historySearch: $('#historySearch'),
    filterChips: $$('.chip'),
    exportCsvButton: $('#exportCsvButton'),
    customerName: $('#customerName'),
    customerPhone: $('#customerPhone'),
    customerNote: $('#customerNote'),
    dueDateInput: $('#dueDate'),
    dueDateWrap: $('#dueDateWrap'),
    invoice: $('#invoice'),
    invoiceNumber: $('#invoiceNumber'),
    invoiceDate: $('#invoiceDate'),
    invoiceSlipId: $('#invoiceSlipId'),
    invoiceTypeHeading: $('#invoiceTypeHeading'),
    invoiceNoLabel: $('#invoiceNoLabel'),
    invoiceDueDateRow: $('#invoiceDueDateRow'),
    invoiceDueDate: $('#invoiceDueDate'),
    statusBadge: $('#statusBadge'),
    grandTotalLabel: $('#grandTotalLabel'),
    thankYouTitle: $('#thankYouTitle'),
    thankYouSubtitle: $('#thankYouSubtitle'),
    customerDetails: $('#customerDetails'),
    noteDetails: $('#noteDetails'),
    invoiceItems: $('#invoiceItems'),
    invoiceSubtotal: $('#invoiceSubtotal'),
    invoiceDiscount: $('#invoiceDiscount'),
    invoiceTotal: $('#invoiceTotal'),
    invoicePayment: $('#invoicePayment'),
    formLabel: $('#formLabel'),
    formHeading: $('#formHeading'),
    formTotalLabel: $('#formTotalLabel'),
    shareButton: $('#shareButton'),
    pdfButton: $('#pdfButton'),
    printButton: $('#printButton'),
    whatsappButton: $('#whatsappButton'),
    viewTabs: $$('.view-tab'),
    doctypeButtons: $$('.doctype'),
    paymentButtons: $$('.payment'),
    settingsButton: $('#settingsButton'),
    closeSettings: $('#closeSettings'),
    saveSettings: $('#saveSettings'),
    settingsModal: $('#settingsModal'),
    settingsName: $('#settingsName'),
    settingsTagline: $('#settingsTagline'),
    settingsAddress: $('#settingsAddress'),
    settingsPhone: $('#settingsPhone'),
    settingsBank: $('#settingsBank'),
    settingsAccountName: $('#settingsAccountName'),
    settingsAccountNumber: $('#settingsAccountNumber'),
    headerBusinessName: $('#headerBusinessName'),
    headerBusinessTagline: $('#headerBusinessTagline'),
    invoiceBusinessName: $('#invoiceBusinessName'),
    invoiceBusinessTagline: $('#invoiceBusinessTagline'),
    invoiceBusinessAddress: $('#invoiceBusinessAddress'),
    invoiceBusinessPhone: $('#invoiceBusinessPhone'),
    invoicePaymentBank: $('#invoicePaymentBank'),
    invoicePaymentAccountName: $('#invoicePaymentAccountName'),
    invoicePaymentAccountNumber: $('#invoicePaymentAccountNumber')
};

// ============================
// UTILITY FUNCTIONS
// ============================
function money(value) {
    return "₦" + Number(value || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateSlipId() {
    const time = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "SLP-" + time + random;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatToday() {
    return new Date().toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideUp 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================
// BUSINESS SETTINGS
// ============================

function getBusinessSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        return { ...DEFAULT_SETTINGS, ...(saved || {}) };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveBusinessSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyBusinessSettings() {
    const s = getBusinessSettings();
    
    DOM.headerBusinessName.textContent = s.name;
    DOM.headerBusinessTagline.textContent = s.tagline;
    
    DOM.invoiceBusinessName.textContent = s.name;
    DOM.invoiceBusinessTagline.textContent = s.tagline;
    DOM.invoiceBusinessAddress.innerHTML = escapeHTML(s.address).replace(/,\s*/g, ',<br>');
    DOM.invoiceBusinessPhone.textContent = s.phone;
    
    DOM.invoicePaymentBank.textContent = s.bank;
    DOM.invoicePaymentAccountName.textContent = s.accountName;
    DOM.invoicePaymentAccountNumber.textContent = s.accountNumber;
}

function openSettingsModal() {
    const s = getBusinessSettings();
    DOM.settingsName.value = s.name;
    DOM.settingsTagline.value = s.tagline;
    DOM.settingsAddress.value = s.address;
    DOM.settingsPhone.value = s.phone;
    DOM.settingsBank.value = s.bank;
    DOM.settingsAccountName.value = s.accountName;
    DOM.settingsAccountNumber.value = s.accountNumber;
    DOM.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    DOM.settingsModal.classList.add('hidden');
}

function handleSaveSettings() {
    const settings = {
        name: DOM.settingsName.value.trim() || DEFAULT_SETTINGS.name,
        tagline: DOM.settingsTagline.value.trim() || DEFAULT_SETTINGS.tagline,
        address: DOM.settingsAddress.value.trim() || DEFAULT_SETTINGS.address,
        phone: DOM.settingsPhone.value.trim() || DEFAULT_SETTINGS.phone,
        bank: DOM.settingsBank.value.trim() || DEFAULT_SETTINGS.bank,
        accountName: DOM.settingsAccountName.value.trim() || DEFAULT_SETTINGS.accountName,
        accountNumber: DOM.settingsAccountNumber.value.trim() || DEFAULT_SETTINGS.accountNumber
    };
    
    saveBusinessSettings(settings);
    applyBusinessSettings();
    closeSettingsModal();
    showToast('Business settings saved!', 'success');
}

// ============================
// STORAGE FUNCTIONS
// ============================

function getSavedSlips() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveSlips(slips) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
}

function upsertSlip(slip) {
    const slips = getSavedSlips();
    const index = slips.findIndex(s => s.slipId === slip.slipId);
    
    if (index >= 0) {
        slips[index] = { ...slips[index], ...slip };
    } else {
        slips.unshift(slip);
    }
    
    saveSlips(slips);
    return slip;
}

function deleteSlip(slipId) {
    const slips = getSavedSlips().filter(s => s.slipId !== slipId);
    saveSlips(slips);
}

function findSlipById(slipId) {
    return getSavedSlips().find(s => s.slipId === slipId);
}

// ============================
// TOGGLE FUNCTIONS
// ============================

function setDocumentType(type) {
    state.documentType = type;
    
    DOM.doctypeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    const isLoan = type === 'loan';
    DOM.formLabel.textContent = isLoan ? 'DEBT PAYMENT' : 'INVOICE';
    DOM.formHeading.textContent = isLoan ? 'Create New Debt Payment Invoice' : 'Create New Invoice';
    DOM.formTotalLabel.textContent = isLoan ? 'Amount Owed' : 'Total';
    DOM.dueDateWrap.classList.toggle('hidden', !isLoan);
}

function setPaymentMethod(method) {
    state.paymentMethod = method;
    DOM.paymentButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
}

function switchTab(view) {
    DOM.viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });
    
    DOM.invoiceForm.classList.toggle('hidden', view !== 'form');
    DOM.historySection.classList.toggle('hidden', view !== 'history');
    DOM.previewSection.classList.add('hidden');
}

// ============================
// ITEM MANAGEMENT
// ============================
                          function addItem() {
    const name = DOM.itemName.value.trim();
    const quantity = Number(DOM.itemQuantity.value);
    const price = Number(DOM.itemPrice.value);
    
    if (!name) {
        showToast('Please enter the item name.', 'error');
        DOM.itemName.focus();
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity.', 'error');
        DOM.itemQuantity.focus();
        return;
    }
    
    if (!Number.isFinite(price) || price < 0) {
        showToast('Please enter a valid price.', 'error');
        DOM.itemPrice.focus();
        return;
    }
    
    state.items.push({ name, quantity, price });
    
    DOM.itemName.value = '';
    DOM.itemQuantity.value = '1';
    DOM.itemPrice.value = '';
    
    renderItems();
    DOM.itemName.focus();
    showToast(`Added "${name}"`, 'success');
}

function removeItem(index) {
    const item = state.items[index];
    state.items.splice(index, 1);
    renderItems();
    showToast(`Removed "${item.name}"`, 'info');
}

function renderItems() {
    if (state.items.length === 0) {
        DOM.itemList.innerHTML = `
            <div class="empty">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">🛒</span>
                No items added yet.
            </div>
        `;
        updateTotals();
        return;
    }
    
    DOM.itemList.innerHTML = '';
    
    state.items.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <div class="item-info">
                <strong>${escapeHTML(item.name)}</strong>
                <span>${item.quantity} × ${money(item.price)}</span>
            </div>
            <div class="item-total">
                <strong>${money(itemTotal)}</strong>
                <button type="button" class="delete-item" data-index="${index}">✕</button>
            </div>
        `;
        DOM.itemList.appendChild(div);
    });
    
    DOM.itemList.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.index);
            removeItem(index);
        });
    });
    
    updateTotals();
}

// ============================
// CALCULATIONS
// ============================

function getSubtotal() {
    return state.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

function getDiscount() {
    return Math.max(0, Number(DOM.discountInput.value) || 0);
}

function getTotal() {
    return Math.max(0, getSubtotal() - getDiscount());
}

function updateTotals() {
    DOM.subtotalElement.textContent = money(getSubtotal());
    DOM.totalElement.textContent = money(getTotal());
}

// ============================
// INVOICE NUMBER GENERATION
// (guarantees no two slips ever share a number)
// ============================

function generateUniqueInvoiceNumber(isLoan) {
    const prefix = isLoan ? 'DPI-' : 'INV-';
    const existingNumbers = new Set(getSavedSlips().map(s => s.invoiceNumber));
    
    let num = state.invoiceCounter;
    let candidate = prefix + String(num).padStart(6, '0');
    
    while (existingNumbers.has(candidate)) {
        num++;
        candidate = prefix + String(num).padStart(6, '0');
    }
    
    state.invoiceCounter = num + 1;
    localStorage.setItem('invoiceCounter', state.invoiceCounter);
    
    return candidate;
}

// ============================
// BUILD SLIP DATA
// ============================

function buildSlipData() {
    const isLoan = state.documentType === 'loan';
    
    // Reuse the same identity (slipId + invoiceNumber) while still editing
    // the same draft, so re-previewing never creates a duplicate number.
    // Only a brand new draft (state.currentSlip is null) gets a fresh number.
    const slipId = state.currentSlip ? state.currentSlip.slipId : generateSlipId();
    const invoiceNumber = state.currentSlip
        ? state.currentSlip.invoiceNumber
        : generateUniqueInvoiceNumber(isLoan);
    const date = state.currentSlip ? state.currentSlip.date : formatToday();
    const status = isLoan ? (state.currentSlip?.status || 'unpaid') : 'paid';
    
    const slip = {
        slipId: slipId,
        invoiceNumber: invoiceNumber,
        type: state.documentType,
        status: status,
        date: date,
        dueDate: isLoan && DOM.dueDateInput.value ? formatDate(DOM.dueDateInput.value) : '',
        dueDateRaw: isLoan && DOM.dueDateInput.value ? DOM.dueDateInput.value : '',
        customerName: DOM.customerName.value.trim(),
        customerPhone: DOM.customerPhone.value.trim(),
        note: DOM.customerNote.value.trim(),
        items: state.items.map(item => ({ ...item })),
        subtotal: getSubtotal(),
        discount: getDiscount(),
        total: getTotal(),
        paymentMethod: state.paymentMethod,
        createdAt: state.currentSlip ? state.currentSlip.createdAt : new Date().toISOString()
    };
    
    return slip;
}

// ============================
// RENDER INVOICE
// ============================
      function isOverdue(slip) {
    if (slip.type !== 'loan' || slip.status === 'settled' || !slip.dueDateRaw) return false;
    const today = new Date().toISOString().slice(0, 10);
    return slip.dueDateRaw < today;
}

function renderInvoice(data) {
    state.displayedSlip = data;
    const isLoan = data.type === 'loan';
    const overdue = isOverdue(data);
    
    DOM.invoiceNumber.textContent = data.invoiceNumber;
    DOM.invoiceDate.textContent = data.date;
    DOM.invoiceSlipId.textContent = data.slipId;
    
    DOM.invoiceTypeHeading.textContent = isLoan ? 'DEBT PAYMENT INVOICE' : 'INVOICE';
    DOM.invoiceNoLabel.textContent = 'Invoice No:';
    DOM.grandTotalLabel.textContent = isLoan ? 'AMOUNT OWED' : 'TOTAL';
    
    DOM.thankYouTitle.textContent = 'Thank you for your patronage.';
    DOM.thankYouSubtitle.textContent = 'Please make payment using the account details above.';
    
    if (isLoan) {
        DOM.statusBadge.classList.remove('hidden');
        if (data.status === 'settled') {
            DOM.statusBadge.className = 'status-badge settled';
            DOM.statusBadge.textContent = '✅ SETTLED — PAID IN FULL';
        } else if (overdue) {
            DOM.statusBadge.className = 'status-badge overdue';
            DOM.statusBadge.textContent = '⚠ OVERDUE — PAST DUE DATE';
        } else {
            DOM.statusBadge.className = 'status-badge unpaid';
            DOM.statusBadge.textContent = '⏳ UNPAID BALANCE';
        }
    } else {
        DOM.statusBadge.classList.add('hidden');
    }
    
    if (isLoan && data.dueDate) {
        DOM.invoiceDueDate.textContent = data.dueDate;
        DOM.invoiceDueDateRow.classList.remove('hidden');
    } else {
        DOM.invoiceDueDateRow.classList.add('hidden');
    }
    
    if (data.customerName || data.customerPhone) {
        DOM.customerDetails.innerHTML = `
            <strong>Customer</strong><br>
            ${data.customerName ? escapeHTML(data.customerName) : 'Customer'}
            ${data.customerPhone ? ' · ' + escapeHTML(data.customerPhone) : ''}
        `;
    } else {
        DOM.customerDetails.innerHTML = `
            <strong>Customer:</strong> Walk-in Customer
        `;
    }
    
    if (data.note) {
        DOM.noteDetails.innerHTML = `<strong>Note:</strong> ${escapeHTML(data.note)}`;
        DOM.noteDetails.classList.remove('hidden');
    } else {
        DOM.noteDetails.classList.add('hidden');
    }
    
    DOM.invoiceItems.innerHTML = '';
    data.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHTML(item.name)}</td>
            <td>${item.quantity}</td>
            <td>${money(item.price)}</td>
            <td>${money(item.quantity * item.price)}</td>
        `;
        DOM.invoiceItems.appendChild(row);
    });
    
    DOM.invoiceSubtotal.textContent = money(data.subtotal);
    DOM.invoiceDiscount.textContent = money(data.discount);
    DOM.invoiceTotal.textContent = money(data.total);
    DOM.invoicePayment.textContent = data.paymentMethod;
    
    if (isLoan && data.status !== 'settled') {
        DOM.markSettledButton.classList.remove('hidden');
        DOM.markSettledButton.dataset.slipId = data.slipId;
    } else {
        DOM.markSettledButton.classList.add('hidden');
    }
}

// ============================
// PREVIEW ACTIONS
// ============================

function showPreview() {
    if (state.items.length === 0) {
        showToast('Please add at least one item.', 'error');
        return;
    }
    
    const slip = buildSlipData();
    state.currentSlip = slip;
    upsertSlip(slip);
    renderInvoice(slip);
    
    state.isHistoryView = false;
    DOM.backButton.textContent = '← Edit';
    DOM.newInvoiceButton.classList.remove('hidden');
    DOM.deleteSlipButton.classList.add('hidden');
    DOM.editSlipButton.classList.add('hidden');
    DOM.duplicateSlipButton.classList.add('hidden');
    
    DOM.invoiceForm.classList.add('hidden');
    DOM.previewSection.classList.remove('hidden');
    DOM.historySection.classList.add('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    DOM.previewSection.classList.add('hidden');
    
    if (state.isHistoryView) {
        DOM.historySection.classList.remove('hidden');
        renderHistoryList();
    } else {
        DOM.invoiceForm.classList.remove('hidden');
        switchTab('form');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    state.items = [];
    DOM.customerName.value = '';
    DOM.customerPhone.value = '';
    DOM.customerNote.value = '';
    DOM.itemName.value = '';
    DOM.itemQuantity.value = '1';
    DOM.itemPrice.value = '';
    DOM.discountInput.value = '';
    DOM.dueDateInput.value = '';
    
    state.currentSlip = null;
    state.isEditing = false;
    state.editingSlipId = null;
    
    setPaymentMethod('Bank Transfer');
    renderItems();
    updateTotals();
}

function newInvoice() {
    resetForm();
    switchTab('form');
    DOM.previewSection.classList.add('hidden');
    showToast('Ready for new invoice!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================
// HISTORY FUNCTIONS
// ============================
function matchesFilter(slip, filter) {
    if (filter === 'all') return true;
    if (filter === 'invoice') return slip.type === 'invoice';
    if (filter === 'loan') return slip.type === 'loan';
      if (filter === 'unpaid') return slip.type === 'loan' && slip.status !== 'settled';
    if (filter === 'overdue') return isOverdue(slip);
    return true;
}

function renderHistoryList() {
    const query = (DOM.historySearch.value || '').trim().toLowerCase();
    const slips = getSavedSlips();
    
    let filtered = !query ? slips : slips.filter(slip => {
        return (
            slip.slipId.toLowerCase().includes(query) ||
            slip.invoiceNumber.toLowerCase().includes(query) ||
            (slip.customerName || '').toLowerCase().includes(query)
        );
    });
    
    filtered = filtered.filter(slip => matchesFilter(slip, state.historyFilter));
    
    if (slips.length === 0) {
        DOM.historyList.innerHTML = `
            <div class="empty">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📭</span>
                No slips saved yet.
            </div>
        `;
        return;
    }
    
    if (filtered.length === 0) {
        DOM.historyList.innerHTML = `
            <div class="empty">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔍</span>
                No matching slips found.
            </div>
        `;
        return;
    }
    
    const totalSales = slips.filter(s => s.type === 'invoice').length;
    const totalLoans = slips.filter(s => s.type === 'loan').length;
    const totalAmount = slips.reduce((sum, s) => sum + (s.total || 0), 0);
    const outstanding = slips
        .filter(s => s.type === 'loan' && s.status !== 'settled')
        .reduce((sum, s) => sum + (s.total || 0), 0);
    
    const statsHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
            <div class="stat-card" style="background: #f0fdf4; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${totalSales}</div>
                <div style="font-size: 11px; color: #666;">Invoices</div>
            </div>
            <div class="stat-card" style="background: #fef2f2; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${totalLoans}</div>
                <div style="font-size: 11px; color: #666;">Debt Payments</div>
            </div>
            <div class="stat-card" style="background: #fefce8; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #ca8a04;">${money(totalAmount)}</div>
                <div style="font-size: 11px; color: #666;">Total</div>
            </div>
            <div class="stat-card" style="background: #fef2f2; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${money(outstanding)}</div>
                <div style="font-size: 11px; color: #666;">Outstanding</div>
            </div>
        </div>
    `;
    
    DOM.historyList.innerHTML = statsHTML;
    
    filtered.forEach(slip => {
        const card = document.createElement('div');
        card.className = 'history-card';
        const isLoan = slip.type === 'loan';
        const overdue = isOverdue(slip);
        
        let badgeClass = isLoan ? 'loan' : 'invoice';
        let badgeText = isLoan ? '💳 DEBT PAYMENT' : '🧾 INVOICE';
        if (isLoan && slip.status === 'settled') {
            badgeClass = 'settled';
            badgeText = '✅ SETTLED';
        } else if (overdue) {
            badgeClass = 'overdue';
            badgeText = '⚠ OVERDUE';
        }
        
        card.innerHTML = `
            <div class="history-card-top">
                <span class="history-badge ${badgeClass}">
                    ${badgeText}
                </span>
                <span class="history-date">${escapeHTML(slip.date || '')}</span>
            </div>
            <div class="history-card-mid">
                <strong>${escapeHTML(slip.customerName || 'Walk-in Customer')}</strong>
                <span>${escapeHTML(slip.invoiceNumber)} · ${escapeHTML(slip.slipId)}</span>
                ${slip.dueDate ? `<span style="color: #dc2626; font-size: 10px;">Due: ${escapeHTML(slip.dueDate)}</span>` : ''}
            </div>
            <div class="history-card-bottom">
                ${money(slip.total)}
            </div>
        `;
        
        card.addEventListener('click', () => openSlipFromHistory(slip.slipId));
        DOM.historyList.appendChild(card);
    });
}

function setHistoryFilter(filter) {
    state.historyFilter = filter;
    DOM.filterChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    renderHistoryList();
}

function openSlipFromHistory(slipId) {
    const slip = findSlipById(slipId);
    if (!slip) {
        showToast('Slip not found.', 'error');
        return;
    }
    
    renderInvoice(slip);
    
    state.isHistoryView = true;
    state.currentSlip = null;
    
    DOM.backButton.textContent = '← Back to History';
    DOM.newInvoiceButton.classList.add('hidden');
    DOM.deleteSlipButton.classList.remove('hidden');
    DOM.deleteSlipButton.dataset.slipId = slip.slipId;
    DOM.editSlipButton.classList.remove('hidden');
    DOM.editSlipButton.dataset.slipId = slip.slipId;
    DOM.duplicateSlipButton.classList.remove('hidden');
    DOM.duplicateSlipButton.dataset.slipId = slip.slipId;
    
    DOM.historySection.classList.add('hidden');
    DOM.invoiceForm.classList.add('hidden');
    DOM.previewSection.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteSlipFromHistory(slipId) {
    if (!slipId) return;
    
    const confirmed = confirm('Delete this saved slip? This cannot be undone.');
    if (!confirmed) return;
    
    deleteSlip(slipId);
    showToast('Slip deleted.', 'error');
    
    DOM.previewSection.classList.add('hidden');
    DOM.historySection.classList.remove('hidden');
    renderHistoryList();
}

function loadSlipIntoForm(slip, { asNew } = { asNew: false }) {
    state.items = slip.items.map(i => ({ ...i }));
    state.currentSlip = asNew ? null : slip;
    state.documentType = slip.type;
    
    DOM.customerName.value = slip.customerName || '';
    DOM.customerPhone.value = slip.customerPhone || '';
    DOM.customerNote.value = slip.note || '';
    DOM.discountInput.value = slip.discount || '';
    DOM.dueDateInput.value = asNew ? '' : (slip.dueDateRaw || '');
    
    setDocumentType(slip.type);
    setPaymentMethod(slip.paymentMethod || 'Bank Transfer');
    renderItems();
    updateTotals();
    
    state.isHistoryView = false;
    DOM.previewSection.classList.add('hidden');
    DOM.invoiceForm.classList.remove('hidden');
    switchTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editSlipFromHistory(slipId) {
    const slip = findSlipById(slipId);
    if (!slip) {
        showToast('Slip not found.', 'error');
        return;
    }
    loadSlipIntoForm(slip, { asNew: false });
    showToast('Editing invoice — make your changes, then Preview to save.', 'info');
}

function duplicateSlipFromHistory(slipId) {
    const slip = findSlipById(slipId);
    if (!slip) {
        showToast('Slip not found.', 'error');
        return;
    }
    loadSlipIntoForm(slip, { asNew: true });
    showToast('Duplicated — review the details and generate a new invoice.', 'info');
}

function markSlipAsSettled(slipId) {
    const slip = findSlipById(slipId);
    if (!slip) {
        showToast('Slip not found.', 'error');
        return;
    }
    
    slip.status = 'settled';
    upsertSlip(slip);
    
    if (state.currentSlip && state.currentSlip.slipId === slipId) {
        state.currentSlip.status = 'settled';
    }
    
    renderInvoice(slip);
    showToast('Marked as settled — balance cleared!', 'success');
}

// ============================
// EXPORT FUNCTIONS
// ============================
async function loadHtml2Canvas() {
    if (window.html2canvas) return;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
    });
}

async function loadJsPDF() {
    if (window.jspdf?.jsPDF) return;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
    });
}

async function createInvoiceCanvas() {
    await loadHtml2Canvas();
    
    const logo = DOM.invoice.querySelector('.invoice-logo img');
    if (logo && !logo.complete) {
        await new Promise(resolve => {
            logo.onload = resolve;
            logo.onerror = resolve;
        });
    }
    
    return await html2canvas(DOM.invoice, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        windowWidth: DOM.invoice.scrollWidth
    });
}

async function shareImage() {
    try {
        DOM.shareButton.disabled = true;
        DOM.shareButton.textContent = '⏳ Preparing...';
        
        const canvas = await createInvoiceCanvas();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const number = DOM.invoiceNumber.textContent;
        const isLoan = state.displayedSlip?.type === 'loan';
        const prefix = isLoan ? 'Debt-Payment-' : 'Luggage-Luxury-';
        
        const file = new File([blob], prefix + number + '.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: 'Luggage & Luxury Affairs',
                text: (isLoan ? 'Debt Payment Invoice ' : 'Invoice ') + number,
                files: [file]
            });
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = prefix + number + '.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showToast('Image downloaded!', 'success');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('Failed to share image. Try again.', 'error');
            console.error('Share error:', error);
        }
    } finally {
        DOM.shareButton.disabled = false;
        DOM.shareButton.textContent = '📤 Share Image';
    }
}

async function savePDF() {
    try {
        DOM.pdfButton.disabled = true;
        DOM.pdfButton.textContent = '⏳ Generating...';
        
        const canvas = await createInvoiceCanvas();
        await loadJsPDF();
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            unit: 'px',
            format: [canvas.width, canvas.height],
            hotfixes: ['px_scaling']
        });
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        const blob = pdf.output('blob');
        
        const number = DOM.invoiceNumber.textContent;
        const isLoan = state.displayedSlip?.type === 'loan';
        const prefix = isLoan ? 'Debt-Payment-' : 'Luggage-Luxury-';
        const file = new File([blob], prefix + number + '.pdf', { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: 'Luggage & Luxury Affairs',
                text: (isLoan ? 'Debt Payment Invoice ' : 'Invoice ') + number,
                files: [file]
            });
                  } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = prefix + number + '.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showToast('PDF downloaded!', 'success');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('Failed to create PDF. Try again.', 'error');
            console.error('PDF error:', error);
        }
    } finally {
        DOM.pdfButton.disabled = false;
        DOM.pdfButton.textContent = '📄 Save as PDF';
    }
}

// ============================
// WHATSAPP SHARE
// ============================

function shareToWhatsApp() {
    const slip = state.displayedSlip;
    if (!slip) {
        showToast('Nothing to share yet.', 'error');
        return;
    }
    
    const isLoan = slip.type === 'loan';
    const label = isLoan ? 'Debt Payment Invoice' : 'Invoice';
    
    const lines = [
        `*${label} ${slip.invoiceNumber}*`,
        `Luggage & Luxury Affairs`,
        ``,
        `Customer: ${slip.customerName || 'Walk-in Customer'}`,
        `Date: ${slip.date}`
    ];
    
    if (isLoan && slip.dueDate) {
        lines.push(`Due: ${slip.dueDate}`);
    }
    
    lines.push(``, `Total: ${money(slip.total)}`);
    
    if (isLoan) {
        lines.push(slip.status === 'settled' ? 'Status: Settled ✅' : 'Status: Unpaid ⏳');
    }
    
    lines.push(``, `Slip ID: ${slip.slipId}`);
    
    const message = encodeURIComponent(lines.join('\n'));
    const phone = (slip.customerPhone || '').replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    
    window.open(url, '_blank');
}

// ============================
// PRINT
// ============================

function printInvoice() {
    window.print();
}

// ============================
// CSV EXPORT
// ============================

function exportHistoryToCSV() {
    const slips = getSavedSlips();
    
    if (slips.length === 0) {
        showToast('No saved slips to export.', 'error');
        return;
    }
    
    const headers = [
        'Invoice Number', 'Slip ID', 'Type', 'Status', 'Date', 'Due Date',
        'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Discount',
        'Total', 'Payment Method', 'Note'
    ];
    
    const csvEscape = (value) => {
        const str = String(value ?? '');
        return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
    };
    
    const rows = slips.map(slip => [
        slip.invoiceNumber,
        slip.slipId,
        slip.type === 'loan' ? 'Debt Payment' : 'Invoice',
        slip.type === 'loan' ? (slip.status === 'settled' ? 'Settled' : 'Unpaid') : 'Paid',
        slip.date,
        slip.dueDate || '',
        slip.customerName || '',
        slip.customerPhone || '',
        (slip.items || []).map(i => `${i.name} x${i.quantity}`).join('; '),
        slip.subtotal,
        slip.discount,
        slip.total,
        slip.paymentMethod,
        slip.note || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(csvEscape).join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Luggage-Luxury-Slips-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    
    showToast('CSV exported!', 'success');
}

// ============================
// EVENT LISTENERS
// ============================

DOM.addItemButton.addEventListener('click', addItem);

['itemName', 'itemQuantity', 'itemPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
            }
        });
    }
});

DOM.discountInput.addEventListener('input', updateTotals);

DOM.doctypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setDocumentType(btn.dataset.type);
    });
});

DOM.paymentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setPaymentMethod(btn.dataset.method);
    });
});

DOM.viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        switchTab(tab.dataset.view);
        if (tab.dataset.view === 'history') {
            renderHistoryList();
        }
    });
});

DOM.previewButton.addEventListener('click', showPreview);
DOM.backButton.addEventListener('click', goBack);
DOM.newInvoiceButton.addEventListener('click', newInvoice);

DOM.deleteSlipButton.addEventListener('click', function() {
    deleteSlipFromHistory(this.dataset.slipId);
});

DOM.editSlipButton.addEventListener('click', function() {
    editSlipFromHistory(this.dataset.slipId);
});

DOM.duplicateSlipButton.addEventListener('click', function() {
    duplicateSlipFromHistory(this.dataset.slipId);
});

DOM.markSettledButton.addEventListener('click', function() {
    markSlipAsSettled(this.dataset.slipId);
});

DOM.historySearch.addEventListener('input', () => {
    clearTimeout(DOM._searchTimeout);
    DOM._searchTimeout = setTimeout(renderHistoryList, 300);
});

DOM.filterChips.forEach(chip => {
    chip.addEventListener('click', () => setHistoryFilter(chip.dataset.filter));
});

DOM.exportCsvButton.addEventListener('click', exportHistoryToCSV);

DOM.shareButton.addEventListener('click', shareImage);
DOM.pdfButton.addEventListener('click', savePDF);
DOM.printButton.addEventListener('click', printInvoice);
DOM.whatsappButton.addEventListener('click', shareToWhatsApp);

DOM.settingsButton.addEventListener('click', openSettingsModal);
DOM.closeSettings.addEventListener('click', closeSettingsModal);
DOM.saveSettings.addEventListener('click', handleSaveSettings);
DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) closeSettingsModal();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!DOM.previewSection.classList.contains('hidden')) {
            goBack();
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!DOM.previewSection.classList.contains('hidden')) {
            showPreview();
        }
    }
});

// ============================
// INITIALIZE APP
// ============================
          function init() {
    applyBusinessSettings();
    setDocumentType('invoice');
    setPaymentMethod('Bank Transfer');
    renderItems();
    updateTotals();
    switchTab('form');
    
    window.addEventListener('beforeunload', () => {
        if (state.currentSlip) {
            upsertSlip(state.currentSlip);
        }
    });
    
    console.log('🏷️ Luggage & Luxury Affairs v3.0');
    console.log('📦 Ready to create invoices and debt payment invoices!');
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(20px); opacity: 0; }
    }
    .toast {
        animation: slideUp 0.3s ease;
    }
`;
document.head.appendChild(style);

init();

// ============================
// PWA - INSTALL PROMPT
// ============================

let deferredPrompt;
let installButton = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.className = 'button secondary install-app';
        installButton.textContent = '📲 Install App';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 12px 20px;
            border-radius: 50px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            animation: bounceIn 0.5s ease;
            font-size: 14px;
            border: none;
            cursor: pointer;
        `;
        
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            const result = await deferredPrompt.prompt();
            console.log('[PWA] Install result:', result);
            installButton.style.display = 'none';
            deferredPrompt = null;
        });
        
        document.body.appendChild(installButton);
    }
    
    installButton.style.display = 'flex';
    installButton.style.alignItems = 'center';
    installButton.style.gap = '8px';
});

window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed!');
    if (installButton) installButton.style.display = 'none';
});

// Add PWA styles if not exists
if (!document.querySelector('#pwa-styles')) {
    const pwaStyle = document.createElement('style');
    pwaStyle.id = 'pwa-styles';
    pwaStyle.textContent = `
        @keyframes bounceIn {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
        }
        .install-app {
            animation: bounceIn 0.5s ease;
        }
    `;
    document.head.appendChild(pwaStyle);
}
          
