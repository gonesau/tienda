// CarritoComponent.ts - Frontend
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io, Socket } from "socket.io-client";
declare var iziToast: any;

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

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.idcliente = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.url = this._clienteService.url;

    // Inicializar socket
    this.socket = io('http://localhost:4201', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupSocketListeners();
  }

  ngOnInit(): void {
    if (!this.token || !this.idcliente) {
      this._router.navigate(['/login']);
      return;
    }
    this.cargarCarrito();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.off('new-carrito-add');
      this.socket.off('delete-carrito');
      this.socket.off('update-carrito');
      this.socket.disconnect();
    }
  }

  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('Socket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('new-carrito-add', (data) => {
      if (data.cliente === this.idcliente) {
        this.cargarCarrito();
      }
    });

    this.socket.on('delete-carrito', (data) => {
      if (data.cliente === this.idcliente || 
          data.data?.cliente === this.idcliente) {
        this.cargarCarrito();
      }
    });

    this.socket.on('update-carrito', (data) => {
      if (data.cliente === this.idcliente) {
        this.cargarCarrito();
      }
    });
  }

  cargarCarrito(): void {
    if (!this.idcliente || !this.token) {
      this.carrito_compras = [];
      this.load_data = false;
      return;
    }

    this.load_data = true;
    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
      response => {
        this.carrito_compras = response.data || [];
        this.calcular_carrito();
        this.load_data = false;
      },
      error => {
        this.manejarError(error);
        this.load_data = false;
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
    
    this.total_pagar = this.subtotal + this.costo_envio;
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

  actualizar_cantidad(id: string, nueva_cantidad: number): void {
    if (nueva_cantidad < 1) {
      this.mostrarError('La cantidad debe ser al menos 1');
      return;
    }

    const data = { cantidad: nueva_cantidad };
    
    this._clienteService.actualizar_cantidad_carrito(id, data, this.token).subscribe(
      response => {
        this.cargarCarrito();
      },
      error => {
        this.manejarError(error, 'No pudimos actualizar la cantidad');
      }
    );
  }

  private manejarError(error: any, mensajeDefault?: string): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado. Por favor inicia sesión nuevamente');
      setTimeout(() => {
        localStorage.clear();
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