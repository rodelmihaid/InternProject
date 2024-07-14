import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | any>;
  userData: any;
  isAuthenticated?: boolean;
  isAdmin$: Observable<boolean>;
  private isAdminSubject: BehaviorSubject<boolean>;
  private userIdSubject: BehaviorSubject<string | null>;
  userId$: Observable<string | null>;

  constructor(
    private afs: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    private http: HttpClient
  ) {
    this.isAdminSubject = new BehaviorSubject<boolean>(false);
    this.userIdSubject = new BehaviorSubject<string | null>(null);

    this.userId$ = this.userIdSubject.asObservable();

    this.isAdmin$ = this.isAdminSubject.asObservable();
    this.user$ = this.afs.authState;

    this.user$.subscribe((user) => {
      if (user) {
        this.userIdSubject.next(user.uid);

        // Dacă există un utilizator autentificat, obține datele utilizatorului din Firestore
        this.firestore
          .doc<any>(`users/${user.uid}`)
          .valueChanges()
          .subscribe((userData) => {
            this.userData = userData;

            this.isAdminSubject.next(this.userData.isAdmin);
            this.isAuthenticated = true;
          });
      } else {
        this.userData = undefined;
        this.userIdSubject.next(null);
        this.isAuthenticated = false;
        this.isAdminSubject.next(false);
      }
    });
  }

  //
  sendEmailWithCredentials(email: string, password: string) {
    const apiUrl = 'https://localhost:7286/api/Email';
    // Înlocuiește cu URL-ul tău de backend
    return this.http.post(apiUrl, { email, password }).toPromise();
  }

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
        ),
        map((users) => users.filter((user) => user.email !== 'admin@gmail.com'))
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
