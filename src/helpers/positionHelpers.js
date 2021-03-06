const { VALID_ANGLES } = require('../constants/GLOBAL')
const { argErrorMsg, handleError } = require('./errorHelpers')

const validPosition = position => {
  return position === null ||
  (
    Array.isArray(position) &&
    position.length === 2 &&
    Number.isInteger(position[0]) &&
    Number.isInteger(position[1])
  )
}

const validAngle = angle => {
  return VALID_ANGLES.includes(angle);
}

// Throw errors if validation is bad, else do nothing.
const validatePositionAndAngle = (position, angle, callingFunc) => {
  if(!validPosition(position)) {
    throw new Error(argErrorMsg(position, 'position', callingFunc));
  }
  if(!validAngle(angle)) {
    throw new Error(argErrorMsg(angle, 'angle', callingFunc));
  }
}

const getNeighbor = (position, angle) => {
  try {
    validatePositionAndAngle(position, angle, getNeighbor);
  } catch(err) {
    handleError(err);
    return false;
  }

  if(position === null) {
    return null;
  }

  const x = position[0];
  const y = position[1];
  let neighborPosition;

  if (x % 2 === 1) {
    // Case where x is odd
    switch (angle) {
      case 0:
        neighborPosition = [x, y - 1];
        break;
      case 60:
        neighborPosition = [x + 1, y];
        break;
      case 120:
        neighborPosition = [x + 1, y + 1];
        break;
      case 180:
        neighborPosition = [x, y + 1];
        break;
      case 240:
        neighborPosition = [x - 1, y + 1];
        break;
      case 300:
        neighborPosition = [x - 1, y];
        break;
    }
  } else if (x % 2 === 0) {
    // Case where x is even
    switch (angle) {
      case 0:
        neighborPosition = [x, y - 1];
        break;
      case 60:
        neighborPosition = [x + 1, y - 1];
        break;
      case 120:
        neighborPosition = [x + 1, y];
        break;
      case 180:
        neighborPosition = [x, y + 1];
        break;
      case 240:
        neighborPosition = [x - 1, y];
        break;
      case 300:
        neighborPosition = [x - 1, y - 1];
        break;
    }
  }

  return neighborPosition;
};

// length represents the final length of the return array.
const getNeighborsInDirection = (position, angle, length) => {
  try {
    validatePositionAndAngle(position, angle, getNeighborsInDirection);
    if (!Number.isInteger(length) || length < 1) {
      throw new Error(`getNeighborsInDirection called with invalid length argument: ${length}`);
    }
  } catch(err) {
    handleError(err);
    return false;
  }

  let results = [];
  let lastPosition = position;
  let i = 0;
  do {
    results.push(lastPosition);
    lastPosition = getNeighbor(lastPosition, angle);
    i++;
  } while (i < length)

  return results;
};

const getAllNeighbors = position => {
  return VALID_ANGLES.map(angle => getNeighbor(position, angle))
};

module.exports = {
  validPosition,
  validAngle,
  validatePositionAndAngle,
  getNeighbor,
  getNeighborsInDirection,
  getAllNeighbors
}