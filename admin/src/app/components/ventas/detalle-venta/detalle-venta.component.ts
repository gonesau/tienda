import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { Global } from 'src/app/services/global';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-detalle-venta',
  templateUrl: './detalle-venta.component.html',
  styleUrls: ['./detalle-venta.component.css']
})
export class DetalleVentaComponent implements OnInit {

  public venta: any = null;
  public detalles: Array<any> = [];
  public id: string = '';
  public token: string;
  public url: string;
  public load_data = true;
  
  // Modal de estado
  public nuevoEstado = '';
  public load_btn_estado = false;
  public modalEstado: any = null;
  public estados = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _ventaService: VentaService
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      
      if (!this.id) {
        this.load_data = false;
        this.mostrarError('ID de venta no válido');
        this._router.navigate(['/panel/ventas']);
        return;
      }
      
      this.cargar_datos();
    });
  }

  ngOnDestroy(): void {
    if (this.modalEstado) {
      this.modalEstado.dispose();
    }
  }

  /**
   * Carga los datos de la venta
   */
  cargar_datos(): void {
    this.load_data = true;
    
    this._ventaService.obtener_venta_admin(this.id, this.token).subscribe(
      (response) => {
        if (!response.data || !response.data.venta) {
          this.venta = null;
          this.load_data = false;
          this.mostrarError('Venta no encontrada');
          return;
        }
        
        this.venta = response.data.venta;
        this.detalles = response.data.detalles || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error cargando venta:', error);
        this.venta = null;
        this.load_data = false;
        this.mostrarError('Error al cargar la venta');
      }
    );
  }

  /**
   * Abre modal para cambiar estado
   */
  abrirModalEstado(): void {
    this.nuevoEstado = this.venta.estado;
    
    const modalElement = document.getElementById('estadoModal');
    if (modalElement) {
      this.modalEstado = new bootstrap.Modal(modalElement);
      this.modalEstado.show();
    }
  }

  /**
   * Cierra modal de estado
   */
  cerrarModalEstado(): void {
    if (this.modalEstado) {
      this.modalEstado.hide();
    }
    this.nuevoEstado = '';
    this.load_btn_estado = false;
  }

  /**
   * Actualiza el estado de la venta
   */
  actualizarEstado(): void {
    if (!this.nuevoEstado) {
      this.mostrarError('Selecciona un estado');
      return;
    }

    if (this.nuevoEstado === this.venta.estado) {
      this.mostrarError('El estado seleccionado es el mismo');
      return;
    }

    this.load_btn_estado = true;

    this._ventaService.actualizar_estado_venta_admin(
      this.venta._id,
      { estado: this.nuevoEstado },
      this.token
    ).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Estado actualizado correctamente',
          position: 'topRight'
        });

        this.cerrarModalEstado();
        this.cargar_datos();
      },
      (error) => {
        console.error('Error actualizando estado:', error);
        this.load_btn_estado = false;
        this.mostrarError('Error al actualizar el estado');
      }
    );
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getEstadoClass(estado: string): string {
    const clases: any = {
      'Procesando': 'bg-warning text-dark',
      'Enviado': 'bg-info',
      'Entregado': 'bg-success',
      'Cancelado': 'bg-danger'
    };
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Calcula el subtotal de los productos
   */
  calcularSubtotalProductos(): number {
    return this.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }

  /**
   * Calcula el descuento aplicado
   */
  calcularDescuento(): number {
    const subtotalProductos = this.calcularSubtotalProductos();
    const descuento = subtotalProductos + this.venta.envio_precio - this.venta.subtotal;
    return descuento > 0 ? descuento : 0;
  }

  /**
   * Formatea fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Imprime la página
   */
  imprimir(): void {
    window.print();
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight'
    });
  }
}