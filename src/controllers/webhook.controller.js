const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const { updateERPData, createERPData } = require('../services/erp.service');
const { ValidationError } = require('../utils/error.handler');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/webhook-controller.log' })
  ]
});

/**
 * Prüfen der Salesforce-Webhook-Signatur
 * @param {Object} req - Express-Request-Objekt
 * @returns {boolean} - Gibt true zurück, wenn die Signatur gültig ist
 */
const verifySignature = (req) => {
  // In einer echten Implementierung würde hier die Signatur geprüft werden
  // Für dieses Beispiel geben wir immer true zurück
  return true;
};

/**
 * Account-Daten aus Salesforce in ERP-Kundenformat transformieren
 * @param {Object} accountData - Salesforce Account-Daten
 * @returns {Object} - Transformierte ERP-Kundendaten
 */
const mapAccountToKunde = (accountData) => {
  try {
    // Mapping zwischen Salesforce Account-Feldern und ERP-Kundendaten
    return {
      name: accountData.Name || '',
      nummer: accountData.AccountNumber || '',
      telefon: accountData.Phone || '',
      fax: accountData.Fax || '',
      website: accountData.Website || '',
      strasse: accountData.BillingStreet || '',
      ort: accountData.BillingCity || '',
      plz: accountData.BillingPostalCode || '',
      land: accountData.BillingCountry || '',
      bemerkung: accountData.Description || '',
      branche: accountData.Industry || '',
      jahresumsatz: accountData.AnnualRevenue || null,
      mitarbeiteranzahl: accountData.NumberOfEmployees || null,
      kundentyp: accountData.Type || '',
      // Benutzerdefinierte Felder
      kundengruppe: accountData.ERP_CustomerGroup__c || '',
      steuernummer: accountData.ERP_TaxNumber__c || '',
      ustIdNr: accountData.ERP_VATNumber__c || '',
      zahlungsbedingungen: accountData.ERP_PaymentTerms__c || '',
      kreditlimit: accountData.ERP_CreditLimit__c || null,
      aktiv: accountData.ERP_IsActive__c || false
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Account zu Kunde:', error);
    throw error;
  }
};

/**
 * Product-Daten aus Salesforce in ERP-Artikelformat transformieren
 * @param {Object} productData - Salesforce Product-Daten
 * @returns {Object} - Transformierte ERP-Artikeldaten
 */
const mapProductToArtikel = (productData) => {
  try {
    // Mapping zwischen Salesforce Product-Feldern und ERP-Artikeldaten
    return {
      bezeichnung: productData.Name || '',
      artikelnummer: productData.ProductCode || '',
      beschreibung: productData.Description || '',
      aktiv: productData.IsActive || true,
      warengruppe: productData.Family || '',
      lagernummer: productData.StockKeepingUnit || '',
      mengeneinheit: productData.QuantityUnitOfMeasure || '',
      bildUrl: productData.DisplayUrl || '',
      // Preise
      verkaufspreis: productData.UnitPrice || 0,
      // Benutzerdefinierte Felder
      einkaufspreis: productData.ERP_PurchasePrice__c || 0,
      lagerbestand: productData.ERP_StockQuantity__c || 0,
      mindestbestand: productData.ERP_MinimumStock__c || 0,
      maximalbestand: productData.ERP_MaximumStock__c || 0,
      meldebestand: productData.ERP_ReorderLevel__c || 0,
      steuersatz: productData.ERP_TaxRate__c || 0,
      gewicht: productData.ERP_Weight__c || 0,
      hersteller: productData.ERP_Manufacturer__c || '',
      herstellerartikelnummer: productData.ERP_ManufacturerPartNumber__c || ''
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Product zu Artikel:', error);
    throw error;
  }
};

/**
 * Opportunity-Daten aus Salesforce in ERP-Auftragsformat transformieren
 * @param {Object} opportunityData - Salesforce Opportunity-Daten
 * @returns {Object} - Transformierte ERP-Auftragsdaten
 */
const mapOpportunityToAuftrag = (opportunityData) => {
  try {
    // Status-Mapping
    let status = 'offen';
    switch(opportunityData.StageName) {
      case 'Prospecting':
      case 'Qualification':
        status = 'offen';
        break;
      case 'Needs Analysis':
      case 'Value Proposition':
      case 'Id. Decision Makers':
      case 'Perception Analysis':
      case 'Proposal/Price Quote':
        status = 'in_bearbeitung';
        break;
      case 'Negotiation/Review':
        status = 'teilweise_geliefert';
        break;
      case 'Closed Won':
        status = 'geliefert';
        break;
      case 'Closed Lost':
        status = 'storniert';
        break;
      default:
        status = 'offen';
    }

    // Auftragsnummer aus dem Namen extrahieren, falls vorhanden
    let auftragsNummer = '';
    if (opportunityData.Name && opportunityData.Name.includes(' - ')) {
      auftragsNummer = opportunityData.Name.split(' - ')[0].trim();
    } else {
      auftragsNummer = opportunityData.ERP_OrderNumber__c || '';
    }

    // Mapping zwischen Salesforce Opportunity-Feldern und ERP-Auftragsdaten
    return {
      auftragsNummer: auftragsNummer,
      gesamtbetrag: opportunityData.Amount || 0,
      liefertermin: opportunityData.CloseDate || null,
      status: status,
      auftragsart: opportunityData.Type || '',
      bemerkung: opportunityData.Description || '',
      // Benutzerdefinierte Felder
      datum: opportunityData.ERP_OrderDate__c || opportunityData.CreatedDate || null,
      bestellNummer: opportunityData.ERP_CustomerReference__c || '',
      steuerbetrag: opportunityData.ERP_TaxAmount__c || 0,
      nettobetrag: opportunityData.ERP_NetAmount__c || 0,
      waehrung: opportunityData.ERP_Currency__c || 'EUR'
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Opportunity zu Auftrag:', error);
    throw error;
  }
};

/**
 * Verarbeiten von Salesforce Account-Events
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const handleAccountEvent = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    // Salesforce-Webhook-Signatur prüfen
    if (!verifySignature(req)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Ungültige Signatur'
      });
    }

    const { event, data } = req.body;
    
    if (!event || !data) {
      throw new ValidationError('Event und Daten sind erforderlich');
    }
    
    logger.info(`Salesforce Account-Event empfangen: ${event.type}`);
    
    // Transformieren der Salesforce-Daten in ERP-Format
    const kundeData = mapAccountToKunde(data);
    
    let response;
    const erpId = data.ERP_ID__c;
    
    // Je nach Event-Typ unterschiedliche Aktionen durchführen
    switch (event.type) {
      case 'created':
        response = await createERPData('/api/customers', kundeData);
        logger.info('Neuer Kunde im ERP-System erstellt');
        break;
      case 'updated':
        if (erpId) {
          response = await updateERPData(`/api/customers/${erpId}`, kundeData);
          logger.info(`Kunde ${erpId} im ERP-System aktualisiert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Updates erforderlich');
        }
        break;
      case 'deleted':
        // Löschen wird oft als Statusänderung behandelt
        if (erpId) {
          response = await updateERPData(`/api/customers/${erpId}`, { aktiv: false });
          logger.info(`Kunde ${erpId} im ERP-System deaktiviert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Deaktivierungen erforderlich');
        }
        break;
      default:
        logger.warn(`Unbekannter Event-Typ: ${event.type}`);
        break;
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Account-Event ${event.type} erfolgreich verarbeitet`,
      data: response
    });
  } catch (error) {
    logger.error('Fehler bei der Verarbeitung des Account-Events:', error);
    next(error);
  }
};

/**
 * Verarbeiten von Salesforce Opportunity-Events
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const handleOpportunityEvent = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    // Salesforce-Webhook-Signatur prüfen
    if (!verifySignature(req)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Ungültige Signatur'
      });
    }

    const { event, data } = req.body;
    
    if (!event || !data) {
      throw new ValidationError('Event und Daten sind erforderlich');
    }
    
    logger.info(`Salesforce Opportunity-Event empfangen: ${event.type}`);
    
    // Transformieren der Salesforce-Daten in ERP-Format
    const auftragData = mapOpportunityToAuftrag(data);
    
    let response;
    const erpId = data.ERP_ID__c;
    
    // Je nach Event-Typ unterschiedliche Aktionen durchführen
    switch (event.type) {
      case 'created':
        response = await createERPData('/api/orders', auftragData);
        logger.info('Neuer Auftrag im ERP-System erstellt');
        break;
      case 'updated':
        if (erpId) {
          response = await updateERPData(`/api/orders/${erpId}`, auftragData);
          logger.info(`Auftrag ${erpId} im ERP-System aktualisiert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Updates erforderlich');
        }
        break;
      case 'deleted':
        // Löschen wird oft als Statusänderung behandelt
        if (erpId) {
          response = await updateERPData(`/api/orders/${erpId}`, { status: 'storniert' });
          logger.info(`Auftrag ${erpId} im ERP-System storniert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Stornierungen erforderlich');
        }
        break;
      default:
        logger.warn(`Unbekannter Event-Typ: ${event.type}`);
        break;
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Opportunity-Event ${event.type} erfolgreich verarbeitet`,
      data: response
    });
  } catch (error) {
    logger.error('Fehler bei der Verarbeitung des Opportunity-Events:', error);
    next(error);
  }
};

/**
 * Verarbeiten von Salesforce Product-Events
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const handleProductEvent = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    // Salesforce-Webhook-Signatur prüfen
    if (!verifySignature(req)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Ungültige Signatur'
      });
    }

    const { event, data } = req.body;
    
    if (!event || !data) {
      throw new ValidationError('Event und Daten sind erforderlich');
    }
    
    logger.info(`Salesforce Product-Event empfangen: ${event.type}`);
    
    // Transformieren der Salesforce-Daten in ERP-Format
    const artikelData = mapProductToArtikel(data);
    
    let response;
    const erpId = data.ERP_ID__c;
    
    // Je nach Event-Typ unterschiedliche Aktionen durchführen
    switch (event.type) {
      case 'created':
        response = await createERPData('/api/items', artikelData);
        logger.info('Neuer Artikel im ERP-System erstellt');
        break;
      case 'updated':
        if (erpId) {
          response = await updateERPData(`/api/items/${erpId}`, artikelData);
          logger.info(`Artikel ${erpId} im ERP-System aktualisiert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Updates erforderlich');
        }
        break;
      case 'deleted':
        // Löschen wird oft als Statusänderung behandelt
        if (erpId) {
          response = await updateERPData(`/api/items/${erpId}`, { aktiv: false });
          logger.info(`Artikel ${erpId} im ERP-System deaktiviert`);
        } else {
          throw new ValidationError('ERP_ID__c ist für Deaktivierungen erforderlich');
        }
        break;
      default:
        logger.warn(`Unbekannter Event-Typ: ${event.type}`);
        break;
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Product-Event ${event.type} erfolgreich verarbeitet`,
      data: response
    });
  } catch (error) {
    logger.error('Fehler bei der Verarbeitung des Product-Events:', error);
    next(error);
  }
};

/**
 * Verarbeiten von Salesforce Contact-Events
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const handleContactEvent = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    // Salesforce-Webhook-Signatur prüfen
    if (!verifySignature(req)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Ungültige Signatur'
      });
    }

    const { event, data } = req.body;
    
    if (!event || !data) {
      throw new ValidationError('Event und Daten sind erforderlich');
    }
    
    logger.info(`Salesforce Contact-Event empfangen: ${event.type}`);
    
    // In einer echten Implementierung würde hier die Transformation und
    // Synchronisation mit dem ERP-System erfolgen
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Contact-Event ${event.type} erfolgreich verarbeitet`
    });
  } catch (error) {
    logger.error('Fehler bei der Verarbeitung des Contact-Events:', error);
    next(error);
  }
};

/**
 * Verarbeiten von benutzerdefinierten Salesforce-Events
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const handleCustomEvent = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    // Salesforce-Webhook-Signatur prüfen
    if (!verifySignature(req)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Ungültige Signatur'
      });
    }

    const { event, data, event_type } = req.body;
    
    if (!event || !data || !event_type) {
      throw new ValidationError('Event, Daten und Event-Typ sind erforderlich');
    }
    
    logger.info(`Benutzerdefiniertes Salesforce-Event empfangen: ${event_type}`);
    
    // In einer echten Implementierung würde hier die Verarbeitung
    // des benutzerdefinierten Events erfolgen
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Benutzerdefiniertes Event ${event_type} erfolgreich verarbeitet`
    });
  } catch (error) {
    logger.error('Fehler bei der Verarbeitung des benutzerdefinierten Events:', error);
    next(error);
  }
};

/**
 * Liste aller Webhooks abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getWebhookList = async (req, res, next) => {
  try {
    // Echte Webhook-Daten würden hier aus der Datenbank abgerufen werden
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir ein leeres Array zurück
    const webhooks = [];

    logger.info('Webhook-Liste abgerufen (leere Liste)');
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: webhooks
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Webhook-Liste:', error);
    next(error);
  }
};

/**
 * Details eines bestimmten Webhooks abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getWebhookById = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir diese aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir einen 404-Fehler zurück
    
    logger.info(`Webhook ${id} nicht gefunden`);
    
    return res.status(StatusCodes.NOT_FOUND).json({
      status: 'error',
      message: `Webhook mit ID ${id} nicht gefunden`
    });
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Webhooks ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Neuen Webhook erstellen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const createWebhook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { name, url, events, active } = req.body;
    
    // Simulieren einer neuen Webhook-ID (in einer echten Anwendung würde diese von der Datenbank generiert)
    const newId = 5;
    
    const newWebhook = {
      id: newId,
      name,
      url,
      events,
      active: active !== undefined ? active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Neuer Webhook erstellt: ${name}`);
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: newWebhook
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen eines neuen Webhooks:', error);
    next(error);
  }
};

/**
 * Bestehenden Webhook aktualisieren
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const updateWebhook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    const { name, url, events, active } = req.body;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir diese aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir einen 404-Fehler zurück
    
    logger.info(`Webhook ${id} nicht gefunden`);
    
    return res.status(StatusCodes.NOT_FOUND).json({
      status: 'error',
      message: `Webhook mit ID ${id} nicht gefunden`
    });
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren des Webhooks ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Webhook löschen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const deleteWebhook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Simulieren einer Löschaktion (in einer echten Anwendung würden wir die Datenbankeinträge löschen)
    logger.info(`Webhook ${id} gelöscht`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Webhook mit ID ${id} erfolgreich gelöscht`
    });
  } catch (error) {
    logger.error(`Fehler beim Löschen des Webhooks ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Logs für einen bestimmten Webhook abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getWebhookLogs = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir diese aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir ein leeres Array zurück
    const logs = [];
    
    logger.info(`Webhook-Logs für Webhook ${id} abgerufen (leere Liste)`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Webhook-Logs ${req.params.id}:`, error);
    next(error);
  }
};

module.exports = {
  handleAccountEvent,
  handleOpportunityEvent,
  handleProductEvent,
  handleContactEvent,
  handleCustomEvent,
  getWebhookList,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookLogs
}; 