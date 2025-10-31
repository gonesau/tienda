import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { Global } from 'src/app/services/global';
import { ProductoService } from 'src/app/services/producto.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-update-producto',
  templateUrl: './update-producto.component.html',
  styleUrls: ['./update-producto.component.css'],
})
export class UpdateProductoComponent implements OnInit {
  
  public producto: any = null;
  public config: any = {};
  public imgSelect: any | ArrayBuffer;
  public load_btn = false;
  public load_data = true;
  public id: string = '';
  public token: string;
  public url: string;
  public file: File | undefined;
  public config_global: any = { categorias: [] };

  constructor(
    private _route: ActivatedRoute,
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

    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;

    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.cargar_config();
    
    this._route.params.subscribe((params) => {
      this.id = params['id'];
      if (this.id) {
        this.init_data();
      } else {
        this.load_data = false;
        this.mostrarError('ID de producto no válido');
        this._router.navigate(['/panel/productos']);
      }
    });
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
      }
    );
  }

  /**
   * Carga los datos del producto
   */
  init_data(): void {
    this.load_data = true;
    
    this._productoService.obtener_producto_admin(this.id, this.token).subscribe(
      (response) => {
        const datosProducto = response.data || response;
        
        if (datosProducto && datosProducto._id) {
          this.producto = datosProducto;
          this.imgSelect = this.url + 'obtener_portada/' + this.producto.portada;
          this.load_data = false;
        } else {
          this.producto = null;
          this.load_data = false;
          this.mostrarError('Producto no encontrado');
        }
      },
      (error) => {
        console.error('Error al obtener producto:', error);
        this.producto = null;
        this.load_data = false;
        this.mostrarError('Error al cargar los datos del producto');
      }
    );
  }

  /**
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const files = event.target.files;
    
    if (!files || !files[0]) {
      return;
    }

    const file = <File>files[0];

    // Validar tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB');
      this.file = undefined;
      event.target.value = '';
      return;
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('Formato inválido. Usa PNG, JPG, JPEG o WEBP');
      this.file = undefined;
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
   * Actualiza el producto
   */
  actualizar(actualizarForm: NgForm): void {
    // Validar formulario
    if (actualizarForm.invalid) {
      Object.keys(actualizarForm.controls).forEach(key => {
        actualizarForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
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

    // Preparar datos
    const data: any = {
      titulo: this.producto.titulo,
      stock: this.producto.stock,
      precio: this.producto.precio,
      categoria: this.producto.categoria,
      descripcion: this.producto.descripcion,
      contenido: this.producto.contenido
    };

    // Agregar portada solo si se cambió
    if (this.file) {
      data.portada = this.file;
    }

    this.load_btn = true;

    this._productoService.actualizar_producto_admin(data, this.id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Producto actualizado correctamente',
          position: 'topRight',
        });
        
        this.load_btn = false;
        
        setTimeout(() => {
          this._router.navigate(['/panel/productos']);
        }, 1000);
      },
      (error) => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Error al actualizar el producto';
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