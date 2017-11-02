import {Vector, radialCoords, drawCircle} from './utils';
import {Store} from './globals';
import prop from './properties';
import {Creature} from './creature';

export class Receptor {
  constructor(type = 0) {
    this.type = type;
    this.location = new Vector();
    this.scent = 0;
  }
}

export class ReceptorManager {
  constructor(numberOfReceptors, receptorLen) {
    this.numberOfReceptors = numberOfReceptors;
    this.receptorLen = receptorLen;
    /** @type {Receptor[]} */
    this.list = [];
    this.highestScent = 0;

    for (let r=0; r<this.numberOfReceptors; r++) {
      let type = r % 2 === 0 ? 0 : 1;
      this.list[r] = new Receptor(type);
    }
  }

  /**
   * 
   * @param {Vector} location 
   * @param {number} angle 
   */
  updateLocation(location, angle=0) {
    for (let i=0; i<this.numberOfReceptors; i++) {
      let receptor = this.list[i];
      let theta = angle + 90 + ((360/this.numberOfReceptors) * i);
      receptor.location = new Vector(
        radialCoords(theta, this.receptorLen).x+location.x,
        radialCoords(theta, this.receptorLen).y+location.y);
    }
  }

  /**
   * 
   * @param {Creature} creature 
   */
  init(creature) {
    this.updateLocation(creature.location, creature.angle);
  }

  /**
   * @param {number} sec
   * @param {Creature} creature 
   */
  update(sec, creature) {
    this.updateLocation(creature.location, creature.angle);
    for (let i=0; i<this.numberOfReceptors; i++) {
      let receptor = this.list[i];
      let scent = 0;
      if (receptor.type === 0) {
        for (let f=0; f<Store.foods.length; f++) {
          scent+=1/Math.pow(
            receptor.location.sub(Store.foods[f].location).mag()*0.01, 3);
        }
      } else if (receptor.type === 1) {
        for (let f=0; f<Store.creatures.length; f++) {
          scent+=1/Math.pow(
            receptor.location.sub(Store.creatures[f].location).mag()*0.01, 3);
        }
      }
      receptor.scent = scent;
      if (receptor.scent > this.highestScent) {
        this.highestScent = receptor.scent;
      }
    }
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Creature} creature 
   * @param {number} opacity 
   */
  render(ctx, creature, opacity = 1) {
    if (prop.renderReceptors || prop.renderReceptorScent) {
      for (let r of this.list) {
        if (prop.renderReceptors) {
          ctx.strokeStyle = 'rgba(0,0,0,'+opacity+')';
          if (r.type === 0) {
            ctx.fillStyle = 'rgba(200,200,0,'+opacity+')';
          } else if (r.type === 1) {
            ctx.fillStyle = 'rgba(0,0,200,'+opacity+')';
          }

          ctx.beginPath();
          ctx.moveTo(creature.location.x, creature.location.y);
          ctx.lineTo(r.location.x, r.location.y);
          ctx.stroke();

          drawCircle(ctx, r.location.x, r.location.y, creature.size/2);
          ctx.fill();
        }

        if (prop.renderReceptorScent) {
          let x = r.location.x;
          let y = r.location.y;
          let radius = (r.scent / this.highestScent) * creature.size * 5;
          if (this.highestScent > 0) {
            let gradient = ctx.createRadialGradient(x, y, radius, x, y, 0);
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, 'rgba(0,0,255,0.5)');
            ctx.fillStyle = gradient;
          }
          drawCircle(ctx, x, y, radius);
          ctx.fill();
        }
      }
    }
  }
}
