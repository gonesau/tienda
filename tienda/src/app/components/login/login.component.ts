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

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    // Verificar autenticación al inicializar
    this.verificarAutenticacion();
  }

  ngOnInit(): void {
    // Verificar nuevamente al cargar el componente
    this.verificarAutenticacion();
  }

  /**
   * Verifica si el usuario ya está autenticado y redirige si es necesario
   */
  private verificarAutenticacion(): void {
    this.token = localStorage.getItem('token');
    const userId = localStorage.getItem('_id');

    if (this.token && userId) {
      // Verificar que el token sea válido haciendo una petición al servidor
      this._clienteService.obtener_cliente_guest(userId, this.token).subscribe(
        response => {
          if (response.data) {
            // Token válido, redirigir a inicio
            this._router.navigate(['/']);
          } else {
            // Token inválido, limpiar localStorage
            this.limpiarSesion();
          }
        },
        error => {
          // Error al verificar token, limpiar localStorage
          console.log('Error verificando token:', error);
          this.limpiarSesion();
        }
      );
    } else {
      // No hay token, asegurar que localStorage esté limpio
      this.limpiarSesion();
    }
  }

  /**
   * Limpia todos los datos de sesión del localStorage
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

    const data = {
      email: this.user.email.trim(),
      password: this.user.password
    };

    this._clienteService.login_cliente(data).subscribe(
      response => {
        if (!response.data || !response.token) {
          iziToast.show({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Correo electrónico o contraseña incorrectos'
          });
          return;
        }

        // Guardar datos de sesión
        this.usuario = response.data;
        localStorage.setItem('token', response.token);
        localStorage.setItem('_id', response.data._id);
        localStorage.setItem('usuario', JSON.stringify(response.data));
        localStorage.setItem('nombre_cliente', response.data.nombres);

        // Mostrar mensaje de éxito
        iziToast.show({
          title: 'Éxito',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: `¡Bienvenido ${response.data.nombres}!`
        });

        // Limpiar formulario
        this.user = {};
        loginForm.resetForm();

        // Redirigir a inicio
        setTimeout(() => {
          this._router.navigate(['/']);
        }, 500);
      },
      error => {
        console.log('Error en login:', error);
        iziToast.show({
          title: 'Error',
          titleColor: '#FF0000',
          color: '#FFF',
          class: 'text-danger',
          position: 'topRight',
          message: error.error?.message || 'Ocurrió un error en el servidor. Por favor intente nuevamente.'
        });
      }
    );
  }
}