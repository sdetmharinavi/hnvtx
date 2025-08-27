// types/ofcForm.types.ts
export interface FormLoadingState {
    nodes: boolean;
    ofcTypes: boolean;
    maintenanceTerminals: boolean;
    routeGeneration: boolean;
    form: boolean;
  }
  
  export interface NodeOption {
    id: string;
    name: string;
    nodeType: string;
    status: boolean;
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    warnings?: Record<string, string>;
  }