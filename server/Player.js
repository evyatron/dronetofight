var uuid = require('node-uuid');
var CONFIG = require('./Config.js');
var Skill = require('./Skill.js');
var Projectile = require('./Projectile.js');

var Player = (function Player() {
  var READ_ONLY_META = {
    'id': true,
    'team': true
  };
  
  function Player(socket, options) {
    // Generated internal ID
    this.id = '';
    
    // Used for chat - HTML safe
    this.sanitizedName = '';
    
    // Player movement speed
    this.speed = 50;
    
    // Maximum player movement speed
    this.maxSpeed = 300;
    
    // Player rotation speed
    this.rotationSpeed = 300;
    
    // Skills
    this.skills = {};

    // The actual socket the player is using
    this.socket = socket;
    
    // Holds the tick data (position, rotation, etc)
    this.tick = {};
    
    // Holds the PRIVATE tick data that only the player should see
    // Game takes this DIRECTLY to save on another function call
    this.ownTick = {
      'skills': {}
    };
    
    // Holds the meta data (id, name, etc)
    this.meta = {};

    // A reference to the player's game
    this.game = null;
    
    // Whether to send the meta data in the tick
    // Resets to true when something is updated
    this.shouldSendMeta = true;
    
    
    this.callbackClientReady = null;
    
    
    this.init(options);
  }
  
  Player.prototype = {
    init: function init(options) {
      !options && (options = {});

      this.id = 'player-' + uuid.v4();

      this.meta.id = this.id;
      
      this.callbackClientReady = options.onClientReady || function(){};

      this.createSkills();
      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.PLAYER.READY,
                      this.onClientReady.bind(this));
                      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.PLAYER.UPDATE_META_DATA,
                      this.clientUpdateMetaData.bind(this));
                      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.PLAYER.UPDATE_TICK_DATA,
                      this.updateTickData.bind(this));
                      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.PLAYER.USE_SKILL,
                      this.useSkill.bind(this));
                      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.PLAYER.DISCONNECT,
                      this.disconnect.bind(this));
                      
      this.socket.on(CONFIG.EVENTS_FROM_CLIENT.CHAT.NEW_MESSAGE,
                      this.onChatMessage.bind(this));
      
      // Fire ready event to the client
      this.socket.emit(CONFIG.EVENTS_TO_CLIENT.PLAYER.READY, {
        'id': this.id,
        'speed': this.speed,
        'maxSpeed': this.maxSpeed,
        'rotationSpeed': this.rotationSpeed,
        'skills': this.getSkillsMetaData(),
        'ui': CONFIG.UI_DATA
      });
      
      console.log('[Player|' + this.id + '] Created');
    },
    
    getTickData: function getTickData() {
      var data = {
        'meta': null,
        'tick': this.tick
      };
      
      if (this.shouldSendMeta) {
        data.meta = this.meta;
        this.shouldSendMeta = false;
      }
      
      return data;
    },
    
    createSkills: function createSkills() {
      var skillPrimary = new Skill({
            'cooldown': 0.6,
            'damage': 10,
            'key': -1,
            'name': 'LMB',
            'projectileData': {
              'speed': 450,
              'size': 6,
              'maxDistance': 750,
              'color': 'white'
            }
          }),
          skillSecondary = new Skill({
            'cooldown': 2,
            'damage': 35,
            'key': -2,
            'name': 'RMB',
            'projectileData': {
              'speed': 200,
              'size': 8,
              'maxDistance': 500,
              'color': 'red'
            }
          });
      
      this.skills[skillPrimary.id] = skillPrimary;
      this.skills[skillSecondary.id] = skillSecondary;
    },
    
    useSkill: function useSkill(skillId) {
      var skill = this.skills[skillId];
      if (!skill) {
        console.warn('[Player|' + skillId + '] Trying to use non existant skill?');
        return;
      }
      
      var wasUsed = skill.use();
      
      if (wasUsed && this.game) {
        this.game.addProjectile(new Projectile({
          'data': skill.projectileData,
          'x': this.tick.x,
          'y': this.tick.y,
          'angle': this.tick.angle,
          'velocity': this.tick.velocity,
          'onReachedMaxDistance': this.game.removeProjectile.bind(this.game)
        }));
      }
    },
    
    update: function update(dt) {
      var skills = this.skills;
      for (var skillId in skills) {
        this.ownTick.skills[skillId] = skills[skillId].update(dt);
      }
    },
    
    onClientReady: function onClientReady(metaData) {
      console.log('[Player|' + this.id + '] Ready on client', metaData);
      this.updateMetaData(metaData);
      this.callbackClientReady(this);
    },
    
    joinGame: function joinGame(game) {
      if (!game) {
        console.warn('[Player|' + this.id + '] Trying to join invalid game');
        return;
      }
      
      console.log('[Player|' + this.id + '] Join game: ', game.id);

      // Make sure player is not in any other game
      this.leaveGame();
      // Save a reference to the game
      this.game = game;
      // Tell the game the player joined
      game.addPlayer(this);
      // Tell the player they joined
      this.socket.emit(CONFIG.EVENTS_TO_CLIENT.PLAYER.JOIN_GAME, {
        'id': game.id,
        'team': this.meta.team,
        'players': game.getPlayersList()
      });
    },
    
    leaveGame: function leaveGame() {
      if (this.game) {
        console.log('[Player|' + this.id + '] Leave game: ', this.game.id);
        
        this.game.removePlayer(this);
        this.game = null;
        this.socket.emit(CONFIG.EVENTS_TO_CLIENT.PLAYER.LEAVE_GAME);
      }
    },
    
    onChatMessage: function onChatMessage(data) {
      var chat = (this.game || {}).chat;
      if (chat) {
        chat.sendMessage({
          'windowId': data.windowId,
          'player': this,
          'message': data.message
        });
      }
    },
    
    // Player disconnected - remove from game
    disconnect: function disconnect() {
      console.log('[Player|' + this.id + '] Disconnected');

      if (this.game) {
        this.game.removePlayer(this);
      }
    },
    
    updateMetaData: function updateMetaData(data) {
      console.log('[Player|' + this.id + '] Update meta data:', data);

      for (var k in data) {
        this.meta[k] = data[k];
      }
      
      // Used for chat
      this.sanitizedName = this.meta.name.replace(/</g, '&lt');
      
      this.shouldSendMeta = true;
    },
    
    // Expose the socket's emity functionality
    emit: function emit() {
      if (this.socket) {
        this.socket.emit.apply(this.socket, arguments);
      }
    },
    
    // When the client sends meta to update
    // First clean up all the ready only properties (like ID, Team, etc.)
    clientUpdateMetaData: function clientUpdateMetaData(data) {
      for (var k in READ_ONLY_META) {
        delete data[k];
      }
      
      this.updateMetaData(data);
    },
    
    updateTickData: function updateTickData(data) {
      for (var k in data) {
        this.tick[k] = data[k];
      }
    },
    
    getSkillsMetaData: function getSkillsMetaData() {
      var data = {};
      for (var id in this.skills) {
        data[id] = this.skills[id].getMetaData();
      }
      return data;
    }
  };
  
  return Player;
}());

module.exports = Player;