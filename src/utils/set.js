import * as THREE from 'three';

export class Set{
    constructor(scene){
        this.scene = scene;
    }

    createAllHelpers(){
        // this._createGridHelper();
        // this._createAxesHelper();
    }

    createAllMeshes(){
        // this._createCubeMesh();
        // this._createCustomMesh();
        // this._createTorusKnot();
    }

    //====================
    // ПОМОЩНИКИ
    //====================

    _createGridHelper(){
        const gridHelper = new THREE.GridHelper(
            20, 
            20, 
            'cyan', 
            'cyan', 
            0x00ffc3);
        this.scene.add(gridHelper);
    }

    _createAxesHelper(){
        const axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add( axesHelper );
    }

    //====================
    // КОМПОНЕНТЫ СЦЕНЫ
    //====================
    _createCubeMesh(){
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshStandardMaterial( { color: 0xffff00 } );
        material.transparent = true;
        material.opacity = 1;
        const mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = 45;
        mesh.position.y = 3;
        this.scene.add( mesh );
    }

    _createCustomMesh(){
        const geometry = new THREE.BufferGeometry();
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        const vertices = new Float32Array( [
            -1.0, -1.0,  1.0, // v0
            1.0, -1.0,  1.0, // v1
            1.0,  1.0,  1.0, // v2
            1.0,  1.0,  1.0, // v3
            -1.0,  1.0,  1.0, // v4
            -1.0, -1.0,  1.0  // v5
        ] );
        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        material.side = 2;
        const mesh = new THREE.Mesh( geometry, material );
        this.scene.add(mesh);
    }

    _createTorusKnot(){
        const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        const torusKnot = new THREE.Mesh( geometry, material );
        geometry.radius = 12;
        geometry.tube = 3;
        geometry.tubularSegments = 170;
        geometry.radialSegments = 15;
        geometry.p = 1;
        geometry.q = 4;
        this.scene.add( torusKnot );
    }
}
