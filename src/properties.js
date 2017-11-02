let prop = {
  accelerated: false,
  acceleration: 40,
  slowDownOnGeneration: 50,
  numOutputs: 3,
  numReceptors: 3,
  receptorLen: 20,
  creatureSpeed: 0.05,
  maxRotationForce: 5,
  creatureLifeTime: 10,

  creatureAmount: 100,

  // NEAT settings
  elitismPercent: 0.1,
  mutationRate: 0.3,
  /** The number of times the population will be mutated initially */
  initialMutation: 100,
  medialNeurons: 40,

  timeout: 50,

  // Rendering
  renderFont: 'Calibri',
  renderReceptors: false,
  renderReceptorScent: false,
  renderHead: true,

  // Fitness rules
  movementNeedsEnergy: false,

  // Food global variables
  foodAmount: 50,
  /** 
   * Radius of foods in pixels. 
   * Also decides how much extra time it gives an organism in seconds */
  foodSize: 5,
  debug: false,
  world: {
    width: 900,
    height: 600,
  },
};

prop.minFitnessRender = prop.creatureLifeTime*2;
prop.numInputs = prop.numReceptors;

export default prop;
