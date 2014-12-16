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
    this.onBeforeDraw = null;
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
      this.onBeforeDraw = options.onBeforeDraw || function(){};
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
      for (var i = 0, layer; layer = this.layers[i++];) {
        if (layer.id === layerToAdd.id) {
          return false;
        }
      }

      this.layers.push(layerToAdd);
      this.el.appendChild(layerToAdd.el);

      return true;
    },

    removeLayer: function removeLayer(layerToRemove) {
      for (var i = 0, layer; layer = this.layers[i++];) {
        if (layer.id === layerToRemove.id) {
          layerToRemove.parentNode.removeChild(layerToRemove.el);
          this.layers.splice(i - 1, 1);

          return true;
        }
      }

      return false;
    },

    tick: function tick() {
      var now = Date.now();
          dt = (now - this.lastUpdate) / 1000;

      this.dt = dt;

      var layers = this.layers,
          i, layer;

      this.onBeforeUpdate(dt);

      for (i = 0; layer = layers[i++];) {
        layer.update(dt);
      }

      this.onAfterUpdate(dt);

      this.onBeforeDraw(dt);

      for (i = 0; layer = layers[i++];) {
        layer.draw();
      }

      this.onAfterDraw(dt);

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

    isKeyDown: function isKeyDown(key) {
      return !!this.keysDown[key];
    },

    updatePosition: function updatePosition(e) {
      if (e) {
        this._x = e.pageX;
        this._y = e.pageY;
      }

      this.position.x = (this._x - this.offsetX) / this.ratio;
      this.position.y = (this._y - this.offsetY) / this.ratio;
    },

    onKeyDown: function onKeyDown(e) {
      var key = e.which || e.keyCode;
      this.keysDown[key] = true;
    },

    onKeyUp: function onKeyUp(e) {
      var key = e.which || e.keyCode;
      this.keysDown[key] = false;
    },

    KEYS: {
      CTRL: 17,
      CTRLRIGHT: 18,
      CTRLR: 18,
      SHIFT: 16,
      RETURN: 13,
      ENTER: 13,
      BACKSPACE: 8,
      BCKSP:8,
      ALT: 18,
      ALTR: 17,
      ALTRIGHT: 17,
      SPACE: 32,
      WIN: 91,
      MAC: 91,
      FN: null,
      UP: 38,
      DOWN: 40,
      LEFT: 37,
      RIGHT: 39,
      ESC: 27,
      DEL: 46,
      F1: 112,
      F2: 113,
      F3: 114,
      F4: 115,
      F5: 116,
      F6: 117,
      F7: 118,
      F8: 119,
      F9: 120,
      F10: 121,
      F11: 122,
      F12: 123,
      BACKSPACE: '8',
      TAB: '9',
      ENTER: '13',
      SHIFT: '16',
      CTRL: '17',
      ALT: '18',
      CAPS_LOCK: '20',
      ESCAPE: '27',
      PAGE_UP: '33',
      PAGE_DOWN: '34',
      END: '35',
      HOME: '36',
      LEFT_ARROW: '37',
      UP_ARROW: '38',
      RIGHT_ARROW: '39',
      DOWN_ARROW: '40',
      INSERT: '45',
      DELETE: '46',
      NUM_0: '48',
      NUM_1: '49',
      NUM_2: '50',
      NUM_3: '51',
      NUM_4: '52',
      NUM_5: '53',
      NUM_6: '54',
      NUM_7: '55',
      NUM_8: '56',
      NUM_9: '57',
      A: '65',
      B: '66',
      C: '67',
      D: '68',
      E: '69',
      F: '70',
      G: '71',
      H: '72',
      I: '73',
      J: '74',
      K: '75',
      L: '76',
      M: '77',
      N: '78',
      O: '79',
      P: '80',
      Q: '81',
      R: '82',
      S: '83',
      T: '84',
      U: '85',
      V: '86',
      W: '87',
      X: '88',
      Y: '89',
      Z: '90'
    }
  };

  return Input;
}());