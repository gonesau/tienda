import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {

  public load_data = true;
  public direccion: any = {
    pais: '',
    departamento: '',
    municipio: '',
    principal: false
  };

  constructor() { }

  ngOnInit(): void {
  }

}
