"""
Ohm's Law & DC Circuit Analysis Experiment Logic
"""

import math
from .base_experiment import BaseExperiment

class CircuitOhmsLawExperiment(BaseExperiment):
    def __init__(self):
        super().__init__(
            experiment_id='circ_ohms_law',
            title="Ohm's Law & Circuit Analysis (V = IR)",
            subject="Electronics"
        )

    def get_initial_state(self, difficulty="Intermediate (Standard)"):
        return {
            'voltage_v': 5.0,
            'resistance_ohm': 50.0,
            'resistor_power_rating_w': 2.0,
            'voltmeter_mode': 'parallel', # 'parallel' or 'series'
            'ammeter_mode': 'series',    # 'series' or 'parallel'
            'load_type': 'resistor',    # 'resistor' or 'filament_bulb'
            'circuit_closed': True,
            'component_burned': False,
            'current_a': 0.10,
            'measured_voltage': 5.0,
            'power_w': 0.50,
            'is_completed': False
        }

    def evaluate_step(self, step_index, action_type, action_payload, session_state):
        is_error = False
        error_type = None
        ai_feedback = "Action executed safely."
        safety_penalty = 0.0
        accuracy_penalty = 0.0
        updated_state = dict(session_state)

        if updated_state.get('component_burned'):
            return {
                'is_error': True,
                'error_type': 'burned_component_inoperative',
                'ai_feedback': "🚨 Circuit Inoperative: The resistor has burned out! Reset the component or lower the source voltage before taking further measurements.",
                'safety_penalty': 0.0,
                'accuracy_penalty': 0.0,
                'updated_state': updated_state
            }

        if action_type == 'set_voltage':
            v = float(action_payload.get('voltage_v', 5.0))
            updated_state['voltage_v'] = v
            updated_state = self._recalculate_circuit(updated_state)

        elif action_type == 'set_resistance':
            r = float(action_payload.get('resistance_ohm', 50.0))
            updated_state['resistance_ohm'] = r
            updated_state = self._recalculate_circuit(updated_state)

        elif action_type == 'toggle_switch':
            updated_state['circuit_closed'] = bool(action_payload.get('closed', True))
            updated_state = self._recalculate_circuit(updated_state)

        elif action_type == 'set_meter_connection':
            v_mode = action_payload.get('voltmeter', updated_state['voltmeter_mode'])
            a_mode = action_payload.get('ammeter', updated_state['ammeter_mode'])

            updated_state['voltmeter_mode'] = v_mode
            updated_state['ammeter_mode'] = a_mode

            if v_mode == 'series':
                is_error = True
                error_type = 'voltmeter_series_miswiring'
                ai_feedback = "⚠️ Wiring Fault: Voltmeter connected in series! Voltmeters have extremely high internal resistance (~1MΩ). Connecting in series blocks current flow through the main circuit."
                accuracy_penalty = 15.0

            if a_mode == 'parallel':
                is_error = True
                error_type = 'ammeter_parallel_short'
                ai_feedback = "🚨 Dangerous Wiring Fault: Ammeter connected in parallel! Ammeters have near-zero internal resistance. Connecting in parallel creates a short circuit across the power supply!"
                safety_penalty = 25.0

            updated_state = self._recalculate_circuit(updated_state)

        # Check burn out condition
        if updated_state['power_w'] > updated_state['resistor_power_rating_w']:
            is_error = True
            error_type = 'component_thermal_burnout'
            updated_state['component_burned'] = True
            updated_state['current_a'] = 0.0
            ai_feedback = f"💥 Thermal Burnout Warning! Power dissipated P = {updated_state['power_w']} W exceeded maximum resistor rating ({updated_state['resistor_power_rating_w']} W). The resistor overheated and burned out into an open circuit."
            safety_penalty = 30.0

        elif not is_error:
            ai_feedback = f"⚡ Circuit Operating: V = {updated_state['voltage_v']} V, I = {updated_state['current_a']} A, R = {updated_state['resistance_ohm']} Ω, Power = {updated_state['power_w']} W."

        return {
            'is_error': is_error,
            'error_type': error_type,
            'ai_feedback': ai_feedback,
            'safety_penalty': safety_penalty,
            'accuracy_penalty': accuracy_penalty,
            'updated_state': updated_state
        }

    def _recalculate_circuit(self, state):
        v = state['voltage_v']
        r = state['resistance_ohm']
        closed = state['circuit_closed']
        v_mode = state['voltmeter_mode']
        a_mode = state['ammeter_mode']

        if not closed or state.get('component_burned'):
            state['current_a'] = 0.0
            state['measured_voltage'] = 0.0
            state['power_w'] = 0.0
            return state

        if v_mode == 'series':
            # Voltmeter in series blocks current
            state['current_a'] = round(v / 1000000.0, 6)
            state['measured_voltage'] = round(v, 2)
            state['power_w'] = 0.0
            return state

        if a_mode == 'parallel':
            # Ammeter short circuit
            state['current_a'] = 10.0 # Fuse trip/max power supply output limit
            state['power_w'] = round(v * 10.0, 2)
            return state

        # Normal Ohm's Law
        i = round(v / r, 3) if r > 0 else 0.0
        p = round(v * i, 2)

        state['current_a'] = i
        state['measured_voltage'] = v
        state['power_w'] = p
        return state

    def calculate_results(self, session_state, step_logs):
        v = session_state.get('voltage_v', 5.0)
        r = session_state.get('resistance_ohm', 50.0)
        i_measured = session_state.get('current_a', 0.10)
        burned = session_state.get('component_burned', False)

        i_calc = round(v / r, 3) if r > 0 else 0.0
        pct_err = 0.0 if burned else round(abs(i_measured - i_calc) / i_calc * 100, 2) if i_calc > 0 else 0.0

        score = 0.0 if burned else max(0, round(100 - pct_err * 2.0, 1))

        return {
            'voltage_v': v,
            'resistance_ohm': r,
            'measured_current_a': i_measured,
            'expected_current_a': i_calc,
            'power_dissipated_w': session_state.get('power_w', 0.5),
            'burned_out': burned,
            'percent_error': pct_err,
            'overall_score': score
        }

    def perform_root_cause_analysis(self, step_logs, session_state):
        causes = []
        burned = session_state.get('component_burned', False)
        v_mode = session_state.get('voltmeter_mode', 'parallel')
        a_mode = session_state.get('ammeter_mode', 'series')
        p_dissip = session_state.get('power_w', 0.0)

        if burned or p_dissip > 2.0:
            v = session_state.get('voltage_v', 5.0)
            r = session_state.get('resistance_ohm', 50.0)
            causes.append({
                'finding': f'Thermal Overload & Component Burnout (P = {p_dissip} W > 2.0 W)',
                'scientific_reason': f'According to Joule Heating Law P = V²/R = ({v}²)/{r} = {p_dissip} W, electrical energy converted to thermal energy exceeded the dissipation threshold of the resistor material, resulting in physical destruction of the resistive film.',
                'corrective_action': 'Check component wattage limits before applying high voltage. Use P = V²/R to verify P ≤ 2.0 W.'
            })

        if v_mode == 'series':
            causes.append({
                'finding': 'Voltmeter In-Series Wiring Misstep',
                'scientific_reason': 'Voltmeters are designed with megaohm internal resistance to avoid drawing current when connected across a potential difference (in parallel). Placing them in series drops almost all voltage across the meter and reduces circuit current to microamps.',
                'corrective_action': 'Always connect voltmeters in PARALLEL across the component whose voltage drop you wish to measure.'
            })

        if a_mode == 'parallel':
            causes.append({
                'finding': 'Ammeter In-Parallel Short Circuit',
                'scientific_reason': 'Ammeters have near-zero internal impedance so they do not alter circuit resistance. Placing an ammeter in parallel bypasses the load resistor, providing an ultra-low resistance path that draws maximum current.',
                'corrective_action': 'Always break the circuit loop and insert the ammeter in SERIES.'
            })

        if not causes:
            causes.append({
                'finding': 'Verifiable Ohm\'s Law linear relationship (V = I * R)',
                'scientific_reason': 'Voltmeter and ammeter placement adhered to ideal circuit theory, keeping component temperature within safe dissipation parameters.',
                'corrective_action': 'Explore non-linear V-I characteristics using an incandescent tungsten lamp filament.'
            })

        return causes

    def compute_what_if(self, what_if_params, session_state):
        r_val = float(what_if_params.get('resistance_ohm', 50.0))

        v_i_curve = []
        for v in [round(i * 0.5, 1) for i in range(0, 25)]:
            i = round(v / r_val, 3) if r_val > 0 else 0.0
            p = round(v * i, 2)
            burned = p > 2.0
            v_i_curve.append({'voltage_v': v, 'current_a': 0.0 if burned else i, 'power_w': p, 'burned': burned})

        return {
            'simulated_resistance_ohm': r_val,
            'max_safe_voltage_v': round(math.sqrt(2.0 * r_val), 2),
            'v_i_curve': v_i_curve,
            'insight': f"For a {r_val} Ω resistor (2.0 W rating), maximum safe voltage before thermal burnout is {round(math.sqrt(2.0 * r_val), 2)} V."
        }
