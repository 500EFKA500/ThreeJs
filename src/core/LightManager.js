import * as THREE from 'three';
import {LIGHTS_CONFIG} from "../config/light.js";

export class LightManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = {};
    }
    
    createAll(){
        this._createMainLight();
        return this.lights;
    }
    
    _createMainLight(){
        const config = LIGHTS_CONFIG.main
        const light = 
            new THREE.DirectionalLight(config.color, config.intensity);
        light.position.set(config.position.x, config.position.y, config.position.z);
        
        if(config.castShadow){
            light.castShadow = true;
            // light.shadow.MapSize.with = config.shadowMapSize;
            // light.shadow.MapSize.height = config.shadowMapSize;
            
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 20;
        }
        this.scene.add(light);
        this.lights.main = light;
    }
    
    getLight(name){
        return this.lights[name];
    }
}
