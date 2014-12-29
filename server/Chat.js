var CONFIG = require('./Config.js');

var Chat = (function Chat() {
  var TEMPLATE_PLAYER_JOIN = '<b>{{sanitizedName}}</b> Joined the game';
  var TEMPLATE_PLAYER_LEAVE = '<b>{{sanitizedName}}</b> Left the game';
  var CHAT_MESSAGE_TYPES = {
    SERVER: 'server',
    PLAYER: 'player'
  };
  
  function Chat(options) {
    this.game;
    this.windows = [];
    this.players = {};
    
    this.windowIds = {};

    this.server = {
      'name': 'Server'
    };
    
    this.defaultWindow = '';

    this.init(options);
  }
  
  Chat.prototype = {
    init: function init(options) {
      !options && (options = {});
      
      this.game = options.game;
      this.windows = options.windows || [];
      this.defaultWindow = options.defaultWindow || this.windows[0].id;
      
      for (var i = 0, win; (win = this.windows[i++]);) {
        this.windowIds[win.id] = true;
      }

      console.log('[Chat] Created: ', this.windows);
    },
    
    addPlayer: function addPlayer(player) {
      if (!player) {
        return;
      }

      console.log('[Chat] Add player to chat');
      
      this.players[player.id] = player;
      
      this.sendWindowsToPlayer(player);

      this.sendMessage({
        'message': TEMPLATE_PLAYER_JOIN.format(player),
        'type': CHAT_MESSAGE_TYPES.SERVER
      });
    },
    
    removePlayer: function removePlayer(player) {
      if (!player) {
        return;
      }

      console.log('[Chat] Remove player from chat');
      
      delete this.players[player.id];

      this.sendMessage({
        'message': TEMPLATE_PLAYER_LEAVE.format(player),
        'type': CHAT_MESSAGE_TYPES.SERVER
      });
    },
    
    sendMessage: function sendMessage(data) {
      !data && (data = {});

      !data.windowId && (data.windowId = this.defaultWindow);
      !data.player && (data.player = this.server);
      !data.type && (data.type = CHAT_MESSAGE_TYPES.PLAYER);
      
      if (!this.windowIds[data.windowId]) {
        console.warn('[Chat] Sending message to wrong window', data);
        return;
      }
      if (!data.message) {
        console.warn('[Chat] Sending empty message', data);
        return;
      }
      
      if (data.player.meta) {
        data.player = data.player.meta;
      }
      
      // Only allow server to send HTML as a message
      if (data.type !== CHAT_MESSAGE_TYPES.SERVER) {
        data.message = data.message.replace(/</g, '&lt');
      }
      
      if (this.game) {
        this.game.broadcast(CONFIG.EVENTS_TO_CLIENT.CHAT.NEW_MESSAGE, data);
      }
    },
    
    sendWindowsToPlayer: function sendWindowsToPlayer(player) {
      if (!player) {
        return;
      }

      for (var i = 0, win; (win = this.windows[i++]);) {
        player.emit(CONFIG.EVENTS_TO_CLIENT.CHAT.ADD_WINDOW, win);
      }
    }
  };
  
  return Chat;
}());

module.exports = Chat;