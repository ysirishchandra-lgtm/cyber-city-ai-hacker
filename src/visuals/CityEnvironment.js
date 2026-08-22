/**
 * SCAR — THE LAST CHOICE
 * CityEnvironment.js — Detailed Cyberpunk City Block World Renderer
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 *
 * Renders a dense, atmospheric rainy cyberpunk city block with wet reflective roads,
 * neon storefronts, alleyways, steam vents, overhead power cables, and volumetric streetlamps.
 */

export class CityEnvironment {
  constructor() {
    this.worldWidth = 2400;
    this.worldHeight = 1200;

    this.civilians = [];
    this.streetLamps = [];
    this.neonSigns = [];
    this.storefronts = [];
    this.puddles = [];
    this.steamVents = [];
    this.overheadCables = [];

    this._time = 0;
    this._initCity();
  }

  _initCity() {
    // 1. Street Lamps with High-Tech Stanchions
    for (let x = 120; x < this.worldWidth; x += 280) {
      this.streetLamps.push({
        x,
        y: 110,
        color: Math.random() > 0.4 ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 183, 0, 0.3)',
        coreColor: Math.random() > 0.4 ? '#00f3ff' : '#ffb700',
        height: 85
      });
      this.streetLamps.push({
        x: x + 140,
        y: 780,
        color: 'rgba(0, 243, 255, 0.28)',
        coreColor: '#00f3ff',
        height: 85
      });
    }

    // 2. Cyberpunk Storefronts & Building Facades
    this.storefronts = [
      { x: 100, y: 30, w: 220, h: 100, name: 'RAMEN NOIR ラーメン', type: 'FOOD', color: '#ff0055', accent: '#ffb700' },
      { x: 380, y: 20, w: 280, h: 110, name: 'ATLAS SECURITY HQ', type: 'CORP', color: '#00f3ff', accent: '#ffffff' },
      { x: 720, y: 35, w: 240, h: 95, name: 'NEO-CLINIC AUGMENTS', type: 'MED', color: '#00ff88', accent: '#00f3ff' },
      { x: 1020, y: 25, w: 260, h: 105, name: 'CYBER-DECK EXCH', type: 'SHOP', color: '#ffb700', accent: '#ff0055' },
      { x: 1340, y: 30, w: 240, h: 100, name: 'SECTOR 4 POWER GRID', type: 'IND', color: '#ff2200', accent: '#ffb700' },
      { x: 1640, y: 20, w: 280, h: 110, name: 'KINETIC LABS VAULT', type: 'LAB', color: '#00f3ff', accent: '#9900ff' },
      { x: 1980, y: 35, w: 300, h: 95, name: 'SAFEHOUSE ARCHIVE', type: 'SAFE', color: '#9900ff', accent: '#00ff88' },
    ];

    // 3. Holographic Neon Signs & Billboards
    this.neonSigns = [
      { text: 'ATLAS CORP', sub: 'ORDER & PROGRESS', x: 420, y: 45, color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.45)' },
      { text: 'SURVEILLANCE ACTIVE', sub: 'CITIZEN COMPLIANCE MANDATED', x: 800, y: 40, color: '#ff0055', glow: 'rgba(255, 0, 85, 0.45)' },
      { text: 'ASCENSION HUB', sub: 'REPORT UNREGISTERED SPARK', x: 1380, y: 45, color: '#ffb700', glow: 'rgba(255, 183, 0, 0.45)' },
      { text: 'NO ACCESS // ALLEY', sub: 'RESTRICTED COMBAT ZONE', x: 1700, y: 40, color: '#ff2200', glow: 'rgba(255, 34, 0, 0.45)' },
    ];

    // 4. Overhead Power Cables
    for (let i = 0; i < 6; i++) {
      this.overheadCables.push({
        x1: i * 400,
        y1: 60 + Math.random() * 30,
        x2: (i + 1) * 400 + 100,
        y2: 70 + Math.random() * 30,
        sag: 25 + Math.random() * 15
      });
    }

    // 5. Wet Asphalt Puddles with Real-Time Reflection
    for (let i = 0; i < 28; i++) {
      this.puddles.push({
        x: 120 + Math.random() * (this.worldWidth - 240),
        y: 190 + Math.random() * 560,
        rx: 30 + Math.random() * 55,
        ry: 12 + Math.random() * 20,
        color: Math.random() > 0.5 ? 'rgba(0, 243, 255, 0.16)' : 'rgba(255, 0, 85, 0.14)'
      });
    }

    // 6. Industrial Steam Vents
    for (let i = 0; i < 10; i++) {
      this.steamVents.push({
        x: 180 + i * 230 + Math.random() * 50,
        y: 210 + Math.random() * 500,
        timer: Math.random() * 2
      });
    }

    // 7. Roaming Powered Civilians
    const powerArchetypes = ['TELEKINESIS', 'PYRO', 'TELEPORT', 'FORCEFIELD', 'LIGHTNING'];
    for (let i = 0; i < 14; i++) {
      this.civilians.push({
        x: 160 + i * 155 + Math.random() * 35,
        y: 220 + Math.random() * 480,
        vx: (Math.random() * 2 - 1) * 30,
        vy: (Math.random() * 2 - 1) * 18,
        power: powerArchetypes[i % powerArchetypes.length],
        powerTimer: Math.random() * 3,
        color: ['#00f3ff', '#ff0055', '#ffaa00', '#9900ff', '#00ff88'][i % 5]
      });
    }
  }

  update(dt, particleSystem) {
    this._time += dt;

    // Steam vents billowing upward
    for (const vent of this.steamVents) {
      vent.timer += dt;
      if (vent.timer > 0.12) {
        vent.timer = 0;
        if (particleSystem && Math.random() < 0.7) {
          particleSystem.spawnSplash(vent.x, vent.y, 'rgba(200, 230, 255, 0.28)');
        }
      }
    }

    // Update civilians
    for (const civ of this.civilians) {
      civ.x += civ.vx * dt;
      civ.y += civ.vy * dt;
      civ.powerTimer += dt;

      if (civ.x < 100 || civ.x > this.worldWidth - 100) civ.vx *= -1;
      if (civ.y < 160 || civ.y > 750) civ.vy *= -1;

      // Display superpower bursts
      if (civ.powerTimer > 2.5 && particleSystem) {
        civ.powerTimer = 0;
        if (civ.power === 'TELEPORT') {
          particleSystem.spawnImpact(civ.x, civ.y, civ.color, 6);
        } else if (civ.power === 'PYRO' || civ.power === 'LIGHTNING') {
          particleSystem.spawnSlash(civ.x, civ.y - 12, Math.random() * Math.PI * 2, 20, civ.color);
        }
      }
    }
  }

  render(ctx, camera = { x: 0, y: 0 }, activeObjectives = []) {
    const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewH = typeof window !== 'undefined' ? window.innerHeight : 720;

    // ─── Layer 1: Parallax Skyline & Cyberpunk Atmosphere ───────────────────
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#030308');
    skyGrad.addColorStop(0.5, '#070712');
    skyGrad.addColorStop(1, '#0e0e1c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Distant Skyscrapers with Glowing Neon Grids
    const paraX = -camera.x * 0.12;
    ctx.fillStyle = '#05050e';
    for (let i = 0; i < 22; i++) {
      const bx = (i * 170 + paraX) % (viewW + 400) - 100;
      const bw = 130 + (i % 3) * 25;
      const bh = 320 + (i % 5) * 80;
      ctx.fillRect(bx, viewH - bh - 180, bw, bh);

      // Lit Windows & Neon Antenna Beacons
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 243, 255, 0.18)' : 'rgba(255, 183, 0, 0.14)';
      for (let wy = viewH - bh - 160; wy < viewH - 210; wy += 20) {
        for (let wx = bx + 14; wx < bx + bw - 14; wx += 16) {
          if (Math.sin(wx * 8 + wy) > 0.25) {
            ctx.fillRect(wx, wy, 7, 10);
          }
        }
      }

      // Antenna beacon flashing red
      if (i % 3 === 0) {
        const beaconPulse = Math.sin(this._time * 4 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 50, ${beaconPulse})`;
        ctx.fillRect(bx + bw / 2 - 1, viewH - bh - 195, 3, 15);
      }

      ctx.fillStyle = '#05050e';
    }
    ctx.restore();

    // ─── Layer 2: Main Playable Street Block (World Space) ──────────────────
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Upper Building Facades & Shop Fronts
    for (const shop of this.storefronts) {
      ctx.save();
      // Facade Wall
      ctx.fillStyle = '#10101c';
      ctx.fillRect(shop.x, shop.y, shop.w, shop.h);
      ctx.strokeStyle = '#222238';
      ctx.lineWidth = 2;
      ctx.strokeRect(shop.x, shop.y, shop.w, shop.h);

      // Shop Entrance Door
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(shop.x + shop.w / 2 - 25, shop.y + shop.h - 40, 50, 40);
      ctx.strokeStyle = shop.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(shop.x + shop.w / 2 - 25, shop.y + shop.h - 40, 50, 40);

      // Illuminated Signboard
      ctx.fillStyle = '#161626';
      ctx.fillRect(shop.x + 10, shop.y + 12, shop.w - 20, 32);
      ctx.strokeStyle = shop.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(shop.x + 10, shop.y + 12, shop.w - 20, 32);

      ctx.fillStyle = shop.color;
      ctx.shadowColor = shop.color;
      ctx.shadowBlur = 12;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(shop.name, shop.x + shop.w / 2, shop.y + 32);

      // Fire Escapes / Air-Con Vents
      ctx.strokeStyle = '#2d2d44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shop.x + 15, shop.y + 55);
      ctx.lineTo(shop.x + 45, shop.y + 55);
      ctx.lineTo(shop.x + 30, shop.y + 85);
      ctx.stroke();
      ctx.restore();
    }

    // Overhead Hanging Power Cables
    ctx.save();
    ctx.strokeStyle = '#181828';
    ctx.lineWidth = 2;
    for (const cable of this.overheadCables) {
      ctx.beginPath();
      ctx.moveTo(cable.x1, cable.y1);
      ctx.quadraticCurveTo((cable.x1 + cable.x2) / 2, cable.y1 + cable.sag, cable.x2, cable.y2);
      ctx.stroke();
    }
    ctx.restore();

    // Asphalt Roadway Ground
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(0, 140, this.worldWidth, 680);

    // Upper & Lower Sidewalk Curbs
    ctx.fillStyle = '#141424';
    ctx.fillRect(0, 115, this.worldWidth, 25);
    ctx.fillRect(0, 820, this.worldWidth, 35);

    // Neon Edge Curb Strips
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 140); ctx.lineTo(this.worldWidth, 140);
    ctx.moveTo(0, 820); ctx.lineTo(this.worldWidth, 820);
    ctx.stroke();

    // Road Markings (Yellow & Cyan Dashed Lane Dividers)
    ctx.setLineDash([40, 30]);
    ctx.strokeStyle = 'rgba(255, 183, 0, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(this.worldWidth, 480);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 310); ctx.lineTo(this.worldWidth, 310);
    ctx.moveTo(0, 650); ctx.lineTo(this.worldWidth, 650);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zebra Crosswalks at Strategic Junctions
    for (let cx = 350; cx < this.worldWidth; cx += 550) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let cz = 160; cz < 800; cz += 45) {
        ctx.fillRect(cx, cz, 75, 24);
      }
    }

    // Puddle Neon Reflections with Wet Water Specular
    for (const p of this.puddles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ripple edge ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Holographic Cyberpunk Billboards
    for (const sign of this.neonSigns) {
      ctx.save();
      ctx.fillStyle = '#121222';
      ctx.fillRect(sign.x - 10, sign.y - 5, 230, 48);
      ctx.strokeStyle = sign.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(sign.x - 10, sign.y - 5, 230, 48);

      ctx.fillStyle = sign.color;
      ctx.shadowColor = sign.color;
      ctx.shadowBlur = 14;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sign.text, sign.x + 8, sign.y + 18);

      ctx.fillStyle = '#8888aa';
      ctx.shadowBlur = 0;
      ctx.font = '9px monospace';
      ctx.fillText(sign.sub, sign.x + 8, sign.y + 34);
      ctx.restore();
    }

    // Street Lamps with Volumetric Light Cones
    for (const lamp of this.streetLamps) {
      ctx.save();
      // Lamp Post
      ctx.strokeStyle = '#26263a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(lamp.x, lamp.y);
      ctx.lineTo(lamp.x, lamp.y + lamp.height);
      ctx.stroke();

      // Glowing Lamp Bulb
      ctx.fillStyle = lamp.coreColor;
      ctx.shadowColor = lamp.coreColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Volumetric Light Cone on Wet Ground
      const lightGrad = ctx.createRadialGradient(
        lamp.x, lamp.y + 75, 10,
        lamp.x, lamp.y + 75, 150
      );
      lightGrad.addColorStop(0, lamp.color);
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.ellipse(lamp.x, lamp.y + 75, 140, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ─── Layer 3: Roaming Powered Civilians ──────────────────────────────────
    for (const civ of this.civilians) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(civ.x, civ.y + 12, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Silhouette
      ctx.fillStyle = '#1c1c2c';
      ctx.beginPath();
      ctx.arc(civ.x, civ.y - 2, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Superpower Aura Ring
      ctx.strokeStyle = civ.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = civ.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(civ.x, civ.y - 2, 13 + Math.sin(this._time * 4 + civ.x) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = civ.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(civ.power, civ.x, civ.y - 18);
      ctx.restore();
    }

    // ─── Layer 4: Interactable Objects, Clues, Hazards & Landmarks ─────────
    this._renderWorldInteractables(ctx);

    // ─── Layer 5: Mission Waypoint Beacons & Cyan Target Discs ──────────────
    this._renderMissionWaypoints(ctx, activeObjectives);

    ctx.restore();
  }

  _renderWorldInteractables(ctx) {
    const time = this._time;

    // 1. Security Camera Clue (x: 480, y: 220)
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(470, 190, 20, 30);
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(480, 220, 5, 0, Math.PI * 2); ctx.fill();
    // Scanning cone
    ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(480, 220);
    ctx.lineTo(430 + Math.sin(time * 2) * 30, 300);
    ctx.lineTo(530 + Math.sin(time * 2) * 30, 300);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[E] CAM CLUE', 480, 180);
    ctx.restore();

    // 2. Broken Cyber-Weapon Clue (x: 820, y: 350)
    ctx.save();
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(820, 350, 14 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffb700';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[E] WEAPON CLUE', 820, 325);
    ctx.restore();

    // 3. Syndicate Access Terminal (x: 1180, y: 250)
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 14;
    ctx.fillRect(1165, 220, 30, 45);
    ctx.strokeRect(1165, 220, 30, 45);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[E] TERMINAL', 1180, 210);
    ctx.restore();

    // 4. Electrical Puddle Hazard (x: 700, y: 480)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(700, 480, 50, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lightning spark arcs
    if (Math.random() < 0.6) {
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(680 + Math.random() * 40, 470 + Math.random() * 20);
      ctx.lineTo(690 + Math.random() * 20, 460 + Math.random() * 20);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ HAZARD', 700, 455);
    ctx.restore();

    // 5. Warehouse Infiltration Gate (x: 1450, y: 280)
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1430, 160, 40, 140);
    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 16;
    ctx.strokeRect(1430, 160, 40, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WAREHOUSE GATE', 1450, 145);
    ctx.restore();
  }

  _renderMissionWaypoints(ctx, activeObjectives = []) {

    const areaCoordinates = {
      'SAFEHOUSE_L1': { x: 900, y: 350, label: 'WAREHOUSE / SAFEHOUSE' },
      'OLD_DISTRICT': { x: 750, y: 300, label: 'OLD DISTRICT' },
      'ROOFTOP_MEETING': { x: 1300, y: 300, label: 'ROOFTOP CONFRONTATION' },
      'ATLAS_DISTRICT': { x: 1800, y: 350, label: 'ATLAS HEADQUARTERS' },
      'PATROL_ZONE': { x: 950, y: 400, label: 'PATROL ZONE' }
    };

    // Always ensure Level 1 Warehouse Waypoint is visible if in Level 1
    const targetsToRender = [...(activeObjectives || [])];
    if (targetsToRender.length === 0 || !targetsToRender.some(o => o.target?.areaId === 'SAFEHOUSE_L1')) {
      targetsToRender.push({ target: { areaId: 'SAFEHOUSE_L1' } });
    }

    targetsToRender.forEach(obj => {
      const areaId = obj.target?.areaId;
      const targetPos = areaCoordinates[areaId];
      if (targetPos) {
        ctx.save();
        const pulse = Math.sin(this._time * 4.5) * 4;
        const isWarehouse = areaId === 'SAFEHOUSE_L1';
        const isCompleted = isWarehouse && gameplayState?.warehouseTarget?.completed;
        const color = isCompleted ? '#00ff88' : '#00f3ff';
        const targetRadius = 50; // < 50px radius target disc

        // 1. Semi-transparent Glowing Cyan Ground Fill Disc
        const discGrad = ctx.createRadialGradient(
          targetPos.x, targetPos.y, 5,
          targetPos.x, targetPos.y, targetRadius + pulse
        );
        discGrad.addColorStop(0, isCompleted ? 'rgba(0, 255, 136, 0.45)' : 'rgba(0, 243, 255, 0.4)');
        discGrad.addColorStop(0.7, isCompleted ? 'rgba(0, 255, 136, 0.18)' : 'rgba(0, 243, 255, 0.15)');
        discGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, targetRadius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Outer Concentric Cyan Shockwave Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, targetRadius + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Inner Rotating Concentric Ring & Chevrons
        const rotAngle = this._time * 1.5;
        ctx.save();
        ctx.translate(targetPos.x, targetPos.y);
        ctx.rotate(rotAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Vertical Holographic Light Column
        const pillarGrad = ctx.createLinearGradient(targetPos.x, targetPos.y, targetPos.x, targetPos.y - 160);
        pillarGrad.addColorStop(0, isCompleted ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 243, 255, 0.4)');
        pillarGrad.addColorStop(0.6, isCompleted ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 243, 255, 0.12)');
        pillarGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(targetPos.x - 24, targetPos.y - 160, 48, 160);

        // 5. Calculate Real-Time Player Distance
        let distText = '';
        if (gameplayState && gameplayState.player) {
          const pDist = Math.hypot(targetPos.x - gameplayState.player.x, targetPos.y - gameplayState.player.y);
          const pMeters = Math.max(0, Math.round((pDist - targetRadius) / 5.1));
          distText = isCompleted ? '[ ZONE SECURED ]' : `[ ${pMeters}m ]`;
        }

        // 6. Floating Holographic Diamond & Label Banner
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillText(`▼ ${targetPos.label}`, targetPos.x, targetPos.y - 170 + pulse * 0.5);

        if (distText) {
          ctx.fillStyle = color;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(distText, targetPos.x, targetPos.y - 155 + pulse * 0.5);
        }

        ctx.restore();
      }
    });
  }
}

export const cityEnvironment = new CityEnvironment();
