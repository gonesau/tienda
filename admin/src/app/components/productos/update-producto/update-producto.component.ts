import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { Global } from 'src/app/services/global';
import { ProductoService } from 'src/app/services/producto.service';
declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-update-producto',
  templateUrl: './update-producto.component.html',
  styleUrls: ['./update-producto.component.css'],
})
export class UpdateProductoComponent implements OnInit {
  public producto: any = {};
  public config: any = {};
  public imgSelect: any | ArrayBuffer;
  public load_btn = false;
  public id;
  public token;
  public url;
  public file: File = undefined;
  public config_global: any = {};

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.config = {
      height: 500,
      menubar: true,
      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount',
      ],
      toolbar:
        'undo redo | formatselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
      content_style:
        'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    };

    this.token = localStorage.getItem('token');
    this.url = Global.url;

        this._adminService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => { 
        console.log(error) 
      }
    );

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
              this.imgSelect =
                this.url + 'obtener_portada/' + this.producto.portada;
            }
          },
          (error) => {
            console.log(error);
          }
        );
    });
  }

  actualizar(actualizarForm) {
    if (actualizarForm.valid) {
      var data: any = {};
      if (this.file != undefined) {
        data.portada = this.file;
      }
      data.titulo = this.producto.titulo;
      data.stock = this.producto.stock;
      data.precio = this.producto.precio;
      data.categoria = this.producto.categoria;
      data.descripcion = this.producto.descripcion;
      data.contenido = this.producto.contenido;

      this.load_btn = true;
      this._productoService
        .actualizar_producto_admin(data, this.id, this.token)
        .subscribe(
          (response) => {
            iziToast.show({
              title: 'Éxito',
              message: 'Producto actualizado correctamente',
              position: 'topRight',
              class: 'text-success',
              titleColor: '#1DC74C',
            });
            this.load_btn = false;
            this._router.navigate(['/panel/productos']);
          },
          (error) => {
            iziToast.show({
              title: 'Error',
              titleColor: '#FF0000',
              color: '#FFF',
              class: 'text-danger',
              position: 'topRight',
              message: 'Error al actualizar el producto',
            });
            this.load_btn = false;
            this._router.navigate(['/panel/productos']);
          }
        );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son válidos',
      });
      this.load_btn = false;
    }
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

      $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
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
        const reader = new FileReader();
        reader.onload = (e) => (this.imgSelect = reader.result);
        reader.readAsDataURL(file);

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
        $('#input-portada').text('Seleccionar imagen');
        this.imgSelect = 'assets/img/01.png';
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
      $('#input-portada').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
      this.file = undefined;
    }
  }
}
