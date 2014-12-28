var Ship = (function() {
  function Ship(options) {
    this.id = '';
    this.sprite = null;
    
    this.speed;
    
    this.meta = {};
    this.skills = {};
    
    this.isPlayer = false;

    this.init(options);
  }

  Ship.prototype = {
    init: function init(options) {
      !options && (options = {});

      if (!options.id) {
        throw new Error('No ship id provided!', options);
      }

      this.id = options.id;
      this.speed = options.speed;
      this.isPlayer = Boolean(options.isPlayer);

      this.sprite = new window.Sprite({
        'id': 'sprite_' + this.id,
        'type': window.SPRITE_TYPES.SHIP,
        'width': 50,
        'height': 50,
        'maxSpeed': options.maxSpeed,
        'zIndex': options.zIndex
      });

      this.elName = document.createElement('span');
      this.elName.className = 'name';

      this.sprite.el.appendChild(this.elName);
    },
    
    addSkill: function addSkill(skill) {
      if (this.skills[skill.id]) {
        return;
      }
      
      this.skills[skill.id] = skill;
    },
    
    update_name: function update_name() {
      this.elName.innerHTML = this.meta.name.replace(/</g, '&lt;');
    },

    update_shipId: function update_shipId() {
      this.sprite.setImage('/images/ships/' + this.meta.shipId + '.png');
    },
    
    update: function update(dt) {
      for (var skillId in this.skills) {
        this.skills[skillId].update(dt);
      }
    },

    update_team: function update_team() {
      var classList = this.sprite.el.classList;

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
    },

    moveTo: function moveTo(x, y) {
      this.sprite.position.x = x;
      this.sprite.position.y = y;
    },
    
    toMetaData: function toMetaData() {
      return this.meta;
    },
    
    toTickData: function toTickData() {
      var sprite = this.sprite;
      
      return {
        'x': sprite.position.x,
        'y': sprite.position.y,
        'angle': sprite.angle,
        'velocity': sprite.velocity.toTickData()
      };
    },
    
    fromMetaData: function fromMetaData(data) {
      for (var k in data) {
        if (this.meta[k] === data[k]) {
          continue;
        }

        this.meta[k] = data[k];
        
        if (this['update_' + k]) {
          this['update_' + k]();
        }
      }
    },
    
    fromTickData: function fromTickData(data) {
      this.sprite.position.x = data.x;
      this.sprite.position.y = data.y;
      this.sprite.angle = data.angle;
    },
    
    fromServer: function fromServer(data) {
      var skills = data.skills || {};
      for (var id in skills) {
        if (this.skills[id]) {
          this.skills[id].fromServer(skills[id]);
        }
      }
    }
  };

  return Ship;
}());