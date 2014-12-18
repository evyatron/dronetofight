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


// Main Game Loop
gameloop.setGameLoop(function(delta) {
  for (var id in GAMES) {
    GAMES[id].tick(delta);
  }
}, 1000 / 30);


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
    PLAYER_JOIN: 'addPlayer',
    TICK: 'tick'
  },
  PLAYER: {
    READY: 'ready',
    JOIN_GAME: 'joinGame',
    LEAVE_GAME: 'leaveGame'
  }
};


var Game = (function() {
  function Game(options) {
    this.id = '';
    this.players = {};

    this.init(options);
  }
  
  Game.prototype = {
    init: function init(options) {
      this.id = 'game-' + uuid.v4();
      
      GAMES[this.id] = this;
    },
    
    tick: function tick(dt) {
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
        data.players[id] = this.players[id].tick;
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

      // Tell everyone (including the new player) there's a new player
      this.broadcast(EVENTS_TO_CLIENT.GAME.PLAYER_JOIN, player.meta);
      // Send everyone (including the new player) the players list
      this.broadcastPlayersList();
    },
    
    removePlayer: function removePlayer(player) {
      if (this.players[player.id]) {
        console.log('[Game|' + this.id + ']: Remove player: ', player.meta);

        this.broadcast(EVENTS_TO_CLIENT.GAME.PLAYER_LEAVE, player.id);
        delete this.players[player.id];
      }
    },
    
    broadcastPlayersList: function broadcastPlayersList() {
      var players = {};
      
      for (var id in this.players) {
        players[id] = this.players[id].meta;
      }
      
      console.log('[Game|' + this.id + ']: Broadcast players: ', players);

      this.broadcast(EVENTS_TO_CLIENT.GAME.UPDATE_PLAYERS_LIST, players);
    },
    
    broadcast: function broadcast(event, data) {
      for (var id in this.players) {
        this.players[id].socket.emit(event, data);
      }
    }
  };
  
  return Game;
}());

var Player = (function() {
  function Player(socket) {
    // Generated internal ID
    this.id = '';
    
    // Player movement speed
    this.speed = 60;

    // The actual socket the player is using
    this.socket = socket;
    // Holds the tick data (position, rotation, etc)
    this.tick = {};
    // Holds the meta data (id, name, etc)
    this.meta = {};
    
    // A reference to the player's game
    this.game = null;
    
    this.init();
  }
  
  Player.prototype = {
    init: function init() {
      this.id = 'player-' + uuid.v4();
      this.speed = 60;
      
      console.log('[Player|' + this.id + ']: New player created');
      
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.READY,
                      this.onReady.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_META_DATA,
                      this.updateMetaData.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.UPDATE_TICK_DATA,
                      this.updateTickData.bind(this));
      this.socket.on(EVENTS_FROM_CLIENT.PLAYER.DISCONNECT,
                      this.disconnect.bind(this));
      
      this.socket.emit(EVENTS_TO_CLIENT.PLAYER.READY, {
        'id': this.id,
        'speed': this.speed
      });
    },
    
    update: function update(dt) {
      // actual update (tick) logic
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
        'id': game.id
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
    },
    
    updateTickData: function updateTickData(data) {
      for (var k in data) {
        this.tick[k] = data[k];
      }
    }
  };
  
  return Player;
}());

// Create a demo single game for now
var MAIN_GAME = new Game();

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
