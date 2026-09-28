"""
Simple Pendulum & Gravitational Acceleration Experiment Logic
"""

import math
from .base_experiment import BaseExperiment

class PhysicsPendulumExperiment(BaseExperiment):
    def __init__(self):
        super().__init__(
            experiment_id='phys_pendulum',
            title="Simple Pendulum & Gravitational Acceleration (g)",
            subject="Physics"
        )

    GRAVITY_MAP = {
        'Earth': 9.81,
        'Moon': 1.62,
        'Mars': 3.71,
        'Jupiter': 24.79
    }

    def get_initial_state(self, difficulty="Intermediate (Standard)"):
        return {
            'length_m': 1.0,
            'mass_kg': 0.5,
            'angle_deg': 10.0,
            'planet': 'Earth',
            'g_true': 9.81,
            'num_swings_measured': 10,
            'measured_period_s': None,
            'calculated_g': None,
            'is_completed': False
        }

    def evaluate_step(self, step_index, action_type, action_payload, session_state):
        is_error = False
        error_type = None
        ai_feedback = "Action executed safely."
        safety_penalty = 0.0
        accuracy_penalty = 0.0
        updated_state = dict(session_state)

        if action_type == 'set_length':
            length = float(action_payload.get('length_m', 1.0))
            if length < 0.1 or length > 2.5:
                is_error = True
                error_type = 'invalid_length'
                ai_feedback = "⚠️ Equipment Limit: String length must be between 0.1m and 2.5m."
                safety_penalty = 5.0
            else:
                updated_state['length_m'] = length
                ai_feedback = f"✓ Pendulum string length set to {length} m."

        elif action_type == 'set_angle':
            angle = float(action_payload.get('angle_deg', 10.0))
            updated_state['angle_deg'] = angle
            if angle > 15.0:
                is_error = True
                error_type = 'large_angle_violation'
                ai_feedback = f"⚠️ Small-Angle Approximation Warning: You released the pendulum at {angle}°. For simple harmonic motion equation T = 2π√(L/g) to hold, the release angle must be ≤ 15°. Larger angles introduce non-linear period elongation."
                accuracy_penalty = 15.0
            else:
                ai_feedback = f"✓ Release angle set to {angle}° (Valid small angle region)."

        elif action_type == 'set_planet':
            planet = action_payload.get('planet', 'Earth')
            updated_state['planet'] = planet
            updated_state['g_true'] = self.GRAVITY_MAP.get(planet, 9.81)
            ai_feedback = f"🪐 Celestial environment set to {planet} (g = {updated_state['g_true']} m/s²)."

        elif action_type == 'record_swings':
            swings = int(action_payload.get('swings', 10))
            total_time = float(action_payload.get('total_time_s', 0.0))
            updated_state['num_swings_measured'] = swings

            if swings < 5:
                is_error = True
                error_type = 'insufficient_swings'
                ai_feedback = f"⚠️ Experimental Error: Timing only {swings} swing(s) results in high relative human reaction error! Measure 10 to 20 full oscillations and divide total time by N to find periodic time T."
                accuracy_penalty = 20.0
            else:
                measured_t = round(total_time / swings, 3)
                updated_state['measured_period_s'] = measured_t

                # Calculate experimental g: g = 4 * pi^2 * L / T^2
                calc_g = round((4 * (math.pi ** 2) * updated_state['length_m']) / (measured_t ** 2), 2) if measured_t > 0 else 0.0
                updated_state['calculated_g'] = calc_g
                updated_state['is_completed'] = True

                pct_err = round(abs(calc_g - updated_state['g_true']) / updated_state['g_true'] * 100, 2)
                ai_feedback = f"⏱️ Recorded {swings} swings in {total_time}s -> Period T = {measured_t}s. Calculated g = {calc_g} m/s² ({pct_err}% error vs true {updated_state['g_true']} m/s²)."

        return {
            'is_error': is_error,
            'error_type': error_type,
            'ai_feedback': ai_feedback,
            'safety_penalty': safety_penalty,
            'accuracy_penalty': accuracy_penalty,
            'updated_state': updated_state
        }

    def calculate_results(self, session_state, step_logs):
        g_true = session_state.get('g_true', 9.81)
        g_calc = session_state.get('calculated_g', 0.0)
        t_measured = session_state.get('measured_period_s', 0.0)
        length = session_state.get('length_m', 1.0)

        t_theoretical = round(2 * math.pi * math.sqrt(length / g_true), 3)
        pct_error = round(abs(g_calc - g_true) / g_true * 100, 2) if g_calc and g_true else 0.0

        score = max(0, round(100 - pct_error * 2.5, 1))

        return {
            'string_length_m': length,
            'planet': session_state.get('planet', 'Earth'),
            'measured_period_s': t_measured,
            'theoretical_period_s': t_theoretical,
            'calculated_g': g_calc,
            'true_g': g_true,
            'percent_error': pct_error,
            'overall_score': score
        }

    def perform_root_cause_analysis(self, step_logs, session_state):
        causes = []
        angle = session_state.get('angle_deg', 10.0)
        swings = session_state.get('num_swings_measured', 10)
        g_calc = session_state.get('calculated_g', 0.0)
        g_true = session_state.get('g_true', 9.81)

        if angle > 15.0:
            correction_factor = round((1 + (1/16) * ((math.radians(angle))**2)), 3)
            causes.append({
                'finding': f'Large Initial Angle ({angle}° > 15°)',
                'scientific_reason': f'The formula T = 2π√(L/g) assumes sin(θ) ≈ θ in radians. Releasing at {angle}° introduces higher-order terms: T_actual = T_ideal * (1 + θ²/16), inflating the observed period by factor {correction_factor}, causing calculated g ({g_calc} m/s²) to be lower than true g ({g_true} m/s²).',
                'corrective_action': 'Keep release angle under 15° (preferably 5° to 10°) for simple harmonic motion experiments.'
            })

        if swings < 5:
            causes.append({
                'finding': 'Low Sample Size of Swings',
                'scientific_reason': 'Human stopwatch reaction error (typically ±0.2 seconds) constitutes over 10% error when measuring 1 or 2 swings. Measuring 10-20 swings dilutes reaction error across all cycles.',
                'corrective_action': 'Count 10 or 20 full back-and-forth oscillations before stopping timer, then divide total time by N.'
            })

        if not causes:
            causes.append({
                'finding': 'Ideal Harmonic Timing',
                'scientific_reason': f'Small angle condition was respected, string length L was measured accurately, and reaction error was minimized. Periodic time T matched restored gravitational torque acceleration.',
                'corrective_action': 'Proceed to test pendulum performance under extraterrestrial gravitational fields.'
            })

        return causes

    def compute_what_if(self, what_if_params, session_state):
        # Parametric what-if for different celestial bodies or lengths
        planet = what_if_params.get('planet', 'Moon')
        g_val = self.GRAVITY_MAP.get(planet, 1.62)
        curr_l = session_state.get('length_m', 1.0)

        curve = []
        for l in [round(i * 0.1, 1) for i in range(2, 25)]:
            t = round(2 * math.pi * math.sqrt(l / g_val), 3)
            curve.append({'length_m': l, 'period_s': t})

        return {
            'simulated_planet': planet,
            'simulated_g': g_val,
            'curve': curve,
            'insight': f"On {planet} (g = {g_val} m/s²), a 1.0m pendulum has a periodic time of {round(2*math.pi*math.sqrt(1.0/g_val), 2)}s, compared to 2.01s on Earth."
        }
