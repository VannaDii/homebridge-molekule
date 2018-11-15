function timeSpanString(date1, date2) {
  return Array(3)
    .fill([3600, Math.abs(date1.getTime() - date2.getTime())])
    .map((v, i, a) => {
      a[i + 1] = [a[i][0] / 60, ((v[1] / (v[0] * 1000)) % 1) * (v[0] * 1000)];
      return Array(255)
        .fill('0')
        .concat(`${Math.floor(v[1] / (v[0] * 1000))}`.split(''))
        .map((c, ci, ca) => {
          return c !== '0' || ci >= ca.length - 2 ? c : '';
        })
        .join('');
    })
    .join(':');
}

function isEmptyOrUndef(value) {
  return value === undefined || value === null || value === '';
}

function toTitleCase(value, space = false) {
  return Array.from(value[0].toUpperCase() + value.substr(1))
    .map((c) => (space && c === c.toUpperCase() ? ' ' + c : c))
    .join('')
    .trim();
}

module.exports = {
  toTitleCase,
  timeSpanString,
  isEmptyOrUndef,
};
