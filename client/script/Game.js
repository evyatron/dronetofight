var Game = (function() {
  function Game(options) {
    this.elContainer;
    this.el;

    this.layers = [];
    this.width = 0;
    this.height = 0;
    this.dt = 0;
    this.lastUpdate = 0;

    this.Input = null;
    this.onBeforeUpdate = null;
    this.onAfterUpdate = null;
    this.onAfterDraw = null;

    this._eventListeners = {};

    this.init(options);
  }

  Game.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.elContainer = options.elContainer || document.body;
      this.width = options.width || screen.width;
      this.height = options.height || screen.height;

      this.onBeforeUpdate = options.onBeforeUpdate || function(){};
      this.onAfterUpdate = options.onAfterUpdate || function(){};
      this.onAfterDraw = options.onAfterDraw || function(){};

      this._tick = this.tick.bind(this);

      this.createElement();

      window.addEventListener('resize', this.resize.bind(this));

      this.Input = new Input({
        'el': this.el
      });

      this.Input.resize();
      this.resize();

      this.lastUpdate = Date.now();
      window.requestAnimationFrame(this._tick);
    },

    addLayer: function addLayer(layerToAdd) {
      for (var i = 0, layer; (layer = this.layers[i++]);) {
        if (layer.id === layerToAdd.id) {
          return false;
        }
      }

      this.layers.push(layerToAdd);
      this.el.appendChild(layerToAdd.el);

      return true;
    },

    removeLayer: function removeLayer(layerToRemove) {
      for (var i = 0, layer; (layer = this.layers[i++]);) {
        if (layer.id === layerToRemove.id) {
          layerToRemove.parentNode.removeChild(layerToRemove.el);
          this.layers.splice(i - 1, 1);

          return true;
        }
      }

      return false;
    },

    tick: function tick() {
      var now = Date.now(),
          dt = Math.min((now - this.lastUpdate) / 1000, 1000 / 60);

      this.dt = dt;

      var layers = this.layers,
          i, layer;

      this.onBeforeUpdate(dt);

      for (i = 0; (layer = layers[i++]);) {
        layer.update(dt);
      }

      this.onAfterUpdate(dt);

      for (i = 0; (layer = layers[i++]);) {
        layer.draw();
      }

      this.onAfterDraw();

      this.lastUpdate = now;
      window.requestAnimationFrame(this._tick);
    },

    createElement: function createElement() {
      this.el = document.createElement('div');
      this.el.className = 'game';
      this.el.style.cssText = 'width: ' + this.width + 'px;' +
                              'height: ' + this.height + 'px;' +
                              'margin: -' + (this.height / 2) + 'px 0 0 -' + (this.width / 2) + 'px;' +
                              'position: absolute; top: 50%; left: 50%;';

      this.elContainer.appendChild(this.el);

      this.resize();
    },

    resize: function resize() {
      var windowWidth = window.innerWidth,
          windowHeight = window.innerHeight;

      this.ratio = Math.min(windowWidth / this.width, windowHeight / this.height);
      this.el.style.transform = 'scale(' + this.ratio + ')';

      if (this.Input) {
        this.Input.ratio = this.ratio;
      }
    },

    addEventListener: function addEventListener(event, listener) {
      if (!this._eventListeners[event]) {
        this._eventListeners[event] = [];
      }

      this._eventListeners[event].push(listener);
    }
  };

  return Game;
}());

var Input = (function() {
  function Input(options) {
    this.el = null;

    this._x = 0;
    this._y = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.ratio = 1;

    this.keysDown = {};
    this.position = new Vector();

    this.init(options);
  }

  Input.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.el = options.el || document.body;
      this.ratio = options.ratio || 1;

      window.addEventListener('resize', this.resize.bind(this));

      this.el.addEventListener('mousemove', this.updatePosition.bind(this));
      window.addEventListener('keydown', this.onKeyDown.bind(this));
      window.addEventListener('keyup', this.onKeyUp.bind(this));

      this.resize();
    },

    resize: function resize() {
      var bounds = this.el.getBoundingClientRect();
      this.offsetX = bounds.left;
      this.offsetY = bounds.top;

      this.updatePosition();
    },

    // Check if a key(s) is down
    // @keys (string|array)
    isKeyDown: function isKeyDown(keys) {
      if (Array.isArray(keys)) {
        for (var i = 0, key; (key = keys[i++]);) {
          if (this.keysDown[key]) {
            return true;
          }
        }
        
        return false;
      } else {
        return !!this.keysDown[keys];
      }
    },

    // Update the user's mouse position
    // @e (MouseEvent)
    updatePosition: function updatePosition(e) {
      if (e) {
        this._x = e.pageX;
        this._y = e.pageY;
      }

      this.position.x = (this._x - this.offsetX) / this.ratio;
      this.position.y = (this._y - this.offsetY) / this.ratio;
    },

    // On keyboard event - mark the key as pressed
    // @e (KeyDownEvent)
    onKeyDown: function onKeyDown(e) {
      this.keysDown[e.which || e.keyCode] = true;
    },

    // On keyboard event - mark the key as not pressed anymore
    // @e (KeyUpEvent)
    onKeyUp: function onKeyUp(e) {
      this.keysDown[e.which || e.keyCode] = false;
    }
  };

  return Input;
}());