// data.js - Управление данными и localStorage

let clients = [];
let orders = [];

// Загрузка данных
function loadData() {
    const storedClients = localStorage.getItem('clients');
    const storedOrders = localStorage.getItem('orders');
    
    if(storedClients) {
        clients = JSON.parse(storedClients);
    } else {
        clients = [
            { id: 'c1', name: 'Иван Петров', phone: '+7 999 123-45-67', comment: 'Постоянный клиент' },
            { id: 'c2', name: 'Мария Сидорова', phone: '+7 999 765-43-21', comment: 'Ремонт ноутбука' },
            { id: 'c3', name: 'Алексей Иванов', phone: '+7 999 111-22-33', comment: 'Срочный заказ' }
        ];
    }
    
    if(storedOrders) {
        orders = JSON.parse(storedOrders);
    } else {
        orders = [
            { id: 'o1', clientId: 'c1', description: 'Ремонт iPhone', status: 'В работе', cost: 5000, debtRemaining: 2000, date: '01.05.2026' },
            { id: 'o2', clientId: 'c2', description: 'Замена экрана', status: 'Новый', cost: 3000, debtRemaining: 1000, date: '05.05.2026' },
            { id: 'o3', clientId: 'c3', description: 'Ремонт планшета', status: 'В работе', cost: 4000, debtRemaining: 4000, date: '10.05.2026' }
        ];
    }
}

function saveToStorage() {
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('orders', JSON.stringify(orders));
}

function getClientName(clientId) {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Неизвестно';
}

// --- Клиенты ---
function addClient(name, phone, comment) {
    const newId = 'c' + Date.now();
    clients.push({ id: newId, name: name.trim(), phone: phone.trim(), comment: comment.trim() });
    saveToStorage();
    return newId;
}

function updateClient(clientId, name, phone, comment) {
    const client = clients.find(c => c.id === clientId);
    if(client) {
        client.name = name.trim();
        client.phone = phone.trim();
        client.comment = comment.trim();
        saveToStorage();
        return true;
    }
    return false;
}

function deleteClient(clientId) {
    orders = orders.filter(o => o.clientId !== clientId);
    clients = clients.filter(c => c.id !== clientId);
    saveToStorage();
}

// --- Заказы ---
function addOrder(clientId, description, status, cost, debtRemaining) {
    const today = new Date().toLocaleDateString('ru-RU');
    const newId = 'o' + Date.now();
    orders.push({
        id: newId, clientId, description: description.trim(), status,
        cost: Number(cost), debtRemaining: Number(debtRemaining), date: today
    });
    saveToStorage();
}

function updateOrder(orderId, clientId, description, status, cost, debtRemaining) {
    const order = orders.find(o => o.id === orderId);
    if(order) {
        order.clientId = clientId;
        order.description = description.trim();
        order.status = status;
        order.cost = Number(cost);
        order.debtRemaining = Number(debtRemaining);
        saveToStorage();
        return true;
    }
    return false;
}

function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if(order) { order.status = newStatus; saveToStorage(); }
}

function acceptPayment(orderId) {
    const order = orders.find(o => o.id === orderId);
    if(order) { order.debtRemaining = 0; order.status = 'Выдан'; saveToStorage(); }
}

// --- Статистика ---
function getStats() {
    const activeOrders = orders.filter(o => o.status === 'В работе').length;
    const completedOrders = orders.filter(o => o.status === 'Выдан').length;
    const totalDebt = orders.reduce((sum, o) => sum + (o.debtRemaining || 0), 0);
    const monthRevenue = orders.filter(o => o.status === 'Выдан').reduce((sum, o) => sum + (o.cost || 0), 0);
    return { activeOrders, completedOrders, totalDebt, monthRevenue };
}

// --- Helper ---
function escapeHtml(str) {
    if(!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';
        return m;
    });
}

// --- Уведомления ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}