var SPRITE_TYPES = {
  SHIP: 'ship'
};


var game,
    layerBackground,
    layerPlayers,
    playerShip,
    PLAYERS = {};

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
  
  
  
  playerShip = new window.Ship({
    'speed': 60
  });
  playerShip.moveTo(game.width / 2, game.height / 2);
  
  Server.sendPlayerMetaData(playerShip);
  
  layerPlayers.addSprite(playerShip.sprite);
}

var velocity = new Vector(0, 0),
    acceleration = 0.05,
    turbo = 2;

function onBeforeUpdate() {
  var input = game.Input;

  playerShip.sprite.lookAt(input.position);

  /*
  if (input.isKeyDown(input.KEYS.D)) {
    velocity.y += acceleration;
  } else if (input.isKeyDown(input.KEYS.A)) {
    velocity.y -= acceleration;
  } else {
    velocity.y = 0;
  }
  if (input.isKeyDown(input.KEYS.W)) {
    velocity.x += acceleration;
  } else if (input.isKeyDown(input.KEYS.S)) {
    velocity.x -= acceleration;
  } else {
    velocity.x = 0;
  }
  */

  var keyRight = input.isKeyDown(input.KEYS.D),
      keyLeft = input.isKeyDown(input.KEYS.A),
      keyUp = input.isKeyDown(input.KEYS.W),
      keyDown = input.isKeyDown(input.KEYS.S),
      isTurbo = input.isKeyDown(input.KEYS.SPACE),
      ruboModifier = isTurbo? turbo : 1;

  if (keyRight) {
    velocity.x += acceleration * ruboModifier;
  }
  if (keyLeft) {
    velocity.x -= acceleration * ruboModifier;
  }
  if (!keyRight && !keyLeft || keyRight && keyLeft) {
    velocity.x = 0;
  }

  if (keyUp) {
    velocity.y -= acceleration * ruboModifier;
  }
  if (keyDown) {
    velocity.y += acceleration * ruboModifier;
  }
  if (!keyUp && !keyDown || keyUp && keyDown) {
    velocity.y = 0;
  }

  if (velocity.x || velocity.y) {
    var speed = new Vector(velocity);

    speed.x = Math.max(Math.min(speed.x, ruboModifier), -ruboModifier);
    speed.y = Math.max(Math.min(speed.y, ruboModifier), -ruboModifier);

    playerShip.sprite.applyForce(new Vector(speed).scale(playerShip.speed));
  }
}

function onAfterDraw() {
  Server.sendPlayerTickData(playerShip);
}



var Server = (function() {
  function Server() {
    this.socket = null;
    
    this.init();
  }
  
  Server.prototype = {
    init: function init() {
      this.socket = window.io.connect();
      
      this.socket.on('tick', this.onServerTick.bind(this));
      this.socket.on('updatePlayers', this.onUpdatePlayers.bind(this));
      this.socket.on('removePlayer', this.onRemovePlayer.bind(this));
    },
    
    sendPlayerMetaData: function sendPlayerMetaData(player) {
      this.socket.emit('playerMetaData', player.toMetaData());
    },
    
    sendPlayerTickData: function sendPlayerTickData(player) {
      this.socket.emit('playerTickData', player.toTickData());
    },
    
    onRemovePlayer: function onRemovePlayer(playerData) {
      console.info('Player removed:', playerData);
      
      var playerId = playerData.id,
          player = PLAYERS[playerId];
      
      if (player) {
        layerPlayers.removeSprite(player.sprite);
        delete PLAYERS[playerId];
      }
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
          layerPlayers.addSprite(PLAYERS[id].sprite);
        }
      }
      
      console.log('done creating players: ', PLAYERS)
    },
    
    onServerTick: function onServerTick(players) {
      var player;
      
      for (var id in players) {
        if (id === playerShip.id) {
          continue;
        }
        
        player = players[id];
        
        if (PLAYERS[id]) {
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