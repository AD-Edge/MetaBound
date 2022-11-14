import * as THREE from '../lib/three.module.js';
import * as CANNON from '../lib/cannon-es.js'
import {GLTFLoader} from '../lib/GLTFLoader.js';
import {OBJLoader} from '../lib/ObjLoader.js';
import {ConvexGeometry} from '../lib/ConvexGeometry.js'
import {OrbitControls} from '../lib/OrbitControls.js';
import CannonUtils from '../lib/utils/CannonUtils.js';
import CannonDebugger from '../lib/cannon-es-debugger.js';

//Setup Canvas and Elements
var html = document.documentElement;
var body = document.body;
var nftBOX = document.getElementById('nftBOX');
var innerDIV = document.getElementById('innerDIV');
var style = window.getComputedStyle(nftBOX);
//Get Delta/link example element
var deltaContainer = document.getElementById("container");

var canvas = document.getElementById('canvasMain');
var ctx = canvas.getContext("2d");
var canvas2;
var ctx2;
//Make a memory only canvas for redraw 

var tempCanvas2 = document.createElement('canvas');
var tempCtx2 = tempCanvas2.getContext('2d');

var tempCanvas = document.createElement('canvas');
var tempCtx = tempCanvas.getContext('2d');
var minCanvas;
var maxCanvas;

//Setup main variables
var width = 0;
var height = 0;
var aspectRatio = 0;

//Images/icons
//Load images for fullscreen toggle button
var imgFullScreenOpen = new Image();
var imgFullScreenClose = new Image();
imgFullScreenOpen.src = 'src/fullscreenOpen.png';
imgFullScreenClose.src = 'src/fullscreenClose.png';
var fullScreenToggle = false;
var fullScreenOver = false;
var pad, xLoc, yLoc, xScale;

var limbs = 0;

var f;//Preload custom font and kick off main processes

var charLoaded = false;

//state stuff
var init = true;

const STATE_ENUM = {
    MENU: "menu",
    START: "start",
    COMPLETE: "complete",
    DEATH: "death",
};

var state = STATE_ENUM.MENU;

//Store mouse position
const mouse = { x: 0, y: 0 };

//Cannon.js variables
var scene, quaternionNode, translationNode,
        world, body, shape, timeStep=1/60;

//cannon.js physics config
initCannon();

function initCannon() {

    world = new CANNON.World();
    world.gravity.set(0,-9.81,0);

    console.log("world grav: " + world.gravity);

}

class LoadPrimaryApplication {
    constructor() {
        this.Initialize();
    }

    Initialize() {
        //app startup and configure
        console.log("App Start: MetaBound");
        console.log("Using the LRC-NFT-Dyanmic Frame Template"); 
        console.log("https://github.com/AD-Edge/LRC-NFT-DynamicFrame");
        console.log("https://twitter.com/Alex_ADEdge");

        //Retrieve and save values needed
        minCanvas = parseInt(style.getPropertyValue('min-height'));
        maxCanvas = parseInt(style.getPropertyValue('max-height'));
        //console.log("Minimum Canvas: " + minCanvas);
        //console.log("Maximum Canvas: " + maxCanvas);


        //this.rigidBodies = [];

        //setup init three.js
        this.renderer = new THREE.WebGLRenderer({antialias: true,});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x222222, 1, 25 );
        this.camera = new THREE.PerspectiveCamera(75, nftBOX.clientWidth / nftBOX.clientWidth, 0.1, 1000);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.ambientLight = undefined;
        this.directionaLight= undefined;
        // ambient light setup
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(this.ambientLight);
        // directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(-80, 150, 64);
        // this.directionalLight.target.position.set(100, 0, 0);
        this.directionalLight.shadow.bias = -0.001;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.1;
        this.directionalLight.shadow.camera.far = 500.0;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500.0;
        this.directionalLight.shadow.camera.left = 100;
        this.directionalLight.shadow.camera.right = -100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.directionalLight);

        //threejs & ammo
        this.renderer.setSize(nftBOX.clientWidth, nftBOX.clientWidth); //nftBOX.clientWidth
        //renderer.setSize(window.innerWidth/2, window.innerHeight/2); //half res test
        //add render element (canvas)
        innerDIV.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = "canvasThree";

        canvas2 = document.getElementById('canvasThree');
        ctx2 = canvas2.getContext("2d");

        //resize here?? 
        window.addEventListener('resize', () => {    
            if(fullScreenToggle) {
                this.fullScreenEnable();
            } else {
                this.resizeToDiv();
            }
            //this._OnWindowResize();
        }, false);

        //touch and mouse events
        canvas.addEventListener("pointerdown", this.dragStart, false);
        canvas.addEventListener("pointerup", this.dragEnd, false);
        canvas.addEventListener('pointermove', this.pointerTouchMove, false);

        //Call resize functions on setup so canvas is happy from the start
        this.resizeToDiv();


        this.camera.position.z = 5;

        
        // const rb_ground = new RigidBody();
        // rb_ground.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(100, 1, 100));
        // this.physicsWorld.addRigidBody(rb_ground.body);

        //Player default obj and rigid body
        // const box = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshStandardMaterial({color: 0x909090}));
        // box.castShadow = true;
        // box.receiveShadow = true;
        // box.position.set(0, 0.5, -0.5);
        // this.scene.add(box);
        const slipperyMaterial = new CANNON.Material('slippery')
        slipperyMaterial.friction = 0.1;
        
        this.box = undefined; 
        this.box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({color: 0x909090}));
        this.box.castShadow = true;
        this.box.receiveShadow = false;
        this.box.position.set(0, 0.5, -0.5);
        this.scene.add(this.box);
        
        //box physics body
        this.boxBody1 = undefined; 
        this.boxBody1 = new CANNON.Body({
          mass: 5, // kg
          shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
          material: slipperyMaterial,
        })
        this.boxBody1.position.set(0, 1, -1); // m
        world.addBody(this.boxBody1);
        
        // const rb_box = new RigidBody();
        // rb_box.createBox(1, box.position, box.quaternion, new THREE.Vector3(1, 1, 1), null);
        // rb_box.body.setRestitution(0.1);
        // rb_box.body.setFriction(0.0);
        // rb_box.body.setRollingFriction(1);
        // this.physicsWorld.addRigidBody(rb_box.body);
        // this.rigidBodies.push({mesh: box, rigidBody: rb_box});

        
        //Cannon sphere test
        this.sphereMesh = undefined; 
        const radius = 1 // m
        const geometry = new THREE.SphereGeometry(radius)
        const material = new THREE.MeshStandardMaterial({color: 0xC09090});
        // const material = new THREE.MeshNormalMaterial()
        this.sphereMesh = new THREE.Mesh(geometry, material)
        this.scene.add(this.sphereMesh)

        //sphere physics body
        this.sphereBody = undefined; 
        this.sphereBody = new CANNON.Body({
          mass: 5, // kg
          shape: new CANNON.Sphere(radius),
        })
        this.sphereBody.position.set(-3, 2, 0) // m
        world.addBody(this.sphereBody)

        this.box2 = undefined; 
        this.box2 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({color: 0xC09090}));
        this.box2.castShadow = true;
        this.box2.receiveShadow = true;
        this.scene.add(this.box2);
        
        //box physics body
        this.boxBody = undefined; 
        this.boxBody = new CANNON.Body({
          mass: 5, // kg
          shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
        })
        this.boxBody.position.set(2.5, 3, -0.5) // m
        world.addBody(this.boxBody);

        // Static ground plane
        const groundMaterial = new CANNON.Material('ground')
        groundMaterial.friction = 0.3

        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 1, 100),
            new THREE.MeshStandardMaterial({color: 0x404040}));
        ground.castShadow = false;
        ground.receiveShadow = true;
        ground.position.set(0,-3.5,0);
        this.scene.add(ground);
        
        const groundShape = new CANNON.Box(new CANNON.Vec3(50,50,0.5));
        const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial })
        groundBody.addShape(groundShape)
        groundBody.position.set(0,-3.5,0);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        world.addBody(groundBody)
        // demo.addVisual(groundBody)


        this._previousRAF = null;
        this._mixers = [];

        this.f = new FontFace('retroPixel', 'url(./src/EarlyGameBoy.ttf)');
        this.f.load().then(function(font) {
            //Ready to use the font in a canvas context
            console.log('*Custom Font Loaded Successfully*');
            //Add font on the html page
            document.fonts.add(font);

        });
        
        this.renderInterval;

        //Load models (really caveman setup here bleh)
        this.metaBoyModel = undefined; 
        this.metaScreenModel = undefined;
        
        const glftLoader = new GLTFLoader();
        glftLoader.load("./src/3dAssets/MetaBoy_3173_test1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.metaBoyModel = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            // gltfScene.scene.rotation.y = 45;
            gltfScene.scene.position.y = -2;
            // gltfScene.scene.position.x = +1.5;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            //gltfScene.scene.quaternion.set(0.2, 0, 0, 1);
            this.scene.add(gltfScene.scene);

            this.box.visible = false;
            // child.material.shading = THREE.SmoothShading;
        });

        
        glftLoader.load("./src/3dAssets/MetaScreen_test1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.metaScreenModel = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -1.5;
            gltfScene.scene.position.x = 4;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });

        const params = {
            camera: this.camera,
            scene: this.scene,
        }
        this.character_controls = new BasicCharacterController(params);

        //level import test 
        // this.levelSeg_01_1 = undefined;
        // this.levelSeg_01_1 = this.LoadModel("./src/3dAssets/levelsegments/level_seg01_test01.glb");
        this.Meta_idle = undefined;
        this.Meta_01 = undefined;
        this.Meta_02 = undefined;
        this.Meta_03 = undefined;
        this.Meta_04 = undefined;
        this.Meta_05 = undefined;
        this.Meta_06 = undefined;
        // this.Meta_idle = this.LoadModel("./src/3dAssets/Meta_idle.glb");
        
        glftLoader.load("./src/3dAssets/Meta_idle.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_idle = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -2;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });

        //Last minute hack import - for limbs!
        glftLoader.load("./src/3dAssets/Meta_limbs01.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_01 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });
        glftLoader.load("./src/3dAssets/Meta_limbs02.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_02 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });
        glftLoader.load("./src/3dAssets/Meta_limbs03.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_03 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });
        glftLoader.load("./src/3dAssets/Meta_limbs04.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_04 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });
        glftLoader.load("./src/3dAssets/Meta_limbs05.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_05 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });
        glftLoader.load("./src/3dAssets/Meta_limbs06.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.Meta_06 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -12;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.scene.add(gltfScene.scene);
        });


        // level_seg01_test01.obj
        // this.levelSeg_01_1_OBJ = undefined;
        // this.levelSeg_01_1_OBJ = this.LoadObjModel("./src/3dAssets/levelsegments/level_seg01_test01.obj");
        this.levelSeg_01_1 = undefined;
        this.levelSeg_01_1 = this.LoadObjModel("./src/3dAssets/levelsegments/level_seg01_1.obj");
        this.levelSeg_01_2 = undefined;
        this.levelSeg_01_2 = this.LoadObjModel("./src/3dAssets/levelsegments/level_seg01_2.obj");
        this.levelSeg_01_3 = undefined;
        this.levelSeg_01_3 = this.LoadObjModel("./src/3dAssets/levelsegments/level_seg01_3.obj");
        this.levelSeg_01_4 = undefined;
        this.levelSeg_01_4 = this.LoadObjModel("./src/3dAssets/levelsegments/level_seg01_4.obj");



        //console.log("kicking off application");
        this.RenderAnimationFrame();
    }

    LoadObjModel(url) {
        const objLoader = new OBJLoader();
        objLoader.load( url, (object) => {
                //console.log(object.children[0]);
                let obj = new THREE.Mesh(object.children[0].geometry, new THREE.MeshStandardMaterial({color: 0xC09090}));
                // obj.material = material
                obj.position.y = 0.5;
                obj.position.z = -10;
                obj.castShadow = true;
                this.scene.add(obj)

                setTimeout(() => {
                    this.createConvexHull(obj)
                }, 2000)

                return object;
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        );
    }

    createConvexHull(obj) {
        const position = obj.geometry.attributes.position.array
        const points = [];
        for (let i = 0; i < position.length; i += 3) {            
            points.push(
                new THREE.Vector3(position[i], position[i + 1], position[i + 2])
            )
        }
        const convexGeometry = new ConvexGeometry(points)
        const convexHull = new THREE.Mesh(
            convexGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
            })
        )
        obj.add(convexHull)

        setTimeout(() => {
            //this.convertConvexHullToTrimesh(obj)
        }, 2000)
    }
    
    convertConvexHullToTrimesh(obj) {
        const shape = CannonUtils.CreateTrimesh(convexHull.geometry)
        const body = new CANNON.Body({ mass: 1 })
        body.allowSleep = true
        body.addShape(shape)
        body.position.x = obj.position.x
        body.position.y = obj.position.y
        body.position.z = obj.position.z
        body.quaternion.x = obj.quaternion.x
        body.quaternion.y = obj.quaternion.y
        body.quaternion.z = obj.quaternion.z
        body.quaternion.w = obj.quaternion.w
        world.addBody(body)
    }
            
    LoadModel(url) {
        const glftLoader = new GLTFLoader();
        glftLoader.load(url, (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            //this.metaScreenModel = gltfScene;
            gltfScene.scene.position.y = 0;
            gltfScene.scene.position.x = 0;
            gltfScene.scene.scale.set(1, 1, 1);
            this.scene.add(gltfScene.scene);

            return gltfScene;
        });
    }

    RenderAnimationFrame() {
        //update game state
        if(init) {
            init = false;
            this.gameState(state);
            
        }
        //Game states
        //if(state == STATE_ENUM.MENU) {
            //console.log("menu state");
        if(this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
            this.cube.position.y = -0.5;
        }

        //handle metaboy model
        if(this.metaScreenModel) {
            // console.log("loaded metaboy");
            this.metaScreenModel.scene.rotation.y += 0.01;
        }

        //character controller updates
        if(this.metaBoyModel) {
            if(this.character_controls.input.keys.left) {
                //console.log("left!");
                this.metaBoyModel.scene.rotation.y = -0.1;
                const force = new CANNON.Vec3( -80, 0, 0 );
                this.boxBody1.applyForce(force);
                this.boxBody1.quaternion.z = 0;

                
                this.Meta_01.scene.scale.x = -0.5;
                this.Meta_02.scene.scale.x = -0.5;
                this.Meta_03.scene.scale.x = -0.5;
                this.Meta_04.scene.scale.x = -0.5;
                this.Meta_05.scene.scale.x = -0.5;
                this.Meta_06.scene.scale.x = -0.5;

                if(limbs > 6) {
                    limbs = 0;

                } else {
                    this.Meta_idle.scene.position.y = -12;
                    limbs += 0.1;
                    if(limbs <1) {
                        this.Meta_06.scene.position.y = -12;
                        this.Meta_01.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 2) {
                        this.Meta_01.scene.position.y = -12;
                        this.Meta_02.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 3) {
                        this.Meta_02.scene.position.y = -12;
                        this.Meta_03.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 4) {
                        this.Meta_03.scene.position.y = -12;
                        this.Meta_04.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 5) {
                        this.Meta_04.scene.position.y = -12;
                        this.Meta_05.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 6) {
                        this.Meta_05.scene.position.y = -12;
                        this.Meta_06.scene.position.y = this.metaBoyModel.scene.position.y;

                    }
                }

            } else if(this.character_controls.input.keys.right) {
                this.metaBoyModel.scene.rotation.y = + 0.1;
                const force = new CANNON.Vec3( 80, 0, 0 );
                this.boxBody1.applyForce(force);
                this.boxBody1.quaternion.z = 0;

                this.Meta_01.scene.scale.x = 0.5;
                this.Meta_02.scene.scale.x = 0.5;
                this.Meta_03.scene.scale.x = 0.5;
                this.Meta_04.scene.scale.x = 0.5;
                this.Meta_05.scene.scale.x = 0.5;
                this.Meta_06.scene.scale.x = 0.5;


                if(limbs > 6) {
                    limbs = 0;

                } else {
                    this.Meta_idle.scene.position.y = -12;
                    limbs += 0.1;
                    if(limbs <1) {
                        this.Meta_06.scene.position.y = -12;
                        this.Meta_01.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 2) {
                        this.Meta_01.scene.position.y = -12;
                        this.Meta_02.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 3) {
                        this.Meta_02.scene.position.y = -12;
                        this.Meta_03.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 4) {
                        this.Meta_03.scene.position.y = -12;
                        this.Meta_04.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 5) {
                        this.Meta_04.scene.position.y = -12;
                        this.Meta_05.scene.position.y = this.metaBoyModel.scene.position.y;
                    } else if (limbs < 6) {
                        this.Meta_05.scene.position.y = -12;
                        this.Meta_06.scene.position.y = this.metaBoyModel.scene.position.y;

                    }
                }
            } else if(this.character_controls.input.keys.space) {
                const force = new CANNON.Vec3( 0, 200, 0 );
                this.boxBody1.applyForce(force);
                if(this.Meta_idle) {
                    this.Meta_idle.scene.position.y = this.metaBoyModel.scene.position.y;
                }
            } else {
                limbs = 0;
                if(this.Meta_idle) {
                    this.Meta_idle.scene.position.y = this.metaBoyModel.scene.position.y;
                }
                this.metaBoyModel.scene.rotation.y = 0;

                
                this.ResetMetas();
            }
        }

        //Refresh canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        //Draw title text
        this.drawTitleText();
        //Draw the button which toggles fullscreen mode
        //this.drawFullScreenButton();
        this.debugMousePos();

        //run Cannon physics sim independant from framerate 
        world.fixedStep()

        //update test sphere
        this.sphereMesh.position.copy(this.sphereBody.position)
        this.sphereMesh.quaternion.copy(this.sphereBody.quaternion)
        //update test box
        this.box2.position.copy(this.boxBody.position)
        this.box2.quaternion.copy(this.boxBody.quaternion)

        //update player
        if(this.boxBody1.position.z != 0) {
            this.boxBody1.position.z = 0; //rough clamp
        }
        const pos3 = new THREE.Vector3(this.boxBody1.position.x, this.boxBody1.position.y, this.boxBody1.position.z); 
        this.box.position.copy(this.boxBody1.position)
        if(this.metaBoyModel) {
            this.metaBoyModel.scene.position.x = pos3.x;
            this.metaBoyModel.scene.position.y = pos3.y - 0.55;
            this.metaBoyModel.scene.position.z = pos3.z;
            
        }
        
        if(this.Meta_idle != null && limbs == 0) {
            //console.log("test");
            this.Meta_idle.scene.position.x = pos3.x;
            // this.Meta_idle.scene.position.y = pos3.y - 0.55;
            this.Meta_idle.scene.position.z = pos3.z;
        }
        if(this.Meta_01 != null) {
            //console.log("test");
            this.Meta_01.scene.position.x = pos3.x;
            // this.Meta_01.scene.position.y = pos3.y - 0.55;
            this.Meta_01.scene.position.z = pos3.z;
        }
        if(this.Meta_02 != null) {
            //console.log("test");
            this.Meta_02.scene.position.x = pos3.x;
            // this.Meta_02.scene.position.y = pos3.y - 0.55;
            this.Meta_02.scene.position.z = pos3.z;
        }
        if(this.Meta_03 != null) {
            //console.log("test");
            this.Meta_03.scene.position.x = pos3.x;
            // this.Meta_03.scene.position.y = pos3.y - 0.55;
            this.Meta_03.scene.position.z = pos3.z;
        }
        if(this.Meta_04 != null) {
            //console.log("test");
            this.Meta_04.scene.position.x = pos3.x;
            // this.Meta_04.scene.position.y = pos3.y - 0.55;
            this.Meta_04.scene.position.z = pos3.z;
        }
        if(this.Meta_05 != null) {
            //console.log("test");
            this.Meta_05.scene.position.x = pos3.x;
            // this.Meta_05.scene.position.y = pos3.y - 0.55;
            this.Meta_05.scene.position.z = pos3.z;
        }
        if(this.Meta_06 != null) {
            //console.log("test");
            this.Meta_06.scene.position.x = pos3.x;
            // this.Meta_06.scene.position.y = pos3.y - 0.55;
            this.Meta_06.scene.position.z = pos3.z;
        }
        this.box.quaternion.copy(this.boxBody1.quaternion)

        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
                console.log("kicking off first animation frame");
            }
      
            this.RenderAnimationFrame();
      
            this.renderer.render(this.scene, this.camera);
            this.controls.update();
            this.Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }

    ResetMetas() {
        
        if(this.Meta_01) {
            this.Meta_01.scene.position.y = -12;
        }
        if(this.Meta_02) {
            this.Meta_02.scene.position.y = -12;
        }
        if(this.Meta_03) {
            this.Meta_03.scene.position.y = -12;
        }
        if(this.Meta_04) {
            this.Meta_04.scene.position.y = -12;
        }
        if(this.Meta_05) {
            this.Meta_05.scene.position.y = -12;
        }
        if(this.Meta_06) {
            this.Meta_06.scene.position.y = -12;
        }
    }
    Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }
        // //iterate over all objects and rigid bodies, link locations/etc 
        // for (let i = 0; i < this.rigidBodies.length; ++i) {
        //     this.rigidBodies[i].rigidBody.motionState.getWorldTransform(this.tmpTransform);
        //     const pos = this.tmpTransform.getOrigin();
        //     const quat = this.tmpTransform.getRotation();
        //     const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z()); 
        //     const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());
            
        //     this.rigidBodies[i].mesh.position.copy(pos3);
        //     this.rigidBodies[i].mesh.quaternion.copy(quat3);

        //     if(i == 0 && this.metaBoyModel) { // if first object, parent metaboy to it
        //         this.metaBoyModel.scene.position.x = pos3.x;
        //         this.metaBoyModel.scene.position.y = pos3.y - 0.55;
        //         this.metaBoyModel.scene.position.z = pos3.z;
        //         //this.metaBoyModel.scene.rotation.copy(quat3);
        //     }
        // }

        //Update character physics
        if(this.character_controls) {
            this.character_controls.Update(timeElapsedS);
        }

        // if (this._controls) {
        //   this._controls.Update(timeElapsedS);
        // }
    }
    
    debugMousePos() {
        //debug mouse/touch pos - final draw call so it draws on top
        ctx.globalAlpha = 0.5; //reset global alpha
        ctx.beginPath();
        ctx.fillStyle = 'rgba(240, 140, 140, 1)';
        //console.log("mouse: " + mouse.x + ", " + mouse.y);
        ctx.arc(mouse.x, mouse.y, height*0.02, 0, 2*Math.PI);
        ctx.fill();
    }
    
    gameState(s) {
        switch(s) {
            case STATE_ENUM.MENU:
                console.log("menu init");
                //init menu call
                break;
            case STATE_ENUM.START:
                console.log("game start");
                //start game call
                break;
            case STATE_ENUM.COMPLETE:
                console.log("top level reached");
                break;
            case STATE_ENUM.DEATH:
                console.log("Game Over \n Your max score: xxx \n Your height at death: xxx");
                break;
    
        }
    }

    //Primary resize function for canvas
    //Keeps all dimensions being used relative to nftBOX constraints and limits
    resizeToDiv() {

        //This is needed to preserve image during scaling
        //Resizing the canvas (ie canvas.width = xxx) clears the canvas
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas2.width = canvas2.width;
        tempCanvas2.height = canvas2.height;
        //Save the canvas on the temp/memory-only canvas
        tempCtx.drawImage(canvas, 0, 0);
        if(canvas2) {
            tempCtx2.drawImage(canvas2, 0, 0);
        }
        
        
        //Resize nftBOX based on smallest dimension (height vs width)
        //This is our overall 'containment box'
        if(fullScreenToggle) { //Fullscreen MODE
            //Unset constraints on nftBOX
            nftBOX.style.maxWidth = '100%';
            nftBOX.style.maxHeight = '100%';
            nftBOX.style.minWidth = '100%';
            nftBOX.style.minHeight = '100%';

            //Set to max available dimension
            nftBOX.style.width = (html.clientWidth) + 'px';
            nftBOX.style.height = (html.clientHeight) + 'px';
        } else { //If NOT-Fullscreen MODE
            if (html.clientHeight < html.clientWidth) {
                nftBOX.style.width = (html.clientHeight) + 'px';
                nftBOX.style.height = (html.clientHeight) + 'px';
            } else  {
                nftBOX.style.width = (html.clientWidth) + 'px';
                nftBOX.style.height = (html.clientWidth) + 'px';
            }
        }

        //Reset canvas dimensions
        canvas.width = nftBOX.clientWidth;
        canvas.style.width = nftBOX.clientWidth;
        canvas.height = nftBOX.clientHeight;
        canvas.style.height = nftBOX.clientHeight;
        canvas2.width = nftBOX.clientWidth;
        canvas2.style.width = nftBOX.clientWidth;
        canvas2.height = nftBOX.clientHeight;
        canvas2.style.height = nftBOX.clientHeight;


        this.renderer.setSize(nftBOX.clientWidth, nftBOX.clientWidth);


        //Reset variables
        width = nftBOX.clientWidth;
        height = nftBOX.clientHeight;
        aspectRatio = width/height;
        //console.log('*width: ' + width + ' height: ' + height);
        
        //Draw saved canvas back right away
        ctx.drawImage(tempCanvas, 0, 0);
        if(ctx2) {
            ctx2.drawImage(tempCanvas2, 0, 0);

        }
    }

    //Click down/Drag starts
    dragStart(e) { 
        //the user cant do anything else but drag
        e.preventDefault(); 
        //update the mouse location relative to canvas area
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        //debug mouse/touch CLICK pos
        ctx.globalAlpha = 1.0; //reset global alpha
        ctx.beginPath();
        ctx.fillStyle = 'rgba(140, 140, 240, 1)';
        //console.log("mouse: " + mouse.x + ", " + mouse.y);
        ctx.arc(mouse.x, mouse.y, height*0.06, 0, 2*Math.PI);
        ctx.fill();
        
        //Mouse click if hovering over Fullscreen element
        if(fullScreenOver) {
            //toggle to fullscreen
            if(!fullScreenToggle) {
                fullScreenToggle = true;
                this.fullScreenEnable();
            } else {
                fullScreenToggle = false;
                this.fullScreenDisable();
            }
        }
    }


    //Fullscreen functions
    fullScreenEnable() {
        //resize elements
        this.resizeToDiv();
    }
    fullScreenDisable() {
        //reset constraints 
        nftBOX.style.maxWidth = maxCanvas + 'px';
        nftBOX.style.maxHeight = maxCanvas + 'px';
        nftBOX.style.minWidth = minCanvas + 'px';
        nftBOX.style.minHeight = minCanvas + 'px';
        //resize elements
        this.resizeToDiv();
    }


    //When the drag ends - ie touch or mouse ends
    //All activation events while releasing on a hover, ie a 'PRESS' event 
    dragEnd() {
    }
    //Handle the pointer moving
    pointerTouchMove(e) {
        //the user cant do anything else but drag
        e.preventDefault(); 
        //update the mouse location relative to canvas area
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }

    drawTitleText() {
        //Draw Title text
        ctx.fillStyle = '#A0A0A0';
        ctx.textAlign = "center";
        ctx.font = height/22 + 'px retroPixel';
        ctx.fillText("METABOUND", 0.5*width, 0.08*height);
        ctx.font = height/12 + 'px retroPixel';
        ctx.fillText("           _", 0.5*width, 0.068*height);
        ctx.fillText("           _", 0.5*width, 0.065*height);
        ctx.font = height/42 + 'px retroPixel';
        ctx.fillText("# MAKEYOURMETA", 0.5*width, 0.92*height);
        ctx.fillText("By Alex Delderfield, 2022", 0.5*width, 0.95*height);

        ctx.font = height/36 + 'px retroPixel';

        //Draw custom red text for min/max sizes
        // ctx.fillStyle = '#303030';
        // if(fullScreenToggle) {
        //     ctx.fillStyle = '#FF4444';
        //     ctx.fillText('FULLSCREEN', 0.5*width, 0.95*height);
        // } else {
        //     if((width <= minCanvas) || (width >=maxCanvas)) {
        //         ctx.fillStyle = '#FF4444';
        //         ctx.fillText(width, 0.56*width, 0.95*height);
        //     } else {
        //         ctx.fillStyle = '#303030';
        //         ctx.fillText(width, 0.56*width, 0.95*height);
        //     }
        //     //Display current canvas size
        //     ctx.fillStyle = '#303030';
        //     ctx.fillText("SIZE: ", 0.46*width, 0.95*height);
            
        // }
    }

    //Draw and Calculate select area Fullscreen button
    drawFullScreenButton() {
        pad = (width*0.125);
        //clamp padding amount to reasonable levels
        pad = Math.min(Math.max(pad, 25), 70);
        xLoc = width-pad;
        yLoc = height-pad;
        xScale = 0.10*(width*0.75);
        //clamp button from going outside of the range 16 -> 54
        xScale = Math.min(Math.max(xScale, 16), 54);

        //draw and check fullscreen button
        this.checkIfOverFullScreen();
        if(fullScreenOver) {
            ctx.fillStyle = 'rgba(100, 100, 240, 0.25)';
            ctx.rect(xLoc, yLoc, xScale, xScale);
            ctx.fillStyle = ctx.isPointInPath(mouse.x, mouse.y) ? 'rgba(100, 140, 240, 0.5)' : 'rgba(100, 140, 240, 0)';
            ctx.fill();
        }

        //draw fullscreen button in various states
        if(fullScreenToggle) {
            ctx.drawImage(imgFullScreenClose, xLoc, yLoc, xScale, xScale);
        } else {
            ctx.drawImage(imgFullScreenOpen, xLoc, yLoc, xScale, xScale);
        }
    }

    checkIfOverFullScreen() {
        if(ctx) {
            ctx.beginPath();
            ctx.rect(xLoc, yLoc, xScale, xScale);
            ctx.fillStyle = 'rgba(100, 100, 240, 0.25)';
            //determine if mouse is over select area
            ctx.isPointInPath(mouse.x, mouse.y) ? fullScreenOver=true : fullScreenOver=false;
            ctx.fill();

        }
    }

}

class BasicCharacterControllerInput {
    constructor() {
        this.Init();
    }    
    Init() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        }
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }

    onKeyDown(event) {
        switch (event.keyCode) {
            case 87: //w
                this.keys.forward = true;
                break;
            case 65: //a
                this.keys.left = true;
                break;
            case 83: //s
                this.keys.backward = true;
                break;
            case 68: //d
                this.keys.right = true;
                break;
            case 32: //space
                this.keys.space = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.keyCode) {
            case 87: //w
                this.keys.forward = false;
                break;
            case 65: //a
                this.keys.left = false;
                break;
            case 83: //s
                this.keys.backward = false;
                break;
            case 68: //d
                this.keys.right = false;
                break;
            case 32: //space
                this.keys.space = false;
                break;
        }
    }
}

class BasicCharacterController {
    constructor(params) {
        this.Init(params);
    }

    Init(params) {
        this.params = params;
        this._params = params;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);

        this.input = new BasicCharacterControllerInput();
    }
    
    Update(timeInSeconds) {
        // const velocity = this._velocity;
        // const frameDecceleration = new THREE.Vector3(
        //     velocity.x * this._decceleration.x,
        //     velocity.y * this._decceleration.y,
        //     velocity.z * this._decceleration.z
        // );

        // frameDecceleration.multiplyScalar(timeInSeconds);
        // frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        //     Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        // velocity.add(frameDecceleration);

        // const controlObject = rigidBodies[0].rigidBody;
        // console.log(this.metaBoyModel);

        // const _Q = new THREE.Quaternion();
        // const _A = new THREE.Vector3();
        // const _R = controlObject.quaternion.clone();

        // const acc = this._acceleration.clone();

        // if(this.input.keys.left) {
        //     acc.multiplyScalar(0.0);
        // }

    }

}

let APP = null;

window.addEventListener('DOMContentLoaded', async () => {
    try {
        APP = new LoadPrimaryApplication();
        // LoadPrimaryApplication.initialize();
    } catch (error) {
        console.log("ASYNC ERROR THROWN: " + error);
    }
});
