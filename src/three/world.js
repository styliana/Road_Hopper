import { rows, scene as gameScene } from '../game/sceneData.js';
import { addRowVisual, addCarVisual, addTreeVisual, objects } from './objects.js';
import { gameState } from '../game/gameRules.js';

const STEP = 0.35;
const AHEAD = 5;
const BEHIND = 3;
const INITIAL_ROWS = rows.length;
const FIRST_Z = Math.max(...rows.map(row => row.z));
let nextIndex = INITIAL_ROWS;

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

export function extendWorld(scene3D, carTemplate, treeTemplate) {
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
            const direction = Math.random() < 0.5 ? -1 : 1;
            const baseSpeed = direction * (0.28 + Math.random() * 0.20);
            const car = {
                position: [Math.random() * 1.6 - 0.8, 0, row.z],
                speed: baseSpeed * gameState.speedMultiplier,
                baseSpeed,
                laneIndex: index
            };
            gameScene.cars.push(car);
            addCarVisual(scene3D, car, carTemplate);
        } else {
            const tree = {
                position: [Math.random() < 0.5 ? -0.65 : 0.65, 0, row.z],
                laneIndex: index
            };
            gameScene.trees.push(tree);
            addTreeVisual(scene3D, tree, treeTemplate);
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

export function resetWorld(scene3D, carTemplate, treeTemplate) {
    for (const row of [...rows]) {
        if (row.laneIndex >= INITIAL_ROWS) {
            removeGeneratedRow(scene3D, row);
        }
    }
    nextIndex = INITIAL_ROWS;
    extendWorld(scene3D, carTemplate, treeTemplate);
}
