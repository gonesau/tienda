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
  public id: string = '';
  
  public load_btn = false;
  public load_data = true;

  constructor(
    private _cuponService: CuponService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token') || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    if (!this.token) {
      this._router.navigate(['/login']);
      return;
    }

    this._route.params.subscribe(params => {
      this.id = params['id'];
      
      if (!this.id) {
        this.load_data = false;
        this.cupon = undefined;
        this.mostrarError('ID de cupón no válido');
        this._router.navigate(['/panel/cupones']);
        return;
      }
      
      this.init_data();
    });
  }

  /**
   * Carga los datos del cupón
   */
  init_data(): void {
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

  /**
   * Actualiza el cupón
   */
  actualizar(actualizarForm: NgForm): void {
    // Validar formulario
    if (actualizarForm.invalid) {
      Object.keys(actualizarForm.controls).forEach(key => {
        actualizarForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validar tipo
    if (!this.cupon.tipo || this.cupon.tipo.trim() === '') {
      this.mostrarError('Debes seleccionar el tipo de descuento');
      return;
    }

    // Validar valor
    if (!this.cupon.valor || this.cupon.valor <= 0) {
      this.mostrarError('El valor del descuento debe ser mayor a 0');
      return;
    }

    // Validar porcentaje máximo
    if (this.cupon.tipo === 'Porcentaje' && this.cupon.valor > 100) {
      this.mostrarError('El porcentaje no puede ser mayor a 100');
      return;
    }

    // Validar límite
    if (this.cupon.limite === null || this.cupon.limite === undefined || this.cupon.limite < 0) {
      this.mostrarError('El límite debe ser 0 o mayor');
      return;
    }

    // Preparar datos
    const dataActualizar = {
      tipo: this.cupon.tipo,
      valor: parseFloat(this.cupon.valor),
      limite: parseInt(this.cupon.limite)
    };

    this.load_btn = true;

    this._cuponService.actualizar_cupon_admin(this.id, dataActualizar, this.token).subscribe(
      response => {
        if (response.data) {
          iziToast.success({
            title: 'Éxito',
            message: 'Cupón actualizado correctamente',
            position: 'topRight',
          });
          
          this.load_btn = false;
          
          setTimeout(() => {
            this._router.navigate(['/panel/cupones']);
          }, 1000);
        } else {
          this.mostrarError(response.message || 'No se pudo actualizar el cupón.');
          this.load_btn = false;
        }
      },
      error => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error inesperado. Intenta de nuevo.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}