import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';
import { AdminService } from 'src/app/services/admin.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-index-cliente',
  templateUrl: './index-cliente.component.html',
  styleUrls: ['./index-cliente.component.css'],
})
export class IndexClienteComponent implements OnInit {
  
  public clientes: Array<any> = [];
  public filtro = '';
  public token: string;
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

  // Control del modal
  public clienteAEliminar: any = null;
  public modalInstance: any = null;

  constructor(
    private _clienteService: ClienteService,
    private _adminService: AdminService,
    private _router: Router
  ) {
    this.token = this._adminService.getToken() || '';
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.init_data();
  }

  ngOnDestroy(): void {
    // Limpiar modal al destruir componente
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  /**
   * Carga inicial de datos
   */
  init_data(): void {
    this.load_data = true;
    this._clienteService.listar_clientes_filtro_admin(null, null, this.token).subscribe(
      (response) => {
        this.clientes = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar clientes:', error);
        this.clientes = [];
        this.load_data = false;
        this.mostrarError('Error al cargar los clientes. Intenta nuevamente.');
      }
    );
  }

  /**
   * Filtra clientes por búsqueda
   */
  filtrar(): void {
    if (!this.filtro.trim()) {
      this.init_data();
      return;
    }

    this.load_data = true;
    this.page = 1;

    this._clienteService.listar_clientes_filtro_admin('apellidos', this.filtro.trim(), this.token).subscribe(
      (response) => {
        this.clientes = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error al filtrar:', error);
        this.clientes = [];
        this.load_data = false;
        this.mostrarError('Error al buscar clientes.');
      }
    );
  }

  /**
   * Resetea los filtros
   */
  resetear(): void {
    this.filtro = '';
    this.page = 1;
    this.init_data();
  }

  /**
   * Abre el modal de confirmación
   */
  abrirModalEliminar(cliente: any): void {
    this.clienteAEliminar = cliente;
    
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
   * Cierra el modal
   */
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.clienteAEliminar = null;
    this.load_btn = false;
  }

  /**
   * Elimina un cliente
   */
  confirmarEliminacion(): void {
    if (!this.clienteAEliminar || !this.clienteAEliminar._id) {
      this.mostrarError('No se pudo identificar el cliente.');
      return;
    }

    this.load_btn = true;

    this._clienteService.eliminar_cliente_admin(this.clienteAEliminar._id, this.token).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Cliente eliminado correctamente',
          position: 'topRight',
        });

        this.cerrarModal();
        this.init_data();
      },
      (error) => {
        console.error('Error al eliminar:', error);
        this.load_btn = false;
        const errorMsg = error.error?.message || 'No se pudo eliminar el cliente.';
        this.mostrarError(errorMsg);
      }
    );
  }

  /**
   * Exporta a Excel
   */
  download_excel(): void {
    if (this.clientes.length === 0) {
      this.mostrarError('No hay clientes para exportar.');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Clientes');

      // Título
      worksheet.mergeCells('A1:H1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE CLIENTES';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      worksheet.getRow(1).height = 35;

      // Fecha
      worksheet.mergeCells('A2:H2');
      let dateRow = worksheet.getCell('A2');
      dateRow.value = `Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow(['#', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'País', 'Género', 'DUI']);
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
      this.clientes.forEach((cliente, index) => {
        let row = worksheet.addRow([
          index + 1,
          cliente.nombres,
          cliente.apellidos,
          cliente.email,
          cliente.telefono || 'N/A',
          cliente.pais || 'N/A',
          cliente.genero || 'N/A',
          cliente.dui || 'N/A'
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
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Anchos de columna
      worksheet.columns = [
        { key: '#', width: 8 },
        { key: 'Nombres', width: 25 },
        { key: 'Apellidos', width: 25 },
        { key: 'Email', width: 35 },
        { key: 'Teléfono', width: 15 },
        { key: 'País', width: 15 },
        { key: 'Género', width: 15 },
        { key: 'DUI', width: 15 }
      ];

      // Generar archivo
      let fname = `Clientes_${new Date().getTime()}.xlsx`;
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