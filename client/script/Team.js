var Team = (function() {
  var Sprite = window.Sprite;
  
  function Team(options) {
    options.type = window.SPRITE_TYPES.TEAM;
    
    !options.id && (options.id = 'team_' + Date.now());
    
    for (var k in options.sprite) {
      options[k] = options.sprite[k];
    }

    Sprite.call(this, options);

    this.meta = {};
    this.currentHealth = 0;
    this.maxHealth = 0;
    
    this.elHealth = null;

    this.init(options);
  }
  
  Team.prototype = Object.create(Sprite.prototype);
  Team.prototype.constructor = Team;

  Team.prototype.init = function init(options) {
    !options && (options = {});

    if (!options.id) {
      throw new Error('No team id provided!', options);
    }
    
    this.maxHealth = options.maxHealth || 0;
    
    if ('currentHealth' in options) {
      this.currentHealth = options.currentHealth;
    } else {
      this.currentHealth = this.maxHealth || 0;
    }

    this.meta.name = options.name;

    var elHealth = document.createElement('span');
    elHealth.className = 'health';
    elHealth.innerHTML = '<b></b>';
    
    this.elHealth = elHealth.firstChild;

    this.el.appendChild(elHealth);
  };
  
  Team.prototype.fromServer = function fromServer(data) {
    var health = Math.round(data.health * 100) / 100;
    
    if (health === this.currentHealth) {
      return;
    }
    
    this.currentHealth = health;
    this.elHealth.style.height = (this.currentHealth / this.maxHealth) * 100 + '%';
  };

  return Team;
}());