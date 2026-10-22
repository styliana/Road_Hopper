export function drawMesh(gl, mesh, uniforms, object) {
    gl.bindVertexArray(mesh.vao);
    gl.uniform3fv(uniforms.position, object.position);
    gl.uniform3fv(uniforms.scale, object.scale);
    gl.uniform3fv(uniforms.color, object.color);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}
