const state = {
    items: [],
    paymentMethod: "Bank Transfer",
    documentType: "invoice", // "invoice" | "loan"
    invoiceCounter: Number(localStorage.getItem("invoiceCounter")) || 1,
    currentSlip: null,
    isHistoryView: false,
    isEditing: false,
    editingSlipId: null,
    isLoading: false
};

const STORAGE_KEY = "llaSlips";
const SETTINGS_KEY = "llaSettings";

// ============================
// DOM REFERENCES
// ============================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const DOM = {
    // Form elements
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
    invoiceForm: $('#invoiceForm'),
    previewSection: $('#previewSection'),
    historySection: $('#historySection'),
    historyList: $('#historyList'),
    historySearch: $('#historySearch'),
    customerName: $('#customerName'),
    customerPhone: $('#customerPhone'),
    dueDateInput: $('#dueDate'),
    dueDateWrap: $('#dueDateWrap'),
    
    // Invoice display elements
    invoice: $('#invoice'),
    invoiceNumber: $('#invoiceNumber'),
    invoiceDate: $('#invoiceDate'),
    invoiceSlipId: $('#invoiceSlipId'),
    invoiceTypeHeading: $('#invoiceTypeHeading'),
    invoiceNoLabel: $('#invoiceNoLabel'),
    invoiceDueDateRow: $('#invoiceDueDateRow'),
    invoiceDueDate: $('#invoiceDueDate'),
    loanBadge: $('#loanBadge'),
    grandTotalLabel: $('#grandTotalLabel'),
    thankYouTitle: $('#thankYouTitle'),
    thankYouSubtitle: $('#thankYouSubtitle'),
    customerDetails: $('#customerDetails'),
    invoiceItems: $('#invoiceItems'),
    invoiceSubtotal: $('#invoiceSubtotal'),
    invoiceDiscount: $('#invoiceDiscount'),
    invoiceTotal: $('#invoiceTotal'),
    invoicePayment: $('#invoicePayment'),
  
    // UI elements
    formLabel: $('#formLabel'),
    formHeading: $('#formHeading'),
    formTotalLabel: $('#formTotalLabel'),
    shareButton: $('#shareButton'),
    pdfButton: $('#pdfButton'),
    viewTabs: $$('.view-tab'),
    doctypeButtons: $$('.doctype'),
    paymentButtons: $$('.payment'),
    
    // Stats
    statsContainer: $('#statsContainer')
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

function debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
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
    DOM.formLabel.textContent = isLoan ? 'LOAN / IOU' : 'INVOICE';
    DOM.formHeading.textContent = isLoan ? 'Create New Loan Slip' : 'Create New Invoice';
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
// BUILD SLIP DATA
// ============================

function buildSlipData() {
    const isLoan = state.documentType === 'loan';
    const now = new Date();
    
    // Generate invoice number
    const prefix = isLoan ? 'LN-' : 'INV-';
    const num = String(state.invoiceCounter).padStart(6, '0');
    const invoiceNumber = prefix + num;
    
    // Build slip object
    const slip = {
        slipId: generateSlipId(),
        invoiceNumber: invoiceNumber,
        type: state.documentType,
        date: formatToday(),
        dueDate: isLoan && DOM.dueDateInput.value ? formatDate(DOM.dueDateInput.value) : '',
        customerName: DOM.customerName.value.trim(),
        customerPhone: DOM.customerPhone.value.trim(),
        items: state.items.map(item => ({ ...item })),
        subtotal: getSubtotal(),
        discount: getDiscount(),
        total: getTotal(),
        paymentMethod: state.paymentMethod,
        createdAt: now.toISOString()
    };
    
    return slip;
}

// ============================
// RENDER INVOICE
// ============================

function renderInvoice(data) {
    const isLoan = data.type === 'loan';
    
    // Basic info
    DOM.invoiceNumber.textContent = data.invoiceNumber;
    DOM.invoiceDate.textContent = data.date;
    DOM.invoiceSlipId.textContent = data.slipId;
    
    // Headings
    DOM.invoiceTypeHeading.textContent = isLoan ? 'LOAN SLIP' : 'INVOICE';
    DOM.invoiceNoLabel.textContent = isLoan ? 'Loan No:' : 'Invoice No:';
    DOM.grandTotalLabel.textContent = isLoan ? 'AMOUNT OWED' : 'TOTAL';
    
    // Loan badge
    DOM.loanBadge.classList.toggle('hidden', !isLoan);
    
    // Thank you
    if (isLoan) {
        DOM.thankYouTitle.textContent = 'Items collected on loan.';
        DOM.thankYouSubtitle.textContent = 'Please return or settle this balance by the due date above.';
    } else {
        DOM.thankYouTitle.textContent = 'Thank you for your patronage.';
        DOM.thankYouSubtitle.textContent = 'Please make payment using the account details above.';
    }
    
    // Due date
    if (isLoan && data.dueDate) {
        DOM.invoiceDueDate.textContent = data.dueDate;
        DOM.invoiceDueDateRow.classList.remove('hidden');
    } else {
        DOM.invoiceDueDateRow.classList.add('hidden');
    }
    
    // Customer
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
    
    // Items
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
    
    // Totals
    DOM.invoiceSubtotal.textContent = money(data.subtotal);
    DOM.invoiceDiscount.textContent = money(data.discount);
    DOM.invoiceTotal.textContent = money(data.total);
    DOM.invoicePayment.textContent = data.paymentMethod;
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
    
    // Save to storage
    upsertSlip(slip);
    
    // Render
    renderInvoice(slip);
    
    // Update UI
    state.isHistoryView = false;
    DOM.backButton.textContent = '← Edit';
    DOM.newInvoiceButton.classList.remove('hidden');
    DOM.deleteSlipButton.classList.add('hidden');
    DOM.editSlipButton.classList.add('hidden');
    
    // Switch view
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
    DOM.itemName.value = '';
    DOM.itemQuantity.value = '1';
    DOM.itemPrice.value = '';
    DOM.discountInput.value = '';
    DOM.dueDateInput.value = '';
    
    state.invoiceCounter++;
    localStorage.setItem('invoiceCounter', state.invoiceCounter);
    
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

function renderHistoryList() {
    const query = (DOM.historySearch.value || '').trim().toLowerCase();
    const slips = getSavedSlips();
    
    const filtered = !query ? slips : slips.filter(slip => {
        return (
            slip.slipId.toLowerCase().includes(query) ||
            slip.invoiceNumber.toLowerCase().includes(query) ||
            (slip.customerName || '').toLowerCase().includes(query)
        );
    });
    
    if (slips.length === 0) {
        DOM.historyList.innerHTML = `
            <div class="empty">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📭</span>
                No slips saved yet.
                <br><small style="color: #999;">Create your first invoice or loan slip!</small>
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
    
    // Show stats
    const totalSales = slips.filter(s => s.type === 'invoice').length;
    const totalLoans = slips.filter(s => s.type === 'loan').length;
    const totalAmount = slips.reduce((sum, s) => sum + (s.total || 0), 0);
    
    const statsHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
            <div class="stat-card" style="background: #f0fdf4; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${totalSales}</div>
                <div style="font-size: 11px; color: #666;">Invoices</div>
            </div>
            <div class="stat-card" style="background: #fef2f2; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${totalLoans}</div>
                <div style="font-size: 11px; color: #666;">Loans</div>
            </div>
            <div class="stat-card" style="background: #fefce8; padding: 12px; border-radius: 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #ca8a04;">${money(totalAmount)}</div>
                <div style="font-size: 11px; color: #666;">Total</div>
            </div>
        </div>
    `;
    
    // Insert stats before list
    const existingStats = DOM.historyList.querySelector('.stats-grid');
    if (existingStats) existingStats.remove();
    DOM.historyList.insertAdjacentHTML('afterbegin', statsHTML);
    
    // Render cards
    filtered.forEach(slip => {
        const card = document.createElement('div');
        card.className = 'history-card';
        const isLoan = slip.type === 'loan';
        
        card.innerHTML = `
            <div class="history-card-top">
                <span class="history-badge ${isLoan ? 'loan' : 'invoice'}">
                    ${isLoan ? '📋 LOAN' : '🧾 INVOICE'}
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
    
    DOM.historySection.classList.add('hidden');
    DOM.invoiceForm.classList.add('hidden');
    DOM.previewSection.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editSlipFromHistory(slipId) {
    const slip = findSlipById(slipId);
    if (!slip) {
        showToast('Slip not found.', 'error');
        return;
    }
    
    // Load data into form
    state.items = slip.items.map(item => ({ ...item }));
    DOM.customerName.value = slip.customerName || '';
    DOM.customerPhone.value = slip.customerPhone || '';
    DOM.discountInput.value = slip.discount || 0;
    state.documentType = slip.type || 'invoice';
    setDocumentType(state.documentType);
    
    if (slip.type === 'loan' && slip.dueDate) {
        // Try to set due date input
        const dueDate = new Date(slip.dueDate);
        if (!isNaN(dueDate)) {
            const year = dueDate.getFullYear();
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');
            const day = String(dueDate.getDate()).padStart(2, '0');
            DOM.dueDateInput.value = `${year}-${month}-${day}`;
        }
    }
    
    setPaymentMethod(slip.paymentMethod || 'Bank Transfer');
    renderItems();
    updateTotals();
    
    // Switch to form
    state.isEditing = true;
    state.editingSlipId = slipId;
    switchTab('form');
    DOM.previewSection.classList.add('hidden');
    
    showToast('Loaded slip for editing.', 'info');
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
    
    // Wait for logo
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
        const isLoan = !DOM.loanBadge.classList.contains('hidden');
        const prefix = isLoan ? 'Loan-Slip-' : 'Luggage-Luxury-';
        
        const file = new File([blob], prefix + number + '.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: 'Luggage & Luxury Affairs',
                text: (isLoan ? 'Loan Slip ' : 'Invoice ') + number,
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
        const isLoan = !DOM.loanBadge.classList.contains('hidden');
        const prefix = isLoan ? 'Loan-Slip-' : 'Luggage-Luxury-';
        const file = new File([blob], prefix + number + '.pdf', { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: 'Luggage & Luxury Affairs',
                text: (isLoan ? 'Loan Slip ' : 'Invoice ') + number,
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
// EVENT LISTENERS
// ============================

// Add item
DOM.addItemButton.addEventListener('click', addItem);

// Enter key for item inputs
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

// Discount input
DOM.discountInput.addEventListener('input', updateTotals);

// Document type buttons
DOM.doctypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setDocumentType(btn.dataset.type);
    });
});

// Payment buttons
DOM.paymentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setPaymentMethod(btn.dataset.method);
    });
});

// View tabs
DOM.viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        switchTab(tab.dataset.view);
        if (tab.dataset.view === 'history') {
            renderHistoryList();
        }
    });
});

// Preview
DOM.previewButton.addEventListener('click', showPreview);

// Back
DOM.backButton.addEventListener('click', goBack);

// New invoice
DOM.newInvoiceButton.addEventListener('click', newInvoice);

// Delete from history
DOM.deleteSlipButton.addEventListener('click', function() {
    deleteSlipFromHistory(this.dataset.slipId);
});

// Edit from history
DOM.editSlipButton = document.createElement('button');
DOM.editSlipButton.type = 'button';
DOM.editSlipButton.className = 'button secondary';
DOM.editSlipButton.textContent = '✏️ Edit';
DOM.editSlipButton.classList.add('hidden');
DOM.editSlipButton.addEventListener('click', function() {
    editSlipFromHistory(this.dataset.slipId);
});
DOM.deleteSlipButton.parentNode?.insertBefore(DOM.editSlipButton, DOM.deleteSlipButton);

// History search
DOM.historySearch.addEventListener('input', debounce(renderHistoryList, 300));

// Share
DOM.shareButton.addEventListener('click', shareImage);

// PDF
DOM.pdfButton.addEventListener('click', savePDF);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to go back
    if (e.key === 'Escape') {
        if (!DOM.previewSection.classList.contains('hidden')) {
            goBack();
        }
    }
    
    // Ctrl+Enter to preview
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
    // Set initial states
    setDocumentType('invoice');
    setPaymentMethod('Bank Transfer');
    
    // Render
    renderItems();
    updateTotals();
    
    // Show form
    switchTab('form');
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', () => {
        if (state.currentSlip) {
            upsertSlip(state.currentSlip);
        }
    });
    
    console.log('🏷️ Luggage & Luxury Affairs v2.0');
    console.log('📦 Ready to create invoices and loan slips!');
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

// Start the app
init();
// ... (all your existing code above) ...

// ============================
// INITIALIZE APP
// ============================

function init() {
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
    
    console.log('🏷️ Luggage & Luxury Affairs v2.0');
    console.log('📦 Ready to create invoices and loan slips!');
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

// Start the app
init();

// ============================
// PWA - INSTALL PROMPT (ADD THIS AT THE VERY END)
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

// Add bounce animation style if not exists
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
    
