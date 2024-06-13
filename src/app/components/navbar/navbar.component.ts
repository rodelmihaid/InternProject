import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isAdmin: boolean = false;

  constructor(public authService: AuthService) {
    this.isAuthenticated();
    console.log(this.isAdmin);
  }

  ngOnInit(): void {
    this.authService.isAdmin$.subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  signOut() {
    this.authService.signOut();
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  isAuthenticated(): boolean {
    if (this.authService.user$) {
      return true;
    }
    return false;
  }
}
