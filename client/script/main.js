var SPRITE_TYPES = {
  SHIP: 'ship'
};


var game,
    layerBackground,
    layerPlayers,
    layerForeground,
    playerShip,
    PLAYERS = {},
    
    AT_DESTINATION = false,
    
    
    Config = window.Config;

function start() {
  game = new window.Game({
    'elContainer': document.querySelector('#container'),
    'width': 1920,
    'height': 1080,
    'onBeforeUpdate': onBeforeUpdate,
    'onAfterDraw': onAfterDraw
  });
  
  layerBackground = new window.Layer({
    'id': 'background',
    'zIndex': 10
  });
  game.addLayer(layerBackground);
  
  layerPlayers = new window.Layer({
    'id': 'players',
    'zIndex': 50
  });
  game.addLayer(layerPlayers);
  
  layerForeground = new window.Layer({
    'id': 'foreground',
    'zIndex': 80
  });
  game.addLayer(layerForeground);
  
  
  
  createStarfields();
  
  
  
  
  PlayerNameInput.init({
    'el': document.getElementById('playername')
  });
  
  
  window.addEventListener('PlayerReadyInServer', onPlayerReadyInServer);
  
  Server.init();
}

var PlayerNameInput = (function() {
  function PlayerNameInput() {
    this.el;
    this.value;
  }
  
  PlayerNameInput.prototype = {
    init: function init(options) {
      this.el = options.el;
      
      this.setValue(options.value);
      
      this.el.addEventListener('keyup', this.onInput.bind(this));
      this.el.addEventListener('blur', this.onBlur.bind(this));
    },
    
    onInput: function onInput(e) {
      if (e.keyCode === 13) {
        this.sendValue(this.el.value);
      }
    },
    
    onBlur: function onBlur(e) {
      this.sendValue(this.el.value);
    },
    
    setValue: function setValue(name) {
      if (!name) {
        return false;
      }

      this.el.value = this.value = name;
      
      return true;
    },
    
    sendValue: function sendValue(name) {
      if (this.setValue(name)) {
        playerShip.setName(this.value);
      }
    }
  };
  
  return new PlayerNameInput();
}())


function createStarfields() {
  var starfieldBackground = new Starfield({
        'id': 'starfieldBackground',
        'numberOfItems': 100,
        'speed': [5, 15],
        'size': [0.5, 1],
        'color': 'rgba(255, 255, 255, .5)'
      }),
      starfieldForeground = new Starfield({
        'id': 'starfieldForeground',
        'numberOfItems': 50,
        'speed': [10, 20],
        'size': [0.8, 1.3],
        'color': 'rgba(255, 255, 255, .7)'
      });
      
  layerBackground.add(starfieldBackground);
  layerForeground.add(starfieldForeground);
  starfieldBackground.setSize();
  starfieldForeground.setSize();
}

function onPlayerReadyInServer(e) {
  var data = e.detail || {};
  
  playerShip = new window.Ship({
    'id': data.id,
    'name': localStorage['playerName'],
    'color': localStorage['playerColor'],
    'speed': data.speed,
    'onMetaDataChange': onPlayerMetaDataChange
  });
  
  createUI(data.ui);
  
  PlayerNameInput.setValue(playerShip.name);
  
  playerShip.moveTo(game.width / 2, game.height / 2);
  
  Server.newPlayer(playerShip);
}


function onPlayerMetaDataChange() {
  Server.sendPlayerMetaData();
  localStorage['playerName'] = playerShip.name;
  localStorage['playerColor'] = playerShip.color;
}

function createUI(data) {
  var elColor = document.getElementById('colors'),
      colors = data.colors || [],
      html = '';

  for (var i = 0, color; (color = colors[i++]);) {
    html += '<option value="' + color.color + '" style="background-color: ' + color.color + ';">' +
              color.name +
            '</option>';
  }
  
  elColor.addEventListener('change', onColorChange);
  
  elColor.innerHTML = html;
  
  var elSelectedColor = elColor.querySelector('option[value = "' + playerShip.color + '"]');
  if (elSelectedColor) {
    elSelectedColor.selected = true;
  }
}

function onColorChange() {
  var elColor = document.getElementById('colors'),
      color = elColor.value;
  
  playerShip.setColor(color);
}

function onReachedDestination() {
  AT_DESTINATION = true;
  layerPlayers.add(playerShip.sprite);
}

var TURBO_MODFIER = 2,
    HOLD_AT_MAX_SPEED = 4,
    traveled = 0,
    travelSpeedIncrement = 0.2,
    travelSpeedDecrement = 0.8,
    travelSpeed = 80,
    currentTravelSpeed = 0;

function onBeforeUpdate(dt) {
  if (AT_DESTINATION) {
    handlePlayerInput(dt);
  } else {
    var starfieldBackground = layerBackground.get('starfieldBackground'),
        starfieldForeground = layerForeground.get('starfieldForeground');
        
    if (starfieldBackground && starfieldForeground) {
      if (traveled < HOLD_AT_MAX_SPEED) {
        if (currentTravelSpeed < travelSpeed) {
          currentTravelSpeed += travelSpeedIncrement;
          if (currentTravelSpeed > travelSpeed) {
            currentTravelSpeed = travelSpeed;
          }
          starfieldBackground.setSpeedFactor(currentTravelSpeed);
          starfieldForeground.setSpeedFactor(currentTravelSpeed);
        } else if (currentTravelSpeed === travelSpeed) {
          traveled += dt;
        }
      } else if (currentTravelSpeed > 0) {
        currentTravelSpeed -= travelSpeedDecrement;
        if (currentTravelSpeed < 0) {
          currentTravelSpeed = 0;
          onReachedDestination();
        }
        
        starfieldBackground.setSpeedFactor(currentTravelSpeed);
        starfieldForeground.setSpeedFactor(currentTravelSpeed);
      }
    }
  }
}

function handlePlayerInput(dt) {
  if (!playerShip) {
    return;
  }

  var input = game.Input;

  // Rotate the player to look at the cursor
  playerShip.sprite.lookAt(input.position);

  var speed = playerShip.speed,
      playerSprite = playerShip.sprite;
      
  // Is turbo key down
  if (input.isKeyDown(Config.KEY_BINDINGS.TURBO)) {
    speed *= TURBO_MODFIER;
  }

  // Movement
  if (input.isKeyDown(Config.KEY_BINDINGS.RIGHT)) {
    playerSprite.applyForce(new window.Vector(speed, 0));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.LEFT)) {
    playerSprite.applyForce(new window.Vector(-speed, 0));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.UP)) {
    playerSprite.applyForce(new window.Vector(0, -speed));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.DOWN)) {
    playerSprite.applyForce(new window.Vector(0, speed));
  }
}

function onAfterDraw() {
  if (playerShip) {
    Server.sendPlayerTickData();
  }
}



var Server = (function() {
  function Server() {
    this.socket = null;
  }
  
  Server.prototype = {
    init: function init() {
      this.socket = window.io.connect();
      
      this.socket.on('tick', this.onServerTick.bind(this));
      this.socket.on('updatePlayers', this.onUpdatePlayers.bind(this));
      this.socket.on('removePlayer', this.onRemovePlayer.bind(this));
      this.socket.on('addPlayer', this.onAddPlayer.bind(this));
      this.socket.on('ready', this.onPlayerReadyInServer.bind(this));
      this.socket.on('updateMetaData', this.onUpdatePlayerMetaData.bind(this));
    },

    sendPlayerMetaData: function sendPlayerMetaData() {
      console.info('[Server.emit] Send player meta data', playerShip.toMetaData());
      this.socket.emit('updateMetaData', playerShip.toMetaData());
    },
    
    sendPlayerTickData: function sendPlayerTickData() {
      this.socket.emit('updateTickData', playerShip.toTickData());
    },
    
    onUpdatePlayerMetaData: function nonUpdatePlayerMetaData(data) {
      var playerId = data.id,
          playerMetaData = data.meta,
          player = PLAYERS[playerId];
      
      if (!player) {
        return;
      }
      
      player.fromMetaData(playerMetaData);
    },
    
    onPlayerReadyInServer: function onPlayerReadyInServer(data) {
      console.info('[Server.on] Player ready in server', data);
      window.dispatchEvent(new CustomEvent('PlayerReadyInServer', {
        'detail': data
      }));
    },
    
    newPlayer: function newPlayer(player) {
      console.info('[Server.emit] New player', player);
      this.socket.emit('newPlayer', player.toMetaData());
    },
    
    onRemovePlayer: function onRemovePlayer(playerId) {
      
      var player = PLAYERS[playerId];
      if (player) {
        console.info('[Server.on]: Removing player', playerId);
        layerPlayers.remove(player.sprite);
        delete PLAYERS[playerId];
      } else {
        console.warn('[Server.on]: Trying to remove non existent player! ', playerId);
      }
    },
    
    onAddPlayer: function onAddPlayer(playerData) {
      console.info('[Server.on] Player added', playerData);
    },
    
    onUpdatePlayers: function onUpdatePlayers(players) {
      var player;
      
      for (var id in players) {
        if (id === playerShip.id) {
          continue;
        }
        
        player = players[id];
        
        if (PLAYERS[id]) {
          PLAYERS[id].fromMetaData(player);
        } else {
          PLAYERS[id] = new Ship(player);
          layerPlayers.add(PLAYERS[id].sprite);
        }
      }
      
      console.log('done creating players: ', PLAYERS)
    },
    
    onServerTick: function onServerTick(data) {
      var players = data.players || {},
          player;
      
      for (var id in players) {
        player = players[id];

        if (id === playerShip.id) {
          playerShip.updateFromServer(player);
        } else if (PLAYERS[id]) {
          PLAYERS[id].fromTickData(player);
        }
      }
    }
  };
  
  return new Server();
}());


start();




var SampleObject = (function() {
  function SampleObject(options) {
    this.init(options);
  }

  SampleObject.prototype = {
    init: function init(options) {
      !options && (options = {});
    }
  };

  return SampleObject;
}());