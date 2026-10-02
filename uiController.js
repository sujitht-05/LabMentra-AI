/**
 * LabMentra AI - UI Controller & Equipment Canvas Renderer
 */

class UIController {
  constructor() {
    this.currentView = 'dashboard';
    this.activeExpId = null;
    this.lastAttemptData = null;
  }

  init() {
    this.bindNavigation();
    this.bindDifficultyControls();
    this.bindThemeToggle();
    this.renderDashboard();
    this.renderConceptMatrix();
    
    // Bind LabEngine events
    labEngine.onStateUpdated = (state) => this.updateWorkbenchUI(state);
    labEngine.onErrorDetected = (evalResult) => this.showErrorDiagnosticModal(evalResult);
    labEngine.onGuidanceUpdated = (guidance) => this.updateGuidanceBox(guidance);
  }

  // --- View Navigation ---
  bindNavigation() {
    document.querySelectorAll('.nav-item button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewTarget = btn.getAttribute('data-view');
        this.switchView(viewTarget);
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item button[data-view="${viewName}"]`);
    if (activeNav) activeNav.parentElement.classList.add('active');

    const activePage = document.getElementById(`view-${viewName}`);
    if (activePage) activePage.classList.add('active');

    // Header title update
    const titleElem = document.getElementById('header-title-text');
    if (titleElem) {
      const titles = {
        dashboard: 'Lab Dashboard & Interactive Experiments',
        workbench: 'Virtual Laboratory Workbench',
        analytics: 'Student Learning Analytics & Performance Insights',
        mastery: 'Concept Mastery & Skill Competency Matrix',
        recommendations: 'Personalized Next-Experiment Recommendations'
      };
      titleElem.textContent = titles[viewName] || 'LabMentra AI';
    }

    if (viewName === 'analytics') {
      analyticsEngine.renderAnalytics(
        { radarCanvas: 'radar-chart-canvas', lineCanvas: 'line-chart-canvas', doughnutCanvas: 'doughnut-chart-canvas' },
        aiAdvisor.studentProfile
      );
    } else if (viewName === 'mastery') {
      this.renderConceptMatrix();
    } else if (viewName === 'recommendations') {
      this.renderRecommendationsView();
    }
  }

  bindDifficultyControls() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const diff = btn.getAttribute('data-diff');
        labEngine.setDifficulty(diff);
      });
    });
  }

  bindThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        toggleBtn.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
  }

  // --- Render Dashboard ---
  renderDashboard() {
    const grid = document.getElementById('experiment-cards-grid');
    if (!grid) return;

    grid.innerHTML = EXPERIMENTS_DATA.map(exp => `
      <div class="card exp-card">
        <div>
          <div class="exp-header">
            <div class="exp-icon"><i class="fas ${exp.icon}"></i></div>
            <span class="badge badge-primary">${exp.subject}</span>
          </div>
          <h3 style="font-size: 16px; margin-bottom: 8px;">${exp.title}</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px;">${exp.description}</p>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; display: flex; gap: 15px;">
            <span><i class="far fa-clock"></i> ~${exp.estimatedTimeMin} mins</span>
            <span><i class="fas fa-layer-group"></i> ${exp.targetConcepts.length} Concepts</span>
          </div>
          <button class="btn btn-primary" style="width: 100%;" onclick="uiController.startExperiment('${exp.id}')">
            <i class="fas fa-play"></i> Launch Virtual Lab
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- Start Experiment Session ---
  startExperiment(expId) {
    const expConfig = EXPERIMENTS_DATA.find(e => e.id === expId);
    if (!expConfig) return;

    this.activeExpId = expId;
    const currentDiff = document.querySelector('.difficulty-btn.active')?.getAttribute('data-diff') || 'Novice';

    labEngine.loadExperiment(expConfig, currentDiff);
    this.switchView('workbench');
    this.setupWorkbenchControls(expConfig);
  }

  // --- Setup Dynamic Equipment & Control Panel ---
  setupWorkbenchControls(expConfig) {
    const titleElem = document.getElementById('workbench-exp-title');
    if (titleElem) titleElem.textContent = expConfig.title;

    const controlPanel = document.getElementById('workbench-controls-container');
    if (!controlPanel) return;

    if (expConfig.id === 'exp_titration') {
      controlPanel.innerHTML = `
        <div class="card" style="margin-bottom: 15px; padding: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 10px;">🧪 Equipment Actions</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-outline" onclick="labEngine.performAction('add_indicator', {drops: 3})">
              <i class="fas fa-eye-dropper"></i> Add Phenolphthalein (3 Drops)
            </button>
            <button class="btn btn-outline" onclick="labEngine.performAction('toggle_stirrer')">
              <i class="fas fa-sync-alt"></i> Toggle Magnetic Stirrer
            </button>
          </div>
        </div>

        <div class="card" style="margin-bottom: 15px; padding: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 10px;">💧 Burette Stopcock Control</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-primary" onclick="labEngine.performAction('add_naoh', {addedVolume: 0.2, rate: 'dropwise'})">
              <i class="fas fa-tint"></i> Add Dropwise (+0.2 mL)
            </button>
            <button class="btn btn-primary" onclick="labEngine.performAction('add_naoh', {addedVolume: 2.0, rate: 'fast'})">
              <i class="fas fa-stream"></i> Fast Addition (+2.0 mL)
            </button>
          </div>
        </div>

        <div class="card" style="padding: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 10px;">📋 Observations</h4>
          <button class="btn btn-success" style="width:100%; margin-bottom:10px;" onclick="labEngine.performAction('log_reading')">
            <i class="fas fa-bookmark"></i> Record Burette Reading
          </button>
          <button class="btn btn-danger" style="width:100%;" onclick="uiController.finishExperimentSession()">
            <i class="fas fa-check-circle"></i> Complete & Generate Report
          </button>
        </div>
      `;
    } else if (expConfig.id === 'exp_ohms_law') {
      controlPanel.innerHTML = `
        <div class="card" style="margin-bottom: 15px; padding: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 10px;">⚡ Circuit Controls</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-outline" onclick="labEngine.performAction('toggle_switch')">
              <i class="fas fa-power-off"></i> Toggle Knife Switch
            </button>
            <label style="font-size:12px; font-weight:bold;">Select Resistor:</label>
            <select id="resistor-select" class="btn btn-outline" onchange="labEngine.performAction('select_resistor', {resistance: this.value})">
              <option value="100">100 Ω (Standard)</option>
              <option value="50">50 Ω (Medium)</option>
              <option value="10">10 Ω (Low Resistance / Thermal Hazard)</option>
            </select>
          </div>
        </div>

        <div class="card" style="margin-bottom: 15px; padding: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">🎛️ Power Supply Voltage Dial</h4>
          <input type="range" id="voltage-slider" min="0" max="20" step="1" value="0" style="width:100%; margin-bottom:8px;" oninput="document.getElementById('v-slider-val').textContent = this.value + 'V'; labEngine.performAction('set_voltage', {voltage: this.value})">
          <div style="font-size:13px; text-align:center; font-weight:bold;">Voltage Set: <span id="v-slider-val">0V</span></div>
        </div>

        <div class="card" style="padding: 15px;">
          <button class="btn btn-success" style="width:100%; margin-bottom:10px;" onclick="labEngine.performAction('log_reading')">
            <i class="fas fa-bookmark"></i> Log V-I Reading
          </button>
          <button class="btn btn-danger" style="width:100%;" onclick="uiController.finishExperimentSession()">
            <i class="fas fa-check-circle"></i> Complete Session
          </button>
        </div>
      `;
    } else {
      controlPanel.innerHTML = `
        <div class="card" style="padding: 15px;">
          <button class="btn btn-success" style="width:100%; margin-bottom:10px;" onclick="labEngine.performAction('log_reading')">
            <i class="fas fa-bookmark"></i> Record Data Point
          </button>
          <button class="btn btn-danger" style="width:100%;" onclick="uiController.finishExperimentSession()">
            <i class="fas fa-check-circle"></i> Complete Session
          </button>
        </div>
      `;
    }
  }

  // --- Render Dynamic Visualizer Equipment Canvas ---
  updateWorkbenchUI(state) {
    const stage = document.getElementById('visualizer-stage-area');
    if (!stage) return;

    if (this.activeExpId === 'exp_titration') {
      const buretteHeightPct = ((50 - state.buretteLevel) / 50) * 100;
      stage.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; position:relative; width:100%; height:100%;">
          <!-- Burette Visualizer -->
          <div style="width: 24px; height: 220px; border: 2px solid #64748b; border-radius: 4px; position: relative; background: rgba(241, 245, 249, 0.4); overflow: hidden;">
            <div style="position: absolute; bottom: 0; width: 100%; height: ${buretteHeightPct}%; background: rgba(59, 130, 246, 0.6); transition: height 0.3s ease;"></div>
          </div>
          <div style="font-size:12px; font-weight:bold; color:var(--text-muted); margin-top:4px;">
            Burette NaOH Level: ${state.buretteLevel.toFixed(1)} / 50.0 mL
          </div>

          <!-- Dripping Drop Animation -->
          <div style="height: 40px; position: relative;">
            ${state.buretteLevel > 0 ? '<div style="width:8px; height:8px; background:#3b82f6; border-radius:50%; margin: 10px auto; animation: drip 0.8s infinite;"></div>' : ''}
          </div>

          <!-- Erlenmeyer Flask Visualizer -->
          <div style="width: 140px; height: 140px; clip-path: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%); background: var(--border-color); position: relative; padding: 4px;">
            <div style="width: 100%; height: 100%; clip-path: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%); background: ${state.flaskColor}; transition: background 0.5s ease; display:flex; align-items:flex-end; justify-content:center; padding-bottom:15px;">
              <span style="font-size:11px; font-weight:bold; color:#000;">pH: ${state.pH.toFixed(1)}</span>
            </div>
          </div>
          <div style="font-size:13px; font-weight:bold; margin-top:8px;">${state.flaskColorLabel}</div>
          <div style="font-size:11px; color:var(--text-muted);">Magnetic Stirrer: ${state.stirrerActive ? '⚡ Active' : 'Off'}</div>
        </div>

        <style>
          @keyframes drip {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(30px); opacity: 0; }
          }
        </style>
      `;
    } else if (this.activeExpId === 'exp_ohms_law') {
      stage.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:20px;">
          <div style="display:flex; gap:30px; align-items:center;">
            <!-- DC Power Supply -->
            <div class="card" style="padding:15px; text-align:center; min-width:140px; background:#1e293b; color:white;">
              <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">DC Power Supply</div>
              <div style="font-size:28px; font-weight:bold; color:#38bdf8;">${state.supplyVoltage.toFixed(1)} V</div>
            </div>

            <!-- Resistor Box -->
            <div class="card" style="padding:15px; text-align:center; min-width:140px; border:${state.burnedOut ? '2px solid red' : '1px solid var(--border-color)'}">
              <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">Resistor Module</div>
              <div style="font-size:24px; font-weight:bold;">${state.selectedResistance} Ω</div>
              <div style="font-size:11px; color:${state.burnedOut ? 'red' : 'green'};">${state.burnedOut ? '🔥 BURNED OUT' : 'OK'}</div>
            </div>
          </div>

          <!-- Digital Multimeter Readings -->
          <div style="display:flex; gap:20px;">
            <div class="card" style="padding:12px 24px; text-align:center;">
              <div style="font-size:11px; color:var(--text-muted);">Voltmeter (V)</div>
              <div style="font-size:20px; font-weight:bold; color:#2563eb;">${state.measuredVoltage.toFixed(2)} V</div>
            </div>
            <div class="card" style="padding:12px 24px; text-align:center;">
              <div style="font-size:11px; color:var(--text-muted);">Ammeter (mA)</div>
              <div style="font-size:20px; font-weight:bold; color:#10b981;">${state.currentMilliAmps.toFixed(1)} mA</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  updateGuidanceBox(guidance) {
    const boxText = document.getElementById('ai-guidance-text-content');
    const boxTitle = document.getElementById('ai-guidance-mode-title');
    if (boxText) boxText.textContent = guidance.text;
    if (boxTitle) boxTitle.textContent = `🤖 LabMentra AI [${guidance.mode}]`;
  }

  // --- Show Action-Based Error & Root-Cause Diagnostic Modal ---
  showErrorDiagnosticModal(evalResult) {
    const modal = document.getElementById('diagnostic-modal-backdrop');
    if (!modal) return;

    document.getElementById('diag-title').textContent = evalResult.title;
    document.getElementById('diag-obs').textContent = evalResult.rootCause.observation;
    document.getElementById('diag-principle').textContent = evalResult.rootCause.scientificPrinciple;
    document.getElementById('diag-remedy').textContent = evalResult.rootCause.remediation;

    modal.classList.add('active');
  }

  closeDiagnosticModal() {
    const modal = document.getElementById('diagnostic-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }

  // --- Finish Session & Show Automatic Lab Report ---
  finishExperimentSession() {
    const attemptSummary = labEngine.completeExperiment();
    this.lastAttemptData = attemptSummary;

    const reportHtml = labReportGenerator.generateHTML(
      attemptSummary,
      labEngine.currentExpConfig,
      aiAdvisor.studentProfile
    );

    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
    } else {
      alert('Lab Record generated! Please allow popups to view full PDF printable report.');
    }
  }

  // --- Open Replay Engine Modal ---
  openReplayModal() {
    if (!this.lastAttemptData) {
      alert('Please complete an experiment session first to launch Experiment Replay!');
      return;
    }

    replayEngine.loadAttempt(this.lastAttemptData);
    const modal = document.getElementById('replay-modal-backdrop');
    if (modal) modal.classList.add('active');

    this.updateReplayUI(replayEngine.getCurrentStep(), 0, replayEngine.getTotalSteps());
  }

  closeReplayModal() {
    replayEngine.stopPlayback();
    const modal = document.getElementById('replay-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }

  toggleReplayPlay() {
    if (replayEngine.isPlaying) {
      replayEngine.stopPlayback();
    } else {
      replayEngine.startPlayback((step, idx, total) => this.updateReplayUI(step, idx, total));
    }
  }

  updateReplayUI(step, index, total) {
    const scrubber = document.getElementById('replay-scrubber-input');
    const info = document.getElementById('replay-step-info');

    if (scrubber) {
      scrubber.max = total - 1;
      scrubber.value = index;
    }
    if (info && step) {
      info.innerHTML = `
        <div style="font-weight:bold;">Step ${index + 1} / ${total}: ${step.actionType}</div>
        <div style="font-size:12px; color:var(--text-muted);">Timestamp: +${(step.timestamp/1000).toFixed(1)}s</div>
        ${step.isError ? `<div style="color:red; font-size:12px; font-weight:bold; margin-top:4px;">⚠️ Error Triggered: ${step.evalResult.title}</div>` : ''}
      `;
    }
  }

  // --- Open What-If Sandbox Modal ---
  openWhatIfModal() {
    const modal = document.getElementById('whatif-modal-backdrop');
    if (!modal) return;

    const expConfig = EXPERIMENTS_DATA.find(e => e.id === (this.activeExpId || 'exp_titration'));
    const container = document.getElementById('whatif-controls-container');

    if (container && expConfig) {
      container.innerHTML = expConfig.whatIfSandboxParams.map(p => `
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: bold;">${p.label}</label>
          <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}" style="width:100%;" oninput="uiController.runWhatIfSimulation('${expConfig.id}')" id="whatif-param-${p.key}">
        </div>
      `).join('');
    }

    modal.classList.add('active');
    this.runWhatIfSimulation(expConfig.id);
  }

  closeWhatIfModal() {
    const modal = document.getElementById('whatif-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }

  runWhatIfSimulation(expId) {
    if (expId === 'exp_titration') {
      const hclConc = parseFloat(document.getElementById('whatif-param-hclConcentration')?.value || 0.125);
      const naohConc = parseFloat(document.getElementById('whatif-param-naohConcentration')?.value || 0.10);
      const temp = parseFloat(document.getElementById('whatif-param-temperature')?.value || 25);

      const res = whatIfEngine.simulateTitration({ hclConcentration: hclConc, naohConcentration: naohConc, temperature: temp });

      const out = document.getElementById('whatif-results-output');
      if (out) {
        out.innerHTML = `
          <div class="card" style="padding:15px; background:var(--primary-light);">
            <h4>Simulated Outcome</h4>
            <p><strong>Predicted Equivalence Volume:</strong> ${res.equivalenceVol} mL NaOH</p>
            <p style="font-size:12px; margin-top:6px;">${res.scientificSummary}</p>
          </div>
        `;
      }
    }
  }

  renderConceptMatrix() {
    const container = document.getElementById('concept-matrix-container');
    if (!container) return;

    const scores = aiAdvisor.studentProfile.masteryScores;

    container.innerHTML = Object.entries(CONCEPT_REGISTRY).map(([key, concept]) => {
      const score = scores[key] || 70;
      let badgeClass = 'badge-primary';
      if (score >= 80) badgeClass = 'badge-success';
      else if (score < 65) badgeClass = 'badge-danger';

      return `
        <div class="card" style="padding: 16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:bold; font-size:14px;"><i class="fas ${concept.icon}" style="margin-right:6px; color:var(--primary);"></i> ${concept.name}</span>
            <span class="badge ${badgeClass}">${score}% Mastery</span>
          </div>
          <div style="width:100%; background:var(--border-color); height:8px; border-radius:4px; overflow:hidden;">
            <div style="width:${score}%; background:var(--primary); height:100%;"></div>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:8px;">${concept.description}</p>
        </div>
      `;
    }).join('');
  }

  renderRecommendationsView() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    const recs = aiAdvisor.getRecommendations();

    container.innerHTML = recs.map(r => `
      <div class="card" style="margin-bottom:15px; padding:20px; border-left:4px solid var(--primary);">
        <h3 style="font-size:16px; margin-bottom:6px;">🎯 ${r.title}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">${r.reason}</p>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" onclick="uiController.startExperiment('${r.experimentId}')">
            Launch Recommended Lab
          </button>
        </div>
      </div>
    `).join('');
  }
}

const uiController = new UIController();
