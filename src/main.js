import * as THREE from 'three';
import { updateCars, movePlayer } from './game/gameLogic.js';
import {
    gameState, updateGameState, restartGame
} from './game/gameRules.js';
import { countTriangles, loadTemplate } from './three/modelLoader.js';
import {
    addModels, createBasicObjects, orientPlayer, syncObjects
} from './three/objects.js';

const canvas = document.querySelector('#gameCanvas');
const scoreLabel = document.querySelector('#score');
const bestScoreLabel = document.querySelector('#bestScore');
const speedLabel = document.querySelector('#speed');
const livesLabel = document.querySelector('#lives');
const statusLabel = document.querySelector('#status');

const scene3D = new THREE.Scene();
scene3D.background = new THREE.Color(0x141b26);

const renderer3D = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer3D.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer3D.outputColorSpace = THREE.SRGBColorSpace;

const camera3D = new THREE.OrthographicCamera(-3, 3, 2.2, -2.2, 0.1, 100);
camera3D.position.set(0, 2.4, 3.2);
camera3D.lookAt(0, -0.2, -0.35);

scene3D.add(new THREE.AmbientLight(0xffffff, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 2.0);
light.position.set(-2, 5, 4);
scene3D.add(light);

function render() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer3D.setSize(width, height, false);

    const zoom = 2.2;
    const aspect = width / height;
    camera3D.left = -zoom * aspect;
    camera3D.right = zoom * aspect;
    camera3D.top = zoom;
    camera3D.bottom = -zoom;
    camera3D.updateProjectionMatrix();
    syncObjects();
    renderer3D.render(scene3D, camera3D);
}

function updateHud() {
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
    if (gameState.status === 'lost') {
        statusLabel.textContent = 'Koniec gry! Brak żyć. Naciśnij R.';
    } else if (gameState.status === 'won') {
        statusLabel.textContent = 'Meta! Naciśnij R.';
    } else {
        statusLabel.textContent = 'Dotrzyj do ostatniego pasa trawy.';
    }
}

// Zadanie 3: Obsługa pauzy oraz blokada ruchu gracza
const statusOverlay = document.querySelector('#statusOverlay');
let isPaused = false;

function togglePause() {
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

const [ratTemplate, treeTemplate, catTemplate] = await Promise.all([
    loadTemplate('/models/szczur.glb'),
    loadTemplate('/models/tree.glb'),
    loadTemplate('/models/kociak.glb')
]);
console.log('Szczur:', countTriangles(ratTemplate));
console.log('Drzewo:', countTriangles(treeTemplate));
console.log('Kociak:', countTriangles(catTemplate));
createBasicObjects(scene3D, catTemplate);
addModels(scene3D, ratTemplate, treeTemplate);

let previousTime = null;
function frame(time) {
    // Obliczanie dt i aktualizowanie previousTime nawet podczas pauzy,
    // aby po wznowieniu gry nie nastąpił nagły przeskok obiektów.
    const dt = previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    if (!isPaused && gameState.status === 'playing') {
        updateCars(dt);
        updateGameState();
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
    if (event.key.toLowerCase() === 'r') {
        if (!event.repeat) {
            restartGame();
            orientPlayer('ArrowUp');
        }
        return;
    }

    // Gdy gra jest zapauzowana lub nie trwa rozgrywka, ruch gracza jest zablokowany
    if (isPaused || gameState.status !== 'playing') return;

    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    if (event.repeat) return;
    movePlayer(event.key);
    orientPlayer(event.key);
});
