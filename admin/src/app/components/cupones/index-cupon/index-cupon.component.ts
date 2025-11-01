import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CuponService } from 'src/app/services/cupon.service';

declare var iziToast: any;
declare var bootstrap: any;

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

  // Control del modal
  public cuponAEliminar: any = null;
  public modalInstance: any = null;

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
    this.cargar_datos();
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga los cupones
   */
  cargar_datos(): void {
    this.load_data = true;
    
    this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
      response => {
        this.cupones = response.data || [];
        this.load_data = false;
      },
      error => {
        console.error('Error al cargar cupones:', error);
        this.cupones = [];
        this.load_data = false;
        this.mostrarError('Error al cargar cupones. Intenta nuevamente.');
      }
    );
  }

  /**
   * Filtra cupones
   */
  filtrar(): void {
    this.page = 1;
    this.cargar_datos();
  }

  /**
   * Resetea filtros
   */
  resetear(): void {
    this.filtro = '';
    this.page = 1;
    this.cargar_datos();
  }

  /**
   * Abre modal de confirmación
   */
  abrirModalEliminar(cupon: any): void {
    this.cuponAEliminar = cupon;
    
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
      this.modalInstance.show();
    }
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.cuponAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Confirma eliminación
   */
  confirmarEliminacion(): void {
    if (!this.cuponAEliminar || !this.cuponAEliminar._id) {
      this.mostrarError('No se pudo identificar el cupón.');
      return;
    }

    this.load_btn = true;

    this._cuponService.eliminar_cupon_admin(this.cuponAEliminar._id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Cupón eliminado correctamente',
          position: 'topRight',
        });

        this.cerrarModal();
        this.cargar_datos();
      },
      (error) => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'No se pudo eliminar el cupón';
        this.mostrarError(errorMsg);
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