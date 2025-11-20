import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public user: any = {};
  public usuario: any = {};
  public token: string | null;
  public isLoading: boolean = false;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.verificarAutenticacion();
  }

  ngOnInit(): void {
    this.verificarAutenticacion();
  }

  /**
   * Verifica si el usuario ya está autenticado
   */
  private verificarAutenticacion(): void {
    this.token = localStorage.getItem('token');
    const userId = localStorage.getItem('_id');

    if (this.token && userId) {
      this._clienteService.obtener_cliente_guest(userId, this.token).subscribe(
        response => {
          if (response.data) {
            this._router.navigate(['/']);
          } else {
            this.limpiarSesion();
          }
        },
        error => {
          console.log('Error verificando token:', error);
          this.limpiarSesion();
        }
      );
    } else {
      this.limpiarSesion();
    }
  }

  /**
   * Limpia la sesión
   */
  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('_id');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
    this.token = null;
  }

  /**
   * Maneja el proceso de login
   */
  login(loginForm): void {
    // Validar formulario
    if (!loginForm.valid) {
      iziToast.error({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Por favor complete todos los campos correctamente'
      });
      return;
    }

    // Validar campos individualmente
    if (!this.user.email || this.user.email.trim() === '') {
      iziToast.error({
        title: 'Error',
        position: 'topRight',
        message: 'El correo electrónico es requerido'
      });
      return;
    }

    if (!this.user.password || this.user.password.trim() === '') {
      iziToast.error({
        title: 'Error',
        position: 'topRight',
        message: 'La contraseña es requerida'
      });
      return;
    }

    // Mostrar indicador de carga
    this.isLoading = true;

    const data = {
      email: this.user.email.trim().toLowerCase(),
      password: this.user.password
    };

    console.log('Intentando login con:', { email: data.email });

    this._clienteService.login_cliente(data).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        
        this.isLoading = false;

        // Verificar que la respuesta tenga los datos necesarios
        if (!response || !response.data || !response.token) {
          iziToast.error({
            title: 'Error',
            position: 'topRight',
            message: response?.message || 'Respuesta inválida del servidor'
          });
          return;
        }

        // Login exitoso - guardar datos
        this.usuario = response.data;
        localStorage.setItem('token', response.token);
        localStorage.setItem('_id', response.data._id);
        localStorage.setItem('usuario', JSON.stringify(response.data));
        localStorage.setItem('nombre_cliente', response.data.nombres);

        // Mostrar mensaje de éxito
        iziToast.success({
          title: 'Éxito',
          position: 'topRight',
          message: `¡Bienvenido ${response.data.nombres}!`
        });

        // Limpiar formulario
        this.user = {};
        loginForm.resetForm();

        // Redirigir
        setTimeout(() => {
          this._router.navigate(['/']);
        }, 500);
      },
      error => {
        console.error('Error en login:', error);
        this.isLoading = false;

        let mensajeError = 'Ocurrió un error inesperado';

        // Manejar diferentes tipos de error
        if (error.status === 0) {
          mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (error.status === 404) {
          mensajeError = 'El correo electrónico no está registrado';
        } else if (error.status === 401) {
          mensajeError = 'La contraseña es incorrecta';
        } else if (error.status === 400) {
          mensajeError = error.message || 'Datos inválidos';
        } else if (error.status === 500) {
          mensajeError = 'Error en el servidor. Intenta nuevamente.';
        } else if (error.message) {
          mensajeError = error.message;
        }

        iziToast.error({
          title: 'Error',
          position: 'topRight',
          message: mensajeError
        });
      }
    );
  }
}