import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
declare var iziToast: any;

@Component({
  selector: 'app-index-ordenes',
  templateUrl: './index-ordenes.component.html',
  styleUrls: ['./index-ordenes.component.css']
})
export class IndexOrdenesComponent implements OnInit, OnDestroy {
  public token: string | null;
  public idCliente: string | null;
  
  // Datos de órdenes
  public ordenes: Array<any> = [];
  public estadisticas: any = {
    total_ordenes: 0,
    ordenes_completadas: 0,
    ordenes_pendientes: 0,
    total_gastado: 0
  };

  // Estados de carga
  public load_init = true;
  public load_ordenes = true;
  public load_estadisticas = true;

  // Filtros y paginación
  public filtro_busqueda = '';
  public filtro_estado = 'todos';
  public page = 1;
  public limit = 5;
  public total_pages = 1;
  public total_ordenes = 0;

  // Subject para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Estados disponibles
  public estados_disponibles = [
    { valor: 'todos', label: 'Todas las órdenes', icono: 'cxi-bag', color: 'secondary' },
    { valor: 'Procesando', label: 'Procesando', icono: 'cxi-time', color: 'info' },
    { valor: 'Enviado', label: 'En camino', icono: 'cxi-truck', color: 'warning' },
    { valor: 'Entregado', label: 'Entregadas', icono: 'cxi-check-circle', color: 'success' },
    { valor: 'Cancelado', label: 'Canceladas', icono: 'cxi-close-circle', color: 'danger' }
  ];

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
    this.idCliente = localStorage.getItem('_id');
  }

  ngOnInit(): void {
    if (!this.token || !this.idCliente) {
      this.mostrarError('Debes iniciar sesión para ver tus órdenes');
      this._router.navigate(['/login']);
      return;
    }

    // Configurar búsqueda con debounce
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(termino => {
        this.page = 1; // Reset a página 1 al buscar
        this.cargarOrdenes();
      });

    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente cargando datos
   */
  private inicializarComponente(): void {
    this.load_init = true;

    Promise.all([
      this.cargarEstadisticas(),
      this.cargarOrdenes()
    ]).then(() => {
      this.load_init = false;
    }).catch(error => {
      console.error('Error inicializando componente:', error);
      this.load_init = false;
    });
  }

  /**
   * Carga estadísticas del cliente
   */
  private cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.idCliente || !this.token) {
        resolve();
        return;
      }

      this.load_estadisticas = true;

      this._clienteService.obtener_estadisticas_cliente(this.idCliente, this.token)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.load_estadisticas = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.data) {
              this.estadisticas = response.data;
            }
            resolve();
          },
          error: (error) => {
            console.error('Error cargando estadísticas:', error);
            this.manejarError(error);
            resolve();
          }
        });
    });
  }

  /**
   * Carga órdenes con filtros y paginación
   */
  private cargarOrdenes(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.idCliente || !this.token) {
        resolve();
        return;
      }

      this.load_ordenes = true;

      const params = {
        filtro: this.filtro_busqueda.trim(),
        estado: this.filtro_estado,
        page: this.page,
        limit: this.limit
      };

      this._clienteService.listar_ventas_cliente(this.idCliente, params, this.token)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.load_ordenes = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.data) {
              this.ordenes = response.data;
            } else {
              this.ordenes = [];
            }

            if (response.pagination) {
              this.total_pages = response.pagination.pages;
              this.total_ordenes = response.pagination.total;
            }

            resolve();
          },
          error: (error) => {
            console.error('Error cargando órdenes:', error);
            this.ordenes = [];
            this.manejarError(error);
            resolve();
          }
        });
    });
  }

  /**
   * Maneja cambios en el campo de búsqueda
   */
  onBusquedaChange(termino: string): void {
    this.filtro_busqueda = termino;
    this.searchSubject.next(termino);
  }

  /**
   * Maneja cambios en el filtro de estado
   */
  onEstadoChange(estado: string): void {
    this.filtro_estado = estado;
    this.page = 1;
    this.cargarOrdenes();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtro_busqueda = '';
    this.filtro_estado = 'todos';
    this.page = 1;
    this.cargarOrdenes();
  }

  /**
   * Cambia de página
   */
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.total_pages) {
      return;
    }
    this.page = nuevaPagina;
    this.cargarOrdenes();
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Genera array de números de página para la paginación
   */
  getPaginasArray(): number[] {
    const maxPaginas = 5;
    const mitad = Math.floor(maxPaginas / 2);
    let inicio = Math.max(1, this.page - mitad);
    let fin = Math.min(this.total_pages, inicio + maxPaginas - 1);

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  /**
   * Navega al detalle de una orden
   */
  verDetalle(ordenId: string): void {
    if (ordenId) {
      this._router.navigate(['/cuenta/ordenes', ordenId]);
    }
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getEstadoClase(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Procesando': 'badge-info',
      'Enviado': 'badge-warning',
      'Entregado': 'badge-success',
      'Cancelado': 'badge-danger'
    };
    return estadoMap[estado] || 'badge-secondary';
  }

  /**
   * Obtiene el ícono según el estado
   */
  getEstadoIcono(estado: string): string {
    const iconoMap: { [key: string]: string } = {
      'Procesando': 'cxi-time',
      'Enviado': 'cxi-truck',
      'Entregado': 'cxi-check-circle',
      'Cancelado': 'cxi-close-circle'
    };
    return iconoMap[estado] || 'cxi-bag';
  }

  /**
   * Formatea fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (e) {
      return fecha;
    }
  }

  /**
   * Formatea fecha corta
   */
  formatearFechaCorta(fecha: string): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return fecha;
    }
  }

  /**
   * Descarga PDF del comprobante
   */
  descargarComprobante(ordenId: string, nventa: string): void {
    if (!ordenId) return;

    window.open(
      `${this._clienteService.url}generar_comprobante_pdf/${ordenId}?token=${this.token}`,
      '_blank'
    );
  }

  /**
   * Maneja errores de autenticación y otros
   */
  private manejarError(error: any): void {
    if (error.status === 401 || error.status === 403) {
      this.mostrarError('Tu sesión ha expirado');
      setTimeout(() => {
        localStorage.clear();
        this._router.navigate(['/login']);
      }, 2000);
    }
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje,
      timeout: 4000
    });
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: '¡Éxito!',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje,
      timeout: 3000
    });
  }
}