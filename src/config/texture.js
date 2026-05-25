export const TEXTURES_CONFIG = {
    url: {
        grass: {
            albedo: '../../textures/grass/wispy-grass-meadow_albedo.png',
            ao: '../../textures/grass/wispy-grass-meadow_ao.png',
            metallic: '../../textures/grass/wispy-grass-meadow_metallic.png',
            roughness: '../../textures/grass/wispy-grass-meadow_roughness.png',
            normal: '../../textures/grass/wispy-grass-meadow_normal-ogl.png',
            height: '../../textures/grass/wispy-grass-meadow_height.png',
        },
        rock: {
            albedo: '',
            ao: '',
            metallic: '',
            roughness: '',
            normal: '',
            height: '',
        },
    },
};

export function getTextureUrl(materialKey, mapKey) {
    const path = TEXTURES_CONFIG.url[materialKey]?.[mapKey];
    if (!path) return null;
    return new URL(path, import.meta.url).href;
}
