// tienda/src/app/components/usuario/ordenes/detalle-orden/detalle-orden.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { ReviewService } from 'src/app/services/review.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Global } from 'src/app/services/global';
declare var iziToast: any;
declare var $: any;

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

  // Sistema de reviews
  public mostrar_modal_review = false;
  public producto_review: any = null;
  public review_form = {
    review: '',
    rating: 0
  };
  public enviando_review = false;
  public reviews_estado: { [key: string]: { puede_resenar: boolean, tiene_review: boolean } } = {};
  public load_btn = false;
  private destroy$ = new Subject<void>();
  public url: string;

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
    private _reviewService: ReviewService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.token = localStorage.getItem('token');
    this.idCliente = localStorage.getItem('_id');
    this.idOrden = null;
    this.token = localStorage.getItem('token');
    this.url = Global.url;
  }

  ngOnInit(): void {
    if (!this.token || !this.idCliente) {
      this.mostrarError('Debes iniciar sesión para ver esta orden');
      this._router.navigate(['/login']);
      return;
    }

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

            this.actualizarPasosEnvio();
            this.verificarEstadoReviews();
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
   * Verifica el estado de las reviews para cada producto
   */
  private verificarEstadoReviews(): void {
    if (!this.venta || !this.detalles || this.detalles.length === 0) {
      return;
    }

    this.detalles.forEach(detalle => {
      const productoId = detalle.producto._id;

      this._reviewService.verificar_puede_resenar(productoId, this.venta._id, this.token)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.reviews_estado[productoId] = {
              puede_resenar: response.puede_resenar || false,
              tiene_review: !!response.review_existente
            };
          },
          error: (error) => {
            console.error('Error verificando estado de review:', error);
            this.reviews_estado[productoId] = {
              puede_resenar: false,
              tiene_review: false
            };
          }
        });
    });
  }

  /**
   * Abre el modal para dejar una reseña
   */
  abrirModalReview(detalle: any): void {
    const productoId = detalle.producto._id;
    const estadoReview = this.reviews_estado[productoId];

    if (!estadoReview || !estadoReview.puede_resenar) {
      if (estadoReview && estadoReview.tiene_review) {
        this.mostrarInfo('Ya has dejado una reseña para este producto');
      } else {
        this.mostrarError('No puedes dejar una reseña para este producto');
      }
      return;
    }

    this.producto_review = detalle.producto;
    this.review_form = {
      review: '',
      rating: 0
    };
    this.mostrar_modal_review = true;

    setTimeout(() => {
      $('#modalReview').modal('show');
    }, 100);
  }

  /**
   * Cierra el modal de review
   */
  cerrarModalReview(): void {
    $('#modalReview').modal('hide');
    this.mostrar_modal_review = false;
    this.producto_review = null;
    this.review_form = {
      review: '',
      rating: 0
    };
  }

  /**
   * Maneja el cambio de rating
   */
  onRatingChange(rating: number): void {
    this.review_form.rating = rating;
  }

  /**
   * Envía la reseña
   */
  enviarReview(): void {
    if (!this.validarReviewForm()) {
      return;
    }

    if (!this.producto_review || !this.venta) {
      this.mostrarError('Datos incompletos');
      return;
    }

    const data = {
      producto: this.producto_review._id,
      venta: this.venta._id,
      review: this.review_form.review.trim(),
      rating: this.review_form.rating
    };

    this.enviando_review = true;

    this._reviewService.crear_review(data, this.token)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.enviando_review = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.mostrarExito('¡Gracias por tu reseña!');
          this.cerrarModalReview();

          // Actualizar estado de reviews
          this.reviews_estado[this.producto_review._id] = {
            puede_resenar: false,
            tiene_review: true
          };
        },
        error: (error) => {
          console.error('Error enviando review:', error);
          this.mostrarError(error.message || 'Error al enviar la reseña');
        }
      });
  }

  /**
   * Valida el formulario de review
   */
  private validarReviewForm(): boolean {
    if (!this.review_form.review || this.review_form.review.trim().length < 10) {
      this.mostrarError('La reseña debe tener al menos 10 caracteres');
      return false;
    }

    if (this.review_form.review.trim().length > 1000) {
      this.mostrarError('La reseña no puede exceder 1000 caracteres');
      return false;
    }

    if (!this.review_form.rating || this.review_form.rating < 1 || this.review_form.rating > 5) {
      this.mostrarError('Debes seleccionar una calificación del 1 al 5');
      return false;
    }

    return true;
  }

  /**
   * Verifica si se puede mostrar el botón de reseña
   */
  puedeMostrarBotonReview(productoId: string): boolean {
    const estado = this.reviews_estado[productoId];
    return estado && estado.puede_resenar && !estado.tiene_review;
  }

  /**
   * Verifica si ya tiene reseña
   */
  tieneReview(productoId: string): boolean {
    const estado = this.reviews_estado[productoId];
    return estado && estado.tiene_review;
  }

  // ============================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ============================================

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

  getSubtotalProductos(): number {
    if (!this.detalles || this.detalles.length === 0) {
      return 0;
    }
    return this.detalles.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getDescuento(): number {
    if (!this.venta) return 0;

    const subtotalProductos = this.getSubtotalProductos();
    const totalConEnvio = subtotalProductos + this.venta.envio_precio;
    const descuento = totalConEnvio - this.venta.subtotal;

    return descuento > 0 ? descuento : 0;
  }

  getEstadoClase(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Procesando': 'badge-info',
      'Enviado': 'badge-warning',
      'Entregado': 'badge-success',
      'Cancelado': 'badge-danger'
    };
    return estadoMap[estado] || 'badge-secondary';
  }

  getEstadoIcono(estado: string): string {
    const iconoMap: { [key: string]: string } = {
      'Procesando': 'cxi-time',
      'Enviado': 'cxi-truck',
      'Entregado': 'cxi-check-circle',
      'Cancelado': 'cxi-close-circle'
    };
    return iconoMap[estado] || 'cxi-bag';
  }

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

  descargarComprobante(): void {
    if (!this.venta._id) {
      this.mostrarError('ID de venta no disponible');
      return;
    }

    this.load_btn = true;

    const token = this.token;

    if (!token) {
      this.mostrarError('No se encontró el token de autenticación');
      this.load_btn = false;
      return;
    }

    // Crear la URL con el token como query parameter
    const url = `${this.url}generar_comprobante_pdf/${this.venta._id}?token=${token}`;

    console.log('Descargando PDF desde:', url);

    // Crear un elemento <a> temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `Comprobante-${this.venta.nventa}.pdf`;

    // Agregar al DOM, hacer click y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Resetear botón después de 2 segundos
    setTimeout(() => {
      this.load_btn = false;
      this.mostrarExito('Descarga iniciada');
    }, 2000);
  }

  volverAOrdenes(): void {
    this._router.navigate(['/cuenta/ordenes']);
  }

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

  private mostrarInfo(mensaje: string): void {
    iziToast.info({
      title: 'Información',
      titleColor: '#17a2b8',
      color: '#FFF',
      class: 'text-info',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }
}