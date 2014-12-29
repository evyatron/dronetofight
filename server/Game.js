var uuid = require('node-uuid');

var CONFIG = require('./Config.js');
var Chat = require('./Chat.js');

// Main game object - in charge of holding all the data and performing all 
// Game loop actions
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
        'windows': CONFIG.CHAT_WINDOWS,
        'players': this.players
      });
      
      for (var i = 0; i < this.numberOfTeams; i++) {
        this.teams.push(0);
      }
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
      
      this.broadcast(CONFIG.EVENTS_TO_CLIENT.GAME.TICK, data, true);
    },
    
    addProjectile: function addProjectile(projectile) {
      if (this.projectiles[projectile.id]) {
        return;
      }
      
      this.projectiles[projectile.id] = projectile;
      projectile.game = this;
      
      this.broadcast(CONFIG.EVENTS_TO_CLIENT.PROJECTILE.ADD, projectile.meta);
    },
    
    removeProjectile: function removeProjectile(projectile) {
      if (!projectile || !this.projectiles[projectile.id]) {
        return;
      }
      
      console.log('[Projectile|' + projectile.id + '] Remove');
      
      delete this.projectiles[projectile.id];
      
      this.broadcast(CONFIG.EVENTS_TO_CLIENT.PROJECTILE.REMOVE, projectile.meta);
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
        
        player.emit(event, data);
      }
    }
  };
  
  return Game;
}());

module.exports = Game;