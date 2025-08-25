import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';

@Component({
  selector: 'app-index-cliente',
  templateUrl: './index-cliente.component.html',
  styleUrls: ['./index-cliente.component.css']
})
export class IndexClienteComponent implements OnInit {
  public clientes: Array<any> = [];
  public filtro_apellidos = '';
  public filtro_correo = '';
  public page = 1;
  public pageSize = 1;

  constructor(
    private _clienteService: ClienteService
  ) { }

  ngOnInit(): void {
    this.getClientes(null, null);
  }

  getClientes(tipo: any, filtro: any) {
    this._clienteService.listar_clientes_filtro_admin(tipo, filtro).subscribe(
      response => {
        this.clientes = response.data;
        console.log(this.clientes);
      },
      error => {
        console.log(error);
      }
    );
  }

  filtro(tipo: string) {
    if (tipo == 'apellidos' && this.filtro_apellidos) {
      this.getClientes(tipo, this.filtro_apellidos);
    } else if (tipo == 'correo' && this.filtro_correo) {
      this.getClientes(tipo, this.filtro_correo)
    } else {
      this.getClientes(null, null);
    }
  }


}
