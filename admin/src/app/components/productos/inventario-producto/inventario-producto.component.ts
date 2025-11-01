import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { Global } from 'src/app/services/global';
import { NgForm } from '@angular/forms';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-inventario-producto',
  templateUrl: './inventario-producto.component.html',
  styleUrls: ['./inventario-producto.component.css'],
})
export class InventarioProductoComponent implements OnInit {

  public id: string = '';
  public producto: any = null;
  public token: string;
  public _iduser: string;
  public inventarios: Array<any> = [];
  public load_btn = false;
  public load_data = true;
  public url: string;

  public inventario: any = {
    cantidad: null,
    proveedor: ''
  };

  // Paginación
  public page = 1;
  public pageSize = 10;

  // Control del modal
  public inventarioAEliminar: any = null;
  public modalInstance: any = null;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token') || '';
    this._iduser = localStorage.getItem('_id') || '';
    this.url = Global.url;

    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.id = params['id'];

      if (!this.id) {
        this.load_data = false;
        this.mostrarError('No se proporcionó un ID de producto válido');
        this._router.navigate(['/panel/productos']);
        return;
      }

      this.cargar_datos();
    });
  }

  ngOnDestroy(): void {
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga datos del producto e inventarios
   */
  cargar_datos(): void {
    this.load_data = true;

    this._productoService.obtener_producto_admin(this.id, this.token).subscribe(
      (response) => {
        const datosProducto = response.data || response;

        if (!datosProducto || !datosProducto._id) {
          this.producto = null;
          this.load_data = false;
          this.mostrarError('Producto no encontrado');
          return;
        }

        this.producto = datosProducto;
        this.cargar_inventarios();
      },
      (error) => {
        console.error('Error al cargar producto:', error);
        this.producto = null;
        this.load_data = false;
        this.mostrarError('Error al cargar el producto');
      }
    );
  }

  /**
   * Carga los inventarios del producto
   */
  cargar_inventarios(): void {
    this._productoService.listar_inventario_producto_admin(this.id, this.token).subscribe(
      (response) => {
        this.inventarios = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar inventarios:', error);
        this.inventarios = [];
        this.load_data = false;
      }
    );
  }

  /**
   * Registra un nuevo ingreso de inventario
   */
  registro_inventario(inventarioForm: NgForm): void {
    if (inventarioForm.invalid) {
      Object.keys(inventarioForm.controls).forEach(key => {
        inventarioForm.controls[key].markAsTouched();
      });
      this.mostrarError('Por favor, completa todos los campos correctamente');
      return;
    }

    if (!this.inventario.cantidad || this.inventario.cantidad <= 0) {
      this.mostrarError('La cantidad debe ser mayor a 0');
      return;
    }

    if (!this.inventario.proveedor || this.inventario.proveedor.trim() === '') {
      this.mostrarError('El proveedor es requerido');
      return;
    }

    this.load_btn = true;

    const data = {
      producto: this.producto._id,
      cantidad: parseInt(this.inventario.cantidad),
      admin: this._iduser,
      proveedor: this.inventario.proveedor.trim(),
    };

    this._productoService.registro_inventario_producto_admin(data, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Inventario registrado correctamente',
          position: 'topRight',
        });

        // Resetear formulario
        this.inventario = {
          cantidad: null,
          proveedor: ''
        };
        inventarioForm.resetForm();

        this.load_btn = false;
        this.cargar_datos(); // Recargar todo para actualizar el stock
      },
      (error) => {
        console.error('Error al registrar inventario:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'Error al registrar el inventario';
        this.mostrarError(errorMsg);
      }
    );
  }

  /**
   * Abre modal de confirmación
   */
  abrirModalEliminar(inventario: any): void {
    this.inventarioAEliminar = inventario;

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
    this.inventarioAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Confirma eliminación
   */
  confirmarEliminacion(): void {
    if (!this.inventarioAEliminar || !this.inventarioAEliminar._id) {
      this.mostrarError('No se pudo identificar el registro');
      return;
    }

    this.load_btn = true;

    this._productoService.eliminar_inventario_producto_admin(this.inventarioAEliminar._id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Registro de inventario eliminado correctamente',
          position: 'topRight',
        });

        this.cerrarModal();
        this.cargar_datos(); // Recargar todo para actualizar el stock
      },
      (error) => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'Error al eliminar el registro';
        this.mostrarError(errorMsg);
      }
    );
  }

  /**
   * Calcula el total de unidades ingresadas
   */
  calcularTotalIngresado(): number {
    return this.inventarios.reduce((sum, inv) => sum + (inv.cantidad || 0), 0);
  }

  /**
   * Exporta a Excel
   */
  download_excel(): void {
    if (this.inventarios.length === 0) {
      this.mostrarError('No hay registros de inventario para exportar');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Inventario');

      // Título
      worksheet.mergeCells('A1:F1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE INVENTARIO';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      worksheet.getRow(1).height = 35;

      // Info del producto
      worksheet.mergeCells('A2:F2');
      let productRow = worksheet.getCell('A2');
      productRow.value = `Producto: ${this.producto.titulo}`;
      productRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0D6EFD' } };
      productRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 25;

      // Fecha
      worksheet.mergeCells('A3:F3');
      let dateRow = worksheet.getCell('A3');
      dateRow.value = `Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(3).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow(['#', 'Administrador', 'Email', 'Cantidad', 'Proveedor', 'Fecha']);
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
      worksheet.getRow(5).height = 25;

      // Datos
      this.inventarios.forEach((item, index) => {
        let adminNombre = `${item.admin.nombres || ''} ${item.admin.apellidos || ''}`.trim();
        let adminEmail = item.admin.email || 'Sin email';
        let proveedor = item.proveedor || 'Sin proveedor';
        let fecha = item.createdAt ? new Date(item.createdAt).toLocaleString('es-ES') : 'N/A';

        let row = worksheet.addRow([
          index + 1,
          adminNombre,
          adminEmail,
          item.cantidad,
          proveedor,
          fecha
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

          if (colNumber === 1 || colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Anchos de columna
      worksheet.columns = [
        { key: '#', width: 8 },
        { key: 'Administrador', width: 25 },
        { key: 'Email', width: 30 },
        { key: 'Cantidad', width: 12 },
        { key: 'Proveedor', width: 25 },
        { key: 'Fecha', width: 20 }
      ];

      // Resumen
      let summaryRowIndex = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
      let summaryRow = worksheet.getRow(summaryRowIndex);
      summaryRow.getCell(1).value = 'RESUMEN';
      summaryRow.getCell(1).font = { bold: true, size: 11 };
      summaryRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      summaryRow.getCell(4).value = `Total: ${this.calcularTotalIngresado()}`;
      summaryRow.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF0D6EFD' } };
      summaryRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      summaryRow.getCell(6).value = `Stock actual: ${this.producto.stock}`;
      summaryRow.getCell(6).font = { bold: true, size: 10 };
      summaryRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      // Generar archivo
      let fname = `Inventario_${this.producto.titulo.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
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
      this.mostrarError('No se pudo generar el archivo Excel');
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