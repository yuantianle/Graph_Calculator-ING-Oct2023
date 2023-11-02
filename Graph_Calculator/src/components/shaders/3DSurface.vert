varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform float pointSize;
uniform vec3 lightPosition; // Position of the point light

void main() {
    vNormal =vec3(0,0,1);
    vColor = vec3(0.1, 0.15, 0.35); // Color assigned to each point
    vLightDir = normalize(lightPosition - position.xyz);

    vec4 mvPosition = modelViewMatrix * vec4(position.xyz, 1.0);
    float distance = length(cameraPosition - position);
    gl_PointSize = pointSize / distance;// Adjust the numerator to scale the base size
    gl_Position = projectionMatrix * mvPosition;
}