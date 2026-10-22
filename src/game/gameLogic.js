import { rows, scene } from './sceneData.js';

export function updateCars(dt) {
    const edge = 1.25;
    for (const car of scene.cars) {
        car.position[0] += car.speed * dt;
        if (car.speed > 0 && car.position[0] > edge) {
            car.position[0] = -edge;
        } else if (car.speed < 0 && car.position[0] < -edge) {
            car.position[0] = edge;
        }
    }
}

export function movePlayer(key) {
    const p = scene.player.position;
    const stepX = 0.25;
    const limitX = 0.75;

    if (key === 'ArrowLeft') p[0] = Math.max(-limitX, p[0] - stepX);
    if (key === 'ArrowRight') p[0] = Math.min( limitX, p[0] + stepX);

    const lanes = rows.map(row => row.z).sort((a, b) => b - a);
    const index = lanes.findIndex(z => Math.abs(z - p[2]) < 0.001);
    if (key === 'ArrowUp' && index >= 0 && index < lanes.length - 1) {
        p[2] = lanes[index + 1];
    }
    if (key === 'ArrowDown' && index > 0) {
        p[2] = lanes[index - 1];
    }
}
