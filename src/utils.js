import prop from './properties';

export function randomF(min, max) {
  if (max) {
    return (Math.random()*(max-min))+min;
  } else {
    let range = min;
    return Math.random()*range;
  }
}

export function random(min, max) {
  return ~~randomF(min, max);
}

export function radialCoords(theta, radius) {
  let x;
  let y;
  if (theta>=270) {
    x = radius*Math.cos((360-theta)*Math.PI/180);
    y = -radius*Math.sin((360-theta)*Math.PI/180);
  } else if (theta>=180) {
    x = -radius*Math.cos((theta-180)*Math.PI/180);
    y = -radius*Math.sin((theta-180)*Math.PI/180);
  } else if (theta>=90) {
    x = -radius*Math.cos((180-theta)*Math.PI/180);
    y = radius*Math.sin((180-theta)*Math.PI/180);
  } else {
    x = radius*Math.cos((theta)*Math.PI/180);
    y = radius*Math.sin((theta)*Math.PI/180);
  }
  return {'x': x, 'y': y};
}

export function toDegrees(rad) {
  return rad * (180/Math.PI);
}

export function toRadians(deg) {
  return deg * (Math.PI/180);
}

export class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
  add(v) {
    let p = new Vector(this.x, this.y);
    p.x += v.x;
    p.y += v.y;
    return p;
  }
  sub(v) {
    let p = new Vector(this.x, this.y);
    p.x -= v.x;
    p.y -= v.y;
    return p;
  }
  mult(n) {
    let p = new Vector(this.x, this.y);
    if (typeof n == 'number') {
      p.x = p.x*n;
      p.y = p.y*n;
    }
    return p;
  }
  div(n) {
    let p = new Vector(this.x, this.y);
    p.x = p.x/n;
    p.y = p.y/n;
    return p;
  }
  mag() {
    let p = new Vector(this.x, this.y);
    return Math.sqrt(Math.pow(p.x, 2)+Math.pow(p.y, 2));
  }
  dist(b) {
    let p = new Vector(this.x, this.y).sub(b);
    return Math.sqrt(Math.pow(p.x, 2)+Math.pow(p.y, 2));
  }
  normalize() {
    let p = new Vector(this.x, this.y);
    if (p.mag()!=0) {
      p = p.div(p.mag());
    }
    return p;
  }
  setMag(n) {
    let p = new Vector(this.x, this.y);
    p = p.normalize().mult(n);
    return p;
  }
  limit(limit) {
    let p = new Vector(this.x, this.y);
    if (p.mag()>limit) {
      p = p.setMag(limit);
    }
    return p;
  }
  heading() {
    let p = new Vector(this.x, this.y);
    let angle = 0;
    if (p.mag()>0) {
      if (-p.y>0 && p.x>0) {
        angle = Math.round(Math.atan(-p.y/p.x)*180/Math.PI)-90;
      } else if (-p.y>0 && p.x<0) {
        angle = Math.round(Math.atan(-p.y/p.x)*180/Math.PI)+90;
      } else if (-p.y<0 && p.x<0) {
        angle = Math.round(Math.atan(-p.y/p.x)*180/Math.PI)+90;
      } else if (-p.y<0 && p.x>0) {
        angle = Math.round(Math.atan(-p.y/p.x)*180/Math.PI)-90;
      }
    }
    return angle;
  }
  dot(b) {
    let a = new Vector(this.x, this.y);
    let dotProduct = (a.x*b.x)+(a.y*b.y);
    return dotProduct;
  }
  // Calculate the angle between two Vectors
  getAngle(b) {
    let a = new Vector(this.x, this.y);
    let scalarProduct = (a.x*b.x)+(a.y*b.y);
    let magProduct = a.mag() * b.mag();
    let angle;
    if (magProduct>0) {
      angle = Math.acos( scalarProduct / magProduct );
    } else {
      angle = 0;
    }
    return angle;
  }
  setAngle(angle, mag) {
    let p = new Vector(this.x, this.y);
    mag = mag==undefined ? 1 : mag;
    p.x = radialCoords(angle, mag).x;
    p.y = radialCoords(angle, mag).y;
    return p;
  }
}

export function getNormalPt(p, a, b) {
  let ap = p.sub(a);
  let ab = b.sub(a);
  ab = ab.normalize();
  ab = ab.mult(ap.dot(ab));
  let pt = a.add(ab);
  return pt;
}

export function writeText(canvas, txt) {
  let ctx = canvas.getContext('2d');
  for (let t=0; t<txt.length; t++) {
    ctx.fillStyle = '#000';
    ctx.font = '15px '+prop.renderFont;
    let text = txt[t];
    ctx.fillText(text, canvas.width-(text.length*7), canvas.height-((15*t)+10));
  }
}

export function drawCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
}
