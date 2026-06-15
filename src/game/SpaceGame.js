import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';

export class SpaceGame {
  constructor({ container, user, onHealth, onConnection }) {
    this.container = container;
    this.user = user;
    this.onHealth = onHealth;
    this.onConnection = onConnection;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.players = new Map();
    this.asteroids = new Map();
    this.projectiles = [];
    this.keys = new Set();
    this.selfId = null;
    this.shipTemplate = null;
    this.running = true;
    this.lastInputSent = 0;
    this.mouse = { x: 0, y: 0 };
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
        -Math.random() * 600,
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
        this.shipTemplate.rotation.y = Math.PI;
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
      state.players.forEach((player) => this.upsertPlayer(player, true));
      state.asteroids.forEach((asteroid) => this.upsertAsteroid(asteroid, true));
    });
    this.socket.on('player:joined', (player) => this.upsertPlayer(player, true));
    this.socket.on('player:left', (id) => this.removePlayer(id));
    this.socket.on('game:snapshot', (state) => {
      state.players.forEach((player) => this.upsertPlayer(player));
      state.asteroids.forEach((asteroid) => this.upsertAsteroid(asteroid));
    });
    this.socket.on('weapon:fired', (shot) => this.spawnProjectile(shot));
  }

  createPlayerObject(player) {
    const group = new THREE.Group();
    const ship = this.shipTemplate.clone(true);
    group.add(ship);

    const engine = new THREE.PointLight(player.color, 12, 18);
    engine.position.set(0, 0, 2.2);
    group.add(engine);

    const glow = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 2.5, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: player.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.z = 2.7;
    group.add(glow);

    group.userData.targetPosition = new THREE.Vector3(player.x, player.y, player.z);
    this.scene.add(group);
    return group;
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
    if (immediate) object.position.copy(object.userData.targetPosition);
    if (player.id === this.selfId) {
      const maxHp = 100 + (this.user.upgrades.hull - 1) * 20;
      this.onHealth(player.hp, maxHp);
    }
  }

  removePlayer(id) {
    const object = this.players.get(id);
    if (object) this.scene.remove(object);
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
    projectile.userData.velocity = new THREE.Vector3(
      Math.sin(shot.yaw) * 22,
      -Math.sin(shot.pitch) * 18,
      -90,
    );
    projectile.userData.life = 2;
    this.projectiles.push(projectile);
    this.scene.add(projectile);
  }

  bindControls() {
    this.onKeyDown = (event) => {
      this.keys.add(event.code);
      if (event.code === 'Space') {
        event.preventDefault();
        this.socket?.emit('player:shoot');
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onMouseMove = (event) => {
      this.mouse.x = (event.clientX / innerWidth) * 2 - 1;
      this.mouse.y = (event.clientY / innerHeight) * 2 - 1;
    };
    this.onMouseDown = (event) => {
      if (event.button === 0) this.socket?.emit('player:shoot');
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
  }

  sendInput(time) {
    if (!this.socket?.connected || time - this.lastInputSent < 40) return;
    this.lastInputSent = time;
    this.socket.emit('player:input', {
      x: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')),
      y: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')),
      boost: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
    });
    this.socket.emit('player:aim', {
      yaw: -this.mouse.x * 0.45,
      pitch: this.mouse.y * 0.25,
    });
  }

  animate = (time = 0) => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.sendInput(time);

    this.starField.position.z += delta * 8;
    if (this.starField.position.z > 200) this.starField.position.z = 0;

    for (const [id, object] of this.players) {
      object.position.lerp(object.userData.targetPosition, 1 - Math.exp(-12 * delta));
      object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, object.userData.targetYaw ?? 0, 0.08);
      object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, object.userData.targetPitch ?? 0, 0.08);
      if (id === this.selfId) {
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, object.position.x * 0.18, 0.04);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 7 + object.position.y * 0.12, 0.04);
      }
    }

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

    this.camera.lookAt(this.camera.position.x * 0.25, this.camera.position.y * 0.12, -28);
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.socket?.disconnect();
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
    removeEventListener('mousemove', this.onMouseMove);
    removeEventListener('mousedown', this.onMouseDown);
    removeEventListener('resize', this.onResize);
    this.renderer?.dispose();
    this.container.replaceChildren();
  }
}
