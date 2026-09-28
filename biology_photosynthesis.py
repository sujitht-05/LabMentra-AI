"""
Plant Photosynthesis & Light Intensity Biology Experiment Logic
"""

import math
from .base_experiment import BaseExperiment

class BiologyPhotosynthesisExperiment(BaseExperiment):
    def __init__(self):
        super().__init__(
            experiment_id='bio_photosynthesis',
            title="Plant Photosynthesis & Light Intensity",
            subject="Biology"
        )

    COLOR_EFFICIENCY = {
        'White': 1.0,
        'Red': 0.90,
        'Blue': 0.85,
        'Green': 0.15 # Reflects green!
    }

    def get_initial_state(self, difficulty="Intermediate (Standard)"):
        return {
            'light_distance_cm': 30.0,
            'light_color': 'White',
            'co2_bicarbonate_added': True,
            'water_temp_c': 22.0,
            'bubbles_per_min': 24,
            'total_o2_collected_ml': 0.0,
            'plant_thermal_damage': False,
            'is_completed': False
        }

    def evaluate_step(self, step_index, action_type, action_payload, session_state):
        is_error = False
        error_type = None
        ai_feedback = "Action executed safely."
        safety_penalty = 0.0
        accuracy_penalty = 0.0
        updated_state = dict(session_state)

        if action_type == 'set_distance':
            dist = float(action_payload.get('distance_cm', 30.0))
            updated_state['light_distance_cm'] = dist

            if dist < 5.0:
                is_error = True
                error_type = 'lamp_overheating'
                updated_state['plant_thermal_damage'] = True
                updated_state['water_temp_c'] = 45.0
                ai_feedback = "🚨 Thermal Damage! Lamp placed at <5cm overheated the aquatic beaker (>45°C), denaturing photosynthetic enzymes (Rubisco) and ceasing oxygen production."
                safety_penalty = 20.0
            else:
                updated_state['plant_thermal_damage'] = False
                updated_state['water_temp_c'] = 22.0
                ai_feedback = f"✓ Light distance set to {dist} cm."

        elif action_type == 'set_color_filter':
            color = action_payload.get('color', 'White')
            updated_state['light_color'] = color
            if color == 'Green':
                ai_feedback = "💡 Notice: Green filter applied. Chlorophyll pigments reflect green light rather than absorbing it. Watch oxygen output decline significantly!"
            else:
                ai_feedback = f"✓ Light color spectrum set to {color}."

        elif action_type == 'toggle_bicarbonate':
            added = bool(action_payload.get('added', True))
            updated_state['co2_bicarbonate_added'] = added
            if not added:
                is_error = True
                error_type = 'co2_depletion'
                ai_feedback = "⚠️ Warning: Sodium Bicarbonate (NaHCO3) is missing! Without dissolved CO2 in the beaker, the Calvin Cycle lacks inorganic carbon for photosynthetic output."
                accuracy_penalty = 15.0
            else:
                ai_feedback = "✓ Sodium Bicarbonate present. Dissolved CO2 available for carbon fixation."

        elif action_type == 'measure_bubbles':
            timer_min = float(action_payload.get('timer_min', 1.0))
            updated_state = self._recalculate_bubbles(updated_state)
            bubbles = updated_state['bubbles_per_min']

            collected_ml = round(updated_state['total_o2_collected_ml'] + (bubbles * 0.05 * timer_min), 2)
            updated_state['total_o2_collected_ml'] = collected_ml
            updated_state['is_completed'] = True

            ai_feedback = f"🌿 Observation: Recorded {bubbles} O₂ bubbles/min under {updated_state['light_color']} light at {updated_state['light_distance_cm']} cm distance."

        updated_state = self._recalculate_bubbles(updated_state)

        return {
            'is_error': is_error,
            'error_type': error_type,
            'ai_feedback': ai_feedback,
            'safety_penalty': safety_penalty,
            'accuracy_penalty': accuracy_penalty,
            'updated_state': updated_state
        }

    def _recalculate_bubbles(self, state):
        if state.get('plant_thermal_damage') or not state.get('co2_bicarbonate_added'):
            state['bubbles_per_min'] = 0
            return state

        dist = state['light_distance_cm']
        color = state['light_color']

        # Inverse square law: Intensity I = 10000 / (dist^2)
        intensity = 10000.0 / (dist ** 2)
        efficiency = self.COLOR_EFFICIENCY.get(color, 1.0)

        # Michaelis-Menten kinetics curve for light saturation
        max_rate = 60 # max bubbles per min
        km = 10.0      # saturation constant
        rate = max_rate * (intensity / (intensity + km)) * efficiency

        state['bubbles_per_min'] = round(rate)
        return state

    def calculate_results(self, session_state, step_logs):
        dist = session_state.get('light_distance_cm', 30.0)
        color = session_state.get('light_color', 'White')
        bubbles = session_state.get('bubbles_per_min', 0)
        co2_ok = session_state.get('co2_bicarbonate_added', True)
        damaged = session_state.get('plant_thermal_damage', False)

        score = 0.0 if (damaged or not co2_ok) else round(min(100, (bubbles / 45.0) * 100), 1)

        return {
            'light_distance_cm': dist,
            'light_color': color,
            'bubbles_per_min': bubbles,
            'dissolved_co2_present': co2_ok,
            'plant_health': 'Damaged (Overheated)' if damaged else 'Optimal',
            'overall_score': score
        }

    def perform_root_cause_analysis(self, step_logs, session_state):
        causes = []
        damaged = session_state.get('plant_thermal_damage', False)
        co2_ok = session_state.get('co2_bicarbonate_added', True)
        color = session_state.get('light_color', 'White')
        dist = session_state.get('light_distance_cm', 30.0)

        if damaged:
            causes.append({
                'finding': 'Thermal Denaturation of Enzymes (Light Distance < 5cm)',
                'scientific_reason': 'Incandescent light sources emit high infrared thermal radiation. At ultra-close proximity, water temperature exceeds 40°C, causing irreversible conformational denaturation of photosynthetic enzymes (Rubisco and Photosystem II proteins).',
                'corrective_action': 'Place heat-absorbing glass barrier or maintain light distance at ≥ 10 cm.'
            })

        if not co2_ok:
            causes.append({
                'finding': 'Carbon Dioxide Depletion Limiting Factor',
                'scientific_reason': 'Photosynthesis overall equation requires inorganic carbon: 6 CO₂ + 6 H₂O + light -> C₆H₁₂O₆ + 6 O₂. Without Sodium Bicarbonate (NaHCO₃), carbon fixation halts in the stroma.',
                'corrective_action': 'Add 0.2% NaHCO₃ solution to supply constant hydrogen carbonate ions.'
            })

        if color == 'Green':
            causes.append({
                'finding': 'Wavelength Absorption Drop Under Green Light Filter',
                'scientific_reason': 'Chlorophyll a and b pigments absorb photons predominantly in the blue (430-450 nm) and red (640-660 nm) spectral bands. Green wavelengths (500-550 nm) are reflected/transmitted, resulting in minimal photosynthetic action potential.',
                'corrective_action': 'Use Red or Blue wavelength filters to maximize photosynthetic oxygen evolution.'
            })

        if not causes:
            causes.append({
                'finding': 'Verified Inverse Square Law & High Oxygen Yield',
                'scientific_reason': 'Light intensity dropped proportionally to 1/d². Chlorophyll absorption efficiency and carbon substrate concentrations were optimal.',
                'corrective_action': 'Proceed to compare monochromatic light action spectrums.'
            })

        return causes

    def compute_what_if(self, what_if_params, session_state):
        color = what_if_params.get('light_color', 'Red')
        efficiency = self.COLOR_EFFICIENCY.get(color, 0.90)

        distance_curve = []
        for d in range(10, 101, 5):
            intensity = 10000.0 / (d ** 2)
            rate = round(60 * (intensity / (intensity + 10.0)) * efficiency)
            distance_curve.append({'distance_cm': d, 'bubbles_per_min': rate})

        return {
            'simulated_color': color,
            'spectral_efficiency': efficiency,
            'curve': distance_curve,
            'insight': f"Under {color} filter (efficiency {int(efficiency*100)}%), maximum bubble production reaches {max([p['bubbles_per_min'] for p in distance_curve])} bubbles/min at 10cm."
        }
