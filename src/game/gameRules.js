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
const startSpeeds = scene.cars.map(car => car.speed);
const startCarSpeeds = startSpeeds;
const lanes = rows.map(row => row.z).sort((a, b) => b - a);

export function applySpeedIncrease() {
    // Każde 10 punktów zwiększa prędkość aut o 25% (kierunek/znak prędkości zostaje zachowany)
    const factor = 1 + (gameState.score * 0.025);
    gameState.speedMultiplier = factor;
    scene.cars.forEach((car, index) => {
        const baseSpeed = index < startSpeeds.length
            ? startSpeeds[index]
            : car.baseSpeed;
        car.speed = baseSpeed * factor;
    });
}
export const updateDifficulty = applySpeedIncrease;

export function checkCollision() {
    const player = scene.player.position;
    const halfPlayerX = 0.10;
    const halfCarX = 0.22;
    const halfPlayerZ = 0.10;
    const halfCarZ = 0.12;

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

    const row = rows.find(r =>
        Math.abs(r.z - scene.player.position[2]) < 0.001
    );
    const lane = row?.laneIndex ?? -1;

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
}

export function restartGame() {
    scene.player.position.splice(0, 3, ...startPlayer);
    scene.cars.slice(0, startCars.length).forEach((car, index) => {
        car.position.splice(0, 3, ...startCars[index]);
        car.speed = startSpeeds[index];
    });
    gameState.status = 'playing';
    gameState.score = 0;
    gameState.bestLane = 0;
    gameState.lives = gameState.maxLives;
    gameState.speedMultiplier = 1.0;
    // Zadanie 3: gameState.bestScore pozostaje zachowany po restarcie gry
}
