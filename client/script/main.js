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
    layerProjectiles,
    layerPlayers,
    layerForeground,
    PLAYER,
    
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
  
  layerProjectiles = new window.Layer({
    'id': 'projectiles',
    'zIndex': 20
  });
  game.addLayer(layerProjectiles);

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

function onPlayerReadyInServer(data) {
  console.info('[Server.on] Player ready in server', data);
  
  // Create player ship
  PLAYER = new window.Ship({
    'id': data.id,
    'speed': data.speed,
    'maxSpeed': data.maxSpeed,
    'zIndex': 100,
    'isPlayer': true
  });
  
  PLAYER.fromMetaData({
    'name': localStorage['playerName'] || ('Player_' + window.utils.random(1, 1000)),
    'shipId': localStorage['playerShip'] || 1
  });
  
  for (var skillId in data.skills) {
    var skillData = data.skills[skillId];
    skillData.elContainer = document.getElementById('skills');
    PLAYER.addSkill(new window.Skill(skillData));
  }
  
  onReachedDestination();
  
  createUI(data.ui);
  
  PlayerNameInput.setValue(PLAYER.meta.name);
  
  PLAYER.moveTo(game.width / 2, game.height / 2);
  
  Server.newPlayer(PLAYER);
}

function createUI(data) {
  var el = document.getElementById('ships'),
      items = data.ships || [],
      html = '';

  for (var i = 0, item; (item = items[i++]);) {
    html += '<option value="' + item.id + '">' + item.name + '</option>';
  }
  
  el.addEventListener('change', onShipChange);
  
  el.innerHTML = html;
  
  var elSelected = el.querySelector('option[value = "' + PLAYER.meta.shipId + '"]');
  if (elSelected) {
    elSelected.selected = true;
  }
}

function onShipChange() {
  var shipId = document.getElementById('ships').value;
  
  localStorage['playerShip'] = shipId;
  Server.sendPlayerMetaData({
    'shipId': shipId
  });
  
  document.getElementById('ships').blur();
}

function onReachedDestination() {
  AT_DESTINATION = true;
  if (PLAYER) {
    layerPlayers.add(PLAYER.sprite);
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
  
  if (PLAYER) {
    PLAYER.update(dt);
  }
}

function handlePlayerInput(dt) {
  if (!PLAYER) {
    return;
  }

  var input = game.Input,
      playerSprite = PLAYER.sprite,
      speed = PLAYER.speed,
      distanceFromShipToInput = playerSprite.position.distance(input.position);

      
  // Rotate the player's ship to look at the cursor
  playerSprite.lookAt(input.position);


  // Is turbo key down
  if (input.isKeyDown(Config.KEY_BINDINGS.TURBO)) {
    speed *= TURBO_MODFIER;
  }

  // Movement
  if (input.isKeyDown(Config.KEY_BINDINGS.RIGHT)) {
    playerSprite.applyForce(playerSprite.CLOCKWISE.scale(speed));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.LEFT)) {
    playerSprite.applyForce(playerSprite.CCLOCKWISE.scale(speed));
  }

  if (distanceFromShipToInput > 100) {
    if (input.isKeyDown(Config.KEY_BINDINGS.UP)) {
      playerSprite.applyForce(playerSprite.FORWARDS.scale(speed));
    }
    if (input.isKeyDown(Config.KEY_BINDINGS.DOWN)) {
      playerSprite.applyForce(playerSprite.BACKWARDS.scale(speed));
    }
  }
  
  var skill;
  for (var skillId in PLAYER.skills) {
    skill = PLAYER.skills[skillId];
    if (skill.isReady && input.isKeyDown(skill.key)) {
      Server.useSkill(skillId);
    }
  }



  /*
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
  */
}

function onAfterDraw() {
  if (PLAYER) {
    Server.sendPlayerTickData();
  }
}

function serverTick(data) {
  var players = data.players,
      ownData = data.playerData;

  // Update the own player
  PLAYER.fromServer(ownData);
  
  // Update all other players in the game
  Players.tick(players);
}

var Projectiles = (function Projectiles() {
  function Projectiles() {
    this.projectiles = {};
  }
  
  Projectiles.prototype = {
    update: function update(dt) {
      for (var id in this.projectiles) {
        this.projectiles[id].update(dt);
      }
    },
    
    add: function add(data) {
      if (this.projectiles[data.id]) {
        return;
      }
      
      this.projectiles[data.id] = new window.Sprite(data);
      
      layerProjectiles.add(this.projectiles[data.id]);
      
      console.log('Create new projectile', data);
    },
    
    remove: function remove(data) {
      if (!this.projectiles[data.id]) {
        return;
      }
      
      console.log('Remove projectile', data);
      
      layerProjectiles.remove(this.projectiles[data.id]);
      
      delete this.projectiles[data.id];
    }
  };
  
  return new Projectiles();
}());

var Players = (function Players() {
  function Players() {
    this.players = {};
  }
  
  Players.prototype = {
    tick: function tick(players) {
      var player,
          metaData, tickData,
          isPlayer = false;
      
      for (var id in players) {
        isPlayer = !isPlayer && id === PLAYER.id;
        player = isPlayer? PLAYER : this.players[id];

        metaData = players[id].meta;
        tickData = players[id].tick;
        
        // First try an update meta data if that exists
        // Needs to be BEFORE the tick data, since for new users
        // We first create the user here
        if (metaData) {
          this.fromMetaData(id, metaData);
        }

        // In case the player was created just now in fromMetaData
        if (!player) {
          player = this.players[id];
        }
        
        if (!isPlayer && player && tickData) {
          player.fromTickData(tickData);
        }
      }
      
      // If we have a player that WASN'T sent in the server tick
      // It means they were disconnected - so let's remove them
      for (var id in this.players) {
        if (!players[id]) {
          layerPlayers.remove(this.players[id].sprite);
          delete this.players[id];
        }
      }
    },
    
    update: function update(players) {
      for (var id in players) {
        this.fromMetaData(id, players[id]);
      }
      
      for (var id in this.players) {
        this.players[id].update_team();
      }
      
      console.log('done creating players: ', players);
    },
    
    fromMetaData: function fromMetaData(id, data) {
      var isOwnPlayer = id === PLAYER.id,
          player = isOwnPlayer? PLAYER : this.players[id],
          meta = data.meta || data;
      
      if (!player && !isOwnPlayer) {
        player = this.players[id] = new window.Ship(meta);
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
      
      this.socket.on('tick', serverTick);
      this.socket.on('updatePlayers', Players.update.bind(Players));
      
      this.socket.on('addPlayer', this.onAddPlayer.bind(this));
      this.socket.on('ready', onPlayerReadyInServer);
      this.socket.on('updateMetaData', this.onUpdatePlayerMetaData.bind(this));
      
      this.socket.on('projectileAdd', Projectiles.add.bind(Projectiles));
      this.socket.on('projectileRemove', Projectiles.remove.bind(Projectiles));
      
      this.socket.on('joinGame', this.onJoinedGame.bind(this));
      
      this.socket.on('chatAddWindow', chat.addWindow.bind(chat));
      this.socket.on('chatNewMessage', chat.addMessage.bind(chat));
    },
    
    onJoinedGame: function onJoinedGame(data) {
      console.info('Joined game', data);
      Players.update(data.players);
      document.getElementById('team').innerHTML = data.team;
    },

    sendPlayerMetaData: function sendPlayerMetaData(meta) {
      console.info('[Server.emit] Send player meta data', meta);
      this.socket.emit('updateMetaData', meta);
    },
    
    sendPlayerTickData: function sendPlayerTickData() {
      this.socket.emit('updateTickData', PLAYER.toTickData());
    },
    
    useSkill: function useSkill(id) {
      this.socket.emit('useSkill', id);
    },
    
    onUpdatePlayerMetaData: function nonUpdatePlayerMetaData(data) {
      Players.fromMetaData(data.id, data.meta);
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