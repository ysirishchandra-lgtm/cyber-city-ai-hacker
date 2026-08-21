/**
 * SCAR — THE LAST CHOICE
 * ParticleSystem.js — Cyberpunk Weather, Combat VFX, Damage Numbers & Power FX
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
    this.rainDrops = [];
    this.weatherEnabled = true;
    this.rainIntensity = 160;
    this.maxParticles = 350;
    this._initWeather();
  }

  _initWeather() {
    this.rainDrops = [];
    for (let i = 0; i < 220; i++) {
      this.rainDrops.push({
        x: Math.random() * 2200,
        y: Math.random() * 1200,
        len: 14 + Math.random() * 18,
        speed: 750 + Math.random() * 400,
        alpha: 0.25 + Math.random() * 0.45,
        drift: -160 - Math.random() * 90,
      });
    }
  }

  update(dt, camera = { x: 0, y: 0 }) {
    // 1. Update Rain
    if (this.weatherEnabled) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 720;

      for (const drop of this.rainDrops) {
        drop.x += drop.drift * dt;
        drop.y += drop.speed * dt;

        if (drop.y > viewH + 50 || drop.x < -100) {
          drop.y = -30 - Math.random() * 50;
          drop.x = Math.random() * (viewW + 400);

          if (Math.random() < 0.18) {
            this.spawnSplash(
              drop.x + camera.x,
              viewH - 40 + (Math.random() * 80 - 40) + camera.y,
              'rgba(0, 243, 255, 0.45)'
            );
          }
        }
      }
    }

    // 2. Update Floating Damage Numbers
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.life -= dt;
      d.y += d.vy * dt;
      d.x += d.vx * dt;
      d.vy += 80 * dt; // slight gravity
      d.scale = Math.min(1.4, d.scale + dt * 3);
      return d.life > 0;
    });

    // 3. Update Dynamic Particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.drag) {
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 60);
      }
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.type === 'nova') {
        p.radius += (p.maxRadius - p.radius) * 0.18;
      }
      if (p.type === 'dissolve') {
        p.size *= Math.pow(0.92, dt * 60);
      }

      return p.life > 0;
    });

    // Enforce strict performance cap
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  // ─── Floating Damage Numbers ──────────────────────────────────────────────

  spawnDamageNumber(x, y, damage, isCrit = false, color = '#ffffff') {
    this.damageNumbers.push({
      x: x + (Math.random() * 16 - 8),
      y: y - 20,
      vx: (Math.random() * 2 - 1) * 25,
      vy: -90 - Math.random() * 30,
      damage: Math.round(damage),
      isCrit,
      color: isCrit ? '#ff0055' : color,
      life: 0.85,
      maxLife: 0.85,
      scale: 0.8
    });
  }

  // ─── Death Dissolution VFX ────────────────────────────────────────────────

  spawnDeathDissolve(x, y, color = '#ff0055', count = 28) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        type: 'dissolve',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: Math.random() > 0.3 ? color : '#ffffff',
        size: 3 + Math.random() * 5,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        drag: 0.88,
        gravity: 90
      });
    }

    // Expanding shock ring
    this.spawnImpact(x, y, color, 12);
  }

  // ─── Dodge / Dash Trail VFX ───────────────────────────────────────────────

  spawnDashTrail(x, y, angle, color = '#00f3ff') {
    for (let i = 0; i < 8; i++) {
      const pAngle = angle + Math.PI + (Math.random() * 0.8 - 0.4);
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        type: 'spark',
        x: x + Math.cos(angle) * -10,
        y: y + Math.sin(angle) * -10,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        drag: 0.85
      });
    }
  }

  // ─── Combat Blood & Scar Sparks ───────────────────────────────────────────

  spawnBloodSpark(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 140;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#ff0033' : '#ff4400',
        size: 2.5 + Math.random() * 3,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55,
        drag: 0.86,
        gravity: 80
      });
    }
  }

  spawnSlash(x, y, angle, length = 35, color = '#00f3ff') {
    this.particles.push({
      type: 'slash',
      x,
      y,
      angle,
      length,
      color,
      life: 0.14,
      maxLife: 0.14,
      vx: 0,
      vy: 0,
    });
  }

  spawnImpact(x, y, color = '#ffffff', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0.22 + Math.random() * 0.15,
        maxLife: 0.37,
        drag: 0.88,
      });
    }
  }

  spawnSplash(x, y, color = 'rgba(0, 243, 255, 0.4)') {
    this.particles.push({
      type: 'splash',
      x,
      y,
      radius: 2,
      maxRadius: 10 + Math.random() * 8,
      color,
      life: 0.28,
      maxLife: 0.28,
      vx: 0,
      vy: 0,
    });
  }

  spawnNova(x, y, color = '#ff2200', maxRadius = 140) {
    this.particles.push({
      type: 'nova',
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      life: 0.55,
      maxLife: 0.55,
      vx: 0,
      vy: 0,
    });
  }

  spawnBarrier(x, y, radius = 55, color = '#0099ff', duration = 2.5) {
    this.particles.push({
      type: 'barrier',
      x,
      y,
      radius,
      color,
      life: duration,
      maxLife: duration,
      vx: 0,
      vy: 0,
    });
  }

  spawnStasisField(x, y, color = '#00ff88', duration = 3.0) {
    this.particles.push({
      type: 'stasis',
      x,
      y,
      color,
      life: duration,
      maxLife: duration,
      vx: 0,
      vy: 0,
    });
  }

  spawnStasisGrid(x, y, color = '#00ff88', duration = 3.0) {
    this.spawnStasisField(x, y, color, duration);
  }

  spawnDamageNumber(x, y, damage, isCrit = false, color = '#ffffff') {
    this.damageNumbers.push({
      damage,
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      vx: (Math.random() * 40 - 20),
      vy: -70 - Math.random() * 30,
      scale: isCrit ? 1.4 : 1.0,
      isCrit,
      color: isCrit ? '#ff0055' : color,
      life: 0.75,
      maxLife: 0.75,
    });
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  render(ctx, camera = { x: 0, y: 0 }) {
    ctx.save();

    // 1. Render World Space Particles
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const progress = p.life / p.maxLife;

      if (p.type === 'spark' || p.type === 'dissolve') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.5);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1, p.size * progress), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'slash') {
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3.5 * progress;
        ctx.beginPath();
        const len = p.length;
        ctx.moveTo(sx - Math.cos(p.angle) * len * 0.5, sy - Math.sin(p.angle) * len * 0.5);
        ctx.lineTo(sx + Math.cos(p.angle) * len * 0.5, sy + Math.sin(p.angle) * len * 0.5);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'splash') {
        ctx.save();
        ctx.globalAlpha = progress * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, p.maxRadius * (1 - progress), (p.maxRadius * 0.45) * (1 - progress), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'nova') {
        ctx.save();
        ctx.globalAlpha = progress * 0.85;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 4 * progress;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'barrier') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 2) * 0.75;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 153, 255, 0.14)';
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'stasis') {
        ctx.save();
        ctx.globalAlpha = progress * 0.8;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(sx - 35, sy - 35, 70, 70);
        ctx.restore();
      }
    }

    // 2. Render Floating Damage Numbers
    for (const d of this.damageNumbers) {
      const sx = d.x - camera.x;
      const sy = d.y - camera.y;
      const progress = d.life / d.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.min(1, progress * 2);
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = d.isCrit ? 16 : 8;
      ctx.font = `900 ${d.isCrit ? 22 : 16}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(d.isCrit ? `CRIT ${d.damage}!` : `${d.damage}`, sx, sy);
      ctx.restore();
    }

    ctx.restore();

    // 3. Render Screen-space Rain
    if (this.weatherEnabled) {
      ctx.save();
      ctx.lineWidth = 1.3;
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
