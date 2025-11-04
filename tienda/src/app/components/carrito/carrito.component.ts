import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { io } from "socket.io-client";
declare var $: any;
declare var iziToast;

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {

  public idcliente;
  public token;
  public carrito_compras: Array<any> = [];
  public subtotal = 0;
  public url;
  public total_pagar = 0;
  public costo_envio = 25.00;
  public socket = io('http://localhost:4201', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  constructor(
    private _clienteService: ClienteService,
  ) {
    this.idcliente = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.url = this._clienteService.url;

    // Configurar eventos de socket
    this.setupSocketListeners();
    
    this.cargarCarrito();
  }

  ngOnInit(): void {
    // Los eventos ya están configurados en setupSocketListeners
  }

  ngOnDestroy(): void {
    // Desconectar socket al destruir el componente
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
      console.log('✅ Socket conectado en carrito:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado en carrito:', reason);
    });

    // Escuchar evento de eliminación de carrito
    this.socket.on('delete-carrito', (data) => {
      console.log('📥 Evento delete-carrito recibido en checkout:', data);
      this.cargarCarrito();
    });

    // Escuchar evento de nuevo carrito agregado
    this.socket.on('new-carrito-add', (data) => {
      console.log('📥 Evento new-carrito-add recibido en checkout:', data);
      this.cargarCarrito();
    });

    // Escuchar evento general de nuevo carrito
    this.socket.on('new-carrito', (data) => {
      console.log('📥 Evento new-carrito recibido en checkout:', data);
      this.cargarCarrito();
    });
  }

  /**
   * Carga el carrito del cliente desde el servidor
   */
  cargarCarrito(): void {
    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
      response => {
        this.carrito_compras = response.data || [];
        this.calcular_carrito();
      },
      error => {
        console.error('Error obteniendo carrito:', error);
        this.carrito_compras = [];
        this.subtotal = 0;
        this.total_pagar = 0;
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
    
    // Calcular el total a pagar (subtotal + envío)
    this.calcular_total();
  }

  /**
   * Calcula el total a pagar (subtotal + costo de envío)
   */
  calcular_total(): void {
    this.total_pagar = this.subtotal + this.costo_envio;
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

  /**
   * Actualiza la cantidad de un producto en el carrito
   * (Método para implementación futura)
   */
  actualizar_cantidad(id: string, nueva_cantidad: number): void {
    if (nueva_cantidad < 1) {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La cantidad debe ser al menos 1'
      });
      return;
    }

    // Aquí podrías implementar la lógica para actualizar la cantidad
    // Por ahora, solo recalcula el carrito
    this.calcular_carrito();
  }
}