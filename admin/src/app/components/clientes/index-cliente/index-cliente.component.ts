import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
import { AdminService } from 'src/app/services/admin.service';
declare var jQuery: any;
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-index-cliente',
  templateUrl: './index-cliente.component.html',
  styleUrls: ['./index-cliente.component.css'],
})
export class IndexClienteComponent implements OnInit {
  public clientes: Array<any> = [];
  public filtro_apellidos = '';
  public filtro_correo = '';
  public page = 1;
  public pageSize = 10;
  public token;
  public load_data = true;

  constructor(
    private _clienteService: ClienteService,
    private _adminService: AdminService
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
    this.getClientes(null, null);
  }

  getClientes(tipo: any, filtro: any) {
    this._clienteService
      .listar_clientes_filtro_admin(tipo, filtro, this.token)
      .subscribe(
        (response) => {
          this.clientes = response.data;
          this.load_data = false;
        },
        (error) => {
          console.log(error);
        }
      );
  }

  filtro(tipo: string) {
    this.load_data = true;
    if (tipo == 'apellidos' && this.filtro_apellidos) {
      this.getClientes(tipo, this.filtro_apellidos);
      this.load_data = false;
    } else if (tipo == 'correo' && this.filtro_correo) {
      this.getClientes(tipo, this.filtro_correo);
      this.load_data = false;
    } else {
      this.getClientes(null, null);
    }
  }

eliminar(id) {
  this._clienteService.eliminar_cliente_admin(id, this.token).subscribe(
    (response) => {
      if (response.data) {
        iziToast.show({
          title: 'Éxito',
          message: 'Cliente eliminado correctamente',
          position: 'topRight',
          class: 'text-success',
          titleColor: '#1DC74C',
        });
        $('#delete-' + id).modal('hide');
        $('.modal-backdrop').removeClass('show');
        this.getClientes(null, null);
      } else {
        iziToast.error({
          title: 'Error',
          message: 'No se pudo eliminar el cliente',
          position: 'topRight',
        });
      }
    },
    (error) => {
      iziToast.error({
        title: 'Error',
        message: 'Ocurrió un problema con el servidor',
        position: 'topRight',
      });
console.log(error);

    }
  );
}

}
