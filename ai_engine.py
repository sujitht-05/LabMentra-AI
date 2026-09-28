"""
LabMentra AI Core Intelligent Engine
Coordinates action-based error detection, root-cause analysis, concept mastery updates,
adaptive difficulty, and personalized recommendations.
"""

import json
from datetime import datetime
from database import get_db
from experiments import get_experiment

class AIEngine:
    @staticmethod
    def start_session(user_id, experiment_id, difficulty=None):
        conn = get_db()
        cursor = conn.cursor()

        # Check existing user mastery for adaptive difficulty recommendation if not specified
        cursor.execute("SELECT * FROM concept_mastery WHERE user_id = ?", (user_id,))
        mastery_records = cursor.fetchall()

        if not difficulty:
            avg_score = 75.0
            if mastery_records:
                avg_score = sum(r['precision_score'] for r in mastery_records) / len(mastery_records)

            if avg_score < 60.0:
                difficulty = "Beginner (Guided)"
            elif avg_score < 85.0:
                difficulty = "Intermediate (Standard)"
            else:
                difficulty = "Advanced (Challenge)"

        exp_instance = get_experiment(experiment_id)
        if not exp_instance:
            raise ValueError(f"Experiment {experiment_id} not found.")

        initial_state = exp_instance.get_initial_state(difficulty)
        session_id = f"sess_{int(datetime.now().timestamp())}"

        cursor.execute('''
            INSERT INTO sessions (id, user_id, experiment_id, difficulty, status, safety_score, accuracy_score)
            VALUES (?, ?, ?, ?, 'in_progress', 100.0, 100.0)
        ''', (session_id, user_id, experiment_id, difficulty))

        conn.commit()
        conn.close()

        return {
            'session_id': session_id,
            'experiment_id': experiment_id,
            'difficulty': difficulty,
            'state': initial_state
        }

    @staticmethod
    def process_step(session_id, action_type, action_payload, current_state):
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session = cursor.fetchone()
        if not session:
            conn.close()
            raise ValueError(f"Session {session_id} not found.")

        exp_instance = get_experiment(session['experiment_id'])
        cursor.execute("SELECT COUNT(*) FROM step_logs WHERE session_id = ?", (session_id,))
        step_index = cursor.fetchone()[0] + 1

        eval_result = exp_instance.evaluate_step(step_index, action_type, action_payload, current_state)

        # Update session scores
        new_safety = max(0.0, session['safety_score'] - eval_result['safety_penalty'])
        new_accuracy = max(0.0, session['accuracy_score'] - eval_result['accuracy_penalty'])

        cursor.execute('''
            UPDATE sessions SET safety_score = ?, accuracy_score = ? WHERE id = ?
        ''', (new_safety, new_accuracy, session_id))

        # Log step
        cursor.execute('''
            INSERT INTO step_logs (session_id, step_index, action_type, action_payload, is_error, error_type, ai_feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id,
            step_index,
            action_type,
            json.dumps(action_payload),
            1 if eval_result['is_error'] else 0,
            eval_result['error_type'],
            eval_result['ai_feedback']
        ))

        conn.commit()
        conn.close()

        eval_result['step_index'] = step_index
        eval_result['current_safety_score'] = new_safety
        eval_result['current_accuracy_score'] = new_accuracy
        return eval_result

    @staticmethod
    def complete_session(session_id, final_state, student_signature=""):
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        session = cursor.fetchone()
        if not session:
            conn.close()
            raise ValueError(f"Session {session_id} not found.")

        cursor.execute("SELECT * FROM step_logs WHERE session_id = ? ORDER BY step_index ASC", (session_id,))
        step_logs = [dict(row) for row in cursor.fetchall()]

        exp_instance = get_experiment(session['experiment_id'])
        calc_outcomes = exp_instance.calculate_results(final_state, step_logs)
        root_cause = exp_instance.perform_root_cause_analysis(step_logs, final_state)

        final_score = round((session['safety_score'] * 0.3) + (session['accuracy_score'] * 0.4) + (calc_outcomes['overall_score'] * 0.3), 1)

        # Update Session
        cursor.execute('''
            UPDATE sessions
            SET status = 'completed', end_time = CURRENT_TIMESTAMP, score = ?, student_signature = ?
            WHERE id = ?
        ''', (final_score, student_signature, session_id))

        # Update Concept Mastery
        cursor.execute("SELECT subject FROM experiments WHERE id = ?", (session['experiment_id'],))
        subject = cursor.fetchone()['subject']

        cursor.execute("SELECT * FROM concept_mastery WHERE user_id = ? AND subject = ?", (session['user_id'], subject))
        existing_mastery = cursor.fetchone()

        if existing_mastery:
            new_exp_count = existing_mastery['total_experiments'] + 1
            new_prec = round((existing_mastery['precision_score'] * 0.7) + (session['accuracy_score'] * 0.3), 1)
            new_safe = round((existing_mastery['safety_score'] * 0.7) + (session['safety_score'] * 0.3), 1)
            new_math = round((existing_mastery['math_score'] * 0.7) + (calc_outcomes['overall_score'] * 0.3), 1)
            new_speed = round(min(100.0, existing_mastery['speed_score'] + 2.0), 1)
            new_anal = round((existing_mastery['analysis_score'] * 0.7) + (final_score * 0.3), 1)

            cursor.execute('''
                UPDATE concept_mastery
                SET precision_score = ?, safety_score = ?, math_score = ?, speed_score = ?, analysis_score = ?, total_experiments = ?, last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND subject = ?
            ''', (new_prec, new_safe, new_math, new_speed, new_anal, new_exp_count, session['user_id'], subject))
        else:
            cursor.execute('''
                INSERT INTO concept_mastery (user_id, subject, precision_score, safety_score, math_score, speed_score, analysis_score, total_experiments)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ''', (session['user_id'], subject, session['accuracy_score'], session['safety_score'], calc_outcomes['overall_score'], 80.0, final_score))

        # Generate Lab Report Record
        report_id = f"rep_{int(datetime.now().timestamp())}"
        ai_grade = 'A+' if final_score >= 90 else ('A' if final_score >= 80 else ('B' if final_score >= 70 else 'C'))
        ai_feedback = f"Student demonstrated strong engagement with {subject} fundamentals. Final composite score: {final_score}%."

        cursor.execute('''
            INSERT INTO lab_reports (id, session_id, user_id, title, hypothesis, procedure_summary, observation_data, calculated_results, root_cause_analysis, ai_grade, ai_feedback, student_signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            report_id,
            session_id,
            session['user_id'],
            exp_instance.title,
            f"Testing {exp_instance.title} principles using virtual laboratory apparatus.",
            f"Executed {len(step_logs)} procedure steps in {session['difficulty']} mode.",
            json.dumps(final_state),
            json.dumps(calc_outcomes),
            json.dumps(root_cause),
            ai_grade,
            ai_feedback,
            student_signature
        ))

        # Generate Personalized Recommendations
        recommendations = AIEngine.get_recommendations(session['user_id'], session['experiment_id'], root_cause, final_score)

        conn.commit()
        conn.close()

        return {
            'report_id': report_id,
            'final_score': final_score,
            'safety_score': session['safety_score'],
            'accuracy_score': session['accuracy_score'],
            'outcomes': calc_outcomes,
            'root_cause_analysis': root_cause,
            'ai_grade': ai_grade,
            'recommendations': recommendations
        }

    @staticmethod
    def get_recommendations(user_id, current_exp_id, root_cause, score):
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT id, title, subject, icon FROM experiments WHERE id != ?", (current_exp_id,))
        other_exps = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM concept_mastery WHERE user_id = ?", (user_id,))
        masteries = {r['subject']: r for r in cursor.fetchall()}
        conn.close()

        recs = []

        # If lower score, recommend repeating at Guided difficulty or targeted practice
        if score < 75.0:
            recs.append({
                'experiment_id': current_exp_id,
                'title': f"Retry Experiment (Guided Mode)",
                'reason': "Perform this experiment again in Guided mode with step-by-step AI safety guardrails to reinforce procedural precision.",
                'tag': 'Skill Reinforcement'
            })

        # Find subject with lowest mastery
        lowest_subject = None
        min_val = 100.0
        for subj, record in masteries.items():
            avg_m = (record['precision_score'] + record['safety_score'] + record['math_score']) / 3.0
            if avg_m < min_val:
                min_val = avg_m
                lowest_subject = subj

        for exp in other_exps:
            if exp['subject'] == lowest_subject:
                recs.append({
                    'experiment_id': exp['id'],
                    'title': exp['title'],
                    'reason': f"Recommended to bolster your {exp['subject']} concept mastery (Current score: {round(min_val,1)}%).",
                    'tag': 'Targeted Growth'
                })
            else:
                recs.append({
                    'experiment_id': exp['id'],
                    'title': exp['title'],
                    'reason': f"Explore cross-disciplinary scientific principles in {exp['subject']}.",
                    'tag': 'Next Challenge'
                })

        return recs[:3]
