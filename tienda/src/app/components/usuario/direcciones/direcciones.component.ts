import { Component, OnInit } from '@angular/core';
import { GuestService } from 'src/app/services/guest.service';
declare var $: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {

  public token: string | null;
  public load_data = true;
  public direccion: any = {
    pais: '',
    departamento: '',
    municipio: '',
    principal: false
  };

  public departamentos: Array<any> = [];
  public todosMunicipios: Array<any> = [];
  public municipiosFiltrados: Array<string> = [];

  constructor(private _guestService: GuestService) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    // Cargamos departamentos y municipios al iniciar
    this._guestService.get_departamentos().subscribe(response => {
      this.departamentos = response;
    });

    this._guestService.get_municipios().subscribe(response => {
      this.todosMunicipios = response;
    });
  }

  select_pais(): void {
    if (this.direccion.pais === 'El Salvador') {
      $('#sl_departamento').prop('disabled', false);
    } else {
      $('#sl_departamento').prop('disabled', true);
      $('#sl_municipio').prop('disabled', true);
      this.direccion.departamento = '';
      this.direccion.municipio = '';
      this.municipiosFiltrados = [];
    }
  }

  select_departamento(): void {
    const idDepto = Number(this.direccion.departamento);
    const departamento = this.todosMunicipios.find(m => m.departamento_id === idDepto);

    if (departamento) {
      this.municipiosFiltrados = departamento.municipios;
      $('#sl_municipio').prop('disabled', false);
    } else {
      this.municipiosFiltrados = [];
      $('#sl_municipio').prop('disabled', true);
    }

    // Limpiar el municipio seleccionado anterior
    this.direccion.municipio = '';
  }

}
