/**
 * Game module
 * @module server/Game
 */

var CONFIG = require('./Config');
var Game = require('./Game');
var gameloop = require('node-gameloop');

/**
 * Creates a new Game
 * 
 * @constructor
 * @param {Object} options - Settings for initializing the game
 */
function GameManager(options) {
  this.games = [];
  this.gamesMap = {};
  
  this.numberOfEmptyGamesToMaintain = 1;
  
  this.init(options);
}

GameManager.prototype = {
  init: function init(options) {
    !options && (options = {});
    
    this.fillGames();
    
    gameloop.setGameLoop(this.update.bind(this), 1000 / 30);
  },
  
  update: function update(dt) {
    for (var id in this.games) {
      this.games[id].update(dt);
    }
  },
  
  fillGames: function fillGames() {
    var minGames = this.numberOfEmptyGamesToMaintain;
    
    while (this.getJoinableGames().length < minGames) {
      this.createGame();
    }
  },
  
  createGame: function createGame() {
    var game = new Game();
    
    this.games.push(game);
    this.gamesMap[game.id] = game;
    
    return game;
  },
  
  removeGame: function removeGame(gameToRemove) {
    if (!gameToRemove) {
      return;
    }
    
    for (var i = 0, game; (game = this.games[i++]);) {
      if (game.id === gameToRemove.id) {
        this.games.splice(i - 1, 1);
        break;
      }
    }
    
    delete this.gamesMap[gameToRemove.id];
    
    this.fillGames();
  },
  
  get: function get(id) {
    return id? this.games[id] : this.games;
  },
  
  getFirstJoinableGame: function getFirstJoinableGame() {
    for (var i = 0, game; (game = this.games[i++]);) {
      if (game.isJoinable()) {
        return game;
      }
    }
    
    // If we reached this code it means there were no joinable games!
    return this.createGame();
  },
  
  getJoinableGames: function getJoinableGames() {
    var games = [];
    
    for (var i = 0, game; (game = this.games[i++]);) {
      if (game.isJoinable()) {
        games.push(game);
      }
    }
    
    return games;
  },
  
  getGamesMetaData: function getGamesMetaData() {
    var gamesMetaData = {};
    
    for (var i = 0, game; (game = this.games[i++]);) {
      gamesMetaData[game.id] = game.getMetaData();
    }
    
    return gamesMetaData;
  }
};

module.exports = GameManager;