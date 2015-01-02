var Skill = (function Skill() {
  function Skill(options) {
    this.el = null;
    this.elContainer = null;
    this.elCooldown = null;
    
    this.id = '';
    this.name = '';
    this.cooldown = 0;
    this.type = '';
    this.key = '';
    this.damage = 0;
    
    this.timeSinceUse = 0;
    
    this.isReady = true;
    this.cooldownPercentage = 0;
    
    this.init(options);
  }

  Skill.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.elContainer = options.elContainer;
      
      this.id = options.id;
      this.name = options.name;
      this.cooldown = options.cooldown;
      this.type = options.type;
      this.key = options.key;
      this.damage = options.damage;
      
      this.createHTML();
      
      console.log('[Skill|' + this.id + '] Create', options);
    },
    
    update: function update(dt) {
      if (!this.isReady) {
        this.timeSinceUse += dt;
        
        var cooldownPercentage = this.timeSinceUse / this.cooldown;
        cooldownPercentage = Math.round(cooldownPercentage * 100) / 100;
        
        if (cooldownPercentage !== this.cooldownPercentage) {
          this.cooldownPercentage = cooldownPercentage;
          this.elCooldown.style.transform =
            'translateY(' + (100 - cooldownPercentage*100) + '%)';
        }
        
        if (this.timeSinceUse >= this.cooldown) {
          this.elCooldown.style.transform = 'translateY(0%)';
          this.setReady(true);
        }
      }
    },
    
    fromServer: function fromServer(data) {
      if (data.isReady !== this.isReady) {
        this.setReady(data.isReady);
      }
    },
    
    setReady: function setReady(isReady) {
      this.isReady = isReady;
      
      if (isReady) {
        this.timeSinceUse = 0;
        this.elCooldown.style.transform = 'translateY(0%)';
        this.el.classList.add('ready');
      } else {
        this.el.classList.remove('ready');
      }
    },

    createHTML: function createHTML() {
      this.el = document.createElement('li');
      this.el.className = 'skill ' + this.type;
      this.el.dataset.id = this.id;
      this.el.innerHTML = '<div class="cooldown">' +
                            '<b></b>' +
                            '<span></span>' +
                          '</div>' +
                          '<div class="name">' +
                            this.name + 
                          '</div>';
      
      this.elCooldown = this.el.querySelector('.cooldown b');
      
      this.elContainer.appendChild(this.el);
    }
  };

  return Skill;
}());