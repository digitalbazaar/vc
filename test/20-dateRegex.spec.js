/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
chai.should();

import * as vc from '../lib/index.js';

const assertValid = date => vc.dateRegex.test(date).should.be.true;
const assertInvalid = date => vc.dateRegex.test(date).should.be.false;

describe('verifies RFC3339 Dates', function() {
  describe('positive', function() {
    it('should verify a valid date', function() {
      const latest = new Date().toISOString();
      assertValid(latest);
    });
    it('should verify a date with year 0000', function() {
      assertValid('0000-01-01T09:37:45Z');
    });
    it('should verify a date with year 9999', function() {
      assertValid('9999-01-01T09:37:45Z');
    });
    it('should verify a date with lowercase time designator', function() {
      assertValid('2019-03-26t14:00:15Z');
    });
    it('should verify a date with lowercase UTC designator', function() {
      assertValid('2019-03-26T14:00:36z');
    });
    it('should verify 2 digit months starting with 0', function() {
      assertValid('2017-09-27T22:07:22.563z');
    });
    it('should verify 2 digit days starting with 0', function() {
      assertValid('2017-12-07T22:07:22.563z');
    });
    it('should verify leap seconds', function() {
      assertValid('1972-06-30T23:59:60Z');
    });
    it('should verify single digit fractional seconds', function() {
      assertValid('2019-03-26T14:00:00.9Z');
    });
    it('should verify multi-digit fractional seconds', function() {
      assertValid('2019-03-26T14:00:00.4999Z');
    });
    it('should verify leap days', function() {
      assertValid('2024-02-29T14:00:00z');
    });
  });
  describe('negative', function() {
    it('should not verify a date that uses "/" as a separator', function() {
      assertInvalid('2017/09/27');
    });
    it('should not verify 2 digit years', function() {
      assertInvalid('17-09-27T22:07:22.563z');
    });
    it('should not verify > 4 digit years', function() {
      assertInvalid('99999-09-27T22:07:22.563z');
    });
    it('should not verify 1 digit months', function() {
      assertInvalid('2020-9-27T22:07:22.563z');
    });
    it('should not verify 1 digit days', function() {
      assertInvalid('2017-9-7T22:07:22.563z');
    });
    it('should not verify comma separators', function() {
      assertInvalid('2019-03-26T14:00:00,999Z');
    });
    it('should not verify an ISO 8601 date with hours only offset', function() {
      assertInvalid('2019-03-26T10:00-04');
    });
    it('should not verify an ISO 8601 date with fractional minutes',
      function() {
        assertInvalid('2019-03-26T14:00.9Z');
      });
    it('should not verify a day greater than 31 in a month', function() {
      assertInvalid('2017-03-32T15:00:15Z');
    });
    it('should not verify a month greater than 12 in a year', function() {
      assertInvalid('2017-13-22T15:00:15Z');
    });
    it('should not verify an hour greater than 23', function() {
      assertInvalid('2017-10-22T24:00:15Z');
    });
    it('should not verify minutes greater than 59', function() {
      assertInvalid('2017-10-22T15:75:15Z');
    });
    it('should not verify seconds greater than 59', function() {
      assertInvalid('2017-10-22T15:15:65Z');
    });
    it('should not verify if no digits after decimal sign', function() {
      assertInvalid('2019-03-26T14:00:00.');
    });
  });
});
