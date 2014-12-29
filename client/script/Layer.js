var Layer = (function() {
  function Layer(options) {
    this.id;
    this.el;
    this.zIndex;

    this.sprites = [];
    this.spritesMap = {};

    this.init(options);
  }

  Layer.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = options.id || ('layer_' + Date.now());
      this.zIndex = options.zIndex || 0;

      this.createElement();
    },

    update: function update(dt) {
      for (var i = 0, sprite; (sprite = this.sprites[i++]);) {
        sprite.update(dt);
      }
    },

    draw: function draw() {
      for (var i = 0, sprite; (sprite = this.sprites[i++]);) {
        sprite.draw();
      }
    },

    add: function add(spriteToAdd) {
      if (!spriteToAdd || this.spritesMap[spriteToAdd.id]) {
        return;
      }

      spriteToAdd.setLayer(this);
      this.spritesMap[spriteToAdd.id] = spriteToAdd;
      this.sprites.push(spriteToAdd);
      this.el.appendChild(spriteToAdd.el);

      return true;
    },

    remove: function remove(spriteToRemove) {
      if (!spriteToRemove || !this.spritesMap[spriteToRemove.id]) {
        return;
      }
      
      for (var i = 0, sprite; (sprite = this.sprites[i++]);) {
        if (sprite.id === spriteToRemove.id) {
          spriteToRemove.setLayer(null);
          spriteToRemove.el.parentNode.removeChild(spriteToRemove.el);
          this.sprites.splice(i - 1, 1);

          return true;
        }
      }

      return false;
    },
    
    get: function get(id) {
      return this.spritesMap[id];
    },

    createElement: function createElement() {
      this.el = document.createElement('div');
      this.el.className = 'layer ' + this.id;
      this.el.style.cssText = 'z-index: ' + this.zIndex + ';' +
                              'position: absolute;' +
                              'top: 0; left: 0; right: 0; bottom: 0;' +
                              'overflow: hidden;';
    }
  };

  return Layer;
}());