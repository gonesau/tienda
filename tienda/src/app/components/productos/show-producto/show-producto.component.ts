// tienda/src/app/components/productos/show-producto/show-producto.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { GuestService } from 'src/app/services/guest.service';
import { Global } from 'src/app/services/global';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
declare var tns: any;
declare var lightGallery: any;
declare var iziToast: any;

@Component({
  selector: 'app-show-producto',
  templateUrl: './show-producto.component.html',
  styleUrls: ['./show-producto.component.css']
})
export class ShowProductoComponent implements OnInit, OnDestroy {
  public slug: string;
  public token: string | null;
  public producto: any = {};
  public url: string;
  public productos_recomendados: Array<any> = [];
  public carrito_data: any = {
    variedad: '',
    cantidad: 1,
  };
  public btn_cart = false;

  // Variables para descuentos
  public descuento_activo: any = null;
  public tiene_descuento = false;
  public load_descuento = true;
  public precio_original: number = 0;
  public precio_con_descuento: number = 0;
  public porcentaje_ahorro: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private _route: ActivatedRoute,
    private _guestService: GuestService,
    private _clientService: ClienteService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
    this.url = Global.url;
  }

  ngOnInit(): void {
    this._route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.slug = params.slug;
        this.cargarProducto();
        this.cargarDescuentoActivo();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el descuento activo
   */
  private cargarDescuentoActivo(): void {
    this.load_descuento = true;
    this._guestService.obtener_descuento_activo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.descuento_activo = response.data;
          this.tiene_descuento = !!this.descuento_activo;
          this.load_descuento = false;

          // Si hay descuento y producto cargado, calcular precios
          if (this.tiene_descuento && this.producto._id) {
            this.calcularPreciosConDescuento();
          }
        },
        error: (error) => {
          console.error('Error cargando descuento:', error);
          this.descuento_activo = null;
          this.tiene_descuento = false;
          this.load_descuento = false;
        }
      });
  }

  /**
   * Carga los datos del producto
   */
  private cargarProducto(): void {
    this._guestService.obtener_producto_slug_publico(this.slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.producto = response.data;
          this.precio_original = this.producto.precio;

          // Configurar variedad inicial
          if (this.producto.variedades && this.producto.variedades.length > 0) {
            this.carrito_data.variedad = this.producto.variedades[0].titulo;
          } else {
            this.carrito_data.variedad = 'Estándar';
          }

          // Calcular precios con descuento si existe
          if (this.tiene_descuento) {
            this.calcularPreciosConDescuento();
          }

          // Cargar productos recomendados
          this.cargarProductosRecomendados();

          // Inicializar carruseles
          setTimeout(() => {
            this.inicializarCarruseles();
          }, 500);
        },
        error: (error) => {
          console.error('Error cargando producto:', error);
          this.mostrarError('No se pudo cargar el producto');
          this._router.navigate(['/productos']);
        }
      });
  }

  /**
   * Calcula precios con descuento
   */
  private calcularPreciosConDescuento(): void {
    if (!this.tiene_descuento || !this.descuento_activo || !this.producto.precio) {
      return;
    }

    const descuento = this.descuento_activo.descuento || 0;
    this.precio_con_descuento = this.precio_original - (this.precio_original * (descuento / 100));
    this.precio_con_descuento = parseFloat(this.precio_con_descuento.toFixed(2));
    this.porcentaje_ahorro = descuento;
  }

  /**
   * Obtiene el precio final a mostrar
   */
  getPrecioFinal(): number {
    return this.tiene_descuento ? this.precio_con_descuento : this.precio_original;
  }

  /**
   * Carga productos recomendados
   */
  private cargarProductosRecomendados(): void {
    this._guestService.listar_productos_recomendados_publico(this.producto.categoria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productos_recomendados = response.data || [];

          // Aplicar descuento a productos recomendados si existe
          if (this.tiene_descuento && this.descuento_activo) {
            this.productos_recomendados = this.productos_recomendados.map(prod => {
              const prodConDescuento = { ...prod };
              prodConDescuento.precio_original = prod.precio;
              prodConDescuento.precio_con_descuento = this.calcularPrecioConDescuentoProducto(prod.precio);
              prodConDescuento.tiene_descuento = true;
              prodConDescuento.porcentaje_descuento = this.descuento_activo.descuento;
              return prodConDescuento;
            });
          }
        },
        error: (error) => {
          console.error('Error cargando productos recomendados:', error);
          this.productos_recomendados = [];
        }
      });
  }

  /**
   * Calcula precio con descuento para un producto específico
   */
  private calcularPrecioConDescuentoProducto(precio: number): number {
    if (!this.tiene_descuento || !this.descuento_activo) return precio;

    const descuento = this.descuento_activo.descuento || 0;
    const precioConDescuento = precio - (precio * (descuento / 100));
    return parseFloat(precioConDescuento.toFixed(2));
  }

  /**
   * Obtiene precio final de producto recomendado
   */
  getPrecioFinalRecomendado(producto: any): number {
    return producto.tiene_descuento ? producto.precio_con_descuento : producto.precio;
  }

  /**
   * Inicializa carruseles
   */
  private inicializarCarruseles(): void {
    try {
      // Carrusel principal de galería
      if (document.querySelector('.cs-carousel-inner')) {
        tns({
          container: '.cs-carousel-inner',
          controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
          navPosition: "top",
          controlsPosition: "top",
          mouseDrag: true,
          speed: 600,
          autoplayHoverPause: true,
          autoplayButtonOutput: false,
          navContainer: "#cs-thumbnails",
          navAsThumbnails: true,
          gutter: 15,
        });
      }

      // Light Gallery
      const galeria = document.querySelectorAll(".cs-gallery");
      if (galeria.length) {
        for (let i = 0; i < galeria.length; i++) {
          lightGallery(galeria[i], {
            selector: ".cs-gallery-item",
            download: false,
            videojs: true,
            youtubePlayerParams: { modestbranding: 1, showinfo: 0, rel: 0 },
            vimeoPlayerParams: { byline: 0, portrait: 0 }
          });
        }
      }

      // Carrusel de productos recomendados
      if (document.querySelector('.cs-carousel-inner-two')) {
        tns({
          container: '.cs-carousel-inner-two',
          controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
          navPosition: "top",
          controlsPosition: "top",
          mouseDrag: true,
          speed: 600,
          autoplayHoverPause: true,
          autoplayButtonOutput: false,
          nav: false,
          controlsContainer: "#custom-controls-related",
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
      }
    } catch (error) {
      console.error('Error inicializando carruseles:', error);
    }
  }

  /**
   * Verifica autenticación del usuario
   */
  private verificarAutenticacion(): boolean {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('_id');

    if (!token || !userId) {
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
  agregar_producto(): void {
    if (!this.verificarAutenticacion()) {
      return;
    }

    // Validar variedad
    if (this.producto.variedades && this.producto.variedades.length > 0) {
      if (!this.carrito_data.variedad) {
        this.mostrarError('Por favor selecciona una variedad');
        return;
      }
    } else {
      this.carrito_data.variedad = 'Estándar';
    }

    // Validar stock
    if (this.carrito_data.cantidad > this.producto.stock) {
      this.mostrarError(`Solo hay ${this.producto.stock} unidades disponibles`);
      return;
    }

    if (this.carrito_data.cantidad < 1) {
      this.mostrarError('La cantidad debe ser al menos 1');
      return;
    }

    const data = {
      producto: this.producto._id,
      cliente: localStorage.getItem('_id'),
      cantidad: this.carrito_data.cantidad,
      variedad: this.carrito_data.variedad,
    };

    this.btn_cart = true;

    this._clientService.agregar_carrito_cliente(data, this.token)
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
            const mensaje = error.error?.message || 'No pudimos agregar el producto a tu carrito';
            this.mostrarError(mensaje);
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