document.addEventListener('DOMContentLoaded', () => {

    const WHATSAPP_NUMBER = '77074242531';

    const STORAGE_KEY = 'honey_shop_cart_v2';
    const FAV_STORAGE_KEY = 'honey_shop_favs_v2';

    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let favorites = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];

    // --- Логика выбора стола ---
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    let selectedTable = null; // '1', '2', 'takeaway' etc.
    let orderType = null; // 'dine-in', 'takeaway'

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


    // Создание модального окна проверки заказа с затемнением фона и кнопкой сохранения в избранное
    const orderConfirmModal = document.createElement('div');
    orderConfirmModal.id = 'order-confirm-modal';
    orderConfirmModal.className = 'cart-popup';
    orderConfirmModal.style.zIndex = '2000';
    orderConfirmModal.innerHTML = `
        <div class="cart-popup-header">
            <h3>Точно ли вы заказали это?</h3>
            <button id="close-confirm-modal" class="close-popup-btn">&times;</button>
        </div>

        <!-- НОВЫЙ БЛОК: ВЫБОР СТОЛА -->
        <div id="table-selection-block" class="table-selection-block">
            <h4 class="table-selection-title">ФУНКЦИЯ ДЛЯ КАФЕ И РЕСТОРАНОВ ПРИ НАЛИЧИИ QR-КОДОВ</h4>
            <p class="table-selection-desc">Заказывайте прямо со стола, не дожидаясь официанта! Просто отсканируйте QR-код, выберите блюда и отправьте заказ. Еда будет готовиться, пока вы отдыхаете. А если хотите заказать заранее из дома — выберите третий вариант и приезжайте к готовому заказу!</p>
            
            <div class="table-buttons-container">
                <button id="table-btn-current" class="table-select-btn">
                    <span class="table-btn-icon">🍽️</span>
                    <span class="table-btn-text">Я сижу за столом №${tableFromUrl || '?'}</span>
                </button>
                <button id="table-btn-other" class="table-select-btn">
                    <span class="table-btn-icon">🔄</span>
                    <span class="table-btn-text">Нет, я за другим столом</span>
                </button>
                <button id="table-btn-takeaway" class="table-select-btn">
                    <span class="table-btn-icon">🥡</span>
                    <span class="table-btn-text">Я заказываю заранее (предоплата)</span>
                </button>
            </div>

            <div id="manual-table-input-container" class="manual-table-input-container hidden">
                <input type="number" id="manual-table-input" placeholder="Введите номер стола" min="1">
                <button id="confirm-manual-table-btn" class="fav-save-btn">Подтвердить</button>
            </div>

            <div id="table-error-message" class="table-error-message hidden">
                ⚠️ ВАЖНО! Выберите стол, за которым вы сидите!
            </div>
        </div>

        <p style="font-size: 13px; color: #78716c; margin-bottom: 12px;">Проверьте ваш заказ, при необходимости измените количество или сохраните в избранное:</p>
        <div id="confirm-modal-items" class="cart-popup-items" style="margin-bottom: 15px;"></div>
        
        <div class="confirm-fav-save-row">
            <input type="text" id="confirm-fav-name-input" placeholder="Название набора для избранного" class="fav-input" style="background: #fff;">
            <button id="confirm-save-fav-btn" class="fav-save-btn" style="white-space: nowrap;">⭐ Избранное</button>
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

    // Создание подложки для затемнения фона (backdrop)
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1999;
        display: none;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(modalBackdrop);

    const closeConfirmModalBtn = document.getElementById('close-confirm-modal');
    const confirmModalItems = document.getElementById('confirm-modal-items');
    const confirmTotalPrice = document.getElementById('confirm-total-price');
    const confirmWhatsappFinalBtn = document.getElementById('confirm-whatsapp-final-btn');
    const confirmFavNameInput = document.getElementById('confirm-fav-name-input');
    const confirmSaveFavBtn = document.getElementById('confirm-save-fav-btn');

    // Элементы для выбора стола
    const tableSelectionBlock = document.getElementById('table-selection-block');
    const tableBtnCurrent = document.getElementById('table-btn-current');
    const tableBtnOther = document.getElementById('table-btn-other');
    const tableBtnTakeaway = document.getElementById('table-btn-takeaway');
    const manualTableInputContainer = document.getElementById('manual-table-input-container');
    const manualTableInput = document.getElementById('manual-table-input');
    const confirmManualTableBtn = document.getElementById('confirm-manual-table-btn');
    const tableErrorMessage = document.getElementById('table-error-message');

    // --- Функции для работы с блоком выбора стола ---

    function resetTableSelection() {
        selectedTable = null;
        orderType = null;
        tableErrorMessage.classList.add('hidden');
        manualTableInputContainer.classList.add('hidden');
        manualTableInput.value = '';

        // Сброс активных классов
        [tableBtnCurrent, tableBtnOther, tableBtnTakeaway].forEach(btn => {
            btn.classList.remove('active', 'selected-takeaway');
        });

        // Обновляем текст первой кнопки в зависимости от URL
        if (tableFromUrl) {
            tableBtnCurrent.querySelector('.table-btn-text').textContent = `Я сижу за столом №${tableFromUrl}`;
            tableBtnCurrent.style.display = 'flex';
        } else {
            tableBtnCurrent.querySelector('.table-btn-text').textContent = `Указать стол`;
            // Можно скрыть, но лучше оставить для ручного ввода
            tableBtnCurrent.style.display = 'flex';
        }
    }

    function handleTableSelection(type, tableNumber = null) {
        resetTableSelection(); // Сбрасываем прошлый выбор
        tableErrorMessage.classList.add('hidden');

        if (type === 'current') {
            if (tableFromUrl) {
                selectedTable = tableFromUrl;
                orderType = 'dine-in';
                tableBtnCurrent.classList.add('active');
            } else {
                // Если в URL нет стола, эта кнопка работает как "Указать стол"
                tableBtnOther.click();
                return;
            }
        } else if (type === 'other') {
            orderType = 'dine-in';
            tableBtnOther.classList.add('active');
            manualTableInputContainer.classList.remove('hidden');
            manualTableInput.focus();
            return; // Не устанавливаем selectedTable, ждем ввода
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
            // Можно добавить визуальное подтверждение
            tableBtnOther.querySelector('.table-btn-text').textContent = `Стол №${manualTableNumber}`;
            tableBtnOther.classList.add('active');
        } else {
            manualTableInput.style.borderColor = '#dc2626';
            setTimeout(() => { manualTableInput.style.borderColor = ''; }, 2000);
        }
    });

    manualTableInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmManualTableBtn.click();
        }
    });


    function formatWeight(weight) {
        return weight === '1.5'
            ? '1,5 кг'
            : `${weight} кг`;
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
                const price = parseInt(option.dataset.price);
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;

                if (qty > 0) {
                    items.push({
                        id,
                        name,
                        weight,
                        price,
                        qty,
                        key
                    });
                }
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

                if (countSpan) {
                    countSpan.textContent = qty;
                }
            });
        });

        getCartItems().forEach(item => {
            const itemSum = item.price * item.qty;
            totalSum += itemSum;
            totalCount += item.qty;

            itemsSummaryArray.push(
                `${item.name} — ${formatWeight(item.weight)} x${item.qty}`
            );

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

        if (barTotalPrice) {
            barTotalPrice.textContent = totalSum + ' ₸';
        }

        if (totalCount > 0) {
            if (barItemsText) {
                barItemsText.textContent = itemsSummaryArray.join(', ');
            }
            if (orderBar) {
                orderBar.classList.remove('hidden');
            }
        } else {
            if (orderBar) {
                orderBar.classList.add('hidden');
            }
            if (cartPopup) {
                cartPopup.classList.remove('active');
            }
            closeOrderConfirmModal();
        }

        updateFavoritesUI();
        
        if (orderConfirmModal.classList.contains('active')) {
            updateConfirmModalContent();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
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


    // Функции для модального окна проверки заказа
    function openOrderConfirmModal() {
        const cartItems = getCartItems();
        if (cartItems.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        if (cartPopup) cartPopup.classList.remove('active');
        if (favoritesPopup) favoritesPopup.classList.remove('active');

        resetTableSelection(); // Сбрасываем выбор стола при каждом открытии
        updateConfirmModalContent();
        modalBackdrop.style.display = 'block';
        orderConfirmModal.classList.add('active');
    }

    function closeOrderConfirmModal() {
        orderConfirmModal.classList.remove('active');
        modalBackdrop.style.display = 'none';
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


    if (closeConfirmModalBtn) {
        closeConfirmModalBtn.addEventListener('click', closeOrderConfirmModal);
    }
    modalBackdrop.addEventListener('click', closeOrderConfirmModal);


    // Сохранение в избранное прямо из окна проверки заказа
    if (confirmSaveFavBtn) {
        confirmSaveFavBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                alert('Корзина пуста!');
                return;
            }

            let customName = confirmFavNameInput.value.trim();
            if (!customName) {
                customName = `Набор #${favorites.length + 1}`;
            }

            const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
            const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            favorites.push({
                name: customName,
                summary: summaryArr.join(', '),
                total: totalSum,
                cartData: { ...cart }
            });

            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            confirmFavNameInput.value = '';
            updateFavoritesUI();
            alert('Заказ успешно сохранен в избранное! ⭐');
        });
    }


    // Итоговая отправка в WhatsApp из модального окна проверки
    if (confirmWhatsappFinalBtn) {
        confirmWhatsappFinalBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                alert('Корзина пуста!');
                return;
            }

            // Проверка выбора стола
            if (!selectedTable && orderType !== 'takeaway') {
                tableErrorMessage.classList.remove('hidden');
                // Прокрутка к блоку выбора стола для привлечения внимания
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

            const encodedMessage = encodeURIComponent(message);
            const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

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
        });
    }


    if (closePopupBtn && cartPopup) {
        closePopupBtn.addEventListener('click', () => {
            cartPopup.classList.remove('active');
        });
    }


    if (favoritesToggleBtn && favoritesPopup) {
        favoritesToggleBtn.addEventListener('click', () => {
            if (cartPopup) cartPopup.classList.remove('active');
            favoritesPopup.classList.toggle('active');
        });
    }


    if (closeFavoritesPopup && favoritesPopup) {
        closeFavoritesPopup.addEventListener('click', () => {
            favoritesPopup.classList.remove('active');
        });
    }


    if (saveCurrentFavBtn) {
        saveCurrentFavBtn.addEventListener('click', () => {
            const totalCount = getCartItems().reduce((sum, item) => sum + item.qty, 0);
            if (totalCount === 0) {
                alert('Корзина пуста, нечего сохранять!');
                return;
            }

            let customName = favNameInput.value.trim();
            if (!customName) {
                customName = `Набор #${favorites.length + 1}`;
            }

            const cartItems = getCartItems();
            const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
            const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            favorites.push({
                name: customName,
                summary: summaryArr.join(', '),
                total: totalSum,
                cartData: { ...cart }
            });

            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            favNameInput.value = '';
            updateFavoritesUI();
            alert('Заказ успешно сохранен в избранное! ⭐');
        });
    }


    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOrderConfirmModal();
        });
    }


    updateUI();


    /*
     * Lightbox
     */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const images = document.querySelectorAll('.info-card img');

    if (lightbox) {
        images.forEach(img => {
            img.addEventListener('click', () => {
                lightbox.classList.add('active');
                lightboxImg.src = img.src;
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                lightbox.classList.remove('active');
            });
        }

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
    }

});