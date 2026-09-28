/**
 * What-If Simulation Sandbox Controller
 */

class WhatIfSandbox {
    static async runSimulation(sessionId, expId, sessionState, params) {
        try {
            const resp = await fetch(`/api/sessions/${sessionId}/whatif`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    experiment_id: expId,
                    session_state: sessionState,
                    params: params
                })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                this.renderWhatIfChart(expId, data.whatif);
                return data.whatif;
            }
        } catch (e) {
            console.error("What-If simulation error:", e);
        }
        return null;
    }

    static renderWhatIfChart(expId, whatifData) {
        const canvas = document.getElementById('whatifChartCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.clientWidth || 700;
        const h = canvas.height = canvas.clientHeight || 300;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#0ea5e9';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(`What-If Simulation Insight: ${whatifData.insight || ''}`, 20, 25);

        // Simple overlay curve drawing
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(40, 50);
        ctx.lineTo(40, h - 35);
        ctx.lineTo(w - 20, h - 35);
        ctx.stroke();

        let points = [];
        if (expId === 'chem_titration') points = whatifData.titration_curve || [];
        else if (expId === 'phys_pendulum') points = whatifData.curve || [];
        else if (expId === 'circ_ohms_law') points = whatifData.v_i_curve || [];
        else if (expId === 'bio_photosynthesis') points = whatifData.curve || [];

        if (points.length < 2) return;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const stepX = (w - 70) / (points.length - 1);
        points.forEach((pt, idx) => {
            const x = 40 + idx * stepX;
            let val = 0;
            if (expId === 'chem_titration') val = pt.ph / 14.0;
            else if (expId === 'phys_pendulum') val = pt.period_s / 5.0;
            else if (expId === 'circ_ohms_law') val = pt.current_a / 1.0;
            else if (expId === 'bio_photosynthesis') val = pt.bubbles_per_min / 60.0;

            const y = (h - 35) - val * (h - 90);

            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    }
}
