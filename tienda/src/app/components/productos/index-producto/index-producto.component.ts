// tienda/src/app/components/productos/index-producto/index-producto.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
declare var noUiSlider: any;
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
export class IndexProductoComponent implements OnInit, AfterViewInit, OnDestroy {
  public config_global: any = {};
  public filter_categoria = '';
  public productos: Array<any> = [];
  public productos_constante: Array<any> = [];
  public filter_producto = '';
  public url: string;
  public load_data = true;
  public filter_cat_producto = 'todos';
  public route_categoria: string | null = null;
  public page = 1;
  public pageSize = 15;
  public sort_by = 'Defecto';
  public slider: any;
  public precio_min = 0;
  public precio_max = 5000;
  public token: string | null;
  public btn_cart = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private _clienteService: ClienteService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {
    this.url = Global.url;
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    // Configurar búsqueda con debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.aplicarFiltros();
      });

    // Cargar configuración
    this.cargarConfiguracion();

    // Suscribirse a cambios de ruta
    this._route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.route_categoria = params['categoria'] || null;
        this.cargarProductos();
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarSlider();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga configuración del sitio
   */
  private cargarConfiguracion(): void {
    this._clienteService.obtener_config_publico()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.config_global = response.data || {};
        },
        error: (error) => {
          console.error('Error cargando configuración:', error);
          this.config_global = {};
        }
      });
  }

  /**
   * Inicializa slider de precios
   */
  inicializarSlider(): void {
    const sliderElement: any = document.getElementById('slider');

    if (!sliderElement) return;

    // Destruir slider existente si existe
    if (sliderElement.noUiSlider) {
      sliderElement.noUiSlider.destroy();
    }

    this.slider = noUiSlider.create(sliderElement, {
      start: [this.precio_min, this.precio_max],
      connect: true,
      range: {
        'min': 0,
        'max': 5000
      },
      tooltips: [true, true],
      pips: {
        mode: 'count',
        values: 5,
      }
    });

    this.slider.on('update', (values: any) => {
      this.precio_min = Math.round(parseFloat(values[0]));
      this.precio_max = Math.round(parseFloat(values[1]));
      $('.cs-range-slider-value-min').val(this.precio_min);
      $('.cs-range-slider-value-max').val(this.precio_max);
    });

    $('.noUi-tooltip').css('font-size', '11px');
  }

  /**
   * Carga productos desde el servidor
   */
  cargarProductos(): void {
    this.load_data = true;

    this._clienteService.obtener_productos_publico('')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productos_constante = response.data || [];
          this.aplicarFiltros();
          this.load_data = false;
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
          this.productos_constante = [];
          this.productos = [];
          this.load_data = false;
        }
      });
  }

  /**
   * Aplica todos los filtros activos
   */
  aplicarFiltros(): void {
    let resultado = [...this.productos_constante];

    // Filtro de búsqueda por texto
    if (this.filter_producto && this.filter_producto.trim() !== '') {
      const search = new RegExp(this.filter_producto, 'i');
      resultado = resultado.filter(item =>
        search.test(item.titulo) ||
        search.test(item.categoria) ||
        search.test(item.descripcion)
      );
    }

    // Filtro por categoría de ruta
    if (this.route_categoria) {
      resultado = resultado.filter(item =>
        item.categoria.toLowerCase() === this.route_categoria.toLowerCase()
      );
    }

    // Filtro por categoría seleccionada
    if (this.filter_cat_producto !== 'todos') {
      resultado = resultado.filter(item =>
        item.categoria === this.filter_cat_producto
      );
    }

    // Filtro por rango de precios
    resultado = resultado.filter(item =>
      item.precio >= this.precio_min && item.precio <= this.precio_max
    );

    // Aplicar ordenamiento
    this.productos = this.aplicarOrdenamiento(resultado);
    
    // Resetear paginación
    this.page = 1;
  }

  /**
   * Aplica ordenamiento a los productos
   */
  aplicarOrdenamiento(productos: Array<any>): Array<any> {
    let resultado = [...productos];

    switch (this.sort_by) {
      case 'menoramayor':
        resultado.sort((a, b) => a.precio - b.precio);
        break;
      case 'mayoramenor':
        resultado.sort((a, b) => b.precio - a.precio);
        break;
      case 'calificacionpromedio':
        resultado.sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0));
        break;
      case 'ordenarA_Z':
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'ordenarZ_A':
        resultado.sort((a, b) => b.titulo.localeCompare(a.titulo));
        break;
      default:
        break;
    }

    return resultado;
  }

  /**
   * Busca categorías con debounce
   */
  buscar_categorias(): void {
    // Implementar si es necesario
  }

  /**
   * Busca productos (con debounce)
   */
  buscar_productos(): void {
    this.searchSubject$.next(this.filter_producto);
  }

  /**
   * Busca productos por precio
   */
  buscar_precios(): void {
    this.aplicarFiltros();
  }

  /**
   * Filtra por categoría seleccionada
   */
  buscar_por_categoria(): void {
    this.route_categoria = null;
    this.aplicarFiltros();
  }

  /**
   * Filtra por categoría clickeada
   */
  filtrar_por_categoria(categoria: string): void {
    this.filter_cat_producto = categoria;
    this.route_categoria = null;
    this.aplicarFiltros();
  }

  /**
   * Resetea todos los filtros
   */
  reset_productos(): void {
    this.filter_producto = '';
    this.filter_cat_producto = 'todos';
    this.route_categoria = null;
    this.sort_by = 'Defecto';
    this.precio_min = 0;
    this.precio_max = 5000;

    if (this.slider) {
      this.slider.set([0, 5000]);
    }

    this.aplicarFiltros();
  }

  /**
   * Cambia el ordenamiento
   */
  orden_por(): void {
    this.aplicarFiltros();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private verificarAutenticacion(): boolean {
    if (!this._clienteService.isAuthenticated()) {
      this.mostrarAdvertencia('Debes iniciar sesión para agregar productos a tu carrito');
      
      setTimeout(() => {
        this._router.navigate(['/login']);
      }, 1500);
      
      return false;
    }
    
    return true;
  }

  /**
   * Agrega producto al carrito
   */
  agregar_producto(producto: any): void {
    if (!this.verificarAutenticacion()) {
      return;
    }

    // Validar stock
    if (producto.stock <= 0) {
      this.mostrarError('Este producto no está disponible en este momento');
      return;
    }

    // Determinar variedad
    let variedad = 'Estándar';
    if (producto.variedades && producto.variedades.length > 0) {
      variedad = producto.variedades[0].titulo;
    }

    const data = {
      producto: producto._id,
      cliente: localStorage.getItem('_id'),
      cantidad: 1,
      variedad: variedad
    };

    this.btn_cart = true;
    
    this._clienteService.agregar_carrito_cliente(data, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.btn_cart = false;
          
          if (response.data == undefined) {
            this.mostrarInfo('Este producto ya se encuentra en tu carrito de compras');
          } else {
            this.mostrarExito('Producto agregado a tu carrito correctamente');
          }
        },
        error: (error) => {
          this.btn_cart = false;
          
          if (error.status === 401 || error.status === 403) {
            this.mostrarError('Tu sesión ha expirado. Por favor inicia sesión nuevamente');
            setTimeout(() => {
              localStorage.clear();
              this._router.navigate(['/login']);
            }, 2000);
          } else {
            this.mostrarError(error.message || 'No pudimos agregar el producto a tu carrito');
          }
        }
      });
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: '¡Agregado!',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Ups...',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje,
      timeout: 4000
    });
  }

  /**
   * Muestra mensaje informativo
   */
  private mostrarInfo(mensaje: string): void {
    iziToast.info({
      title: 'Ya está en tu carrito',
      titleColor: '#17a2b8',
      color: '#FFF',
      class: 'text-info',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }

  /**
   * Muestra mensaje de advertencia
   */
  private mostrarAdvertencia(mensaje: string): void {
    iziToast.warning({
      title: 'Inicia sesión',
      titleColor: '#FFA500',
      color: '#FFF',
      class: 'text-warning',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }
}