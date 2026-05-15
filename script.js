// script.js - Отрисовка страниц, поиск, фильтрация, редактирование, уведомления

const currentPage = window.location.pathname.split('/').pop();

// Переменные для фильтров
let clientSearch = '';
let orderSearch = '';
let orderStatusFilter = 'all';

// ========== ОТРИСОВКА СТРАНИЦ ==========
function renderDashboard() {
    const stats = getStats();
    const statsContainer = document.getElementById('statsContainer');
    if(statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card"><div class="stat-value">${stats.activeOrders}</div><div class="stat-label"><i class="fas fa-tools"></i> Заказов в работе</div></div>
            <div class="stat-card"><div class="stat-value">${stats.completedOrders}</div><div class="stat-label"><i class="fas fa-check-circle"></i> Готовых заказов</div></div>
            <div class="stat-card"><div class="stat-value">${stats.totalDebt.toLocaleString()} ₽</div><div class="stat-label"><i class="fas fa-money-bill-wave"></i> Общий долг</div></div>
            <div class="stat-card"><div class="stat-value">${stats.monthRevenue.toLocaleString()} ₽</div><div class="stat-label"><i class="fas fa-chart-line"></i> Выручка за месяц</div></div>
        `;
    }
}

function renderClients() {
    const content = document.getElementById('appContent');
    if(!content) return;

    let filteredClients = clients;
    if(clientSearch.trim() !== '') {
        const lowerQuery = clientSearch.toLowerCase();
        filteredClients = clients.filter(c => 
            c.name.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(lowerQuery) ||
            c.comment.toLowerCase().includes(lowerQuery)
        );
    }
    
    let html = `
        <div class="flex-between">
            <h2><i class="fas fa-users"></i> Клиенты</h2>
            <button class="btn-success" id="openClientModalBtn"><i class="fas fa-plus"></i> Добавить клиента</button>
        </div>
        <div class="search-section">
            <input type="text" id="clientSearchInput" class="search-input" placeholder="🔍 Поиск по имени, телефону, комментарию..." value="${escapeHtml(clientSearch)}">
        </div>
        <div class="table-wrapper">
            <table>
                <thead><tr><th>Имя</th><th>Телефон</th><th>Комментарий</th><th>Действия</th></tr></thead>
                <tbody>
    `;
    
    if(filteredClients.length === 0) {
        html += `<tr><td colspan="4" class="empty-state"><i class="fas fa-user-slash"></i> Ничего не найдено</td></tr>`;
    } else {
        filteredClients.forEach(client => {
            html += `
                <tr data-client-id="${client.id}" class="client-row">
                    <td>${escapeHtml(client.name)}</td>
                    <td>${escapeHtml(client.phone)}</td>
                    <td>${escapeHtml(client.comment)}</td>
                    <td>
                        <button class="btn-outline btn-sm edit-client" data-id="${client.id}"><i class="fas fa-edit"></i> Редактировать</button>
                        <button class="btn-danger btn-sm delete-client" data-id="${client.id}"><i class="fas fa-trash"></i> Удалить</button>
                    </td>
                </tr>
            `;
        });
    }
    html += `</tbody></table></div>`;
    content.innerHTML = html;
    
    const searchInput = document.getElementById('clientSearchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clientSearch = e.target.value;
            renderClients();
            attachClientsEvents();
        });
    }
}

function renderOrders() {
    const content = document.getElementById('appContent');
    if(!content) return;
    
    let filteredOrders = orders;
    if(orderSearch.trim() !== '') {
        const lowerQuery = orderSearch.toLowerCase();
        filteredOrders = filteredOrders.filter(o => 
            getClientName(o.clientId).toLowerCase().includes(lowerQuery) ||
            o.description.toLowerCase().includes(lowerQuery)
        );
    }
    if(orderStatusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(o => o.status === orderStatusFilter);
    }
    
    let html = `
        <div class="flex-between">
            <h2><i class="fas fa-box"></i> Заказы</h2>
            <button class="btn-success" id="openOrderModalBtn"><i class="fas fa-plus"></i> Создать заказ</button>
        </div>
        <div class="search-section">
            <input type="text" id="orderSearchInput" class="search-input" placeholder="🔍 Поиск по клиенту или описанию..." value="${escapeHtml(orderSearch)}">
            <select id="orderStatusFilter" class="filter-select">
                <option value="all" ${orderStatusFilter === 'all' ? 'selected' : ''}>Все статусы</option>
                <option value="Новый" ${orderStatusFilter === 'Новый' ? 'selected' : ''}>Новый</option>
                <option value="В работе" ${orderStatusFilter === 'В работе' ? 'selected' : ''}>В работе</option>
                <option value="Выдан" ${orderStatusFilter === 'Выдан' ? 'selected' : ''}>Выдан</option>
            </select>
        </div>
        <div class="table-wrapper">
            <table>
                <thead><tr><th>Клиент</th><th>Описание</th><th>Статус</th><th>Стоимость</th><th>Остаток долга</th><th>Действия</th></tr></thead>
                <tbody>
    `;
    
    if(filteredOrders.length === 0) {
        html += `<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i> Заказов не найдено</td></tr>`;
    } else {
        filteredOrders.forEach(order => {
            const clientName = getClientName(order.clientId);
            let badgeClass = '';
            if(order.status === 'Новый') badgeClass = 'badge-new';
            else if(order.status === 'В работе') badgeClass = 'badge-work';
            else if(order.status === 'Выдан') badgeClass = 'badge-done';
            html += `
                <tr data-order-id="${order.id}" class="order-row">
                    <td>${escapeHtml(clientName)}</td>
                    <td>${escapeHtml(order.description)}</td>
                    <td><span class="badge ${badgeClass}">${order.status}</span></td>
                    <td>${order.cost.toLocaleString()} ₽</td>
                    <td class="${order.debtRemaining > 0 ? 'debt-amount' : ''}">${order.debtRemaining.toLocaleString()} ₽</td>
                    <td>
                        <button class="btn-outline btn-sm edit-order" data-id="${order.id}"><i class="fas fa-edit"></i> Ред.</button>
                        <select class="filter-select status-change" data-id="${order.id}" style="width: auto; padding: 4px 8px;">
                            <option value="Новый" ${order.status === 'Новый' ? 'selected' : ''}>Новый</option>
                            <option value="В работе" ${order.status === 'В работе' ? 'selected' : ''}>В работе</option>
                            <option value="Выдан" ${order.status === 'Выдан' ? 'selected' : ''}>Выдан</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    }
    html += `</tbody></table></div>`;
    content.innerHTML = html;
    
    const searchInput = document.getElementById('orderSearchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            orderSearch = e.target.value;
            renderOrders();
            attachOrdersEvents();
        });
    }
    const filterSelect = document.getElementById('orderStatusFilter');
    if(filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            orderStatusFilter = e.target.value;
            renderOrders();
            attachOrdersEvents();
        });
    }
}

function renderDebtors() {
    const content = document.getElementById('appContent');
    if(!content) return;
    const debtorsList = orders.filter(o => o.debtRemaining > 0 && o.status !== 'Выдан');
    let html = `<h2><i class="fas fa-exclamation-triangle"></i> Должники</h2>`;
    if(debtorsList.length === 0) {
        html += `<div class="empty-state"><i class="fas fa-smile-wink"></i> Нет должников! Все долги погашены.</div>`;
    } else {
        html += `<div class="table-wrapper"><table><thead><tr><th>Клиент</th><th>Описание заказа</th><th>Остаток долга</th><th>Дата приёма</th><th>Действие</th></tr></thead><tbody>`;
        debtorsList.forEach(order => {
            const clientName = getClientName(order.clientId);
            html += `
                <tr>
                    <td>${escapeHtml(clientName)}</td>
                    <td>${escapeHtml(order.description)}</td>
                    <td class="debt-amount">${order.debtRemaining.toLocaleString()} ₽</td>
                    <td>${order.date || '—'}</td>
                    <td><button class="btn-success pay-debt" data-id="${order.id}"><i class="fas fa-hand-holding-usd"></i> Принять оплату</button></td>
                </tr>
            `;
        });
        html += `</tbody></table></div><div class="info-note"><i class="fas fa-info-circle"></i> При нажатии «Принять оплату» долг обнуляется, заказ переходит в статус «Выдан».</div>`;
    }
    content.innerHTML = html;
}

// ========== ОБРАБОТЧИКИ (с редактированием) ==========
function attachClientsEvents() {
    document.getElementById('openClientModalBtn')?.addEventListener('click', () => openClientModal());
    document.querySelectorAll('.delete-client').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if(confirm('Удалить клиента и все его заказы?')) {
                deleteClient(id);
                renderClients();
                attachClientsEvents();
                showToast('Клиент удалён', 'success');
            }
        });
    });
    document.querySelectorAll('.edit-client').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const client = clients.find(c => c.id === id);
            if(client) openClientModal(client);
        });
    });
}

function attachOrdersEvents() {
    document.getElementById('openOrderModalBtn')?.addEventListener('click', () => openOrderModal());
    document.querySelectorAll('.status-change').forEach(select => {
        select.addEventListener('change', (e) => {
            const orderId = select.getAttribute('data-id');
            updateOrderStatus(orderId, select.value);
            renderOrders();
            attachOrdersEvents();
            showToast(`Статус заказа изменён на "${select.value}"`, 'success');
        });
    });
    document.querySelectorAll('.edit-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const order = orders.find(o => o.id === id);
            if(order) openOrderModal(order);
        });
    });
}

function attachDebtorsEvents() {
    document.querySelectorAll('.pay-debt').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            acceptPayment(orderId);
            renderDebtors();
            attachDebtorsEvents();
            showToast('Оплата принята, долг погашен', 'success');
        });
    });
}

// ========== МОДАЛЬНЫЕ ОКНА (добавление/редактирование) ==========
function openClientModal(client = null) {
    const modal = document.getElementById('clientModal');
    const title = document.getElementById('clientModalTitle');
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const commentInput = document.getElementById('clientComment');
    const saveBtn = document.getElementById('saveClientBtn');
    
    if(client) {
        title.innerHTML = '<i class="fas fa-user-edit"></i> Редактировать клиента';
        nameInput.value = client.name;
        phoneInput.value = client.phone;
        commentInput.value = client.comment;
        saveBtn.setAttribute('data-edit-id', client.id);
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> Новый клиент';
        nameInput.value = '';
        phoneInput.value = '';
        commentInput.value = '';
        saveBtn.removeAttribute('data-edit-id');
    }
    modal.style.display = 'flex';
    
    const closeHandler = () => {
        modal.style.display = 'none';
        cleanup();
    };
    const saveHandler = () => {
        const name = nameInput.value.trim();
        if(!name) { showToast('Введите имя', 'error'); return; }
        const phone = phoneInput.value.trim();
        const comment = commentInput.value.trim();
        const editId = saveBtn.getAttribute('data-edit-id');
        if(editId) {
            updateClient(editId, name, phone, comment);
            showToast('Клиент обновлён', 'success');
        } else {
            addClient(name, phone, comment);
            showToast('Клиент добавлен', 'success');
        }
        modal.style.display = 'none';
        cleanup();
        renderClients();
        attachClientsEvents();
    };
    const cleanup = () => {
        document.getElementById('closeClientModal')?.removeEventListener('click', closeHandler);
        saveBtn?.removeEventListener('click', saveHandler);
        window.removeEventListener('click', outsideHandler);
    };
    const outsideHandler = (e) => { if(e.target === modal) closeHandler(); };
    document.getElementById('closeClientModal')?.addEventListener('click', closeHandler);
    saveBtn?.addEventListener('click', saveHandler);
    window.addEventListener('click', outsideHandler);
}

function openOrderModal(order = null) {
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderModalTitle');
    const clientSelect = document.getElementById('orderClientId');
    const descInput = document.getElementById('orderDesc');
    const statusSelect = document.getElementById('orderStatus');
    const costInput = document.getElementById('orderCost');
    const debtInput = document.getElementById('orderDebt');
    const saveBtn = document.getElementById('saveOrderBtn');
    
    clientSelect.innerHTML = '<option value="">Выберите клиента</option>' + 
        clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    
    if(order) {
        title.innerHTML = '<i class="fas fa-edit"></i> Редактировать заказ';
        clientSelect.value = order.clientId;
        descInput.value = order.description;
        statusSelect.value = order.status;
        costInput.value = order.cost;
        debtInput.value = order.debtRemaining;
        saveBtn.setAttribute('data-edit-id', order.id);
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Создать заказ';
        descInput.value = '';
        statusSelect.value = 'Новый';
        costInput.value = '';
        debtInput.value = '';
        saveBtn.removeAttribute('data-edit-id');
    }
    modal.style.display = 'flex';
    
    const closeHandler = () => {
        modal.style.display = 'none';
        cleanup();
    };
    const saveHandler = () => {
        const clientId = clientSelect.value;
        const desc = descInput.value.trim();
        const status = statusSelect.value;
        const cost = parseFloat(costInput.value);
        const debt = debtInput.value === '' ? cost : parseFloat(debtInput.value);
        if(!clientId || !desc || isNaN(cost) || cost <= 0) {
            showToast('Заполните все поля корректно', 'error');
            return;
        }
        const editId = saveBtn.getAttribute('data-edit-id');
        if(editId) {
            updateOrder(editId, clientId, desc, status, cost, debt);
            showToast('Заказ обновлён', 'success');
        } else {
            addOrder(clientId, desc, status, cost, debt);
            showToast('Заказ создан', 'success');
        }
        modal.style.display = 'none';
        cleanup();
        renderOrders();
        attachOrdersEvents();
    };
    const cleanup = () => {
        document.getElementById('closeOrderModal')?.removeEventListener('click', closeHandler);
        saveBtn?.removeEventListener('click', saveHandler);
        window.removeEventListener('click', outsideHandler);
    };
    const outsideHandler = (e) => { if(e.target === modal) closeHandler(); };
    document.getElementById('closeOrderModal')?.addEventListener('click', closeHandler);
    saveBtn?.addEventListener('click', saveHandler);
    window.addEventListener('click', outsideHandler);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    loadData();
    if(currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
        renderDashboard();
    } else if(currentPage === 'clients.html' || currentPage === 'clients') {
        renderClients();
        attachClientsEvents();
    } else if(currentPage === 'orders.html' || currentPage === 'orders') {
        renderOrders();
        attachOrdersEvents();
    } else if(currentPage === 'debtors.html' || currentPage === 'debtors') {
        renderDebtors();
        attachDebtorsEvents();
    }
}

document.addEventListener('DOMContentLoaded', init);