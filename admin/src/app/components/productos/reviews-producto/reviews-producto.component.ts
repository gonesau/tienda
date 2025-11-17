import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { ReviewService } from 'src/app/services/review.service';
import { Global } from 'src/app/services/global';

declare var iziToast: any;

@Component({
  selector: 'app-reviews-producto',
  templateUrl: './reviews-producto.component.html',
  styleUrls: ['./reviews-producto.component.css']
})
export class ReviewsProductoComponent implements OnInit {

  public producto: any = null;
  public reviews: Array<any> = [];
  public estadisticas: any = {
    total: 0,
    promedio: 0,
    distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
  
  public id: string = '';
  public token: string;
  public url: string;
  public load_data = true;
  public load_reviews = true;

  // Paginación
  public page = 1;
  public pageSize = 10;

  // Filtros
  public filtro_rating: string = 'todos';

  // Exponer Math para usar en el template
  public Math = Math;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _productoService: ProductoService,
    private _reviewService: ReviewService
  ) {
    this.token = localStorage.getItem('token') || '';
    this.url = Global.url;
    
    if (!this.token) {
      this._router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      
      if (!this.id) {
        this.load_data = false;
        this.mostrarError('ID de producto no válido');
        this._router.navigate(['/panel/productos']);
        return;
      }
      
      this.cargar_producto();
      this.cargar_reviews();
    });
  }

  /**
   * Carga los datos del producto
   */
  cargar_producto(): void {
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
        this.load_data = false;
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
   * Carga las reviews del producto
   */
  cargar_reviews(): void {
    this.load_reviews = true;
    
    console.log('=== DEBUG CARGAR REVIEWS ===');
    console.log('ID del producto:', this.id);
    console.log('Token:', this.token ? 'Presente' : 'No presente');
    
    this._reviewService.listar_reviews_producto_admin(this.id, this.token).subscribe(
      (response) => {
        console.log('✓ Respuesta del servidor:', response);
        console.log('Reviews recibidas:', response.data);
        console.log('Estadísticas recibidas:', response.estadisticas);
        
        this.reviews = response.data || [];
        this.estadisticas = response.estadisticas || {
          total: 0,
          promedio: 0,
          distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
        
        console.log('Total de reviews cargadas:', this.reviews.length);
        this.load_reviews = false;
      },
      (error) => {
        console.error('✗ Error al cargar reviews:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        console.error('Error completo:', error);
        
        this.reviews = [];
        this.estadisticas = {
          total: 0,
          promedio: 0,
          distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
        this.load_reviews = false;
        
        this.mostrarError('Error al cargar las reseñas. Revisa la consola para más detalles.');
      }
    );
  }

  /**
   * Filtra reviews por calificación
   */
  filtrar_por_rating(rating: string): void {
    this.filtro_rating = rating;
    this.page = 1;
  }

  /**
   * Obtiene las reviews filtradas
   */
  get reviews_filtradas(): Array<any> {
    if (this.filtro_rating === 'todos') {
      return this.reviews;
    }
    
    const rating_num = parseInt(this.filtro_rating);
    return this.reviews.filter(review => review.rating === rating_num);
  }

  /**
   * Genera array de estrellas para mostrar
   */
  obtener_estrellas(rating: number): Array<boolean> {
    return Array(5).fill(false).map((_, index) => index < rating);
  }

  /**
   * Calcula el porcentaje de una calificación específica
   */
  calcular_porcentaje_rating(rating: number): number {
    if (this.estadisticas.total === 0) return 0;
    return (this.estadisticas.distribucion[rating] / this.estadisticas.total) * 100;
  }

  /**
   * Formatea la fecha
   */
  formatear_fecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
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
      position: 'topRight',
    });
  }
}