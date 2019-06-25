const util = require('../lib/util');
const {expect} = require('chai');

describe('unit tests for util.js', function() {
  describe('clone', function() {
    it('should clone a number', function() {
      const result = util.clone(5);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.equal(5);
    });
    it('should clone an Object', function() {
      const obj = {num: 5, bool: false, func: () => 1};
      const result = util.clone(obj);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.deep.equal(obj);
    });
  });
});
