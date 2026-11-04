export const APP_ROUTES = {
  dashboard: '/dashboard',

  employers: {
    list: '/employers',
    details: (employerId: string) => `/employers/${employerId}`,
    activities: (employerId: string) =>
      `/employers/${employerId}/activities`,
  },

  employees: {
    list: '/employees',
    details: (employeeId: string) => `/employees/${employeeId}`,
  },

  trainings: {
    list: '/trainings',
    new: '/trainings/new',
    details: (trainingSessionId: string) =>
      `/trainings/${trainingSessionId}`,
  },

  medicalExaminations: {
    list: '/medical-examinations',
    new: '/medical-examinations/new',
    details: (examinationId: string) =>
      `/medical-examinations/${examinationId}`,
  },

  equipmentInspections: {
    list: '/equipment-inspections',
    new: '/equipment-inspections/new',
    details: (inspectionId: string) =>
      `/equipment-inspections/${inspectionId}`,
  },

  installations: {
    list: '/installations',
    electrical: '/installations/electrical',
    lightningProtection: '/installations/lightning-protection',
  },

  constructionSites: {
    list: '/construction-sites',
    new: '/construction-sites/new',
    details: (constructionSiteId: string) =>
      `/construction-sites/${constructionSiteId}`,
  },

  riskAssessments: {
    list: '/risk-assessments',
    new: '/risk-assessments/new',
    details: (assessmentId: string) =>
      `/risk-assessments/${assessmentId}`,
  },

  reports: '/reports',
  archive: '/archive',
  systemMessages: '/system-messages',
} as const