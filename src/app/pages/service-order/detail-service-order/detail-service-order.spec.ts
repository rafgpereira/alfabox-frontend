import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailServiceOrder } from './detail-service-order';

describe('DetailServiceOrder', () => {
  let component: DetailServiceOrder;
  let fixture: ComponentFixture<DetailServiceOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailServiceOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailServiceOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
