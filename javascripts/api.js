class GithubApi {
  constructor(opts) {
    this.instance = axios.create({
      baseURL: 'https://api.github.com/',
      timeout: 1000,
      headers: {
        'content-type': 'application/json',
        Authorization: 'token ' + opts.token
      }
    });
  }
  get(path) {
    return this.instance({
      method: 'get',
      url: path
    })
      .then(result => {
        return result.data;
      })
      .catch(error => {
        throw error;
      });
  }
}
