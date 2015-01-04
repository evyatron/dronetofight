/**
 * Team module
 * @module server/Team
 */

var events = require('events');
var uuid = require('node-uuid');
var util = require('util');

/**
 * Creates a new Team
 * 
 * @constructor
 * @param {Object} options - Settings for initializing the team
 */

function Team(options) {
  this.id = '';
  this.name = '';
  
  this.maxHealth = 0;
  this.currentHealth = 0;
  this.spriteData = null;
  
  this.players = {};
  this.bounds = {};
  
  this.tick = {
    'id': '',
    'health': 0
  };
  
  this.didLose = false;
  this.deaths = 0;
  this.deathsToLose = 1;
  
  this.game = null;

  this.init(options);
}

util.inherits(Team, events.EventEmitter);

Team.prototype.HEALTH_EMPTY = 'HealthEmpty';
Team.prototype.RESPAWN = 'Respawn';
Team.prototype.LOSE = 'Lose';

Team.prototype.init = function init(options) {
  !options && (options = {});
  
  this.id = options.id || ('team-' + uuid.v4());
  this.name = options.name || 'Team_' + this.id;
  
  this.maxHealth = options.health || 0;
  this.regeneratePerSecond = options.regeneratePerSecond || 0;
  
  this.setHealth(this.maxHealth);
  
  this.spriteData = util._extend({}, options.sprite);
  
  this.bounds.x = this.spriteData.x;
  this.bounds.y = this.spriteData.y;
  this.bounds.width = this.spriteData.width;
  this.bounds.height = this.spriteData.height;
  
  console.log('[Team|' + this.id + '] Created', this.name, this.maxHealth);
};

Team.prototype.update = function update(dt) {
  if (!this.didLose) {
    if (this.regeneratePerSecond) {
      this.heal(this.regeneratePerSecond * dt);
    }
  }
  
  return this.getTickData();    
};

Team.prototype.addPlayer = function addPlayer(player) {
  if (!this.players[player.id]) {
    player.setTeam(this);
    this.players[player.id] = player;
  }
};

Team.prototype.removePlayer = function removePlayer(player) {
  if (this.players[player.id]) {
    player.setTeam(null);
    delete this.players[player.id];
  }
};

Team.prototype.getNumberOfPlayers = function getNumberOfPlayers() {
  return Object.keys(this.players);
};

Team.prototype.onDeath = function onDeath() {
  if (this.didLose) {
    return;
  }

  this.deaths++;
  
  if (this.deaths >= this.deathsToLose) {
    this.didLose = true;
    this.emit(this.LOSE, this);
  } else {
    this.respawn();
  }
};

Team.prototype.respawn = function respawn() {
  this.setHealth(this.maxHealth);
  this.emit(this.RESPAWN, this);
};

Team.prototype.damage = function damage(value) {
  if (value) {
    this.setHealth(this.currentHealth - value);
  }
};

Team.prototype.heal = function heal(value) {
  if (value) {
    this.setHealth(this.currentHealth + value);
  }
};

Team.prototype.setHealth = function setHealth(health) {
  if (this.didLose) {
    return;
  }

  health = Math.clamp(health, 0, this.maxHealth);
  if (health === this.currentHealth) {
    return;
  }
  
  this.currentHealth = health;
  this.tick.health = this.currentHealth;
  
  if (this.currentHealth === 0) {
    this.emit(this.HEALTH_EMPTY, this);
    this.onDeath();
  }
};

Team.prototype.getTickData = function getTickData() {
  return this.tick;
};

Team.prototype.getMetaData = function getMetaData() {
  return {
    'id': this.id,
    'name': this.name,
    'maxHealth': this.maxHealth,
    'currentHealth': this.currentHealth,
    'sprite': this.spriteData
  };
};

module.exports = Team;