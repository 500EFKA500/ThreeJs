import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {FlyControls} from 'three/addons/controls/FlyControls.js'
import {CAMERA_CONFIG} from "../config/camera.js";

export class CameraManager {
    constructor(renderDomElement) {
        this.camera = null;
        this.controls = null;
        this.orbitControls = null;
        this.flyControls = null;
        this.controlsMode = 'orbit';
        this.clock = new THREE.Clock();
        this.renderDomElement = renderDomElement;
    }
    create() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.fov,
            window.innerWidth / window.innerHeight,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );
        
        this.camera.position.set(
            CAMERA_CONFIG.position.x,
            CAMERA_CONFIG.position.y,
            CAMERA_CONFIG.position.z,
        )
        
        this.camera.lookAt(
            CAMERA_CONFIG.target.x,
            CAMERA_CONFIG.target.y,
            CAMERA_CONFIG.target.z
        )
        return this.camera
    }
    
    createControls(){
        this._createOrbitControls();
        this._createFlyControls();
        this.setControlsMode('orbit');
        window.addEventListener('keydown', (event) => this._onKeyDown(event));
        return this.controls;
    }

    _createOrbitControls(){
        this.orbitControls = new OrbitControls(this.camera, this.renderDomElement);
        this.orbitControls.enablePan = CAMERA_CONFIG.controls.enablePan;
        this.orbitControls.enableDamping = CAMERA_CONFIG.controls.enableDamping;
        this.orbitControls.enableZoom = CAMERA_CONFIG.controls.enableZoom;
        this.orbitControls.dampingFactor = CAMERA_CONFIG.controls.dampingFactor;
        this.orbitControls.autoRotate = CAMERA_CONFIG.controls.autoRotate;
        this.orbitControls.rotateSpeed = CAMERA_CONFIG.controls.rotateSpeed;
        this.orbitControls.zoomSpeed = CAMERA_CONFIG.controls.zoomSpeed;
        
        this.orbitControls.target.set(
            CAMERA_CONFIG.target.x,
            CAMERA_CONFIG.target.y,
            CAMERA_CONFIG.target.z
        );
    }

    _createFlyControls(){
        this.flyControls = new FlyControls(this.camera, this.renderDomElement);
        this.flyControls.movementSpeed = CAMERA_CONFIG.controls.flyMovementSpeed;
        this.flyControls.rollSpeed = CAMERA_CONFIG.controls.flyRollSpeed;
        this.flyControls.dragToLook = CAMERA_CONFIG.controls.flyDragToLook;
        this.flyControls.autoForward = false;
    }

    setControlsMode(mode){
        this.controlsMode = mode;
        this.controls = mode === 'fly' ? this.flyControls : this.orbitControls;
        this.orbitControls.enabled = mode === 'orbit';
        this.flyControls.enabled = mode === 'fly';
        console.log(`Camera mode: ${mode}`);
    }

    toggleControlsMode(){
        this.setControlsMode(this.controlsMode === 'orbit' ? 'fly' : 'orbit');
    }

    _onKeyDown(event){
        if(event.code === 'KeyC'){
            this.toggleControlsMode();
        }
    }
    
    onWindowResize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    
    update(){
        if(this.controlsMode === 'fly'){
            this.flyControls.update(this.clock.getDelta());
        } else if(this.controls){
            this.controls.update();
        }
    }
    getCamera() {
        return this.camera
    }

    getControls() { //getter
        return this.controls;
    }
}
