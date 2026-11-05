import { rows, scene as gameScene } from '../game/sceneData.js';
import { CAR_TRACK_EDGE } from '../game/gameLogic.js';
import {
    addRowVisual, addCarVisual, addTreeVisual, addBoostVisual, objects
} from './objects.js';
import { gameState } from '../game/gameRules.js';

const STEP = 0.35;
const AHEAD = 8;
const BEHIND = 4;
const INITIAL_ROWS = rows.length;
const FIRST_Z = Math.max(...rows.map(row => row.z));
let nextIndex = INITIAL_ROWS;
let nextTreeModel = 'tree';

function getBoostInterval() {
    return Math.floor(Math.random() * 6) + 10;
}

let nextBoostLane = INITIAL_ROWS + getBoostInterval();

// 7 możliwych kolumn ruchu w osi X odpowiadających krokowi gracza (stepX = 0.25)
export const TREE_LANES = [-0.75, -0.50, -0.25, 0.00, 0.25, 0.50, 0.75];
const BOOST_LANES = [-1.25, -1.00, -0.75, -0.50, -0.25, 0.00, 0.25, 0.50, 0.75, 1.00, 1.25];

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

function getNextTreeTemplate(treeTemplate, newTreeTemplate) {
    if (!newTreeTemplate) return treeTemplate;

    const template = nextTreeModel === 'drzewko'
        ? newTreeTemplate
        : treeTemplate;
    nextTreeModel = nextTreeModel === 'drzewko' ? 'tree' : 'drzewko';
    return template;
}

function createBoost(scene3D, row, boostTemplate) {
    const candidates = [...BOOST_LANES];
    const safeCandidates = candidates.filter(x =>
        !gameScene.trees.some(tree =>
            tree.laneIndex === row.laneIndex &&
            Math.abs(tree.position[0] - x) < 0.38
        ) &&
        !gameScene.cars.some(car =>
            car.laneIndex === row.laneIndex &&
            Math.abs(car.position[0] - x) < 0.42
        )
    );
    const available = safeCandidates.length > 0
        ? safeCandidates
        : candidates.filter(x =>
            !gameScene.trees.some(tree =>
                tree.laneIndex === row.laneIndex &&
                Math.abs(tree.position[0] - x) < 0.38
            )
        );
    const positions = available.length > 0 ? available : candidates;
    const x = positions[Math.floor(Math.random() * positions.length)];
    gameScene.boosts.push({
        position: [x, 0, row.z],
        laneIndex: row.laneIndex
    });
    addBoostVisual(scene3D, boostTemplate);
}

export function collectBoost(scene3D, position) {
    const boostIndex = gameScene.boosts.findIndex(boost =>
        Math.abs(boost.position[0] - position[0]) < 0.2 &&
        Math.abs(boost.position[2] - position[2]) < 0.18
    );
    if (boostIndex < 0) return false;

    scene3D.remove(objects.boosts[boostIndex]);
    objects.boosts.splice(boostIndex, 1);
    gameScene.boosts.splice(boostIndex, 1);
    return true;
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

export function extendWorld(
    scene3D, carTemplate, treeTemplate, newTreeTemplate, boostTemplate
) {
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
                const template = getNextTreeTemplate(
                    treeTemplate,
                    newTreeTemplate
                );
                const tree = {
                    position: [treeX, 0, row.z],
                    laneIndex: index,
                    model: template === newTreeTemplate ? 'drzewko' : 'tree'
                };
                gameScene.trees.push(tree);
                addTreeVisual(scene3D, tree, template);
            }
        }

        if (row.laneIndex >= nextBoostLane) {
            createBoost(scene3D, row, boostTemplate);
            nextBoostLane = row.laneIndex + getBoostInterval();
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
    for (let i = gameScene.boosts.length - 1; i >= 0; i--) {
        if (gameScene.boosts[i].laneIndex !== row.laneIndex) continue;
        scene3D.remove(objects.boosts[i]);
        objects.boosts.splice(i, 1);
        gameScene.boosts.splice(i, 1);
    }

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

export function resetWorld(
    scene3D, carTemplate, treeTemplate, newTreeTemplate, boostTemplate
) {
    for (const row of [...rows]) {
        if (row.laneIndex >= INITIAL_ROWS) {
            removeGeneratedRow(scene3D, row);
        }
    }
    nextIndex = INITIAL_ROWS;
    nextBoostLane = INITIAL_ROWS + getBoostInterval();
    extendWorld(
        scene3D, carTemplate, treeTemplate, newTreeTemplate, boostTemplate
    );
}
