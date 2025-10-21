// Importa AfterViewInit
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';
declare var noUiSlider: any;
declare var $: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
// Implementa AfterViewInit en lugar de (o además de) OnInit
export class IndexProductoComponent implements OnInit, AfterViewInit {

  public config_global: any = {};
  public filter_categoria = '';
  public productos: Array<any> = [];
  public filter_producto = '';
  public url;
  public load_data = true;
  public filter_cat_producto = 'todos';
  public route_categoria;
  public page = 1;
  public pageSize = 20;
  public sort_by = 'default';

  constructor(
    private _clienteService: ClienteService,
    private _route: ActivatedRoute
  ) {
    this.url = Global.url;
    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => {
        console.log(error)
      }
    );


    this._route.params.subscribe(
      params => {
        this.route_categoria = params['categoria'];
        if (this.route_categoria) {
          this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
            response => {
              this.productos = response.data.filter(item => item.categoria.toLowerCase() == this.route_categoria.toLowerCase());
              this.load_data = false;
            }, error => {
              console.log(error)
            }
          );
        } else {
          this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
            response => {
              this.productos = response.data;
              this.load_data = false;
            }, error => {
              console.log(error)
            }
          );
        }
      }
    );

    this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
      response => {
        this.productos = response.data;
        this.load_data = false;
      }, error => {
        console.log(error)
      }
    );

  }

  ngOnInit(): void {
    // Puedes dejar esto para lógica que no dependa del DOM
  }

  buscar_categorias() {
    if (this.filter_categoria) {
      var search = new RegExp(this.filter_categoria, 'i');
      this.config_global.categorias = this.config_global.categorias.filter((item: { titulo: string; }) => search.test(item.titulo));
    } else {
      this._clienteService.obtener_config_publico().subscribe(
        response => {
          this.config_global = response.data;
        }, error => {
          console.log(error)
        }
      );
    }
  }

  buscar_productos() {
    this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
      response => {
        this.productos = response.data;
        this.load_data = false;
      }, error => {
        console.log(error)
      }
    );
  }

  buscar_precios() {
    this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
      response => {
        this.productos = response.data.filter((item: { precio: number; }) =>
          item.precio >= parseInt($('.cs-range-slider-value-min').val()) &&
          item.precio <= parseInt($('.cs-range-slider-value-max').val())
        );
        this.load_data = false;
      }, error => {
        console.log(error)
      }
    );
    return;
  }

  buscar_por_categoria() {
    if (this.filter_cat_producto == 'todos') {
      this.buscar_productos();
    } else {
      this._clienteService.obtener_productos_publico(this.filter_producto).subscribe(
        response => {
          this.productos = response.data.filter((item: { categoria: string; }) =>
            item.categoria == this.filter_cat_producto
          );
          this.load_data = false;
        }, error => {
          console.log(error)
        }
      );
    }
    return;
  }

  reset_productos() {
    this.filter_producto = '';
    this.filter_cat_producto = 'todos';
    this._clienteService.obtener_productos_publico('').subscribe(
      response => {
        this.productos = response.data;
        this.load_data = false;
      }, error => {
        console.log(error)
      }
    );
  }

  orden_por(){
    if(this.sort_by == 'default'){
      this.buscar_productos();
    } else if(this.sort_by == 'menoramayor'){
      this.productos = this.productos.sort((a,b) => a.precio - b.precio);
    } else if(this.sort_by == 'mayoramenor'){
      this.productos = this.productos.sort((a,b) => b.precio - a.precio);
    } else if(this.sort_by == 'calificacionpromedio'){
      this.productos = this.productos.sort((a,b) => b.calificacion_promedio - a.calificacion_promedio);
    } else if(this.sort_by == 'ordenarA_Z'){
      this.productos = this.productos.sort((a,b) => a.titulo.localeCompare(b.titulo));
    } else if(this.sort_by == 'ordenarZ_A'){
      this.productos = this.productos.sort((a,b) => b.titulo.localeCompare(a.titulo));
    } 

  }

  // Mueve tu lógica a este método
  ngAfterViewInit(): void {
    var slider: any = document.getElementById('slider');

    // Comprobamos si el slider existe antes de crearlo
    if (slider) {
      noUiSlider.create(slider, {
        start: [0, 5000],
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
      })

      slider.noUiSlider.on('update', function (values) {
        $('.cs-range-slider-value-min').val(values[0]);
        $('.cs-range-slider-value-max').val(values[1]);
      });
      $('.noUi-tooltip').css('font-size', '11px');
    }
  }

}