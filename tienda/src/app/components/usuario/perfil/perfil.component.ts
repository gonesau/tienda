import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast: any;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  public cliente: any = {};
  public id;
  public token;


  constructor(
    private _clienteService: ClienteService
  ) { 
    this.id = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    if(this.id){
      this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
        response => {
          if(response.data == undefined){
            this.cliente = undefined; 
          }else{
            this.cliente = response.data; 
          }
        }, error => {
          console.log(error);
        }
      );
    }else{
      this.cliente = undefined; 
    }
  }

  ngOnInit(): void {
  }

  actualizar(actualizarForm) {
    if (actualizarForm.valid) {
      this._clienteService.actualizar_perfil_cliente_guest(this.id, this.cliente, this.token).subscribe(
        response => {
          iziToast.show({
            title: 'SUCCESS',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Se actualizó correctamente el perfil.'
          });
          localStorage.setItem('nombre_cliente', this.cliente.nombres);
        }, error => {
          console.log(error);
        }
      );
    } else {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'El formulario no es valido'
      });
    }
  }

}
