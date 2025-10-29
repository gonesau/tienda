import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  public user: any = {
    email: '',
    password: ''
  };
  public token: string | null;
  public load_btn = false;
  public passwordFieldType: string = 'password';
  public currentYear: number = new Date().getFullYear();

  constructor(
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
    // Si ya hay token válido, redirigir al panel
    if (this.token) {
      this._router.navigate(['/inicio']);
    }
  }

  /**
   * Procesa el login
   */
  login(loginForm: NgForm): void {
    // Validar formulario
    if (loginForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(loginForm.controls).forEach(key => {
        loginForm.controls[key].markAsTouched();
      });
      
      this.mostrarError('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.load_btn = true;
    
    const data = {
      email: this.user.email.trim().toLowerCase(),
      password: this.user.password
    };

    this._adminService.login_admin(data).subscribe(
      response => {
        if (!response.data) {
          // Error de autenticación
          this.mostrarError(response.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
          // Login exitoso
          localStorage.setItem('token', response.token);
          localStorage.setItem('_id', response.data._id);
          
          iziToast.success({
            title: 'Bienvenido',
            message: 'Has iniciado sesión correctamente',
            position: 'topRight',
            timeout: 2000
          });
          
          // Pequeño delay para mostrar el mensaje de éxito
          setTimeout(() => {
            this._router.navigate(['/inicio']);
          }, 500);
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error del servidor:', error);
        
        let errorMsg = 'Error en el servidor. Intenta nuevamente.';
        
        if (error.status === 401) {
          errorMsg = 'Correo o contraseña incorrectos.';
        } else if (error.status === 403) {
          errorMsg = 'No tienes permisos para acceder.';
        } else if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  /**
   * Muestra mensaje de error con iziToast
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
      timeout: 5000,
      progressBar: true,
      close: true,
      pauseOnHover: true
    });
  }
}