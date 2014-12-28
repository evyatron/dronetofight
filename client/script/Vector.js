var Vector = (function() {
  var MIN_VALUE = 0.01;

  function Vector(x, y) {
    this.y = (x && x.hasOwnProperty('y'))? x.y : (y || 0);
    this.x = (x && x.hasOwnProperty('x'))? x.x : (x || 0);
    if (Math.abs(this.x) < MIN_VALUE) { this.x = 0; }
    if (Math.abs(this.y) < MIN_VALUE) { this.y = 0; }
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
      return new Vector(this.x * by, this.y * by);
    },

    rotate: function rotate(angle) {
      angle *= (Math.PI / 180);
      
      var cos = Math.cos(angle),
          sin = Math.sin(angle),
          x = this.x,
          y = this.y;

      this.x = (x * cos) - (y * sin);
      this.y = (x * sin) + (y * cos);

      return this;
    },

    angle: function angle(vector) {
      return Math.atan2(vector.y - this.y, vector.x - this.x) * 180 / Math.PI;
    },
    
    distance: function distance(vector) {
      var distX = vector.x - this.x,
          distY = vector.y - this.y;

      return Math.sqrt(distX * distX + distY * distY);
    },
    
    clamp: function clamp(max) {
      var length = this.length();
      if (length > max) {
        var ratio = max / length;
        this.x *= ratio;
        this.y *= ratio;
      }
    },
    
    length: function length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    
    reset: function reset() {
      this.x = 0;
      this.y = 0;
    },
    
    toTickData: function toTickData() {
      return {
        'x': this.x,
        'y': this.y
      };
    }
  };

  return Vector;
}());