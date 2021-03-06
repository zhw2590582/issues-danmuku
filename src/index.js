import {
  queryStringify,
  getURLParameters,
  throwError,
  getStorage,
  setStorage,
  cleanStorage
} from './utils';

export default class IssuesDanmuku {
  constructor(options) {
    this.options = Object.assign({}, IssuesDanmuku.DEFAULT, options);
    this.limit = 0;
    this.remaining = 0;
    this.userInfo = null;
    this.token = null;
    this.isLogin = false;
    this.init();
  }

  static get DEFAULT() {
    return {
      api: '',
      clientID: '',
      clientSecret: '',
      perPage: 1000,
      proxy:
        'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token'
    };
  }

  async init() {
    const { code } = getURLParameters();
    if (code) {
      const data = await this.getToken(code);
      throwError(data.access_token, 'Can not get token, Please login again!');
      setStorage('token', data.access_token);
      const userInfo = await this.getUserInfo(data.access_token);
      throwError(userInfo.id, 'Can not get user info, Please login again!');
      setStorage('userInfo', userInfo);
      const redirect_uri = getStorage('redirect_uri');
      throwError(redirect_uri, 'Can not get redirect url, Please login again!');
      window.history.replaceState(null, '', redirect_uri);
    }

    this.userInfo = getStorage('userInfo');
    this.token = getStorage('token');
    this.isLogin = !!this.userInfo && !!this.token;
  }

  login() {
    cleanStorage();
    setStorage('redirect_uri', window.location.href);
    window.location.href = `http://github.com/login/oauth/authorize?${queryStringify(
      {
        state: 'issues-danmuku',
        client_id: this.options.clientID,
        redirect_uri: window.location.href,
        scope: 'public_repo'
      }
    )}`;
  }

  logout() {
    cleanStorage();
    window.location.reload();
  }

  async request(method, url, body) {
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
        return Promise.reject(new Error('Unauthorized'));
      } else if (res.status === 401) {
        await cleanStorage();
        return window.location.reload();
      } else {
        this.limit = Number(res.headers.get('X-RateLimit-Limit'));
        this.remaining = Number(res.headers.get('X-RateLimit-Remaining'));
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
      redirect_uri: window.location.href
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

  async load() {
    const result = await this.request(
      'get',
      `https://api.github.com/repos/${
        this.options.api
      }/comments?${queryStringify(
        this.urlQuery({
          per_page: this.options.perPage,
          page: 1
        })
      )}`
    );
    throwError(
      Array.isArray(result),
      'Can not get the danmuku, Please try again!'
    );
    return result.map(item => {
      const body = JSON.parse(item.body);
      return {
        id: item.id,
        ...body
      };
    });
  }

  async send(danmu = {}) {
    const query = this.urlQuery({
      body: JSON.stringify(danmu)
    });
    let data = await this.request(
      'post',
      `https://api.github.com/repos/${this.options.api}/comments`,
      query
    );
    throwError(data.id, 'Can not send the danmu, Please try again!');
    return JSON.parse(data.body);
  }
}
