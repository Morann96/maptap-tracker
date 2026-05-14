// ID del Google Sheet donde se guardan los datos
const SHEET_ID   = '1yQGQHEmvvgB4EToJNRpZUE14Pedix3eqnD7_jVM0KRY';
// Nombre de la pestaña dentro del sheet
const SHEET_NAME = 'datos';
// Jugadores reconocidos — cualquier envío con un jugador fuera de esta lista se rechaza
const ALLOWED    = ['Moran', 'Gonzalo', 'Mewis', 'Muñi', 'Arias'];

// GET /  →  devuelve todas las filas del sheet como array de objetos JSON
// La app lo llama al cargar el Dashboard y el Historial
function doGet() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rows  = sheet.getDataRange().getValues();
    if (rows.length <= 1) return ok({ data: [] }); // sheet vacío (solo cabecera)
    const headers = rows[0];
    // Convierte cada fila en un objeto { fecha, jugador, r1, r2, r3, r4, r5, score, timestamp }
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        // Las celdas de fecha se almacenan como objetos Date en Sheets; las
        // normalizamos a string YYYY-MM-DD respetando la zona horaria del script
        obj[h] = (h === 'fecha' && row[i] instanceof Date)
          ? Utilities.formatDate(row[i], 'Europe/Madrid', 'yyyy-MM-dd')
          : row[i];
      });
      return obj;
    });
    return ok({ data });
  } catch (e) {
    return err(e.message);
  }
}

// POST /  →  inserta una nueva fila con el resultado de una partida
// Body esperado: { fecha, jugador, r1, r2, r3, r4, r5, score }
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { fecha, jugador, r1, r2, r3, r4, r5, score } = body;

    // Valida que vengan los campos mínimos y que el jugador sea uno de los permitidos
    if (!fecha || !jugador || !ALLOWED.includes(jugador))
      return err('Datos inválidos');

    const sheet   = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rows    = sheet.getDataRange().getValues();
    const headers = rows[0];
    // Helper para obtener el índice de una columna por nombre
    const idx     = h => headers.indexOf(h);

    // Comprueba si ya existe una fila idéntica (misma fecha, jugador y puntuaciones)
    // para evitar duplicados si el usuario envía el mismo resultado dos veces
    const dup = rows.slice(1).some(row =>
      row[idx('fecha')]   === fecha    &&
      row[idx('jugador')] === jugador  &&
      Number(row[idx('r1')]) === Number(r1) &&
      Number(row[idx('r2')]) === Number(r2) &&
      Number(row[idx('r3')]) === Number(r3) &&
      Number(row[idx('r4')]) === Number(r4) &&
      Number(row[idx('r5')]) === Number(r5) &&
      Number(row[idx('score')]) === Number(score)
    );
    if (dup) return ok({ duplicate: true }); // no inserta, pero responde OK para que la app muestre el aviso

    // Añade la fila al final del sheet con un timestamp de cuándo se registró
    sheet.appendRow([
      fecha, jugador,
      Number(r1), Number(r2), Number(r3), Number(r4), Number(r5),
      Number(score),
      new Date().toISOString()
    ]);
    return ok({});
  } catch (e) {
    return err(e.message);
  }
}

// Envuelve los datos en { ok: true, ...data } y los serializa como JSON
function ok(data)  { return resp(Object.assign({ ok: true }, data)); }
// Envuelve el mensaje de error en { ok: false, error: msg }
function err(msg)  { return resp({ ok: false, error: msg }); }
// Construye la respuesta HTTP con Content-Type: application/json
function resp(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
