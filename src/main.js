import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SpaceGame } from './game/SpaceGame.js';

class App {
  constructor() {
    this.user = null;
    this.authMode = 'login';
    this.game = null;
    this.hangarPreview = null;
    this.toastTimer = null;
    this.respawnUntil = 0;
    this.respawnTimer = null;
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
    document.querySelector('#ship-color').addEventListener('input', (event) => {
      this.applyThemeColor(event.target.value);
    });
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
    this.applyThemeColor(settings.color);
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
    this.updatePlayButton();
    this.showScreen('menu');
    this.initHangarPreview();
  }

  initHangarPreview() {
    if (this.hangarPreview) return;
    const container = document.querySelector('#hangar-ship-preview-canvas');
    if (!container) return;
    this.hangarPreview = new HangarShipPreview(container);
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

  applyThemeColor(color) {
    document.documentElement.style.setProperty('--cyan', color);
    document.documentElement.style.setProperty('--cyan-strong', color);
  }

  showPanel(name) {
    document.querySelectorAll('.menu-panel').forEach((panel) => panel.classList.add('hidden'));
    document.querySelector(`#${name}-panel`).classList.remove('hidden');
    document.querySelectorAll('[data-panel]').forEach((button) => {
      button.classList.toggle('active', button.dataset.panel === name);
    });
  }

  startGame() {
    const cooldownMs = this.getRespawnCooldownMs();
    if (cooldownMs > 0) {
      this.showToast(`Повторный запуск через ${Math.ceil(cooldownMs / 1000)} сек.`);
      this.updatePlayButton();
      return;
    }
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
      onDeath: (event) => this.handleDeath(event),
      onSpawnCooldown: (event) => this.handleSpawnCooldown(event),
    });
  }

  leaveGame() {
    this.game?.destroy();
    this.game = null;
    this.renderMenu();
  }

  handleDeath(event) {
    this.game?.destroy();
    this.game = null;
    this.respawnUntil = event.respawnAt || Date.now() + (event.cooldownMs ?? 20000);
    this.renderMenu();
    this.startRespawnTimer();
    this.showToast(`${event.message || 'Корабль уничтожен'}. Возвращение через 20 сек.`);
  }

  handleSpawnCooldown(event) {
    this.game?.destroy();
    this.game = null;
    this.respawnUntil = event.respawnAt || Date.now() + (event.cooldownMs ?? 20000);
    this.renderMenu();
    this.startRespawnTimer();
    this.showToast(`Корабль готовится к запуску: ${Math.ceil(this.getRespawnCooldownMs() / 1000)} сек.`);
  }

  getRespawnCooldownMs() {
    return Math.max(0, this.respawnUntil - Date.now());
  }

  startRespawnTimer() {
    clearInterval(this.respawnTimer);
    this.updatePlayButton();
    this.respawnTimer = setInterval(() => {
      this.updatePlayButton();
      if (this.getRespawnCooldownMs() <= 0) {
        clearInterval(this.respawnTimer);
        this.respawnTimer = null;
        this.showToast('Корабль снова готов к запуску');
      }
    }, 250);
  }

  updatePlayButton() {
    const button = document.querySelector('#play-button');
    const cooldownMs = this.getRespawnCooldownMs();
    if (cooldownMs > 0) {
      button.disabled = true;
      button.classList.add('is-cooling-down');
      button.innerHTML = `РЕСПАВН ЧЕРЕЗ ${Math.ceil(cooldownMs / 1000)} СЕК <span>⌛</span>`;
      return;
    }
    button.disabled = false;
    button.classList.remove('is-cooling-down');
    button.innerHTML = 'ЗАПУСТИТЬ МИССИЮ <span>→</span>';
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

class HangarShipPreview {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.model = null;
    this.frame = null;
    this.init();
  }

  init() {
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 1.4, 9);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.replaceChildren(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0x8fdcff, 0x050712, 1.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 7, 6);
    this.scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x69e7ff, 28, 18);
    rimLight.position.set(-4, 2, 3);
    this.scene.add(rimLight);

    new GLTFLoader().load('/models/scout.glb', (gltf) => {
      this.model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(this.model);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 4.6 / Math.max(size.x, size.y, size.z, 1);
      this.model.scale.setScalar(scale);
      this.model.rotation.set(0.18, Math.PI / 2, -0.1);
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.metalness = Math.max(child.material.metalness ?? 0, 0.35);
          child.material.roughness = Math.min(child.material.roughness ?? 1, 0.68);
        }
      });
      this.scene.add(this.model);
    });

    this.resize();
    addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();
    if (this.model) {
      this.model.rotation.y = Math.PI / 2 + Math.sin(elapsed * 0.8) * 0.24;
      this.model.rotation.z = -0.1 + Math.sin(elapsed * 0.55) * 0.06;
      this.model.position.y = Math.sin(elapsed * 1.2) * 0.12;
    }
    this.renderer.render(this.scene, this.camera);
  };
}

new App();
