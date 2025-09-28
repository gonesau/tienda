import { Component, OnInit } from '@angular/core';
import { CuponService } from 'src/app/services/cupon.service';
declare var jQuery: any;
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-index-cupon',
  templateUrl: './index-cupon.component.html',
  styleUrls: ['./index-cupon.component.css'],
})
export class IndexCuponComponent implements OnInit {
  public page = 1;
  public pageSize = 10;
  public token;
  public load_data = true;
  public cupones: Array<any> = [];
  public filtro = '';

  constructor(private _cuponService: CuponService) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._cuponService
      .listar_cupones_admin(this.filtro, this.token)
      .subscribe((response) => {
        this.cupones = response.data;
        this.load_data = false;
      });
  }

  filtrar() {
    this._cuponService
      .listar_cupones_admin(this.filtro, this.token)
      .subscribe((response) => {
        this.cupones = response.data;
        this.load_data = false;
      });
  }

  eliminar(id) {
    this._cuponService.eliminar_cupon_admin(id, this.token).subscribe(
      (response) => {
        if (response.data) {
          iziToast.show({
            title: 'Éxito',
            message: 'Cupón eliminado correctamente',
            position: 'topRight',
            class: 'text-success',
            titleColor: '#1DC74C',
          });
          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          this._cuponService
            .listar_cupones_admin(this.filtro, this.token)
            .subscribe((response) => {
              this.cupones = response.data;
              this.load_data = false;
            });
        } else {
          iziToast.error({
            title: 'Error',
            message: 'No se pudo eliminar el cupón',
            position: 'topRight',
          });
        }
      },
      (error) => {
        iziToast.error({
          title: 'Error',
          message: 'Ocurrió un problema con el servidor',
          position: 'topRight',
        });
        console.log(error);
      }
    );
  }
}
