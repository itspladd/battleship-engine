const clone = require('just-clone');

const Board = require('../classes/Board')

const { GAME_STATES } = require('../constants/GLOBAL');
const RULES = require('../constants/RULES')
const { argErrorMsg, handleError } = require('../helpers/errorHelpers');
const {
  shuffleArray,
  noDuplicateUnderscoresRecursive,
  stripUnderscoresRecursive
} = require('../helpers/generalHelpers')
const Player = require('./Player');

class GameEngine {
  constructor({
    players,
    aiPlayers, // Number of AI players
    rules
  } = {}) {
    this.rules = rules;
    this._stateStack = [GAME_STATES.INTIALIZING]
    this._players = this.initPlayers(players);
    this._playerOrder = shuffleArray(Object.keys(this._players))
    this._moveStack = [];
    this._moveHistory = [];
  }

  get nextPlayer() {
    return this._players(this.playerOrder[0]);
  }

  get players() {
    return this._players;
  }

  set players(players) {
    this._players = { ...players };
  }

  // Return the most recent state in the stack
  get state() {
    return this._stateStack[this._stateStack.length - 1]
  }

  // Add a new current state to the stack
  set state(newState) {
    this._stateStack.push(newState);
  }

  get lastMove() {
    return this._moveHistory[this._moveHistory.length -1];
  }

  get rules() {
    return this._rules;
  }

  set rules(rulesIn) {
    const rulesObj = rulesIn ? RULES[rulesIn] : RULES.DEFAULT_RULES;
    this._rules = clone(rulesObj);
  }

  // Return a JSON-friendly version of the current game state
  get gameState() {
    // The owner properties cause circular references.
    // This is fine in the game operation, but bad for JSON!
    // If we have a circular reference to an owner, replace it with the owner's ID.
    const replacer = (key, val) => {
      return key === '_owner' ? val.id : val;
    }
    // Stringify then parse to make sure we've broken all references to original objects
    const parsed = JSON.parse(JSON.stringify(this, replacer))
    noDuplicateUnderscoresRecursive(parsed);
    stripUnderscoresRecursive(parsed);
    return parsed;
  }

  advancePlayers() {
    this._playerOrder.push(this._playerOrder.shift())
  }

  validPlayerData(player) {
    return  player.name &&
            player.id &&
            typeof player.name === 'string'
  }

  inputMove(move) {
    const moveResolutionPromise = new Promise ((resolve, reject) => {
      const { valid, msg } = this.validateMove(move);
      if (valid) {
        const { processed, error, gameState } = this.processMove(move);
      } else {
        const processed = false;
        const error = `Validation failed. Move not processed`;
        const gameState = this.gameState;
      }
      resolve({ valid, processed, error, msg, gameState });
    })
  }

  validateMove(move) {
    let result;
    try {
      // General move validation
      result = this.validateGeneralMoveData(move)
      if (!result.valid) {
        throw new Error(result.msg);
      }
      return result;
    } catch (err) {
      handleError(err);
      return result;
    }
  }

  validateGeneralMoveData(move) {
    const MOVES = this.rules.MOVES;
    // All moves are false until checked!
    let valid = false;
    let msg = `Board.validateMove: `;

    // Check that we got an Object for the move
    if (!(move instanceof Object)) {
      msg += `invalid move argument: ${typeof move}, should be an object`;
      return { valid, msg }
    }
    // Check that it matches a MOVE_TYPE in GLOBAL.js
    if (!this.rules.MOVES[move.moveType]) {
      msg += `invalid move type: ${move.moveType}`;
      return { valid, msg };
    }

    const MOVE_RULES = this.rules.MOVES[move.moveType]

    // Check that it includes the necessary keys for that move
    const invalidKeys = MOVE_RULES.INVALID_DATA(move)
    if(invalidKeys.length > 0) {
      msg += `${move.moveType} called with missing/extra data.
      move data: ${move}
      bad keys: ${invalidKeys}`
    }

    // Now check that we're in a valid state
    if (!MOVE_RULES.VALID_STATE(this.state)) {
      msg += `${move.moveType} not valid during ${this.state} state.
      Current state: ${this.state}`
      return { valid, msg };
    }

    // Check that the target of the move is valid
    if (!MOVE_RULES.VALID_TARGET(move.playerID, move.targetPlayerID)) {
      msg += `Invalid target for ${move.moveType}. Valid target type is ${MOVE_RULES.VALID_TARGET.name}.
      playerID: ${move.playerID},
      targetPlayerID: ${move.targetPlayerID}`
      return { valid, msg };
    }

    // If there's other validation functions for this move and they return false,
    // report back.
    if (MOVE_RULES.VALID_OTHER && !MOVE_RULES.VALID_OTHER(this, move)) {
      msg += `Additional validation failed for ${move.moveType}.`
      return { valid, msg };
    }

    return { valid: true, msg: 'Move successfully validated' };
  }

  validatePlaceShipMove(move) {
    // Set up convenience variables
    let valid = false
    let msg = `Board.validatePlaceShipMove: `
    const { playerID, targetPlayerID, shipID } = move;
    const targetBoard = this.players[playerID].board;

    // Players can only move their own ships, so the IDs should match.
    if (playerID !== targetPlayerID) {
      msg += `Tried to move another player's ship. PlayerID must match targetPlayerID:
      playerID: ${playerID},
      targetPlayerID: ${targetPlayerID}`
      return { valid, msg };
    }

    // Ship must exist.
    if (!targetBoard.ships[shipID]) {
      msg += `Tried to move nonexistent ship.
      shipID: ${shipID}`
      return { valid, msg };
    }

    // Game state must be PLACE_SHIP
  }

  validateFireMove(move) {

  }

  processMove(move) {
    const moveType = move.moveType;
    const processor = {
      // Bind the functions to the current (GameEngine) context.
      // Otherwise their internal "this" will refer to the "processor"
      // object and they won't work!
      MOVE_SHIP: this.processMoveShipMove.bind(this),
      PLACE_SHIP: this.processPlaceShipMove.bind(this),
      FIRE: this.processFireMove.bind(this)
    }
    const { processed, error } = processor[moveType](move);
    const gameState = this.gameState;
    return { processed, error, gameState }
  }

  processMoveShipMove(move) {
    const { playerID, shipID, position, angle } = move;
    const ship = this.players[playerID].board.ships[shipID];
    try {
      if (ship.setPositions(position, angle)) {
        return {
          processed: true,
          error: null
        }
      } else {
        return {
          processed: false,
          error: `Could not process move: ${move}. No error thrown.`
        }
      }
    } catch (err) {
      return {
        processed: false,
        error: err.message
      }
    }
  }

  processPlaceShipMove(move) {

  }

  processFireMove(move) {

  }

  initPlayers(players) {
    // If called with no players array
    if (!players) {
      return this.makeDefaultPlayers();
    }
    try {

      const validPlayers = players.filter(this.validPlayerData)
      const uniqueIDs = new Set(players.map(player => player.id))
      // If array has bad data
      if (!Array.isArray(players) ||
          validPlayers.length !== players.length
      ) {
        throw new Error(argErrorMsg(players, "players", this.initPlayers))
      }
      // If we were provided duplicate player IDs
      if (uniqueIDs.size !== players.length) {
        throw new Error(`Duplicate player ids found`);
      }
    } catch (err) {
      handleError(err);
      return false;
    }
    const results = {};
    players.forEach(playerData => {
      results[playerData.id] = new Player(playerData)
    });
    return results;
  }

  makeDefaultPlayers() {
    const p1 = new Player({id: "p1", name: 'DEFAULT-PLAYER-1' })
    const p2 = new Player({id: "p2", name: 'DEFAULT-PLAYER-2' })
    return { p1, p2 }
  }
}

module.exports = GameEngine;