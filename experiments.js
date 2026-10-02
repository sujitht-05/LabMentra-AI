/**
 * LabMentra AI - Modular Experiment Definitions
 */

const EXPERIMENTS_DATA = [
  {
    id: 'exp_titration',
    title: 'Standardization & Acid-Base Titration (HCl + NaOH)',
    subject: 'Chemistry',
    badge: 'Volumetric Analysis',
    icon: 'fa-flask',
    difficulty: 'Novice', // Default starting difficulty
    targetConcepts: ['chem_acid_base', 'chem_stoichiometry', 'chem_precision'],
    estimatedTimeMin: 15,
    description: 'Determine the exact concentration of an unknown hydrochloric acid (HCl) solution by titrating against a standard 0.10 M sodium hydroxide (NaOH) solution using phenolphthalein indicator.',
    learningObjectives: [
      'Understand acid-base neutralization reactions and stoichiometry',
      'Identify the equivalence point using phenolphthalein indicator color change',
      'Master precise volumetric technique with burette dropwise addition',
      'Calculate molar concentration using V1 × M1 = V2 × M2'
    ],
    equipment: [
      { id: 'burette', name: '50mL Glass Burette', status: 'Filled with 0.10M NaOH' },
      { id: 'flask', name: '250mL Erlenmeyer Flask', status: 'Contains 25.0mL unknown HCl' },
      { id: 'indicator', name: 'Phenolphthalein Bottle', status: 'Ready' },
      { id: 'ph_meter', name: 'Digital pH Probe', status: 'Calibrated' },
      { id: 'stirrer', name: 'Magnetic Stir Plate', status: 'Off' }
    ],
    initialState: {
      naohConcentration: 0.10, // M
      hclVolume: 25.0, // mL
      actualHclConcentration: 0.125, // M (True value to discover -> Equivalence at 31.25 mL NaOH)
      buretteLevel: 0.0, // mL delivered
      indicatorAdded: false,
      indicatorDrops: 0,
      flaskColor: '#ffffff00', // transparent
      flaskColorLabel: 'Colorless Solution',
      pH: 1.0,
      temperature: 25.0, // °C
      stirrerActive: false,
      stopcockOpen: false,
      flowRate: 0, // drops/sec or mL/sec
      stepIndex: 0,
      isCompleted: false,
      totalMistakes: 0,
      readings: []
    },
    // Required workflow sequence
    standardProcedure: [
      { stepId: 'add_indicator', title: 'Add Phenolphthalein Indicator', instruction: 'Add 2-3 drops of Phenolphthalein indicator into the Erlenmeyer flask containing HCl.' },
      { stepId: 'start_stirrer', title: 'Turn On Magnetic Stirrer', instruction: 'Enable the magnetic stirrer to ensure uniform mixing of reactants.' },
      { stepId: 'titrate_bulk', title: 'Deliver Titrant (NaOH)', instruction: 'Open burette stopcock to add NaOH titrant until near the estimated equivalence point (~28-30 mL).' },
      { stepId: 'titrate_fine', title: 'Dropwise End-Point Detection', instruction: 'Switch to dropwise rate until a faint persistent pink color persists for 30 seconds (pH ~8.2-8.3).' },
      { stepId: 'record_result', title: 'Record Equivalence Volume & Calculate', instruction: 'Read final burette meniscus volume and calculate unknown HCl molarity.' }
    ],
    whatIfSandboxParams: [
      { key: 'hclConcentration', label: 'Initial HCl Concentration (M)', min: 0.05, max: 0.25, step: 0.01, default: 0.125 },
      { key: 'naohConcentration', label: 'Burette NaOH Concentration (M)', min: 0.05, max: 0.50, step: 0.01, default: 0.10 },
      { key: 'temperature', label: 'Solution Temperature (°C)', min: 10, max: 80, step: 5, default: 25 }
    ]
  },
  {
    id: 'exp_ohms_law',
    title: "Verification of Ohm's Law & Circuit Thermal Limits",
    subject: 'Physics',
    badge: 'Electronics & Electricity',
    icon: 'fa-bolt',
    difficulty: 'Novice',
    targetConcepts: ['phys_ohms_law', 'phys_circuit_safety'],
    estimatedTimeMin: 12,
    description: 'Investigate the linear relationship between voltage (V) and current (I) across a conductor, calculate resistance (R), and observe component thermal limits under excess current.',
    learningObjectives: [
      'Verify V = I × R relation graphically across multiple voltage steps',
      'Learn how to properly connect Ammeter in series and Voltmeter in parallel',
      'Identify power dissipation P = I²R limits to prevent component burnout',
      'Calculate experimental resistance from the slope of V-I graph'
    ],
    equipment: [
      { id: 'power_supply', name: 'Variable DC Power Supply (0-25V)', status: 'Set to 0V' },
      { id: 'resistor_box', name: 'Precision Resistor Module (10Ω, 50Ω, 100Ω)', status: '100Ω selected' },
      { id: 'multimeter_a', name: 'Digital Ammeter (mA)', status: 'Connected in Series' },
      { id: 'multimeter_v', name: 'Digital Voltmeter (V)', status: 'Connected in Parallel' },
      { id: 'switch', name: 'SPST Circuit Knife Switch', status: 'Open' }
    ],
    initialState: {
      supplyVoltage: 0.0, // V
      selectedResistance: 100, // Ohms
      resistorMaxPower: 1.0, // Watts max rating
      switchClosed: false,
      currentMilliAmps: 0.0, // mA
      measuredVoltage: 0.0, // V
      actualPowerWatts: 0.0,
      resistorTemperature: 25.0, // °C
      burnedOut: false,
      meterMode: 'correct', // or 'short_circuit', 'wrong_polarity'
      readings: [],
      stepIndex: 0,
      isCompleted: false,
      totalMistakes: 0
    },
    standardProcedure: [
      { stepId: 'select_resistor', title: 'Select Test Resistor', instruction: 'Choose a target resistor value (e.g., 100 Ω).' },
      { stepId: 'close_switch', title: 'Close Circuit Switch', instruction: 'Close the circuit switch to complete the electrical loop.' },
      { stepId: 'sweep_voltage', title: 'Sweep Supply Voltage', instruction: 'Increase voltage in steps of 2.0V from 0V to 10V and record current (I) for each voltage.' },
      { stepId: 'calculate_slope', title: 'Plot V vs I & Find Resistance', instruction: 'Analyze the V-I linear curve slope (ΔV/ΔI) to find resistance and verify Ohm\'s Law.' }
    ],
    whatIfSandboxParams: [
      { key: 'resistance', label: 'Resistor Value (Ω)', min: 5, max: 500, step: 5, default: 100 },
      { key: 'maxVoltage', label: 'Max Voltage Applied (V)', min: 1, max: 30, step: 1, default: 15 },
      { key: 'powerRating', label: 'Resistor Power Rating (Watts)', min: 0.25, max: 5.0, step: 0.25, default: 1.0 }
    ]
  },
  {
    id: 'exp_boyles_law',
    title: "Boyle's Law: Pressure-Volume Dynamics of Enclosed Gas",
    subject: 'Physics / Chem',
    badge: 'Thermodynamics',
    icon: 'fa-compress-arrows-alt',
    difficulty: 'Novice',
    targetConcepts: ['phys_boyles_law', 'chem_stoichiometry'],
    estimatedTimeMin: 10,
    description: 'Examine the inverse relationship between the pressure and volume of a fixed mass of gas at constant temperature (P1V1 = P2V2).',
    learningObjectives: [
      'Demonstrate P ∝ 1/V for an ideal gas under isothermal conditions',
      'Identify heat transfer effects during rapid compression vs isothermal state',
      'Plot P vs V (Hyperbola) and P vs 1/V (Straight Line)',
      'Calculate the gas constant product k = P × V'
    ],
    equipment: [
      { id: 'cylinder', name: 'Gas Chamber with Graduated Piston', status: 'Initial Vol: 60 mL' },
      { id: 'pressure_gauge', name: 'Digital Absolute Pressure Sensor (kPa)', status: '101.3 kPa' },
      { id: 'temp_bath', name: 'Thermostatic Water Jacket (25°C)', status: 'Active' },
      { id: 'lock_clamp', name: 'Piston Locking Clamp', status: 'Unlocked' }
    ],
    initialState: {
      volume: 60.0, // mL
      pressure: 101.3, // kPa (1 atm)
      temperature: 298.15, // Kelvin (25°C)
      targetTemp: 298.15,
      molesGas: 0.00245, // n = PV/RT
      compressionRate: 'slow', // slow vs fast (adiabatic effect)
      readings: [{ volume: 60.0, pressure: 101.3, temp: 25.0, pv: 6078 }],
      stepIndex: 0,
      isCompleted: false,
      totalMistakes: 0
    },
    standardProcedure: [
      { stepId: 'verify_temp', title: 'Verify Constant Temperature Bath', instruction: 'Ensure temperature bath is set to 25°C and stable.' },
      { stepId: 'adjust_volume', title: 'Stepwise Piston Compression', instruction: 'Compress piston from 60 mL down to 20 mL in 5 mL increments, allowing thermal relaxation between steps.' },
      { stepId: 'record_pv', title: 'Log Pressure Data & Verify P × V', instruction: 'Record pressure at each volume step and compute P × V product constant.' },
      { stepId: 'plot_isotherm', title: 'Plot P vs 1/V Isotherm Curve', instruction: 'Verify linearity of P versus reciprocal volume (1/V).' }
    ],
    whatIfSandboxParams: [
      { key: 'temperatureC', label: 'Gas Temperature (°C)', min: 0, max: 100, step: 5, default: 25 },
      { key: 'initialVolume', label: 'Initial Volume (mL)', min: 30, max: 100, step: 5, default: 60 },
      { key: 'gasMoles', label: 'Amount of Gas (millimoles)', min: 1.0, max: 5.0, step: 0.5, default: 2.45 }
    ]
  },
  {
    id: 'exp_enzyme_kinetics',
    title: 'Enzyme Kinetics: Catalase Activity & Thermal Denaturation',
    subject: 'Biology / Biochem',
    badge: 'Biochemistry',
    icon: 'fa-dna',
    difficulty: 'Novice',
    targetConcepts: ['bio_enzyme_kinetics'],
    estimatedTimeMin: 15,
    description: 'Study how substrate concentration (H2O2) and temperature affect the rate of oxygen gas evolution catalyzed by catalase enzyme.',
    learningObjectives: [
      'Understand enzyme-substrate binding kinetics and reaction velocity (V)',
      'Observe thermal denaturation of enzymes above optimum temperature',
      'Determine the effect of substrate concentration on initial velocity (V0)',
      'Estimate Vmax and Km parameters'
    ],
    equipment: [
      { id: 'reaction_flask', name: 'Sealed Reaction Flask with Gasometer', status: 'Clean' },
      { id: 'substrate_bottle', name: 'Hydrogen Peroxide Solution (H2O2)', status: '3% Concentration' },
      { id: 'enzyme_vial', name: 'Catalase Extract (Extract from Yeast/Potato)', status: 'Chilled' },
      { id: 'water_bath', name: 'Controlled Water Bath (0 - 80°C)', status: 'Set to 37°C' },
      { id: 'gas_sensor', name: 'Digital O2 Volume Transducer (mL/min)', status: 'Ready' }
    ],
    initialState: {
      temperature: 37.0, // °C
      pH: 7.0,
      substrateConc: 10.0, // mM
      enzymeConc: 1.0, // unit
      isDenatured: false,
      o2Rate: 0.0, // mL O2 / min
      totalO2Evolved: 0.0, // mL
      reactionTimeSec: 0,
      reactionActive: false,
      readings: [],
      stepIndex: 0,
      isCompleted: false,
      totalMistakes: 0
    },
    standardProcedure: [
      { stepId: 'set_temperature', title: 'Set Bath Temperature', instruction: 'Set water bath temperature to optimum 37°C.' },
      { stepId: 'add_buffer', title: 'Add Enzyme Extract', instruction: 'Pipette 2.0 mL of Catalase enzyme extract into the reaction flask.' },
      { stepId: 'add_substrate', title: 'Inject Substrate & Start Timer', instruction: 'Inject H2O2 substrate and immediately record rate of O2 gas release.' },
      { stepId: 'test_denaturation', title: 'Investigate Thermal Denaturation', instruction: 'Repeat assay at 70°C to demonstrate irreversible enzyme denaturation.' }
    ],
    whatIfSandboxParams: [
      { key: 'temperature', label: 'Reaction Temperature (°C)', min: 5, max: 80, step: 5, default: 37 },
      { key: 'pH', label: 'Solution pH', min: 2, max: 12, step: 0.5, default: 7.0 },
      { key: 'substrateConc', label: 'Substrate [H₂O₂] (mM)', min: 1, max: 50, step: 2, default: 10 }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EXPERIMENTS_DATA };
}
