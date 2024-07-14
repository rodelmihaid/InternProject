import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: [''],
      message: ['', Validators.required],
    });
  }

  send() {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        text: 'Please fill in all required fields correctly.',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-start',
        showConfirmButton: false,
      });
      return;
    }

    emailjs.init('3-qrVCNGmTIPS8Xym');
    emailjs
      .send('service_ttc8bik', 'template_k3k8c3z', {
        from_name: this.form.value.name,
        from_email: this.form.value.email,
        subject: this.form.value.subject,
        message: this.form.value.message,
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          text: 'Message sent successfully',
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-start',
          showConfirmButton: false,
        });
        this.form.reset();
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          text: 'There was an error sending your message. Please try again later.',
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-start',
          showConfirmButton: false,
        });
        console.error('Error sending email:', error);
      });
  }
}
