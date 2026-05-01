import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionsAssemblers } from './executions-assemblers';

describe('ExecutionsAssemblers', () => {
  let component: ExecutionsAssemblers;
  let fixture: ComponentFixture<ExecutionsAssemblers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutionsAssemblers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExecutionsAssemblers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
