import * as THREE from 'three';

export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
    }

    add(object) {
        if (!object || this.colliders.some((collider) => collider.object === object)) {
            return;
        }

        if (!this._canCollide(object)) {
            return;
        }

        this.colliders.push({
            object,
            box: new THREE.Box3(),
            previousPosition: object.position.clone(),
        });
    }

    addSceneObjects() {
        this.scene.children.forEach((object) => {
            this.add(object);
        });
    }

    update() {
        this.colliders = this.colliders.filter((collider) => collider.object.parent);

        this.colliders.forEach((collider) => {
            collider.box.setFromObject(collider.object);
        });
    }

    capturePreviousPositions() {
        this.colliders.forEach((collider) => {
            collider.previousPosition.copy(collider.object.position);
        });
    }

    hasCollision(object) {
        const collider = this._getCollider(object);

        if (!collider || collider.box.isEmpty()) {
            return false;
        }

        return this.colliders.some((other) => {
            if (other === collider || other.box.isEmpty()) {
                return false;
            }

            return collider.box.intersectsBox(other.box);
        });
    }

    resolveObjectPosition(object, previousPosition) {
        this.update();

        if (!this.hasCollision(object)) {
            return false;
        }

        object.position.copy(previousPosition);
        this.update();
        return true;
    }

    getCollisions() {
        this.update();

        const collisions = [];

        for (let i = 0; i < this.colliders.length; i += 1) {
            const first = this.colliders[i];

            if (first.box.isEmpty()) {
                continue;
            }

            for (let j = i + 1; j < this.colliders.length; j += 1) {
                const second = this.colliders[j];

                if (!second.box.isEmpty() && first.box.intersectsBox(second.box)) {
                    collisions.push([first.object, second.object]);
                }
            }
        }

        return collisions;
    }

    resolveMovedObjects() {
        this.update();

        const resolvedObjects = new Set();

        for (let i = 0; i < this.colliders.length; i += 1) {
            const first = this.colliders[i];

            if (first.box.isEmpty()) {
                continue;
            }

            for (let j = i + 1; j < this.colliders.length; j += 1) {
                const second = this.colliders[j];

                if (second.box.isEmpty() || !first.box.intersectsBox(second.box)) {
                    continue;
                }

                this._rollbackIfMoved(first, resolvedObjects);
                this._rollbackIfMoved(second, resolvedObjects);
                this.update();
            }
        }

        return resolvedObjects;
    }

    _getCollider(object) {
        return this.colliders.find((collider) => collider.object === object);
    }

    _canCollide(object) {
        if (object.isLight || object.isCamera || object.isHelper || object.isPoints) {
            return false;
        }

        let hasMesh = object.isMesh;

        object.traverse((child) => {
            if (child.isMesh) {
                hasMesh = true;
            }
        });

        return hasMesh;
    }

    _rollbackIfMoved(collider, resolvedObjects) {
        if (collider.object.position.distanceToSquared(collider.previousPosition) === 0) {
            return;
        }

        collider.object.position.copy(collider.previousPosition);
        resolvedObjects.add(collider.object);
    }
}
