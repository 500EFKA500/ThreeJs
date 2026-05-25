import * as THREE from 'three';

export class SkySettings{
    constructor(scene){
        this.scene = scene;
    }

    init(){

    }

    createStars(){
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        const spriteUrl = new URL('../../textures/sprites/disc.png', import.meta.url).href;
        const sprite = new THREE.TextureLoader().load(spriteUrl);
        sprite.colorSpace = THREE.SRGBColorSpace;

        for ( let i = 0; i < 10000; i ++ ) {

            const x = 2000 * Math.random() - 1000;
            const y = 2000 * Math.random() - 1000;
            const z = 2000 * Math.random() - 1000;

            vertices.push( x, y, z );

        }

        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

        const material = new THREE.PointsMaterial( { size: 5, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
        material.color.setHSL( 0.6, 0.2, 0.95 );

        const particles = new THREE.Points( geometry, material );
        this.scene.add( particles );
    }
}