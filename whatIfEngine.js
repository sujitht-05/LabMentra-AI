/**
 * LabMentra AI - What-If Sandbox Simulation Engine
 */

class WhatIfEngine {
  constructor() {}

  /**
   * Runs what-if dynamic simulation for Titration
   */
  simulateTitration(params) {
    // params: { hclConcentration, naohConcentration, temperature }
    const { hclConcentration, naohConcentration, temperature } = params;
    const hclVol = 25.0; // mL
    const equivalenceVol = (hclVol * hclConcentration) / naohConcentration;

    const dataPoints = [];
    const kw = 1e-14 * Math.exp((-4500 * (1 / (temperature + 273.15) - 1 / 298.15))); // Temperature dependence of Kw

    // Generate curve from 0 to 50 mL NaOH
    for (let v = 0; v <= 50; v += 0.5) {
      let pH = 1.0;
      if (v < equivalenceVol) {
        // Acid excess
        const unreactedMoles = (hclVol * hclConcentration - v * naohConcentration) / 1000;
        const totalVolL = (hclVol + v) / 1000;
        const hPlus = Math.max(1e-7, unreactedMoles / totalVolL);
        pH = -Math.log10(hPlus);
      } else if (Math.abs(v - equivalenceVol) < 0.1) {
        // Equivalence point
        pH = -0.5 * Math.log10(kw);
      } else {
        // Base excess
        const excessOhMoles = (v * naohConcentration - hclVol * hclConcentration) / 1000;
        const totalVolL = (hclVol + v) / 1000;
        const ohMinus = excessOhMoles / totalVolL;
        const pOH = -Math.log10(ohMinus);
        pH = 14.0 - pOH;
      }
      dataPoints.push({ volume: v, pH: Math.min(14, Math.max(0, pH)) });
    }

    return {
      equivalenceVol: equivalenceVol.toFixed(2),
      initialpH: dataPoints[0].pH.toFixed(2),
      finalpH: dataPoints[dataPoints.length - 1].pH.toFixed(2),
      dataPoints,
      scientificSummary: `At ${temperature}°C with ${hclConcentration}M HCl titrated against ${naohConcentration}M NaOH, the stoichiometric equivalence point occurs at exactly ${equivalenceVol.toFixed(2)} mL NaOH.`
    };
  }

  /**
   * Runs what-if dynamic simulation for Ohm's Law
   */
  simulateOhmsLaw(params) {
    // params: { resistance, maxVoltage, powerRating }
    const { resistance, maxVoltage, powerRating } = params;
    const dataPoints = [];
    let safeMaxV = Math.sqrt(powerRating * resistance); // V = sqrt(P*R)

    for (let v = 0; v <= maxVoltage; v += 0.5) {
      const iMilliAmps = (v / resistance) * 1000;
      const powerWatts = (v * v) / resistance;
      const isOverheated = powerWatts > powerRating;
      dataPoints.push({
        voltage: v,
        current: iMilliAmps,
        power: powerWatts,
        isOverheated
      });
    }

    return {
      maxCurrentmA: ((maxVoltage / resistance) * 1000).toFixed(1),
      maxPowerW: ((maxVoltage * maxVoltage) / resistance).toFixed(2),
      safeMaxVoltage: safeMaxV.toFixed(1),
      willBurnout: maxVoltage > safeMaxV,
      dataPoints,
      scientificSummary: `A ${resistance}Ω resistor rated at ${powerRating}W can sustain up to ${safeMaxV.toFixed(1)}V before thermal burnout occurs.`
    };
  }

  /**
   * Runs what-if dynamic simulation for Boyle's Law
   */
  simulateBoylesLaw(params) {
    // params: { temperatureC, initialVolume, gasMoles }
    const { temperatureC, initialVolume, gasMoles } = params;
    const R = 8.314; // J/(mol*K)
    const tempK = temperatureC + 273.15;
    const dataPoints = [];

    // P = nRT / V
    for (let v = 10; v <= initialVolume; v += 2) {
      const vM3 = v * 1e-6;
      const pPa = (gasMoles * 1e-3 * R * tempK) / vM3;
      const pkPa = pPa / 1000;
      dataPoints.push({
        volume: v,
        pressure: pkPa,
        invVolume: (1 / v).toFixed(4),
        pvProduct: (pkPa * v).toFixed(1)
      });
    }

    return {
      kConstant: (dataPoints[0].pressure * dataPoints[0].volume).toFixed(1),
      tempK: tempK.toFixed(1),
      dataPoints,
      scientificSummary: `At ${temperatureC}°C (${tempK.toFixed(1)} K), the pressure-volume product constant P×V is approximately ${(dataPoints[0].pressure * dataPoints[0].volume).toFixed(1)} kPa·mL.`
    };
  }
}

const whatIfEngine = new WhatIfEngine();
