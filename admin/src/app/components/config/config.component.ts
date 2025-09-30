import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  public token;
  public config: any = {};

  constructor(
    private _adminService: AdminService
  ) {
    this.token = localStorage.getItem('token');
    this._adminService.obtener_config_admin(this.token).subscribe(
      response => {
        console.log(response);
        this.config = response.data;
      }, error => {
        console.log(error);
      }
    );
  }

  ngOnInit(): void {
  }

}
