import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Message {
  id?: string;
  userId: string;
  userName: string;
  content: string;
  isAdmin: boolean;
  timestamp: Date;
  assignedProject?: string; // Nou camp adaugat
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private authService: AuthService
  ) {}

  getMessages(): Observable<Message[]> {
    return this.firestore
      .collection<Message>('messages', (ref) => ref.orderBy('timestamp'))
      .valueChanges({ idField: 'id' })
      .pipe(
        switchMap((messages) => {
          const messageObservables = messages.map((message) =>
            this.firestore
              .collection('assignedProjects')
              .doc(message.userId)
              .valueChanges()
              .pipe(
                switchMap((assignedProjectDoc: any) => {
                  if (
                    assignedProjectDoc &&
                    assignedProjectDoc.assignedProjectId
                  ) {
                    return this.firestore
                      .collection('projects')
                      .doc(assignedProjectDoc.assignedProjectId)
                      .valueChanges()
                      .pipe(
                        map((project: any) => ({
                          ...message,
                          assignedProject:
                            project?.title || 'No project assigned',
                        }))
                      );
                  } else {
                    return of({
                      ...message,
                      assignedProject: 'No project assigned',
                    });
                  }
                })
              )
          );

          return combineLatest(messageObservables);
        })
      );
  }

  sendMessage(content: string): void {
    this.afAuth.currentUser.then((user) => {
      if (user) {
        this.authService.isAdmin$.subscribe((isAdmin) => {
          const message: Message = {
            userId: user.uid,
            userName: user.email ?? 'Anonymous', // Utilizează emailul ca nume de utilizator
            content,
            isAdmin, // Setează valoarea isAdmin
            timestamp: new Date(),
          };
          this.firestore.collection('messages').add(message);
        });
      }
    });
  }
}
