// tienda/src/app/services/review.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Global } from './global';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  public url: string;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }

  /**
   * Obtiene headers con autenticación
   */
  private getAuthHeaders(token?: string): HttpHeaders {
    const authToken = token || localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: authToken || ''
    });
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
          break;
        case 403:
          errorMessage = 'No tienes permisos para esta acción';
          break;
        case 404:
          errorMessage = error.error?.message || 'No encontrado';
          break;
        case 500:
          errorMessage = 'Error en el servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('Error en servicio de reviews:', error);
    return throwError(() => ({ 
      status: error.status, 
      message: errorMessage,
      error: error.error 
    }));
  }

  /**
   * Crea una nueva reseña
   */
  crear_review(data: {
    producto: string,
    venta: string,
    review: string,
    rating: number
  }, token?: string): Observable<any> {
    
    if (!data.producto || !data.venta) {
      return throwError(() => ({ 
        status: 400, 
        message: 'Datos incompletos' 
      }));
    }

    if (!data.review || data.review.trim().length < 10) {
      return throwError(() => ({ 
        status: 400, 
        message: 'La reseña debe tener al menos 10 caracteres' 
      }));
    }

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return throwError(() => ({ 
        status: 400, 
        message: 'La calificación debe estar entre 1 y 5' 
      }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.post(this.url + 'crear_review', data, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Lista las reseñas de un producto
   */
  listar_reviews_producto(productoId: string): Observable<any> {
    if (!productoId) {
      return throwError(() => ({ 
        status: 400, 
        message: 'ID de producto requerido' 
      }));
    }

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.get(this.url + 'listar_reviews_producto/' + productoId, { headers })
      .pipe(
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Verifica si el cliente puede reseñar un producto
   */
  verificar_puede_resenar(productoId: string, ventaId: string, token?: string): Observable<any> {
    if (!productoId || !ventaId) {
      return throwError(() => ({ 
        status: 400, 
        message: 'Datos incompletos' 
      }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.get(
      this.url + `verificar_puede_resenar/${productoId}/${ventaId}`, 
      { headers }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene las reseñas de un cliente
   */
  obtener_reviews_cliente(clienteId: string, token?: string): Observable<any> {
    if (!clienteId) {
      return throwError(() => ({ 
        status: 400, 
        message: 'ID de cliente requerido' 
      }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.get(this.url + 'obtener_reviews_cliente/' + clienteId, { headers })
      .pipe(
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }
}