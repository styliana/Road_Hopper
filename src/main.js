import { mat4 } from 'gl-matrix';
import { updateCars, movePlayer } from './game/gameLogic.js';
import { rows, scene } from './game/sceneData.js';
import {
    gameState, updateGameState, restartGame
} from './game/gameRules.js';
import {
    createProgram, vertexShaderSource, fragmentShaderSource,
    createMesh, planeGeometry, cubeGeometry,
    drawRow, drawRoadMarkings, drawPlayer, drawCar, drawTree
} from './webgl/index.js';

const canvas = document.querySelector('#gameCanvas');
const scoreLabel = document.querySelector('#score');
const bestScoreLabel = document.querySelector('#bestScore');
const speedLabel = document.querySelector('#speed');
const livesLabel = document.querySelector('#lives');
const statusLabel = document.querySelector('#status');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('Ta przeglądarka nie udostępnia WebGL2.');

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

const uniforms = {
    model: gl.getUniformLocation(program, 'uModel'),
    view: gl.getUniformLocation(program, 'uView'),
    projection: gl.getUniformLocation(program, 'uProjection'),
    color: gl.getUniformLocation(program, 'uColor')
};

// Każda geometria trafia do GPU tylko raz.
const planeMesh = createMesh(gl, program, planeGeometry);
const cubeMesh = createMesh(gl, program, cubeGeometry);

const camera = {
    eye: [0.0, 1.85, 2.45], // Kamera TPP dostosowana do poszerzonej sceny
    target: [0.0, 0.0, -0.6], // Punkt skupienia przed graczem na drodze
    up: [0, 1, 0], // Kierunek góry
    zoom: 1.55 // Zakres widoku obejmujący całe poszerzone pole gry
};

function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function render() {
    resizeCanvas();
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.075, 0.10, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    const aspect = canvas.width / canvas.height;
    const view = mat4.create();
    mat4.lookAt(view, camera.eye, camera.target, camera.up);

    const projection = mat4.create();
    mat4.ortho(projection,
        -camera.zoom * aspect, camera.zoom * aspect,
        -camera.zoom, camera.zoom, 0.1, 100);

    gl.uniformMatrix4fv(uniforms.view, false, view);
    gl.uniformMatrix4fv(uniforms.projection, false, projection);

    for (const row of rows) drawRow(gl, planeMesh, uniforms, row);
    drawRoadMarkings(gl, cubeMesh, uniforms);
    drawPlayer(gl, cubeMesh, uniforms, scene.player);
    for (const car of scene.cars) drawCar(gl, cubeMesh, uniforms, car);
    for (const tree of scene.trees) drawTree(gl, cubeMesh, uniforms, tree);
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
        if (!event.repeat) restartGame();
        return;
    }

    // Gdy gra jest zapauzowana lub nie trwa rozgrywka, ruch gracza jest zablokowany
    if (isPaused || gameState.status !== 'playing') return;

    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    if (event.repeat) return;
    movePlayer(event.key);
});

