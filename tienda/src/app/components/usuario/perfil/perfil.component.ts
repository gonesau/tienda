import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  public cliente: any = {};
  public id: string | null;
  public token: string | null;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.id = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.cargarCliente();
  }

  ngOnInit(): void {
    // Verificar autenticación al cargar
    if (!this.token || !this.id) {
      this._router.navigate(['/login']);
    }
  }

  /**
   * Carga los datos del cliente desde el servidor
   */
  private cargarCliente(): void {
    if (!this.id || !this.token) {
      this.cliente = undefined;
      this._router.navigate(['/login']);
      return;
    }

    this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
      response => {
        if (response.data) {
          this.cliente = response.data;
        } else {
          this.cliente = undefined;
          iziToast.error({
            title: 'Error',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'No se pudo cargar el perfil del usuario'
          });
          this._router.navigate(['/login']);
        }
      },
      error => {
        console.error('Error cargando cliente:', error);
        this.cliente = undefined;
        
        if (error.status === 401 || error.status === 403) {
          // Token inválido o expirado
          localStorage.clear();
          iziToast.error({
            title: 'Sesión expirada',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
          });
          this._router.navigate(['/login']);
        }
      }
    );
  }

  /**
   * Actualiza el perfil del cliente
   */
  actualizar(actualizarForm): void {
    if (!actualizarForm.valid) {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Por favor complete todos los campos correctamente'
      });
      return;
    }

    // Obtener contraseña del input (si fue modificada)
    const password = $('#input_password').val();
    if (password && password.trim() !== '') {
      this.cliente.password = password.trim();
    } else {
      // No enviar campo password si está vacío
      delete this.cliente.password;
    }

    this._clienteService.actualizar_perfil_cliente_guest(this.id, this.cliente, this.token).subscribe(
      response => {
        if (response.data) {
          // Actualizar localStorage
          localStorage.setItem('usuario', JSON.stringify(response.data));
          localStorage.setItem('nombre_cliente', response.data.nombres);

          iziToast.show({
            title: 'ÉXITO',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Perfil actualizado correctamente'
          });

          // Limpiar campo de contraseña
          $('#input_password').val('');

          // Recargar datos del cliente
          this.cliente = response.data;
        } else {
          iziToast.show({
            title: 'ERROR',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'No se pudo actualizar el perfil'
          });
        }
      },
      error => {
        console.error('Error actualizando perfil:', error);
        
        if (error.status === 401 || error.status === 403) {
          localStorage.clear();
          iziToast.error({
            title: 'Sesión expirada',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
          });
          this._router.navigate(['/login']);
        } else {
          iziToast.show({
            title: 'ERROR',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: error.error?.message || 'Ocurrió un error al actualizar el perfil'
          });
        }
      }
    );
  }
}