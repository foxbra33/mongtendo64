import * as THREE from 'three';

export class WeaponSystem {
    constructor(camera, physicsWorld) {
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        this.pistol = null;
        this.bullets = [];
        this.lastShotTime = 0;
        this.shootCooldown = 125; // Reduced from 250ms to 125ms (half the previous cooldown)
        this.bulletSpeed = 0.5; // Changed from 100 to 0.5 for more reasonable speed
        this.bulletLifetime = 10000; // 10 seconds
        this.smokeTrails = []; // Store smoke trail particles
        this.smokeSpawnRate = 50; // milliseconds between smoke particles
        
        // Create pistol model
        this.createPistol();
        
        // Setup event listeners
        this.setupEventListeners();

        // Setup gunshot sound
        this.gunshotSound = new Audio('/assets/sounds/GunshotPistol_BW.56967.wav');
        this.gunshotSound.volume = 0.5; // Adjust volume as needed
    }
    
    createPistol() {
        // Create a simple pistol model
        const pistolGroup = new THREE.Group();
        
        // Pistol body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        pistolGroup.add(body);
        
        // Pistol handle
        const handleGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.075;
        pistolGroup.add(handle);
        
        // Pistol barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.175;
        pistolGroup.add(barrel);
        
        // Position the pistol in front of the camera
        pistolGroup.position.set(0.3, -0.2, -0.5);
        
        this.pistol = pistolGroup;
        this.camera.add(this.pistol);
    }
    
    setupEventListeners() {
        // Listen for mouse clicks to shoot
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left mouse button
                this.shoot();
            }
        });
    }
    
    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.shootCooldown) {
            return; // Still on cooldown
        }
        
        this.lastShotTime = currentTime;
        
        // Play or restart gunshot sound
        this.gunshotSound.currentTime = 0; // Reset sound to start
        this.gunshotSound.play().catch(error => {
            console.log("Error playing sound:", error);
        });
        
        // Get camera direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.normalize();
        
        // Create bullet - cylinder shape instead of sphere
        const bulletGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.084, 16);
        const bulletMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, // Bright red color
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0xff0000, // Bright red emissive
            emissiveIntensity: 0.8
        });
        const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // Position bullet at the end of the pistol barrel
        const bulletPosition = new THREE.Vector3(0, 0, -0.5);
        bulletPosition.applyQuaternion(this.camera.quaternion);
        bulletPosition.add(this.camera.position);
        
        bulletMesh.position.copy(bulletPosition);
        
        // FIXED APPROACH: Use a more direct method to orient the bullet
        // First, create a quaternion that aligns the cylinder with the forward direction
        const bulletQuaternion = new THREE.Quaternion();
        
        // Create a rotation matrix that aligns the bullet with the camera direction
        const rotationMatrix = new THREE.Matrix4();
        const upVector = new THREE.Vector3(0, 1, 0);
        rotationMatrix.lookAt(new THREE.Vector3(0, 0, 0), direction, upVector);
        
        // Extract the quaternion from the rotation matrix
        bulletQuaternion.setFromRotationMatrix(rotationMatrix);
        
        // Apply an additional rotation to align the cylinder with the forward direction
        // This ensures the circular side of the cylinder faces the crosshair
        const cylinderRotation = new THREE.Quaternion();
        cylinderRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        bulletQuaternion.multiply(cylinderRotation);
        
        // Apply the rotation to the bullet
        bulletMesh.quaternion.copy(bulletQuaternion);
        
        // Add bullet to scene
        this.physicsWorld.scene.add(bulletMesh);
        
        // Create bullet physics body
        const bulletBody = this.physicsWorld.createBullet(bulletPosition);
        
        // Link the bullet mesh with its physics body
        const bulletId = bulletBody.userData.id;
        bulletMesh.userData = { bulletId: bulletId };
        
        // Store bullet data
        const bullet = {
            mesh: bulletMesh,
            body: bulletBody,
            createdAt: currentTime,
            lastSmokeTime: 0, // Track when we last spawned smoke for this bullet
            initialDirection: direction.clone() // Store the initial direction for reference
        };
        
        this.bullets.push(bullet);
        
        // Apply impulse to make bullets move
        const impulse = {
            x: direction.x * this.bulletSpeed * 2,
            y: direction.y * this.bulletSpeed * 2,
            z: direction.z * this.bulletSpeed * 2
        };
        
        // Apply the impulse to the bullet body
        bulletBody.applyImpulse(impulse, true);
        
        // Add muzzle flash effect
        this.createMuzzleFlash();
        
        // Log for debugging
        console.log("Bullet created with ID:", bulletId);
    }
    
    createMuzzleFlash() {
        // Create a simple muzzle flash
        const flashGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position flash at the end of the pistol barrel
        const flashPosition = new THREE.Vector3(0, 0, -0.5);
        flashPosition.applyQuaternion(this.camera.quaternion);
        flashPosition.add(this.camera.position);
        
        flash.position.copy(flashPosition);
        
        // Add flash to scene
        this.physicsWorld.scene.add(flash);
        
        // Remove flash after a short time
        setTimeout(() => {
            this.physicsWorld.scene.remove(flash);
        }, 50);
    }
    
    createSmokeParticle(position) {
        const smokeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.5
        });
        const smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smokeMesh.position.copy(position);
        
        // Add some random offset to make it look more natural
        smokeMesh.position.x += (Math.random() - 0.5) * 0.02;
        smokeMesh.position.y += (Math.random() - 0.5) * 0.02;
        smokeMesh.position.z += (Math.random() - 0.5) * 0.02;
        
        this.physicsWorld.scene.add(smokeMesh);
        
        return {
            mesh: smokeMesh,
            createdAt: Date.now(),
            lifetime: 1000, // Smoke particles last 1 second
            initialScale: 1.0
        };
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Update bullets and create smoke trails
        this.bullets.forEach(bullet => {
            // Update bullet mesh position from physics body
            const position = bullet.body.translation();
            bullet.mesh.position.set(position.x, position.y, position.z);
            
            // Update bullet orientation to match its velocity direction
            const velocity = bullet.body.linvel();
            if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
                // Create a direction vector from the velocity
                const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
                
                // FIXED APPROACH: Use the same method as in the shoot function
                // Create a rotation matrix that aligns the bullet with the velocity direction
                const rotationMatrix = new THREE.Matrix4();
                const upVector = new THREE.Vector3(0, 1, 0);
                rotationMatrix.lookAt(new THREE.Vector3(0, 0, 0), direction, upVector);
                
                // Extract the quaternion from the rotation matrix
                const bulletQuaternion = new THREE.Quaternion();
                bulletQuaternion.setFromRotationMatrix(rotationMatrix);
                
                // Apply an additional rotation to align the cylinder with the forward direction
                const cylinderRotation = new THREE.Quaternion();
                cylinderRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                bulletQuaternion.multiply(cylinderRotation);
                
                // Apply the rotation to the bullet
                bullet.mesh.quaternion.copy(bulletQuaternion);
            }
            
            // Check if it's time to spawn a new smoke particle
            if (!bullet.lastSmokeTime || currentTime - bullet.lastSmokeTime >= this.smokeSpawnRate) {
                const position = bullet.mesh.position.clone();
                this.smokeTrails.push(this.createSmokeParticle(position));
                bullet.lastSmokeTime = currentTime;
            }
        });
        
        // Remove bullets that have exceeded their lifetime
        this.bullets = this.bullets.filter(bullet => {
            if (currentTime - bullet.createdAt > this.bulletLifetime) {
                this.physicsWorld.scene.remove(bullet.mesh);
                this.physicsWorld.removeBody(bullet.body);
                return false;
            }
            return true;
        });
        
        // Update smoke trails
        this.smokeTrails = this.smokeTrails.filter(smoke => {
            const age = currentTime - smoke.createdAt;
            if (age > smoke.lifetime) {
                this.physicsWorld.scene.remove(smoke.mesh);
                return false;
            }
            
            // Update smoke appearance
            const lifeRatio = 1 - (age / smoke.lifetime);
            smoke.mesh.material.opacity = lifeRatio * 0.5;
            
            // Scale up the smoke over time
            const scale = smoke.initialScale + (1 - lifeRatio) * 2;
            smoke.mesh.scale.set(scale, scale, scale);
            
            return true;
        });
    }
} 