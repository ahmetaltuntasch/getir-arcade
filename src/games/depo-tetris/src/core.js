export const COLS = 10;
export const ROWS = 16;
export const RUN_DURATION = 180;
export const SCORE_SCALE = 4;
export const CATEGORIES = ['snack', 'water', 'produce', 'protein'];
export const BONUS_TYPES = ['joker', 'bomb', 'magnet', 'freeze', 'organize', 'express'];

export const SHAPES = {
  I: [[1, 1, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]], S: [[0, 1, 1], [1, 1, 0]], T: [[0, 1, 0], [1, 1, 1]], Z: [[1, 1, 0], [0, 1, 1]],
};

export function createGrid(rows = ROWS, cols = COLS) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}
export function rotate(shape) { return shape[0].map((_, x) => shape.map(row => row[x]).reverse()); }
export function collides(grid, piece, dx = 0, dy = 0, shape = piece.shape) {
  return shape.some((row, y) => row.some((cell, x) => cell && (
    piece.x + x + dx < 0 || piece.x + x + dx >= COLS || piece.y + y + dy >= ROWS ||
    (piece.y + y + dy >= 0 && grid[piece.y + y + dy][piece.x + x + dx])
  )));
}
export function rotateWithKick(grid, piece) {
  const shape = rotate(piece.shape);
  for (const kick of [0, -1, 1, -2, 2]) if (!collides(grid, piece, kick, 0, shape)) return { ...piece, x: piece.x + kick, shape };
  return piece;
}
export function merge(grid, piece) {
  const next = grid.map(row => [...row]);
  let overflow = false;
  piece.shape.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return; const gy = piece.y + y, gx = piece.x + x;
    if (gy < 0) overflow = true; else next[gy][gx] = { category: piece.category, product: piece.product };
  }));
  return { grid: next, overflow };
}
export function fullRows(grid) { return grid.map((row, i) => row.every(Boolean) ? i : -1).filter(i => i >= 0); }
export function rowMatchType(grid, y) {
  const row=grid[y]; if(!row?.every(Boolean)) return 'none';
  if(row.every(cell=>cell.product&&cell.product===row[0].product)) return 'product';
  if(row.every(cell=>cell.category===row[0].category)) return 'category';
  return 'mixed';
}
export function touchingCells(grid, rows) {
  const rowSet=new Set(rows), found=new Set();
  for(const y of rows) for(let x=0;x<COLS;x++) for(const[dy,dx]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const ny=y+dy,nx=x+dx;if(ny>=0&&ny<ROWS&&nx>=0&&nx<COLS&&!rowSet.has(ny)&&grid[ny][nx])found.add(`${ny}:${nx}`);
  }
  return [...found].map(key=>key.split(':').map(Number));
}
export function occupiedHeight(grid){const top=grid.findIndex(row=>row.some(Boolean));return top<0?0:ROWS-top;}
export function clearRows(grid, rows) {
  const set = new Set(rows); const kept = grid.filter((_, i) => !set.has(i));
  return [...Array.from({ length: rows.length }, () => Array(COLS).fill(null)), ...kept];
}
export function connectedGroup(grid, sy, sx) {
  const start = grid[sy]?.[sx]; if (!start) return [];
  const seen = new Set(), out = [], stack = [[sy, sx]];
  while (stack.length) { const [y, x] = stack.pop(), key = `${y}:${x}`; if (seen.has(key)) continue; seen.add(key);
    if (grid[y]?.[x]?.category !== start.category) continue; out.push([y, x]);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dy,dx]) => stack.push([y+dy,x+dx]));
  } return out;
}
export function largestCategoryGroupTouchingRows(grid, rows) {
  let best = []; for (const y of rows) for (let x = 0; x < COLS; x++) { const group = connectedGroup(grid, y, x); if (group.length > best.length) best = group; }
  return best.length >= 3 ? best : [];
}
export function removeCells(grid, cells) { const next = grid.map(r => [...r]); cells.forEach(([y,x]) => { if (next[y]) next[y][x] = null; }); return collapse(next); }
export function collapse(grid) { const next = createGrid(); for (let x=0;x<COLS;x++){ const cells=[]; for(let y=ROWS-1;y>=0;y--) if(grid[y][x]) cells.push(grid[y][x]); cells.forEach((c,i)=>next[ROWS-1-i][x]=c); } return next; }
export function emergencyClear(grid) { const occupied = grid.map((r,i)=>r.some(Boolean)?i:-1).filter(i=>i>=0).slice(0,3); return { grid: clearRows(grid, occupied), rows: occupied }; }
export function calculateClearScore({ rowCount = 0, streak = 1, matchType = 'mixed', extraCells = 0, cascadeDepth = 0 } = {}) {
  const lineFactors = [0, 1, 2.5, 4.5, 7];
  const lineFactor = rowCount > 4 ? lineFactors[4] + (rowCount - 4) * 2 : lineFactors[Math.max(0, rowCount)];
  const matchFactor = { mixed: 1, category: 1.35, product: 2 }[matchType] || 1;
  const cascadeFactor = Math.min(1.75, 1 + Math.max(0, cascadeDepth) * .25);
  const streakValue = 100 + Math.min(Math.max(1, streak), 10) * 12;
  return Math.round((streakValue * lineFactor * matchFactor * cascadeFactor + Math.max(0, extraCells) * 15) * SCORE_SCALE);
}
export function dropInterval(elapsed, frozen = false) { const wave = Math.min(6, Math.floor(elapsed / 30)); return (frozen ? 1.7 : 1) * Math.max(0.18, 0.82 - wave * 0.1); }
export function formatTime(seconds) { const s=Math.max(0,Math.ceil(seconds)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
export function applyBonus(grid, type, context = {}) {
  let next=grid.map(r=>[...r]), removed=0;
  if(type==='joker'){ const y=context.y??ROWS-1,x=context.x??next[y].findIndex(v=>!v); if(y>=0&&x>=0&&!next[y][x]) next[y][x]={category:'joker'}; }
  if(type==='bomb'){ const cells=connectedGroup(next,context.y??ROWS-1,context.x??0); removed=cells.length; next=removeCells(next,cells); }
  if(type==='magnet'){ const candidates=next.map((r,y)=>({y,empty:r.filter(v=>!v).length})).filter(r=>r.empty>0).sort((a,b)=>a.empty-b.empty); const row=candidates[0]; if(row) for(let x=0;x<COLS&&removed<3;x++)if(!next[row.y][x]){next[row.y][x]={category:'joker'};removed++;} }
  if(type==='organize'){ next=collapse(next); }
  if(type==='express'){ const y=context.y??next.map((r,i)=>r.some(Boolean)?i:-1).filter(i=>i>=0).pop(); if(y>=0){removed=next[y].filter(Boolean).length;next=clearRows(next,[y]);} }
  return {grid:next,removed};
}
