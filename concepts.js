/**
 * LabMentra AI - Concept Matrix & Competency Registry
 */

const CONCEPT_REGISTRY = {
  chem_stoichiometry: {
    id: 'chem_stoichiometry',
    name: 'Stoichiometry & Mole Concept',
    category: 'Chemistry',
    icon: 'fa-balance-scale',
    description: 'Quantitative relationships between reactants and products in chemical reactions.'
  },
  chem_acid_base: {
    id: 'chem_acid_base',
    name: 'Acid-Base Equilibria & pH',
    category: 'Chemistry',
    icon: 'fa-vial',
    description: 'Understanding pH scale, indicators, equivalence points, and neutralization reactions.'
  },
  chem_precision: {
    id: 'chem_precision',
    name: 'Volumetric Volumetric Precision',
    category: 'Chemistry',
    icon: 'fa-eye-dropper',
    description: 'Proper use of burettes, pipettes, meniscus reading, and dropwise control.'
  },
  phys_ohms_law: {
    id: 'phys_ohms_law',
    name: "Ohm's Law & Resistance",
    category: 'Physics',
    icon: 'fa-bolt',
    description: 'Linear relationship between current (I), voltage (V), and electrical resistance (R).'
  },
  phys_circuit_safety: {
    id: 'phys_circuit_safety',
    name: 'Circuit Safety & Power Rating',
    category: 'Physics',
    icon: 'fa-shield-halt',
    description: 'Preventing short circuits, current overload, and component thermal dissipation limits.'
  },
  phys_boyles_law: {
    id: 'phys_boyles_law',
    name: "Boyle's Law & Gas Behavior",
    category: 'Physics',
    icon: 'fa-compress-arrows-alt',
    description: 'Inverse relationship between pressure and volume of a gas at constant temperature.'
  },
  bio_enzyme_kinetics: {
    id: 'bio_enzyme_kinetics',
    name: 'Enzyme Kinetics & Catalysis',
    category: 'Biology',
    icon: 'fa-dna',
    description: 'Substrate saturation, temperature/pH denaturation, and Michaelis-Menten dynamics.'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONCEPT_REGISTRY };
}
