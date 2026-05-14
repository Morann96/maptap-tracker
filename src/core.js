'use strict';

const PLAYER_MAP = {
  'moran': 'Moran',
  'gonzalo': 'Gonzalo',
  'mewis': 'Mewis',
  'muñi': 'Muñi',
  'muni': 'Muñi',
  'arias': 'Arias',
};

function parseMapTap(text) {
  try {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) return null;

    const dateMatch = lines[0].match(/([A-Za-z]+)\s+(\d+)/);
    if (!dateMatch) return null;
    const now = new Date();
    let year = now.getFullYear();
    const d = new Date(`${dateMatch[1]} ${dateMatch[2]} ${year}`);
    if (isNaN(d)) return null;
    if (d.getMonth() > now.getMonth()) d.setFullYear(year - 1);
    const fecha = d.toISOString().split('T')[0];

    const nums = lines[1].match(/\d+/g);
    if (!nums || nums.length < 5) return null;
    const rounds = nums.slice(0, 5).map(Number);

    const scoreMatch = lines[2].match(/\d+/);
    if (!scoreMatch) return null;
    const score = Number(scoreMatch[0]);

    return { fecha, rounds, score };
  } catch { return null; }
}

function resolvePlayer(name, email, givenName) {
  const candidates = [name, email.split('@')[0], givenName]
    .map(s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  for (const c of candidates) {
    for (const [key, val] of Object.entries(PLAYER_MAP)) {
      if (c.includes(key) || key.includes(c)) return val;
    }
  }
  return null;
}

function computeStats(data) {
  const players = ['Moran', 'Gonzalo', 'Mewis', 'Muñi', 'Arias'];
  const stats = {};
  players.forEach(p => stats[p] = { wins: 0, scores: [], best: 0, entries: 0 });

  const byDate = {};
  data.forEach(r => {
    if (!byDate[r.fecha]) byDate[r.fecha] = [];
    byDate[r.fecha].push(r);
  });

  Object.values(byDate).forEach(entries => {
    const winner = entries.reduce((a, b) => a.score > b.score ? a : b);
    if (stats[winner.jugador]) stats[winner.jugador].wins++;
    entries.forEach(e => {
      if (stats[e.jugador]) {
        stats[e.jugador].scores.push(e.score);
        stats[e.jugador].entries++;
        if (e.score > stats[e.jugador].best) stats[e.jugador].best = e.score;
      }
    });
  });

  Object.keys(stats).forEach(p => {
    const arr = stats[p].scores;
    stats[p].avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  });

  return stats;
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = typeof atob !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json);
}

module.exports = { parseMapTap, resolvePlayer, computeStats, parseJwt, PLAYER_MAP };
