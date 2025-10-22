import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-edit-cliente',
  templateUrl: './edit-cliente.component.html',
  styleUrls: ['./edit-cliente.component.css']
})
export class EditClienteComponent implements OnInit {

  public cliente: any = undefined;
  public id: string;
  public token: string;
  public load_btn = false;
  public load_data = true;
  public mostrarPassword = false;
  public fecha_maxima: string = '';
  public fecha_minima: string = '1900-01-01';

  constructor(
    private _route: ActivatedRoute,
    private _clienteService: ClienteService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken() || '';
    if (!this.token) {
      this._router.navigate(['/login']);
    }
    this.calcularFechaMaxima();
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.init_data();
      } else {
        this.load_data = false;
        this.mostrarError('ID de cliente no válido.');
        this._router.navigate(['/panel/clientes']);
      }
    });
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
   * Carga los datos del cliente
   */
  init_data() {
    this.load_data = true;
    this._clienteService.obtener_cliente_admin(this.id, this.token).subscribe(
      response => {
        console.log('Respuesta obtener cliente:', response);
        
        const datosCliente = response.data || response;
        
        if (datosCliente && (datosCliente._id || datosCliente.email)) {
          this.cliente = datosCliente;
          
          // IMPORTANTE: Eliminar la contraseña encriptada del objeto
          // La contraseña nunca debe mostrarse, ni siquiera encriptada
          delete this.cliente.password;
          
          // Formatear la fecha para el input type="date"
          if (this.cliente.f_nacimiento) {
            this.cliente.f_nacimiento = this.formatearFechaParaInput(this.cliente.f_nacimiento);
          }
          
          this.load_data = false;
        } else {
          this.cliente = undefined;
          this.load_data = false;
          this.mostrarError('Cliente no encontrado.');
        }
      }, 
      error => {
        console.error('Error obteniendo cliente:', error);
        this.cliente = undefined;
        this.load_data = false;
        this.mostrarError('Error al obtener los datos del cliente.');
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
    let valor = event.target.value.replace(/\D/g, '');
    
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
    let valor = event.target.value.replace(/\D/g, '');
    
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
   * Valida el formato del DUI (opcional)
   */
  validarDUI(): boolean {
    if (!this.cliente.dui || this.cliente.dui.trim() === '') {
      return true; // DUI es opcional
    }
    const regex = /^\d{8}-\d$/;
    return regex.test(this.cliente.dui);
  }

  /**
   * Valida el formato del teléfono
   */
  validarTelefono(): boolean {
    if (!this.cliente.telefono || this.cliente.telefono.trim() === '') {
      return true; // Teléfono opcional
    }
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(this.cliente.telefono);
  }

  /**
   * Valida que la edad sea mayor o igual a 16 años
   */
  validarEdad(): boolean {
    if (!this.cliente.f_nacimiento) {
      return true; // Fecha opcional
    }
    
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
   * Alterna la visibilidad de la contraseña
   */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Actualiza el cliente
   */
  actualizar(updateForm: NgForm) {
    if (updateForm.invalid) {
      Object.keys(updateForm.controls).forEach(key => {
        updateForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validaciones adicionales
    if (!this.validarTelefono()) {
      this.mostrarError('El formato del teléfono es inválido. Debe ser 0000-0000');
      return;
    }

    if (!this.validarDUI()) {
      this.mostrarError('El formato del DUI es inválido. Debe ser 00000000-0');
      return;
    }

    if (!this.validarEdad()) {
      this.mostrarError('El cliente debe tener al menos 16 años');
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

    // Preparar datos para actualizar
    const datosActualizar = { ...this.cliente };

    // Si hay contraseña y no está vacía, validar longitud
    if (datosActualizar.password && datosActualizar.password.trim() !== '') {
      if (datosActualizar.password.trim().length < 6) {
        this.mostrarError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    } else {
      // No enviar contraseña si está vacía
      delete datosActualizar.password;
    }

    // Limpiar campos vacíos opcionales
    if (!datosActualizar.dui || datosActualizar.dui.trim() === '') {
      delete datosActualizar.dui;
    }
    if (!datosActualizar.telefono || datosActualizar.telefono.trim() === '') {
      delete datosActualizar.telefono;
    }
    if (!datosActualizar.f_nacimiento) {
      delete datosActualizar.f_nacimiento;
    }
    if (!datosActualizar.genero) {
      delete datosActualizar.genero;
    }
    if (!datosActualizar.pais) {
      delete datosActualizar.pais;
    }

    this.load_btn = true;
    this._clienteService.actualizar_cliente_admin(this.id, datosActualizar, this.token).subscribe(
      response => {
        console.log('Respuesta actualización:', response);
        
        const datosActualizados = response.data || response;
        
        if (datosActualizados && (datosActualizados._id || datosActualizados.email)) {
          // Actualización exitosa con datos completos
          this.cliente = datosActualizados;
          
          if (this.cliente.f_nacimiento) {
            this.cliente.f_nacimiento = this.formatearFechaParaInput(this.cliente.f_nacimiento);
          }

          iziToast.success({
            title: 'ÉXITO',
            message: 'Cliente actualizado correctamente.',
            position: 'topRight'
          });

          this.load_btn = false;
          this._router.navigate(['/panel/clientes']);
        } else if (response.message || response.msg) {
          // Respuesta exitosa pero sin datos completos
          const mensaje = response.message || response.msg || 'Cliente actualizado correctamente.';
          
          iziToast.success({
            title: 'ÉXITO',
            message: mensaje,
            position: 'topRight'
          });

          this.load_btn = false;
          
          // Recargar datos del cliente
          this.init_data();
          
          // Opcional: redirigir después de un breve delay
          setTimeout(() => {
            this._router.navigate(['/panel/clientes']);
          }, 1500);
        } else {
          // Asumir éxito si no hay error HTTP
          iziToast.success({
            title: 'ÉXITO',
            message: 'Cliente actualizado correctamente.',
            position: 'topRight'
          });

          this.load_btn = false;
          this._router.navigate(['/panel/clientes']);
        }
      }, 
      error => {
        console.error('Error en el servidor:', error);
        const errorMsg = error.error?.message || error.error?.msg || 'Ocurrió un error inesperado, por favor intenta más tarde.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
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