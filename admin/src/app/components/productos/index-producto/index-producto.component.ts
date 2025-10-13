import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Global } from 'src/app/services/global';
import { ProductoService } from 'src/app/services/producto.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-index-producto',
  templateUrl: './index-producto.component.html',
  styleUrls: ['./index-producto.component.css'],
})
export class IndexProductoComponent implements OnInit {
  public filtro = '';
  public token: string;
  public productos: Array<any> = [];
  public url: string;
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

  constructor(private _productoService: ProductoService, private _router: Router) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;

    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.cargar_datos();
  }

  cargar_datos(): void {
    this.load_data = true;
    this._productoService.listar_productos_admin(this.filtro, this.token).subscribe(
      (response) => {
        if (response.data) {
          this.productos = response.data;
        } else {
          this.productos = [];
        }
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar productos:', error);
        this.load_data = false;
        this.productos = [];
        this.mostrarError('Error en el servidor, por favor intenta más tarde.');
      }
    );
  }

  filtrar(): void {
    // El ngModel actualiza `this.filtro` automáticamente, solo necesitamos recargar.
    this.cargar_datos();
  }

  resetear(): void {
    this.filtro = '';
    this.cargar_datos();
  }

  eliminar(id: string): void {
    if (!id) {
      this.mostrarError('ID de producto inválido.');
      return;
    }

    this.load_btn = true;
    this._productoService.eliminar_producto_admin(id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'ÉXITO',
          message: 'Producto eliminado correctamente.',
          position: 'topRight',
        });

        // Cerrar modal
        $('#delete-' + id).modal('hide');
        $('.modal-backdrop').removeClass('show');
        $('body').removeClass('modal-open');

        this.load_btn = false;
        
        // Recargar los datos para reflejar la eliminación
        this.cargar_datos();
      },
      (error) => {
        console.error('Error al eliminar producto:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'Ocurrió un problema con el servidor.';
        this.mostrarError(errorMsg);
      }
    );
  }

  download_excel(): void {
    if (this.productos.length === 0) {
      this.mostrarError('No hay productos para exportar.');
      return;
    }
    
    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Reporte de Productos');

      // Título
      worksheet.mergeCells('A1:F1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE PRODUCTOS';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      worksheet.getRow(1).height = 35;

      // Fecha de generación
      worksheet.mergeCells('A2:F2');
      let dateRow = worksheet.getCell('A2');
      dateRow.value = `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow(['#', 'Título', 'Stock', 'Precio', 'Categoría', 'N° de ventas']);
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      worksheet.getRow(4).height = 25;

      // Datos
      this.productos.forEach((item, index) => {
        let row = worksheet.addRow([
          index + 1,
          item.titulo,
          item.stock,
          item.precio,
          item.categoria || 'Sin categoría',
          item.nventas,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFD3D3D3' } }, left: { style: 'thin', color: { argb: 'FFD3D3D3' } }, bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } }, right: { style: 'thin', color: { argb: 'FFD3D3D3' } } };
          if (index % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
          }
           if (colNumber === 4) { // Columna Precio
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Ancho de columnas
      worksheet.columns = [
        { key: '#', width: 5 },
        { key: 'Título', width: 40 },
        { key: 'Stock', width: 10 },
        { key: 'Precio', width: 15 },
        { key: 'Categoría', width: 25 },
        { key: 'N° de ventas', width: 15 },
      ];

      // Generar archivo
      let fname = `Reporte_Productos_${new Date().getTime()}.xlsx`;
      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, fname);
        iziToast.success({ title: 'ÉXITO', message: 'Excel generado correctamente.', position: 'topRight' });
      });

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.mostrarError('No se pudo generar el archivo Excel.');
    }
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