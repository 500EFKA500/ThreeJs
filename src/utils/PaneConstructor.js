import { Pane } from 'tweakpane';

export class PaneConstructor {
    constructor(object) {
        this.object = object;
        this.pane = new Pane({
            title: 'Ship',
        });

        this.targetPosition = {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z,
        };

        this.targetRotation = {
            x: this.radiansToDegrees(object.rotation.x),
            y: this.radiansToDegrees(object.rotation.y),
            z: this.radiansToDegrees(object.rotation.z),
        };

        this.speed = 0.08;
    }

    addAllPanels() {
        const positionFolder = this.pane.addFolder({ title: 'position' });
        const rotationFolder = this.pane.addFolder({ title: 'rotation' });

        this.addPositionPane(this.targetPosition, positionFolder);
        this.addRotationPane(this.targetRotation, rotationFolder);
    }

    addPositionPane(obj, folder) {
        folder.addBinding(obj, 'x', {
            min: -8,
            max: 8,
            step: 0.1,
        });

        folder.addBinding(obj, 'y', {
            min: -8,
            max: 8,
            step: 0.1,
        });

        folder.addBinding(obj, 'z', {
            min: -8,
            max: 8,
            step: 0.1,
        });
    }

    addRotationPane(obj, folder) {
        folder.addBinding(obj, 'x', {
            label: 'rx',
            min: -180,
            max: 180,
            step: 1,
        });

        folder.addBinding(obj, 'y', {
            label: 'ry',
            min: -180,
            max: 180,
            step: 1,
        });

        folder.addBinding(obj, 'z', {
            label: 'rz',
            min: -180,
            max: 180,
            step: 1,
        });
    }

    update() {
        this.object.position.x += (this.targetPosition.x - this.object.position.x) * this.speed;
        this.object.position.y += (this.targetPosition.y - this.object.position.y) * this.speed;
        this.object.position.z += (this.targetPosition.z - this.object.position.z) * this.speed;

        this.object.rotation.x += (this.degreesToRadians(this.targetRotation.x) - this.object.rotation.x) * this.speed;
        this.object.rotation.y += (this.degreesToRadians(this.targetRotation.y) - this.object.rotation.y) * this.speed;
        this.object.rotation.z += (this.degreesToRadians(this.targetRotation.z) - this.object.rotation.z) * this.speed;
    }

    setTargetPosition(position) {
        this.targetPosition.x = position.x;
        this.targetPosition.y = position.y;
        this.targetPosition.z = position.z;
        this.pane.refresh();
    }

    degreesToRadians(value) {
        return Number(value) * Math.PI / 180;
    }

    radiansToDegrees(value) {
        return value * 180 / Math.PI;
    }
}
