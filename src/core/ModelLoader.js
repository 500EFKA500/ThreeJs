import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODELS_CONFIG } from '../config/model.js';

export class ModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.models = [];
    }

    load(index, options = {}) {
        const url = MODELS_CONFIG.url[index];
        const position = options.position ?? { x: 0, y: 0, z: 0 };

        if (!url) {
            const model = this._createPlaceholder(index, position);
            this.model = model;
            this.models[index] = model;
            return Promise.resolve(model);
        }

        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;
                    model.position.set(position.x, position.y, position.z);
                    this.scene.add(model);
                    this.model = model;
                    this.models[index] = model;
                    resolve(model);
                },
                undefined,
                reject,
            );
        });
    }

    _createPlaceholder(index, position) {
        let model;

        if (index === 1) {
            const geometry = new THREE.IcosahedronGeometry(2, 1);
            const material = new THREE.MeshStandardMaterial({
                color: 0x8a8070,
                roughness: 0.95,
                metalness: 0.05,
            });
            model = new THREE.Mesh(geometry, material);
        } else {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x44aaff });
            model = new THREE.Mesh(geometry, material);
        }

        model.position.set(position.x, position.y, position.z);
        this.scene.add(model);
        return model;
    }

    getModel(index) {
        if (index !== undefined) return this.models[index] ?? null;
        return this.model;
    }
}
