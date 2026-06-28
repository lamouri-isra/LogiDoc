export const COLORS = {
  primaryDark: '#0B2362',
  secondaryNavy: '#1A3A7A',
  holcimGreen: '#8AC43D',
  chartBlue: '#0B2362',
  chartGreen: '#8AC43D',
  softMint: '#CADFB3',
  greenLight: '#BAD697',
  greenPale: '#CADFB3',
  white: '#FFFFFF',
  lightBg: '#F4F7F0',
  card: '#FFFFFF',
  border: '#D4DFC8',
  textPrimary: '#1A1F2C',
  textSecondary: '#5A6478',
};

export const REGISTERABLE_ROLES = [
  { id: 'management', nom: 'Responsable / Management' },
  { id: 'fournisseur', nom: 'Fournisseur' },
  { id: 'approvisionnement', nom: 'Approvisionnement' },
  { id: 'transit', nom: 'Transit' },
  { id: 'tresorerie', nom: 'Trésorerie'},
];

export const ROLE_DEFAULT_VIEW = {
  management: 'dashboard',
  fournisseur: 'documents',
  approvisionnement: 'po',
  transit: 'transit',
  tresorerie: 'treasury',
};

export const NOTIFICATION_ROUTES = {
  documents: 'documents',
  document: 'documents',
  po: 'po',
  transit: 'transit',
  treasury: 'treasury',
  tresorerie: 'treasury',
  cheque: 'treasury',
  domiciliation: 'treasury',
  dashboard: 'dashboard',
  notifications: 'notifications',
  reports: 'reports',
  settings: 'settings',
  logs: 'logs',
  profile: 'profile',
};

export const COMMON_PROFILE_FIELDS = [
  { key: 'firstName', label: 'Prénom', type: 'text', required: true },
  { key: 'lastName', label: 'Nom', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true, disabled: true },
  { key: 'phone', label: 'Téléphone', type: 'tel' },
  { key: 'position', label: 'Poste', type: 'text' },
  { key: 'department', label: 'Département', type: 'text' },
];

export const ROLE_PROFILE_FIELDS = {
  fournisseur: [
    { key: 'companyName', label: 'Nom de la société', type: 'text' },
    { key: 'country', label: 'Pays', type: 'text' },
    { key: 'supplierCode', label: 'Code fournisseur', type: 'text' },
  ],
  approvisionnement: [
    { key: 'buyerCode', label: 'Code acheteur', type: 'text' },
  ],
  transit: [
    { key: 'transitAgency', label: 'Agence de transit', type: 'text' },
    { key: 'clearanceZone', label: 'Zone de dédouanement', type: 'text' },
  ],
  tresorerie: [
    { key: 'bankReference', label: 'Référence bancaire', type: 'text' },
    { key: 'financialDepartment', label: 'Département financier', type: 'text' },
  ],
  management: [
    { key: 'managementLevel', label: 'Niveau de management', type: 'text' },
    { key: 'globalAccessInfo', label: 'Informations d\'accès global', type: 'text' },
  ],
};

export const SYSTEM_LOGS = [
  { id: 1, time: '2026-06-16 09:12:04', level: 'info', message: 'Session utilisateur ouverte', module: 'Auth' },
  { id: 2, time: '2026-06-16 09:15:22', level: 'success', message: 'Document FACTURE validé — PO-2026-0142', module: 'Documents' },
  { id: 3, time: '2026-06-16 09:18:45', level: 'warning', message: 'Retard fournisseur détecté — PO-2026-0151', module: 'PO' },
  { id: 4, time: '2026-06-16 10:02:11', level: 'info', message: 'Dossier transit DT-2026-100 créé', module: 'Transit' },
  { id: 5, time: '2026-06-16 10:45:33', level: 'success', message: 'Domiciliation clôturée — DT-2026-100', module: 'Trésorerie' },
  { id: 6, time: '2026-06-16 11:20:08', level: 'error', message: 'Échec envoi notification email — retry planifié', module: 'System' },
];
