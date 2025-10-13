import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';

declare var iziToast: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  public user: any = undefined; // Se inicializa como undefined
  public token: string | null;

  constructor(
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
    // La lógica para obtener el usuario ya no es necesaria aquí,
    // ya que no hay un endpoint para ello.
    // El guard se encargará de la seguridad.
    if (!this.token) {
        this._router.navigate(['/login']);
    }
  }

  logout() {
    iziToast.question({
        timeout: 20000,
        close: false,
        overlay: true,
        displayMode: 'once',
        id: 'question',
        zindex: 999,
        title: 'Confirmación',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        position: 'center',
        buttons: [
            ['<button><b>SÍ</b></button>', (instance, toast) => {
                
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');

                // Notificación de éxito
                iziToast.success({
                    title: 'Éxito',
                    message: 'Has cerrado sesión correctamente.',
                    position: 'topRight'
                });

                // Limpiar almacenamiento local
                localStorage.clear();

                // Redirigir a la página de login
                this._router.navigate(['/login']);

            }, true],
            ['<button>NO</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }],
        ]
    });
  }
}

