import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class DescuentoService {

    public url;

    constructor(private _http: HttpClient) {
        this.url = Global.url;
    }

    /**
     * Registra un nuevo descuento
     */
    registro_descuento_admin(data: any, file: File, token: string): Observable<any> {
        let headers = new HttpHeaders({ Authorization: token });

        const fd = new FormData();
        fd.append('titulo', data.titulo);
        fd.append('descuento', data.descuento);
        fd.append('fecha_inicio', data.fecha_inicio);
        fd.append('fecha_fin', data.fecha_fin);
        fd.append('banner', file);

        return this._http.post(this.url + 'registro_descuento_admin', fd, {
            headers: headers
        });
    }

    /**
     * Lista todos los descuentos con filtro opcional
     */
    listar_descuentos_admin(filtro: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: token,
        });

        return this._http.get(this.url + 'listar_descuentos_admin/' + filtro, {
            headers: headers
        });
    }

    /**
     * Obtiene un descuento por ID
     */
    obtener_descuento_admin(id: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: token,
        });

        return this._http.get(this.url + 'obtener_descuento_admin/' + id, {
            headers: headers
        });
    }

    /**
     * Actualiza un descuento
     */
    actualizar_descuento_admin(id: string, data: any, token: string): Observable<any> {
        let headers = new HttpHeaders({ Authorization: token });

        const fd = new FormData();
        fd.append('titulo', data.titulo);
        fd.append('descuento', data.descuento);
        fd.append('fecha_inicio', data.fecha_inicio);
        fd.append('fecha_fin', data.fecha_fin);

        if (data.banner) {
            fd.append('banner', data.banner);
        }

        return this._http.put(this.url + 'actualizar_descuento_admin/' + id, fd, {
            headers: headers
        });
    }

    /**
     * Elimina un descuento
     */
    eliminar_descuento_admin(id: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: token,
        });

        return this._http.delete(this.url + 'eliminar_descuento_admin/' + id, {
            headers: headers
        });
    }
}