/**
 * Configuration for the entire project
 * @module Config
 * @type {Object}
 */
module.exports = {
  EVENTS_FROM_CLIENT: {
    GAME: {
    },
    PLAYER: {
      READY: 'newPlayer',
      UPDATE_META_DATA: 'updateMetaData',
      UPDATE_TICK_DATA: 'updateTickData',
      USE_SKILL: 'useSkill',
      DISCONNECT: 'disconnect'
    },
    CHAT: {
      NEW_MESSAGE: 'chatNewMessage'
    }
  },
  EVENTS_TO_CLIENT: {
    GAME: {
      UPDATE_PLAYERS_LIST: 'updatePlayers',
      PLAYER_LEAVE: 'removePlayer',
      TICK: 'tick'
    },
    PLAYER: {
      READY: 'ready',
      JOIN_GAME: 'joinGame',
      LEAVE_GAME: 'leaveGame',
      UPDATE_META_DATA: 'updateMetaData'
    },
    PROJECTILE: {
      ADD: 'projectileAdd',
      REMOVE: 'projectileRemove'
    },
    CHAT: {
      ADD_WINDOW: 'chatAddWindow',
      NEW_MESSAGE: 'chatNewMessage'
    }
  },
  UI_DATA: {
    "ships": [
      {
        "id": 1,
        "name": "Ship 1",
        "image": "/images/ships/1.png"
      },
      {
        "id": 2,
        "name": "Ship 2",
        "image": "/images/ships/2.png"
      },
      {
        "id": 3,
        "name": "Ship 3",
        "image": "/images/ships/3.png"
      },
      {
        "id": 4,
        "name": "Ship 4",
        "image": "/images/ships/4.png"
      },
      {
        "id": 5,
        "name": "Ship 5",
        "image": "/images/ships/5.png"
      },
      {
        "id": 6,
        "name": "Ship 6",
        "image": "/images/ships/6.png"
      },
      {
        "id": 7,
        "name": "Ship 7",
        "image": "/images/ships/7.png"
      },
      {
        "id": 8,
        "name": "Ship 8",
        "image": "/images/ships/8.png"
      },
      {
        "id": 9,
        "name": "Ship 9",
        "image": "/images/ships/9.png"
      },
      {
        "id": 10,
        "name": "Ship 10",
        "image": "/images/ships/10.png"
      },
    ]
  },
  CHAT_WINDOWS: [
    {
      'id': 'all',
      'name': 'Game'
    },
    {
      'id': 'team',
      'name': 'Team'
    }
  ]
};