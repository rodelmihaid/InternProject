import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | any>;
  userData: any;

  constructor(
    private afs: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    this.user$ = this.afs.authState;

    this.user$.subscribe((user) => {
      if (user) {
        // Dacă există un utilizator autentificat, obține datele utilizatorului din Firestore
        this.firestore
          .doc<any>(`users/${user.uid}`)
          .valueChanges()
          .subscribe((userData) => {
            this.userData = userData;
          });
      } else {
        // Dacă nu există un utilizator autentificat, resetează datele utilizatorului
        this.userData = null;
      }
    });
  }

  isAdmin(): boolean {
    if (localStorage.getItem('role') == 'ADMIN') {
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    if (this.userData) {
      return true;
    }
    return false;
  }

  getRole(user: any): string | null {
    if (user && user.roles) {
      const roles = Object.keys(user.roles);
      for (let role of roles) {
        if (user.roles[role]) {
          localStorage.setItem('role', role);
          return role;
        }
      }
    }
    return null; // Dacă nu se găsește niciun rol cu valoarea true
  }

  registerUserWithEmailAndPassword(email: string, password: string) {
    return this.afs
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        return this.firestore.doc(`users/${result.user?.uid}`).set({
          email: result.user?.email,
          roles: {
            USER: true,
            ADMIN: false,
            STAFF: false,
          },
        });
      });
  }

  getInternshipPeriod() {
    return this.firestore.collection('internshipPeriod').doc('period').get();
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
          roles: {
            USER: false,
            ADMIN: true,
            STAFF: false,
          },
        });
      });
  }

  registerStaffWithEmailAndPassword(email: string, password: string) {
    return this.afs
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        return this.firestore.doc(`users/${result.user?.uid}`).set({
          email: result.user?.email,
          roles: {
            USER: false,
            ADMIN: false,
            STAFF: true,
          },
        });
      });
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return this.afs.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this.afs.signOut();
  }
}
interface User {
  uid: string;
  email: string;
  role: string;
}
