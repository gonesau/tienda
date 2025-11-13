import { Component, OnInit, OnDestroy } from '@angular/core';
import { GuestService } from 'src/app/services/guest.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
declare var iziToast: any;

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit, OnDestroy {
  public contacto: any = {
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  };

  public btn_enviar = false;
  public mensajeEnviado = false;
  private destroy$ = new Subject<void>();

  constructor(private _guestService: GuestService) {}

  ngOnInit(): void {
    // Precargar datos del usuario si está autenticado
    this.cargarDatosUsuario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga datos del usuario desde localStorage si está autenticado
   */
  private cargarDatosUsuario(): void {
    try {
      const usuario = localStorage.getItem('usuario');
      if (usuario) {
        const datosUsuario = JSON.parse(usuario);
        this.contacto.nombre = `${datosUsuario.nombres || ''} ${datosUsuario.apellidos || ''}`.trim();
        this.contacto.email = datosUsuario.email || '';
        this.contacto.telefono = datosUsuario.telefono || '';
      }
    } catch (e) {
      console.error('Error cargando datos del usuario:', e);
    }
  }

  /**
   * Valida el nombre (solo letras y espacios)
   */
  validarNombre(event: any): void {
    const input = event.target;
    const valor = input.value;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

    if (!regex.test(valor)) {
      input.value = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      this.contacto.nombre = input.value;
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
    
    this.contacto.telefono = valor;
    
    setTimeout(() => {
      event.target.value = valor;
    }, 0);
  }

  /**
   * Valida el email
   */
  validarEmail(): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(this.contacto.email);
  }

  /**
   * Valida el teléfono (formato 0000-0000)
   */
  validarTelefono(): boolean {
    if (!this.contacto.telefono || this.contacto.telefono.trim() === '') {
      return true; // El teléfono es opcional
    }
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(this.contacto.telefono);
  }

  /**
   * Valida todo el formulario
   */
  private validarFormulario(): { valido: boolean; mensaje?: string } {
    // Validar nombre
    if (!this.contacto.nombre || this.contacto.nombre.trim().length < 3) {
      return { 
        valido: false, 
        mensaje: 'El nombre debe tener al menos 3 caracteres' 
      };
    }

    if (this.contacto.nombre.length > 100) {
      return { 
        valido: false, 
        mensaje: 'El nombre no puede exceder 100 caracteres' 
      };
    }

    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexNombre.test(this.contacto.nombre)) {
      return { 
        valido: false, 
        mensaje: 'El nombre solo puede contener letras' 
      };
    }

    // Validar email
    if (!this.contacto.email || !this.validarEmail()) {
      return { 
        valido: false, 
        mensaje: 'Por favor ingresa un email válido' 
      };
    }

    if (this.contacto.email.length > 100) {
      return { 
        valido: false, 
        mensaje: 'El email no puede exceder 100 caracteres' 
      };
    }

    // Validar teléfono (si está presente)
    if (this.contacto.telefono && this.contacto.telefono.trim() !== '') {
      if (!this.validarTelefono()) {
        return { 
          valido: false, 
          mensaje: 'El formato del teléfono es inválido. Debe ser 0000-0000' 
        };
      }
    }

    // Validar asunto
    if (!this.contacto.asunto || this.contacto.asunto.trim().length < 3) {
      return { 
        valido: false, 
        mensaje: 'El asunto debe tener al menos 3 caracteres' 
      };
    }

    if (this.contacto.asunto.length > 200) {
      return { 
        valido: false, 
        mensaje: 'El asunto no puede exceder 200 caracteres' 
      };
    }

    // Validar mensaje
    if (!this.contacto.mensaje || this.contacto.mensaje.trim().length < 10) {
      return { 
        valido: false, 
        mensaje: 'El mensaje debe tener al menos 10 caracteres' 
      };
    }

    if (this.contacto.mensaje.length > 2000) {
      return { 
        valido: false, 
        mensaje: 'El mensaje no puede exceder 2000 caracteres' 
      };
    }

    return { valido: true };
  }

  /**
   * Envía el mensaje de contacto
   */
  enviar_mensaje(contactoForm: any): void {
    if (!contactoForm.valid) {
      this.mostrarError('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validaciones adicionales
    const validacion = this.validarFormulario();
    if (!validacion.valido) {
      this.mostrarError(validacion.mensaje!);
      return;
    }

    this.btn_enviar = true;

    // Preparar datos limpios
    const datos = {
      nombre: this.contacto.nombre.trim(),
      email: this.contacto.email.trim().toLowerCase(),
      telefono: this.contacto.telefono ? this.contacto.telefono.trim() : '',
      asunto: this.contacto.asunto.trim(),
      mensaje: this.contacto.mensaje.trim()
    };

    this._guestService.enviar_mensaje_contacto(datos)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.btn_enviar = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          
          if (response.success) {
            this.mensajeEnviado = true;
            this.mostrarExito(
              response.message || 
              '¡Mensaje enviado exitosamente! Te responderemos pronto a tu correo.'
            );
            this.resetearFormulario(contactoForm);
            
            // Scroll suave al inicio del formulario
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            this.mostrarError(response.message || 'Error al enviar el mensaje');
          }
        },
        error: (error) => {
          console.error('Error enviando mensaje:', error);
          
          let mensaje = 'Error al enviar el mensaje. Por favor intenta nuevamente.';
          
          if (error.status === 429) {
            mensaje = 'Has alcanzado el límite de mensajes. Por favor intenta más tarde.';
          } else if (error.error?.message) {
            mensaje = error.error.message;
          } else if (error.message) {
            mensaje = error.message;
          }
          
          this.mostrarError(mensaje);
        }
      });
  }

  /**
   * Resetea el formulario
   */
  private resetearFormulario(form: any): void {
    // Mantener nombre y email si está autenticado
    const usuario = localStorage.getItem('usuario');
    
    if (usuario) {
      const datosUsuario = JSON.parse(usuario);
      this.contacto = {
        nombre: `${datosUsuario.nombres || ''} ${datosUsuario.apellidos || ''}`.trim(),
        email: datosUsuario.email || '',
        telefono: datosUsuario.telefono || '',
        asunto: '',
        mensaje: ''
      };
    } else {
      this.contacto = {
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
      };
    }

    form.resetForm(this.contacto);
    
    // Ocultar mensaje de éxito después de 10 segundos
    setTimeout(() => {
      this.mensajeEnviado = false;
    }, 10000);
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
      timeout: 7000
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
      timeout: 5000
    });
  }

  /**
   * Muestra mensaje de advertencia
   */
  mostrarAdvertencia(mensaje: string): void {
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