import * as THREE from 'three';
// Import Rapier using the correct method
import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsWorld {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.colliders = new Map();
        this.playerBody = null;
        this.playerCollider = null;
        this.playerWireframe = null;
        this.groundWireframe = null;
    }

    async initialize() {
        // Initialize Rapier
        await RAPIER.init();
        
        // Create physics world with gravity
        const gravity = { x: 0.0, y: -9.81, z: 0.0 };
        this.world = new RAPIER.World(gravity);
    }

    createPlayer(position = { x: 0, y: 2, z: 0 }) {
        // Create player rigid body with mass
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setLinearDamping(0.5) // Add some damping to make movement smoother
            .setAngularDamping(0.5);
            
        // Create the rigid body
        this.playerBody = this.world.createRigidBody(rigidBodyDesc);
        
        // Note: Mass is set to default value (1.0 kg) as setMass is not available
        // In Rapier 0.12.0, mass is determined by the collider's density and volume
        // We'll adjust the collider properties instead

        // Lock rotations to prevent tipping over
        this.playerBody.lockRotations(true);

        // Create player collider (capsule shape for better character movement)
        const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5) // radius, half-height
            .setTranslation(0.0, 0.5, 0.0) // Offset to align with player's feet
            .setFriction(0.1) // Low friction to prevent sticking
            .setRestitution(0.0) // No bounce
            .setDensity(1.0); // Set density to 1.0 kg/m³ for a more reasonable mass
        this.playerCollider = this.world.createCollider(colliderDesc, this.playerBody);

        // Create wireframe visualization of the collision capsule
        const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const wireframeMesh = new THREE.Mesh(capsuleGeometry, wireframeMaterial);
        wireframeMesh.position.y = 0.5; // Match the collider's offset
        this.playerWireframe = wireframeMesh;

        // Store references
        this.bodies.set('player', this.playerBody);
        this.colliders.set('player', this.playerCollider);

        return this.playerBody;
    }

    getPlayerBody() {
        return this.playerBody;
    }

    createGround() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000); // Increased from 100x100 to 1000x1000
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,  // Grey color
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;

        // Create ground collider
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(500.0, 0.1, 500.0) // Increased from 10.0 to 500.0 to match visual size
            .setTranslation(0.0, -2.1, 0.0) // Adjusted Y position to match ground mesh
            .setFriction(0.5);
        const groundCollider = this.world.createCollider(groundColliderDesc);

        // Create wireframe visualization for ground collider
        const groundWireframeGeometry = new THREE.BoxGeometry(1000, 0.2, 1000); // Increased to match visual size
        const groundWireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const groundWireframe = new THREE.Mesh(groundWireframeGeometry, groundWireframeMaterial);
        groundWireframe.position.y = -2.1; // Adjusted to match ground position

        // Store references
        this.colliders.set(ground.uuid, groundCollider);

        return ground;
    }

    createDynamicCube(position = { x: 0, y: 0, z: 0 }) {
        // Create cube mesh
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.3
        });
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cubeMesh.position.set(position.x, position.y, position.z);
        cubeMesh.castShadow = true;
        cubeMesh.receiveShadow = true;

        // Create rigid body
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z);
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // Create collider
        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        const collider = this.world.createCollider(colliderDesc, rigidBody);

        // Create wireframe visualization for cube collider
        const cubeWireframeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeWireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const cubeWireframe = new THREE.Mesh(cubeWireframeGeometry, cubeWireframeMaterial);
        cubeWireframe.position.copy(cubeMesh.position);
        cubeMesh.userData.wireframe = cubeWireframe;

        // Store references
        this.bodies.set(cubeMesh.uuid, rigidBody);
        this.colliders.set(cubeMesh.uuid, collider);

        return cubeMesh;
    }

    createBullet(position = { x: 0, y: 0, z: 0 }) {
        // Create rigid body for bullet
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setLinearDamping(0.5); // Increased damping to slow bullets down
            
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        
        // Create collider for bullet - cylinder shape
        const colliderDesc = RAPIER.ColliderDesc.capsule(0.05, 0.15) // radius, half-height
            .setFriction(0.1)
            .setRestitution(0.5) // Some bounce
            .setDensity(1.0);
            
        const collider = this.world.createCollider(colliderDesc, rigidBody);
        
        // Store references with a unique ID
        const bulletId = 'bullet_' + Date.now();
        this.bodies.set(bulletId, rigidBody);
        this.colliders.set(bulletId, collider);
        
        // Store the ID in the rigid body for later reference
        rigidBody.userData = { id: bulletId };
        
        return rigidBody;
    }
    
    removeBody(body) {
        if (body && body.userData && body.userData.id) {
            const id = body.userData.id;
            
            // Remove collider if it exists
            if (this.colliders.has(id)) {
                const collider = this.colliders.get(id);
                this.world.removeCollider(collider, true);
                this.colliders.delete(id);
            }
            
            // Remove rigid body
            this.world.removeRigidBody(body);
            this.bodies.delete(id);
        }
    }

    update() {
        if (!this.world) return;

        // Step the physics world
        this.world.step();

        // Update mesh positions based on physics bodies
        this.bodies.forEach((body, uuid) => {
            if (uuid === 'player') {
                // Update player wireframe position
                if (this.playerWireframe && this.playerBody) {
                    const position = this.playerBody.translation();
                    this.playerWireframe.position.set(position.x, position.y, position.z);
                }
                return; // Skip player body as it's handled by PlayerController
            }
            
            // Check if this is a bullet (has userData.id that starts with 'bullet_')
            if (body.userData && body.userData.id && body.userData.id.startsWith('bullet_')) {
                // Find the bullet mesh in the scene
                const bulletId = body.userData.id;
                const bulletMesh = this.scene.children.find(child => 
                    child.userData && child.userData.bulletId === bulletId
                );
                
                if (bulletMesh) {
                    // Update bullet mesh position based on physics body
                    const position = body.translation();
                    bulletMesh.position.set(position.x, position.y, position.z);
                    
                    // Log for debugging
                    console.log("PhysicsWorld updating bullet:", bulletId, position.x, position.y, position.z);
                }
                return;
            }
            
            const mesh = this.scene.getObjectByProperty('uuid', uuid);
            if (mesh) {
                const position = body.translation();
                const rotation = body.rotation();
                
                mesh.position.set(position.x, position.y, position.z);
                mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                
                // Update wireframe position if it exists
                if (mesh.userData.wireframe) {
                    mesh.userData.wireframe.position.copy(mesh.position);
                    mesh.userData.wireframe.quaternion.copy(mesh.quaternion);
                }
            }
        });
    }
} 