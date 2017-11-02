import {Vector, random, randomF} from './utils';
import prop from './properties';
import {Store} from './globals';

export default class Food {
  constructor() {
    this.alive = true;
    this.size = random(5, prop.foodSize);
    this.location = new Vector(
      random(prop.world.width),
      random(prop.world.height));
    this.velocity = new Vector(randomF(-prop.foodSpeed, prop.foodSpeed), randomF(-prop.foodSpeed, prop.foodSpeed));

    // Push this entity to the list and give it an id
    Store.foods.push(this);
    this.food_id = Store.maxFoodId;
    Store.maxFoodId++;
  }
  update(sec) {
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

    this.location = this.location.add(this.velocity.mult(sec));
  }
  /**
  * 
  * @param {CanvasRenderingContext2D} ctx
  */
  render(ctx) {
    ctx.strokeStyle = 'rgba(50,50,50,1)';
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(this.location.x, this.location.y, this.size, 0, Math.PI*2);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
  }

  // Remove food from the list when eaten
  eat() {
    for (let f=0; f<Store.foods.length; f++) {
      if (Store.foods[f].food_id == this.food_id) {
        Store.foods.splice(f, 1);
        new Food();
      }
    }
  }
}
