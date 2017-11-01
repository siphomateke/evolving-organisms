import prop from './properties';
import {Store} from './globals';
import {canvas} from './canvas';
import {writeText} from './utils';
import {initNeat, startEvaluation, endEvaluation, neat} from './genetics';
import Food from './food';

canvas.width = prop.world.width;
canvas.height = prop.world.height;

let then = Date.now();
let fps = 60;
let maxFPS = 120;
let timestep=1000/fps;
let framesThisSecond = 0;
let lastFpsUpdate = 0;
let delta = 0;

let timer = 0;

function init() {
  initNeat();

  for (let i = 0; i < prop.initialMutation; i++) neat.mutate();

  for (let f=0; f<prop.foodAmount; f++) {
    new Food();
  }

  startEvaluation();
}

function update(sec) {
  for (let e=0; e<Store.foods.length; e++) {
    if (Store.foods[e].alive) {
      Store.foods[e].update(sec);
    }
  }

  timer+=sec;
  let anyAlive = false;
  for (let creature of Store.creatures) {
    if (creature.alive===true) {
      anyAlive = true;
      creature.update(sec);
    }
  }

  if (neat.generation > prop.slowDownOnGeneration) {
    prop.accelerated = false;
  }

  if (timer > prop.timeout || !anyAlive) {
    timer=0;
    endEvaluation();
  }
}

function render() {
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let e=0; e<Store.foods.length; e++) {
    if (Store.foods[e].alive) {
      Store.foods[e].render(canvas);
    }
  }

  for (let creature of Store.creatures) {
    if (creature.alive) {
      creature.render(canvas);
    }
  }

  writeText(canvas, [Math.round(fps).toString()]);
}

function mainLoop() {
  let now = Date.now();
  if (now < then + (1000 / maxFPS)) {
    requestAnimationFrame(mainLoop);
    return;
  }
  delta += now - then;
  then = now;

  if (now > lastFpsUpdate + 1000) { // update every second
    fps = 0.25 * framesThisSecond + (1 - 0.25) * fps; // compute the new FPS

    lastFpsUpdate = now;
    framesThisSecond = 0;
  }

  if (delta>timestep*10) {
    delta = 0;
  }
  while (delta>=timestep) {
    if (prop.accelerated) {
      for (let i=0; i<prop.acceleration; i++) {
        framesThisSecond++;
        update(timestep/1000);
      }
    } else {
      framesThisSecond++;
      update(timestep/1000);
    }
    delta -= timestep;
  }
  render();

  // Request to do this again ASAP
  requestAnimationFrame(mainLoop);
}

init();
mainLoop();
