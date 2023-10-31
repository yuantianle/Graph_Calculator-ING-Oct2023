import * as THREE from 'three';
import { parse } from 'mathjs';

//export const GeneratePointsFromFormula = (formula: any, pointsCount = 50) => {
//    let points = [];
//    const func = parse(formula).compile();
//    const range = [-10, 10]; // X range
//    const step = (range[1] - range[0]) / pointsCount;
//
//    for (let x = range[0]; x <= range[1]; x += step) {
//      try {
//        let y = func.evaluate({ x });
//        if (!isNaN(y) && isFinite(y)) {
//          points.push(new THREE.Vector2(x, y));
//        }
//      } catch (e) {
//        console.error('Error in formula evaluation:', e);
//      }
//    }
//
//    return points;
//};
//

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

  return points;
};

  
export const Generate3DPointsFromFormula = (formula: any, pointsCount = 30) => {
  let points = [];
  const func = parse(formula).compile();
  const range = { x: [-10, 10], y: [-10, 10] };
  const stepX = (range.x[1] - range.x[0]) / pointsCount;
  const stepY = (range.y[1] - range.y[0]) / pointsCount;

  for (let x = range.x[0]; x <= range.x[1]; x += stepX) {
    for (let y = range.y[0]; y <= range.y[1]; y += stepY) {
      try {
        let z = func.evaluate({ x, y });
        if (!isNaN(z) && isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      } catch (e) {
        console.error('Error in formula evaluation:', e);
      }
    }
  }
  return points;
};

// Generate a THREE.BufferGeometry from an array of THREE.Vector3

export const Topologying = (points: any) => {
let geometry = new THREE.BufferGeometry();

// Flatten the array of Vector3 to an array of coordinates
let vertices: number[] = [];
points.forEach((point: THREE.Vector3) => {
    vertices.push(point.x, point.y, point.z);
});

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

// Calculate the indices for the faces
let indices = [];
let numPointsPerRow = Math.sqrt(points.length); // Assuming a square grid of points
  if (!Number.isInteger(numPointsPerRow)) {
    console.error("The number of points does not form a perfect square, thus cannot be formed into a square grid mesh.");
    return geometry; // Or handle this scenario more appropriately
  }

  for (let i = 0; i < numPointsPerRow - 1; i++) {
    for (let j = 0; j < numPointsPerRow - 1; j++) {
      let idx = i * numPointsPerRow + j;

      // Create two triangles (a square) per iteration
      indices.push(idx, idx + numPointsPerRow, idx + numPointsPerRow + 1);
      indices.push(idx, idx + numPointsPerRow + 1, idx + 1);
    }
  }

  geometry.setIndex(indices);
  geometry.computeVertexNormals(); // Compute normals for shading

  return geometry;
}