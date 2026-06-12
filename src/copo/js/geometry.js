// Pure geometry helpers — no p5, no DOM, no side effects.

export function maxTileDistance(distFn, xCenter, yCenter, col, row, xSize, ySize) {
  const x0 = col * xSize;
  const x1 = (col + 1) * xSize;
  const y0 = row * ySize;
  const y1 = (row + 1) * ySize;
  return Math.max(
    distFn(xCenter, yCenter, x0, y0),
    distFn(xCenter, yCenter, x1, y0),
    distFn(xCenter, yCenter, x1, y1),
    distFn(xCenter, yCenter, x0, y1)
  );
}

export function getCanvasOffset(points, width, height) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { x: width / 2 - (minX + maxX) / 2, y: height / 2 - (minY + maxY) / 2 };
}

export function generateSeedGrid(randomFn, cols, rows, randomAmount = 0, maxValue = 5) {
  const grid = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.max(Math.sqrt(cx * cx + cy * cy), 0.0001);

  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      const dx = i - cx;
      const dy = j - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      grid[i][j] = (dist / maxDist) * maxValue + randomFn(-randomAmount, randomAmount);
    }
  }

  const ci = Math.floor(cols / 2);
  const cj = Math.floor(rows / 2);
  if (cols >= 2 && rows >= 2 && cols % 2 === 0 && rows % 2 === 0) {
    grid[ci][cj] = 0;
    grid[ci - 1][cj] = 0;
    grid[ci][cj - 1] = 0;
    grid[ci - 1][cj - 1] = 0;
  } else {
    grid[ci][cj] = 0;
  }

  return grid;
}

export function generatePoints(randomFn, width, height, gridX, gridY, count) {
  const cols = Math.floor(width / gridX);
  const rows = Math.floor(height / gridY);

  const all = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      all.push([i * gridX, j * gridY]);
    }
  }

  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn(i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.slice(0, count);
}

export { deepMerge } from '../../shared/utils/deepMerge.js';
