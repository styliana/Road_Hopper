import { rows, scene } from './sceneData.js';

const STEP = 0.35;

export function updateCars(dt) {
    const edge = 1.85;
    const trackLength = 2 * edge;
    const MIN_GAP = 0.60;

    // 1. Ruch samochodów z ich indywidualną prędkością i prawidłowe zawijanie na krańcach planszy
    for (const car of scene.cars) {
        car.position[0] += car.speed * dt;
        if (car.speed > 0 && car.position[0] > edge) {
            car.position[0] -= trackLength;
        } else if (car.speed < 0 && car.position[0] < -edge) {
            car.position[0] += trackLength;
        }
    }

    // 2. Zadanie 2: Zapobieganie nachodzeniu na siebie samochodów na tym samym pasie
    const lanesMap = new Map();
    for (const car of scene.cars) {
        const key = car.laneIndex ?? Math.round(car.position[2] * 1000);
        let list = lanesMap.get(key);
        if (!list) {
            list = [];
            lanesMap.set(key, list);
        }
        list.push(car);
    }

    for (const laneCars of lanesMap.values()) {
        if (laneCars.length <= 1) continue;
        const dir = laneCars[0].speed >= 0 ? 1 : -1;

        // Dwa przejścia dla stabilnego rozluźnienia kolumny (do 3 aut)
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < laneCars.length; i++) {
                const carA = laneCars[i];
                for (let j = 0; j < laneCars.length; j++) {
                    if (i === j) continue;
                    const carB = laneCars[j];

                    // Odległość od carA do carB wzdłuż kierunku jazdy na torze cyklicznym
                    let distAhead = dir > 0
                        ? (carB.position[0] - carA.position[0])
                        : (carA.position[0] - carB.position[0]);

                    if (distAhead < 0) distAhead += trackLength;

                    // Jeśli carB jest przed carA i odstęp jest zbyt mały (< MIN_GAP)
                    if (distAhead > 0.001 && distAhead < MIN_GAP) {
                        carA.position[0] = dir > 0
                            ? carB.position[0] - MIN_GAP
                            : carB.position[0] + MIN_GAP;

                        if (carA.position[0] > edge) carA.position[0] -= trackLength;
                        if (carA.position[0] < -edge) carA.position[0] += trackLength;
                    }
                }
            }
        }
    }
}

export function checkTreeCollision(x, z) {
    const thresholdX = 0.18;
    const thresholdZ = 0.18;
    return scene.trees.some(tree => {
        const dx = Math.abs(x - tree.position[0]);
        const dz = Math.abs(z - tree.position[2]);
        return dx < thresholdX && dz < thresholdZ;
    });
}

export function movePlayer(key) {
    const p = scene.player.position;
    const stepX = 0.25;
    const limitX = 1.25; // Powiększone pole manewru gracza na boki

    let targetX = p[0];
    let targetZ = p[2];

    if (key === 'ArrowLeft') targetX = Math.max(-limitX, p[0] - stepX);
    if (key === 'ArrowRight') targetX = Math.min(limitX, p[0] + stepX);

    const lanes = rows.map(row => row.z).sort((a, b) => b - a);
    const index = lanes.findIndex(z => Math.abs(z - p[2]) < 0.001);
    if (key === 'ArrowUp' && index >= 0 && index < lanes.length - 1) {
        const nextZ = lanes[index + 1];
        if (Math.abs(nextZ - p[2]) <= STEP + 0.001) {
            targetZ = nextZ;
        }
    }
    if (key === 'ArrowDown' && index > 0) {
        const nextZ = lanes[index - 1];
        if (Math.abs(nextZ - p[2]) <= STEP + 0.001) {
            targetZ = nextZ;
        }
    }

    // Blokada wykonania ruchu, jeśli docelowa pozycja koliduje z drzewem (bez utraty życia)
    if (!checkTreeCollision(targetX, targetZ)) {
        p[0] = targetX;
        p[2] = targetZ;
    }
}
