"""
Acid-Base Titration Virtual Experiment Logic
"""

import math
from .base_experiment import BaseExperiment

class ChemistryTitrationExperiment(BaseExperiment):
    def __init__(self):
        super().__init__(
            experiment_id='chem_titration',
            title="Acid-Base Titration (HCl + NaOH)",
            subject="Chemistry"
        )

    def get_initial_state(self, difficulty="Intermediate (Standard)"):
        target_molarity = 0.125
        if "Advanced" in difficulty:
            import random
            target_molarity = round(random.uniform(0.08, 0.22), 3)

        return {
            'hcl_volume_ml': 25.0,
            'hcl_molarity_true': target_molarity,
            'naoh_molarity': 0.100,
            'indicator_added': False,
            'burette_initial_ml': 0.0,
            'naoh_volume_added_ml': 0.0,
            'current_ph': 1.0,
            'flask_color': 'transparent',
            'is_completed': False,
            'equivalence_vol_ml': round((target_molarity * 25.0) / 0.100, 2)
        }

    def evaluate_step(self, step_index, action_type, action_payload, session_state):
        is_error = False
        error_type = None
        ai_feedback = "Action executed safely."
        safety_penalty = 0.0
        accuracy_penalty = 0.0
        updated_state = dict(session_state)

        if action_type == 'add_indicator':
            if updated_state['naoh_volume_added_ml'] > 0:
                is_error = True
                error_type = 'indicator_added_late'
                ai_feedback = "⚠️ Procedural Misstep: You added phenolphthalein AFTER titrant addition began! The indicator must be added to the acid flask before titration so the color change at equivalence point can be observed from start to finish."
                safety_penalty = 5.0
            else:
                updated_state['indicator_added'] = True
                ai_feedback = "✓ Phenolphthalein indicator added. The solution remains colorless in acidic pH."

        elif action_type == 'adjust_valve':
            flow_rate = action_payload.get('flow_rate', 'drop') # 'off', 'drop', 'fast'
            vol_added = updated_state['naoh_volume_added_ml']
            v_eq = updated_state['equivalence_vol_ml']

            if not updated_state['indicator_added'] and flow_rate != 'off':
                is_error = True
                error_type = 'missing_indicator'
                ai_feedback = "⚠️ Warning: You started dispensing NaOH without adding an indicator! Without phenolphthalein, you won't observe the pH endpoint color change."
                safety_penalty = 10.0

            if flow_rate == 'fast' and vol_added > (v_eq - 3.0):
                is_error = True
                error_type = 'high_flow_near_endpoint'
                ai_feedback = "⚠️ Technique Error: High flow rate near the expected equivalence point! When close to the endpoint (faint pink transition), switch to drop-by-drop addition to avoid over-shooting."
                accuracy_penalty = 15.0

        elif action_type == 'dispense_volume':
            added_amount = action_payload.get('amount_ml', 0.1)
            updated_state['naoh_volume_added_ml'] = round(updated_state['naoh_volume_added_ml'] + added_amount, 2)
            vol = updated_state['naoh_volume_added_ml']
            v_eq = updated_state['equivalence_vol_ml']

            # Calculate theoretical pH
            updated_state['current_ph'] = self._calculate_ph(vol, updated_state['hcl_volume_ml'], updated_state['hcl_molarity_true'], updated_state['naoh_molarity'])

            # Determine solution color
            if not updated_state['indicator_added']:
                updated_state['flask_color'] = 'transparent'
            elif vol < v_eq - 0.2:
                updated_state['flask_color'] = 'transparent'
            elif v_eq - 0.2 <= vol <= v_eq + 0.2:
                updated_state['flask_color'] = 'faint_pink' # Ideal endpoint!
            else:
                updated_state['flask_color'] = 'dark_magenta' # Over-titrated

            if vol > v_eq + 2.0:
                is_error = True
                error_type = 'severe_over_titration'
                ai_feedback = "🚨 Endpoint Missed! Flask turned dark magenta. You have significantly over-titrated past the equivalence point. Stop the burette and record the final volume."
                accuracy_penalty = 25.0

        elif action_type == 'record_endpoint':
            vol = updated_state['naoh_volume_added_ml']
            v_eq = updated_state['equivalence_vol_ml']
            calc_molarity = round((updated_state['naoh_molarity'] * vol) / updated_state['hcl_volume_ml'], 4)
            updated_state['calculated_molarity'] = calc_molarity
            updated_state['is_completed'] = True

            diff = abs(vol - v_eq)
            if diff <= 0.2:
                ai_feedback = f"🌟 Outstanding Precision! Endpoint captured perfectly at {vol} mL NaOH. Calculated HCl Molarity: {calc_molarity} M (True: {updated_state['hcl_molarity_true']} M)."
            else:
                is_error = True
                error_type = 'endpoint_accuracy_error'
                pct_err = round(abs(calc_molarity - updated_state['hcl_molarity_true']) / updated_state['hcl_molarity_true'] * 100, 2)
                ai_feedback = f"⚠️ End Point Variance: Recorded NaOH volume is {vol} mL (Ideal: {v_eq} mL). Calculated HCl concentration: {calc_molarity} M ({pct_err}% error)."
                accuracy_penalty = min(pct_err * 1.5, 40.0)

        return {
            'is_error': is_error,
            'error_type': error_type,
            'ai_feedback': ai_feedback,
            'safety_penalty': safety_penalty,
            'accuracy_penalty': accuracy_penalty,
            'updated_state': updated_state
        }

    def _calculate_ph(self, v_base, v_acid, m_acid, m_base):
        n_acid = (v_acid / 1000.0) * m_acid
        n_base = (v_base / 1000.0) * m_base
        total_vol = (v_acid + v_base) / 1000.0

        if n_base < n_acid:
            rem_acid = n_acid - n_base
            h_conc = rem_acid / total_vol
            ph = -math.log10(max(h_conc, 1e-14))
        elif abs(n_base - n_acid) < 1e-6:
            ph = 7.0
        else:
            excess_base = n_base - n_acid
            oh_conc = excess_base / total_vol
            poh = -math.log10(max(oh_conc, 1e-14))
            ph = 14.0 - poh
        return round(max(1.0, min(ph, 13.5)), 2)

    def calculate_results(self, session_state, step_logs):
        v_added = session_state.get('naoh_volume_added_ml', 0.0)
        m_base = session_state.get('naoh_molarity', 0.100)
        v_acid = session_state.get('hcl_volume_ml', 25.0)
        m_true = session_state.get('hcl_molarity_true', 0.125)

        m_calc = round((m_base * v_added) / v_acid, 4) if v_acid > 0 else 0.0
        pct_error = round(abs(m_calc - m_true) / m_true * 100, 2) if m_true > 0 else 0.0

        score = max(0, round(100 - pct_error * 2.0, 1))

        return {
            'v_naoh_used_ml': v_added,
            'calculated_hcl_molarity': m_calc,
            'true_hcl_molarity': m_true,
            'percent_error': pct_error,
            'final_ph': session_state.get('current_ph', 7.0),
            'final_color': session_state.get('flask_color', 'faint_pink'),
            'overall_score': score
        }

    def perform_root_cause_analysis(self, step_logs, session_state):
        errors = [log for log in step_logs if log.get('is_error')]
        causes = []

        v_added = session_state.get('naoh_volume_added_ml', 0.0)
        v_eq = session_state.get('equivalence_vol_ml', 31.25)
        m_true = session_state.get('hcl_molarity_true', 0.125)
        m_calc = session_state.get('calculated_molarity', 0.0)

        if not session_state.get('indicator_added'):
            causes.append({
                'finding': 'Missing Indicator',
                'scientific_reason': 'Phenolphthalein indicator provides visual notification of the equivalence point (pH 8.2-10). Without it, titration proceeds blindly beyond neutral equivalence.',
                'corrective_action': 'Always add 2-3 drops of phenolphthalein indicator to the analyte flask before opening the burette stopcock.'
            })

        if v_added > v_eq + 0.3:
            excess_ml = round(v_added - v_eq, 2)
            causes.append({
                'finding': f'Excess Titrant Addition (+{excess_ml} mL NaOH)',
                'scientific_reason': f'According to stoichiometric law (Ma Va = Mb Vb), adding excess volume (Vb = {v_added} mL vs ideal {v_eq} mL) artificially inflates the calculated acid molarity ({m_calc} M vs true {m_true} M). The solution turned dark pink because hydroxide ions (OH-) exceeded hydrogen ions (H+).',
                'corrective_action': 'Slow down stopcock to drop-by-drop rate when within 2 mL of expected equivalence volume. Stop as soon as a faint persistent pink color appears for 30 seconds.'
            })

        if any(e.get('error_type') == 'high_flow_near_endpoint' for e in errors):
            causes.append({
                'finding': 'Excessive Stopcock Flow Near Endpoint',
                'scientific_reason': 'Rapid volumetric delivery near equivalence prevents localized mixing and causes overshooting before visual detection can react.',
                'corrective_action': 'Swirl the Erlenmeyer flask continuously while dispensing single drops near the endpoint.'
            })

        if not causes:
            causes.append({
                'finding': 'Flawless Volumetric Technique',
                'scientific_reason': 'The volume of standard NaOH solution added matched the stoichiometric equivalent of HCl present in the flask. Neutralization reaction: HCl + NaOH -> NaCl + H2O reached exact 1:1 mole ratio.',
                'corrective_action': 'Maintain this precise titrant delivery technique for future redox and complexometric titrations.'
            })

        return causes

    def compute_what_if(self, what_if_params, session_state):
        # Allow varying NaOh Molarity (0.05 to 0.50 M) or Acid Volume
        m_base = float(what_if_params.get('naoh_molarity', 0.100))
        m_acid = float(session_state.get('hcl_molarity_true', 0.125))
        v_acid = float(session_state.get('hcl_volume_ml', 25.0))

        v_eq_sim = round((m_acid * v_acid) / m_base, 2)

        curve_data = []
        for v in [round(i * 0.5, 1) for i in range(0, int((v_eq_sim * 1.5) * 2))]:
            ph = self._calculate_ph(v, v_acid, m_acid, m_base)
            curve_data.append({'v_naoh_ml': v, 'ph': ph})

        return {
            'simulated_equivalence_vol_ml': v_eq_sim,
            'simulated_naoh_molarity': m_base,
            'titration_curve': curve_data,
            'insight': f"If NaOH concentration is changed to {m_base} M, the equivalence point shifts to {v_eq_sim} mL of NaOH."
        }
