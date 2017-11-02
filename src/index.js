import prop from './properties';
import {Store} from './globals';
import {canvas} from './canvas';
import {writeText, Vector} from './utils';
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

let targetOffset = new Vector(0, 0);
let targetCreature = null;

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
    if (creature.alive) {
      anyAlive = true;
      creature.update(sec);

      if (prop.followBestCreature && creature.brain.score === Store.highestScore) {
        targetCreature = creature;
      }
    }
  }

  if (prop.followBestCreature) {
    if (targetCreature) {
      if (targetCreature.alive) {
        targetOffset.x = targetCreature.location.x - (canvas.width/2);
        targetOffset.y = targetCreature.location.y - (canvas.height/2);
      } else {
        targetCreature = null;
      }
    } else {
      targetOffset = new Vector();
    }
  }
  canvas.screenOffset.x += (targetOffset.x-canvas.screenOffset.x)/10;
  canvas.screenOffset.y += (targetOffset.y-canvas.screenOffset.y)/10;

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
  ctx.translate(-canvas.screenOffset.x, -canvas.screenOffset.y);

  // Draw world borders
  ctx.strokeStyle = 'black';
  ctx.strokeRect(0, 0, prop.world.width, prop.world.height);

  for (let e=0; e<Store.foods.length; e++) {
    if (Store.foods[e].alive) {
      Store.foods[e].render(ctx);
    }
  }

  for (let creature of Store.creatures) {
    if (creature.alive) {
      creature.render(ctx);
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  let targetFps = 1000/timestep;
  let renderFps = prop.accelerated ? fps / prop.acceleration : fps;
  writeText(canvas, [
    'FPS: '+Math.round(renderFps).toString(),
    'Desired fps: '+Math.round(targetFps),
    'Time remaining: '+Math.round(prop.timeout - timer)+'s',
  ]);
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
