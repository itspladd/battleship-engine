const { SHIP_TYPES } = require('../constants/SHIPS');
const { getNeighborsInDirection,
        validAngle,
        validPosition,
        validatePositionAndAngle } = require('../helpers/positionHelpers');
const { handleError,
        argErrorMsg } = require('../helpers/errorHelpers')

class Ship {
  constructor(type, owner, id) {
    this.typeStr = type ? type.NAME : SHIP_TYPES.DEFAULT.NAME;
    this.segments = this.initSegments(this.typeStr);
    this._position = null;
    this.owner = owner || null;
    this.id = id;
    this.angle = 0;
  }

  get owner() {
    return this._owner;
  }

  set owner(board) {
    if(!(board instanceof Object) && board !== null) {
      throw new Error(`Ship.owner setter called with invalid board argument: ${board}`)
    }
    this._owner = board;
  }

  get type() {
    return this.typeStr;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    if(!id && id !== 0) {
      this._id = 'null';
      return;
    }
    if(typeof id !== 'string' && typeof id !== 'number') {
      throw new Error(`Tried to set a ship ID with a non-string/non-number value`);
    }
    this._id = `ship${id}`;
  }

  get totalHP() {
    const reducer = (total, segment) => total + segment.hp;
    return this.segments.reduce(reducer, 0);
  }

  set totalHP(value) {
    if (!Number.isInteger(value)) {
      throw new Error(argErrorMsg(value, "value", { name: "totalHP" }));
    }
    // If the value is 0, just set it all to 0.
    if (value === 0) {
      this.segments = this.segments.map(seg => ({ ...seg, hp: 0}));
    } else {
      //Otherwise, recursively call this function to set segments to 0,
      //then distribute HP along the rest of the segments
      this.totalHP = 0;
      for(let i = 0; i < value; i++) {
        const segIndex = i % this.length;
        this.segments[segIndex].hp += 1;
      }
    }
  }

  get length() {
    return this.segments.length;
  }

  get destroyed() {
    return this.totalHP <= 0;
  }

  // Spread each segment from the constants into a new object.
  initSegments(type) {
    return SHIP_TYPES[type].SEGMENTS
          .map(SEGMENT => ({ ...SEGMENT }))
  }

  segmentAt(position) {
    if (!validPosition(position)) {
      console.log("invalid position!!")
      throw new Error(argErrorMsg(position, "position", this.segmentAt))
    }
    const filterFunc = (segment) => {
      const [segX, segY] = segment.position;
      const [x, y] = position;
      if (segX === x && segY === y) {
        return true;
      }
    }

    // If position hasn't been set yet, then return false.
    const results = this.position ?
      this.segments.filter(filterFunc) :
      [];

    if (results.length > 1) {
      throw new Error('Ship.segmentAt found multiple segments with the same position');
    } else if (results.length === 1) {
      return results[0];
    } else if (results.length < 1) {
      return false;
    }
  }

  /**
   * Set the location of this ship. Note that this does NOT
   * necessarily mean the location is valid on a board; this is just where
   * the ship exists right now. The Board should handle whether
   * or not you can actually PLACE the ship in this location.
   */
  setPositions(position, angle) {
    try {
      validatePositionAndAngle(position, angle, this.setPositions);
    } catch (err) {
      handleError(err);
      return false;
    }
    this.position = position;
    this.angle = angle;

    const shipLength = this.length;
    const positions = getNeighborsInDirection(position, angle, shipLength)
    // Map the positions into the segments array.
    // Each segment now looks like { position: [x, y], hp: Int }
    this.segments = this.segments.map((segment, index) => {
      const newSeg = {
        ...segment,
        position: positions[index]
      };
      return newSeg;
    });

    return true;
  }



  // Does this ship collide with a given position?
  collidesWith(positions) {
    // Filtering function returns true if the position matches any segment positions
    const result = positions.filter(position => this.segmentAt(position))
    // Return the collision locations if they exist, or false if no collisions
    return result.length > 0 ? result : false;
  }

  collidesWithShip(ship) {
    //If this ship is checking itself, no collision.
    if (ship === this) {
      return false;
    }
    // If the target ship has no position, no collision.
    // And if this ship has position null, then we can skip collision checking as well.
    if (!ship.position || !this.position) {
      return false;
    }
    const collisions = this.collidesWith(ship.segments.map(seg => seg.position));

    return collisions ? { ship, collisions } : false;
  }

  get position() {
    return this._position ? [...this._position] : null;
  }

  set position(newVal) {
    if(Array.isArray(newVal)) {
      this._position = [...newVal];
    } else {
      this._position = newVal;
    }
  }

  // Reduce the HP of the segments at the input positions by the input value.
  // Assumes that collision checking has already been done,
  // and that all positions are valid.
  damageSegmentsAt(positions, value = 1) {
    if(!Array.isArray(positions[0])) {
      positions = [positions]
    }

    positions.forEach(position => {
      this.segmentAt(position).hp -= value;
    })
  }
}

module.exports = Ship;