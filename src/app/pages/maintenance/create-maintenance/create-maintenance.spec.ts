import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMaintenance } from './create-maintenance';

describe('CreateMaintenance', () => {
  let component: CreateMaintenance;
  let fixture: ComponentFixture<CreateMaintenance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMaintenance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMaintenance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
