var uuid = require('node-uuid');

var Skill = (function Skill() {
  function Skill(options) {
    this.id = '';
    this.name = '';
    this.type = '';
    this.cooldown = 0;
    this.damage = 0;
    this.isReady = false;
    this.timeSinceFire = 0;
    this.key = '';
    
    this.tick = {
      'isReady': this.isReady
    };

    this.init(options);
  }
  
  Skill.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.id = options.id || ('skill-' + uuid.v4());
      this.type = options.type || 'skill';
      this.name = options.name || '';
      this.cooldown = options.cooldown || 1;
      this.damage = options.damage || 1;
      this.key = options.key;
      
      this.projectileData = options.projectileData;
      
      console.log('[Skill|' + this.id + '] Create', this.getMetaData());
    },
    
    use: function use() {
      if (!this.isReady) {
        return false;
      }
      
      console.log('[Skill|' + this.id + '] Use');
      
      this.timeSinceFire = 0;
      this.isReady = false;
      this.tick.isReady = false;
      
      return true;
    },
    
    update: function update(dt) {
      if (!this.isReady) {
        this.timeSinceFire += dt;
        
        if (this.timeSinceFire >= this.cooldown) {
          this.ready();
        }
      }
      
      return this.tick;
    },

    getMetaData: function getMetaData() {
      return {
        'id': this.id,
        'name': this.name,
        'type': this.type,
        'cooldown': this.cooldown,
        'damage': this.damage,
        'key': this.key
      };
    },
    
    ready: function ready() {
      if (this.isReady) {
        return;
      }
      
      this.isReady = true;
      this.tick.isReady = true;
      this.timeSinceFire = 0;
    }
  };
  
  return Skill;
}());

module.exports = Skill;