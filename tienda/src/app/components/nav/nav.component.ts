import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
declare var $: any;

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  public token: string | null;
  public id: string | null;
  public usuario: any = undefined;
  public user_lc: any = undefined;
  public config_global: any = {};
  public op_cart: boolean = false;
  public carrito_compras: Array<any> = [];
  public url;
  public subtotal = 0;
  
  constructor(
    private _clienteService: ClienteService,
    private _router: Router,
  ) {
    this.cargarUsuario();
    this.url = this._clienteService.url;

    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => {
        console.log(error)
      }
    );

  }

  ngOnInit(): void {
    // Recargar usuario al inicializar
    this.cargarUsuario();
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

            this._clienteService.obtener_carrito_cliente(this.usuario._id, this.token).subscribe(
              response => {
                this.carrito_compras = response.data;
                this.subtotal = 0;
                this.calcular_carrito();
              },
              error => {
                console.error('Error obteniendo carrito:', error);
              }
            );

          } else {
            this.limpiarSesion();
          }
        },
        error => {
          console.error('Error obteniendo cliente:', error);
          this.limpiarSesion();
        }
      );
    } else {
      this.limpiarSesion();
    }
  }

  /**
   * Limpia la sesión del usuario
   */
  private limpiarSesion(): void {
    this.usuario = undefined;
    this.user_lc = undefined;
    localStorage.removeItem('token');
    localStorage.removeItem('_id');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    // Limpiar datos de sesión
    this.limpiarSesion();

    // Redirigir a inicio
    this._router.navigate(['/']).then(() => {
      // Recargar página después de redirigir
      window.location.reload();
    });
  }


  op_modalcart(){
    if(this.op_cart == false){
      this.op_cart = true;
      $('#cart').modal('show');
    } else {
      this.op_cart = false;
      $('#cart').modal('hide');
    }
  }

  calcular_carrito(){
    this.carrito_compras.forEach(element => {
      this.subtotal += element.producto.precio * element.cantidad;
    });
  }


  eliminar_item(id){
    this._clienteService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        this.subtotal = 0;
        this.cargarUsuario();
      },
      error => {
        console.error('Error eliminando item del carrito:', error);
      }
    );
  }

}