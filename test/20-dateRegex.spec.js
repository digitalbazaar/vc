/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();

import * as vc from '../lib/index.js';

const assertDateTime = (date, bool) =>
  vc.dateRegex.test(date).should.equal(bool);

describe('verifies XML Schema DateTime', function() {
  describe('positive', function() {
    it('should accept an ISOString', function() {
      const latest = new Date().toISOString();
      assertDateTime(latest, true);
    });
    it('should accept a date with a 4 digit year', function() {
      const latest = '2019-03-26T14:00:00Z';
      assertDateTime(latest, true);
    });
    it('should accept a date with a > 4 digit year', function() {
      assertDateTime('99999-03-26T14:00:00Z', true);
    });
    it('should accept a date with a negative 4 digit year', function() {
      assertDateTime('-9999-03-26T14:00:00Z', true);
    });
    it('should accept a date with lowercase z', function() {
      assertDateTime('2019-03-26T14:00:00z', true);
    });
    it('should accept a comma as a decimal sign', function() {
      assertDateTime('2019-03-26T14:00:00,999Z', true);
    });
    it('should accept 24:00 as an hour', function() {
      assertDateTime('2019-03-26T24:00:00Z', true);
    });
  });
  describe('negative', function() {
    it('should not accept a date with lowercase t', function() {
      assertDateTime('2019-03-26t14:00:00Z', false);
    });
    it('should not accept an invalid date', function() {
      assertDateTime('2017/09/27', false);
    });
    it('should not accept 2 digit years', function() {
      assertDateTime('17-09-27T22:07:22.563Z', false);
    });
    it('should not accept a basic ISO DateTime', function() {
      assertDateTime('20190326T1400Z', false);
    });
    it('should not accept 00 as a month', function() {
      assertDateTime('2019-00-26T14:00:00Z', false);
    });
    it('should not accept 13 as a month', function() {
      assertDateTime('2019-00-26T14:00:00Z', false);
    });
    it('should not accept 00 as a day', function() {
      assertDateTime('2019-01-00T14:00:00Z', false);
    });
    it('should not accept 32 as a day', function() {
      assertDateTime('2019-01-32T14:00:00Z', false);
    });
    it('should not accept a time past midnight', function() {
      assertDateTime('2019-03-25T24:01:00Z', false);
    });
  });
});
