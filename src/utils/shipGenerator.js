import * as THREE from 'three';
import { PartsShip } from './partsOfShip.js';
import { SHIP_CONFIG } from '../config/ship.js'

// Класс создания корабля из частей
export class ShipGenerator{ // нужно экспортировать для видимости
    constructor(scene){
        this.scene = scene;
        this.ship = null;
        this.parts = new PartsShip();

        // после выполнения кода (создания корабля) - автоматически перейдёт к init
        // this.init()
    }

    createShip(type_ship){
        const shipConfig = SHIP_CONFIG.type[type_ship];
        this.ship = new THREE.Group(); 

        if(shipConfig){
            this.ship.scale.setScalar(shipConfig.radius);
        }

        const cabin = this.parts.createCabin();
        this.ship.add(cabin);
        this.scene.add(this.ship);
        return cabin;
    }

    init(){
        console.log("Ship Generator created")
    }
}
