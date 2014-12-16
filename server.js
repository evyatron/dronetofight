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

var playersMetaData = {},
    playersTickData = {},
    
    // Currently connected sockets
    sockets = [];


// Main Game Loop
gameloop.setGameLoop(function(delta) {
  broadcast('tick', playersTickData);
}, 1000 / 30);



io.on('connection', function onConnection(socket) {
  sockets.push(socket);
  
  // Send players to new player
  socket.emit('updatePlayers', playersMetaData);
  

  socket.on('playerMetaData', function onPlayerMetaDataChange(data) {
    console.info('New player: ', data);
    socket.playerId = data.id;
    playersMetaData[data.id] = data;
    broadcast('updatePlayers', playersMetaData);
  });
  
  socket.on('playerTickData', function onPlayerTickDataChange(data) {
    playersTickData[data.id] = data;
  });
  
  
  socket.on('disconnect', function onPlayerDisconnect() {
    var player = playersMetaData[socket.playerId];

    sockets.splice(sockets.indexOf(socket), 1);

    delete playersMetaData[player.id];
    delete playersTickData[player.id];

    broadcast('removePlayer', player);
  });



  /*
  
  
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
    */
});

function broadcast(event, data) {
  for (var i = 0, socket; socket = sockets[i++];) {
    socket.emit(event, data);
  }
}


/*
function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}
*/

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Game server listening at", addr.address + ":" + addr.port);
});
