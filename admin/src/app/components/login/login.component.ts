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

  public user: any = {};
  public token: string | null;
  public load_btn = false;
  public passwordFieldType: string = 'password';

  constructor(
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
    if (this.token) {
      // Si ya hay un token, redirige al panel principal.
      this._router.navigate(['/']);
    }
  }

  login(loginForm: NgForm) {
    if (loginForm.invalid) {
      // Marcar todos los campos para mostrar errores si el usuario intenta enviar el formulario vacío.
       Object.keys(loginForm.controls).forEach(key => {
            loginForm.controls[key].markAsTouched();
        });
      this.mostrarError('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.load_btn = true;
    let data = {
      email: this.user.email,
      password: this.user.password,
    };

    this._adminService.login_admin(data).subscribe(
      response => {
        if (!response.data) {
          this.mostrarError(response.message || 'El correo o la contraseña son incorrectos.');
        } else {
          localStorage.setItem('token', response.token);
          localStorage.setItem('_id', response.data._id);
          
          // Redirigir al panel principal
          this._router.navigate(['/']);
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error del servidor:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error con el servidor. Inténtalo de nuevo.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  togglePasswordVisibility(): void {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}
