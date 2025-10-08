import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-galeria-producto',
  templateUrl: './galeria-producto.component.html',
  styleUrls: ['./galeria-producto.component.css']
})
export class GaleriaProductoComponent implements OnInit {

  public producto: any = {};
  public id;
  public token;
  public file: File = undefined;
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

  subir_imagen() {

  }

  fileChangeEvent(event: any): void {
    var file;

    if (event.target.files && event.target.files[0]) {
      file = <File>event.target.files[0];
      console.log(file);
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'No hay una imagen seleccionada',
      });

      this.file = undefined;
    }

    // Validación tamaño
    if (file.size <= 5000000) {
      // Validación tipo
      if (
        file.type == 'image/png' ||
        file.type == 'image/webp' ||
        file.type == 'image/jpg' ||
        file.type == 'image/jpeg'
      ) {

        $('#input-portada').text(file.name);

        this.file = file;
      } else {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'La imagen debe ser png, webp, jpg o jpeg',
        });

        this.file = undefined;
      }
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La imagen no puede superar los 5MB',
      });
      this.file = undefined;
    }
  }

}
