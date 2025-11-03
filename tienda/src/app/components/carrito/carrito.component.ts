import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { io } from "socket.io-client";
declare var $: any;
declare var iziToast;


@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {

  public idcliente;
  public token;
  public carrito_compras: Array<any> = [];
  public subtotal = 0;
  public url;
  public total_pagar = 0;
  public socket = io('http://localhost:4201');

  constructor(
    private _clienteService: ClienteService,
  ) {
    this.idcliente = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.url = this._clienteService.url;


    this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
      response => {
        this.carrito_compras = response.data;
        this.subtotal = 0;
        this.calcular_carrito();
      },
      error => {
        console.error('Error obteniendo carrito:', error);
      }
    );
  }

  ngOnInit(): void {
  }


  calcular_carrito() {
    this.carrito_compras.forEach(element => {
      this.subtotal += element.producto.precio * element.cantidad;
    });
  }

  calcular_total() {
    this.total_pagar = this.subtotal;
  }

  eliminar_item(id) {
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


        this.socket.emit('delete-carrito', { data: response.data });
        this._clienteService.obtener_carrito_cliente(this.idcliente, this.token).subscribe(
          response => {
            this.carrito_compras = response.data;
            this.subtotal = 0;
            this.calcular_carrito();
          },
          error => {
            console.error('Error obteniendo carrito:', error);
          }
        );
      },
      error => {
        console.error('Error eliminando item del carrito:', error);
      }
    );
  }

}
