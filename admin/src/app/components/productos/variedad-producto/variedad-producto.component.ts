import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
declare var iziToast;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-variedad-producto',
  templateUrl: './variedad-producto.component.html',
  styleUrls: ['./variedad-producto.component.css']
})
export class VariedadProductoComponent implements OnInit {
  public producto: any = {};
  public id;
  public token;
  public nueva_variedad = '';
  public load_data = false;
  public load_btn = false;
  public url;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token');
    this.url = this._productoService.url;
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

            }
            console.log(this.producto);
          },
          (error) => {
            console.log(error);
          }
        );
    });
  }

  ngOnInit(): void {
  }

  agregar_variedad() {
    if (this.nueva_variedad) {
      this.producto.variedades.push({ titulo: this.nueva_variedad });
      this.nueva_variedad = '';
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'El campo de la variedad está vacío',
      });
    }
  }

  eliminar_variedad(idx) {
    this.producto.variedades.splice(idx, 1);
  }

  actualizar() {
    if (this.producto.titulo_variedad) {
      //Actualizar
      this.load_btn = true;
      if (this.producto.variedades.length > 0) {
        this._productoService.actualizar_producto_variedades_admin({
          titulo_variedad: this.producto.titulo_variedad,
          variedades: this.producto.variedades
        }, this.id, this.token).subscribe(
          response => {
            iziToast.show({
              title: 'Success',
              titleColor: '#1DC74C',
              color: '#FFF',
              class: 'text-success',
              position: 'topRight',
              message: 'Se actualizó la información del producto.',
            });
            this.load_btn = false;
            this.producto.titulo_variedad = '';
            
          }, error => {
            console.log(error);
            this.load_btn = false;
          });
      } else {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Debe agregar al menos una variedad',
        });
      }
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Debe ingresar el título de la variedad',
      });
    }
  }
}
