import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { Global } from 'src/app/services/global';
import { v4 as uuidv4 } from 'uuid';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-galeria-producto',
  templateUrl: './galeria-producto.component.html',
  styleUrls: ['./galeria-producto.component.css']
})
export class GaleriaProductoComponent implements OnInit {
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  public producto: any = null;
  public id: string = '';
  public token: string;
  public file: File | undefined;
  public preview: string | ArrayBuffer | null = null;
  public load_btn = false;
  public load_btn_eliminar = false;
  public load_data = true;
  public url: string;
  
  public deleteTarget: any = null;
  public deleteModal: any = null;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    // Inicializar el modal
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.deleteModal = new bootstrap.Modal(modalElement);
    }

    this._route.params.subscribe(params => {
      this.id = params['id'];
      
      if (!this.id) {
        this.load_data = false;
        this.mostrarError('ID de producto no válido');
        this._router.navigate(['/panel/productos']);
        return;
      }
      
      this.init_data();
    });
  }

  ngOnDestroy(): void {
    if (this.deleteModal) {
      this.deleteModal.dispose();
    }
  }

  /**
   * Carga los datos del producto
   */
  init_data(): void {
    this.load_data = true;
    
    this._productoService.obtener_producto_admin(this.id, this.token).subscribe(
      (response) => {
        const datosProducto = response.data || response;
        
        if (!datosProducto || !datosProducto._id) {
          this.producto = null;
          this.load_data = false;
          this.mostrarError('Producto no encontrado');
          return;
        }
        
        this.producto = datosProducto;
        
        // Inicializar galería si no existe
        if (!this.producto.galeria) {
          this.producto.galeria = [];
        }
        
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar producto:', error);
        this.producto = null;
        this.load_data = false;
        this.mostrarError('Error al cargar el producto');
      }
    );
  }

  /**
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const files = event.target.files;
    
    if (!files || !files[0]) {
      this.resetFileInput();
      return;
    }

    const file = <File>files[0];

    // Validar tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB');
      this.resetFileInput();
      return;
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('Formato inválido. Usa PNG, JPG, JPEG o WEBP');
      this.resetFileInput();
      return;
    }

    // Archivo válido
    this.file = file;

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.preview = e.target?.result || null;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Sube la imagen a la galería
   */
  subir_imagen(): void {
    if (!this.file) {
      this.mostrarError('Debes seleccionar una imagen');
      return;
    }

    const data = {
      imagen: this.file,
      _id: uuidv4()
    };

    this.load_btn = true;

    this._productoService.agregar_imagen_galeria_admin(this.id, data, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Imagen agregada correctamente',
          position: 'topRight',
        });

        this.resetFileInput();
        this.init_data(); // Recargar para mostrar la nueva imagen
      },
      (error) => {
        console.error('Error al subir imagen:', error);
        const errorMsg = error.error?.message || 'Error al subir la imagen';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Abre el modal de confirmación de eliminación
   */
  openDeleteModal(img: any): void {
    this.deleteTarget = img;
    if (this.deleteModal) {
      this.deleteModal.show();
    }
  }

  /**
   * Cierra el modal de eliminación
   */
  closeDeleteModal(): void {
    if (this.deleteModal) {
      this.deleteModal.hide();
    }
    this.deleteTarget = null;
    this.load_btn_eliminar = false;
  }

  /**
   * Confirma la eliminación de la imagen
   */
  confirmDelete(): void {
    if (!this.deleteTarget) return;
    
    this.load_btn_eliminar = true;

    this._productoService.eliminar_imagen_galeria_admin(this.id, this.deleteTarget, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Imagen eliminada correctamente',
          position: 'topRight',
        });

        this.closeDeleteModal();
        this.init_data(); // Recargar para actualizar la galería
      },
      (error) => {
        console.error('Error al eliminar imagen:', error);
        const errorMsg = error.error?.message || 'Error al eliminar la imagen';
        this.mostrarError(errorMsg);
        this.load_btn_eliminar = false;
      }
    );
  }

  /**
   * Resetea el input de archivo y el preview
   */
  private resetFileInput(): void {
    this.file = undefined;
    this.preview = null;
    this.load_btn = false;
    
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