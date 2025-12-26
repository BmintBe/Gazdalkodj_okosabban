// Banking Dashboard JavaScript
let players = [];
let selectedPlayer = null;
let currency = 'HUF';
let currentView = 'overview';
let transactions = [];
let sidebarOpen = true;
let selectedAvatar = 'green'; // Alapértelmezett: zöld

const avatarColors = {
    white: { bg: '#ffffff', border: '#d1d5db', emoji: '⚪', text: '#1f2937' },
    black: { bg: '#1f2937', border: '#374151', emoji: '⚫', text: '#ffffff' },
    red: { bg: '#ef4444', border: '#dc2626', emoji: '🔴', text: '#ffffff' },
    blue: { bg: '#3b82f6', border: '#2563eb', emoji: '🔵', text: '#ffffff' },
    green: { bg: '#10b981', border: '#059669', emoji: '🟢', text: '#ffffff' },
    yellow: { bg: '#fbbf24', border: '#f59e0b', emoji: '🟡', text: '#1f2937' }
};

const gameSettings = {
    HUF: {
        symbol: 'Ft',
        startCash: 238000,
        startAccount: 3000000,
        startPassThrough: 500000,
        startLanding: 1000000,
        apartmentCash: 9500000,
        apartmentInstallment: 11000000,
        apartmentDown: 2000000,
        apartmentMonthly: 90000,
        carCash: 7000000,
        carInstallment: 7960000,
        carDown: 2500000,
        carMonthly: 130000,
        insurances: {
            childFuture: { cost: 180000, payout: 1500000 },
            pension: { cost: 180000 },
            homeGuard: { cost: 30000 },
            casco: { cost: 50000 }
        },
        winConditionExtra: 600000
    },
    EUR: {
        symbol: '€',
        startCash: 18000,
        startAccount: 10000,
        startPassThrough: 2000,
        startLanding: 4000,
        apartmentCash: 30000,
        apartmentInstallment: 35000,
        apartmentDown: 15000,
        apartmentMonthly: 500,
        carCash: 25000,
        carInstallment: 27500,
        carDown: 6500,
        carMonthly: 500,
        insurances: {
            childFuture: { cost: 600, payout: 5000 },
            pension: { cost: 600 },
            homeGuard: { cost: 100 },
            casco: { cost: 160 }
        },
        winConditionExtra: 2000
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    updateStartInfo();
    setInterval(loadPlayers, 3000);
});

// API Functions
async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        const data = await response.json();
        players = data.players || data; // Kezeli ha objektum vagy tömb jön
        currency = data.currency || currency;
        
        if (selectedPlayer) {
            const updated = players.find(p => p.id === selectedPlayer.id);
            if (updated) {
                selectedPlayer = updated;
            } else {
                selectedPlayer = null;
            }
        }
        
        updateUI();
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        transactions = await response.json();
        renderHistoryView();
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function addPlayer() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
        await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, currency })
        });
        
        nameInput.value = '';
        await loadPlayers();
    } catch (error) {
        console.error('Error adding player:', error);
    }
}

async function transaction(playerId, cashAmount, accountAmount, description) {
    try {
        await fetch('/api/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                player_id: playerId, 
                cash_amount: cashAmount, 
                account_amount: accountAmount, 
                description 
            })
        });
        await loadPlayers();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updatePlayerData(playerId, updates) {
    try {
        await fetch(`/api/players/${playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        await loadPlayers();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function setCurrency(curr) {
    currency = curr;
    try {
        await fetch('/api/currency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: curr })
        });
        
        document.getElementById('currencyHUF').classList.toggle('active', curr === 'HUF');
        document.getElementById('currencyEUR').classList.toggle('active', curr === 'EUR');
        
        updateStartInfo();
        await loadPlayers();
    } catch (error) {
        console.error('Error:', error);
    }
}

// UI Functions
function updateUI() {
    const hasPlayers = players.length > 0;
    document.getElementById('welcomeScreen').classList.toggle('hidden', hasPlayers);
    document.getElementById('mainViews').classList.toggle('hidden', !hasPlayers);
    
    if (hasPlayers) {
        updatePlayersList();
        updateTopBar();
        renderCurrentView();
    }
}

function updateStartInfo() {
    const settings = gameSettings[currency];
    document.getElementById('startInfo').textContent = 
        `${formatMoney(settings.startCash)} készpénz + ${formatMoney(settings.startAccount)} folyószámla`;
}

function updatePlayersList() {
    const container = document.getElementById('playersList');
    container.innerHTML = players.map(p => {
        const avatar = avatarColors[p.avatar || 'green'];
        return `
        <div class="player-item ${selectedPlayer?.id === p.id ? 'active' : ''}" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatar.bg}; border: 2px solid ${avatar.border}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                ${avatar.emoji}
            </div>
            <div onclick="selectPlayer(${p.id})" style="flex: 1; cursor: pointer;">
                <div class="player-name">${p.name}</div>
                <div class="player-balance">${formatMoneyShort(p.cash + p.account)}</div>
            </div>
            <button onclick="event.stopPropagation(); deletePlayer(${p.id}, '${p.name}')" 
                    style="padding: 4px 8px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; line-height: 1; transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'"
                    title="Játékos törlése">
                ×
            </button>
        </div>
    `;
    }).join('');
    
    document.getElementById('sidebarPlayers').style.display = players.length > 0 ? 'block' : 'none';
}

function updateTopBar() {
    const userInfo = document.getElementById('userInfo');
    const notifBtn = document.getElementById('notificationBtn');
    
    if (selectedPlayer) {
        const avatar = avatarColors[selectedPlayer.avatar || 'green'];
        userInfo.style.display = 'flex';
        document.getElementById('userName').textContent = selectedPlayer.name;
        document.getElementById('userBalance').textContent = formatMoneyShort(selectedPlayer.cash + selectedPlayer.account);
        
        // Avatar színezése
        const avatarEl = document.getElementById('userAvatar');
        avatarEl.textContent = selectedPlayer.name[0].toUpperCase();
        avatarEl.style.background = avatar.bg;
        avatarEl.style.color = avatar.text;
        avatarEl.style.border = `2px solid ${avatar.border}`;
        
        const notifications = getNotifications(selectedPlayer);
        if (notifications.length > 0) {
            notifBtn.style.display = 'block';
            document.getElementById('notificationBadge').textContent = notifications.length;
        } else {
            notifBtn.style.display = 'none';
        }
    } else {
        userInfo.style.display = 'none';
        notifBtn.style.display = 'none';
    }
}

function selectPlayer(playerId) {
    selectedPlayer = players.find(p => p.id === playerId);
    updateUI();
}

function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
}

function setView(view) {
    currentView = view;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    renderCurrentView();
}

function renderCurrentView() {
    if (!selectedPlayer) return;
    
    // Hide all views
    ['viewOverview', 'viewAccounts', 'viewProperty', 'viewVehicle', 'viewInsurance', 'viewHistory'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show current view
    const viewId = `view${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`;
    document.getElementById(viewId).classList.remove('hidden');
    
    // Render notifications
    renderNotifications();
    
    // Render specific view
    switch(currentView) {
        case 'overview': renderOverviewView(); break;
        case 'accounts': renderAccountsView(); break;
        case 'property': renderPropertyView(); break;
        case 'vehicle': renderVehicleView(); break;
        case 'insurance': renderInsuranceView(); break;
        case 'history': loadTransactions(); break;
    }
}

function renderNotifications() {
    if (!selectedPlayer) return;
    
    const notifications = getNotifications(selectedPlayer);
    const container = document.getElementById('notifications');
    
    if (notifications.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = notifications.map(n => `
        <div class="notification ${n.type}">
            <div class="notification-icon">${n.icon}</div>
            <div class="notification-message">${n.message}</div>
        </div>
    `).join('');
}

function getNotifications(player) {
    const settings = gameSettings[currency];
    const notifications = [];
    
    if (player.loans.apartment.active && player.loans.apartment.remaining <= settings.apartmentMonthly * 3) {
        notifications.push({
            type: 'warning',
            icon: '🏠',
            message: 'Lakáshitel közel a végéhez!'
        });
    }
    
    if (player.loans.car.active && player.loans.car.remaining <= settings.carMonthly * 3) {
        notifications.push({
            type: 'warning',
            icon: '🚗',
            message: 'Autóhitel közel a végéhez!'
        });
    }
    
    if (player.insurances.childFuture && !player.insurances.childFuturePaid) {
        notifications.push({
            type: 'success',
            icon: '💰',
            message: 'Gyermekjövő kifizetés elérhető!'
        });
    }
    
    if (checkWinCondition(player)) {
        notifications.push({
            type: 'success',
            icon: '🏆',
            message: 'Gratulálunk! Megnyerted a játékot!'
        });
    }
    
    return notifications;
}

// Overview View
function renderOverviewView() {
    const settings = gameSettings[currency];
    const netWorth = selectedPlayer.cash + selectedPlayer.account;
    const assetsCount = getAssetsCount(selectedPlayer);
    const loansCount = getActiveLoansCount(selectedPlayer);
    const monthlyLoan = (selectedPlayer.loans.apartment.active ? settings.apartmentMonthly : 0) +
                        (selectedPlayer.loans.car.active ? settings.carMonthly : 0);
    const goalPercent = getWealthGoalPercent(selectedPlayer);
    
    document.getElementById('viewOverview').innerHTML = `
        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card primary">
                <div class="kpi-header">
                    <span class="kpi-label">NETTÓ VAGYON</span>
                    <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </div>
                <div class="kpi-value">${formatMoneyShort(netWorth)}</div>
                <div class="kpi-subtitle">↗ ${goalPercent}% cél teljesítve</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-label">ESZKÖZÖK</span>
                    <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                </div>
                <div class="kpi-value">${assetsCount}</div>
                <div class="kpi-subtitle">Ingatlan, jármű, biztosítások</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-label">AKTÍV HITELEK</span>
                    <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <div class="kpi-value">${loansCount}</div>
                <div class="kpi-subtitle">${loansCount > 0 ? `Havi: ${formatMoneyShort(monthlyLoan)}` : 'Nincs aktív hitel'}</div>
            </div>
        </div>
        
        <!-- Wealth Goal -->
        <div class="wealth-goal">
            <div class="wealth-goal-header">
                <h3>Vagyonépítési Cél</h3>
                <div class="wealth-goal-percent">${goalPercent}%</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${goalPercent}%"></div>
            </div>
            <div class="goal-items">
                <div class="goal-item ${selectedPlayer.hasApartment ? 'completed' : ''}">
                    <div class="goal-icon">${selectedPlayer.hasApartment ? '✓' : '○'}</div>
                    <div>Lakás</div>
                </div>
                <div class="goal-item ${selectedPlayer.hasCar ? 'completed' : ''}">
                    <div class="goal-icon">${selectedPlayer.hasCar ? '✓' : '○'}</div>
                    <div>Autó</div>
                </div>
                <div class="goal-item ${selectedPlayer.hasFurniture ? 'completed' : ''}">
                    <div class="goal-icon">${selectedPlayer.hasFurniture ? '✓' : '○'}</div>
                    <div>Bútorok</div>
                </div>
                <div class="goal-item ${!selectedPlayer.loans.apartment.active && selectedPlayer.hasApartment ? 'completed' : ''}">
                    <div class="goal-icon">${!selectedPlayer.loans.apartment.active && selectedPlayer.hasApartment ? '✓' : '○'}</div>
                    <div>Lakás fizetve</div>
                </div>
                <div class="goal-item ${!selectedPlayer.loans.car.active && selectedPlayer.hasCar ? 'completed' : ''}">
                    <div class="goal-icon">${!selectedPlayer.loans.car.active && selectedPlayer.hasCar ? '✓' : '○'}</div>
                    <div>Autó fizetve</div>
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
            <h3>Gyors Műveletek</h3>
            <div class="actions-grid">
                <button class="action-btn" onclick="startPassThrough()">
                    <div class="action-label">START áthaladás</div>
                    <div class="action-value">+${formatMoneyShort(settings.startPassThrough)}</div>
                </button>
                <button class="action-btn" onclick="startLanding()">
                    <div class="action-label">START rálépés</div>
                    <div class="action-value">+${formatMoneyShort(settings.startLanding)}</div>
                </button>
                <button class="action-btn" onclick="accountInterest()">
                    <div class="action-label">Kamat (8-as mező)</div>
                    <div class="action-value">7%</div>
                </button>
            </div>
        </div>
        
        <!-- Recent Timeline -->
        ${transactions.length > 0 ? `
        <div class="timeline">
            <h3>Legutóbbi Tranzakciók</h3>
            <div class="timeline-items">
                ${transactions.slice(0, 5).map(t => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-desc">${t.description}</div>
                            <div class="timeline-time">${t.timestamp}</div>
                        </div>
                        <div class="timeline-amounts">
                            ${t.cashAmount !== 0 ? `<div class="timeline-amount ${t.cashAmount >= 0 ? 'positive' : 'negative'}">${t.cashAmount >= 0 ? '+' : ''}${formatMoneyShort(t.cashAmount)} 💵</div>` : ''}
                            ${t.accountAmount !== 0 ? `<div class="timeline-amount ${t.accountAmount >= 0 ? 'positive' : 'negative'}">${t.accountAmount >= 0 ? '+' : ''}${formatMoneyShort(t.accountAmount)} 💳</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn-view-all" onclick="setView('history')">
                Összes megtekintése
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
        ` : ''}
    `;
}

// Accounts View
function renderAccountsView() {
    const settings = gameSettings[currency];
    
    document.getElementById('viewAccounts').innerHTML = `
        <h2 class="mb-24" style="font-size: 24px; font-weight: 700; color: #111827;">Számláim</h2>
        
        <div class="account-grid">
            <div class="account-card primary">
                <div class="account-header">
                    <div>
                        <div class="account-info-title">FOLYÓSZÁMLA</div>
                        <div class="account-info-subtitle">OTP Lakossági Számla</div>
                    </div>
                    <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <div class="account-balance">${formatMoney(selectedPlayer.account)}</div>
                <div class="account-actions">
                    <button class="btn-account" onclick="withdrawMoney()">Felvétel</button>
                </div>
            </div>
            
            <div class="account-card secondary">
                <div class="account-header">
                    <div>
                        <div class="account-info-title">KÉSZPÉNZ</div>
                        <div class="account-info-subtitle">Zsebben</div>
                    </div>
                    <div style="font-size: 32px;">💵</div>
                </div>
                <div class="account-balance">${formatMoney(selectedPlayer.cash)}</div>
                <div class="account-actions">
                    <button class="btn-account" onclick="depositMoney()">Befizetés</button>
                </div>
            </div>
        </div>
        
        <div class="custom-transaction">
            <h3>Egyedi Tranzakció</h3>
            <div class="transaction-inputs">
                <input type="number" id="customAmount" placeholder="Összeg">
                <input type="text" id="customDesc" placeholder="Leírás">
            </div>
            <div class="transaction-buttons">
                <button class="btn-transaction cash" onclick="customTransaction('cash')">Készpénzre</button>
                <button class="btn-transaction account" onclick="customTransaction('account')">Folyószámlára</button>
            </div>
        </div>
    `;
}

// Property View
function renderPropertyView() {
    const settings = gameSettings[currency];
    
    let html = '<h2 class="mb-24" style="font-size: 24px; font-weight: 700; color: #111827;">Ingatlan Vásárlás</h2>';
    
    if (selectedPlayer.hasApartment) {
        html += `
            <div class="owned-asset">
                <div class="asset-header">
                    <div class="asset-icon">🏠</div>
                    <div>
                        <div class="asset-title">Lakás a tulajdonodban</div>
                        <div class="asset-subtitle">Gratulálunk a vásárláshoz!</div>
                    </div>
                </div>
                ${selectedPlayer.loans.apartment.active ? `
                    <div class="loan-status">
                        <div class="loan-header">
                            <span class="loan-label">Lakáshitel státusz</span>
                            <span class="loan-percent">${getProgressPercent(selectedPlayer.loans.apartment.remaining, settings.apartmentInstallment - settings.apartmentDown)}% fizetve</span>
                        </div>
                        <div class="loan-progress">
                            <div class="loan-progress-fill" style="width: ${getProgressPercent(selectedPlayer.loans.apartment.remaining, settings.apartmentInstallment - settings.apartmentDown)}%"></div>
                        </div>
                        <div class="loan-details">
                            <span class="loan-detail-label">Havi törlesztés: ${formatMoney(settings.apartmentMonthly)}</span>
                            <span class="loan-detail-value">Hátra: ${formatMoney(selectedPlayer.loans.apartment.remaining)}</span>
                        </div>
                        <button class="btn-pay-loan" onclick="payApartmentLoan()">Törlesztés Fizetése</button>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        html += `
            <div class="purchase-grid">
                <div class="purchase-card">
                    <div class="purchase-label">EGYÖSSZEGBEN</div>
                    <div class="purchase-price">${formatMoney(settings.apartmentCash)}</div>
                    <ul class="purchase-features">
                        <li>• Nincs kamat</li>
                        <li>• Azonnali tulajdon</li>
                        <li>• Egy tranzakció</li>
                    </ul>
                    <button class="btn-purchase" onclick="buyApartmentCash()">Vásárlás</button>
                </div>
                
                <div class="purchase-card featured">
                    <div class="purchase-label">RÉSZLETRE</div>
                    <div class="purchase-price">${formatMoney(settings.apartmentInstallment)}</div>
                    <ul class="purchase-features">
                        <li>• Előleg: ${formatMoney(settings.apartmentDown)}</li>
                        <li>• Havi: ${formatMoney(settings.apartmentMonthly)}</li>
                        <li>• Törlesztéssel</li>
                    </ul>
                    <button class="btn-purchase" onclick="buyApartmentInstallment()">Részletre Vásárlás</button>
                </div>
            </div>
            
            <div class="info-box blue">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                    <strong>Tipp:</strong> A részletvásárlással kisebb összeggel is elkezdheted, de a kamat miatt végül többet fizetsz. Gondold át melyik opció illik jobban a stratégiádhoz!
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="custom-transaction" style="margin-top: 24px;">
            <h3>Bútorok</h3>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 600; color: #111827;">Lakásberendezés</div>
                    <div style="font-size: 13px; color: #6b7280;">Vásárolható: 11, 33, 38, 40-es mezőn</div>
                </div>
                <button class="btn-purchase" 
                        onclick="toggleFurniture()" 
                        ${!selectedPlayer.hasApartment && !selectedPlayer.hasFurniture ? 'disabled' : ''}
                        style="${selectedPlayer.hasFurniture ? 'background: #d1fae5; color: #047857; border: 2px solid #86efac;' : ''} padding: 12px 24px;">
                    ${selectedPlayer.hasFurniture ? '✓ Megvásárolva' : 'Vásárlás'}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('viewProperty').innerHTML = html;
}

// Vehicle View (hasonló a Property-hez)
function renderVehicleView() {
    const settings = gameSettings[currency];
    
    let html = '<h2 class="mb-24" style="font-size: 24px; font-weight: 700; color: #111827;">Jármű Vásárlás</h2>';
    
    if (selectedPlayer.hasCar) {
        html += `
            <div class="owned-asset" style="background: #eff6ff; border-color: #93c5fd;">
                <div class="asset-header">
                    <div class="asset-icon" style="background: #dbeafe;">🚗</div>
                    <div>
                        <div class="asset-title" style="color: #1e3a8a;">Volvo a tulajdonodban</div>
                        <div class="asset-subtitle" style="color: #1e40af;">Gratulálunk a vásárláshoz!</div>
                    </div>
                </div>
                ${selectedPlayer.loans.car.active ? `
                    <div class="loan-status">
                        <div class="loan-header">
                            <span class="loan-label">Autóhitel státusz</span>
                            <span class="loan-percent">${getProgressPercent(selectedPlayer.loans.car.remaining, settings.carInstallment - settings.carDown)}% fizetve</span>
                        </div>
                        <div class="loan-progress">
                            <div class="loan-progress-fill" style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);" style="width: ${getProgressPercent(selectedPlayer.loans.car.remaining, settings.carInstallment - settings.carDown)}%"></div>
                        </div>
                        <div class="loan-details">
                            <span class="loan-detail-label">Havi törlesztés: ${formatMoney(settings.carMonthly)}</span>
                            <span class="loan-detail-value">Hátra: ${formatMoney(selectedPlayer.loans.car.remaining)}</span>
                        </div>
                        <button class="btn-pay-loan" style="background: #3b82f6;" onclick="payCarLoan()">Törlesztés Fizetése</button>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        html += `
            <div class="purchase-grid">
                <div class="purchase-card">
                    <div class="purchase-label">EGYÖSSZEGBEN</div>
                    <div class="purchase-price">${formatMoney(settings.carCash)}</div>
                    <ul class="purchase-features">
                        <li>• Nincs kamat</li>
                        <li>• Azonnali tulajdon</li>
                        <li>• Egy tranzakció</li>
                    </ul>
                    <button class="btn-purchase" style="background: #3b82f6;" onclick="buyCarCash()">Vásárlás</button>
                </div>
                
                <div class="purchase-card" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #93c5fd;">
                    <div class="purchase-label" style="color: #1e40af;">RÉSZLETRE</div>
                    <div class="purchase-price">${formatMoney(settings.carInstallment)}</div>
                    <ul class="purchase-features">
                        <li>• Előleg: ${formatMoney(settings.carDown)}</li>
                        <li>• Havi: ${formatMoney(settings.carMonthly)}</li>
                        <li>• Törlesztéssel</li>
                    </ul>
                    <button class="btn-purchase" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);" onclick="buyCarInstallment()">Részletre Vásárlás</button>
                </div>
            </div>
            
            <div class="info-box amber">
                <div class="info-icon">💡</div>
                <div class="info-content">
                    <strong>Tanács:</strong> Ne felejtsd el a Casco biztosítást megkötni az autódra a védelem érdekében!
                </div>
            </div>
        `;
    }
    
    document.getElementById('viewVehicle').innerHTML = html;
}

// Insurance View
function renderInsuranceView() {
    const settings = gameSettings[currency];
    
    const insurances = [
        { type: 'childFuture', icon: '👶', title: 'Gyermekjövő Életbiztosítás', color: 'emerald' },
        { type: 'pension', icon: '👴', title: 'Nyugdíjbiztosítás', color: 'indigo' },
        { type: 'homeGuard', icon: '🏠', title: 'Házőrző Lakásbiztosítás', color: 'blue' },
        { type: 'casco', icon: '🚗', title: 'Casco Biztosítás', color: 'cyan' }
    ];
    
    let html = '<h2 class="mb-24" style="font-size: 24px; font-weight: 700; color: #111827;">Biztosítások</h2>';
    html += '<div class="insurance-grid">';
    
    insurances.forEach(ins => {
        const isActive = selectedPlayer.insurances[ins.type];
        const cost = settings.insurances[ins.type].cost;
        const canClaim = ins.type === 'childFuture' && isActive && !selectedPlayer.insurances.childFuturePaid;
        
        html += `
            <div class="insurance-card ${isActive ? 'active' : ''}">
                <div class="insurance-header">
                    <div class="insurance-icon">${ins.icon}</div>
                    ${isActive ? '<span class="insurance-badge">Aktív</span>' : ''}
                </div>
                <h3 class="insurance-title">${ins.title}</h3>
                <div class="insurance-price">${formatMoney(cost)}/év</div>
                <ul class="insurance-features">
                    ${ins.type === 'childFuture' ? `<li>• Egyszeri kifizetés: ${formatMoney(settings.insurances.childFuture.payout)}</li>` : ''}
                    <li>• ${ins.type === 'childFuture' ? 'Gyermek jövőjének biztosítása' : ins.type === 'pension' ? 'Nyugdíjas évek biztonsága' : ins.type === 'homeGuard' ? 'Lakás védelme' : 'Autó teljes védelme'}</li>
                    <li>• ${ins.type === 'childFuture' ? 'Pénzügyi védelem' : ins.type === 'pension' ? 'Hosszú távú megtakarítás' : ins.type === 'homeGuard' ? 'Nyugodt otthon' : 'Biztonságos vezetés'}</li>
                </ul>
                ${canClaim ? `
                    <button class="btn-insurance claim" onclick="claimChildFuture()">💰 Kifizetés Igénylése</button>
                ` : isActive && ins.type === 'childFuture' && selectedPlayer.insurances.childFuturePaid ? `
                    <div class="insurance-note">Kifizetés már megtörtént</div>
                ` : `
                    <button class="btn-insurance ${isActive ? '' : ''}" 
                            onclick="${isActive ? '' : `buyInsurance('${ins.type}', '${ins.title}')`}"
                            ${isActive ? 'disabled' : ''}>
                        ${isActive ? 'Megkötve ✓' : 'Biztosítás Megkötése'}
                    </button>
                `}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="info-box green">
            <div class="info-icon">🛡️</div>
            <div class="info-content">
                <strong>Biztosítási tanács:</strong> A biztosítások nem kötelezőek a nyeréshez, de biztonságot nyújtanak és a Gyermekjövő esetében jó megtérülést!
            </div>
        </div>
    `;
    
    document.getElementById('viewInsurance').innerHTML = html;
}

// History View
function renderHistoryView() {
    let html = '';
    
    if (transactions.length === 0) {
        html = `
            <div class="history-container">
                <div class="history-header">
                    <h2>Tranzakciós Előzmények</h2>
                </div>
                <div class="history-empty">
                    <div class="history-empty-icon">📊</div>
                    <div class="history-empty-text">Még nincsenek tranzakciók</div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="history-container">
                <div class="history-header">
                    <h2>Tranzakciós Előzmények</h2>
                </div>
                <div class="history-list">
                    ${transactions.map((t, idx) => `
                        <div class="history-item ${idx === 0 ? 'first' : ''}">
                            <div class="history-dot"></div>
                            <div class="history-info">
                                <div>
                                    <span class="history-player">${t.playerName}</span>
                                    <span class="history-desc">${t.description}</span>
                                </div>
                                <div class="history-time">${t.timestamp}</div>
                            </div>
                            <div class="history-amounts">
                                ${t.cashAmount !== 0 ? `<div class="history-amount cash-${t.cashAmount >= 0 ? 'positive' : 'negative'}">${t.cashAmount >= 0 ? '+' : ''}${formatMoneyShort(t.cashAmount)} 💵</div>` : ''}
                                ${t.accountAmount !== 0 ? `<div class="history-amount account-${t.accountAmount >= 0 ? 'positive' : 'negative'}">${t.accountAmount >= 0 ? '+' : ''}${formatMoneyShort(t.accountAmount)} 💳</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('viewHistory').innerHTML = html;
}

// Action Functions
function startPassThrough() {
    transaction(selectedPlayer.id, 0, gameSettings[currency].startPassThrough, 'START áthaladás');
}

function startLanding() {
    transaction(selectedPlayer.id, 0, gameSettings[currency].startLanding, 'START rálépés');
}

function accountInterest() {
    const interest = Math.floor(selectedPlayer.account * 0.07);
    transaction(selectedPlayer.id, 0, interest, '7% kamat');
}

function buyApartmentCash() {
    const cost = gameSettings[currency].apartmentCash;
    if (selectedPlayer.account < cost) {
        alert('Nincs elég pénz a folyószámlán!');
        return;
    }
    updatePlayerData(selectedPlayer.id, { 
        account: selectedPlayer.account - cost, 
        hasApartment: true 
    });
    transaction(selectedPlayer.id, 0, -cost, 'Lakás vásárlás (egyösszegben)');
}

function buyApartmentInstallment() {
    const down = gameSettings[currency].apartmentDown;
    if (selectedPlayer.account < down) {
        alert('Nincs elég pénz az előleghez!');
        return;
    }
    const remaining = gameSettings[currency].apartmentInstallment - down;
    updatePlayerData(selectedPlayer.id, { 
        account: selectedPlayer.account - down, 
        hasApartment: true,
        loans: {
            ...selectedPlayer.loans,
            apartment: { active: true, remaining }
        }
    });
    transaction(selectedPlayer.id, 0, -down, 'Lakás előleg (részletre)');
}

function payApartmentLoan() {
    const settings = gameSettings[currency];
    const payment = Math.min(settings.apartmentMonthly, selectedPlayer.loans.apartment.remaining);
    if (selectedPlayer.account < payment) {
        alert('Nincs elég pénz a törlesztéshez!');
        return;
    }
    const newRemaining = selectedPlayer.loans.apartment.remaining - payment;
    updatePlayerData(selectedPlayer.id, {
        account: selectedPlayer.account - payment,
        loans: {
            ...selectedPlayer.loans,
            apartment: { active: newRemaining > 0, remaining: newRemaining }
        }
    });
    transaction(selectedPlayer.id, 0, -payment, `Lakáshitel törlesztés${newRemaining > 0 ? '' : ' (KIFIZETVE!)'}`);
}

function buyCarCash() {
    const cost = gameSettings[currency].carCash;
    if (selectedPlayer.account < cost) {
        alert('Nincs elég pénz a folyószámlán!');
        return;
    }
    updatePlayerData(selectedPlayer.id, { 
        account: selectedPlayer.account - cost, 
        hasCar: true 
    });
    transaction(selectedPlayer.id, 0, -cost, 'Autó vásárlás (egyösszegben)');
}

function buyCarInstallment() {
    const down = gameSettings[currency].carDown;
    if (selectedPlayer.account < down) {
        alert('Nincs elég pénz az előleghez!');
        return;
    }
    const remaining = gameSettings[currency].carInstallment - down;
    updatePlayerData(selectedPlayer.id, { 
        account: selectedPlayer.account - down, 
        hasCar: true,
        loans: {
            ...selectedPlayer.loans,
            car: { active: true, remaining }
        }
    });
    transaction(selectedPlayer.id, 0, -down, 'Autó előleg (részletre)');
}

function payCarLoan() {
    const settings = gameSettings[currency];
    const payment = Math.min(settings.carMonthly, selectedPlayer.loans.car.remaining);
    if (selectedPlayer.account < payment) {
        alert('Nincs elég pénz a törlesztéshez!');
        return;
    }
    const newRemaining = selectedPlayer.loans.car.remaining - payment;
    updatePlayerData(selectedPlayer.id, {
        account: selectedPlayer.account - payment,
        loans: {
            ...selectedPlayer.loans,
            car: { active: newRemaining > 0, remaining: newRemaining }
        }
    });
    transaction(selectedPlayer.id, 0, -payment, `Autóhitel törlesztés${newRemaining > 0 ? '' : ' (KIFIZETVE!)'}`);
}

function buyInsurance(type, label) {
    const cost = gameSettings[currency].insurances[type].cost;
    if (selectedPlayer.account < cost) {
        alert('Nincs elég pénz a biztosításhoz!');
        return;
    }
    updatePlayerData(selectedPlayer.id, {
        account: selectedPlayer.account - cost,
        insurances: {
            ...selectedPlayer.insurances,
            [type]: true
        }
    });
    transaction(selectedPlayer.id, 0, -cost, `${label} megkötése`);
}

function claimChildFuture() {
    const payout = gameSettings[currency].insurances.childFuture.payout;
    updatePlayerData(selectedPlayer.id, {
        account: selectedPlayer.account + payout,
        insurances: {
            ...selectedPlayer.insurances,
            childFuturePaid: true
        }
    });
    transaction(selectedPlayer.id, 0, payout, 'Gyermekjövő kifizetés');
}

function toggleFurniture() {
    if (!selectedPlayer.hasApartment && !selectedPlayer.hasFurniture) {
        alert('Először vásárolj lakást!');
        return;
    }
    updatePlayerData(selectedPlayer.id, { 
        hasFurniture: !selectedPlayer.hasFurniture 
    });
    transaction(selectedPlayer.id, 0, 0, selectedPlayer.hasFurniture ? 'Bútorok eladva' : 'Bútorok vásárolva');
}

function withdrawMoney() {
    const amount = parseFloat(prompt('Mennyi pénzt veszel fel?', '0'));
    if (!amount || amount <= 0) return;
    if (selectedPlayer.account < amount) {
        alert('Nincs elég pénz a folyószámlán!');
        return;
    }
    transaction(selectedPlayer.id, amount, -amount, 'Pénzfelvétel');
}

function depositMoney() {
    const amount = parseFloat(prompt('Mennyi pénzt fizetsz be?', '0'));
    if (!amount || amount <= 0) return;
    if (selectedPlayer.cash < amount) {
        alert('Nincs elég készpénz!');
        return;
    }
    transaction(selectedPlayer.id, -amount, amount, 'Pénzbefizetés');
}

function customTransaction(type) {
    const amount = parseFloat(document.getElementById('customAmount').value);
    const desc = document.getElementById('customDesc').value || 'Egyedi tranzakció';
    
    if (!amount || amount === 0) return;
    
    if (type === 'cash') {
        transaction(selectedPlayer.id, amount, 0, desc + ' (készpénz)');
    } else {
        transaction(selectedPlayer.id, 0, amount, desc + ' (folyószámla)');
    }
    
    document.getElementById('customAmount').value = '';
    document.getElementById('customDesc').value = '';
}

// Helper Functions
function formatMoney(value) {
    const formatted = new Intl.NumberFormat('hu-HU').format(Math.abs(value));
    const symbol = gameSettings[currency].symbol;
    const sign = value < 0 ? '-' : '';
    return `${sign}${formatted} ${symbol}`;
}

function formatMoneyShort(value) {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (currency === 'HUF') {
        if (absValue >= 1000000) {
            return `${sign}${(absValue / 1000000).toFixed(1)}M Ft`;
        }
        if (absValue >= 1000) {
            return `${sign}${Math.floor(absValue / 1000)}k Ft`;
        }
        return `${sign}${absValue} Ft`;
    } else {
        if (absValue >= 1000) {
            return `${sign}${(absValue / 1000).toFixed(1)}k €`;
        }
        return `${sign}${absValue} €`;
    }
}

function getProgressPercent(remaining, total) {
    if (!remaining || remaining <= 0) return 100;
    return Math.round(((total - remaining) / total) * 100);
}

function getWealthGoalPercent(player) {
    let completed = 0;
    const total = 5;
    
    if (player.hasApartment) completed++;
    if (player.hasCar) completed++;
    if (player.hasFurniture) completed++;
    if (!player.loans.apartment.active && player.hasApartment) completed++;
    if (!player.loans.car.active && player.hasCar) completed++;
    
    return Math.round((completed / total) * 100);
}

function getAssetsCount(player) {
    let count = 0;
    if (player.hasApartment) count++;
    if (player.hasCar) count++;
    if (player.hasFurniture) count++;
    if (player.insurances.childFuture) count++;
    if (player.insurances.pension) count++;
    if (player.insurances.homeGuard) count++;
    if (player.insurances.casco) count++;
    return count;
}

function getActiveLoansCount(player) {
    let count = 0;
    if (player.loans.apartment.active) count++;
    if (player.loans.car.active) count++;
    return count;
}

function checkWinCondition(player) {
    const totalMoney = player.cash + player.account;
    return player.hasApartment && 
           player.hasCar && 
           player.hasFurniture &&
           !player.loans.apartment.active &&
           !player.loans.car.active &&
           totalMoney >= gameSettings[currency].winConditionExtra;
}

// Modal functions
function showAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'flex';
    document.getElementById('modalPlayerName').value = '';
    selectedAvatar = 'green'; // Reset alapértelmezett
    updateAvatarSelection();
    document.getElementById('modalPlayerName').focus();
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

function selectAvatar(color) {
    selectedAvatar = color;
    updateAvatarSelection();
}

function updateAvatarSelection() {
    // Töröljük az összes kiválasztást
    document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.style.border = '3px solid #d1d5db';
        btn.style.transform = 'scale(1)';
    });
    
    // Kiválasztott avatar kiemelése
    const selectedBtn = document.getElementById(`avatar-${selectedAvatar}`);
    if (selectedBtn) {
        selectedBtn.style.border = '3px solid #10b981';
        selectedBtn.style.transform = 'scale(1.1)';
        selectedBtn.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.2)';
    }
}

async function addPlayerFromModal() {
    const nameInput = document.getElementById('modalPlayerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Add meg a játékos nevét!');
        return;
    }
    
    try {
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, currency, avatar: selectedAvatar })
        });
        
        if (response.ok) {
            nameInput.value = '';
            closeAddPlayerModal();
            await loadPlayers();
            
            // Automatikusan kiválasztja az új játékost
            const data = await response.json();
            if (data.id) {
                setTimeout(() => {
                    selectPlayer(data.id);
                }, 100);
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Hiba történt a játékos hozzáadásakor!');
        }
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Hiba történt a játékos hozzáadásakor!');
    }
}

async function deletePlayer(playerId, playerName) {
    if (!confirm(`Biztosan törölni szeretnéd ${playerName} játékost?\n\nEz a művelet nem vonható vissza!`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Ha a törölt játékos volt kiválasztva, töröljük a kiválasztást
            if (selectedPlayer?.id === playerId) {
                selectedPlayer = null;
            }
            await loadPlayers();
        } else {
            const error = await response.json();
            alert(error.error || 'Hiba történt a játékos törlésekor!');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Hiba történt a játékos törlésekor!');
    }
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddPlayerModal();
    }
});

// Reset game function
async function resetGame() {
    if (!confirm('⚠️ FIGYELEM!\n\nBiztosan törölni szeretnéd az ÖSSZES játékos adatot és új játékot kezdeni?\n\nEz a művelet NEM vonható vissza!\n\nMinden játékos, tranzakció és beállítás törlődik.')) {
        return;
    }
    
    // Dupla megerősítés
    if (!confirm('Utoljára kérdezem: TÉNYLEG törölsz mindent? 🗑️')) {
        return;
    }
    
    try {
        const response = await fetch('/api/reset', {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('✅ Új játék indult!\n\nMinden adat törölve.');
            // Oldal újratöltése
            window.location.reload();
        } else {
            alert('❌ Hiba történt a játék újraindításakor!');
        }
    } catch (error) {
        console.error('Error resetting game:', error);
        alert('❌ Hiba történt a játék újraindításakor!');
    }
}
