import * as THREE from 'three';
import { floor, parse } from 'mathjs';


export const GeneratePointsFromFormula = (formula: string, pointsCount = 1000, tolerance = 0.05) => {
    let points = [];

    // Move anything from the right side of "=" to the left by subtracting
    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;
    console.log("Rearranged formula:", rearrangedFormula);

    // Try-catch block for parsing and compiling
    let func;
    try { func = parse(rearrangedFormula).compile(); } catch (e) { return []; }

    // Proceed only if the formula is valid

    // Orthognal grid
    const rangeX = [-10.0, 10.0]; // X range
    const rangeY = [-10.0, 10.0]; // Y range
    const stepX = (rangeX[1] - rangeX[0]) / parseFloat(pointsCount.toString()) * 2.0;
    const stepY = (rangeY[1] - rangeY[0]) / parseFloat(pointsCount.toString()) * 2.0;

    for (let x = rangeX[0]; x <= rangeX[1]; x += stepX) {
        for (let y = rangeY[0]; y <= rangeY[1]; y += stepY) {
            try {
                let result = func.evaluate({ x, y });
                if (Math.abs(result) <= tolerance && !isNaN(result) && isFinite(result)) {
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
var loader = new THREE.FileLoader();
var pSize = 50;

export const Topologying2D = async (points: any, pointLight: THREE.Light) => {

    const vertexShader = await loadShader(loader, './src/components/shaders/3DSurface.vert') as string;
    const fragmentShader = await loadShader(loader, './src/components/shaders/3DSurface.frag') as string;

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

export const Generate3DAllPointsFromFormula = (formula: string, size = 100) => {
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

    var axisMin = -10;
	var axisMax =  10;
	var axisRange = axisMax - axisMin;

    //transfer size to integer
    size = floor(size);

    for (var k = 0; k < size; k++)
    for (var j = 0; j < size; j++)
    for (var i = 0; i < size; i++){
        try {
            var x = axisMin + axisRange * i / (size - 1);
            var y = axisMin + axisRange * j / (size - 1);
            var z = axisMin + axisRange * k / (size - 1);
            let result = func.evaluate({ x, y, z });
            values.push(result);
            points.push( new THREE.Vector3(x,y,z) );
            
        } catch (e) {
            console.error('Error in formula evaluation:', e);
            return [];
        }
    }

    return {points, values};
};

export const Generate3DPointsFromFormula = (formula: string, size = 100) => {
    let points = [];
    // Rearrange the formula

    const rearrangedFormula = formula.includes("=") ?
        formula.split("=").map(s => `(${s.trim()})`).join("-") :
        formula;
    //console.log("Formula:", formula);

    // Try-catch block for parsing and compiling
    let func;
    try { func = parse(rearrangedFormula).compile(); } catch (e) { return []; }

    var axisMin = -10;
	var axisMax =  10;
	var axisRange = axisMax - axisMin;

    size = floor(size);

    for (var k = 0; k < size; k++)
    for (var j = 0; j < size; j++)
    for (var i = 0; i < size; i++){
        var x = axisMin + axisRange * i / (size - 1);
        var y = axisMin + axisRange * j / (size - 1);
        var z = axisMin + axisRange * k / (size - 1);
        try {
            let result = func.evaluate({ x, y, z });
            if ( Math.abs(result) <= 0.1 && !isNaN(result) && isFinite(result)) {
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

function loadShader(loader: THREE.FileLoader, url: string) {
    return new Promise((resolve, reject) => {
        loader.load(url, data => resolve(data), undefined, err => reject(err));
    });
}

export const Topologying3DPoint = async (points: THREE.Vector3[], pointLight: THREE.Light) => {
    const vertexShader = await loadShader(loader, './src/components/shaders/3DSurface.vert') as string;
    const fragmentShader = await loadShader(loader, './src/components/shaders/3DSurface.frag') as string;

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


