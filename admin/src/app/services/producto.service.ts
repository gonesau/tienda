import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  public url;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }


  registro_producto_admin(data, file ,token): Observable<any> {
    let headers = new HttpHeaders({'Authorization': token});
    const fd = new FormData();
    fd.append('titulo', data.titulo);
    fd.append('stock', data.stock);
    fd.append('precio', data.precio);
    fd.append('descripcion', data.descripcion);
    fd.append('contenido', data.contenido);
    fd.append('categoria', data.categoria);
    fd.append('portada', file);
    return this._http.post(this.url + 'registro_producto_admin', fd, { headers: headers });
  }

  listar_productos_admin(filtro, token): Observable<any> {
    let headers = new HttpHeaders({'Content-Type': 'application/json', 'Authorization': token});
    return this._http.get(this.url + 'listar_productos_admin/'+filtro, { headers: headers });
  }

  obtener_producto_admin(id, token): Observable<any> {
    let headers = new HttpHeaders({'Content-Type': 'application/json', 'Authorization': token});
    return this._http.get(this.url + 'obtener_producto_admin/'+id, { headers: headers });
  }

}


