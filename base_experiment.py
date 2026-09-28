"""
Base Experiment Blueprint for LabMentra AI Virtual Experiments.
All specific experiments inherit from BaseExperiment.
"""

from abc import ABC, abstractmethod

class BaseExperiment(ABC):
    def __init__(self, experiment_id, title, subject):
        self.experiment_id = experiment_id
        self.title = title
        self.subject = subject

    @abstractmethod
    def evaluate_step(self, step_index, action_type, action_payload, session_state):
        """
        Evaluates a step action in real-time.
        Returns: {
            'is_error': bool,
            'error_type': str or None,
            'ai_feedback': str,
            'safety_penalty': float,
            'accuracy_penalty': float,
            'updated_state': dict
        }
        """
        pass

    @abstractmethod
    def calculate_results(self, session_state, step_logs):
        """
        Calculates final experiment outcomes, percent error, score, and observations.
        """
        pass

    @abstractmethod
    def perform_root_cause_analysis(self, step_logs, session_state):
        """
        Generates deep scientific explanation of mistakes made during experiment.
        """
        pass

    @abstractmethod
    def compute_what_if(self, what_if_params, session_state):
        """
        Simulates theoretical performance curve under altered parameters.
        """
        pass
