let prop = {
  accelerated: false,
  acceleration: 40,
  noOutputs: 3,
  noReceptors: 3,
  receptorLen: 20,
  creatureSpeed: 0.02,
  maxRotationForce: 5,
  creatureLifeTime: 10,

  creature_amount: 150,
  target_species: 10,
  target_fitness: 50,

  timeout: 50,

  // Rendering
  render_font: 'Calibri',

  // Fitness rules
  movementNeedsEnergy: false,

  // Food global variables
  food_amount: 50,
  food_size: 5,
  debug: false,
  world: {
    width: 500,
    height: 500,
  },
};

prop.minFitnessRender = prop.creatureLifeTime*2;

export default prop;
