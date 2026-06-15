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

        const coneGeometry = new THREE.ConeGeometry(3, 4, 10);
        const material = new THREE.MeshStandardMaterial({
            map: maps.albedo,
            aoMap: maps.ao,
            displacementMap: maps.height,
            normalMap: maps.normal,
            roughnessMap: maps.roughness,
            metalnessMap: maps.metallic,
        });

        material.displacementScale = 0.1;
        this.cabin = new THREE.Mesh(coneGeometry, material);
        return this.cabin;
    }
}
