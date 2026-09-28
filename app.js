/**
 * LabMentra AI Main Frontend SPA Controller & Web Audio Synthesizer
 * Dual-Mode Engine: Seamlessly supports Python/Flask/SQLite backend API
 * and direct client-side offline execution fallback!
 */

class SoundEffects {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    playClick() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch(e){}
    }

    playDrop() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        } catch(e){}
    }

    playWarning() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch(e){}
    }
}

const sfx = new SoundEffects();

class LabMentraApp {
    constructor() {
        this.currentSession = null;
        this.activeExpId = null;
        this.simInstance = null;
        this.experiments = [];
        this.stepLogs = [];
    }

    async init() {
        document.addEventListener('click', () => sfx.init(), { once: true });
        this.setupNavigation();
        await this.loadExperiments();
        await this.loadAnalytics();
        reportManager.initSignaturePad('signatureCanvas');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetView = e.target.dataset.view;
                if (!targetView) return;

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
                const sec = document.getElementById(`${targetView}View`);
                if (sec) sec.classList.add('active');

                if (targetView === 'analytics') this.loadAnalytics();
            });
        });
    }

    async loadExperiments() {
        try {
            const res = await fetch('/api/experiments');
            const data = await res.json();
            if (data.status === 'success') {
                this.experiments = data.experiments;
            } else {
                throw new Error("API fallback");
            }
        } catch (e) {
            // Offline/Static Fallback Data
            this.experiments = [
                {
                    id: 'chem_titration',
                    title: 'Acid-Base Titration (HCl + NaOH)',
                    subject: 'Chemistry',
                    description: 'Determine the unknown concentration of Hydrochloric Acid using Sodium Hydroxide standard solution and Phenolphthalein indicator.',
                    learning_outcomes: ['Stoichiometry & Molarity', 'Equivalence Point Identification', 'Volumetric Precision']
                },
                {
                    id: 'phys_pendulum',
                    title: 'Simple Pendulum & Gravitational Acceleration (g)',
                    subject: 'Physics',
                    description: 'Investigate the relationship between pendulum string length, mass, amplitude angle, and periodic time to calculate g on Earth, Moon, and Mars.',
                    learning_outcomes: ['Simple Harmonic Motion', 'Small Angle Approximation', 'Energy Conservation']
                },
                {
                    id: 'circ_ohms_law',
                    title: "Ohm's Law & Circuit Analysis (V = IR)",
                    subject: 'Electronics',
                    description: 'Construct DC circuits, measure voltage and current across varied resistors, and test component power dissipation limits.',
                    learning_outcomes: ['Ohm\'s Law V = IR', 'Resistor Power Rating', 'Short Circuit Rules']
                },
                {
                    id: 'bio_photosynthesis',
                    title: 'Plant Photosynthesis & Light Intensity',
                    subject: 'Biology',
                    description: 'Analyze oxygen gas bubble production rate of aquatic plants (Elodea) under varying light distances and color wavelengths.',
                    learning_outcomes: ['Inverse Square Law', 'Spectral Efficiency', 'Carbon Fixation']
                }
            ];
        }
        this.renderCatalog();
    }

    renderCatalog() {
        const grid = document.getElementById('experimentsGrid');
        if (!grid) return;

        let html = '';
        this.experiments.forEach(exp => {
            const badgeClass = `badge-${exp.subject.toLowerCase()}`;
            html += `
                <div class="exp-card">
                    <div>
                        <span class="exp-subject-badge ${badgeClass}">${exp.subject}</span>
                        <h3>${exp.title}</h3>
                        <p>${exp.description}</p>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">
                            <strong>Objectives:</strong> ${exp.learning_outcomes.slice(0, 2).join(', ')}
                        </div>
                        <button class="btn-launch" onclick="app.startExperiment('${exp.id}')">
                            🚀 Start Virtual Lab
                        </button>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    async startExperiment(expId, difficulty = 'Intermediate (Standard)') {
        sfx.playClick();
        this.activeExpId = expId;
        this.stepLogs = [];

        try {
            const res = await fetch('/api/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: 1, experiment_id: expId, difficulty: difficulty })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.currentSession = data.session;
            } else {
                throw new Error("Fallback local session");
            }
        } catch (e) {
            // Offline local state initialization
            this.currentSession = {
                session_id: `sess_local_${Date.now()}`,
                experiment_id: expId,
                difficulty: difficulty,
                state: this.getInitialStateLocal(expId)
            };
        }

        this.switchToWorkspace();
        this.setupSimulation();
        this.updateUI();
        this.addAIMessage(`👋 Welcome to ${expId} in ${difficulty} mode! AI mentor live telemetry monitoring active.`);
    }

    getInitialStateLocal(expId) {
        if (expId === 'chem_titration') {
            return { hcl_volume_ml: 25.0, hcl_molarity_true: 0.125, naoh_molarity: 0.100, indicator_added: false, naoh_volume_added_ml: 0.0, current_ph: 1.0, flask_color: 'transparent', equivalence_vol_ml: 31.25, safety_score: 100, accuracy_score: 100 };
        } else if (expId === 'phys_pendulum') {
            return { length_m: 1.0, mass_kg: 0.5, angle_deg: 10.0, planet: 'Earth', g_true: 9.81, num_swings_measured: 10, safety_score: 100, accuracy_score: 100 };
        } else if (expId === 'circ_ohms_law') {
            return { voltage_v: 5.0, resistance_ohm: 50.0, resistor_power_rating_w: 2.0, voltmeter_mode: 'parallel', ammeter_mode: 'series', circuit_closed: true, component_burned: false, current_a: 0.10, power_w: 0.5, safety_score: 100, accuracy_score: 100 };
        } else if (expId === 'bio_photosynthesis') {
            return { light_distance_cm: 30.0, light_color: 'White', co2_bicarbonate_added: true, bubbles_per_min: 24, plant_thermal_damage: false, safety_score: 100, accuracy_score: 100 };
        }
    }

    switchToWorkspace() {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById('workspaceView').classList.add('active');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    }

    setupSimulation() {
        const container = document.getElementById('simControlsContainer');
        const state = this.currentSession.state;

        if (this.activeExpId === 'chem_titration') {
            this.simInstance = new TitrationSimulation('simCanvas');
            this.simInstance.init(state);
            this.renderTitrationControls(container);
        } else if (this.activeExpId === 'phys_pendulum') {
            this.simInstance = new PendulumSimulation('simCanvas');
            this.simInstance.init(state);
            this.renderPendulumControls(container);
        } else if (this.activeExpId === 'circ_ohms_law') {
            this.simInstance = new CircuitSimulation('simCanvas');
            this.simInstance.init(state);
            this.renderCircuitControls(container);
        } else if (this.activeExpId === 'bio_photosynthesis') {
            this.simInstance = new PhotosynthesisSimulation('simCanvas');
            this.simInstance.init(state);
            this.renderPhotosynthesisControls(container);
        }
    }

    // Controls Renderers
    renderTitrationControls(container) {
        container.innerHTML = `
            <div class="control-group">
                <button class="btn-sec" onclick="app.sendAction('add_indicator', {})">🧪 Add Indicator</button>
            </div>
            <div class="control-group">
                <label>Burette Valve:</label>
                <button class="btn-sec" onclick="app.setValve('off')">🛑 Off</button>
                <button class="btn-sec" onclick="app.setValve('drop')">💧 Drop-by-Drop</button>
                <button class="btn-sec" onclick="app.setValve('fast')">🌊 Fast Flow</button>
            </div>
            <div class="control-group">
                <button class="btn-success" onclick="app.sendAction('record_endpoint', {})">🎯 Record Endpoint</button>
            </div>
        `;
    }

    setValve(rate) {
        sfx.playClick();
        if (this.simInstance) this.simInstance.setFlowRate(rate);

        this.sendAction('adjust_valve', { flow_rate: rate });

        if (rate !== 'off') {
            if (this.valveTimer) clearInterval(this.valveTimer);
            const interval = rate === 'drop' ? 800 : 200;
            const amount = rate === 'drop' ? 0.1 : 0.5;

            this.valveTimer = setInterval(() => {
                sfx.playDrop();
                this.sendAction('dispense_volume', { amount_ml: amount });
            }, interval);
        } else {
            if (this.valveTimer) clearInterval(this.valveTimer);
        }
    }

    renderPendulumControls(container) {
        container.innerHTML = `
            <div class="control-group">
                <label>Length (m):</label>
                <input type="range" min="0.2" max="2.0" step="0.1" value="${this.currentSession.state.length_m}" class="range-slider"
                    onchange="app.sendAction('set_length', { length_m: this.value })">
            </div>
            <div class="control-group">
                <label>Release Angle (°):</label>
                <input type="range" min="5" max="45" step="5" value="${this.currentSession.state.angle_deg}" class="range-slider"
                    onchange="app.sendAction('set_angle', { angle_deg: this.value })">
            </div>
            <div class="control-group">
                <label>Planet:</label>
                <select onchange="app.sendAction('set_planet', { planet: this.value })" style="background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 6px;">
                    <option value="Earth">🌍 Earth (9.81 m/s²)</option>
                    <option value="Moon">🌕 Moon (1.62 m/s²)</option>
                    <option value="Mars">🔴 Mars (3.71 m/s²)</option>
                    <option value="Jupiter">🪐 Jupiter (24.79 m/s²)</option>
                </select>
            </div>
            <div class="control-group">
                <button class="btn-success" onclick="app.sendAction('record_swings', { swings: 10, total_time_s: (2 * 3.14159 * Math.sqrt(app.currentSession.state.length_m / app.currentSession.state.g_true) * 10).toFixed(2) })">⏱️ Record 10 Swings</button>
            </div>
        `;
    }

    renderCircuitControls(container) {
        container.innerHTML = `
            <div class="control-group">
                <label>Voltage (V):</label>
                <input type="range" min="1" max="24" step="1" value="${this.currentSession.state.voltage_v}" class="range-slider"
                    oninput="app.sendAction('set_voltage', { voltage_v: this.value })">
            </div>
            <div class="control-group">
                <label>Resistance (Ω):</label>
                <input type="range" min="10" max="200" step="10" value="${this.currentSession.state.resistance_ohm}" class="range-slider"
                    oninput="app.sendAction('set_resistance', { resistance_ohm: this.value })">
            </div>
            <div class="control-group">
                <label>Voltmeter Connection:</label>
                <button class="btn-sec" onclick="app.sendAction('set_meter_connection', { voltmeter: 'parallel' })">Parallel (Correct)</button>
                <button class="btn-sec" onclick="app.sendAction('set_meter_connection', { voltmeter: 'series' })">Series (Fault)</button>
            </div>
        `;
    }

    renderPhotosynthesisControls(container) {
        container.innerHTML = `
            <div class="control-group">
                <label>Light Distance (cm):</label>
                <input type="range" min="4" max="100" step="2" value="${this.currentSession.state.light_distance_cm}" class="range-slider"
                    onchange="app.sendAction('set_distance', { distance_cm: this.value })">
            </div>
            <div class="control-group">
                <label>Color Filter:</label>
                <button class="btn-sec" onclick="app.sendAction('set_color_filter', { color: 'White' })">⚪ White</button>
                <button class="btn-sec" onclick="app.sendAction('set_color_filter', { color: 'Red' })">🔴 Red</button>
                <button class="btn-sec" onclick="app.sendAction('set_color_filter', { color: 'Blue' })">🔵 Blue</button>
                <button class="btn-sec" onclick="app.sendAction('set_color_filter', { color: 'Green' })">🟢 Green</button>
            </div>
            <div class="control-group">
                <button class="btn-success" onclick="app.sendAction('measure_bubbles', { timer_min: 1.0 })">⏱️ Measure 1 Min Bubble Rate</button>
            </div>
        `;
    }

    async sendAction(actionType, payload) {
        if (!this.currentSession) return;

        try {
            const res = await fetch(`/api/sessions/${this.currentSession.session_id}/step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action_type: actionType,
                    action_payload: payload,
                    current_state: this.currentSession.state
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.handleStepResult(data.result, actionType, payload);
                return;
            }
        } catch (e) {
            // Local Step Processing Fallback
            const res = this.processStepLocal(actionType, payload);
            this.handleStepResult(res, actionType, payload);
        }
    }

    handleStepResult(r, actionType, payload) {
        this.currentSession.state = r.updated_state;
        if (this.simInstance) this.simInstance.updateState(r.updated_state);

        this.stepLogs.push({
            step_index: this.stepLogs.length + 1,
            action_type: actionType,
            action_payload: payload,
            is_error: r.is_error ? 1 : 0,
            ai_feedback: r.ai_feedback
        });

        this.updateScores(r.current_safety_score, r.current_accuracy_score);
        this.addAIMessage(r.ai_feedback, r.is_error);

        if (r.is_error) sfx.playWarning();
        this.updateTelemetryTable(r.updated_state);
    }

    processStepLocal(actionType, payload) {
        let state = { ...this.currentSession.state };
        let is_error = false;
        let ai_feedback = "Action executed.";
        let safetyPen = 0;
        let accuracyPen = 0;

        if (this.activeExpId === 'chem_titration') {
            if (actionType === 'add_indicator') {
                state.indicator_added = true;
                ai_feedback = "✓ Phenolphthalein indicator added to flask.";
            } else if (actionType === 'dispense_volume') {
                const amt = payload.amount_ml || 0.1;
                state.naoh_volume_added_ml = parseFloat((state.naoh_volume_added_ml + amt).toFixed(2));
                if (!state.indicator_added) {
                    is_error = true;
                    ai_feedback = "⚠️ Warning: NaOH dispensed without phenolphthalein indicator!";
                    safetyPen = 10;
                } else if (state.naoh_volume_added_ml > 31.45) {
                    is_error = true;
                    state.flask_color = 'dark_magenta';
                    ai_feedback = "🚨 Solution turned dark magenta! Endpoint over-shot.";
                    accuracyPen = 20;
                } else if (state.naoh_volume_added_ml >= 31.05) {
                    state.flask_color = 'faint_pink';
                    ai_feedback = "🌸 Solution faint pink. Perfect equivalence endpoint!";
                }
            } else if (actionType === 'record_endpoint') {
                ai_feedback = `🎯 Endpoint recorded at ${state.naoh_volume_added_ml} mL. Calculated HCl Molarity = 0.125 M.`;
            }
        } else if (this.activeExpId === 'phys_pendulum') {
            if (actionType === 'set_angle') {
                state.angle_deg = parseFloat(payload.angle_deg);
                if (state.angle_deg > 15) {
                    is_error = true;
                    ai_feedback = "⚠️ Release angle > 15° violates small-angle approximation!";
                    accuracyPen = 15;
                } else ai_feedback = `✓ Release angle set to ${state.angle_deg}°.`;
            } else if (actionType === 'set_length') {
                state.length_m = parseFloat(payload.length_m);
                ai_feedback = `✓ String length set to ${state.length_m} m.`;
            } else if (actionType === 'set_planet') {
                state.planet = payload.planet;
                const gMap = { Earth: 9.81, Moon: 1.62, Mars: 3.71, Jupiter: 24.79 };
                state.g_true = gMap[payload.planet] || 9.81;
                ai_feedback = `🪐 Gravity set to ${state.planet} (${state.g_true} m/s²).`;
            } else if (actionType === 'record_swings') {
                ai_feedback = `⏱️ Recorded 10 swings. Periodic Time T = ${(2 * Math.PI * Math.sqrt(state.length_m / state.g_true)).toFixed(2)}s.`;
            }
        } else if (this.activeExpId === 'circ_ohms_law') {
            if (actionType === 'set_voltage') {
                state.voltage_v = parseFloat(payload.voltage_v);
            } else if (actionType === 'set_resistance') {
                state.resistance_ohm = parseFloat(payload.resistance_ohm);
            } else if (actionType === 'set_meter_connection') {
                if (payload.voltmeter === 'series') {
                    is_error = true;
                    ai_feedback = "⚠️ Voltmeter connected in series blocks current flow!";
                    accuracyPen = 15;
                }
            }
            state.current_a = parseFloat((state.voltage_v / state.resistance_ohm).toFixed(3));
            state.power_w = parseFloat((state.voltage_v * state.current_a).toFixed(2));
            if (state.power_w > 2.0) {
                is_error = true;
                state.component_burned = true;
                ai_feedback = "💥 Power > 2.0 W burned resistor!";
                safetyPen = 30;
            } else if (!is_error) ai_feedback = `⚡ V = ${state.voltage_v}V, I = ${state.current_a}A, Power = ${state.power_w}W.`;
        } else if (this.activeExpId === 'bio_photosynthesis') {
            if (actionType === 'set_distance') {
                state.light_distance_cm = parseFloat(payload.distance_cm);
                if (state.light_distance_cm < 5) {
                    is_error = true;
                    state.plant_thermal_damage = true;
                    state.bubbles_per_min = 0;
                    ai_feedback = "🚨 Lamp < 5cm overheated plant enzymes!";
                    safetyPen = 20;
                } else {
                    state.plant_thermal_damage = false;
                    state.bubbles_per_min = Math.round(60 * (10000 / (state.light_distance_cm ** 2)) / ((10000 / (state.light_distance_cm ** 2)) + 10));
                    ai_feedback = `✓ Light distance ${state.light_distance_cm} cm.`;
                }
            } else if (actionType === 'set_color_filter') {
                state.light_color = payload.color;
                if (payload.color === 'Green') ai_feedback = "💡 Green light filter applied. Photosynthesis rate reduced.";
                else ai_feedback = `✓ Filter set to ${payload.color}.`;
            } else if (actionType === 'measure_bubbles') {
                ai_feedback = `🌿 Recorded ${state.bubbles_per_min} O₂ bubbles/min.`;
            }
        }

        const safe = Math.max(0, (state.safety_score || 100) - safetyPen);
        const acc = Math.max(0, (state.accuracy_score || 100) - accuracyPen);
        state.safety_score = safe;
        state.accuracy_score = acc;

        return {
            updated_state: state,
            is_error: is_error,
            ai_feedback: ai_feedback,
            current_safety_score: safe,
            current_accuracy_score: acc
        };
    }

    updateScores(safety, accuracy) {
        document.getElementById('safetyScoreDisplay').innerText = `${Math.round(safety)}%`;
        document.getElementById('accuracyScoreDisplay').innerText = `${Math.round(accuracy)}%`;
    }

    addAIMessage(msg, isError = false) {
        const feed = document.getElementById('aiFeedContainer');
        if (!feed) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const border = isError ? 'border-left: 3px solid #f43f5e;' : 'border-left: 3px solid #0ea5e9;';

        const div = document.createElement('div');
        div.className = 'ai-msg';
        div.style = border;
        div.innerHTML = `<span style="font-size: 10px; color: #64748b;">[${timeStr}]</span> ${msg}`;
        feed.appendChild(div);
        feed.scrollTop = feed.scrollHeight;
    }

    updateTelemetryTable(state) {
        const tbl = document.getElementById('telemetryTableBody');
        if (!tbl) return;

        let html = '';
        for (const [k, v] of Object.entries(state)) {
            if (typeof v !== 'object') {
                html += `<tr><td>${k.replace(/_/g, ' ')}</td><td>${v}</td></tr>`;
            }
        }
        tbl.innerHTML = html;
    }

    async openCompleteModal() {
        document.getElementById('completeModal').classList.add('active');
    }

    async finalizeExperiment() {
        const sigData = reportManager.getSignatureDataURL();

        try {
            const res = await fetch(`/api/sessions/${this.currentSession.session_id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    final_state: this.currentSession.state,
                    student_signature: sigData
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                document.getElementById('completeModal').classList.remove('active');
                this.showToast("Experiment completed! Lab record generated.", "success");
                window.open(`/report/${data.summary.report_id}/print`, '_blank');
                this.loadAnalytics();
                return;
            }
        } catch (e) {
            // Local Print Window Fallback
            document.getElementById('completeModal').classList.remove('active');
            this.showToast("Local Lab Record generated!", "success");
            const w = window.open('', '_blank');
            w.document.write(`
                <html><head><title>Lab Record - ${this.activeExpId}</title></head>
                <body style="font-family: sans-serif; padding: 40px;">
                    <h1>🧪 LabMentra AI — Official Academic Virtual Lab Record</h1>
                    <p><strong>Student:</strong> Alex Morgan | <strong>Experiment:</strong> ${this.activeExpId}</p>
                    <hr>
                    <h3>Observations & Data:</h3>
                    <pre>${JSON.stringify(this.currentSession.state, null, 2)}</pre>
                    <h3>Digital Signature:</h3>
                    <img src="${sigData}">
                </body></html>
            `);
        }
    }

    async openReplayModal() {
        if (!this.currentSession) return;
        document.getElementById('replayModal').classList.add('active');

        try {
            const res = await fetch(`/api/sessions/${this.currentSession.session_id}/replay`);
            const data = await res.json();
            if (data.status === 'success') {
                replayEngine.loadLogs(data.step_logs, (log) => {
                    this.addAIMessage(`[Replay Step ${log.step_index}] ${log.action_type}: ${log.ai_feedback}`);
                });
                return;
            }
        } catch (e) {}

        // Local Replay Logs
        replayEngine.loadLogs(this.stepLogs, (log) => {
            this.addAIMessage(`[Replay Step ${log.step_index}] ${log.action_type}: ${log.ai_feedback}`);
        });
    }

    async openWhatIfModal() {
        if (!this.currentSession) return;
        document.getElementById('whatifModal').classList.add('active');
        this.runWhatIfSim();
    }

    async runWhatIfSim() {
        let params = {};
        if (this.activeExpId === 'chem_titration') {
            params.naoh_molarity = document.getElementById('whatifParamSlider').value;
        } else if (this.activeExpId === 'phys_pendulum') {
            params.planet = document.getElementById('whatifParamSelect').value;
        } else if (this.activeExpId === 'circ_ohms_law') {
            params.resistance_ohm = document.getElementById('whatifParamSlider').value;
        } else if (this.activeExpId === 'bio_photosynthesis') {
            params.light_color = document.getElementById('whatifParamSelect').value;
        }

        WhatIfSandbox.runSimulation(this.currentSession.session_id, this.activeExpId, this.currentSession.state, params);
    }

    async loadAnalytics() {
        try {
            const res = await fetch('/api/analytics?user_id=1');
            const data = await res.json();
            if (data.status === 'success') {
                AnalyticsEngine.renderMasteryRadar('masteryRadarCanvas', data.concept_mastery);
                this.renderRecentReports(data.recent_reports);
                return;
            }
        } catch (e) {}

        AnalyticsEngine.renderMasteryRadar('masteryRadarCanvas', []);
        this.renderRecentReports([]);
    }

    renderRecentReports(reports) {
        const container = document.getElementById('recentReportsList');
        if (!container) return;

        if (!reports || reports.length === 0) {
            container.innerHTML = '<p style="color: #64748b;">No lab records stored yet. Perform an experiment and click "Generate Lab Record"!</p>';
            return;
        }

        let html = '';
        reports.forEach(r => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #1e293b; border-radius: 8px; margin-bottom: 8px;">
                    <div>
                        <strong style="color: #f8fafc;">${r.title}</strong>
                        <div style="font-size: 11px; color: #94a3b8;">Grade: ${r.ai_grade} | ${r.created_at}</div>
                    </div>
                    <a href="/report/${r.id}/print" target="_blank" class="btn-sec" style="text-decoration: none;">📄 View Report</a>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    updateUI() {
        document.getElementById('expTitleDisplay').innerText = this.activeExpId;
        document.getElementById('difficultyDisplay').innerText = this.currentSession.difficulty;
        this.updateScores(this.currentSession.state.safety_score || 100, 100);
        this.updateTelemetryTable(this.currentSession.state);
    }

    showToast(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✅'}</span> <span>${msg}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }
}

const app = new LabMentraApp();
window.addEventListener('DOMContentLoaded', () => app.init());
