class Matrix {
  constructor(x, y) {
    this.body = document.createElement("div");

    this.body.className = "matrix";
    this.body.addEventListener("cell-click", (e) => {
      if (!this.isAllowed(e.detail.cell)) return;

      if (this.lastCell) {
        this.lastCell.last(false);
      }

      if (!this.isSetStart) {
        this.isSetStart = true;
        this.start = e.detail.cell;
        e.detail.cell.isStart = true;
      }

      this.lastCell = e.detail.cell;
      e.detail.cell.select();
      this.refreshAllowed();
    });

    this.body.style.gridTemplateRows = `repeat(${x}, 1fr)`;
    this.body.style.gridTemplateColumns = `repeat(${y}, 1fr)`;

    this.x = x;
    this.y = y;

    this.isSetStart = false;
    this.isSetEnd = false;

    this.cells = {};

    for (let x = 0; x < this.x; x++) {
      for (let y = 0; y < this.y; y++) {
        const cell = new Cell(x, y);
        this.cells[`${x}-${y}`] = cell;
        this.body.append(cell.body);
      }
    }
  }

  isAllowed(cell) {
    console.log(cell);
    if ((!cell.isSelected && cell.isAllowed) || !this.isSetStart) {
      return true;
    }
  }

  clearAllowed() {
    Object.values(this.cells)
      .filter((cell) => cell.isAllowed)
      .map((cell) => cell.lock());
  }

  refreshAllowed() {
    this.clearAllowed();
    const neighbours = this.getNeighbours(this.lastCell);
    neighbours.map((cell) => {
      if (!cell.isSelected) {
        cell.allow();
      }
    });
  }

  getNeighbours(cell, onlySelected) {
    const { x, y } = cell;
    const cells = [];
    for (let xN = x - 1; xN <= x + 1; xN++) {
      for (let yN = y - 1; yN <= y + 1; yN++) {
        if (xN === x && yN === y) continue;
        const neighbour = this.cells[`${xN}-${yN}`];
        if (neighbour) {
          if (onlySelected && !neighbour.isSelected) continue;
          cells.push(neighbour);
        }
      }
    }
    return cells;
  }

  done() {
    if (!this.lastCell || this.lastCell === this.start) return;
    this.clearAllowed();
    this.end = this.lastCell;
    this.isSetEnd = true;
    this.end.finish();
    this.routes = [[this.start]];
    this.findRoute(this.routes[0]);
    this.showShortestRoute();
  }

  findRoute(route) {
    if (this.shortestRoute && this.shortestRoute.length < route.length) {
      return;
    }
    const lastCell = route[route.length - 1];
    this.routes.map((otherRoute) => {
      if (otherRoute.includes(lastCell)) {
        if (route.indexOf(lastCell) > otherRoute.indexOf(lastCell)) {
          return;
        }
      }
    });
    const neighbours = this.getNeighbours(lastCell, true);
    if (route.includes(this.end)) {
      console.log(route);
      if (!this.shortestRoute) {
        this.shortestRoute = route;
      } else {
        if (route.length < this.shortestRoute.length) {
          this.shortestRoute = route;
        }
      }
      return;
    }
    if (neighbours.length === 1) {
      if (!route.includes(neighbours[0])) {
        const newRoute = [...route, neighbours[0]];
        this.routes.push(newRoute);
        this.findRoute(newRoute);
      }
    } else if (neighbours.length > 1) {
      neighbours.map((cell) => {
        if (!route.includes(cell)) {
          const cellNeighbours = this.getNeighbours(cell);
          const newNeighbours = cellNeighbours.filter((neighbour) => {
            if (!neighbours.includes(neighbour)) {
              return neighbour;
            }
          });

          if (newNeighbours.length > 0) {
            const nextNeighbours = newNeighbours.filter((neighbour) => {
              const nNeighbours = this.getNeighbours(neighbour);
              if (!nNeighbours.includes(neighbour)) {
                return neighbour;
              }
            });
            if (newNeighbours > 0) {
              const newRoute = [...route, cell];
              this.routes.push(newRoute);
              this.findRoute(newRoute);
            }
          }
        }
      });
    }
  }

  showShortestRoute() {
    const alts = this.routes.filter(
      (route) =>
        route.includes(this.end) &&
        route.length === this.shortestRoute.length &&
        route !== this.shortestRoute
    );
    this.shortestRoute.map((cell) => {
      cell.route();
    });
    console.log(this.routes);
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.body = document.createElement("div");
    this.body.className = "cell";
    this.body.onclick = () => {
      const event = new CustomEvent("cell-click", {
        detail: {
          cell: this,
        },
        bubbles: true,
      });
      this.body.dispatchEvent(event);
    };
    this.isSelected = false;
    this.isAllowed = false;
  }

  select() {
    if (!this.isSelected) {
      this.isSelected = true;
      this.body.classList.add("selected");

      if (this.isStart) {
        this.body.classList.add("start");
      } else {
        this.body.classList.add("last");
      }

      this.isAllowed = false;
      this.body.classList.remove("allowed");
    }
  }

  allow() {
    if (!this.isAllowed) {
      this.isAllowed = true;
      this.body.classList.add("allowed");
    }
  }

  last(isLast) {
    if (!isLast) {
      this.body.classList.remove("last");
    }
  }

  lock() {
    if (this.isAllowed) {
      this.isAllowed = false;
      this.body.classList.remove("allowed");
    }
  }

  finish() {
    if (this.isSelected) {
      this.isSelected = true;
      this.isAllowed = false;
      this.body.classList.add("finish");
    }
  }

  route() {
    this.body.classList.add("route");
  }
}
