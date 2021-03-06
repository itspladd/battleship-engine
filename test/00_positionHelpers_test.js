const { should } = require('chai')
const {
  validPosition,
  validAngle,
  validatePositionAndAngle,
  getNeighbor,
  getNeighborsInDirection,
  getAllNeighbors
} = require('../src/helpers/positionHelpers')

describe('validPosition(position)', () => {
  it('should return false if not given an array of size 2', () => {
    validPosition(5).should.be.false
    validPosition([4]).should.be.false
    validPosition([4, 5, 6]).should.be.false
  })
  it('should return false if given any non-integer arguments in the array', () => {
    validPosition([3, "4"]).should.be.false
    validPosition([3.3, 3]).should.be.false
  })
  it('should return true if given a size 2 array of integers', () => {
    validPosition([0, 0]).should.be.true
    validPosition([100, 100]).should.be.true
    validPosition([10000, 100000]).should.be.true
  })
})

describe('validAngle(angle)', () => {
  it('should return false if the angle is not valid for this board', () => {
    validAngle(270).should.be.false;
    validAngle(90).should.be.false;
  });
  it('should return true if this is a valid angle for this board', () => {
    validAngle(0).should.be.true;
    validAngle(60).should.be.true;
    validAngle(120).should.be.true;
    validAngle(180).should.be.true;
    validAngle(240).should.be.true;
    validAngle(300).should.be.true;
  })
})

describe('validatePositionAndAngle', () => {
  it('should throw an error when given bad arguments', () => {
    const func1 = () => { };

    const bad1 = () => validatePositionAndAngle([0.5, 1], 120, func1);
    const bad2 = () => validatePositionAndAngle([1, 1], 4, func1);
    const good = () => validatePositionAndAngle([1, 1], 120, func1);

    bad1.should.throw(Error, /func1 called with invalid position argument:/i);
    bad2.should.throw(Error, /func1 called with invalid angle argument:/i);
    good.should.not.throw(Error);
  })
})

describe('getNeighbor(position, angle)', () => {
  it('should return undefined if given invalid position or angle', () => {
    getNeighbor().should.be.false;
    getNeighbor([3, 3]).should.be.false;
    getNeighbor([3, -1], 120).should.not.be.false; // Yes, we can get the "neighbor" of a negative tile!
    getNeighbor([0, 0], 120).should.not.be.false;
  });
  it('should return the position of the neighboring tile in the given direction when x is odd', () => {
    // odd X
    getNeighbor([1, 1], 0).should.deep.equal([1, 0])
    getNeighbor([1, 1], 60).should.deep.equal([2, 1])
    getNeighbor([1, 1], 120).should.deep.equal([2, 2])
    getNeighbor([1, 1], 180).should.deep.equal([1, 2])
    getNeighbor([1, 1], 240).should.deep.equal([0, 2])
    getNeighbor([1, 1], 300).should.deep.equal([0, 1])
  });
  it('should return the position of the neighboring tile in the given direction when x is even', () => {
    // even X
    getNeighbor([2, 1], 0).should.deep.equal([2, 0])
    getNeighbor([2, 1], 60).should.deep.equal([3, 0])
    getNeighbor([2, 1], 120).should.deep.equal([3, 1])
    getNeighbor([2, 1], 180).should.deep.equal([2, 2])
    getNeighbor([2, 1], 240).should.deep.equal([1, 1])
    getNeighbor([2, 1], 300).should.deep.equal([1, 0])
  });
  it('should return a value even if the result is negative', () => {
    getNeighbor([0, 0], 0).should.deep.equal([0, -1])
    getNeighbor([0, 0], 60).should.deep.equal([1, -1])
    getNeighbor([0, 0], 240).should.deep.equal([-1, 0])
    getNeighbor([0, 0], 300).should.deep.equal([-1, -1])
    getNeighbor([02, 0], 0).should.deep.equal([2, -1])
  })
})

describe('getNeighborsInDirection(position, angle, length)', () => {
  it('should return false if given an invalid position, angle, or length', () => {
    getNeighborsInDirection([0, 1.5], 120).should.be.false;
    getNeighborsInDirection([0, 1], 90).should.be.false;
    getNeighborsInDirection([0, 1], 120, 0).should.be.false;
    getNeighborsInDirection([0, 0], 180, 3).should.not.be.false;
  })
  it('should return an array of the input length containing the proper positions', () => {
    let pos = [0, 0];
    let angle = 120;
    let length = 1;
    let result = getNeighborsInDirection(pos, angle, length);
    result.should.be.an.instanceof(Array);
    result.length.should.equal(1);
    result.should.deep.equal([[0, 0]])

    pos = [0, 0];
    angle = 60;
    length = 3;
    result = getNeighborsInDirection(pos, angle, length);
    result.should.be.an.instanceof(Array);
    result.length.should.equal(3);
    result.should.deep.equal([[0, 0], [1, -1], [2, -1]]);

  })
})

describe('getAllNeighbors(position)', () => {
  it('should return all neighboring tiles and their angle for the given position', () => {
    const position = [5, 5]
    const result = [
      [5, 4],
      [6, 5],
      [6, 6],
      [5, 6],
      [4, 6],
      [4, 5]
    ]
    getAllNeighbors(position).should.deep.equal(result);
  })
  it('should include negative results if appropriate', () => {
    const position = [2, 0]
    const result = [
      [2, -1],
      [3, -1],
      [3, 0],
      [2, 1],
      [1, 0],
      [1, -1]
    ]
    getAllNeighbors(position).should.deep.equal(result);
  })
})

