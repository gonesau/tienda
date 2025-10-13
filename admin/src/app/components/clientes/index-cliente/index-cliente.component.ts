import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';
import { AdminService } from 'src/app/services/admin.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-index-cliente',
  templateUrl: './index-cliente.component.html',
  styleUrls: ['./index-cliente.component.css'],
})
export class IndexClienteComponent implements OnInit {
  public clientes: Array<any> = [];
  public filtro_apellidos = ''; // Se mantiene por retrocompatibilidad de la función filtro()
  public filtro_correo = ''; // Se mantiene por retrocompatibilidad de la función filtro()
  public filtro = ''; // Nuevo filtro unificado

  public token: string;
  public load_data = true;
  public load_btn = false;

  // Paginación
  public page = 1;
  public pageSize = 10;

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

  init_data() {
    this.load_data = true;
    this._clienteService.listar_clientes_filtro_admin(null, null, this.token).subscribe(
      (response) => {
        if (response.data) {
          this.clientes = response.data;
        } else {
          this.clientes = [];
        }
        this.load_data = false;
      },
      (error) => {
        console.error('Error al cargar clientes:', error);
        this.load_data = false;
        this.clientes = [];
        this.mostrarError('Error en el servidor, por favor intenta más tarde.');
      }
    );
  }

  // Lógica de filtro unificada
  filtrar() {
    this.load_data = true;
    let tipo = 'apellidos'; // El backend puede buscar por nombre, apellido o correo con este tipo
    let filtroValor = this.filtro;
    
    if (!filtroValor) {
      tipo = null;
      filtroValor = null;
    }

    this._clienteService.listar_clientes_filtro_admin(tipo, filtroValor, this.token).subscribe(
      (response) => {
        this.clientes = response.data;
        this.load_data = false;
      },
      (error) => {
        console.error('Error al filtrar clientes:', error);
        this.load_data = false;
        this.mostrarError('Ocurrió un error al filtrar los clientes.');
      }
    );
  }

  resetear() {
    this.filtro = '';
    this.init_data();
  }

  eliminar(id: string) {
    if (!id) {
      this.mostrarError('ID de cliente inválido.');
      return;
    }
    this.load_btn = true;
    this._clienteService.eliminar_cliente_admin(id, this.token).subscribe(
      (response) => {
        if (response.data) {
          iziToast.success({
            title: 'ÉXITO',
            message: 'Cliente eliminado correctamente.',
            position: 'topRight',
          });

          $('#delete-' + id).modal('hide');
          $('.modal-backdrop').removeClass('show');
          $('body').removeClass('modal-open');

          this.load_btn = false;
          this.init_data(); // Recargar datos
        } else {
          this.mostrarError(response.message || 'No se pudo eliminar el cliente.');
          this.load_btn = false;
        }
      },
      (error) => {
        console.error('Error al eliminar cliente:', error);
        const errorMsg = error.error?.message || 'Ocurrió un problema con el servidor.';
        this.mostrarError(errorMsg);
        this.load_btn = false;
      }
    );
  }

  download_excel() {
    if (this.clientes.length === 0) {
      this.mostrarError('No hay clientes para exportar.');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Reporte de Clientes');

      // Título
      worksheet.mergeCells('A1:G1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE CLIENTES';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      worksheet.getRow(1).height = 35;
      
      // Fecha
      worksheet.mergeCells('A2:G2');
      let dateRow = worksheet.getCell('A2');
      dateRow.value = `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow(['#', 'Nombres', 'Apellidos', 'Correo Electrónico', 'Teléfono', 'País', 'Género', 'DUI']);
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      worksheet.getRow(4).height = 25;

      // Datos
      this.clientes.forEach((cliente, index) => {
        let row = worksheet.addRow([
          index + 1,
          cliente.nombres,
          cliente.apellidos,
          cliente.email,
          cliente.telefono || 'No especificado',
          cliente.pais || 'No especificado',
          cliente.genero || 'No especificado',
          cliente.dui || 'No especificado'
        ]);

        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFD3D3D3' } }, left: { style: 'thin', color: { argb: 'FFD3D3D3' } }, bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } }, right: { style: 'thin', color: { argb: 'FFD3D3D3' } } };
          if (index % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
          }
        });
      });
      
      // Ancho de columnas
      worksheet.columns = [
        { key: '#', width: 5 },
        { key: 'Nombres', width: 30 },
        { key: 'Apellidos', width: 30 },
        { key: 'Correo Electrónico', width: 35 },
        { key: 'Teléfono', width: 15 },
        { key: 'País', width: 15 },
        { key: 'Género', width: 15 },
        { key: 'DUI', width: 15 }
      ];

      // Generar archivo
      let fname = `Reporte_Clientes_${new Date().getTime()}.xlsx`;
      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, fname);
        iziToast.success({ title: 'ÉXITO', message: 'Reporte de clientes generado correctamente.', position: 'topRight' });
      });
    } catch(error) {
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

