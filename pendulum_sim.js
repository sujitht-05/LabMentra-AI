/**
 * Simple Pendulum Interactive Canvas Physics Simulation
 */

class PendulumSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.angle = 10.0 * (Math.PI / 180);
        this.angularVel = 0.0;
        this.angularAccel = 0.0;
        this.trail = [];
        this.isSwinging = false;
        this.animFrame = null;
        this.swingCount = 0;
        this.lastDirection = 1;
    }

    init(state) {
        this.state = state;
        this.angle = (state.angle_deg || 10.0) * (Math.PI / 180);
        this.angularVel = 0;
        this.angularAccel = 0;
        this.trail = [];
        this.swingCount = 0;
        this.isSwinging = true;
        this.startAnimation();
    }

    updateState(newState) {
        this.state = newState;
        if (newState.angle_deg !== undefined) {
            this.angle = newState.angle_deg * (Math.PI / 180);
            this.angularVel = 0;
            this.trail = [];
        }
    }

    startAnimation() {
        let lastTime = performance.now();
        const loop = (now) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            this.updatePhysics(Math.min(dt, 0.033));
            this.draw();
            this.animFrame = requestAnimationFrame(loop);
        };
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = requestAnimationFrame(loop);
    }

    updatePhysics(dt) {
        if (!this.isSwinging || !this.state) return;

        const g = this.state.g_true || 9.81;
        const L = this.state.length_m || 1.0;

        // Simple harmonic equation: alpha = -(g/L) * sin(theta)
        this.angularAccel = -(g / L) * Math.sin(this.angle);

        this.angularVel += this.angularAccel * dt;
        // Light air damping
        this.angularVel *= 0.9995;
        this.angle += this.angularVel * dt;

        // Oscillation counter detection
        const currentDir = this.angularVel >= 0 ? 1 : -1;
        if (currentDir !== this.lastDirection && currentDir === 1) {
            this.swingCount++;
        }
        this.lastDirection = currentDir;
    }

    draw() {
        const w = this.canvas.width = this.canvas.clientWidth || 800;
        const h = this.canvas.height = this.canvas.clientHeight || 500;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        const pivotX = w * 0.4;
        const pivotY = 60;

        // Draw Celestial Surface Background
        const planet = this.state ? this.state.planet : 'Earth';
        this.drawCelestialBg(ctx, w, h, planet);

        // Ceiling Mount
        ctx.fillStyle = '#475569';
        ctx.fillRect(pivotX - 60, pivotY - 15, 120, 15);
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Bob Position
        const pixelsPerMeter = 180;
        const L = this.state ? this.state.length_m : 1.0;
        const bobX = pivotX + (L * pixelsPerMeter) * Math.sin(this.angle);
        const bobY = pivotY + (L * pixelsPerMeter) * Math.cos(this.angle);

        // Trail
        this.trail.push({ x: bobX, y: bobY });
        if (this.trail.length > 40) this.trail.shift();

        ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.trail.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // String
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Metallic Pendulum Bob
        const radius = 16 + (this.state ? (this.state.mass_kg || 0.5) * 6 : 0);
        const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, radius);
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#0284c7');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bobX, bobY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Energy Bar Graph (KE vs PE)
        this.drawEnergyGraph(ctx, w - 280, 40, 240, 180);
    }

    drawCelestialBg(ctx, w, h, planet) {
        if (planet === 'Moon') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, h - 40, w, 40);
        } else if (planet === 'Mars') {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(0, 0, w, h);
        } else if (planet === 'Jupiter') {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawEnergyGraph(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#334155';
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Energy Conversion (KE vs PE)', x + 10, y + 20);

        if (!this.state) return;

        const m = this.state.mass_kg || 0.5;
        const g = this.state.g_true || 9.81;
        const L = this.state.length_m || 1.0;

        // Height h = L * (1 - cos(theta))
        const height = L * (1 - Math.cos(this.angle));
        const pe = m * g * height;
        const ke = 0.5 * m * (Math.pow(L * this.angularVel, 2));
        const totalE = pe + ke || 1.0;

        const barW = 40;
        const maxH = h - 60;

        // PE Bar
        const peH = Math.min(maxH, (pe / totalE) * maxH);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 40, y + h - 25 - peH, barW, peH);

        // KE Bar
        const keH = Math.min(maxH, (ke / totalE) * maxH);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x + 130, y + h - 25 - keH, barW, keH);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText('PE', x + 52, y + h - 10);
        ctx.fillText('KE', x + 142, y + h - 10);
    }
}
