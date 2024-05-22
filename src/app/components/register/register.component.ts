import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  email: string = '';

  constructor(private authService: AuthService) {}

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
      })
      .catch((error) => {
        console.error('Error registering user:', error);
      });
  }
}
