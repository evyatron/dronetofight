var uuid = require('node-uuid');
var Vector = require('./Vector.js');

var Projectile = (function Projectile() {
  function Projectile(options) {
    this.id = '';
    this.speed = 0;
    this.size = 0;
    this.maxDistance = 0;
    this.color = '';
    
    this.angle = 0;
    
    this.meta = {};
    this.sentMetaData = false;
    
    this.position = new Vector();
    this.velocity = new Vector();
    
    this.didReachMaxDistance = false;
    this.onReachedMaxDistance = null;
    
    this.init(options);
  }
  
  Projectile.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.id = options.id || ('projectile-' + uuid.v4());
      this.onReachedMaxDistance = options.onReachedMaxDistance || function(){};
      
      this.speed = options.data.speed;
      this.size = options.data.size;
      this.maxDistance = options.data.maxDistance;
      this.color = options.data.color;
      
      this.angle = options.angle;
      
      this.startPosition = new Vector(options.x, options.y);
      this.position = new Vector(this.startPosition);
      this.velocity = new Vector(this.speed, this.speed).rotate(this.angle - 45);
      
      if (options.velocity) {
        this.velocity.add(new Vector(options.velocity));
      }
      
      this.meta = {
        'id': this.id,
        'width': this.size,
        'height': this.size,
        'x': this.position.x,
        'y': this.position.y,
        'angle': this.angle,
        'drag': 1,
        'velocity': this.velocity.toTickData(),
        'color': this.color,
        'maxDistance': this.maxDistance
      };
      
      console.log('[Projectile|' + this.id + '] Create');
    },
    
    update: function update(dt) {
      if (this.didReachMaxDistance) {
        return;
      }

      this.position.add(this.velocity.scale(dt));

      if (this.maxDistance) {
        if (this.position.distance(this.startPosition) >= this.maxDistance) {
          this.didReachMaxDistance = true;
          this.onReachedMaxDistance(this);
        }
      }
    }
  };
  
  return Projectile;
}());

module.exports = Projectile;