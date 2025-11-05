import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GuestService } from 'src/app/services/guest.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit, OnDestroy {
  public token: string | null;
  public idCliente: string | null;
  
  public direccion: any = {
    destinatario: '',
    dui: '',
    zip: '',
    telefono: '',
    direccion: '',
    pais: '',
    departamento: '',
    municipio: '',
    principal: false
  };

  public direcciones: Array<any> = [];
  public departamentos: Array<any> = [];
  public todosMunicipios: Array<any> = [];
  public municipiosFiltrados: Array<string> = [];
  
  public load_direcciones = true;
  public btn_guardar = false;
  public btn_eliminar: { [key: string]: boolean } = {};
  public btn_principal: { [key: string]: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private _guestService: GuestService,
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token');
    this.idCliente = localStorage.getItem('_id');
  }

  ngOnInit(): void {
    if (!this.token || !this.idCliente) {
      this.mostrarError('Debes iniciar sesión para acceder a esta sección');
      this._router.navigate(['/login']);
      return;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los datos necesarios
   */
  private cargarDatos(): void {
    this.cargarDepartamentos();
    this.cargarMunicipios();
    this.cargarDirecciones();
  }

  /**
   * Carga departamentos
   */
  private cargarDepartamentos(): void {
    this._guestService.get_departamentos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.departamentos = response || [];
        },
        error: (error) => {
          console.error('Error cargando departamentos:', error);
        }
      });
  }

  /**
   * Carga municipios
   */
  private cargarMunicipios(): void {
    this._guestService.get_municipios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.todosMunicipios = response || [];
        },
        error: (error) => {
          console.error('Error cargando municipios:', error);
        }
      });
  }

  /**
   * Carga direcciones del cliente - OPTIMIZADO
   */
  private cargarDirecciones(): void {
    if (!this.idCliente || !this.token) {
      return;
    }

    this.load_direcciones = true;

    this._clienteService.obtener_direcciones_cliente(this.idCliente, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Normalizar respuesta - puede venir en diferentes formatos
          let direccionesData: Array<any> = [];

          if (response) {
            // Si es un error del servidor
            if (response.message && !response.data) {
              console.log('Sin direcciones o error:', response.message);
              direccionesData = [];
            }
            // Si data es un array
            else if (Array.isArray(response.data)) {
              direccionesData = response.data;
            }
            // Si response es directamente un array
            else if (Array.isArray(response)) {
              direccionesData = response;
            }
          }

          // Ordenar: principal primero, luego por fecha
          this.direcciones = direccionesData.sort((a, b) => {
            if (a.principal && !b.principal) return -1;
            if (!a.principal && b.principal) return 1;
            
            const fechaA = new Date(a.createdAt || 0).getTime();
            const fechaB = new Date(b.createdAt || 0).getTime();
            return fechaB - fechaA;
          });

          this.load_direcciones = false;
        },
        error: (error) => {
          console.error('Error cargando direcciones:', error);
          this.direcciones = [];
          this.load_direcciones = false;

          if (error.status === 401 || error.status === 403) {
            this.mostrarError('Tu sesión ha expirado');
            setTimeout(() => {
              localStorage.clear();
              this._router.navigate(['/login']);
            }, 2000);
          }
        }
      });
  }

  /**
   * Maneja la selección del país
   */
  select_pais(): void {
    const esSalvador = this.direccion.pais === 'El Salvador';
    
    $('#sl_departamento').prop('disabled', !esSalvador);
    $('#sl_municipio').prop('disabled', true);
    
    if (!esSalvador) {
      this.direccion.departamento = '';
      this.direccion.municipio = '';
      this.municipiosFiltrados = [];
    }
  }

  /**
   * Maneja la selección del departamento
   */
  select_departamento(): void {
    const idDepto = Number(this.direccion.departamento);
    const departamento = this.todosMunicipios.find(m => m.departamento_id === idDepto);

    if (departamento && departamento.municipios) {
      this.municipiosFiltrados = departamento.municipios;
      $('#sl_municipio').prop('disabled', false);
    } else {
      this.municipiosFiltrados = [];
      $('#sl_municipio').prop('disabled', true);
    }

    this.direccion.municipio = '';
  }

  /**
   * Aplica máscara al teléfono (0000-0000)
   */
  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }
    
    if (valor.length > 4) {
      valor = valor.substring(0, 4) + '-' + valor.substring(4);
    }
    
    event.target.value = valor;
    this.direccion.telefono = valor;
  }

  /**
   * Aplica máscara al DUI (00000000-0)
   */
  aplicarMascaraDUI(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 9) {
      valor = valor.substring(0, 9);
    }
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8) + '-' + valor.substring(8);
    }
    
    event.target.value = valor;
    this.direccion.dui = valor;
  }

  /**
   * Valida solo letras y espacios
   */
  validarSoloLetras(event: any, campo: string): void {
    const input = event.target;
    const valor = input.value;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

    if (!regex.test(valor)) {
      input.value = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      this.direccion[campo] = input.value;
    }
  }

  /**
   * Valida el formulario
   */
  private validarFormulario(): boolean {
    if (!this.direccion.destinatario || this.direccion.destinatario.trim().length < 3) {
      this.mostrarError('El nombre del destinatario debe tener al menos 3 caracteres');
      return false;
    }

    const regexDUI = /^\d{8}-\d$/;
    if (!regexDUI.test(this.direccion.dui)) {
      this.mostrarError('El formato del DUI es inválido. Debe ser 00000000-0');
      return false;
    }

    if (!this.direccion.zip || this.direccion.zip.trim().length < 4) {
      this.mostrarError('El código postal debe tener al menos 4 caracteres');
      return false;
    }

    const regexTelefono = /^\d{4}-\d{4}$/;
    if (!regexTelefono.test(this.direccion.telefono)) {
      this.mostrarError('El formato del teléfono es inválido. Debe ser 0000-0000');
      return false;
    }

    if (!this.direccion.direccion || this.direccion.direccion.trim().length < 10) {
      this.mostrarError('La dirección debe tener al menos 10 caracteres');
      return false;
    }

    if (!this.direccion.pais) {
      this.mostrarError('Debe seleccionar un país');
      return false;
    }

    if (this.direccion.pais === 'El Salvador') {
      if (!this.direccion.departamento) {
        this.mostrarError('Debe seleccionar un departamento');
        return false;
      }
      if (!this.direccion.municipio) {
        this.mostrarError('Debe seleccionar un municipio');
        return false;
      }
    }

    return true;
  }

  /**
   * Guarda una nueva dirección
   */
  guardar_direccion(registroForm: any): void {
    if (!registroForm.valid || !this.validarFormulario()) {
      return;
    }

    this.btn_guardar = true;

    const data = {
      cliente: this.idCliente,
      destinatario: this.direccion.destinatario.trim(),
      dui: this.direccion.dui.trim(),
      zip: this.direccion.zip.trim(),
      direccion: this.direccion.direccion.trim(),
      pais: this.direccion.pais,
      departamento: this.direccion.pais === 'El Salvador' ? this.direccion.departamento : '',
      municipio: this.direccion.pais === 'El Salvador' ? this.direccion.municipio : '',
      telefono: this.direccion.telefono.trim(),
      principal: this.direccion.principal
    };

    this._clienteService.registro_direccion_cliente(data, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mostrarExito('Dirección guardada correctamente');
          
          // Resetear formulario
          this.resetearFormulario(registroForm);
          
          // Recargar direcciones
          this.cargarDirecciones();
          
          this.btn_guardar = false;
        },
        error: (error) => {
          console.error('Error guardando dirección:', error);
          this.mostrarError(error.error?.message || 'Error al guardar la dirección');
          this.btn_guardar = false;
        }
      });
  }

  /**
   * Resetea el formulario
   */
  private resetearFormulario(form: any): void {
    this.direccion = {
      destinatario: '',
      dui: '',
      zip: '',
      telefono: '',
      direccion: '',
      pais: '',
      departamento: '',
      municipio: '',
      principal: false
    };
    
    form.resetForm();
    
    $('#sl_departamento').prop('disabled', true);
    $('#sl_municipio').prop('disabled', true);
    this.municipiosFiltrados = [];
  }

  /**
   * Establece una dirección como principal
   */
  establecer_principal(id: string): void {
    if (!id) return;

    this.btn_principal[id] = true;

    this._clienteService.establecer_direccion_principal(id, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mostrarExito('Dirección principal actualizada');
          this.cargarDirecciones();
          delete this.btn_principal[id];
        },
        error: (error) => {
          console.error('Error estableciendo dirección principal:', error);
          this.mostrarError(error.error?.message || 'Error al establecer dirección principal');
          this.btn_principal[id] = false;
        }
      });
  }

  /**
   * Elimina una dirección
   */
  eliminar_direccion(id: string): void {
    if (!id) return;

    const direccion = this.direcciones.find(d => d._id === id);

    if (direccion && direccion.principal) {
      this.mostrarAdvertencia('No puedes eliminar la dirección principal. Primero establece otra dirección como principal.');
      return;
    }

    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: 'once',
      id: 'question',
      zindex: 999,
      title: '¿Confirmar eliminación?',
      message: '¿Estás seguro de eliminar esta dirección? Esta acción no se puede deshacer.',
      position: 'center',
      buttons: [
        ['<button><b>Sí, eliminar</b></button>', (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          this.confirmarEliminacion(id);
        }, true],
        ['<button>Cancelar</button>', (instance: any, toast: any) => {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }],
      ]
    });
  }

  /**
   * Confirma y ejecuta la eliminación
   */
  private confirmarEliminacion(id: string): void {
    this.btn_eliminar[id] = true;

    this._clienteService.eliminar_direccion_cliente(id, this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mostrarExito('Dirección eliminada correctamente');
          this.cargarDirecciones();
          delete this.btn_eliminar[id];
        },
        error: (error) => {
          console.error('Error eliminando dirección:', error);
          this.mostrarError(error.error?.message || 'Error al eliminar la dirección');
          this.btn_eliminar[id] = false;
        }
      });
  }

  /**
   * Obtiene el nombre del departamento por ID
   */
  obtenerNombreDepartamento(id: string): string {
    if (!id) return '';
    const depto = this.departamentos.find(d => d.id === Number(id));
    return depto ? depto.nombre : id;
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
   * Muestra mensaje de advertencia
   */
  private mostrarAdvertencia(mensaje: string): void {
    iziToast.warning({
      title: 'Advertencia',
      titleColor: '#FFA500',
      color: '#FFF',
      class: 'text-warning',
      position: 'topRight',
      message: mensaje,
      timeout: 4000
    });
  }
}