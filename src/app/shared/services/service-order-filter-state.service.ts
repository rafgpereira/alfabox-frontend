import { Injectable } from '@angular/core';

export interface ServiceOrderFilterState {
  startDate: Date | null;
  endDate: Date | null;
  selectedMonth: Date | null;
  searchText: string;
  searchMode: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceOrderFilterStateService {
  private state: ServiceOrderFilterState | null = null;

  save(state: ServiceOrderFilterState): void {
    this.state = { ...state };
  }

  restore(): ServiceOrderFilterState | null {
    return this.state;
  }

  clear(): void {
    this.state = null;
  }
}
