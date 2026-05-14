'use strict';

const { parseMapTap, resolvePlayer, computeStats, parseJwt } = require('../src/core');

// ─── parseMapTap ─────────────────────────────────────────────────────────────

describe('parseMapTap', () => {
  const validInput = `May 14
100 99 100 95 99
981`;

  test('input válido devuelve fecha, rounds y score', () => {
    const result = parseMapTap(validInput);
    expect(result).not.toBeNull();
    expect(result.rounds).toEqual([100, 99, 100, 95, 99]);
    expect(result.score).toBe(981);
    expect(result.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('fecha en formato "Month DD" se parsea correctamente', () => {
    const result = parseMapTap(`January 1\n100 99 98 97 96\n490`);
    expect(result).not.toBeNull();
    expect(result.fecha).toMatch(/^\d{4}-01-01$/);
  });

  test('menos de 3 líneas devuelve null', () => {
    expect(parseMapTap('May 14\n100 99 100 95 99')).toBeNull();
    expect(parseMapTap('May 14')).toBeNull();
    expect(parseMapTap('')).toBeNull();
  });

  test('sin fecha reconocible devuelve null', () => {
    expect(parseMapTap('14-05-2026\n100 99 100 95 99\n981')).toBeNull();
    expect(parseMapTap('12345\n100 99 100 95 99\n981')).toBeNull();
  });

  test('menos de 5 números en la línea de rondas devuelve null', () => {
    expect(parseMapTap('May 14\n100 99 100 95\n981')).toBeNull();
    expect(parseMapTap('May 14\n100\n981')).toBeNull();
  });

  test('sin score en la tercera línea devuelve null', () => {
    expect(parseMapTap('May 14\n100 99 100 95 99\nsin puntuacion')).toBeNull();
  });

  test('líneas con espacios extra se procesan correctamente', () => {
    const result = parseMapTap(`  May 14  \n  100 99 100 95 99  \n  981  `);
    expect(result).not.toBeNull();
    expect(result.score).toBe(981);
  });

  test('solo coge los primeros 5 números de la línea de rondas', () => {
    const result = parseMapTap('May 14\n100 99 100 95 99 88 77\n981');
    expect(result.rounds).toHaveLength(5);
    expect(result.rounds).toEqual([100, 99, 100, 95, 99]);
  });

  // Bug conocido: si el mes del resultado es posterior al mes actual,
  // se usa el año incorrecto (debería ser el año anterior)
  test('BUG: resultado de diciembre parseado en enero usa año equivocado', () => {
    const now = new Date();
    const result = parseMapTap('December 31\n100 99 100 95 99\n981');
    if (result) {
      const year = parseInt(result.fecha.split('-')[0]);
      // Si estamos en enero, el año debería ser el anterior
      if (now.getMonth() === 0) {
        expect(year).toBe(now.getFullYear() - 1); // FALLARÁ — bug conocido
      }
    }
  });
});

// ─── resolvePlayer ───────────────────────────────────────────────────────────

describe('resolvePlayer', () => {
  test('nombre que contiene "moran" → Moran', () => {
    expect(resolvePlayer('Jorge Moran', 'moran@gmail.com', 'Jorge')).toBe('Moran');
  });

  test('email con "gonzalo" → Gonzalo', () => {
    expect(resolvePlayer('Gonzalo García', 'gonzalo.garcia@gmail.com', 'Gonzalo')).toBe('Gonzalo');
  });

  test('nombre con acento "Muñi" se normaliza y resuelve a Muñi', () => {
    expect(resolvePlayer('Muñi', 'muni@gmail.com', 'Muñi')).toBe('Muñi');
  });

  test('email con "muni" (sin acento) → Muñi', () => {
    expect(resolvePlayer('Desconocido', 'muni@gmail.com', 'Muni')).toBe('Muñi');
  });

  test('nombre con "arias" → Arias', () => {
    expect(resolvePlayer('Carlos Arias', 'carias@gmail.com', 'Carlos')).toBe('Arias');
  });

  test('nombre con "mewis" → Mewis', () => {
    expect(resolvePlayer('Mewis', 'mewis@gmail.com', 'Mewis')).toBe('Mewis');
  });

  test('jugador desconocido → null', () => {
    expect(resolvePlayer('Pedro Sánchez', 'pedro@gmail.com', 'Pedro')).toBeNull();
  });

  test('case insensitive: "MORAN" → Moran', () => {
    expect(resolvePlayer('MORAN', 'MORAN@GMAIL.COM', 'JORGE')).toBe('Moran');
  });
});

// ─── computeStats ────────────────────────────────────────────────────────────

describe('computeStats', () => {
  test('array vacío → todos los jugadores con stats a 0', () => {
    const stats = computeStats([]);
    expect(stats['Moran'].wins).toBe(0);
    expect(stats['Moran'].avg).toBe(0);
    expect(stats['Moran'].best).toBe(0);
    expect(stats['Moran'].entries).toBe(0);
  });

  test('un jugador gana el día con la puntuación más alta', () => {
    const data = [
      { fecha: '2026-05-14', jugador: 'Moran', score: 950 },
      { fecha: '2026-05-14', jugador: 'Gonzalo', score: 900 },
    ];
    const stats = computeStats(data);
    expect(stats['Moran'].wins).toBe(1);
    expect(stats['Gonzalo'].wins).toBe(0);
  });

  test('la media se calcula correctamente', () => {
    const data = [
      { fecha: '2026-05-13', jugador: 'Moran', score: 900 },
      { fecha: '2026-05-14', jugador: 'Moran', score: 1000 },
    ];
    const stats = computeStats(data);
    expect(stats['Moran'].avg).toBe(950);
  });

  test('best score se actualiza correctamente', () => {
    const data = [
      { fecha: '2026-05-13', jugador: 'Moran', score: 800 },
      { fecha: '2026-05-14', jugador: 'Moran', score: 1000 },
    ];
    const stats = computeStats(data);
    expect(stats['Moran'].best).toBe(1000);
  });

  test('múltiples días, gana quien tiene más victorias', () => {
    const data = [
      { fecha: '2026-05-12', jugador: 'Moran', score: 950 },
      { fecha: '2026-05-12', jugador: 'Gonzalo', score: 900 },
      { fecha: '2026-05-13', jugador: 'Moran', score: 980 },
      { fecha: '2026-05-13', jugador: 'Gonzalo', score: 990 },
    ];
    const stats = computeStats(data);
    expect(stats['Moran'].wins).toBe(1);
    expect(stats['Gonzalo'].wins).toBe(1);
  });

  test('jugador no registrado en la lista no puntúa', () => {
    const data = [{ fecha: '2026-05-14', jugador: 'Fantasma', score: 999 }];
    const stats = computeStats(data);
    expect(Object.keys(stats)).not.toContain('Fantasma');
  });

  test('en empate de score gana el segundo (comportamiento actual de reduce)', () => {
    const data = [
      { fecha: '2026-05-14', jugador: 'Moran', score: 950 },
      { fecha: '2026-05-14', jugador: 'Gonzalo', score: 950 },
    ];
    const stats = computeStats(data);
    // reduce con (a, b) => a.score > b.score ? a : b devuelve b en empate
    expect(stats['Gonzalo'].wins).toBe(1);
    expect(stats['Moran'].wins).toBe(0);
  });

  test('entries cuenta cuántas partidas ha jugado cada jugador', () => {
    const data = [
      { fecha: '2026-05-13', jugador: 'Moran', score: 900 },
      { fecha: '2026-05-14', jugador: 'Moran', score: 950 },
      { fecha: '2026-05-14', jugador: 'Gonzalo', score: 800 },
    ];
    const stats = computeStats(data);
    expect(stats['Moran'].entries).toBe(2);
    expect(stats['Gonzalo'].entries).toBe(1);
  });
});

// ─── parseJwt ────────────────────────────────────────────────────────────────

describe('parseJwt', () => {
  // Payload: { "sub": "12345", "name": "Moran", "email": "moran@test.com" }
  const payload = { sub: '12345', name: 'Moran', email: 'moran@test.com' };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const fakeToken = `header.${encodedPayload}.signature`;

  test('JWT válido devuelve el payload como objeto', () => {
    const result = parseJwt(fakeToken);
    expect(result.sub).toBe('12345');
    expect(result.name).toBe('Moran');
    expect(result.email).toBe('moran@test.com');
  });

  test('token sin puntos lanza excepción', () => {
    expect(() => parseJwt('tokeninvalido')).toThrow();
  });

  test('payload no es JSON válido lanza excepción', () => {
    const bad = `header.${Buffer.from('no-es-json').toString('base64')}.sig`;
    expect(() => parseJwt(bad)).toThrow();
  });
});
