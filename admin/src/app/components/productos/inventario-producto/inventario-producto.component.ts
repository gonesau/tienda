import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
declare var iziToast: any;
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-inventario-producto',
  templateUrl: './inventario-producto.component.html',
  styleUrls: ['./inventario-producto.component.css'],
})
export class InventarioProductoComponent implements OnInit {
  public id;
  public producto: any = {};
  public token;
  public inventarios: Array<any> = [];
  public load_btn = false;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.id = params['id'];
      this._productoService
        .obtener_producto_admin(this.id, this.token)
        .subscribe(
          (response) => {
            if (response.data == undefined) {
              this.producto = undefined;
            } else {
              this.producto = response.data;

              this._productoService
                .listar_inventario_producto_admin(this.producto._id, this.token)
                .subscribe(
                  (response) => {
                    console.log(response);
                    console.log(this.inventarios);
                    this.inventarios = response.data;
                  },
                  (error) => {
                    console.log(error);
                  }
                );
            }
          },
          (error) => {
            console.log(error);
          }
        );
    });
  }

  eliminar(id) {
    this.load_btn = true;
    this._productoService
      .eliminar_inventario_producto_admin(id, this.token)
      .subscribe(
        (response) => {
          iziToast.show({
            title: 'Éxito',
            message: 'Producto eliminado correctamente',
            position: 'topRight',
            class: 'text-success',
            titleColor: '#1DC74C',
          });
          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          this.load_btn = false;

          // Recargar la lista de inventarios después de eliminar
          this._productoService
            .listar_inventario_producto_admin(this.producto._id, this.token)
            .subscribe(
              (response) => {
                console.log(response);
                this.inventarios = response.data;
              },
              (error) => {
                console.log(error);
              }
            );
        },
        (error) => {
          iziToast.error({
            title: 'Error',
            message: 'Ocurrió un problema con el servidor',
            position: 'topRight',
          });
          console.log(error);
          this.load_btn = false;
        }
      );
  }
}
