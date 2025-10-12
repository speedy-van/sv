export interface BookingItem {
  id: string;
  name: string;
  quantity: number;
  volume?: number;
  weight?: number;
  description?: string;
}

export interface PropertyInfo {
  type?: string;
  floors?: number;
  accessType?: 'WITH_LIFT' | 'NO_LIFT';
  buildingTypeDisplay?: string;
}

export interface SmartSuggestion {
  type: 'info' | 'warning' | 'alert';
  category: 'workers' | 'equipment' | 'access' | 'handling' | 'tools' | 'zones' | 'timing';
  title: string;
  description: string;
}