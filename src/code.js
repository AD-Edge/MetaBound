import * as THREE from '../lib/three.module.js';

import {GLTFLoader} from '../lib/GLTFLoader.js';
import {OrbitControls} from '../lib/OrbitControls.js';

//Setup Canvas and Elements
var html = document.documentElement;
var body = document.body;
var nftBOX = document.getElementById('nftBOX');
var style = window.getComputedStyle(nftBOX);
//Get Delta/link example element
var deltaContainer = document.getElementById("container");

var canvas = document.getElementById('canvasMain');
var ctx = canvas.getContext("2d");
//Make a memory only canvas for redraw 
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

class RigidBody {
    constructor() {
    }

    createBox(mass, pos, quat, size) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(.05);

        this.inertia = new Ammo.btVector3(0,0,0);
        if(mass > 0) {
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.inertia);
        this.body = new Ammo.btRigidBody(this.info);

        Ammo.destroy(btSize);
    }
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

        //ammo physics config 
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -1, 0));

        this.rigidBodies = [];

        //setup init three.js
        this.renderer = new THREE.WebGLRenderer({antialias: true,});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        

        
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x222222, 1, 25 );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        //renderer.setSize(window.innerWidth/2, window.innerHeight/2); //half res test
        //add render element (canvas)
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = "canvasThree";

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

        // //test geometry
        // this.cube = new THREE.Mesh(
        //     new THREE.BoxGeometry(1,1,1), 
        //     new THREE.MeshBasicMaterial({
        //         color: 0x00ff00
        //     }));
        // this.scene.add( this.cube );
        this.camera.position.z = 5;


        
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 1, 100),
            new THREE.MeshStandardMaterial({color: 0x404040}));
        ground.castShadow = false;
        ground.receiveShadow = true;
        ground.position.set(0,-3.5,0);
        this.scene.add(ground);

        const rb_ground = new RigidBody();
        rb_ground.createBox(0, ground.position, ground.quaternion, new THREE.Vector3(100, 1, 100));
        this.physicsWorld.addRigidBody(rb_ground.body);

        //Player default obj and rigid body
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({color: 0x909090}));
        box.castShadow = true;
        box.receiveShadow = true;
        box.position.set(0, 0.5, -0.5);
        this.scene.add(box);
        
        const rb_box = new RigidBody();
        rb_box.createBox(1, box.position, box.quaternion, new THREE.Vector3(1, 1, 1), null);
        rb_box.body.setRestitution(0.1);
        rb_box.body.setFriction(0.0);
        rb_box.body.setRollingFriction(1);
        this.physicsWorld.addRigidBody(rb_box.body);
        this.rigidBodies.push({mesh: box, rigidBody: rb_box});

        
        
        const box2 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({color: 0xC09090}));
        box2.castShadow = true;
        box2.receiveShadow = true;
        box2.position.set(2.5, 1, -0.5);
        this.scene.add(box2);
        
        const rb_box2 = new RigidBody();
        rb_box2.createBox(2, box2.position, box2.quaternion, new THREE.Vector3(1, 1, 1), null);
        rb_box2.body.setRestitution(0.125);
        rb_box2.body.setFriction(1);
        rb_box2.body.setRollingFriction(5);
        this.physicsWorld.addRigidBody(rb_box2.body);
        this.rigidBodies.push({mesh: box2, rigidBody: rb_box2});

        //this.rigidBodies.push({mesh: box, rigidBody: rb});

        // const scale = Math.random() * 4 + 4;
        // const box = new THREE.Mesh(
        //   new THREE.BoxGeometry(scale*0.1, scale*0.1, scale*0.1),
        //   new THREE.MeshStandardMaterial({
        //       color: 0x808080,
        //   }));
        // box.position.set(Math.random() * 2 - 1, 0.0, Math.random() * 2 - 1);
        // box.quaternion.set(0, 0, 0, 1);
        // box.castShadow = true;
        // box.receiveShadow = true;

        this.tmpTransform = new Ammo.btTransform();
        this._previousRAF = null;
        this._mixers = [];

        this.f = new FontFace('retroPixel', 'url(./src/EarlyGameBoy.ttf)');
        this.f.load().then(function(font) {
            //Ready to use the font in a canvas context
            console.log('*Custom Font Loaded Successfully*');
            //Add font on the html page
            document.fonts.add(font);

        });
        
        // Ammo().then(function(Ammo) {
        //     console.log("Ammo physics loaded");

        //     var collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
        //     //console.log(collisionConfiguration_);
        //     //initPhysics();
            
        //     //Kick off main panel setup
        //     // initAndStartGame();
        // });

        this.renderInterval;

        // const loader = new GLTFLoader();
        // const metaBoy = this.MainModelLoader("./src/3dAssets/MetaBoy_3173_test1.glb");

        //Load models (really caveman setup here bleh)
        this.metaBoyModel = undefined; 
        this.metaScreenModel = undefined;
        
        this.levelSeg_01_1 = undefined;

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

            box.visible = false;
            // child.material.shading = THREE.SmoothShading;
        });

        //console.log(this.metaBoyModel);

        // const rb_meta = new RigidBody();
        // rb_meta.createBox(2, metaBoyModel.position, metaBoyModel.quaternion, new THREE.Vector3(1, 1, 1), null);
        // rb_meta.body.setRestitution(0.125);
        // rb_meta.body.setFriction(1);
        // rb_meta.body.setRollingFriction(5);
        //this.physicsWorld.addRigidBody(rb_meta.body);
        //this.rigidBodies.push({mesh: this.metaBoyModel, rigidBody: rb_meta});

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

        this.levelSeg_01_1 = this.LoadModel("./src/3dAssets/levelsegments/level_seg01_test01.glb");
        //this.scene.add(this.levelSeg_01_1);

        // this.LoadAnimatedModel();
        //console.log("kicking off application");
        this.RenderAnimationFrame();
    }

    // loader.loadAsync("./src/3dAssets/MetaBoy_3173_test1.glb"),
    // loader.loadAsync("./src/3dAssets/MetaScreen_test1.glb"),
            
    LoadAnimatedModel() {
        // console.log("loadanimated model");
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

    loadToScene(obj) {
        console.log("model: " + obj);
        model.position.set(0,0,0);
        this.scene.add(obj);

    }

    // async MainModelLoader(url) {
    //     const gltfData = await this.ModelLoader(url),

    //     model = gltf.scene;
    //     this.scene.add(model);

    // }

    // OnLoaded(obj) {
    //     this.target = obj;
    //     this.scene.add(this.target); 
    // }

    RenderAnimationFrame() {
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

        if(this.metaBoyModel) {
            let physicsBody = this.rigidBodies[0].rigidBody.body;

            if(this.character_controls.input.keys.left) {
                //console.log("left!");
                // this.metaBoyModel.scene.position.x -= 0.05;                            
                this.metaBoyModel.scene.rotation.y = -0.1;
                let jumpImpulse = new Ammo.btVector3(-0.8, 0, 0);
                physicsBody.setActivationState(1);                
                physicsBody.setLinearVelocity( jumpImpulse );
                // physicsBody.applyImpulse( jumpImpulse );
                // physicsBody.applyForce( jumpImpulse );
            } else if(this.character_controls.input.keys.right) {
                this.metaBoyModel.scene.rotation.y = + 0.1;
                let jumpImpulse = new Ammo.btVector3(0.8, 0, 0);
                physicsBody.setActivationState(1);                
                physicsBody.setLinearVelocity( jumpImpulse );
            } else if(this.character_controls.input.keys.space) {
                let jumpImpulse = new Ammo.btVector3(0, 2, 0);
                physicsBody.setActivationState(1);                
                physicsBody.setLinearVelocity( jumpImpulse );
            } else {
                    this.metaBoyModel.scene.rotation.y = 0;
            }
        }

        //console.log(this.rigidBodies[0].mesh.userData);
        // var physicsBody = this.rb_box.physicsBody;

        //Refresh canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        //update game state
        if(init) {
            init = false;
            this.gameState(state);
        }

        //Draw title text
        this.drawTitleText();
        //Draw the button which toggles fullscreen mode
        this.drawFullScreenButton();
        this.debugMousePos();

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

    Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }
        //step physics
        this.physicsWorld.stepSimulation(timeElapsed, 10)
        //iterate over all objects and rigid bodies, link locations/etc 
        for (let i = 0; i < this.rigidBodies.length; ++i) {
            this.rigidBodies[i].rigidBody.motionState.getWorldTransform(this.tmpTransform);
            const pos = this.tmpTransform.getOrigin();
            const quat = this.tmpTransform.getRotation();
            const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z()); 
            const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());
            
            this.rigidBodies[i].mesh.position.copy(pos3);
            this.rigidBodies[i].mesh.quaternion.copy(quat3);

            if(i == 0 && this.metaBoyModel) { // if first object, parent metaboy to it
                this.metaBoyModel.scene.position.x = pos3.x;
                this.metaBoyModel.scene.position.y = pos3.y - 0.55;
                this.metaBoyModel.scene.position.z = pos3.z;
                //this.metaBoyModel.scene.rotation.copy(quat3);
            }
        }

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
        //Save the canvas on the temp/memory-only canvas
        tempCtx.drawImage(canvas, 0, 0);
        
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

        //Reset variables
        width = nftBOX.clientWidth;
        height = nftBOX.clientHeight;
        aspectRatio = width/height;
        //console.log('*width: ' + width + ' height: ' + height);
        
        //Draw saved canvas back right away
        ctx.drawImage(tempCanvas, 0, 0);
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

    drawTitleText() {
        //Draw Title text
        ctx.fillStyle = '#303030';
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
        ctx.beginPath();
        ctx.rect(xLoc, yLoc, xScale, xScale);
        ctx.fillStyle = 'rgba(100, 100, 240, 0.25)';
        //determine if mouse is over select area
        ctx.isPointInPath(mouse.x, mouse.y) ? fullScreenOver=true : fullScreenOver=false;
        ctx.fill();
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
    Ammo().then((lib) => {
        try {
            Ammo = lib;
            APP = new LoadPrimaryApplication();
            // LoadPrimaryApplication.initialize();
        } catch (error) {
            console.log("ASYNC ERROR THROWN: " + error);
        }
    });
});

//Kick off app function when initial HTML document loaded
//document.addEventListener("DOMContentLoaded", app);