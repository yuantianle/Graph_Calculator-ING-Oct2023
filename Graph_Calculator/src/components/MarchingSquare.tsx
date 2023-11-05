import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
//import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';

// Marching squares lookup tables
//const edgeTable = new Int16Array([
//    0x0, 0x9, 0x3, 0xa,
//    0x6, 0xf, 0x5, 0xc,
//    0xc, 0x5, 0xf, 0x6,
//    0xa, 0x3, 0x9, 0x0
//]);
//
//const lineTable = new Int16Array([
//    -1, -1, -1, -1, -1, -1, -1, -1, // Case 0: No edges
//    0, 3, -1, -1, -1, -1, -1, -1, // Case 1
//    1, 0, -1, -1, -1, -1, -1, -1, // Case 2
//    1, 3, -1, -1, -1, -1, -1, -1, // Case 3
//    2, 1, -1, -1, -1, -1, -1, -1, // Case 4
//    0, 3, 2, 1, -1, -1, -1, -1, // Case 5: Ambiguous case
//    2, 0, -1, -1, -1, -1, -1, -1, // Case 6
//    2, 3, -1, -1, -1, -1, -1, -1, // Case 7
//    3, 2, -1, -1, -1, -1, -1, -1, // Case 8
//    0, 2, -1, -1, -1, -1, -1, -1, // Case 9: Ambiguous case
//    1, 0, 3, 2, -1, -1, -1, -1, // Case 10
//    1, 2, -1, -1, -1, -1, -1, -1, // Case 11
//    3, 1, -1, -1, -1, -1, -1, -1, // Case 12
//    0, 1, -1, -1, -1, -1, -1, -1, // Case 13
//    3, 0, -1, -1, -1, -1, -1, -1, // Case 14
//    -1, -1, -1, -1, -1, -1, -1, -1  // Case 15: All edges
//]);


export function Topologying2DMarchingSquares({ points, values }: { points: THREE.Vector2[], values: number[] }, size: number, isLine = true, pointLight: THREE.Light, shapesize: number = 0.5) {
    size = Math.floor(size);

    let d = Math.abs(points[size].y - points[0].y);
    let positions = [];
    let geometry = new THREE.BufferGeometry();

    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            // Calculate index into the edge table.
            const idx = x + y * size;
            let type =
                (values[idx] < 0 ? 0 : 1) +
                (values[idx + 1] < 0 ? 0 : 2) +
                (values[idx + size + 1] < 0 ? 0 : 4) +
                (values[idx + size] < 0 ? 0 : 8);

            if (type == 1 || type == 14) {
                positions.push(points[idx].x, points[idx].y + d / 2, 0);
                positions.push(points[idx].x + d / 2, points[idx].y, 0);
            }
            else if (type == 2 || type == 13) {
                positions.push(points[idx].x + d / 2, points[idx].y, 0);
                positions.push(points[idx].x + d, points[idx].y + d / 2, 0);
            }
            else if (type == 3 || type == 12) {
                positions.push(points[idx].x, points[idx].y + d / 2, 0);
                positions.push(points[idx].x + d, points[idx].y + d / 2, 0);
            }
            else if (type == 4 || type == 11) {
                positions.push(points[idx].x + d / 2, points[idx].y + d, 0);
                positions.push(points[idx].x + d, points[idx].y + d / 2, 0);
            }
            else if (type == 5) {
                positions.push(points[idx].x, points[idx].y + d / 2, 0),
                    positions.push(points[idx].x + d / 2, points[idx].y + d, 0);
                positions.push(points[idx].x + d / 2, points[idx].y, 0),
                    positions.push(points[idx].x + d, points[idx].y + d / 2, 0);
            }
            else if (type == 6 || type == 9) {
                positions.push(points[idx].x + d / 2, points[idx].y, 0),
                    positions.push(points[idx].x + d / 2, points[idx].y + d, 0);
            }
            else if (type == 7 || type == 8) {
                positions.push(points[idx].x, points[idx].y + d / 2, 0),
                    positions.push(points[idx].x + d / 2, points[idx].y + d, 0);
            }
            else if (type == 10) {
                positions.push(points[idx].x, points[idx].y + d / 2, 0),
                    positions.push(points[idx].x + d / 2, points[idx].y, 0);
                positions.push(points[idx].x + d / 2, points[idx].y + d, 0),
                    positions.push(points[idx].x + d, points[idx].y + d / 2, 0);
            }
        }
    }
    var mesh;
    let width = shapesize;
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader == null ? "" : vertexShader,
        fragmentShader: fragmentShader == null ? "" : fragmentShader,
        uniforms: {
            lightPosition: { value: pointLight.position },
            lightColor: { value: pointLight.color },
            lightIntensity: { value: pointLight.intensity },
            pointwidth: { value: width * 200 }
        }
    });
    const shaderMaterialP = new THREE.ShaderMaterial({
        vertexShader: vertexShader == null ? "" : vertexShaderP,
        fragmentShader: fragmentShader == null ? "" : fragmentShader,
        uniforms: {
            lightPosition: { value: pointLight.position },
            lightColor: { value: pointLight.color },
            lightIntensity: { value: pointLight.intensity },
            pointwidth: { value: width * 200 }
        }
    });

    if (!isLine) {//-----Points-----//
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry = BufferGeometryUtils.mergeVertices(geometry);
        geometry.computeVertexNormals();
        mesh = new THREE.Points(geometry, shaderMaterialP);
    }
    else {//-----Line-----//

        //==============================================Rectangular Segment========================================================//
        //let geometry2 = new THREE.BufferGeometry();
        //const vertices = [];
        //const faces = [];
        //let vertexIndex = 0;
        //
        //// We loop through the positions array in steps of 3 (since each position is composed of x, y, z)
        //for (let i = 0; i < positions.length - 6; i += 6) {
        //    // Extract the start and end point of the current line segment
        //    const startX = positions[i];
        //    const startY = positions[i + 1];
        //    const startZ = positions[i + 2];
        //    const endX = positions[i + 3];
        //    const endY = positions[i + 4];
        //    const endZ = positions[i + 5];
        //
        //    // Create two points perpendicular to the line segment to form the width of the ribbon
        //    const vectorDirection = new THREE.Vector3(endX - startX, endY - startY, endZ - startZ);
        //    const vectorPerpendicular = new THREE.Vector3(startY - endY, endX - startX, 0);
        //    vectorPerpendicular.normalize();
        //    vectorPerpendicular.multiplyScalar(width / 2);
        //    vectorDirection.normalize();
        //    vectorDirection.multiplyScalar(0.1);
        //
        //    const p1 = [startX - vectorPerpendicular.x - vectorDirection.x, startY - vectorPerpendicular.y - vectorDirection.y, startZ];
        //    const p2 = [startX + vectorPerpendicular.x - vectorDirection.x, startY + vectorPerpendicular.y - vectorDirection.y, startZ];
        //    const p3 = [endX - vectorPerpendicular.x + vectorDirection.x, endY - vectorPerpendicular.y + vectorDirection.y, endZ];
        //    const p4 = [endX + vectorPerpendicular.x + vectorDirection.x, endY + vectorPerpendicular.y + vectorDirection.y, endZ];
        //
        //    console.log(p1, p2, p3, p4);
        //
        //    // First triangle
        //    vertices.push(p1[0], p1[1], p1[2]);
        //    vertices.push(p3[0], p3[1], p3[2]);
        //    vertices.push(p2[0], p2[1], p2[2]);
        //    faces.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        //
        //    // Second triangle
        //    vertices.push(p3[0], p3[1], p3[2]);
        //    vertices.push(p4[0], p4[1], p4[2]);
        //    vertices.push(p2[0], p2[1], p2[2]);
        //    faces.push(vertexIndex + 2, vertexIndex + 1, vertexIndex + 3);
        //    vertexIndex += 4;
        //
        //}
        //geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ////geometry.setIndex(faces);



        //============================================================Cylinder Segment===============================================================//
        let geometry2 = new THREE.BufferGeometry();
        const vertices = [];
        const normals = []; // Array to store the normals
        const faces = [];
        let vertexIndex = 0;
        const numSides = 8; // Number of sides for the cylinders
        const angleIncrement = (Math.PI * 2) / numSides;

        for (let i = 0; i < positions.length - 6; i += 6) {
            const startX = positions[i];
            const startY = positions[i + 1];
            const startZ = positions[i + 2];
            const endX = positions[i + 3];
            const endY = positions[i + 4];
            const endZ = positions[i + 5];

            const vectorDirection = new THREE.Vector3(endX - startX, endY - startY, endZ - startZ);
            const axis = new THREE.Vector3(0, 0, 1); // Choose an arbitrary axis perpendicular to your direction vector if possible
            const startQuaternion = new THREE.Quaternion();

            vectorDirection.normalize();

            // Generate the circular points for the start and end cap of the cylinder
            for (let j = 0; j < numSides; j++) {
                startQuaternion.setFromAxisAngle(vectorDirection, angleIncrement * j);
                const dirVector = new THREE.Vector3().copy(axis).applyQuaternion(startQuaternion).normalize().multiplyScalar(width / 2);
                
                const normalVector = dirVector.clone().normalize();
                // Start cap points
                var segLen = 0.01;
                vertices.push(startX + dirVector.x - vectorDirection.x*segLen, startY + dirVector.y- vectorDirection.y*segLen, startZ + dirVector.z- vectorDirection.z*segLen);
                normals.push(normalVector.x+vectorDirection.x*segLen, normalVector.y+ vectorDirection.y*segLen, normalVector.z+vectorDirection.z*segLen);
                // End cap points
                vertices.push(endX + dirVector.x, endY + dirVector.y, endZ + dirVector.z);
                normals.push(normalVector.x, normalVector.y, normalVector.z);


                const startCapIndex = vertexIndex + j * 2;
                const endCapIndex = startCapIndex + 1;
                const nextStartCapIndex = vertexIndex + ((j + 1) % numSides) * 2;
                const nextEndCapIndex = nextStartCapIndex + 1;

                // First triangle - start cap
                faces.push(startCapIndex, nextEndCapIndex, endCapIndex);
                // Second triangle - start cap
                faces.push(startCapIndex, nextStartCapIndex, nextEndCapIndex);
            }

            vertexIndex += numSides * 2; // Increment by the number of sides times two for both start and end caps
        }
        geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry2.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry2.setIndex(faces);
        mesh = new THREE.Mesh(geometry2, shaderMaterial);
    }

    return mesh;

}

const vertexShader = `varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform vec3 lightPosition; // Position of the point light
uniform float pointwidth;

void main() {
    vNormal =normalMatrix * normal;
    vColor = vec3(0.1, 0.15, 0.35); // Color assigned to each point
    vLightDir = normalize(lightPosition - position.xyz);

    float distance = length(cameraPosition - position);
    gl_PointSize = pointwidth / distance;// Adjust the numerator to scale the base size
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}`;

const vertexShaderP = `varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform vec3 lightPosition; // Position of the point light
uniform float pointwidth;

void main() {
    vNormal =vec3(0.0, 0.0, 1.0);
    vColor = vec3(0.1, 0.15, 0.35); // Color assigned to each point
    vLightDir = normalize(lightPosition - position.xyz);

    float distance = length(cameraPosition - position);
    gl_PointSize = pointwidth / distance;// Adjust the numerator to scale the base size
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}`;

const fragmentShader = `varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform vec3 lightColor;    // Color of the point light
uniform float lightIntensity; // Intensity of the point light

void main() {
    vec3 norm = normalize(vNormal);
    
    float nDotL = clamp(dot(vLightDir, norm), 0.0, 1.0);
    vec3 diffuseColor = lightColor * nDotL * vColor * lightIntensity;

    gl_FragColor = vec4(diffuseColor,1.0); // Use the color from vertex shader with lighting
}`;
