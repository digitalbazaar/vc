/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
 */
const chai = require('chai');
chai.should();

const vc = require('..');

describe('verifies RFC3339 Dates', function() {
  it('verify a valid date', function() {
    const latest = new Date().toISOString();
    vc.dateRegex.test(latest).should.be.true;
  });
  it('verify a valid date with lowercase t', function() {
    const latest = new Date().toISOString().toLowerCase();
    vc.dateRegex.test(latest).should.be.true;
  });

  it('should not verify an invalid date', function() {
    const invalid = '2017/09/27';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify 2 digit years', function() {
    const invalid = '17-09-27T22:07:22.563z';
    vc.dateRegex.test(invalid).should.be.false;
  });
});
