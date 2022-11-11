//Images/icons
//Load images for fullscreen toggle button
var imgFullScreenOpen = new Image();
var imgFullScreenClose = new Image();
imgFullScreenOpen.src = 'src/fullscreenOpen.png';
imgFullScreenClose.src = 'src/fullscreenClose.png';
var fullScreenToggle = false;
var fullScreenOver = false;
var pad, xLoc, yLoc, xScale;

function drawTitleText() {
    //Draw Title text
    ctx.fillStyle = '#303030';
    ctx.textAlign = "center";
    ctx.font = height/22 + 'px retroPixel';
    ctx.fillText("*METABOUND*", 0.5*width, 0.08*height);
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
function drawFullScreenButton() {
    pad = (width*0.125);
    //clamp padding amount to reasonable levels
    pad = Math.min(Math.max(pad, 25), 70);
    xLoc = width-pad;
    yLoc = height-pad;
    xScale = 0.10*(width*0.75);
    //clamp button from going outside of the range 16 -> 54
    xScale = Math.min(Math.max(xScale, 16), 54);

    //draw and check fullscreen button
    checkIfOverFullScreen();
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

function checkIfOverFullScreen() {
    ctx.beginPath();
    ctx.rect(xLoc, yLoc, xScale, xScale);
    ctx.fillStyle = 'rgba(100, 100, 240, 0.25)';
    //determine if mouse is over select area
    ctx.isPointInPath(mouse.x, mouse.y) ? fullScreenOver=true : fullScreenOver=false;
    ctx.fill();
}

function debugMousePos() {
    //debug mouse/touch pos - final draw call so it draws on top
    ctx.globalAlpha = 0.5; //reset global alpha
    ctx.beginPath();
    ctx.fillStyle = 'rgba(240, 140, 140, 1)';
    //console.log("mouse: " + mouse.x + ", " + mouse.y);
    ctx.arc(mouse.x, mouse.y, height*0.02, 0, 2*Math.PI);
    ctx.fill();
}