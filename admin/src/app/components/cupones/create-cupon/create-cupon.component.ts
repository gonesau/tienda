import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-create-cupon',
  templateUrl: './create-cupon.component.html',
  styleUrls: ['./create-cupon.component.css']
})
export class CreateCuponComponent implements OnInit {

  public token: string;
  public cupon: any = {
    tipo: '',
  };
  public load_btn = false;

  constructor(
    private _cuponService: CuponService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    if (!this.token) {
        this._router.navigate(['/login']);
    }
  }


  registro(registroForm: NgForm) {
    if (registroForm.invalid) {
        // Marcar todos los campos como "touched" para que se muestren los mensajes de error
        Object.keys(registroForm.controls).forEach(key => {
            registroForm.controls[key].markAsTouched();
        });
        this.mostrarError('Por favor, completa todos los campos requeridos.');
        return;
    }

    this.load_btn = true;
    this._cuponService.registro_cupon_admin(this.cupon, this.token).subscribe(
      response => {
        if (response.data) {
             iziToast.success({
                title: 'ÉXITO',
                message: 'Cupón registrado correctamente.',
                position: 'topRight',
            });
            this.load_btn = false;
            this._router.navigate(['/panel/cupones']);
        } else {
            this.mostrarError(response.message || 'No se pudo crear el cupón.');
            this.load_btn = false;
        }
      }, 
      error => {
        console.error('Error en el servidor:', error);
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
