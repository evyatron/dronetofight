/**
 * Game module
 * @module server/Game
 */

var uuid = require('node-uuid');

var CONFIG = require('./Config');
var Chat = require('./Chat');
var Team = require('./Team');

/**
 * Creates a new Game
 * 
 * @constructor
 * @param {Object} options - Settings for initializing the game
 */
function Game(options) {
  this.id = '';
  this.players = {};
  this.projectiles = {};
  this.chat;
  
  this.teams = [];
  
  this.width = 1920;
  this.height = 1080;

  this.init(options);
}

Game.prototype = {
  init: function init(options) {
    this.id = 'game-' + uuid.v4();
    
    this.chat = new Chat({
      'windows': CONFIG.CHAT_WINDOWS,
      'players': this.players,
      'shouldSendJoinMessages': true,
      'shouldSendLeaveMessages': true
    });
    
    this.createTeams(CONFIG.TEAMS);
  },
  
  createTeams: function createTeams(teams) {
    for (var i = 0, teamData; (teamData = teams[i++]);) {
      var team = new Team(teamData);
      team.game = this;
      
      team.on(team.HEALTH_EMPTY, this.onTeamHealthEmpty.bind(this));
      team.on(team.RESPAWN, this.onTeamRespawn.bind(this));
      team.on(team.LOSE, this.onTeamLose.bind(this));

      this.teams.push(team);
    }
    
    console.log('create teams:', this.teams);
  },
  
  onTeamHealthEmpty: function onTeamHealthEmpty() {
    console.info('Team Health Empty', arguments);
  },
  
  onTeamRespawn: function onTeamRespawn() {
    console.info('Team Respawn', arguments);
  },
  
  onTeamLose: function onTeamLose() {
    console.info('Team LOST', arguments);
  },
  
  update: function update(dt) {
    var data = {
          'players': {},
          'teams': {}
        },
        id,
        projectile,
        i, team;
    
    // First update all players
    // Send the data in a second loop cause the last player might affect
    // the first player
    for (id in this.players) {
      this.players[id].update(dt);
    }
    
    // Prepare data to be sent to the players
    for (id in this.players) {
      data.players[id] = this.players[id].getTickData();
    }
    
    // Update and send all projectiles information
    for (id in this.projectiles) {
      projectile = this.projectiles[id];
      projectile.update(dt);
      
      for (i = 0; !projectile.isRemoved && (team = this.teams[i++]);) {
        if (projectile.meta.teamId !== team.id && projectile.hits(team)) {
          team.damage(projectile.power);
        }
      }
    }
    
    // Prepare data to be sent to the players
    for (i = 0; (team = this.teams[i++]);) {
      data.teams[team.id] = team.update(dt);
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
    
    var team = this.getNextTeam();
    if (team) {
      team.addPlayer(player);
    } else {
      console.warn('[Game|' + this.id + '] No team found for player!', player);
    }
    
    // Add the player to the chat window
    this.chat.addPlayer(player);
  },
  
  removePlayer: function removePlayer(player) {
    console.log('[Game|' + this.id + '] Remove player: ', player.meta);
    
    if (player.team) {
      player.team.removePlayer(player);
    }
    
    this.chat.removePlayer(player);
    
    delete this.players[player.id];
    
    console.log('[Game|' + this.id + '] Players remaining: ', this.teams);
  },
  
  getNextTeam: function getNextTeam() {
    var mostEmptyTeam = this.teams[0];
    
    for (var i = 1, team; (team = this.teams[i++]);) {
      if (team.getNumberOfPlayers() < mostEmptyTeam.getNumberOfPlayers()) {
        mostEmptyTeam = team;
      }
    }

    return mostEmptyTeam;
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

    return players;
  },
  
  getTeamsList: function getTeamsList() {
    var teams = {};
    
    for (var id in this.teams) {
      teams[id] = this.teams[id].getMetaData();
    }

    return teams;
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

module.exports = Game;