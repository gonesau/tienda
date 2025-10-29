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
  public fechaMaxima: string = '';
  public fechaMinima: string = '1900-01-01';

  constructor(
    private _clienteService: ClienteService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken() || '';
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.calcularFechaMaxima();
  }

  /**
   * Calcula la fecha máxima permitida (16 años atrás)
   */
  private calcularFechaMaxima(): void {
    const hoy = new Date();
    const anioMaximo = hoy.getFullYear() - 16;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.fechaMaxima = `${anioMaximo}-${mes}-${dia}`;
  }

  /**
   * Valida que solo se ingresen letras y espacios
   */
  validarTexto(event: any, campo: string): void {
    const input = event.target;
    const valor = input.value;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    
    if (!regex.test(valor)) {
      input.value = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      this.cliente[campo] = input.value;
    }
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
   * Toggle visibilidad de contraseña
   */
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Valida y registra el cliente
   */
  registro(registroForm: NgForm): void {
    // Validar formulario
    if (registroForm.invalid) {
      Object.keys(registroForm.controls).forEach(key => {
        registroForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validar edad si hay fecha de nacimiento
    if (this.cliente.f_nacimiento && !this.validarEdad()) {
      this.mostrarError('El cliente debe tener al menos 16 años');
      return;
    }

    // Validar formato de teléfono si existe
    if (this.cliente.telefono && !this.validarTelefono()) {
      this.mostrarError('El formato del teléfono es inválido. Debe ser 0000-0000');
      return;
    }

    // Validar formato de DUI si existe
    if (this.cliente.dui && !this.validarDUI()) {
      this.mostrarError('El formato del DUI es inválido. Debe ser 00000000-0');
      return;
    }

    // Preparar datos (limpiar campos vacíos)
    const datosCliente = { ...this.cliente };
    
    // Limpiar email
    datosCliente.email = datosCliente.email.trim().toLowerCase();
    
    // Limpiar campos opcionales vacíos
    Object.keys(datosCliente).forEach(key => {
      if (datosCliente[key] === '' || datosCliente[key] === null) {
        delete datosCliente[key];
      }
    });

    // Enviar al servidor
    this.load_btn = true;
    this._clienteService.registro_cliente_admin(datosCliente, this.token).subscribe(
      response => {
        if (response.data || response._id) {
          iziToast.success({
            title: 'Éxito',
            message: 'Cliente registrado correctamente',
            position: 'topRight',
          });
          this._router.navigate(['/panel/clientes']);
        } else {
          this.mostrarError(response.message || 'Error al registrar el cliente');
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error en el servidor:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error inesperado';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Valida que la edad sea mayor o igual a 16 años
   */
  private validarEdad(): boolean {
    if (!this.cliente.f_nacimiento) return true;
    
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
   * Valida formato de teléfono
   */
  private validarTelefono(): boolean {
    if (!this.cliente.telefono || this.cliente.telefono.trim() === '') return true;
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(this.cliente.telefono);
  }

  /**
   * Valida formato de DUI
   */
  private validarDUI(): boolean {
    if (!this.cliente.dui || this.cliente.dui.trim() === '') return true;
    const regex = /^\d{8}-\d$/;
    return regex.test(this.cliente.dui);
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