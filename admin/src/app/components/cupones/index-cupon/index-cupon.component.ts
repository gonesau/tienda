import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-index-cupon',
  templateUrl: './index-cupon.component.html',
  styleUrls: ['./index-cupon.component.css'],
})
export class IndexCuponComponent implements OnInit {
  
  public filtro = '';
  public token: string;
  public cupones: Array<any> = [];
  
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

  constructor(
    private _cuponService: CuponService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit(): void {
    if (!this.token) {
      this._router.navigate(['/login']);
      return;
    }
    this.cargar_datos();
  }

  cargar_datos() {
    this.load_data = true;
    this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
        response => {
          if (response.data) {
            this.cupones = response.data;
          } else {
            this.cupones = [];
          }
          this.load_data = false;
        },
        error => {
          console.error('Error al cargar cupones:', error);
          this.mostrarError('Error en el servidor, no se pudieron cargar los cupones.');
          this.load_data = false;
        }
      );
  }

  filtrar() {
    this.cargar_datos();
  }

  resetear() {
    this.filtro = '';
    this.cargar_datos();
  }

  eliminar(id: string) {
    if (!id) {
        this.mostrarError('ID de cupón no válido.');
        return;
    }

    this.load_btn = true;
    this._cuponService.eliminar_cupon_admin(id, this.token).subscribe(
      response => {
        if (response.data) {
          iziToast.success({
            title: 'ÉXITO',
            message: 'Cupón eliminado correctamente.',
            position: 'topRight',
          });

          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          $('body').removeClass('modal-open');

          this.cargar_datos();
        } else {
          this.mostrarError(response.message || 'No se pudo eliminar el cupón.');
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error al eliminar cupón:', error);
        const errorMsg = error.error?.message || 'Ocurrió un problema con el servidor.';
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
