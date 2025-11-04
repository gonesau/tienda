import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { io } from "socket.io-client";
declare var $: any;
declare var iziToast;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  public token: string | null;
  public id: string | null;
  public usuario: any = undefined;
  public user_lc: any = undefined;
  public config_global: any = {};
  public op_cart: boolean = false;
  public carrito_compras: Array<any> = [];
  public url;
  public subtotal = 0;
  public socket = io('http://localhost:4201', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
  ) {
    this.url = this._clienteService.url;
    
    // Configurar eventos de socket
    this.setupSocketListeners();
    
    this.cargarUsuario();

    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => {
        console.log(error);
      }
    );
  }

  ngOnInit(): void {
    // Los eventos ya están configurados en setupSocketListeners
  }

  ngOnDestroy(): void {
    // Desconectar eventos de socket al destruir el componente
    if (this.socket) {
      this.socket.off('new-carrito');
      this.socket.off('new-carrito-add');
      this.socket.off('delete-carrito');
    }
  }

  /**
   * Configura los listeners de Socket.IO
   */
  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado en nav:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado en nav:', reason);
    });

    // Escuchar evento de eliminación de carrito
    this.socket.on('delete-carrito', (data) => {
      console.log('📥 Evento delete-carrito recibido en nav:', data);
      this.cargarUsuario();
    });

    // Escuchar evento de nuevo carrito agregado
    this.socket.on('new-carrito-add', (data) => {
      console.log('📥 Evento new-carrito-add recibido en nav:', data);
      this.cargarUsuario();
    });

    // Escuchar evento general de nuevo carrito
    this.socket.on('new-carrito', (data) => {
      console.log('📥 Evento new-carrito recibido en nav:', data);
      this.cargarUsuario();
    });
  }

  /**
   * Carga la información del usuario desde localStorage o el servidor
   */
  private cargarUsuario(): void {
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');

    if (this.token && this.id) {
      // Intentar obtener usuario de localStorage primero
      const usuarioGuardado = localStorage.getItem('usuario');

      if (usuarioGuardado) {
        try {
          this.user_lc = JSON.parse(usuarioGuardado);
        } catch (e) {
          console.error('Error parseando usuario de localStorage:', e);
          this.user_lc = undefined;
        }
      }

      // Verificar con el servidor que el token sea válido
      this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
        response => {
          if (response.data) {
            this.usuario = response.data;
            this.user_lc = response.data;
            localStorage.setItem('usuario', JSON.stringify(this.usuario));

            // Cargar carrito del usuario
            this.cargarCarrito();
          } else {
            this.limpiarSesion();
          }
        },
        error => {
          console.error('Error obteniendo cliente:', error);
          if (error.status === 401 || error.status === 403) {
            this.limpiarSesion();
          }
        }
      );
    } else {
      this.limpiarSesion();
    }
  }

  /**
   * Carga el carrito del usuario
   */
  private cargarCarrito(): void {
    if (!this.usuario || !this.usuario._id || !this.token) {
      this.carrito_compras = [];
      this.subtotal = 0;
      return;
    }

    this._clienteService.obtener_carrito_cliente(this.usuario._id, this.token).subscribe(
      response => {
        this.carrito_compras = response.data || [];
        this.calcular_carrito();
      },
      error => {
        console.error('Error obteniendo carrito:', error);
        this.carrito_compras = [];
        this.subtotal = 0;
      }
    );
  }

  /**
   * Calcula el subtotal del carrito
   */
  calcular_carrito(): void {
    this.subtotal = 0;
    
    if (this.carrito_compras && this.carrito_compras.length > 0) {
      this.carrito_compras.forEach(element => {
        if (element.producto && element.producto.precio && element.cantidad) {
          this.subtotal += element.producto.precio * element.cantidad;
        }
      });
    }
  }

  /**
   * Limpia la sesión del usuario
   */
  private limpiarSesion(): void {
    this.usuario = undefined;
    this.user_lc = undefined;
    this.carrito_compras = [];
    this.subtotal = 0;
    localStorage.removeItem('token');
    localStorage.removeItem('_id');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.limpiarSesion();
    this._router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  /**
   * Abre o cierra el modal del carrito
   */
  op_modalcart(): void {
    if (this.op_cart == false) {
      this.op_cart = true;
      $('#cart').modal('show');
    } else {
      this.op_cart = false;
      $('#cart').modal('hide');
    }
  }

  /**
   * Elimina un item del carrito
   */
  eliminar_item(id: string): void {
    if (!id) {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'ID de producto inválido'
      });
      return;
    }

    this._clienteService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se eliminó el producto del carrito de compras.'
        });

        // Emitir evento de socket
        console.log('📤 Emitiendo evento delete-carrito');
        this.socket.emit('delete-carrito', { data: response.data });
        
        // Recargar carrito
        this.cargarCarrito();
      },
      error => {
        console.error('Error eliminando item del carrito:', error);
        iziToast.error({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'No se pudo eliminar el producto del carrito'
        });
      }
    );
  }
}