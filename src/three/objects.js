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
const particleEffects = [];
const shockwaveEffects = [];

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

function createParticleBurst(scene3D, position, {
    particleCount,
    duration,
    color,
    size,
    sizeGrowth,
    delay = 0,
    opacity = 1,
    blending = THREE.AdditiveBlending,
    spread,
    speed,
    upwardSpeed,
    gravity,
    heightOffset
}) {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const particleSpeed = speed[0] + Math.random() * (speed[1] - speed[0]);

        positions[index] = position[0] + (Math.random() - 0.5) * spread;
        positions[index + 1] = GROUND_Y + position[1] + heightOffset;
        positions[index + 2] = position[2] + (Math.random() - 0.5) * spread;
        velocities[index] = Math.cos(angle) * particleSpeed;
        velocities[index + 1] = upwardSpeed[0] +
            Math.random() * (upwardSpeed[1] - upwardSpeed[0]);
        velocities[index + 2] = Math.sin(angle) * particleSpeed;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    const material = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: false,
        blending,
        sizeAttenuation: false
    });
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene3D.add(particles);
    particleEffects.push({
        particles,
        velocities,
        age: 0,
        duration,
        delay,
        gravity,
        size,
        sizeGrowth,
        opacity
    });
}

export function createCollisionDust(scene3D, position) {
    createParticleBurst(scene3D, position, {
        particleCount: 280,
        duration: 1.1,
        color: 0xffe1a3,
        size: 6,
        sizeGrowth: 5,
        spread: 0.32,
        speed: [0.7, 1.7],
        upwardSpeed: [0.55, 1.35],
        gravity: 0.8,
        heightOffset: 0.08
    });
}

export function createPlayerExplosion(scene3D, position) {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }

    objects.playerRoot.visible = false;
    createParticleBurst(scene3D, position, {
        particleCount: 120,
        duration: 0.9,
        color: 0xfff8d6,
        size: 15,
        sizeGrowth: 12,
        spread: 0.18,
        speed: [0.2, 1.0],
        upwardSpeed: [0.2, 1.2],
        gravity: 1.2,
        heightOffset: 0.3
    });
    createParticleBurst(scene3D, position, {
        particleCount: 360,
        duration: 3.2,
        delay: 0.03,
        color: 0xff4b1f,
        size: 12,
        sizeGrowth: 18,
        spread: 0.48,
        speed: [1.0, 3.8],
        upwardSpeed: [1.4, 4.2],
        gravity: 2.4,
        heightOffset: 0.3
    });
    createParticleBurst(scene3D, position, {
        particleCount: 220,
        duration: 2.6,
        delay: 0.08,
        color: 0xffd54f,
        size: 8,
        sizeGrowth: 9,
        spread: 0.28,
        speed: [1.4, 4.2],
        upwardSpeed: [1.0, 3.6],
        gravity: 3.0,
        heightOffset: 0.35
    });
    createParticleBurst(scene3D, position, {
        particleCount: 100,
        duration: 2.2,
        delay: 0.12,
        color: 0xd92d45,
        size: 5,
        sizeGrowth: 4,
        spread: 0.32,
        speed: [1.8, 4.8],
        upwardSpeed: [0.8, 2.5],
        gravity: 2.6,
        heightOffset: 0.25
    });

    const center = new THREE.Vector3(
        position[0],
        GROUND_Y + position[1] + 0.3,
        position[2]
    );
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 12),
        new THREE.MeshBasicMaterial({
            color: 0xfff3be,
            transparent: true,
            opacity: 1,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    core.position.copy(center);
    core.scale.setScalar(0.03);
    scene3D.add(core);
    shockwaveEffects.push({
        object: core,
        age: 0,
        delay: 0,
        duration: 0.48,
        startScale: 0.03,
        endScale: 0.9
    });

    for (const [color, delay, duration, endScale] of [
        [0xfff0a1, 0.02, 1.0, 4.2],
        [0xff8a35, 0.14, 1.25, 5.2],
        [0xff392f, 0.28, 1.4, 6.0]
    ]) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.035, 8, 48),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.95,
                depthTest: false,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        ring.position.set(position[0], GROUND_Y + position[1] + 0.06, position[2]);
        ring.rotation.x = -Math.PI / 2;
        ring.scale.setScalar(0.08);
        scene3D.add(ring);
        shockwaveEffects.push({
            object: ring,
            age: 0,
            delay,
            duration,
            startScale: 0.08,
            endScale
        });
    }
}

export function resetPlayerVisual() {
    if (!objects.playerRoot) {
        throw new Error('Obiekt gracza Three.js nie został utworzony');
    }
    objects.playerRoot.visible = true;
}

export function updateParticleEffects(scene3D, dt) {
    for (let i = particleEffects.length - 1; i >= 0; i--) {
        const effect = particleEffects[i];
        effect.age += dt;
        if (effect.age < effect.delay) continue;
        if (effect.age >= effect.delay + effect.duration) {
            scene3D.remove(effect.particles);
            effect.particles.geometry.dispose();
            effect.particles.material.dispose();
            particleEffects.splice(i, 1);
            continue;
        }

        const progress = (effect.age - effect.delay) / effect.duration;
        const positions = effect.particles.geometry.attributes.position;
        for (let particle = 0; particle < positions.count; particle++) {
            const index = particle * 3;
            effect.velocities[index + 1] -= effect.gravity * dt;
            positions.array[index] += effect.velocities[index] * dt;
            positions.array[index + 1] += effect.velocities[index + 1] * dt;
            positions.array[index + 2] += effect.velocities[index + 2] * dt;
        }
        positions.needsUpdate = true;
        effect.particles.material.opacity = effect.opacity * (1 - progress);
        effect.particles.material.size =
            effect.size + progress * effect.sizeGrowth;
    }

    for (let i = shockwaveEffects.length - 1; i >= 0; i--) {
        const effect = shockwaveEffects[i];
        effect.age += dt;
        if (effect.age < effect.delay) continue;
        if (effect.age >= effect.delay + effect.duration) {
            scene3D.remove(effect.object);
            effect.object.geometry.dispose();
            effect.object.material.dispose();
            shockwaveEffects.splice(i, 1);
            continue;
        }

        const progress = (effect.age - effect.delay) / effect.duration;
        const scale = THREE.MathUtils.lerp(
            effect.startScale,
            effect.endScale,
            progress
        );
        effect.object.scale.setScalar(scale);
        effect.object.material.opacity = (1 - progress) ** 1.5;
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
