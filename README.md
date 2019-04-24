# issues-danmuku

Use the Github Issues API as a danmuku

## Install

Install with `npm`

```
$ npm install issues-danmuku
```

Or install with `yarn`

```
$ yarn add issues-danmuku
```

```js
import IssuesDanmuku from 'issues-danmuku';
```

Or umd builds are also available

```html
<script src="path/to/issues-danmuku.js"></script>
```

Will expose the global variable to `window.IssuesDanmuku`.

## Usage

```js
// Instantiation
var danmuku = new IssuesDanmuku({
  api: '',
  clientID: '',
  clientSecret: ''
});

// Login
danmuku.login();

// Logout
danmuku.logout();

// Send danmu
danmuku
  .send({
    //
  })
  .then(data => {
    console.log(data);
  });

// Cache the danmu
danmuku.cache().then(danmus => {
  console.log(danmus);
});

// Cache the danmu
danmuku.cache().then(danmus => {
  console.log(danmus);
});

// Get the DB
this.db;
```

## License

MIT © [Harvey Zack](https://sleepy.im/)
