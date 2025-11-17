import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { ProductoService } from 'src/app/services/producto.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { CuponService } from 'src/app/services/cupon.service';
import { Chart, registerables } from 'chart.js';

declare var iziToast: any;

Chart.register(...registerables);

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  @ViewChild('ventasMensualesChart') ventasMensualesChart!: ElementRef;
  @ViewChild('productosTopChart') productosTopChart!: ElementRef;
  @ViewChild('ventasPorEstadoChart') ventasPorEstadoChart!: ElementRef;
  @ViewChild('ingresosSemanalesChart') ingresosSemanalesChart!: ElementRef;

  public token: string;
  public load_data = true;

  // ============================================
  // KPIs PRINCIPALES
  // ============================================
  public kpis = {
    ventas_totales: 0,
    ingresos_totales: 0,
    ticket_promedio: 0,
    ventas_mes_actual: 0,
    ingresos_mes_actual: 0,
    crecimiento_ventas: 0,
    crecimiento_ingresos: 0,
    productos_vendidos: 0,
    clientes_activos: 0,
    tasa_conversion: 0,
    productos_stock_bajo: 0,
    cupones_activos: 0
  };

  // ============================================
  // DATOS PARA GRÁFICOS
  // ============================================
  public ventas_mensuales: any[] = [];
  public productos_top: any[] = [];
  public ventas_por_estado: any = {
    procesando: 0,
    enviado: 0,
    entregado: 0,
    cancelado: 0
  };
  public ingresos_semanales: any[] = [];

  // ============================================
  // FILTROS
  // ============================================
  public periodo_seleccionado = 'mes'; // 'semana', 'mes', 'trimestre', 'año'
  public fecha_inicio = '';
  public fecha_fin = '';

  // ============================================
  // CHARTS
  // ============================================
  private chartVentasMensuales: any;
  private chartProductosTop: any;
  private chartVentasPorEstado: any;
  private chartIngresosSemanales: any;

  constructor(
    private _ventaService: VentaService,
    private _productoService: ProductoService,
    private _clienteService: ClienteService,
    private _cuponService: CuponService,
    private _router: Router
  ) {
    this.token = localStorage.getItem('token') || '';
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.inicializar_fechas();
    this.cargar_datos_dashboard();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  /**
   * Inicializa las fechas según el período seleccionado
   */
  inicializar_fechas(): void {
    const hoy = new Date();
    const fin = new Date(hoy);
    let inicio = new Date(hoy);

    switch (this.periodo_seleccionado) {
      case 'semana':
        inicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        inicio.setMonth(hoy.getMonth() - 1);
        break;
      case 'trimestre':
        inicio.setMonth(hoy.getMonth() - 3);
        break;
      case 'año':
        inicio.setFullYear(hoy.getFullYear() - 1);
        break;
    }

    this.fecha_inicio = this.formatear_fecha_input(inicio);
    this.fecha_fin = this.formatear_fecha_input(fin);
  }

  /**
   * Carga todos los datos del dashboard
   */
  async cargar_datos_dashboard(): Promise<void> {
    this.load_data = true;

    try {
      await Promise.all([
        this.cargar_kpis_principales(),
        this.cargar_ventas_mensuales(),
        this.cargar_productos_top(),
        this.cargar_ventas_por_estado(),
        this.cargar_ingresos_semanales(),
        this.cargar_estadisticas_adicionales()
      ]);

      this.load_data = false;

      // Crear gráficos después de cargar datos
      setTimeout(() => {
        this.crear_grafico_ventas_mensuales();
        this.crear_grafico_productos_top();
        this.crear_grafico_ventas_estado();
        this.crear_grafico_ingresos_semanales();
      }, 100);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      this.mostrarError('Error al cargar el dashboard');
      this.load_data = false;
    }
  }

  /**
   * Carga los KPIs principales
   */
  async cargar_kpis_principales(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._ventaService.obtener_estadisticas_ventas_admin(this.token).subscribe(
        (response) => {
          if (response.data) {
            this.kpis.ventas_totales = response.data.total_ventas || 0;
            this.kpis.ingresos_totales = response.data.total_ingresos || 0;
            this.kpis.ticket_promedio = response.data.ticket_promedio || 0;
            this.kpis.ventas_mes_actual = response.data.ventas_mes_actual || 0;
            this.kpis.ingresos_mes_actual = response.data.ingresos_mes_actual || 0;
            
            // Calcular crecimientos
            if (response.data.ventas_mes_anterior > 0) {
              this.kpis.crecimiento_ventas = 
                ((this.kpis.ventas_mes_actual - response.data.ventas_mes_anterior) / 
                response.data.ventas_mes_anterior) * 100;
            }
            
            if (response.data.ingresos_mes_anterior > 0) {
              this.kpis.crecimiento_ingresos = 
                ((this.kpis.ingresos_mes_actual - response.data.ingresos_mes_anterior) / 
                response.data.ingresos_mes_anterior) * 100;
            }
          }
          resolve();
        },
        (error) => {
          console.error('Error cargando KPIs:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Carga datos de ventas mensuales
   */
  async cargar_ventas_mensuales(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._ventaService.listar_ventas_admin('', this.fecha_inicio, this.fecha_fin, this.token).subscribe(
        (response) => {
          const ventas = response.data || [];
          
          // Agrupar por mes
          const ventasPorMes: any = {};
          
          ventas.forEach((venta: any) => {
            const fecha = new Date(venta.createdAt);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            if (!ventasPorMes[mes]) {
              ventasPorMes[mes] = {
                mes: mes,
                cantidad: 0,
                ingresos: 0
              };
            }
            
            ventasPorMes[mes].cantidad++;
            ventasPorMes[mes].ingresos += venta.subtotal;
          });
          
          this.ventas_mensuales = Object.values(ventasPorMes).sort((a: any, b: any) => 
            a.mes.localeCompare(b.mes)
          );
          
          resolve();
        },
        (error) => {
          console.error('Error cargando ventas mensuales:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Carga productos más vendidos
   */
  async cargar_productos_top(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._productoService.listar_productos_admin('', this.token).subscribe(
        (response) => {
          const productos = response.data || [];
          
          // Ordenar por ventas y tomar top 5
          this.productos_top = productos
            .sort((a: any, b: any) => (b.nventas || 0) - (a.nventas || 0))
            .slice(0, 5)
            .map((p: any) => ({
              titulo: p.titulo,
              ventas: p.nventas || 0,
              ingresos: (p.nventas || 0) * p.precio
            }));
          
          resolve();
        },
        (error) => {
          console.error('Error cargando productos top:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Carga distribución de ventas por estado
   */
  async cargar_ventas_por_estado(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._ventaService.listar_ventas_admin('', this.fecha_inicio, this.fecha_fin, this.token).subscribe(
        (response) => {
          const ventas = response.data || [];
          
          this.ventas_por_estado = {
            procesando: ventas.filter((v: any) => v.estado === 'Procesando').length,
            enviado: ventas.filter((v: any) => v.estado === 'Enviado').length,
            entregado: ventas.filter((v: any) => v.estado === 'Entregado').length,
            cancelado: ventas.filter((v: any) => v.estado === 'Cancelado').length
          };
          
          resolve();
        },
        (error) => {
          console.error('Error cargando ventas por estado:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Carga ingresos de las últimas 4 semanas
   */
  async cargar_ingresos_semanales(): Promise<void> {
    return new Promise((resolve, reject) => {
      const hoy = new Date();
      const hace4Semanas = new Date(hoy);
      hace4Semanas.setDate(hoy.getDate() - 28);
      
      const fechaInicio = this.formatear_fecha_input(hace4Semanas);
      const fechaFin = this.formatear_fecha_input(hoy);
      
      this._ventaService.listar_ventas_admin('', fechaInicio, fechaFin, this.token).subscribe(
        (response) => {
          const ventas = response.data || [];
          
          // Agrupar por semana
          const semanas: any = {};
          
          ventas.forEach((venta: any) => {
            const fecha = new Date(venta.createdAt);
            const numeroSemana = this.obtener_numero_semana(fecha);
            
            if (!semanas[numeroSemana]) {
              semanas[numeroSemana] = {
                semana: numeroSemana,
                ingresos: 0,
                cantidad: 0
              };
            }
            
            semanas[numeroSemana].ingresos += venta.subtotal;
            semanas[numeroSemana].cantidad++;
          });
          
          this.ingresos_semanales = Object.values(semanas).sort((a: any, b: any) => 
            a.semana - b.semana
          );
          
          resolve();
        },
        (error) => {
          console.error('Error cargando ingresos semanales:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Carga estadísticas adicionales
   */
  async cargar_estadisticas_adicionales(): Promise<void> {
    // Productos con stock bajo
    this._productoService.listar_productos_admin('', this.token).subscribe(
      (response) => {
        const productos = response.data || [];
        this.kpis.productos_stock_bajo = productos.filter((p: any) => p.stock < 10).length;
        
        // Total de productos vendidos
        this.kpis.productos_vendidos = productos.reduce((sum: number, p: any) => 
          sum + (p.nventas || 0), 0
        );
      }
    );

    // Clientes activos
    this._clienteService.listar_clientes_filtro_admin('apellidos', '', this.token).subscribe(
      (response) => {
        const clientes = response.data || [];
        this.kpis.clientes_activos = clientes.length;
      }
    );

    // Cupones activos
    this._cuponService.listar_cupones_admin('', this.token).subscribe(
      (response) => {
        const cupones = response.data || [];
        this.kpis.cupones_activos = cupones.filter((c: any) => c.limite > 0).length;
      }
    );
  }

  /**
   * Crea gráfico de ventas mensuales
   */
  crear_grafico_ventas_mensuales(): void {
    if (this.chartVentasMensuales) {
      this.chartVentasMensuales.destroy();
    }

    const ctx = this.ventasMensualesChart.nativeElement.getContext('2d');
    
    this.chartVentasMensuales = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.ventas_mensuales.map(v => this.formatear_mes(v.mes)),
        datasets: [
          {
            label: 'Cantidad de Ventas',
            data: this.ventas_mensuales.map(v => v.cantidad),
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Ingresos ($)',
            data: this.ventas_mensuales.map(v => v.ingresos),
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Tendencia de Ventas e Ingresos'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Cantidad de Ventas'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Ingresos ($)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  /**
   * Crea gráfico de productos top
   */
  crear_grafico_productos_top(): void {
    if (this.chartProductosTop) {
      this.chartProductosTop.destroy();
    }

    const ctx = this.productosTopChart.nativeElement.getContext('2d');
    
    this.chartProductosTop = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.productos_top.map(p => p.titulo),
        datasets: [{
          label: 'Unidades Vendidas',
          data: this.productos_top.map(p => p.ventas),
          backgroundColor: [
            'rgba(13, 110, 253, 0.8)',
            'rgba(25, 135, 84, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(220, 53, 69, 0.8)',
            'rgba(108, 117, 125, 0.8)'
          ],
          borderColor: [
            '#0d6efd',
            '#198754',
            '#ffc107',
            '#dc3545',
            '#6c757d'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 5 Productos Más Vendidos'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Unidades Vendidas'
            }
          }
        }
      }
    });
  }

  /**
   * Crea gráfico de ventas por estado
   */
  crear_grafico_ventas_estado(): void {
    if (this.chartVentasPorEstado) {
      this.chartVentasPorEstado.destroy();
    }

    const ctx = this.ventasPorEstadoChart.nativeElement.getContext('2d');
    
    this.chartVentasPorEstado = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Procesando', 'Enviado', 'Entregado', 'Cancelado'],
        datasets: [{
          data: [
            this.ventas_por_estado.procesando,
            this.ventas_por_estado.enviado,
            this.ventas_por_estado.entregado,
            this.ventas_por_estado.cancelado
          ],
          backgroundColor: [
            'rgba(255, 193, 7, 0.8)',
            'rgba(13, 202, 240, 0.8)',
            'rgba(25, 135, 84, 0.8)',
            'rgba(220, 53, 69, 0.8)'
          ],
          borderColor: [
            '#ffc107',
            '#0dcaf0',
            '#198754',
            '#dc3545'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Distribución de Ventas por Estado'
          }
        }
      }
    });
  }

  /**
   * Crea gráfico de ingresos semanales
   */
  crear_grafico_ingresos_semanales(): void {
    if (this.chartIngresosSemanales) {
      this.chartIngresosSemanales.destroy();
    }

    const ctx = this.ingresosSemanalesChart.nativeElement.getContext('2d');
    
    this.chartIngresosSemanales = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ingresos_semanales.map((s, i) => `Semana ${i + 1}`),
        datasets: [{
          label: 'Ingresos ($)',
          data: this.ingresos_semanales.map(s => s.ingresos),
          backgroundColor: 'rgba(25, 135, 84, 0.8)',
          borderColor: '#198754',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Ingresos de las Últimas 4 Semanas'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Ingresos ($)'
            }
          }
        }
      }
    });
  }

  /**
   * Cambia el período de análisis
   */
  cambiar_periodo(periodo: string): void {
    this.periodo_seleccionado = periodo;
    this.inicializar_fechas();
    this.cargar_datos_dashboard();
  }

  /**
   * Aplica filtro de fechas personalizado
   */
  aplicar_filtro_fechas(): void {
    if (!this.fecha_inicio || !this.fecha_fin) {
      this.mostrarError('Debe seleccionar ambas fechas');
      return;
    }

    if (new Date(this.fecha_inicio) > new Date(this.fecha_fin)) {
      this.mostrarError('La fecha de inicio debe ser anterior a la fecha fin');
      return;
    }

    this.cargar_datos_dashboard();
  }

  /**
   * Utilidades
   */
  formatear_fecha_input(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  formatear_mes(mes: string): string {
    const [año, mesNum] = mes.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(mesNum) - 1]} ${año}`;
  }

  obtener_numero_semana(fecha: Date): number {
    const inicioAño = new Date(fecha.getFullYear(), 0, 1);
    const dias = Math.floor((fecha.getTime() - inicioAño.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dias + inicioAño.getDay() + 1) / 7);
  }

  mostrarError(mensaje: string): void {
    iziToast.error({
      title: 'Error',
      message: mensaje,
      position: 'topRight'
    });
  }
}