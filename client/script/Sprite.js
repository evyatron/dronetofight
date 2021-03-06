var Sprite = (function() {
  var Vector = window.Vector;

  function Sprite(options) {
    this.el = null;
    this.elContent = null;
    this.id = '';
    this.type = '';
    this.src = '';
    this.zIndex = 0;
    this.color = '';
    
    this.speed = 0;
    this.maxSpeed = 0;
    this.rotationSpeed = 0;

    this.width = 0;
    this.height = 0;
    this.isCentered = false;

    this.mass = 1;
    this.drag = 1;
    
    this.isBoundToLayer = false;
    this.bounceOffWalls = false;

    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);

    this.position = new Vector(0, 0);
    this.angle = -1;
    
    this.FORWARDS = new Vector(0, 0);
    this.BACKWARDS = new Vector(0, 0);
    this.CLOCKWISE = new Vector(0, 0);
    this.CCLOCKWISE = new Vector(0, 0);
    
    this.layer = null;
    
    this.SHOULD_DRAW = true;
    this.isDestroyed = false;
    
    Sprite.prototype.init.apply(this, arguments);
  }

  Sprite.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = options.id || ('sprite_' + Date.now());
      this.type = options.type || '';
      this.src = options.image || '';
      this.zIndex = options.zIndex || 0;
      this.speed =  options.speed || 0;
      this.maxSpeed = options.maxSpeed || Infinity;
      this.rotationSpeed = options.rotationSpeed || 0;
      this.drag = options.drag || 0.9;
      this.color = options.color || '';
      this.isCentered = Boolean(options.isCentered);
      this.isBoundToLayer = Boolean(options.isBoundToLayer);
      this.bounceOffWalls = Boolean(options.bounceOffWalls);
      
      this.rotateTo(options.angle || 0);
      
      if ('x' in options && 'y' in options) {
        this.position = new Vector(options.x, options.y);
      }
      
      if ('velocity' in options) {
        this.velocity = new Vector(options.velocity);
      }
      
      if ('SHOULD_DRAW' in options) {
        this.SHOULD_DRAW = Boolean(options.SHOULD_DRAW);
      }

      if (this.SHOULD_DRAW) {
        this.create();
      }

      this.setSize(options.width || 0, options.height || 0);
    
      console.log('[Sprite|' + this.type + '|' + this.id + '] Create', this);
    },

    update: function update(dt) {
      this.velocity.add(this.acceleration);
      
      this.position.add(this.velocity.scale(dt));
      
      this.velocity = this.velocity.scale(this.drag);
      this.velocity.clamp(this.maxSpeed);

      this.acceleration.reset();
      
      if (this.isBoundToLayer && this.layer) {
        var position = this.position,
            x = position.x,
            y = position.y,
            halfWidth = this.width / 2,
            halfHeight = this.height / 2;

        
        position.x = Math.clamp(x, halfWidth, this.layer.width - halfWidth);
        position.y = Math.clamp(y, halfHeight, this.layer.height - halfHeight);
        
        if (this.bounceOffWalls) {
          if (x !== position.x) {
            this.velocity.x *= -1;
          }
          if (y !== position.y) {
            this.velocity.y *= -1;
          }
        }
      }
    },

    draw: function draw() {
      if (!this.SHOULD_DRAW) {
        return;
      }

      var pos = this.position,
          centered = this.isCentered,
          x = Math.round((pos.x - (centered? this.width / 2 : 0)) * 100) / 100,
          y = Math.round((pos.y - (centered? this.height / 2 : 0)) * 100) / 100,
          angle = Math.round(this.angle * 1000) / 1000;

      this.el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
      this.elContent.style.transform = 'rotate(' +  angle + 'deg)';
    },

    applyForce: function applyForce(force) {
      this.acceleration.add(force);
    },

    lookAt: function lookAt(target) {
      if (target) {
        this.rotateTo(this.position.angle(target));
      } else {
        console.warn('Trying to look at nothing');
      }
    },
    
    rotateBy: function rotateBy(angle) {
      if (angle) {
        this.rotateTo(this.angle + angle);
      } else {
        console.warn('Trying to rotate by nothing');
      }
    },
    
    rotateTo: function rotateTo(angle) {
      if (typeof angle !== 'number') {
        console.warn('Not trying to rotate to a number', angle);
        return;
      }
      
      angle = Math.round(angle * 100) / 100;
      
      if (angle === this.angle) {
        return;
      }
      
      this.angle = angle;
      
      if (this.angle >= 360) {
        this.angle = (this.angle % 360);
      }
      
      this.FORWARDS = new window.Vector(1, 0).rotate(this.angle);
      this.BACKWARDS = new window.Vector(-1, 0).rotate(this.angle);
      this.LEFT = new window.Vector(0, -1).rotate(this.angle);
      this.RIGHT = new window.Vector(0, 1).rotate(this.angle);
    },

    setSize: function setSize(width, height) {
      this.width = width;
      this.height = height;

      if (this.el) {
        this.el.style.cssText += 'width: ' + width + 'px;' +
                                 'height: ' + height + 'px;';
      }
    },

    setImage: function setImage(src) {
      var img = new Image();
      img.onload = function onSpriteImageLoad(img) {
        this.elContent.style.backgroundImage = 'url(' + img.src + ')';
        this.setSize(img.width, img.height);
      }.bind(this, img);
      img.src = src;
    },
    
    setLayer: function setLayer(layer) {
      this.layer = layer;
    },

    create: function create() {
      this.el = document.createElement('div');
      this.el.className = 'sprite ' + (this.type || '');
      this.el.style.cssText = 'z-index: ' + this.zIndex + ';' +
                              'position: absolute; top: 0; left: 0;';
      
      this.el.innerHTML = '<div class="content"></div>';
      
      this.el.dataset.id = this.id;
      
      this.elContent = this.el.querySelector('.content');
      
      if (this.src) {
        this.setImage(this.src);
      }
      if (this.color) {
        this.elContent.style.backgroundColor = this.color;
      }
    },
    
    destroy: function destroy() {
      if (this.isDestroyed) {
        return;
      }

      console.log('[Sprite|' + this.id + '] Destroy', this);
      this.layer.remove(this);
      this.isDestroyed = true;
    }
  };

  return Sprite;
}());