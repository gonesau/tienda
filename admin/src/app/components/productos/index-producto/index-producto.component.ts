import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Global } from 'src/app/services/global';
import { ProductoService } from 'src/app/services/producto.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var bootstrap: any;

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

  // Control del modal
  public productoAEliminar: any = null;
  public modalInstance: any = null;

  constructor(
    private _productoService: ProductoService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;

    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.cargar_datos();
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga los productos
   */
  cargar_datos(): void {
    this.load_data = true;
    this._productoService.listar_productos_admin(this.filtro, this.token).subscribe(
      (response) => {
        this.productos = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
        this.load_data = false;
        this.mostrarError('Error al cargar productos. Intenta nuevamente.');
      }
    );
  }

  /**
   * Filtra productos
   */
  filtrar(): void {
    this.page = 1;
    this.cargar_datos();
  }

  /**
   * Resetea filtros
   */
  resetear(): void {
    this.filtro = '';
    this.page = 1;
    this.cargar_datos();
  }

  /**
   * Abre modal de confirmación
   */
  abrirModalEliminar(producto: any): void {
    this.productoAEliminar = producto;
    
    const modalElement = document.getElementById('deleteModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
      this.modalInstance.show();
    }
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.productoAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Confirma eliminación
   */
  confirmarEliminacion(): void {
    if (!this.productoAEliminar || !this.productoAEliminar._id) {
      this.mostrarError('No se pudo identificar el producto.');
      return;
    }

    this.load_btn = true;

    this._productoService.eliminar_producto_admin(this.productoAEliminar._id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Producto eliminado correctamente',
          position: 'topRight',
        });

        this.cerrarModal();
        this.cargar_datos();
      },
      (error) => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'No se pudo eliminar el producto';
        this.mostrarError(errorMsg);
      }
    );
  }

  /**
   * Exporta a Excel
   */
  download_excel(): void {
    if (this.productos.length === 0) {
      this.mostrarError('No hay productos para exportar.');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Productos');

      // Título
      worksheet.mergeCells('A1:F1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE PRODUCTOS';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      worksheet.getRow(1).height = 35;

      // Fecha
      worksheet.mergeCells('A2:F2');
      let dateRow = worksheet.getCell('A2');
      dateRow.value = `Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow(['#', 'Título', 'Stock', 'Precio', 'Categoría', 'Ventas']);
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF495057' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
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
          item.nventas || 0,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
          
          if (index % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          }
          
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (colNumber === 4) {
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Anchos de columna
      worksheet.columns = [
        { key: '#', width: 8 },
        { key: 'Título', width: 40 },
        { key: 'Stock', width: 12 },
        { key: 'Precio', width: 15 },
        { key: 'Categoría', width: 20 },
        { key: 'Ventas', width: 12 }
      ];

      // Generar archivo
      let fname = `Productos_${new Date().getTime()}.xlsx`;
      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, fname);
        
        iziToast.success({
          title: 'Éxito',
          message: 'Reporte generado correctamente',
          position: 'topRight'
        });
      });
    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.mostrarError('No se pudo generar el archivo Excel.');
    }
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