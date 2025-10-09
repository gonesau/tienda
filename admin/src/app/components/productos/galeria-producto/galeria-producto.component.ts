import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { v4 as uuidv4 } from 'uuid';
declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-galeria-producto',
  templateUrl: './galeria-producto.component.html',
  styleUrls: ['./galeria-producto.component.css']
})
export class GaleriaProductoComponent implements OnInit {

  public producto: any = {};
  public id: any;
  public token: any;
  public file: File | undefined;
  public preview: string | ArrayBuffer | null = null;
  public load_data = false;
  public load_btn = false;
  public load_btn_eliminar = false;
  public url: string;
  private deleteTarget: any = null;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token');
    this.url = this._productoService.url;
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this.init_data();
    });
  }

  ngOnInit(): void {}

  init_data() {
    this._productoService.obtener_producto_admin(this.id, this.token).subscribe(
      (response) => {
        this.producto = response.data || {};
      },
      (error) => console.error(error)
    );
  }

  fileChangeEvent(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = <File>event.target.files[0];

      if (file.size > 5000000) {
        return this.errorToast('La imagen no puede superar los 5MB');
      }

      if (!['image/png', 'image/webp', 'image/jpg', 'image/jpeg'].includes(file.type)) {
        return this.errorToast('Formato inválido: debe ser PNG, WEBP, JPG o JPEG');
      }

      this.file = file;

      const reader = new FileReader();
      reader.onload = (e) => (this.preview = e.target?.result);
      reader.readAsDataURL(file);
    }
  }

  subir_imagen() {
    if (!this.file) {
      return this.errorToast('Debe seleccionar una imagen');
    }

    const data = { imagen: this.file, _id: uuidv4() };
    this.load_btn = true;

    this._productoService.agregar_imagen_galeria_admin(this.id, data, this.token).subscribe(
      (response) => {
        this.successToast('Se agregó la imagen correctamente');
        this.load_btn = false;
        this.file = undefined;
        this.preview = null;
        this.init_data();
      },
      (error) => {
        console.error(error);
        this.load_btn = false;
      }
    );
  }

  openDeleteModal(img: any) {
    this.deleteTarget = img;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    this.load_btn_eliminar = true;

    this._productoService.eliminar_imagen_galeria_admin(this.id, this.deleteTarget, this.token).subscribe(
      (response) => {
        this.successToast('Se eliminó la imagen correctamente');
        this.load_btn_eliminar = false;
        this.init_data();
        this.deleteTarget = null;
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      },
      (error) => {
        console.error(error);
        this.load_btn_eliminar = false;
      }
    );
  }

  private successToast(msg: string) {
    iziToast.show({
      title: 'Éxito',
      message: msg,
      color: '#28a745',
      position: 'topRight',
    });
  }

  private errorToast(msg: string) {
    iziToast.show({
      title: 'Error',
      message: msg,
      color: '#dc3545',
      position: 'topRight',
    });
  }
}
