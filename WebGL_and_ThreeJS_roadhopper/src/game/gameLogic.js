
import { rows, scene } from './sceneData.js';

const STEP = 0.35;
export const CAR_TRACK_EDGE = 2.75;

export function updateCars(dt) {
    const edge = CAR_TRACK_EDGE;
    const trackLength = 2 * edge;
    for (const car of scene.cars) {
        car.position[0] += car.speed * dt;
        // Płynne zawijanie z zachowaniem stałego odstępu między autami
        if (car.speed > 0 && car.position[0] > edge) {
            car.position[0] -= trackLength;
        } else if (car.speed < 0 && car.position[0] < -edge) {
            car.position[0] += trackLength;
        }
    }
}

export function checkTreeCollision(x, z) {
    const thresholdX = 0.18;
    const thresholdZ = 0.18;
    return scene.trees.some(tree => {
        const dx = Math.abs(x - tree.position[0]);
        const dz = Math.abs(z - tree.position[2]);
        return dx < thresholdX && dz < thresholdZ;
    });
}

export function movePlayer(key) {
    const p = scene.player.position;
    const stepX = 0.25;
    const limitX = 1.25; // Powiększone pole manewru gracza na boki

    let targetX = p[0];
    let targetZ = p[2];

    if (key === 'ArrowLeft') targetX = Math.max(-limitX, p[0] - stepX);
    if (key === 'ArrowRight') targetX = Math.min(limitX, p[0] + stepX);

    const lanes = rows.map(row => row.z).sort((a, b) => b - a);
    const index = lanes.findIndex(z => Math.abs(z - p[2]) < 0.001);
    if (key === 'ArrowUp' && index >= 0 && index < lanes.length - 1) {
        const nextZ = lanes[index + 1];
        if (Math.abs(nextZ - p[2]) <= STEP + 0.001) {
            targetZ = nextZ;
        }
    }
    if (key === 'ArrowDown' && index > 0) {
        const nextZ = lanes[index - 1];
        if (Math.abs(nextZ - p[2]) <= STEP + 0.001) {
            targetZ = nextZ;
        }
    }

    // Blokada wykonania ruchu, jeśli docelowa pozycja koliduje z drzewem (bez utraty życia)
    if (!checkTreeCollision(targetX, targetZ)) {
        p[0] = targetX;
        p[2] = targetZ;
    }
}
