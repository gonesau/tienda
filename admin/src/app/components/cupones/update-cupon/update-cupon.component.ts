import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';

@Component({
  selector: 'app-update-cupon',
  templateUrl: './update-cupon.component.html',
  styleUrls: ['./update-cupon.component.css'],
})
export class UpdateCuponComponent implements OnInit {
  public token;
  public cupon: any = {
    tipo: '',
  };
  public load_btn = false;

  constructor(
    private _cuponService: CuponService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void { }

  actualizar(actualizarForm) {
    
  }
}
