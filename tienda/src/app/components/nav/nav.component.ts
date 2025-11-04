// nav.component.ts - Frontend
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io, Socket } from "socket.io-client";
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

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
  ) {
    this.url = this._clienteService.url;
    
    this.socket = io('http://localhost:4201', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupSocketListeners();
    this.cargarUsuario();
    this.cargarConfiguracion();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.off('new-carrito-add');
      this.socket.off('delete-carrito');
      this.socket.off('update-carrito');
      this.socket.disconnect();
    }
  }

  private setupSocketListeners(): void {
    this.socket.on('new-carrito-add', (data) => {
      if (data.cliente === this.id) {
        this.cargarCarrito();
      }
    });

    this.socket.on('delete-carrito', (data) => {
      if (data.cliente === this.id || data.data?.cliente === this.id) {
        this.cargarCarrito();
      }
    });

    this.socket.on('update-carrito', (data) => {
      if (data.cliente === this.id) {
        this.cargarCarrito();
      }
    });
  }

  private cargarUsuario(): void {
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');

    if (this.token && this.id) {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          this.user_lc = JSON.parse(usuarioGuardado);
        } catch (e) {
          this.user_lc = undefined;
        }
      }

      this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
        response => {
          if (response.data) {
            this.user_lc = response.data;
            localStorage.setItem('usuario', JSON.stringify(this.user_lc));
            this.cargarCarrito();
          } else {
            this.limpiarSesion();
          }
        },
        error => {
          if (error.status === 401 || error.status === 403) {
            this.limpiarSesion();
          }
        }
      );
    } else {
      this.limpiarSesion();
    }
  }

  private cargarConfiguracion(): void {
    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data || {};
      },
      error => {
        console.error('Error cargando configuración');
      }
    );
  }

  private cargarCarrito(): void {
    if (!this.id || !this.token) {
      this.carrito_compras = [];
      this.subtotal = 0;
      return;
    }

    this._clienteService.obtener_carrito_cliente(this.id, this.token).subscribe(
      response => {
        this.carrito_compras = response.data || [];
        this.calcular_carrito();
      },
      error => {
        this.carrito_compras = [];
        this.subtotal = 0;
      }
    );
  }

  calcular_carrito(): void {
    this.subtotal = 0;
    
    if (this.carrito_compras && this.carrito_compras.length > 0) {
      this.carrito_compras.forEach(item => {
        if (item.producto?.precio && item.cantidad) {
          this.subtotal += item.producto.precio * item.cantidad;
        }
      });
    }
  }

  private limpiarSesion(): void {
    this.user_lc = undefined;
    this.carrito_compras = [];
    this.subtotal = 0;
    localStorage.removeItem('token');
    localStorage.removeItem('_id');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
  }

  logout(): void {
    this.limpiarSesion();
    this._router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  op_modalcart(): void {
    this.op_cart = !this.op_cart;
    if (this.op_cart) {
      $('#cart').modal('show');
    } else {
      $('#cart').modal('hide');
    }
  }

  eliminar_item(id: string): void {
    if (!id) {
      this.mostrarError('Producto inválido');
      return;
    }

    this._clienteService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        this.mostrarExito('Producto eliminado de tu carrito');
        this.cargarCarrito();
      },
      error => {
        this.manejarError(error, 'No pudimos eliminar el producto');
      }
    );
  }

  private manejarError(error: any, mensajeDefault?: string): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado. Por favor inicia sesión nuevamente');
      setTimeout(() => {
        this.limpiarSesion();
        this._router.navigate(['/login']);
      }, 2000);
    } else {
      const mensaje = error.error?.message || mensajeDefault || 'Ocurrió un error inesperado';
      this.mostrarError(mensaje);
    }
  }

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
}