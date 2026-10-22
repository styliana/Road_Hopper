import { rows, scene } from './game/sceneData.js';
import {
    createProgram, vertexShaderSource, fragmentShaderSource,
    createMesh, planeGeometry, cubeGeometry,
    drawRow, drawPlayer, drawCar, drawTree
} from './webgl/index.js';

const canvas = document.querySelector('#gameCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('Ta przeglądarka nie udostępnia WebGL2.');

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

const uniforms = {
    position: gl.getUniformLocation(program, 'uPosition'),
    scale: gl.getUniformLocation(program, 'uScale'),
    color: gl.getUniformLocation(program, 'uColor')
};

const planeMesh = createMesh(gl, program, planeGeometry);
const cubeMesh = createMesh(gl, program, cubeGeometry);

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

    for (const row of rows) drawRow(gl, planeMesh, uniforms, row);
    drawPlayer(gl, cubeMesh, uniforms, scene.player);
    for (const car of scene.cars) drawCar(gl, cubeMesh, uniforms, car);
    for (const tree of scene.trees) drawTree(gl, cubeMesh, uniforms, tree);
}

render();
