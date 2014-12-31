/**
 * Chat module
 * @module server/Chat
 */

var CONFIG = require('./Config');


var TEMPLATE_PLAYER_JOIN = '<b>{{sanitizedName}}</b> Joined the game';
var TEMPLATE_PLAYER_LEAVE = '<b>{{sanitizedName}}</b> Left the game';
var CHAT_MESSAGE_TYPES = {
  SERVER: 'server',
  PLAYER: 'player'
};

/**
 * Creates a new Chat object which is in charge of receiving and sending
 * messages between players.
 * 
 * @constructor
 * @param {Object} options - Settings for initializing the chat
 */
function Chat(options) {
  /**
   * Array of windows - ordered the way they would be sent to the player.
   * @type {Object[]}
   */
  this.windows = [];
  /**
   * Players map.
   * @type {Object.<string, Player>}
   */
  this.players = {};
  
  /**
   * Set to 'true' to automatically send 'PLAYER joined' messages.
   * @type {Boolean}
   */
  this.shouldSendJoinMessages = false;
  /**
   * Set to 'true' to automatically send 'PLAYER left' messages.
   * @type {Boolean}
   */
  this.shouldSendLeaveMessages = false;
  
  /**
   * Event name used for listening on messages from the client.<br />
   * Default taken from CONFIG.EVENTS_FROM_CLIENT.CHAT.NEW_MESSAGE
   * @type {string}
   */
  this.eventMessageFromClient = '';
  /**
   * Event name used for listening on messages from the client.<br />
   * Default taken from CONFIG.EVENTS_TO_CLIENT.CHAT.NEW_MESSAGE
   * @type {string}
   */
  this.eventMessageToClient = '';
  /**
   * Event name used for listening on messages from the client.<br />
   * Default taken from CONFIG.EVENTS_TO_CLIENT.CHAT.ADD_WINDOW
   * @type {string}
   */
  this.eventWindowToClient = '';
  
  /**
   * Map used to validate windows when a new message is sent.
   * @type {Object<string.boolean>}
   */
  this.windowIds = {};
  
  /**
   * Psuedo {@link Player} object used to send a message as the server.
   * @type {Object}
   */
  this.serverPlayer = {
    'name': 'Server'
  };
  
  /**
   * The defult window to which to send a message
   * @type {string}
   */
  this.defaultWindow = '';
  
  
  this.init(options);
}

Chat.prototype = {
  /**
   * Adds a player to this chat and sends them all the current windows<br />
   * If {@link Chat.shouldSendJoinMessages} is set to true,
   * sends a server message notifying about the new player
   * 
   * @function
   * @param {Player} player - The player to add
   */
  addPlayer: function addPlayer(player) {
    if (!player || this.players[player.id]) {
      return;
    }
    
    console.log('[Chat] Add player to chat');
    
    this.players[player.id] = player;
    
    player.socket.on(this.eventMessageFromClient,
                      this.onNewPlayerMessage.bind(this, player));
    
    this.sendWindowsToPlayer(player);
    
    if (this.shouldSendJoinMessages) {
      this.sendMessage({
        'message': TEMPLATE_PLAYER_JOIN.format(player)
      });
    }
  },
  /**
   * Broadcasts an event to all connected players
   * 
   * @function
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  broadcast: function broadcast(eventName, data) {
    for (var id in this.players) {
      this.players[id].emit(eventName, data);
    }
  },
  /**
   * Initializing the chat object - called automatically when doing new Chat
   * 
   * @function
   * @param {Object} options - Settings for initializing the chat
   */
  init: function init(options) {
    !options && (options = {});
    
    this.windows = options.windows || [];
    this.defaultWindow = options.defaultWindow || this.windows[0].id;
    this.shouldSendJoinMessages = Boolean(options.shouldSendJoinMessages);
    this.shouldSendLeaveMessages = Boolean(options.shouldSendLeaveMessages);
    
    this.eventMessageFromClient = options.eventMessageFromClient ||
                                  CONFIG.EVENTS_FROM_CLIENT.CHAT.NEW_MESSAGE;
    this.eventMessageToClient = options.eventMessageToClient ||
                                CONFIG.EVENTS_TO_CLIENT.CHAT.NEW_MESSAGE;
    this.eventWindowToClient = options.eventWindowToClient ||
                               CONFIG.EVENTS_TO_CLIENT.CHAT.ADD_WINDOW;
    
    for (var i = 0, win; (win = this.windows[i++]);) {
      this.windowIds[win.id] = true;
    }
    
    console.log('[Chat] Created: ', this.windows);
  },
  /**
   * Called when a client has sent a message to the server
   * 
   * @function
   * @param {Player} player - The player who sent the message
   * @param {Object} messageData - The message data
   * @param {string} messageData.windowId - The window to which the message was sent
   * @param {string} messageData.message - The actual message text
   */
  onNewPlayerMessage: function onNewPlayerMessage(player, messageData) {
    this.sendMessage({
      'windowId': messageData.windowId,
      'player': player,
      'message': messageData.message,
      'type': CHAT_MESSAGE_TYPES.PLAYER
    });
  },
  /**
   * Removes a player from this chat<br />
   * If required, sends a server message notifying about the player leaving
   * 
   * @function
   * @param {Player} player - The player to remove
   */
  removePlayer: function removePlayer(player) {
    if (!player || !this.players[player.id]) {
      return;
    }
    
    console.log('[Chat] Remove player from chat');
    
    delete this.players[player.id];
    
    if (this.shouldSendLeaveMessages) {
      this.sendMessage({
        'message': TEMPLATE_PLAYER_LEAVE.format(player)
      });
    }
  },
  /**
   * Sends a message to all connected players
   * 
   * @function
   * @param {Object} data - Message data
   * @param {string} data.windowId - The window to which to send the message
   * @param {Player} data.player - The player who sent the message
   * @param {string} data.type - The type of message (player/server/...)
   */
  sendMessage: function sendMessage(data) {
    !data && (data = {});
    
    !data.windowId && (data.windowId = this.defaultWindow);
    !data.player && (data.player = this.serverPlayer);
    !data.type && (data.type = CHAT_MESSAGE_TYPES.SERVER);
    
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
    
    this.broadcast(this.eventMessageToClient, data);
  },
  /**
   * Sends all the windows to the given player
   * 
   * @function
   * @param {Player} player - The {@link Player} to which to send the windows
   */
  sendWindowsToPlayer: function sendWindowsToPlayer(player) {
    if (!player) {
      return;
    }
    
    for (var i = 0, win; (win = this.windows[i++]);) {
      player.emit(this.eventWindowToClient, win);
    }
  }
};

module.exports = Chat;