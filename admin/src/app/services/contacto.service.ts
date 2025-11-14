import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ContactoService {

    public url;

    constructor(private _http: HttpClient) {
        this.url = Global.url;
    }

    /**
     * Lista todos los mensajes de contacto con filtros opcionales
     */
    listar_mensajes_admin(filtro: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.get(this.url + 'listar_mensajes_contacto_admin', {
            headers: headers,
            params: {
                filtro: filtro || '',
                page: '1',
                limit: '50'
            }
        });
    }

    /**
     * Obtiene un mensaje específico por ID
     */
    obtener_mensaje_admin(id: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.get(this.url + 'obtener_mensaje_contacto_admin/' + id, {
            headers: headers
        });
    }

    /**
     * Actualiza el estado de un mensaje
     */
    actualizar_estado_mensaje_admin(id: string, data: any, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.put(this.url + 'actualizar_estado_mensaje_admin/' + id, data, {
            headers: headers
        });
    }

    /**
     * Elimina un mensaje de contacto
     */
    eliminar_mensaje_admin(id: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.delete(this.url + 'eliminar_mensaje_contacto_admin/' + id, {
            headers: headers
        });
    }
}