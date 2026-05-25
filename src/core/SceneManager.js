import * as THREE from 'three';
import {SCENE_CONFIG} from "../config/scene.js";

export class SceneManager {
    constructor() {
        this.scene = null;
    }
    
    create() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_CONFIG.background);
        
        if(SCENE_CONFIG.fog.enable){
            this.scene.fog = new THREE.FogExp2(
                SCENE_CONFIG.fog.color,
                SCENE_CONFIG.fog.density
            )
        }
        
        return this.scene;
    }
    
    getScene() {
        return this.scene;
    }
}
