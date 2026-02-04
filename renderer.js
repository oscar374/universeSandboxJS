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
let spawnDistanceInput = document.getElementById("spawnDistanceInput");
let timeMultiplierInput = document.getElementById("timeMultiplierInput");
let cameraSpeedMultiplierInput = document.getElementById("cameraSpeedMultiplierInput"); 
let objectContainer = document.getElementById("objectContainer");
//############## HTML ELEMENTS #################

const imageCache = {};
let spawnDistance = 10;
let timeMultiplier = 1;
let cameraSpeedMultiplier = 1;

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
    displayObjects();
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
    let visualRadius = null;

    if (projected) {
        visualRadius = obj.radius / SETTINGS.DISTANCE_SCALE; 
        point(toScreen(projected), visualRadius, obj.image);
    }

    obj.frame(timeMultiplier);
    obj.gravity(sceneObjects, timeMultiplier);

    if(obj.flare != ""){
        renderObjectFlare(obj, projected, visualRadius);
    }
}

function renderObjectFlare(obj, projected, visualRadius){
    point(toScreen(projected), visualRadius * 100, obj.flare);
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
        cameraPosition.x += SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
    }
    if (isPressed("KeyA")) {
        cameraPosition.x -= SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
    }

    if (isPressed("KeyW")) {
        cameraPosition.z += SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
    }
    if (isPressed("KeyS")) {
        cameraPosition.z -= SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
    }
    if (isPressed("Space")) {
        cameraPosition.y += SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
    }
    if (isPressed("ShiftLeft")) {
        cameraPosition.y -= SETTINGS.CAMERA_SPEED * cameraSpeedMultiplier;
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
        let objtoAdd = new object(cameraPosition.x, cameraPosition.y, cameraPosition.z + spawnDistance, preset.name, preset.radius, preset.image, preset.mass, preset.flare)
        sceneObjects.push(objtoAdd);
    }
}

function updateCameraPosText(){
    cameraPosText.innerHTML = "Position: X:" + cameraPosition.x + " Y:" + cameraPosition.y + " Z:" + cameraPosition.z;
}

function displayObjects(){
    objectContainer.innerHTML = "";
    sceneObjects.forEach(element => {
        objectContainer.innerHTML += `<div class='spawnedObject'> ${element.name} | <button>Follow</button> </div>`;
    });
}

//################ INPUT EVENT LISTENERS ##############

spawnDistanceInput.addEventListener('input', function(event) {
    spawnDistance = parseFloat(event.target.value);
});

timeMultiplierInput.addEventListener('input', function(event) {
    let value = event.target.value;
    let timeMultiplierValue = parseFloat(value);
    if (!value || isNaN(timeMultiplierValue) || timeMultiplierValue === 0) {
        timeMultiplier = 1;
    } else {
        timeMultiplier = timeMultiplierValue;
    }
});

cameraSpeedMultiplierInput.addEventListener('input', function(event) {
    cameraSpeedMultiplier = parseFloat(event.target.value);
});

//################ INPUT EVENT LISTENERS ##############

