import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Global } from 'src/app/services/global';

import { io } from "socket.io-client";
declare var noUiSlider: any;
declare var $: any;
declare var iziToast;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
export class IndexProductoComponent implements OnInit, AfterViewInit {

  public config_global: any = {};
  public filter_categoria = '';
  public productos: Array<any> = [];
  public productos_constante: Array<any> = []; // Array que mantiene todos los productos sin filtrar
  public filter_producto = '';
  public url;
  public load_data = true;
  public filter_cat_producto = 'todos';
  public route_categoria;
  public page = 1;
  public pageSize = 15;
  public sort_by = 'Defecto';
  public slider: any;
  public precio_min = 0;
  public precio_max = 5000;
  public carrito_data: any = {
    variedad: '',
    cantidad: 1,
  };
  public producto: any = {};
  public token;

  public btn_cart = false;

  public socket = io('http://localhost:4201');


  constructor(
    private _clienteService: ClienteService,
    private _route: ActivatedRoute,

  ) {
    this.url = Global.url;
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    // Cargar configuración global
    this._clienteService.obtener_config_publico().subscribe(
      response => {
        this.config_global = response.data;
      },
      error => {
        console.log(error);
      }
    );

    // Suscribirse a cambios en la ruta
    this._route.params.subscribe(
      params => {
        this.route_categoria = params['categoria'];
        this.cargarProductos();
      }
    );
  }

  ngAfterViewInit(): void {
    this.inicializarSlider();
  }

  /**
   * Inicializa el slider de precios
   */
  inicializarSlider(): void {
    const sliderElement: any = document.getElementById('slider');

    if (sliderElement && !sliderElement.noUiSlider) {
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
  }

  /**
   * Carga productos desde el servidor
   */
  cargarProductos(): void {
    this.load_data = true;

    this._clienteService.obtener_productos_publico('').subscribe(
      response => {
        this.productos_constante = response.data;
        this.aplicarFiltros();
        this.load_data = false;
      },
      error => {
        console.log(error);
        this.load_data = false;
      }
    );
  }

  /**
   * Aplica todos los filtros activos
   */
  aplicarFiltros(): void {
    let resultado = [...this.productos_constante];

    // Filtro por búsqueda de texto
    if (this.filter_producto && this.filter_producto.trim() !== '') {
      const search = new RegExp(this.filter_producto, 'i');
      resultado = resultado.filter(item =>
        search.test(item.titulo) ||
        search.test(item.categoria) ||
        search.test(item.descripcion)
      );
    }

    // Filtro por categoría desde la ruta
    if (this.route_categoria) {
      resultado = resultado.filter(item =>
        item.categoria.toLowerCase() === this.route_categoria.toLowerCase()
      );
    }

    // Filtro por categoría desde el sidebar
    if (this.filter_cat_producto !== 'todos') {
      resultado = resultado.filter(item =>
        item.categoria === this.filter_cat_producto
      );
    }

    // Filtro por precio
    resultado = resultado.filter(item =>
      item.precio >= this.precio_min && item.precio <= this.precio_max
    );

    // Aplicar ordenamiento
    this.productos = this.aplicarOrdenamiento(resultado);

    // Resetear página
    this.page = 1;
  }

  /**
   * Aplica el ordenamiento seleccionado
   */
  aplicarOrdenamiento(productos: Array<any>): Array<any> {
    let resultado = [...productos];

    switch (this.sort_by) {
      case 'menoramayor':
        resultado.sort((a, b) => a.precio - b.precio);
        break;
      case 'mayoramenor':
        resultado.sort((a, b) => b.precio - a.precio);
        break;
      case 'calificacionpromedio':
        resultado.sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0));
        break;
      case 'ordenarA_Z':
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'ordenarZ_A':
        resultado.sort((a, b) => b.titulo.localeCompare(a.titulo));
        break;
      default:
        // Defecto - mantener orden original
        break;
    }

    return resultado;
  }

  /**
   * Busca categorías en el filtro del sidebar
   */
  buscar_categorias(): void {
    if (this.filter_categoria) {
      const search = new RegExp(this.filter_categoria, 'i');
      this.config_global.categorias = this.config_global.categorias.filter(
        (item: { titulo: string; }) => search.test(item.titulo)
      );
    } else {
      this._clienteService.obtener_config_publico().subscribe(
        response => {
          this.config_global = response.data;
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  /**
   * Ejecuta búsqueda de productos por texto
   */
  buscar_productos(): void {
    this.aplicarFiltros();
  }

  /**
   * Ejecuta filtro por rango de precios
   */
  buscar_precios(): void {
    this.aplicarFiltros();
  }

  /**
   * Ejecuta filtro por categoría
   */
  buscar_por_categoria(): void {
    this.route_categoria = null; // Limpiar filtro de ruta
    this.aplicarFiltros();
  }

  /**
   * Filtra productos por categoría específica (desde las tarjetas)
   */
  filtrar_por_categoria(categoria: string): void {
    this.filter_cat_producto = categoria;
    this.route_categoria = null;
    this.aplicarFiltros();
  }

  /**
   * Resetea todos los filtros
   */
  reset_productos(): void {
    this.filter_producto = '';
    this.filter_cat_producto = 'todos';
    this.route_categoria = null;
    this.sort_by = 'Defecto';
    this.precio_min = 0;
    this.precio_max = 5000;

    // Resetear slider
    if (this.slider) {
      this.slider.set([0, 5000]);
    }

    this.aplicarFiltros();
  }

  /**
   * Ejecuta ordenamiento
   */
  orden_por(): void {
    this.aplicarFiltros();
  }




  agregar_producto(producto) {
    let data = {
      producto: producto._id,
      cliente: localStorage.getItem('_id'),
      cantidad: 1,
      variedad: producto.variedades[0].titulo,
    }
    this.btn_cart = true;
    this._clienteService.agregar_carrito_cliente(data, this.token).subscribe(
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





}