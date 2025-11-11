import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DescuentoService } from 'src/app/services/descuento.service';
import { Global } from 'src/app/services/global';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-edit-descuento',
  templateUrl: './edit-descuento.component.html',
  styleUrls: ['./edit-descuento.component.css']
})
export class EditDescuentoComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  public descuento: any = null;
  public id: string = '';
  public token: string;
  public load_btn = false;
  public load_data = true;
  public file: File | undefined;
  public imgSelect: any | ArrayBuffer;
  public url: string;
  public fechaMinima: string = '';

  constructor(
    private _route: ActivatedRoute,
    private _descuentoService: DescuentoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;

    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.calcularFechaMinima();
    
    this._route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.init_data();
      } else {
        this.load_data = false;
        this.mostrarError('ID de descuento no válido');
        this._router.navigate(['/panel/descuentos']);
      }
    });
  }

  /**
   * Calcula la fecha mínima (hoy)
   */
  private calcularFechaMinima(): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.fechaMinima = `${anio}-${mes}-${dia}`;
  }

  /**
   * Carga los datos del descuento
   */
  init_data(): void {
    this.load_data = true;
    
    this._descuentoService.obtener_descuento_admin(this.id, this.token).subscribe(
      (response) => {
        const datosDescuento = response.data || response;
        
        if (datosDescuento && datosDescuento._id) {
          this.descuento = datosDescuento;
          
          // Formatear fechas para input type="date"
          if (this.descuento.fecha_inicio) {
            this.descuento.fecha_inicio = this.formatearFechaParaInput(this.descuento.fecha_inicio);
          }
          if (this.descuento.fecha_fin) {
            this.descuento.fecha_fin = this.formatearFechaParaInput(this.descuento.fecha_fin);
          }
          
          // Mostrar imagen actual
          this.imgSelect = this.url + 'obtener_banner_descuento/' + this.descuento.banner;
          
          this.load_data = false;
        } else {
          this.descuento = null;
          this.load_data = false;
          this.mostrarError('Descuento no encontrado');
        }
      },
      (error) => {
        console.error('Error al obtener descuento:', error);
        this.descuento = null;
        this.load_data = false;
        this.mostrarError('Error al cargar los datos del descuento');
      }
    );
  }

  /**
   * Formatea fecha para input type="date" (YYYY-MM-DD)
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
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const files = event.target.files;
    
    if (!files || !files[0]) {
      return;
    }

    const file = <File>files[0];

    // Validar tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB');
      this.file = undefined;
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
      return;
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('Formato inválido. Usa PNG, JPG, JPEG o WEBP');
      this.file = undefined;
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
      return;
    }

    // Archivo válido
    this.file = file;

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imgSelect = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Actualiza el descuento
   */
  actualizar(actualizarForm: NgForm): void {
    // Validar formulario
    if (actualizarForm.invalid) {
      Object.keys(actualizarForm.controls).forEach(key => {
        actualizarForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    // Validar porcentaje
    if (!this.descuento.descuento || this.descuento.descuento <= 0 || this.descuento.descuento > 100) {
      this.mostrarError('El porcentaje debe estar entre 1 y 100');
      return;
    }

    // Validar fechas
    if (!this.descuento.fecha_inicio || !this.descuento.fecha_fin) {
      this.mostrarError('Debes especificar las fechas de inicio y fin');
      return;
    }

    const fechaInicio = new Date(this.descuento.fecha_inicio);
    const fechaFin = new Date(this.descuento.fecha_fin);

    // Validar que la fecha de fin sea posterior a la de inicio
    if (fechaFin <= fechaInicio) {
      this.mostrarError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    // Preparar datos
    const dataActualizar: any = {
      titulo: this.descuento.titulo.trim(),
      descuento: parseFloat(this.descuento.descuento),
      fecha_inicio: this.descuento.fecha_inicio,
      fecha_fin: this.descuento.fecha_fin
    };

    // Agregar banner solo si se cambió
    if (this.file) {
      dataActualizar.banner = this.file;
    }

    this.load_btn = true;

    this._descuentoService.actualizar_descuento_admin(this.id, dataActualizar, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Descuento actualizado correctamente',
          position: 'topRight',
        });
        
        this.load_btn = false;
        
        setTimeout(() => {
          this._router.navigate(['/panel/descuentos']);
        }, 1000);
      },
      (error) => {
        console.error('Error al actualizar:', error);
        const errorMsg = error.error?.message || 'Error al actualizar el descuento';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  /**
   * Calcula cuántos días durará la promoción
   */
  calcularDuracionDias(): number {
    if (!this.descuento.fecha_inicio || !this.descuento.fecha_fin) {
      return 0;
    }

    const fechaInicio = new Date(this.descuento.fecha_inicio);
    const fechaFin = new Date(this.descuento.fecha_fin);
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Verifica si el descuento está activo
   */
  esDescuentoActivo(): boolean {
    if (!this.descuento) return false;
    
    const hoy = new Date();
    const fechaInicio = new Date(this.descuento.fecha_inicio);
    const fechaFin = new Date(this.descuento.fecha_fin);
    
    return hoy >= fechaInicio && hoy <= fechaFin;
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