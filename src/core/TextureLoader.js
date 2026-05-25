import * as THREE from 'three';
import { TEXTURES_CONFIG, getTextureUrl } from '../config/texture.js';

export class TextureLoader {
    constructor() {
        this.texture_loader = new THREE.TextureLoader();
    }

    load(materialKey) {
        const maps = TEXTURES_CONFIG.url[materialKey];
        if (!maps) return {};

        const textures = {};
        for (const mapKey of Object.keys(maps)) {
            if (!maps[mapKey]) continue;
            const texture = this.loadMap(mapKey, materialKey);
            if (texture) textures[mapKey] = texture;
        }
        return textures;
    }

    loadMap(mapKey, materialKey) {
        const url = getTextureUrl(materialKey, mapKey);
        if (!url) return null;
        const texture = this.texture_loader.load(url);

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        if (mapKey === 'albedo') {
            texture.colorSpace = THREE.SRGBColorSpace;
        }

        return texture;
    }
}
