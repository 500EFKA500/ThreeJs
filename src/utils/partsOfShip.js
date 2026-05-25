import * as THREE from 'three';
import { TextureLoader } from '../core/TextureLoader.js';

export class PartsShip {
    constructor() {
        this.ship = null;
        this.cabin = null;
        this.textureLoader = new TextureLoader();
    }

    createCabin() {
        const maps = this.textureLoader.load('grass');

        const geometry = new THREE.SphereGeometry(2, 96, 48);
        geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));

        const material = new THREE.MeshStandardMaterial({
            map: maps.albedo,
            aoMap: maps.ao,
            displacementMap: maps.height,
            normalMap: maps.normal,
            roughnessMap: maps.roughness,
            metalnessMap: maps.metallic,
            roughness: 1,
            metalness: 1,
        });

        material.aoMapIntensity = 1;
        material.displacementScale = 0.35;
        material.displacementBias = -0.12;
        material.normalScale.set(1.2, 1.2);

        this.cabin = new THREE.Mesh(geometry, material);
        this.cabin.castShadow = true;
        this.cabin.receiveShadow = true;
        return this.cabin;
    }
}
