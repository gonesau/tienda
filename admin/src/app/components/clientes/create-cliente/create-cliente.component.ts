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
    genero: '',
    pais: ''
  };

  public token: string;
  public load_btn = false;

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
  }

  registro(registroForm: NgForm) {
    if (registroForm.invalid) {
      // Marcar todos los campos como "touched" para que se muestren los errores
      Object.keys(registroForm.controls).forEach(key => {
        registroForm.controls[key].markAsTouched();
      });
      
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }
    
    this.load_btn = true;
    this._clienteService.registro_cliente_admin(this.cliente, this.token).subscribe(
      response => {
        if (response.data) {
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
        const errorMsg = error.error?.message || 'Ocurrió un error inesperado, por favor intenta más tarde.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }
  
  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight',
    });
  }
}
