/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();

import * as vc from '../lib/index.js';

const assertDateTime = (date, bool) =>
  vc.dateRegex.test(date).should.equal(bool);

describe('verifies XML Schema Dates', function() {
  it('verify a valid date', function() {
    const latest = new Date().toISOString();
    assertDateTime(latest, true);
  });
  it('does not verify a valid date with lowercase t', function() {
    const latest = new Date().toISOString().toLowerCase();
    assertDateTime(latest, false);
  });

  it('should not verify an invalid date', function() {
    assertDateTime('2017/09/27', false);
  });
  it('should not verify 2 digit years', function() {
    assertDateTime('17-09-27T22:07:22.563Z', false);
  });
});
