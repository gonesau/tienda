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

  init_data() {
    this.load_data = true;
    this._clienteService.obtener_cliente_admin(this.id, this.token).subscribe(
      response => {
        if (response.data == undefined) {
          this.cliente = undefined;
        } else {
          this.cliente = response.data;
          // Formatear la fecha para el input type="date"
          if (this.cliente.f_nacimiento) {
             this.cliente.f_nacimiento = new Date(this.cliente.f_nacimiento).toISOString().split('T')[0];
          }
        }
        this.load_data = false;
      }, 
      error => {
        console.log(error);
        this.cliente = undefined;
        this.load_data = false;
        this.mostrarError('Error al obtener los datos del cliente.');
      }
    );
  }


  actualizar(updateForm: NgForm) {
    if (updateForm.invalid) {
      Object.keys(updateForm.controls).forEach(key => {
        updateForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    this.load_btn = true;
    this._clienteService.actualizar_cliente_admin(this.id, this.cliente, this.token).subscribe(
      response => {
        if (response.data) {
           iziToast.success({
            title: 'ÉXITO',
            message: 'Cliente actualizado correctamente.',
            position: 'topRight'
          });
          this.load_btn = false;
          this._router.navigate(['/panel/clientes']);
        } else {
          this.mostrarError(response.message || 'Error al actualizar el cliente.');
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
