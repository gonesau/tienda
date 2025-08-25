import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  public url;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }


  listar_clientes_filtro_admin(tipo: any, filtro: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'listar_clientes_filtro_admin', {
      headers: headers,
      params: { tipo, filtro }
    });
  }



}
