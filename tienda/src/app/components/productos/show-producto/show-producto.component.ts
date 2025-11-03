import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  public socket = io('http://localhost:4201');

  public btn_cart = false;

  constructor(
    private _route: ActivatedRoute,
    private _guestService: GuestService,
    private _clientService: ClienteService,
  ) {
    this.token = localStorage.getItem('token');
    this.url = Global.url;
    this._route.params.subscribe(params => {
      this.slug = params.slug;

      this._guestService.obtener_producto_slug_publico(this.slug).subscribe(
        response => {
          this.producto = response.data;

          // cargar productos recomendados
          this._guestService.listar_productos_recomendados_publico(this.producto.categoria).subscribe(
            response => {
              this.productos_recomendados = response.data;
            },
            error => {
              console.log(error);
            }
          );
        },
        error => {
          console.log(error);
        }
      );
    });
  }

  ngOnInit(): void {

    setTimeout(() => {
      tns({
        container: '.cs-carousel-inner',
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        navPosition: "top",
        controlsPosition: "top",
        mouseDrag: !0,
        speed: 600,
        autoplayHoverPause: !0,
        autoplayButtonOutput: !1,
        navContainer: "#cs-thumbnails",
        navAsThumbnails: true,
        gutter: 15,
      });

      var e = document.querySelectorAll(".cs-gallery");
      if (e.length) {
        for (var t = 0; t < e.length; t++) {
          lightGallery(e[t], { selector: ".cs-gallery-item", download: !1, videojs: !0, youtubePlayerParams: { modestbranding: 1, showinfo: 0, rel: 0 }, vimeoPlayerParams: { byline: 0, portrait: 0 } });
        }
      }

      tns({
        container: '.cs-carousel-inner-two',
        controlsText: ['<i class="cxi-arrow-left"></i>', '<i class="cxi-arrow-right"></i>'],
        navPosition: "top",
        controlsPosition: "top",
        mouseDrag: !0,
        speed: 600,
        autoplayHoverPause: !0,
        autoplayButtonOutput: !1,
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
    }, 500);
  }


  agregar_producto() {
    if (this.carrito_data.variedad) {
      if (this.carrito_data.cantidad <= this.producto.stock) {
        let data = {
          producto: this.producto._id,
          cliente: localStorage.getItem('_id'),
          cantidad: this.carrito_data.cantidad,
          variedad: this.carrito_data.variedad,
        }
        this.btn_cart = true;
        this._clientService.agregar_carrito_cliente(data, this.token).subscribe(
          response => {
            if (response.data == undefined) {
              iziToast.error({
                title: 'Error',
                titleColor: '#FF0000',
                color: '#FFF',
                class: 'text-danger',
                position: 'topRight',
                message: 'El producto ya se encuentra en el carrito de compras.'
              });
              this.btn_cart = false;
            } else {
              iziToast.success({
                title: 'Éxito',
                titleColor: '#1DC74C',
                color: '#FFF',
                class: 'text-success',
                position: 'topRight',
                message: 'Se agregó el producto al carrito de compras.'
              });
              this.socket.emit('add-carrito-add', { data: response.data });
              this.btn_cart = false;
            }
          },
          error => {
            console.log(error);
          }
        );
      }
      else {
        iziToast.error({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: 'La maxima cantidad disponible en stock es ' + this.producto.stock
        });
      }
    } else {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Por favor seleccione una variedad'
      });
    }
  }


}
