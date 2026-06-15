import { SpaceGame } from './game/SpaceGame.js';

class App {
  constructor() {
    this.user = null;
    this.authMode = 'login';
    this.game = null;
    this.toastTimer = null;
    this.bindEvents();
    this.restoreSession();
  }

  bindEvents() {
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.addEventListener('click', () => this.setAuthMode(button.dataset.authMode));
    });
    document.querySelector('#auth-form').addEventListener('submit', (event) => this.authenticate(event));
    document.querySelector('#logout-button').addEventListener('click', () => this.logout());
    document.querySelector('#play-button').addEventListener('click', () => this.startGame());
    document.querySelector('#leave-game').addEventListener('click', () => this.leaveGame());
    document.querySelector('#settings-form').addEventListener('submit', (event) => this.saveSettings(event));
    document.querySelector('#volume').addEventListener('input', (event) => {
      document.querySelector('#volume-value').textContent = `${event.target.value}%`;
    });
    document.querySelectorAll('[data-panel]').forEach((button) => {
      button.addEventListener('click', () => this.showPanel(button.dataset.panel));
    });
  }

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
    return data;
  }

  async restoreSession() {
    try {
      const data = await this.request('/api/me');
      this.user = data.user;
      this.renderMenu();
    } catch {
      this.showScreen('auth');
    }
  }

  setAuthMode(mode) {
    this.authMode = mode;
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.authMode === mode);
    });
    document.querySelector('#auth-title').textContent = mode === 'login'
      ? 'С возвращением, пилот'
      : 'Создание профиля пилота';
    document.querySelector('#auth-subtitle').textContent = mode === 'login'
      ? 'Введите данные своего аккаунта'
      : 'Позывной будет виден другим игрокам';
    document.querySelector('#auth-submit').innerHTML = mode === 'login'
      ? 'ВОЙТИ В СИСТЕМУ <span>→</span>'
      : 'СОЗДАТЬ АККАУНТ <span>→</span>';
    document.querySelector('#password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    document.querySelector('#auth-error').textContent = '';
  }

  async authenticate(event) {
    event.preventDefault();
    const errorNode = document.querySelector('#auth-error');
    const button = document.querySelector('#auth-submit');
    errorNode.textContent = '';
    button.disabled = true;

    try {
      const data = await this.request(`/api/auth/${this.authMode}`, {
        method: 'POST',
        body: JSON.stringify({
          username: document.querySelector('#username').value,
          password: document.querySelector('#password').value,
        }),
      });
      this.user = data.user;
      this.renderMenu();
    } catch (error) {
      errorNode.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  renderMenu() {
    const { upgrades, settings } = this.user;
    document.documentElement.style.setProperty('--cyan', settings.color);
    document.querySelector('#pilot-name').textContent = this.user.username;
    document.querySelector('#pilot-level').textContent = this.user.level;
    document.querySelector('#pilot-credits').textContent = this.user.credits.toLocaleString('ru-RU');
    document.querySelector('#ship-color').value = settings.color;
    document.querySelector('#volume').value = settings.volume;
    document.querySelector('#volume-value').textContent = `${settings.volume}%`;
    document.querySelector('#stat-hull').textContent = 100 + (upgrades.hull - 1) * 20;
    document.querySelector('#stat-engine').textContent = 16 + upgrades.engine * 2;
    document.querySelector('#stat-weapon').textContent = 12 + upgrades.weapon * 4;
    this.renderUpgrades();
    this.showScreen('menu');
  }

  renderUpgrades() {
    const definitions = {
      hull: ['◇', 'Усиленный корпус', 'Увеличивает максимальный запас прочности'],
      engine: ['»', 'Импульсный двигатель', 'Повышает скорость и мощность ускорения'],
      weapon: ['✦', 'Плазменные орудия', 'Увеличивает урон основного вооружения'],
    };
    const list = document.querySelector('#upgrade-list');
    list.innerHTML = '';

    for (const [type, [icon, title, description]] of Object.entries(definitions)) {
      const level = this.user.upgrades[type];
      const cost = 350 * level;
      const card = document.createElement('article');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-icon">${icon}</div>
        <div><h3>${title} // ${level} ур.</h3><p>${description}</p></div>
        <button ${level >= 5 ? 'disabled' : ''}>${level >= 5 ? 'MAX' : `◆ ${cost}`}</button>
      `;
      card.querySelector('button').addEventListener('click', () => this.buyUpgrade(type));
      list.append(card);
    }
  }

  async buyUpgrade(type) {
    try {
      const data = await this.request('/api/upgrade', {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      this.user = data.user;
      this.renderMenu();
      this.showPanel('upgrades');
      this.showToast('Модуль успешно улучшен');
    } catch (error) {
      this.showToast(error.message);
    }
  }

  async saveSettings(event) {
    event.preventDefault();
    try {
      const data = await this.request('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          color: document.querySelector('#ship-color').value,
          volume: Number(document.querySelector('#volume').value),
        }),
      });
      this.user = data.user;
      this.renderMenu();
      this.showPanel('settings');
      this.showToast('Настройки сохранены');
    } catch (error) {
      this.showToast(error.message);
    }
  }

  showPanel(name) {
    document.querySelectorAll('.menu-panel').forEach((panel) => panel.classList.add('hidden'));
    document.querySelector(`#${name}-panel`).classList.remove('hidden');
    document.querySelectorAll('[data-panel]').forEach((button) => {
      button.classList.toggle('active', button.dataset.panel === name);
    });
  }

  startGame() {
    this.showScreen('game');
    this.game = new SpaceGame({
      container: document.querySelector('#game-canvas'),
      user: this.user,
      onHealth: (value, max) => {
        const percent = Math.round((value / max) * 100);
        document.querySelector('#health-value').textContent = percent;
        document.querySelector('#health-bar').style.width = `${percent}%`;
      },
      onConnection: (connected) => {
        document.querySelector('#connection-state').innerHTML = connected
          ? '<i></i> СЕКТОР СИНХРОНИЗИРОВАН'
          : '<i></i> ПОДКЛЮЧЕНИЕ';
      },
    });
  }

  leaveGame() {
    this.game?.destroy();
    this.game = null;
    this.renderMenu();
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.user = null;
    document.querySelector('#auth-form').reset();
    this.showScreen('auth');
  }

  showScreen(name) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.add('hidden'));
    document.querySelector(`#${name}-screen`).classList.remove('hidden');
    document.body.style.overflow = name === 'game' ? 'hidden' : '';
  }

  showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
}

new App();
