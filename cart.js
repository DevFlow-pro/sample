document.addEventListener('DOMContentLoaded', () => {
    const WHATSAPP_NUMBER = '77074242531';
    const SITE_UNIQUE_ID = 'template_one_2026';

    const STORAGE_KEY = `${SITE_UNIQUE_ID}_cart_v1`;
    const FAV_STORAGE_KEY = `${SITE_UNIQUE_ID}_favs_v1`;
    const TABLE_KEY = `${SITE_UNIQUE_ID}_saved_table`;
    const TABLE_TIME_KEY = `${SITE_UNIQUE_ID}_saved_table_time`;

    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let favorites = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];

    const urlParams = new URLSearchParams(window.location.search);
    let tableFromUrl = urlParams.get('table');
    const TWO_DAYS_MS = 172800000;

    if (tableFromUrl) {
        localStorage.setItem(TABLE_KEY, tableFromUrl);
        localStorage.setItem(TABLE_TIME_KEY, Date.now().toString());
    } else {
        const savedTable = localStorage.getItem(TABLE_KEY);
        const savedTime = localStorage.getItem(TABLE_TIME_KEY);
        if (savedTable && savedTime) {
            if (Date.now() - parseInt(savedTime, 10) < TWO_DAYS_MS) {
                tableFromUrl = savedTable;
            } else {
                localStorage.removeItem(TABLE_KEY);
                localStorage.removeItem(TABLE_TIME_KEY);
            }
        }
    }

    let selectedTable = tableFromUrl || null;
    let orderType = tableFromUrl ? 'dine-in' : null;

    const cards = document.querySelectorAll('.info-card[data-id]');
    const orderBar = document.getElementById('order-bar');
    const barTotalPrice = document.getElementById('bar-total-price');
    const barItemsText = document.getElementById('bar-items-text');
    const whatsappBtn = document.getElementById('whatsapp-send-btn');

    const cartPopup = document.getElementById('cart-popup');
    const orderBarToggle = document.getElementById('order-bar-toggle');
    const closePopupBtn = document.getElementById('close-cart-popup');
    const cartPopupItems = document.getElementById('cart-popup-items');

    const favoritesToggleBtn = document.getElementById('favorites-toggle-btn');
    const favoritesPopup = document.getElementById('favorites-popup');
    const closeFavoritesPopup = document.getElementById('close-favorites-popup');
    const favoritesPopupItems = document.getElementById('favorites-popup-items');

    const favNameInput = document.getElementById('fav-name-input');
    const saveCurrentFavBtn = document.getElementById('save-current-fav-btn');
    const favBadge = document.getElementById('fav-badge');

    const openSaveFavPanelBtn = document.getElementById('open-save-fav-panel-btn');
    const saveFavInputPanel = document.getElementById('save-fav-input-panel');
    const saveFavNameInput = document.getElementById('save-fav-name-input');
    const confirmSaveFavBtn = document.getElementById('confirm-save-fav-btn');

    const orderConfirmModal = document.createElement('div');
    orderConfirmModal.id = 'order-confirm-modal';
    orderConfirmModal.className = 'cart-popup';
    orderConfirmModal.style.zIndex = '2000';
    orderConfirmModal.innerHTML = `
        <div class="cart-popup-header confirm-modal-header">
            <h3>Проверьте детали заказа</h3>
            <button id="close-confirm-modal" class="close-popup-btn">×</button>
        </div>
        <div class="cluster-plate-modal">Проверьте состав, укажите стол или выберите предоплату, затем отправьте в WhatsApp</div>
        <div id="table-selection-block" class="table-selection-block">
            <h4 class="table-selection-title">Закажите, уточните: за каким столом вы сидите или заказываете из дома</h4>
            <div class="table-buttons-container">
                <button id="table-btn-current" class="table-select-btn">
                    <span class="table-btn-icon">🍽️</span>
                    <span class="table-btn-text">Указать стол</span>
                </button>
                <button id="table-btn-other" class="table-select-btn">
                    <span class="table-btn-icon">🔄</span>
                    <span class="table-btn-text">Я за другим столом</span>
                </button>
                <button id="table-btn-takeaway" class="table-select-btn">
                    <span class="table-btn-icon">🥡</span>
                    <span class="table-btn-text">Заказываю из дома по предоплате</span>
                </button>
            </div>
            <div id="manual-table-input-container" class="manual-table-input-container hidden">
                <input type="number" id="manual-table-input" placeholder="Введите номер стола" min="1">
                <button id="confirm-manual-table-btn" class="fav-save-btn">Подтвердить</button>
            </div>
            <div id="table-error-message" class="table-error-message hidden">⚠️ Обязательно укажите стол!</div>
            <button type="button" id="table-details-toggle" class="table-details-toggle">
                <span class="table-details-arrow">▸</span>
                <span class="table-details-label">Подробнее о функции для кафе и ресторанов</span>
            </button>
            <div id="table-details-content" class="table-details-content">
                <div class="table-details-inner">
                    <p>• <strong>Я сижу за столом</strong> — номер подставится из QR-кода автоматически.</p>
                    <p>• <strong>Другой стол</strong> — укажите номер вручную.</p>
                    <p>• <strong>Из дома</strong> — заказ по предоплате, приезжайте к готовому.</p>
                </div>
            </div>
        </div>
        <div id="confirm-modal-items" class="cart-popup-items" style="margin-bottom: 15px;"></div>
        <div class="confirm-fav-save-row">
            <input type="text" id="confirm-fav-name-input" placeholder="Название набора для избранного" class="fav-input" style="background: #fff;">
            <button id="confirm-save-fav-btn-modal" class="fav-save-btn" style="white-space: nowrap;">⭐ Избранное</button>
        </div>
        <div class="confirm-modal-footer">
            <span style="font-size: 15px; font-weight: 700; color: #1e1e1e;">Итого: <strong id="confirm-total-price" style="color: #1e1e1e;">0 ₸</strong></span>
            <button id="confirm-whatsapp-final-btn" class="whatsapp-btn confirm-whatsapp-btn">
                <span class="wa-text">Отправить в WhatsApp</span>
                <span class="wa-icon">➔</span>
            </button>
        </div>
    `;
    document.body.appendChild(orderConfirmModal);

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
        z-index: 1999; display: none; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(modalBackdrop);

    const closeConfirmModalBtn = document.getElementById('close-confirm-modal');
    const confirmModalItems = document.getElementById('confirm-modal-items');
    const confirmTotalPrice = document.getElementById('confirm-total-price');
    const confirmWhatsappFinalBtn = document.getElementById('confirm-whatsapp-final-btn');
    const confirmFavNameInput = document.getElementById('confirm-fav-name-input');
    const confirmSaveFavBtnModal = document.getElementById('confirm-save-fav-btn-modal');

    const tableSelectionBlock = document.getElementById('table-selection-block');
    const tableBtnCurrent = document.getElementById('table-btn-current');
    const tableBtnOther = document.getElementById('table-btn-other');
    const tableBtnTakeaway = document.getElementById('table-btn-takeaway');
    const manualTableInputContainer = document.getElementById('manual-table-input-container');
    const manualTableInput = document.getElementById('manual-table-input');
    const confirmManualTableBtn = document.getElementById('confirm-manual-table-btn');
    const tableErrorMessage = document.getElementById('table-error-message');
    const tableDetailsToggle = document.getElementById('table-details-toggle');
    const tableDetailsContent = document.getElementById('table-details-content');

    if (tableDetailsToggle && tableDetailsContent) {
        tableDetailsToggle.addEventListener('click', () => {
            const isOpen = tableDetailsContent.classList.toggle('open');
            tableDetailsToggle.classList.toggle('open', isOpen);
        });
    }

    function renderTableState() {
        tableErrorMessage.classList.add('hidden');
        manualTableInputContainer.classList.add('hidden');
        [tableBtnCurrent, tableBtnOther, tableBtnTakeaway].forEach(btn => btn.classList.remove('active', 'selected-takeaway'));

        if (tableFromUrl) {
            tableBtnCurrent.querySelector('.table-btn-text').textContent = `Я сижу за столом №${tableFromUrl}`;
            tableBtnCurrent.style.display = 'flex';
        } else {
            tableBtnCurrent.style.display = 'none';
        }

        if (orderType === 'dine-in' && selectedTable) {
            if (selectedTable === tableFromUrl) {
                tableBtnCurrent.classList.add('active');
            } else {
                tableBtnOther.querySelector('.table-btn-text').textContent = `Стол №${selectedTable}`;
                tableBtnOther.classList.add('active');
            }
        } else if (orderType === 'takeaway') {
            tableBtnTakeaway.classList.add('active', 'selected-takeaway');
        }
    }

    function handleTableSelection(type) {
        tableErrorMessage.classList.add('hidden');
        manualTableInputContainer.classList.add('hidden');
        [tableBtnCurrent, tableBtnOther, tableBtnTakeaway].forEach(btn => btn.classList.remove('active', 'selected-takeaway'));

        if (type === 'current') {
            if (tableFromUrl) {
                selectedTable = tableFromUrl;
                orderType = 'dine-in';
                tableBtnCurrent.classList.add('active');
            }
        } else if (type === 'other') {
            orderType = 'dine-in';
            tableBtnOther.classList.add('active');
            manualTableInputContainer.classList.remove('hidden');
            manualTableInput.focus();
        } else if (type === 'takeaway') {
            orderType = 'takeaway';
            selectedTable = 'takeaway';
            tableBtnTakeaway.classList.add('active', 'selected-takeaway');
        }
    }

    tableBtnCurrent.addEventListener('click', () => handleTableSelection('current'));
    tableBtnOther.addEventListener('click', () => handleTableSelection('other'));
    tableBtnTakeaway.addEventListener('click', () => handleTableSelection('takeaway'));

    confirmManualTableBtn.addEventListener('click', () => {
        const manualTableNumber = manualTableInput.value.trim();
        if (manualTableNumber && !isNaN(manualTableNumber) && Number(manualTableNumber) > 0) {
            selectedTable = manualTableNumber;
            orderType = 'dine-in';
            manualTableInputContainer.classList.add('hidden');
            tableErrorMessage.classList.add('hidden');
            tableBtnOther.querySelector('.table-btn-text').textContent = `Стол №${manualTableNumber}`;
            tableBtnOther.classList.add('active');
        } else {
            manualTableInput.style.borderColor = '#dc2626';
            setTimeout(() => { manualTableInput.style.borderColor = ''; }, 2000);
        }
    });

    manualTableInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmManualTableBtn.click();
    });

    function formatWeight(weight) {
        return String(weight).replace('.', ',') + ' кг';
    }

    function getCartKey(id, weight) {
        return `${id}_${weight}`;
    }

    function getCartItems() {
        const items = [];
        cards.forEach(card => {
            const id = card.dataset.id;
            const name = card.dataset.name;
            const weightOptions = card.querySelectorAll('.weight-option');

            weightOptions.forEach(option => {
                const weight = option.dataset.weight;
                const price = parseInt(option.dataset.price, 10);
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;
                if (qty > 0) items.push({ id, name, weight, price, qty, key });
            });
        });
        return items;
    }

    function updateUI() {
        let totalSum = 0;
        let totalCount = 0;
        let itemsSummaryArray = [];
        let popupHtml = '';

        cards.forEach(card => {
            const id = card.dataset.id;
            const weightOptions = card.querySelectorAll('.weight-option');
            weightOptions.forEach(option => {
                const weight = option.dataset.weight;
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;
                const countSpan = option.querySelector('.cnt-value');
                if (countSpan) countSpan.textContent = qty;
            });
        });

        getCartItems().forEach(item => {
            const itemSum = item.price * item.qty;
            totalSum += itemSum;
            totalCount += item.qty;
            itemsSummaryArray.push(`${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            popupHtml += `
                <div class="popup-item-row">
                    <div class="popup-item-info">
                        <span class="popup-item-name">${item.name}</span>
                        <span class="popup-item-price">
                            ${formatWeight(item.weight)} — ${item.price} ₸ × ${item.qty} = <strong>${itemSum} ₸</strong>
                        </span>
                    </div>
                    <div class="popup-item-controls">
                        <div class="counter-box">
                            <button class="cnt-btn popup-minus" data-key="${item.key}">-</button>
                            <span class="cnt-value">${item.qty}</span>
                            <button class="cnt-btn popup-plus" data-key="${item.key}">+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (cartPopupItems) {
            cartPopupItems.innerHTML = popupHtml || '<p style="text-align:center; color:#78716c; padding:10px;">Корзина пуста</p>';
            attachPopupListeners();
        }

        if (barTotalPrice) barTotalPrice.textContent = totalSum + ' ₸';

        if (totalCount > 0) {
            if (barItemsText) barItemsText.textContent = itemsSummaryArray.join(', ');
            if (orderBar) orderBar.classList.remove('hidden');
        } else {
            if (orderBar) orderBar.classList.add('hidden');
            if (cartPopup) cartPopup.classList.remove('active');
            closeOrderConfirmModal();
        }

        updateFavoritesUI();
        if (orderConfirmModal.classList.contains('active')) updateConfirmModalContent();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        updateToTopPosition();
    }

    function updateFavoritesUI() {
        if (!favBadge) return;

        if (favorites.length > 0) {
            favBadge.textContent = favorites.length;
            favBadge.classList.remove('hidden');
        } else {
            favBadge.classList.add('hidden');
        }

        if (favoritesPopupItems) {
            let html = '';
            if (favorites.length === 0) {
                html = '<p style="text-align:center; color:#78716c; padding:10px;">Нет сохраненных заказов</p>';
            } else {
                favorites.forEach((fav, index) => {
                    html += `
                        <div class="fav-item-row">
                            <div class="fav-item-info">
                                <span class="fav-item-name">${fav.name}</span>
                                <span class="fav-item-desc">${fav.summary} (${fav.total} ₸)</span>
                            </div>
                            <div class="fav-actions">
                                <button class="fav-load-btn" data-index="${index}">Выбрать</button>
                                <button class="fav-del-btn" data-index="${index}">✕</button>
                            </div>
                        </div>
                    `;
                });
            }
            favoritesPopupItems.innerHTML = html;
            attachFavoritesListeners();
        }
    }

    cards.forEach(card => {
        const id = card.dataset.id;
        const weightOptions = card.querySelectorAll('.weight-option');

        weightOptions.forEach(option => {
            const weight = option.dataset.weight;
            const key = getCartKey(id, weight);
            const plusBtn = option.querySelector('.plus');
            const minusBtn = option.querySelector('.minus');

            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    cart[key] = (cart[key] || 0) + 1;
                    updateUI();
                });
            }
            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    if (cart[key] > 0) {
                        cart[key]--;
                        if (cart[key] === 0) delete cart[key];
                        updateUI();
                    }
                });
            }
        });
    });

    function attachPopupListeners() {
        if (!cartPopupItems) return;
        cartPopupItems.querySelectorAll('.popup-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                cart[key] = (cart[key] || 0) + 1;
                updateUI();
            });
        });
        cartPopupItems.querySelectorAll('.popup-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (cart[key] > 0) {
                    cart[key]--;
                    if (cart[key] === 0) delete cart[key];
                    updateUI();
                }
            });
        });
    }

    function openOrderConfirmModal() {
        const cartItems = getCartItems();
        if (cartItems.length === 0) return;

        if (cartPopup) cartPopup.classList.remove('active');
        if (favoritesPopup) favoritesPopup.classList.remove('active');

        renderTableState();
        updateConfirmModalContent();
        modalBackdrop.style.display = 'block';
        orderConfirmModal.classList.add('active');
        updateToTopPosition();
    }

    function closeOrderConfirmModal() {
        orderConfirmModal.classList.remove('active');
        modalBackdrop.style.display = 'none';
        updateToTopPosition();
    }

    function updateConfirmModalContent() {
        const cartItems = getCartItems();
        let html = '';
        let totalSum = 0;

        if (cartItems.length === 0) {
            closeOrderConfirmModal();
            return;
        }

        cartItems.forEach(item => {
            const itemSum = item.price * item.qty;
            totalSum += itemSum;
            html += `
                <div class="popup-item-row">
                    <div class="popup-item-info">
                        <span class="popup-item-name">${item.name}</span>
                        <span class="popup-item-price">
                            ${formatWeight(item.weight)} — ${item.price} ₸ × ${item.qty} = <strong>${itemSum} ₸</strong>
                        </span>
                    </div>
                    <div class="popup-item-controls">
                        <div class="counter-box">
                            <button class="cnt-btn confirm-minus" data-key="${item.key}">-</button>
                            <span class="cnt-value">${item.qty}</span>
                            <button class="cnt-btn confirm-plus" data-key="${item.key}">+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        confirmModalItems.innerHTML = html;
        confirmTotalPrice.textContent = totalSum + ' ₸';

        confirmModalItems.querySelectorAll('.confirm-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                cart[key] = (cart[key] || 0) + 1;
                updateUI();
            });
        });

        confirmModalItems.querySelectorAll('.confirm-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (cart[key] > 0) {
                    cart[key]--;
                    if (cart[key] === 0) delete cart[key];
                    updateUI();
                }
            });
        });
    }

    if (closeConfirmModalBtn) closeConfirmModalBtn.addEventListener('click', closeOrderConfirmModal);
    modalBackdrop.addEventListener('click', closeOrderConfirmModal);

    function saveToFavorites(nameInputEl) {
        const cartItems = getCartItems();
        if (cartItems.length === 0) return;

        let customName = nameInputEl ? nameInputEl.value.trim() : '';
        if (!customName) customName = `Набор #${favorites.length + 1}`;

        const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

        favorites.push({
            name: customName,
            summary: summaryArr.join(', '),
            total: totalSum,
            cartData: { ...cart }
        });

        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
        if (nameInputEl) nameInputEl.value = '';
        updateFavoritesUI();
    }

    if (confirmSaveFavBtnModal) {
        confirmSaveFavBtnModal.addEventListener('click', () => saveToFavorites(confirmFavNameInput));
    }

    if (confirmWhatsappFinalBtn) {
        confirmWhatsappFinalBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) return;

            if (!selectedTable && orderType !== 'takeaway') {
                tableErrorMessage.classList.remove('hidden');
                tableSelectionBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            let message = "Здравствуйте! Хочу сделать заказ:\n\n";
            let totalSum = 0;

            cartItems.forEach(item => {
                const sum = item.price * item.qty;
                totalSum += sum;
                message += `▪️ ${item.name} — ${formatWeight(item.weight)}, ${item.qty} шт. (${sum} ₸)\n`;
            });

            message += `\n📦 Итого к оплате: ${totalSum} ₸\n`;
            if (orderType === 'takeaway') {
                message += `\n🥡 Заказ на вынос (предоплата)`;
            } else if (selectedTable) {
                message += `\n🍽️ Стол: №${selectedTable}`;
            }

            const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            closeOrderConfirmModal();
            window.open(waURL, '_blank');
        });
    }

    function attachFavoritesListeners() {
        if (!favoritesPopupItems) return;
        favoritesPopupItems.querySelectorAll('.fav-load-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                cart = { ...favorites[index].cartData };
                favoritesPopup.classList.remove('active');
                updateUI();
            });
        });
        favoritesPopupItems.querySelectorAll('.fav-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                favorites.splice(index, 1);
                localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
                updateFavoritesUI();
            });
        });
    }

    if (orderBarToggle && cartPopup) {
        orderBarToggle.addEventListener('click', () => {
            if (favoritesPopup) favoritesPopup.classList.remove('active');
            cartPopup.classList.toggle('active');
            if (!cartPopup.classList.contains('active') && saveFavInputPanel) {
                saveFavInputPanel.classList.add('hidden');
            }
            updateToTopPosition();
        });
    }

    if (closePopupBtn && cartPopup) {
        closePopupBtn.addEventListener('click', () => {
            cartPopup.classList.remove('active');
            if (saveFavInputPanel) saveFavInputPanel.classList.add('hidden');
            updateToTopPosition();
        });
    }

    if (favoritesToggleBtn && favoritesPopup) {
        favoritesToggleBtn.addEventListener('click', () => {
            if (cartPopup) cartPopup.classList.remove('active');
            favoritesPopup.classList.toggle('active');
            updateToTopPosition();
        });
    }

    if (closeFavoritesPopup && favoritesPopup) {
        closeFavoritesPopup.addEventListener('click', () => {
            favoritesPopup.classList.remove('active');
            updateToTopPosition();
        });
    }

    if (saveCurrentFavBtn) saveCurrentFavBtn.addEventListener('click', () => saveToFavorites(favNameInput));

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOrderConfirmModal();
        });
    }

    if (openSaveFavPanelBtn && saveFavInputPanel) {
        openSaveFavPanelBtn.addEventListener('click', () => {
            saveFavInputPanel.classList.toggle('hidden');
            if (!saveFavInputPanel.classList.contains('hidden')) saveFavNameInput.focus();
        });
    }

    if (confirmSaveFavBtn) {
        confirmSaveFavBtn.addEventListener('click', () => {
            saveToFavorites(saveFavNameInput);
            if (saveFavInputPanel) saveFavInputPanel.classList.add('hidden');
        });
    }

    function updateToTopPosition() {
        const toTopBtn = document.getElementById("toTopBtn");
        if (!toTopBtn) return;
        const isMobile = window.innerWidth <= 767;
        const isFavActive = favoritesPopup && favoritesPopup.classList.contains('active');
        const isCartActive = cartPopup && cartPopup.classList.contains('active');

        if (isMobile && (isFavActive || isCartActive)) {
            toTopBtn.style.bottom = '200px';
        } else {
            toTopBtn.style.bottom = '';
        }
    }

    window.addEventListener('resize', updateToTopPosition);

    let lightbox = document.getElementById('lightbox');
    let lightboxImg = document.getElementById('lightbox-img');
    let closeBtn = document.querySelector('.lightbox-close');

    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox-modal';
        lightbox.innerHTML = `
            <span class="lightbox-close">×</span>
            <img class="lightbox-content" id="lightbox-img" alt="Увеличенное фото">
        `;
        document.body.appendChild(lightbox);
        lightboxImg = lightbox.querySelector('#lightbox-img');
        closeBtn = lightbox.querySelector('.lightbox-close');
    }

    document.querySelectorAll('.info-card img').forEach(img => {
        img.addEventListener('click', () => {
            lightbox.classList.add('active');
            lightboxImg.src = img.src;
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    updateUI();
});