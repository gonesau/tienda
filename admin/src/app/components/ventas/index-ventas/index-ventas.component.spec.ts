import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexVentasComponent } from './index-ventas.component';

describe('IndexVentasComponent', () => {
  let component: IndexVentasComponent;
  let fixture: ComponentFixture<IndexVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexVentasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
