import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';

// Declaraciones globales para librerías externas (si aún son necesarias)
declare var noUiSlider: any;
declare var $: any;

// --- Interfaces (Basadas en el uso en tu código original) ---
// NOTA: No pude acceder a los archivos del modelo, así que estas interfaces
// se basan en cómo usas las propiedades en el componente. Podrían necesitar ajustes.
interface Categoria {
  _id?: string;
  titulo: string;
}

interface ConfigGlobal {
  categorias: Categoria[];
  // Podría tener más propiedades no usadas en este componente
}

interface Producto {
  _id?: string;
  titulo: string;
  portada: string;
  precio: number;
  categoria: string;
  calificacion_promedio?: number; // Usado en ordenación
  // Podría tener más propiedades no usadas en este componente
}
// --- Fin Interfaces ---

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
export class IndexProductoComponent implements OnInit, OnDestroy, AfterViewInit {

  public config_global: ConfigGlobal = { categorias: [] };
  private categoriasOriginales: Categoria[] = [];
  public filter_categoria = '';
  public productos: Producto[] = [];
  private todosLosProductos: Producto[] = [];
  public filter_producto = '';
  public url: string;
  public load_data = true; // Para carga inicial general (Config + Productos)
  public load_productos = true; // Específico para mostrar spinner de productos
  public filter_cat_producto = 'todos';
  public route_categoria: string | null = null;
  public page = 1;
  public pageSize = 15; // Ajustado a la opción por defecto del HTML
  public sort_by = 'Defecto'; // Ajustado a la opción por defecto del HTML
  public precioMin = 0;
  public precioMax = 5000; // Máximo inicial del slider

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private _clienteService: ClienteService,
    private _route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) {
    this.url = Global.url;
  }

  ngOnInit(): void {

    this.cargarTodosLosProductosIniciales();


    // 1. Obtener configuración (categorías)
    this._clienteService.obtener_config_publico()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.config_global = response.data;
            this.categoriasOriginales = [...response.data.categorias];
          } else {
             // Manejo si no vienen categorías
             this.config_global = { categorias: [] };
             this.categoriasOriginales = [];
          }
        },
        error: (error) => {
          console.error('Error al obtener configuración:', error);
          // Considera mostrar un mensaje al usuario
        }
      });

    // 2. Revisar ruta y cargar productos INICIALES
    this._route.params
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(params => {
        this.route_categoria = params['categoria'] || null;
        this.filter_cat_producto = this.route_categoria ? this.route_categoria : 'todos';
        // Llamar a la carga inicial de productos aquí
        this.cargarTodosLosProductosIniciales();
      });
  }

  ngAfterViewInit(): void {
    this.inicializarSliderPrecios();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  cargarTodosLosProductosIniciales(): void {
    // Asegurarse de que los spinners estén activos al inicio
    this.load_data = true;
    this.load_productos = true;
    this.cdr.detectChanges(); // Asegura que se muestren los spinners

    this._clienteService.obtener_productos_publico('') // Cargar TODOS una sola vez
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.load_data = false; // Desactiva spinner general al finalizar
          // load_productos se desactivará dentro de aplicarFiltrosYOrden
        })
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.todosLosProductos = response.data;
            // IMPORTANTE: Aplicar filtros DESPUÉS de recibir los datos
            this.aplicarFiltrosYOrden();
          } else {
            this.todosLosProductos = [];
            this.productos = [];
            this.load_productos = false; // Desactivar si no hay productos
            console.warn('No se recibieron productos.');
          }
          this.cdr.detectChanges(); // Asegura la actualización de la vista tras recibir datos
        },
        error: (error) => {
          console.error('Error al obtener productos:', error);
          this.todosLosProductos = [];
          this.productos = [];
          this.load_data = false; // Aún así desactivar spinners en caso de error
          this.load_productos = false;
          this.cdr.detectChanges(); // Actualizar vista para mostrar mensaje de error o "no productos"
          // Considera mostrar un mensaje de error al usuario
        }
      });
  }

  // --- Lógica Centralizada para Filtrar y Ordenar ---
  aplicarFiltrosYOrden(): void {
    // Si los datos originales aún no han cargado, no hacer nada.
    if (this.load_data || !this.todosLosProductos) {
       this.load_productos = false; // Asegura desactivar spinner si se llama prematuramente
       return;
    }

    this.load_productos = true; // Mostrar spinner durante el proceso
    this.cdr.detectChanges(); // Asegura que el spinner se vea

    // Realizar filtrado/ordenación síncrona (sin setTimeout para mayor responsividad)
    let productosFiltrados = [...this.todosLosProductos];

    // 1. Filtrar por nombre (texto)
    if (this.filter_producto) {
      const search = new RegExp(this.filter_producto, 'i');
      productosFiltrados = productosFiltrados.filter(item => search.test(item.titulo));
    }

    // 2. Filtrar por categoría seleccionada
    if (this.filter_cat_producto !== 'todos') {
      productosFiltrados = productosFiltrados.filter(item =>
        item.categoria?.toLowerCase() === this.filter_cat_producto.toLowerCase() // Añadir '?' por si acaso
      );
    }

    // 3. Filtrar por rango de precio
    // Asegurarse que precioMin y precioMax son números válidos
    const min = typeof this.precioMin === 'number' ? this.precioMin : 0;
    const max = typeof this.precioMax === 'number' ? this.precioMax : Infinity;
    productosFiltrados = productosFiltrados.filter(item =>
      item.precio >= min && item.precio <= max
    );

    // 4. Ordenar
    this.productos = this.ordenarProductos(productosFiltrados);

    this.page = 1; // Resetear paginación
    this.load_productos = false; // Ocultar spinner
    this.cdr.detectChanges(); // Notificar a Angular sobre los cambios finales
  }

  ordenarProductos(productosToSort: Producto[]): Producto[] {
      const sorted = [...productosToSort];
      switch (this.sort_by) {
        case 'menoramayor':
          sorted.sort((a, b) => a.precio - b.precio);
          break;
        case 'mayoramenor':
          sorted.sort((a, b) => b.precio - a.precio);
          break;
        case 'calificacionpromedio':
          sorted.sort((a, b) => (b.calificacion_promedio ?? 0) - (a.calificacion_promedio ?? 0));
          break;
        case 'ordenarA_Z':
          // Asegurarse de comparar strings
          sorted.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
          break;
        case 'ordenarZ_A':
          sorted.sort((a, b) => (b.titulo || '').localeCompare(a.titulo || ''));
          break;
        case 'Defecto':
        default:
          // No ordenar o mantener orden original (ya está en `sorted`)
          break;
      }
      return sorted;
  }

  // --- Métodos de Búsqueda/Filtro específicos ---

  buscar_categorias(): void {
    if (this.filter_categoria) {
      const search = new RegExp(this.filter_categoria, 'i');
      this.config_global.categorias = this.categoriasOriginales.filter(item => search.test(item.titulo));
    } else {
      this.config_global.categorias = [...this.categoriasOriginales];
    }
    // No necesita aplicarFiltrosYOrden aquí, solo actualiza la lista de categorías mostrada
  }

  // Handlers que llaman a la lógica centralizada
  buscar_productos_handler(): void {
    this.aplicarFiltrosYOrden();
  }

  buscar_precios_handler(): void {
     // Es posible que los valores de precioMin/Max tarden en actualizarse desde el slider.
     // Forzar detección de cambios antes de aplicar el filtro.
     this.cdr.detectChanges();
     this.aplicarFiltrosYOrden();
  }

   buscar_por_categoria_handler(): void {
      this.aplicarFiltrosYOrden();
   }

  // --- Otros Métodos ---

  reset_productos(): void {
    this.filter_producto = '';
    this.filter_cat_producto = 'todos'; // Restablecer categoría
    this.sort_by = 'Defecto';
    this.precioMin = 0;
    this.precioMax = 5000; // O el máximo que tengas definido
    this.actualizarSliderPrecios([this.precioMin, this.precioMax]); // Actualizar UI del slider

    // Volver a cargar TODOS los productos desde la copia original sin filtros
    // y aplicar la ordenación por defecto.
    this.aplicarFiltrosYOrden();
  }

  orden_por_handler(): void {
     this.aplicarFiltrosYOrden();
  }

  // --- Slider de Precios ---

  inicializarSliderPrecios(): void {
    const slider: any = document.getElementById('slider');
    if (slider && typeof noUiSlider !== 'undefined' && !slider.noUiSlider) { // Evitar reinicializar
      noUiSlider.create(slider, {
        start: [this.precioMin, this.precioMax],
        connect: true,
        range: {
          'min': 0,
          'max': 5000 // Asegúrate que este sea el máximo correcto
        },
        tooltips: [true, true],
        pips: {
          mode: 'count',
          values: 5,
        }
      });

      slider.noUiSlider.on('update', (values: string[], handle: number) => {
        const val = parseInt(values[handle], 10);
        // Actualizar propiedades del componente SIN disparar filtro aquí
        if (handle === 0) {
           this.precioMin = val;
        } else {
           this.precioMax = val;
        }
        // Forzar detección para actualizar inputs ligados con [(ngModel)]
        this.cdr.detectChanges();
      });

      // Estilo opcional para tooltips (puede requerir jQuery si la librería no lo soporta directamente)
      // $('.noUi-tooltip').css('font-size', '11px');
    } else if (!slider) {
      console.warn('Slider element (#slider) not found.');
    } else if (typeof noUiSlider === 'undefined'){
       console.warn('noUiSlider library not loaded.');
    }
  }

  actualizarSliderPrecios(values: [number, number]): void {
    const slider: any = document.getElementById('slider');
    if (slider && slider.noUiSlider) {
        slider.noUiSlider.set(values);
    }
  }
}