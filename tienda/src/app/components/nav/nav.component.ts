import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  public token;
  public id;
  public usuario : any = undefined;
  public user_lc : any = {};

  constructor(
    private _clienteService: ClienteService,
    private _router: Router,

  ) {
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');
    if (localStorage.getItem('usuario')) {
      this.user_lc = JSON.parse(localStorage.getItem('usuario'));
    } else {
      this.user_lc = undefined;
    }

    this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
      response => {
        this.usuario = response.data;
        localStorage.setItem('usuario', JSON.stringify(this.usuario));
      }, error => {
        this.usuario = undefined;
        console.log(error);
      }
    );
  }

  ngOnInit(): void {
  }

}
