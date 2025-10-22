import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { NgForm } from '@angular/forms';
declare var iziToast: any;

@Component({
  selector: 'app-create-cliente',
  templateUrl: './create-cliente.component.html',
  styleUrls: ['./create-cliente.component.css']
})
export class CreateClienteComponent implements OnInit {

  public cliente: any = {
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
    f_nacimiento: '',
    dui: '',
    genero: '',
    pais: ''
  };

  public token: string;
  public load_btn = false;
  public mostrarPassword = false;
  public fecha_maxima: string = '';
  public fecha_minima: string = '1900-01-01';

  constructor(
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
      return true; // Teléfono opcional según tu formulario
    }
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(this.cliente.telefono);
  }

  /**
   * Valida que la edad sea mayor o igual a 16 años
   */
  validarEdad(): boolean {
    if (!this.cliente.f_nacimiento) {
      return true; // Fecha opcional según tu formulario
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
   * Registra un nuevo cliente
   */
  registro(registroForm: NgForm) {
    if (registroForm.invalid) {
      Object.keys(registroForm.controls).forEach(key => {
        registroForm.controls[key].markAsTouched();
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

    // Validar contraseña
    if (!this.cliente.password || this.cliente.password.trim().length < 6) {
      this.mostrarError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Limpiar campos vacíos opcionales
    const datosCliente = { ...this.cliente };
    if (!datosCliente.dui || datosCliente.dui.trim() === '') {
      delete datosCliente.dui;
    }
    if (!datosCliente.telefono || datosCliente.telefono.trim() === '') {
      delete datosCliente.telefono;
    }
    if (!datosCliente.f_nacimiento) {
      delete datosCliente.f_nacimiento;
    }
    if (!datosCliente.genero) {
      delete datosCliente.genero;
    }
    if (!datosCliente.pais) {
      delete datosCliente.pais;
    }
    
    this.load_btn = true;
    this._clienteService.registro_cliente_admin(datosCliente, this.token).subscribe(
      response => {
        console.log('Respuesta registro:', response);
        
        const clienteCreado = response.data || response;
        
        if (clienteCreado && (clienteCreado._id || clienteCreado.email)) {
          iziToast.success({
            title: 'ÉXITO',
            message: 'Cliente registrado correctamente.',
            position: 'topRight',
          });

          this.load_btn = false;
          this._router.navigate(['/panel/clientes']);
        } else {
          this.mostrarError(response.message || 'Error en el servidor, no se pudo registrar el cliente.');
          this.load_btn = false;
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