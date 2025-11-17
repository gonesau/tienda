import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  public url;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }

  /**
   * Lista las reviews de un producto (ADMIN)
   */
  listar_reviews_producto_admin(producto_id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token
    });

    return this._http.get(this.url + 'listar_reviews_producto/' + producto_id, {
      headers: headers
    });
  }

  /**
   * Crea una nueva review (CLIENTE)
   */
  crear_review(data: any, token: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token
    });

    return this._http.post(this.url + 'crear_review', data, {
      headers: headers
    });
  }

  /**
   * Verifica si el cliente puede reseñar un producto
   */
  verificar_puede_resenar(producto_id: string, venta_id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token
    });

    return this._http.get(this.url + 'verificar_puede_resenar/' + producto_id + '/' + venta_id, {
      headers: headers
    });
  }

  /**
   * Obtiene las reviews de un cliente
   */
  obtener_reviews_cliente(cliente_id: string, token: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token
    });

    return this._http.get(this.url + 'obtener_reviews_cliente/' + cliente_id, {
      headers: headers
    });
  }
}