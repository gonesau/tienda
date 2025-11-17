// tienda/src/app/components/productos/index-producto/index-producto.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { GuestService } from 'src/app/services/guest.service';
import { ReviewService } from 'src/app/services/review.service';
import { Global } from 'src/app/services/global';
import { Subject, forkJoin } from 'rxjs';
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

  // Variables para descuentos
  public descuento_activo: any = null;
  public tiene_descuento = false;
  public load_descuento = true;

  // Variables para reviews
  public reviews_por_producto: { [key: string]: any } = {};
  public load_reviews = true;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  public Math = Math;

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService,
    private _reviewService: ReviewService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {
    this.url = Global.url;
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    console.log('=== INICIALIZANDO COMPONENTE INDEX-PRODUCTO ===');
    
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

    // Cargar descuento activo PRIMERO
    this.cargarDescuentoActivo();

    // Suscribirse a cambios de ruta
    this._route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.route_categoria = params['categoria'] || null;
        setTimeout(() => {
          this.cargarProductos();
        }, 500);
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
   * Carga el descuento activo
   */
  private cargarDescuentoActivo(): void {
    console.log('📊 Cargando descuento activo...');
    this.load_descuento = true;
    
    this._guestService.obtener_descuento_activo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.descuento_activo = response.data;
          this.tiene_descuento = !!this.descuento_activo;
          this.load_descuento = false;
          
          if (this.tiene_descuento) {
            console.log('🎉 DESCUENTO ACTIVO:', this.descuento_activo.descuento + '%');
          }
          
          if (this.tiene_descuento && this.productos.length > 0) {
            this.aplicarDescuentoAProductos();
          }
        },
        error: (error) => {
          console.error('❌ Error cargando descuento:', error);
          this.descuento_activo = null;
          this.tiene_descuento = false;
          this.load_descuento = false;
        }
      });
  }

  /**
   * Carga las reviews de todos los productos
   */
  private cargarReviewsProductos(): void {
    if (!this.productos || this.productos.length === 0) {
      this.load_reviews = false;
      return;
    }

    console.log('⭐ Cargando reviews para', this.productos.length, 'productos');
    this.load_reviews = true;

    // Crear array de observables para cargar reviews
    const reviewsObservables = this.productos.map(producto => 
      this._reviewService.listar_reviews_producto(producto._id)
    );

    forkJoin(reviewsObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: any[]) => {
          // Mapear reviews a cada producto
          responses.forEach((response, index) => {
            const producto = this.productos[index];
            if (response && response.estadisticas) {
              this.reviews_por_producto[producto._id] = {
                total: response.estadisticas.total || 0,
                promedio: response.estadisticas.promedio || 0,
                distribucion: response.estadisticas.distribucion || {}
              };
              
              // Actualizar producto con estadísticas
              producto.rating_promedio = response.estadisticas.promedio || 0;
              producto.total_reviews = response.estadisticas.total || 0;
            } else {
              this.reviews_por_producto[producto._id] = {
                total: 0,
                promedio: 0,
                distribucion: {}
              };
              producto.rating_promedio = 0;
              producto.total_reviews = 0;
            }
          });

          console.log('✅ Reviews cargadas:', this.reviews_por_producto);
          this.load_reviews = false;
        },
        error: (error) => {
          console.error('❌ Error cargando reviews:', error);
          this.load_reviews = false;
        }
      });
  }

  /**
   * Obtiene las estadísticas de reviews de un producto
   */
  getReviewsProducto(productoId: string): any {
    return this.reviews_por_producto[productoId] || {
      total: 0,
      promedio: 0,
      distribucion: {}
    };
  }

  /**
   * Genera array de números para estrellas llenas
   */
  getArrayEstrellasLlenas(productoId: string): number[] {
    const stats = this.getReviewsProducto(productoId);
    const cantidad = Math.round(stats.promedio);
    return Array(cantidad).fill(0);
  }

  /**
   * Genera array de números para estrellas vacías
   */
  getArrayEstrellasVacias(productoId: string): number[] {
    const stats = this.getReviewsProducto(productoId);
    const cantidad = 5 - Math.round(stats.promedio);
    return Array(cantidad).fill(0);
  }

  /**
   * Aplica el descuento activo a todos los productos
   */
  private aplicarDescuentoAProductos(): void {
    if (!this.tiene_descuento || !this.descuento_activo) {
      return;
    }

    const porcentaje = this.descuento_activo.descuento;

    this.productos = this.productos.map(producto => {
      const productoConDescuento = { ...producto };
      productoConDescuento.precio_original = producto.precio;
      productoConDescuento.precio_con_descuento = this.calcularPrecioConDescuento(producto.precio);
      productoConDescuento.tiene_descuento = true;
      productoConDescuento.porcentaje_descuento = porcentaje;
      return productoConDescuento;
    });

    this.productos_constante = this.productos_constante.map(producto => {
      const productoConDescuento = { ...producto };
      productoConDescuento.precio_original = producto.precio;
      productoConDescuento.precio_con_descuento = this.calcularPrecioConDescuento(producto.precio);
      productoConDescuento.tiene_descuento = true;
      productoConDescuento.porcentaje_descuento = porcentaje;
      return productoConDescuento;
    });
  }

  /**
   * Calcula el precio con descuento
   */
  private calcularPrecioConDescuento(precioOriginal: number): number {
    if (!this.tiene_descuento || !this.descuento_activo) return precioOriginal;
    
    const descuento = this.descuento_activo.descuento || 0;
    const precioConDescuento = precioOriginal - (precioOriginal * (descuento / 100));
    return parseFloat(precioConDescuento.toFixed(2));
  }

  /**
   * Obtiene el precio final a mostrar (con o sin descuento)
   */
  getPrecioFinal(producto: any): number {
    return producto.tiene_descuento ? producto.precio_con_descuento : producto.precio;
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
    console.log('📦 Cargando productos...');
    this.load_data = true;

    this._clienteService.obtener_productos_publico('')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Productos cargados:', response.data?.length || 0);
          this.productos_constante = response.data || [];
          
          if (this.tiene_descuento) {
            this.aplicarDescuentoAProductos();
          }
          
          this.aplicarFiltros();
          
          // Cargar reviews después de cargar productos
          this.cargarReviewsProductos();
          
          this.load_data = false;
        },
        error: (error) => {
          console.error('❌ Error cargando productos:', error);
          this.productos_constante = [];
          this.productos = [];
          this.load_data = false;
          this.load_reviews = false;
        }
      });
  }

  /**
   * Aplica todos los filtros activos
   */
  aplicarFiltros(): void {
    let resultado = [...this.productos_constante];

    if (this.filter_producto && this.filter_producto.trim() !== '') {
      const search = new RegExp(this.filter_producto, 'i');
      resultado = resultado.filter(item =>
        search.test(item.titulo) ||
        search.test(item.categoria) ||
        search.test(item.descripcion)
      );
    }

    if (this.route_categoria) {
      resultado = resultado.filter(item =>
        item.categoria.toLowerCase() === this.route_categoria.toLowerCase()
      );
    }

    if (this.filter_cat_producto !== 'todos') {
      resultado = resultado.filter(item =>
        item.categoria === this.filter_cat_producto
      );
    }

    resultado = resultado.filter(item => {
      const precioFinal = this.getPrecioFinal(item);
      return precioFinal >= this.precio_min && precioFinal <= this.precio_max;
    });

    this.productos = this.aplicarOrdenamiento(resultado);
    this.page = 1;
  }

  /**
   * Aplica ordenamiento a los productos
   */
  aplicarOrdenamiento(productos: Array<any>): Array<any> {
    let resultado = [...productos];

    switch (this.sort_by) {
      case 'menoramayor':
        resultado.sort((a, b) => this.getPrecioFinal(a) - this.getPrecioFinal(b));
        break;
      case 'mayoramenor':
        resultado.sort((a, b) => this.getPrecioFinal(b) - this.getPrecioFinal(a));
        break;
      case 'calificacionpromedio':
        resultado.sort((a, b) => (b.rating_promedio || 0) - (a.rating_promedio || 0));
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

  buscar_categorias(): void {}

  buscar_productos(): void {
    this.searchSubject$.next(this.filter_producto);
  }

  buscar_precios(): void {
    this.aplicarFiltros();
  }

  buscar_por_categoria(): void {
    this.route_categoria = null;
    this.aplicarFiltros();
  }

  filtrar_por_categoria(categoria: string): void {
    this.filter_cat_producto = categoria;
    this.route_categoria = null;
    this.aplicarFiltros();
  }

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

  orden_por(): void {
    this.aplicarFiltros();
  }

  private verificarAutenticacion(): boolean {
    if (!this._clienteService.isAuthenticated()) {
      this.mostrarAdvertencia('Debes iniciar sesión para agregar productos a tu carrito');
      setTimeout(() => { this._router.navigate(['/login']); }, 1500);
      return false;
    }
    return true;
  }

  agregar_producto(producto: any): void {
    if (!this.verificarAutenticacion()) {
      return;
    }

    if (producto.stock <= 0) {
      this.mostrarError('Este producto no está disponible en este momento');
      return;
    }

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