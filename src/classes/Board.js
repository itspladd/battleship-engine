const Tile = require('./Tile');
const Ship = require('./Ship');
const { validPosition, validatePositionAndAngle } = require('../helpers/positionHelpers');
const { handleError, argErrorMsg } = require('../helpers/errorHelpers');
const { VALID_ANGLES } = require('../constants/GLOBAL');

class Board {
  constructor({
    owner = 'none'
  }={}) {
    this.owner = owner;
    this.rows = 10;
    this.columns = 10;
    this.maxPosition = [this.columns - 1, this.rows - 1];
    this.ships = [];
    this.tiles = this.initTiles(this.rows, this.columns);
  }

  initTiles(rows, columns) {
    if (!Number.isInteger(rows)
        || !Number.isInteger(columns)
        || rows < 1
        || columns < 1
        || rows > 15
        || columns > 15) {
      throw new Error(`Board.initTiles called with invalid argument(s) [rows, columns]: [${rows}, ${columns}]`)
    }
    const result = []
    for(let i = 0; i < rows; i++) {
      const row = [];
      for(let j = 0; j < columns; j++) {
        row.push(new Tile());
      }
      result.push(row);
    }
    return result;
  }

  addShip(ship) {
    try {
      if(!(ship instanceof Ship)) {
        throw new Error(argErrorMsg(ship, "Ship", this.addShip))
      }
    } catch (err) {
      handleError(err);
      return false;
    }
    this.ships.push(ship)
    return true;
  }

  validShipLocation(ship) {
    return (
      this.entireShipInsideBoard(ship) &&
      this.noShipCollisions(ship)
    )
  }

  positionIsInsideBoard(position) {
    try {
      if (!validPosition(position)) {
        throw new Error(`positionIsInsideBoard() called with invalid argument: ${position}`)
      }
    } catch (err) {
      handleError(err);
      return false;
    }

    const x = position[0];
    const y = position[1];
    return (
      x >= 0 &&
      y >= 0 &&
      x <= this.maxPosition[0] &&
      y <= this.maxPosition[1]
    );
  }

  entireShipInsideBoard(ship) {
    for (const segment of ship.segments) {
      if(!this.positionIsInsideBoard(segment.position)) {
        return false;
      }
    }

    return true;
  }

  noShipCollisions(ship) {
    const results = this.ships.filter(boardShip => ship.collidesWithShip(boardShip))

    return results.length === 0;
  }

  // Return the Ship at the target position if there is one.
  shipAt(position) {
    const results = this.ships
                    .filter(ship => ship.segmentAt(position));
    return results[0] ? results[0] : false;
  }

}

module.exports = Board;