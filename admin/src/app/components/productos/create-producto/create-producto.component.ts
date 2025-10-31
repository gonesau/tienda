import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ProductoService } from 'src/app/services/producto.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-create-producto',
  templateUrl: './create-producto.component.html',
  styleUrls: ['./create-producto.component.css'],
})
export class CreateProductoComponent implements OnInit {
  
  public producto: any = {
    titulo: '',
    stock: 0,
    precio: 0,
    categoria: '',
    descripcion: '',
    contenido: ''
  };
  
  public file: File | undefined;
  public imgSelect: any | ArrayBuffer = 'assets/img/no-image.png';
  public config: any = {};
  public token: string;
  public load_btn = false;
  public config_global: any = { categorias: [] };

  constructor(
    private _productoService: ProductoService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    // Configuración de TinyMCE
    this.config = {
      height: 500,
      menubar: true,
      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount',
      ],
      toolbar:
        'undo redo | formatselect | bold italic backcolor | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | removeformat | help',
      content_style:
        'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    };

    this.token = this._adminService.getToken() || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.cargar_config();
  }

  /**
   * Carga la configuración global (categorías)
   */
  cargar_config(): void {
    this._adminService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data || { categorias: [] };
      },
      error => {
        console.error('Error al cargar configuración:', error);
        this.mostrarError('Error al cargar las categorías');
      }
    );
  }

  /**
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const files = event.target.files;
    
    if (!files || !files[0]) {
      this.mostrarError('No se seleccionó ninguna imagen');
      this.file = undefined;
      this.imgSelect = 'assets/img/no-image.png';
      return;
    }

    const file = <File>files[0];

    // Validar tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB');
      this.file = undefined;
      this.imgSelect = 'assets/img/no-image.png';
      event.target.value = '';
      return;
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('Formato inválido. Usa PNG, JPG, JPEG o WEBP');
      this.file = undefined;
      this.imgSelect = 'assets/img/no-image.png';
      event.target.value = '';
      return;
    }

    // Archivo válido
    this.file = file;

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imgSelect = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Registra el producto
   */
  registro(registroForm: NgForm): void {
    // Validar formulario
    if (registroForm.invalid) {
      Object.keys(registroForm.controls).forEach(key => {
        registroForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validar imagen
    if (!this.file) {
      this.mostrarError('Debes subir una imagen del producto');
      return;
    }

    // Validar stock y precio
    if (this.producto.stock < 0) {
      this.mostrarError('El stock no puede ser negativo');
      return;
    }

    if (this.producto.precio <= 0) {
      this.mostrarError('El precio debe ser mayor a 0');
      return;
    }

    this.load_btn = true;

    this._productoService
      .registro_producto_admin(this.producto, this.file, this.token)
      .subscribe(
        (response) => {
          iziToast.success({
            title: 'Éxito',
            message: 'Producto registrado correctamente',
            position: 'topRight',
          });
          this._router.navigate(['/panel/productos']);
        },
        (error) => {
          console.error('Error al registrar:', error);
          const errorMsg = error.error?.message || 'Error al registrar el producto';
          this.mostrarError(errorMsg);
          this.load_btn = false;
        }
      );
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