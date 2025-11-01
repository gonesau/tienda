import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { Global } from 'src/app/services/global';

declare var iziToast: any;

@Component({
  selector: 'app-variedad-producto',
  templateUrl: './variedad-producto.component.html',
  styleUrls: ['./variedad-producto.component.css']
})
export class VariedadProductoComponent implements OnInit {
  
  public producto: any = null;
  public id: string = '';
  public token: string;
  public nueva_variedad = '';
  public load_data = true;
  public load_btn = false;
  public url: string;

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
    this._route.params.subscribe((params) => {
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
        
        // Inicializar variedades si no existen
        if (!this.producto.variedades) {
          this.producto.variedades = [];
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
   * Agrega una nueva variedad
   */
  agregar_variedad(): void {
    if (!this.nueva_variedad || this.nueva_variedad.trim() === '') {
      this.mostrarError('Ingresa un valor para la variedad');
      return;
    }

    // Verificar duplicados
    const existe = this.producto.variedades.some(
      (v: any) => v.titulo.toLowerCase() === this.nueva_variedad.trim().toLowerCase()
    );

    if (existe) {
      this.mostrarError('Esta variedad ya existe');
      return;
    }

    // Agregar la nueva variedad
    this.producto.variedades.push({
      titulo: this.nueva_variedad.trim()
    });

    this.nueva_variedad = '';

    iziToast.success({
      title: 'Agregado',
      message: 'Variedad agregada. No olvides guardar los cambios.',
      position: 'topRight',
      timeout: 2000
    });
  }

  /**
   * Elimina una variedad
   */
  eliminar_variedad(index: number): void {
    if (index >= 0 && index < this.producto.variedades.length) {
      this.producto.variedades.splice(index, 1);
      
      iziToast.info({
        title: 'Eliminado',
        message: 'Variedad eliminada. No olvides guardar los cambios.',
        position: 'topRight',
        timeout: 2000
      });
    }
  }

  /**
   * Actualiza las variedades del producto
   */
  actualizar(): void {
    // Validar que tenga título de variedad
    if (!this.producto.titulo_variedad || this.producto.titulo_variedad.trim() === '') {
      this.mostrarError('Debes ingresar el nombre del grupo de variedades');
      return;
    }

    // Validar que tenga al menos una variedad
    if (!this.producto.variedades || this.producto.variedades.length === 0) {
      this.mostrarError('Debes agregar al menos una variedad');
      return;
    }

    this.load_btn = true;

    const data = {
      titulo_variedad: this.producto.titulo_variedad.trim(),
      variedades: this.producto.variedades
    };

    this._productoService.actualizar_producto_variedades_admin(data, this.id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Variedades actualizadas correctamente',
          position: 'topRight',
        });
        this.load_btn = false;
      },
      (error) => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Error al actualizar las variedades';
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