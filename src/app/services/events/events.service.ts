import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import {
  Event,
  EventToFirebase,
} from 'src/app/components/calendar/calendar.component';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private firestore: AngularFirestore) {}

  addEvent(event: Event): Promise<any> {
    return this.firestore.collection('events').add(event);
  }

  getEventList(): Observable<Event[]> {
    return this.firestore
      .collection<Event>('events')
      .valueChanges({ idField: 'id' });
  }
  deleteEvent(eventId: string): Promise<void> {
    return this.firestore.collection('events').doc(eventId).delete();
  }

  updateEvent(eventId: string, event: Event): Promise<void> {
    return this.firestore.collection('events').doc(eventId).update(event);
  }
}
export interface EventService {
  id: string;
  day: number;
  month: number;
  text: string;
  // isAccepted?: boolean;
}
