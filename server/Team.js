/**
 * Team module
 * @module server/Team
 */

var uuid = require('node-uuid');
var extend = require('util')._extend;

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
  
  this.game = null;
  
  this.init(options);
}

Team.prototype = {
  init: function init(options) {
    !options && (options = {});
    
    this.id = options.id || ('team-' + uuid.v4());
    this.name = options.name || 'Team_' + this.id;
    
    this.maxHealth = options.health || 0;
    this.regeneratePerSecond = options.regeneratePerSecond || 0;
    
    this.setHealth(this.maxHealth);
    
    this.spriteData = extend({}, options.sprite);
    
    this.bounds.x = this.spriteData.x;
    this.bounds.y = this.spriteData.y;
    this.bounds.width = this.spriteData.width;
    this.bounds.height = this.spriteData.height;
  },
  
  update: function update(dt) {
    if (this.regeneratePerSecond) {
      this.heal(this.regeneratePerSecond * dt);
    }
    
    // TODO: update logic for team? base health auto heal?
    return this.getTickData();    
  },
  
  addPlayer: function addPlayer(player) {
    if (!this.players[player.id]) {
      player.setTeam(this);
      this.players[player.id] = player;
    }
  },
  
  removePlayer: function removePlayer(player) {
    if (this.players[player.id]) {
      player.setTeam(null);
      delete this.players[player.id];
    }
  },
  
  getNumberOfPlayers: function getNumberOfPlayers() {
    return Object.keys(this.players);
  },
  
  damage: function damage(value) {
    if (value) {
      this.setHealth(this.currentHealth - value);
    }
  },
  
  heal: function heal(value) {
    if (value) {
      this.setHealth(this.currentHealth + value);
    }
  },
  
  setHealth: function setHealth(health) {
    health = Math.clamp(health, 0, this.maxHealth);
    if (health === this.currentHealth) {
      return;
    }
    
    if (health === 0) {
      // lose
    }
    if (health === this.maxHealth) {
      // full
    }

    this.currentHealth = health;
    this.tick.health = this.currentHealth;
  },
  
  getTickData: function getTickData() {
    return this.tick;
  },
  
  getMetaData: function getMetaData() {
    return {
      'id': this.id,
      'name': this.name,
      'maxHealth': this.maxHealth,
      'currentHealth': this.currentHealth,
      'sprite': this.spriteData
    };
  }
};

module.exports = Team;