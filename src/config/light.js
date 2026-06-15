export const LIGHTS_CONFIG = {
    // основной источник света - солнце
    main: {
        type: 'directional',
        color: 0xffffff,
        intensity: 1.2,
        position: {x: 5, y:10, z: 7},
        castShadow: true,
        shadowMapSize: 1024
        
    },
    // направленный свет - лучи
    ambient: {
        type: 'directional',
        color: 0xFAFF8C,
        intensity: 0.8,
        position: {x: -3, y:2, z: -4},
    },
    // источник контрового цвета - свет сзади от камеры
    rim: {
        type: 'directional',
        color: 0xFAFF8C,
        intensity: 0.3,
        position: {x: 0, y:-2, z: 0},
    },
    // нижний свет - заполняющий
    fill: {
        type: 'point',
        color: 0xFFEA8C,
        intensity: 0.3,
        position: {x: 0, y:-2, z: 0},
    },
    // подсветка
    back: {
        type: 'point',
        color: 0xFFEA8C,
        intensity: 0.4,
        position: {x: 0, y:1, z: -5},
    }
}
