import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from './OrbitControls.js'
import { OrbitControlsGizmo } from "./OrbitControlsGizmo.js";
import { GridHelper } from 'three';
import { Generate3DPointsFromFormula, Generate3DAllPointsFromFormula, Generate2DAllPointsFromFormula, Topologying3DPoint } from './Drawing';
import { Topologying3DMarchingCubes } from './MarchingCubes.tsx';
import { Topologying2DMarchingSquares } from './MarchingSquare.tsx';
//import { update } from 'three/examples/jsm/libs/tween.module.js';



interface GraphCanvasProps {
    formula: string;
}

var shape3DType = 'surface';
var shape2DType = 'line';
var Resolution3D = 110;
var Resolution2D = 400;
var DrawRange = 7.0;
var LightColor = 0xffffff;
var ifProjection = true;
var currentCamera;
var lineWidth = 0.3;
var ifSlice = false;
var slicezPosition = 0.0;

const trackGeometry = new THREE.SphereGeometry(Math.sqrt(300), 32, 32);
const trackMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Use red or any color that stands out
    wireframe: true,   // Wireframe to make it only an outline,
    transparent: true,
    opacity: 0.1
});
const trackSphere = new THREE.Mesh(trackGeometry, trackMaterial);
trackSphere.visible = false; // Start with the sphere invisible

const GraphCanvas: React.FC<GraphCanvasProps> = ({ formula }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            // ---------- ----------
            // Basic setup
            // ---------- ----------
            // Set up Three.js scene
            let perspectiveCamera, orthographicCamera;
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.72);

            scene.add(trackSphere);
            perspectiveCamera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
            perspectiveCamera.position.z = 20;

            const frustumSize = 10;
            orthographicCamera = new THREE.OrthographicCamera(
                frustumSize * canvas.clientWidth / canvas.clientHeight / - 2,
                frustumSize * canvas.clientWidth / canvas.clientHeight / 2,
                frustumSize / 2,
                frustumSize / - 2,
                1,
                1000
            );

            currentCamera = ifProjection ? perspectiveCamera : orthographicCamera;

            // Handle window resize
            function onWindowResize() {
                // Update the size of the renderer and the canvas
                renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.72);

                // Check if currentCamera is a PerspectiveCamera
                if (currentCamera instanceof THREE.PerspectiveCamera) {
                    // Update the camera's aspect ratio and projection matrix
                    currentCamera.aspect = window.innerWidth / window.innerHeight;
                    currentCamera.updateProjectionMatrix();
                }
                // If the camera is an OrthographicCamera, update accordingly
                else if (currentCamera instanceof THREE.OrthographicCamera) {
                    // Calculate new values for the orthographic frustum
                    const aspect = window.innerWidth / window.innerHeight;
                    const frustumHeight = currentCamera.top - currentCamera.bottom;
                    const frustumWidth = frustumHeight * aspect;

                    currentCamera.left = frustumWidth / -2;
                    currentCamera.right = frustumWidth / 2;
                    currentCamera.top = frustumHeight / 2;
                    currentCamera.bottom = frustumHeight / -2;
                    currentCamera.updateProjectionMatrix();
                }
            }
            window.addEventListener('resize', onWindowResize, false);

            function updateCamera() {
                if (ifProjection) {
                    // Switch to perspective camera
                    currentCamera = perspectiveCamera;
                } else {
                    // Switch to orthographic camera
                    currentCamera = orthographicCamera;
                }

                // You may need to update controls if you're using OrbitControls or similar
                controls = new OrbitControls(currentCamera, renderer.domElement);
                controls.enableDamping = true;
                renderer.render(scene, currentCamera)
            }

            // ---------- ----------
            // Add AXES HELPER
            // ---------- ----------
            const dirX = new THREE.Vector3( 1, 0, 0 );
            const dirY = new THREE.Vector3( 0, 1, 0 );
            const dirZ = new THREE.Vector3( 0, 0, 1 );

            //normalize the direction vector (convert to vector of length 1)
            dirX.normalize();
            dirY.normalize();
            dirZ.normalize();

            const origin = new THREE.Vector3( 0, 0, 0 );
            const length = 0.8*currentCamera.position.length();

            const arrowHelperX = new THREE.ArrowHelper( dirX, origin, length, 0xff0000, 0.4, 0.3 );
            const arrowHelperY = new THREE.ArrowHelper( dirY, origin, length, 0x00ff00, 0.4, 0.3 );
            const arrowHelperZ = new THREE.ArrowHelper( dirZ, origin, length, 0x0000ff, 0.4, 0.3 );

            scene.add( arrowHelperX );
            scene.add( arrowHelperY );
            scene.add( arrowHelperZ );

            //function updateAxis() {
            //    const length = 0.7*currentCamera.position.length();
            //    arrowHelperX.setLength(length, length*0.04, length*0.03);
            //    arrowHelperY.setLength(length, length*0.04, length*0.03);
            //    arrowHelperZ.setLength(length, length*0.04, length*0.03);
            //}

            // ---------- ----------
            // Add GRID HELPER
            // ---------- ----------
            const gridSize = 70;
            var gridDivisions = 20;
            var gridHelper = new GridHelper(gridSize * 2, gridDivisions * 2, 0x181818, 0x181818);
            gridHelper.material.opacity = 0.1;
            gridHelper.material.depthWrite = false;
            gridHelper.material.fog = false;
            gridHelper.material.transparent = true;
            gridHelper.material.alphaTest = 0.6;
            scene.add(gridHelper);

            var gridHelper2 = new GridHelper(gridSize, gridDivisions, 0x181818, 0x181818);
            gridHelper2.material.opacity = 0.1;
            gridHelper2.material.depthWrite = false;
            gridHelper2.material.fog = false;
            gridHelper2.material.transparent = true;
            gridHelper.rotation.x = Math.PI / 2;
            scene.add(gridHelper2);

            const cameraDistance = () => currentCamera.position.length(); // Simple distance-from-origin

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
                gridHelper = new GridHelper(gridSize * 2, gridDivisions * 2, 0x181818, 0x181818);
                gridHelper.material.opacity = 0.1;
                gridHelper.material.depthWrite = false;
                gridHelper.material.fog = false;
                gridHelper.material.transparent = true;

                gridHelper2 = new GridHelper(newGridSize, newGridDivisions, 0x181818, 0x181818);
                gridHelper2.material.opacity = 0.1;
                gridHelper2.material.depthWrite = false;
                gridHelper2.material.fog = false;
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

            var pl = new THREE.DirectionalLight(LightColor, 3);
            pl.position.set(10, 10, 10);
            //add light sphere
            const sphereSize = 1;
            //const pointLightHelper = new THREE.DirectionalLightHelper(pl, sphereSize);
            //scene.add(pointLightHelper);
            // add spere at light position
            var pointLightSphere = new THREE.Mesh(new THREE.SphereGeometry(sphereSize), new THREE.MeshBasicMaterial({ color: LightColor }));
            pointLightSphere.position.copy(pl.position);
            scene.add(pointLightSphere);
            scene.add(pl);


            function updateLight() {
                pl.color.set(LightColor);
                pointLightSphere.material.color.set(LightColor);
            }


            // Function to generate points from the formula
            const is3DFormula = formula.includes('z');
            let mesh: any;

            // ---------- ----------
            // Draw 2D/3D graph
            // ---------- ----------
            const eShapeType3D = {
                Points: 'points',
                Mesh: 'mesh',
                Surface: 'surface',
                // Add more types as needed
            };
            const eShapeType2D = {
                Points: 'points',
                Line: 'line',
                // Add more types as needed
            };

            function updateShapeType3D() {
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
                switch (shape3DType) {
                    case eShapeType3D.Points:// Logic for rendering points
                        points3DSurface = Generate3DPointsFromFormula(formula, Resolution3D, DrawRange);
                        mesh = Topologying3DPoint(points3DSurface, pl);
                        break;
                    case eShapeType3D.Mesh:// Logic for rendering mesh
                        points3DSurface = Generate3DAllPointsFromFormula(formula, Resolution3D, DrawRange);
                        mesh = Topologying3DMarchingCubes(points3DSurface, Resolution3D, true, ifSlice, slicezPosition, DrawRange);
                        //console.log(Resolution);
                        break;
                    case eShapeType3D.Surface:// Logic for rendering surface
                        points3DSurface = Generate3DAllPointsFromFormula(formula, Resolution3D, DrawRange);
                        mesh = Topologying3DMarchingCubes(points3DSurface, Resolution3D, false, ifSlice, slicezPosition, DrawRange);
                        break;
                }

                // Add new mesh to the scene
                return mesh;
            }

            function updateShapeType2D() {
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
                var points2DLine;

                switch (shape2DType) {
                    case eShapeType2D.Points:// Logic for rendering points
                        points2DLine = Generate2DAllPointsFromFormula(formula, Resolution2D, DrawRange);
                        mesh = Topologying2DMarchingSquares(points2DLine, Resolution2D, false, pl, lineWidth);
                        //points2DLine = GeneratePointsFromFormula(formula, Resolution2D, DrawRange);
                        //mesh = Topologying2D(points2DLine, pl);
                        break;
                    case eShapeType2D.Line:// Logic for rendering line
                        points2DLine = Generate2DAllPointsFromFormula(formula, Resolution2D, DrawRange);
                        mesh = Topologying2DMarchingSquares(points2DLine, Resolution2D, true, pl, lineWidth);
                        //console.log(Resolution);
                        break;
                }

                return mesh;
            }

            const updateMesh = async () => {

                if (is3DFormula) {
                    // Await the completion of the async function
                    mesh = updateShapeType3D();
                } else {
                    mesh = updateShapeType2D();
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
            // Setup Orbit Controls and Gizmos
            // ---------- ----------
            var controls = new OrbitControls(currentCamera, renderer.domElement);
            var controlsGizmo = new OrbitControlsGizmo(controls, { size: 100, padding: 8, lineWidth: 3 }); // tiny gizmo widget as blender
            document.body.appendChild(controlsGizmo.domElement);
            controls.enableDamping = true;

            // ---------- ----------
            // Setup GUI Controls
            // ---------- ----------
            const gui = new dat.GUI({
                width: 400,
                autoPlace: true,
                hideable: true,
                closeOnTop: true,
                closed: false
            });
            gui.domElement.id = 'gui';

            // initialize values for GUI controls
            const params = {
                //common
                'Grid Density': gridDivisions,
                'Draw range': DrawRange,
                'In Projection': ifProjection,

                //light
                'Light Color': LightColor,

                //3D
                '3D Resolusion': Resolution3D,
                '3D Shape Type': shape3DType,
                'If Slice': ifSlice,
                'Slice Position Z': slicezPosition,

                //2D
                '2D Resolusion': Resolution2D,
                '2D Shape Type': shape2DType,
                'Shape Size': lineWidth,

            };

            // Add common GUI controls
            gui.add(params, 'Grid Density', 10, 100).onChange(value => {
                gridDivisions = value;
                updateGridHelper();
            });
            gui.add(params, 'In Projection').onChange(value => {
                ifProjection = value;
                updateCamera();
            });
            gui.addColor(params, 'Light Color').onChange(value => {
                LightColor = value;
                updateLight();
                updateMesh();
            });

            // Conditional controls based on formula dimensionality
            if (is3DFormula) {
                // [1.object to add the property to, 2.name of the property, 3.min value, 4.max value]
                gui.add(params, '3D Shape Type', Object.values(eShapeType3D)).onChange(value => {
                    shape3DType = value;
                    updateMesh();
                });
                gui.add(params, 'If Slice').onChange(value => {
                    ifSlice = value;
                    updateMesh();
                });
                gui.add(params, 'Slice Position Z', -DrawRange, DrawRange).onChange(value => {
                    slicezPosition = value;
                    updateMesh();
                });
            }
            else {
                gui.add(params, '2D Shape Type', Object.values(eShapeType2D)).onChange(value => {
                    shape2DType = value;
                    updateMesh();
                });
                gui.add(params, 'Shape Size', 0.1, 2).onChange(value => {
                    lineWidth = value;
                    updateMesh();
                });
            }

            // Creating subfolders for ranges might enhance organization
            const rangeFolder = gui.addFolder('Range Settings');
            rangeFolder.open();
            rangeFolder.add(params, 'Draw range', 0, 20).onChange(value => {
                DrawRange = value;
                updateMesh();
            });
            if (is3DFormula) {
                rangeFolder.add(params, '3D Resolusion', 10, 150).onChange(value => {
                    Resolution3D = value;
                    updateMesh();
                });
            }
            else {
                rangeFolder.add(params, '2D Resolusion', 100, 500).onChange(value => {
                    Resolution2D = value;
                    updateMesh();
                });
            }

            // ---------- ----------
            // Ray Caster
            // ---------- ----------

            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            var clickmouse = new THREE.Vector2();
            var selectedObject = null;
            let isLightSelected = false;

            function onPointerMove(event) {
                // Update the mouse variable
                const rect = canvas.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, currentCamera);
                var hoverIntersects = raycaster.intersectObjects(scene.children, true);

                if (hoverIntersects.length > 0) {
                    for (var i = 0; i < hoverIntersects.length; i++) {
                        let target = hoverIntersects[i].object;
                        if (target === pointLightSphere || target.parent === pl) {
                            if (!selectedObject) {
                                pointLightSphere.material.color.set(0xff0000); // Red for hover
                            }
                            return;
                        }
                    }
                }
                if (!selectedObject)
                    pointLightSphere.material.color.set(LightColor);
                return;
            }

            function onSelect(event) {
                const rect = canvas.getBoundingClientRect();
                clickmouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                clickmouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, currentCamera);
                var intersects = raycaster.intersectObjects(scene.children, true);

                if (intersects.length > 0) {
                    for (var i = 0; i < intersects.length; i++) {
                        let target = intersects[i].object;
                        if (!isLightSelected &&(target === pointLightSphere || target.parent === pl)) {
                            selectedObject = pointLightSphere;
                            selectedObject.material.color.set(0x0000ff); // Blue for selected
                            isLightSelected = true;
                            trackSphere.visible = true;
                            return; // Prevent deselecting when we have selected the light
                        }
                        else if (target === selectedObject) {
                            // Clicked again on the light, so deselect
                            if (selectedObject) {
                                selectedObject.material.color.set(LightColor);
                                selectedObject = null;
                                isLightSelected = false;
                                trackSphere.visible = false;
                            }
                            return;
                        }
                    }
                }

                // Clicked outside. deselect and reset color
                if (isLightSelected) {
                    selectedObject.material.color.set(LightColor);
                    selectedObject = null;
                    isLightSelected = false;
                    return;
                }
            }

            function dragObject() {
                if (selectedObject) {
                    raycaster.setFromCamera(mouse, currentCamera);

                    // Calculate the intersection with a virtual sphere centered at (0,0,0) with radius 40
                    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Math.sqrt(300));
                    const ray = raycaster.ray;
                    const intersection = new THREE.Vector3();
                    const intersectsSphere = ray.intersectSphere(sphere, intersection);

                    if (intersectsSphere) {
                        // Update the object's position to the intersection point
                        selectedObject.position.copy(intersection);

                        // If the object is the light source, update its position as well
                        if (selectedObject === pointLightSphere && pl) {
                            pl.position.copy(intersection);
                        }
                    }
                }
            }

            canvas.focus();
            // Add event listeners
            canvas.addEventListener('pointermove', onPointerMove);
            canvas.addEventListener('click', onSelect);

            // ---------- ----------
            // Render
            // ---------- ----------
            const animate = () => {
                requestAnimationFrame(animate);
                //updateGridHelper();

                // Perform any updates to objects, controls, or animations
                dragObject();
                controls.update();
                controlsGizmo.update();
                //updateAxis();
                renderer.render(scene, currentCamera);
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

