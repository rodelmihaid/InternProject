import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import { EventToFirebase } from 'src/app/components/calendar/calendar.component';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private firestore: AngularFirestore) {}

  addEvent(event: EventToFirebase): Promise<any> {
    return this.firestore.collection('events').add(event);
  }

  getEventList(): Observable<EventService[]> {
    return this.firestore
      .collection('events')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as EventService;
            const id = a.payload.doc.id;
            data.id = id;
            return { ...data }; // Returnează datele împreună cu ID-ul documentului
          })
        )
      );
  }
}
export interface EventService {
  id: string;
  day: number;
  month: number;
  text: string;
  // isAccepted?: boolean;
}
