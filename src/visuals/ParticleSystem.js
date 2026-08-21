/**
 * SCAR — THE LAST CHOICE
 * ParticleSystem.js — Cyberpunk Weather, Combat VFX & Power FX
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rainDrops = [];
    this.weatherEnabled = true;
    this.rainIntensity = 120; // Active raindrop count
    this._initWeather();
  }

  _initWeather() {
    this.rainDrops = [];
    for (let i = 0; i < 200; i++) {
      this.rainDrops.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        len: 12 + Math.random() * 18,
        speed: 700 + Math.random() * 400,
        alpha: 0.2 + Math.random() * 0.4,
        drift: -150 - Math.random() * 100, // Wind drift
      });
    }
  }

  update(dt, camera = { x: 0, y: 0 }) {
    // 1. Update rain
    if (this.weatherEnabled) {
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;

      for (const drop of this.rainDrops) {
        drop.x += drop.drift * dt;
        drop.y += drop.speed * dt;

        // Reset if off screen
        if (drop.y > viewH + 50 || drop.x < -100) {
          drop.y = -30 - Math.random() * 50;
          drop.x = Math.random() * (viewW + 400);

          // Random ground splash occasionally
          if (Math.random() < 0.15) {
            this.spawnSplash(
              drop.x + camera.x,
              viewH - 40 + (Math.random() * 80 - 40) + camera.y,
              'rgba(0, 243, 255, 0.4)'
            );
          }
        }
      }
    }

    // 2. Update dynamic particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Friction / Gravity
      if (p.drag) {
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 60);
      }
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      // Size progression
      if (p.grow) {
        p.radius += p.grow * dt;
      }

      return p.life > 0;
    });
  }

  // ─── Emitters ──────────────────────────────────────────────────────────────

  spawnSlash(x, y, angle, radius = 45, color = '#00f3ff') {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius,
      angle,
      color,
      type: 'slash',
      life: 0.18,
      maxLife: 0.18
    });

    // Sparks along the slash
    for (let i = 0; i < 8; i++) {
      const spd = 120 + Math.random() * 180;
      const sparkAngle = angle + (Math.random() * 1.2 - 0.6);
      this.particles.push({
        x: x + Math.cos(angle) * (radius * 0.6),
        y: y + Math.sin(angle) * (radius * 0.6),
        vx: Math.cos(sparkAngle) * spd,
        vy: Math.sin(sparkAngle) * spd,
        radius: 2 + Math.random() * 2,
        color: '#ffffff',
        type: 'spark',
        drag: 0.88,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.4
      });
    }
  }

  spawnImpact(x, y, color = '#ff0055', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        type: 'spark',
        drag: 0.9,
        gravity: 120,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6
      });
    }
  }

  spawnSplash(x, y, color = 'rgba(0, 243, 255, 0.5)') {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius: 2,
      maxRadius: 10 + Math.random() * 12,
      color,
      type: 'ripple',
      life: 0.35,
      maxLife: 0.35
    });
  }

  spawnNova(x, y, radius = 180, color = '#ff2200') {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius: 10,
      maxRadius: radius,
      color,
      type: 'nova',
      life: 0.5,
      maxLife: 0.5
    });

    // Embers
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 300;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: Math.random() > 0.4 ? '#ff5500' : '#ffcc00',
        type: 'spark',
        drag: 0.92,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8
      });
    }
  }

  spawnStasisGrid(x, y, radius = 220, color = '#00ff88') {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius: 10,
      maxRadius: radius,
      color,
      type: 'stasis_grid',
      life: 3.5,
      maxLife: 3.5
    });
  }

  spawnBarrier(x, y, duration = 3.5, color = '#0099ff') {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius: 45,
      color,
      type: 'barrier',
      life: duration,
      maxLife: duration
    });
  }

  spawnFootstep(x, y) {
    this.spawnSplash(x, y, 'rgba(0, 243, 255, 0.35)');
  }

  // ─── Render Pass ───────────────────────────────────────────────────────────

  render(ctx, camera = { x: 0, y: 0 }) {
    // 1. Render World Particles (affected by camera)
    ctx.save();
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const progress = p.life / p.maxLife;

      if (p.type === 'spark') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, progress);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius * progress, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'slash') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, progress * 0.9);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 6 * progress;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, p.angle - 0.9, p.angle + 0.9);
        ctx.stroke();

        // Inner bright white core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * progress;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'ripple') {
        ctx.save();
        const r = p.radius + (p.maxRadius - p.radius) * (1 - progress);
        ctx.globalAlpha = Math.max(0, progress * 0.6);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'nova') {
        ctx.save();
        const r = p.radius + (p.maxRadius - p.radius) * (1 - progress);
        ctx.globalAlpha = Math.max(0, progress * 0.8);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * progress;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'stasis_grid') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, progress * 0.5);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sx, sy, p.maxRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Cyber matrix lines inside
        const t = (p.maxLife - p.life) * 4;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -t * 10;
        ctx.beginPath();
        ctx.arc(sx, sy, p.maxRadius * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (p.type === 'barrier') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 2) * 0.7;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 153, 255, 0.15)';
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // 2. Render Screen-space Rain
    if (this.weatherEnabled) {
      ctx.save();
      ctx.lineWidth = 1.2;
      for (const drop of this.rainDrops) {
        ctx.strokeStyle = `rgba(180, 230, 255, ${drop.alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.drift * 0.03, drop.y + drop.len);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export const particleSystem = new ParticleSystem();
