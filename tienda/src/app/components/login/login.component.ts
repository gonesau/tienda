import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public user : any = {};
  public usuario : any = {};
  public token;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) { 
    this.token = localStorage.getItem('token');
    if (this.token) {
      this._router.navigate(['/']);
    }
  }

  ngOnInit(): void {

  }

  login(loginForm) {
    if (loginForm.valid) {
      let data = {
        email: this.user.email,
        password: this.user.password
      }

      this._clienteService.login_cliente(data).subscribe(
        response => {
          if (response.data == undefined) {
            iziToast.show({
              title: 'Error',
              titleColor: '#FF0000',
              color: '#FFF',
              class: 'text-danger',
              position: 'topRight',
              message: 'Los datos son incorrectos'
            });
          } else {
            this.usuario = response.data;
            localStorage.setItem('token', response.token);
            localStorage.setItem('_id', response.data._id);

            this._clienteService.obtener_cliente_guest(response.data._id, response.token).subscribe(
              response => {
                localStorage.setItem('usuario', JSON.stringify(response.data));
              }, error => {
                console.log(error);
              }
            );

            this._router.navigate(['/']);
            iziToast.show({
              title: 'Success',
              titleColor: '#1DC74C',
              color: '#FFF',
              class: 'text-success',
              position: 'topRight',
              message: 'Bienvenido ' + response.data.nombres
            });
            this.user = {};
          }
        },
        error => {
          console.log(error);
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Ocurrio un error en el servidor'
          });
        }
      );   
    } else {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son validos'
      });
    }
  }

}
