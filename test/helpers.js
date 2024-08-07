/**
 * Creates an ISO DateTime skewed by a number of years
 *
 * @param {object} options - Options to use.
 * @param {Date} [options.date = new Date()] - An optional  date to use.
 * @param {number} options.skewYear - A number to skew the year.
 *
 * @returns {string} Returns an ISO DateTime String.
 */
export function createSkewedTimeStamp({date = new Date(), skewYear}) {
  date.setFullYear(date.getFullYear() + skewYear);
  const isoString = date.toISOString();
  return `${isoString.substring(0, isoString.length - 5)}Z`;
}
