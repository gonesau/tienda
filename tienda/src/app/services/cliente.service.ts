// tienda/src/app/services/cliente.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, retry } from 'rxjs/operators';
import { Global } from './global';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  public url: string;
  private tokenKey = 'token';
  private userIdKey = '_id';

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) {
    this.url = Global.url;
  }

  /**
   * Obtiene headers con autenticación
   */
  private getAuthHeaders(token?: string): HttpHeaders {
    const authToken = token || this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: authToken || ''
    });
  }

  /**
   * Obtiene token del localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtiene ID del usuario
   */
  private getUserId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
          this.clearSession();
          this._router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = error.error?.message || 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error en el servidor. Intenta nuevamente más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('Error HTTP:', error);
    return throwError(() => ({ 
      status: error.status, 
      message: errorMessage,
      originalError: error 
    }));
  }

  /**
   * Limpia la sesión del usuario
   */
  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {
      const helper = new JwtHelperService();
      
      if (helper.isTokenExpired(token)) {
        this.clearSession();
        return false;
      }

      const decodedToken = helper.decodeToken(token);
      if (!decodedToken) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validando token:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Login del cliente
   */
  login_cliente(data: { email: string; password: string }): Observable<any> {
    if (!data.email || !data.password) {
      return throwError(() => ({ 
        status: 400, 
        message: 'Email y contraseña son requeridos' 
      }));
    }

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.post(this.url + 'login_cliente', data, { headers })
      .pipe(
        tap((response: any) => {
          if (response.data && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.userIdKey, response.data._id);
            localStorage.setItem('usuario', JSON.stringify(response.data));
            localStorage.setItem('nombre_cliente', response.data.nombres);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene datos del cliente
   */
  obtener_cliente_guest(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID de usuario requerido' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.get(this.url + 'obtener_cliente_guest/' + id, { headers })
      .pipe(
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Actualiza perfil del cliente
   */
  actualizar_perfil_cliente_guest(id: string, data: any, token?: string): Observable<any> {
    if (!id || !data) {
      return throwError(() => ({ status: 400, message: 'Datos incompletos' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.put(this.url + 'actualizar_perfil_cliente_guest/' + id, data, { headers })
      .pipe(
        tap((response: any) => {
          const datosActualizados = response.data || response;
          if (datosActualizados && datosActualizados._id) {
            localStorage.setItem('usuario', JSON.stringify(datosActualizados));
            localStorage.setItem('nombre_cliente', datosActualizados.nombres);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene configuración pública
   */
  obtener_config_publico(): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.get(this.url + 'obtener_config_publico', { headers })
      .pipe(
        retry(2),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene productos públicos
   */
  obtener_productos_publico(filtro: string = ''): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.get(this.url + 'listar_productos_publico/' + filtro, { headers })
      .pipe(
        retry(2),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Agrega producto al carrito
   */
  agregar_carrito_cliente(data: any, token?: string): Observable<any> {
    if (!data.producto || !data.cliente) {
      return throwError(() => ({ status: 400, message: 'Datos del producto incompletos' }));
    }

    if (!data.cantidad || data.cantidad < 1) {
      return throwError(() => ({ status: 400, message: 'Cantidad inválida' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.post(this.url + 'agregar_carrito_cliente', data, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene carrito del cliente
   */
  obtener_carrito_cliente(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID de usuario requerido' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.get(this.url + 'obtener_carrito_cliente/' + id, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Elimina producto del carrito
   */
  eliminar_carrito_cliente(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID del producto requerido' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.delete(this.url + 'eliminar_carrito_cliente/' + id, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Actualiza cantidad en el carrito
   */
  actualizar_cantidad_carrito(id: string, data: { cantidad: number }, token?: string): Observable<any> {
    if (!id || !data.cantidad || data.cantidad < 1) {
      return throwError(() => ({ status: 400, message: 'Datos inválidos' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.put(this.url + 'actualizar_cantidad_carrito/' + id, data, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * ==========================================
   * MÉTODOS DE DIRECCIONES
   * ==========================================
   */

  /**
   * Registra una nueva dirección del cliente
   */
  registro_direccion_cliente(data: any, token?: string): Observable<any> {
    if (!data || !data.cliente) {
      return throwError(() => ({ status: 400, message: 'Datos de dirección incompletos' }));
    }

    // Validaciones
    if (!data.destinatario || data.destinatario.trim().length < 3) {
      return throwError(() => ({ status: 400, message: 'El nombre del destinatario debe tener al menos 3 caracteres' }));
    }

    if (!data.dui || !/^\d{8}-\d$/.test(data.dui)) {
      return throwError(() => ({ status: 400, message: 'El formato del DUI es inválido' }));
    }

    if (!data.telefono || !/^\d{4}-\d{4}$/.test(data.telefono)) {
      return throwError(() => ({ status: 400, message: 'El formato del teléfono es inválido' }));
    }

    if (!data.zip || data.zip.trim().length < 4) {
      return throwError(() => ({ status: 400, message: 'El código postal es inválido' }));
    }

    if (!data.direccion || data.direccion.trim().length < 10) {
      return throwError(() => ({ status: 400, message: 'La dirección debe tener al menos 10 caracteres' }));
    }

    if (!data.pais) {
      return throwError(() => ({ status: 400, message: 'Debe seleccionar un país' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.post(this.url + 'registro_direccion_cliente', data, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene todas las direcciones del cliente
   */
  obtener_direcciones_cliente(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID de usuario requerido' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.get(this.url + 'obtener_direcciones_cliente/' + id, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Establece una dirección como principal
   */
  establecer_direccion_principal(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID de dirección requerido' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.put(this.url + 'establecer_direccion_principal/' + id, {}, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Elimina una dirección del cliente
   */
  eliminar_direccion_cliente(id: string, token?: string): Observable<any> {
    if (!id) {
      return throwError(() => ({ status: 400, message: 'ID de dirección requerido' }));
    }

    if (!this.isAuthenticated()) {
      return throwError(() => ({ status: 401, message: 'Debes iniciar sesión' }));
    }

    const headers = this.getAuthHeaders(token);
    
    return this._http.delete(this.url + 'eliminar_direccion_cliente/' + id, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
}