import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './global';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class VentaService {

    public url;

    constructor(private _http: HttpClient) {
        this.url = Global.url;
    }

    /**
     * Lista todas las ventas con filtros (ADMIN)
     */
    listar_ventas_admin(filtro: string, desde: string, hasta: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        let params: any = {};
        if (filtro) params.filtro = filtro;
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;

        return this._http.get(this.url + 'listar_ventas_admin', {
            headers: headers,
            params: params
        });
    }

    /**
     * Obtiene detalle de una venta (ADMIN)
     */
    obtener_venta_admin(id: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.get(this.url + 'obtener_venta_admin/' + id, {
            headers: headers
        });
    }

    /**
     * Actualiza el estado de una venta (ADMIN)
     */
    actualizar_estado_venta_admin(id: string, data: any, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.put(this.url + 'actualizar_estado_venta_admin/' + id, data, {
            headers: headers
        });
    }

    /**
     * Obtiene estadísticas de ventas (ADMIN)
     */
    obtener_estadisticas_ventas_admin(token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.get(this.url + 'obtener_estadisticas_ventas_admin', {
            headers: headers
        });
    }

    /**
     * Obtiene resumen de ventas por fecha (ADMIN)
     */
    obtener_resumen_ventas_admin(desde: string, hasta: string, token: string): Observable<any> {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token
        });

        return this._http.get(this.url + 'obtener_resumen_ventas_admin', {
            headers: headers,
            params: { desde, hasta }
        });
    }
}