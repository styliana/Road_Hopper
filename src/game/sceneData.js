// Dane logiczne gry - niezależne od sposobu renderowania.
export const rows = [
    { type: 'grass', z: 0.70 },
    { type: 'road', z: 0.00 },
    { type: 'road', z: -0.70 },
    { type: 'grass', z: -1.40, color: [0.08, 0.45, 0.18] }
];

export const scene = {
    player: { position: [0.0, 0.0, 0.70] },
    cars: [
        // Pas 1 (z = 0.00): ruch w prawo - równa prędkość aut eliminuje nachodzenie na siebie
        { position: [-0.85, 0.0, 0.00], color: [0.92, 0.12, 0.13], speed: 0.40 },
        { position: [ 0.85, 0.0, 0.00], color: [0.95, 0.60, 0.10], speed: 0.40 },
        // Pas 2 (z = -0.70): ruch w lewo - równa prędkość aut w przeciwnym kierunku
        { position: [ 0.85, 0.0, -0.70], color: [0.12, 0.30, 0.90], speed: -0.45 },
        { position: [-0.85, 0.0, -0.70], color: [0.85, 0.20, 0.75], speed: -0.45 }
    ],
    trees: [
        { position: [-1.45, 0.0, 0.70] },
        { position: [ 1.45, 0.0, 0.70] },
        {
            position: [-0.20, 0.0, -1.40],
            trunkHeight: 0.52,
            crownColor: [0.85, 0.18, 0.12]
        },
        { position: [-1.45, 0.0, -1.40] },
        { position: [ 1.45, 0.0, -1.40] }
    ]
};
