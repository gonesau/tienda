import { Component, OnInit } from '@angular/core';
import { Global } from 'src/app/services/global';
import { ProductoService } from 'src/app/services/producto.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var $: any;
declare var iziToast: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css'],
})
export class IndexProductoComponent implements OnInit {
  public load_data = true;
  public filtro = '';
  public token;
  public productos: Array<any> = [];
  public arr_productos: Array<any> = [];
  public url;
  public page = 1;
  public pageSize = 10;
  public load_btn = false;

  constructor(private _productoService: ProductoService) {
    this.token = localStorage.getItem('token');
    this.url = Global.url;
  }

  ngOnInit(): void {
    this.init_data();
  }

  init_data() {
    this._productoService
      .listar_productos_admin(this.filtro, this.token)
      .subscribe(
        (response) => {
          console.log(response);
          this.productos = response.data;
          this.productos.forEach((element, index) => {
            this.arr_productos.push({
              '#': index + 1,
              Título: element.titulo,
              Stock: element.stock,
              Precio: element.precio,
              'Categoría': element.categoria,
              'N° de ventas': element.nventas,
            });
          });
          console.log(this.arr_productos);
          this.load_data = false;
        },
        (error) => {
          console.error(error);
        }
      );
  }

  filtrar() {
    if (this.filtro) {
      this._productoService
        .listar_productos_admin(this.filtro, this.token)
        .subscribe(
          (response) => {
            console.log(response);
            this.productos = response.data;
            this.load_data = false;
          },
          (error) => {
            console.error(error);
          }
        );
    } else {
      iziToast.show({
        title: 'Error',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Ingrese un filtro válido',
      });
    }
  }

  resetear() {
    this.filtro = '';
    this.init_data();
  }

  eliminar(id) {
    this.load_btn = true;
    this._productoService.eliminar_producto_admin(id, this.token).subscribe(
      (response) => {
          iziToast.show({
            title: 'Éxito',
            message: 'Producto eliminado correctamente',
            position: 'topRight',
            class: 'text-success',
            titleColor: '#1DC74C',
          });
          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          this.load_btn = false;
          this.init_data();
      },
      (error) => {
        iziToast.error({
          title: 'Error',
          message: 'Ocurrió un problema con el servidor',
          position: 'topRight',
        });
        console.log(error);
        this.load_btn = false;
      }
    );
  }

  download_excel() {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Reporte de Productos');
    worksheet.addRow(undefined);
    for (let x1 of this.arr_productos) {
      let x2 = Object.keys(x1);

      let temp = [];
      for (let y of x2) {
        temp.push(x1[y]);
      }
      worksheet.addRow(temp);
    }

    worksheet.columns = [
      { header: '#', key: '#', width: 5 },
      { header: 'Título', key: 'Título', width: 30 },
      { header: 'Stock', key: 'Stock', width: 10 },
      { header: 'Precio', key: 'Precio', width: 10 },
      { header: 'Categoría', key: 'Categoría', width: 15 },
      { header: 'N° de ventas', key: 'N° de ventas', width: 15 },
    ] as any;

    let fname = 'reporte_productos.xlsx';

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      fs.saveAs(blob, fname);
    }); 
  }

}
