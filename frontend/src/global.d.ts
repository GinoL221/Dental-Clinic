export {};

declare global {
  class uPlot {
    constructor(opts: any, data: any[], target: HTMLElement);
    destroy(): void;
    setData(data: any[]): void;
    setScale(scale: string, limits: any): void;
    setSize(size: { width: number; height: number }): void;
    static paths: {
      spline: () => any;
      [key: string]: any;
    };
  }

  interface Window {
    // --- Flags & Config ---
    APP_DEBUG: boolean | string | undefined;
    isAdmin: boolean | (() => boolean) | undefined;
    currentUser: { id: number; firstName: string; lastName: string; email: string; role: string; token?: string } | null | undefined;
    serverData: { user: { id: number; firstName: string; lastName: string; email: string; role: string } | null; isAdmin: boolean; appointmentId?: string; [k: string]: any } | undefined;
    dentistId: string | number | undefined;
    patientId: string | number | undefined;
    currentSort: { field: string | null; direction: string } | undefined;
    __ENV__: { API_BASE_URL?: string; [key: string]: any } | undefined;

    // --- API & Utility Objects ---
    AuthAPI: typeof import('./public/js/api/auth-api.js').default;
    AuthUtils: {
      setupLogoutConfirmation(): void;
      isLoggedIn(): boolean;
      getUserInfo(): { email: string | null; role: string | null } | null;
    };
    XLSX: any;

    // --- Controller Instances ---
    dentistController: InstanceType<typeof import('./public/js/dentist/modules/index.js').default> | undefined;
    patientController: InstanceType<typeof import('./public/js/patient/modules/index.js').default> | undefined;
    appointmentController: InstanceType<typeof import('./public/js/appointment/modules/index.js').default> | undefined;
    authController: any;
    dashboardController: any;

    // --- Patient Controller/Global Functions ---
    filterPatients: ((criteria: any) => void) | undefined;
    debugPatientListController: (() => void) | undefined;
    loadPatientsList: (() => Promise<any>) | undefined;
    searchPatients: ((searchTerm: string) => void) | undefined;
    clearPatientSearch: (() => void) | undefined;
    showPatientStats: (() => void) | undefined;
    exportPatients: ((format?: any) => void) | undefined;
    processEditPatient: ((formData?: any) => Promise<void>) | undefined;
    cancelPatientEdit: (() => void) | undefined;
    validateEditForm: ((formId?: string) => { isValid: boolean; errors: string[]; } | boolean) | undefined;
    reloadPatientData: (() => Promise<void>) | undefined;
    getCurrentPatientData: (() => any) | undefined;
    hasUnsavedChanges: (() => boolean) | undefined;
    originalPatientData: any;
    debugPatientEditController: (() => void) | undefined;

    // --- Appointment Controller/Global Functions ---
    refreshAppointments: (() => any) | undefined;
    exportAppointmentData: ((format?: string) => any) | undefined;
    getAppointmentStats: (() => any) | undefined;
    addAppointment: ((appointmentData: any) => Promise<any>) | undefined;
    editAppointment: ((appointmentId: any, appointmentData: any) => Promise<any>) | undefined;
    deleteAppointment: ((appointmentId: any) => Promise<any>) | undefined;
    debugAppointmentController: (() => void) | undefined;
    confirmDeleteAppointment: ((appointmentId: any, patientName?: string) => Promise<any>) | undefined;
    loadAppointmentsList: (() => Promise<any>) | undefined;
    filterAppointments: ((filterData: any) => void) | undefined;
    searchAppointments: ((searchTerm: string) => void) | undefined;
    sortAppointments: ((sortBy: string, order?: string) => void) | undefined;
    paginateAppointments: ((page: number, limit?: number) => void) | undefined;
    refreshAppointmentsList: (() => Promise<any>) | undefined;
    getActiveFilters: (() => any) | undefined;
    clearFilters: (() => void) | undefined;
    selectAppointment: ((appointmentId: any) => void) | undefined;
    getSelectedAppointments: (() => any[]) | undefined;
    bulkDeleteAppointments: ((appointmentIds: any[]) => Promise<any>) | undefined;
    debugAppointmentListController: (() => void) | undefined;

    // Catch-all index signature to prevent any new TS2339 errors on the window object
    [key: string]: any;
  }
}
