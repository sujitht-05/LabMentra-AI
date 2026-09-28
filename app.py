"""
LabMentra AI Flask Main Application Server
"""

import json
from flask import Flask, render_template, request, jsonify, redirect, url_for
from database import init_db, get_db
from ai_engine import AIEngine
from experiments import get_experiment

app = Flask(__name__)
app.config['SECRET_KEY'] = 'labmentra_ai_secret_key_2026'

# Initialize Database on startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/report/<report_id>/print')
def print_report(report_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT r.*, s.difficulty, s.start_time, u.name as student_name, u.email as student_email
        FROM lab_reports r
        JOIN sessions s ON r.session_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    ''', (report_id,))
    report = cursor.fetchone()
    conn.close()

    if not report:
        return "Lab report not found", 404

    report_dict = dict(report)
    report_dict['observation_data'] = json.loads(report_dict['observation_data'])
    report_dict['calculated_results'] = json.loads(report_dict['calculated_results'])
    report_dict['root_cause_analysis'] = json.loads(report_dict['root_cause_analysis'])

    return render_template('lab_report_template.html', report=report_dict)

# ----------------- REST API ENDPOINTS -----------------

@app.route('/api/experiments', methods=['GET'])
def get_experiments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments")
    rows = cursor.fetchall()
    conn.close()

    experiments = []
    for r in rows:
        d = dict(r)
        d['difficulty_levels'] = json.loads(d['difficulty_levels'])
        d['learning_outcomes'] = json.loads(d['learning_outcomes'])
        experiments.append(d)

    return jsonify({'status': 'success', 'experiments': experiments})

@app.route('/api/sessions/start', methods=['POST'])
def start_session():
    data = request.json or {}
    user_id = data.get('user_id', 1)
    exp_id = data.get('experiment_id', 'chem_titration')
    difficulty = data.get('difficulty')

    try:
        session_info = AIEngine.start_session(user_id, exp_id, difficulty)
        return jsonify({'status': 'success', 'session': session_info})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/sessions/<session_id>/step', methods=['POST'])
def record_step(session_id):
    data = request.json or {}
    action_type = data.get('action_type')
    action_payload = data.get('action_payload', {})
    current_state = data.get('current_state', {})

    try:
        res = AIEngine.process_step(session_id, action_type, action_payload, current_state)
        return jsonify({'status': 'success', 'result': res})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/sessions/<session_id>/complete', methods=['POST'])
def complete_session(session_id):
    data = request.json or {}
    final_state = data.get('final_state', {})
    signature = data.get('student_signature', '')

    try:
        summary = AIEngine.complete_session(session_id, final_state, signature)
        return jsonify({'status': 'success', 'summary': summary})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/sessions/<session_id>/replay', methods=['GET'])
def get_replay(session_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM step_logs WHERE session_id = ? ORDER BY step_index ASC", (session_id,))
    logs = [dict(r) for r in cursor.fetchall()]
    for l in logs:
        l['action_payload'] = json.loads(l['action_payload'])
    conn.close()

    return jsonify({'status': 'success', 'step_logs': logs})

@app.route('/api/sessions/<session_id>/whatif', methods=['POST'])
def get_whatif(session_id):
    data = request.json or {}
    whatif_params = data.get('params', {})
    session_state = data.get('session_state', {})
    exp_id = data.get('experiment_id', 'chem_titration')

    exp_instance = get_experiment(exp_id)
    if not exp_instance:
        return jsonify({'status': 'error', 'message': 'Experiment not found'}), 404

    whatif_res = exp_instance.compute_what_if(whatif_params, session_state)
    return jsonify({'status': 'success', 'whatif': whatif_res})

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    user_id = request.args.get('user_id', 1, type=int)
    conn = get_db()
    cursor = conn.cursor()

    # Mastery Radar
    cursor.execute("SELECT * FROM concept_mastery WHERE user_id = ?", (user_id,))
    mastery_rows = [dict(r) for r in cursor.fetchall()]

    # Lab Reports
    cursor.execute("SELECT id, title, ai_grade, created_at FROM lab_reports WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    reports = [dict(r) for r in cursor.fetchall()]

    # Session Stats
    cursor.execute("SELECT COUNT(*) as total, AVG(score) as avg_score, AVG(safety_score) as avg_safety FROM sessions WHERE user_id = ? AND status='completed'", (user_id,))
    stats = dict(cursor.fetchone())

    conn.close()

    return jsonify({
        'status': 'success',
        'concept_mastery': mastery_rows,
        'recent_reports': reports,
        'stats': stats
    })

@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report_json(report_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lab_reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'status': 'error', 'message': 'Report not found'}), 404

    d = dict(row)
    d['observation_data'] = json.loads(d['observation_data'])
    d['calculated_results'] = json.loads(d['calculated_results'])
    d['root_cause_analysis'] = json.loads(d['root_cause_analysis'])
    return jsonify({'status': 'success', 'report': d})

if __name__ == '__main__':
    print("Starting LabMentra AI Server on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
