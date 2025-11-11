import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DescuentoService } from 'src/app/services/descuento.service';
import { Global } from 'src/app/services/global';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-index-descuento',
  templateUrl: './index-descuento.component.html',
  styleUrls: ['./index-descuento.component.css'],
})
export class IndexDescuentoComponent implements OnInit {
  
  public filtro = '';
  public token: string;
  public descuentos: Array<any> = [];
  public url: string;
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

  // Control del modal
  public descuentoAEliminar: any = null;
  public modalInstance: any = null;

  constructor(
    private _descuentoService: DescuentoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;

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
   * Carga los descuentos
   */
  cargar_datos(): void {
    this.load_data = true;
    
    this._descuentoService.listar_descuentos_admin(this.filtro, this.token).subscribe(
      (response) => {
        this.descuentos = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar descuentos:', error);
        this.descuentos = [];
        this.load_data = false;
        this.mostrarError('Error al cargar descuentos. Intenta nuevamente.');
      }
    );
  }

  /**
   * Filtra descuentos
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
  abrirModalEliminar(descuento: any): void {
    this.descuentoAEliminar = descuento;
    
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
    this.descuentoAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Confirma eliminación
   */
  confirmarEliminacion(): void {
    if (!this.descuentoAEliminar || !this.descuentoAEliminar._id) {
      this.mostrarError('No se pudo identificar el descuento.');
      return;
    }

    this.load_btn = true;

    this._descuentoService.eliminar_descuento_admin(this.descuentoAEliminar._id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Descuento eliminado correctamente',
          position: 'topRight',
        });

        this.cerrarModal();
        this.cargar_datos();
      },
      (error) => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'No se pudo eliminar el descuento';
        this.mostrarError(errorMsg);
      }
    );
  }

  /**
   * Verifica si un descuento está activo
   */
  esDescuentoActivo(descuento: any): boolean {
    const hoy = new Date();
    const fechaInicio = new Date(descuento.fecha_inicio);
    const fechaFin = new Date(descuento.fecha_fin);
    
    return hoy >= fechaInicio && hoy <= fechaFin;
  }

  /**
   * Verifica si un descuento está programado (futuro)
   */
  esDescuentoProgramado(descuento: any): boolean {
    const hoy = new Date();
    const fechaInicio = new Date(descuento.fecha_inicio);
    
    return hoy < fechaInicio;
  }

  /**
   * Verifica si un descuento está vencido
   */
  esDescuentoVencido(descuento: any): boolean {
    const hoy = new Date();
    const fechaFin = new Date(descuento.fecha_fin);
    
    return hoy > fechaFin;
  }

  /**
   * Obtiene el estado del descuento
   */
  obtenerEstadoDescuento(descuento: any): { texto: string, clase: string } {
    if (this.esDescuentoActivo(descuento)) {
      return { texto: 'Activo', clase: 'bg-success' };
    } else if (this.esDescuentoProgramado(descuento)) {
      return { texto: 'Programado', clase: 'bg-info' };
    } else {
      return { texto: 'Vencido', clase: 'bg-secondary' };
    }
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