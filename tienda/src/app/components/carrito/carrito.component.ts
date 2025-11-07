// tienda/src/app/components/carrito/carrito.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io, Socket } from "socket.io-client";
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { GuestService } from 'src/app/services/guest.service';
declare var iziToast: any;
declare var Cleave: any;
declare var StickySidebar: any;
declare var paypal: any;

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

interface DetalleVenta {
  _id: string;
  producto: string;
  cantidad: number;
  subtotal: number;
  variedad: string;
}

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {
  @ViewChild('paypalButton', { static: false }) paypalElement: ElementRef;
  
  // Datos del usuario
  public idcliente: string | null;
  public token: string | null;
  
  // Datos del carrito
  public carrito_compras: Array<any> = [];
  public subtotal = 0;
  public url: string;
  public total_pagar = 0;
  
  // Estados de carga
  public load_data = true;
  public load_direccion = true;
  public load_btn_pagar = false;
  
  // Dirección y envío
  public direccion_principal: any = undefined;
  public envios: Array<any> = [];
  public precio_envio = 0;
  public envio_seleccionado: any = null;
  
  // Datos de la venta
  public venta: any = {
    cliente: '',
    subtotal: 0,
    envio_titulo: '',
    envio_precio: 0,
    transaccion: '',
    cupon: '',
    direccion: '',
    nota: '',
    detalles: []
  };
  
  // Cupón
  public cupon_aplicado: any = null;
  public descuento_cupon = 0;
  public btn_aplicar_cupon = false;
  
  // Actualización de cantidad
  public actualizando_cantidad: { [key: string]: boolean } = {};

  private socket: Socket;
  private destroy$ = new Subject<void>();
  private carritoUpdate$ = new Subject<void>();
  private isUpdating = false;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
    private _guestService: GuestService
  ) {
    this.idcliente = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.url = this._clienteService.url;
    this.venta.cliente = this.idcliente;
  }

  ngOnInit(): void {
    if (!this.token || !this.idcliente) {
      this._router.navigate(['/login']);
      return;
    }

    // Inicializar complementos
    this.inicializarComplementos();

    // Cargar datos
    this.cargarEnvios();
    this.obtenerDireccionPrincipal();
    this.setupCarritoDebounce();
    this.inicializarSocket();
    this.cargarCarrito();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.socket) {
      this.socket.off('new-carrito-add');
      this.socket.off('delete-carrito');
      this.socket.off('update-carrito');
      this.socket.disconnect();
    }
  }

  /**
   * Inicializa complementos de UI
   */
  private inicializarComplementos(): void {
    setTimeout(() => {
      // Cleave para tarjetas
      if (document.getElementById('cc-number')) {
        new Cleave('#cc-number', {
          creditCard: true,
          onCreditCardTypeChanged: function (type) {
            console.log('Card type:', type);
          }
        });
      }

      if (document.getElementById('cc-exp-date')) {
        new Cleave('#cc-exp-date', {
          date: true,
          datePattern: ['m', 'y']
        });
      }

      // Sidebar pegajoso
      if (document.querySelector('.sidebar-sticky')) {
        new StickySidebar('.sidebar-sticky', { topSpacing: 20 });
      }
    }, 500);
  }

  /**
   * Inicializa PayPal
   */
  private inicializarPayPal(): void {
    if (!this.paypalElement || !this.paypalElement.nativeElement) {
      console.error('Elemento PayPal no encontrado');
      return;
    }

    // Limpiar botones anteriores
    this.paypalElement.nativeElement.innerHTML = '';

    paypal.Buttons({
      style: {
        layout: 'horizontal',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: (data, actions) => {
        // Validar antes de crear orden
        if (!this.validarCompra()) {
          return Promise.reject(new Error('Validación fallida'));
        }

        return actions.order.create({
          purchase_units: [{
            description: `Compra en Tienda - ${this.carrito_compras.length} producto(s)`,
            amount: {
              currency_code: 'USD',
              value: this.total_pagar.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: this.subtotal.toFixed(2)
                },
                shipping: {
                  currency_code: 'USD',
                  value: this.precio_envio.toFixed(2)
                },
                discount: {
                  currency_code: 'USD',
                  value: this.descuento_cupon.toFixed(2)
                }
              }
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          console.log('PayPal order captured:', order);
          
          // Guardar ID de transacción
          this.venta.transaccion = order.purchase_units[0].payments.captures[0].id;
          
          // Procesar la compra
          await this.procesarCompra();
          
        } catch (error) {
          console.error('Error capturando orden:', error);
          this.mostrarError('Error al procesar el pago. Por favor contacta a soporte.');
        }
      },
      onError: (err) => {
        console.error('Error de PayPal:', err);
        this.mostrarError('Ocurrió un error con PayPal. Por favor intenta nuevamente.');
      },
      onCancel: (data) => {
        console.log('Pago cancelado:', data);
        this.mostrarInfo('Has cancelado el proceso de pago');
      }
    }).render(this.paypalElement.nativeElement);
  }

  /**
   * Valida que se pueda realizar la compra
   */
  private validarCompra(): boolean {
    if (this.carrito_compras.length === 0) {
      this.mostrarError('Tu carrito está vacío');
      return false;
    }

    if (!this.direccion_principal) {
      this.mostrarError('Debes seleccionar una dirección de envío');
      return false;
    }

    if (!this.envio_seleccionado) {
      this.mostrarError('Debes seleccionar un método de envío');
      return false;
    }

    if (this.total_pagar <= 0) {
      this.mostrarError('El total debe ser mayor a 0');
      return false;
    }

    return true;
  }

  /**
   * Procesa la compra después de PayPal
   */
  private async procesarCompra(): Promise<void> {
    this.load_btn_pagar = true;

    try {
      // Preparar detalles de venta
      this.venta.detalles = this.carrito_compras.map(item => ({
        _id: item._id,
        producto: item.producto._id,
        cantidad: item.cantidad,
        subtotal: item.producto.precio * item.cantidad,
        variedad: item.variedad || 'Estándar'
      }));

      // Calcular subtotal total
      let subtotalCalculado = this.venta.detalles.reduce((sum, det) => sum + det.subtotal, 0);
      
      // Aplicar descuento de cupón si existe
      if (this.cupon_aplicado) {
        if (this.cupon_aplicado.tipo === 'Porcentaje') {
          this.descuento_cupon = subtotalCalculado * (this.cupon_aplicado.valor / 100);
        } else {
          this.descuento_cupon = this.cupon_aplicado.valor;
        }
        subtotalCalculado -= this.descuento_cupon;
      }

      // Asignar valores finales
      this.venta.subtotal = subtotalCalculado + this.precio_envio;
      this.venta.direccion = this.direccion_principal._id;

      console.log('Enviando venta:', this.venta);

      // Enviar al backend
      this._clienteService.registro_venta_cliente(this.venta, this.token)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Respuesta venta:', response);
            
            this.mostrarExito('¡Compra realizada exitosamente! Número de orden: ' + response.venta.nventa);
            
            // Limpiar carrito local
            this.carrito_compras = [];
            this.calcularCarrito();
            
            // Redirigir a página de confirmación o pedidos
            setTimeout(() => {
              this._router.navigate(['/cuenta/pedidos']);
            }, 3000);
          },
          error: (error) => {
            console.error('Error guardando venta:', error);
            this.mostrarError(error.message || 'Error al procesar la compra. Por favor contacta a soporte.');
            this.load_btn_pagar = false;
          }
        });

    } catch (error) {
      console.error('Error preparando compra:', error);
      this.mostrarError('Error al preparar la compra');
      this.load_btn_pagar = false;
    }
  }

  /**
   * Carga métodos de envío
   */
  private cargarEnvios(): void {
    this._guestService.get_envios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.envios = response || [];

          if (this.envios.length > 0) {
            this.envio_seleccionado = this.envios[0];
            this.precio_envio = parseFloat(this.envio_seleccionado.costo) || 0;
            this.venta.envio_titulo = this.envio_seleccionado.titulo;
            this.venta.envio_precio = this.precio_envio;
            this.calcularTotal();
          }
        },
        error: (error) => {
          console.error('Error cargando envíos:', error);
          this.envios = [];
        }
      });
  }

  /**
   * Obtiene dirección principal
   */
  private obtenerDireccionPrincipal(): void {
    if (!this.idcliente || !this.token) {
      this.direccion_principal = undefined;
      this.load_direccion = false;
      return;
    }

    this.load_direccion = true;

    this._clienteService.obtener_direcciones_cliente(this.idcliente, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let direcciones: Array<any> = [];

          if (response) {
            if (Array.isArray(response.data)) {
              direcciones = response.data;
            } else if (Array.isArray(response)) {
              direcciones = response;
            }
          }

          this.direccion_principal = direcciones.find(dir => dir.principal === true);

          if (this.direccion_principal) {
            this.venta.direccion = this.direccion_principal._id;
          }

          this.load_direccion = false;
        },
        error: (error) => {
          console.error('Error obteniendo dirección:', error);
          this.direccion_principal = undefined;
          this.load_direccion = false;
          this.manejarError(error);
        }
      });
  }

  /**
   * Maneja cambio de método de envío
   */
  onEnvioChange(envio: any): void {
    this.envio_seleccionado = envio;
    this.precio_envio = parseFloat(envio.costo) || 0;
    this.venta.envio_titulo = envio.titulo;
    this.venta.envio_precio = this.precio_envio;
    this.calcularTotal();

    this.mostrarInfo(`Método de envío seleccionado: ${envio.titulo}`);
  }

  /**
   * Configura debounce para actualizaciones
   */
  private setupCarritoDebounce(): void {
    this.carritoUpdate$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cargarCarritoInternal();
      });
  }

  /**
   * Inicializa Socket.IO
   */
  private inicializarSocket(): void {
    this.socket = io('http://localhost:4201', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: this.token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('new-carrito-add', (data) => {
      if (data.cliente === this.idcliente) {
        this.carritoUpdate$.next();
      }
    });

    this.socket.on('delete-carrito', (data) => {
      const clienteId = data.cliente || data.data?.cliente;
      if (clienteId === this.idcliente) {
        this.carritoUpdate$.next();
      }
    });

    this.socket.on('update-carrito', (data) => {
      if (data.cliente === this.idcliente) {
        this.carritoUpdate$.next();
      }
    });
  }

  /**
   * Carga carrito (pública)
   */
  public cargarCarrito(): void {
    this.carritoUpdate$.next();
  }

  /**
   * Carga carrito (interna)
   */
  private cargarCarritoInternal(): void {
    if (!this.idcliente || !this.token || this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    this.load_data = true;

    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.carrito_compras = response.data || [];
          this.calcularCarrito();
          this.load_data = false;
          this.isUpdating = false;
          
          // Inicializar PayPal después de cargar carrito
          setTimeout(() => {
            this.inicializarPayPal();
          }, 500);
        },
        error: (error) => {
          console.error('Error cargando carrito:', error);
          this.manejarError(error);
          this.carrito_compras = [];
          this.load_data = false;
          this.isUpdating = false;
        }
      });
  }

  /**
   * Calcula subtotal del carrito
   */
  private calcularCarrito(): void {
    this.subtotal = 0;

    if (this.carrito_compras && this.carrito_compras.length > 0) {
      this.subtotal = this.carrito_compras.reduce((total, item) => {
        if (item.producto?.precio && item.cantidad) {
          return total + (item.producto.precio * item.cantidad);
        }
        return total;
      }, 0);
    }

    this.calcularTotal();
  }

  /**
   * Calcula total a pagar
   */
  private calcularTotal(): void {
    let totalBase = this.subtotal;
    
    // Aplicar descuento de cupón
    if (this.cupon_aplicado) {
      if (this.cupon_aplicado.tipo === 'Porcentaje') {
        this.descuento_cupon = totalBase * (this.cupon_aplicado.valor / 100);
      } else {
        this.descuento_cupon = this.cupon_aplicado.valor;
      }
      totalBase -= this.descuento_cupon;
    } else {
      this.descuento_cupon = 0;
    }
    
    // Sumar envío
    this.total_pagar = totalBase + this.precio_envio;
    
    // Actualizar datos de venta
    this.venta.subtotal = this.total_pagar;
  }

  /**
   * Actualiza cantidad de un producto (optimizado)
   */
  cambiar_cantidad(item: any, nuevaCantidad: any): void {
    // Convertir a número
    const cantidad = parseInt(nuevaCantidad);
    
    // Validaciones
    if (isNaN(cantidad) || cantidad < 1) {
      this.mostrarError('La cantidad debe ser al menos 1');
      // Restaurar valor original
      item.cantidad = item.cantidad;
      return;
    }

    if (cantidad > item.producto.stock) {
      this.mostrarError(`Solo hay ${item.producto.stock} unidades disponibles`);
      // Restaurar valor original
      item.cantidad = item.cantidad;
      return;
    }

    // Si la cantidad es la misma, no hacer nada
    if (cantidad === item.cantidad) {
      return;
    }

    // Actualizar UI de inmediato para mejor UX
    const cantidadAnterior = item.cantidad;
    item.cantidad = cantidad;
    this.calcularCarrito();

    this.actualizando_cantidad[item._id] = true;

    const data = { cantidad: cantidad };

    this._clienteService.actualizar_cantidad_carrito(item._id, data, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.actualizando_cantidad[item._id] = false;
        },
        error: (error) => {
          // Revertir cambio en caso de error
          item.cantidad = cantidadAnterior;
          this.calcularCarrito();
          this.actualizando_cantidad[item._id] = false;
          this.manejarError(error, 'No se pudo actualizar la cantidad');
        }
      });
  }

  /**
   * Maneja el evento blur del input de cantidad
   */
  onCantidadBlur(item: any, valor: any): void {
    const cantidad = parseInt(valor);
    
    if (isNaN(cantidad) || cantidad < 1) {
      // Restaurar valor original si es inválido
      const input = event?.target as HTMLInputElement;
      if (input) {
        input.value = item.cantidad.toString();
      }
      return;
    }

    this.cambiar_cantidad(item, cantidad);
  }

  /**
   * Elimina producto del carrito
   */
  eliminar_item(id: string): void {
    if (!id) {
      this.mostrarError('Producto inválido');
      return;
    }

    this._clienteService.eliminar_carrito_cliente(id, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mostrarExito('Producto eliminado de tu carrito');
        },
        error: (error) => {
          this.manejarError(error, 'No pudimos eliminar el producto');
        }
      });
  }

  /**
   * Completa el pedido (botón principal)
   */
  completar_pedido(): void {
    if (!this.validarCompra()) {
      return;
    }

    // Verificar método de pago seleccionado
    const metodoPago = document.querySelector('input[name="payment"]:checked') as HTMLInputElement;
    
    if (!metodoPago) {
      this.mostrarError('Por favor selecciona un método de pago');
      return;
    }

    const metodoPagoId = metodoPago.id;

    // Procesar según el método de pago
    if (metodoPagoId === 'paypal') {
      // Expandir acordeón de PayPal si no está abierto
      const paypalCard = document.getElementById('paypal-card');
      if (paypalCard && !paypalCard.classList.contains('show')) {
        const paypalRadio = document.getElementById('paypal') as HTMLInputElement;
        if (paypalRadio) {
          paypalRadio.click();
        }
      }
      
      this.mostrarInfo('Por favor completa el pago con PayPal');
      
      // Scroll al botón de PayPal
      setTimeout(() => {
        const paypalButton = document.getElementById('paypal-button-container');
        if (paypalButton) {
          paypalButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      
    } else if (metodoPagoId === 'cc') {
      // Tarjeta de crédito - pendiente de implementación
      this.mostrarInfo('El pago con tarjeta estará disponible próximamente. Por favor usa PayPal.');
      
    } else if (metodoPagoId === 'cash') {
      // Pago contra entrega
      this.procesarPagoContraEntrega();
    }
  }

  /**
   * Procesa pago contra entrega
   */
  private procesarPagoContraEntrega(): void {
    this.load_btn_pagar = true;

    try {
      // Preparar detalles de venta
      this.venta.detalles = this.carrito_compras.map(item => ({
        _id: item._id,
        producto: item.producto._id,
        cantidad: item.cantidad,
        subtotal: item.producto.precio * item.cantidad,
        variedad: item.variedad || 'Estándar'
      }));

      let subtotalCalculado = this.venta.detalles.reduce((sum, det) => sum + det.subtotal, 0);
      
      if (this.cupon_aplicado) {
        if (this.cupon_aplicado.tipo === 'Porcentaje') {
          this.descuento_cupon = subtotalCalculado * (this.cupon_aplicado.valor / 100);
        } else {
          this.descuento_cupon = this.cupon_aplicado.valor;
        }
        subtotalCalculado -= this.descuento_cupon;
      }

      this.venta.subtotal = subtotalCalculado + this.precio_envio;
      this.venta.direccion = this.direccion_principal._id;
      this.venta.transaccion = 'CONTRA-ENTREGA-' + Date.now(); // ID único para contra entrega

      console.log('Enviando venta contra entrega:', this.venta);

      this._clienteService.registro_venta_cliente(this.venta, this.token)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Respuesta venta:', response);
            
            this.mostrarExito('¡Pedido realizado exitosamente! Número de orden: ' + response.venta.nventa);
            
            this.carrito_compras = [];
            this.calcularCarrito();
            
            setTimeout(() => {
              this._router.navigate(['/']);
            }, 3000);
          },
          error: (error) => {
            console.error('Error guardando venta:', error);
            this.mostrarError(error.message || 'Error al procesar el pedido');
            this.load_btn_pagar = false;
          }
        });

    } catch (error) {
      console.error('Error preparando compra:', error);
      this.mostrarError('Error al preparar la compra');
      this.load_btn_pagar = false;
    }
  }

  /**
   * Maneja errores
   */
  private manejarError(error: any, mensajeDefault?: string): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado');
      setTimeout(() => {
        localStorage.clear();
        this._router.navigate(['/login']);
      }, 2000);
    } else {
      const mensaje = error.message || mensajeDefault || 'Ocurrió un error';
      this.mostrarError(mensaje);
    }
  }

  /**
   * Mensajes de notificación
   */
  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: '¡Listo!',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }

  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Ups...',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje,
      timeout: 4000
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
      timeout: 2500
    });
  }
}