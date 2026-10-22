// Dane logiczne gry - niezależne od sposobu renderowania.
export const rows = [
    { type: 'grass', z: 0.70 },
    { type: 'road', z: 0.00 },
    { type: 'grass', z: -0.70 }
];

export const scene = {
    player: { position: [0.0, 0.0, 0.70] },
    cars: [
        { position: [-0.45, 0.0, 0.00], color: [0.92, 0.12, 0.13] },
        { position: [ 0.45, 0.0, 0.00], color: [0.12, 0.30, 0.90] }
    ],
    trees: [
        { position: [-0.70, 0.0, 0.70] },
        { position: [ 0.70, 0.0, 0.70] }
    ]
};
