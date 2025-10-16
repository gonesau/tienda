import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  public token;
  public id;
  public user_lc: any = undefined;
  public usuario: any = undefined;


  constructor(
    private _clienteService: ClienteService,
  ) { 
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');


        if (this.token) {
      
    this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
      response => {
        this.usuario = response.data;
        localStorage.setItem('usuario', JSON.stringify(this.usuario));


        if (localStorage.getItem('usuario')) {
          this.user_lc = JSON.parse(localStorage.getItem('usuario'));
        } else {
          this.user_lc = undefined;
        }

      }, error => {
        this.usuario = undefined;
        console.log(error);
      }
    );
    } else {
      this.usuario = undefined;
    this.user_lc = undefined;
    }

  }

  ngOnInit(): void {
  }

}
