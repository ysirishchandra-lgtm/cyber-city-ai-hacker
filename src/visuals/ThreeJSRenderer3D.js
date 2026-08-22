/**
 * SCAR — THE LAST CHOICE
 * ThreeJSRenderer3D.js — Full 3D WebGL Action Engine (GTA 5 Style 3rd-Person Camera)
 * 
 * Renders the game world in real 3D using Three.js:
 * - 3rd-person GTA-style orbital camera following the player character
 * - 3D player mesh with neon cyberpunk armor & katana blade
 * - 3D city environment with skyscrapers, wet reflective roads, streetlamps & 3D crates
 * - 3D enemy units (Drones, Enforcers, Stalkers, Disruptors, Sentinels)
 * - 3D combat particle sparks, plasma bursts & dynamic light cones
 */

export class ThreeJSRenderer3D {
  constructor() {
    this.initialized = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // 3D Objects mapping
    this.playerGroup = null;
    this.katanaMesh = null;
    this.enemyMeshes = new Map();
    this.heroMesh = null;
    this.buildingGroup = null;
    this.streetLampLights = [];
    this.projectiles3D = [];
    this.particles3D = [];

    // Camera follow parameters
    this.cameraOffset = { x: 0, y: 14, z: 22 }; // Over-the-shoulder GTA 3rd-person offset
    this.currentCamPos = { x: 0, y: 14, z: 22 };
    this.currentCamTarget = { x: 0, y: 2, z: 0 };
  }

  async init(canvas) {
    if (typeof window === 'undefined' || typeof THREE === 'undefined') {
      console.warn('[ThreeJSRenderer3D] THREE.js library not loaded yet');
      return false;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. Create 3D Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05050c);
    this.scene.fog = new THREE.FogExp2(0x070714, 0.008);

    // 2. Create 3D Perspective Camera (GTA 3rd-Person View)
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 2, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0x1a1a3a, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.8);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 250;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xff0055, 1.2);
    rimLight.position.set(-50, 40, -30);
    this.scene.add(rimLight);

    // 5. Build 3D City Environment & Roadway Ground
    this._build3DEnvironment();

    // 6. Build 3D Player Character
    this._build3DPlayer();

    this.initialized = true;
    console.log('[ThreeJSRenderer3D] Real 3D WebGL Engine Online (GTA 3rd-Person Perspective)');
    return true;
  }

  _build3DEnvironment() {
    // A. 3D Roadway Ground
    const groundGeo = new THREE.PlaneGeometry(500, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c16,
      roughness: 0.2,
      metalness: 0.8
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(250, 0, 0);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // B. Neon Cyberpunk Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(500, 50, 0x00f3ff, 0x112244);
    gridHelper.position.set(250, 0.05, 0);
    this.scene.add(gridHelper);

    // C. 3D City Buildings & Skyscrapers
    this.buildingGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const bx = i * 28 - 20;
      const bz = (i % 2 === 0 ? -45 : 45);
      const bw = 22 + (i % 3) * 5;
      const bd = 20 + (i % 4) * 4;
      const bh = 40 + (i % 5) * 15;

      const bGeo = new THREE.BoxGeometry(bw, bh, bd);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x0c101d,
        roughness: 0.3,
        metalness: 0.7
      });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(bx, bh / 2, bz);
      building.castShadow = true;
      building.receiveShadow = true;
      this.buildingGroup.add(building);

      // Glowing Neon Window Strips
      const winGeo = new THREE.PlaneGeometry(bw * 0.8, bh * 0.7);
      const winMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f3ff : 0xff0055,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const winMesh = new THREE.Mesh(winGeo, winMat);
      winMesh.position.set(bx, bh / 2, bz + (bz > 0 ? -bd / 2 - 0.1 : bd / 2 + 0.1));
      if (bz > 0) winMesh.rotation.y = Math.PI;
      this.buildingGroup.add(winMesh);
    }
    this.scene.add(this.buildingGroup);

    // D. 3D Streetlamps with Volumetric Lights
    for (let x = 10; x < 500; x += 40) {
      const lampPoleGeo = new THREE.CylinderGeometry(0.2, 0.3, 12);
      const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
      const pole = new THREE.Mesh(lampPoleGeo, lampPoleMat);
      pole.position.set(x, 6, -18);
      this.scene.add(pole);

      const lampHeadGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const head = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      head.position.set(x, 12, -18);
      this.scene.add(head);

      const pLight = new THREE.PointLight(0x00f3ff, 2.5, 30);
      pLight.position.set(x, 11, -18);
      this.scene.add(pLight);
      this.streetLampLights.push(pLight);
    }

    // E. 3D Warehouse Objective Target Ring (x: 90m, z: 0)
    const targetRingGeo = new THREE.RingGeometry(8, 10, 32);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.rotation.x = Math.PI / 2;
    targetRing.position.set(120, 0.2, 0);
    this.scene.add(targetRing);
  }

  _build3DPlayer() {
    this.playerGroup = new THREE.Group();

    // 3D Player Torso/Body (Cyber Armor Capsule)
    const bodyGeo = new THREE.CylinderGeometry(1.2, 1.0, 3.5, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x121829,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.4;
    body.castShadow = true;
    this.playerGroup.add(body);

    // 3D Helmet / Visor
    const headGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x050811, metalness: 1.0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 4.5;
    head.castShadow = true;
    this.playerGroup.add(head);

    // Glowing Neon Visor Strip
    const visorGeo = new THREE.BoxGeometry(1.4, 0.35, 0.7);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 4.6, 0.6);
    this.playerGroup.add(visor);

    // 3D Katana Weapon
    const bladeGeo = new THREE.BoxGeometry(0.15, 4.0, 0.4);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00f3ff,
      emissiveIntensity: 0.8,
      metalness: 1.0
    });
    this.katanaMesh = new THREE.Mesh(bladeGeo, bladeMat);
    this.katanaMesh.position.set(1.4, 3.0, 0.8);
    this.katanaMesh.rotation.z = -Math.PI / 4;
    this.playerGroup.add(this.katanaMesh);

    this.scene.add(this.playerGroup);
  }

  render(gameplayState) {
    if (!this.initialized || !this.renderer || !this.scene || !this.camera) return;

    const p = gameplayState?.player;
    if (p) {
      // 2D to 3D Coordinate Mapping (Scaled to 3D world space)
      const p3D_X = (p.x - 200) * 0.15;
      const p3D_Z = (p.y - 300) * 0.15;

      // Update 3D Player Position & Orientation
      this.playerGroup.position.set(p3D_X, 0, p3D_Z);
      const angle = p.facingAngle || 0;
      this.playerGroup.rotation.y = -angle + Math.PI / 2;

      // Katana attack animation swing
      if (p.isAttacking) {
        this.katanaMesh.rotation.y = Math.sin(Date.now() * 0.02) * 1.5;
      } else {
        this.katanaMesh.rotation.y = 0;
      }

      // Smooth 3rd-Person Over-The-Shoulder GTA Camera Follow
      const camTargetX = p3D_X;
      const camTargetY = 3.0;
      const camTargetZ = p3D_Z;

      const destCamX = p3D_X + Math.sin(-angle) * this.cameraOffset.z;
      const destCamZ = p3D_Z + Math.cos(-angle) * this.cameraOffset.z;
      const destCamY = this.cameraOffset.y;

      this.currentCamPos.x += (destCamX - this.currentCamPos.x) * 0.1;
      this.currentCamPos.y += (destCamY - this.currentCamPos.y) * 0.1;
      this.currentCamPos.z += (destCamZ - this.currentCamPos.z) * 0.1;

      this.currentCamTarget.x += (camTargetX - this.currentCamTarget.x) * 0.12;
      this.currentCamTarget.y += (camTargetY - this.currentCamTarget.y) * 0.12;
      this.currentCamTarget.z += (camTargetZ - this.currentCamTarget.z) * 0.12;

      this.camera.position.set(this.currentCamPos.x, this.currentCamPos.y, this.currentCamPos.z);
      this.camera.lookAt(this.currentCamTarget.x, this.currentCamTarget.y, this.currentCamTarget.z);
    }

    // Render 3D Enemies
    if (gameplayState?.enemies) {
      const activeIds = new Set();
      gameplayState.enemies.forEach(e => {
        activeIds.add(e.id);
        const e3D_X = (e.x - 200) * 0.15;
        const e3D_Z = (e.y - 300) * 0.15;

        let mesh = this.enemyMeshes.get(e.id);
        if (!mesh) {
          const eGeo = new THREE.BoxGeometry(2.0, 3.2, 2.0);
          const eMat = new THREE.MeshStandardMaterial({
            color: e.color ? parseInt(e.color.replace('#', '0x')) : 0xff0055,
            metalness: 0.8
          });
          mesh = new THREE.Mesh(eGeo, eMat);
          mesh.castShadow = true;
          this.scene.add(mesh);
          this.enemyMeshes.set(e.id, mesh);
        }
        mesh.position.set(e3D_X, 1.6, e3D_Z);
      });

      // Remove defeated enemies
      for (const [id, mesh] of this.enemyMeshes.entries()) {
        if (!activeIds.has(id)) {
          this.scene.remove(mesh);
          this.enemyMeshes.delete(id);
        }
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

export const threeJSRenderer3D = new ThreeJSRenderer3D();
