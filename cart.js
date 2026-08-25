document.addEventListener('DOMContentLoaded', () => {

    const WHATSAPP_NUMBER = '77086229735'; // Установлен ваш новый единый номер

    const STORAGE_KEY = 'site_template_cart_v1';
    const FAV_STORAGE_KEY = 'site_template_favs_v1';

    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let favorites = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];

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
                    items.push({ id, name, weight, price, qty, key });
                }
            });
        });
        return items;
    }

    function getTotalPrice() {
        let total = 0;
        getCartItems().forEach(item => {
            total += item.price * item.qty;
        });
        return total;
    }

    function updateUI() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

        cards.forEach(card => {
            const id = card.dataset.id;
            const weightOptions = card.querySelectorAll('.weight-option');

            weightOptions.forEach(option => {
                const weight = option.dataset.weight;
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;
                const cntValue = option.querySelector('.cnt-value');
                if (cntValue) cntValue.textContent = qty;
            });
        });

        const items = getCartItems();
        const total = getTotalPrice();
        const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

        if (totalCount > 0) {
            orderBar.classList.remove('hidden');
            barTotalPrice.textContent = total.toLocaleString() + ' ₸';
            barItemsText.textContent = items.map(i => `${i.name} (${i.weight}) x${i.qty}`).join(', ');
        } else {
            orderBar.classList.add('hidden');
            cartPopup.classList.remove('active');
        }

        renderCartPopupItems();
        renderFavoritesBadge();
    }

    function renderCartPopupItems() {
        const items = getCartItems();
        cartPopupItems.innerHTML = '';

        if (items.length === 0) {
            cartPopupItems.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 10px;">Корзина пуста</div>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'popup-item-row';
            row.innerHTML = `
                <div class="popup-item-info">
                    <span class="popup-item-name">${item.name} (${item.weight})</span>
                    <span class="popup-item-price">${item.price} ₸ x ${item.qty} = <strong>${item.price * item.qty} ₸</strong></span>
                </div>
                <div class="counter-box">
                    <button class="cnt-btn popup-minus" data-key="${item.key}">-</button>
                    <span class="cnt-value">${item.qty}</span>
                    <button class="cnt-btn popup-plus" data-key="${item.key}">+</button>
                </div>
            `;
            cartPopupItems.appendChild(row);
        });
    }

    // Обработка кнопок плюс/минус на карточках и в корзине
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('plus')) {
            const option = e.target.closest('.weight-option');
            const card = e.target.closest('.info-card');
            if (option && card) {
                const key = getCartKey(card.dataset.id, option.dataset.weight);
                cart[key] = (cart[key] || 0) + 1;
                updateUI();
            }
        }
        if (e.target.classList.contains('minus')) {
            const option = e.target.closest('.weight-option');
            const card = e.target.closest('.info-card');
            if (option && card) {
                const key = getCartKey(card.dataset.id, option.dataset.weight);
                if (cart[key] > 0) {
                    cart[key]--;
                    if (cart[key] === 0) delete cart[key];
                    updateUI();
                }
            }
        }
        if (e.target.classList.contains('popup-plus')) {
            const key = e.target.dataset.key;
            if (cart[key]) {
                cart[key]++;
                updateUI();
            }
        }
        if (e.target.classList.contains('popup-minus')) {
            const key = e.target.dataset.key;
            if (cart[key]) {
                cart[key]--;
                if (cart[key] === 0) delete cart[key];
                updateUI();
            }
        }
    });

    if (orderBarToggle) {
        orderBarToggle.addEventListener('click', () => {
            cartPopup.classList.toggle('active');
            favoritesPopup.classList.remove('active');
        });
    }
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            cartPopup.classList.remove('active');
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const items = getCartItems();
            if (items.length === 0) return;
            let text = 'Здравствуйте! Хочу сделать заказ:%0A';
            items.forEach(i => {
                text += `- ${i.name} (${i.weight}) x${i.qty} = ${i.price * i.qty} ₸%0A`;
            });
            text += `%0AИтого: ${getTotalPrice().toLocaleString()} ₸`;
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
        });
    }

    function renderFavoritesBadge() {
        if (!favBadge) return;
        if (favorites.length > 0) {
            favBadge.textContent = favorites.length;
            favBadge.classList.remove('hidden');
        } else {
            favBadge.classList.add('hidden');
        }
    }

    if (favoritesToggleBtn) {
        favoritesToggleBtn.addEventListener('click', () => {
            favoritesPopup.classList.toggle('active');
            cartPopup.classList.remove('active');
            renderFavoritesList();
        });
    }
    if (closeFavoritesPopup) {
        closeFavoritesPopup.addEventListener('click', () => {
            favoritesPopup.classList.remove('active');
        });
    }

    if (saveCurrentFavBtn) {
        saveCurrentFavBtn.addEventListener('click', () => {
            const items = getCartItems();
            if (items.length === 0) {
                alert('Корзина пуста, нечего сохранять в избранное.');
                return;
            }
            const name = favNameInput.value.trim() || `Набор от ${new Date().toLocaleDateString()}`;
            favorites.push({ name, items: [...items] });
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            favNameInput.value = '';
            renderFavoritesList();
            renderFavoritesBadge();
            alert('Набор успешно сохранен в избранное!');
        });
    }

    function renderFavoritesList() {
        if (!favoritesPopupItems) return;
        favoritesPopupItems.innerHTML = '';
        if (favorites.length === 0) {
            favoritesPopupItems.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 10px;">Нет сохраненных наборов</div>';
            return;
        }
        favorites.forEach((fav, index) => {
            const row = document.createElement('div');
            row.className = 'fav-item-row';
            const totalFavPrice = fav.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
            row.innerHTML = `
                <div class="fav-item-info">
                    <span class="fav-item-name">${fav.name}</span>
                    <span class="fav-item-desc">${fav.items.length} поз. — ${totalFavPrice.toLocaleString()} ₸</span>
                </div>
                <div class="fav-actions">
                    <button class="fav-load-btn" data-index="${index}">Загрузить</button>
                    <button class="fav-del-btn" data-index="${index}">Удалить</button>
                </div>
            `;
            favoritesPopupItems.appendChild(row);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-load-btn')) {
            const index = e.target.dataset.index;
            const fav = favorites[index];
            if (fav) {
                cart = {};
                fav.items.forEach(i => {
                    cart[i.key] = i.qty;
                });
                updateUI();
                favoritesPopup.classList.remove('active');
            }
        }
        if (e.target.classList.contains('fav-del-btn')) {
            const index = e.target.dataset.index;
            favorites.splice(index, 1);
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            renderFavoritesList();
            renderFavoritesBadge();
        }
    });

    // Lightbox для картинок
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.info-card')) {
            if (lightbox && lightboxImg) {
                lightboxImg.src = e.target.src;
                lightbox.classList.add('active');
            }
        }
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('active');
        });
    }

    updateUI();
});