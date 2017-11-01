import prop from './properties';
import neataptic from 'neataptic';
import Creature from './creature';
import {Store} from './globals';

export let neat = null;
export function initNeat() {
  neataptic.methods.mutation.MOD_ACTIVATION.mutateOutput = false;
  neataptic.methods.mutation.SWAP_NODES.mutateOutput = false;
  neat = new neataptic.Neat(prop.noReceptors, prop.noOutputs, null, {
    mutation: neataptic.methods.mutation.ALL,
    popsize: prop.creatureAmount,
    mutationRate: prop.mutationRate,
    elitism: Math.round(prop.elitismPercent * prop.creatureAmount),
    network: new neataptic.architect.Random(
      prop.noReceptors,
      prop.medialNeurons,
      prop.noOutputs
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
