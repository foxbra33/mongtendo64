import * as THREE from 'three';
import { PlayerController } from '../components/PlayerController.js';
import { WeaponSystem } from '../components/WeaponSystem.js';
import { Compass } from '../components/Compass.js';

export class Engine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isRunning = false;
        this.physicsWorld = null;
        this.playerController = null;
        this.weaponSystem = null;
        this.compass = null;
        this.clock = new THREE.Clock();
    }

    async initialize() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Add crosshair
        this.createCrosshair();

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createCrosshair() {
        // Create crosshair element
        const crosshair = document.createElement('div');
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.width = '20px';
        crosshair.style.height = '20px';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.pointerEvents = 'none';
        crosshair.style.zIndex = '1000';
        
        // Create crosshair lines
        const horizontalLine = document.createElement('div');
        horizontalLine.style.position = 'absolute';
        horizontalLine.style.width = '20px';
        horizontalLine.style.height = '2px';
        horizontalLine.style.backgroundColor = 'white';
        horizontalLine.style.top = '9px';
        horizontalLine.style.left = '0';
        
        const verticalLine = document.createElement('div');
        verticalLine.style.position = 'absolute';
        verticalLine.style.width = '2px';
        verticalLine.style.height = '20px';
        verticalLine.style.backgroundColor = 'white';
        verticalLine.style.left = '9px';
        verticalLine.style.top = '0';
        
        // Add lines to crosshair
        crosshair.appendChild(horizontalLine);
        crosshair.appendChild(verticalLine);
        
        // Add crosshair to document
        document.body.appendChild(crosshair);
    }

    setPhysicsWorld(physicsWorld) {
        this.physicsWorld = physicsWorld;
        this.physicsWorld.scene = this.scene;
        
        // Create player controller after physics world is set
        this.playerController = new PlayerController(
            this.camera,
            this.renderer.domElement,
            this.physicsWorld
        );

        // Create weapon system
        this.weaponSystem = new WeaponSystem(
            this.camera,
            this.physicsWorld
        );
        
        // Create compass
        this.compass = new Compass(
            this.camera,
            this.scene
        );

        // Add player wireframe to scene if it exists
        if (this.physicsWorld.playerWireframe) {
            this.scene.add(this.physicsWorld.playerWireframe);
        }
        
        // Add ground wireframe to scene if it exists
        if (this.physicsWorld.groundWireframe) {
            this.scene.add(this.physicsWorld.groundWireframe);
        }
    }

    addToScene(object) {
        this.scene.add(object);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time
        const deltaTime = this.clock.getDelta();
        
        // Update physics
        if (this.physicsWorld) {
            this.physicsWorld.update();
        }
        
        // Update player controller
        if (this.playerController) {
            this.playerController.update(deltaTime);
        }
        
        // Update weapon system
        if (this.weaponSystem) {
            this.weaponSystem.update(deltaTime);
        }
        
        // Update compass
        if (this.compass) {
            this.compass.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
} 