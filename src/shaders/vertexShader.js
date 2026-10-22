export const vertexShaderSource = `#version 300 es
in vec3 aPosition;
uniform vec3 uPosition;
uniform vec3 uScale;

void main() {
    vec3 p = aPosition * uScale + uPosition;
    float screenX = p.x - p.z * 0.35;
    float screenY = p.y + p.z * 0.20;
    gl_Position = vec4(screenX, screenY, 0.0, 1.0);
}`;
