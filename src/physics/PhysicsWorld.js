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
    }

    async initialize() {
        // Initialize Rapier
        await RAPIER.init();
        
        // Create physics world with gravity
        const gravity = { x: 0.0, y: -9.81, z: 0.0 };
        this.world = new RAPIER.World(gravity);
    }

    createPlayer(position = { x: 0, y: 2, z: 0 }) {
        // Create player rigid body
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setLinearDamping(0.5) // Add some damping to make movement smoother
            .setAngularDamping(0.5);
        this.playerBody = this.world.createRigidBody(rigidBodyDesc);

        // Create player collider (capsule shape for better character movement)
        const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5) // radius, half-height
            .setTranslation(0.0, 0.5, 0.0); // Offset to align with player's feet
        this.playerCollider = this.world.createCollider(colliderDesc, this.playerBody);

        // Store references
        this.bodies.set('player', this.playerBody);
        this.colliders.set('player', this.playerCollider);

        return this.playerBody;
    }

    getPlayerBody() {
        return this.playerBody;
    }

    createGround() {
        // Create ground mesh
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;

        // Create ground collider
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
            .setTranslation(0.0, -0.1, 0.0);
        const groundCollider = this.world.createCollider(groundColliderDesc);

        // Store references
        this.colliders.set(groundMesh.uuid, groundCollider);

        return groundMesh;
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

        // Store references
        this.bodies.set(cubeMesh.uuid, rigidBody);
        this.colliders.set(cubeMesh.uuid, collider);

        return cubeMesh;
    }

    update() {
        if (!this.world) return;

        // Step the physics world
        this.world.step();

        // Update mesh positions based on physics bodies
        this.bodies.forEach((body, uuid) => {
            if (uuid === 'player') return; // Skip player body as it's handled by PlayerController
            
            const mesh = this.scene.getObjectByProperty('uuid', uuid);
            if (mesh) {
                const position = body.translation();
                const rotation = body.rotation();
                
                mesh.position.set(position.x, position.y, position.z);
                mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            }
        });
    }
} 