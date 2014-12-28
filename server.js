//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

// For the actual game loop
var gameloop = require('node-gameloop');

// For generating IDs for ships, games, parts, etc.
var uuid = require('node-uuid');


var GAMES = {};

var EVENTS_FROM_CLIENT = {
  GAME: {
  },
  PLAYER: {
    READY: 'newPlayer',
    UPDATE_META_DATA: 'updateMetaData',
    UPDATE_TICK_DATA: 'updateTickData',
    USE_SKILL: 'useSkill',
    DISCONNECT: 'disconnect'
  },
  CHAT: {
    NEW_MESSAGE: 'chatNewMessage'
  }
};

var EVENTS_TO_CLIENT = {
  GAME: {
    UPDATE_PLAYERS_LIST: 'updatePlayers',
    PLAYER_LEAVE: 'removePlayer',
    TICK: 'tick'
  },
  PLAYER: {
    READY: 'ready',
    JOIN_GAME: 'joinGame',
    LEAVE_GAME: 'leaveGame',
    UPDATE_META_DATA: 'updateMetaData'
  },
  PROJECTILE: {
    ADD: 'projectileAdd',
    REMOVE: 'projectileRemove'
  },
  CHAT: {
    ADD_WINDOW: 'chatAddWindow',
    NEW_MESSAGE: 'chatNewMessage'
  }
};

var UI_DATA = {
  "ships": [
    {
      "id": 1,
      "name": "Ship 1"
    },
    {
      "id": 2,
      "name": "Ship 2"
    },
    {
      "id": 3,
      "name": "Ship 3"
    },
    {
      "id": 4,
      "name": "Ship 4"
    },
    {
      "id": 5,
      "name": "Ship 5"
    },
    {
      "id": 6,
      "name": "Ship 6"
    },
    {
      "id": 7,
      "name": "Ship 7"
    },
    {
      "id": 8,
      "name": "Ship 8"
    },
    {
      "id": 9,
      "name": "Ship 9"
    },
    {
      "id": 10,
      "name": "Ship 10"
    },
  ]
};

var CHAT_WINDOWS = {
      ALL: 'all',
      TEAM: 'team'
    };
var CHAT_WINDOWS_ORDER = [
      {
        'id': CHAT_WINDOWS.ALL,
        'name': 'Game'
      },
      {
        'id': CHAT_WINDOWS.TEAM,
        'name': 'Team'
      }
    ];
var CHAT_MESSAGE_TYPES = {
      SERVER: 'server'
    };

var Projectile = (function Projectile() {
  function Projectile(options) {
    this.id = '';
    this.speed = 0;
    this.size = 0;
    this.maxDistance = 0;
    this.color = '';
    
    this.angle = 0;
    
    this.meta = {};
    this.sentMetaData = false;
    
    this.position = new Vector();
    this.velocity = new Vector();
    
    this.init(options);
  }
  
  Projectile.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.id = options.id || ('projectile-' + uuid.v4());
      
      this.speed = options.data.speed;
      this.size = options.data.size;
      this.maxDistance = options.data.maxDistance;
      this.color = options.data.color;
      
      this.angle = options.angle;
      
      this.startPosition = new Vector(options.x, options.y);
      this.position = new Vector(this.startPosition);
      this.velocity = new Vector(this.speed, this.speed).rotate(this.angle - 45);
      
      if (options.velocity) {
        this.velocity.add(new Vector(options.velocity));
      }
      
      this.meta = {
        'id': this.id,
        'width': this.size,
        'height': this.size,
        'x': this.position.x,
        'y': this.position.y,
        'angle': this.angle,
        'drag': 1,
        'velocity': this.velocity.toTickData(),
        'color': this.color,
        'maxDistance': this.maxDistance
      };
      
      console.log('[Projectile|' + this.id + '] Create', this.meta);
    },
    
    update: function update(dt) {
      this.position.add(this.velocity.scale(dt));

      if (this.position.distance(this.startPosition) >= this.maxDistance) {
        if (this.game) {
          this.game.removeProjectile(this);
        }
      }
    }
  };
  
  return Projectile;
}());

var Game = (function Game() {
  function Game(options) {
    this.id = '';
    this.players = {};
    this.projectiles = {};
    this.chat;
    
    this.numberOfTeams = 2;
    this.teams = [];

    this.init(options);
  }
  
  Game.prototype = {
    init: function init(options) {
      this.id = 'game-' + uuid.v4();
      this.chat = new Chat({
        'game': this,
        'windows': CHAT_WINDOWS_ORDER,
        'players': this.players
      });
      
      for (var i = 0; i < this.numberOfTeams; i++) {
        this.teams.push(0);
      }
      
      GAMES[this.id] = this;
    },
    
    update: function update(dt) {
      var data = {
            'players': {}
          },
          id;
      
      // First update all players
      // Send the data in a second loop cause the last player might affect
      // the first player
      for (id in this.players) {
        this.players[id].update(dt);
      }
      
      // Prepate data to be sent to the players
      for (id in this.players) {
        data.players[id] = this.players[id].getTickData();
      }
      
      // Update and send all projectiles information
      for (id in this.projectiles) {
        this.projectiles[id].update(dt);
      }
      
      this.broadcast(EVENTS_TO_CLIENT.GAME.TICK, data, true);
    },
    
    addProjectile: function addProjectile(projectile) {
      if (this.projectiles[projectile.id]) {
        return;
      }
      
      this.projectiles[projectile.id] = projectile;
      projectile.game = this;
      
      this.broadcast(EVENTS_TO_CLIENT.PROJECTILE.ADD, projectile.meta);
    },
    
    removeProjectile: function removeProjectile(projectile) {
      if (!this.projectiles[projectile.id]) {
        return;
      }
      
      delete this.projectiles[projectile.id];
      
      this.broadcast(EVENTS_TO_CLIENT.PROJECTILE.REMOVE, projectile.meta);
    },
    
    addPlayer: function addPlayer(player) {
      // If player is already in the game - do nothing
      if (this.players[player.id]) {
        return;
      }

      console.log('[Game|' + this.id + '] Add player: ', player.meta);
      
      // Add the player to the list
      this.players[player.id] = player;
      
      var playerTeam = this.getNextTeam();
      player.updateMetaData({
        'team': playerTeam
      });
      this.teams[playerTeam]++;
      
      // Add the player to the chat window
      this.chat.addPlayer(player);
    },
    
    removePlayer: function removePlayer(player) {
      console.log('[Game|' + this.id + '] Remove player: ', player.meta);
      
      var teamId = player.meta.team;
      this.teams[teamId]--;
      
      this.chat.removePlayer(player);
      
      delete this.players[player.id];
      
      console.log('[Game|' + this.id + '] Players remaining: ', this.teams);
    },
    
    getNextTeam: function getNextTeam() {
      var iTeam = -1,
          minTeamPlayers = Infinity;
      
      for (var i = 0; i < this.teams.length; i++) {
        if (this.teams[i] < minTeamPlayers) {
          minTeamPlayers = this.teams[i];
          iTeam = i;
        }
      }
      
      return iTeam;
    },
    
    getPlayersList: function getPlayersList() {
      var players = {},
          player;

      for (var id in this.players) {
        player = this.players[id];

        players[id] = {
          'meta': player.meta,
          'tick': player.tick
        };
      }
      
      console.log('[Game|' + this.id + '] Players list: ', players);

      return players;
    },

    broadcast: function broadcast(event, data, isTick) {
      var player;
      
      for (var id in this.players) {
        player = this.players[id];
        
        if (isTick) {
          data.playerData = player.ownTick;
        }
        
        player.socket.emit(event, data);
      }
    }
  };
  
  return Game;
}());

var Skill = (function Skill() {
  function Skill(options) {
    this.id = '';
    this.name = '';
    this.type = '';
    this.cooldown = 0;
    this.damage = 0;
    this.isReady = false;
    this.timeSinceFire = 0;
    this.key = '';
    
    this.tick = {
      'isReady': this.isReady
    };

    this.init(options);
  }
  
  Skill.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.id = options.id || ('skill-' + uuid.v4());
      this.type = options.type || 'skill';
      this.name = options.name || '';
      this.cooldown = options.cooldown || 1;
      this.damage = options.damage || 1;
      this.key = options.key;
      
      this.projectileData = options.projectileData;
    },
    
    use: function use() {
      if (!this.isReady) {
        return false;
      }
      
      console.log('[Skill|' + this.id + '] Use');
      this.timeSinceFire = 0;
      this.isReady = false;
      this.tick.isReady = false;
      
      return true;
    },
    
    update: function update(dt) {
      if (!this.isReady) {
        this.timeSinceFire += dt;
        
        if (this.timeSinceFire >= this.cooldown) {
          this.ready();
        }
      }
      
      return this.tick;
    },

    getMetaData: function getMetaData() {
      return {
        'id': this.id,
        'name': this.name,
        'type': this.type,
        'cooldown': this.cooldown,
        'damage': this.damage,
        'key': this.key
      };
    },
    
    ready: function ready() {
      if (this.isReady) {
        return;
      }
      
      this.isReady = true;
      this.tick.isReady = true;
      this.timeSinceFire = 0;
    }
  };
  
  return Skill;
}());

var Player = (function Player() {
  var READ_ONLY_META = {
    'id': true,
    'team': true
  };
  
  function Player(socket) {
    // Generated internal ID
    this.id = '';
    
    // Used for chat - HTML safe
    this.sanitizedName = '';
    
    // Player movement speed
    this.speed = 50;
    
    // Maximum player movement speed
    this.maxSpeed = 300;
    
    // Skills
    this.skills = {};

    // The actual socket the player is using
    this.socket = socket;
    
    // Holds the tick data (position, rotation, etc)
    this.tick = {};
    
    // Holds the PRIVATE tick data that only the player should see
    // Game takes this DIRECTLY to save on another function call
    this.ownTick = {
      'skills': {}
    };
    
    // Holds the meta data (id, name, etc)
    this.meta = {};

    // A reference to the player's game
    this.game = null;
    
    // Whether to send the meta data in the tick
    // Resets to true when something is updated
    this.shouldSendMeta = true;
    
    this.init();
  }
  
  Player.prototype = {
    init: function init() {
      this.id = 'player-' + uuid.v4();

      this.meta.id = this.id;

      this.createSkills();
      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.READY,
                      this.onClientReady.bind(this));
                      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_META_DATA,
                      this.clientUpdateMetaData.bind(this));
                      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_TICK_DATA,
                      this.updateTickData.bind(this));
                      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.USE_SKILL,
                      this.useSkill.bind(this));
                      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.DISCONNECT,
                      this.disconnect.bind(this));
      
      // Fire ready event to the client
      this.socket.emit(EVENTS_TO_CLIENT.PLAYER.READY, {
        'id': this.id,
        'speed': this.speed,
        'maxSpeed': this.maxSpeed,
        'skills': this.getSkillsMetaData(),
        'ui': UI_DATA
      });
      
      console.log('[Player|' + this.id + '] Created');
    },
    
    getTickData: function getTickData() {
      var data = {
        'meta': null,
        'tick': this.tick
      };
      
      if (this.shouldSendMeta) {
        data.meta = this.meta;
        this.shouldSendMeta = false;
      }
      
      return data;
    },
    
    createSkills: function createSkills() {
      var skillPrimary = new Skill({
            'cooldown': 0.7,
            'damage': 10,
            'key': -1,
            'name': 'LMB',
            'projectileData': {
              'speed': 450,
              'size': 6,
              'maxDistance': 800,
              'color': 'white'
            }
          }),
          skillSecondary = new Skill({
            'cooldown': 2,
            'damage': 35,
            'key': -2,
            'name': 'RMB',
            'projectileData': {
              'speed': 350,
              'size': 8,
              'maxDistance': 600,
              'color': 'red'
            }
          });
      
      this.skills[skillPrimary.id] = skillPrimary;
      this.skills[skillSecondary.id] = skillSecondary;
      
      //this.tick.skills[skillPrimary.id] = skillPrimary.getTickData();
      //this.tick.skills[skillSecondary.id] = skillSecondary.getTickData();
    },
    
    useSkill: function useSkill(skillId) {
      var skill = this.skills[skillId];
      if (!skill) {
        console.warn('[Player|' + skillId + '] Trying to use non existant skill?');
        return;
      }
      
      var wasUsed = skill.use();
      
      if (wasUsed && this.game) {
        this.game.addProjectile(new Projectile({
          'data': skill.projectileData,
          'x': this.tick.x,
          'y': this.tick.y,
          'angle': this.tick.angle,
          'velocity': this.tick.velocity
        }));
      }
    },
    
    update: function update(dt) {
      var skills = this.skills;
      for (var skillId in skills) {
        this.ownTick.skills[skillId] = skills[skillId].update(dt);
      }
    },
    
    onClientReady: function onClientReady(metaData) {
      console.log('[Player|' + this.id + '] Ready on client', metaData);
      this.updateMetaData(metaData);
      this.joinGame(MAIN_GAME);
    },
    
    joinGame: function joinGame(game) {
      if (typeof game === 'string') {
        game = GAMES[game];
      }
      
      if (!game) {
        console.warn('[Player|' + this.id + '] Trying to join invalid game');
        return;
      }
      
      console.log('[Player|' + this.id + '] Join game: ', game.id);

      // Make sure player is not in any other game
      this.leaveGame();
      // Save a reference to the game
      this.game = game;
      // Tell the game the player joined
      game.addPlayer(this);
      // Tell the player they joined
      this.socket.emit(EVENTS_TO_CLIENT.PLAYER.JOIN_GAME, {
        'id': game.id,
        'team': this.meta.team,
        'players': game.getPlayersList()
      });
    },
    
    leaveGame: function leaveGame() {
      if (this.game) {
        console.log('[Player|' + this.id + '] Leave game: ', this.game.id);
        
        this.game.removePlayer(this);
        this.game = null;
        this.socket.emit(EVENTS_TO_CLIENT.PLAYER.LEAVE_GAME);
      }
    },
    
    // Player disconnected - remove from game
    disconnect: function disconnect() {
      console.log('[Player|' + this.id + '] Disconnected');

      if (this.game) {
        this.game.removePlayer(this);
      }
    },
    
    updateMetaData: function updateMetaData(data) {
      console.log('[Player|' + this.id + '] Update meta data:', data);

      for (var k in data) {
        this.meta[k] = data[k];
      }
      
      // Used for chat
      this.sanitizedName = this.meta.name.replace(/</g, '&lt');
      
      this.shouldSendMeta = true;
    },
    
    // When the client sends meta to update
    // First clean up all the ready only properties (like ID, Team, etc.)
    clientUpdateMetaData: function clientUpdateMetaData(data) {
      for (var k in READ_ONLY_META) {
        delete data[k];
      }
      
      this.updateMetaData(data);
    },
    
    updateTickData: function updateTickData(data) {
      for (var k in data) {
        this.tick[k] = data[k];
      }
    },
    
    getSkillsMetaData: function getSkillsMetaData() {
      var data = {};
      for (var id in this.skills) {
        data[id] = this.skills[id].getMetaData();
      }
      return data;
    }
  };
  
  return Player;
}());

var Chat = (function Chat() {
  var TEMPLATE_PLAYER_JOIN = '<b>{{sanitizedName}}</b> Joined the game';
  var TEMPLATE_PLAYER_LEAVE = '<b>{{sanitizedName}}</b> Left the game';
  
  function Chat(options) {
    this.game;
    this.windows = [];
    this.players = {};
    
    this.server = {
      'name': 'Server'
    };
    
    this.eventName = '';
    
    this.init(options);
  }
  
  Chat.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.game = options.game;
      this.windows = options.windows || [];
      this.eventName = EVENTS_TO_CLIENT.CHAT.NEW_MESSAGE;
    },
    
    addPlayer: function addPlayer(player) {
      console.log('[Chat] Add player to chat');
      
      this.players[player.id] = player;
      
      this.sendWindowsToPlayer(player);

      this.sendMessage({
        'message': TEMPLATE_PLAYER_JOIN.format(player)
      });
    },
    
    removePlayer: function removePlayer(player) {
      console.log('[Chat] Remove player from chat');
      
      delete this.players[player.id];

      this.sendMessage({
        'message': TEMPLATE_PLAYER_LEAVE.format(player)
      });
    },
    
    sendMessage: function sendMessage(data) {
      !data.windowId && (data.windowId = CHAT_WINDOWS.ALL);
      !data.player && (data.player = this.server);
      !data.type && (data.type = CHAT_MESSAGE_TYPES.SERVER);
      
      this.game.broadcast(this.eventName, data);
    },
    
    sendWindowsToPlayer: function sendWindowsToPlayer(player) {
      for (var i = 0, win; (win = this.windows[i++]);) {
        player.socket.emit(EVENTS_TO_CLIENT.CHAT.ADD_WINDOW, win);
      }
    }
  };
  
  return Chat;
}());

var Vector = (function Vector() {
  var MIN_VALUE = 0.01;

  function Vector(x, y) {
    this.y = (x && x.hasOwnProperty('y'))? x.y : (y || 0);
    this.x = (x && x.hasOwnProperty('x'))? x.x : (x || 0);
    if (Math.abs(this.x) < MIN_VALUE) { this.x = 0; }
    if (Math.abs(this.y) < MIN_VALUE) { this.y = 0; }
  }

  Vector.prototype = {
    add: function add(vector) {
      this.x += vector.x;
      this.y += vector.y;
      if (Math.abs(this.x) < MIN_VALUE) { this.x = 0; }
      if (Math.abs(this.y) < MIN_VALUE) { this.y = 0; }
      return this;
    },
    
    scale: function scale(by) {
      return new Vector(this.x * by, this.y * by);
    },

    rotate: function rotate(angle) {
      angle *= (Math.PI / 180);
      
      var cos = Math.cos(angle),
          sin = Math.sin(angle),
          x = this.x,
          y = this.y;

      this.x = (x * cos) - (y * sin);
      this.y = (x * sin) + (y * cos);

      return this;
    },

    angle: function angle(vector) {
      return Math.atan2(vector.y - this.y, vector.x - this.x) * 180 / Math.PI;
    },
    
    distance: function distance(vector) {
      var distX = vector.x - this.x,
          distY = vector.y - this.y;

      return Math.sqrt(distX * distX + distY * distY);
    },
    
    clamp: function clamp(min, max) {
      this.x = Math.clamp(this.x, min, max);
      this.y = Math.clamp(this.y, min, max);
    },
    
    reset: function reset() {
      this.x = 0;
      this.y = 0;
    },
    
    getTickData: function getTickData() {
      return {
        'x': this.x,
        'y': this.y
      };
    },
    
    toTickData: function toTickData() {
      return {
        'x': this.x,
        'y': this.y
      };
    }
  };

  return Vector;
}());

// Create a demo single game for now
var MAIN_GAME = new Game();

// Main Game Loop
function gameLoop(delta) {
  for (var id in GAMES) {
    GAMES[id].update(delta);
  }
}

// Start the game loop
gameloop.setGameLoop(gameLoop, 1000 / 30);


// New connection - new player
function onNewSocketConnection(socket) {
  new Player(socket);
}

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

// Make the "client" folder the public one
router.use(express.static(path.resolve(__dirname, 'client')));

// Only log higher than debug
io.set('log level', 1);

// Listen to new connections
io.on('connection', onNewSocketConnection);


// Start the actual server
var serverPort = process.env.PORT || 3000;
var serverIP = process.env.IP || '0.0.0.0';

server.listen(serverPort, serverIP, function onServerStarted(){
  var addr = server.address();
  console.log('Game server listening at', addr.address + ':' + addr.port);
});


// A simple template formatting method
// Replaces {{propertyName}} with properties from the 'args' object
String.prototype.format = function String_format(args) {
  !args && (args = {});

  return this.replace(/(\{\{([^\}]+)\}\})/g, function onMatch() {
    var key = arguments[2],
        shouldFormat = key.indexOf('(f)') === 0,
        properties = key.replace('(f)', '').split('.'),
        value = args;

    // support nesting - "I AM {{ship.info.name}}"
    for (var i = 0, property; (property = properties[i++]);) {
      value = value[property];
    }

    if (value === undefined || value === null) {
      value = arguments[0];
    }

    if (shouldFormat) {
      value = window.utils.numberWithCommas(value);
    }

    return value;
  });
};