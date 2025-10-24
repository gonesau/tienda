import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
    public url;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }

    obtener_producto_slug_publico(slug): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'obtener_producto_slug_publico/' + slug, {headers: headers});
  }

}
