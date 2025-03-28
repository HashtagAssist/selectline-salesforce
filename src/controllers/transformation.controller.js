const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const { fetchERPData } = require('../services/erp.service');
const { ValidationError, NotFoundError } = require('../utils/error.handler');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/transformation-controller.log' })
  ]
});

/**
 * ERP-Kundendaten in Salesforce Account-Format transformieren
 * @param {Object} kundeData - Kundendaten aus dem ERP-System
 * @returns {Object} - Transformierte Salesforce Account-Daten
 */
const mapKundeToAccount = (kundeData) => {
  try {
    // Mapping zwischen ERP-Kundendaten und Salesforce Account-Feldern
    return {
      Name: kundeData.name || '',
      AccountNumber: kundeData.nummer || kundeData.id || '',
      Phone: kundeData.telefon || '',
      Fax: kundeData.fax || '',
      Website: kundeData.website || '',
      BillingStreet: kundeData.strasse || '',
      BillingCity: kundeData.ort || '',
      BillingPostalCode: kundeData.plz || '',
      BillingCountry: kundeData.land || '',
      Description: kundeData.bemerkung || '',
      Industry: kundeData.branche || '',
      AnnualRevenue: kundeData.jahresumsatz || null,
      NumberOfEmployees: kundeData.mitarbeiteranzahl || null,
      Type: kundeData.kundentyp || '',
      // Benutzerdefinierte Felder
      ERP_ID__c: kundeData.id || '',
      ERP_CustomerGroup__c: kundeData.kundengruppe || '',
      ERP_LastModified__c: kundeData.lastModified || null,
      ERP_TaxNumber__c: kundeData.steuernummer || '',
      ERP_VATNumber__c: kundeData.ustIdNr || '',
      ERP_PaymentTerms__c: kundeData.zahlungsbedingungen || '',
      ERP_CreditLimit__c: kundeData.kreditlimit || null,
      ERP_IsActive__c: kundeData.aktiv || false
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Kunde zu Account:', error);
    throw error;
  }
};

/**
 * ERP-Artikeldaten in Salesforce Product-Format transformieren
 * @param {Object} artikelData - Artikeldaten aus dem ERP-System
 * @returns {Object} - Transformierte Salesforce Product-Daten
 */
const mapArtikelToProduct = (artikelData) => {
  try {
    // Mapping zwischen ERP-Artikeldaten und Salesforce Product-Feldern
    return {
      Name: artikelData.bezeichnung || '',
      ProductCode: artikelData.artikelnummer || artikelData.id || '',
      Description: artikelData.beschreibung || '',
      IsActive: artikelData.aktiv || true,
      Family: artikelData.warengruppe || '',
      StockKeepingUnit: artikelData.lagernummer || '',
      QuantityUnitOfMeasure: artikelData.mengeneinheit || '',
      DisplayUrl: artikelData.bildUrl || '',
      // Preise
      UnitPrice: artikelData.verkaufspreis || 0,
      // Benutzerdefinierte Felder
      ERP_ID__c: artikelData.id || '',
      ERP_PurchasePrice__c: artikelData.einkaufspreis || 0,
      ERP_StockQuantity__c: artikelData.lagerbestand || 0,
      ERP_MinimumStock__c: artikelData.mindestbestand || 0,
      ERP_MaximumStock__c: artikelData.maximalbestand || 0,
      ERP_ReorderLevel__c: artikelData.meldebestand || 0,
      ERP_TaxRate__c: artikelData.steuersatz || 0,
      ERP_Weight__c: artikelData.gewicht || 0,
      ERP_LastModified__c: artikelData.lastModified || null,
      ERP_Manufacturer__c: artikelData.hersteller || '',
      ERP_ManufacturerPartNumber__c: artikelData.herstellerartikelnummer || ''
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Artikel zu Product:', error);
    throw error;
  }
};

/**
 * ERP-Auftragsdaten in Salesforce Opportunity-Format transformieren
 * @param {Object} auftragData - Auftragsdaten aus dem ERP-System
 * @returns {Object} - Transformierte Salesforce Opportunity-Daten
 */
const mapAuftragToOpportunity = (auftragData) => {
  try {
    // Status-Mapping
    let stage = 'Prospecting';
    switch(auftragData.status) {
      case 'offen':
        stage = 'Prospecting';
        break;
      case 'in_bearbeitung':
        stage = 'Qualification';
        break;
      case 'teilweise_geliefert':
        stage = 'Negotiation/Review';
        break;
      case 'geliefert':
        stage = 'Closed Won';
        break;
      case 'storniert':
        stage = 'Closed Lost';
        break;
      default:
        stage = 'Prospecting';
    }

    // Mapping zwischen ERP-Auftragsdaten und Salesforce Opportunity-Feldern
    return {
      Name: `${auftragData.auftragsNummer || ''} - ${auftragData.kunde?.name || 'Unbekannter Kunde'}`,
      Amount: auftragData.gesamtbetrag || 0,
      CloseDate: auftragData.liefertermin || auftragData.datum || new Date().toISOString().substring(0, 10),
      StageName: stage,
      Type: auftragData.auftragsart || '',
      Description: auftragData.bemerkung || '',
      // Benutzerdefinierte Felder
      ERP_ID__c: auftragData.id || '',
      ERP_OrderNumber__c: auftragData.auftragsNummer || '',
      ERP_OrderDate__c: auftragData.datum || null,
      ERP_DeliveryDate__c: auftragData.liefertermin || null,
      ERP_CustomerReference__c: auftragData.bestellNummer || '',
      ERP_TaxAmount__c: auftragData.steuerbetrag || 0,
      ERP_NetAmount__c: auftragData.nettobetrag || 0,
      ERP_Currency__c: auftragData.waehrung || 'EUR',
      ERP_Status__c: auftragData.status || '',
      ERP_LastModified__c: auftragData.lastModified || null
    };
  } catch (error) {
    logger.error('Fehler beim Mapping von Auftrag zu Opportunity:', error);
    throw error;
  }
};

/**
 * Kunden aus dem ERP-System in Salesforce Account-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformKundenZuAccounts = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { limit = 25, offset = 0, search = '' } = req.query;
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (search) {
      params.search = search;
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/customers', params);
    
    // Transformation durchführen
    const transformedAccounts = (apiResponse.items || []).map(kunde => mapKundeToAccount(kunde));
    
    logger.info(`${transformedAccounts.length} Kunden zu Salesforce Accounts transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        totalCount: apiResponse.totalCount || transformedAccounts.length,
        items: transformedAccounts
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation von Kunden zu Accounts:', error);
    next(error);
  }
};

/**
 * Einen bestimmten Kunden in Salesforce Account-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformKundeZuAccount = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/customers/${id}`);
    
    if (!apiResponse) {
      throw new NotFoundError(`Kunde mit ID ${id} nicht gefunden`);
    }
    
    // Transformation durchführen
    const transformedAccount = mapKundeToAccount(apiResponse);
    
    logger.info(`Kunde ${id} zu Salesforce Account transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformedAccount
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation eines Kunden zu Account:', error);
    next(error);
  }
};

/**
 * Artikel aus dem ERP-System in Salesforce Product-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformArtikelZuProducts = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { limit = 25, offset = 0, search = '' } = req.query;
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (search) {
      params.search = search;
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/items', params);
    
    // Transformation durchführen
    const transformedProducts = (apiResponse.items || []).map(artikel => mapArtikelToProduct(artikel));
    
    logger.info(`${transformedProducts.length} Artikel zu Salesforce Products transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        totalCount: apiResponse.totalCount || transformedProducts.length,
        items: transformedProducts
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation von Artikeln zu Products:', error);
    next(error);
  }
};

/**
 * Einen bestimmten Artikel in Salesforce Product-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformArtikelZuProduct = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/items/${id}`);
    
    if (!apiResponse) {
      throw new NotFoundError(`Artikel mit ID ${id} nicht gefunden`);
    }
    
    // Transformation durchführen
    const transformedProduct = mapArtikelToProduct(apiResponse);
    
    logger.info(`Artikel ${id} zu Salesforce Product transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformedProduct
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation eines Artikels zu Product:', error);
    next(error);
  }
};

/**
 * Aufträge aus dem ERP-System in Salesforce Opportunity-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformAuftraegeZuOpportunities = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { 
      status = '', 
      von = '', 
      bis = '', 
      limit = 25, 
      offset = 0 
    } = req.query;
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (status) params.status = status;
    if (von) params.dateFrom = von;
    if (bis) params.dateTo = bis;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/orders', params);
    
    // Transformation durchführen
    const transformedOpportunities = (apiResponse.items || []).map(auftrag => mapAuftragToOpportunity(auftrag));
    
    logger.info(`${transformedOpportunities.length} Aufträge zu Salesforce Opportunities transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        totalCount: apiResponse.totalCount || transformedOpportunities.length,
        items: transformedOpportunities
      }
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation von Aufträgen zu Opportunities:', error);
    next(error);
  }
};

/**
 * Einen bestimmten Auftrag in Salesforce Opportunity-Format umwandeln
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const transformAuftragZuOpportunity = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/orders/${id}`);
    
    if (!apiResponse) {
      throw new NotFoundError(`Auftrag mit ID ${id} nicht gefunden`);
    }
    
    // Transformation durchführen
    const transformedOpportunity = mapAuftragToOpportunity(apiResponse);
    
    logger.info(`Auftrag ${id} zu Salesforce Opportunity transformiert`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformedOpportunity
    });
  } catch (error) {
    logger.error('Fehler bei der Transformation eines Auftrags zu Opportunity:', error);
    next(error);
  }
};

/**
 * Benutzerdefinierte Datentransformation mit angegebenem Mapping
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const customTransformation = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { sourceData, mapping } = req.body;
    
    if (!sourceData || !mapping) {
      throw new ValidationError('Quelldaten und Mapping sind erforderlich');
    }
    
    // Benutzerdefinierte Transformation durchführen
    const transformedData = {};
    
    Object.keys(mapping).forEach(targetField => {
      const sourceField = mapping[targetField];
      
      // Komplexe Mappings mit verschachtelten Feldern unterstützen (z.B. "kunde.name")
      if (sourceField.includes('.')) {
        const parts = sourceField.split('.');
        let value = sourceData;
        
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
        
        transformedData[targetField] = value !== undefined ? value : null;
      } else {
        // Einfaches Mapping
        transformedData[targetField] = sourceData[sourceField] !== undefined 
          ? sourceData[sourceField] 
          : null;
      }
    });
    
    logger.info('Benutzerdefinierte Transformation durchgeführt');
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformedData
    });
  } catch (error) {
    logger.error('Fehler bei der benutzerdefinierten Transformation:', error);
    next(error);
  }
};

/**
 * Liste aller verfügbaren Transformationen abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getTransformationsList = async (req, res, next) => {
  try {
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir diese aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir ein leeres Array zurück
    const transformations = [];

    logger.info('Transformationsliste abgerufen (leere Liste)');
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformations
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Transformationsliste:', error);
    next(error);
  }
};

/**
 * Details einer bestimmten Transformation abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getTransformationById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir diese aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir einen 404-Fehler zurück
    
    logger.info(`Transformation ${id} nicht gefunden`);
    
    throw new NotFoundError(`Transformation mit ID ${id} nicht gefunden`);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Transformation ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Neue Transformation erstellen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const createTransformation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { name, source, target, direction, objectType, active, transformationCode } = req.body;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würde hier die Erstellung einer neuen Transformation in der Datenbank erfolgen
    logger.info('Anfrage zur Erstellung einer neuen Transformation erhalten, aber Funktion ist noch nicht vollständig implementiert');
    
    return res.status(StatusCodes.NOT_IMPLEMENTED).json({
      status: 'error',
      message: 'Die Erstellung neuer Transformationen ist noch nicht implementiert'
    });
  } catch (error) {
    logger.error('Fehler beim Erstellen einer neuen Transformation:', error);
    next(error);
  }
};

/**
 * Bestehende Transformation aktualisieren
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const updateTransformation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    const { name, source, target, direction, objectType, active, transformationCode } = req.body;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würden wir die Transformation aus einer Datenbank abrufen
    // Da wir aktuell keine Mock-Daten mehr wollen, geben wir einen 404-Fehler zurück
    
    logger.error(`Transformation mit ID ${id} nicht gefunden (keine Mock-Daten mehr)`);
    throw new NotFoundError(`Transformation mit ID ${id} nicht gefunden`);
    
    // Der Rest dieser Funktion wird nicht mehr erreicht, da wir immer einen Fehler werfen
    // In einer echten Implementierung würde hier die Transformation aktualisiert werden
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren der Transformation ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Transformation löschen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const deleteTransformation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Keine simulierten Daten mehr verwenden
    // In einer echten Anwendung würde hier die Löschung einer Transformation in der Datenbank erfolgen
    logger.info(`Anfrage zum Löschen der Transformation ${id} erhalten, aber Funktion ist noch nicht vollständig implementiert`);
    
    return res.status(StatusCodes.NOT_IMPLEMENTED).json({
      status: 'error',
      message: `Das Löschen von Transformationen ist noch nicht implementiert`
    });
  } catch (error) {
    logger.error(`Fehler beim Löschen der Transformation ${req.params.id}:`, error);
    next(error);
  }
};

module.exports = {
  transformKundenZuAccounts,
  transformKundeZuAccount,
  transformArtikelZuProducts,
  transformArtikelZuProduct,
  transformAuftraegeZuOpportunities,
  transformAuftragZuOpportunity,
  customTransformation,
  getTransformationsList,
  getTransformationById,
  createTransformation,
  updateTransformation,
  deleteTransformation
}; 