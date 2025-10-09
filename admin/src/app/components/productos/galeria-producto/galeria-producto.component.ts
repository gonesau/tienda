import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
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

  public producto: any = {};
  public id: any;
  public token: any;
  public file: File | undefined;
  public preview: string | ArrayBuffer | null = null;
  public load_btn = false;
  public load_btn_eliminar = false;
  public url: string;
  
  private deleteTarget: any = null;
  private deleteModal: any = null;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token');
    this.url = this._productoService.url;
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.init_data();
    });
  }

  ngOnInit(): void {
    // Inicializar el modal una sola vez
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.deleteModal = new bootstrap.Modal(modalElement);
    }
  }

  init_data(): void {
    this._productoService.obtener_producto_admin(this.id, this.token).subscribe(
      (response) => {
        this.producto = response.data || {};
      },
      (error) => {
        console.error('Error al cargar producto:', error);
        this.showToast('Error al cargar el producto', 'error');
      }
    );
  }

  fileChangeEvent(event: any): void {
    const files = event.target.files;
    if (!files || !files[0]) return;

    const file = <File>files[0];

    // Validaciones
    if (file.size > 5000000) {
      this.showToast('La imagen no puede superar los 5MB', 'error');
      this.resetFileInput();
      return;
    }

    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Formato inválido: debe ser PNG, WEBP, JPG o JPEG', 'error');
      this.resetFileInput();
      return;
    }

    this.file = file;

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => (this.preview = e.target?.result || null);
    reader.readAsDataURL(file);
  }

  subir_imagen(): void {
    if (!this.file) {
      this.showToast('Debe seleccionar una imagen', 'error');
      return;
    }

    const data = { imagen: this.file, _id: uuidv4() };
    this.load_btn = true;

    this._productoService.agregar_imagen_galeria_admin(this.id, data, this.token).subscribe(
      (response) => {
        this.showToast('Imagen agregada correctamente', 'success');
        this.resetFileInput();
        this.init_data();
        this.load_btn = false;
      },
      (error) => {
        console.error('Error al subir imagen:', error);
        this.showToast('Error al subir la imagen', 'error');
        this.load_btn = false;
      }
    );
  }

  openDeleteModal(img: any): void {
    this.deleteTarget = img;
    if (this.deleteModal) {
      this.deleteModal.show();
    }
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    
    this.load_btn_eliminar = true;

    this._productoService.eliminar_imagen_galeria_admin(this.id, this.deleteTarget, this.token).subscribe(
      (response) => {
        this.showToast('Imagen eliminada correctamente', 'success');
        this.closeDeleteModal();
        this.init_data();
      },
      (error) => {
        console.error('Error al eliminar imagen:', error);
        this.showToast('Error al eliminar la imagen', 'error');
        this.load_btn_eliminar = false;
      }
    );
  }

  private closeDeleteModal(): void {
    if (this.deleteModal) {
      this.deleteModal.hide();
    }
    this.deleteTarget = null;
    this.load_btn_eliminar = false;
  }

  private resetFileInput(): void {
    this.file = undefined;
    this.preview = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const config = {
      title: type === 'success' ? 'Éxito' : 'Error',
      message: message,
      color: type === 'success' ? '#28a745' : '#dc3545',
      position: 'topRight',
      timeout: 3000
    };
    iziToast.show(config);
  }
}