import * as THREE from 'three';
import { floor, parse } from 'mathjs';


export const GeneratePointsFromFormula = (formula: string, size = 1000, drawRange = 10.0) => {
    let points = [];

    // Move anything from the right side of "=" to the left by subtracting
    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;

    // Try-catch block for parsing and compiling
    let func;
    try { func = parse(rearrangedFormula).compile(); } catch (e) { return []; }

    // Proceed only if the formula is valid

    var pointsCount = floor(size);

    // Orthognal grid
    const rangeX = [-drawRange, drawRange]; // X range
    const rangeY = [-drawRange, drawRange]; // Y range
    const stepX = (rangeX[1] - rangeX[0]) / parseFloat(pointsCount.toString()) * 2.0;
    const stepY = (rangeY[1] - rangeY[0]) / parseFloat(pointsCount.toString()) * 2.0;

    for (let x = rangeX[0]; x <= rangeX[1]; x += stepX) {
        for (let y = rangeY[0]; y <= rangeY[1]; y += stepY) {
            try {
                let result = func.evaluate({ x, y });
                if (Math.abs(result) <= 0.1 && !isNaN(result) && isFinite(result)) {
                    points.push(new THREE.Vector2(x, y));
                }
            } catch (e) {
                console.error('Error in formula evaluation:', e);
                return [];
            }
        }
    }

    return points;
};
// Polar grid will cross the formula shape, and the cross point is what we want
//const rangeR = [0.0, 10.0]; // Radius range in polar coordinate
//const stepR = (rangeR[1] - rangeR[0]) / parseFloat(pointsCount.toString());
//const stepTheta = Math.PI * 2.0 / parseFloat(pointsCount.toString())/2.0;
//for (let r = rangeR[0]; r <= rangeR[1]; r += stepR) {
//  for (let theta = 0.0; theta <= Math.PI * 2.0; theta += stepTheta) {
//    try {
//      let x = r * Math.cos(theta);
//      let y = r * Math.sin(theta);
//      let result = func.evaluate({ x, y });
//      if (Math.abs(result) <= tolerance && !isNaN(result) && isFinite(result)) {
//        points.push(new THREE.Vector2(x, y));
//        //console.log("P:", {x,y});
//      }
//    } catch (e) {
//      console.error('Error in formula evaluation2:', e);
//    }
//  }
//}

export const Generate2DAllPointsFromFormula = (formula, resolution = 100.0, drawRange = 10.0) => {
    let points = [];
    let values = [];

    // Rearrange the formula if it contains an "=" sign
    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;

    var appendFormula;
    // if the formula only consider (x or y) but no z, then we add -y or -x into the formula
    if (rearrangedFormula.includes("x") && !rearrangedFormula.includes("y") && !rearrangedFormula.includes("z"))
        appendFormula = rearrangedFormula.concat("-y");
    else if (rearrangedFormula.includes("y") && !rearrangedFormula.includes("x") && !rearrangedFormula.includes("z"))
        appendFormula = rearrangedFormula.concat("-x");
    else 
        appendFormula = rearrangedFormula;

    console.log("Rearranged formula:", appendFormula);
    // Try-catch block for parsing and compiling the formula
    let func;
    try {
        func = parse(appendFormula).compile();
    } catch (e) {
        console.error('Error in formula parsing:', e);
        return { points: [], values: [] };
    }

    var axisMin = -drawRange;
    var axisMax = drawRange;
    var axisRange = axisMax - axisMin;

    // Convert resolution to an integer
    resolution = Math.floor(resolution);

    for (var j = 0; j < resolution; j++) {
        for (var i = 0; i < resolution; i++) {
            try {
                var x = axisMin + axisRange * i / (resolution - 1);
                var y = axisMin + axisRange * j / (resolution - 1);
                let result = func.evaluate({ x, y });

                values.push(result);
                points.push(new THREE.Vector2(x, y));

            } catch (e) {
                console.error('Error in formula evaluation:', e);
                return { points: [], values: [] };
            }
        }
    }

    return { points, values };
};

//var loader = new THREE.FileLoader();
var pSize = 50;

const vertexShader = `varying vec3 vColor;
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

export const Topologying2D = (points: any, pointLight: THREE.Light) => {

    //const vertexShader = await loadShader(loader, './src/components/shaders/3DSurface.vert') as string;
    //const fragmentShader = await loadShader(loader, './src/components/shaders/3DSurface.frag') as string;


    // Points material using ShaderMaterial
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader == null ? "" : vertexShader,
        fragmentShader: fragmentShader == null ? "" : fragmentShader,
        uniforms: {
            lightPosition: { value: pointLight.position },
            lightColor: { value: pointLight.color },
            lightIntensity: { value: pointLight.intensity },
            pointSize: { value: pSize }
        }
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create a Points mesh with ShaderMaterial
    return new THREE.Points(geometry, shaderMaterial);
}

export const Generate3DAllPointsFromFormula = (formula: string, size = 100.0, drawRange = 10.0) => {
    let points = [];
    let values = [];
    // Rearrange the formula

    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;
    //console.log("Formula:", formula);

    // Try-catch block for parsing and compiling
    let func;
    try { func = parse(rearrangedFormula).compile(); } catch (e) { return []; }

    var axisMin = -drawRange;
    var axisMax = drawRange;
    var axisRange = axisMax - axisMin;

    //transfer size to integer
    size = floor(size);

    for (var k = 0; k < size; k++)
        for (var j = 0; j < size; j++)
            for (var i = 0; i < size; i++) {
                try {
                    var x = axisMin + axisRange * i / (size - 1);
                    var y = axisMin + axisRange * j / (size - 1);
                    var z = axisMin + axisRange * k / (size - 1);
                    let result = func.evaluate({ x, y, z });
                    values.push(result);
                    points.push(new THREE.Vector3(x, y, z));

                } catch (e) {
                    console.error('Error in formula evaluation:', e);
                    return [];
                }
            }

    return { points, values };
};

export const Generate3DPointsFromFormula = (formula: string, size = 100.0, drawRange = 10.0) => {
    let points = [];
    // Rearrange the formula

    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;
    //console.log("Formula:", formula);

    // Try-catch block for parsing and compiling
    let func;
    try { func = parse(rearrangedFormula).compile(); } catch (e) { return []; }

    var axisMin = -drawRange;
    var axisMax = drawRange;
    var axisRange = axisMax - axisMin;

    size = floor(size);

    for (var k = 0; k < size; k++)
        for (var j = 0; j < size; j++)
            for (var i = 0; i < size; i++) {
                var x = axisMin + axisRange * i / (size - 1.);
                var y = axisMin + axisRange * j / (size - 1.);
                var z = axisMin + axisRange * k / (size - 1.);
                try {
                    let result = func.evaluate({ x, y, z });

                    if (Math.abs(result) <= 0.14 && !isNaN(result) && isFinite(result)) {
                        points.push(new THREE.Vector3(x, y, z));
                    }
                } catch (e) {
                    console.error('Error in formula evaluation:', e);
                    return [];
                }
            }

    return points;

};

//interface Point3D {
//    x: number;
//    y: number;
//    z: number;
//}
//export const projectPointsUsingPCA = (points3D: Point3D[]): [number, number][] => {
//    // 转换为矩阵形式
//    const matrix = new Matrix(points3D.map(p => [p.x, p.y, p.z]));
//    // 创建PCA对象
//    const pca = new PCA(matrix);
//    // 使用PCA获取前两个主成分
//    const projectedMatrix = pca.predict(matrix, { nComponents: 2 }).to2DArray();
//    // 确保转换为 [number, number] 类型的数组
//    return projectedMatrix.map((p: number[]) => [p[0], p[1]] as [number, number]);
//};
//export const projectPointsToXZPlane = (points3D: Point3D[]): [number, number][] => {
//    return points3D.map(p => [p.x, p.z]);
//};
//export const projectPointsToXYPlane = (points3D: Point3D[]): [number, number][] => {
//    return points3D.map(p => [p.x, p.y]);
//}
//export const projectPointsToYZPlane = (points3D: Point3D[]): [number, number][] => {
//    return points3D.map(p => [p.y, p.z]);
//}

//function loadShader(loader: THREE.FileLoader, url: string) {
//    return new Promise((resolve, reject) => {
//        loader.load(url, data => resolve(data), undefined, err => reject(err));
//    });
//}

export const Topologying3DPoint = (points: THREE.Vector3[], pointLight: THREE.Light) => {
    //const vertexShader = await loadShader(loader, './src/components/shaders/3DSurface.vert') as string;
    //const fragmentShader = await loadShader(loader, './src/components/shaders/3DSurface.frag') as string;

    // Points material using ShaderMaterial
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader == null ? "" : vertexShader,
        fragmentShader: fragmentShader == null ? "" : fragmentShader,
        uniforms: {
            lightPosition: { value: pointLight.position },
            lightColor: { value: pointLight.color },
            lightIntensity: { value: pointLight.intensity },
            pointSize: { value: pSize }
        }
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create a Points mesh with ShaderMaterial
    return new THREE.Points(geometry, shaderMaterial);
}


