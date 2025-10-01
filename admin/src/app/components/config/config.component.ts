import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { v4 as uuidv4 } from 'uuid';
declare var iziToast;
declare var jQuery: any;
declare var $: any;


@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  public token;
  public config: any = {};

  public titulo_cat = '';
  public icono_cat = '';
  public file: File | undefined;
    public imgSelect: any | ArrayBuffer;

  constructor(
    private _adminService: AdminService
  ) {
    this.token = localStorage.getItem('token');
    this._adminService.obtener_config_admin(this.token).subscribe(
      response => {
        this.config = response.data;

        if (!this.config.categorias) {
          this.config.categorias = [];
        }
      },
      error => {
        console.log(error);
      }
    );
  }

  ngOnInit(): void {}

  agregar_cat() {
    if (this.titulo_cat && this.icono_cat) {
      this.config.categorias.push({ titulo: this.titulo_cat, icono: this.icono_cat, _id: uuidv4() });
      this.titulo_cat = '';
      this.icono_cat = '';
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Debe ingresar el título e icono de la categoría',
      });
    }
  }

  actualizar(confForm: any) {
    if (confForm.valid) {
      let data = {
        titulo: confForm.value.titulo,
        serie: confForm.value.serie,
        correlativo: confForm.value.correlativo,
        categorias: this.config.categorias,
        logo: this.file
      };

      this._adminService.actualizar_config_admin('68daa75d1e1062bf51932fa2', data, this.token).subscribe(
        response => {
          iziToast.show({
            title: 'Éxito',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Configuración actualizada correctamente',
          });
        }, error => {
          console.log(error);
        }
      );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Complete correctamente el formulario',
      });
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

      $('#confForm').text('Seleccionar imagen');
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
        
        $('.cs-file-drop-icon').addClass('cs-file-drop-preview img-thumbnail rounded');
        $('.cs-file-drop-icon').removeClass('cs-file-drop-icon cxi-upload');

        reader.readAsDataURL(file);
        $('#confForm').text(file.name);

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
      $('#confForm').text('Seleccionar imagen');
      this.imgSelect = 'assets/img/01.png';
      this.file = undefined;
    }
  }

  ngDoCheck(): void {
    $('.cs-file-drop-preview').html('<img src="' + this.imgSelect + '" class="img-fluid" alt="Logo">');
  } 

}
