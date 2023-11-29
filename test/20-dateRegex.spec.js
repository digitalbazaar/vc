/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();

import * as vc from '../lib/index.js';

describe('verifies RFC3339 Dates', function() {
  it('should verify a valid date', function() {
    const latest = new Date().toISOString();
    vc.dateRegex.test(latest).should.be.true;
  });
  it('should verify a date with lowercase time designator', function() {
    const valid = '2019-03-26t14:00Z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should verify a date with lowercase UTC designator', function() {
    const valid = '2019-03-26T14:00z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should not verify a date that uses / as a separator', function() {
    const invalid = '2017/09/27';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify 2 digit years', function() {
    const invalid = '17-09-27T22:07:22.563z';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify 1 digit months', function() {
    const invalid = '2017-9-27T22:07:22.563z';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should verify 2 digit months starting with 0', function() {
    const valid = '2017-09-27T22:07:22.563z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should not verify 1 digit days', function() {
    const invalid = '2017-9-7T22:07:22.563z';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should verify 2 digit days starting with 0', function() {
    const valid = '2017-12-07T22:07:22.563z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should not verify comma separators', function() {
    const invalid = '2019-03-26T14:00:00,999Z';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify an ISO 8601 date with hours only offset', function() {
    const invalid = '2019-03-26T10:00-04';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify an ISO 8601 date with fractional minutes', function() {
    const invalid = '2019-03-26T14:00.9Z';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should verify leap seconds', function() {
    const valid = '1972-06-30T23:59:60Z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should verify single digit fractional seconds', function() {
    const valid = '2019-03-26T14:00:00.9Z';
    vc.dateRegex.test(valid).should.be.true;
  });
  it('should verify multi-digit fractional seconds', function() {
    const valid = '2019-03-26T14:00:00.4999Z';
    vc.dateRegex.test(valid).should.be.true;
  });
});
