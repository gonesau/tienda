import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { Global } from 'src/app/services/global';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

declare var iziToast: any;
declare var bootstrap: any;

@Component({
  selector: 'app-index-ventas',
  templateUrl: './index-ventas.component.html',
  styleUrls: ['./index-ventas.component.css']
})
export class IndexVentasComponent implements OnInit {

  public filtro = '';
  public fecha_desde = '';
  public fecha_hasta = '';
  public token: string;
  public ventas: Array<any> = [];
  public estadisticas: any = {
    total_ventas: 0,
    total_ingresos: 0,
    ticket_promedio: 0,
    ventas_procesando: 0,
    ventas_enviadas: 0,
    ventas_entregadas: 0
  };
  public url: string;
  public load_data = true;
  public load_estadisticas = true;

  // Paginación
  public page = 1;
  public pageSize = 15;

  // Filtro de estado
  public estado_filtro = 'todos';
  public estados = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

  // Modal
  public ventaSeleccionada: any = null;
  public nuevoEstado = '';
  public load_btn_estado = false;
  public modalEstado: any = null;

  constructor(
    private _ventaService: VentaService,
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
    this.cargar_estadisticas();
  }

  ngOnDestroy(): void {
    if (this.modalEstado) {
      this.modalEstado.dispose();
    }
  }

  /**
   * Carga las ventas con filtros
   */
  cargar_datos(): void {
    this.load_data = true;
    
    this._ventaService.listar_ventas_admin(
      this.filtro, 
      this.fecha_desde, 
      this.fecha_hasta, 
      this.token
    ).subscribe(
      (response) => {
        this.ventas = response.data || [];
        this.load_data = false;
      },
      (error) => {
        console.error('Error cargando ventas:', error);
        this.ventas = [];
        this.load_data = false;
        this.mostrarError('Error al cargar las ventas');
      }
    );
  }

  /**
   * Carga estadísticas generales
   */
  cargar_estadisticas(): void {
    this.load_estadisticas = true;
    
    this._ventaService.obtener_estadisticas_ventas_admin(this.token).subscribe(
      (response) => {
        this.estadisticas = response.data || this.estadisticas;
        this.load_estadisticas = false;
      },
      (error) => {
        console.error('Error cargando estadísticas:', error);
        this.load_estadisticas = false;
      }
    );
  }

  /**
   * Aplica filtros
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
    this.fecha_desde = '';
    this.fecha_hasta = '';
    this.estado_filtro = 'todos';
    this.page = 1;
    this.cargar_datos();
  }

  /**
   * Filtra por estado
   */
  filtrar_por_estado(estado: string): void {
    this.estado_filtro = estado;
    this.page = 1;
  }

  /**
   * Obtiene ventas filtradas por estado
   */
  get ventas_filtradas(): Array<any> {
    if (this.estado_filtro === 'todos') {
      return this.ventas;
    }
    return this.ventas.filter(venta => venta.estado === this.estado_filtro);
  }

  /**
   * Abre modal para cambiar estado
   */
  abrirModalEstado(venta: any): void {
    this.ventaSeleccionada = venta;
    this.nuevoEstado = venta.estado;
    
    const modalElement = document.getElementById('estadoModal');
    if (modalElement) {
      this.modalEstado = new bootstrap.Modal(modalElement);
      this.modalEstado.show();
    }
  }

  /**
   * Cierra modal de estado
   */
  cerrarModalEstado(): void {
    if (this.modalEstado) {
      this.modalEstado.hide();
    }
    this.ventaSeleccionada = null;
    this.nuevoEstado = '';
    this.load_btn_estado = false;
  }

  /**
   * Actualiza el estado de la venta
   */
  actualizarEstado(): void {
    if (!this.nuevoEstado) {
      this.mostrarError('Selecciona un estado');
      return;
    }

    if (this.nuevoEstado === this.ventaSeleccionada.estado) {
      this.mostrarError('El estado seleccionado es el mismo');
      return;
    }

    this.load_btn_estado = true;

    this._ventaService.actualizar_estado_venta_admin(
      this.ventaSeleccionada._id,
      { estado: this.nuevoEstado },
      this.token
    ).subscribe(
      (response) => {
        iziToast.success({
          title: 'Éxito',
          message: 'Estado actualizado correctamente',
          position: 'topRight'
        });

        this.cerrarModalEstado();
        this.cargar_datos();
        this.cargar_estadisticas();
      },
      (error) => {
        console.error('Error actualizando estado:', error);
        this.load_btn_estado = false;
        this.mostrarError('Error al actualizar el estado');
      }
    );
  }

  /**
   * Navega al detalle de la venta
   */
  verDetalle(id: string): void {
    this._router.navigate(['/panel/ventas', id]);
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getEstadoClass(estado: string): string {
    const clases: any = {
      'Procesando': 'bg-warning text-dark',
      'Enviado': 'bg-info',
      'Entregado': 'bg-success',
      'Cancelado': 'bg-danger'
    };
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Exporta a Excel
   */
  download_excel(): void {
    if (this.ventas_filtradas.length === 0) {
      this.mostrarError('No hay ventas para exportar');
      return;
    }

    try {
      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Ventas');

      // Título
      worksheet.mergeCells('A1:H1');
      let titleRow = worksheet.getCell('A1');
      titleRow.value = 'REPORTE DE VENTAS';
      titleRow.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      worksheet.getRow(1).height = 35;

      // Fecha
      worksheet.mergeCells('A2:H2');
      let dateRow = worksheet.getCell('A2');
      dateRow.value = `Fecha: ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })}`;
      dateRow.font = { name: 'Calibri', size: 10, italic: true };
      dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      worksheet.addRow([]);

      // Encabezados
      let headerRow = worksheet.addRow([
        '#Orden', 'Cliente', 'Email', 'Fecha', 'Total', 'Estado', 'Productos', 'Transacción'
      ]);
      
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
      this.ventas_filtradas.forEach((venta, index) => {
        let row = worksheet.addRow([
          venta.nventa,
          `${venta.cliente.nombres} ${venta.cliente.apellidos}`,
          venta.cliente.email,
          new Date(venta.createdAt).toLocaleDateString('es-ES'),
          venta.subtotal,
          venta.estado,
          venta.cantidad_productos || 0,
          venta.transaccion
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

          if (colNumber === 5) {
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Anchos de columna
      worksheet.columns = [
        { key: '#Orden', width: 15 },
        { key: 'Cliente', width: 25 },
        { key: 'Email', width: 30 },
        { key: 'Fecha', width: 12 },
        { key: 'Total', width: 12 },
        { key: 'Estado', width: 12 },
        { key: 'Productos', width: 10 },
        { key: 'Transacción', width: 20 }
      ];

      // Resumen
      let summaryRowIndex = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${summaryRowIndex}:C${summaryRowIndex}`);
      let summaryRow = worksheet.getRow(summaryRowIndex);
      summaryRow.getCell(1).value = 'RESUMEN';
      summaryRow.getCell(1).font = { bold: true, size: 11 };
      summaryRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      const totalIngresos = this.ventas_filtradas.reduce((sum, v) => sum + v.subtotal, 0);
      
      summaryRow.getCell(5).value = totalIngresos;
      summaryRow.getCell(5).numFmt = '$#,##0.00';
      summaryRow.getCell(5).font = { bold: true, size: 11, color: { argb: 'FF0D6EFD' } };
      summaryRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };

      // Generar archivo
      let fname = `Ventas_${new Date().getTime()}.xlsx`;
      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        fs.saveAs(blob, fname);
        
        iziToast.success({
          title: 'Éxito',
          message: 'Reporte generado correctamente',
          position: 'topRight'
        });
      });

    } catch (error) {
      console.error('Error generando Excel:', error);
      this.mostrarError('No se pudo generar el archivo Excel');
    }
  }

  /**
   * Formatea fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight'
    });
  }
}