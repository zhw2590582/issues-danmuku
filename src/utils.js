const storageName = 'danmuku_settings';

export function getStorage(key) {
  const storage = JSON.parse(window.localStorage.getItem(storageName)) || {};
  return key ? storage[key] : storage;
}

export function setStorage(key, value) {
  const storage = Object.assign({}, getStorage(), {
    [key]: value
  });
  return window.localStorage.setItem(storageName, JSON.stringify(storage));
}

export function cleanStorage() {
  return window.localStorage.removeItem(storageName);
}

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
    throw new Error(`Danmuku Error: ${msg}`);
  }
}
