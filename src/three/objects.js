import * as THREE from 'three';
import { rows, scene as gameScene } from '../game/sceneData.js';
import { makeInstance } from './modelLoader.js';

export const GROUND_Y = -0.45;
export const BOARD_WIDTH = 5.0;

export const objects = {
    playerRoot: null,
    cars: [],
    trees: [],
    rows: new Map(),
};

const playerRotations = {
    ArrowUp: Math.PI,
    ArrowDown: 0,
    ArrowLeft: -Math.PI / 2,
    ArrowRight: Math.PI / 2
};

const JUMP_DURATION = 0.25;
let targetRotation = Math.PI;
let jumpTime = 0;
let jumpStartX = 0;
let jumpStartZ = 0;
let jumpOffsetX = 0;
let jumpOffsetZ = 0;
let jumpHeight = 0;

const rowGeometry = new THREE.BoxGeometry(BOARD_WIDTH, 0.04, 0.35);
const rowMaterials = {
    road: new THREE.MeshBasicMaterial({ color: 0x30323a }),
    grass: new THREE.MeshBasicMaterial({ color: 0x2ba344 }),
};
const lineGeometry = new THREE.BoxGeometry(0.15, 0.006, 0.018);
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

export function addRowVisual(scene3D, row) {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(rowGeometry, rowMaterials[row.type]);
    mesh.position.set(0, GROUND_Y - 0.02, row.z);
    root.add(mesh);

    const previous = rows.find(r => r.laneIndex === row.laneIndex - 1);
    if (row.type === 'road' && previous?.type === 'road' &&
        Math.abs(previous.z - row.z - 0.35) < 0.001) {
        const lineZ = (previous.z + row.z) / 2;
        for (let x = -2.25; x <= 2.25; x += 0.30) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(x, GROUND_Y + 0.003, lineZ);
            root.add(line);
        }
    }
    scene3D.add(root);
    objects.rows.set(row.laneIndex, root);
}

export function createBasicObjects(scene3D, catTemplate) {
    for (const row of rows) {
        addRowVisual(scene3D, row);
    }

    const playerRoot = makeInstance(catTemplate, 0.37);
    playerRoot.rotation.y = targetRotation;
    scene3D.add(playerRoot);
    objects.playerRoot = playerRoot;
}

export function orientPlayer(key) {
    const rotation = playerRotations[key];
    if (rotation === undefined) return;
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    targetRotation = rotation;
}

export function startPlayerJump(targetX, targetZ) {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    jumpStartX = objects.playerRoot.position.x - targetX;
    jumpStartZ = objects.playerRoot.position.z - targetZ;
    jumpTime = JUMP_DURATION;
}

export function resetPlayerJump() {
    jumpTime = 0;
    jumpStartX = 0;
    jumpStartZ = 0;
    jumpOffsetX = 0;
    jumpOffsetZ = 0;
    jumpHeight = 0;
}

export function updatePlayerAnimation(dt) {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    const angle = objects.playerRoot.rotation.y;
    const difference = Math.atan2(
        Math.sin(targetRotation - angle),
        Math.cos(targetRotation - angle)
    );
    objects.playerRoot.rotation.y = THREE.MathUtils.lerp(
        angle,
        angle + difference,
        1 - Math.exp(-15 * dt)
    );

    if (jumpTime <= 0) return;

    jumpTime = Math.max(0, jumpTime - dt);
    const progress = 1 - jumpTime / JUMP_DURATION;
    jumpOffsetX = THREE.MathUtils.lerp(jumpStartX, 0, progress);
    jumpOffsetZ = THREE.MathUtils.lerp(jumpStartZ, 0, progress);
    jumpHeight = Math.sin(progress * Math.PI) * 0.12;
}

export function addCarVisual(scene3D, car, carTemplate) {
    const root = makeInstance(carTemplate, 0.40);
    root.rotation.y = car.speed < 0 ? -Math.PI / 2 : Math.PI / 2;
    scene3D.add(root);
    objects.cars.push(root);
}

export function addTreeVisual(scene3D, tree, treeTemplate) {
    const root = makeInstance(treeTemplate, 0.70);
    scene3D.add(root);
    objects.trees.push(root);
}

export function addModels(scene3D, carTemplate, treeTemplate, newTreeTemplate) {
    for (const car of gameScene.cars) {
        addCarVisual(scene3D, car, carTemplate);
    }

    for (const tree of gameScene.trees) {
        const template = tree.model === 'drzewko' && newTreeTemplate
            ? newTreeTemplate
            : treeTemplate;
        addTreeVisual(scene3D, tree, template);
    }
}

export function syncObjects() {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    const player = gameScene.player.position;
    objects.playerRoot.position.set(
        player[0] + jumpOffsetX,
        GROUND_Y + player[1] + jumpHeight,
        player[2] + jumpOffsetZ
    );

    gameScene.cars.forEach((car, index) => {
        const root = objects.cars[index];
        if (!root) return;

        const position = car.position;
        root.position.set(
            position[0], GROUND_Y + position[1], position[2]
        );
    });

    gameScene.trees.forEach((tree, index) => {
        const root = objects.trees[index];
        if (!root) return;

        const position = tree.position;
        root.position.set(
            position[0], GROUND_Y + position[1], position[2]
        );
    });
}
