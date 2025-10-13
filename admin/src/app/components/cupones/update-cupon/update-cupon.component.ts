import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-update-cupon',
  templateUrl: './update-cupon.component.html',
  styleUrls: ['./update-cupon.component.css'],
})
export class UpdateCuponComponent implements OnInit {
  
  public token: string;
  public cupon: any = undefined;
  public id: string;
  
  public load_btn = false;
  public load_data = true;

  constructor(
    private _cuponService: CuponService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    if (!this.token) {
        this._router.navigate(['/login']);
        return;
    }

    this._route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.init_data();
      } else {
        this.load_data = false;
        this.cupon = undefined;
      }
    });
  }

  init_data() {
      this.load_data = true;
      this._cuponService.obtener_cupon_admin(this.id, this.token).subscribe(
        response => {
          if (response.data) {
            this.cupon = response.data;
          } else {
            this.cupon = undefined;
            this.mostrarError('No se encontró el cupón especificado.');
          }
          this.load_data = false;
        },
        error => {
          console.error('Error al obtener el cupón:', error);
          this.cupon = undefined;
          this.load_data = false;
          this.mostrarError('Ocurrió un error en el servidor al buscar el cupón.');
        }
      );
  }

  actualizar(actualizarForm: NgForm) {
    if (actualizarForm.invalid) {
        Object.keys(actualizarForm.controls).forEach(key => {
            actualizarForm.controls[key].markAsTouched();
        });
        this.mostrarError('Por favor, completa todos los campos requeridos.');
        return;
    }

    this.load_btn = true;
    this._cuponService.actualizar_cupon_admin(this.id, this.cupon, this.token).subscribe(
        response => {
            if(response.data) {
                iziToast.success({
                    title: 'ÉXITO',
                    message: 'Cupón actualizado correctamente.',
                    position: 'topRight',
                });
                this.load_btn = false;
                this._router.navigate(['/panel/cupones']);
            } else {
                this.mostrarError(response.message || 'No se pudo actualizar el cupón.');
                this.load_btn = false;
            }
        },
        error => {
            console.log('Error al actualizar:', error);
            const errorMsg = error.error?.message || 'Ocurrió un error inesperado. Intenta de nuevo.';
            this.mostrarError(errorMsg);
            this.load_btn = false;
        }
    );
  }

  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}
