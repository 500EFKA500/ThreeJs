<div align="center">

# SPACE COMMAND

### Multiplayer space flight built with Three.js, Fastify, Socket.IO and SQLite

[![Three.js](https://img.shields.io/badge/Three.js-0.184-black?logo=threedotjs)](https://threejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)](https://fastify.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black?logo=socketdotio)](https://socket.io/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Авторизуйтесь, улучшайте корабль и исследуйте общий космический сектор вместе с другими пилотами.

</div>

---

## Возможности

- Регистрация и вход с хешированием паролей через `scrypt`.
- HttpOnly-сессии, привязанные к аккаунту.
- Постоянное хранение аккаунтов, кредитов, настроек и улучшений в SQLite.
- Главное меню, ангар, прокачка корабля и настройки пилота.
- Свободный полёт в трёхмерном пространстве.
- Модель корабля GLB, звёздное поле, астероиды и плазменные снаряды.
- Синхронизация игроков и игрового мира через Socket.IO.
- Серверная обработка движения, столкновений и состояния кораблей.
- Адаптивный космический интерфейс.
- Готовая Docker-конфигурация с постоянным томом базы данных.

## Управление

| Клавиша | Действие |
|---|---|
| `W` / `S` | Полёт вперёд / назад |
| `A` / `D` | Смещение влево / вправо |
| `R` / `F` | Подъём / снижение |
| Мышь | Управление направлением полёта и камерой |
| `ЛКМ` или `Space` | Огонь |
| `Shift` | Переключение между режимом полёта и интерфейсом |

В режиме полёта курсор скрыт и зафиксирован в окне. Нажмите `Shift`, чтобы освободить курсор и использовать кнопки интерфейса.

## Стек

| Область | Технологии |
|---|---|
| 3D-клиент | Three.js, GLTFLoader, WebGL |
| Интерфейс | HTML, CSS, JavaScript ES Modules |
| HTTP-сервер | Fastify |
| Real-time | Socket.IO |
| База данных | SQLite через встроенный `node:sqlite` |
| Авторизация | `scrypt`, HttpOnly cookie sessions |
| Сборка | Vite |
| Развёртывание | Docker, Docker Compose |

## Архитектура

```text
Browser
  |-- HTTP API ----------> Fastify
  |-- Socket.IO ---------> Game loop (20 ticks/s)
  |-- Three.js renderer
                              |
                              +--> SQLite
                                   users
                                   sessions
                                   upgrades
                                   settings
```

Основные файлы:

```text
.
|-- server.js                 # Fastify, API, SQLite и Socket.IO
|-- src/main.js               # Экраны авторизации и главного меню
|-- src/game/SpaceGame.js     # Three.js-сцена и управление
|-- models/scout.glb          # Модель корабля
|-- index.html
|-- style.css
|-- Dockerfile
`-- compose.yaml
```

## Локальный запуск

Требуется Node.js 22 или новее.

```bash
git clone https://github.com/500EFKA500/ThreeJs.git
cd ThreeJs
npm install
npm start
```

Откройте:

```text
http://localhost:7000
```

Для разработки с автоматическим перезапуском:

```bash
npm run dev
```

Проверка production-сборки:

```bash
npm run build
```

## Запуск через Docker

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

Приложение будет доступно на порту `7000`.

Чтобы использовать другой внешний порт:

```bash
cp .env.example .env
```

Измените `.env`:

```dotenv
APP_PORT=8080
```

Затем:

```bash
docker compose up -d --build
```

Внутри контейнера сервер продолжит работать на `7000`, а снаружи будет доступен на `8080`.

## Как работает база данных

SQLite не требует отдельного контейнера или отдельного сервера БД.

Файл базы создаётся автоматически:

```text
/app/data/space-command.db
```

Docker Compose подключает к `/app/data` постоянный named volume:

```text
space-command-data
```

Поэтому следующие команды не удаляют аккаунты:

```bash
docker compose restart
docker compose down
docker compose up -d --build
```

Не выполняйте `docker compose down -v`, если хотите сохранить базу. Параметр `-v` удалит volume вместе с аккаунтами.

## Развёртывание на SSH-сервере

Ниже пример для Linux-сервера с установленными Git, Docker Engine и Docker Compose plugin. Актуальную инструкцию установки Docker для вашего дистрибутива используйте с официального сайта:

- Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Debian: https://docs.docker.com/engine/install/debian/

### 1. Подключитесь к серверу

```bash
ssh USER@SERVER_IP
```

### 2. Загрузите проект

```bash
git clone https://github.com/500EFKA500/ThreeJs.git
cd ThreeJs
```

Если репозиторий приватный, используйте SSH URL:

```bash
git clone git@github.com:500EFKA500/ThreeJs.git
```

### 3. Запустите приложение

```bash
docker compose up -d --build
docker compose ps
```

Проверьте состояние:

```bash
curl http://127.0.0.1:7000/api/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "uptime": 120,
  "playersOnline": 0
}
```

### 4. Откройте порт

Для Ubuntu с UFW:

```bash
sudo ufw allow 7000/tcp
sudo ufw status
```

После этого игра доступна по адресу:

```text
http://SERVER_IP:7000
```

Если сервер находится у облачного провайдера, порт также нужно разрешить в его Security Group или сетевом firewall.

## Домен, Nginx и HTTPS

Для публичного сервера рекомендуется не открывать `7000` напрямую, а использовать Nginx и HTTPS. Socket.IO требует передачи заголовков WebSocket.

Пример `/etc/nginx/sites-available/space-command`:

```nginx
server {
    listen 80;
    server_name game.example.com;

    location / {
        proxy_pass http://127.0.0.1:7000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Включите конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/space-command /etc/nginx/sites-enabled/space-command
sudo nginx -t
sudo systemctl reload nginx
```

После настройки DNS установите HTTPS через Certbot:

```bash
sudo certbot --nginx -d game.example.com
```

Официальная документация Certbot: https://certbot.eff.org/

## Обновление сервера

```bash
ssh USER@SERVER_IP
cd ThreeJs
git pull
docker compose up -d --build
docker image prune -f
```

Docker Compose пересоздаст контейнер, но подключит существующий volume с базой данных.

## Резервное копирование БД

### Создать backup

```bash
docker compose stop
docker run --rm \
  -v space-command-data:/data \
  -v "$PWD":/backup \
  alpine \
  tar czf /backup/space-command-data.tar.gz -C /data .
docker compose start
```

Файл `space-command-data.tar.gz` появится в текущем каталоге.

### Восстановить backup

```bash
docker compose down
docker run --rm \
  -v space-command-data:/data \
  -v "$PWD":/backup \
  alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/space-command-data.tar.gz -C /data && chown -R 1000:1000 /data"
docker compose up -d
```

Перед восстановлением убедитесь, что backup существует и относится к нужному серверу.

## Полезные команды

```bash
# Статус контейнера
docker compose ps

# Логи
docker compose logs -f --tail=200

# Перезапуск
docker compose restart

# Остановка без удаления БД
docker compose down

# Проверка health endpoint
curl http://127.0.0.1:7000/api/health

# Просмотр volume
docker volume inspect space-command-data
```

## HTTP API

| Метод | Маршрут | Назначение |
|---|---|---|
| `GET` | `/api/health` | Состояние сервера |
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/me` | Данные текущего аккаунта |
| `PATCH` | `/api/settings` | Сохранение настроек |
| `POST` | `/api/upgrade` | Улучшение корабля |

## Решение проблем

### `EADDRINUSE: address already in use`

Порт `7000` уже занят другим процессом или контейнером.

```bash
docker compose ps
sudo ss -ltnp | grep :7000
```

Остановите старый контейнер или задайте другой `APP_PORT` в `.env`.

### Контейнер не становится healthy

```bash
docker compose logs --tail=200
docker inspect space-command
curl http://127.0.0.1:7000/api/health
```

### После обновления пропали аккаунты

Проверьте наличие volume:

```bash
docker volume ls | grep space-command-data
docker volume inspect space-command-data
```

Не запускайте `docker compose down -v` на production-сервере.

### Socket.IO не подключается через домен

Убедитесь, что Nginx передаёт `Upgrade` и `Connection`, а `proxy_pass` указывает на правильный порт.

## Безопасность production-сервера

- Используйте HTTPS.
- Не публикуйте SSH-ключи, `.env` и резервные копии БД.
- Разрешите SSH-вход по ключу и отключите вход root по паролю.
- Регулярно обновляйте Docker и операционную систему.
- Храните резервные копии вне сервера.
- Не открывайте порт `7000`, если приложение доступно через Nginx.

## Лицензия

Проект распространяется по лицензии [MIT](LICENSE).
