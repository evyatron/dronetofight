var SPRITE_TYPES = {
  SHIP: 'ship'
};
var CHAT_TYPES = {
  TEAM: 'team',
  SERVER: 'server',
  ALL: 'all'
};


var game,
    chat,
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
  
  chat = new window.Chat({
    'el': document.querySelector('.chat'),
    'types': CHAT_TYPES
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
      
      this.el.addEventListener('keydown', this.onKeyDown.bind(this));
      this.el.addEventListener('keyup', this.onInput.bind(this));
      this.el.addEventListener('blur', this.onBlur.bind(this));
    },
    
    onKeyDown: function onKeyDown(e) {
      e.stopPropagation();
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
        localStorage['playerName'] = name;
        Server.sendPlayerMetaData({
          'name': name
        });
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
        'speedFactor': 0,
        'size': [0.5, 1.1],
        'color': 'rgba(255, 255, 255, .4)'
      }),
      starfieldForeground = new Starfield({
        'id': 'starfieldForeground',
        'numberOfItems': 30,
        'speed': [10, 20],
        'speedFactor': 0,
        'size': [0.8, 1.3],
        'color': 'rgba(255, 255, 255, .6)'
      });
      
  layerBackground.add(starfieldBackground);
  layerForeground.add(starfieldForeground);
  starfieldBackground.setSize();
  starfieldForeground.setSize();
  
  onReachedDestination();
}

function onPlayerReadyInServer(e) {
  var data = e.detail || {};
  
  playerShip = new window.Ship({
    'id': data.id,
    'name': localStorage['playerName'],
    'color': localStorage['playerColor'],
    'speed': data.speed
  });
  
  onReachedDestination();
  
  createUI(data.ui);
  
  PlayerNameInput.setValue(playerShip.name);
  
  playerShip.moveTo(game.width / 2, game.height / 2);
  
  Server.newPlayer(playerShip);
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
  var color = document.getElementById('colors').value;
  
  localStorage['playerColor'] = color;
  Server.sendPlayerMetaData({
    'color': color
  });
}

function onReachedDestination() {
  AT_DESTINATION = true;
  if (playerShip) {
    layerPlayers.add(playerShip.sprite);
  }
}

var TURBO_MODFIER = 2,
    HOLD_AT_MAX_SPEED = 3,
    traveled = 0,
    travelSpeedIncrement = 0.25,
    travelSpeedDecrement = 0.9,
    travelSpeed = 100,
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

var Players = (function Players() {
  function Players() {
    this.players = {};
  }
  
  Players.prototype = {
    tick: function tick(data) {
      var players = data.players || {},
          player,
          metaData, tickData,
          isPlayer = false;
      
      for (var id in players) {
        isPlayer = !isPlayer && id === playerShip.id;
        player = isPlayer? playerShip : this.players[id];

        metaData = players[id].meta;
        tickData = players[id].tick;
        
        // First try an update meta data if that exists
        // Needs to be BEFORE the tick data, since for new users
        // We first create the user here
        if (metaData) {
          this.fromMetaData(id, metaData);
        }
        
        // In acse the player was created just now in fromMetaData
        if (!player) {
          player = this.players[id];
        }
        
        if (!isPlayer && player && tickData) {
          player.fromTickData(tickData);
        }
      }
      
      for (var id in this.players) {
        if (!players[id]) {
          layerPlayers.remove(this.players[id].sprite);
          delete this.players[id];
        }
      }
    },
    
    update: function update(players) {
      for (var id in players) {
        if (id === playerShip.id) {
          continue;
        }
        
        this.fromMetaData(id, players[id]);
      }
      
      console.log('done creating players: ', this.players)
    },
    
    fromMetaData: function fromMetaData(id, data) {
      var player = id === playerShip.id? playerShip : this.players[id],
          meta = data.meta || data,
          tick = data.tick || data;
      
      if (!player) {
        player = this.players[id] = new window.Ship();
        layerPlayers.add(player.sprite);
      }
      
      player.fromMetaData(meta);
    }
  };
  
  return new Players();
}());


var Server = (function() {
  function Server() {
    this.socket = null;
  }
  
  Server.prototype = {
    init: function init() {
      this.socket = window.io.connect();
      
      this.socket.on('tick', Players.tick.bind(Players));
      this.socket.on('updatePlayers', Players.update.bind(Players));
      
      this.socket.on('addPlayer', this.onAddPlayer.bind(this));
      this.socket.on('ready', this.onPlayerReadyInServer.bind(this));
      this.socket.on('updateMetaData', this.onUpdatePlayerMetaData.bind(this));
      
      this.socket.on('joinGame', this.onJoinedGame.bind(this));
      
      this.socket.on('chatAddWindow', chat.addWindow.bind(chat));
      this.socket.on('chatNewMessage', chat.addMessage.bind(chat));
    },
    
    onJoinedGame: function onJoinedGame(data) {
      console.info('Joined game: ' + data.id, data.players);
      Players.update(data.players);
    },

    sendPlayerMetaData: function sendPlayerMetaData(meta) {
      console.info('[Server.emit] Send player meta data', meta);
      this.socket.emit('updateMetaData', meta);
    },
    
    sendPlayerTickData: function sendPlayerTickData() {
      this.socket.emit('updateTickData', playerShip.toTickData());
    },
    
    onUpdatePlayerMetaData: function nonUpdatePlayerMetaData(data) {
      Players.fromMetaData(data.id, data.meta);
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
    
    onAddPlayer: function onAddPlayer(playerData) {
      console.info('[Server.on] Player added', playerData);
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