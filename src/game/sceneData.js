// Dane logiczne gry - niezależne od sposobu renderowania.
export const rows = [
    { type: 'grass', z: 0.70 },
    { type: 'road', z: 0.35 },
    { type: 'road', z: 0.00 },
    { type: 'grass', z: -0.35, color: [0.08, 0.45, 0.18] }
];

export const scene = {
    player: { position: [0.0, 0.0, 0.70] },
    cars: [
        // Pas 1 (z = 0.35): ruch w prawo - równa prędkość aut eliminuje nachodzenie na siebie
        { position: [-0.85, 0.0, 0.35], color: [0.92, 0.12, 0.13], speed: 0.40 },
        { position: [ 0.85, 0.0, 0.35], color: [0.95, 0.60, 0.10], speed: 0.40 },
        // Pas 2 (z = 0.00): ruch w lewo - równa prędkość aut w przeciwnym kierunku
        { position: [ 0.85, 0.0, 0.00], color: [0.12, 0.30, 0.90], speed: -0.45 },
        { position: [-0.85, 0.0, 0.00], color: [0.85, 0.20, 0.75], speed: -0.45 }
    ],
    boosts: [],
    trees: [
        { position: [-1.05, 0.0, 0.70], model: 'tree' },
        { position: [ 1.05, 0.0, 0.70], model: 'drzewko' },
        { position: [-1.05, 0.0, -0.35], model: 'drzewko' },
        { position: [ 1.05, 0.0, -0.35], model: 'tree' }
    ]
};
