//const { ThreadMember } = require("discord.js");

const app = () => {
    //app startup and configure
    console.log("Game Start: MetaBound");
    console.log("Using the LRC-NFT-Dyanmic Frame Template"); 
    console.log("https://github.com/AD-Edge/LRC-NFT-DynamicFrame");
    console.log("https://twitter.com/Alex_ADEdge");

    //Setup Canvas and Elements
    html = document.documentElement;
    body = document.body;
    canvas = document.getElementById('canvasMain');
    ctx = canvas.getContext("2d");
    nftBOX = document.getElementById('nftBOX');
    style = window.getComputedStyle(nftBOX);
    //Get Delta/link example element
    deltaContainer = document.getElementById("container");
    
    //threejs
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setSize(window.innerWidth/2, window.innerHeight/2); //half res test
    //add render element (canvas)
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = "canvasThree";

    //Retrieve and save values needed
    minCanvas = parseInt(style.getPropertyValue('min-height'));
    maxCanvas = parseInt(style.getPropertyValue('max-height'));
    //console.log("Minimum Canvas: " + minCanvas);
    //console.log("Maximum Canvas: " + maxCanvas);

    //touch and mouse events
    canvas.addEventListener("pointerdown", dragStart, false);
    canvas.addEventListener("pointerup", dragEnd, false);
    canvas.addEventListener('pointermove', pointerTouchMove, false);

    //Call resize functions on setup so canvas is happy from the start
    resizeToDiv();

    //Preload custom font and kick off main processes
    var f = new FontFace('retroPixel', 'url(./src/EarlyGameBoy.ttf)');
    f.load().then(function(font) {
        //Ready to use the font in a canvas context
        //console.log('*Custom Font Loaded Successfully*');
        //Add font on the html page
        document.fonts.add(font);

        //Kick off main panel setup
        initAndStartGame();
    });
};

//setup init three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial( {color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);

scene.add( cube );
camera.position.z = 5;

//state stuff
var init = true;

const STATE_ENUM = {
    MENU: "menu",
    START: "start",
    COMPLETE: "complete",
    DEATH: "death",
};

var state = STATE_ENUM.MENU;

//Three.js animate canvas/renderer
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate(); 

//primary render loop
function renderLoop() {    
    //Refresh canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    
    //update game state
    if(init) {
        init = false;
        gameState(state);
    }

    //Game states
    if(state == STATE_ENUM.MENU) {
        //console.log("menu state");
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }

    //Draw title text
    drawTitleText();
    //Draw the button which toggles fullscreen mode
    drawFullScreenButton();
    debugMousePos();
}

function gameState(s) {
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

//Start overall processeses
function initAndStartGame() {
    //clear render interval if running
    clearInterval(renderInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //set off render process
    renderInterval = setInterval(renderLoop, 20);
}

//Kick off app function when initial HTML document loaded
document.addEventListener("DOMContentLoaded", app);