var Ship = (function() {
  var Sprite = window.Sprite;
  
  function Ship(options) {
    options.type = window.SPRITE_TYPES.SHIP;
    options.isBoundToLayer = true;
    options.isCentered = true;
    !options.id && (options.id = 'ship_' + Date.now());
    !options.width && (options.width = 50);
    !options.height && (options.height = 50);
    !options.drag && (options.drag = 0.95);

    Sprite.call(this, options);

    this.meta = {};
    this.skills = {};
    
    this.elName = null;
    
    this.isPlayer = false;

    this.init(options);
  }
  
  Ship.prototype = Object.create(Sprite.prototype);
  Ship.prototype.constructor = Ship;

  Ship.prototype.init = function init(options) {
    !options && (options = {});

    if (!options.id) {
      throw new Error('No ship id provided!', options);
    }

    this.isPlayer = Boolean(options.isPlayer);

    this.elName = document.createElement('span');
    this.elName.className = 'name';

    this.el.appendChild(this.elName);
  };

  Ship.prototype.destroy = function destroy() {
    Sprite.prototype.destroy.apply(this, arguments);
    
    for (var id in this.skills) {
      delete this.skills[id];
    }
  };
  
  Ship.prototype.addSkill = function addSkill(skill) {
    if (this.skills[skill.id]) {
      return;
    }
    
    this.skills[skill.id] = skill;
  };
  
  Ship.prototype.update_name = function update_name() {
    this.elName.innerHTML = this.meta.name.replace(/</g, '&lt;');
  };

  Ship.prototype.update_shipId = function update_shipId() {
    this.setImage('/images/ships/' + this.meta.shipId + '.png');
  };
  
  Ship.prototype.update = function update(dt) {
    Sprite.prototype.update.apply(this, arguments);
    
    for (var skillId in this.skills) {
      this.skills[skillId].update(dt);
    }
  };

  Ship.prototype.update_team = function update_team() {
    var classList = this.el.classList;

    if (this.isPlayer) {
      classList.add('self');
    } else {
      if (window.PLAYER.meta.team === this.meta.team) {
        classList.add('ally');
        classList.remove('enemy');
      } else {
        classList.add('enemy');
        classList.remove('ally');
      }
    }
  };

  Ship.prototype.toMetaData = function toMetaData() {
    return this.meta;
  };
  
  Ship.prototype.toTickData = function toTickData() {
    return {
      'x': this.position.x,
      'y': this.position.y,
      'angle': this.angle,
      'velocity': this.velocity.toTickData()
    };
  };
  
  Ship.prototype.fromMetaData = function fromMetaData(data) {
    for (var k in data) {
      if (this.meta[k] === data[k]) {
        continue;
      }

      this.meta[k] = data[k];
      
      if (this['update_' + k]) {
        this['update_' + k]();
      }
    }
  };
  
  Ship.prototype.fromTickData = function fromTickData(data) {
    this.position.x = data.x;
    this.position.y = data.y;
    this.angle = data.angle;
  };
  
  Ship.prototype.fromServer = function fromServer(data) {
    var skills = data.skills || {};
    for (var id in skills) {
      if (this.skills[id]) {
        this.skills[id].fromServer(skills[id]);
      }
    }
  };

  return Ship;
}());