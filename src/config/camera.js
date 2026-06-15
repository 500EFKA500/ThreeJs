export const CAMERA_CONFIG = {
    // angle camera
    fov: 45,
    // near point look
    near: 0.1,
    // far point look
    far: 1000,
    // transform position
    position: { x: 5, y: 8, z: 5 },
    // center scene
    target: { x: 0, y: 0, z: 0 },

    controls: {
        enableDamping: true, //> Плавность
        dampingFactor: 0.1, //> Инерция камеры
        autoRotate: false,
        enableZoom: true,
        zoomSpeed: 1,
        enablePan: true,
        rotateSpeed: 0.5,
    }
};
