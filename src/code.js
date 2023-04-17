// import * as THREE from '../lib/three.module.js';
// import * as CANNON from '../lib/cannon-es.js'
// import {GLTFLoader} from '../lib/GLTFLoader.js';
// import {OBJLoader} from '../lib/ObjLoader.js';
// import {ConvexGeometry} from '../lib/ConvexGeometry.js'
// import {OrbitControls} from '../lib/OrbitControls.js';
// import CannonUtils from '../lib/utils/CannonUtils.js';
// import CannonDebugger from '../lib/cannon-es-debugger.js';
// import { GUI } from '../lib/utils/lil-gui.module.min.js';

// import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
// import { RenderPass } from '../lib/postprocessing/RenderPass.js';
// import { GlitchPass } from '../lib/postprocessing/GlitchPass.js';
// import { RenderPixelatedPass } from '../lib/postprocessing/RenderPixelatedPass.js';
// import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';

import * as THREE from '../lib/three.module.js';
import * as CANNON from '../lib/cannon-es.js'
import {GLTFLoader} from '../lib/GLTFLoader.js';
import {OrbitControls} from '../lib/OrbitControls.js';
import CannonUtils from '../lib/utils/CannonUtils.js';
import { GUI } from '../lib/utils/lil-gui.module.min.js';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';

//Setup Canvas and Elements
var html = document.documentElement;
var body = document.body;
var nftBOX = document.getElementById('nftBOX');
var innerDIV = document.getElementById('innerDIV');
var loadingTxt = document.getElementById('loading');
var style = window.getComputedStyle(nftBOX);
//Get Delta/link example element
var deltaContainer = document.getElementById("container");

const params = {
    edgeStrength: 3.0,
    edgeGlow: 0.0,
    edgeThickness: 1.0,
    pulsePeriod: 0,
    rotate: false,
    usePatternTexture: false
};

let selectedObjects = [];

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

var terrainWidth = 24.95;

//Images/icons
//Load images for fullscreen toggle button
var imgFullScreenOpen = new Image();
var imgFullScreenClose = new Image();
var imgInfoOn = new Image();
var imgInfoOff = new Image();
imgFullScreenOpen.src = 'src/fullscreenOpen.png';
imgFullScreenClose.src = 'src/fullscreenClose.png';
var fullScreenToggle = false;
var fullScreenOver = false;
var pad, xLoc, yLoc, xScale;

var cameraMain = false; //debug camera
var cameraToggle = true;
var info = false;
var text = true;
var started = false;
var loaded = false;
var infoFade = 1;

var screenToggle = true;

var terrainX = 0; //used to setup terrain positions

var limbs = 0;

//state stuff
var init = true;

const STATE_ENUM = {
    MENU: "menu",
    START: "start",
    COMPLETE: "complete",
    DEATH: "death",
};

//audio
var clip_step1;
var clip_step2;
var clip_step3;
var clip_bck;
var clip_jump;
var clip_hit1;
var clip_hit2;
var clip_alien;

var alien_timer = 0;
var alien_shots = 0;

var lasers = [];


var state = STATE_ENUM.MENU;

//Store mouse position
const mouse = { x: 0, y: 0 };

//Cannon.js variables
var scene, scene2, camera, camera2, world;
var renderer, composer;

var renderPass;
var renderPixelatedPass;
var outlinePass;

let Meta_idleG = new THREE.Group();

let MetaComponents = new THREE.Group(); //primary group for animation frames
let Meta_01G = new THREE.Group();
let Meta_02G = new THREE.Group();
let Meta_03G = new THREE.Group();
let Meta_04G = new THREE.Group();
let Meta_05G = new THREE.Group();
let Meta_06G = new THREE.Group();
let Meta_07G = new THREE.Group();
let Meta_08G = new THREE.Group();
let Meta_09G = new THREE.Group();
let Meta_10G = new THREE.Group();
let Meta_11G = new THREE.Group();
let Meta_12G = new THREE.Group();
let Meta_jump = new THREE.Group();
let Meta_ship = new THREE.Group();

let metaBoyModel = new THREE.Group();
var extraY = 0;
var extraROT = 0;
var groundLevel = false; //cheap ground collision

var shipRotL;
let terrainGroup = new THREE.Group();

//20 models - todo (add to preloader)
//8 audio
//5 textures
let assets = []; 
var assetsToLoad = 11;

var sky_texture;
var haze_texture;
var laser_texture;

var infoOn_texture;
var infoOff_texture;

class GuiLoadManager {
    
    constructor(loadNum) {
        this.assets = null;
        this.assetsToLoad = loadNum;
        console.log("preloading " + this.assetsToLoad + " assets");
    }
    // toggleScreen(id, toggle) {
    //     let element = document.getElementById(id); 
    //     let display = (toggle) ? "block" : "none";
    //     element.style.display = display;
    // }
    // closeAllScreens() {
    //     let elements = document.querySelectorAll(".screen");
    //     [...elements].forEach( e => {
    //         e.style.display = "none";
    //     });
    // }
    // showScreen(id) {
    //     this.closeAllScreens();
    //     this.toggleScreen(id,true);
    // }
    getAsset(id) {
        return this.assets.filter(a => a.id === id)[0].var;
    }
    getAssets() {
        return this.assets;
    }

    // We need to do more here.

    load(assets) {
        this.assets = assets;
        if ( !this.assets || this.assets.length == 0 ) {
            // console.log("~start~");
            // this.showScreen("start");
            return;
        }
        if ( this.assets ) {
            this.assetsToLoad = this.assets.length;

            for ( let i = 0; i < this.assets.length; i++ ) {
                if ( this.assets[i].var != undefined ) {
                    if ( this.assets[i].var.nodeName == "IMG" ) {
                        console.log("loading image asset");
                        this.beginLoadingImage(
                            this.assets[i].var,
                            this.assets[i].file);
                        }
                        if ( this.assets[i].var.nodeName == "AUDIO" ) {
                        console.log("loading audio asset");
                        this.beginLoadingAudio(
                            this.assets[i].var,
                            this.assets[i].file);
                    }
                }
            }
        }
    }

    launchIfReady() {
        this.assetsToLoad--;
        if ( this.assetsToLoad == 0 ) {
            console.log("Asset preload complete: ~launch~");
            try { //new load setup
                APP = new LoadPrimaryApplication();
                
            } catch (error) {
                console.log("ASYNC ERROR THROWN: " + error);
            }
            // this.showScreen("start");
        }
    }

    beginLoadingImage(imgVar, fileName) {
        imgVar.onload = () => this.launchIfReady();
        imgVar.src = fileName;
    }

    beginLoadingAudio(audioVar, fileName) {
        audioVar.src = fileName;
        audioVar.addEventListener('canplay', () => this.launchIfReady());
    }
}

window.gui = new GuiLoadManager(assetsToLoad);

window.onload = function() {
    // console.log("window.onload = true");
    window.gui.load([ 
        {id: "skyTexture", var: sky_texture = document.createElement("img"), file: 'src/textures/skyGradient2wide.png' },
        {id: "hazeTexture", var: haze_texture = document.createElement("img"), file: 'src/textures/screen_haze4.png' },
        {id: "laserTexture", var: laser_texture = document.createElement("img"), file: 'src/textures/laser.png' },

        {id: "infoOnTexture", var: infoOn_texture = document.createElement("img"), file: 'src/menu/Menu_NFTdemo01_on.png' },
        {id: "infoOffTexture", var: infoOff_texture = document.createElement("img"), file: 'src/menu/Menu_NFTdemo01_off.png' },
        
        {id: "step01Audio", var: clip_step1 = document.createElement("audio"), file: 'src/audio/step01.wav' },
        {id: "step02Audio", var: clip_step2 = document.createElement("audio"), file: 'src/audio/step02.wav' },
        {id: "step03Audio", var: clip_step3 = document.createElement("audio"), file: 'src/audio/step03.wav' },
        {id: "hitAudio", var: clip_hit1 = document.createElement("audio"), file: 'src/audio/hit.wav' },
        {id: "hit2Audio", var: clip_hit2 = document.createElement("audio"), file: 'src/audio/hit2.wav' },
        {id: "jumpAudio", var: clip_jump = document.createElement("audio"), file: 'src/audio/jump.wav' },

        {id: "backAudio", var: clip_bck = document.createElement("audio"), file: 'src/audio/Metaboy_sfxbackground01.mp3' },
        {id: "alienAudio", var: clip_alien = document.createElement("audio"), file: 'src/audio/horn.mp3' },

    ]);
    //cannon.js physics config
    initCannon();
}

// function load(assets) {
//     this.assets = assets;
//     if(!this.assets || this.assets.length == 0) {
//         //launch
//         console.log("lunch");
//     }

// }

// function LaunchIfReady() {
//     assetsToLoad--;
//     if(assetsToLoad == 0) {
//         console.log("launch!!");
//     }
// }

// function BeginLoadingImage(imgVar, fileName) {
//     imgVar.onload = () => LaunchIfReady();
//     imgVar.src = fileName;
// }

// function BeginLoadingAudio(audioVar, fileName){
//     audioVar.src = fileName;
//     audioVar.addEventListener('canplay', () => LaunchIfReady())

// }

function initCannon() {

    world = new CANNON.World();
    world.gravity.set(0,-19.81,0);
    world.solver.iterations = 10; //(default is 10)

    console.log("CANNON.js initialized, world grav: " + world.gravity);

}

function playSFX(clip, vol) {
    if(!mute) {
        clip.volume = vol;
        clip.play();
    }
}

function toggleMute(vol) {
    if(mute) {
        mute = false;
        if(hornAudio) {
            hornAudio.volume = 0.5;
        }
        if(backgroundAudio) {
            backgroundAudio.volume = vol;
        }
    } else {
        mute = true;
        if(hornAudio) {
            hornAudio.volume = 0;
        }
        if(backgroundAudio) {
            backgroundAudio.volume = 0;
        }
    }
}

var backgroundAudio;
var hornAudio;
var mute = true;

var maxStepTime = 1;
var stepTime = 1;

function playSFXBackground(vol) {
    if(!backgroundAudio) {
        backgroundAudio = clip_bck;
        // backgroundAudio.muted = true; //avoid dumb html error
        backgroundAudio.volume = vol;
        backgroundAudio.loop = true;
        backgroundAudio.play();
    }
}

function playHornAudio(vol) {
    hornAudio = clip_alien;
    if(!mute) {
        hornAudio.volume = vol;
    } else {
        hornAudio.volume = 0;
    }
    // backgroundAudio.loop = true;
    hornAudio.play();

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

        loadingTxt.style.visibility = "hidden";
        
        //Retrieve and save values needed
        minCanvas = parseInt(style.getPropertyValue('min-height'));
        maxCanvas = parseInt(style.getPropertyValue('max-height'));
        //console.log("Minimum Canvas: " + minCanvas);
        //console.log("Maximum Canvas: " + maxCanvas);

        //this.rigidBodies = [];

        //setup init three.js
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        // renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.autoClear = false; //allow render overlay layer
        renderer.setClearColor( 0xFFFFFF, 0 ); // the default
        renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.type = THREE.BasicShadowMap;
        //console.log("nftBOX size: " + nftBOX.clientWidth + " , " + nftBOX.clientHeight);
        renderer.setSize(nftBOX.clientWidth, nftBOX.clientWidth); 

        //add render element (canvas)
        innerDIV.appendChild(renderer.domElement);
        renderer.domElement.id = "canvasThree";
        canvas2 = document.getElementById('canvasThree');
        ctx2 = canvas2.getContext("2d");

        //Scenes creation
        scene = new THREE.Scene();

        scene.fog = new THREE.Fog( 0x555555, 1, 90 );
        scene.background = null;
        scene2 = new THREE.Scene(); //background stuff
        scene2.background = null;
        
        //Camera creation
        camera = new THREE.PerspectiveCamera(75, nftBOX.clientWidth / nftBOX.clientWidth, 0.1, 1000);
        camera2 = new THREE.PerspectiveCamera(55, nftBOX.clientWidth / nftBOX.clientWidth, 0.1, 1000);

        camera = camera;
        camera2 = camera2;

        composer = new EffectComposer( renderer );     
        // const renderPass2 = new RenderPass( scene2, camera );
        // composer.addPass( renderPass2 );

        renderPass = new RenderPass( scene, camera );
        composer.addPass( renderPass ); 

        // renderPixelatedPass = new RenderPixelatedPass( 6, scene, camera );
        // composer.addPass( renderPixelatedPass );

        // outlinePass = new OutlinePass( new THREE.Vector2( nftBOX.clientWidth, nftBOX.clientHeight ), scene, camera );
        // outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
        // outlinePass.selectedObjects = selectedObjects;
        // composer.addPass( outlinePass );
        
        // resolution, strength, radius, threshold
        const bloomPass = new UnrealBloomPass(new THREE.Vector2( html.clientWidth, html.clientHeight ), 0.5, 0.7, 0.7);
        composer.addPass( bloomPass );

        // const glitchPass = new GlitchPass();
        // composer.addPass( glitchPass );

        // 1,    // strength
        // 25,   // kernel size
        // 4,    // sigma ?
        // 256,  // blur render target resolution
        // const bloomPass = new BloomPass( 1.5, 25, 8, 256 );
        // composer.addPass( bloomPass );

        // const renderPixelPath = new RenderPixelatedPass(6, scene, camera );
        // composer.addPass( renderPixelPath );

        this.controls = new OrbitControls(camera, renderer.domElement);
        
        // ambient light setup
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        // directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(80, 150, 64);
        // this.directionalLight.target.position.set(100, 0, 0);
        this.directionalLight.shadow.bias = -0.00075;
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
        
        //enable only for primary layer
        // this.ambientLight.layers.enable(0);
        // this.directionalLight.layers.enable(0);
        // scene2.add(this.ambientLight2);
        
        scene.add(this.ambientLight);
        scene.add(this.directionalLight);

        //this is important, as it resizes any time the window changes
        window.addEventListener('resize', () => {    
            if(fullScreenToggle) {
                fullScreenEnable();
            } else {
                resizeToDiv();
            }
        }, false);

        //touch and mouse events
        canvas2.addEventListener("pointerdown", this.dragStart, false);
        canvas2.addEventListener("pointerup", this.dragEnd, false);
        canvas2.addEventListener('pointermove', this.pointerTouchMove, false);

        //Call resize functions on setup so canvas is happy from the start
        resizeToDiv();

        camera.position.z = 5.5;
        camera.position.y = 0.5;

        camera2.position.z = 5.5;
        camera2.position.y = -1.5;

        //Setup Objects ////////////////////////////////////

        //Group handling
        MetaComponents.add(Meta_01G);
        MetaComponents.add(Meta_02G);
        MetaComponents.add(Meta_03G);
        MetaComponents.add(Meta_04G);
        MetaComponents.add(Meta_05G);
        MetaComponents.add(Meta_06G);
        MetaComponents.add(Meta_07G);
        MetaComponents.add(Meta_08G);
        MetaComponents.add(Meta_09G);
        MetaComponents.add(Meta_10G);
        MetaComponents.add(Meta_11G);
        MetaComponents.add(Meta_12G);
        MetaComponents.add(Meta_jump);
        
        MetaComponents.add(Meta_ship);
        
        scene.add(MetaComponents);
        scene.add(Meta_idleG);
        scene.add(metaBoyModel);
        scene.add(terrainGroup);
        scene.add(Meta_ship);

        Meta_01G.visible = false;
        Meta_02G.visible = false;
        Meta_03G.visible = false;
        Meta_04G.visible = false;
        Meta_05G.visible = false;
        Meta_06G.visible = false;
        Meta_07G.visible = false;
        Meta_08G.visible = false;
        Meta_09G.visible = false;
        Meta_10G.visible = false;
        Meta_11G.visible = false;
        Meta_12G.visible = false;
        Meta_jump.visible = false;

        //Physics Materials setup
        // Static ground plane
        this.groundMaterial = new CANNON.Material("groundMaterial");
        this.groundMaterial.friction = 100;

        // Adjust constraint equation parameters for ground/ground contact
        this.ground_ground_cm = new CANNON.ContactMaterial(this.groundMaterial, this.groundMaterial, {
            friction: 10,
            restitution: 0.5,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e8,
            frictionEquationRegularizationTime: 3,
        });        
        // Add contact material to the world
        world.addContactMaterial(this.ground_ground_cm);
        
        this.slipperyMaterial = new CANNON.Material("slipperyMaterial");
        this.slipperyMaterial.friction = 10;
        
        this.slippery_ground_cm = new CANNON.ContactMaterial(this.groundMaterial, this.slipperyMaterial, {
            friction: 0.2,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        });
        // Add contact material to the world
        world.addContactMaterial(this.slippery_ground_cm);

        this.box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({color: 0x909090}));
        this.box.castShadow = false;
        this.box.receiveShadow = false;
        this.box.position.set(0, -1.5, -0.5);
        // this.addSelectedObject(this.box);
        scene.add(this.box);
        
        
        //box physics body
        this.boxBody1 = undefined; 
        this.boxBody1 = new CANNON.Body({
            mass: 10, // kg
            shape: new CANNON.Sphere(0.5),
            material: this.groundMaterial,
        })
        // this.boxBody1.fixedRotation = true;
        this.boxBody1.linearDamping = 0.95;
        this.boxBody1.position.set(0, -1.5, -1); // m
        world.addBody(this.boxBody1);

        this.ground = new THREE.Mesh(
            new THREE.BoxGeometry(1500, 1, 1500),
            new THREE.MeshStandardMaterial({color: 0x404040}));
        this.ground.castShadow = false;
        this.ground.receiveShadow = true;
        this.ground.position.set(0,-3.5,0);
        scene.add(this.ground);
        
        const groundShape = new CANNON.Box(new CANNON.Vec3(1500,1500,0.5));
        this.groundBody = new CANNON.Body({ 
            mass: 0, 
            material: this.groundMaterial })
        this.groundBody.addShape(groundShape);
        this.groundBody.position.set(0,-3.5,0);
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(this.groundBody);

        // demo.addVisual(groundBody)
        // this.boxBody1 = new CANNON.Body({
        //   mass: 5, // kg
        //   shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
        //   material: slipperyMaterial,
        // });
        // this.boxBody1.fixedRotation = true;
        // this.boxBody1.position.set(0, 1, -1); // m
        // world.addBody(this.boxBody1);
        
        // //Cannon sphere test
        // this.sphereMesh = undefined; 
        // const radius = 1 // m
        // const geometry = new THREE.SphereGeometry(radius)
        // const material = new THREE.MeshStandardMaterial({color: 0xC09090});
        // // const material = new THREE.MeshNormalMaterial()
        // this.sphereMesh = new THREE.Mesh(geometry, material)
        // scene.add(this.sphereMesh)

        // //sphere physics body
        // this.sphereBody = undefined; 
        // this.sphereBody = new CANNON.Body({
        //   mass: 10, // kg
        //   shape: new CANNON.Sphere(radius),
        // })
        // this.sphereBody.position.set(-4, 2, 0) // m
        // world.addBody(this.sphereBody)

        //test box
        // this.box2 = undefined; 
        // this.box2 = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshStandardMaterial({color: 0xC09090}));
        // this.box2.castShadow = true;
        // this.box2.receiveShadow = true;
        // scene.add(this.box2);
        
        // //box physics body
        // this.boxBody = undefined; 
        // this.boxBody = new CANNON.Body({
        //   mass: 0.5, // kg
        //   shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
        // })
        // this.boxBody.position.set(2.5, 3, -0.5) // m
        // world.addBody(this.boxBody);


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
        // this.metaBoyModel = undefined; 
        this.metaScreenModel = undefined;
        this.metaSky = undefined;
        this.metaBuildings = undefined;
        this.metaRocks = undefined;
        this.metaRocks2 = undefined;
        this.metaRocks3 = undefined;
        
        // //Manager         
        // function loadModel() {
            
        //     object.traverse( function ( child ) {
            
            //         if ( child.isMesh ) child.material.map = texture;
            
            //     } );
            
        //     object.position.y = + 2;
        //     scene.add( object );
        // }
        // const manager = new THREE.LoadingManager( loadModel );
        // 				// texture
        // const textureLoader = new THREE.TextureLoader( manager );
        // const texture = textureLoader.load( 'textures/uv_grid_opengl.jpg' );

        
        const texLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();

        
        //peloaded texture setup
        imgInfoOn.src = infoOn_texture.src;
        imgInfoOn.needsUpdate = true;
        imgInfoOff.src = infoOff_texture.src;
        imgInfoOff.needsUpdate = true;

        const skyTexture = new THREE.Texture(sky_texture);
        skyTexture.needsUpdate = true;
        const hazeTexture = new THREE.Texture(haze_texture);
        hazeTexture.needsUpdate = true;
        const laserTexture = new THREE.Texture(laser_texture);
        laserTexture.needsUpdate = true;

        // const hazeTexture = texLoader.load('/src/textures/screen_haze4.png');
        // const laserTexture = texLoader.load('/src/textures/laser.png');
        // const hazeMaterial = new THREE.SpriteMaterial( { map: hazeTexture } );
        // var hazeSprite = new THREE.Sprite( hazeMaterial );
        // hazeSprite.scale.set( 2.15, 2.15, 2.15 );
        // hazeSprite.position.set( 0, -1.2, 0.35 );
        // scene.add( hazeSprite );
        const laserMaterial = new THREE.SpriteMaterial( { 
            map: laserTexture,
            fog: false, 
            side: THREE.DoubleSide, } );
        lasers[0] = new THREE.Sprite( laserMaterial );
        lasers[1] = new THREE.Sprite( laserMaterial );
        lasers[2] = new THREE.Sprite( laserMaterial );
        lasers[3] = new THREE.Sprite( laserMaterial );
        lasers[4] = new THREE.Sprite( laserMaterial );
        lasers[5] = new THREE.Sprite( laserMaterial );
        

        lasers.forEach(function(laser) {
            var rnd = Math.floor(Math.random() * 4 + 2);
            laser.scale.set( 3, rnd, 3 );
            laser.position.set( 0, -999, 0 );
            scene.add( laser );
        })
        
        
        // laserSprite2.scale.set( 2.15, 4, 2.15 );
        // laserSprite2.position.set( 0, -999, 0 );
        // scene.add( laserSprite2 );
        
        // laserSprite3.scale.set( 2.15, 2.5, 2.15 );
        // laserSprite3.position.set( 0, -999, 0 );
        // scene.add( laserSprite3 );
        
        // laserSprite4.scale.set( 2.15, 3.2, 2.15 );
        // laserSprite4.position.set( 0, -999, 0 );
        // scene.add( laserSprite4 );
        
        // laserSprite5.scale.set( 2.15, 2, 2.15 );
        // laserSprite5.position.set( 0, -999, 0 );
        // scene.add( laserSprite5 );
        
        // laserSprite6.scale.set( 2.15, 3.8, 2.15 );
        // laserSprite6.position.set( 0, -999, 0 );
        // scene.add( laserSprite6 );
        

        const geometry = new THREE.PlaneGeometry( 2.15, 2.15 );
        const material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, transparent: true, map: hazeTexture} );
        var hazeObj = new THREE.Mesh( geometry, material );
        hazeObj.position.set( 0, 1.30, 0.25 );
        hazeObj.scale.set( 1, 0.75, 1 );
        hazeObj.visible = false;
        metaBoyModel.add( hazeObj );

        // const skyTexture = texLoader.load('/src/textures/skyGradient2wide.png');
        skyTexture.flipY = false;
        skyTexture.minFilter = THREE.NearestFilter;
        skyTexture.magFilter = THREE.NearestFilter;
        skyTexture.encoding = THREE.sRGBEncoding;

        const antifogMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                fog: false, 
                side: THREE.DoubleSide,
                map: skyTexture,
            });
        // const antifogMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000,fog: false, side: THREE.DoubleSide});

        gltfLoader.load("./src/3dAssets/MetaScreen_test1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                    if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.metaScreenModel = gltfScene;
                    gltfScene.scene.scale.set(0.5,0.5,0.5);
                    gltfScene.scene.position.x = -3;
                    gltfScene.scene.position.y = -3;
                    gltfScene.scene.position.z = -2;
                    gltfScene.scene.scale.set(0.5,0.5,0.5);
                    scene.add(gltfScene.scene);
        });

        gltfLoader.load("./src/3dAssets/MetaScreen_skytest3.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.material = antifogMaterial;
                }
            });
            this.metaSky = gltfScene;
            gltfScene.scene.scale.set( 1, 1.5 ,1 );
            gltfScene.scene.position.y = 0;
            gltfScene.scene.position.x = 0;
            gltfScene.scene.position.z = 0;

            scene.add(gltfScene.scene);
            // scene2.add(gltfScene.scene);
        });
        
        gltfLoader.load("./src/3dAssets/MetaScreen_buildingtest1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
            this.metaBuildings = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.x = -3;
            gltfScene.scene.position.y = -2.5;
            gltfScene.scene.position.z = 0;
            gltfScene.scene.scale.set(0.5,0.5,0.5);

            // scene.add(gltfScene.scene);
            scene.add(gltfScene.scene);
        });
        
        gltfLoader.load("./src/3dAssets/MetaScreen_rocktest1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = true;
                }
            });
            this.metaRocks = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.metaRocks.scene.position.x = -terrainWidth;
            this.metaRocks.scene.position.y = -2.9;
            this.metaRocks.scene.position.z = 0;
            gltfScene.scene.scale.set(0.5,0.5,0.5);

            terrainGroup.add(this.metaRocks.scene);
            // scene.add(gltfScene.scene);
            // scene.add(this.metaRocks.scene);
        });
        gltfLoader.load("./src/3dAssets/MetaScreen_rocktest1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.metaRocks2 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.metaRocks2.scene.position.x = 0;
            this.metaRocks2.scene.position.y = -2.9;
            this.metaRocks2.scene.position.z = 0;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            
            terrainGroup.add(this.metaRocks2.scene);
            // scene.add(gltfScene.scene);
            // scene.add(this.metaRocks2.scene);
        });
        gltfLoader.load("./src/3dAssets/MetaScreen_rocktest1.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = true;
                }
            });
            this.metaRocks3 = gltfScene;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            this.metaRocks3.scene.position.x = terrainWidth;
            this.metaRocks3.scene.position.y = -2.9;
            this.metaRocks3.scene.position.z = 0;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            
            terrainGroup.add(this.metaRocks3.scene);
            // scene.add(gltfScene.scene);
            // scene.add(this.metaRocks3.scene);
        });

        // gltfScene.layers.set(1); //set to layer without light

        const params = {
            camera: camera,
            scene: scene,
        }
        this.character_controls = new BasicCharacterController(params);

        this.LoadPart("./src/3dAssets/Meta_idle.glb", gltfLoader, Meta_idleG, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs01.glb", gltfLoader, Meta_01G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs02.glb", gltfLoader, Meta_02G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs03.glb", gltfLoader, Meta_03G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs04.glb", gltfLoader, Meta_04G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs05.glb", gltfLoader, Meta_05G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs06.glb", gltfLoader, Meta_06G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs07.glb", gltfLoader, Meta_07G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs08.glb", gltfLoader, Meta_08G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs09.glb", gltfLoader, Meta_09G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs10.glb", gltfLoader, Meta_10G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs11.glb", gltfLoader, Meta_11G, scene);
        this.LoadPart("./src/3dAssets/Meta_limbs12.glb", gltfLoader, Meta_12G, scene);
        this.LoadPart("./src/3dAssets/Meta_jump.glb", gltfLoader, Meta_jump, scene);
        
        //setup ship
        this.LoadPart("./src/3dAssets/Meta_ship.glb", gltfLoader, Meta_ship, scene);
        Meta_ship.position.set( 0, 25, -50 );
        Meta_ship.rotation.set( 0.2, -0.3, -0.0 );

        //load metaboy model 
        gltfLoader.load("./src/3dAssets/MetaBoy_3173_tex3.glb", (gltfScene) => {
        //gltfLoader.load("./src/test/Dice_export_test01.glb", (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -0.425;
            metaBoyModel.add(gltfScene.scene);
            // gltfScene.scene.rotation.y = 45;
            // gltfScene.scene.position.x = +1.5;
            //gltfScene.scene.quaternion.set(0.2, 0, 0, 1);
            //scene.add(metaBoyModel);

            //this.addSelectedObject(metaBoyModel);
            this.box.visible = false;
            hazeObj.visible = true;
            loaded = true;
            // child.material.shading = THREE.SmoothShading;
        });

        //console.log("kicking off application");
        this.RenderAnimationFrame();
    }

    // addSelectedObject( object ) {

    //     selectedObjects = [];
    //     selectedObjects.push( object );
    //     console.log("selectedObjects count: " + selectedObjects.length);

    // }

    LoadPart(url, loader, grp) {
        loader.load(url, (gltfScene) => {
            gltfScene.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            gltfScene.scene.position.y = -2.8;
            gltfScene.scene.scale.set(0.5,0.5,0.5);
            grp.add(gltfScene.scene);
        });
    }

    LoadModel(url) {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(url, (gltfScene) => {
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
            scene.add(gltfScene.scene);

            return gltfScene;
        });
    }

    // 0 == right
    // 1 == left
    ResetTerrain(left) {

        if(left) {
            //move terrain
            terrainGroup.position.x += terrainWidth;
            // terrainGroup.position.y = 2;
            //reset current terrain X location
            terrainX = terrainX + terrainWidth;
        }
        if(!left) {
            //move terrain
            terrainGroup.position.x -= terrainWidth;
            // terrainGroup.position.y = 2;
            //reset current terrain X location
            terrainX = terrainX - terrainWidth;
        }
    }

    InitGUI() {     
        // Init gui
        const gui = new GUI( { width: 280 } );

        gui.add( params, 'edgeStrength', 0.01, 10 ).onChange( function ( value ) {

            outlinePass.edgeStrength = Number( value );

        } );

        gui.add( params, 'edgeGlow', 0.0, 1 ).onChange( function ( value ) {

            outlinePass.edgeGlow = Number( value );

        } );

        gui.add( params, 'edgeThickness', 1, 4 ).onChange( function ( value ) {

            outlinePass.edgeThickness = Number( value );

        } );

        gui.add( params, 'pulsePeriod', 0.0, 5 ).onChange( function ( value ) {

            outlinePass.pulsePeriod = Number( value );

        } );

        gui.add( params, 'rotate' );

        gui.add( params, 'usePatternTexture' ).onChange( function ( value ) {

            outlinePass.usePatternTexture = value;

        } );

        function Configuration() {

            this.visibleEdgeColor = '#ffffff';
            this.hiddenEdgeColor = '#190a05';

        }

        const conf = new Configuration();

        gui.addColor( conf, 'visibleEdgeColor' ).onChange( function ( value ) {

            outlinePass.visibleEdgeColor.set( value );

        } );

        gui.addColor( conf, 'hiddenEdgeColor' ).onChange( function ( value ) {

            outlinePass.hiddenEdgeColor.set( value );

        } );
        
        // GUI
        // gui = new GUI();
        // params = { pixelSize: 6, normalEdgeStrength: .3, depthEdgeStrength: .4 };
        // gui.add( params, 'pixelSize' ).min( 1 ).max( 16 ).step( 1 )
        //     .onChange( () => {
        //         renderPixelatedPass.setPixelSize( params.pixelSize );
        //     } );
        // gui.add( renderPixelatedPass, 'normalEdgeStrength' ).min( 0 ).max( 2 ).step( .05 );
        // gui.add( renderPixelatedPass, 'depthEdgeStrength' ).min( 0 ).max( 1 ).step( .05 );
    }

    CheckGroundLevel() {
        // console.log(this.boxBody1.position.y);
        if(this.boxBody1.position.y < -2.49) {
            playSFX(clip_hit2, 0.45);
            groundLevel = true;
            Meta_jump.visible = false;
        }
    }

    RenderAnimationFrame() {
        //update game state
        if(loaded && init) {
            console.log("All primary objects loaded");

            // alien_timer = this.getRandomInt(20, 40);
            alien_timer = this.getRandomInt(10, 10);
            console.log("Alien ship will blast in: [" + alien_timer + " seconds]");

            init = false;
            // this.gameState(state);

            //this.InitGUI();
        }

        if(started && infoFade >= 0.02) {
            infoFade -= 0.02;
            mute = false;
            playSFXBackground(0.75);
        }

        //slot L, slot M, slot R
        
        //we have gone to the next left area
        if(this.boxBody1.position.x > terrainX + terrainWidth) {
            // console.log("RIGHT TERRAIN ENTERED");
            this.ResetTerrain(true);
        }
        else if(this.boxBody1.position.x < terrainX - terrainWidth) {
            // console.log("LEFT TERRAIN ENTERED");
            this.ResetTerrain(false);
        }

        //remainder check
        // console.log(this.boxBody1.position.x );
        // console.log("x: " + this.boxBody1.position.x + ", mod: " + this.boxBody1.position.x % terrainWidth);

        //hack fix box rotation (since fixedRotation isnt doing it...)
        // this.boxBody1.quaternion.x = 0;
        // this.boxBody1.quaternion.y = 0;
        // this.boxBody1.quaternion.z = 0;

        //handle camera switching 
        if(this.character_controls.input.keys.c == true) {
            if(cameraMain) {
                cameraMain = false;
                cameraToggle = true;
            } else {
                cameraMain = true;
                cameraToggle = true;
            } //toggle
            //reset 
            this.character_controls.input.keys.c = false;
        }
        //info panel toggel
        if(this.character_controls.input.keys.i == true) {
            if(info) {
                info = false;
            } else {
                info = true;
            } //toggle
            //reset 
            this.character_controls.input.keys.i = false;
        }

        //Game states
        //if(state == STATE_ENUM.MENU) {
            //console.log("menu state");

        // if(this.cube) {
        //     this.cube.rotation.x += 0.01;
        //     this.cube.rotation.y += 0.01;
        //     this.cube.position.y = -0.5;
        // }

        //handle metascreen model (rotating)
        if(this.metaScreenModel) {
            // console.log("loaded metaboy");
            if(this.metaScreenModel.scene.position.y < -3 && screenToggle) {

                this.metaScreenModel.scene.position.y += 0.005;
                
            } else {
                screenToggle = false;
            }
            if(this.metaScreenModel.scene.position.y > -3.5 && !screenToggle) {
                this.metaScreenModel.scene.position.y -= 0.005;

            }else {
                screenToggle = true;
            }
            // this.metaScreenModel.scene.rotation.y += 0.01;
        }
        // console.log(Meta_ship.rotation.y);
        if(Meta_ship.rotation.y < -0.6) {
            shipRotL = true;
        } else if (Meta_ship.rotation.y > 0.6) {
            shipRotL = false;
        }

        if(shipRotL) {
            Meta_ship.rotation.y += 0.0007;
        } else {
            Meta_ship.rotation.y -= 0.0007;
        }

        //calculate velocity
        var vel = Math.abs(this.boxBody1.velocity.x);
        // console.log(Math.abs(this.boxBody1.velocity.x));
        
        var LEFTmovement = this.character_controls.input.keys.left;
        var RIGHTmovement = this.character_controls.input.keys.right;

        if(alien_shots > 0) {
            alien_shots -= 0.04;
            //laserSprite1.position.set(Meta_ship.position.x, 20, -50);

            lasers.forEach(function(laser) {
                if(laser.position.y < -4) {
                    laser.position.x =  Meta_ship.position.x + Math.floor(Math.random() * -3 + 3);
                    laser.position.y = Math.floor(Math.random() * 19 + 5);
                    laser.position.z = Meta_ship.position.z + Math.floor(Math.random() * -2 + 2);
                } else {
                    laser.position.y -= 0.8 
                        
                }
            })
        } else {
            lasers.forEach(function(laser) {
                if(laser.position.y > -20) {
                    laser.position.y -= 0.8 
                }
            })      
        }

        //Character controller updates
        if(loaded) {
            //countdown between attacks
            if(alien_timer <= 0) {
                //set off attack
                playHornAudio(0.75);
                alien_shots = this.getRandomInt(10, 20);

                alien_timer = this.getRandomInt(20, 40);
                console.log("alien will blast in: " + alien_timer + "seconds");
            } else {
                alien_timer -= 0.01;
            }

            if(stepTime > 0) {
                stepTime-=0.1;
            }
            if(LEFTmovement) {   //LEFT movement
                //console.log("left!");
                metaBoyModel.rotation.y = -0.1 - extraROT;
                MetaComponents.rotation.y = -0.1;
                const force = new CANNON.Vec3( -300, 0, 0 );
                this.boxBody1.applyForce(force);

                MetaComponents.scale.x = -1;
                // this.AnimateRunCycle();

            } else if(RIGHTmovement) {   //RIGHT movement
                metaBoyModel.rotation.y = + 0.1  + extraROT;
                MetaComponents.rotation.y = + 0.1;
                const force = new CANNON.Vec3( 300, 0, 0 );
                this.boxBody1.applyForce(force);

                MetaComponents.scale.x = 1;
            } else {                                                //IDLE
            //     limbs = 0;
            //     Meta_idleG.visible = true;
            //reset but only if not using left or right keys
                if(vel < 1) {
                    Meta_idleG.visible = true;
                    limbs = 0;
                    this.boxBody1.velocity.x = 0;
                    metaBoyModel.rotation.y = 0.1; //reset body rotation
                    MetaComponents.rotation.y = 0; //reset body rotation 
                }
            }

            if(!groundLevel) {
                this.CheckGroundLevel();
            }

            if(groundLevel) {
                if(this.character_controls.input.keys.space) {   //JUMP
                    playSFX(clip_jump, 0.33);
                    groundLevel = false;
                    const force = new CANNON.Vec3( 0, 7000, 0 );
                    this.boxBody1.applyForce(force);
                    // Meta_idleG.visible = true;
                }                
                if(vel > 1) {
                    this.AnimateRunCycle();
                    limbs += vel/32;    //increment animation - based on velocity
                } else {
                    if(!LEFTmovement && !RIGHTmovement) {
                        MetaComponents.scale.x = 1;
                        this.ResetMetas();
                    }
                }
                    
                //constant movement test
                if(limbs >= 12) {
                    limbs = 0;
                } 
                
            } else {
                Meta_idleG.visible = false;
                this.ResetMetas();
                Meta_jump.visible = true;

            }

        }

        if(this.character_controls.input.keys.m) {
            toggleMute(0.75);
            this.character_controls.input.keys.m = false;
        }

        if(this.character_controls.input.keys.t) {
            if(text) {
                text = false;
            } else {
                text = true;
            }
            this.character_controls.input.keys.t = false;
        }

        //Refresh canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        //Draw title text
        this.drawTitleText();
        //Draw the button which toggles fullscreen mode
        this.drawInfo();
        this.drawFullScreenButton();
        if(text) {
            this.debugMousePos();
        }

        //run Cannon physics sim independant from framerate 
        if(loaded) {
            world.fixedStep()
        }

        //update test sphere
        // this.sphereMesh.position.copy(this.sphereBody.position)
        // this.sphereMesh.quaternion.copy(this.sphereBody.quaternion)
        //update test box
        //this.box2.position.copy(this.boxBody.position)
        //this.box2.quaternion.copy(this.boxBody.quaternion)

        //update player
        if(this.boxBody1.position.z != 0) {
            this.boxBody1.position.z = 0; //rough clamp to Z axis
        }
        const newPos = new THREE.Vector3();
        const newCamPos = new THREE.Vector3();
        // const newPos = new THREE.Vector3(0,0,0);
        const currentPos = new THREE.Vector3(
            metaBoyModel.position.x, 
            metaBoyModel.position.y, 
            metaBoyModel.position.z ); 
        //set player object to follow physics object
        // v1 and v2 vectors
        const targetPos = new THREE.Vector3(
            this.boxBody1.position.x,
            this.boxBody1.position.y + 0.05 + extraY,
            this.boxBody1.position.z );
            // const v2 = new THREE.Vector3(
            //     this.metaBoyModel.scene.position.x, 
            //     this.metaBoyModel.scene.position.y, 
            //     this.metaBoyModel.scene.position.z );
        // position mesh1 at 0.25 alpha between v1 and v2
        // this.metaBoyModel.position.copy(v1).lerp( v2, 0.25);
        // newPos.lerpVectors(v1, newPos, 0.25);
        newPos.lerpVectors(currentPos, targetPos, 0.55);        
        metaBoyModel.position.copy(newPos);
        
        newCamPos.lerpVectors(currentPos, targetPos, 0.9);
        //camera 2 tracking player position
        if(!cameraMain) {
            camera2.position.x = newCamPos.x;
            camera2.position.y = newCamPos.y + 1.33 - extraY;
            camera2.position.z = newCamPos.z + 5.4;
        }

        // metaBoyModel.position.copy(v1).lerp( v2, 0.25);
        // metaBoyModel.position.copy(newPos);

        // const pos3 = new THREE.Vector3(this.boxBody1.position.x, this.boxBody1.position.y, this.boxBody1.position.z); 
        // if(this.metaBoyModel) {
        //     this.metaBoyModel.scene.position.x = pos3.x;
        //     this.metaBoyModel.scene.position.y = pos3.y - 0.38;
        //     this.metaBoyModel.scene.position.z = pos3.z + 0.0;
        // }

        MetaComponents.position.x = newPos.x;
        MetaComponents.position.y = newPos.y + 2.4 - extraY;
        MetaComponents.position.z = newPos.z;
        
        Meta_idleG.position.x = newPos.x;
        Meta_idleG.position.y = newPos.y + 2.4;
        Meta_idleG.position.z = newPos.z;

        //debug cube visuals
        this.box.position.copy(this.boxBody1.position)
        this.box.quaternion.copy(this.boxBody1.quaternion)

        //handle sky and buildings, track to camera if in debug view
        if(!cameraMain) {  
            if(this.metaSky) {
                this.metaSky.scene.position.x = this.boxBody1.position.x;
                this.metaSky.scene.position.y = this.boxBody1.position.y;
                this.metaSky.scene.position.z = this.boxBody1.position.z;
            }
            
            if(this.metaBuildings) {
                this.metaBuildings.scene.position.x = this.boxBody1.position.x*0.8;
                Meta_ship.position.x = (this.boxBody1.position.x*0.8) + 13;
            }
        } else {
            if(this.metaSky) {
                this.metaSky.scene.position.x = camera.position.x;
                this.metaSky.scene.position.y = camera.position.y;
                this.metaSky.scene.position.z = camera.position.z;
            }
            if(this.metaBuildings) {
                this.metaBuildings.scene.position.x = camera.position.x*0.8;
            }
        }
      
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
                //console.log("kicking off first animation frame");
            }
      
            this.RenderAnimationFrame();

            //toggle rendering between debug view and sidescroller view
            // if(cameraMain) {
            //     this.renderer.clear();
            //     this.renderer.render(scene2, camera);
            //     this.renderer.render(scene, camera);
            //     this.renderer.clearDepth();
            // } else {
            //     this.renderer.clear();
            //     this.renderer.render(scene2, camera2);
            //     this.renderer.render(scene, camera2);
            //     this.renderer.clearDepth();
            // }
            
            //update on camera switch
            if(cameraToggle) {
                if(cameraMain) {
                    renderPass.camera = camera;
                } else {
                    renderPass.camera = camera2;
                }
                cameraToggle = false;
            }

            //this.renderer.render(scene2, camera);
            // this.renderer.clearDepth();
            composer.render();
            
            this.controls.update();
            this.Step(t - this._previousRAF);
            this._previousRAF = t;

        });
    }

    // 01    3 x 0
    // 02    2 x 1
    // 03    1 x 1
    // 04    2 x 2
    // 05    3 x 2
    // 06    4 x 3
    // 07    3 x 3
    // 08    2 x 2
    // 09    1 x 2
    // 10    2 x 1
    // 11    3 x 1
    // 12    4 x 0
    getRandomInt(min, max) {
        return Math.floor(Math.random() * max + min);
    }

    PlayRandomStep() {
        if(stepTime <= 0) {
            stepTime = maxStepTime;
            var rnd = this.getRandomInt(0,3);
            // console.log(rnd);
            if(rnd == 0) {
                playSFX(clip_step1, 0.2);
            } else if (rnd == 1) {
                playSFX(clip_step2, 0.3);
            } else { 
                playSFX(clip_step3, 0.25);
            }
        }
    }

    AnimateRunCycle() {
        Meta_idleG.visible = false;
        
        if(limbs < 1) {
            extraROT = 0.0;
            extraY = 0.15;
            Meta_12G.visible = false;
            Meta_01G.visible = true;
        } else if (limbs < 2) {
            this.PlayRandomStep();

            extraROT = 0.1;
            extraY = 0.1;
            Meta_01G.visible = false;
            Meta_02G.visible = true;
        } else if (limbs < 3) {
            extraROT = 0.1;
            extraY = 0.05;
            Meta_02G.visible = false;
            Meta_03G.visible = true;
        } else if (limbs < 4) {
            extraROT = 0.2;
            extraY = 0.1;
            Meta_03G.visible = false;
            Meta_04G.visible = true;
        } else if (limbs < 5) {
            extraROT = 0.2;
            extraY = 0.15;
            Meta_04G.visible = false;
            Meta_05G.visible = true;
        } else if (limbs < 6) {
            extraROT = 0.3;
            extraY = 0.2;
            Meta_05G.visible = false;
            Meta_06G.visible = true;
        } else if (limbs < 7) {
            extraROT = 0.3;
            extraY = 0.15;
            Meta_06G.visible = false;
            Meta_07G.visible = true;
        } else if (limbs < 8) {
            this.PlayRandomStep();

            extraROT = 0.2;
            extraY = 0.1;
            Meta_07G.visible = false;
            Meta_08G.visible = true;
        } else if (limbs < 9) {
            extraROT = 0.2;
            extraY = 0.05;
            Meta_08G.visible = false;
            Meta_09G.visible = true;
        } else if (limbs < 10) {
            extraROT = 0.1;
            extraY = 0.1;
            Meta_09G.visible = false;
            Meta_10G.visible = true;
        } else if (limbs < 11) {
            extraROT = 0.1;
            extraY = 0.15;
            Meta_10G.visible = false;
            Meta_11G.visible = true;
        } else if (limbs < 12) {
            extraROT = 0.0;
            extraY = 0.2;
            Meta_11G.visible = false;
            Meta_12G.visible = true;
        }
    }

    ResetMetas() {
        Meta_01G.visible = false;
        Meta_02G.visible = false;
        Meta_03G.visible = false;
        Meta_04G.visible = false;
        Meta_05G.visible = false;
        Meta_06G.visible = false;
        Meta_07G.visible = false;
        Meta_08G.visible = false;
        Meta_09G.visible = false;
        Meta_10G.visible = false;
        Meta_11G.visible = false;
        Meta_12G.visible = false;

        extraY = 0.1;
        //limbs = 0;
        //Meta_idleG.visible = true;

    }

    Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }

        //Update character physics
        if(this.character_controls) {
            this.character_controls.Update(timeElapsedS);
        }
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
    //Click down/Drag starts
    dragStart(e) { 
        //the user cant do anything else but drag
        e.preventDefault(); 
        //update the mouse location relative to canvas area
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        //another started condition
        if(!started) {
            console.log("INPUT STARTED");
            started = true;
        }

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
                fullScreenEnable();
            } else {
                fullScreenToggle = false;
                fullScreenDisable();
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

    drawTitleText() { 
        //Draw Title text
        if(!info && text) {
            ctx.fillStyle = '#DDDDDD';
            ctx.textAlign = "center";
            ctx.font = height/22 + 'px retroPixel';
            // ctx.fillText("METABOUND", 0.5*width, 0.08*height);
            ctx.fillText("METABOY 3173", 0.5*width, (0.12 + (infoFade/10)) * height);
            ctx.font = height/12 + 'px retroPixel';
            // ctx.fillText("           _", 0.5*width, 0.068*height);
            // ctx.fillText("           _", 0.5*width, 0.065*height);
            ctx.font = height/42 + 'px retroPixel';
            ctx.fillText("test build 0.0.7b", 0.5*width, (0.16 + (infoFade/10)) * height);
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
    }

    drawInfo() {
        let pad_i = (width*0.090);
        //clamp padding amount to reasonable levels
        //pad_i = Math.min(Math.max(pad_i, 25), 70);
        // let xLoc_i = width-pad_i;
        // let yLoc_i = height-pad;
        let xLoc_i = pad_i;
        let yLoc_i = pad_i*-0.1;
        let xScale_i = height;
        //clamp button from going outside of the range 16 -> 54
        // xScale_i = Math.min(Math.max(xScale_i, 16), 54);

        if(info) {
            ctx.drawImage(imgInfoOn, xLoc_i, yLoc_i, xScale_i, xScale_i);
        } else {
            ctx.globalAlpha = infoFade; 
            ctx.drawImage(imgInfoOff, xLoc_i, yLoc_i, xScale_i, xScale_i);
            ctx.globalAlpha = 1.0; //reset global alpha
        }
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
            if(fullScreenOver) {
                ctx.globalAlpha = 1;
            } else {
                ctx.globalAlpha = 0.15;
            }
            ctx.drawImage(imgFullScreenClose, xLoc, yLoc, xScale, xScale);
        } else {
            if(fullScreenOver) {
                ctx.globalAlpha = 1;
            } else {
                ctx.globalAlpha = 0.15;
            }
            ctx.drawImage(imgFullScreenOpen, xLoc, yLoc, xScale, xScale);
        }
        ctx.globalAlpha = 1;
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


//Primary resize function for canvas
//Keeps all dimensions being used relative to nftBOX constraints and limits
function resizeToDiv() {
    //This is needed to preserve image during scaling
    //Resizing the canvas (ie canvas.width = xxx) clears the canvas
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas2.width = canvas2.width;
    tempCanvas2.height = canvas2.height;
    //Save the canvas on the temp/memory-only canvas
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx2.drawImage(canvas2, 0, 0);
    
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

    // canvas2.setSize(nftBOX.clientWidth, nftBOX.clientWidth);
    // renderer.domElement.setSize(nftBOX.clientWidth, nftBOX.clientWidth);
    
    var canvas2temp = document.getElementById('canvasThree');
    //console.log(canvas2temp);
    renderer.setSize( nftBOX.clientWidth, nftBOX.clientHeight );
    composer.setSize( nftBOX.clientWidth, nftBOX.clientHeight );


    //Reset variables
    width = nftBOX.clientWidth;
    height = nftBOX.clientHeight;
    aspectRatio = width/height;
    //console.log('*width: ' + width + ' height: ' + height);
    
    //three.js camera settings reset
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    
    camera2.aspect = aspectRatio;
    camera2.updateProjectionMatrix();

    // console.log("nftBOX size NOW: " + nftBOX.clientWidth + " , " + nftBOX.clientHeight);

    //Draw saved canvas back right away
    ctx.drawImage(tempCanvas, 0, 0);
    if(ctx2) {
        ctx2.drawImage(tempCanvas2, 0, 0);

    }
}

//Fullscreen functions
function fullScreenEnable() {
    //resize elements
    resizeToDiv();
}
function fullScreenDisable() {
    //reset constraints 
    nftBOX.style.maxWidth = maxCanvas + 'px';
    nftBOX.style.maxHeight = maxCanvas + 'px';
    nftBOX.style.minWidth = minCanvas + 'px';
    nftBOX.style.minHeight = minCanvas + 'px';
    //resize elements
    resizeToDiv();
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
            c: false,
            i: false,
            m: false,
            t: false,
        }
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }

    onKeyDown(event) {

        // console.log("key pressed: " + event.keyCode);
        //detect any key pressed - except 'i'
        if(!started) {
            if(event.keyCode != 73) {
                console.log("INPUT STARTED");
                started = true;
            }
        }

        switch (event.keyCode) {
            case 87: //w
                this.keys.forward = true;
                break;
            case 65: //a
                this.keys.left = true;
                break;
            case 37: //left
                this.keys.left = true;
                break;
            case 83: //s
                this.keys.backward = true;
                break;
            case 68: //d
                this.keys.right = true;
                break;
            case 39: //right
                this.keys.right = true;
                break;
            case 32: //space
                this.keys.space = true;
                break;
            case 67: //c
                this.keys.c = true;
                break;
            case 73: //i
                this.keys.i = true;
                break;
            case 77: //m
                this.keys.m = true;
                break;
            case 84: //t
                this.keys.t = true;
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
            case 37: //left
                this.keys.left = false;
                break;
            case 83: //s
                this.keys.backward = false;
                break;
            case 68: //d
                this.keys.right = false;
                break;
            case 39: //right
                this.keys.right = false;
                break;
            case 32: //space
                this.keys.space = false;
                break;
            case 67: //c
                this.keys.c = false;
                break;
            case 73: //i
                this.keys.i = false;
                break;
            case 77: //m
                this.keys.m = false;
                break;
            case 84: //t
                this.keys.t = false;
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
// window.addEventListener('DOMContentLoaded', async () => {
//     try {
//         APP = new LoadPrimaryApplication();
        
//     } catch (error) {
//         console.log("ASYNC ERROR THROWN: " + error);
//     }
// });
