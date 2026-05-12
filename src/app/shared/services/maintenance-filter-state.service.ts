import { Injectable } from '@angular/core';

export interface MaintenanceFilterState {
  startDate: Date | null;
  endDate: Date | null;
  selectedMonth: Date | null;
  searchText: string;
  searchMode: boolean;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceFilterStateService {
  private state: MaintenanceFilterState | null = null;

  save(state: MaintenanceFilterState): void {
    this.state = { ...state };
  }

  restore(): MaintenanceFilterState | null {
    return this.state;
  }

  clear(): void {
    this.state = null;
  }
}
