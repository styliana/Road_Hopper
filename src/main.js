import { mat4 } from 'gl-matrix';
import { updateCars, movePlayer } from './game/gameLogic.js';
import { rows, scene } from './game/sceneData.js';
import {
    createProgram, vertexShaderSource, fragmentShaderSource,
    createMesh, planeGeometry, cubeGeometry,
    drawRow, drawRoadMarkings, drawPlayer, drawCar, drawTree
} from './webgl/index.js';

const canvas = document.querySelector('#gameCanvas');
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

const planeMesh = createMesh(gl, program, planeGeometry);
const cubeMesh = createMesh(gl, program, cubeGeometry);

const camera = {
    eye: [0.0, 1.85, 2.45], // Kamera TPP
    target: [0.0, 0.0, -0.6],
    up: [0, 1, 0],
    zoom: 1.55
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
    const dt = previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    if (!isPaused) {
        updateCars(dt);
    }

    render();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        togglePause();
        return;
    }

    if (isPaused) return;

    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    if (event.repeat) return;
    movePlayer(event.key);
});
