import { rows, scene as gameScene } from '../game/sceneData.js';
import { CAR_TRACK_EDGE } from '../game/gameLogic.js';
import { addRowVisual, addCarVisual, addTreeVisual, objects } from './objects.js';
import { gameState } from '../game/gameRules.js';

const STEP = 0.35;
const AHEAD = 8;
const BEHIND = 4;
const INITIAL_ROWS = rows.length;
const FIRST_Z = Math.max(...rows.map(row => row.z));
let nextIndex = INITIAL_ROWS;

// 7 możliwych kolumn ruchu w osi X odpowiadających krokowi gracza (stepX = 0.25)
export const TREE_LANES = [-0.75, -0.50, -0.25, 0.00, 0.25, 0.50, 0.75];

export function getRandomTreePositions() {
    // Zadanie 1: Losowa liczba drzew od 1 do 3
    const count = Math.floor(Math.random() * 3) + 1;
    const available = [...TREE_LANES];
    const positions = [];

    for (let i = 0; i < count; i++) {
        if (available.length === 0) break;
        const randIdx = Math.floor(Math.random() * available.length);
        const chosenX = available[randIdx];
        positions.push(chosenX);

        // Eliminujemy wybraną pozycję oraz bezpośrednio sąsiadujące pozycje (odległość < 0.40),
        // co zapobiega powstawaniu ścian i gwarantuje wolne przejścia między drzewami
        for (let j = available.length - 1; j >= 0; j--) {
            if (Math.abs(available[j] - chosenX) < 0.40) {
                available.splice(j, 1);
            }
        }
    }
    return positions;
}

// Zadanie 2: Generowanie początkowych pozycji od 1 do 3 aut z bezpiecznym odstępem
export function generateCarPositions(count) {
    const spacing = (2 * CAR_TRACK_EDGE) / count;
    const offset = Math.random() * spacing;
    return Array.from(
        { length: count },
        (_, index) => -CAR_TRACK_EDGE + offset + index * spacing
    );
}

export function prepareWorld() {
    rows.sort((a, b) => b.z - a.z);
    rows.forEach((row, index) => {
        row.laneIndex = index;
    });
}

function playerLane() {
    const row = rows.find(r =>
        Math.abs(r.z - gameScene.player.position[2]) < 0.001
    );
    return row?.laneIndex ?? 0;
}

export function extendWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate) {
    const current = playerLane();
    while (nextIndex <= current + AHEAD) {
        const index = nextIndex++;
        let type = Math.random() < 0.45 ? 'road' : 'grass';
        const lastType = rows[rows.length - 1].type;
        let streak = 0;
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].type !== lastType) break;
            streak++;
        }
        if (lastType === 'road' && streak >= 5) type = 'grass';
        if (lastType === 'grass' && streak >= 3) type = 'road';

        const row = {
            type,
            z: FIRST_Z - index * STEP,
            laneIndex: index
        };
        rows.push(row);
        addRowVisual(scene3D, row);

        if (type === 'road') {
            // Zadanie 2: Od 1 do 3 pojazdów na pasie ze wspólnym kierunkiem i prędkością
            const carCount = Math.floor(Math.random() * 3) + 1;
            const direction = Math.random() < 0.5 ? -1 : 1;
            const carPositions = generateCarPositions(carCount);
            const baseSpeed = direction * (0.24 + Math.random() * 0.22);

            for (const carX of carPositions) {
                const car = {
                    position: [carX, 0, row.z],
                    speed: baseSpeed * gameState.speedMultiplier,
                    baseSpeed,
                    laneIndex: index
                };
                gameScene.cars.push(car);
                addCarVisual(scene3D, car, carTemplate);
            }
        } else {
            // Zadanie 1: Generowanie losowej liczby drzew (1 do 3) w różnych częściach pasa
            const treePositions = getRandomTreePositions();
            for (const treeX of treePositions) {
                const template = newTreeTemplate && Math.random() < 0.5
                    ? newTreeTemplate
                    : treeTemplate;
                const tree = {
                    position: [treeX, 0, row.z],
                    laneIndex: index,
                    model: template === newTreeTemplate ? 'drzewko' : 'tree'
                };
                gameScene.trees.push(tree);
                addTreeVisual(scene3D, tree, template);
            }
        }
    }

    for (const row of [...rows]) {
        if (row.laneIndex < INITIAL_ROWS) continue;
        if (row.laneIndex < current - BEHIND) {
            removeGeneratedRow(scene3D, row);
        }
    }
}

function removeGeneratedRow(scene3D, row) {
    for (let i = gameScene.cars.length - 1; i >= 0; i--) {
        if (gameScene.cars[i].laneIndex !== row.laneIndex) continue;
        scene3D.remove(objects.cars[i]);
        objects.cars.splice(i, 1);
        gameScene.cars.splice(i, 1);
    }

    for (let i = gameScene.trees.length - 1; i >= 0; i--) {
        if (gameScene.trees[i].laneIndex !== row.laneIndex) continue;
        scene3D.remove(objects.trees[i]);
        objects.trees.splice(i, 1);
        gameScene.trees.splice(i, 1);
    }

    scene3D.remove(objects.rows.get(row.laneIndex));
    objects.rows.delete(row.laneIndex);
    rows.splice(rows.indexOf(row), 1);
}

export function resetWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate) {
    for (const row of [...rows]) {
        if (row.laneIndex >= INITIAL_ROWS) {
            removeGeneratedRow(scene3D, row);
        }
    }
    nextIndex = INITIAL_ROWS;
    extendWorld(scene3D, carTemplate, treeTemplate, newTreeTemplate);
}
