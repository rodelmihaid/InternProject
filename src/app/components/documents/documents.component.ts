import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, combineLatest, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

interface DocumentData {
  userId: string;
  [key: string]: any; // Adăugăm acest index pentru a permite accesul dinamic la câmpuri
}

interface UserData {
  uid: string;
  email: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
})
export class DocumentsComponent implements OnInit {
  documents$: Observable<any[]> = of([]);

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.documents$ = this.firestore
      .collection('documents')
      .snapshotChanges()
      .pipe(
        switchMap((actions) => {
          const docs = actions.map((a) => {
            const data = a.payload.doc.data() as DocumentData;
            const id = a.payload.doc.id;
            data.userId = id;
            return { id, ...data };
          });

          if (docs.length === 0) {
            return of([]);
          }

          const userObservables = docs.map((doc) =>
            this.firestore
              .collection('users')
              .doc(doc.userId)
              .valueChanges()
              .pipe(
                map((userData) => ({
                  ...doc,
                  user: userData as UserData,
                }))
              )
          );

          return combineLatest(userObservables);
        })
      );
  }

  downloadFile(fileName: string, userId: string) {
    if (userId) {
      const filePath = `documents/${userId}/${fileName.replace(/_/g, '.')}`;
      const fileRef = this.storage.ref(filePath);

      fileRef.getDownloadURL().subscribe((url) => {
        this.forceDownload(url, fileName);
      });
    }
  }

  forceDownload(url: string, fileName: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getDocumentKeys(doc: any): string[] {
    return Object.keys(doc).filter((key) => key !== 'userId' && key !== 'user');
  }
  //b@gmail.com wy4CoiPx
  isDownloadURL(key: string): boolean {
    return (
      key.endsWith('_jpg') ||
      key.endsWith('_jpeg') ||
      key.endsWith('_png') ||
      key.endsWith('_pdf') ||
      key.endsWith('_rar') ||
      key.endsWith('_zip')
    ); // Adaugă alte extensii după nevoie
  }
}
