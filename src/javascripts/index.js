import style from '../stylesheets/design.css';

import GithubApi from './api.js';
import { RSA_PKCS1_OAEP_PADDING } from 'constants';

// we get url params
class DashboardApp {
  constructor() {
    this.error = document.querySelector('#error');
    this.loading = document.querySelector('#loading');
    this.container = document.querySelector('#container');
    this.titleDom = document.querySelector('#title');
    this.mergedDom = document.querySelector('#opened-prs > span');
    this.refusedDom = document.querySelector('#refused-prs > span');
    this.averageDom = document.querySelector('#days-to-merge > span');
    this.membersDom = document.querySelector('#members');
    this.refreshInterval = 120;

    this.start();
  }

  parse_query_string(query) {
    var vars = query.split('&');
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof query_string[key] === 'undefined') {
        query_string[key] = decodeURIComponent(value);
        // If second entry with this name
      } else if (typeof query_string[key] === 'string') {
        var arr = [query_string[key], decodeURIComponent(value)];
        query_string[key] = arr;
        // If third or later entry with this name
      } else {
        query_string[key].push(decodeURIComponent(value));
      }
    }
    return query_string;
  }

  getUrlParams() {
    const params = this.parse_query_string(window.location.search.substring(1));
    this.token = params.token;
    this.org = params.org;
    this.repos = params.repos;
    this.users = params.users;
    this.filters = params.filters;
    this.title = params.title;

    this.repos = !!this.repos ? this.repos.split(',') : null;
    this.users = !!this.users ? this.users.split(',') : null;
    this.filters = !!this.filters ? this.filters.split(',') : [];

    if (!this.token || !this.org || !this.repos || !this.users) {
      this.showError(
        'Missing parameters. You need to define `token`, `org`, `repos` and `users`.'
      );
      return false;
    }
    return true;
  }

  showError(message) {
    this.loading.classList.add('d-none');
    this.error.textContent = message;
    this.error.classList.remove('d-none');
    this.container.classList.add('hide-pr');
  }
  hideError() {
    this.error.classList.add('d-none');
    this.error.textContent = '';
    this.container.classList.remove('hide-pr');
  }

  loadingState() {
    this.hideError();
    document.querySelectorAll('.pr').forEach(e => e.parentNode.removeChild(e));
    this.loading.classList.remove('d-none');
  }

  async start() {
    // we get params
    if (!this.getUrlParams()) {
      return;
    }

    if (!!this.title) {
      this.titleDom.textContent = this.title;
    }

    // init api
    this.api = new GithubApi({ token: this.token, org: this.org });

    this.interval = setInterval(() => {
      this.getData();
    }, this.refreshInterval * 1000);

    // user pictures
    this.usersData = [];
    const uPromises = this.users.map(async u => {
      const userData = await this.api.getUser(u);
      this.usersData.push(userData);
    });
    await Promise.all(uPromises);

    this.showUsers();

    // all data
    this.getData();
  }

  async getData() {
    this.loadingState();
    this.prs = [];
    this.closedPrs = [];
    this.lwOpened = 0;
    this.lwRefused = 0;
    this.lwAverage = 0;

    const prPromises = this.repos.map(async repo => {
      // we get prs
      let openPrs = await this.api.getOpenPrs(repo);
      let closedPrs = await this.api.getClosedPrsLastWeek(repo);

      // we filter by users
      openPrs = openPrs.filter(pr => {
        // remove prs without user
        if (!this.users.includes(pr.user.login)) {
          return false;
        }
        // remove prs that have a filtered tag
        const labels = pr.labels.map(l => l.name);
        if (labels.find(l => this.filters.includes(l))) {
          return false;
        }
        return true;
      });

      // we filter by users
      closedPrs = closedPrs.filter(pr => {
        // remove prs without user
        if (!this.users.includes(pr.user.login)) {
          return false;
        }
        return true;
      });

      // we get the details

      const openPromises = openPrs.map(async pr => {
        const prDetails = await this.api.getPrDetails(repo, pr.number);

        this.prs.push({
          repo,
          title: pr.title,
          number: pr.number,
          comments: prDetails.comments,
          mergeable: prDetails.mergeable,
          creator: pr.user.avatar_url
        });
      });

      const closedPromises = closedPrs.map(async pr => {
        const isMerged = await this.api.getPrMergeStatus(repo, pr.number);

        this.closedPrs.push({
          closed_at: pr.closed_at,
          created_at: pr.created_at,
          is_merged: isMerged
        });
      });
      await Promise.all(openPromises.concat(closedPromises));
    });

    await Promise.all(prPromises);

    const mergedPrs = this.closedPrs.filter(pr => !!pr.is_merged);

    this.lwOpened = mergedPrs.length;
    this.lwRefused = this.closedPrs.length - this.lwOpened;

    this.calculateAverageMergeTime();

    this.showData();
  }

  calculateAverageMergeTime() {
    let totalTime = 0;

    this.closedPrs.forEach(pr => {
      totalTime += Date.parse(pr.closed_at) - Date.parse(pr.created_at);
    });
    // average time in ms
    this.lwAverage = totalTime / this.closedPrs.length;

    // average time in hours
    this.lwAverage = Math.round(this.lwAverage / 1000 / 60 / 60);
  }

  showData() {
    this.loading.classList.add('d-none');
    this.mergedDom.textContent = this.lwOpened;
    this.refusedDom.textContent = this.lwRefused;
    this.averageDom.textContent = this.lwAverage;
    this.prs.forEach(pr => {
      const html = `<div class="pr" id="${pr.repo}-${pr.number}">
        <img class="pr-creator" src="${pr.creator}">
        <span class="pr-project">${pr.repo}</span>
        <span class="pr-title"><span>#${pr.number}</span>${pr.title}</span>
        <span class="pr-comments">${pr.comments} comments</span>
        <span class="pr-mergeable">${pr.mergeable ? '👍' : '👎'}</span>
      </div>`;

      this.container.insertAdjacentHTML('beforeend', html);
    });
  }

  showUsers() {
    this.usersData.forEach(u => {
      const html = `<img class="team-member" src="${u.avatar_url}">`;
      this.membersDom.insertAdjacentHTML('beforeend', html);
    });
  }
}

const app = new DashboardApp();
