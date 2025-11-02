import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { Global } from 'src/app/services/global';
import { v4 as uuidv4 } from 'uuid';
import { NgForm } from '@angular/forms';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  public token: string;
  public config: any = undefined;
  public url: string;

  public titulo_cat = '';
  public icono_cat = '';
  
  public file: File | undefined;
  public imgSelect: any | ArrayBuffer = 'assets/img/01.png';

  public load_data = true;
  public load_btn = false;

  // Control del modal
  public categoriaAEliminar: any = null;
  public modalInstance: any = null;

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

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga la configuración
   */
  init_data(): void {
    this.load_data = true;
    this._adminService.obtener_config_admin(this.token).subscribe(
      response => {
        if (response.data) {
          this.config = response.data;
          this.imgSelect = this.url + 'obtener_logo/' + this.config.logo;
          
          if (!this.config.categorias) {
            this.config.categorias = [];
          }
        } else {
          this.config = undefined;
          this.mostrarError('No se pudo obtener la configuración.');
        }
        this.load_data = false;
      },
      error => {
        console.error('Error al cargar configuración:', error);
        this.config = undefined;
        this.load_data = false;
        this.mostrarError('Error en el servidor, no se pudo cargar la configuración.');
      }
    );
  }

  /**
   * Agrega una nueva categoría
   */
  agregar_cat(): void {
    if (!this.titulo_cat || !this.titulo_cat.trim()) {
      this.mostrarError('Debes ingresar el nombre de la categoría');
      return;
    }

    if (!this.icono_cat || !this.icono_cat.trim()) {
      this.mostrarError('Debes ingresar el ícono de la categoría');
      return;
    }

    // Verificar duplicados
    const existe = this.config.categorias.some(
      (cat: any) => cat.titulo.toLowerCase() === this.titulo_cat.trim().toLowerCase()
    );

    if (existe) {
      this.mostrarError('Esta categoría ya existe');
      return;
    }

    if (!this.config.categorias) {
      this.config.categorias = [];
    }

    this.config.categorias.push({ 
      titulo: this.titulo_cat.trim(), 
      icono: this.icono_cat.trim(), 
      _id: uuidv4() 
    });

    this.titulo_cat = '';
    this.icono_cat = '';

    iziToast.success({
      title: 'Agregada',
      message: 'Categoría agregada. No olvides guardar los cambios.',
      position: 'topRight',
      timeout: 2000
    });
  }

  /**
   * Abre modal de confirmación
   */
  abrirModalEliminar(categoria: any): void {
    this.categoriaAEliminar = categoria;
    
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
      this.modalInstance.show();
    }
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.categoriaAEliminar = null;
  }

  /**
   * Confirma eliminación de categoría
   */
  confirmarEliminacion(): void {
    if (this.categoriaAEliminar && this.categoriaAEliminar._id) {
      this.config.categorias = this.config.categorias.filter(
        (cat: any) => cat._id !== this.categoriaAEliminar._id
      );
      
      iziToast.info({
        title: 'Eliminada',
        message: 'Categoría eliminada. No olvides guardar los cambios.',
        position: 'topRight',
        timeout: 2000
      });
      
      this.cerrarModal();
    }
  }

  /**
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const file: File | undefined = event.target.files[0];

    if (!file) {
      this.resetFileInput();
      return;
    }
    
    // Validación de tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB.');
      this.resetFileInput();
      return;
    }

    // Validación de tipo de archivo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('El archivo debe ser una imagen (png, jpg, webp, svg).');
      this.resetFileInput();
      return;
    }

    this.file = file;
    const reader = new FileReader();
    reader.onload = e => this.imgSelect = reader.result;
    reader.readAsDataURL(this.file);
  }

  /**
   * Actualiza la configuración
   */
  actualizar(confForm: NgForm): void {
    if (confForm.invalid) {
      Object.keys(confForm.controls).forEach(key => {
        confForm.controls[key].markAsTouched();
      });
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
          title: 'Éxito',
          message: 'Configuración actualizada correctamente',
          position: 'topRight'
        });
        this.load_btn = false;
        
        // Resetear file input
        this.file = undefined;
        if (this.fileInput?.nativeElement) {
          this.fileInput.nativeElement.value = '';
        }
        
        // Recargar para mostrar el nuevo logo
        this.init_data();
      }, 
      error => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error al actualizar la configuración.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Resetea el input de archivo
   */
  private resetFileInput(): void {
    this.file = undefined;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}