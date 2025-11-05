import { Component, OnInit } from '@angular/core';
import { GuestService } from 'src/app/services/guest.service';
import { ClienteService } from 'src/app/services/cliente.service';
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {

  public token: string | null;
  public direccion: any = {
    pais: '',
    departamento: '',
    municipio: '',
    principal: false
  };

  public departamentos: Array<any> = [];
  public todosMunicipios: Array<any> = [];
  public municipiosFiltrados: Array<string> = [];
  public load_data = false;

  constructor(
    private _guestService: GuestService,
    private _clienteService: ClienteService
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    // Cargar departamentos
    this._guestService.get_departamentos().subscribe({
      next: (response) => {
        this.departamentos = response;
      },
      error: () => this.mostrarError('Error al cargar departamentos')
    });

    // Cargar municipios
    this._guestService.get_municipios().subscribe({
      next: (response) => {
        this.todosMunicipios = response;
      },
      error: () => this.mostrarError('Error al cargar municipios')
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

    const departamento = this.todosMunicipios.find(
      (m) => m.departamento_id === idDepto
    );

    if (departamento && departamento.municipios) {
      this.municipiosFiltrados = departamento.municipios;
      $('#sl_municipio').prop('disabled', false);
    } else {
      this.municipiosFiltrados = [];
      $('#sl_municipio').prop('disabled', true);
    }

    this.direccion.municipio = '';
  }

  guardar_direccion(registroForm: any): void {
    if (!registroForm.valid) {
      this.mostrarError('Complete correctamente el formulario.');
      return;
    }

    this.load_data = true;

    const clienteId = localStorage.getItem('_id');
    if (!clienteId || !this.token) {
      this.mostrarError('No se encontró sesión activa.');
      this.load_data = false;
      return;
    }

    const data = {
      cliente: clienteId,
      destinatario: this.direccion.destinatario,
      dui: this.direccion.dui,
      zip: this.direccion.zip,
      direccion: this.direccion.direccion,
      pais: this.direccion.pais,
      departamento: this.direccion.departamento,
      municipio: this.direccion.municipio,
      telefono: this.direccion.telefono,
      principal: this.direccion.principal
    };

    this._clienteService.registro_direccion_cliente(data, this.token).subscribe({
      next: (response) => {
        this.mostrarExito('Dirección registrada correctamente.');
        registroForm.resetForm({
          pais: '',
          departamento: '',
          municipio: '',
          principal: false
        });
        $('#sl_departamento').prop('disabled', true);
        $('#sl_municipio').prop('disabled', true);
        this.municipiosFiltrados = [];
        this.load_data = false;
      },
      error: (err) => {
        this.mostrarError(err?.message || 'Error al registrar dirección.');
        this.load_data = false;
      }
    });
  }

  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: 'ÉXITO',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje
    });
  }

  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'ERROR',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje
    });
  }
}
