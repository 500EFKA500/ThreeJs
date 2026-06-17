import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';

const PROJECTILE_RENDER_SPEED = 190;

export class SpaceGame {
  constructor({ container, user, onHealth, onConnection, onDeath, onSpawnCooldown }) {
    this.container = container;
    this.user = user;
    this.onHealth = onHealth;
    this.onConnection = onConnection;
    this.onDeath = onDeath;
    this.onSpawnCooldown = onSpawnCooldown;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.players = new Map();
    this.asteroids = new Map();
    this.projectiles = [];
    this.latestPlayers = [];
    this.latestAsteroids = [];
    this.keys = new Set();
    this.selfId = null;
    this.shipTemplate = null;
    this.running = true;
    this.lastInputSent = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.pointerLocked = false;
    this.forward = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.desiredCameraPosition = new THREE.Vector3();
    this.rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotationQuaternion = new THREE.Quaternion();
    this.screenPosition = new THREE.Vector3();
    this.radarElement = document.querySelector('.radar');
    this.radarLayer = null;
    this.init();
  }

  async init() {
    this.createRenderer();
    this.createWorld();
    this.bindControls();
    await this.loadShip();
    if (!this.running) return;
    this.connect();
    this.animate();
  }

  createRenderer() {
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 700);
    this.camera.position.set(0, 7, 22);
    this.camera.lookAt(0, 0, -22);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.replaceChildren(this.renderer.domElement);
    this.createOverlay();
    this.renderer.domElement.requestPointerLock();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ship-label-layer';
    document.querySelector('#game-screen').append(this.overlay);

    if (this.radarElement) {
      this.radarLayer = document.createElement('div');
      this.radarLayer.className = 'radar-layer';
      this.radarElement.append(this.radarLayer);
    }
  }

  createWorld() {
    this.scene.background = new THREE.Color(0x01030a);
    this.scene.fog = new THREE.FogExp2(0x020611, 0.006);
    this.scene.add(new THREE.HemisphereLight(0x6faeff, 0x05020d, 1.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(8, 12, 14);
    this.scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x16cfff, 45, 100);
    rimLight.position.set(-20, 4, -35);
    this.scene.add(rimLight);

    const stars = [];
    for (let i = 0; i < 6000; i++) {
      stars.push(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 260,
        (Math.random() - 0.5) * 600,
      );
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    this.starField = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xc9e9ff, size: 0.42, transparent: true, opacity: 0.85 }),
    );
    this.scene.add(this.starField);

    const nebula = new THREE.Mesh(
      new THREE.SphereGeometry(270, 32, 20),
      new THREE.MeshBasicMaterial({
        color: 0x11234b,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.18,
      }),
    );
    this.scene.add(nebula);
  }

  loadShip() {
    return new Promise((resolve) => {
      new GLTFLoader().load('/models/scout.glb', (gltf) => {
        this.shipTemplate = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(this.shipTemplate);
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 3.8 / Math.max(size.x, size.y, size.z, 1);
        this.shipTemplate.scale.setScalar(scale);
        this.shipTemplate.rotation.y = Math.PI / 2;
        this.shipTemplate.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.material = child.material.clone();
            child.material.metalness = Math.max(child.material.metalness ?? 0, 0.35);
            child.material.roughness = Math.min(child.material.roughness ?? 1, 0.7);
          }
        });
        resolve();
      }, undefined, () => {
        this.shipTemplate = this.createFallbackShip();
        resolve();
      });
    });
  }

  createFallbackShip() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(1.25, 4.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x91d9ed, metalness: 0.8, roughness: 0.3 }),
    );
    body.rotation.x = -Math.PI / 2;
    group.add(body);
    return group;
  }

  connect() {
    this.socket = io({ transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => {
      this.onConnection(true);
      this.socket.emit('game:join');
    });
    this.socket.on('disconnect', () => this.onConnection(false));
    this.socket.on('game:init', (state) => {
      this.selfId = state.selfId;
      this.latestPlayers = state.players;
      this.latestAsteroids = state.asteroids;
      state.players.forEach((player) => this.upsertPlayer(player, true));
      state.asteroids.forEach((asteroid) => this.upsertAsteroid(asteroid, true));
    });
    this.socket.on('game:spawn-cooldown', (event) => this.onSpawnCooldown?.(event));
    this.socket.on('game:death', (event) => this.onDeath?.(event));
    this.socket.on('player:joined', (player) => this.upsertPlayer(player, true));
    this.socket.on('player:left', (id) => this.removePlayer(id));
    this.socket.on('game:snapshot', (state) => {
      this.latestPlayers = state.players;
      this.latestAsteroids = state.asteroids;
      state.players.forEach((player) => this.upsertPlayer(player));
      state.asteroids.forEach((asteroid) => this.upsertAsteroid(asteroid));
    });
    this.socket.on('weapon:fired', (shot) => this.spawnProjectile(shot));
    this.socket.on('combat:hit', (hit) => this.onHit(hit));
    this.socket.on('combat:asteroid-hit', (hit) => this.onAsteroidHit(hit));
    this.socket.on('combat:destroyed', (event) => this.addFeed(`${event.attackerName} уничтожил ${event.targetName}`));
  }

  createPlayerObject(player) {
    const group = new THREE.Group();
    const ship = this.shipTemplate.clone(true);
    group.add(ship);

    const engine = new THREE.PointLight(player.color, 12, 18);
    engine.position.set(0, 0, 2.2);
    group.add(engine);

    group.userData.targetPosition = new THREE.Vector3(player.x, player.y, player.z);
    group.userData.engine = engine;
    group.userData.label = this.createShipLabel(player);
    this.scene.add(group);
    return group;
  }

  createShipLabel(player) {
    const label = document.createElement('div');
    label.className = 'ship-label';
    label.innerHTML = `
      <strong></strong>
      <span class="ship-label-hp"><i></i></span>
    `;
    label.querySelector('strong').textContent = player.name;
    this.overlay.append(label);
    return label;
  }

  upsertPlayer(player, immediate = false) {
    let object = this.players.get(player.id);
    if (!object) {
      object = this.createPlayerObject(player);
      this.players.set(player.id, object);
    }
    object.userData.targetPosition.set(player.x, player.y, player.z);
    object.userData.targetYaw = player.yaw;
    object.userData.targetPitch = player.pitch;
    object.userData.player = player;
    object.userData.maxHp = player.maxHp || 100;
    if (object.userData.engine) object.userData.engine.color.set(player.color);
    this.updateShipLabel(object, player);
    if (immediate) object.position.copy(object.userData.targetPosition);
    if (player.id === this.selfId) {
      this.onHealth(player.hp, player.maxHp || 100);
    }
  }

  updateShipLabel(object, player) {
    const label = object.userData.label;
    if (!label) return;
    const percent = Math.max(0, Math.min(100, (player.hp / (player.maxHp || 100)) * 100));
    label.querySelector('strong').textContent = player.name;
    label.querySelector('i').style.width = `${percent}%`;
    label.classList.toggle('is-self', player.id === this.selfId);
  }

  removePlayer(id) {
    const object = this.players.get(id);
    if (object) {
      object.userData.label?.remove();
      this.scene.remove(object);
    }
    this.players.delete(id);
  }

  createAsteroidObject(asteroid) {
    const geometry = new THREE.IcosahedronGeometry(asteroid.size, 1);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      const scale = 0.82 + Math.random() * 0.34;
      positions.setXYZ(index, positions.getX(index) * scale, positions.getY(index) * scale, positions.getZ(index) * scale);
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x554f52, roughness: 0.92, metalness: 0.08, flatShading: true }),
    );
    mesh.userData.targetPosition = new THREE.Vector3(asteroid.x, asteroid.y, asteroid.z);
    mesh.userData.spin = asteroid.spin;
    this.scene.add(mesh);
    return mesh;
  }

  upsertAsteroid(asteroid, immediate = false) {
    let object = this.asteroids.get(asteroid.id);
    if (!object) {
      object = this.createAsteroidObject(asteroid);
      this.asteroids.set(asteroid.id, object);
      immediate = true;
    }
    object.userData.targetPosition.set(asteroid.x, asteroid.y, asteroid.z);
    object.userData.spin = asteroid.spin;
    if (immediate || object.position.z > object.userData.targetPosition.z + 80) {
      object.position.copy(object.userData.targetPosition);
    }
  }

  spawnProjectile(shot) {
    const projectile = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, 1.4, 3, 6),
      new THREE.MeshBasicMaterial({ color: shot.color }),
    );
    projectile.rotation.x = Math.PI / 2;
    projectile.position.set(shot.x, shot.y, shot.z);
    projectile.userData.serverId = shot.id;
    projectile.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(shot.direction.x, shot.direction.y, shot.direction.z).normalize(),
    );
    projectile.userData.velocity = new THREE.Vector3(
      shot.direction.x,
      shot.direction.y,
      shot.direction.z,
    ).multiplyScalar(PROJECTILE_RENDER_SPEED);
    projectile.userData.life = 2;
    this.projectiles.push(projectile);
    this.scene.add(projectile);
  }

  onHit(hit) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      if (projectile.userData.serverId !== hit.projectileId) continue;
      this.scene.remove(projectile);
      projectile.geometry.dispose();
      projectile.material.dispose();
      this.projectiles.splice(index, 1);
      break;
    }
    this.addFeed(`${hit.attackerName} попал в ${hit.targetName}: -${hit.damage}`);
  }

  onAsteroidHit(hit) {
    this.addFeed(`${hit.targetName} столкнулся с астероидом: -${hit.damage}`);
  }

  addFeed(message) {
    const feed = document.querySelector('#kill-feed');
    if (!feed) return;
    const item = document.createElement('div');
    item.textContent = message;
    feed.prepend(item);
    setTimeout(() => item.remove(), 3500);
    while (feed.children.length > 4) feed.lastElementChild.remove();
  }

  bindControls() {
    this.onKeyDown = (event) => {
      if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && !event.repeat) {
        event.preventDefault();
        this.togglePointerLock();
        return;
      }
      this.keys.add(event.code);
      if (event.code === 'Space' && this.pointerLocked) {
        event.preventDefault();
        this.socket?.emit('player:shoot');
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onMouseMove = (event) => {
      if (!this.pointerLocked) return;
      this.yaw -= event.movementX * 0.0022;
      this.pitch -= event.movementY * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI * 0.48, Math.PI * 0.48);
    };
    this.onMouseDown = (event) => {
      if (event.button === 0 && this.pointerLocked) this.socket?.emit('player:shoot');
    };
    this.onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
      document.querySelector('#game-screen').classList.toggle('cursor-mode', !this.pointerLocked);
      document.querySelector('#flight-mode').textContent = this.pointerLocked
        ? 'РЕЖИМ ПОЛЁТА · SHIFT — ОСВОБОДИТЬ КУРСОР'
        : 'РЕЖИМ ИНТЕРФЕЙСА · SHIFT — ВЕРНУТЬСЯ К ПОЛЁТУ';
      if (!this.pointerLocked) this.keys.clear();
    };
    this.onCanvasClick = () => {
      if (!this.pointerLocked) this.renderer.domElement.requestPointerLock();
    };
    this.onResize = () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener('keydown', this.onKeyDown);
    addEventListener('keyup', this.onKeyUp);
    addEventListener('mousemove', this.onMouseMove);
    addEventListener('mousedown', this.onMouseDown);
    addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.renderer.domElement.addEventListener('click', this.onCanvasClick);
  }

  togglePointerLock() {
    if (this.pointerLocked) {
      document.exitPointerLock();
    } else {
      this.renderer.domElement.requestPointerLock();
    }
  }

  sendInput(time) {
    if (!this.socket?.connected || time - this.lastInputSent < 40) return;
    this.lastInputSent = time;
    this.socket.emit('player:input', {
      forward: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')),
      strafe: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')),
      vertical: Number(this.keys.has('KeyR')) - Number(this.keys.has('KeyF')),
    });
    this.socket.emit('player:aim', {
      yaw: this.yaw,
      pitch: this.pitch,
    });
  }

  animate = (time = 0) => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.sendInput(time);

    for (const [id, object] of this.players) {
      object.position.lerp(object.userData.targetPosition, 1 - Math.exp(-12 * delta));
      this.rotationEuler.set(
        object.userData.targetPitch ?? 0,
        object.userData.targetYaw ?? 0,
        0,
        'YXZ',
      );
      this.rotationQuaternion.setFromEuler(this.rotationEuler);
      object.quaternion.slerp(this.rotationQuaternion, 1 - Math.exp(-10 * delta));

      if (id === this.selfId) {
        this.forward.set(
          -Math.sin(this.yaw) * Math.cos(this.pitch),
          Math.sin(this.pitch),
          -Math.cos(this.yaw) * Math.cos(this.pitch),
        ).normalize();
        this.desiredCameraPosition.copy(object.position)
          .addScaledVector(this.forward, -11)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 3.8);
        this.camera.position.lerp(this.desiredCameraPosition, 1 - Math.exp(-8 * delta));
        this.cameraTarget.copy(object.position).addScaledVector(this.forward, 14);
        this.camera.lookAt(this.cameraTarget);
        this.starField.position.copy(this.camera.position);
      }
    }

    this.updateShipLabels();
    this.updateRadar();

    for (const object of this.asteroids.values()) {
      object.position.lerp(object.userData.targetPosition, 1 - Math.exp(-9 * delta));
      object.rotation.x += object.userData.spin * delta;
      object.rotation.y += object.userData.spin * 0.7 * delta;
    }

    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      projectile.position.addScaledVector(projectile.userData.velocity, delta);
      projectile.userData.life -= delta;
      if (projectile.userData.life <= 0) {
        this.scene.remove(projectile);
        projectile.geometry.dispose();
        projectile.material.dispose();
        this.projectiles.splice(index, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  updateShipLabels() {
    for (const [id, object] of this.players) {
      const label = object.userData.label;
      if (!label) continue;
      if (id === this.selfId) {
        label.style.opacity = '0';
        continue;
      }

      this.screenPosition.copy(object.position).add(new THREE.Vector3(0, 3.4, 0));
      this.screenPosition.project(this.camera);
      const visible = this.screenPosition.z < 1;
      const x = (this.screenPosition.x * 0.5 + 0.5) * innerWidth;
      const y = (-this.screenPosition.y * 0.5 + 0.5) * innerHeight;

      label.style.opacity = visible ? '1' : '0';
      label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
    }
  }

  updateRadar() {
    if (!this.radarLayer || !this.selfId) return;
    const self = this.latestPlayers.find((player) => player.id === this.selfId);
    if (!self) return;

    this.radarLayer.replaceChildren();
    const range = 170;
    const radius = 68;

    for (const player of this.latestPlayers) {
      if (player.id === this.selfId) continue;
      this.addRadarBlip(player.x - self.x, player.z - self.z, radius, range, 'player', player.color);
    }

    for (const asteroid of this.latestAsteroids.slice(0, 28)) {
      this.addRadarBlip(asteroid.x - self.x, asteroid.z - self.z, radius, range, 'asteroid');
    }
  }

  addRadarBlip(dx, dz, radius, range, type, color = '#69e7ff') {
    const distance = Math.hypot(dx, dz);
    if (distance > range) return;
    const blip = document.createElement('span');
    blip.className = `radar-blip ${type}`;
    blip.style.left = `${50 + (dx / range) * 47}%`;
    blip.style.top = `${50 + (dz / range) * 47}%`;
    if (type === 'player') {
      blip.style.background = color;
      blip.style.boxShadow = `0 0 8px ${color}`;
    }
    this.radarLayer.append(blip);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.socket?.disconnect();
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
    removeEventListener('mousemove', this.onMouseMove);
    removeEventListener('mousedown', this.onMouseDown);
    removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.renderer?.domElement.removeEventListener('click', this.onCanvasClick);
    if (document.pointerLockElement === this.renderer?.domElement) document.exitPointerLock();
    this.overlay?.remove();
    this.radarLayer?.remove();
    this.renderer?.dispose();
    this.container.replaceChildren();
  }
}
