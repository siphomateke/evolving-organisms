import prop from './properties';
import {random, Vector, radialCoords, drawCircle, toRadians} from './utils';
import {Store} from './globals';
import {ReceptorManager} from './receptor';

let lastCreatureId = 0;
const pi = Math.PI;
const ninety = pi/2;
const threeSixty = (2*pi);

export default class Creature {
  constructor(genome) {
    this.id = lastCreatureId;
    lastCreatureId++;
    this.size = 10;
    this.mass = this.size;
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
      random(prop.world.height),
    );
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
    let fitness = ((this.age+this.lifeTime) / prop.timeout);
    if (fitness < 0) {
      fitness = 0;
    }
    return fitness;
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

    if (prop.eatFood) {
      for (let f=0; f<Store.foods.length; f++) {
        if (this.location.sub(Store.foods[f].location).mag()<this.size+Store.foods[f].size) {
          this.lifeTime+=Store.foods[f].size;
          Store.foods[f].eat();
        }
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

    if (prop.creaturesCanCollide || prop.hugOtherCreatures || prop.avoidCreatures) {
      for (const otherCreature of Store.creatures) {
        if (otherCreature.id !== this.id && otherCreature.alive) {
          const distance = this.location.sub(otherCreature.location).mag();
          /* if (properties.social) {
            if (distance < properties.socialRange) {
              const fit = (1 / distance) * 10 * sec;
              this.fitness += fit;
              otherCreature.fitness += fit;
              this.lifeTime += (distance / 500) * sec;
              otherCreature.lifeTime += (distance / 500) * sec;
            }
          }
          if (properties.equilibrium) {
            if (distance < properties.equilibriumRange) {
              const rate = properties.equilibriumTransferRate * ms * (1 / Math.pow(distance, 2));
              if (this.lifeTime > otherCreature.lifeTime) {
                otherCreature.lifeTime += rate;
                this.lifeTime -= rate;
              } else {
                otherCreature.lifeTime -= rate;
                this.lifeTime += rate;
              }
            }
          } */
          const that = otherCreature;
          if (distance < (this.size + that.size)) {
            if (prop.hugOtherCreatures) {
              this.lifeTime += sec;
            } else if (prop.avoidCreatures) {
              this.lifeTime -= sec;
            }

            if (prop.creaturesCanCollide) {
              const displacementUnit = that.location.sub(this.location).normalize();
              const perpDisplacementUnit = new Vector(displacementUnit.y, -displacementUnit.x);

              const theta = this.velocity.getAngle(displacementUnit);
              const phi = this.velocity.getAngle(perpDisplacementUnit);
              let angle = theta;
              if (theta < ninety && phi < ninety) {
                angle = theta;
              } else if (theta > ninety && phi < ninety) {
                angle = theta;
              } else if (theta > ninety && phi > ninety) {
                angle = threeSixty - theta;
              } else if (theta < ninety && phi > ninety) {
                angle = threeSixty - theta;
              } else if (phi == pi) {
                angle = (3 / 2) * pi;
              }
              const latentVelocity = perpDisplacementUnit.mult(-1).mult(this.velocity.mag() * Math.sin(angle)).mult(-1);
              let activeVelocity = displacementUnit.mult(this.velocity.mag() * Math.cos(angle));

              const displacementUnit2 = displacementUnit.mult(-1);
              const theta2 = that.velocity.getAngle(displacementUnit2);
              const phi2 = that.velocity.getAngle(perpDisplacementUnit);
              let angle2 = theta2;
              if (theta2 < ninety && phi2 < ninety) {
                angle2 = theta2;
              } else if (theta2 > ninety && phi2 < ninety) {
                angle2 = theta2;
              } else if (theta2 > ninety && phi2 > ninety) {
                angle2 = (2 * pi) - theta2;
              } else if (theta2 < ninety && phi2 > ninety) {
                angle2 = (2 * pi) - theta2;
              } else if (phi2 == pi) {
                angle2 = (3 / 2) * pi;
              }
              const latentVelocity2 = perpDisplacementUnit.mult(that.velocity.mag() * Math.sin(angle2));
              let activeVelocity2 = displacementUnit2.mult(that.velocity.mag() * Math.cos(angle2));

              const momentum = activeVelocity.mult(this.mass);
              const totalMass = this.mass + that.mass;
              const initVelocity = activeVelocity;
              activeVelocity = momentum.add(activeVelocity2.mult(2).sub(activeVelocity).mult(that.mass)).div(totalMass).mult(0.999);
              activeVelocity2 = activeVelocity.add(initVelocity).sub(activeVelocity2).mult(0.999);
              this.velocity = activeVelocity.add(latentVelocity);
              that.velocity = activeVelocity2.add(latentVelocity2);

              this.location = this.location.sub(that.location).normalize().mult(this.size + that.size).add(that.location);
              that.location = that.location.sub(this.location).normalize().mult(this.size + that.size).add(this.location);
              const kineticEnergy = momentum.mag() / 100;
              if (prop.avoidCollision) {
                if (prop.dieOnCollision) {
                  if (activeVelocity.mag() > activeVelocity2.mag()) {
                    that.lifeTime = 0;
                  } else {
                    this.lifeTime = 0;
                  }
                } else {
                  this.lifeTime -= kineticEnergy;
                  that.lifeTime -= kineticEnergy;
                }
              } else if (prop.favorCollision) {
                this.lifeTime += kineticEnergy / 100;
                that.lifeTime += kineticEnergy / 100;
              }
            }
          }
        }
      }
    }

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
