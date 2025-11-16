import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
declare var iziToast: any;

@Component({
  selector: 'app-detalle-orden',
  templateUrl: './detalle-orden.component.html',
  styleUrls: ['./detalle-orden.component.css']
})
export class DetalleOrdenComponent implements OnInit, OnDestroy {
  public token: string | null;
  public idCliente: string | null;
  public idOrden: string | null;
  
  // Datos de la orden
  public venta: any = undefined;
  public detalles: Array<any> = [];
  
  // Estados de carga
  public load_data = true;
  public descargando_pdf = false;

  //Rating estrella
  public totalstar: 5;

  private destroy$ = new Subject<void>();

  // Información de envío
  public pasos_envio = [
    {
      estado: 'Procesando',
      titulo: 'Procesando',
      descripcion: 'Estamos preparando tu pedido',
      icono: 'cxi-time',
      completado: false,
      activo: false
    },
    {
      estado: 'Enviado',
      titulo: 'En camino',
      descripcion: 'Tu pedido está en tránsito',
      icono: 'cxi-truck',
      completado: false,
      activo: false
    },
    {
      estado: 'Entregado',
      titulo: 'Entregado',
      descripcion: 'Tu pedido ha sido entregado',
      icono: 'cxi-check-circle',
      completado: false,
      activo: false
    }
  ];

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
    this.idCliente = localStorage.getItem('_id');
    this.idOrden = null;
  }

  ngOnInit(): void {
    if (!this.token || !this.idCliente) {
      this.mostrarError('Debes iniciar sesión para ver esta orden');
      this._router.navigate(['/login']);
      return;
    }

    // Obtener ID de la orden desde la URL
    this._route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.idOrden = params['id'];
        
        if (!this.idOrden) {
          this.mostrarError('ID de orden inválido');
          this._router.navigate(['/cuenta/ordenes']);
          return;
        }

        this.cargarDetalleOrden();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el detalle completo de la orden
   */
  private cargarDetalleOrden(): void {
    if (!this.idOrden || !this.token) {
      return;
    }

    this.load_data = true;

    this._clienteService.obtener_venta_cliente(this.idOrden, this.token)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.load_data = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.venta = response.data.venta;
            this.detalles = response.data.detalles;
            
            // Actualizar pasos de envío
            this.actualizarPasosEnvio();
          } else {
            this.mostrarError('No se pudo cargar la información de la orden');
            this._router.navigate(['/cuenta/ordenes']);
          }
        },
        error: (error) => {
          console.error('Error cargando detalle:', error);
          this.manejarError(error);
        }
      });
  }

  /**
   * Actualiza el progreso de los pasos de envío
   */
  private actualizarPasosEnvio(): void {
    if (!this.venta) return;

    const estadoActual = this.venta.estado;
    const estados = ['Procesando', 'Enviado', 'Entregado'];
    const indiceActual = estados.indexOf(estadoActual);

    this.pasos_envio.forEach((paso, index) => {
      if (index < indiceActual) {
        paso.completado = true;
        paso.activo = false;
      } else if (index === indiceActual) {
        paso.completado = false;
        paso.activo = true;
      } else {
        paso.completado = false;
        paso.activo = false;
      }
    });
  }

  /**
   * Calcula el subtotal de productos
   */
  getSubtotalProductos(): number {
    if (!this.detalles || this.detalles.length === 0) {
      return 0;
    }
    return this.detalles.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /**
   * Calcula el descuento aplicado
   */
  getDescuento(): number {
    if (!this.venta) return 0;
    
    const subtotalProductos = this.getSubtotalProductos();
    const totalConEnvio = subtotalProductos + this.venta.envio_precio;
    const descuento = totalConEnvio - this.venta.subtotal;
    
    return descuento > 0 ? descuento : 0;
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getEstadoClase(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Procesando': 'badge-info',
      'Enviado': 'badge-warning',
      'Entregado': 'badge-success',
      'Cancelado': 'badge-danger'
    };
    return estadoMap[estado] || 'badge-secondary';
  }

  /**
   * Obtiene el ícono según el estado
   */
  getEstadoIcono(estado: string): string {
    const iconoMap: { [key: string]: string } = {
      'Procesando': 'cxi-time',
      'Enviado': 'cxi-truck',
      'Entregado': 'cxi-check-circle',
      'Cancelado': 'cxi-close-circle'
    };
    return iconoMap[estado] || 'cxi-bag';
  }

  /**
   * Formatea fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (e) {
      return fecha;
    }
  }

  /**
   * Descarga PDF del comprobante
   */
  descargarComprobante(): void {
    if (!this.idOrden || !this.token) return;

    this.descargando_pdf = true;

    // Crear un elemento temporal para descargar
    const link = document.createElement('a');
    link.href = `${this._clienteService.url}generar_comprobante_pdf/${this.idOrden}?token=${this.token}`;
    link.target = '_blank';
    link.click();

    // Simular tiempo de descarga
    setTimeout(() => {
      this.descargando_pdf = false;
    }, 2000);
  }

  /**
   * Vuelve a la lista de órdenes
   */
  volverAOrdenes(): void {
    this._router.navigate(['/cuenta/ordenes']);
  }

  /**
   * Maneja errores de autenticación y otros
   */
  private manejarError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado');
      setTimeout(() => {
        localStorage.clear();
        this._router.navigate(['/login']);
      }, 2000);
    } else if (error.status === 404) {
      this.mostrarError('Orden no encontrada');
      this._router.navigate(['/cuenta/ordenes']);
    }
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje,
      timeout: 4000
    });
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: '¡Éxito!',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }
}