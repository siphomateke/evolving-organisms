import {Vector, random} from './utils';
import prop from './properties';
import {Store} from './globals';

export default class Food {
  constructor() {
    this.alive = true;
    this.size = random(5, prop.foodSize);
    this.location = new Vector(
      random(prop.world.width),
      random(prop.world.height));

    // Push this entity to the list and give it an id
    Store.foods.push(this);
    this.food_id = Store.maxFoodId;
    Store.maxFoodId++;
  }
  update(sec) {

  }
  render(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(50,50,50,1)';
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(
      this.location.x-canvas.screenOffset.x,
      this.location.y-canvas.screenOffset.y, this.size, 0, Math.PI*2);
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
