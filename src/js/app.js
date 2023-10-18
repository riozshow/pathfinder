import Matrix from './matrix.js';
import { select, classNames } from './settings.js';

const App = {
  initElements: function () {
    this.dom = {};
    this.dom.tabs = [...document.querySelectorAll(select.tabs)];
    this.dom.pages = [...document.querySelectorAll(select.pages)];
    this.dom.matrix = document.querySelector(select.matrix);
    this.dom.doneButton = document.querySelector(select.done);
    this.dom.matrixSettingsButtons = [...document.querySelectorAll(select.matrixSettings)];
    this.dom.modal = document.querySelector(select.modal);
    this.dom.modalClose = document.querySelector(select.modalClose);
  },

  initRouting: function () {
    this.dom.tabs.map((tab) => {
      tab.onclick = () => {
        const tabId = tab.href.split('#')[1];
        this.dom.tabs.map((tab) => tab.classList.toggle(classNames.tabActive, tabId == tab.href.replace('#', '')));
        this.dom.pages.map((page) =>
          page.classList.toggle(classNames.pageActive, tabId == page.getAttribute('pageid'))
        );
      };
    });

    const pageId = window.location.hash.replace('#/', '');
    const activeTab = this.dom.tabs.find((tab) => tab.href == `#${pageId}`);
    activeTab ? activeTab.click() : this.dom.tabs[0].click();
  },

  initModal: function () {
    document.body.addEventListener('route-found', (e) => {
      this.dom.modal.classList.add('active');
      const { route } = e.detail;
      this.dom.modal.querySelector('h4').innerHTML = `SHORTEST ROUTE: ${route.length} steps`;
    });

    this.dom.modalClose.onclick = () => this.dom.modal.classList.remove('active');
  },

  initMatrix: function () {
    this.matrix = new Matrix(this.dom.matrix, this.dom.doneButton, this.dom.matrixSettingsButtons);
    this.matrix.setMatrixOptions({ size: { x: 25, y: 25 }, onlyFullEdges: true });
  },

  init: function () {
    this.initElements();
    this.initRouting();
    this.initMatrix();
    this.initModal();
  },
};

App.init();
