import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { GuestService } from 'src/app/services/guest.service';
import { Global } from 'src/app/services/global';
declare var tns: any;

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit, AfterViewInit {

  public descuento_activo: any = null;
  public nuevos_productos: Array<any> = [];
  public productos_tendencia: Array<any> = [];
  public categorias: Array<any> = [];
  public url: string;
  
  // Estados de carga
  public load_descuento = true;
  public load_nuevos = true;
  public load_tendencia = true;
  public load_categorias = true;

  private slider_principal: any = null;
  private carruseles_inicializados = false;

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService
  ) {
    this.url = Global.url;
  }

  ngOnInit(): void {
    // Cargar datos en secuencia controlada
    this.obtener_descuento_activo();
  }

  ngAfterViewInit(): void {
    // Los carruseles se inicializarán después de cargar todos los datos
  }

  /**
   * Obtiene el descuento activo actual
   */
  obtener_descuento_activo() {
    this._guestService.obtener_descuento_activo().subscribe(
      response => {
        if (response.data) {
          this.descuento_activo = response.data;
          console.log('Descuento activo:', this.descuento_activo);
        } else {
          this.descuento_activo = null;
        }
        this.load_descuento = false;
        
        // Cargar resto de datos después del descuento
        this.cargar_datos_restantes();
      },
      error => {
        console.error('Error obteniendo descuento:', error);
        this.descuento_activo = null;
        this.load_descuento = false;
        
        // Continuar cargando resto de datos
        this.cargar_datos_restantes();
      }
    );
  }

  /**
   * Carga el resto de datos en paralelo
   */
  cargar_datos_restantes() {
    this.obtener_nuevos_productos();
    this.obtener_productos_tendencia();
    this.obtener_categorias();
    
    // Inicializar carruseles después de un delay para asegurar renderizado
    setTimeout(() => {
      this.inicializar_todos_los_carruseles();
    }, 500);
  }

  /**
   * Obtiene los últimos 10 productos agregados
   */
  obtener_nuevos_productos() {
    this._clienteService.obtener_productos_publico('').subscribe(
      response => {
        this.nuevos_productos = response.data.slice(0, 10);
        this.load_nuevos = false;
      },
      error => {
        console.error('Error obteniendo nuevos productos:', error);
        this.load_nuevos = false;
      }
    );
  }

  /**
   * Obtiene los 4 productos más vendidos
   */
  obtener_productos_tendencia() {
    this._clienteService.obtener_productos_publico('').subscribe(
      response => {
        this.productos_tendencia = response.data
          .sort((a: any, b: any) => b.nventas - a.nventas)
          .slice(0, 4);
        
        this.load_tendencia = false;
      },
      error => {
        console.error('Error obteniendo productos tendencia:', error);
        this.load_tendencia = false;
      }
    );
  }

  /**
   * Obtiene las categorías del sistema
   */
  obtener_categorias() {
    this._clienteService.obtener_config_publico().subscribe(
      response => {
        if (response.data && response.data.categorias) {
          this.categorias = response.data.categorias;
        }
        this.load_categorias = false;
      },
      error => {
        console.error('Error obteniendo categorías:', error);
        this.load_categorias = false;
      }
    );
  }

  /**
   * Formatea las fechas del descuento
   */
  formatear_fecha_descuento(): string {
    if (!this.descuento_activo) return '';
    
    const inicio = new Date(this.descuento_activo.fecha_inicio);
    const fin = new Date(this.descuento_activo.fecha_fin);
    
    const opciones: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long' 
    };
    
    const fechaInicio = inicio.toLocaleDateString('es-ES', opciones);
    const fechaFin = fin.toLocaleDateString('es-ES', opciones);
    
    return `${fechaInicio} - ${fechaFin}`;
  }

  /**
   * Calcula el precio con descuento
   */
  calcular_precio_con_descuento(precio: number): number {
    if (!this.descuento_activo) return precio;
    
    const descuento = this.descuento_activo.descuento;
    const precio_descuento = precio - (precio * (descuento / 100));
    
    return parseFloat(precio_descuento.toFixed(2));
  }

  /**
   * Genera estrellas para rating
   */
  generar_estrellas(puntos: number): Array<boolean> {
    const estrellas = [];
    const rating = Math.round((puntos / 100) * 5);
    
    for (let i = 0; i < 5; i++) {
      estrellas.push(i < rating);
    }
    
    return estrellas;
  }

  /**
   * Inicializa todos los carruseles en el orden correcto
   */
  inicializar_todos_los_carruseles() {
    if (this.carruseles_inicializados) return;
    
    console.log('Inicializando todos los carruseles...');
    
    // Esperar a que el DOM esté completamente renderizado
    setTimeout(() => {
      this.inicializar_carrusel_principal();
      this.inicializar_carrusel_categorias_principales();
      
      setTimeout(() => {
        if (this.nuevos_productos.length > 0) {
          this.inicializar_carrusel_nuevos();
        }
        
        if (this.productos_tendencia.length > 0) {
          this.inicializar_carrusel_tendencia();
        }
        
        if (this.categorias.length > 0) {
          this.inicializar_carrusel_categorias();
        }
        
        this.carruseles_inicializados = true;
        console.log('✓ Todos los carruseles inicializados');
      }, 200);
    }, 100);
  }

  /**
   * Inicializa el carrusel principal
   */
  inicializar_carrusel_principal() {
    // Limpiar slider anterior si existe
    if (this.slider_principal) {
      try {
        this.slider_principal.destroy();
        this.slider_principal = null;
      } catch (e) {
        console.log('Limpiando slider anterior');
      }
    }

    try {
      const container = document.querySelector('.cs-carousel-inner');
      
      if (!container) {
        console.warn('Contenedor del carrusel no encontrado');
        return;
      }

      // Contar slides visibles (no ocultos con display: none)
      const slides = Array.from(container.children).filter((child: any) => {
        return window.getComputedStyle(child).display !== 'none';
      });

      console.log('Slides visibles:', slides.length);

      if (slides.length === 0) {
        console.warn('No hay slides visibles para inicializar');
        return;
      }

      this.slider_principal = tns({
        container: '.cs-carousel-inner',
        items: 1,
        slideBy: 1,
        mode: 'gallery',
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        autoplayButtonOutput: false,
        speed: 600,
        nav: true,
        navPosition: 'bottom',
        navContainer: '#pager',
        controls: true,
        controlsPosition: 'bottom',
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        loop: slides.length > 1,
        rewind: false,
        responsive: {
          0: { 
            controls: false,
            nav: true
          },
          991: { 
            controls: true,
            nav: true
          }
        }
      });

      console.log('✓ Carrusel principal inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando carrusel principal:', error);
    }
  }

  /**
   * Inicializa carrusel de categorías principales
   */
  inicializar_carrusel_categorias_principales() {
    try {
      const container = document.querySelector('.cs-carousel-inner-two');
      if (!container) return;

      tns({
        container: '.cs-carousel-inner-two',
        controls: false,
        nav: false,
        autoplayButtonOutput: false,
        mouseDrag: true,
        responsive: {
          0: {
            items: 1,
            gutter: 20
          },
          400: {
            items: 2,
            gutter: 20
          },
          520: {
            items: 2,
            gutter: 30
          },
          768: {
            items: 3,
            gutter: 30
          }
        }
      });
      
      console.log('✓ Carrusel categorías principales inicializado');
    } catch (error) {
      console.error('Error inicializando carrusel categorías principales:', error);
    }
  }

  /**
   * Inicializa carrusel de nuevos productos
   */
  inicializar_carrusel_nuevos() {
    try {
      const container = document.querySelector('.cs-carousel-inner-three');
      if (!container) return;

      tns({
        container: '.cs-carousel-inner-three',
        controls: false,
        nav: false,
        mouseDrag: true,
        autoplayButtonOutput: false,
        responsive: {
          0: {
            items: 1,
            gutter: 20
          },
          420: {
            items: 2,
            gutter: 20
          },
          600: {
            items: 3,
            gutter: 20
          },
          700: {
            items: 3,
            gutter: 30
          },
          900: {
            items: 4,
            gutter: 30
          },
          1200: {
            items: 5,
            gutter: 30
          },
          1400: {
            items: 6,
            gutter: 30
          }
        }
      });
      
      console.log('✓ Carrusel nuevos productos inicializado');
    } catch (error) {
      console.error('Error inicializando carrusel nuevos:', error);
    }
  }

  /**
   * Inicializa carrusel de tendencias
   */
  inicializar_carrusel_tendencia() {
    try {
      const container = document.querySelector('.cs-carousel-inner-four');
      if (!container) return;

      tns({
        container: '.cs-carousel-inner-four',
        nav: false,
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        controlsContainer: '#custom-controls-trending',
        autoplayButtonOutput: false,
        mouseDrag: true,
        responsive: {
          0: {
            items: 1,
            gutter: 20
          },
          480: {
            items: 2,
            gutter: 24
          },
          700: {
            items: 3,
            gutter: 24
          },
          1100: {
            items: 4,
            gutter: 30
          }
        }
      });
      
      console.log('✓ Carrusel tendencia inicializado');
    } catch (error) {
      console.error('Error inicializando carrusel tendencia:', error);
    }
  }

  /**
   * Inicializa carrusel de categorías populares
   */
  inicializar_carrusel_categorias() {
    try {
      const container = document.querySelector('.cs-carousel-inner-five');
      if (!container) return;

      tns({
        container: '.cs-carousel-inner-five',
        controls: false,
        nav: false,
        gutter: 30,
        autoplayButtonOutput: false,
        mouseDrag: true,
        responsive: {
          0: { items: 1 },
          380: { items: 2 },
          550: { items: 3 },
          750: { items: 4 },
          1000: { items: 5 },
          1250: { items: 6 }
        }
      });
      
      console.log('✓ Carrusel categorías inicializado');
    } catch (error) {
      console.error('Error inicializando carrusel categorías:', error);
    }
  }
}