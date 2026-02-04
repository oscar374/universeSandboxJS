import SETTINGS from "./settings.js";
import Vector3, { vectorDistance } from "./vector3.js";
import object from "./object.js";

let width = window.innerWidth;
let height = window.innerHeight;
const ctx = canvas.getContext('2d');

//############## HTML ELEMENTS #################
let leftUI = document.getElementById("leftUI");
let rightUI = document.getElementById("rightUI");
let cameraPosText = document.getElementById("cameraPos");
let objectPresetContainer = document.getElementById("objectPresetContainer");
//############## HTML ELEMENTS #################

const imageCache = {};

// ############# Image loading ###############
function getPreloadedImage(url) {
    if (!imageCache[url]) {
        const img = new Image();
        img.src = url;
        imageCache[url] = { img, loaded: false };
        img.onload = () => {
            imageCache[url].loaded = true;
        };
    }
    return imageCache[url];
}
// ############# Image loading ###############

let linePositions = [
    {
        p1: new Vector3(-SETTINGS.LINE_LENGTH, 0, 0),
        p2: new Vector3(SETTINGS.LINE_LENGTH, 0, 0)
    },
    {
        p1: new Vector3(0, -SETTINGS.LINE_LENGTH, 0),
        p2: new Vector3(0, SETTINGS.LINE_LENGTH, 0)
    },
    {
        p1: new Vector3(0, 0, SETTINGS.LINE_LENGTH),
        p2: new Vector3(0, 0, 0)
    }
]

// ############### INPUT HANDLING ###############

const keysPressed = {};

function setupKeys() {
    document.addEventListener('keydown', function(event) {
        keysPressed[event.code] = true;
    });

    document.addEventListener('keyup', function(event) {
        keysPressed[event.code] = false;
    });
}

function isPressed(code) {
    return !!keysPressed[code];
}

// ############### INPUT HANDLING ###############

//################ START AND UPDATE functions ################

let sceneObjects = [];

function start(){
    setupKeys();
    resizeCanvas();
    clear();
    fetchPresets();
}
start();

function update(){
    resizeCanvas();
    clear();
    updateCameraPosText();
    renderSceneObjects();
    if (debugLines) displayLines();
    movement();
}

setInterval(() => {
    update();   
}, 1000 / SETTINGS.FPS);

//################ START AND UPDATE functions ################

let cameraPosition = new Vector3(0, 10, -70);

function displayLines(){
    linePositions.forEach(element => {
        const p1Projected = project(element.p1);
        const p2Projected = project(element.p2);

        if (p1Projected && p2Projected) {
            drawLine(
                toScreen(p1Projected),
                toScreen(p2Projected)
            );
        }
    });
}

//################ DRAWING AND RENDERING FUNCTIONS ################

function renderSceneObjects(){

    const sortedObjects = [...sceneObjects].sort((a, b) => {
        const distA = vectorDistance(cameraPosition, new Vector3(a.position.x, a.position.y, a.position.z));
        const distB = vectorDistance(cameraPosition, new Vector3(b.position.x, b.position.y, b.position.z));     
        return distB - distA; 
    });
    
    sortedObjects.forEach(e => {
        renderObject(e);
    });
}

function renderObject(obj){
    const projected = project(obj.position);
    
    if (projected) {
        const visualRadius = obj.radius / SETTINGS.DISTANCE_SCALE; 
        point(toScreen(projected), visualRadius, obj.image);
    }

    let tm = 1; 
    obj.frame(tm);
    obj.gravity(sceneObjects, tm);
}

function drawLine({x: x1, y: y1}, {x: x2, y: y2}){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = SETTINGS.LINE_COLOR;
    ctx.stroke();
}

function point({x, y, depth}, radius, imageURL) {
    const referenceDistance = 50;
    const scale = referenceDistance / depth;
    const apparentRadius = radius * scale;

    if (apparentRadius < 0.1) return;

    const cached = getPreloadedImage(imageURL);
        if (cached.loaded) {
        const size = apparentRadius * 2;
        ctx.drawImage(
            cached.img, 
            x - apparentRadius, 
            y - apparentRadius,  
            size,              
            size             
        );
    }
}

//################ DRAWING AND RENDERING FUNCTIONS ################

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.height = height;
    canvas.width = width;
}

function clear(){
    ctx.fillStyle = SETTINGS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);
}

function toScreen(p) {
    const x = p?.x ?? 100000;
    const y = p?.y ?? 100000;
    const depth = p?.depth ?? 100000;
    return {
        x: (x + 1) / 2 * width,
        y: (1 - (y + 1) / 2) * height,
        depth:  depth
    }
}

function project(p){
    const depth = p.z - cameraPosition.z;

    if (depth <= 0.1) {
        return null; 
    }

    const aspectRatio = width / height;

    return {
        x: (p.x - cameraPosition.x) / depth / aspectRatio, 
        y: (p.y - cameraPosition.y) / depth,
        depth: depth
    }
}

function movement(){
    if (isPressed("KeyD")) {
        cameraPosition.x += SETTINGS.CAMERA_SPEED;
    }
    if (isPressed("KeyA")) {
        cameraPosition.x -= SETTINGS.CAMERA_SPEED;
    }

    if (isPressed("KeyW")) {
        cameraPosition.z += SETTINGS.CAMERA_SPEED;
    }
    if (isPressed("KeyS")) {
        cameraPosition.z -= SETTINGS.CAMERA_SPEED;
    }
    if (isPressed("Space")) {
        cameraPosition.y += SETTINGS.CAMERA_SPEED;
    }
    if (isPressed("ShiftLeft")) {
        cameraPosition.y -= SETTINGS.CAMERA_SPEED;
    }
}

//####################### FUNCTIONAL KEYS HANDLES AND UI ##########################

let UIopen = false;
let debugLines = false;

document.addEventListener('keydown', function(event) {
    if(event.keyCode == "81"){  // Q
        if(!UIopen){
            leftUI.style.left = "0px";
            rightUI.style.right = "0px";
            UIopen = true;
        } else {
            leftUI.style.left = "-20vw";
            rightUI.style.right = "-20vw";
            UIopen = false;
        }     
    }else if (event.keyCode == "76"){  // L
        if(!debugLines) debugLines = true;
        else debugLines = false;
    }
});

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}


let availablePresets = [];

function fetchPresets(){
    readTextFile("assets/json/presets.json", function(text){
        var data = JSON.parse(text);
        availablePresets = data.presets || [];
        displayPresets(data);
    });
}

function displayPresets(data){
    objectPresetContainer.innerHTML = "";
    data.presets.forEach(element => {
        const button = document.createElement('div');
        button.className = 'presetButton';
        button.style.backgroundImage = "url(" + element.image + ")";
        button.addEventListener('click', () => {
            addObjectFromPreset(element.name);
        });
        objectPresetContainer.appendChild(button);
    });
}

function addObjectFromPreset(presetName){
    const preset = availablePresets.find(p => p.name === presetName);
    if (preset) {
        let objtoAdd = new object(cameraPosition.x, cameraPosition.y, cameraPosition.z + 30, preset.name, preset.radius, preset.image, preset.mass)
        sceneObjects.push(objtoAdd);
    }
}

function updateCameraPosText(){
    cameraPosText.innerHTML = "Position: X:" + cameraPosition.x + " Y:" + cameraPosition.y + " Z:" + cameraPosition.z;
}