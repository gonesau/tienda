import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Global } from './global';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

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
    return this._http.get(this.url + 'obtener_producto_slug_publico/' + slug, { headers: headers });
  }

  listar_productos_recomendados_publico(categoria): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'listar_productos_recomendados_publico/' + categoria, { headers: headers });
  }

  get_departamentos(): Observable<any> {
    return this._http.get('../../assets/departamentos.json');
  }

  get_municipios(): Observable<any> {
    return this._http.get('../../assets/municipios.json');
  }

  get_envios(): Observable<any> {
    return this._http.get('../../assets/envios.json');
  }

  obtener_descuento_activo(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'obtener_descuento_activo', { headers: headers });
  }


    // ... métodos existentes ...

  /**
   * Envía un mensaje de contacto
   * @param data Datos del formulario de contacto
   * @returns Observable con la respuesta del servidor
   */
  enviar_mensaje_contacto(data: any): Observable<any> {
    // Validación básica
    if (!data) {
      return throwError(() => ({ 
        status: 400, 
        message: 'No se proporcionaron datos' 
      }));
    }

    if (!data.nombre || data.nombre.trim().length < 3) {
      return throwError(() => ({ 
        status: 400, 
        message: 'El nombre debe tener al menos 3 caracteres' 
      }));
    }

    if (!data.email || !this.validarEmail(data.email)) {
      return throwError(() => ({ 
        status: 400, 
        message: 'El email es inválido' 
      }));
    }

    if (!data.asunto || data.asunto.trim().length < 3) {
      return throwError(() => ({ 
        status: 400, 
        message: 'El asunto debe tener al menos 3 caracteres' 
      }));
    }

    if (!data.mensaje || data.mensaje.trim().length < 10) {
      return throwError(() => ({ 
        status: 400, 
        message: 'El mensaje debe tener al menos 10 caracteres' 
      }));
    }

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.post(this.url + 'enviar_mensaje_contacto', data, { headers })
      .pipe(
        retry(1), // Reintentar una vez si falla
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Valida formato de email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 429:
          errorMessage = 'Has alcanzado el límite de mensajes. Por favor intenta más tarde.';
          break;
        case 500:
          errorMessage = 'Error en el servidor. Intenta nuevamente más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('Error en servicio:', error);
    
    return throwError(() => ({ 
      status: error.status, 
      message: errorMessage,
      error: error.error 
    }));
  }


}
