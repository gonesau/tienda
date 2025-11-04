import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';
import { GuestService } from 'src/app/services/guest.service';
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
    this._route.params.subscribe(params => {
      this.slug = params.slug;

      this._guestService.obtener_producto_slug_publico(this.slug).subscribe(
        response => {
          this.producto = response.data;

          if (this.producto.variedades && this.producto.variedades.length > 0) {
            this.carrito_data.variedad = this.producto.variedades[0].titulo;
          } else {
            this.carrito_data.variedad = 'Estándar';
          }

          this._guestService.listar_productos_recomendados_publico(this.producto.categoria).subscribe(
            response => {
              this.productos_recomendados = response.data;
            },
            error => {
              console.log(error);
            }
          );

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

  inicializarCarruseles(): void {
    try {
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

  verificarAutenticacion(): boolean {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('_id');
    
    if (!token || !userId) {
      iziToast.warning({
        title: 'Inicia sesión',
        titleColor: '#FFA500',
        color: '#FFF',
        class: 'text-warning',
        position: 'topRight',
        message: 'Debes iniciar sesión para agregar productos a tu carrito',
        timeout: 3000
      });
      
      setTimeout(() => {
        this._router.navigate(['/login']);
      }, 1500);
      
      return false;
    }
    
    return true;
  }

  agregar_producto(): void {
    if (!this.verificarAutenticacion()) {
      return;
    }

    if (this.producto.variedades && this.producto.variedades.length > 0) {
      if (!this.carrito_data.variedad) {
        iziToast.error({
          title: 'Ups...',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'Por favor selecciona una variedad'
        });
        return;
      }
    } else {
      this.carrito_data.variedad = 'Estándar';
    }

    if (this.carrito_data.cantidad > this.producto.stock) {
      iziToast.error({
        title: 'Stock insuficiente',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: `Solo hay ${this.producto.stock} unidades disponibles`
      });
      return;
    }

    if (this.carrito_data.cantidad < 1) {
      iziToast.error({
        title: 'Cantidad inválida',
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
          iziToast.info({
            title: 'Ya está en tu carrito',
            titleColor: '#17a2b8',
            color: '#FFF',
            class: 'text-info',
            position: 'topRight',
            message: 'Este producto ya se encuentra en tu carrito de compras',
            timeout: 3000
          });
        } else {
          iziToast.success({
            title: '¡Agregado!',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Producto agregado a tu carrito correctamente',
            timeout: 3000
          });
          
          // El backend ya emite el evento socket, no es necesario emitir aquí
        }
      },
      error => {
        this.btn_cart = false;
        
        if (error.status === 401 || error.status === 403) {
          iziToast.error({
            title: 'Sesión expirada',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente'
          });
          
          setTimeout(() => {
            localStorage.clear();
            this._router.navigate(['/login']);
          }, 2000);
        } else {
          const mensaje = error.error?.message || 'No pudimos agregar el producto a tu carrito';
          iziToast.error({
            title: 'Ups...',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: mensaje
          });
        }
      }
    );
  }
}