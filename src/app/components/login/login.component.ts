import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
  };
  errorMessage: string = '';

  constructor(public authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .signInWithEmailAndPassword(this.loginData.email, this.loginData.password)
      .then(() => {
        console.log('Login data:', this.loginData);
        console.log('Login successfully');
        this.router.navigate(['/calendar']); // Redirecționează utilizatorul către pagina /calendar
      })
      .catch((err) => {
        this.errorMessage = err.message;
        console.log(this.errorMessage);
      });
    // Aici poți adăuga logica pentru autentificare, de exemplu trimiterea datelor către un server
  }
  ngOnInit(): void {}
}
