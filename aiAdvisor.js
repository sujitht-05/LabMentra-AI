/**
 * LabMentra AI - Real-time AI Assistant & Root-Cause Analysis Engine
 */

class AIAdvisor {
  constructor() {
    this.studentProfile = {
      name: 'Alex Rivera',
      studentId: 'LM-2026-889',
      masteryScores: {
        chem_stoichiometry: 72,
        chem_acid_base: 65,
        chem_precision: 58,
        phys_ohms_law: 85,
        phys_circuit_safety: 90,
        phys_boyles_law: 80,
        bio_enzyme_kinetics: 70
      },
      attemptHistory: []
    };
  }

  /**
   * Evaluates user action in real-time and detects errors / provides guidance
   */
  evaluateAction(expId, currentState, actionType, actionPayload, difficulty = 'Novice') {
    const feedback = {
      isError: false,
      errorType: null, // 'procedure' | 'precision' | 'safety' | 'calculation'
      title: '',
      message: '',
      rootCause: null,
      suggestedAction: '',
      affectedConcept: null
    };

    if (expId === 'exp_titration') {
      return this._evaluateTitration(currentState, actionType, actionPayload, difficulty);
    } else if (expId === 'exp_ohms_law') {
      return this._evaluateOhmsLaw(currentState, actionType, actionPayload, difficulty);
    } else if (expId === 'exp_boyles_law') {
      return this._evaluateBoylesLaw(currentState, actionType, actionPayload, difficulty);
    } else if (expId === 'exp_enzyme_kinetics') {
      return this._evaluateEnzymeKinetics(currentState, actionType, actionPayload, difficulty);
    }

    return feedback;
  }

  // --- Titration Evaluation Logic ---
  _evaluateTitration(state, actionType, payload, difficulty) {
    if (actionType === 'open_stopcock' || actionType === 'add_naoh') {
      // Check 1: Titrating before adding indicator!
      if (!state.indicatorAdded) {
        return {
          isError: true,
          errorType: 'procedure',
          title: 'Procedural Error: Missing Indicator',
          message: 'You began adding NaOH titrant before adding Phenolphthalein indicator!',
          rootCause: {
            observation: 'The solution remains completely colorless regardless of how much NaOH is added.',
            scientificPrinciple: 'Phenolphthalein is an acid-base indicator with a pKa of ~9.4. Without it in the solution, there is no chromophore to signal the equivalence point (pH 8.2-10.0).',
            impact: 'Over-titration will occur without any visual cue, ruining the volumetric titration data.',
            remediation: 'Drain the flask, add fresh HCl solution, and introduce 2-3 drops of Phenolphthalein indicator before opening the stopcock.'
          },
          suggestedAction: 'Add 3 drops of Phenolphthalein indicator first.',
          affectedConcept: 'chem_precision'
        };
      }

      // Check 2: Stirrer off during fast addition
      if (!state.stirrerActive && payload.rate === 'fast') {
        return {
          isError: true,
          errorType: 'precision',
          title: 'Precision Warning: Localized Over-Saturation',
          message: 'Adding NaOH rapidly without continuous magnetic stirring!',
          rootCause: {
            observation: 'Temporary dark pink spots appear where drops land, but disappear slowly.',
            scientificPrinciple: 'In an un-stirred solution, localized concentration gradients of OH⁻ form at the impact site, delaying uniform neutralization and causing inaccurate volume readings.',
            impact: 'Risk of overshooting the end-point due to slow dissipation of hydroxyl ions.',
            remediation: 'Turn on the magnetic stirrer to maintain homogeneous solution mixing.'
          },
          suggestedAction: 'Enable the magnetic stirrer before continuing titrant addition.',
          affectedConcept: 'chem_precision'
        };
      }

      // Check 3: Over-titration (Over-shooting equivalence point)
      // Equivalence point is at ~31.25 mL NaOH for 0.125M HCl
      const currentBurette = state.buretteLevel + payload.addedVolume;
      const equivalenceVolume = (state.hclVolume * state.actualHclConcentration) / state.naohConcentration; // 31.25 mL

      if (currentBurette > equivalenceVolume + 1.5) {
        return {
          isError: true,
          errorType: 'precision',
          title: 'Over-Titration Detected (Dark Magenta Endpoint)',
          message: `You added ${currentBurette.toFixed(2)} mL NaOH, overshooting the equivalence point of ${equivalenceVolume.toFixed(2)} mL!`,
          rootCause: {
            observation: 'The solution turned intense, dark magenta purple (pH > 10.5).',
            scientificPrinciple: 'At excess [OH⁻], phenolphthalein exists completely in its fully deprotonated quinoid form. The stoichiometric equivalence point was reached at exactly 31.25 mL.',
            impact: 'Calculating HCl molarity with this volume will yield an inflated value (e.g., ~0.135 M instead of true 0.125 M).',
            remediation: 'In your next attempt, slow down the burette flow to dropwise when volume reaches 29-30 mL.'
          },
          suggestedAction: 'Record the current reading, analyze the percent error, or replay to review end-point timing.',
          affectedConcept: 'chem_acid_base'
        };
      }
    }

    return { isError: false };
  }

  // --- Ohm's Law Evaluation Logic ---
  _evaluateOhmsLaw(state, actionType, payload, difficulty) {
    if (actionType === 'set_voltage' || actionType === 'close_switch') {
      const v = actionType === 'set_voltage' ? payload.voltage : state.supplyVoltage;
      const r = state.selectedResistance;
      const power = (v * v) / r; // P = V^2 / R

      // Short circuit / Component Overheating check
      if (power > state.resistorMaxPower) {
        return {
          isError: true,
          errorType: 'safety',
          title: 'Circuit Hazard: Thermal Overload & Burnout!',
          message: `Applying ${v}V across a ${r}Ω resistor generates ${power.toFixed(2)}W of power, exceeding the ${state.resistorMaxPower}W safety rating!`,
          rootCause: {
            observation: 'Resistor temperature spiked to over 140°C with visible thermal smoke and circuit cutoff.',
            scientificPrinciple: 'Joule Heating (P = I²R = V²/R). Excessive electrical energy is converted to thermal energy faster than the component can dissipate into the surrounding air.',
            impact: 'Permanent resistor destruction and potential damage to the DC power supply.',
            remediation: 'Keep voltage below 10V when using 10Ω resistors, or select a higher resistance (e.g., 50Ω or 100Ω).'
          },
          suggestedAction: 'Open the switch, reset power supply to 0V, and replace the burned resistor.',
          affectedConcept: 'phys_circuit_safety'
        };
      }
    }

    return { isError: false };
  }

  // --- Boyle's Law Evaluation Logic ---
  _evaluateBoylesLaw(state, actionType, payload, difficulty) {
    if (actionType === 'compress_piston') {
      if (payload.rate === 'fast') {
        return {
          isError: true,
          errorType: 'precision',
          title: 'Thermodynamic Error: Adiabatic Compression Heating',
          message: 'Rapidly compressing the piston caused a temperature spike (+8.5°C)!',
          rootCause: {
            observation: 'Pressure reading spiked higher than predicted by Boyle\'s Law (P1V1 ≠ P2V2).',
            scientificPrinciple: 'Boyle\'s Law requires ISOTHERMAL conditions (constant temperature). Rapid work done on the gas converts mechanical energy to internal thermal energy (Adiabatic heating), violating constant T.',
            impact: 'Pressure measurements reflect both volume change AND thermal expansion, introducing experimental distortion.',
            remediation: 'Compress the piston slowly and allow thermal relaxation between volume readings.'
          },
          suggestedAction: 'Wait 10 seconds for the thermal bath to re-stabilize the gas temperature at 25°C.',
          affectedConcept: 'phys_boyles_law'
        };
      }
    }

    return { isError: false };
  }

  // --- Enzyme Kinetics Evaluation Logic ---
  _evaluateEnzymeKinetics(state, actionType, payload, difficulty) {
    if (actionType === 'set_temperature' || actionType === 'add_enzyme') {
      const temp = actionType === 'set_temperature' ? payload.temp : state.temperature;

      if (temp > 65.0) {
        return {
          isError: true,
          errorType: 'safety',
          title: 'Biochemical Failure: Enzyme Denaturation',
          message: `At ${temp}°C, the Catalase enzyme extract has suffered irreversible thermal denaturation!`,
          rootCause: {
            observation: 'Zero oxygen gas bubbles produced upon adding H2O2 substrate.',
            scientificPrinciple: 'High kinetic energy breaks hydrogen bonds and hydrophobic interactions holding the 3D tertiary structure of the protein, destroying the active site shape.',
            impact: 'Catalytic activity drops to zero; substrate can no longer bind to the active site.',
            remediation: 'Maintain water bath temperature between 25°C and 40°C (Optimum ~37°C).'
          },
          suggestedAction: 'Cool down water bath and add a fresh active enzyme sample.',
          affectedConcept: 'bio_enzyme_kinetics'
        };
      }
    }

    return { isError: false };
  }

  /**
   * Generates adaptive guidance tip for current experiment state & difficulty
   */
  getAdaptiveGuidance(expId, state, difficulty = 'Novice') {
    if (difficulty === 'Advanced') {
      return {
        mode: 'Expert Mode (Minimal Assistance)',
        text: 'Zero auto-correct safety rails enabled. Perform readings with strict precision and submit calculations upon completion.',
        type: 'info'
      };
    }

    if (expId === 'exp_titration') {
      if (!state.indicatorAdded) {
        return {
          mode: difficulty === 'Novice' ? 'Guided Assistant' : 'Balanced Guidance',
          text: '💡 Step 1: Click "Add Phenolphthalein Indicator" to introduce the pH color marker into the flask.',
          type: 'action'
        };
      }
      if (!state.stirrerActive) {
        return {
          mode: 'Guided Assistant',
          text: '💡 Step 2: Turn ON the Magnetic Stirrer to ensure rapid uniform mixing.',
          type: 'action'
        };
      }
      if (state.buretteLevel < 25.0) {
        return {
          mode: 'Guided Assistant',
          text: `💡 Step 3: Delivered ${state.buretteLevel.toFixed(1)} mL. Keep adding NaOH. Expected equivalence is around ~31 mL.`,
          type: 'progress'
        };
      }
      if (state.buretteLevel >= 25.0 && state.buretteLevel < 31.0) {
        return {
          mode: 'High-Precision Alert',
          text: '⚡ Approaching Endpoint! Switch flow to Dropwise mode to prevent over-titration.',
          type: 'warning'
        };
      }
      if (state.pH >= 8.2 && state.pH <= 9.0) {
        return {
          mode: 'Success Monitor',
          text: '🎯 Perfect faint pink endpoint reached! Stop titrant addition and record final burette level.',
          type: 'success'
        };
      }
    } else if (expId === 'exp_ohms_law') {
      if (!state.switchClosed) {
        return {
          mode: 'Guided Assistant',
          text: '💡 Step 1: Close the circuit switch to complete the electrical path.',
          type: 'action'
        };
      }
      if (state.readings.length < 5) {
        return {
          mode: 'Guided Assistant',
          text: `💡 Step 2: Collected ${state.readings.length}/5 V-I data points. Increase voltage dial and record current.`,
          type: 'progress'
        };
      }
      return {
        mode: 'Analysis Ready',
        text: '📊 Ample data collected! Click "Generate V-I Plot" to verify Ohm\'s Law and calculate Resistance.',
        type: 'success'
      };
    } else if (expId === 'exp_boyles_law') {
      if (state.readings.length < 5) {
        return {
          mode: 'Guided Assistant',
          text: `💡 Step 1: Compress piston to next volume mark (Current: ${state.volume} mL) and log Pressure.`,
          type: 'progress'
        };
      }
      return {
        mode: 'Analysis Ready',
        text: '📊 Data complete! Check the P vs 1/V graph to confirm linear relationship.',
        type: 'success'
      };
    } else if (expId === 'exp_enzyme_kinetics') {
      if (!state.reactionActive && state.totalO2Evolved === 0) {
        return {
          mode: 'Guided Assistant',
          text: '💡 Step 1: Inject Substrate (H2O2) to initiate catalase gas evolution.',
          type: 'action'
        };
      }
    }

    return {
      mode: 'Standard Assistance',
      text: 'Perform the next step in procedure and monitor live sensor readouts.',
      type: 'info'
    };
  }

  /**
   * Generates personalized recommendations for next experiments based on student performance
   */
  getRecommendations() {
    const scores = this.studentProfile.masteryScores;
    // Find lowest concept score
    let lowestConcept = null;
    let minScore = 100;

    for (const [conceptKey, score] of Object.entries(scores)) {
      if (score < minScore) {
        minScore = score;
        lowestConcept = conceptKey;
      }
    }

    const recs = [];

    if (minScore < 70) {
      recs.push({
        title: 'Targeted Remediation: Volumetric Precision',
        experimentId: 'exp_titration',
        recommendedDifficulty: 'Novice',
        reason: `Your concept mastery in Volumetric Precision is currently ${minScore}%. Retrying Titration with dropwise control will strengthen this skill.`,
        focusAreas: ['Dropwise Endpoint Control', 'Meniscus Measurement', 'pH Equivalence']
      });
    }

    recs.push({
      title: 'Advanced Challenge: High-Voltage Ohm\'s Law',
      experimentId: 'exp_ohms_law',
      recommendedDifficulty: 'Intermediate',
      reason: 'Your Physics mastery (85%) is high. Try verifying Ohm\'s Law with variable resistor thermal dissipation limits.',
      focusAreas: ['Joule Heating Limits', 'Non-linear Resistance', 'Ammeter Precision']
    });

    recs.push({
      title: 'Thermodynamics Explorer: Boyle\'s Law',
      experimentId: 'exp_boyles_law',
      recommendedDifficulty: 'Novice',
      reason: 'Master ideal gas behavior under isothermal vs adiabatic conditions.',
      focusAreas: ['Isothermal Compression', 'P vs 1/V Linearity', 'Gas Constant k']
    });

    return recs;
  }
}

const aiAdvisor = new AIAdvisor();
