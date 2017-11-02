import prop from './properties';
import neataptic from 'neataptic';
import Creature from './creature';
import {Store} from './globals';

export let neat = null;
let Activation = neataptic.methods.activation;
let Mutation = neataptic.methods.mutation;
export function initNeat() {
  Mutation.MOD_ACTIVATION.mutateOutput = false;
  Mutation.SWAP_NODES.mutateOutput = false;
  Mutation.MOD_ACTIVATION.allowed = [
    Activation.LOGISTIC,
    Activation.TANH,
    // Activation.RELU,
    // Activation.IDENTITY,
    Activation.STEP,
    // Activation.SOFTSIGN,
    // Activation.SINUSOID,
    Activation.GAUSSIAN,
    // Activation.BENT_IDENTITY,
    Activation.BIPOLAR,
    Activation.BIPOLAR_SIGMOID,
    Activation.HARD_TANH,
    // Activation.ABSOLUTE
  ];
  neat = new neataptic.Neat(prop.numInputs, prop.numOutputs, null, {
    mutation: [
      Mutation.ADD_NODE,
      Mutation.SUB_NODE,
      Mutation.ADD_CONN,
      Mutation.SUB_CONN,
      Mutation.MOD_WEIGHT,
      Mutation.MOD_BIAS,
      Mutation.MOD_ACTIVATION,
      Mutation.ADD_GATE,
      Mutation.SUB_GATE,
      Mutation.ADD_SELF_CONN,
      Mutation.SUB_SELF_CONN,
      Mutation.ADD_BACK_CONN,
      Mutation.SUB_BACK_CONN,
    ],
    popsize: prop.creatureAmount,
    mutationRate: prop.mutationRate,
    elitism: Math.round(prop.elitismPercent * prop.creatureAmount),
    network: new neataptic.architect.Random(
      prop.numInputs,
      prop.medialNeurons,
      prop.numOutputs
    ),
  });
}

/** Start the evaluation of the current generation */
export function startEvaluation() {
  Store.creatures = [];
  Store.highestScore = 0;

  for (let genome in neat.population) {
    if (Object.prototype.hasOwnProperty.call(neat.population, genome)) {
      genome = neat.population[genome];
      Store.creatures.push(new Creature(genome));
    }
  }
}

/** End the evaluation of the current generation */
export function endEvaluation() {
  console.log('Generation:', neat.generation, '- average score:', neat.getAverage());

  neat.sort();
  let newPopulation = [];

  // Elitism
  for (let i = 0; i < neat.elitism; i++) {
    newPopulation.push(neat.population[i]);
  }

  // Breed the next individuals
  for (let i = 0; i < neat.popsize - neat.elitism; i++) {
    newPopulation.push(neat.getOffspring());
  }

  // Replace the old population with the new population
  neat.population = newPopulation;
  neat.mutate();

  neat.generation++;
  startEvaluation();
}
