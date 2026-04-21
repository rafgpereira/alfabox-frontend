import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceOrder } from './service-order';

describe('ServiceOrder', () => {
  let component: ServiceOrder;
  let fixture: ComponentFixture<ServiceOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
