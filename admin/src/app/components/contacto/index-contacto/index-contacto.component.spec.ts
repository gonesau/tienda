import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexContactoComponent } from './index-contacto.component';

describe('IndexContactoComponent', () => {
  let component: IndexContactoComponent;
  let fixture: ComponentFixture<IndexContactoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexContactoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexContactoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
