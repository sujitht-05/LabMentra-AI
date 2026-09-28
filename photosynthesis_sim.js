/**
 * Plant Photosynthesis Interactive Canvas Simulation
 */

class PhotosynthesisSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.bubbles = [];
        this.animFrame = null;
    }

    init(state) {
        this.state = state;
        this.bubbles = [];
        this.startAnimation();
    }

    updateState(newState) {
        this.state = newState;
    }

    startAnimation() {
        const loop = () => {
            this.updateBubbles();
            this.draw();
            this.animFrame = requestAnimationFrame(loop);
        };
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = requestAnimationFrame(loop);
    }

    updateBubbles() {
        if (!this.state) return;
        const rate = this.state.bubbles_per_min || 0;

        if (rate > 0 && Math.random() < (rate / 300)) {
            const centerX = this.canvas.width * 0.55;
            this.bubbles.push({
                x: centerX + (Math.random() * 20 - 10),
                y: 340,
                r: Math.random() * 3 + 2,
                speed: Math.random() * 1.5 + 1.0
            });
        }

        for (let i = 0; i < this.bubbles.length; i++) {
            this.bubbles[i].y -= this.bubbles[i].speed;
            if (this.bubbles[i].y < 180) {
                this.bubbles.splice(i, 1);
                i--;
            }
        }
    }

    draw() {
        const w = this.canvas.width = this.canvas.clientWidth || 800;
        const h = this.canvas.height = this.canvas.clientHeight || 500;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, w, h);

        if (!this.state) return;

        const distance = this.state.light_distance_cm || 30.0;
        const color = this.state.light_color || 'White';
        const damaged = this.state.plant_thermal_damage;

        // Lamp Position (Left Side, distance controls X position)
        const minLampX = 80;
        const maxLampX = 260;
        const lampX = minLampX + (distance / 100) * (maxLampX - minLampX);
        const lampY = 240;

        // Beaker Position (Right Center)
        const beakerX = w * 0.6;
        const beakerY = 160;
        const beakerW = 140;
        const beakerH = 220;

        // Light Beam
        let beamColor = 'rgba(255, 255, 255, 0.2)';
        if (color === 'Red') beamColor = 'rgba(239, 68, 68, 0.25)';
        else if (color === 'Blue') beamColor = 'rgba(59, 130, 246, 0.25)';
        else if (color === 'Green') beamColor = 'rgba(16, 185, 129, 0.25)';

        ctx.fillStyle = beamColor;
        ctx.beginPath();
        ctx.moveTo(lampX + 30, lampY - 20);
        ctx.lineTo(beakerX - 10, beakerY);
        ctx.lineTo(beakerX - 10, beakerY + beakerH);
        ctx.lineTo(lampX + 30, lampY + 20);
        ctx.closePath();
        ctx.fill();

        // Lamp Apparatus
        ctx.fillStyle = '#334155';
        ctx.fillRect(lampX - 40, lampY - 30, 60, 60);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(lampX + 20, lampY, 16, 0, Math.PI * 2);
        ctx.fill();

        // Beaker Glass
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(beakerX, beakerY, beakerW, beakerH);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);

        // Elodea Plant
        const plantStemX = beakerX + beakerW / 2;
        ctx.strokeStyle = damaged ? '#78350f' : '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(plantStemX, beakerY + beakerH - 10);
        ctx.lineTo(plantStemX, beakerY + 100);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = damaged ? '#92400e' : '#059669';
        for (let y = beakerY + 120; y < beakerY + beakerH - 20; y += 25) {
            ctx.beginPath();
            ctx.ellipse(plantStemX - 15, y, 12, 5, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(plantStemX + 15, y, 12, 5, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inverted Funnel & Collection Tube
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(plantStemX - 12, beakerY - 30, 24, 100);

        // Floating Bubbles
        ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
        this.bubbles.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // O2 Bubble Rate Counter Text
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(`O₂ Rate: ${this.state.bubbles_per_min || 0} bubbles/min`, beakerX - 20, beakerY - 45);
    }
}
