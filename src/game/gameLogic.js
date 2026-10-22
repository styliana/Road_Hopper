import { scene } from './sceneData.js';

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
