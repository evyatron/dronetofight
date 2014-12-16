var Sprite = (function() {
  function Sprite(options) {
    this.el = null;
    this.id = '';
    this.type = '';
    this.src = '';
    this.zIndex;
    this.color = '';

    this.width = 0;
    this.height = 0;

    this.mass = 1;
    this.drag = 0.9;

    this.forces = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);

    this.position = new Vector(0, 0);
    this.angle = 0;

    this.init(options);
  }

  Sprite.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = options.id || ('sprite_' + Date.now());
      this.type = options.type || '';
      this.src = options.src || '';
      this.zIndex = options.zIndex || 0;
      this.color = options.color || 'transparent';

      this.create();

      this.setSize(options.width || 0, options.height || 0);
    },

    update: function update(dt) {
      var newVelocity = new Vector(this.velocity).scale(this.drag);
      newVelocity.add(new Vector(this.acceleration).scale(dt));
      this.velocity = newVelocity;

      //.rotate(this.angle)

      this.position.add(this.velocity);

      this.acceleration.scale(0);
    },

    draw: function draw() {
      var pos = this.position,
          x = Math.round((pos.x - this.width / 2) * 100) / 100
          y = Math.round((pos.y - this.height / 2) * 100) / 100,
          angle = Math.round(this.angle * 1000) / 1000;

      this.el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) rotate(' +  angle + 'deg)';
    },

    applyForce: function applyForce(force) {
      this.acceleration.add(force);
    },

    lookAt: function lookAt(target) {
      this.angle = this.position.angle(target);
    },

    setSize: function setSize(width, height) {
      this.width = width;
      this.height = height;
      this.el.style.cssText += 'width: ' + width + 'px; height: ' + height + 'px;';
    },

    create: function create() {
      this.el = document.createElement('div');
      this.el.className = 'sprite ' + (this.type || '');
      this.el.style.cssText = 'z-index: ' + this.zIndex + ';' +
                              'position: absolute; top: 0; left: 0;';

      if (this.src) {
        this.el.style.backgroundImage = this.src;
        var img = new Image();
        img.onload = function onSpriteImageLoad(img) {
          this.setSize(img.width, img.height);
        }.bind(this, img);
        img.src = this.src;
      }
      if (this.color) {
        this.el.style.backgroundColor  = this.color;
      }
    }
  };

  return Sprite;
}());