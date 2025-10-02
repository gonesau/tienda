import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ProductoService } from 'src/app/services/producto.service';

declare var iziToast: any;
declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-create-producto',
  templateUrl: './create-producto.component.html',
  styleUrls: ['./create-producto.component.css'],
})
export class CreateProductoComponent implements OnInit {
  public producto: any = {};
  public file: File = undefined;
  public imgSelect: any | ArrayBuffer = 'assets/img/01.png';
  public config: any = {};
  public token;
  public load_btn = false;
  public config_global: any = {};

  constructor(
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

    this.token = this._adminService.getToken();
    this._adminService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => { 
        console.log(error) 
      }
    );
  }

  ngOnInit(): void { }

  registro(registroForm) {
    if (registroForm.valid) {
      if (this.file == undefined) {
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Debe subir una imagen de portada',
        });
      } else {
        this.load_btn = true;
        this._productoService
          .registro_producto_admin(this.producto, this.file, this.token)
          .subscribe(
            (response) => {
              iziToast.show({
                title: 'Éxito',
                message: 'Producto registrado correctamente',
                position: 'topRight',
                class: 'text-success',
                titleColor: '#1DC74C',
              });
              this.load_btn = false;
              this._router.navigate(['/panel/productos']);
            },
            (error) => {
              console.log(error);
              this.load_btn = false;
            }
          );
      }
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
