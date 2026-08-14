/* ============================================================
   app.js — PART 1/3
   State, Storage, Navigation, Setup, Dashboard, Settings
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS & DEFAULTS
    // ============================================================

    const DEFAULTS = {
        businessName: 'LUGGAGE AND LUXURY AFFAIRS',
        tagline: 'WHERE LUXURY AND AFFORDABILITY MEET',
        address: 'NO. 11 & 12 ASADA PLAZA,\nBEHIND A•Y MAIKIFI FILLING STATION,\nMAIDUGURI ROAD, KANO.',
        phone1: '08032013137',
        phone2: '09075475562',
        whatsapp: '09075475562',
        bankName: 'Moniepoint',
        accountName: 'Usman Salamatu',
        accountNumber: '5214643891'
    };

    const STORAGE_KEYS = {
        settings: 'lla_settings',
        invoiceCounter: 'lla_invoice_counter',
        setupDone: 'lla_setup_done'
    };

    // ============================================================
    // STATE
    // ============================================================

    const state = {
        // Business settings
        settings: { ...DEFAULTS },

        // Invoice counter
        invoiceCounter: 1,

        // Current invoice data
        invoice: {
            customerName: '',
            customerPhone: '',
            items: [], // { id, name, qty, price }
            discount: 0,
            paymentMethod: 'Bank Transfer',
            date: null,
            time: null,
            invoiceNumber: null
        },

        // Editable item (for edit mode)
        editingItemId: null,

        // Generated output (for sharing)
        generatedBlob: null,
        generatedDataURL: null
    };

    // ============================================================
    // DOM REFS (populated on init)
    // ============================================================

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {};

    // ============================================================
    // LOCAL STORAGE HELPERS
    // ============================================================

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.settings);
            if (raw) {
                const parsed = JSON.parse(raw);
                state.settings = { ...DEFAULTS, ...parsed };
            } else {
                state.settings = { ...DEFAULTS };
            }
        } catch (_) {
            state.settings = { ...DEFAULTS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
        } catch (_) { /* ignore */ }
    }

    function loadInvoiceCounter() {
        try {
            const val = localStorage.getItem(STORAGE_KEYS.invoiceCounter);
            if (val !== null) {
                state.invoiceCounter = parseInt(val, 10) || 1;
            } else {
                state.invoiceCounter = 1;
            }
        } catch (_) {
            state.invoiceCounter = 1;
        }
    }

    function saveInvoiceCounter() {
        try {
            localStorage.setItem(STORAGE_KEYS.invoiceCounter, String(state.invoiceCounter));
        } catch (_) { /* ignore */ }
    }

    function isSetupDone() {
        try {
            return localStorage.getItem(STORAGE_KEYS.setupDone) === 'true';
        } catch (_) {
            return false;
        }
    }

    function markSetupDone() {
        try {
            localStorage.setItem(STORAGE_KEYS.setupDone, 'true');
        } catch (_) { /* ignore */ }
    }

    // ============================================================
    // NAVIGATION
    // ============================================================

    const screens = {
        setup: 'screenSetup',
        dashboard: 'screenDashboard',
        invoice: 'screenInvoice',
        preview: 'screenPreview',
        success: 'screenSuccess',
        settings: 'screenSettings'
    };

    let currentScreen = 'dashboard';
    let previousScreen = null;
    const screenHistory = [];

    function showScreen(screenId, pushHistory = true) {
        // Hide all screens
        Object.values(screens).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Show target
        const target = document.getElementById(screenId);
        if (target) {
            target.style.display = 'block';
            // Trigger reflow for animation
            void target.offsetWidth;
            target.style.animation = 'none';
            void target.offsetWidth;
            target.style.animation = 'fadeIn 0.25s ease';
        }

        // Update header title
        const titleMap = {
            [screens.setup]: 'Setup',
            [screens.dashboard]: 'Dashboard',
            [screens.invoice]: 'New Invoice',
            [screens.preview]: 'Preview',
            [screens.success]: 'Success',
            [screens.settings]: 'Settings'
        };
        const titleEl = document.getElementById('headerTitle');
        if (titleEl) titleEl.textContent = titleMap[screenId] || 'Luggage & Luxury';

        // Back button visibility
        const backBtn = document.getElementById('navBackBtn');
        const hideBack = [screens.dashboard, screens.setup].includes(screenId);
        if (backBtn) {
            backBtn.style.display = hideBack ? 'none' : 'flex';
        }

        // Settings button visibility
        const settingsBtn = document.getElementById('navSettingsBtn');
        if (settingsBtn) {
            settingsBtn.style.display = (screenId === screens.settings || screenId === screens.setup) ? 'none' : 'flex';
        }

        if (pushHistory && previousScreen !== screenId) {
            if (previousScreen) screenHistory.push(previousScreen);
            previousScreen = screenId;
        }

        currentScreen = screenId;
    }

    function goBack() {
        const prev = screenHistory.pop();
        if (prev) {
            showScreen(prev, false);
        } else {
            showScreen(screens.dashboard, false);
        }
    }

    // ============================================================
    // SETUP SCREEN
    // ============================================================

    function populateSetupForm() {
        const s = state.settings;
        document.getElementById('setupBusinessName').value = s.businessName || '';
        document.getElementById('setupTagline').value = s.tagline || '';
        document.getElementById('setupAddress').value = s.address || '';
        document.getElementById('setupPhone1').value = s.phone1 || '';
        document.getElementById('setupPhone2').value = s.phone2 || '';
        document.getElementById('setupWhatsApp').value = s.whatsapp || '';
        document.getElementById('setupBankName').value = s.bankName || '';
        document.getElementById('setupAccountName').value = s.accountName || '';
        document.getElementById('setupAccountNumber').value = s.accountNumber || '';
    }

    function handleSetupSubmit(e) {
        e.preventDefault();
        const s = state.settings;
        s.businessName = document.getElementById('setupBusinessName').value.trim() || DEFAULTS.businessName;
        s.tagline = document.getElementById('setupTagline').value.trim() || DEFAULTS.tagline;
        s.address = document.getElementById('setupAddress').value.trim() || DEFAULTS.address;
        s.phone1 = document.getElementById('setupPhone1').value.trim() || DEFAULTS.phone1;
        s.phone2 = document.getElementById('setupPhone2').value.trim() || DEFAULTS.phone2;
        s.whatsapp = document.getElementById('setupWhatsApp').value.trim() || DEFAULTS.whatsapp;
        s.bankName = document.getElementById('setupBankName').value.trim() || DEFAULTS.bankName;
        s.accountName = document.getElementById('setupAccountName').value.trim() || DEFAULTS.accountName;
        s.accountNumber = document.getElementById('setupAccountNumber').value.trim() || DEFAULTS.accountNumber;

        saveSettings();
        markSetupDone();
        showToast('Settings saved!');
        renderDashboard();
        showScreen(screens.dashboard);
    }

    // ============================================================
    // DASHBOARD
    // ============================================================

    function renderDashboard() {
        const s = state.settings;
        document.getElementById('dashboardBusinessName').textContent = s.businessName || DEFAULTS.businessName;
        document.getElementById('dashboardTagline').textContent = s.tagline || DEFAULTS.tagline;

        // Logo
        const logoImg = document.getElementById('dashboardLogoImg');
        // Try to load from localStorage if set, otherwise use default asset path
        const storedLogo = localStorage.getItem('lla_logo_data');
        if (storedLogo) {
            logoImg.src = storedLogo;
            logoImg.style.display = 'block';
        } else {
            logoImg.src = 'assets/logo.png';
            logoImg.style.display = 'block';
        }
    }

    // ============================================================
    // SETTINGS SCREEN
    // ============================================================

    function populateSettingsForm() {
        const s = state.settings;
        document.getElementById('settingsBusinessName').value = s.businessName || '';
        document.getElementById('settingsTagline').value = s.tagline || '';
        document.getElementById('settingsAddress').value = s.address || '';
        document.getElementById('settingsPhone1').value = s.phone1 || '';
        document.getElementById('settingsPhone2').value = s.phone2 || '';
        document.getElementById('settingsWhatsApp').value = s.whatsapp || '';
        document.getElementById('settingsBankName').value = s.bankName || '';
        document.getElementById('settingsAccountName').value = s.accountName || '';
        document.getElementById('settingsAccountNumber').value = s.accountNumber || '';
    }

    function handleSettingsSubmit(e) {
        e.preventDefault();
        const s = state.settings;
        s.businessName = document.getElementById('settingsBusinessName').value.trim() || DEFAULTS.businessName;
        s.tagline = document.getElementById('settingsTagline').value.trim() || DEFAULTS.tagline;
        s.address = document.getElementById('settingsAddress').value.trim() || DEFAULTS.address;
        s.phone1 = document.getElementById('settingsPhone1').value.trim() || DEFAULTS.phone1;
        s.phone2 = document.getElementById('settingsPhone2').value.trim() || DEFAULTS.phone2;
        s.whatsapp = document.getElementById('settingsWhatsApp').value.trim() || DEFAULTS.whatsapp;
        s.bankName = document.getElementById('settingsBankName').value.trim() || DEFAULTS.bankName;
        s.accountName = document.getElementById('settingsAccountName').value.trim() || DEFAULTS.accountName;
        s.accountNumber = document.getElementById('settingsAccountNumber').value.trim() || DEFAULTS.accountNumber;

        saveSettings();
        renderDashboard();
        showToast('Settings updated!');
        showScreen(screens.dashboard);
    }

    // ============================================================
    // TOAST NOTIFICATIONS
    // ============================================================

    let toastTimeout = null;

    function showToast(message, duration = 2800) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
        el.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => { el.style.display = 'none'; }, 300);
        }, duration);
    }

    // ============================================================
    // LOADING OVERLAY
    // ============================================================

    function showLoading(text = 'Generating invoice...') {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = text;
        overlay.style.display = 'flex';
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'none';
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        // Load stored data
        loadSettings();
        loadInvoiceCounter();

        // Populate DOM refs
        DOM.setupForm = document.getElementById('setupForm');
        DOM.settingsForm = document.getElementById('settingsForm');
        DOM.newInvoiceBtn = document.getElementById('newInvoiceBtn');
        DOM.navBackBtn = document.getElementById('navBackBtn');
        DOM.navSettingsBtn = document.getElementById('navSettingsBtn');
        DOM.settingsBackBtn = document.getElementById('settingsBackBtn');

        // --- Event listeners ---

        // Setup form
        if (DOM.setupForm) {
            DOM.setupForm.addEventListener('submit', handleSetupSubmit);
        }

        // Settings form
        if (DOM.settingsForm) {
            DOM.settingsForm.addEventListener('submit', handleSettingsSubmit);
        }

        // Navigation: Back
        if (DOM.navBackBtn) {
            DOM.navBackBtn.addEventListener('click', goBack);
        }

        // Navigation: Settings
        if (DOM.navSettingsBtn) {
            DOM.navSettingsBtn.addEventListener('click', () => {
                populateSettingsForm();
                showScreen(screens.settings);
            });
        }

        // Settings: Back to dashboard
        if (DOM.settingsBackBtn) {
            DOM.settingsBackBtn.addEventListener('click', () => {
                showScreen(screens.dashboard);
            });
        }

        // New Invoice button
        if (DOM.newInvoiceBtn) {
            DOM.newInvoiceBtn.addEventListener('click', startNewInvoice);
        }

        // --- Determine which screen to show ---

        if (!isSetupDone()) {
            populateSetupForm();
            showScreen(screens.setup);
        } else {
            renderDashboard();
            showScreen(screens.dashboard);
        }

        // --- PWA Install prompt (handled in Part 3) ---
        // --- Service worker registration (handled in Part 3) ---
    }

    // ============================================================
    // EXPOSE PUBLIC FUNCTIONS (for other parts)
    // ============================================================

    window.__lla = {
        state,
        DEFAULTS,
        STORAGE_KEYS,
        loadSettings,
        saveSettings,
        loadInvoiceCounter,
        saveInvoiceCounter,
        isSetupDone,
        markSetupDone,
        showScreen,
        goBack,
        screens,
        showToast,
        showLoading,
        hideLoading,
        renderDashboard,
        populateSetupForm,
        handleSetupSubmit,
        populateSettingsForm,
        handleSettingsSubmit,
        // These will be implemented in Part 2 & 3
        startNewInvoice: null,
        addItem: null,
        removeItem: null,
        editItem: null,
        updateTotals: null,
        renderItems: null,
        buildPreview: null,
        generateInvoice: null,
        shareWhatsApp: null,
        downloadPDF: null,
        downloadImage: null
    };

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
/* ============================================================
   app.js — PART 2/3 (append to Part 1)
   Invoice Management, Items, Calculations, Preview, QR
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // INVOICE MANAGEMENT
    // ============================================================

    function startNewInvoice() {
        const now = new Date();
        state.invoice = {
            customerName: '',
            customerPhone: '',
            items: [],
            discount: 0,
            paymentMethod: 'Bank Transfer',
            date: now,
            time: now,
            invoiceNumber: 'INV-' + String(state.invoiceCounter).padStart(6, '0')
        };
        state.editingItemId = null;
        state.generatedBlob = null;
        state.generatedDataURL = null;

        // Increment counter for next invoice
        state.invoiceCounter += 1;
        saveInvoiceCounter();

        // Reset form fields
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('itemNameInput').value = '';
        document.getElementById('itemQtyInput').value = '1';
        document.getElementById('itemPriceInput').value = '';
        document.getElementById('discountInput').value = '0';
        document.getElementById('paymentMethodSelect').value = 'Bank Transfer';

        renderItems();
        updateTotals();
        showScreen(screens.invoice);
        showToast('New invoice started');
    }

    // Expose startNewInvoice globally
    window.__lla.startNewInvoice = startNewInvoice;

    // ============================================================
    // ITEM CRUD
    // ============================================================

    function generateItemId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function addItem() {
        const nameInput = document.getElementById('itemNameInput');
        const qtyInput = document.getElementById('itemQtyInput');
        const priceInput = document.getElementById('itemPriceInput');

        const name = nameInput.value.trim();
        const qty = parseInt(qtyInput.value, 10);
        const price = parseFloat(priceInput.value);

        // Validation
        if (!name) {
            showToast('Please enter an item name');
            nameInput.focus();
            return;
        }
        if (isNaN(qty) || qty < 1) {
            showToast('Please enter a valid quantity (minimum 1)');
            qtyInput.focus();
            return;
        }
        if (isNaN(price) || price < 0) {
            showToast('Please enter a valid price');
            priceInput.focus();
            return;
        }

        // If editing, update existing item
        if (state.editingItemId) {
            const existing = state.invoice.items.find(item => item.id === state.editingItemId);
            if (existing) {
                existing.name = name;
                existing.qty = qty;
                existing.price = price;
            }
            state.editingItemId = null;
            document.querySelector('.add-item-form .btn').textContent = 'Add Item';
        } else {
            // Add new item
            const item = {
                id: generateItemId(),
                name: name,
                qty: qty,
                price: price
            };
            state.invoice.items.push(item);
        }

        // Clear inputs
        nameInput.value = '';
        qtyInput.value = '1';
        priceInput.value = '';

        renderItems();
        updateTotals();
        showToast(state.editingItemId ? 'Item updated' : 'Item added');
        nameInput.focus();
    }

    function removeItem(itemId) {
        if (!confirm('Delete this item?')) return;
        state.invoice.items = state.invoice.items.filter(item => item.id !== itemId);
        if (state.editingItemId === itemId) {
            state.editingItemId = null;
            document.querySelector('.add-item-form .btn').textContent = 'Add Item';
            // Clear edit fields
            document.getElementById('itemNameInput').value = '';
            document.getElementById('itemQtyInput').value = '1';
            document.getElementById('itemPriceInput').value = '';
        }
        renderItems();
        updateTotals();
        showToast('Item removed');
    }

    function editItem(itemId) {
        const item = state.invoice.items.find(i => i.id === itemId);
        if (!item) return;

        state.editingItemId = itemId;
        document.getElementById('itemNameInput').value = item.name;
        document.getElementById('itemQtyInput').value = item.qty;
        document.getElementById('itemPriceInput').value = item.price;
        document.querySelector('.add-item-form .btn').textContent = 'Update Item';
        document.getElementById('itemNameInput').focus();

        // Scroll to form
        document.querySelector('.add-item-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function renderItems() {
        const container = document.getElementById('itemsList');
        const emptyState = document.getElementById('emptyItemsState');
        const countEl = document.getElementById('itemCount');

        if (!container) return;

        // Update count
        if (countEl) {
            countEl.textContent = state.invoice.items.length + ' items';
        }

        // Clear all items except empty state
        const rows = container.querySelectorAll('.item-row:not(.empty-state)');
        rows.forEach(el => el.remove());

        if (state.invoice.items.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Render each item
        const template = document.getElementById('itemRowTemplate');
        state.invoice.items.forEach((item, index) => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('.item-row');
            row.dataset.index = index;

            const total = item.qty * item.price;
            const formattedTotal = formatCurrency(total);

            row.querySelector('.item-name').textContent = item.name;
            row.querySelector('.item-detail').textContent =
                item.qty + ' × ' + formatCurrency(item.price) + ' = ' + formattedTotal;

            const editBtn = row.querySelector('.item-edit-btn');
            const deleteBtn = row.querySelector('.item-delete-btn');

            editBtn.addEventListener('click', () => editItem(item.id));
            deleteBtn.addEventListener('click', () => removeItem(item.id));

            container.appendChild(row);
        });
    }

    // ============================================================
    // CALCULATIONS
    // ============================================================

    function formatCurrency(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) return '₦0';
        return '₦' + Math.round(amount).toLocaleString('en-NG');
    }

    function calculateSubtotal() {
        return state.invoice.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    }

    function calculateTotal() {
        const subtotal = calculateSubtotal();
        const discount = parseFloat(document.getElementById('discountInput').value) || 0;
        state.invoice.discount = discount;
        return Math.max(0, subtotal - discount);
    }

    function updateTotals() {
        const subtotal = calculateSubtotal();
        const discount = parseFloat(document.getElementById('discountInput').value) || 0;
        state.invoice.discount = discount;
        const total = Math.max(0, subtotal - discount);

        document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
        document.getElementById('discountDisplay').textContent = discount > 0 ? '- ' + formatCurrency(discount) : '₦0';
        document.getElementById('totalDisplay').textContent = formatCurrency(total);
    }

    // ============================================================
    // PREVIEW BUILDING
    // ============================================================

    function buildPreview() {
        const now = new Date();
        const invoice = state.invoice;

        // Capture current form values
        invoice.customerName = document.getElementById('customerName').value.trim();
        invoice.customerPhone = document.getElementById('customerPhone').value.trim();
        invoice.paymentMethod = document.getElementById('paymentMethodSelect').value;
        invoice.discount = parseFloat(document.getElementById('discountInput').value) || 0;
        invoice.date = now;
        invoice.time = now;
        invoice.invoiceNumber = 'INV-' + String(state.invoiceCounter - 1).padStart(6, '0');

        // If no items, show error
        if (invoice.items.length === 0) {
            showToast('Please add at least one item');
            return false;
        }

        const subtotal = calculateSubtotal();
        const total = Math.max(0, subtotal - invoice.discount);
        const settings = state.settings;

        // Build HTML
        const html = `
            <div class="invoice-preview-header">
                <img src="${localStorage.getItem('lla_logo_data') || 'assets/logo.png'}" 
                     alt="Logo" class="invoice-preview-logo" 
                     onerror="this.style.display='none'" />
                <div class="invoice-preview-business-name">${escapeHtml(settings.businessName)}</div>
                <div class="invoice-preview-tagline">${escapeHtml(settings.tagline)}</div>
                <div class="invoice-preview-address">${escapeHtml(settings.address)}</div>
                <div class="invoice-preview-phone">📞 ${escapeHtml(settings.phone1)} ${settings.phone2 ? '• ' + escapeHtml(settings.phone2) : ''}</div>
            </div>

            <div class="invoice-preview-title">INVOICE</div>
            <div class="invoice-preview-meta">
                <span>📄 ${escapeHtml(invoice.invoiceNumber)}</span>
                <span>📅 ${formatDate(now)}</span>
                <span>🕐 ${formatTime(now)}</span>
            </div>

            ${invoice.customerName || invoice.customerPhone ? `
            <div class="invoice-preview-customer">
                ${invoice.customerName ? `<strong>${escapeHtml(invoice.customerName)}</strong>` : ''}
                ${invoice.customerName && invoice.customerPhone ? ' • ' : ''}
                ${invoice.customerPhone ? `<span class="label">📞</span> ${escapeHtml(invoice.customerPhone)}` : ''}
            </div>
            ` : ''}

            <table class="invoice-preview-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align:right;">Qty</th>
                        <th style="text-align:right;">Price</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td class="item-name-col">${escapeHtml(item.name)}</td>
                            <td class="item-qty-col">${item.qty}</td>
                            <td class="item-price-col">${formatCurrency(item.price)}</td>
                            <td class="item-total-col">${formatCurrency(item.qty * item.price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="invoice-preview-totals">
                <div class="totals-row">
                    <span class="label">Subtotal</span>
                    <span class="value">${formatCurrency(subtotal)}</span>
                </div>
                ${invoice.discount > 0 ? `
                <div class="totals-row discount-row">
                    <span class="label">Discount</span>
                    <span class="value">- ${formatCurrency(invoice.discount)}</span>
                </div>
                ` : ''}
                <div class="totals-row total-row">
                    <span class="label">TOTAL</span>
                    <span class="value">${formatCurrency(total)}</span>
                </div>
            </div>

            <div class="invoice-preview-payment">
                <div class="pay-title">💳 Payment Method: ${escapeHtml(invoice.paymentMethod)}</div>
                ${invoice.paymentMethod === 'Bank Transfer' ? `
                <div class="pay-detail">
                    <span class="pay-label">Bank</span>
                    <span class="pay-value">${escapeHtml(settings.bankName)}</span>
                </div>
                <div class="pay-detail">
                    <span class="pay-label">Account Name</span>
                    <span class="pay-value">${escapeHtml(settings.accountName)}</span>
                </div>
                <div class="pay-detail">
                    <span class="pay-label">Account Number</span>
                    <span class="pay-value"><strong>${escapeHtml(settings.accountNumber)}</strong></span>
                </div>
                ` : `
                <div style="margin-top:4px;color:var(--text-secondary);font-weight:500;">
                    Payment via ${escapeHtml(invoice.paymentMethod)}
                </div>
                `}
            </div>

            <div class="invoice-preview-footer">
                <div class="thankyou">Thank you for your patronage</div>
                <div>Please make payment using the details above</div>
                <div class="qr-container">
                    <div id="previewQR"></div>
                    <div class="qr-label">Scan to chat with us on WhatsApp</div>
                </div>
            </div>
        `;

        return html;
    }

    function showPreview() {
        const html = buildPreview();
        if (html === false) return;

        const container = document.getElementById('invoicePreview');
        container.innerHTML = html;

        // Generate QR code after DOM update
        setTimeout(() => {
            const qrContainer = document.getElementById('previewQR');
            if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = '';
                const whatsapp = state.settings.whatsapp || DEFAULTS.whatsapp;
                const cleanNumber = whatsapp.replace(/\D/g, '');
                const waUrl = 'https://wa.me/234' + cleanNumber;
                new QRCode(qrContainer, {
                    text: waUrl,
                    width: 80,
                    height: 80,
                    colorDark: '#1a1a2e',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.L
                });
            }
        }, 100);

        showScreen(screens.preview);
    }

    // ============================================================
    // UTILITY FUNCTIONS FOR PREVIEW
    // ============================================================

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(date) {
        if (!date) date = new Date();
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatTime(date) {
        if (!date) date = new Date();
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // ============================================================
    // EVENT BINDINGS (Invoice Screen)
    // ============================================================

    function bindInvoiceEvents() {
        // Add item
        document.getElementById('addItemBtn').addEventListener('click', addItem);

        // Enter key on item name triggers add
        document.getElementById('itemNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('itemQtyInput').focus();
            }
        });
        document.getElementById('itemQtyInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('itemPriceInput').focus();
            }
        });
        document.getElementById('itemPriceInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
            }
        });

        // Recalculate on discount change
        document.getElementById('discountInput').addEventListener('input', updateTotals);

        // Preview button
        document.getElementById('previewInvoiceBtn').addEventListener('click', showPreview);

        // Preview back button
        document.getElementById('previewBackBtn').addEventListener('click', () => {
            showScreen(screens.invoice);
        });

        // Generate button in preview (will be handled in Part 3)
    }

    // ============================================================
    // EXPOSE FUNCTIONS
    // ============================================================

    window.__lla.addItem = addItem;
    window.__lla.removeItem = removeItem;
    window.__lla.editItem = editItem;
    window.__lla.renderItems = renderItems;
    window.__lla.updateTotals = updateTotals;
    window.__lla.buildPreview = buildPreview;
    window.__lla.showPreview = showPreview;
    window.__lla.formatCurrency = formatCurrency;
    window.__lla.calculateSubtotal = calculateSubtotal;
    window.__lla.calculateTotal = calculateTotal;

    // Bind events after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindInvoiceEvents);
    } else {
        bindInvoiceEvents();
    }

})();
/* ============================================================
   app.js — PART 3/3 (append to Part 2)
   Invoice Generation (PDF, Image), WhatsApp Sharing,
   Success Screen, PWA Install Prompt, Service Worker
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // INVOICE GENERATION (PDF & IMAGE)
    // ============================================================

    // Get the preview HTML string (including styling) ready for rendering
    function getInvoiceHTMLForRender() {
        // We need to re-generate the preview HTML with proper inline styles for PDF/image
        // Use the same builder but with full width and print styles
        const container = document.createElement('div');
        container.innerHTML = buildPreview();
        // Find the QR container and regenerate QR code if needed
        const qrDiv = container.querySelector('#previewQR');
        if (qrDiv && typeof QRCode !== 'undefined') {
            const whatsapp = state.settings.whatsapp || DEFAULTS.whatsapp;
            const cleanNumber = whatsapp.replace(/\D/g, '');
            const waUrl = 'https://wa.me/234' + cleanNumber;
            qrDiv.innerHTML = '';
            new QRCode(qrDiv, {
                text: waUrl,
                width: 80,
                height: 80,
                colorDark: '#1a1a2e',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
        }
        // Convert to string and wrap with styles for standalone rendering
        const style = `
            <style>
                /* Copy all invoice preview styles from CSS */
                #invoicePreview { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; line-height: 1.6; background: #fff; padding: 20px; max-width: 600px; margin: 0 auto; }
                .invoice-preview-header { text-align: center; border-bottom: 2px solid #c9a84c; padding-bottom: 16px; margin-bottom: 16px; }
                .invoice-preview-logo { max-width: 80px; max-height: 80px; margin: 0 auto 8px; display: block; object-fit: contain; }
                .invoice-preview-business-name { font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; color: #1a1a2e; text-transform: uppercase; }
                .invoice-preview-tagline { font-size: 0.7rem; font-weight: 400; color: #8a8aa8; letter-spacing: 2px; text-transform: uppercase; }
                .invoice-preview-address { font-size: 0.75rem; color: #4a4a6a; margin-top: 4px; white-space: pre-line; }
                .invoice-preview-phone { font-size: 0.75rem; color: #4a4a6a; }
                .invoice-preview-title { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; margin: 12px 0 4px; }
                .invoice-preview-meta { display: flex; justify-content: space-between; flex-wrap: wrap; font-size: 0.8rem; color: #4a4a6a; border-bottom: 1px solid #e2e4ea; padding-bottom: 10px; margin-bottom: 12px; }
                .invoice-preview-customer { font-size: 0.85rem; background: #f8f9fb; padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; border-left: 3px solid #c9a84c; }
                .invoice-preview-customer strong { font-weight: 600; color: #1a1a2e; }
                .invoice-preview-customer .label { color: #8a8aa8; font-weight: 400; }
                .invoice-preview-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 12px; }
                .invoice-preview-table th { text-align: left; font-weight: 600; color: #4a4a6a; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e4ea; padding: 6px 4px; }
                .invoice-preview-table td { padding: 8px 4px; border-bottom: 1px solid #e2e4ea; vertical-align: middle; }
                .invoice-preview-table .item-name-col { font-weight: 500; color: #1a1a2e; }
                .invoice-preview-table .item-qty-col, .invoice-preview-table .item-price-col, .invoice-preview-table .item-total-col { text-align: right; white-space: nowrap; }
                .invoice-preview-table .item-total-col { font-weight: 600; color: #1a1a2e; }
                .invoice-preview-totals { margin-top: 8px; border-top: 2px solid #1a1a2e; padding-top: 10px; }
                .invoice-preview-totals .totals-row { display: flex; justify-content: flex-end; padding: 3px 0; font-size: 0.85rem; color: #4a4a6a; }
                .invoice-preview-totals .totals-row .label { width: 100px; text-align: right; margin-right: 12px; }
                .invoice-preview-totals .totals-row .value { min-width: 80px; text-align: right; font-weight: 500; color: #1a1a2e; }
                .invoice-preview-totals .totals-row.discount-row .value { color: #d32f2f; }
                .invoice-preview-totals .totals-row.total-row { border-top: 2px solid #1a1a2e; margin-top: 4px; padding-top: 10px; font-size: 1rem; }
                .invoice-preview-totals .totals-row.total-row .value { font-weight: 700; font-size: 1.1rem; color: #1a1a2e; }
                .invoice-preview-payment { margin-top: 16px; padding: 12px; background: #f8f9fb; border-radius: 8px; border: 1px solid #e2e4ea; font-size: 0.8rem; }
                .invoice-preview-payment .pay-title { font-weight: 700; color: #1a1a2e; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .invoice-preview-payment .pay-detail { display: flex; justify-content: space-between; padding: 2px 0; font-size: 0.8rem; }
                .invoice-preview-payment .pay-detail .pay-label { color: #8a8aa8; }
                .invoice-preview-payment .pay-detail .pay-value { font-weight: 500; color: #1a1a2e; }
                .invoice-preview-footer { margin-top: 16px; text-align: center; border-top: 1px solid #e2e4ea; padding-top: 14px; font-size: 0.7rem; color: #8a8aa8; }
                .invoice-preview-footer .thankyou { font-weight: 500; color: #4a4a6a; margin-bottom: 6px; }
                .invoice-preview-footer .qr-container { display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
                .invoice-preview-footer .qr-container #previewQR { width: 80px; height: 80px; margin: 4px auto; }
                .invoice-preview-footer .qr-container .qr-label { font-size: 0.6rem; color: #8a8aa8; letter-spacing: 0.3px; }
            </style>
        `;
        return style + container.innerHTML;
    }

    function generateInvoice() {
        // Validate items
        if (state.invoice.items.length === 0) {
            showToast('No items to generate');
            return;
        }

        showLoading('Generating invoice...');

        // Use a timeout to let UI update
        setTimeout(async () => {
            try {
                // Build full HTML with inline styles
                const htmlContent = getInvoiceHTMLForRender();

                // Create a temporary container to render the invoice
                const wrapper = document.createElement('div');
                wrapper.style.position = 'fixed';
                wrapper.style.left = '-9999px';
                wrapper.style.top = '0';
                wrapper.style.width = '600px';
                wrapper.style.background = '#fff';
                wrapper.style.padding = '20px';
                wrapper.style.fontFamily = 'Inter, system-ui, sans-serif';
                wrapper.innerHTML = htmlContent;
                document.body.appendChild(wrapper);

                // Wait for QR code to render (if any)
                await new Promise(resolve => setTimeout(resolve, 300));

                // --- Generate PDF ---
                if (typeof window.jspdf !== 'undefined' || typeof jspdf !== 'undefined') {
                    const { jsPDF } = window.jspdf || jspdf;
                    if (jsPDF) {
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();

                        // Use html2canvas to capture the invoice
                        const canvas = await html2canvas(wrapper, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff',
                            width: 600,
                            height: wrapper.scrollHeight,
                            onclone: (clonedDoc) => {
                                // Ensure QR codes are rendered
                                const qrDivs = clonedDoc.querySelectorAll('#previewQR');
                                qrDivs.forEach(div => {
                                    if (div.children.length === 0) {
                                        // Re-generate QR if missing
                                        const whatsapp = state.settings.whatsapp || DEFAULTS.whatsapp;
                                        const cleanNumber = whatsapp.replace(/\D/g, '');
                                        const waUrl = 'https://wa.me/234' + cleanNumber;
                                        if (typeof QRCode !== 'undefined') {
                                            new QRCode(div, {
                                                text: waUrl,
                                                width: 80,
                                                height: 80,
                                                colorDark: '#1a1a2e',
                                                colorLight: '#ffffff',
                                                correctLevel: QRCode.CorrectLevel.L
                                            });
                                        }
                                    }
                                });
                            }
                        });

                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = pdfWidth - 20;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        let position = 10;
                        const pageHeight = pdfHeight - 20;

                        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                        position += imgHeight;

                        // If content overflows, add new pages
                        while (position > pageHeight) {
                            pdf.addPage();
                            position = 10;
                            // Re-add the image on new page? Better to just reduce scale.
                            // For simplicity, we'll just fit on one page by scaling
                            // Let's regenerate with scale to fit
                            const newScale = (pageHeight) / (imgHeight + 10);
                            if (newScale < 1) {
                                // Re-create PDF with scaled content
                                const pdf2 = new jsPDF('p', 'mm', 'a4');
                                const scaledWidth = pdfWidth - 20;
                                const scaledHeight = (canvas.height * scaledWidth) / canvas.width;
                                const finalHeight = Math.min(scaledHeight, pageHeight);
                                pdf2.addImage(imgData, 'PNG', 10, 10, scaledWidth, finalHeight);
                                // Save and exit
                                const pdfBlob = pdf2.output('blob');
                                state.generatedBlob = pdfBlob;
                                state.generatedDataURL = null;
                                document.body.removeChild(wrapper);
                                hideLoading();
                                showSuccessScreen();
                                return;
                            }
                        }

                        const pdfBlob = pdf.output('blob');
                        state.generatedBlob = pdfBlob;
                        state.generatedDataURL = null;
                    } else {
                        // Fallback: use image only
                        await generateImageOnly(wrapper);
                    }
                } else {
                    // Fallback: use image only
                    await generateImageOnly(wrapper);
                }

                document.body.removeChild(wrapper);
                hideLoading();
                showSuccessScreen();

            } catch (error) {
                console.error('Generation error:', error);
                hideLoading();
                showToast('Error generating invoice. Please try again.');
                // Fallback: try image only
                try {
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'fixed';
                    wrapper.style.left = '-9999px';
                    wrapper.style.top = '0';
                    wrapper.style.width = '600px';
                    wrapper.style.background = '#fff';
                    wrapper.style.padding = '20px';
                    wrapper.style.fontFamily = 'Inter, system-ui, sans-serif';
                    wrapper.innerHTML = getInvoiceHTMLForRender();
                    document.body.appendChild(wrapper);
                    await generateImageOnly(wrapper);
                    document.body.removeChild(wrapper);
                    hideLoading();
                    showSuccessScreen();
                } catch (fallbackError) {
                    hideLoading();
                    showToast('Unable to generate invoice. Please check console.');
                }
            }
        }, 200);
    }

    async function generateImageOnly(container) {
        // Generate image using html2canvas
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas not loaded');
        }
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 600,
            height: container.scrollHeight
        });
        const dataURL = canvas.toDataURL('image/png');
        state.generatedDataURL = dataURL;
        state.generatedBlob = null;
    }

    // ============================================================
    // SUCCESS SCREEN
    // ============================================================

    function showSuccessScreen() {
        showScreen(screens.success);
        // Reset generated data if needed
    }

    function bindSuccessButtons() {
        // Share on WhatsApp
        document.getElementById('shareWhatsAppBtn').addEventListener('click', shareViaWhatsApp);

        // Download PDF
        document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);

        // Download Image
        document.getElementById('downloadImageBtn').addEventListener('click', downloadImage);

        // New Invoice from success
        document.getElementById('newInvoiceFromSuccessBtn').addEventListener('click', () => {
            startNewInvoice();
        });
    }

    // ============================================================
    // SHARE VIA WHATSAPP
    // ============================================================

    function shareViaWhatsApp() {
        if (!state.generatedBlob && !state.generatedDataURL) {
            showToast('Please generate the invoice first');
            return;
        }

        // Try native share if available (mobile browsers)
        if (navigator.share && state.generatedBlob) {
            const file = new File([state.generatedBlob], 'invoice.pdf', { type: 'application/pdf' });
            const shareData = {
                files: [file],
                title: 'Invoice',
                text: 'Here is your invoice from LUGGAGE AND LUXURY AFFAIRS'
            };
            navigator.share(shareData).catch(err => {
                if (err.name !== 'AbortError') {
                    fallbackWhatsAppShare();
                }
            });
            return;
        }

        // If share with files not supported, try direct WhatsApp URL with attachment? Not possible.
        // So we fallback to downloading and instructing user.
        fallbackWhatsAppShare();
    }

    function fallbackWhatsAppShare() {
        // Download the file first, then open WhatsApp
        const downloadAndOpen = () => {
            const link = document.createElement('a');
            if (state.generatedBlob) {
                const url = URL.createObjectURL(state.generatedBlob);
                link.href = url;
                link.download = 'invoice.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            } else if (state.generatedDataURL) {
                link.href = state.generatedDataURL;
                link.download = 'invoice.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showToast('No invoice to share');
                return;
            }

            // Open WhatsApp chat
            const whatsapp = state.settings.whatsapp || DEFAULTS.whatsapp;
            const cleanNumber = whatsapp.replace(/\D/g, '');
            const waUrl = 'https://wa.me/234' + cleanNumber + '?text=Please%20find%20attached%20invoice';
            window.open(waUrl, '_blank');
            showToast('File downloaded. Please attach it in WhatsApp.');
        };

        // If on mobile, use a more direct approach
        if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            // Try to open WhatsApp with a message and instruct to attach
            const whatsapp = state.settings.whatsapp || DEFAULTS.whatsapp;
            const cleanNumber = whatsapp.replace(/\D/g, '');
            const waUrl = 'https://wa.me/234' + cleanNumber + '?text=Invoice%20attached';
            window.open(waUrl, '_blank');
            // Also download
            setTimeout(downloadAndOpen, 1000);
        } else {
            downloadAndOpen();
        }
    }

    // ============================================================
    // DOWNLOAD PDF
    // ============================================================

    function downloadPDF() {
        if (state.generatedBlob) {
            const url = URL.createObjectURL(state.generatedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${state.invoice.invoiceNumber || 'latest'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            showToast('PDF downloaded');
        } else if (state.generatedDataURL) {
            // Convert image to PDF? For simplicity, just download as image.
            showToast('PDF not available, downloading image instead');
            downloadImage();
        } else {
            showToast('Generate invoice first');
        }
    }

    // ============================================================
    // DOWNLOAD IMAGE
    // ============================================================

    function downloadImage() {
        if (state.generatedDataURL) {
            const link = document.createElement('a');
            link.href = state.generatedDataURL;
            link.download = `invoice-${state.invoice.invoiceNumber || 'latest'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Image downloaded');
    }else if (state.generatedBlob) {
            // Convert PDF to image? Not easily. Suggest to download PDF instead.
            showToast('Download PDF instead');
            downloadPDF();
        } else {
            showToast('Generate invoice first');
        }
    }

    // ============================================================
    // GENERATE BUTTON IN PREVIEW
    // ============================================================

    function bindGenerateButton() {
        document.getElementById('generateInvoiceBtn').addEventListener('click', generateInvoice);
    }

    // ============================================================
    // PWA INSTALL PROMPT
    // ============================================================

    let deferredPrompt = null;
    let installPromptDismissed = false;

    function initPWAInstall() {
        // Check if already dismissed
        if (localStorage.getItem('lla_install_dismissed') === 'true') {
            installPromptDismissed = true;
            return;
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (!installPromptDismissed) {
                document.getElementById('installPrompt').style.display = 'block';
            }
        });

        document.getElementById('installAppBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    showToast('App installed!');
                } else {
                    showToast('Installation declined');
                }
                deferredPrompt = null;
                document.getElementById('installPrompt').style.display = 'none';
            } else {
                // For iOS or browsers without beforeinstallprompt
                showToast('To install, tap the share button and select "Add to Home Screen"');
                document.getElementById('installPrompt').style.display = 'none';
            }
        });

        document.getElementById('installDismissBtn').addEventListener('click', () => {
            installPromptDismissed = true;
            localStorage.setItem('lla_install_dismissed', 'true');
            document.getElementById('installPrompt').style.display = 'none';
        });
    }
    // ============================================================
    // SERVICE WORKER REGISTRATION
    // ============================================================

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(() => {
                    console.log('Service Worker registered');
                })
                .catch((err) => {
                    console.log('Service Worker registration failed:', err);
                });
        }
    }

    // ============================================================
    // FINAL INITIALIZATION
    // ============================================================

    function finalInit() {
        // Bind generate button
        bindGenerateButton();

        // Bind success screen buttons
        bindSuccessButtons();

        // PWA install
        initPWAInstall();

        // Service worker
        registerServiceWorker();

        // Additional: Add event listener for payment method change to update preview? Not needed.
        // Any other global listeners
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', finalInit);
    } else {
        finalInit();
    }

    // Expose generation functions for debugging
    window.__lla.generateInvoice = generateInvoice;
    window.__lla.downloadPDF = downloadPDF;
    window.__lla.downloadImage = downloadImage;
    window.__lla.shareViaWhatsApp = shareViaWhatsApp;

})();
