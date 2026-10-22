// Dane logiczne gry - niezależne od sposobu renderowania.
export const rows = [
    { type: 'grass', z: 0.70 },
    { type: 'road', z: 0.00 },
    { type: 'grass', z: -0.70 },
    { type: 'grass', z: -1.40, color: [0.08, 0.45, 0.18] }
];

export const scene = {
    player: { position: [0.0, 0.0, 0.70] },
    cars: [
        { position: [-0.60, 0.0, 0.00], color: [0.92, 0.12, 0.13], speed: 0.32 },
        { position: [ 0.45, 0.0, 0.00], color: [0.12, 0.30, 0.90], speed: -0.42 },
        { position: [ 0.00, 0.0, 0.00], color: [0.95, 0.60, 0.10], speed: 0.25 }
    ],
    trees: [
        { position: [-0.70, 0.0, 0.70] },
        { position: [ 0.70, 0.0, 0.70] },
        {
            position: [-0.20, 0.0, -1.40],
            trunkHeight: 0.52,
            crownColor: [0.85, 0.18, 0.12]
        }
    ]
};
