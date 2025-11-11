import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexDescuentoComponent } from './index-descuento.component';

describe('IndexDescuentoComponent', () => {
  let component: IndexDescuentoComponent;
  let fixture: ComponentFixture<IndexDescuentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexDescuentoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexDescuentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
