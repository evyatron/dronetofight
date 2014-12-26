//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var gameloop = require('node-gameloop');

var uuid = require('node-uuid');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));


var GAMES = {};

var EVENTS_FROM_CLIENT = {
  GAME: {
  },
  PLAYER: {
    READY: 'newPlayer',
    UPDATE_META_DATA: 'updateMetaData',
    UPDATE_TICK_DATA: 'updateTickData',
    DISCONNECT: 'disconnect'
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
  CHAT: {
    ADD_WINDOW: 'chatAddWindow',
    ADD_MESSAGE: 'chatNewMessage'
  }
};

var UI_DATA = {
  "colors": [
    {
      "id": 0,
      "name": "Fire",
      "color": "rgba(255, 170, 0, 1)"
    },
    {
      "id": 1,
      "name": "Envy",
      "color": "rgba(41, 185, 21, 1)"
    },
    {
      "id": 2,
      "name": "Skyline",
      "color": "rgba(14, 51, 199, 1)"
    },
    {
      "id": 3,
      "name": "Lavender",
      "color": "rgba(206, 211, 237, 1)"
    },
    {
      "id": 4,
      "name": "Candy",
      "color": "rgba(232, 170, 239, 1)"
    }
  ]
};

var CHAT_WINDOWS = {
      ALL: 'all',
      TEAM: 'team'
    },
    CHAT_WINDOWS_ORDER = [
      {
        'id': CHAT_WINDOWS.ALL,
        'name': 'Game'
      },
      {
        'id': CHAT_WINDOWS.TEAM,
        'name': 'Team'
      }
    ],
    CHAT_MESSAGE_TYPES = {
      SERVER: 'server'
    };

var Game = (function() {
  function Game(options) {
    this.id = '';
    this.players = {};
    this.chat;

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
      
      this.broadcast(EVENTS_TO_CLIENT.GAME.TICK, data);
    },
    
    addPlayer: function addPlayer(player) {
      // If player is already in the game - do nothing
      if (this.players[player.id]) {
        return;
      }

      console.log('[Game|' + this.id + ']: Add player: ', player.meta);
      
      // Add the player to the list
      this.players[player.id] = player;
      
      // Add the player to the chat window
      this.chat.addPlayer(player);
    },
    
    removePlayer: function removePlayer(player) {
      console.log('[Game|' + this.id + ']: Remove player: ', player.meta);
      this.chat.removePlayer(player);
      delete this.players[player.id];
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
      
      console.log('[Game|' + this.id + ']: players list: ', players);

      return players;
    },

    broadcast: function broadcast(event, data) {
      for (var id in this.players) {
        this.players[id].socket.emit(event, data);
      }
    }
  };
  
  return Game;
}());

var Skill = (function() {
  function Skill(options) {
    this.type = '';
    this.cooldown = 0;
    this.damage = 0;
    this.isReady = true;
    this.timeSinceFire = 0;
    
    this.onReady;
    
    this.init(options);
  }
  
  Skill.prototype = {
    init: function init(options) {
      this.id = options.id || ('skill-' + uuid.v4());
      this.type = options.type || 'Skill';
      this.cooldown = options.cooldown || 1;
      this.damage = options.damage || 1;
      
      this.onReady = options.onReady || function(){};
    },
    
    use: function use() {
      if (!this.isReady) {
        return false;
      }
      
      this.isReady = false;
      this.timeSinceFire = 0;
      
      return true;
    },
    
    update: function update(dt) {
      if (!this.isReady) {
        this.timeSinceFire += dt;
        
        if (this.timeSinceFire >= this.cooldown) {
          this.ready();
        }
      }
      
      return this.getTickData();
    },
    
    getCooldownPercentage: function getCooldownPercentage() {
      return ;
    },
    
    getTickData: function getTickData() {
      var cooldownPercentage = 1;
      
      if (!this.isReady) {
        cooldownPercentage = this.timeSinceFire / this.cooldown;
      }
      
      return {
        'cooldownPercentage': cooldownPercentage
      };
    },
    
    getMetaData: function getMetaData() {
      return {
        'type': this.type,
        'cooldown': this.cooldown,
        'damage': this.damage
      };
    },
    
    ready: function ready() {
      if (this.isReady) {
        return;
      }
      
      this.isReady = true;
      this.timeSinceFire = 0;
      this.onReady();
    }
  };
  
  return Skill;
}());

var Player = (function() {
  function Player(socket) {
    // Generated internal ID
    this.id = '';
    
    // Player movement speed
    this.speed = 60;
    
    // Skills
    this.skills = {};

    // The actual socket the player is using
    this.socket = socket;
    // Holds the tick data (position, rotation, etc)
    this.tick = {
      'skills': {}
    };
    // Holds the meta data (id, name, etc)
    this.meta = {};
    
    // A reference to the player's game
    this.game = null;
    
    this.shouldSendMeta = true;
    
    this.init();
  }
  
  Player.prototype = {
    init: function init() {
      this.id = 'player-' + uuid.v4();
      this.speed = 60;

      this.createSkills();
      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.READY,
                      this.onReady.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_META_DATA,
                      this.updateMetaData.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_TICK_DATA,
                      this.updateTickData.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.DISCONNECT,
                      this.disconnect.bind(this));
      
      // Fire ready event to the client
      this.socket.emit(EVENTS_TO_CLIENT.PLAYER.READY, {
        'id': this.id,
        'speed': this.speed,
        'skills': this.getSkillsMetaData(),
        'ui': UI_DATA
      });
      
      console.log('[Player|' + this.id + ']: New player created');
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
            'cooldown': 0.75,
            'damage': 10
          }),
          skillSecondary = new Skill({
            'cooldown': 2.5,
            'damage': 35
          });
      
      this.skills[skillPrimary.id] = skillPrimary;
      this.skills[skillSecondary.id] = skillSecondary;
      
      this.tick.skills[skillPrimary.id] = skillPrimary.getTickData();
      this.tick.skills[skillSecondary.id] = skillSecondary.getTickData();
    },
    
    update: function update(dt) {
      for (var id in this.skills) {
        this.tick.skills[id] = this.skills[id].update(dt);
      }
    },
    
    onReady: function onReady(metaData) {
      this.updateMetaData(metaData);
      this.joinGame(MAIN_GAME);
    },
    
    joinGame: function joinGame(game) {
      if (typeof game === 'string') {
        game = GAMES[game];
      }
      
      if (!game) {
        console.warn('[Player|' + this.id + ']: Trying to join invalid game');
        return;
      }
      
      console.log('[Player|' + this.id + ']: Join game: ', game.id);

      // Make sure player is not in any other game
      this.leaveGame();
      // Save a reference to the game
      this.game = game;
      // Tell the game the player joined
      game.addPlayer(this);
      // Tell the player they joined
      this.socket.emit(EVENTS_TO_CLIENT.PLAYER.JOIN_GAME, {
        'id': game.id,
        'players': game.getPlayersList()
      });
    },
    
    leaveGame: function leaveGame() {
      if (this.game) {
        console.log('[Player|' + this.id + ']: Leave game: ', this.game.id);
        
        this.game.removePlayer(this);
        this.game = null;
        this.socket.emit(EVENTS_TO_CLIENT.PLAYER.LEAVE_GAME);
      }
    },
    
    // Player disconnected - remove from game
    disconnect: function disconnect() {
      console.log('[Player|' + this.id + ']: Disconnected');

      if (this.game) {
        this.game.removePlayer(this);
      }
    },
    
    updateMetaData: function updateMetaData(data) {
      console.log('[Player|' + this.id + ']: Update meta data:', data);

      for (var k in data) {
        this.meta[k] = data[k];
      }
      
      this.shouldSendMeta = true;
      
      /*
      if (this.game) {
        this.game.broadcast(EVENTS_TO_CLIENT.PLAYER.UPDATE_META_DATA, {
          'id': this.id,
          'meta': this.meta
        });
      }
      */
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

var Chat = (function() {
  function Chat(options) {
    this.game;
    this.windows = [];
    this.players = {};
    
    this.server = {
      'name': 'Server'
    };
    
    this.init(options);
  }
  
  Chat.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.game = options.game;
      this.windows = options.windows || [];
    },
    
    addPlayer: function addPlayer(player) {
      this.players[player.id] = player;
      
      this.sendWindowsToPlayer(player);
      
      this.game.broadcast(EVENTS_TO_CLIENT.CHAT.ADD_MESSAGE, {
        'windowId': CHAT_WINDOWS.ALL,
        'type': CHAT_MESSAGE_TYPES.SERVER,
        'player': this.server,
        'message': '<b>' +
                    player.meta.name.replace(/</g, '&lt;') +
                   '</b> Joined the game'
      });
    },
    
    removePlayer: function removePlayer(player) {
      delete this.players[player.id];
      
      this.game.broadcast(EVENTS_TO_CLIENT.CHAT.ADD_MESSAGE, {
        'windowId': CHAT_WINDOWS.ALL,
        'type': CHAT_MESSAGE_TYPES.SERVER,
        'player': this.server,
        'message': '<b>' +
                    player.meta.name.replace(/</g, '&lt;') +
                   '</b> Left the game'
      });
    },
    
    sendWindowsToPlayer: function sendWindowsToPlayer(player) {
      for (var i = 0, win; (win = this.windows[i++]);) {
        player.socket.emit(EVENTS_TO_CLIENT.CHAT.ADD_WINDOW, win);
      }
    }
  };
  
  return Chat;
}());


// Create a demo single game for now
var MAIN_GAME = new Game();

// Main Game Loop
gameloop.setGameLoop(function(delta) {
  for (var id in GAMES) {
    GAMES[id].update(delta);
  }
}, 1000 / 30);


// New connection - new player
function onNewSocketConnection(socket) {
  new Player(socket);
}

// Listen to new connections
io.set('log level', 1);
io.on('connection', onNewSocketConnection);


// Start the actual server
var serverPort = process.env.PORT || 3000,
    serverIP = process.env.IP || '0.0.0.0';

server.listen(serverPort, serverIP, function onServerStarted(){
  var addr = server.address();
  console.log('Game server listening at', addr.address + ':' + addr.port);
});
