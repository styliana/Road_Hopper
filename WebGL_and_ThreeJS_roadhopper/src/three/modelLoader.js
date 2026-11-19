import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export async function loadTemplate(path) {
    const gltf = await loader.loadAsync(path);
    return gltf.scene;
}

export function makeInstance(template, targetSize) {
    if (!Number.isFinite(targetSize) || targetSize <= 0) {
        throw new Error('Rozmiar modelu 3D musi być dodatni');
    }

    const model = template.clone(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);

    if (largest <= 0) throw new Error('Pusty model 3D');

    model.scale.multiplyScalar(targetSize / largest);
    model.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(model);
    model.position.x -= (box.min.x + box.max.x) / 2;
    model.position.y -= box.min.y;
    model.position.z -= (box.min.z + box.max.z) / 2;

    const root = new THREE.Group();
    root.add(model);
    return root;
}

export function countTriangles(model) {
    let triangles = 0;
    model.traverse(part => {
        if (!part.isMesh) return;

        const geometry = part.geometry;
        triangles += (geometry.index
            ? geometry.index.count
            : geometry.attributes.position.count) / 3;
    });
    return triangles;
}
