"""
LabMentra AI - SQLite Database Interface
Handles schema creation, session tracking, step logging, concept mastery, and report storage.
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'labmentra.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Experiments Metadata
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty_levels TEXT NOT NULL, -- JSON array
        learning_outcomes TEXT NOT NULL, -- JSON array
        icon TEXT NOT NULL
    )
    ''')

    # Sessions Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        experiment_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        score REAL DEFAULT 0,
        safety_score REAL DEFAULT 100,
        accuracy_score REAL DEFAULT 100,
        time_spent_seconds INTEGER DEFAULT 0,
        student_signature TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(experiment_id) REFERENCES experiments(id)
    )
    ''')

    # Step Logs Table (for real-time action error detection & replay)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS step_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_payload TEXT NOT NULL, -- JSON
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_error INTEGER DEFAULT 0,
        error_type TEXT,
        ai_feedback TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
    ''')

    # Concept Mastery Tracking Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS concept_mastery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        precision_score REAL DEFAULT 70.0,
        safety_score REAL DEFAULT 85.0,
        math_score REAL DEFAULT 75.0,
        speed_score REAL DEFAULT 80.0,
        analysis_score REAL DEFAULT 70.0,
        total_experiments INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, subject)
    )
    ''')

    # Lab Reports Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lab_reports (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        hypothesis TEXT,
        procedure_summary TEXT,
        observation_data TEXT, -- JSON
        calculated_results TEXT, -- JSON
        root_cause_analysis TEXT, -- JSON
        ai_grade TEXT,
        ai_feedback TEXT,
        student_signature TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
    ''')

    # Seed Default User if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (name, email, role) VALUES ('Alex Morgan', 'alex.morgan@university.edu', 'student')")

    # Seed Experiments Metadata if empty
    cursor.execute("SELECT COUNT(*) FROM experiments")
    if cursor.fetchone()[0] == 0:
        experiments_data = [
            (
                "chem_titration",
                "Acid-Base Titration (HCl + NaOH)",
                "Chemistry",
                "Determine the unknown concentration of Hydrochloric Acid using Sodium Hydroxide standard solution and Phenolphthalein indicator.",
                json.dumps(["Beginner (Guided)", "Intermediate (Standard)", "Advanced (Unknown Concentration)"]),
                json.dumps(["Stoichiometry & Molarity", "Equivalence Point Identification", "Volumetric Analysis Precision", "Indicator pH Transitions"]),
                "flask-conical"
            ),
            (
                "phys_pendulum",
                "Simple Pendulum & Gravitational Acceleration (g)",
                "Physics",
                "Investigate the relationship between pendulum string length, mass, amplitude angle, and periodic time to calculate g on Earth, Moon, and Mars.",
                json.dumps(["Beginner (Guided)", "Intermediate (Standard)", "Advanced (Gravitational Variation)"]),
                json.dumps(["Simple Harmonic Motion", "Small Angle Approximation", "Kinetic vs Potential Energy Conversion", "Gravitational Constant Calculation"]),
                "orbit"
            ),
            (
                "circ_ohms_law",
                "Ohm's Law & Circuit Analysis (V = IR)",
                "Electronics",
                "Construct DC circuits, measure voltage and current across varied resistors, and test component power dissipation limits.",
                json.dumps(["Beginner (Guided)", "Intermediate (Standard)", "Advanced (Component Stress Test)"]),
                json.dumps(["Ohm's Law V = IR", "Resistor Power Rating Dissipation", "Series & Parallel Voltmeter/Ammeter Wiring", "Non-linear Filament Resistance"]),
                "zap"
            ),
            (
                "bio_photosynthesis",
                "Plant Photosynthesis & Light Intensity",
                "Biology",
                "Analyze oxygen gas bubble production rate of aquatic plants (Elodea) under varying light distances and color wavelengths.",
                json.dumps(["Beginner (Guided)", "Intermediate (Standard)", "Advanced (Color Spectrum Analysis)"]),
                json.dumps(["Inverse Square Law of Light", "Oxygen Production Rate", "Chlorophyll Wavelength Absorption", "CO2 Saturation Point"]),
                "leaf"
            )
        ]
        cursor.executemany("INSERT INTO experiments VALUES (?, ?, ?, ?, ?, ?, ?)", experiments_data)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
