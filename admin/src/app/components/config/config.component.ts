import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { Global } from 'src/app/services/global';
import { v4 as uuidv4 } from 'uuid';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  public token: string;
  public config: any = undefined;
  public url: string;

  public titulo_cat = '';
  public icono_cat = '';
  
  public file: File | undefined;
  public imgSelect: any | ArrayBuffer = 'assets/img/01.png';

  public load_data = true;
  public load_btn = false;

  constructor(
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;
  }

  ngOnInit(): void {
    if (!this.token) {
        this._router.navigate(['/login']);
        return;
    }
    this.init_data();
  }

  init_data() {
    this.load_data = true;
    this._adminService.obtener_config_admin(this.token).subscribe(
      response => {
        if(response.data){
            this.config = response.data;
            this.imgSelect = this.url + 'obtener_logo/' + this.config.logo;
            if (!this.config.categorias) {
              this.config.categorias = [];
            }
        } else {
            this.mostrarError('No se pudo obtener la configuración.');
        }
        this.load_data = false;
      },
      error => {
        console.error('Error al cargar configuración:', error);
        this.load_data = false;
        this.mostrarError('Error en el servidor, no se pudo cargar la configuración.');
      }
    );
  }

  agregar_cat() {
    if (this.titulo_cat && this.icono_cat) {
      if (!this.config.categorias) {
        this.config.categorias = [];
      }
      this.config.categorias.push({ 
        titulo: this.titulo_cat, 
        icono: this.icono_cat, 
        _id: uuidv4() 
      });
      this.titulo_cat = '';
      this.icono_cat = '';
    } else {
      this.mostrarError('Debe ingresar un título e icono para la categoría.');
    }
  }

  eliminar_cat(id: string) {
    if (id) {
        this.config.categorias = this.config.categorias.filter(cat => cat._id !== id);
    }
  }

  actualizar(confForm: NgForm) {
    if (confForm.invalid) {
      this.mostrarError('Complete correctamente el formulario.');
      return;
    }
    
    this.load_btn = true;
    let data: any = {
      titulo: this.config.titulo,
      serie: this.config.serie,
      correlativo: this.config.correlativo,
      categorias: this.config.categorias
    };

    if (this.file) {
      data.logo = this.file;
    }

    this._adminService.actualizar_config_admin(this.config._id, data, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'ÉXITO',
          message: 'Configuración actualizada correctamente.',
          position: 'topRight'
        });
        this.load_btn = false;
        this.init_data(); // Recargar los datos para mostrar el nuevo logo si se cambió
      }, 
      error => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error al actualizar la configuración.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  fileChangeEvent(event: any): void {
    const file: File | undefined = event.target.files[0];

    if (!file) {
      this.mostrarError('No se ha seleccionado ninguna imagen.');
      this.file = undefined;
      return;
    }
    
    // Validación de tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB.');
      this.file = undefined;
      event.target.value = ''; // Limpiar el input
      return;
    }

    // Validación de tipo de archivo
    if (!['image/png', 'image/webp', 'image/jpg', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      this.mostrarError('El archivo debe ser una imagen (png, jpg, webp, svg).');
      this.file = undefined;
      event.target.value = ''; // Limpiar el input
      return;
    }

    this.file = file;
    const reader = new FileReader();
    reader.onload = e => this.imgSelect = reader.result;
    reader.readAsDataURL(this.file);
  }
  
  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}

