import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { ClienteService } from 'src/app/services/cliente.service';
declare var iziToast: any;

@Component({
  selector: 'app-create-cliente',
  templateUrl: './create-cliente.component.html',
  styleUrls: ['./create-cliente.component.css']
})
export class CreateClienteComponent implements OnInit {

  public cliente: any = {
    genero: ''
  };


  public token;
  public load_btn = false;

  constructor(
    private _clienteService: ClienteService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken();
  }

  ngOnInit(): void {
  }

registro(registroForm) {
  // Validar campos vacíos manualmente
  if (
    !this.cliente.nombres ||
    !this.cliente.apellidos ||
    !this.cliente.email ||
    !this.cliente.telefono ||
    !this.cliente.f_nacimiento ||
    !this.cliente.dui ||
    !this.cliente.genero
  ) {
    iziToast.warning({
      title: 'Campos incompletos',
      message: 'Por favor completa todos los campos requeridos antes de continuar.',
      position: 'topRight',
      titleColor: '#FFA500',
      color: '#FFF',
    });
    return;
  }

  // Validar formato de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.cliente.email)) {
    iziToast.warning({
      title: 'Correo inválido',
      message: 'Por favor ingresa un correo electrónico válido.',
      position: 'topRight',
      titleColor: '#FFA500',
      color: '#FFF',
    });
    return;
  }

  // Validación general del formulario
  if (registroForm.valid) {
    this.load_btn = true;

    this._clienteService.registro_cliente_admin(this.cliente, this.token).subscribe(
      response => {
        iziToast.success({
          title: 'Éxito',
          message: 'Cliente registrado correctamente.',
          position: 'topRight',
          titleColor: '#1DC74C',
          color: '#FFF',
        });

        // Reiniciar formulario
        this.cliente = {
          nombres: '',
          apellidos: '',
          email: '',
          telefono: '',
          f_nacimiento: '',
          dui: '',
          genero: '',
        };
        registroForm.resetForm();

        this.load_btn = false;
        this._router.navigate(['/panel/clientes']);
      },
      error => {
        console.error(error);
        iziToast.error({
          title: 'Error',
          message: 'Ocurrió un error al registrar el cliente.',
          position: 'topRight',
          titleColor: '#FF0000',
          color: '#FFF',
        });
        this.load_btn = false;
      }
    );
  } else {
    iziToast.warning({
      title: 'Campos incompletos',
      message: 'Por favor revisa que todos los campos estén correctamente llenos.',
      position: 'topRight',
      titleColor: '#FFA500',
      color: '#FFF',
    });
  }
}


}
