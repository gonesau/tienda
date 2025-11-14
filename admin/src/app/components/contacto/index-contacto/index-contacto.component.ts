import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ContactoService } from 'src/app/services/contacto.service';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-index-contacto',
  templateUrl: './index-contacto.component.html',
  styleUrls: ['./index-contacto.component.css']
})
export class IndexContactoComponent implements OnInit, OnDestroy {

  public filtro = '';
  public token: string;
  public mensajes: Array<any> = [];
  public mensajes_filtrados: Array<any> = [];
  
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

  // Control del modal
  public mensajeAEliminar: any = null;
  public modalInstance: any = null;

  // Filtros de estado
  public filtro_estado = '';
  public estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendientes', badge: 'warning' },
    { value: 'leido', label: 'Leídos', badge: 'info' },
    { value: 'respondido', label: 'Respondidos', badge: 'success' },
    { value: 'cerrado', label: 'Cerrados', badge: 'secondary' }
  ];

  constructor(
    private _contactoService: ContactoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.cargar_datos();
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga los mensajes de contacto
   */
  cargar_datos(): void {
    this.load_data = true;
    
    this._contactoService.listar_mensajes_admin(this.filtro, this.token).subscribe(
      response => {
        if (response.success && response.data) {
          this.mensajes = response.data;
          this.aplicar_filtros();
        } else {
          this.mensajes = [];
          this.mensajes_filtrados = [];
        }
        this.load_data = false;
      },
      error => {
        console.error('Error al cargar mensajes:', error);
        this.mensajes = [];
        this.mensajes_filtrados = [];
        this.load_data = false;
        this.mostrarError('Error al cargar mensajes. Intenta nuevamente.');
      }
    );
  }

  /**
   * Aplica filtros de búsqueda y estado
   */
  aplicar_filtros(): void {
    let resultado = [...this.mensajes];

    // Filtro por texto
    if (this.filtro && this.filtro.trim() !== '') {
      const textoFiltro = this.filtro.toLowerCase();
      resultado = resultado.filter(mensaje =>
        mensaje.nombre?.toLowerCase().includes(textoFiltro) ||
        mensaje.email?.toLowerCase().includes(textoFiltro) ||
        mensaje.asunto?.toLowerCase().includes(textoFiltro) ||
        mensaje.mensaje?.toLowerCase().includes(textoFiltro)
      );
    }

    // Filtro por estado
    if (this.filtro_estado && this.filtro_estado !== '') {
      resultado = resultado.filter(mensaje => mensaje.estado === this.filtro_estado);
    }

    this.mensajes_filtrados = resultado;
    this.page = 1; // Reset a la primera página
  }

  /**
   * Filtra mensajes por texto
   */
  filtrar(): void {
    this.aplicar_filtros();
  }

  /**
   * Filtra por estado
   */
  filtrar_por_estado(): void {
    this.aplicar_filtros();
  }

  /**
   * Resetea filtros
   */
  resetear(): void {
    this.filtro = '';
    this.filtro_estado = '';
    this.page = 1;
    this.aplicar_filtros();
  }

  /**
   * Cambia el estado de un mensaje
   */
  cambiar_estado(mensaje: any, nuevoEstado: string): void {
    if (mensaje.estado === nuevoEstado) {
      return; // No hacer nada si es el mismo estado
    }

    this.load_btn = true;

    const data = { estado: nuevoEstado };

    this._contactoService.actualizar_estado_mensaje_admin(mensaje._id, data, this.token).subscribe(
      response => {
        if (response.success) {
          // Actualizar el estado local
          mensaje.estado = nuevoEstado;
          
          iziToast.success({
            title: 'Éxito',
            message: 'Estado actualizado correctamente',
            position: 'topRight',
          });
        } else {
          this.mostrarError('No se pudo actualizar el estado');
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error actualizando estado:', error);
        this.load_btn = false;
        this.mostrarError(error.message || 'No se pudo actualizar el estado');
      }
    );
  }

  /**
   * Obtiene la clase del badge según el estado
   */
  obtener_badge_estado(estado: string): string {
    const estadoObj = this.estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.badge : 'secondary';
  }

  /**
   * Obtiene el label del estado
   */
  obtener_label_estado(estado: string): string {
    const estadoObj = this.estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label.slice(0, -1) : estado; // Quitar la 's' final
  }

  /**
   * Obtiene tiempo transcurrido desde la creación
   */
  obtener_tiempo_transcurrido(fecha: string): string {
    const ahora = new Date();
    const fechaMensaje = new Date(fecha);
    const diferencia = ahora.getTime() - fechaMensaje.getTime();

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) {
      return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
    } else if (horas > 0) {
      return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
    } else if (minutos > 0) {
      return minutos === 1 ? 'Hace 1 minuto' : `Hace ${minutos} minutos`;
    } else {
      return 'Hace unos momentos';
    }
  }

  /**
   * Trunca texto largo
   */
  truncar_texto(texto: string, limite: number = 100): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  }

  /**
   * Abre modal de confirmación para eliminar
   */
  abrirModalEliminar(mensaje: any): void {
    this.mensajeAEliminar = mensaje;
    
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
      this.modalInstance.show();
    }
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.mensajeAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Confirma eliminación
   */
  confirmarEliminacion(): void {
    if (!this.mensajeAEliminar || !this.mensajeAEliminar._id) {
      this.mostrarError('No se pudo identificar el mensaje.');
      return;
    }

    this.load_btn = true;

    this._contactoService.eliminar_mensaje_admin(this.mensajeAEliminar._id, this.token).subscribe(
      response => {
        if (response.success) {
          iziToast.success({
            title: 'Éxito',
            message: 'Mensaje eliminado correctamente',
            position: 'topRight',
          });

          this.cerrarModal();
          this.cargar_datos();
        } else {
          this.load_btn = false;
          this.mostrarError('No se pudo eliminar el mensaje');
        }
      },
      error => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        this.mostrarError(error.message || 'No se pudo eliminar el mensaje');
      }
    );
  }

  /**
   * Obtiene contador por estado
   */
  obtener_contador_estado(estado: string): number {
    if (!estado) {
      return this.mensajes.length;
    }
    return this.mensajes.filter(m => m.estado === estado).length;
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}