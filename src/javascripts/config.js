import reset from '../stylesheets/reset.css';
import style from '../stylesheets/config.css';

import GithubApi from './api.js';

class DashboardBuilder {
  constructor() {
    this.getDataFromToken = this.debounce(() => {
      this.cleanData();
      this.initApi();
    }, 500);

    //this.start();
  }

  start() {
    this.tokenListener();
  }

  tokenListener() {
    this.token = null;
    const t = document.querySelector('#dashboard-token');
    t.addEventListener('input', e => {
      if (!e.target.value) {
        return;
      }
      this.token = e.target.value;
      this.getDataFromToken();
    });
  }

  cleanData() {
    this.api = null;
    this.orgsDom = null;
  }

  async initApi() {
    this.orgs = [];
    try {
      // loading todo
      this.api = new GithubApi({ token: this.token });
      this.orgs = await this.api.getAvailableOrgs();
    } catch (e) {
      console.log('token not valid');
      return;
    }

    // we show list
    this.handleOrgsList();
  }

  handleOrgsList() {
    this.selectedOrg = null;
    this.orgsDom = document.querySelector('#orgs-list');
    this.orgs.forEach(o => {
      const html = `<div class='org' id='${o.login}'>${o.login} <img src='${o.avatar_url}'></div>`;
      this.orgsDom.insertAdjacentHTML('beforeend', html);
    });

    this.orgsDom.addEventListener('click', e => {
      // if we click on an org
      if (e.target.classList.contains('org')) {
        console.log(e.target);
        // we select it
        this.selectedOrg = e.target.id;
        e.target.classList.add('selected');
      }
    });
  }

  generateUrl() {
    //todo
  }

  debounce(fn, time) {
    let timeout;

    return function() {
      const functionCall = () => fn.apply(this, arguments);

      clearTimeout(timeout);
      timeout = setTimeout(functionCall, time);
    };
  }
}

const app = new DashboardBuilder();
