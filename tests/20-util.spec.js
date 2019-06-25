const util = require('../lib/util');
const {expect} = require('chai');

describe('unit tests for util.js', function() {
  describe('clone', function() {
    it('should clone a number', function() {
      const value = 5;
      const result = util.clone(value);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.equal(value);
    });
    it('should clone a string', function() {
      const value = 'string!';
      const result = util.clone(value);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.equal(value);
    });
    it('should clone an Object', function() {
      const obj = {num: 5, bool: false, func: () => 1};
      const result = util.clone(obj);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.deep.equal(obj);
      expect(obj === result, 'Expected different references').to.be.false;
    });
    it('should clone an Array', function() {
      const obj = [5, 'cloned', true, {deep: {deep: 'deeper!'}}];
      const result = util.clone(obj);
      expect(result).to.not.be.undefined;
      expect(result).to.not.be.null;
      expect(result).to.deep.equal(obj);
      expect(obj === result, 'Expected different references').to.be.false;
    });
  });
});
