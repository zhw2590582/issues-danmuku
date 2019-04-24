export function queryStringify(query) {
  const queryString = Object.keys(query)
    .map(key => `${key}=${window.encodeURIComponent(query[key] || '')}`)
    .join('&');
  return queryString;
}

export function getURLParameters() {
  var url = window.location.href;
  return (url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(function(a, v) {
    return (a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1)), a;
  }, {});
}

export function throwError(condition, msg, callback) {
  if (!condition) {
    callback && callback();
    tip(msg);
    throw new Error(`Gitting Error: ${msg}`);
  }
}

export function danmuFormat(danmu) {
  if (Array.isArray(danmu)) {
    return danmu.map(danmuFormat);
  }
  return danmu;
}
