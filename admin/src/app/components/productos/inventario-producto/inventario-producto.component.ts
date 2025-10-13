import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-inventario-producto',
  templateUrl: './inventario-producto.component.html',
  styleUrls: ['./inventario-producto.component.css'],
})
export class InventarioProductoComponent implements OnInit {
  public id: string;
  public producto: any = undefined;
  public token: string;
  public _iduser: string;
  public inventarios: Array<any> = [];
  public load_btn = false;
  public load_data = true;
  public inventario: any = {
    cantidad: null,
    proveedor: ''
  };
  
  // Paginación
  public page = 1;
  public pageSize = 10;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _productoService: ProductoService
  ) {
    this.token = localStorage.getItem('token') || '';
    this._iduser = localStorage.getItem('_id') || '';
    
    // Validar que exista token
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.id = params['id'];
      
      if (!this.id) {
        this.load_data = false;
        this.producto = undefined;
        this.mostrarError('No se proporcionó un ID de producto válido');
        return;
      }
      
      this.cargar_datos();
    });
  }

  cargar_datos(): void {
    this.load_data = true;
    
    this._productoService
      .obtener_producto_admin(this.id, this.token)
      .subscribe(
        (response) => {
          if (!response.data) {
            this.producto = undefined;
            this.load_data = false;
            this.mostrarError('Producto no encontrado');
          } else {
            this.producto = response.data;
            this.cargar_inventarios();
          }
        },
        (error) => {
          console.error('Error al cargar producto:', error);
          this.load_data = false;
          this.producto = undefined;
          this.mostrarError('Error al cargar el producto. Por favor, intenta nuevamente.');
        }
      );
  }

  cargar_inventarios(): void {
    this._productoService
      .listar_inventario_producto_admin(this.producto._id, this.token)
      .subscribe(
        (response) => {
          this.inventarios = response.data || [];
          this.load_data = false;
        },
        (error) => {
          console.error('Error al cargar inventarios:', error);
          this.inventarios = [];
          this.load_data = false;
          this.mostrarError('Error al cargar el inventario');
        }
      );
  }

  registro_inventario(inventarioForm: any): void {
    // Validación del formulario
    if (!inventarioForm.valid) {
      this.mostrarError('Por favor, completa todos los campos correctamente');
      this.marcarCamposComoTocados(inventarioForm);
      return;
    }

    // Validaciones adicionales
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

    this._productoService
      .registro_inventario_producto_admin(data, this.token)
      .subscribe(
        (response) => {
          iziToast.success({
            title: 'Éxito',
            message: 'Inventario registrado correctamente',
            position: 'topRight',
          });

          // Resetear el formulario
          this.inventario = {
            cantidad: null,
            proveedor: ''
          };
          inventarioForm.resetForm();

          // Recargar inventarios
          this.cargar_inventarios();
          this.load_btn = false;

          // Actualizar el producto para reflejar el nuevo stock
          this.cargar_datos();
        },
        (error) => {
          console.error('Error al registrar inventario:', error);
          this.load_btn = false;
          
          const errorMsg = error.error?.message || 'Ocurrió un error al registrar el inventario';
          this.mostrarError(errorMsg);
        }
      );
  }

  eliminar(id: string): void {
    if (!id) {
      this.mostrarError('ID de inventario inválido');
      return;
    }

    this.load_btn = true;

    this._productoService
      .eliminar_inventario_producto_admin(id, this.token)
      .subscribe(
        (response) => {
          iziToast.success({
            title: 'Éxito',
            message: 'Registro de inventario eliminado correctamente',
            position: 'topRight',
          });

          // Cerrar el modal
          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          $('body').removeClass('modal-open');
          
          this.load_btn = false;

          // Recargar inventarios
          this.cargar_inventarios();

          // Actualizar el producto para reflejar el nuevo stock
          this.cargar_datos();
        },
        (error) => {
          console.error('Error al eliminar:', error);
          this.load_btn = false;
          
          const errorMsg = error.error?.message || 'Ocurrió un problema al eliminar el registro';
          this.mostrarError(errorMsg);
        }
      );
  }

  download_excel(): void {
    if (this.inventarios.length === 0) {
      this.mostrarError('No hay registros de inventario para exportar');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Inventario de Producto');

      // ===== TÍTULO PRINCIPAL =====
      worksheet.mergeCells('A1:F1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE INVENTARIO';
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
        fgColor: { argb: 'FF1F4E78' }
      };
      worksheet.getRow(1).height = 35;

      // ===== INFORMACIÓN DEL PRODUCTO =====
      worksheet.mergeCells('A2:F2');
      let productRow = worksheet.getCell('A2');
      productRow.value = `Producto: ${this.producto.titulo}`;
      productRow.font = { 
        name: 'Calibri', 
        size: 14, 
        bold: true,
        color: { argb: 'FF1F4E78' }
      };
      productRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 25;

      // ===== FECHA DE GENERACIÓN =====
      worksheet.mergeCells('A3:F3');
      let dateRow = worksheet.getCell('A3');
      dateRow.value = `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(3).height = 20;

      worksheet.addRow([]);

      // ===== ENCABEZADOS =====
      let headerRow = worksheet.addRow(['#', 'Administrador', 'Email', 'Cantidad', 'Proveedor', 'Fecha de Ingreso']);
      
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
          fgColor: { argb: 'FF366092' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      worksheet.getRow(5).height = 25;

      // ===== DATOS =====
      this.inventarios.forEach((item, index) => {
        let adminNombre = `${item.admin.nombres || ''} ${item.admin.apellidos || ''}`.trim();
        let adminEmail = item.admin.email || 'Sin email';
        let proveedor = item.proveedor ? item.proveedor : 'Sin proveedor';
        let fechaIngreso = item.createdAt ? new Date(item.createdAt).toLocaleString('es-ES') : 'N/A';

        let row = worksheet.addRow([
          index + 1,
          adminNombre,
          adminEmail,
          item.cantidad,
          proveedor,
          fechaIngreso
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };

          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }

          if (colNumber === 1 || colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }

          cell.font = { name: 'Calibri', size: 11 };
        });

        row.height = 20;
      });

      // ===== CONFIGURACIÓN DE COLUMNAS =====
      worksheet.columns = [
        { key: '#', width: 8 },
        { key: 'Administrador', width: 25 },
        { key: 'Email', width: 30 },
        { key: 'Cantidad', width: 12 },
        { key: 'Proveedor', width: 25 },
        { key: 'Fecha', width: 20 }
      ];

      // ===== RESUMEN =====
      let summaryRowIndex = worksheet.rowCount + 1;
      worksheet.addRow([]);
      summaryRowIndex++;
      
      let summaryRow = worksheet.getRow(summaryRowIndex);
      worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
      
      let totalRegistros = this.inventarios.length;
      let cantidadTotal = this.inventarios.reduce((sum, inv) => sum + (inv.cantidad || 0), 0);

      summaryRow.getCell(1).value = 'RESUMEN';
      summaryRow.getCell(1).font = { bold: true, size: 11 };
      summaryRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      
      summaryRow.getCell(4).value = `Total: ${cantidadTotal}`;
      summaryRow.getCell(4).font = { bold: true, size: 10, color: { argb: 'FF1F4E78' } };
      summaryRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      
      summaryRow.getCell(6).value = `Registros: ${totalRegistros}`;
      summaryRow.getCell(6).font = { bold: true, size: 10 };
      summaryRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      // ===== INFO ADICIONAL =====
      let infoRowIndex = summaryRowIndex + 2;
      worksheet.addRow([]);
      infoRowIndex++;

      worksheet.mergeCells(`A${infoRowIndex}:F${infoRowIndex}`);
      let infoRow = worksheet.getCell(`A${infoRowIndex}`);
      infoRow.value = `Stock actual: ${this.producto.stock} | Categoría: ${this.producto.categoria || 'Sin categoría'} | Precio: $${this.producto.precio || 0}`;
      infoRow.font = { name: 'Calibri', size: 10, italic: true };
      infoRow.alignment = { vertical: 'middle', horizontal: 'center' };
      infoRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9F9F9' }
      };

      // ===== GENERAR ARCHIVO =====
      let fname = `inventario_${this.producto.titulo.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
        });
        fs.saveAs(blob, fname);
        
        iziToast.success({
          title: 'Éxito',
          message: 'Excel de inventario generado correctamente',
          position: 'topRight',
        });
      });
    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.mostrarError('Error al generar el archivo Excel');
    }
  }

  // Método auxiliar para marcar campos como tocados
  private marcarCamposComoTocados(form: any): void {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
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