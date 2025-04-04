import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class PlayerController {
    constructor(camera, domElement, physicsWorld) {
        this.camera = camera;
        this.domElement = domElement;
        this.physicsWorld = physicsWorld;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        
        // Movement parameters
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 10.0;
        this.jumpForce = 10.0;
        
        // Setup pointer lock controls
        this.controls = new PointerLockControls(camera, domElement);
        
        // Player height
        this.playerHeight = 1.8;
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Pointer lock controls
        this.domElement.addEventListener('click', () => {
            this.controls.lock();
        });
        
        // Movement controls
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.jump();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    jump() {
        if (this.canJump) {
            // Apply jump force to the player's rigid body
            const playerBody = this.physicsWorld.getPlayerBody();
            if (playerBody) {
                const jumpImpulse = { x: 0.0, y: this.jumpForce, z: 0.0 };
                playerBody.applyImpulse(jumpImpulse, true);
            }
            this.canJump = false;
            
            // Reset jump after a short delay
            setTimeout(() => {
                this.canJump = true;
            }, 1000);
        }
    }
    
    update(deltaTime) {
        if (this.controls.isLocked) {
            // Get movement direction from camera
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();
            
            // Apply movement to the player's rigid body
            const playerBody = this.physicsWorld.getPlayerBody();
            if (playerBody) {
                // Get camera direction vectors
                const cameraDirection = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDirection);
                
                // Calculate forward and right vectors
                const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
                const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
                
                // Calculate movement direction based on camera orientation
                const moveDirection = new THREE.Vector3();
                
                // Forward/backward movement
                if (this.moveForward) moveDirection.add(forward);
                if (this.moveBackward) moveDirection.sub(forward);
                
                // Left/right movement
                if (this.moveRight) moveDirection.add(right);
                if (this.moveLeft) moveDirection.sub(right);
                
                // Normalize and apply speed
                if (moveDirection.length() > 0) {
                    moveDirection.normalize();
                    moveDirection.multiplyScalar(this.moveSpeed * deltaTime);
                    
                    // Apply movement impulse
                    const moveImpulse = { 
                        x: moveDirection.x, 
                        y: 0.0, 
                        z: moveDirection.z 
                    };
                    playerBody.applyImpulse(moveImpulse, true);
                }
                
                // Update camera position to follow player
                const position = playerBody.translation();
                this.camera.position.set(position.x, position.y + this.playerHeight, position.z);
            }
        }
    }
    
    lock() {
        this.controls.lock();
    }
    
    unlock() {
        this.controls.unlock();
    }
} 