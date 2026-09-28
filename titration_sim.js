/**
 * Acid-Base Titration Interactive Canvas Simulation
 */

class TitrationSimulation {
    constructor(canvasId) {
        self = this;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.animFrame = null;
        this.phHistory = [];
        this.flowRate = 'off'; // 'off', 'drop', 'fast'
    }

    init(state) {
        this.state = state;
        this.phHistory = [{ vol: state.naoh_volume_added_ml, ph: state.current_ph }];
        this.startAnimation();
    }

    updateState(newState) {
        this.state = newState;
        if (newState.naoh_volume_added_ml !== undefined && newState.current_ph !== undefined) {
            this.phHistory.push({ vol: newState.naoh_volume_added_ml, ph: newState.current_ph });
        }
    }

    setFlowRate(rate) {
        this.flowRate = rate;
    }

    startAnimation() {
        const loop = () => {
            this.draw();
            this.updateDrops();
            this.animFrame = requestAnimationFrame(loop);
        };
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = requestAnimationFrame(loop);
    }

    updateDrops() {
        if (this.flowRate === 'drop' && Math.random() < 0.15) {
            this.drops.push({ y: 240, opacity: 1.0 });
        } else if (this.flowRate === 'fast' && Math.random() < 0.6) {
            this.drops.push({ y: 240, opacity: 1.0 });
        }

        for (let i = 0; i < this.drops.length; i++) {
            this.drops[i].y += 6;
            if (this.drops[i].y > 360) {
                this.drops.splice(i, 1);
                i--;
            }
        }
    }

    draw() {
        const w = this.canvas.width = this.canvas.clientWidth || 800;
        const h = this.canvas.height = this.canvas.clientHeight || 500;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        const centerX = w * 0.4;

        // Draw Stand Base and Rod
        ctx.fillStyle = '#334155';
        ctx.fillRect(centerX - 100, h - 30, 200, 15);
        ctx.fillRect(centerX - 70, 40, 12, h - 70);

        // Clamp holding Burette
        ctx.fillStyle = '#64748b';
        ctx.fillRect(centerX - 70, 100, 60, 10);
        ctx.fillRect(centerX - 70, 200, 60, 10);

        // Burette Glass Tube
        const buretteX = centerX - 15;
        const buretteY = 50;
        const buretteW = 30;
        const buretteH = 180;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(buretteX, buretteY, buretteW, buretteH);

        // NaOH Liquid inside Burette (height decreases as volume added)
        const volAdded = this.state ? this.state.naoh_volume_added_ml : 0;
        const maxVol = 50.0;
        const fillRatio = Math.max(0, 1 - (volAdded / maxVol));
        const liquidH = (buretteH - 10) * fillRatio;

        ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.fillRect(buretteX + 2, buretteY + buretteH - liquidH - 2, buretteW - 4, liquidH);

        // Burette Ticks
        ctx.fillStyle = '#cbd5e1';
        for (let i = 0; i <= 10; i++) {
            const tickY = buretteY + 10 + i * 16;
            ctx.fillRect(buretteX + 2, tickY, 8, 1);
        }

        // Stopcock Valve
        ctx.fillStyle = this.flowRate === 'off' ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(centerX, buretteY + buretteH + 10, 8, 0, Math.PI * 2);
        ctx.fill();

        // Nozzle Tip
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(centerX - 3, buretteY + buretteH + 18, 6, 20);

        // Falling Drops
        ctx.fillStyle = '#38bdf8';
        this.drops.forEach(drop => {
            ctx.beginPath();
            ctx.arc(centerX, drop.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Erlenmeyer Flask
        const flaskY = 350;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, flaskY);
        ctx.lineTo(centerX + 15, flaskY);
        ctx.lineTo(centerX + 60, flaskY + 90);
        ctx.quadraticCurveTo(centerX + 65, flaskY + 105, centerX + 50, flaskY + 105);
        ctx.lineTo(centerX - 50, flaskY + 105);
        ctx.quadraticCurveTo(centerX - 65, flaskY + 105, centerX - 60, flaskY + 90);
        ctx.closePath();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Flask Liquid Color
        let liquidColor = 'rgba(241, 245, 249, 0.3)'; // transparent/clear
        if (this.state) {
            if (this.state.flask_color === 'faint_pink') {
                liquidColor = 'rgba(244, 114, 182, 0.6)'; // faint pink
            } else if (this.state.flask_color === 'dark_magenta') {
                liquidColor = 'rgba(190, 24, 93, 0.85)'; // dark magenta
            }
        }

        ctx.fillStyle = liquidColor;
        ctx.beginPath();
        ctx.moveTo(centerX - 35, flaskY + 50);
        ctx.lineTo(centerX + 35, flaskY + 50);
        ctx.lineTo(centerX + 55, flaskY + 95);
        ctx.lineTo(centerX - 55, flaskY + 95);
        ctx.closePath();
        ctx.fill();

        // Live pH Overlay Graph (Right Side)
        this.drawPHGraph(ctx, w - 320, 40, 280, 200);
    }

    drawPHGraph(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#0ea5e9';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('pH Titration Curve', x + 10, y + 20);

        // Axes
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(x + 30, y + 30);
        ctx.lineTo(x + 30, y + h - 25);
        ctx.lineTo(x + w - 10, y + h - 25);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('pH', x + 5, y + 35);
        ctx.fillText('Vol NaOH (mL)', x + w - 80, y + h - 10);

        if (this.phHistory.length < 2) return;

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxVol = 50.0;
        this.phHistory.forEach((pt, idx) => {
            const px = x + 30 + (pt.vol / maxVol) * (w - 45);
            const py = (y + h - 25) - (pt.ph / 14.0) * (h - 60);

            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
    }
}
