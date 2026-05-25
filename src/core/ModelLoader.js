import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODELS_CONFIG } from '../config/model.js';

export class ModelLoader{

    constructor(scene){
        this.scene = scene;
        this.model = null;
        this.positions = new THREE.Vector3(0, 0, 0)
    }
    
    load(index){
        const url = MODELS_CONFIG.url[index];
        const loader = new GLTFLoader();

        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.position.set(
                        this.positions.x,
                        this.positions.y,
                        this.positions.z,
                    );

                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this._updatePosition();
                    this.scene.add(this.model);
                    resolve(this.model);
                },
                undefined,
                reject
            );
        });
    }

    _updatePosition(){
        this.positions.x += 4;
    }
}
