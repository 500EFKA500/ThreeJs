import * as THREE from 'three';
import { SceneManager } from "./core/SceneManager.js";
import { CameraManager } from "./core/CameraManager.js";
import { LightManager } from "./core/LightManager.js";
import { SkySettings } from './utils/skySet.js';
import { PaneConstructor } from './utils/PaneConstructor.js';
import { ModelLoader } from './core/ModelLoader.js';


class Main{
    constructor(){
        this.sceneManager = null;
        this.cameraManager = null;
        this.lightManager = null;
        this.renderer = null;
        this.camera = null;
        
        this.time = 0;
        this.ship = null;
        this.paneConstructor = null;

        this.skySettings = null;
        this.modelLoader = null;
        
        this.init()
    }
    
    init(){
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.sceneManager = new SceneManager();
        const scene = this.sceneManager.create();

        this.cameraManager = new CameraManager(this.renderer.domElement);
        this.cameraManager.create();
        this.cameraManager.createControls();
        

        this.skySettings = new SkySettings(scene);
        this.skySettings.createStars();

        this.modelLoader = new ModelLoader(scene);
        this.modelLoader.load(0).then((ship) => {
            this.ship = ship;
            this.createPane(this.ship);
        });

        this.lightManager = new LightManager(scene);
        this.lightManager.createAll();

        window.addEventListener('resize', () => this.onWindowResize());

        this.animate();
    }
    
    onWindowResize(){
        this.cameraManager.onWindowResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    createPane(object){
        this.paneConstructor = new PaneConstructor(object);
        this.paneConstructor.addAllPanels();
    }
    
    animate(){
        requestAnimationFrame(() => this.animate());
        this.time += 0.016;
        
        this.cameraManager.update();
        this.paneConstructor?.update();
        
        this.renderer.render(
            this.sceneManager.getScene(),
            this.cameraManager.getCamera()
        )
    }
}

const game = new Main();
