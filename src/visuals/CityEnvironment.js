/**
 * SCAR — THE LAST CHOICE
 * CityEnvironment.js — Atmospheric Cyber City World Renderer
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

export class CityEnvironment {
  constructor() {
    this.worldWidth = 2400;
    this.worldHeight = 1200;

    this.civilians = [];
    this.streetLamps = [];
    this.neonSigns = [];
    this.puddles = [];
    this.steamVents = [];

    this._time = 0;
    this._initCity();
  }

  _initCity() {
    // 1. Street Lamps
    for (let x = 150; x < this.worldWidth; x += 300) {
      this.streetLamps.push({
        x,
        y: 120,
        color: Math.random() > 0.4 ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 183, 0, 0.25)',
        coreColor: Math.random() > 0.4 ? '#00f3ff' : '#ffb700',
        height: 90
      });
      this.streetLamps.push({
        x: x + 150,
        y: 750,
        color: 'rgba(0, 243, 255, 0.25)',
        coreColor: '#00f3ff',
        height: 90
      });
    }

    // 2. Holographic Neon Signs on Buildings
    this.neonSigns = [
      { text: 'ATLAS CORP', sub: 'ORDER & PROGRESS', x: 300, y: 50, color: '#ffb700', glow: 'rgba(255, 183, 0, 0.4)' },
      { text: 'NEO-SECTOR 4', sub: 'SURVEILLANCE ACTIVE', x: 800, y: 40, color: '#ff0055', glow: 'rgba(255, 0, 85, 0.4)' },
      { text: 'CYBER-GENETICS', sub: 'POWER AUGMENTATION', x: 1350, y: 55, color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.4)' },
      { text: 'KINETIC LABS', sub: 'RESTRICTED ACCESS', x: 1850, y: 45, color: '#00ff66', glow: 'rgba(0, 255, 102, 0.4)' },
    ];

    // 3. Wet Puddles with Neon Reflection
    for (let i = 0; i < 25; i++) {
      this.puddles.push({
        x: 100 + Math.random() * (this.worldWidth - 200),
        y: 180 + Math.random() * 550,
        rx: 35 + Math.random() * 60,
        ry: 15 + Math.random() * 25,
        color: Math.random() > 0.5 ? 'rgba(0, 243, 255, 0.12)' : 'rgba(255, 0, 85, 0.12)'
      });
    }

    // 4. Steam Vents
    for (let i = 0; i < 8; i++) {
      this.steamVents.push({
        x: 200 + i * 280 + Math.random() * 60,
        y: 220 + Math.random() * 450,
        timer: Math.random() * 2
      });
    }

    // 5. Powered Civilians showing "Everyone has a power. You have zero."
    const powerArchetypes = ['TELEKINESIS', 'PYRO', 'TELEPORT', 'FORCEFIELD', 'LIGHTNING'];
    for (let i = 0; i < 14; i++) {
      this.civilians.push({
        x: 150 + i * 160 + Math.random() * 40,
        y: 200 + Math.random() * 500,
        vx: (Math.random() * 2 - 1) * 35,
        vy: (Math.random() * 2 - 1) * 20,
        power: powerArchetypes[i % powerArchetypes.length],
        powerTimer: Math.random() * 3,
        color: ['#00f3ff', '#ff0055', '#ffaa00', '#9900ff', '#00ff88'][i % 5]
      });
    }
  }

  update(dt, particleSystem) {
    this._time += dt;

    // Update steam vents
    for (const vent of this.steamVents) {
      vent.timer += dt;
      if (vent.timer > 0.15) {
        vent.timer = 0;
        if (particleSystem && Math.random() < 0.6) {
          particleSystem.spawnSplash(vent.x, vent.y, 'rgba(200, 230, 255, 0.25)');
        }
      }
    }

    // Update roaming powered civilians
    for (const civ of this.civilians) {
      civ.x += civ.vx * dt;
      civ.y += civ.vy * dt;
      civ.powerTimer += dt;

      // Bounce in street bounds
      if (civ.x < 100 || civ.x > this.worldWidth - 100) civ.vx *= -1;
      if (civ.y < 160 || civ.y > 750) civ.vy *= -1;

      // Periodic superpower display FX
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
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // ─── Layer 1: Parallax Skyline & Clouds ────────────────────────────────────
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#04040a');
    skyGrad.addColorStop(0.5, '#0a0a16');
    skyGrad.addColorStop(1, '#0f101f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Distant background skyscrapers (parallax factor: 0.15)
    const paraX = -camera.x * 0.15;
    ctx.fillStyle = '#06060f';
    for (let i = 0; i < 20; i++) {
      const bx = (i * 180 + paraX) % (viewW + 400) - 100;
      const bw = 120 + (i % 3) * 30;
      const bh = 300 + (i % 5) * 80;
      ctx.fillRect(bx, viewH - bh - 200, bw, bh);

      // Lit windows
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 183, 0, 0.12)';
      for (let wy = viewH - bh - 180; wy < viewH - 220; wy += 22) {
        for (let wx = bx + 15; wx < bx + bw - 15; wx += 18) {
          if (Math.sin(wx * 10 + wy) > 0.2) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.fillStyle = '#06060f';
    }
    ctx.restore();

    // ─── Layer 2: Main Ground & Streets (World Space) ──────────────────────────
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Asphalt Ground
    ctx.fillStyle = '#0d0d16';
    ctx.fillRect(0, 140, this.worldWidth, 680);

    // Upper & Lower Sidewalks
    ctx.fillStyle = '#141424';
    ctx.fillRect(0, 110, this.worldWidth, 30);
    ctx.fillRect(0, 820, this.worldWidth, 40);

    // Curb lighting lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(this.worldWidth, 140);
    ctx.moveTo(0, 820);
    ctx.lineTo(this.worldWidth, 820);
    ctx.stroke();

    // Road Markings (Yellow & Cyan dashed lines)
    ctx.setLineDash([35, 25]);
    ctx.strokeStyle = 'rgba(255, 183, 0, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(this.worldWidth, 480);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.lineTo(this.worldWidth, 310);
    ctx.moveTo(0, 650);
    ctx.lineTo(this.worldWidth, 650);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosswalks at intervals
    for (let cx = 400; cx < this.worldWidth; cx += 600) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let cz = 160; cz < 800; cz += 45) {
        ctx.fillRect(cx, cz, 70, 22);
      }
    }

    // Puddle Neon Reflections
    for (const p of this.puddles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ripple outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Holographic Building Neon Signs
    for (const sign of this.neonSigns) {
      ctx.save();
      // Sign bracket
      ctx.fillStyle = '#181828';
      ctx.fillRect(sign.x - 10, sign.y - 5, 220, 50);
      ctx.strokeStyle = sign.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sign.x - 10, sign.y - 5, 220, 50);

      // Glowing text
      ctx.fillStyle = sign.color;
      ctx.shadowColor = sign.color;
      ctx.shadowBlur = 12;
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sign.text, sign.x + 8, sign.y + 20);

      ctx.fillStyle = '#888899';
      ctx.shadowBlur = 0;
      ctx.font = '9px monospace';
      ctx.fillText(sign.sub, sign.x + 8, sign.y + 36);
      ctx.restore();
    }

    // Street Lamps with Volumetric Light Cones
    for (const lamp of this.streetLamps) {
      ctx.save();
      // Lamp post
      ctx.strokeStyle = '#2a2a3e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lamp.x, lamp.y);
      ctx.lineTo(lamp.x, lamp.y + lamp.height);
      ctx.stroke();

      // Glowing Lamp Bulb
      ctx.fillStyle = lamp.coreColor;
      ctx.shadowColor = lamp.coreColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Volumetric Light Cone on Ground
      const lightGrad = ctx.createRadialGradient(
        lamp.x, lamp.y + 70, 10,
        lamp.x, lamp.y + 70, 140
      );
      lightGrad.addColorStop(0, lamp.color);
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.ellipse(lamp.x, lamp.y + 70, 130, 65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ─── Layer 3: Powered Civilians ───────────────────────────────────────────
    for (const civ of this.civilians) {
      ctx.save();
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(civ.x, civ.y + 10, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Silhouette)
      ctx.fillStyle = '#222233';
      ctx.beginPath();
      ctx.arc(civ.x, civ.y - 4, 9, 0, Math.PI * 2);
      ctx.fill();

      // Superpower Ambient Glow on Civilian
      ctx.strokeStyle = civ.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = civ.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(civ.x, civ.y - 4, 13 + Math.sin(this._time * 4 + civ.x) * 2, 0, Math.PI * 2);
      ctx.stroke();

      // Power flare tag
      ctx.fillStyle = civ.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(civ.power, civ.x, civ.y - 20);
      ctx.restore();
    }

    // ─── Layer 4: Mission Waypoint Beacons ────────────────────────────────────
    this._renderMissionWaypoints(ctx, activeObjectives);

    ctx.restore();
  }

  _renderMissionWaypoints(ctx, activeObjectives) {
    if (!activeObjectives || activeObjectives.length === 0) return;

    const areaCoordinates = {
      'SAFEHOUSE_L1': { x: 900, y: 350, label: 'SAFEHOUSE' },
      'OLD_DISTRICT': { x: 750, y: 300, label: 'OLD DISTRICT' },
      'ROOFTOP_MEETING': { x: 1300, y: 300, label: 'ROOFTOP CONFRONTATION' },
      'ATLAS_DISTRICT': { x: 1800, y: 350, label: 'ATLAS HEADQUARTERS' },
      'PATROL_ZONE': { x: 950, y: 400, label: 'PATROL ZONE' }
    };

    activeObjectives.forEach(obj => {
      const areaId = obj.target?.areaId;
      const targetPos = areaCoordinates[areaId];
      if (targetPos) {
        ctx.save();
        const pulse = Math.sin(this._time * 4) * 6;
        const color = '#00f3ff';

        // Ground Target Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(targetPos.x, targetPos.y + 20, 45 + pulse, 22 + pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing Light Pillar
        const pillarGrad = ctx.createLinearGradient(targetPos.x, targetPos.y + 20, targetPos.x, targetPos.y - 120);
        pillarGrad.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
        pillarGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(targetPos.x - 20, targetPos.y - 120, 40, 140);

        // Holographic Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`▼ ${targetPos.label}`, targetPos.x, targetPos.y - 130 + pulse * 0.5);

        ctx.restore();
      }
    });
  }
}

export const cityEnvironment = new CityEnvironment();
