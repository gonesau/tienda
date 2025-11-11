import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDescuentoComponent } from './edit-descuento.component';

describe('EditDescuentoComponent', () => {
  let component: EditDescuentoComponent;
  let fixture: ComponentFixture<EditDescuentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditDescuentoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDescuentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
