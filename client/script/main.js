var SPRITE_TYPES = {
  TEAM: 'team',
  SHIP: 'ship',
  PROJECTILE: 'projectile'
};
var CHAT_TYPES = {
  TEAM: 'team',
  SERVER: 'server',
  ALL: 'all'
};
var TEMPLATE_SHIP = '<li data-id="{{id}}">' +
                      '<span class="image" style="background-image: url({{image}});"></span>' +
                      '<span class="name">{{name}}</span>' +
                    '</li>';

var game,
    chat,
    layerBackground,
    layerProjectiles,
    layerPlayers,
    layerForeground,
    PLAYER,
    
    lastServerTick = 0,
    lastClientTick = 0,

    Config = window.Config;

function start() {
  game = new window.Game({
    'elContainer': document.querySelector('#container'),
    'width': 1920,
    'height': 1080,
    'onBeforeUpdate': Starfields.update.bind(Starfields),
    'onAfterUpdate': onAfterUpdate,
    'onAfterDraw': onAfterDraw
  });
  
  chat = new window.Chat({
    'el': document.querySelector('.chat'),
    'types': CHAT_TYPES,
    'onMessage': Server.sendChatMessage.bind(Server)
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
  
  
  
  Starfields.init({
    'onAnimationDone': onStarfieldsAnimationDone
  });
  Starfields.addToLayer(Starfields.starfieldBackground, layerBackground);
  Starfields.addToLayer(Starfields.starfieldForeground, layerForeground);
  
  
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
}());

function onPlayerReadyInServer(data) {
  console.info('[Server.on] Player ready in server', data);
  
  var ships = data.ships;

  Config.SHIPS = {};
  for (var i = 0, ship; (ship = ships[i++]);) {
    Config.SHIPS[ship.id] = ship;
  }
  
  var playerShipId = localStorage['playerShip'] || ships[0].id,
      playerShip = Config.SHIPS[playerShipId];
  
  // Create player ship
  PLAYER = new window.Ship({
    'id': data.id,
    'speed': playerShip.data.speed,
    'maxSpeed': playerShip.data.maxSpeed,
    'rotationSpeed': playerShip.data.rotationSpeed,
    'zIndex': 100,
    'isPlayer': true
  });
  
  PLAYER.fromMetaData({
    'name': localStorage['playerName'] || ('Player_' + window.utils.random(1, 1000)),
    'shipId': playerShipId
  });
  
  var elSkills = document.querySelector('#skills ul');
  elSkills.innerHTML = '';
  for (var skillId in data.skills) {
    var skillData = data.skills[skillId];
    skillData.elContainer = elSkills;
    
    PLAYER.addSkill(new window.Skill(skillData));
  }
  
  // TODO: remove if we want to use the starfields animation
  Starfields.onReachedDestination();
  // -------
  
  createStaticSprites(data.sprites);
  
  createUI(data.ships);
  
  PlayerNameInput.setValue(PLAYER.meta.name);
  
  PLAYER.position = new Vector(game.width / 2, game.height / 2);
  
  Server.newPlayer(PLAYER);
}

function onPlayerJoinGame(data) {
  console.info('Joined game', data);
  
  Players.update(data.players);
  
  Teams.init(data.teams);
  
  document.getElementById('team').innerHTML = Teams.get(data.team).meta.name;
}

function createStaticSprites(sprites) {
  if (!sprites) {
    return;
  }
  
  if (!Array.isArray(sprites)) {
    sprites = [sprites];
  }
  
  for (var i = 0, data; (data = sprites[i++]);) {
    layerBackground.add(new Sprite(data));
  }
}

function createUI(ships) {
  var elUI = document.getElementById('ui'),
      elShips = document.createElement('ul'),
      html = '';

  elShips.className = 'ships';

  for (var i = 0, ship; (ship = ships[i++]);) {
    html += TEMPLATE_SHIP.format(ship);
  }

  elShips.innerHTML = html;
  
  elShips.addEventListener('click', function onClickShips(e) {
    changeShip(e.target.dataset.id);
  });
  
  elUI.appendChild(elShips);
  
  selectShipInUI();
}

function changeShip(shipId) {
  var ship = shipId && Config.SHIPS[shipId];
  if (!ship) {
    return;
  }
  
  PLAYER.speed = ship.data.speed;
  PLAYER.maxSpeed = ship.data.maxSpeed;
  PLAYER.rotationSpeed = ship.data.rotationSpeed;

  localStorage['playerShip'] = shipId;
  
  Server.sendPlayerMetaData({
    'shipId': shipId
  });
}

function selectShipInUI() {
  if (!PLAYER.meta.shipId) {
    return;
  }

  var SELECTED_CLASS = 'selected',
      elShips = document.querySelector('.ships'),
      elCurrent = elShips.querySelector('.' + SELECTED_CLASS),
      elNew = elShips.querySelector('[data-id = "' + PLAYER.meta.shipId + '"]');

  elCurrent && elCurrent.classList.remove(SELECTED_CLASS);
  elNew && elNew.classList.add(SELECTED_CLASS);
}

// When the starfields animations are done
// Change the update method to the actual game (for capturing player input etc.)
function onStarfieldsAnimationDone() {
  if (PLAYER) {
    layerPlayers.add(PLAYER);
  }

  game.onBeforeUpdate = onBeforeUpdate;
}

var Starfields = (function Starfields() {
  function Starfields() {
    this.starfieldBackground;
    this.starfieldForeground;
    
    // Time to stay after reached maximum speed (in seconds)
    this.timeToStayOnMaxSpeed = -1,
    // How long have we been travelling for
    this.timeTraveled = 0;
    // Accceleration speed
    this.travelSpeedIncrement = 0.25;
    // Break speed
    this.travelSpeedDecrement = 0.9;
    // Maximum travel speed to reach
    this.maxTravelSpeed = 100;
    // Current travel speed
    this.currentTravelSpeed = 0;
    
    // Callback for when the sequence is done
    this.onAnimationDone;
  }
  
  Starfields.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.timeToStayOnMaxSpeed = options.timeToStayOnMaxSpeed || 3;
      this.travelSpeedIncrement = options.travelSpeedIncrement || 0.25;
      this.travelSpeedDecrement = options.travelSpeedDecrement || 0.9;
      
      this.onAnimationDone = options.onAnimationDone || function(){};
      
      this.create();
    },
    
    update: function update(dt) {
      var starfieldBackground = this.starfieldBackground,
          starfieldForeground = this.starfieldForeground,
          currentTravelSpeed = this.currentTravelSpeed;

      if (!(starfieldBackground && starfieldForeground)) {
        return;
      }
      
      if (this.timeTraveled < this.timeToStayOnMaxSpeed) {
        if (currentTravelSpeed < this.maxTravelSpeed) {
          currentTravelSpeed += this.travelSpeedIncrement;
          
          if (currentTravelSpeed > this.maxTravelSpeed) {
            currentTravelSpeed = this.maxTravelSpeed;
          }
          
          starfieldBackground.setSpeedFactor(currentTravelSpeed);
          starfieldForeground.setSpeedFactor(currentTravelSpeed);
        } else {
          if (currentTravelSpeed === this.maxTravelSpeed) {
            this.timeTraveled += dt;
          }
        }
      } else if (currentTravelSpeed > 0) {
        currentTravelSpeed -= this.travelSpeedDecrement;
        
        if (currentTravelSpeed < 0) {
          currentTravelSpeed = 0;
          this.onReachedDestination();
        }
        
        starfieldBackground.setSpeedFactor(currentTravelSpeed);
        starfieldForeground.setSpeedFactor(currentTravelSpeed);
      }
      
      this.currentTravelSpeed = currentTravelSpeed;
    },
    
    create: function create() {
      this.starfieldBackground = new Starfield({
        'id': 'starfieldBackground',
        'numberOfItems': 100,
        'speed': [5, 15],
        'speedFactor': 0,
        'size': [0.5, 1.1],
        'color': 'rgba(255, 255, 255, .4)'
      });
      this.starfieldForeground = new Starfield({
        'id': 'starfieldForeground',
        'numberOfItems': 30,
        'speed': [10, 20],
        'speedFactor': 0,
        'size': [0.8, 1.3],
        'color': 'rgba(255, 255, 255, .6)'
      });
      
      this.onReachedDestination();
    },
    
    onReachedDestination: function onReachedDestination() {
      this.onAnimationDone();
    },
    
    addToLayer: function addToLayer(starfield, layer) {
      layer.add(starfield);
      starfield.setSize();
    }
  };

  return new Starfields();
}());

// Actual game loop
function onBeforeUpdate(dt) {
  if (PLAYER) {
    handlePlayerInput(dt);
  }
  
  lastClientTick = Date.now();
}

function onAfterUpdate(dt) {
  Projectiles.testCollisions();
}

function handlePlayerInput(dt) {
  if (!PLAYER) {
    return;
  }
  
  if (chat.isFocused) {
    return;
  }

  var input = game.Input,
      speed = PLAYER.speed,
      rotationSpeed = PLAYER.rotationSpeed;

  // Is turbo key down
  if (input.isKeyDown(Config.KEY_BINDINGS.TURBO)) {
    speed *= 2;
  }

  // Movement
  if (input.isKeyDown(Config.KEY_BINDINGS.RIGHT)) {
    PLAYER.rotateBy(rotationSpeed * dt);
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.LEFT)) {
    PLAYER.rotateBy(-rotationSpeed * dt);
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.UP)) {
    PLAYER.applyForce(PLAYER.FORWARDS.scale(speed));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.DOWN)) {
    PLAYER.applyForce(PLAYER.BACKWARDS.scale(speed));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.STRAFE_LEFT)) {
    PLAYER.applyForce(PLAYER.LEFT.scale(speed / 2));
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.STRAFE_RIGHT)) {
    PLAYER.applyForce(PLAYER.RIGHT.scale(speed / 2));
  }
  
  /*
    Look at and move towards cursor
  
  // Rotate the player's ship to look at the cursor
  playerSprite.lookAt(input.position);
  
  // Movement
  if (input.isKeyDown(Config.KEY_BINDINGS.RIGHT)) {
    //playerSprite.applyForce(playerSprite.CLOCKWISE.scale(speed));
    playerSprite.rotateBy(50 * dt);
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.LEFT)) {
    //playerSprite.applyForce(playerSprite.CCLOCKWISE.scale(speed));
    playerSprite.rotateBy(-50 * dt);
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.UP)) {
    // Only move forwards if the player is far from the cursor
    var distance = playerSprite.position.distance(input.position);
    if (distance > 100) {
      playerSprite.applyForce(playerSprite.FORWARDS.scale(speed));
    }
  }
  if (input.isKeyDown(Config.KEY_BINDINGS.DOWN)) {
    playerSprite.applyForce(playerSprite.BACKWARDS.scale(speed));
  }
  */
  
  // Activate skills based on input (mouse or keyboard)
  var skill;
  for (var skillId in PLAYER.skills) {
    skill = PLAYER.skills[skillId];
    if (skill.isReady && input.isKeyDown(skill.key)) {
      Server.useSkill(skillId);
    }
  }
}

function onAfterDraw() {
  if (PLAYER) {
    Server.sendPlayerTickData();
  }
}

function serverTick(data) {
  var players = data.players,
      teams = data.teams,
      ownData = data.playerData;

  // Update the own player
  PLAYER.fromServer(ownData);
  
  // Update all other players in the game
  Players.tick(players);
  
  // Update all teams
  Teams.tick(teams);
  
  lastServerTick = Date.now();
}

function onServerConnect() {
  document.body.classList.remove('disconnected');
}

function onServerDisconnect() {
  document.body.classList.add('disconnected');
  
  PLAYER.destroy();
  PLAYER = null;
  Projectiles.clear();
  Players.clear();
}

var Projectiles = (function Projectiles() {
  function Projectiles() {
    this.projectiles = {};
  }
  
  Projectiles.prototype = {
    testCollisions: function testCollisions(dt) {
      var teams = Teams.get(),
          projectile;
      
      for (var id in this.projectiles) {
        projectile = this.projectiles[id];
        
        for (var teamId in teams) {
          if (!projectile.isDestroyed && 
              projectile.teamId !== teamId &&
              projectile.hits(teams[teamId])) {
            break;
          }
        }
      }
    },
    
    add: function add(data) {
      if (this.projectiles[data.id]) {
        return;
      }
      
      this.projectiles[data.id] = new window.Projectile(data);
      
      layerProjectiles.add(this.projectiles[data.id]);
    },
    
    remove: function remove(data) {
      if (!this.projectiles[data.id]) {
        return;
      }

      this.projectiles[data.id].destroy();
      
      delete this.projectiles[data.id];
    },
    
    clear: function clear() {
      for (var id in this.projectiles) {
        this.remove(this.projectiles[id]);
      }
    }
  };
  
  return new Projectiles();
}());

var Teams = (function Teams() {
  function Teams() {
    this.teams = {};
  }
  
  Teams.prototype = {
    init: function init(teams) {
      for (var i = 0, team; (team = teams[i++]);) {
        this.teams[team.id] = new Team(team);
        layerBackground.add(this.teams[team.id]);
      }
      
      console.log('Created teams', this.teams);
    },
    
    get: function get(id) {
      return id ? this.teams[id] : this.teams;
    },
    
    tick: function tick(teams) {
      for (var id in teams) {
        var team = this.teams[id];
        if (team) {
          team.fromServer(teams[id]);
        }
      }
    }
  };
  
  return new Teams();
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
          this.remove(id);
        }
      }
    },
    
    remove: function remove(playerId) {
      if (playerId.id) {
        playerId = playerId.id;
      }
      
      this.players[playerId].destroy();
      
      delete this.players[playerId];
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
        layerPlayers.add(player);
      }
      
      player.fromMetaData(meta);
      
      if (isOwnPlayer) {
        selectShipInUI();
      }
    },
    
    clear: function clear() {
      for (var id in this.players) {
        this.remove(this.players[id]);
      }
    }
  };
  
  return new Players();
}());

var Server = (function() {
  function Server() {
    this.socketIO = null;
    this.isConnected = false;
    
    this.intervalReconnect;
  }
  
  Server.prototype = {
    init: function init() {
      this.socketIO = window.io.connect();

      this.socketIO.on('connect', this.onConnect.bind(this));
      this.socketIO.on('disconnect', this.onDisconnect.bind(this));
      
      this.socketIO.on('tick', serverTick);
      this.socketIO.on('updatePlayers', Players.update.bind(Players));
      
      this.socketIO.on('addPlayer', this.onAddPlayer.bind(this));
      this.socketIO.on('ready', onPlayerReadyInServer);
      this.socketIO.on('updateMetaData', this.onUpdatePlayerMetaData.bind(this));
      
      this.socketIO.on('projectileAdd', Projectiles.add.bind(Projectiles));
      this.socketIO.on('projectileRemove', Projectiles.remove.bind(Projectiles));
      
      this.socketIO.on('joinGame', onPlayerJoinGame);
      
      this.socketIO.on('chatAddWindow', chat.addWindow.bind(chat));
      this.socketIO.on('chatNewMessage', chat.addMessage.bind(chat));
    },
    
    onConnect: function onConnect() {
      onServerConnect();
      this.isConnected = true;
      window.clearInterval(this.intervalReconnect);
    },
    
    onDisconnect: function onDisconnect() {
      onServerDisconnect();
      this.isConnected = false;
      this.intervalReconnect = window.setInterval(this.attemptReconnect.bind(this), 1000);
    },
    
    attemptReconnect: function attemptReconnect() {
      if (!this.socketIO.socket.connecting &&
          !this.socketIO.socket.reconnecting) {
        this.socketIO.socket.connect();
      }
    },

    sendPlayerMetaData: function sendPlayerMetaData(meta) {
      console.info('[Server.emit] Send player meta data', meta);
      this.socketIO.emit('updateMetaData', meta);
    },
    
    sendPlayerTickData: function sendPlayerTickData() {
      this.socketIO.emit('updateTickData', PLAYER.toTickData());
    },
    
    sendChatMessage: function sendChatMessage(message, windowId) {
      this.socketIO.emit('chatNewMessage', {
        'message': message,
        'windowId': windowId
      });
    },
    
    useSkill: function useSkill(id) {
      this.socketIO.emit('useSkill', id);
    },
    
    onUpdatePlayerMetaData: function nonUpdatePlayerMetaData(data) {
      Players.fromMetaData(data.id, data.meta);
    },

    newPlayer: function newPlayer(player) {
      console.info('[Server.emit] New player', player);
      this.socketIO.emit('newPlayer', player.toMetaData());
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