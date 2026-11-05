import * as THREE from 'three';
import { scene } from './game/sceneData.js';
import { updateCars, movePlayer } from './game/gameLogic.js';
import {
    gameState, updateGameState, restartGame
} from './game/gameRules.js';
import { countTriangles, loadTemplate } from './three/modelLoader.js';
import {
    addModels, createBasicObjects, createCollisionDust, createPlayerExplosion,
    orientPlayer, resetPlayerJump, resetPlayerVisual, startPlayerJump,
    syncObjects, updateParticleEffects, updatePlayerAnimation
} from './three/objects.js';
import {
    prepareWorld, extendWorld, resetWorld
} from './three/world.js';

const GAME_MODE = 'endless';

const canvas = document.querySelector('#gameCanvas');
const scoreLabel = document.querySelector('#score');
const bestScoreLabel = document.querySelector('#bestScore');
const speedLabel = document.querySelector('#speed');
const livesLabel = document.querySelector('#lives');
const statusLabel = document.querySelector('#status');
const gameOverOverlay = document.querySelector('#gameOverOverlay');
const gameOverMessage = document.querySelector('#gameOverMessage');
const gameOverScore = document.querySelector('#gameOverScore');
const explosionFlash = document.querySelector('#explosionFlash');
const explosionBurst = document.querySelector('#explosionBurst');
const hud = document.querySelector('#hud');

const scene3D = new THREE.Scene();
scene3D.background = new THREE.Color(0x141b26);

const renderer3D = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer3D.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer3D.outputColorSpace = THREE.SRGBColorSpace;

const camera3D = new THREE.OrthographicCamera(-3, 3, 2.2, -2.2, 0.1, 100);
camera3D.position.set(0, 2.4, 3.2);
const cameraTarget = new THREE.Vector3(0, -0.3, scene.player.position[2] - 1.05);
camera3D.lookAt(cameraTarget);
const DEFAULT_CAMERA_ZOOM = 2.2;
const GAME_OVER_DURATION = 5;
let cameraZoom = DEFAULT_CAMERA_ZOOM;
let gameOverElapsed = 0;
let gameOverCameraStartPosition = null;
let gameOverTargetPosition = null;
let gameOverCameraStartTarget = null;
let gameOverFocus = null;

scene3D.add(new THREE.AmbientLight(0xffffff, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 2.0);
light.position.set(-2, 5, 4);
scene3D.add(light);

function updateFollowCamera(dt) {
    const p = scene.player.position;
    const alpha = 1 - Math.exp(-5 * dt);
    const wantedPosition = new THREE.Vector3(p[0] * 0.25 + 2.0, 3, p[2] + 2.5);
    const wantedTarget = new THREE.Vector3(p[0] * 0.25, -0.3, p[2] - 1.05);
    camera3D.position.lerp(wantedPosition, alpha);
    cameraTarget.lerp(wantedTarget, alpha);
    camera3D.lookAt(cameraTarget);
}

function resetFollowCamera() {
    const p = scene.player.position;
    camera3D.position.set(p[0] * 0.25 + 2.0, 3, p[2] + 2.5);
    cameraTarget.set(p[0] * 0.25, -0.3, p[2] - 1.05);
    cameraZoom = DEFAULT_CAMERA_ZOOM;
    camera3D.lookAt(cameraTarget);
}

function startGameOverSequence(position) {
    gameOverElapsed = 0;
    gameOverCameraStartPosition = camera3D.position.clone();
    gameOverCameraStartTarget = cameraTarget.clone();
    gameOverFocus = new THREE.Vector3(
        position[0],
        -0.15,
        position[2]
    );
    gameOverTargetPosition = new THREE.Vector3(
        position[0] + 0.8,
        1.1,
        position[2] + 1.7
    );
    if (gameOverOverlay) gameOverOverlay.hidden = false;
    if (explosionBurst) {
        explosionBurst.classList.remove('active');
        void explosionBurst.offsetWidth;
        explosionBurst.classList.add('active');
    }
    if (gameOverScore) gameOverScore.textContent = `Wynik: ${gameState.score}`;
    if (gameOverMessage) gameOverMessage.textContent = 'Ostatnie zderzenie...';
}

function updateGameOverSequence(dt) {
    gameOverElapsed += dt;
    const zoomProgress = Math.min(gameOverElapsed / 0.55, 1);
    const easedProgress = 1 - (1 - zoomProgress) ** 3;

    camera3D.position.lerpVectors(
        gameOverCameraStartPosition,
        gameOverTargetPosition,
        easedProgress
    );
    cameraTarget.lerpVectors(
        gameOverCameraStartTarget,
        gameOverFocus,
        easedProgress
    );
    cameraZoom = THREE.MathUtils.lerp(
        DEFAULT_CAMERA_ZOOM,
        0.72,
        easedProgress
    );
    const shake = Math.exp(-gameOverElapsed * 3.2) *
        Math.max(0, 1 - gameOverElapsed / 1.6);
    camera3D.position.x += Math.sin(gameOverElapsed * 58) * 0.12 * shake;
    camera3D.position.y += Math.cos(gameOverElapsed * 47) * 0.08 * shake;
    camera3D.lookAt(cameraTarget);
    if (explosionFlash) {
        const flash = Math.max(0, 1 - gameOverElapsed / 0.32);
        const afterglow = Math.max(0, 1 - Math.abs(gameOverElapsed - 0.28) / 0.22);
        explosionFlash.style.opacity = String(Math.max(flash * 0.85, afterglow * 0.3));
    }

    if (gameOverElapsed >= GAME_OVER_DURATION) {
        gameState.status = 'lost';
        if (gameOverMessage) {
            gameOverMessage.textContent = 'Naciśnij R, aby zagrać ponownie.';
        }
    }
}

function render() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer3D.setSize(width, height, false);

    const aspect = width / height;
    camera3D.left = -cameraZoom * aspect;
    camera3D.right = cameraZoom * aspect;
    camera3D.top = cameraZoom;
    camera3D.bottom = -cameraZoom;
    camera3D.updateProjectionMatrix();
    syncObjects();
    renderer3D.render(scene3D, camera3D);
}

function updateHud() {
    if (hud) {
        hud.classList.toggle('game-over-active', gameState.status === 'gameOver');
    }
    if (statusOverlay) {
        statusOverlay.classList.toggle('game-over-active', gameState.status !== 'playing');
    }
    scoreLabel.textContent = `Punkty: ${gameState.score}`;
    if (bestScoreLabel) {
        bestScoreLabel.textContent = `Najlepszy wynik: ${gameState.bestScore}`;
    }
    if (speedLabel) {
        speedLabel.textContent = `Prędkość aut: ${gameState.speedMultiplier.toFixed(2)}x`;
    }
    if (livesLabel) {
        const hearts = '❤️'.repeat(Math.max(0, gameState.lives)) || '💀';
        livesLabel.textContent = `Życia: ${hearts} (${gameState.lives}/${gameState.maxLives})`;
    }
    if (gameState.status === 'gameOver') {
        statusLabel.textContent = 'GAME OVER! Ostatnie zderzenie.';
    } else if (gameState.status === 'lost') {
        statusLabel.textContent = 'Koniec gry! Brak żyć. Naciśnij R.';
    } else if (gameState.status === 'won') {
        statusLabel.textContent = 'Meta! Naciśnij R.';
    } else {
        statusLabel.textContent = GAME_MODE === 'endless'
            ? 'Tryb Endless: idź przed siebie i unikaj przeszkód!'
            : 'Dotrzyj do ostatniego pasa trawy.';
    }
}

// Zadanie 3: Obsługa pauzy oraz blokada ruchu gracza
const statusOverlay = document.querySelector('#statusOverlay');
let isPaused = false;

function togglePause() {
    if (gameState.status !== 'playing') return;
    isPaused = !isPaused;
    if (statusOverlay) {
        if (isPaused) {
            statusOverlay.textContent = '⏸ PAUZA (Spacja: Wznów)';
            statusOverlay.classList.add('paused');
        } else {
            statusOverlay.textContent = '▶ W GRZE (Spacja: Pauza)';
            statusOverlay.classList.remove('paused');
        }
    }
}

const [ratTemplate, treeTemplate, newTreeTemplate, catTemplate] = await Promise.all([
    loadTemplate('/models/szczur.glb'),
    loadTemplate('/models/tree.glb'),
    loadTemplate('/models/drzewko.glb'),
    loadTemplate('/models/kociak.glb')
]);
const carTemplate = ratTemplate;

console.log('Szczur:', countTriangles(ratTemplate));
console.log('Drzewo:', countTriangles(treeTemplate));
console.log('Drzewko:', countTriangles(newTreeTemplate));
console.log('Kociak:', countTriangles(catTemplate));

prepareWorld();
createBasicObjects(scene3D, catTemplate);
addModels(scene3D, carTemplate, treeTemplate, newTreeTemplate);

if (GAME_MODE === 'endless') {
    extendWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate);
    resetFollowCamera();
}

let previousTime = null;
function frame(time) {
    const dt = previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    if (!isPaused && gameState.status === 'playing') {
        updatePlayerAnimation(dt);
        const livesBefore = gameState.lives;
        const collisionPosition = [...scene.player.position];
        updateCars(dt);
        updateGameState();
        if (gameState.lives < livesBefore) {
            if (gameState.status === 'gameOver') {
                createPlayerExplosion(scene3D, collisionPosition);
                startGameOverSequence(collisionPosition);
            } else {
                resetPlayerJump();
                createCollisionDust(scene3D, scene.player.position);
            }
        }
        if (GAME_MODE === 'endless' &&
            gameState.lives < livesBefore &&
            gameState.status === 'playing') {
            resetWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate);
            resetFollowCamera();
        }
    }

    if (gameState.status === 'gameOver') {
        updateGameOverSequence(dt);
    }

    if (!isPaused) {
        updateParticleEffects(scene3D, dt);
    }

    if (GAME_MODE === 'endless' &&
        !isPaused && gameState.status === 'playing') {
        updateFollowCamera(dt);
        extendWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate);
    }

    render();
    updateHud();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('keydown', event => {
    // Przełączanie pauzy klawiszem spacji lub p
    if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        togglePause();
        return;
    }

    // Restart klawiszem R
    if (event.code === 'KeyR' || event.key.toLowerCase() === 'r') {
        if (event.repeat) return;
        if (gameState.status === 'gameOver') return;
        restartGame();
        resetPlayerJump();
        resetPlayerVisual();
        orientPlayer('ArrowUp');
        if (gameOverOverlay) gameOverOverlay.hidden = true;
        if (explosionFlash) explosionFlash.style.opacity = '0';
        if (explosionBurst) explosionBurst.classList.remove('active');
        gameOverElapsed = 0;
        if (GAME_MODE === 'endless') {
            resetWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate);
            resetFollowCamera();
        }
        isPaused = false;
        previousTime = null;
        return;
    }

    // Gdy gra jest zapauzowana lub nie trwa rozgrywka, ruch gracza jest zablokowany
    if (isPaused || gameState.status !== 'playing') return;

    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    if (event.repeat) return;
    const previousPosition = [...scene.player.position];
    movePlayer(event.key);
    const [x, , z] = scene.player.position;
    if (x !== previousPosition[0] || z !== previousPosition[2]) {
        orientPlayer(event.key);
        startPlayerJump(x, z);
    }
});
