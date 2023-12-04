export function createTimeStamp({date}) {
  const isoString = date.toISOString();
  // remove the milliseconds from the iso time stamp
  return isoString.substr(0, isoString.length - 5) + 'Z';
}
