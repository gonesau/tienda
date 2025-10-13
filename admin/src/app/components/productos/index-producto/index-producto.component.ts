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

  // ===== CONFIGURACIÓN DE LA EMPRESA/TÍTULO =====
  // Título principal
  worksheet.mergeCells('A1:F1');
  let titleRow = worksheet.getCell('A1');
  titleRow.value = 'REPORTE DE PRODUCTOS';
  titleRow.font = { 
    name: 'Calibri', 
    size: 18, 
    bold: true, 
    color: { argb: 'FFFFFFFF' } 
  };
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' } // Azul oscuro
  };
  worksheet.getRow(1).height = 35;

  // Fecha de generación
  worksheet.mergeCells('A2:F2');
  let dateRow = worksheet.getCell('A2');
  dateRow.value = `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;
  dateRow.font = { name: 'Calibri', size: 10, italic: true };
  dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Fila vacía para separación
  worksheet.addRow([]);

  // ===== ENCABEZADOS DE LA TABLA =====
  let headerRow = worksheet.addRow(['#', 'Título', 'Stock', 'Precio', 'Categoría', 'N° de ventas']);
  
  // Estilo de los encabezados
  headerRow.eachCell((cell) => {
    cell.font = { 
      name: 'Calibri', 
      size: 12, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' } // Azul medio
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  worksheet.getRow(4).height = 25;

  // ===== DATOS DE LOS PRODUCTOS =====
  this.arr_productos.forEach((producto, index) => {
    let row = worksheet.addRow([
      producto['#'],
      producto['Título'],
      producto['Stock'],
      producto['Precio'],
      producto['Categoría'],
      producto['N° de ventas']
    ]);

    // Aplicar formato alternado a las filas (zebra striping)
    row.eachCell((cell, colNumber) => {
      // Bordes
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };

      // Color de fondo alternado
      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' } // Gris claro
        };
      }

      // Alineación según la columna
      if (colNumber === 1) { // Columna #
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 2) { // Columna Título
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else { // Resto de columnas (números)
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Formato de moneda para la columna de Precio
      if (colNumber === 4) {
        cell.numFmt = '$#,##0.00';
      }

      // Fuente
      cell.font = { name: 'Calibri', size: 11 };
    });

    row.height = 20;
  });

  // ===== CONFIGURACIÓN DE COLUMNAS =====
  worksheet.columns = [
    { key: '#', width: 8 },
    { key: 'Título', width: 35 },
    { key: 'Stock', width: 12 },
    { key: 'Precio', width: 15 },
    { key: 'Categoría', width: 20 },
    { key: 'N° de ventas', width: 15 }
  ];

  // ===== FILA DE RESUMEN (OPCIONAL) =====
  let summaryRowIndex = worksheet.rowCount + 1;
  worksheet.addRow([]);
  summaryRowIndex++;
  
  let summaryRow = worksheet.getRow(summaryRowIndex);
  worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
  
  let totalProductos = this.productos.length;
  let totalStock = this.productos.reduce((sum, p) => sum + (p.stock || 0), 0);
  let totalVentas = this.productos.reduce((sum, p) => sum + (p.nventas || 0), 0);

  summaryRow.getCell(1).value = 'RESUMEN';
  summaryRow.getCell(1).font = { bold: true, size: 11 };
  summaryRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
  
  summaryRow.getCell(3).value = `Stock Total: ${totalStock}`;
  summaryRow.getCell(3).font = { bold: true, size: 10 };
  summaryRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
  
  summaryRow.getCell(6).value = `Ventas Totales: ${totalVentas}`;
  summaryRow.getCell(6).font = { bold: true, size: 10 };
  summaryRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

  // ===== GENERAR Y DESCARGAR EL ARCHIVO =====
  let fname = `reporte_productos_${new Date().getTime()}.xlsx`;

  workbook.xlsx.writeBuffer().then((data) => {
    let blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    fs.saveAs(blob, fname);
    
    // Notificación de éxito
    iziToast.show({
      title: 'Éxito',
      message: 'Excel generado correctamente',
      position: 'topRight',
      class: 'text-success',
      titleColor: '#1DC74C',
    });
  });
}

}
