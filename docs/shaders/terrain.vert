uniform float u_verticalExaggeration;

attribute float elevation;

varying vec3 vColor;

void main() {
    float MAX_UINT16 = 65535.0;

    float posX = position.x;
    float posY = position.y;
    float posZ = (elevation / MAX_UINT16) * u_verticalExaggeration;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posX, posY, posZ, 1.0);
}