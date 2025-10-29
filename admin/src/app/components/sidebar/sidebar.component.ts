import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';

declare var iziToast: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  public token: string | null;
  public sidebarOpen = false;
  private isDesktop = window.innerWidth >= 992;

  constructor(
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
    if (!this.token) {
      this._router.navigate(['/login']);
    }
    
    // Detectar si es desktop al cargar
    this.checkScreenSize();
  }

  /**
   * Detecta cambios en el tamaño de la ventana
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    
    // Cerrar sidebar automáticamente si se pasa a desktop
    if (this.isDesktop && this.sidebarOpen) {
      this.closeSidebar();
    }
  }

  /**
   * Verifica el tamaño de pantalla
   */
  private checkScreenSize(): void {
    this.isDesktop = window.innerWidth >= 992;
  }

  /**
   * Toggle del sidebar (abre/cierra)
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    
    // Prevenir scroll del body cuando el sidebar está abierto en mobile
    if (this.sidebarOpen && !this.isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Cierra el sidebar
   */
  closeSidebar(): void {
    this.sidebarOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Cierra el sidebar solo en mobile después de hacer clic en un link
   */
  closeSidebarOnMobile(): void {
    if (!this.isDesktop) {
      this.closeSidebar();
    }
  }

  /**
   * Cierra sesión con confirmación
   */
  logout(): void {
    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: 'once',
      id: 'question',
      zindex: 9999,
      title: 'Confirmación',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      position: 'center',
      buttons: [
        ['<button class="btn btn-primary btn-sm"><b>SÍ, CERRAR SESIÓN</b></button>', 
         (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');

          iziToast.success({
            title: 'Éxito',
            message: 'Has cerrado sesión correctamente.',
            position: 'topRight',
            timeout: 3000
          });

          // Limpiar almacenamiento
          localStorage.clear();
          
          // Resetear overflow del body
          document.body.style.overflow = '';

          // Redirigir a login
          this._router.navigate(['/login']);
        }, true],
        ['<button class="btn btn-secondary btn-sm">CANCELAR</button>', 
         (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }]
      ]
    });
  }
}