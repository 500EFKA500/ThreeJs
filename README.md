# Three.js Ship Scene

Интерактивная 3D-сцена на Three.js: загрузка модели корабля, звездное окружение, освещение, два режима камеры и панель управления трансформацией модели.

## Что есть в проекте

- Загрузка `.glb` модели корабля из `models/scout.glb`
- Сцена со звездным фоном
- Основной направленный свет с тенями
- Два режима камеры:
  - `OrbitControls` для осмотра модели
  - `FlyControls` для свободного полета по сцене
- Панель `tweakpane` для плавного перемещения и вращения модели
- Модульная структура: камера, свет, сцена, загрузчик модели и UI вынесены в отдельные классы

## Запуск

Установить зависимости:

```powershell
npm.cmd install
```

Запустить dev-сервер:

```powershell
npm.cmd run dev
```

Открыть адрес, который покажет Vite. Обычно это:

```text
http://localhost:5173/
```

Собрать проект:

```powershell
npm.cmd run build
```

## Управление

### Orbit mode

Режим включен по умолчанию.

- ЛКМ + движение мыши - вращение камеры вокруг модели
- Колесо мыши - приближение/отдаление
- ПКМ + движение мыши - смещение камеры

### Fly mode

Переключение между `OrbitControls` и `FlyControls`:

```text
C
```

В режиме полета:

- `W / S` - вперед / назад
- `A / D` - влево / вправо
- `R / F` - вверх / вниз
- зажать мышь и двигать - смотреть вокруг

## Панель модели

Справа сверху находится панель `tweakpane`.

В папке `position`:

- `x` - перемещение по X
- `y` - перемещение по Y
- `z` - перемещение по Z

В папке `rotation`:

- `rx` - вращение по X
- `ry` - вращение по Y
- `rz` - вращение по Z

Изменения применяются плавно: панель меняет целевые значения, а модель каждый кадр постепенно догоняет цель.

Панель можно быстро отключить в `src/main.js`:

```js
// this.createPane(this.ship);
```

## Структура

```text
src/
  config/
    camera.js      настройки камеры и режимов управления
    light.js       настройки света
    model.js       пути к моделям
    scene.js       цвет фона и туман
    texture.js     пути к текстурам
  core/
    CameraManager.js   камера, OrbitControls и FlyControls
    LightManager.js    создание света
    ModelLoader.js     загрузка GLB-моделей
    SceneManager.js    создание сцены
    TextureLoader.js   загрузка текстур
  utils/
    PaneConstructor.js панель управления моделью
    skySet.js         звездный фон
  main.js             точка входа
models/
  scout.glb
textures/
  grass/
  sprites/
```

## Основные файлы

- `src/main.js` - собирает сцену, камеру, свет, модель и панель
- `src/core/CameraManager.js` - переключение между `OrbitControls` и `FlyControls`
- `src/core/ModelLoader.js` - загрузка `scout.glb`
- `src/utils/PaneConstructor.js` - ползунки позиции и вращения
- `src/utils/skySet.js` - генерация звезд

## Зависимости

- Three.js
- Vite
- Tweakpane

## Примечания

Если PowerShell не дает запускать `npm`, используй `npm.cmd`:

```powershell
npm.cmd run dev
```

Если страница показывает старую версию, обнови с очисткой кэша:

```text
Ctrl + F5
```
