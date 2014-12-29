var Sprite = (function() {
  function Sprite(options) {
    this.el = null;
    this.elContent = null;
    this.id = '';
    this.type = '';
    this.src = '';
    this.zIndex = 0;
    this.maxSpeed = 0;
    this.color = '';

    this.width = 0;
    this.height = 0;

    this.mass = 1;
    this.drag = 0.9;

    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);

    this.position = new Vector(0, 0);
    this.angle = -1;
    
    this.FORWARDS = new Vector(0, 0);
    this.BACKWARDS = new Vector(0, 0);
    this.CLOCKWISE = new Vector(0, 0);
    this.CCLOCKWISE = new Vector(0, 0);
    

    this.init(options);
  }

  Sprite.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = options.id || ('sprite_' + Date.now());
      this.type = options.type || '';
      this.src = options.image || '';
      this.zIndex = options.zIndex || 0;
      this.maxSpeed = options.maxSpeed || Infinity;
      this.drag = options.drag || 0.9;
      this.color = options.color || '';
      
      this.rotateTo(options.angle || 0);
      
      if ('x' in options && 'y' in options) {
        this.position = new Vector(options.x, options.y);
      }
      
      if ('velocity' in options) {
        this.velocity = new Vector(options.velocity);
      }

      this.create();

      this.setSize(options.width || 0, options.height || 0);
    },

    update: function update(dt) {
      this.velocity.add(this.acceleration);
      
      this.position.add(this.velocity.scale(dt));
      
      this.velocity = this.velocity.scale(this.drag);
      this.velocity.clamp(this.maxSpeed);

      this.acceleration.reset();
    },

    draw: function draw() {
      var pos = this.position,
          x = Math.round((pos.x - this.width / 2) * 100) / 100,
          y = Math.round((pos.y - this.height / 2) * 100) / 100,
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
        console.warn('Trying to look at nothing!');
      }
    },
    
    rotateBy: function rotateBy(angle) {
      if (angle) {
        this.rotateTo(this.angle + angle);
      } else {
        console.warn('Trying to rotate by nothing!');
      }
    },
    
    rotateTo: function rotateTo(angle) {
      if (typeof angle !== 'number') {
        console.warn('Not tryign to rotate to a number!', angle);
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
      this.CLOCKWISE = new window.Vector(1, 1).rotate(this.angle);
      this.CCLOCKWISE = new window.Vector(1, -1).rotate(this.angle);
    },

    setSize: function setSize(width, height) {
      this.width = width;
      this.height = height;

      this.el.style.cssText += 'width: ' + width + 'px; height: ' + height + 'px;';
    },

    setImage: function setImage(src) {
      var img = new Image();
      img.onload = function onSpriteImageLoad(img) {
        this.elContent.style.backgroundImage = 'url(' + img.src + ')';
        this.setSize(img.width, img.height);
      }.bind(this, img);
      img.src = src;
    },

    create: function create() {
      this.el = document.createElement('div');
      this.el.className = 'sprite ' + (this.type || '');
      this.el.style.cssText = 'z-index: ' + this.zIndex + ';' +
                              'position: absolute; top: 0; left: 0;';
      
      this.el.innerHTML = '<div class="content"></div>';
      
      this.elContent = this.el.querySelector('.content');
      
      if (this.src) {
        this.setImage(this.src);
      }
      if (this.color) {
        this.elContent.style.backgroundColor = this.color;
      }
    }
  };

  return Sprite;
}());