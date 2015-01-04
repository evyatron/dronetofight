//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');


var CONFIG = require('./server/Config');
var Player = require('./server/Player');
var GameManager = require('./server/GameManager');

var gameManager;

function onServerReady() {
  gameManager = new GameManager({
    
  });
}


// New connection - new player joined the server
function onNewSocketConnection(socket) {
  new Player(socket, {
    'onClientReady': onPlayerClientReady
  });
}

// The new player is ready on the client
function onPlayerClientReady(player) {
  var games = gameManager.getGamesMetaData();
  player.socket.emit(CONFIG.EVENTS_TO_CLIENT.GAMES, games);
  
  // auto join a game for now
  player.joinGame(gameManager.getFirstJoinableGame());
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
  
  onServerReady();
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

// Clamp a number between min/max range
Math.clamp = function Math_Clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
};