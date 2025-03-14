import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import CodeEditor from '../components/CodeEditor';
import { useQuery } from 'react-query';
import { transformationApi, statsApi } from '../services/api';

const Transformations = () => {
  // State für aktiven Tab
  const [tabValue, setTabValue] = useState(0);
  
  // API-Daten laden mit React Query
  const { data: transformationsResponse, isLoading: transformationsLoading, error: transformationsError } = 
    useQuery('transformations', transformationApi.getTransformations);
  
  // Statistiken laden mit React Query
  const { data: statsResponse } = useQuery('transformationStats', 
    () => statsApi.getTransformationStats({ timeRange: '7d' }));
  
  // Transformationen aus API-Antwort extrahieren
  const transformationsData = transformationsResponse?.data?.data || [];
  
  // Transformations-Statistiken aus API-Antwort extrahieren
  const transformationStats = statsResponse?.data?.data || {
    total: 0,
    active: 0,
    history: [],
    usage: { labels: [], data: [] }
  };
  
  // State für Transformationen (wird aus API-Daten gefüllt oder mit Fallback-Daten)
  const [transformations, setTransformations] = useState([]);
  
  // Daten aus der API übernehmen, wenn sie geladen sind
  useEffect(() => {
    if (transformationsData.length > 0) {
      setTransformations(transformationsData);
    }
  }, [transformationsData]);
  
  // Fallback, wenn keine Daten vorhanden sind (für die lokale Entwicklung)
  useEffect(() => {
    if (transformations.length === 0 && !transformationsLoading) {
      setTransformations([
        {
          id: 1,
          name: 'Kunden nach Shopify',
          source: 'erp',
          target: 'shopify',
          direction: 'erp_to_external',
          objectType: 'customer',
          active: true,
          lastRun: '2023-08-15T12:30:45',
          transformationCode: `// Beispiel-Transformation für Kunden nach Shopify
function transform(customer) {
  return {
    first_name: customer.vorname,
    last_name: customer.name,
    email: customer.email,
    phone: customer.telefon,
    addresses: [
      {
        address1: customer.strasse,
        city: customer.ort,
        zip: customer.plz,
        country_code: "DE"
      }
    ],
    metafields: [
      {
        key: "customer_id",
        value: customer.kundennummer,
        namespace: "erp"
      }
    ]
  };
}`,
        },
        {
          id: 2,
          name: 'Produkte nach WooCommerce',
          source: 'erp',
          target: 'woocommerce',
          direction: 'erp_to_external',
          objectType: 'product',
          active: true,
          lastRun: '2023-08-14T10:15:22',
          transformationCode: `// Beispiel-Transformation für Produkte nach WooCommerce
function transform(product) {
  return {
    name: product.bezeichnung,
    sku: product.artikelnummer,
    regular_price: product.verkaufspreis.toString(),
    description: product.langtext || "",
    short_description: product.kurztext || "",
    categories: product.warengruppen.map(wg => ({ name: wg })),
    images: product.bilder.map(bild => ({ src: bild.url })),
    stock_quantity: product.lagerbestand,
    manage_stock: true,
    weight: product.gewicht ? product.gewicht.toString() : "0"
  };
}`,
        },
        {
          id: 3,
          name: 'Bestellungen von Shopify',
          source: 'shopify',
          target: 'erp',
          direction: 'external_to_erp',
          objectType: 'order',
          active: true,
          lastRun: '2023-08-15T08:45:12',
          transformationCode: `// Beispiel-Transformation für Bestellungen von Shopify
function transform(order) {
  return {
    auftragsnummer: \`SHOP-\${order.order_number}\`,
    kunde: {
      kundennummer: order.customer.metafields.find(mf => mf.key === "customer_id")?.value,
      name: order.customer.last_name,
      vorname: order.customer.first_name,
      email: order.customer.email
    },
    positionen: order.line_items.map((item, index) => ({
      positionsnummer: index + 1,
      artikelnummer: item.sku,
      menge: item.quantity,
      einzelpreis: parseFloat(item.price)
    })),
    zahlungsart: order.payment_method_title,
    versandart: order.shipping_lines[0]?.method_title || "Standard",
    lieferadresse: {
      name: order.shipping.last_name,
      vorname: order.shipping.first_name,
      strasse: order.shipping.address_1,
      plz: order.shipping.postcode,
      ort: order.shipping.city
    }
  };
}`,
        },
      ]);
    }
  }, [transformationsLoading, transformations.length]);
  
  // State für Dialog zum Erstellen/Bearbeiten von Transformationen
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransformation, setCurrentTransformation] = useState({
    name: '',
    source: '',
    target: '',
    direction: '',
    objectType: '',
    active: true,
    transformationCode: '',
  });
  
  // State für Testdaten-Dialog
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  
  // State für Snackbar-Benachrichtigungen
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // State für Ausführungsprotokoll
  const [executionLogs, setExecutionLogs] = useState([
    {
      id: 1,
      transformationId: 1,
      transformationName: 'Kunden nach Shopify',
      timestamp: '2023-08-15T12:30:45',
      status: 'success',
      objectsProcessed: 25,
      objectsSucceeded: 25,
      objectsFailed: 0,
      duration: 3.2,
      details: []
    },
    {
      id: 2,
      transformationId: 2,
      transformationName: 'Produkte nach WooCommerce',
      timestamp: '2023-08-14T10:15:22',
      status: 'partial',
      objectsProcessed: 150,
      objectsSucceeded: 147,
      objectsFailed: 3,
      duration: 12.8,
      details: [
        { objectId: '12345', error: 'Ungültige Produktkategorie' },
        { objectId: '23456', error: 'Preis darf nicht negativ sein' },
        { objectId: '34567', error: 'Bild-URL nicht erreichbar' }
      ]
    },
    {
      id: 3,
      transformationId: 3,
      transformationName: 'Bestellungen von Shopify',
      timestamp: '2023-08-15T08:45:12',
      status: 'success',
      objectsProcessed: 5,
      objectsSucceeded: 5,
      objectsFailed: 0,
      duration: 1.5,
      details: []
    },
  ]);
  
  // Systeme und Objekttypen für Dropdown-Menüs
  const systems = [
    { id: 'erp', name: 'SelectLine ERP' },
    { id: 'shopify', name: 'Shopify' },
    { id: 'woocommerce', name: 'WooCommerce' },
    { id: 'magento', name: 'Magento' },
    { id: 'api', name: 'Custom API' },
  ];
  
  const objectTypes = [
    { id: 'customer', name: 'Kunde' },
    { id: 'product', name: 'Artikel' },
    { id: 'order', name: 'Auftrag' },
    { id: 'invoice', name: 'Rechnung' },
    { id: 'delivery', name: 'Lieferschein' },
    { id: 'stock', name: 'Lagerbestand' },
  ];
  
  // Handler für Tabwechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handler für Dialog öffnen (Neu)
  const handleOpenCreateDialog = () => {
    setEditMode(false);
    setCurrentTransformation({
      name: '',
      source: '',
      target: '',
      direction: '',
      objectType: '',
      active: true,
      transformationCode: `// Neue Transformation
function transform(input) {
  // Transformieren Sie das Eingabe-Objekt hier
  return {
    // Ausgabe-Objekt
  };
}`,
    });
    setDialogOpen(true);
  };
  
  // Handler für Dialog öffnen (Bearbeiten)
  const handleOpenEditDialog = (transformation) => {
    setEditMode(true);
    setCurrentTransformation({ ...transformation });
    setDialogOpen(true);
  };
  
  // Handler für Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Handler für Richtungswechsel
  const handleDirectionChange = (direction) => {
    const newCurrentTransformation = { ...currentTransformation, direction };
    if (direction === 'erp_to_external') {
      newCurrentTransformation.source = 'erp';
    } else if (direction === 'external_to_erp') {
      newCurrentTransformation.target = 'erp';
    }
    setCurrentTransformation(newCurrentTransformation);
  };
  
  // Handler für Transformation speichern
  const handleSaveTransformation = () => {
    if (editMode) {
      // Vorhandene Transformation aktualisieren
      setTransformations(transformations.map(t => 
        t.id === currentTransformation.id ? currentTransformation : t
      ));
      setSnackbar({
        open: true,
        message: 'Transformation erfolgreich aktualisiert',
        severity: 'success',
      });
    } else {
      // Neue Transformation erstellen
      const newTransformation = {
        ...currentTransformation,
        id: Math.max(...transformations.map(t => t.id), 0) + 1,
        lastRun: null,
      };
      setTransformations([...transformations, newTransformation]);
      setSnackbar({
        open: true,
        message: 'Neue Transformation erfolgreich erstellt',
        severity: 'success',
      });
    }
    setDialogOpen(false);
  };
  
  // Handler für Transformation löschen
  const handleDeleteTransformation = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Transformation löschen möchten?')) {
      setTransformations(transformations.filter(t => t.id !== id));
      setSnackbar({
        open: true,
        message: 'Transformation erfolgreich gelöscht',
        severity: 'success',
      });
    }
  };
  
  // Handler für Transformation ausführen
  const handleRunTransformation = (id) => {
    // Hier würde normalerweise ein API-Aufruf stattfinden
    // Für Demozwecke erstellen wir einen neuen Log-Eintrag
    const transformation = transformations.find(t => t.id === id);
    const newLog = {
      id: Math.max(...executionLogs.map(log => log.id), 0) + 1,
      transformationId: id,
      transformationName: transformation.name,
      timestamp: new Date().toISOString(),
      status: Math.random() > 0.2 ? 'success' : 'partial',
      objectsProcessed: Math.floor(Math.random() * 100) + 1,
      objectsFailed: 0,
      duration: (Math.random() * 10).toFixed(1),
      details: [],
    };
    
    newLog.objectsSucceeded = newLog.status === 'success' 
      ? newLog.objectsProcessed 
      : newLog.objectsProcessed - Math.floor(Math.random() * 3) - 1;
      
    newLog.objectsFailed = newLog.objectsProcessed - newLog.objectsSucceeded;
    
    if (newLog.objectsFailed > 0) {
      newLog.details = Array.from({ length: newLog.objectsFailed }).map((_, i) => ({
        objectId: Math.floor(Math.random() * 100000).toString(),
        error: ['Ungültiges Format', 'Pflichtfeld fehlt', 'API-Fehler'][Math.floor(Math.random() * 3)],
      }));
    }
    
    setExecutionLogs([newLog, ...executionLogs]);
    
    // Letzte Ausführungszeit aktualisieren
    setTransformations(transformations.map(t => 
      t.id === id ? { ...t, lastRun: newLog.timestamp } : t
    ));
    
    setSnackbar({
      open: true,
      message: `Transformation "${transformation.name}" wurde ausgeführt. Status: ${
        newLog.status === 'success' ? 'Erfolgreich' : 'Teilweise erfolgreich'
      }`,
      severity: newLog.status === 'success' ? 'success' : 'warning',
    });
  };
  
  // Handler für Testdialog öffnen
  const handleOpenTestDialog = (transformation) => {
    setCurrentTransformation(transformation);
    setTestInput(JSON.stringify({
      // Beispiel-Eingabedaten basierend auf dem Objekttyp
      ...(transformation.objectType === 'customer' && {
        kundennummer: "10001",
        name: "Mustermann",
        vorname: "Max",
        email: "max.mustermann@example.com",
        telefon: "+49 123 456789",
        strasse: "Musterstraße 123",
        plz: "12345",
        ort: "Musterstadt"
      }),
      ...(transformation.objectType === 'product' && {
        artikelnummer: "A12345",
        bezeichnung: "Beispielprodukt",
        verkaufspreis: 29.99,
        langtext: "Dies ist eine ausführliche Beschreibung des Produkts.",
        kurztext: "Kurzbeschreibung",
        warengruppen: ["Elektronik", "Zubehör"],
        bilder: [{ url: "https://example.com/bild1.jpg" }],
        lagerbestand: 100,
        gewicht: 1.5
      }),
      ...(transformation.objectType === 'order' && {
        order_number: "1001",
        customer: {
          first_name: "Max",
          last_name: "Mustermann",
          email: "max.mustermann@example.com",
          metafields: [{ key: "customer_id", value: "10001" }]
        },
        line_items: [
          { sku: "A12345", quantity: 2, price: "29.99" }
        ],
        payment_method_title: "Kreditkarte",
        shipping_lines: [{ method_title: "Standard" }],
        shipping: {
          first_name: "Max",
          last_name: "Mustermann",
          address_1: "Musterstraße 123",
          postcode: "12345",
          city: "Musterstadt"
        }
      })
    }, null, 2));
    
    setTestOutput('');
    setTestError(null);
    setTestDialogOpen(true);
  };
  
  // Handler für Testdialog schließen
  const handleCloseTestDialog = () => {
    setTestDialogOpen(false);
  };
  
  // Handler für Test ausführen
  const handleRunTest = () => {
    setTestLoading(true);
    setTestError(null);
    
    // Transformationslogik im Browser ausführen (Sandbox wäre in Produktion erforderlich)
    try {
      setTimeout(() => {
        try {
          const inputData = JSON.parse(testInput);
          
          // Code evaluieren
          const transformFunctionBody = currentTransformation.transformationCode;
          const transformationFunction = new Function('input', `
            ${transformFunctionBody}
            return transform(input);
          `);
          
          const result = transformationFunction(inputData);
          
          setTestOutput(JSON.stringify(result, null, 2));
          setTestLoading(false);
        } catch (error) {
          setTestError(error.message);
          setTestLoading(false);
        }
      }, 500); // Simulierte Verzögerung
    } catch (error) {
      setTestError("Fehler beim Parsen der Eingabedaten: " + error.message);
      setTestLoading(false);
    }
  };
  
  // Handler für Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };
  
  // Hilfsfunktion zum Formatieren des Zeitstempels
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('de-DE');
    } catch (e) {
      return 'Niemals';
    }
  };
  
  // Hilfsfunktion zum Formatieren der Dauer
  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes} min ${remainingSeconds} s`;
  };

  // Render-Logik für die Statistik-Karte
  const renderStatisticsCard = () => {
    if (!statsResponse) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }

    return (
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Gesamt</Typography>
          <Typography variant="h6">{transformationStats.total}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Aktiv</Typography>
          <Typography variant="h6">{transformationStats.active}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Inaktiv</Typography>
          <Typography variant="h6">{transformationStats.total - transformationStats.active}</Typography>
        </Box>
        {transformationStats.usage?.labels?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>Meist verwendet:</Typography>
            <Typography variant="h6">
              {transformationStats.usage.labels[
                transformationStats.usage.data.indexOf(Math.max(...transformationStats.usage.data))
              ] || 'N/A'}
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  // Zeige Ladeindikator, wenn Daten noch geladen werden
  if (transformationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Zeige Fehlermeldung, wenn ein Fehler aufgetreten ist
  if (transformationsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Transformationen: {transformationsError.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Datentransformationen
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Hier können Sie Datentransformationen zwischen dem ERP-System und externen Systemen definieren und verwalten.
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transformation tabs">
          <Tab label="Transformationen" id="tab-0" />
          <Tab label="Ausführungsverlauf" id="tab-1" />
        </Tabs>
      </Box>
      
      {/* Tab: Transformationen */}
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Neue Transformation
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Richtung</TableCell>
                  <TableCell>Objekttyp</TableCell>
                  <TableCell>Quelle</TableCell>
                  <TableCell>Ziel</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Letzte Ausführung</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transformations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Keine Transformationen gefunden. Klicken Sie auf "Neue Transformation" um zu beginnen.
                    </TableCell>
                  </TableRow>
                ) : (
                  transformations.map((transformation) => (
                    <TableRow key={transformation.id}>
                      <TableCell>{transformation.name}</TableCell>
                      <TableCell>
                        {transformation.direction === 'erp_to_external' ? 'ERP → Extern' : 'Extern → ERP'}
                      </TableCell>
                      <TableCell>
                        {objectTypes.find(t => t.id === transformation.objectType)?.name || transformation.objectType}
                      </TableCell>
                      <TableCell>
                        {systems.find(s => s.id === transformation.source)?.name || transformation.source}
                      </TableCell>
                      <TableCell>
                        {systems.find(s => s.id === transformation.target)?.name || transformation.target}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={transformation.active}
                              onChange={(e) => {
                                setTransformations(transformations.map(t => 
                                  t.id === transformation.id ? { ...t, active: e.target.checked } : t
                                ));
                              }}
                              color="primary"
                              size="small"
                            />
                          }
                          label={transformation.active ? "Aktiv" : "Inaktiv"}
                          sx={{ m: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        {transformation.lastRun ? formatTimestamp(transformation.lastRun) : 'Nie'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            color="primary" 
                            aria-label="ausführen"
                            onClick={() => handleRunTransformation(transformation.id)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                          <IconButton 
                            color="primary" 
                            aria-label="testen"
                            onClick={() => handleOpenTestDialog(transformation)}
                          >
                            <CodeIcon />
                          </IconButton>
                          <IconButton 
                            color="primary" 
                            aria-label="bearbeiten"
                            onClick={() => handleOpenEditDialog(transformation)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            aria-label="löschen"
                            onClick={() => handleDeleteTransformation(transformation.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      {/* Tab: Ausführungsverlauf */}
      {tabValue === 1 && (
        <Paper>
          {executionLogs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Keine Ausführungsprotokolle vorhanden.
              </Typography>
            </Box>
          ) : (
            executionLogs.map((log) => (
              <Accordion key={log.id}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`log-${log.id}-content`}
                  id={`log-${log.id}-header`}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                      <Typography variant="subtitle1">
                        {log.transformationName}
                      </Typography>
                    </Grid>
                    <Grid item xs={2.5}>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Chip
                        label={log.status === 'success' ? 'Erfolgreich' : 'Teilweise erfolgreich'}
                        color={log.status === 'success' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">
                        {log.objectsSucceeded} / {log.objectsProcessed} Objekte
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" color="text.secondary">
                        Dauer: {formatDuration(log.duration)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  {log.objectsFailed > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Fehlerdetails ({log.objectsFailed} Fehler)
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Objekt-ID</TableCell>
                              <TableCell>Fehlermeldung</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {log.details.map((detail, index) => (
                              <TableRow key={index}>
                                <TableCell>{detail.objectId}</TableCell>
                                <TableCell>{detail.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Alert severity="success">
                      Alle {log.objectsProcessed} Objekte wurden erfolgreich verarbeitet.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>
      )}
      
      {/* Dialog zum Erstellen/Bearbeiten von Transformationen */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editMode ? 'Transformation bearbeiten' : 'Neue Transformation erstellen'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={currentTransformation.name}
                onChange={(e) => setCurrentTransformation({ ...currentTransformation, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="direction-label">Richtung</InputLabel>
                <Select
                  labelId="direction-label"
                  value={currentTransformation.direction}
                  label="Richtung"
                  onChange={(e) => handleDirectionChange(e.target.value)}
                >
                  <MenuItem value="erp_to_external">ERP → Externes System</MenuItem>
                  <MenuItem value="external_to_erp">Externes System → ERP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel id="source-label">Quellsystem</InputLabel>
                <Select
                  labelId="source-label"
                  value={currentTransformation.source}
                  label="Quellsystem"
                  onChange={(e) => setCurrentTransformation({ ...currentTransformation, source: e.target.value })}
                  disabled={currentTransformation.direction === 'erp_to_external'}
                >
                  {systems.map((system) => (
                    <MenuItem 
                      key={system.id} 
                      value={system.id}
                      disabled={
                        (currentTransformation.direction === 'erp_to_external' && system.id !== 'erp') ||
                        (currentTransformation.direction === 'external_to_erp' && system.id === 'erp')
                      }
                    >
                      {system.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel id="target-label">Zielsystem</InputLabel>
                <Select
                  labelId="target-label"
                  value={currentTransformation.target}
                  label="Zielsystem"
                  onChange={(e) => setCurrentTransformation({ ...currentTransformation, target: e.target.value })}
                  disabled={currentTransformation.direction === 'external_to_erp'}
                >
                  {systems.map((system) => (
                    <MenuItem 
                      key={system.id} 
                      value={system.id}
                      disabled={
                        (currentTransformation.direction === 'external_to_erp' && system.id !== 'erp') ||
                        (currentTransformation.direction === 'erp_to_external' && system.id === 'erp')
                      }
                    >
                      {system.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel id="object-type-label">Objekttyp</InputLabel>
                <Select
                  labelId="object-type-label"
                  value={currentTransformation.objectType}
                  label="Objekttyp"
                  onChange={(e) => setCurrentTransformation({ ...currentTransformation, objectType: e.target.value })}
                >
                  {objectTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentTransformation.active}
                    onChange={(e) => setCurrentTransformation({ ...currentTransformation, active: e.target.checked })}
                    color="primary"
                  />
                }
                label="Aktiv"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Transformationscode
              </Typography>
              <Paper variant="outlined" sx={{ height: 400 }}>
                <CodeEditor
                  value={currentTransformation.transformationCode}
                  onChange={(value) => setCurrentTransformation({ ...currentTransformation, transformationCode: value })}
                  language="javascript"
                  height="400px"
                />
              </Paper>
              <Typography variant="caption" color="text.secondary">
                Implementieren Sie die transform-Funktion, um das Eingabeobjekt zu transformieren.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            onClick={handleSaveTransformation}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={
              !currentTransformation.name ||
              !currentTransformation.direction ||
              !currentTransformation.source ||
              !currentTransformation.target ||
              !currentTransformation.objectType
            }
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog zum Testen der Transformation */}
      <Dialog
        open={testDialogOpen}
        onClose={handleCloseTestDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Transformation testen: {currentTransformation?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Eingabedaten
              </Typography>
              <Paper variant="outlined" sx={{ height: 400 }}>
                <CodeEditor
                  value={testInput}
                  onChange={setTestInput}
                  language="json"
                  height="400px"
                />
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Ergebnis
                {testLoading && (
                  <CircularProgress size={20} sx={{ ml: 2 }} />
                )}
              </Typography>
              {testError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {testError}
                </Alert>
              ) : null}
              <Paper variant="outlined" sx={{ height: 400 }}>
                <CodeEditor
                  value={testOutput}
                  readOnly
                  language="json"
                  height="400px"
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>Schließen</Button>
          <Button
            onClick={handleRunTest}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={testLoading}
          >
            Test ausführen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Transformations; 