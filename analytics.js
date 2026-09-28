/**
 * Concept Mastery Radar Chart & Learning Analytics Engine
 */

class AnalyticsEngine {
    static renderMasteryRadar(canvasId, masteryData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.clientWidth || 400;
        const h = canvas.height = canvas.clientHeight || 350;

        ctx.clearRect(0, 0, w, h);

        const centerX = w / 2;
        const centerY = h / 2 + 10;
        const radius = Math.min(w, h) * 0.35;

        const metrics = ['Precision', 'Safety', 'Math', 'Speed', 'Analysis'];

        // Aggregate score across subjects or default
        let scores = [75, 85, 80, 70, 75];
        if (masteryData && masteryData.length > 0) {
            const m = masteryData[0];
            scores = [m.precision_score, m.safety_score, m.math_score, m.speed_score, m.analysis_score];
        }

        const numAxes = metrics.length;
        const angleStep = (Math.PI * 2) / numAxes;

        // Draw Concentric Web Rings (20%, 40%, 60%, 80%, 100%)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let level = 1; level <= 5; level++) {
            const r = (level / 5) * radius;
            ctx.beginPath();
            for (let i = 0; i < numAxes; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const ax = centerX + r * Math.cos(angle);
                const ay = centerY + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(ax, ay);
                else ctx.lineTo(ax, ay);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw Axis Spoke Lines & Labels
        ctx.strokeStyle = '#475569';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';

        for (let i = 0; i < numAxes; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const ax = centerX + radius * Math.cos(angle);
            const ay = centerY + radius * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(ax, ay);
            ctx.stroke();

            // Label Offset
            const lx = centerX + (radius + 20) * Math.cos(angle);
            const ly = centerY + (radius + 20) * Math.sin(angle);
            ctx.textAlign = 'center';
            ctx.fillText(metrics[i], lx, ly);
        }

        // Plot Filled Polygon for Scores
        ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        ctx.beginPath();

        scores.forEach((val, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const r = (val / 100) * radius;
            const px = centerX + r * Math.cos(angle);
            const py = centerY + r * Math.sin(angle);

            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Nodes
        scores.forEach((val, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const r = (val / 100) * radius;
            const px = centerX + r * Math.cos(angle);
            const py = centerY + r * Math.sin(angle);

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
