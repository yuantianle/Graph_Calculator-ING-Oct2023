import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from './OrbitControls.js'
import { OrbitControlsGizmo } from  "./OrbitControlsGizmo.js";
import { parse } from 'mathjs';
import { GridHelper } from 'three';
import { Generate3DPointsFromFormula, GeneratePointsFromFormula, Topologying } from './Drawing';

interface GraphCanvasProps {
    formula: string;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ formula }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            // Set up Three.js scene
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth*0.8, window.innerHeight*0.7);

            camera.position.z = 5;

            // Handle window resize
            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth*0.8, window.innerHeight*0.7);
            }
            window.addEventListener('resize', onWindowResize, false);

            // Add GridHelper
            const gridSize = 70;
            var gridDivisions = 200;
            var gridHelper = new GridHelper(gridSize, gridDivisions, 0x181818, 0x181818);
            gridHelper.material.opacity = 0.1;
            gridHelper.material.depthWrite = false;
            gridHelper.material.fog = true;
            gridHelper.material.transparent = true;
            scene.add(gridHelper);

            const cameraDistance = () => camera.position.length(); // Simple distance-from-origin
            let oldScaleFactor = 1; 
            
            var scaleFactor,newGridSize,newGridDivisions;
            const updateGridHelper = () => {
                scaleFactor = Math.floor(cameraDistance()); // Example scaling, adjust as needed
              
                //if (scaleFactor !== oldScaleFactor) {
                  oldScaleFactor = scaleFactor;
              
                  newGridSize = gridSize * scaleFactor; // Adjust base size
                  newGridDivisions = gridDivisions* scaleFactor; // Adjust base divisions
              
                  // Remove old gridHelper
                  if (gridHelper) scene.remove(gridHelper);
              
                  // Create new GridHelper with updated size and divisions
                  gridHelper = new GridHelper(newGridSize, newGridDivisions, 0x181818, 0x181818);
                  gridHelper.material.opacity = 0.1;
                  gridHelper.material.depthWrite = false;
                  gridHelper.material.fog = true;
                  gridHelper.material.transparent = true;
              
                  // Add new gridHelper to the scene
                  scene.add(gridHelper);
                //}
              };
            
            // Function to generate points from the formula
            const is3DFormula = formula.includes('z');

            var meshColor = 0x4356b8;
            let geometry, material, mesh:any, points:any, wireframeGeometry:any;
            if (is3DFormula) {
              points = Generate3DPointsFromFormula(formula);
              geometry = new THREE.BufferGeometry().setFromPoints(points);
              material = new THREE.PointsMaterial({ color: meshColor, size: 0.1 });
              mesh = new THREE.Points(geometry, material);
            } else {
              points = GeneratePointsFromFormula(formula);
              geometry = new THREE.BufferGeometry().setFromPoints(points);
              material = new THREE.LineBasicMaterial({ color: meshColor });
              mesh = new THREE.Line(geometry, material);
            }
            scene.add(mesh);

            //add light
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(0, 0, 5);
            scene.add(light);

            function updateShapeType3D(value:any) {
                // Dispose current mesh and geometry to avoid memory leaks
                if (mesh) {
                  scene.remove(mesh);
                  mesh.geometry.dispose();
                  if (mesh.material.dispose) mesh.material.dispose();
                }

                switch (value) {
                  case ShapeType.Points:
                    // Logic for rendering points
                    points = Generate3DPointsFromFormula(formula);
                    geometry = new THREE.BufferGeometry().setFromPoints(points);
                    material = new THREE.PointsMaterial({ color: meshColor, size: 0.1 });
                    mesh = new THREE.Points(geometry, material);
                    break;
                  case ShapeType.Mesh:
                    // Logic for rendering mesh
                    points = Generate3DPointsFromFormula(formula);
                    geometry = Topologying(points);
                    wireframeGeometry = new THREE.WireframeGeometry(geometry);
                    material = new THREE.LineBasicMaterial({ color: meshColor });
                    mesh = new THREE.LineSegments(wireframeGeometry, material);
                    break;
                  case ShapeType.Surface:
                    // Logic for rendering surface
                    points = Generate3DPointsFromFormula(formula);
                    geometry = Topologying(points);
                    material = new THREE.MeshBasicMaterial(({ color: meshColor, side: THREE.DoubleSide, wireframe: false}));
                    mesh = new THREE.Mesh(geometry, material);
                    break;
                }
              
                // Add new mesh to the scene
                scene.add(mesh);
            }
            
            // Add controller
            const controls = new OrbitControls(camera, renderer.domElement);
            const controlsGizmo = new OrbitControlsGizmo(controls, { size:  100, padding: 8, lineWidth:3});
            document.body.appendChild(controlsGizmo.domElement);
            controls.enableDamping = true;

            // Add parameter controller
            const gui = new dat.GUI();
            const ShapeType = {
                Points: 'points',
                Mesh: 'mesh',
                Surface: 'surface',
                // Add more types as needed
            };
            const params = {
                points2D: 50,
                points3D: 30,
                rangeX: [-10, 10],
                rangeY: [-10, 10],
                divisions: gridDivisions,
                shapeType: ShapeType.Points,
              };

            gui.add(params, 'divisions', 10, 1000).step(10).name('Grid Density').onChange(newDivisions => {
                gridDivisions = newDivisions;
                updateGridHelper();
            });

            if (is3DFormula) {
                gui.add(params, 'points3D', 10, 1000).onChange(value => {
                  // Update 3D graph
                  const points = Generate3DPointsFromFormula(formula, value);
                  mesh.geometry.dispose();
                  mesh.geometry = new THREE.BufferGeometry().setFromPoints(points);
                });
                gui.add(params, 'shapeType', Object.values(ShapeType)).onChange(updateShapeType3D);
            } else {
                gui.add(params, 'points2D', 10, 1000).onChange(value => {
                  // Update 2D graph
                  const points = GeneratePointsFromFormula(formula, value);
                  mesh.geometry.dispose();
                  mesh.geometry = new THREE.BufferGeometry().setFromPoints(points);
                });
            }

            if (is3DFormula) {
                gui.add(params.rangeX, 0, -20, 20).onChange(() => {
                  update3DGraph();
                });
                gui.add(params.rangeY, 1, -20, 20).onChange(() => {
                  update3DGraph();
                });
            }
              
              function update3DGraph() {
                const points = Generate3DPointsFromFormula(formula, params.points3D);
                mesh.geometry.dispose();
                mesh.geometry = new THREE.BufferGeometry().setFromPoints(points);
              }

            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                updateGridHelper();
                controls.update();
                controlsGizmo.update();
                renderer.render(scene, camera);
              };
            animate();


            // Cleanup
            return () => {
              gui.destroy();
              window.removeEventListener('resize', onWindowResize);
            
              // Dispose of 3D objects
              if (mesh) { // Assuming 'line' is your 2D or 3D object
                mesh.geometry.dispose();
                if (mesh.material instanceof Array) {
                    mesh.material.forEach((mtrl: { dispose: () => any; }) => mtrl.dispose());
                } else {
                    mesh.material.dispose();
                }
                scene.remove(mesh);
              }
          
              // If you have any other dynamic 3D objects added based on the graph type
              // make sure to dispose them as well
          
              // Dispose of the scene, renderer, and any other Three.js elements
              // Dispose method may not exist directly on scene, you might need to iterate over children and dispose them individually
              scene.clear();
              renderer.dispose();
          
              // Remove controls if they exist
              if (controls) {
                controls.dispose();
                controlsGizmo.dispose();
              }
            };

                }
            }, [formula]);

    return <canvas ref={canvasRef} />;
};



export default GraphCanvas;

