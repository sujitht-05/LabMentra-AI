/**
 * LabMentra AI - Virtual Lab Core State Engine
 */

class LabEngine {
  constructor() {
    this.currentExpConfig = null;
    this.state = null;
    this.difficulty = 'Novice'; // 'Novice' | 'Intermediate' | 'Advanced'
    this.attemptLogs = []; // Timeline of steps for replay
    this.mistakesLogged = [];
    this.startTime = null;
    this.isFinished = false;

    // Callbacks for UI updates
    this.onStateUpdated = null;
    this.onErrorDetected = null;
    this.onGuidanceUpdated = null;
  }

  /**
   * Initializes an experiment session
   */
  loadExperiment(expConfig, difficulty = 'Novice') {
    this.currentExpConfig = expConfig;
    this.difficulty = difficulty;
    // Deep clone initial state
    this.state = JSON.parse(JSON.stringify(expConfig.initialState));
    this.state.difficulty = difficulty;
    this.attemptLogs = [];
    this.mistakesLogged = [];
    this.startTime = Date.now();
    this.isFinished = false;

    // Record initial snapshot
    this.logAction('session_start', { detail: 'Experiment session initiated' }, false, null);

    if (this.onStateUpdated) this.onStateUpdated(this.state);
    this._updateGuidance();
  }

  setDifficulty(newDifficulty) {
    this.difficulty = newDifficulty;
    if (this.state) {
      this.state.difficulty = newDifficulty;
    }
    this._updateGuidance();
  }

  /**
   * Executes a user action on the lab equipment
   */
  performAction(actionType, payload = {}) {
    if (!this.state || this.isFinished) return;

    labAudio.playClick();

    // 1. Action-Based Error Detection via AI Advisor
    const evalResult = aiAdvisor.evaluateAction(
      this.currentExpConfig.id,
      this.state,
      actionType,
      payload,
      this.difficulty
    );

    let isError = evalResult.isError;

    if (isError) {
      labAudio.playWarning();
      this.state.totalMistakes++;
      this.mistakesLogged.push(evalResult);

      if (this.onErrorDetected) {
        this.onErrorDetected(evalResult);
      }
    }

    // 2. Mutate State based on experiment physics/chemistry
    this._applyStateMutation(actionType, payload, isError);

    // 3. Log snapshot for replay engine
    this.logAction(actionType, payload, isError, evalResult);

    // 4. Update UI & Guidance
    if (this.onStateUpdated) this.onStateUpdated(this.state);
    this._updateGuidance();
  }

  /**
   * Internal state mutations per experiment type
   */
  _applyStateMutation(actionType, payload, isError) {
    const expId = this.currentExpConfig.id;

    if (expId === 'exp_titration') {
      if (actionType === 'add_indicator') {
        this.state.indicatorAdded = true;
        this.state.indicatorDrops += (payload.drops || 2);
        this.state.flaskColor = '#f8fafc';
        this.state.flaskColorLabel = 'Colorless (Indicator Added)';
        labAudio.playPouring();
      } else if (actionType === 'toggle_stirrer') {
        this.state.stirrerActive = !this.state.stirrerActive;
      } else if (actionType === 'add_naoh' || actionType === 'open_stopcock') {
        const added = payload.addedVolume || (payload.rate === 'dropwise' ? 0.2 : 2.0);
        this.state.buretteLevel = Math.min(50, this.state.buretteLevel + added);
        labAudio.playPouring();

        // Calculate pH
        const equivalenceVol = (this.state.hclVolume * this.state.actualHclConcentration) / this.state.naohConcentration; // 31.25 mL
        const delta = this.state.buretteLevel - equivalenceVol;

        if (delta < -3) {
          this.state.pH = 1.0 + (this.state.buretteLevel / 10);
          this.state.flaskColor = '#ffffff';
          this.state.flaskColorLabel = 'Colorless Solution';
        } else if (delta >= -3 && delta < 0) {
          this.state.pH = 3.5 + (3 * (this.state.buretteLevel / equivalenceVol));
          this.state.flaskColor = '#fff1f2';
          this.state.flaskColorLabel = 'Faint Pink Flush (Near End Point)';
        } else if (Math.abs(delta) <= 0.5) {
          this.state.pH = 8.3;
          this.state.flaskColor = '#f472b6';
          this.state.flaskColorLabel = 'Faint Persistent Pink (Perfect Equivalence!)';
        } else {
          this.state.pH = Math.min(13.5, 10.5 + delta * 0.5);
          this.state.flaskColor = '#9d174d';
          this.state.flaskColorLabel = 'Dark Magenta (Over-Titrated)';
        }
      } else if (actionType === 'log_reading') {
        this.state.readings.push({
          volume: this.state.buretteLevel,
          pH: this.state.pH,
          color: this.state.flaskColor,
          colorLabel: this.state.flaskColorLabel,
          notes: payload.notes || 'Equivalence Trial Reading'
        });
      }
    } else if (expId === 'exp_ohms_law') {
      if (actionType === 'set_voltage') {
        this.state.supplyVoltage = parseFloat(payload.voltage);
        if (this.state.switchClosed) {
          this.state.measuredVoltage = this.state.supplyVoltage;
          this.state.currentMilliAmps = (this.state.supplyVoltage / this.state.selectedResistance) * 1000;
          this.state.actualPowerWatts = (this.state.supplyVoltage * this.state.supplyVoltage) / this.state.selectedResistance;
          if (this.state.actualPowerWatts > this.state.resistorMaxPower) {
            this.state.burnedOut = true;
            this.state.currentMilliAmps = 0;
            this.state.measuredVoltage = 0;
            labAudio.playBurnoutSpark();
          }
        }
      } else if (actionType === 'toggle_switch') {
        this.state.switchClosed = !this.state.switchClosed;
        if (this.state.switchClosed && !this.state.burnedOut) {
          this.state.measuredVoltage = this.state.supplyVoltage;
          this.state.currentMilliAmps = (this.state.supplyVoltage / this.state.selectedResistance) * 1000;
          this.state.actualPowerWatts = (this.state.supplyVoltage * this.state.supplyVoltage) / this.state.selectedResistance;
        } else {
          this.state.measuredVoltage = 0;
          this.state.currentMilliAmps = 0;
          this.state.actualPowerWatts = 0;
        }
      } else if (actionType === 'select_resistor') {
        this.state.selectedResistance = parseInt(payload.resistance);
        this.state.burnedOut = false;
      } else if (actionType === 'log_reading') {
        this.state.readings.push({
          voltage: this.state.measuredVoltage,
          current: this.state.currentMilliAmps,
          resistance: this.state.selectedResistance,
          power: this.state.actualPowerWatts
        });
      }
    } else if (expId === 'exp_boyles_law') {
      if (actionType === 'set_volume') {
        this.state.volume = parseFloat(payload.volume);
        // P1V1 = P2V2 -> P2 = (P1 * V1) / V2
        this.state.pressure = (101.3 * 60.0) / this.state.volume;
      } else if (actionType === 'log_reading') {
        this.state.readings.push({
          volume: this.state.volume,
          pressure: this.state.pressure,
          temp: 25.0,
          pv: (this.state.volume * this.state.pressure)
        });
      }
    } else if (expId === 'exp_enzyme_kinetics') {
      if (actionType === 'set_temperature') {
        this.state.temperature = parseFloat(payload.temp);
        if (this.state.temperature > 65) {
          this.state.isDenatured = true;
          this.state.o2Rate = 0;
        }
      } else if (actionType === 'add_substrate') {
        this.state.reactionActive = true;
        if (!this.state.isDenatured) {
          // Michaelis-Menten rate calculation
          const vmax = 45.0; // mL/min
          const km = 8.0; // mM
          this.state.o2Rate = (vmax * this.state.substrateConc) / (km + this.state.substrateConc);
          this.state.totalO2Evolved += 15.0;
        } else {
          this.state.o2Rate = 0;
        }
      }
    }
  }

  logAction(actionType, payload, isError, evalResult) {
    const logEntry = {
      timestamp: Date.now() - this.startTime,
      stepNumber: this.attemptLogs.length + 1,
      actionType,
      payload,
      isError,
      evalResult,
      stateSnapshot: JSON.parse(JSON.stringify(this.state))
    };
    this.attemptLogs.push(logEntry);
  }

  _updateGuidance() {
    if (this.onGuidanceUpdated && this.currentExpConfig) {
      const guidance = aiAdvisor.getAdaptiveGuidance(
        this.currentExpConfig.id,
        this.state,
        this.difficulty
      );
      this.onGuidanceUpdated(guidance);
    }
  }

  completeExperiment() {
    this.isFinished = true;
    labAudio.playSuccess();

    // Calculate final results
    let calculatedVal = 'Verified';
    if (this.currentExpConfig.id === 'exp_titration') {
      const vNaOH = this.state.buretteLevel;
      const molarityHCl = (vNaOH * 0.10) / 25.0;
      calculatedVal = `${molarityHCl.toFixed(3)} M HCl (True: 0.125 M)`;
    }

    const attemptSummary = {
      id: 'ATT-' + Math.floor(1000 + Math.random() * 9000),
      expId: this.currentExpConfig.id,
      difficulty: this.difficulty,
      durationSec: Math.round((Date.now() - this.startTime) / 1000),
      readings: this.state.readings,
      mistakes: this.mistakesLogged,
      logs: this.attemptLogs,
      calculatedResult: calculatedVal
    };

    // Update mastery scores
    this.currentExpConfig.targetConcepts.forEach(c => {
      if (aiAdvisor.studentProfile.masteryScores[c]) {
        const delta = this.mistakesLogged.length === 0 ? 5 : -2;
        aiAdvisor.studentProfile.masteryScores[c] = Math.min(100, Math.max(0, aiAdvisor.studentProfile.masteryScores[c] + delta));
      }
    });

    aiAdvisor.studentProfile.attemptHistory.push(attemptSummary);
    return attemptSummary;
  }
}

const labEngine = new LabEngine();
