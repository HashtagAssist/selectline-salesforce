/**
 * Middleware für Weiterleitungen von veralteten URL-Pfaden
 * Leitet alte/veraltete API-Pfade zu den aktuellen Endpunkten weiter
 */

// Mapping von alten zu neuen Pfaden
const redirectMappings = {
  // Beispiel für zukünftige Änderungen:
  // '/api/old-path': '/api/new-path',
  
  // Die aktuellen Pfade werden vorerst beibehalten, um die Kompatibilität zu gewährleisten
  // Falls in Zukunft die Pfadstruktur geändert wird, können hier Einträge hinzugefügt werden
  '/api/transformation': '/api/transform',
  '/api/webhook': '/api/webhooks'
};

/**
 * Middleware für API-Weiterleitungen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const apiRedirectMiddleware = (req, res, next) => {
  const path = req.path;
  
  // Prüfen, ob der aktuelle Pfad in den Weiterleitungsmappings vorhanden ist
  if (redirectMappings[path]) {
    console.log(`Weiterleitung von veraltetem Pfad: ${path} zu ${redirectMappings[path]}`);
    
    // URL-Teile anpassen und weiterleiten
    req.url = redirectMappings[path] + req.url.substring(path.length);
  }
  
  next();
};

module.exports = {
  apiRedirectMiddleware
}; 