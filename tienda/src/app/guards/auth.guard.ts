import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ClienteService } from '../services/cliente.service';
import {Router} from "@angular/router"

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private _adminService:ClienteService,
    private _router:Router
  ){
  }

  canActivate():any{
    if(!this._adminService.isAuthenticated()){
      this._router.navigate(['/login']);
      return false;
    }
    return true;
  }
  
}
