/**
 * Projectile module
 * @module server/Projectile
 */

var uuid = require('node-uuid');
var Vector = require('./Vector');

/**
 * Creates a new Projectile
 * 
 * @constructor
 * @param {Object} options - Settings for initializing the projectile
 */

function Projectile(options) {
  this.id = '';
  this.speed = -1;
  this.width = 0;
  this.height = 0;
  this.maxDistance = -1;
  this.maxTime = -1;
  this.color = '';
  
  this.angle = 0;
  
  this.distanceTraveled = 0;
  this.timeTraveled = 0;
  this.meta = {};
  this.sentMetaData = false;
  
  this.position = new Vector();
  this.velocity = new Vector();
  
  this.maxConditionReached = false;
  this.onReachedMaxCondition = null;
  
  this.isBoundToLayer = false;
  this.bounceOffWalls = false;
  
  this.game = null;
  
  this.init(options);
}

Projectile.prototype = {
  init: function init(options) {
    !options && (options = {});
    
    this.id = options.id || ('projectile-' + uuid.v4());
    this.onReachedMaxCondition = options.onReachedMaxCondition || function(){};
    
    this.speed = options.data.speed;
    this.width = options.data.width || options.data.size || 0;
    this.height = options.data.height || options.data.size || 0;
    this.maxDistance = options.data.maxDistance || 0;
    this.maxTime =options.data.maxTime || 0;
    this.color = options.data.color;
    
    this.angle = options.angle;
    
    this.startPosition = new Vector(options.x, options.y);
    this.position = new Vector(this.startPosition);
    this.velocity = new Vector(this.speed, this.speed).rotate(this.angle - 45);
    
    if ('isBoundToLayer' in options.data) {
      this.isBoundToLayer = Boolean(options.data.isBoundToLayer);
    }
    if ('bounceOffWalls' in options.data) {
      this.bounceOffWalls = Boolean(options.data.bounceOffWalls);
    }
    
    if (options.velocity) {
      this.velocity.add(new Vector(options.velocity));
    }
    
    this.meta = {
      'id': this.id,
      'width': this.width,
      'height': this.height,
      'x': this.position.x,
      'y': this.position.y,
      'angle': this.angle,
      'drag': 1,
      'velocity': this.velocity.toTickData(),
      'color': this.color,
      'maxDistance': this.maxDistance,
      'isBoundToLayer': this.isBoundToLayer,
      'bounceOffWalls': this.bounceOffWalls
    };
    
    console.log('[Projectile|' + this.id + '] Data', this.meta);
    console.info('[Projectile|' + this.id + '] Create');
  },
  
  update: function update(dt) {
    if (this.maxConditionReached) {
      return;
    }
    
    var distanceTraveled = this.velocity.scale(dt);

    this.position.add(distanceTraveled);
    
    
    if (this.isBoundToLayer && this.game) {
      var position = this.position,
          x = position.x,
          y = position.y,
          halfWidth = this.width / 2,
          halfHeight = this.height / 2;

      position.x = Math.clamp(x, halfWidth, this.game.width - halfWidth);
      position.y = Math.clamp(y, halfHeight, this.game.height - halfHeight);
      
      if (this.bounceOffWalls) {
        if (x !== position.x) {
          this.velocity.x *= -1;
        }
        if (y !== position.y) {
          this.velocity.y *= -1;
        }
      }
    }


    if (this.maxDistance) {
      this.distanceTraveled += distanceTraveled.length();
      
      if (this.distanceTraveled >= this.maxDistance) {
        this.maxConditionReached = 'distance';
      }
    }
    
    if (this.maxTime) {
      this.timeTraveled += dt;
      
      if (this.timeTraveled >= this.maxTime) {
        this.maxConditionReached = 'time';
      }
    }
    
    
    if (this.maxConditionReached) {
      this.onReachedMaxCondition(this, this.maxConditionReached);
    }
  }
};

module.exports = Projectile;