import * as THREE from 'three';
import { parse } from 'mathjs';
import { Delaunay } from 'd3-delaunay';
import { Matrix} from 'ml-matrix';
import {PCA} from 'ml-pca';

export const GeneratePointsFromFormula = (formula: string, pointsCount = 1000, tolerance = 0.05) => {
  let points = [];
  
  // Move anything from the right side of "=" to the left by subtracting
  const rearrangedFormula = formula.includes("=") ?
  formula.split("=").map(s => `(${s.trim()})`).join("-") :
  formula;
  console.log("Rearranged formula:", rearrangedFormula);

  // Try-catch block for parsing and compiling
  let func;
  try{func = parse(rearrangedFormula).compile();} catch (e) {return [];}

  // Proceed only if the formula is valid

    // Orthognal grid
    const rangeX = [-10.0, 10.0]; // X range
    const rangeY = [-10.0, 10.0]; // Y range
    const stepX = (rangeX[1] - rangeX[0]) / parseFloat(pointsCount.toString())*2.0;
    const stepY = (rangeY[1] - rangeY[0]) / parseFloat(pointsCount.toString())*2.0;

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

  // Vertex shader
  const vertexShader = `
  varying vec3 vColor;
  varying float vLightIntensity;

  uniform vec3 lightPosition; // Position of the point light
  uniform vec3 lightColor;    // Color of the point light
  uniform float lightIntensity; // Intensity of the point light
  
  void main() {
      // Compute direction from point to light
      vec3 lightDir = -normalize(lightPosition - position);

      // Normalized position vector from the point to the camera
      vec3 normal = normalize(position - cameraPosition);

      // Lambertian reflectance
      float light = max(dot(normal, lightDir), 0.0) * lightIntensity;

      vColor = vec3(0, 0.8, 0.8); // Color assigned to each point
      vLightIntensity = light; // The light intensity that hits the point

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 7.0; // Size of the point
      gl_Position = projectionMatrix * mvPosition;
  }
  `;

  // Fragment shader
  const fragmentShader = `
  varying vec3 vColor;
  varying float vLightIntensity;

  void main() {
      // Modify color intensity based on light
      vec3 color = vColor * vLightIntensity;
      
      gl_FragColor = vec4(color, 1.0); // Use the color from vertex shader with lighting
  }
  `;

  export const Topologying2D = (points:any, pointLight: THREE.PointLight) => {
    // Points material using ShaderMaterial
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        lightPosition: { value: pointLight.position },
        lightColor: { value: pointLight.color },
        lightIntensity: { value: pointLight.intensity },
    }
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create a Points mesh with ShaderMaterial
    return new THREE.Points(geometry, shaderMaterial);
  }

//export const Generate3DPointsFromFormula = (formula: string, pointsCount = 100, tolerance = 0.05) => {
//  let points = [];
//
//  // Rearrange the formula
//  const rearrangedFormula = formula.includes("=") ?
//      formula.split("=").map(s => `(${s.trim()})`).join("-") :
//      formula;
//
//  let func;
//  try {
//      func = parse(rearrangedFormula).compile();
//  } catch (e) {
//      console.error('Error parsing formula:', e);
//      return [];
//  }
//
//  const range = { x: [-10, 10], y: [-10, 10], z: [-10, 10] };
//  const stepX = (range.x[1] - range.x[0]) / pointsCount;
//  const stepY = (range.y[1] - range.y[0]) / pointsCount;
//  const stepZ = (range.z[1] - range.z[0]) / pointsCount;
//
//  for (let x = range.x[0]; x <= range.x[1]; x += stepX) {
//      for (let y = range.y[0]; y <= range.y[1]; y += stepY) {
//          for (let z = range.z[0]; z <= range.z[1]; z += stepZ) {
//              try {
//                  let result = func.evaluate({ x, y, z });
//                  if (Math.abs(result) <= tolerance && !isNaN(result) && isFinite(result)) {
//                      points.push(new THREE.Vector3(x, y, z));
//                  }
//              } catch (e) {
//                  console.error('Error in formula evaluation:', e);
//                  return [];
//              }
//          }
//      }
//  }
//  return points;
//};

export const Generate3DPointsFromFormula = (formula:string, size = 100, bounds = [-2 * Math.PI, 2 * Math.PI]) => {
  let points = [];
  // Rearrange the formula
  
  const rearrangedFormula = formula.includes("=") ?
      formula.split("=").map(s => `(${s.trim()})`).join("-") :
      formula;
  //console.log("Formula:", formula);

  // Try-catch block for parsing and compiling
  let func;
  try{func = parse(rearrangedFormula).compile();} catch (e) {return [];}

  const step = (bounds[1] - bounds[0]) / size;

  for (let i = 0, z = bounds[0]; z <= bounds[1]; z += step, i++) {
      for (let j = 0, y = bounds[0]; y <= bounds[1]; y += step, j++) {
          for (let k = 0, x = bounds[0]; x <= bounds[1]; x += step, k++) {
              try {
                  let result = func.evaluate({ x, y, z });
                  if (Math.abs(result) <= 0.05 && !isNaN(result) && isFinite(result)) {
                      points.push(new THREE.Vector3(x, y, z));
                  }
              } catch (e) {
                  console.error('Error in formula evaluation:', e);
                  return [];
              }
          }
      }
  }

  return points;
};

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const projectPointsUsingPCA = (points3D: Point3D[]): [number, number][] => {
  // 转换为矩阵形式
  const matrix = new Matrix(points3D.map(p => [p.x, p.y, p.z]));
  // 创建PCA对象
  const pca = new PCA(matrix);
  // 使用PCA获取前两个主成分
  const projectedMatrix = pca.predict(matrix, { nComponents: 2 }).to2DArray();
  // 确保转换为 [number, number] 类型的数组
  return projectedMatrix.map((p: number[]) => [p[0], p[1]] as [number, number]);
};
export const projectPointsToXZPlane = (points3D: Point3D[]): [number, number][] => {
  return points3D.map(p => [p.x, p.z]);
};
export const projectPointsToXYPlane = (points3D: Point3D[]): [number, number][] => {
  return points3D.map(p => [p.x, p.y]);
}
export const projectPointsToYZPlane = (points3D: Point3D[]): [number, number][] => {
  return points3D.map(p => [p.y, p.z]);
}



export const Topologying3DPoint = (points: THREE.Vector3[], pointLight: THREE.PointLight) => {
  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      lightPosition: { value: pointLight.position },
      lightColor: { value: pointLight.color },
      lightIntensity: { value: pointLight.intensity },
  }
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Create a Points mesh with ShaderMaterial
  return new THREE.Points(geometry, shaderMaterial);
}


export const Topologying3D = (points3D: Point3D[]) => {

  // if points3D is empty, return empty mesh
  if (points3D.length === 0) {
    return new THREE.Mesh();
  }
  // 将三维点投影到二维
  let points2D = projectPointsToXYPlane(points3D);//projectPointsUsingPCA(points3D);//


  // 使用 Delaunay 三角剖分
  let delaunay = Delaunay.from(points2D);
  let triangles = delaunay.triangles;

  // 用于存储顶点坐标和索引的数组
  let vertices = [];
  let indices = [];

  // 将三维点添加到顶点数组中
  for (let point of points3D) {
      vertices.push(point.x, point.y, point.z);
  }

  // 将三角形的顶点索引添加到索引数组中
  for (let i = 0; i < triangles.length; i++) {
      indices.push(triangles[i]);
  }

  // 创建BufferGeometry对象
  let geometry = new THREE.BufferGeometry();

  // 添加顶点位置属性
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  // 计算法线
  geometry.computeVertexNormals();

  // 创建材质
  let material = new THREE.MeshPhongMaterial({ color: 0x00ffff, side: THREE.DoubleSide, wireframe: false});

  // 创建网格
  return new THREE.Mesh(geometry, material);
};

