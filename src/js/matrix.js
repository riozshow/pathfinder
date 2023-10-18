import { classNames, select } from './settings.js';

export class Matrix {
  constructor(wrapper, searchButton, settingsButtons) {
    this.dom = { wrapper, searchButton, settingsButtons };
    this.initMatrix();
  }

  setMatrixOptions({ size, onlyFullEdges }) {
    if (size) {
      const { x, y } = size;
      this.x = x;
      this.y = y;

      this.dom.wrapper.style.gridTemplateRows = `repeat(${x}, 1fr)`;
      this.dom.wrapper.style.gridTemplateColumns = `repeat(${y}, 1fr)`;
    }

    if (onlyFullEdges !== undefined) {
      this.onlyFullEdges = onlyFullEdges;
    }

    this.render();
    this.startDrawing();
  }

  render() {
    [...this.dom.wrapper.querySelectorAll(select.cell)].map((cell) => cell.remove());
    this.cells = [];
    for (let y = 0; y < this.y; y++) {
      for (let x = 0; x < this.x; x++) {
        const cell = new Cell(x, y);
        this.cells.push(cell);
        this.dom.wrapper.append(cell.dom);
      }
    }
    this.dom.settingsButtons.map((button) => {
      if (button.classList.contains('size')) {
        button.classList.toggle('active', button.id.includes(this.x));
      }
      if (button.id == 'matrix-full-edges') {
        button.classList.toggle('active', this.onlyFullEdges);
      }
    });
  }

  initMatrix() {
    this.initMatrixClick();
    this.initMatrixClickHover();
    this.initSearchButton();
    this.initSettingsButtons();
  }

  initSettingsButtons() {
    this.dom.settingsButtons.map((button) => {
      button.onclick = () => {
        switch (button.id) {
        case 'matrix-10': {
          this.setMatrixOptions({ size: { x: 10, y: 10 } });
          break;
        }
        case 'matrix-25': {
          this.setMatrixOptions({ size: { x: 25, y: 25 } });
          break;
        }
        case 'matrix-50': {
          this.setMatrixOptions({ size: { x: 50, y: 50 } });
          break;
        }
        case 'matrix-full-edges': {
          this.setMatrixOptions({ onlyFullEdges: !this.onlyFullEdges });
          break;
        }
        }
      };
    });
  }

  initMatrixClick() {
    this.dom.wrapper.addEventListener('click', (e) => {
      const cell = this.cells.find((cell) => cell.dom == e.target);
      if (!cell || this.found) return;

      if (!cell.isSelected) {
        this.route.length === 0 ? this.setStart(cell) : this.addToRoute(cell);
      } else {
        this.removeFromRoute(cell);
      }
      this.showAllowed();
      this.showLast();
    });
  }

  initMatrixClickHover() {
    this.dom.wrapper.addEventListener('mousedown', () => {
      this.hoverSelect = true;
    });

    this.dom.wrapper.addEventListener('mouseup', () => {
      this.hoverSelect = false;
    });

    this.dom.wrapper.addEventListener('mouseover', (e) => {
      if (!this.hoverSelect) return;
      const cell = this.cells.find((cell) => cell.dom == e.target);
      if (!cell || this.found) return;
      if (!cell.isSelected && cell.isAllowed) {
        this.route.length === 0 ? this.setStart(cell) : this.addToRoute(cell);
      } else if (!cell.isSelected && !cell.isAllowed) {
        this.findConnection(cell);
      }
      this.showAllowed();
      this.showLast();
    });
  }

  initSearchButton() {
    this.dom.searchButton.addEventListener('click', () => {
      if (!this.found) {
        this.searchRoute();
        this.dom.searchButton.innerHTML = 'Reset';
      } else {
        this.startDrawing();
        this.dom.searchButton.innerHTML = 'Finish Drawing';
      }
    });
  }

  startDrawing() {
    this.found = false;
    this.route = [];
    this.solution = {};
    this.start = null;
    this.finish = null;
    this.cells.map((cell) => cell.init());
  }

  getSurroundedCells(mainCell) {
    let surroundedCells = this.cells.filter(
      (cell) =>
        (Math.abs(mainCell.x - cell.x) === 1 && mainCell.y === cell.y) ||
        (Math.abs(mainCell.y - cell.y) === 1 && mainCell.x === cell.x)
    );

    if (!this.onlyFullEdges) {
      const cornerCells = this.cells.filter(
        (cell) => Math.abs(mainCell.x - cell.x) === 1 && Math.abs(mainCell.y - cell.y) === 1
      );
      surroundedCells.push(...cornerCells);
    }

    return surroundedCells;
  }

  showAllowed() {
    this.cells.map((cell) => cell.toggleAllow(false));
    const allowedCells = [];
    this.route.map((cell) => allowedCells.push(...this.getSurroundedCells(cell)));
    allowedCells.map((cell) => cell.toggleAllow(!cell.isSelected));
  }

  setStart(cell) {
    this.route.push(cell);
    this.start = cell;
    cell.toggleFirst(true);
  }

  addToRoute(cell) {
    if (!cell.isAllowed) return;
    this.route.push(cell);
    cell.toggleSelect(true);
  }

  removeFromRoute(mainCell) {
    if (!this.isRemovable(mainCell)) return mainCell.unableToRemove();
    this.route = this.route.filter((cell) => mainCell !== cell);
    mainCell.toggleSelect(false);
  }

  isRemovable(mainCell) {
    const chain = [this.start];
    let chainLength = 0;
    while (chain.length !== chainLength) {
      chainLength = chain.length;
      chain.map((cell) => {
        const neighbours = this.getSurroundedCells(cell).filter((cell) => cell.isSelected && cell !== mainCell);
        chain.push(...neighbours.filter((cell) => !chain.includes(cell)));
      });
    }
    return chain.length === this.route.length - 1;
  }

  showLast() {
    this.cells.map((cell) => cell.toggleLast(false));
    if (this.route.length < 1) return;
    this.finish = this.route[this.route.length - 1];
    this.route.map((cell) => cell.toggleLast(cell === this.finish));
  }

  searchRoute() {
    if (!this.start || !this.finish) return;

    let iteration = 1;
    this.propagations = { start: [[this.start]], finish: [[this.finish]] };
    const { start, finish } = this.propagations;

    while (!this.found) {
      start[iteration - 1].map((cell) => this.propagate(cell, iteration, 'start'));
      finish[iteration - 1].map((cell) => this.propagate(cell, iteration, 'finish'));
      iteration++;
    }

    const startChain = [this.solution.start];
    const finishChain = [this.solution.finish];

    while (iteration !== 1) {
      this.getShortestChain(startChain, start, iteration);
      this.getShortestChain(finishChain, finish, iteration);
      iteration--;
    }

    const route = [...startChain, ...finishChain];
    route.map((cell) => cell.toggleRoute(true));

    this.announce(route);
  }

  announce(route) {
    const event = new CustomEvent('route-found', {
      bubbles: true,
      detail: {
        route,
      },
    });

    this.dom.wrapper.dispatchEvent(event);
  }

  propagate(mainCell, iteration, propagationId) {
    mainCell.iteration = iteration;
    mainCell.propagationId = propagationId;
    this.propagations[propagationId].push([]);

    this.getSurroundedCells(mainCell)
      .filter((cell) => cell.isSelected)
      .map((cell) => {
        if (!this.found && cell.propagationId && cell.propagationId !== mainCell.propagationId) {
          this.solution[cell.propagationId] = cell;
          this.solution[mainCell.propagationId] = mainCell;
          this.found = true;
        } else if (!cell.iteration) {
          this.propagations[propagationId][iteration].push(cell);
        } else if (cell.iteration > iteration) {
          cell.iteration = iteration;
          this.propagations[propagationId][iteration].push(cell);
        }
      });
  }

  getShortestChain(chain, collection, iteration) {
    const surroundedCells = this.getSurroundedCells(chain[0]).sort((cellA, cellB) => cellA.iteration - cellB.iteration);
    for (const cell of surroundedCells) {
      if (cell.isSelected && collection[iteration - 1].includes(cell) && cell.iteration <= chain[0].iteration) {
        chain.unshift(cell);
        return;
      }
    }
  }

  findConnection(mainCell) {
    const allowedCell = this.getSurroundedCells(mainCell).find((cell) => cell.isAllowed);
    if (!allowedCell) return;
    this.addToRoute(allowedCell);
    this.addToRoute(mainCell);
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dom = document.createElement('div');
    this.dom.className = classNames.cell;
  }

  init() {
    delete this.iteration;
    delete this.propagationId;

    this.toggleFirst(false);
    this.toggleSelect(false);
    this.toggleLast(false);
    this.toggleRoute(false);

    this.toggleAllow(true);
  }

  toggleSelect(isSelected) {
    this.isSelected = isSelected;
    this.dom.classList.toggle('selected', isSelected);
  }

  toggleAllow(isAllowed) {
    this.isAllowed = isAllowed;
    this.dom.classList.toggle('allowed', isAllowed);
  }

  toggleFirst(isFirst) {
    this.toggleSelect(isFirst);
    this.dom.classList.toggle('first', isFirst);
  }

  toggleLast(isLast) {
    this.dom.classList.toggle('last', isLast);
  }

  toggleRoute(isRoute) {
    this.dom.classList.toggle('route', isRoute);
  }

  unableToRemove() {
    this.dom.classList.add('error');
    setTimeout(() => {
      this.dom.classList.remove('error');
    }, 500);
  }
}

export default Matrix;
