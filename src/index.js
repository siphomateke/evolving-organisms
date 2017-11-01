import prop from './properties';
import Creature from './creature';
import {foods} from './globals';
import {canvas} from './canvas';
import {writeText} from './utils';

canvas.width = prop.world.width;
canvas.height = prop.world.height;

function update(sec) {
  for (let e=0; e<foods.length; e++) {
    if (foods[e].alive) {
      foods[e].update(sec);
    }
  }
}

function render() {
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let e=0; e<foods.length; e++) {
    if (foods[e].alive) {
      foods[e].render(canvas);
    }
  }
  writeText(canvas, [Math.round(fps).toString()]);
}

let then = Date.now();
let fps = 60;
let maxFPS = 120;
let timestep=1000/fps;
let framesThisSecond = 0;
let lastFpsUpdate = 0;
let delta = 0;

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

mainLoop();
