import Vector3 from "./vector3.js";
import { vectorDistance } from "./vector3.js";
import { addVectors } from "./vector3.js";
import SETTINGS from "./settings.js";

export default class object {
    constructor(x, y, z, name, radius, image, mass){
        this.position = new Vector3(0, 0, 0);
        this.velocity = new Vector3(0, 0, 0);
        this.position.x = x; this.position.y = y; this.position.z = z; this.name = name; this.radius = radius; this.image = image; this.mass = mass;
    }
    
    gravity(otherObjects, timeMultiplier) {
        const G = SETTINGS.GRAVITATIONAL_CONSTANT;
        const dt = (1 / SETTINGS.FPS) * timeMultiplier;
        const scale = SETTINGS.DISTANCE_SCALE;

        for (let other of otherObjects) {
            if (other === this) continue;

            const distSim = vectorDistance(this.position, other.position);
            const distMeters = distSim * scale;

            const softening = 1000000;
            const accelerationMeters = (G * other.mass) / (Math.pow(distMeters, 2) + softening);

            const accelerationSim = accelerationMeters / scale;

            if (distSim < 0.000001) continue;

            const direction = new Vector3(
                (other.position.x - this.position.x) / distSim,
                (other.position.y - this.position.y) / distSim,
                (other.position.z - this.position.z) / distSim
            );

            const accelerationVec = new Vector3(
                direction.x * accelerationSim * dt,
                direction.y * accelerationSim * dt,
                direction.z * accelerationSim * dt
            );

            this.velocity = addVectors(this.velocity, accelerationVec);
        }
    }

    frame(timeMultiplier = 1) {
        const dt = (1 / SETTINGS.FPS) * timeMultiplier;

        const movementVec = new Vector3(
            this.velocity.x * dt,
            this.velocity.y * dt,
            this.velocity.z * dt
        );

        this.position = addVectors(this.position, movementVec);
    }
}
