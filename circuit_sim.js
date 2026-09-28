/**
 * DC Circuit Ohm's Law Interactive Canvas Simulation
 */

class CircuitSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.smokeParticles = [];
        this.animFrame = null;
    }

    init(state) {
        this.state = state;
        this.startAnimation();
    }

    updateState(newState) {
        this.state = newState;
    }

    startAnimation() {
        const loop = () => {
            this.draw();
            this.animFrame = requestAnimationFrame(loop);
        };
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = requestAnimationFrame(loop);
    }

    draw() {
        const w = this.canvas.width = this.canvas.clientWidth || 800;
        const h = this.canvas.height = this.canvas.clientHeight || 500;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        if (!this.state) return;

        const isBurned = this.state.component_burned;
        const current = this.state.current_a;
        const voltage = this.state.voltage_v;
        const resistance = this.state.resistance_ohm;

        // Circuit Loop Coordinates
        const leftX = 120;
        const rightX = w - 120;
        const topY = 100;
        const bottomY = h - 120;

        // Wires
        ctx.strokeStyle = isBurned ? '#475569' : '#0ea5e9';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(rightX, topY);
        ctx.lineTo(rightX, bottomY);
        ctx.lineTo(leftX, bottomY);
        ctx.closePath();
        ctx.stroke();

        // 1. DC Voltage Source (Left Side)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(leftX - 30, topY + 60, 60, 100);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftX - 30, topY + 60, 60, 100);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('DC Power', leftX - 28, topY + 80);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${voltage.toFixed(1)} V`, leftX - 22, topY + 110);

        // 2. Resistor Component (Top Center)
        const resX = (leftX + rightX) / 2;
        ctx.fillStyle = isBurned ? '#1e1b4b' : '#334155';
        ctx.fillRect(resX - 50, topY - 20, 100, 40);
        ctx.strokeStyle = isBurned ? '#ef4444' : '#cbd5e1';
        ctx.strokeRect(resX - 50, topY - 20, 100, 40);

        // Color Bands
        ctx.fillStyle = '#ef4444'; ctx.fillRect(resX - 35, topY - 20, 8, 40);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(resX - 15, topY - 20, 8, 40);
        ctx.fillStyle = '#eab308'; ctx.fillRect(resX + 5, topY - 20, 8, 40);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(resX + 25, topY - 20, 8, 40);

        ctx.fillStyle = isBurned ? '#f43f5e' : '#f8fafc';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${resistance} Ω`, resX - 15, topY + 35);

        // Burnout Effect (Smoke & Spark)
        if (isBurned) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.fillText('💥 BURNED OUT', resX - 45, topY - 30);

            if (Math.random() < 0.4) {
                this.smokeParticles.push({
                    x: resX + (Math.random() * 60 - 30),
                    y: topY - 20,
                    r: Math.random() * 8 + 4,
                    opacity: 1.0
                });
            }
        }

        // Draw Smoke
        for (let i = 0; i < this.smokeParticles.push; i++) {}
        this.smokeParticles.forEach((p, idx) => {
            p.y -= 2;
            p.opacity -= 0.02;
            ctx.fillStyle = `rgba(148, 163, 184, ${Math.max(0, p.opacity)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            if (p.opacity <= 0) this.smokeParticles.splice(idx, 1);
        });

        // 3. Light Bulb Component (Right Side)
        const bulbY = (topY + bottomY) / 2;
        ctx.beginPath();
        ctx.arc(rightX, bulbY, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Glow Effect based on Current
        if (!isBurned && current > 0) {
            const glowRadius = Math.min(80, current * 200);
            const glow = ctx.createRadialGradient(rightX, bulbY, 5, rightX, bulbY, glowRadius);
            glow.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
            glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(rightX, bulbY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Digital Ammeter Display (Bottom Center)
        const ammeterX = (leftX + rightX) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ammeterX - 60, bottomY - 25, 120, 50);
        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(ammeterX - 60, bottomY - 25, 120, 50);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`A: ${current.toFixed(3)} A`, ammeterX - 50, bottomY + 5);
    }
}
