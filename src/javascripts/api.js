import Octokit from '@octokit/rest';

class GithubApi {
  constructor(opts) {
    this.api = Octokit();

    this.api.authenticate({
      type: 'token',
      token: opts.token
    });

    this.org = opts.org;
  }

  getFilteredData(data, predicate, time) {
    const newData = data.filter(item => {
      const itemDate = Date.parse(item[predicate]);
      return itemDate > time;
    });

    const sameData = data.length === newData.length;

    return [newData, sameData];
  }

  async paginate(method, params, limitPredicate, limitTime) {
    let next = true;
    let response = await method(params);
    let { data } = response;

    if (!!limitPredicate && !!limitTime) {
      [data, next] = this.getFilteredData(data, limitPredicate, limitTime);
    }

    while (this.api.hasNextPage(response) && next) {
      response = await this.api.getNextPage(response);
      let newData = null;
      if (!!limitPredicate && !!limitTime) {
        [newData, next] = this.getFilteredData(
          response.data,
          limitPredicate,
          limitTime
        );
      }

      data = data.concat(newData);
    }
    return data;
  }

  async getOpenPrs(repo) {
    const params = {
      owner: this.org,
      repo,
      state: 'open'
    };

    const prs = await this.paginate(this.api.pullRequests.getAll, params);

    return prs;
  }

  async getClosedPrsLastWeek(repo) {
    const params = {
      owner: this.org,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 50
    };

    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const prs = await this.paginate(
      this.api.pullRequests.getAll,
      params,
      'closed_at',
      lastWeek
    );

    return prs;
  }

  async getPrDetails(repo, number) {
    const pr = await this.api.pullRequests.get({
      owner: this.org,
      repo,
      number
    });

    return pr.data;
  }

  async getPrReviews(repo, number) {
    const params = {
      owner: this.org,
      repo,
      number
    };

    const reviews = await this.paginate(
      this.api.pullRequests.getReviews,
      params
    );

    return reviews;
  }

  async getPrMergeStatus(repo, number) {
    let result = null;
    try {
      result = await this.api.pullRequests.checkMerged({
        owner: this.org,
        repo,
        number
      });
    } catch (e) {
      // do nothing
    }

    return result && result.status === 204;
  }

  async getUser(user) {
    const result = await this.api.users.getForUser({ username: user });

    return result.data;
  }
}

export default GithubApi;
