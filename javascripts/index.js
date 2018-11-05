// we get url params
class DashboardApp {
  constructor() {
    this.error = document.querySelector('#error');
    this.loading = document.querySelector('#loading');
    this.container = document.querySelector('#container');
    this.refreshInterval = 15; // 15 seconds

    this.start();
  }

  getUrlParams() {
    this.url = new URL(window.location.href);
    this.token = this.url.searchParams.get('token');
    this.org = this.url.searchParams.get('org');
    this.repos = this.url.searchParams.get('repos');
    this.users = this.url.searchParams.get('users');

    this.repos = !!this.repos ? this.repos.split(',') : null;
    this.users = !!this.users ? this.users.split(',') : null;

    //console.log(token, org, repos, users);

    if (!this.token || !this.org || !this.repos || !this.users) {
      this.showError(
        'Missing parameters. You need to define `token`, `org`, `repos` and `users`'
      );
      return false;
    }
    return true;
  }

  showError(message) {
    this.error.textContent = message;
    this.error.classList.remove('d-none');
  }
  hideError() {
    this.error.classList.add('d-none');
    this.error.textContent = '';
  }

  loadingState() {
    this.hideError();
    document.querySelectorAll('.pr').forEach(e => e.parentNode.removeChild(e));
    this.loading.classList.remove('d-none');
  }

  start() {
    // we get params
    if (!this.getUrlParams()) {
      return;
    }

    // init api
    this.api = new GithubApi({ token: this.token });

    this.interval = setInterval(() => {
      this.getData();
    }, this.refreshInterval * 1000);

    this.getData();
  }

  async getData() {
    this.loadingState();
    this.prs = [];
    for (const repo of this.repos) {
      let prs = await this.getPrsForRepo(repo);
      // we filter by users
      prs = prs.filter(pr => this.users.includes(pr.user.login));
      // we get the reviews
      for (const pr of prs) {
        const reviews = await this.getReviewsForPr(repo, pr.number);
        this.prs.push({
          repo,
          title: pr.title,
          reviews: reviews.map(r => r.user.avatar_url),
          creator: pr.user.avatar_url
        });
      }
    }
    this.showData();
  }

  async getPrsForRepo(repo) {
    let prs = [];
    try {
      prs = await this.api.get(`/repos/${this.org}/${repo}/pulls`);
    } catch (e) {
      console.log('error', e);
    }

    return prs;
  }

  async getReviewsForPr(repo, pr) {
    let reviews = [];
    try {
      reviews = await this.api.get(
        `/repos/${this.org}/${repo}/pulls/${pr}/reviews`
      );
    } catch (e) {
      console.log('error', e);
    }

    return reviews;
  }

  showData() {
    this.loading.classList.add('d-none');
    this.prs.forEach(pr => {
      const html = `<div class="pr">
        <span class="pr-project">${pr.repo}</span>
        <span class="pr-title">${pr.title}</span>
        <span class="pr-review">${pr.reviews.length} reviews</span>
        <img class="pr-creator" src="${pr.creator}">
      </div>`;

      this.container.insertAdjacentHTML('beforeend', html);
    });
  }
}

const app = new DashboardApp();
