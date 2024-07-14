import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EmailSchedule {
  private apiUrl = 'https://localhost:7286/api/ReminderEmail';
  // Înlocuiește cu URL-ul tău de backend

  constructor(
    private afs: AngularFireAuth,
    private firestore: AngularFirestore,
    private http: HttpClient
  ) {}

  getUsersEmails(): Observable<string[]> {
    return this.firestore
      .collection('users')
      .valueChanges()
      .pipe(
        map((users: any[]) => users.map((user) => user.email)),
        map((emails: string[]) =>
          emails.filter((email) => email !== 'admin@gmail.com')
        )
      );
  }

  getEvents(): Observable<any[]> {
    return this.firestore
      .collection('events')
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      );
  }

  scheduleReminderEmail(
    emails: string[],
    subject: string,
    body: string,
    scheduledTime: Date,
    maxDayDifference: number
  ) {
    return this.http
      .post(this.apiUrl, {
        emails,
        subject,
        body,
        scheduledTime: scheduledTime.toISOString(), // Convertim la formatul ISO 8601
        maxDayDifference,
      })
      .toPromise();
  }

  checkAndSendEmailsForTomorrow() {
    const currentDate = new Date();
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);

    this.getUsersEmails()
      .pipe(
        switchMap((emails) =>
          this.getEvents().pipe(map((events) => ({ emails, events })))
        )
      )
      .subscribe(({ emails, events }) => {
        const tomorrowEvents = events.filter((event) => {
          const eventDate = new Date(
            currentDate.getFullYear(),
            event.month,
            event.day,
            0,
            0,
            0,
            0
          );

          return (
            eventDate.getDate() === tomorrow.getDate() &&
            eventDate.getMonth() === tomorrow.getMonth() &&
            eventDate.getFullYear() === tomorrow.getFullYear() &&
            !event.emailSent
          );
        });

        if (tomorrowEvents.length > 0) {
          tomorrowEvents.forEach((event) => {
            console.log(event);

            const eventDate = new Date(
              currentDate.getFullYear(),
              event.month,
              event.day,
              24,
              0,
              0,
              0
            );
            console.log(eventDate);

            const scheduledTime = new Date(eventDate);
            scheduledTime.setDate(eventDate.getDate());

            const body = `Event Reminder: ${event.text} is scheduled on ${
              event.day
            }/${event.month + 1} from ${event.startTime} to ${event.endTime}.`;

            console.log(scheduledTime.toISOString());
            console.log(emails);

            this.scheduleReminderEmail(
              emails,
              'Upcoming Event Reminder',
              body,
              eventDate,
              1
            )
              .then(() => {
                console.log(
                  `Reminder email scheduled successfully for event: ${event.text}`
                );
                // Actualizează flag-ul emailSent în Firebase
                this.firestore
                  .collection('events')
                  .doc(event.id)
                  .update({ emailSent: true });
              })
              .catch((error) => {
                console.error('Error scheduling reminder email:', error);
              });
          });
        }
      });
  }
}
