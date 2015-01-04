/**
 * Game module
 * @module server/Game
 */

var events = require('events');
var uuid = require('node-uuid');
var util = require('util');

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
  
  this.isFull = false;
  this.maxPlayersPerTeam = 5;
  
  this.startTime = -1;
  this.duration = 0;
  
  this.isStarted = true;
  
  this.isEnded = false;
  this.teamWon = null;
  this.endTime = 0;

  this.init(options);
}

util.inherits(Game, events.EventEmitter);

Game.prototype.OVER = 'GameOver';


Game.prototype.init = function init(options) {
  this.id = 'game-' + uuid.v4();
  
  this.chat = new Chat({
    'windows': CONFIG.CHAT_WINDOWS,
    'players': this.players,
    'shouldSendJoinMessages': true,
    'shouldSendLeaveMessages': true
  });
  
  this.createTeams(CONFIG.TEAMS);
  
  console.log('[Game|' + this.id + '] Create');
};

Game.prototype.createTeams = function createTeams(teams) {
  for (var i = 0, teamData; (teamData = teams[i++]);) {
    var team = new Team(teamData);
    team.game = this;
    
    team.on(team.HEALTH_EMPTY, this.onTeamHealthEmpty.bind(this));
    team.on(team.RESPAWN, this.onTeamRespawn.bind(this));
    team.on(team.LOSE, this.onTeamLose.bind(this));

    this.teams.push(team);
  }
};

Game.prototype.onTeamHealthEmpty = function onTeamHealthEmpty() {
  console.info('Team Health Empty', arguments);
};

Game.prototype.onTeamRespawn = function onTeamRespawn() {
  console.info('Team Respawn', arguments);
};

Game.prototype.onTeamLose = function onTeamLose(teamWon) {
  this.isEnded = true;
  this.teamWon = teamWon;
  this.endTime = Date.now();
  this.emit(this.GAME_OVER, this.getGameResult());
  
  console.log('[Game|' + this.id + '] Over', this.getGameResult());
};

Game.prototype.update = function update(dt) {
  var data = {
        'players': {},
        'teams': {}
      },
      id,
      projectile,
      i, team;
  
  
  if (this.startTime === -1) {
    this.startTime = Date.now();
  }
  
  this.duration += dt;
  
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
};

Game.prototype.addProjectile = function addProjectile(projectile) {
  if (this.projectiles[projectile.id]) {
    return;
  }
  
  this.projectiles[projectile.id] = projectile;
  projectile.game = this;
  
  this.broadcast(CONFIG.EVENTS_TO_CLIENT.PROJECTILE.ADD, projectile.meta);
};

Game.prototype.removeProjectile = function removeProjectile(projectile) {
  if (!projectile || !this.projectiles[projectile.id]) {
    return;
  }
  
  console.log('[Projectile|' + projectile.id + '] Remove');
  
  delete this.projectiles[projectile.id];
  
  this.broadcast(CONFIG.EVENTS_TO_CLIENT.PROJECTILE.REMOVE, projectile.meta);
};

Game.prototype.addPlayer = function addPlayer(player) {
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
};

Game.prototype.removePlayer = function removePlayer(player) {
  console.log('[Game|' + this.id + '] Remove player: ', player.meta);
  
  if (player.team) {
    player.team.removePlayer(player);
  }
  
  this.chat.removePlayer(player);
  
  delete this.players[player.id];
};

Game.prototype.getNextTeam = function getNextTeam() {
  var mostEmptyTeam = this.teams[0];
  
  for (var i = 1, team; (team = this.teams[i++]);) {
    if (team.getNumberOfPlayers() < mostEmptyTeam.getNumberOfPlayers()) {
      mostEmptyTeam = team;
    }
  }

  return mostEmptyTeam;
};

Game.prototype.getPlayersList = function getPlayersList() {
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
};

Game.prototype.getTeamsList = function getTeamsList() {
  var teams = {};
  
  for (var id in this.teams) {
    teams[id] = this.teams[id].getMetaData();
  }

  return teams;
};

Game.prototype.isJoinable = function isJoinable() {
  return !this.isFull && !this.isEnded;
};

Game.prototype.getMetaData = function getMetaData() {
  return {
    'id': this.id,
    'startTime': this.startTime,
    'duration': this.duration,
    'numberOfTeams': this.teams.length,
    'numberOfPlayers': Object.keys(this.players).length
  };
};

Game.prototype.getGameResult = function getGameResult() {
  return util._extend({
    'teamWon': this.teamWon,
    'endTime': this.endTime
  }, this.getMetaData());
};



Game.prototype.broadcast = function broadcast(event, data, isTick) {
    var player;
    
    for (var id in this.players) {
      player = this.players[id];
      
      if (isTick) {
        data.playerData = player.ownTick;
      }
      
      player.emit(event, data);
    }
  }


module.exports = Game;