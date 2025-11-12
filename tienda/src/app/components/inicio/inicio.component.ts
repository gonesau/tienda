import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import { GuestService } from 'src/app/services/guest.service';
import { Global } from 'src/app/services/global';
declare var tns: any;

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

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

  constructor(
    private _clienteService: ClienteService,
    private _guestService: GuestService
  ) {
    this.url = Global.url;
  }

  ngOnInit(): void {
    // Cargar datos
    this.obtener_descuento_activo();
    this.obtener_nuevos_productos();
    this.obtener_productos_tendencia();
    this.obtener_categorias();
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
        
        // Inicializar carrusel después de cargar descuento
        setTimeout(() => {
          this.inicializar_carruseles();
        }, 100);
      },
      error => {
        console.error('Error obteniendo descuento:', error);
        this.descuento_activo = null;
        this.load_descuento = false;
        
        setTimeout(() => {
          this.inicializar_carruseles();
        }, 100);
      }
    );
  }

  /**
   * Obtiene los últimos 10 productos agregados
   */
  obtener_nuevos_productos() {
    this._clienteService.obtener_productos_publico('').subscribe(
      response => {
        // Tomar los últimos 10 productos
        this.nuevos_productos = response.data.slice(0, 10);
        this.load_nuevos = false;
        
        setTimeout(() => {
          this.inicializar_carrusel_nuevos();
        }, 100);
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
        // Ordenar por número de ventas y tomar los primeros 4
        this.productos_tendencia = response.data
          .sort((a: any, b: any) => b.nventas - a.nventas)
          .slice(0, 4);
        
        this.load_tendencia = false;
        
        setTimeout(() => {
          this.inicializar_carrusel_tendencia();
        }, 100);
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
        
        setTimeout(() => {
          this.inicializar_carrusel_categorias();
        }, 100);
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
    const rating = Math.round((puntos / 100) * 5); // Convertir puntos a escala de 5
    
    for (let i = 0; i < 5; i++) {
      estrellas.push(i < rating);
    }
    
    return estrellas;
  }

  /**
   * Inicializa todos los carruseles
   */
  inicializar_carruseles() {
    try {
      // Carrusel principal de slides
      tns({
        container: '.cs-carousel-inner',
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        mode: 'gallery',
        navContainer: '#pager',
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        autoplayButtonOutput: false, // CRÍTICO: Oculta los botones stop/start
        responsive: {
          0: { controls: false },
          991: { controls: true }
        }
      });

      // Carrusel de categorías principales
      tns({
        container: '.cs-carousel-inner-two',
        controls: false,
        autoplayButtonOutput: false,
        responsive: {
          0: {
            gutter: 20
          },
          400: {
            items: 2,
            gutter: 20
          },
          520: {
            gutter: 30
          },
          768: {
            items: 3,
            gutter: 30
          }
        }
      });
    } catch (error) {
      console.error('Error inicializando carruseles:', error);
    }
  }

  /**
   * Inicializa carrusel de nuevos productos
   */
  inicializar_carrusel_nuevos() {
    if (this.nuevos_productos.length === 0) return;
    
    try {
      tns({
        container: '.cs-carousel-inner-three',
        controls: false,
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
    } catch (error) {
      console.error('Error inicializando carrusel nuevos:', error);
    }
  }

  /**
   * Inicializa carrusel de tendencias
   */
  inicializar_carrusel_tendencia() {
    if (this.productos_tendencia.length === 0) return;
    
    try {
      tns({
        container: '.cs-carousel-inner-four',
        nav: false,
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        controlsContainer: '#custom-controls-trending',
        autoplayButtonOutput: false,
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
    } catch (error) {
      console.error('Error inicializando carrusel tendencia:', error);
    }
  }

  /**
   * Inicializa carrusel de categorías populares
   */
  inicializar_carrusel_categorias() {
    if (this.categorias.length === 0) return;
    
    try {
      tns({
        container: '.cs-carousel-inner-five',
        controls: false,
        gutter: 30,
        autoplayButtonOutput: false,
        responsive: {
          0: { items: 1 },
          380: { items: 2 },
          550: { items: 3 },
          750: { items: 4 },
          1000: { items: 5 },
          1250: { items: 6 }
        }
      });
    } catch (error) {
      console.error('Error inicializando carrusel categorías:', error);
    }
  }
}