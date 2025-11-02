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
    codigo: '',
    tipo: '',
    valor: null,
    limite: null
  };
  public load_btn = false;

  constructor(
    private _cuponService: CuponService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  /**
   * Registra un nuevo cupón
   */
  registro(registroForm: NgForm): void {
    // Validar formulario
    if (registroForm.invalid) {
      Object.keys(registroForm.controls).forEach(key => {
        registroForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validar código
    if (!this.cupon.codigo || this.cupon.codigo.trim() === '') {
      this.mostrarError('El código del cupón es requerido');
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
    if (!this.cupon.limite || this.cupon.limite < 1) {
      this.mostrarError('El límite debe ser al menos 1 uso');
      return;
    }

    // Preparar datos
    const dataCupon = {
      codigo: this.cupon.codigo.trim().toUpperCase(),
      tipo: this.cupon.tipo,
      valor: parseFloat(this.cupon.valor),
      limite: parseInt(this.cupon.limite)
    };

    this.load_btn = true;

    this._cuponService.registro_cupon_admin(dataCupon, this.token).subscribe(
      response => {
        if (response.data) {
          iziToast.success({
            title: 'Éxito',
            message: 'Cupón registrado correctamente',
            position: 'topRight',
          });
          
          setTimeout(() => {
            this._router.navigate(['/panel/cupones']);
          }, 500);
        } else {
          this.mostrarError(response.message || 'No se pudo crear el cupón.');
        }
        this.load_btn = false;
      }, 
      error => {
        console.error('Error en el servidor:', error);
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