var Vector = (function() {
  var MIN_VALUE = 0.01;

  function Vector(x, y) {
    this.y = (x && x.hasOwnProperty('y'))? x.y : (y || 0);
    this.x = (x && x.hasOwnProperty('x'))? x.x : (x || 0);
  }

  Vector.prototype = {
    add: function add(vector) {
      this.x += vector.x;
      this.y += vector.y;
      if (Math.abs(this.x) < MIN_VALUE) { this.x = 0; }
      if (Math.abs(this.y) < MIN_VALUE) { this.y = 0; }
      return this;
    },
    
    scale: function scale(by) {
      this.x *= by;
      this.y *= by;
      if (Math.abs(this.x) < MIN_VALUE) { this.x = 0; }
      if (Math.abs(this.y) < MIN_VALUE) { this.y = 0; }
      return this;
    },

    rotate: function rotate(angle) {
      angle *= (Math.PI / 180);

      var x = this.x * Math.cos(angle) - this.y * Math.sin(angle),
          y = this.x * Math.sin(angle) + this.y * Math.cos(angle);

      this.x = x;
      this.y = y;
      
      return this;
    },

    angle: function angle(vector) {
      return Math.atan2(vector.y - this.y, vector.x - this.x) * 180 / Math.PI;
    }
  };

  return Vector;
}());