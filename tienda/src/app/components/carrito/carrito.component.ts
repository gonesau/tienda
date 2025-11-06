// tienda/src/app/components/carrito/carrito.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io, Socket } from "socket.io-client";
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
declare var iziToast: any;
declare var Cleave;
declare var StickySidebar;

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {
  public idcliente: string | null;
  public token: string | null;
  public carrito_compras: Array<any> = [];
  public subtotal = 0;
  public url: string;
  public total_pagar = 0;
  public costo_envio = 25.00;
  public load_data = true;

  private socket: Socket;
  private destroy$ = new Subject<void>();
  private carritoUpdate$ = new Subject<void>();
  private isUpdating = false;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.idcliente = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.url = this._clienteService.url;
  }

  ngOnInit(): void {

    setTimeout(() => {
      new Cleave('#cc-number', {
        creditCard: true,
        onCreditCardTypeChanged: function (type) {
          // update UI ...
        }
      });

      new Cleave('#cc-exp-date', {
        date: true,
        datePattern: ['m', 'y']
      });

      var sidebar = new StickySidebar('.sidebar-sticky', {topSpacing: 20});

    }, 0);

    if (!this.token || !this.idcliente) {
      this._router.navigate(['/login']);
      return;
    }

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
   * Configura debounce para actualizaciones del carrito
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
   * Carga el carrito (pública)
   */
  public cargarCarrito(): void {
    this.carritoUpdate$.next();
  }

  /**
   * Carga el carrito (interna)
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
          this.calcular_carrito();
          this.load_data = false;
          this.isUpdating = false;
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
   * Calcula totales del carrito
   */
  calcular_carrito(): void {
    this.subtotal = 0;

    if (this.carrito_compras && this.carrito_compras.length > 0) {
      this.subtotal = this.carrito_compras.reduce((total, item) => {
        if (item.producto?.precio && item.cantidad) {
          return total + (item.producto.precio * item.cantidad);
        }
        return total;
      }, 0);
    }

    this.total_pagar = this.subtotal + this.costo_envio;
  }

  /**
   * Elimina un producto del carrito
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
          // El socket actualizará automáticamente
        },
        error: (error) => {
          this.manejarError(error, 'No pudimos eliminar el producto');
        }
      });
  }

  /**
   * Actualiza la cantidad de un producto
   */
  actualizar_cantidad(id: string, nueva_cantidad: number): void {
    if (nueva_cantidad < 1) {
      this.mostrarError('La cantidad debe ser al menos 1');
      return;
    }

    // Validar stock antes de actualizar
    const item = this.carrito_compras.find(i => i._id === id);
    if (item && item.producto) {
      if (nueva_cantidad > item.producto.stock) {
        this.mostrarError(`Solo hay ${item.producto.stock} unidades disponibles`);
        return;
      }
    }

    const data = { cantidad: nueva_cantidad };

    this._clienteService.actualizar_cantidad_carrito(id, data, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // El socket actualizará automáticamente
        },
        error: (error) => {
          this.manejarError(error, 'No pudimos actualizar la cantidad');
        }
      });
  }

  /**
   * Maneja errores de forma centralizada
   */
  private manejarError(error: any, mensajeDefault?: string): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado. Por favor inicia sesión nuevamente');
      setTimeout(() => {
        localStorage.clear();
        this._router.navigate(['/login']);
      }, 2000);
    } else {
      const mensaje = error.message || mensajeDefault || 'Ocurrió un error inesperado';
      this.mostrarError(mensaje);
    }
  }

  /**
   * Muestra mensaje de éxito
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

  /**
   * Muestra mensaje de error
   */
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
}