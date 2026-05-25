
<!--
  ИТОГОВЫЙ ЭКЗАМЕН: Fullstack Мультиплеерная игра
  Дисциплина: Веб-разработка / Технологии интерактивных систем
  Преподаватель: [@Gabryelf - Валеев Сергей]
-->

<div align="center">
  <img src="https://img.shields.io/badge/🎓_ИТОГОВЫЙ_ПРОЕКТ-2_КУРС-1f425f?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Node.js-Express_Server-339933?style=for-the-badge&logo=nodedotjs"/>
  <img src="https://img.shields.io/badge/Three.js-3D_Client-44aaff?style=for-the-badge&logo=three.js"/>
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socketdotio"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render"/>
</div>

<br>

<div align="center">
  <h1>🎮 МУЛЬТИПЛЕЕРНАЯ ИГРА НА THREE.JS + NODE.JS</h1>
  <p><strong>Итоговый экзаменационный проект</strong><br>
  Разработка полноценного веб‑приложения с 3D графикой, сетевым взаимодействием и системой прогресса</p>
</div>

<details open>
<summary><b>📌 Оглавление</b></summary>

1. [Общая концепция и мотивация](#-общая-концепция-и-мотивация)
2. [Критерии оценки (5 баллов)](#-критерии-оценки-5-баллов)
3. [Выбор сеттинга и игровой механики](#-выбор-сеттинга-и-игровой-механики)
4. [Пошаговый план выполнения (6 шагов)](#-пошаговый-план-выполнения)
   - [Шаг 1: Фундамент проекта Node.js + WebSocket](#шаг-1-фундамент-проекта-nodejs--websocket)
   - [Шаг 2: База данных и система аккаунтов](#шаг-2-база-данных-и-система-аккаунтов)
   - [Шаг 3: 3D клиент на Three.js (базовый)](#шаг-3-3d-клиент-на-threejs-базовый)
   - [Шаг 4: Сетевая синхронизация (игроки видят друг друга)](#шаг-4-сетевая-синхронизация-игроки-видят-друг-друга)
   - [Шаг 5: Лобби, сессии, прогресс и магазин](#шаг-5-лобби-сессии-прогресс-и-магазин)
   - [Шаг 6: Деплой, документация, сдача](#шаг-6-деплой-документация-сдача)
5. [Технические требования к коду](#-технические-требования-к-коду)
6. [Документация в GitHub (Issues, Projects, Wiki)](#-документация-в-github)
7. [Инструкция по деплою на Render.com](#-инструкция-по-деплою-на-rendercom)
8. [Чек‑лист для самопроверки перед сдачей](#-чеклист-для-самопроверки-перед-сдачей)

</details>

---

## 🎯 Общая концепция и мотивация

<div align="center">
  <table>
    <tr>
      <td align="center">🎨<br><b>Сеттинг на выбор</b></td>
      <td align="center">⚔️<br><b>Любая механика</b></td>
      <td align="center">🌍<br><b>Мультиплеер 2+ игроков</b></td>
      <td align="center">💾<br><b>Прогресс и валюта</b></td>
    </tr>
  </table>
</div>

**Вы сами выбираете тему игры!** Это может быть:

- 🏎️ Гонки на дронах по трассам
- ✴️ Арена магов с файрболами
- 🤖 Битва роботов на платформах
- 🐉 Кооперативная охота на драконов
- 🏰 Захват флага в средневековом замке
- 👻 Хоррор на выживание с призраками
- 🐱 Battle‑Royale котят с подушками

> **Единственное требование:** Игроки видят друг друга в 3D пространстве и могут взаимодействовать (стрелять, атаковать, толкать, лечить — на ваше усмотрение).

---

## 📊 Критерии оценки (максимум 5 баллов)

| Балл | Критерий | Что проверяется |
|:----:|----------|----------------|
| 1 | **Модульная структура** | Разделение сервер/клиент, маршруты, контроллеры, модели, менеджеры комнат |
| 1 | **Документация** | README, комментарии в коде, заполненные Issues/Projects/Wiki (минимум 3 задачи, канбан‑доска) |
| 1 | **База данных + прогресс** | Сохранение игроков (логин/пароль), валюты, скинов/улучшений. После матча данные обновляются |
| 1 | **Оформление и работоспособность** | UI/UX, стабильность соединения, отсутствие критических багов, понятное управление |
| 1 | **Деплой на хостинг** | Публичный URL (Render.com / Vercel / Railway). Игра доступна онлайн, WebSocket работает |

---

## 💠 Выбор сеттинга и игровой механики

**Заполните этот блок в своём README.md** (замените примерами). Укажите:

```markdown
### Сеттинг моей игры
- **Название:** [например, "Dragon Hunt Arena"]
- **Жанр:** [например, PvP‑арена]
- **Лор:** [2 предложения]

### Игровые механики
- **Управление:** WASD — движение, мышь — прицел/поворот камеры, ЛКМ — атака
- **Особенности:** 
  - 3 типа оружия (меч/лук/посох)
  - Способность «Ускорение» на Shift (кулдаун 10 сек)
  - При победе игрок получает 50 монет + 1 очко рейтинга
- **Визуальный стиль:** Low‑poly / Cel‑shading / Реализм (нужное подчеркнуть)
- **Модели:** (созданы в Blender / скачаны / примитивы Three.js)
```

> ⚠️ **Важно:** Любая механика, но игроки ДОЛЖНЫ видеть друг друга и иметь возможность влиять друг на друга (наносить урон, лечить, замедлять и т.п.).

---

## 👣 Пошаговый план выполнения

### Шаг 1: Фундамент проекта Node.js + WebSocket

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-структура-orange?style=flat-square"/>
</div>

**Цель:** Создать работающий сервер с комнатами и базовым WebSocket соединением.

#### 1.1 Инициализация
```bash
mkdir my-multiplayer-game
cd my-multiplayer-game
npm init -y
npm install express socket.io mongoose cors dotenv bcrypt jsonwebtoken
npm install -D nodemon
```

#### 1.2 Структура папок (MUST HAVE)
```
my-multiplayer-game/
├── server/
│   ├── models/          # Mongoose схемы (User, GameSession)
│   ├── controllers/     # Логика пользователей, комнат
│   ├── sockets/         # Обработчики socket.io
│   ├── routes/          # API маршруты (auth, profile, shop)
│   ├── utils/           # helpers, валидация
│   └── index.js         # Точка входа сервера
├── client/
│   ├── src/
│   │   ├── main.js      # Three.js инициализация
│   │   ├── network/     # SocketClient.js
│   │   ├── game/        # GameLoop, рендеринг
│   │   └── ui/          # HTML/DOM интерфейсы (лобби, магазин)
│   ├── index.html
│   └── style.css
├── .env                 # PORT, MONGO_URI, JWT_SECRET
├── .gitignore
└── README.md
```

#### 1.3 Простейший сервер (проверка WebSocket)
<details>
<summary><b>📄 server/index.js (минимальный пример)</b></summary>

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('client'));

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Хранилище комнат (временное)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`🟢 Игрок подключился: ${socket.id}`);

  socket.on('create_room', ({ playerName }, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(roomId, { players: [{ id: socket.id, name: playerName }] });
    socket.join(roomId);
    callback({ success: true, roomId });
  });

  socket.on('join_room', ({ roomId, playerName }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback({ success: false, error: 'Комната не найдена' });
    if (room.players.length >= 4) return callback({ success: false, error: 'Комната полна' });
    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);
    io.to(roomId).emit('players_update', room.players);
    callback({ success: true });
  });

  socket.on('disconnect', () => { /* очистка комнат */ });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Сервер на http://localhost:${PORT}`));
```
</details>

#### 1.4 Клиентский Socket клиент
```javascript
// client/src/network/SocketClient.js
export class SocketClient {
  constructor(url) {
    this.socket = io(url);
  }
  createRoom(name) { /* ... */ }
  joinRoom(roomId, name) { /* ... */ }
  onPlayersUpdate(cb) { this.socket.on('players_update', cb); }
}
```

---

### Шаг 2: База данных и система аккаунтов может быть любой

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-БД_и_прогресс-orange?style=flat-square"/>
</div>

#### 2.1 Модель пользователя (MongoDB / Mongoose) - пример

```javascript
// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  currency: { type: Number, default: 500 },   // игровая валюта
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    kills: { type: Number, default: 0 }
  },
  skins: [{ type: String }],                  // массив ID скинов
  activeSkin: { type: String, default: 'default' },
  upgrades: {
    damage: { type: Number, default: 1 },
    health: { type: Number, default: 100 },
    speed: { type: Number, default: 5 }
  }
});

module.exports = mongoose.model('User', UserSchema);
```

#### 2.2 API для регистрации / логина / профиля
- `POST /api/auth/register` — создание нового игрока (хэш пароля bcrypt)
- `POST /api/auth/login` — выдача JWT токена
- `GET /api/profile` — получение данных игрока (валюты, улучшения)
- `POST /api/shop/buy` — покупка скина/улучшения за валюту
- `POST /api/battle/result` — обновление статистики после матча

#### 2.3 Обязательное требование
> **После завершения матча** (победа/поражение) сервер должен начислить валюту и обновить статистику в MongoDB.

---

### Шаг 3: 3D клиент на Three.js (базовый)

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-оформление-orange?style=flat-square"/>
</div>

#### 3.1 Сцена, камера, освещение
```javascript
// client/src/main.js (минимальный скелет)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1030);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(5, 4, 8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Управление (для вашей игры нужно своё, без OrbitControls)
const controls = new OrbitControls(camera, renderer.domElement);

// Свет
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);

// Пол/сетка
const grid = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588);
scene.add(grid);

// Анимация
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // для разработки, для игры — своя система
  renderer.render(scene, camera);
}
animate();
```

#### 3.2 Игровой объект (например, модель вашего персонажа)
- Используйте **примитивы** (BoxGeometry, SphereGeometry) или загрузите **GLTF модель** через `GLTFLoader`
- Добавьте управление: `WASD` для движения, мышь для поворота

#### 3.3 Отображение других игроков (заглушка)
Когда приходят данные с сервера (массив игроков), создайте для каждого сферу/куб и обновляйте её позицию.

---

### Шаг 4: Сетевая синхронизация (игроки видят друг друга)

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-работоспособность-orange?style=flat-square"/>
</div>

#### 4.1 Отправка позиции с клиента
```javascript
setInterval(() => {
  if (socket && playerId) {
    socket.emit('player_move', {
      id: playerId,
      position: { x: myMesh.position.x, y: myMesh.position.y, z: myMesh.position.z },
      rotation: { yaw: camera.rotation.y }
    });
  }
}, 50);
```

#### 4.2 Серверная рассылка
```javascript
socket.on('player_move', (data) => {
  socket.to(roomId).emit('other_moved', data);
});
```

#### 4.3 Создание/удаление игроков
При `players_update` добавляйте новых игроков в сцену, удаляйте отключившихся.

#### 4.4 Взаимодействие (атака)
- Клиент: при клике мыши отправляем `attack` с targetId
- Сервер: проверяет дистанцию, наносит урон, рассылает событие `hit`
- Клиент получателя: уменьшает здоровье, обновляет UI

---

### Шаг 5: Лобби, сессии, прогресс и магазин

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-БД_и_прогресс-orange?style=flat-square"/>
</div>

#### 5.1 Интерфейс лобби (HTML/CSS)
- Список существующих комнат (получать через `GET /api/rooms`)
- Кнопка «Создать комнату» → форма с названием и выбором карты
- Кнопка «Присоединиться по коду» → поле ввода кода
- Профиль пользователя: отображение валюты, скинов, улучшений

#### 5.2 Магазин улучшений (пример)
| Улучшение | Стоимость | Эффект |
|-----------|-----------|--------|
| Урон +5    | 200 монет | +5 к урону |
| Скорость +10% | 150 монет | быстрее бег |
| Новый скин «Дракон» | 500 монет | меняет модель |

#### 5.3 Сохранение прогресса после матча
```javascript
// После определения победителя
socket.on('match_end', async ({ winnerId, loserId, kills }) => {
  await User.findByIdAndUpdate(winnerId, { $inc: { currency: 100, 'stats.wins': 1, 'stats.kills': kills } });
  await User.findByIdAndUpdate(loserId, { $inc: { currency: 30, 'stats.losses': 1 } });
  // обновить клиентам
});
```

---

### Шаг 6: Деплой, документация, сдача

<div align="right">
  <img src="https://img.shields.io/badge/статус-обязательно-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/балл-деплой-orange?style=flat-square"/>
</div>

#### 6.1 Подготовка к деплою
- Создайте файл `.env` с переменными (не загружайте в Git!)
- Убедитесь, что `client/index.html` ссылается на скомпилированный JS (или используйте простую структуру)
- В `package.json` добавьте скрипты:
  ```json
  "scripts": {
    "start": "node server/index.js",
    "server": "nodemon server/index.js"
  }
  ```

#### 6.2 Деплой на Render.com
1. Создайте репозиторий на GitHub, загрузите код.
2. Зарегистрируйтесь на [Render.com](https://render.com), нажмите **New +** → **Web Service**.
3. Подключите GitHub репозиторий.
4. Настройки:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** добавьте `MONGO_URI` (ссылка на MongoDB Atlas), `JWT_SECRET`, `PORT=10000`
5. Нажмите **Create Web Service**. Через 3-5 минут приложение будет доступно.

#### 6.3 Документация в GitHub (обязательно)
- **README.md** — этот документ (но адаптированный под вашу игру).
- **Issues:** создайте минимум 3 задачи (например, «Добавить анимацию удара», «Настроить WebSocket реконнект», «Сделать магазин скинов»).
- **Projects:** сделайте канбан‑доску с колонками `To Do` / `In Progress` / `Done`.
- **Wiki:** опишите управление, схему базы данных, API эндпоинты.
- **About репозитория:** заполните описание, укажите **website** (ссылка на Render), добавьте теги: `multiplayer`, `threejs`, `nodejs`, `game`.

---

## 📐 Технические требования к коду

| Требование | Пояснение |
|------------|-----------|
| **Модульность** | Серверная логика разделена на модели, контроллеры, сокеты, роуты. Клиент — на сеть, UI, рендеринг, игровой цикл. |
| **Комментарии** | Ключевые функции имеют JSDoc комментарии. README объясняет архитектуру. |
| **Обработка ошибок** | try/catch в асинхронных операциях, валидация ввода, сообщения об ошибках для игрока. |
| **Безопасность** | JWT для авторизации, bcrypt для паролей, CORS настроен, сокеты проверяют принадлежность комнате. |
| **Производительность** | Не более 60 обновлений позиции в секунду, интерполяция движений, удаление неактивных объектов. |

---

## 🗂️ Документация в GitHub (четкие требования)

| Элемент | Минимальное содержание |
|---------|------------------------|
| **README.md** | Название, скриншоты/гифка, описание сеттинга, инструкция по запуску локально, ссылка на хост, список использованных технологий |
| **Issues** | 3 задачи с метками `enhancement`, `bug`, `documentation` (хотя бы одна закрытая) |
| **Projects** | Project board с карточками задач, статусами |
| **Wiki** | Страницы: "Управление в игре", "Архитектура базы данных", "API эндпоинты" |
| **About** | Заполнено описание, URL сайта, темы (`threejs`, `multiplayer`, `socketio`) |

---

## 🚀 Инструкция по деплою на Render.com

<details>
<summary><b>Подробный гайд (развернуть)</b></summary>

1. **MongoDB Atlas** — создайте бесплатный кластер, получите строку подключения.
2. **GitHub** — залейте код, убедитесь что в корне есть `package.json` и `server/index.js`.
3. **Render**:
   - Dashboard → New Web Service
   - Connect repository
   - Name: `your-game-multiplayer`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add Environment Variable:
     - `MONGO_URI` = `mongodb+srv://...`
     - `JWT_SECRET` = `случайная_строка`
     - `PORT` = `10000`
   - Нажать "Create Web Service"
4. После деплоя откроется лог. Если видите `Server running on port 10000`, переходите по адресу `https://your-game-multiplayer.onrender.com`.
5. **Проверьте мультиплеер** — откройте игру в двух разных браузерах или на двух устройствах, создайте комнату и убедитесь, что игроки видят друг друга.
</details>

---

## ✅ Чек-лист для самопроверки перед сдачей

**Прогресс**:

- [ ] Сервер запускается без ошибок, WebSocket слушает порт
- [ ] Можно зарегистрироваться и войти (данные сохраняются в MongoDB)
- [ ] Создание комнаты → получение уникального кода → присоединение другого игрока
- [ ] В 3D сцене оба игрока отображаются (даже если это цветные кубы)
- [ ] Реализовано хотя бы одно взаимодействие (атака, стрельба, толчок)
- [ ] При击杀 противника начисляется валюта, обновляется статистика в профиле
- [ ] Магазин: можно купить улучшение/скин за валюту, эффект применяется
- [ ] После окончания матча (победа/поражение) игрок видит результат и может вернуться в лобби
- [ ] README написан, есть ссылка на хост, скриншоты
- [ ] GitHub Issues, Projects, Wiki оформлены
- [ ] Деплой работает, мультиплеер доступен из интернета

---

<div align="center">
  <br>
  <img src="https://img.shields.io/badge/🎉_УСПЕХОВ_В_РАЗРАБОТКЕ-Помните_о_дедлайне!-2ea44f?style=for-the-badge"/>
  <br><br>
  <i>«Игра — это лучшая форма исследования реальности»</i><br>
  <b>Сдавайте проект вовремя, и пусть соединение всегда будет стабильно!</b>
</div>
