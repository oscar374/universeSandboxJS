//setup
const BACKGROUND = "#121212";
const PARTICLE_SIZE = 4; 
const LINE_COLOR = "lime";
const LINE_LENGTH = 2000;
const FPS = 60;
const CAMERA_SPEED = 1;
//setup

// ############### VECTOR3 CLASS ###############

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
}

// ############### VECTOR3 CLASS ###############

let width = window.innerWidth;
let height = window.innerHeight;
const ctx = canvas.getContext('2d');

let linePositions = [
    {
        p1: new Vector3(-LINE_LENGTH, 0, 0),
        p2: new Vector3(LINE_LENGTH, 0, 0)
    },
    {
        p1: new Vector3(0, -LINE_LENGTH, 0),
        p2: new Vector3(0, LINE_LENGTH, 0)
    },
    {
        p1: new Vector3(0, 0, LINE_LENGTH),
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

// ############### PARTICLES ####################

particles = [];

class Particle{
    
}

// ############### PARTICLES ####################


//################ START AND UPDATE functions ################


function start(){
    setupKeys();
    resizeCanvas();
    clear();
}
start();

function update(){
    clear();
    displayLines();

    const radius = 40;
const latSteps = 50; 
const lonSteps = 24; 
const spherePoints = [];

for (let i = 0; i <= latSteps; i++) {
    const theta = (i / latSteps) * Math.PI;

    for (let j = 0; j <= lonSteps; j++) {
        const phi = (j / lonSteps) * 2 * Math.PI;
        
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);

        spherePoints.push(new Vector3(x, y, z));
    }
}

// Render the points
spherePoints.forEach((pt) => {
    point(toScreen(project(pt)), 'lime');
});

    movement();
}

//################ START AND UPDATE functions ################

let cameraPosition = new Vector3(0, 10, -40);

setInterval(() => {
    update();   
}, 1000 / FPS);

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

function drawLine({x: x1, y: y1}, {x: x2, y: y2}){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = LINE_COLOR;
    ctx.stroke();
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.height = height;
    canvas.width = width;
}

function clear(){
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);
}

function point({x, y}, color){
    ctx.beginPath();
    ctx.arc(x - PARTICLE_SIZE / 2, y - PARTICLE_SIZE / 2, PARTICLE_SIZE , 40, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.fill();
    ctx.stroke();
}

function toScreen(p) {
    const x = p?.x ?? 100000;
    const y = p?.y ?? 100000;
    return {
        x: (x + 1) / 2 * width,
        y: (1 - (y + 1) / 2) * height
    }
}

// Expects a Vector3 input
function project(p){
    const depth = p.z - cameraPosition.z;

    if (depth <= 0.1) {
        return null; 
    }

    const aspectRatio = width / height;

    return {
        x: (p.x - cameraPosition.x) / depth / aspectRatio, 
        y: (p.y - cameraPosition.y) / depth
    }
}

function movement(){
    if (isPressed("KeyD")) {
        cameraPosition.x += CAMERA_SPEED;
    }
    if (isPressed("KeyA")) {
        cameraPosition.x -= CAMERA_SPEED;
    }

    if (isPressed("KeyW")) {
        cameraPosition.z += CAMERA_SPEED;
    }
    if (isPressed("KeyS")) {
        cameraPosition.z -= CAMERA_SPEED;
    }
    if (isPressed("Space")) {
        cameraPosition.y += CAMERA_SPEED;
    }
    if (isPressed("ShiftLeft")) {
        cameraPosition.y -= CAMERA_SPEED;
    }
}