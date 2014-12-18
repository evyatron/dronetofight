var Ship = (function() {
  function Ship(options) {
    this.id = '';
    this.name = '';
    this.sprite = null;
    this.speed = 0;
    this.color = '';

    this.init(options);
  }

  Ship.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = options.id || ('ship_' + Date.now());
      this.name = options.name || ('Player_' + window.utils.random(1, 1000));
      this.speed = options.speed || 0;
      this.color = options.color || window.utils.random(['red', 'blue', 'green']);

      this.sprite = new window.Sprite({
        'id': 'sprite_' + this.id,
        'type': window.SPRITE_TYPES.SHIP,
        'width': 50,
        'height': 50,
        'color': this.color
      });
    },

    moveTo: function moveTo(x, y) {
      this.sprite.position.x = x;
      this.sprite.position.y = y;
    },
    
    toMetaData: function toMetaData() {
      return {
        'name': this.name,
        'color': this.color
      };
    },
    
    toTickData: function toTickData() {
      return {
        'x': this.sprite.position.x,
        'y': this.sprite.position.y,
        'angle': this.sprite.angle
      };
    },
    
    fromMetaData: function fromMetaData(data) {
      this.id = data.id;
      this.sprite.color = this.color = data.color;
    },
    
    fromTickData: function fromTickData(data) {
      this.sprite.position.x = data.x;
      this.sprite.position.y = data.y;
      this.sprite.angle = data.angle;
    }
  };

  return Ship;
}());