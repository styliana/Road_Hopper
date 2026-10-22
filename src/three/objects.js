import * as THREE from 'three';
import { rows, scene as gameScene } from '../game/sceneData.js';
import { makeInstance } from './modelLoader.js';

export const GROUND_Y = -0.45;

export const objects = {
    playerRoot: null,
    cars: [],
    trees: []
};

const playerRotations = {
    ArrowUp: Math.PI,
    ArrowDown: 0,
    ArrowLeft: -Math.PI / 2,
    ArrowRight: Math.PI / 2
};

export function createBasicObjects(scene3D, catTemplate) {
    const rowGeometry = new THREE.BoxGeometry(3.2, 0.04, 0.68);
    const rowMaterials = new Map();

    for (const row of rows) {
        const color = row.color
            ? new THREE.Color().setRGB(...row.color, THREE.SRGBColorSpace)
            : new THREE.Color(row.type === 'road' ? 0x30323a : 0x2ba344);
        const colorKey = color.getHex();
        let material = rowMaterials.get(colorKey);
        if (!material) {
            material = new THREE.MeshBasicMaterial({ color });
            rowMaterials.set(colorKey, material);
        }

        const rowMesh = new THREE.Mesh(rowGeometry, material);
        rowMesh.position.set(0, GROUND_Y - 0.02, row.z);
        scene3D.add(rowMesh);
    }

    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markingGeometry = new THREE.BoxGeometry(0.14, 0.01, 0.03);
    for (let x = -1.35; x <= 1.35; x += 0.30) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.position.set(x, GROUND_Y + 0.005, -0.35);
        scene3D.add(marking);
    }

    const playerRoot = makeInstance(catTemplate, 0.37);
    playerRoot.rotation.y = Math.PI;
    scene3D.add(playerRoot);
    objects.playerRoot = playerRoot;
}

export function orientPlayer(key) {
    const rotation = playerRotations[key];
    if (rotation === undefined) return;
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    objects.playerRoot.rotation.y = rotation;
}

export function addModels(scene3D, carTemplate, treeTemplate, newTreeTemplate) {
    for (const car of gameScene.cars) {
        const root = makeInstance(carTemplate, 0.44);
        root.rotation.y = car.speed > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene3D.add(root);
        objects.cars.push(root);
    }

    for (const tree of gameScene.trees) {
        const template = tree.model === 'drzewko'
            ? newTreeTemplate
            : treeTemplate;
        const root = makeInstance(template, 0.70);
        scene3D.add(root);
        objects.trees.push(root);
    }
}

export function syncObjects() {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    const player = gameScene.player.position;
    objects.playerRoot.position.set(
        player[0], GROUND_Y + player[1], player[2]
    );

    gameScene.cars.forEach((car, index) => {
        const root = objects.cars[index];
        if (!root) throw new Error(`Brak modelu Three.js dla samochodu ${index}`);

        const position = car.position;
        root.position.set(
            position[0], GROUND_Y + position[1], position[2]
        );
    });

    gameScene.trees.forEach((tree, index) => {
        const root = objects.trees[index];
        if (!root) throw new Error(`Brak modelu Three.js dla drzewa ${index}`);

        const position = tree.position;
        root.position.set(
            position[0], GROUND_Y + position[1], position[2]
        );
    });
}