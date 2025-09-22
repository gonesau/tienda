import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';
declare var iziToast: any;

@Component({
  selector: 'app-create-cupon',
  templateUrl: './create-cupon.component.html',
  styleUrls: ['./create-cupon.component.css']
})
export class CreateCuponComponent implements OnInit {


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

  ngOnInit(): void {
  }


  registro(registroForm) {
    if (registroForm.valid) {
      this.load_btn = true;
      this._cuponService.registro_cupon_admin(this.cupon, this.token).subscribe(
        response => {
          iziToast.show({
            title: 'Éxito',
            message: 'Cupon registrado correctamente',
            position: 'topRight',
            class: 'text-success',
            titleColor: '#1DC74C',
          });
          this.load_btn = false;
          this._router.navigate(['/panel/cupones']);

        }, error => {
          console.log(error);
          this.load_btn = false;
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: error.error.message
          });
        }
      )
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son válidos',
      });
    }
  }

}
