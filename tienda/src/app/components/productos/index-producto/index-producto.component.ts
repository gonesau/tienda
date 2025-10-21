// Importa AfterViewInit
import { Component, OnInit, AfterViewInit } from '@angular/core';
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

  constructor(
    private _clienteService: ClienteService
  ) {
    this.url = Global.url;
    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      }, error => {
        console.log(error)
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

  buscar_precios(){
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