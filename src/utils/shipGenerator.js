import * as THREE from 'three';
import { PartsShip } from './partsOfShip.js';
import {  SHIP_CONFIG  } from '../config/ship.js'

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
        const type_scout = SHIP_CONFIG.type.scout
        const type_assault = SHIP_CONFIG.type.assault
        this.ship = new THREE.Group(); 

        if(type_ship === type_scout){
            this.ship.scale.set(type_scout.width, 1, type_scout.height);
            console.log(this.ship)
        }

        let cabin = this.parts.createCabin();
        this.ship.add(cabin);
        this.scene.add(this.ship);
    }

    init(){
        console.log("Ship Generator created")
    }
}