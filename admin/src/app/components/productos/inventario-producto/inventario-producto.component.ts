import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';

@Component({
  selector: 'app-inventario-producto',
  templateUrl: './inventario-producto.component.html',
  styleUrls: ['./inventario-producto.component.css']
})
export class InventarioProductoComponent implements OnInit {
  public id;
  public producto: any = {};
  public token;

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) { 
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
        this._route.params.subscribe((params) => {
      this.id = params['id'];
      this._productoService
        .obtener_producto_admin(this.id, this.token)
        .subscribe(
          (response) => {
            if (response.data == undefined) {
              this.producto = undefined;
            } else {
              this.producto = response.data;
            }
          },
          (error) => {
            console.log(error);
          }
        );
    });
  }

}
