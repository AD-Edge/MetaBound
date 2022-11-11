//Setup main variables
var width = 0;
var height = 0;
var aspectRatio = 0;
var renderInterval;

//Min and Max values, set by looking at the CSS values for 'nftBOX' div
var minCanvas;
var maxCanvas;

//Make a memory only canvas for redraw 
var tempCanvas = document.createElement('canvas');
var tempCtx = tempCanvas.getContext('2d');

//Store mouse position
const mouse = { x: 0, y: 0 };

//Called whenever window resizes
window.onresize = function()
{
    if(fullScreenToggle) {
        fullScreenEnable();
    } else {
        resizeToDiv();
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

//Primary resize function for canvas
//Keeps all dimensions being used relative to nftBOX constraints and limits
function resizeToDiv() {
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

//Touch and Mouse Functions

//Click down/Drag starts
function dragStart(e) { 
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
            fullScreenEnable();
        } else {
            fullScreenToggle = false;
            fullScreenDisable();
        }
    }
}
//When the drag ends - ie touch or mouse ends
//All activation events while releasing on a hover, ie a 'PRESS' event 
function dragEnd() { 

}
//Handle the pointer moving
function pointerTouchMove(e) {
    //the user cant do anything else but drag
    e.preventDefault(); 
    //update the mouse location relative to canvas area
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
}
