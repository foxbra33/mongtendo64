import { Engine } from './core/Engine.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';

async function main() {
    // Initialize the engine
    const engine = new Engine();
    await engine.initialize();

    // Create and initialize physics world
    const physicsWorld = new PhysicsWorld();
    await physicsWorld.initialize();

    // Connect physics world to engine
    engine.setPhysicsWorld(physicsWorld);

    // Add a ground plane
    const ground = physicsWorld.createGround();
    engine.addToScene(ground);

    // Create player character
    const player = physicsWorld.createPlayer({ x: 0, y: 2, z: 0 });
    
    // Add some obstacles
    for (let i = 0; i < 5; i++) {
        const cube = physicsWorld.createDynamicCube({ 
            x: Math.random() * 10 - 5, 
            y: 5, 
            z: Math.random() * 10 - 5 
        });
        engine.addToScene(cube);
    }

    // Start the game loop
    engine.start();
}

main().catch(console.error); 