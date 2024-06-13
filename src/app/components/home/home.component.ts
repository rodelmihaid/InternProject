import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import firebase from 'firebase/compat/app';

interface User {
  email: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedFileName: string | null = null;
  selectedFile: File | null = null;
  userId: string | null = null;
  documents: { name: string; url: string }[] = [];
  isAdmin: boolean = false;
  email: string = '';

  constructor(
    private storage: AngularFireStorage,
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.userId$.subscribe((userId) => {
      if (userId) {
        this.userId = userId;
        console.log(userId);
        this.firestore
          .collection('users')
          .doc<User>(this.userId)
          .get()
          .subscribe((doc) => {
            if (doc.exists) {
              this.email = doc.data()!.email;
              console.log('Email:', this.email);
            }
          });
        this.loadDocuments();
      }
      this.email;
    });
    this.authService.isAdmin$.subscribe((auth) => {
      this.isAdmin = auth;
      console.log(this.isAdmin);
    });
  }

  uploadDocument() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.selectedFile = file;
    }
  }

  addDocument() {
    if (this.selectedFile && this.userId) {
      const sanitizedFileName = this.selectedFile.name.replace(/\./g, '_');
      const filePath = `documents/${this.userId}/${this.selectedFile.name}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, this.selectedFile);

      uploadTask
        .snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe((url) => {
              this.saveFileData(this.userId!, sanitizedFileName, url);
              this.resetSelection();
              this.loadDocuments(); // Reload documents after adding a new one
            });
          })
        )
        .subscribe();
    }
  }

  cancelSelection() {
    this.resetSelection();
  }

  resetSelection() {
    this.selectedFileName = null;
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
  }

  saveFileData(userId: string, fileName: string, downloadURL: string) {
    const docRef = this.firestore.collection('documents').doc(userId);
    const updateData: { [key: string]: any } = {};
    updateData[fileName] = downloadURL;
    docRef.set(updateData, { merge: true });
  }

  loadDocuments() {
    if (this.userId) {
      this.firestore
        .collection('documents')
        .doc(this.userId)
        .get()
        .subscribe((doc) => {
          const data = doc.data() as { [key: string]: string } | undefined;
          if (data) {
            this.documents = Object.keys(data).map((key) => ({
              name: key.replace(/_/g, '.'),
              url: data[key],
            }));
          }
        });
    }
  }

  deleteDocument(fileName: string) {
    if (this.userId) {
      const sanitizedFileName = fileName.replace(/\./g, '_'); //g e global, fara g inlocuieste doar prima aparitie
      const filePath = `documents/${this.userId}/${fileName}`;
      const fileRef = this.storage.ref(filePath);

      fileRef.delete().subscribe(() => {
        const updateData: { [key: string]: any } = {};
        updateData[sanitizedFileName] = firebase.firestore.FieldValue.delete();
        this.firestore
          .collection('documents')
          .doc(this.userId as string)
          .update(updateData)
          .then(() => {
            console.log(
              'Field deleted successfully:',
              this.userId as string,
              sanitizedFileName
            );
            this.loadDocuments();
          })
          .catch((error) => {
            console.log('Error deleting field:', error);
          });
      });
    }
  }
}
