import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewsProductoComponent } from './reviews-producto.component';

describe('ReviewsProductoComponent', () => {
  let component: ReviewsProductoComponent;
  let fixture: ComponentFixture<ReviewsProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewsProductoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewsProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
