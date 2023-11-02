import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from './OrbitControls.js'
import { OrbitControlsGizmo } from "./OrbitControlsGizmo.js";
import { GridHelper } from 'three';
import { Generate3DPointsFromFormula, Generate3DAllPointsFromFormula, GeneratePointsFromFormula, Topologying2D, Topologying3DPoint } from './Drawing';
import { Topologying3DMarchingCubes } from './MarchingCubes.js';



interface GraphCanvasProps {
    formula: string;
}

var shape3DType = 'points';

const GraphCanvas: React.FC<GraphCanvasProps> = ({ formula }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            // ---------- ----------
            // Basic setup
            // ---------- ----------
            // Set up Three.js scene
            const scene = new THREE.Scene(); 
            const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000); 
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); 
            renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.72);

            camera.position.z = 20;

            // Handle window resize
            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.7);
            }
            window.addEventListener('resize', onWindowResize, false);

            // ---------- ----------
            // Add AXES HELPER
            // ---------- ----------
            const axesHelper = new THREE.AxesHelper(20);
            scene.add(axesHelper);

            // ---------- ----------
            // Add GRID HELPER
            // ---------- ----------
            const gridSize = 70;
            var gridDivisions = 20;
            var gridHelper = new GridHelper(gridSize*2, gridDivisions*2, 0x181818, 0x181818);
            gridHelper.material.opacity = 0.1;
            gridHelper.material.depthWrite = false;
            gridHelper.material.fog = true;
            gridHelper.material.transparent = true;
            scene.add(gridHelper);

            var gridHelper2 = new GridHelper(gridSize, gridDivisions, 0x181818, 0x181818);
            gridHelper2.material.opacity = 0.1;
            gridHelper2.material.depthWrite = false;
            gridHelper2.material.fog = true;
            gridHelper2.material.transparent = true;
            gridHelper.rotation.x = Math.PI / 2;
            scene.add(gridHelper2);

            const cameraDistance = () => camera.position.length(); // Simple distance-from-origin

            var scaleFactor, newGridSize, newGridDivisions;
            const updateGridHelper = () => {
                scaleFactor = Math.floor(cameraDistance()); // Example scaling, adjust as needed

                //if (scaleFactor !== oldScaleFactor) {
                newGridSize = gridSize * scaleFactor; // Adjust base size
                newGridDivisions = gridDivisions * scaleFactor; // Adjust base divisions

                // Remove old gridHelper
                if (gridHelper) scene.remove(gridHelper);
                if (gridHelper2) scene.remove(gridHelper2);

                // Create new GridHelper with updated size and divisions
                gridHelper = new GridHelper(gridSize*2, gridDivisions*2, 0x181818, 0x181818);
                gridHelper.material.opacity = 0.1;
                gridHelper.material.depthWrite = false;
                gridHelper.material.fog = true;
                gridHelper.material.transparent = true;

                gridHelper2 = new GridHelper(newGridSize, newGridDivisions, 0x181818, 0x181818);
                gridHelper2.material.opacity = 0.1;
                gridHelper2.material.depthWrite = false;
                gridHelper2.material.fog = true;
                gridHelper2.material.transparent = true;
                gridHelper.rotation.x = Math.PI / 2;

                // Add new gridHelper to the scene
                scene.add(gridHelper);
                scene.add(gridHelper2);
                //}
            };

            // ---------- ----------
            // POINT LIGHT
            // ---------- ----------

            const pl = new THREE.DirectionalLight( 0xffffff, 2);
            pl.position.set(10, 10, 10);
            //add light sphere
            const sphereSize = 1;
            //const pointLightHelper = new THREE.DirectionalLightHelper(pl, sphereSize);
            //scene.add(pointLightHelper);
            // add spere at light position
            const pointLightSphere = new THREE.Mesh(new THREE.SphereGeometry(sphereSize), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            pointLightSphere.position.copy(pl.position);
            scene.add(pointLightSphere);
            scene.add(pl);

            // Function to generate points from the formula
            const is3DFormula = formula.includes('z');
            let mesh: any, points: THREE.Vector3[] = [];

            // ---------- ----------
            // Draw 2D/3D graph
            // ---------- ----------
            const ShapeType = {
                Points: 'points',
                Mesh: 'mesh',
                Surface: 'surface',
                // Add more types as needed
            };
            async function updateShapeType3D() {
                // Dispose current mesh and geometry to avoid memory leaks
                if (mesh) {
                    if (mesh.geometry) {
                        mesh.geometry.dispose();
                    }

                    if (mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((m: { dispose: () => any; }) => m.dispose && m.dispose());
                        } else if (mesh.material.dispose) {
                            mesh.material.dispose();
                        }
                    }

                    scene.remove(mesh);
                }
                var points3DSurface;
                var size = 100;
                switch (shape3DType) {
                    case ShapeType.Points:// Logic for rendering points
                        points3DSurface = Generate3DPointsFromFormula(formula);
                        //extract the first element of points3DSurface to points (which is an array of THREE.Vector3)
                        points = points3DSurface.points;
                        mesh = await Topologying3DPoint(points, pl);
                        break;
                    case ShapeType.Mesh:// Logic for rendering mesh
                        points3DSurface = Generate3DAllPointsFromFormula(formula,100);
                        mesh = Topologying3DMarchingCubes(points3DSurface, 100, true);
                        break;
                    case ShapeType.Surface:// Logic for rendering surface
                        points3DSurface = Generate3DAllPointsFromFormula(formula);
                        mesh = Topologying3DMarchingCubes(points3DSurface, 100, false);
                        break;
                }
                
                // Add new mesh to the scene
                return mesh;
            }

            async function updateShapeType2D() {
                if (mesh) {
                    scene.remove(mesh);
                    mesh.geometry.dispose();
                    if (mesh.material.dispose) mesh.material.dispose();
                }
                points = GeneratePointsFromFormula(formula);
                mesh = await Topologying2D(points, pl);
                return mesh;
            }

            const updateMesh = async () => {
                if (is3DFormula) {
                    // Await the completion of the async function
                    mesh = await updateShapeType3D();
                } else {
                    mesh = await updateShapeType2D();
                }
                // Add the mesh to the scene only if it's defined
                if (mesh) {
                    scene.add(mesh);
                }
            };

            // Execute the function
            updateMesh().catch(error => {
                console.error("Error updating mesh:", error);
            });
            

            // ---------- ----------
            // Add light
            // ---------- ----------
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(0, 0, 5);
            scene.add(light);

            // ---------- ----------
            // Setup Orbit Controls and Gizmos
            // ---------- ----------
            const controls = new OrbitControls(camera, renderer.domElement);
            const controlsGizmo = new OrbitControlsGizmo(controls, { size: 100, padding: 8, lineWidth: 3 }); // tiny gizmo widget as blender
            document.body.appendChild(controlsGizmo.domElement);
            controls.enableDamping = true;

            // ---------- ----------
            // Setup GUI Controls
            // ---------- ----------
            const gui = new dat.GUI({width: 400,
                    autoPlace: true,
                    hideable: true,
                    closeOnTop: true,
                    closed: true
                });
            gui.domElement.id = 'gui';

            // initialize values for GUI controls
            const params = {
                //common
                'Grid Density': gridDivisions,
                'X draw range': 0,
                'Y draw range': 0,
                //2d
                'points2D': 1000,
                //3d
                'points3D': 1000,
                'shapeType': shape3DType,
            };

            // Add common GUI controls
            gui.add(params, 'Grid Density', 10, 100).onChange(value => {
                gridDivisions = value;
                updateGridHelper();
            });

            // Conditional controls based on formula dimensionality
            if (is3DFormula) {
                // [1.object to add the property to, 2.name of the property, 3.min value, 4.max value]
                gui.add(params, 'points3D', 10, 1000).onChange(updateMesh);
                gui.add(params, 'shapeType', Object.values(ShapeType)).onChange(value => {
                    shape3DType = value;
                    updateMesh();});
            } else {
                gui.add(params, 'points2D', 10, 1000).onChange(updateMesh);
            }

            // Creating subfolders for ranges might enhance organization
            const rangeFolder = gui.addFolder('Range Settings');
            rangeFolder.add(params, 'X draw range', -20, 20).onChange(updateMesh); // Correcting property references
            rangeFolder.add(params, 'Y draw range', -20, 20).onChange(updateMesh); // Correcting property references


            // ---------- ----------
            // Render
            // ---------- ----------
            const animate = () => {
                requestAnimationFrame(animate);
                updateGridHelper();
                controls.update();
                controlsGizmo.update();
                renderer.render(scene, camera);
            };
            animate();


            // ---------- ----------
            // Cleanup
            // ---------- ----------
            return () => {
                gui.destroy();
                window.removeEventListener('resize', onWindowResize);

                // Dispose of 3D objects
                if (mesh) {
                    if (mesh.geometry) {
                        mesh.geometry.dispose();
                    }

                    if (mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((m: { dispose: () => any; }) => m.dispose && m.dispose());
                        } else if (mesh.material.dispose) {
                            mesh.material.dispose();
                        }
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

