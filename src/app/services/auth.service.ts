import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | any>;
  userData: any;
  isAuthenticated?: boolean;
  isAdmin?: boolean;

  constructor(
    private afs: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afs.authState;
    console.log(this.user$);

    this.user$.subscribe((user) => {
      if (user) {
        // Dacă există un utilizator autentificat, obține datele utilizatorului din Firestore
        this.firestore
          .doc<any>(`users/${user.uid}`)
          .valueChanges()
          .subscribe((userData) => {
            this.userData = JSON.stringify(userData);
            console.log(this.userData);
            console.log('AICITATA');
            this.isAuthenticated = true;
            console.log(this.isAuthenticated);
          });
      } else {
        this.userData = undefined;
        console.log(this.userData);

        this.isAuthenticated = false;
        this.isAdmin = false;
      }
    });
  }

  //

  registerUserWithEmailAndPassword(email: string, password: string) {
    return this.afs
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        return this.firestore.doc(`users/${result.user?.uid}`).set({
          email: result.user?.email,
          isAdmin: false,
        });
      });
  }

  getUsers(): Observable<any[]> {
    return this.firestore
      .collection('users')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
  }

  deleteUser(id: string): Promise<void> {
    return this.firestore.collection('users').doc(id).delete();
  }

  getInternshipPeriod() {
    return this.firestore.collection('internshipPeriod').doc('period').get();
  }
  ForgotPassword(passwordResetEmail: string) {
    return this.afs
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        Swal.fire({
          icon: 'success',
          text: 'Password reset email sent, check your inbox.',
          timer: 2000, // Ascunde automat alerta după 3 secunde
          timerProgressBar: true, // Bară de progres pentru durata alertei
          toast: true, // Afișează alerta ca și toast
          position: 'top-start', // Poziția alertei
          showConfirmButton: false, // Nu afișa butonul de confirmare
        }).then(() => {
          this.router.navigate(['/login']);
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          text: error,
          timer: 3000, // Ascunde automat alerta după 3 secunde
          timerProgressBar: true, // Bară de progres pentru durata alertei
          toast: true, // Afișează alerta ca și toast
          position: 'top-start', // Poziția alertei
          showConfirmButton: false, // Nu afișa butonul de confirmare
        });
      });
  }

  setInternshipPeriod(startDate: Date, endDate: Date) {
    return this.firestore.collection('internshipPeriod').doc('period').set({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }
  registerAdminWithEmailAndPassword(email: string, password: string) {
    return this.afs
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        return this.firestore.doc(`users/${result.user?.uid}`).set({
          email: result.user?.email,
          isAdmin: true,
        });
      });
  }

  // signInWithEmailAndPassword(email: string, password: string) {
  //   return this.afs.signInWithEmailAndPassword(email, password);
  // }
  signInWithEmailAndPassword(email: string, password: string) {
    return this.afs
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.afs.authState.subscribe((user) => {
          if (user) {
            this.firestore
              .doc(`users/${user.uid}`)
              .valueChanges()
              .subscribe((userData: any) => {
                if (userData) {
                  this.isAdmin = userData.isAdmin;
                  console.log(userData.isAdmin);
                }
              });
          }
        });
      });
  }

  signOut() {
    return this.afs
      .signOut()
      .then(() => {
        this.router.navigate(['/login']).then(() => {
          window.location.reload(); // Reîmprospătează pagina
        });
      })
      .catch((err) => {
        alert(err);
      });
  }
  signOutLogin() {
    return this.afs.signOut();
  }

  SendVerificationMail() {
    return this.afs.currentUser
      .then((u: any) =>
        u.sendEmailVerification({
          url: 'http://localhost:4200/login',
        })
      )
      .then(() => {
        this.router.navigate(['calendar']);
      });
  }
}
interface User {
  uid: string;
  email: string;
  role: string;
}
