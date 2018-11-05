class GithubApi {
  constructor(opts) {
    this.apiUrl = 'https://api.github.com';
    this.headers = new Headers({ 'content-type': 'application/json' });
    this.setToken(opts.token);
  }

  setToken(token) {
    this.token = token;
    this.headers.set('Authorization', 'token ' + token);
  }

  query(path, method, args) {
    return fetch(this.apiUrl + path, {
      method,
      headers: this.headers,
      body: JSON.stringify(args)
    }).then(result => {
      if (!result.ok) {
        throw result;
      }
      return result.json();
    });
  }

  get(path) {
    return this.query(path, 'GET');
  }

  post(path, args) {
    return this.query(path, 'POST', args);
  }
}
