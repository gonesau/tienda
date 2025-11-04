// tienda/src/app/components/nav/nav.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io, Socket } from "socket.io-client";
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  public token: string | null;
  public id: string | null;
  public user_lc: any = undefined;
  public config_global: any = {};
  public op_cart: boolean = false;
  public carrito_compras: Array<any> = [];
  public url: string;
  public subtotal = 0;
  
  private socket: Socket;
  private destroy$ = new Subject<void>();
  private carritoUpdate$ = new Subject<void>();
  private isLoadingCarrito = false;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
  ) {
    this.url = this._clienteService.url;
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');
  }

  ngOnInit(): void {
    this.cargarConfiguracion();
    
    if (this.token && this.id) {
      this.inicializarSocket();
      this.cargarUsuario();
      this.setupCarritoDebounce();
    }
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
   * Inicializa conexión Socket.IO
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
      console.log('Socket conectado:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket:', error);
    });

    // Eventos del carrito
    this.socket.on('new-carrito-add', (data) => {
      if (data.cliente === this.id) {
        this.carritoUpdate$.next();
      }
    });

    this.socket.on('delete-carrito', (data) => {
      const clienteId = data.cliente || data.data?.cliente;
      if (clienteId === this.id) {
        this.carritoUpdate$.next();
      }
    });

    this.socket.on('update-carrito', (data) => {
      if (data.cliente === this.id) {
        this.carritoUpdate$.next();
      }
    });
  }

  /**
   * Carga datos del usuario
   */
  private cargarUsuario(): void {
    if (!this.token || !this.id) {
      this.limpiarSesion();
      return;
    }

    // Cargar desde localStorage primero (para UI inmediata)
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        this.user_lc = JSON.parse(usuarioGuardado);
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }

    // Verificar con el servidor
    this._clienteService.obtener_cliente_guest(this.id, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.user_lc = response.data;
            localStorage.setItem('usuario', JSON.stringify(this.user_lc));
            this.cargarCarrito();
          } else {
            this.limpiarSesion();
          }
        },
        error: (error) => {
          console.error('Error cargando usuario:', error);
          if (error.status === 401 || error.status === 403) {
            this.limpiarSesion();
          }
        }
      });
  }

  /**
   * Carga configuración del sitio
   */
  private cargarConfiguracion(): void {
    this._clienteService.obtener_config_publico()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.config_global = response.data || {};
        },
        error: (error) => {
          console.error('Error cargando configuración:', error);
          this.config_global = {};
        }
      });
  }

  /**
   * Carga el carrito del cliente (pública)
   */
  public cargarCarrito(): void {
    this.carritoUpdate$.next();
  }

  /**
   * Carga el carrito del cliente (interna)
   */
  private cargarCarritoInternal(): void {
    if (!this.id || !this.token || this.isLoadingCarrito) {
      return;
    }

    this.isLoadingCarrito = true;

    this._clienteService.obtener_carrito_cliente(this.id, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.carrito_compras = response.data || [];
          this.calcular_carrito();
          this.isLoadingCarrito = false;
        },
        error: (error) => {
          console.error('Error cargando carrito:', error);
          this.carrito_compras = [];
          this.subtotal = 0;
          this.isLoadingCarrito = false;
        }
      });
  }

  /**
   * Calcula el subtotal del carrito
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
  }

  /**
   * Limpia la sesión del usuario
   */
  private limpiarSesion(): void {
    this.user_lc = undefined;
    this.carrito_compras = [];
    this.subtotal = 0;
    localStorage.clear();
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): void {
    this.limpiarSesion();
    this._router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  /**
   * Abre/cierra modal del carrito
   */
  op_modalcart(): void {
    this.op_cart = !this.op_cart;
    if (this.op_cart) {
      $('#cart').modal('show');
    } else {
      $('#cart').modal('hide');
    }
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
          // El socket ya actualizará el carrito automáticamente
        },
        error: (error) => {
          this.mostrarError(error.message || 'No pudimos eliminar el producto');
        }
      });
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