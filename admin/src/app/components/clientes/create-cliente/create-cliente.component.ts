import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast: any;

@Component({
  selector: 'app-create-cliente',
  templateUrl: './create-cliente.component.html',
  styleUrls: ['./create-cliente.component.css']
})
export class CreateClienteComponent implements OnInit {

  public cliente: any = {
    genero: ''
  };


  public token;
  public load_btn = false;

  constructor(
    private _clienteService: ClienteService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
  }

  registro(registroForm) {
    if (registroForm.valid) {
      console.log(this.cliente);
      this.load_btn = true;
      this._clienteService.registro_cliente_admin(this.cliente, this.token).subscribe(
        response=>{
          iziToast.show({
            title: 'Éxito',
            message: 'Cliente registrado correctamente',
            position: 'topRight',
            class: 'text-success',
            titleColor: '#1DC74C',
          });
          this.cliente = {
            nombre: '',
            apellidos: '',
            email: '',
            password: '',
            telefono: '',
            direccion: '',
            genero: ''
          };
          this.load_btn = false;

          this._router.navigate(['/panel/clientes']);
        },
        error=>{
          iziToast.show({
            title: 'Error',
            message: 'Error al registrar el cliente',
            position: 'topRight',
            class: 'text-danger'
          });
        }
      )
      
    } else {
        iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son válidos',
      });
    }
  }

}
