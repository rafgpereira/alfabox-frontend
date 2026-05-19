import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenancesAssemblers } from './maintenances-assemblers';

describe('MaintenancesAssemblers', () => {
  let component: MaintenancesAssemblers;
  let fixture: ComponentFixture<MaintenancesAssemblers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenancesAssemblers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenancesAssemblers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
