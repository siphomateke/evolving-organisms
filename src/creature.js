import prop from './properties';
import {random, Vector, radialCoords, drawCircle, toRadians} from './utils';
import {Store} from './globals';
import {ReceptorManager} from './receptor';

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

    this.receptors = new ReceptorManager(prop.numReceptors, prop.receptorLen);
    this.receptors.init(this);
    this.head = new Vector(
      radialCoords(this.angle-90, this.size/2).x+this.location.x,
      radialCoords(this.angle-90, this.size/2).y+this.location.y);
  }

  get angleRadians() {
    return toRadians(this.angle);
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
    for (let r=0; r<this.receptors.numberOfReceptors; r++) {
      input[r] = this.receptors.list[r].scent;
    }
    return input;
  }

  getFitness() {
    // fitness is how long the organism lived plus how long it would have lived
    // minus how long they live by default
    return (this.age+this.lifeTime-prop.creatureLifeTime) / prop.timeout;
  }

  update(sec) {
    let ms = sec*1000;

    let input = this.sense();
    input.concat([
      this.velocity.x,
      this.velocity.y,
      this.lifeTime,
      this.angle,
      this.angularVelocity,
    ]);
    let output = this.brain.activate(input);

    if (this.angularForce<prop.maxRotationForce) {
      this.angularForce+=output[0]*ms;
    }
    if (this.angularForce>-prop.maxRotationForce) {
      this.angularForce-=output[1]*ms;
    }
    this.speed = (output[2]-0.5)*prop.creatureSpeed;

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

    this.receptors.update(sec, this);
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

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    let opacity = 1;

    this.receptors.render(ctx, this, opacity);

    if (prop.renderLifetime) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(this.location.x, this.location.y);
      let lifeTimeRatio = this.lifeTime / prop.creatureLifeTime;
      ctx.arc(
        this.location.x, this.location.y,
        (3*this.size)/2, - Math.PI / 2,
        (lifeTimeRatio * Math.PI * 2) - (Math.PI/2));
      ctx.fill();
    }

    let color = this.fitnessColor(this.brain.score, Store.highestScore);
    // Render core
    ctx.fillStyle = 'rgba('+color[0]+','+color[1]+','+color[2]+','+opacity+')';
    ctx.strokeStyle = 'rgba(50,50,50,'+opacity+')';
    drawCircle(ctx, this.location.x, this.location.y, this.size);
    ctx.fill();
    ctx.stroke();

    // Render head
    if (prop.renderHead) {
      ctx.fillStyle = 'rgba(50,50,50,'+opacity+')';
      drawCircle(ctx, this.head.x, this.head.y, this.size/2);
      ctx.fill();
    }
  }
}
