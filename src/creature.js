import prop from './properties';
import {random, randomF, Vector, radialCoords} from './utils';
import {Store} from './globals';
import {neat} from './genetics';

export default class Creature {
  constructor(genome) {
    this.size = 10;
    this.angle = random(360);
    this.speed = prop.creatureSpeed;
    this.lifeTime = prop.creatureLifeTime;
    this.alive = true;
    this.age = 0;

    this.brain = genome;
    this.brain.score = 0;

    // Motion variables
    this.location = new Vector(
      random(prop.world.width),
      random(prop.world.height));
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector();
    this.force = new Vector();
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.angularForce = 0;

    // Receptors
    this.receptors = [];
    for (let r=0; r<prop.noReceptors; r++) {
      let theta = this.angle+90+((360/prop.noReceptors)*r);
      this.receptors[r] = {};
      // if (r%2==0) {
      this.receptors[r].type = 0;
      /* }
      else {
        this.receptors[r].type = 1;
      }*/
      this.receptors[r].location = new Vector(
        radialCoords(theta, prop.receptorLen).x+this.location.x,
        radialCoords(theta, prop.receptorLen).y+this.location.y);
      this.receptors[r].scent = 0;
    }
    this.head = new Vector(
      radialCoords(this.angle-90, this.size/2).x+this.location.x,
      radialCoords(this.angle-90, this.size/2).y+this.location.y);
  }

  reset() {
    this.age = 0;
    this.angle = random(360);
    this.lifeTime = prop.creatureLifeTime;
    this.location = new Vector(
      random(prop.world.width),
      random(prop.world.height));
  }

  sense() {
    let input = [];
    for (let r=0; r<this.receptors.length; r++) {
      input[r] = this.receptors[r].scent;
    }
    return input;
  }

  getFitness() {
    return ((this.age/prop.timeout)+(this.lifeTime/prop.creatureLifeTime))*20;
  }

  update(sec) {
    let ms = sec*1000;

    let input = this.sense();
    let output = this.brain.activate(input);

    if (this.angularForce<prop.maxRotationForce) {
      this.angularForce+=output[0]*ms;
    }
    if (this.angularForce>-prop.maxRotationForce) {
      this.angularForce-=output[1]*ms;
    }
    this.speed = output[2]*prop.creatureSpeed;

    // Collision with world boundaries
    if (this.location.x>prop.world.width-this.size) {
      this.location.x = prop.world.width-this.size;
      this.velocity.x *= -1;
    } else if (this.location.x<this.size) {
      this.location.x = this.size;
      this.velocity.x *= -1;
    }
    if (this.location.y>prop.world.height-this.size) {
      this.location.y = prop.world.height-this.size;
      this.velocity.y *= -1;
    } else if (this.location.y<this.size) {
      this.location.y = this.size;
      this.velocity.y *= -1;
    }

    // Update internal clocks
    this.age += sec;
    this.lifeTime -= sec;
    this.brain.score = this.getFitness();
    Store.highestScore = this.brain.score > Store.highestScore ? this.brain.score : Store.highestScore;

    for (let f=0; f<Store.foods.length; f++) {
      if (this.location.sub(Store.foods[f].location).mag()<this.size+Store.foods[f].size) {
        this.lifeTime+=Store.foods[f].size;
        Store.foods[f].eat();
      }
    }

    if (this.lifeTime<=0) {
      this.alive = false;
    }

    if (prop.movementNeedsEnergy) {
      this.lifeTime-=Math.abs(this.angularForce)*sec/10;
      this.lifeTime-=this.force.mag()*sec/100;
    }

    // Angular values
    this.angularForce*=0.8;
    this.angularAcceleration = this.angularForce/this.size;
    this.angularVelocity+=this.angularAcceleration;
    this.angularVelocity*=0.95;
    this.angle+=this.angularVelocity;

    // Apply speed in direction creature is facing
    this.force.x += Math.sin(this.angle * Math.PI / 180) * this.speed * ms;
    this.force.y += -1 * Math.cos(this.angle* Math.PI / 180) * this.speed * ms;

    // Apply forces and speed
    this.force = this.force.mult(0.8);
    this.acceleration = this.force.div(this.size);
    this.velocity = this.velocity.add(this.acceleration);
    this.velocity = this.velocity.mult(0.95);
    this.location = this.location.add(this.velocity);

    // Update receptor and tail position
    for (let r=0; r<prop.noReceptors; r++) {
      let theta = this.angle+90+((360/prop.noReceptors)*r);
      this.receptors[r].location = new Vector(
        radialCoords(theta, prop.receptorLen).x+this.location.x,
        radialCoords(theta, prop.receptorLen).y+this.location.y);
      let totalScent = 0;
      if (this.receptors[r].type == 0) {
        for (let f=0; f<Store.foods.length; f++) {
          totalScent+=1/Math.pow(this.receptors[r].location.sub(Store.foods[f].location).mag()*0.01, 3);
        }
      } else {
        for (let f=0; f<Store.creatures.length; f++) {
          totalScent+=1/Math.pow(this.receptors[r].location.sub(Store.creatures[f].location).mag()*0.01, 3);
        }
      }
      this.receptors[r].scent = totalScent;
    }
    this.head = new Vector(radialCoords(this.angle-90, this.size/2).x+this.location.x, radialCoords(this.angle-90, this.size/2).y+this.location.y);
  }

  fitnessColor(value, max) {
    let power = 1 - Math.min(value/max, 1);
    let color = [255, 255, 0];

    if (power < 0.5) {
      color[0] = 2 * power * 255;
    } else {
      color[1] = (1.0 - 2 * (power - 0.5)) * 255;
    }

    for (let i=0; i<color.length; i++) {
      color[i] = Math.floor(color[i]);
    }

    return color;
  }

  render(canvas) {
    let ctx = canvas.getContext('2d');

    let opacity = 1;

    // Render receptors
    if (prop.renderReceptors) {
      ctx.strokeStyle = 'rgba(0,0,0,'+opacity+')';
      ctx.fillStyle = 'rgba(200,200,0,'+opacity+')';
      for (let r=0; r<this.receptors.length; r++) {
        ctx.beginPath();
        ctx.moveTo(
          this.location.x-canvas.screenOffset.x,
          this.location.y-canvas.screenOffset.y);
        ctx.lineTo(
          this.receptors[r].location.x-canvas.screenOffset.x,
          this.receptors[r].location.y-canvas.screenOffset.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          this.receptors[r].location.x-canvas.screenOffset.x,
          this.receptors[r].location.y-canvas.screenOffset.y, (this.size/2), 0, Math.PI*2);
        ctx.fill();
      }
    }

    let color = this.fitnessColor(this.brain.score, Store.highestScore);
    // Render core
    ctx.beginPath();
    ctx.fillStyle = 'rgba('+color[0]+','+color[1]+','+color[2]+','+opacity+')';
    ctx.strokeStyle = 'rgba(50,50,50,'+opacity+')';
    ctx.arc(
      this.location.x-canvas.screenOffset.x,
      this.location.y-canvas.screenOffset.y, this.size, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Render head
    ctx.fillStyle = 'rgba(50,50,50,'+opacity+')';
    ctx.beginPath();
    ctx.arc(
      this.head.x-canvas.screenOffset.x,
      this.head.y-canvas.screenOffset.y, this.size/2, 0, Math.PI*2);
    ctx.fill();
  }
}
