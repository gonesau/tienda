import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DescuentoService } from 'src/app/services/descuento.service';
import { NgForm } from '@angular/forms';

declare var iziToast: any;

@Component({
  selector: 'app-create-descuento',
  templateUrl: './create-descuento.component.html',
  styleUrls: ['./create-descuento.component.css']
})
export class CreateDescuentoComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  public descuento: any = {
    titulo: '',
    descuento: null,
    fecha_inicio: '',
    fecha_fin: ''
  };

  public token: string;
  public load_btn = false;
  public file: File | undefined;
  public imgSelect: any | ArrayBuffer = 'assets/img/no-image.png';
  public fechaMinima: string = '';

  constructor(
    private _descuentoService: DescuentoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.calcularFechaMinima();
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
   * Maneja el cambio de archivo
   */
  fileChangeEvent(event: any): void {
    const files = event.target.files;
    
    if (!files || !files[0]) {
      this.resetFileInput();
      return;
    }

    const file = <File>files[0];

    // Validar tamaño (máx 5MB)
    if (file.size > 5000000) {
      this.mostrarError('La imagen no puede superar los 5MB');
      this.resetFileInput();
      return;
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.mostrarError('Formato inválido. Usa PNG, JPG, JPEG o WEBP');
      this.resetFileInput();
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
   * Resetea el input de archivo
   */
  private resetFileInput(): void {
    this.file = undefined;
    this.imgSelect = 'assets/img/no-image.png';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Registra el descuento
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

    // Validar banner
    if (!this.file) {
      this.mostrarError('Debes subir un banner para el descuento');
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
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Validar que la fecha de inicio no sea anterior a hoy
    if (fechaInicio < hoy) {
      this.mostrarError('La fecha de inicio no puede ser anterior a hoy');
      return;
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (fechaFin <= fechaInicio) {
      this.mostrarError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    // Preparar datos
    const dataDescuento = {
      titulo: this.descuento.titulo.trim(),
      descuento: parseFloat(this.descuento.descuento),
      fecha_inicio: this.descuento.fecha_inicio,
      fecha_fin: this.descuento.fecha_fin
    };

    this.load_btn = true;

    this._descuentoService.registro_descuento_admin(dataDescuento, this.file, this.token).subscribe(
      response => {
        if (response.data) {
          iziToast.success({
            title: 'Éxito',
            message: 'Descuento registrado correctamente',
            position: 'topRight',
          });
          
          setTimeout(() => {
            this._router.navigate(['/panel/descuentos']);
          }, 500);
        } else {
          this.mostrarError(response.message || 'No se pudo crear el descuento.');
        }
        this.load_btn = false;
      },
      error => {
        console.error('Error en el servidor:', error);
        const errorMsg = error.error?.message || 'Ocurrió un error inesperado. Intenta de nuevo.';
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