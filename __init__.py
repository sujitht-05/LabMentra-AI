"""
Experiments package initialization
"""
from .chemistry_titration import ChemistryTitrationExperiment
from .physics_pendulum import PhysicsPendulumExperiment
from .circuit_ohms_law import CircuitOhmsLawExperiment
from .biology_photosynthesis import BiologyPhotosynthesisExperiment

EXPERIMENT_REGISTRY = {
    'chem_titration': ChemistryTitrationExperiment(),
    'phys_pendulum': PhysicsPendulumExperiment(),
    'circ_ohms_law': CircuitOhmsLawExperiment(),
    'bio_photosynthesis': BiologyPhotosynthesisExperiment()
}

def get_experiment(exp_id):
    return EXPERIMENT_REGISTRY.get(exp_id)
