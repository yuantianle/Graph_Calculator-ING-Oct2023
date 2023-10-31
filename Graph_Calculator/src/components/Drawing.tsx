import * as THREE from 'three';
import { parse } from 'mathjs';

export const GeneratePointsFromFormula = (formula: any, pointsCount = 50) => {
    let points = [];
    const func = parse(formula).compile();
    const range = [-10, 10]; // X range
    const step = (range[1] - range[0]) / pointsCount;

    for (let x = range[0]; x <= range[1]; x += step) {
      try {
        let y = func.evaluate({ x });
        if (!isNaN(y) && isFinite(y)) {
          points.push(new THREE.Vector2(x, y));
        }
      } catch (e) {
        console.error('Error in formula evaluation:', e);
      }
    }

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
  let vertices = [];
  points.forEach(point => {
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