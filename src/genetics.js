import prop from './properties';
import neataptic from 'neataptic';

let neat = null;
function initNeat() {
  neat = new neataptic.Neat(prop.noReceptors, prop.noOutputs, null, {
    mutation: methods.mutation.ALL
    popsize: prop.creatureAmount,
    mutationRate: prop.mutationRate,
    elitism: Math.round(prop.elitismPercent * prop.creatureAmount),
    network: new neataptic.architect.Random(
      prop.noReceptors,
      prop.medialNeurons,
      2
    )
  });
}