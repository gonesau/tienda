import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';
import { GuestService } from 'src/app/services/guest.service';
import { io } from "socket.io-client";
declare var tns;
declare var lightGallery;
declare var iziToast;

@Component({
  selector: 'app-show-producto',
  templateUrl: './show-producto.component.html',
  styleUrls: ['./show-producto.component.css']
})
export class ShowProductoComponent implements OnInit {
  public slug;
  public token;
  public producto: any = {};
  public url;
  public productos_recomendados: Array<any> = [];
  public carrito_data: any = {
    variedad: '',
    cantidad: 1,
  };
  public btn_cart = false;
  public socket = io('http://localhost:4201', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  constructor(
    private _route: ActivatedRoute,
    private _guestService: GuestService,
    private _clientService: ClienteService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
    this.url = Global.url;
    
    // Configurar eventos de socket
    this.setupSocketListeners();
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.slug = params.slug;

      this._guestService.obtener_producto_slug_publico(this.slug).subscribe(
        response => {
          this.producto = response.data;

          // Si el producto tiene variedades, seleccionar la primera por defecto
          if (this.producto.variedades && this.producto.variedades.length > 0) {
            this.carrito_data.variedad = this.producto.variedades[0].titulo;
          } else {
            // Si no tiene variedades, usar un valor por defecto
            this.carrito_data.variedad = 'Estándar';
          }

          // Cargar productos recomendados
          this._guestService.listar_productos_recomendados_publico(this.producto.categoria).subscribe(
            response => {
              this.productos_recomendados = response.data;
            },
            error => {
              console.log(error);
            }
          );

          // Inicializar carruseles después de cargar el producto
          setTimeout(() => {
            this.inicializarCarruseles();
          }, 500);
        },
        error => {
          console.log(error);
        }
      );
    });
  }

  /**
   * Configura los listeners de Socket.IO
   */
  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Error de conexión socket:', error);
    });
  }

  /**
   * Inicializa todos los carruseles de la página
   */
  inicializarCarruseles(): void {
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

      // Inicializar lightGallery
      var e = document.querySelectorAll(".cs-gallery");
      if (e.length) {
        for (var t = 0; t < e.length; t++) {
          lightGallery(e[t], { 
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
   * Verifica si el usuario está autenticado
   */
  verificarAutenticacion(): boolean {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('_id');
    
    if (!token || !userId) {
      iziToast.warning({
        title: 'Autenticación requerida',
        titleColor: '#FFA500',
        color: '#FFF',
        class: 'text-warning',
        position: 'topRight',
        message: 'Debes iniciar sesión para agregar productos al carrito',
        timeout: 3000
      });
      
      // Redirigir al login después de mostrar el mensaje
      setTimeout(() => {
        this._router.navigate(['/login']);
      }, 1500);
      
      return false;
    }
    
    return true;
  }

  /**
   * Agrega el producto al carrito
   * Maneja productos con y sin variedades
   */
  agregar_producto(): void {
    // Verificar autenticación primero
    if (!this.verificarAutenticacion()) {
      return;
    }

    // Validar variedad solo si el producto tiene variedades definidas
    if (this.producto.variedades && this.producto.variedades.length > 0) {
      if (!this.carrito_data.variedad) {
        iziToast.error({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Por favor seleccione una variedad'
        });
        return;
      }
    } else {
      // Si no tiene variedades, asignar valor por defecto
      this.carrito_data.variedad = 'Estándar';
    }

    // Validar stock
    if (this.carrito_data.cantidad > this.producto.stock) {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La cantidad máxima disponible en stock es ' + this.producto.stock
      });
      return;
    }

    // Validar cantidad mínima
    if (this.carrito_data.cantidad < 1) {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'La cantidad debe ser al menos 1'
      });
      return;
    }

    const data = {
      producto: this.producto._id,
      cliente: localStorage.getItem('_id'),
      cantidad: this.carrito_data.cantidad,
      variedad: this.carrito_data.variedad,
    };

    this.btn_cart = true;
    
    this._clientService.agregar_carrito_cliente(data, this.token).subscribe(
      response => {
        this.btn_cart = false;
        
        if (response.data == undefined) {
          iziToast.error({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'El producto ya se encuentra en el carrito de compras.'
          });
        } else {
          iziToast.success({
            title: 'Éxito',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Se agregó el producto al carrito de compras.'
          });
          
          // Emitir evento de socket para actualizar el carrito en tiempo real
          console.log('📤 Emitiendo evento add-carrito-add');
          this.socket.emit('add-carrito-add', { data: response.data });
        }
      },
      error => {
        this.btn_cart = false;
        console.error('Error agregando producto:', error);
        
        if (error.status === 401 || error.status === 403) {
          iziToast.error({
            title: 'Sesión expirada',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
          });
          
          setTimeout(() => {
            localStorage.clear();
            this._router.navigate(['/login']);
          }, 2000);
        } else {
          iziToast.error({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'No se pudo agregar el producto al carrito.'
          });
        }
      }
    );
  }
}