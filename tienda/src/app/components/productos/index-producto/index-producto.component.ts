// Importa AfterViewInit
import { Component, OnInit, AfterViewInit } from '@angular/core';
declare var noUiSlider: any;
declare var $: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css']
})
// Implementa AfterViewInit en lugar de (o además de) OnInit
export class IndexProductoComponent implements OnInit, AfterViewInit {

  constructor() { }

  ngOnInit(): void {
    // Puedes dejar esto para lógica que no dependa del DOM
  }

  // Mueve tu lógica a este método
  ngAfterViewInit(): void {
    var slider : any = document.getElementById('slider');

    // Comprobamos si el slider existe antes de crearlo
    if (slider) {
      noUiSlider.create(slider, {
          start: [0, 1000],
          connect: true,
          range: {
              'min': 0,
              'max': 1000
          },
          tooltips: [true,true],
          pips: {
            mode: 'count', 
            values: 5,
            
          }
      })

      slider.noUiSlider.on('update', function (values) {
          $('.cs-range-slider-value-min').val(values[0]);
          $('.cs-range-slider-value-max').val(values[1]);
      });
      $('.noUi-tooltip').css('font-size','11px');
    }
  }

}