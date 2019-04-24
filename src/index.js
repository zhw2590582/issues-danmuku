import localStorage from 'localforage';
import { queryStringify, getURLParameters, throwError, danmuFormat } from './utils';

localStorage.config({
  driver: [
    localStorage.WEBSQL,
    localStorage.INDEXEDDB,
    localStorage.LOCALSTORAGE
  ],
  name: 'issues-danmuku'
});

export default class IssuesDanmuku {
  constructor(options) {
    this.options = Object.assign({}, IssuesDanmuku.DEFAULT, options);
    this.init();
  }

  static get localStorage() {
    return localStorage;
  }

  static get DEFAULT() {
    return {
      api: '',
      clientID: '',
      clientSecret: '',
      perPage: 100,
      proxy:
        'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token'
    };
  }

  async init() {
    this.userInfo = await localStorage.getItem('userInfo');
    this.token = await localStorage.getItem('token');
    this.isLogin = !!this.userInfo && !!this.token;
    const { code } = getURLParameters();
    if (code) {
      const data = await this.getToken(code);
      throwError(data.access_token, 'Can not get token, Please login again!');
      await localStorage.setItem('token', data.access_token);
      const userInfo = await this.getUserInfo(data.access_token);
      throwError(userInfo.id, 'Can not get user info, Please login again!');
      await localStorage.setItem('userInfo', userInfo);
      const redirect_uri = await localStorage.getItem('redirect_uri');
      throwError(redirect_uri, 'Can not get redirect url, Please login again!');
      window.history.replaceState(null, '', redirect_uri);
    }
  }

  async oauth() {
    await localStorage.setItem('redirect_uri', window.location.href);
    window.location.href = `http://github.com/login/oauth/authorize?${queryStringify(
      {
        state: 'issues-danmuku',
        client_id: this.options.clientID,
        redirect_uri: window.location.href,
        scope: 'public_repo'
      }
    )}`;
  }

  async request(method, url, body) {
    if (!this.isLogin) {
      this.oauth();
      return;
    }
    method = method.toUpperCase();
    body = body && JSON.stringify(body);
    let headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body
      });
      if (res.status === 404) {
        return Promise.reject('Unauthorized.');
      } else if (res.status === 401) {
        return localforage.clear().then(window.location.reload);
      } else {
        return res.json();
      }
    } catch (err) {
      console.warn(err, url);
    }
  }

  urlQuery(options) {
    return {
      client_id: this.options.clientID,
      client_secret: this.options.clientSecret,
      t: Date.now(),
      ...options
    };
  }

  getToken(code) {
    const query = this.urlQuery({
      code,
      redirect_uri: location.href
    });
    return this.request(
      'get',
      `${this.options.proxy}?${queryStringify(query)}`
    );
  }

  getUserInfo(token) {
    return this.request(
      'get',
      `https://api.github.com/user?access_token=${token}`
    );
  }

  async send(msg, videoTime = 0) {
    const query = this.urlQuery({
      body: JSON.stringify({
        sendTime: Date.now(),
        user: this.userInfo.login,
        videoTime,
        msg
      })
    });
    let data = await this.request(
      'post',
      `https://api.github.com/repos/${this.options.api}/comments`,
      query
    );
    throwError(data.id, 'Can not send the danmu, Please try again!');
    return danmuFormat(data);
  }

  async get() {
    let result = [];
    let page = 1;
    while (true) {
      const list = await this.request(
        'get',
        `https://api.github.com/repos/${
          this.options.api
        }/comments?${queryStringify(
          this.urlQuery({
            per_page: this.options.perPage,
            page: page++
          })
        )}`
      );
      throwError(
        Array.isArray(list),
        'Can not get the danmuku, Please try again!'
      );
      result = [...result, ...list];
      if (list.length < this.options.perPage) {
        return danmuFormat(result);
      }
    }
  }
}
