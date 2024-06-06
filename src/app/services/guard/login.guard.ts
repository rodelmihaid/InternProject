import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';

import { AuthService } from '../auth.service';
@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(public authService: AuthService, public router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (localStorage.getItem('role') != 'ADMIN') {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
