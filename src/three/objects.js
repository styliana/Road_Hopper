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
const collisionDustEffects = [];

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

export function createCollisionDust(scene3D, position) {
    const particleCount = 280;
    const duration = 1.1;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.7 + Math.random() * 1.0;

        positions[index] = position[0] + (Math.random() - 0.5) * 0.32;
        positions[index + 1] = GROUND_Y + position[1] + 0.08;
        positions[index + 2] = position[2] + (Math.random() - 0.5) * 0.32;
        velocities[index] = Math.cos(angle) * speed;
        velocities[index + 1] = 0.55 + Math.random() * 0.8;
        velocities[index + 2] = Math.sin(angle) * speed;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    const material = new THREE.PointsMaterial({
        color: 0xffe1a3,
        size: 0.4,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(geometry, material);
    scene3D.add(particles);
    collisionDustEffects.push({
        particles,
        velocities,
        age: 0,
        duration
    });
}

export function updateCollisionDust(scene3D, dt) {
    for (let i = collisionDustEffects.length - 1; i >= 0; i--) {
        const effect = collisionDustEffects[i];
        effect.age += dt;
        if (effect.age >= effect.duration) {
            scene3D.remove(effect.particles);
            effect.particles.geometry.dispose();
            effect.particles.material.dispose();
            collisionDustEffects.splice(i, 1);
            continue;
        }

        const progress = effect.age / effect.duration;
        const positions = effect.particles.geometry.attributes.position;
        for (let particle = 0; particle < positions.count; particle++) {
            const index = particle * 3;
            effect.velocities[index + 1] -= 0.8 * dt;
            positions.array[index] += effect.velocities[index] * dt;
            positions.array[index + 1] += effect.velocities[index + 1] * dt;
            positions.array[index + 2] += effect.velocities[index + 2] * dt;
        }
        positions.needsUpdate = true;
        effect.particles.material.opacity = 1 - progress;
        effect.particles.material.size = 0.4 + progress * 0.18;
    }
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
