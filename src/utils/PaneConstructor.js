import * as THREE from 'three';
import {Pane} from 'tweakpane'

export class PaneConstructor{
    constructor(scene){
        this.pane = new Pane();
        this.scene = scene;
    }

    createFolder(name){
        const folder = this.pane.addFolder({
            title: `${name}`,
            expanded: false,
        });
        return folder;
    }

    addAllPanels(obj){
        this.addPositionPane(obj, this.createFolder(`${obj.name} position`));
        this.addRotationPane(obj, this.createFolder(`${obj.name} position`))
    }

    addPositionPane(obj, folder){
        folder.addBinding(obj.position, 'x', {min: -10, max: 10, step: 0.01, label: 'POS X'})
        folder.addBinding(obj.position, 'y', {min: -10, max: 10, step: 0.01, label: 'POS Y'})
        folder.addBinding(obj.position, 'z', {min: -10, max: 10, step: 0.01, label: 'POS Z'})
    }

    addRotationPane(obj, folder){
        folder.addBinding(obj.rotation, 'x', {min: -180, max: 180, step: 0.01, label: 'ROT X'})
        folder.addBinding(obj.rotation, 'y', {min: -10, max: 10, step: 0.01, label: 'ROT Y'})
        folder.addBinding(obj.rotation, 'z', {min: -10, max: 10, step: 0.01, label: 'ROT Z'})
    }
}