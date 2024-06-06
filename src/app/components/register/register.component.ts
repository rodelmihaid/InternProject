import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  getFunctions,
  httpsCallable,
  httpsCallableFromURL,
} from 'firebase/functions';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  email: string = '';
  private functions = getFunctions();

  constructor(private authService: AuthService, private route: Router) {}

  generateRandomPassword(length: number): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  onRegister() {
    const password = this.generateRandomPassword(8);
    this.authService
      .registerUserWithEmailAndPassword(this.email, password)
      .then(() => {
        console.log('User registered successfully');
        console.log(password);
        this.route.navigate(['calendar']);
      });
  }
}
