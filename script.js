const rows = 20;
const cols = 30;
const container = document.getElementById('grid-container');

let startCell = null;
let endCell = null;

function createGrid() {
  container.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      const randomWeight = Math.floor(Math.random() * 9) + 1;
      cell.dataset.weight = randomWeight;
      cell.textContent = randomWeight; // Optional: to display weight

      cell.addEventListener('click', () => handleCellClick(cell));
      container.appendChild(cell);
    }
  }
  addHoverEvents(); // 👈 Add hover events after grid is built
}
function generateWeights() {
  document.querySelectorAll('.cell').forEach(cell => {
    if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
      const randomWeight = Math.floor(Math.random() * 9) + 1;
      cell.dataset.weight = randomWeight;
      cell.textContent = randomWeight; // Optional: to show the weight
    }
  });
}


function addHoverEvents() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      if (selectionStage === 0 && cell !== endCell) {
        cell.classList.add('hover-start');
      } else if (selectionStage === 1 && cell !== startCell) {
        cell.classList.add('hover-end');
      }
    });

    cell.addEventListener('mouseleave', () => {
      cell.classList.remove('hover-start', 'hover-end');
    });
  });
}

let selectionStage = 0; // 0 = select start, 1 = select end, 2 = ready

function handleCellClick(cell) {
  if (selectionStage === 0) {
    if (startCell) startCell.classList.remove('start');
    startCell = cell;
    cell.classList.remove('hover-start');
    cell.classList.add('start');
    selectionStage = 1;
    document.getElementById('instruction-text').textContent = 'Select the ending node from the grid';
  } else if (selectionStage === 1 && cell !== startCell) {
    if (endCell) endCell.classList.remove('end');
    endCell = cell;
    cell.classList.remove('hover-end');
    cell.classList.add('end');
    selectionStage = 2;
    document.getElementById('instruction-text').textContent = 'Generate a maze if you want and apply any of the algorithms';
  } else if (selectionStage === 2 && cell !== startCell && cell !== endCell) {
    cell.classList.toggle('wall');
  }
}



function getNeighbors(cell) {
  const r = parseInt(cell.dataset.row);
  const c = parseInt(cell.dataset.col);
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const neighbors = [];

  for (let [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const neighbor = document.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
      if (!neighbor.classList.contains('wall')) {
        neighbors.push(neighbor);
      }
    }
  }
  return neighbors;
}

async function dfs(cell, visited = new Set(), parent = new Map()) {
  if (cell === endCell) {
    await drawPath(parent);
    return true;
  }

  visited.add(cell);
  if (!cell.classList.contains('start')) {
    cell.classList.add('visited');
    await sleep(10);
  }

  for (let neighbor of getNeighbors(cell)) {
    if (!visited.has(neighbor)) {
      parent.set(neighbor, cell);
      const found = await dfs(neighbor, visited, parent);
      if (found) return true;
    }
  }
  return false;
}

async function bfs(start) {
  const queue = [start];
  const visited = new Set();
  const parent = new Map();
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === endCell) {
      await drawPath(parent);
      return true;
    }

    if (!current.classList.contains('start')) {
      current.classList.add('visited');
      await sleep(10);
    }

    for (let neighbor of getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        parent.set(neighbor, current);
      }
    }
  }
  return false;
}

async function dijkstra(start) {
  const dist = new Map();
  const visited = new Set();
  const parent = new Map();
  const pq = [];

  document.querySelectorAll('.cell').forEach(cell => {
    dist.set(cell, Infinity);
  });
  dist.set(start, 0);
  pq.push([0, start]);

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, current] = pq.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endCell) {
      await drawPath(parent);
      return true;
    }

    if (!current.classList.contains('start')) {
      current.classList.add('visited');
      await sleep(10);
    }

    for (let neighbor of getNeighbors(current)) {
      let weight = parseInt(neighbor.dataset.weight);
      let alt = dist.get(current) + weight;
      if (alt < dist.get(neighbor)) {
        dist.set(neighbor, alt);
        parent.set(neighbor, current);
        pq.push([alt, neighbor]);
      }
    }
  }
  return false;
}

function heuristic(cell1, cell2) {
  const r1 = parseInt(cell1.dataset.row);
  const c1 = parseInt(cell1.dataset.col);
  const r2 = parseInt(cell2.dataset.row);
  const c2 = parseInt(cell2.dataset.col);
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

async function astar(start) {
  const gScore = new Map();
  const fScore = new Map();
  const parent = new Map();
  const openSet = [];

  document.querySelectorAll('.cell').forEach(cell => {
    gScore.set(cell, Infinity);
    fScore.set(cell, Infinity);
  });

  gScore.set(start, 0);
  fScore.set(start, heuristic(start, endCell));
  openSet.push([fScore.get(start), start]);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a[0] - b[0]);
    const [_, current] = openSet.shift();

    if (current === endCell) {
      await drawPath(parent);
      return true;
    }

    if (!current.classList.contains('start')) {
      current.classList.add('visited');
      await sleep(10);
    }

    for (let neighbor of getNeighbors(current)) {
      const tentativeG = gScore.get(current) + 1;
      if (tentativeG < gScore.get(neighbor)) {
        parent.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor, endCell));
        openSet.push([fScore.get(neighbor), neighbor]);
      }
    }
  }

  return false;
}

async function drawPath(parents) {
  let curr = endCell;
  while (parents.has(curr) && curr !== startCell) {
    curr = parents.get(curr);
    if (curr !== startCell) {
      curr.classList.add('path');
      await sleep(30);
    }
  }
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function clearGrid() {
  startCell = null;
  endCell = null;
  selectionStage = 0;
  document.getElementById('instruction-text').textContent = 'Select the starting node from the grid';
  createGrid();
}

function visualize() {
  const algo = document.getElementById('algorithm').value;
  if (!startCell || !endCell) {
    alert("Set both start and end nodes.");
    return;
  }

  if (algo === 'dfs') dfs(startCell);
  else if (algo === 'bfs') bfs(startCell);
  else if (algo === 'dijkstra') dijkstra(startCell);
  else if (algo === 'astar') astar(startCell);
}
function generateMaze() {
  document.querySelectorAll('.cell').forEach(cell => {
    if (cell !== startCell && cell !== endCell) {
      cell.classList.remove('wall', 'visited', 'path');
      if (Math.random() < 0.3) {
        cell.classList.add('wall');
      }
    }
  });
}

createGrid();
