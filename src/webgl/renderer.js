import { mat4 } from 'gl-matrix';

export function drawMesh(gl, mesh, uniforms, object) {
    gl.bindVertexArray(mesh.vao);
    const model = mat4.create();
    mat4.translate(model, model, object.position);
    mat4.scale(model, model, object.scale);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniform3fv(uniforms.color, object.color);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}
