varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform vec3 lightColor;    // Color of the point light
uniform float lightIntensity; // Intensity of the point light

void main() {
    vec3 norm = normalize(vNormal);
    
    float nDotL = clamp(dot(vLightDir, norm), 0.0, 1.0);
    vec3 diffuseColor = lightColor * nDotL * vColor * lightIntensity;

    gl_FragColor = vec4(diffuseColor,1.0); // Use the color from vertex shader with lighting
}