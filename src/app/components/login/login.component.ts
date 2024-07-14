import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';

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
  user!: any;

  constructor(public authService: AuthService, private router: Router) {
    authService.signOutLogin();
  }

  onSubmit() {
    this.authService
      .signInWithEmailAndPassword(this.loginData.email, this.loginData.password)
      .then(() => {
        this.router.navigate(['/home']);
        swal.fire({
          icon: 'success',
          text: 'You have successfully signed',
          timer: 2000, // Ascunde automat alerta după 3 secunde
          timerProgressBar: true, // Bară de progres pentru durata alertei
          toast: true, // Afișează alerta ca și toast
          position: 'top-start', // Poziția alertei
          showConfirmButton: false, // Nu afișa butonul de confirmare
        });
      })
      .catch((err) => {
        this.errorMessage = err.message;
        swal.fire({
          icon: 'error',
          text: this.errorMessage,
          timer: 3000, // Ascunde automat alerta după 3 secunde
          timerProgressBar: true, // Bară de progres pentru durata alertei
          toast: true, // Afișează alerta ca și toast
          position: 'top-start', // Poziția alertei
          showConfirmButton: false, // Nu afișa butonul de confirmare
        });
      });
  }

  ngOnInit(): void {}
}
