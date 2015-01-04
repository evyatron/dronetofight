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
  SHIPS: [
    {
      "id": 1,
      "name": "Ship 1",
      "image": "/images/ships/1.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 2,
      "name": "Ship 2",
      "image": "/images/ships/2.png",
      "data": {
        "speed": 100,
        "maxSpeed": 400,
        "rotationSpeed": 350
      }
    },
    {
      "id": 3,
      "name": "Ship 3",
      "image": "/images/ships/3.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 4,
      "name": "Ship 4",
      "image": "/images/ships/4.png",
      "data": {
        "speed": 20,
        "maxSpeed": 200,
        "rotationSpeed": 100
      }
    },
    {
      "id": 5,
      "name": "Ship 5",
      "image": "/images/ships/5.png",
      "data": {
        "speed": 70,
        "maxSpeed": 250,
        "rotationSpeed": 200
      }
    },
    {
      "id": 6,
      "name": "Ship 6",
      "image": "/images/ships/6.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 7,
      "name": "Ship 7",
      "image": "/images/ships/7.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 8,
      "name": "Ship 8",
      "image": "/images/ships/8.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 9,
      "name": "Ship 9",
      "image": "/images/ships/9.png",
      "data": {
        "speed": 50,
        "maxSpeed": 300,
        "rotationSpeed": 300
      }
    },
    {
      "id": 10,
      "name": "Ship 10",
      "image": "/images/ships/10.png",
      "data": {
        "speed": 150,
        "maxSpeed": 400,
        "rotationSpeed": 350
      }
    }
  ],
  CHAT_WINDOWS: [
    {
      'id': 'all',
      'name': 'Game'
    },
    {
      'id': 'team',
      'name': 'Team'
    }
  ],
  STATIC_SPRITES: [
  ],
  TEAMS: [
    {
      "id": "team0",
      "name": "Team 0",
      "health": 100,
      "sprite": {
        'x': 0,
        'y': 0,
        'width': 300,
        'height': 150,
        'color': 'rgba(255, 0, 0, 0.3)'
      }
    },
    {
      "id": "team1",
      "name": "Team 1",
      "health": 100,
      "sprite": {
        'x': 1620,
        'y': 930,
        'width': 300,
        'height': 150,
        'color': 'rgba(0, 0, 255, 0.3)'
      }
    }
  ]
};