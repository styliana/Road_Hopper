import { rows, scene } from './sceneData.js';

export const gameState = {
    status: 'playing', // playing, lost lub won
    score: 0,
    bestLane: 0
};

const startPlayer = [...scene.player.position];
const startCars = scene.cars.map(car => [...car.position]);
const lanes = rows.map(row => row.z).sort((a, b) => b - a);

export function checkCollision() {
    const player = scene.player.position;
    const halfPlayerX = 0.09;
    const halfCarX = 0.20;
    const halfPlayerZ = 0.09;
    const halfCarZ = 0.11;

    return scene.cars.some(car => {
        const dx = Math.abs(player[0] - car.position[0]);
        const dz = Math.abs(player[2] - car.position[2]);
        return dx < halfPlayerX + halfCarX &&
               dz < halfPlayerZ + halfCarZ;
    });
}
