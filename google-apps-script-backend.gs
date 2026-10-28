/**
 * BULL MARKET POS & KDS — Backend Opcional para Google Sheets (Apps Script)
 * 
 * INSTRUCCIONES:
 * 1. Crea una hoja de cálculo en Google Sheets.
 * 2. Ve a Extensiones -> Apps Script y pega este código.
 * 3. Haz clic en "Implementar" -> "Nueva implementación" -> Tipo: "Aplicación web".
 * 4. Ejecutar como: "Yo" | Quién tiene acceso: "Cualquier persona".
 * 5. Copia la URL de la aplicación web y pégala en la vista /admin de Bull Market KDS.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = sheet.getSheetByName('Comandas') || sheet.insertSheet('Comandas');
    var payload = JSON.parse(e.postData.contents);
    
    logSheet.clearContents();
    logSheet.appendRow([
      'Ticket',
      'Cliente / Mesa',
      'Modalidad',
      'Estado',
      'Hora Entrada',
      'Sabores',
      'Nota'
    ]);

    if (payload && payload.orders) {
      payload.orders.forEach(function(order) {
        var itemsText = order.items.map(function(i) {
          return i.quantity + 'x ' + i.flavorName;
        }).join(' | ');

        logSheet.appendRow([
          order.ticketNumber,
          order.customerOrTable,
          order.orderType,
          order.status,
          new Date(order.createdAt).toLocaleString(),
          itemsText,
          order.note || ''
        ]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
