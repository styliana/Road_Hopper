import { rows, scene } from './sceneData.js';

export const gameState = {
    status: 'playing', // 'playing', 'lost' lub 'won'
    score: 0,
    bestScore: 0,      // Zadanie 3: licznik najlepszego wyniku (High Score)
    bestLane: 0,
    lives: 3,
    maxLives: 3,
    speedMultiplier: 1.0
};

const startPlayer = [...scene.player.position];
const startCars = scene.cars.map(car => [...car.position]);
const startCarSpeeds = scene.cars.map(car => car.speed);
const lanes = rows.map(row => row.z).sort((a, b) => b - a);

export function applySpeedIncrease() {
    // Każde 10 punktów zwiększa prędkość aut o 25% (kierunek/znak prędkości zostaje zachowany)
    const multiplier = 1 + (gameState.score * 0.025);
    gameState.speedMultiplier = multiplier;
    scene.cars.forEach((car, index) => {
        car.speed = startCarSpeeds[index] * multiplier;
    });
}

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

export function updateGameState() {
    if (gameState.status !== 'playing') return;

    if (checkCollision()) {
        gameState.lives -= 1;
        // Przeniesienie gracza na pole startowe po kolizji
        scene.player.position.splice(0, 3, ...startPlayer);

        // Przegrana następuje dopiero po utracie wszystkich żyć
        if (gameState.lives <= 0) {
            gameState.status = 'lost';
        }
        return;
    }

    const lane = lanes.findIndex(z =>
        Math.abs(z - scene.player.position[2]) < 0.001
    );

    if (lane > gameState.bestLane) {
        gameState.score += (lane - gameState.bestLane) * 10;
        gameState.bestLane = lane;
        // Zadanie 3: Aktualizacja rekordu, jeśli gracz uzyska więcej punktów niż dotychczas
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
        }
        // Zadanie 2: Stopniowe zwiększanie prędkości aut wraz z punktami
        applySpeedIncrease();
    }

    if (lane === lanes.length - 1) {
        gameState.status = 'won';
    }
}

export function restartGame() {
    scene.player.position.splice(0, 3, ...startPlayer);
    scene.cars.forEach((car, index) => {
        car.position.splice(0, 3, ...startCars[index]);
        // Zadanie 2: Przywrócenie prędkości początkowych
        car.speed = startCarSpeeds[index];
    });
    gameState.status = 'playing';
    gameState.score = 0;
    gameState.bestLane = 0;
    gameState.lives = gameState.maxLives;
    gameState.speedMultiplier = 1.0;
    // Zadanie 3: gameState.bestScore pozostaje zachowany po restarcie gry
}
