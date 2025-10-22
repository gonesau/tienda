import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  public token: string | null;
  public id: string | null;
  public user_lc: any = undefined;
  public usuario: any = undefined;
  private storageSubscription: Subscription | undefined;

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
    this.id = localStorage.getItem('_id');
  }

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.token || !this.id) {
      this._router.navigate(['/login']);
      return;
    }

    // Cargar usuario inicial
    this.cargarUsuario();

    // Escuchar cambios en localStorage (cuando se actualiza el perfil)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  ngOnDestroy(): void {
    // Limpiar evento
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }

  /**
   * Maneja cambios en el localStorage
   */
  private handleStorageChange(): void {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        this.user_lc = JSON.parse(usuarioGuardado);
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }
  }

  /**
   * Carga el usuario desde localStorage o servidor
   */
  private cargarUsuario(): void {
    if (!this.token || !this.id) {
      this.limpiarSesion();
      return;
    }

    // Cargar desde localStorage primero
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        this.user_lc = JSON.parse(usuarioGuardado);
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }

    // Verificar con el servidor
    this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
      response => {
        if (response.data) {
          this.usuario = response.data;
          this.user_lc = response.data;
          localStorage.setItem('usuario', JSON.stringify(this.usuario));
        } else {
          this.limpiarSesion();
          this._router.navigate(['/login']);
        }
      },
      error => {
        console.error('Error obteniendo usuario:', error);
        
        if (error.status === 401 || error.status === 403) {
          this.limpiarSesion();
          this._router.navigate(['/login']);
        }
      }
    );
  }

  /**
   * Limpia la sesión del usuario
   */
  private limpiarSesion(): void {
    this.usuario = undefined;
    this.user_lc = undefined;
    localStorage.removeItem('token');
    localStorage.removeItem('_id');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombre_cliente');
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): void {
    this.limpiarSesion();
    this._router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}