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
  public load_data = true;
  public mostrarPassword = false;
  public fecha_maxima: string = '';
  public fecha_minima: string = '1900-01-01';

  constructor(
    private _clienteService: ClienteService,
    private _router: Router
  ) {
    this.id = localStorage.getItem('_id');
    this.token = localStorage.getItem('token');
    this.calcularFechaMaxima();
  }

  ngOnInit(): void {
    // Verificar autenticación al cargar
    if (!this.token || !this.id) {
      this._router.navigate(['/login']);
      return;
    }
    
    this.cargarCliente();
  }

  /**
   * Calcula la fecha máxima permitida (16 años atrás desde hoy)
   */
  private calcularFechaMaxima(): void {
    const hoy = new Date();
    const anioMaximo = hoy.getFullYear() - 16;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.fecha_maxima = `${anioMaximo}-${mes}-${dia}`;
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

    this.load_data = true;
    this._clienteService.obtener_cliente_guest(this.id, this.token).subscribe(
      response => {
        console.log('Respuesta cargar cliente:', response); // Debug
        
        // El servidor puede devolver response.data o directamente response
        const datosCliente = response.data || response;
        
        if (datosCliente && (datosCliente._id || datosCliente.email)) {
          this.cliente = datosCliente;
          
          // Formatear fecha de nacimiento para el input date
          if (this.cliente.f_nacimiento) {
            this.cliente.f_nacimiento = this.formatearFechaParaInput(this.cliente.f_nacimiento);
          }
          
          // Actualizar localStorage también
          localStorage.setItem('usuario', JSON.stringify(this.cliente));
          localStorage.setItem('nombre_cliente', this.cliente.nombres);
          
          this.load_data = false;
        } else {
          this.cliente = undefined;
          this.mostrarError('No se pudo cargar el perfil del usuario');
          this._router.navigate(['/login']);
        }
      },
      error => {
        console.error('Error cargando cliente:', error);
        this.load_data = false;
        this.manejarErrorAutenticacion(error);
      }
    );
  }

  /**
   * Formatea fecha para el input type="date" (YYYY-MM-DD)
   */
  private formatearFechaParaInput(fecha: string): string {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      const anio = fechaObj.getFullYear();
      const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaObj.getDate()).padStart(2, '0');
      
      return `${anio}-${mes}-${dia}`;
    } catch (e) {
      console.error('Error formateando fecha:', e);
      return '';
    }
  }

  /**
   * Valida que el nombre solo contenga letras y espacios
   */
  validarNombre(event: any, campo: string): void {
    const input = event.target;
    const valor = input.value;
    
    // Permitir solo letras, espacios, acentos y ñ
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    
    if (!regex.test(valor)) {
      input.value = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      this.cliente[campo] = input.value;
    }
  }

  /**
   * Aplica máscara al DUI (00000000-0)
   */
  aplicarMascaraDUI(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo números
    
    if (valor.length > 9) {
      valor = valor.substring(0, 9);
    }
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8) + '-' + valor.substring(8);
    }
    
    event.target.value = valor;
    this.cliente.dui = valor;
  }

  /**
   * Aplica máscara al teléfono (0000-0000)
   */
  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo números
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }
    
    if (valor.length > 4) {
      valor = valor.substring(0, 4) + '-' + valor.substring(4);
    }
    
    event.target.value = valor;
    this.cliente.telefono = valor;
  }

  /**
   * Valida el formato del DUI
   */
  validarDUI(): boolean {
    if (!this.cliente.dui) return false;
    const regex = /^\d{8}-\d$/;
    return regex.test(this.cliente.dui);
  }

  /**
   * Valida el formato del teléfono
   */
  validarTelefono(): boolean {
    if (!this.cliente.telefono) return false;
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(this.cliente.telefono);
  }

  /**
   * Valida que la edad sea mayor o igual a 16 años
   */
  validarEdad(): boolean {
    if (!this.cliente.f_nacimiento) return false;
    
    const fechaNacimiento = new Date(this.cliente.f_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    
    return edad >= 16;
  }

  /**
   * Valida el email
   */
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    const input = $('#input_password');
    input.attr('type', this.mostrarPassword ? 'text' : 'password');
  }

  /**
   * Actualiza el perfil del cliente
   */
  actualizar(actualizarForm): void {
    if (!actualizarForm.valid) {
      this.mostrarError('Por favor complete todos los campos correctamente');
      return;
    }

    // Validaciones específicas
    if (!this.validarDUI()) {
      this.mostrarError('El formato del DUI es inválido. Debe ser 00000000-0');
      return;
    }

    if (!this.validarTelefono()) {
      this.mostrarError('El formato del teléfono es inválido. Debe ser 0000-0000');
      return;
    }

    if (!this.validarEdad()) {
      this.mostrarError('Debe tener al menos 16 años para registrarse');
      return;
    }

    if (!this.validarEmail(this.cliente.email)) {
      this.mostrarError('El formato del correo electrónico es inválido');
      return;
    }

    // Validar nombres (solo letras y espacios)
    const regexNombres = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexNombres.test(this.cliente.nombres)) {
      this.mostrarError('Los nombres solo pueden contener letras');
      return;
    }

    if (!regexNombres.test(this.cliente.apellidos)) {
      this.mostrarError('Los apellidos solo pueden contener letras');
      return;
    }

    // Obtener contraseña del input (si fue modificada)
    const password = $('#input_password').val();
    const datosActualizar = { ...this.cliente };

    if (password && password.trim() !== '') {
      if (password.trim().length < 6) {
        this.mostrarError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      datosActualizar.password = password.trim();
    } else {
      // No enviar campo password si está vacío
      delete datosActualizar.password;
    }

    this.load_data = true;
    this._clienteService.actualizar_perfil_cliente_guest(this.id, datosActualizar, this.token).subscribe(
      response => {
        console.log('Respuesta actualización:', response); // Debug
        
        // Verificar diferentes formatos de respuesta del servidor
        const datosActualizados = response.data || response;
        
        // Verificar si hay datos válidos en la respuesta
        if (datosActualizados && (datosActualizados._id || datosActualizados.email)) {
          // Actualización exitosa con datos completos
          localStorage.setItem('usuario', JSON.stringify(datosActualizados));
          localStorage.setItem('nombre_cliente', datosActualizados.nombres);

          this.cliente = datosActualizados;
          
          if (this.cliente.f_nacimiento) {
            this.cliente.f_nacimiento = this.formatearFechaParaInput(this.cliente.f_nacimiento);
          }

          this.mostrarExito('Perfil actualizado correctamente');

          $('#input_password').val('');
          this.mostrarPassword = false;

          window.dispatchEvent(new Event('storage'));
          
          this.load_data = false;
        } else if (response.message || response.msg) {
          // Respuesta exitosa pero sin datos completos (común al cambiar contraseña)
          const mensaje = response.message || response.msg || 'Perfil actualizado correctamente';
          this.mostrarExito(mensaje);
          
          $('#input_password').val('');
          this.mostrarPassword = false;
          
          // Recargar datos del servidor para asegurar sincronización
          this.cargarCliente();
        } else {
          // No hay datos ni mensaje - asumir éxito si no hay error
          this.mostrarExito('Perfil actualizado correctamente');
          
          $('#input_password').val('');
          this.mostrarPassword = false;
          
          // Recargar datos del servidor
          this.cargarCliente();
        }
      },
      error => {
        console.error('Error actualizando perfil:', error);
        this.load_data = false;
        
        // Si el error no es de autenticación, mostrar mensaje específico
        if (error.status !== 401 && error.status !== 403) {
          this.mostrarError(error.error?.message || error.error?.msg || 'Error al actualizar el perfil');
        } else {
          this.manejarErrorAutenticacion(error);
        }
      }
    );
  }

  /**
   * Maneja errores de autenticación
   */
  private manejarErrorAutenticacion(error: any): void {
    if (error.status === 401 || error.status === 403) {
      localStorage.clear();
      this.mostrarError('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      setTimeout(() => {
        this._router.navigate(['/login']);
      }, 2000);
    } else {
      this.mostrarError(error.error?.message || error.error?.msg || 'Ocurrió un error inesperado');
    }
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    iziToast.success({
      title: 'ÉXITO',
      titleColor: '#1DC74C',
      color: '#FFF',
      class: 'text-success',
      position: 'topRight',
      message: mensaje
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'ERROR',
      titleColor: '#FF0000',
      color: '#FFF',
      class: 'text-danger',
      position: 'topRight',
      message: mensaje
    });
  }
}