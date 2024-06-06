import { Component, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import {
  EventService,
  EventsService,
} from 'src/app/services/events/events.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  ngOnInit(): void {
    this.loadInternshipPeriod();
  }
  startDate!: Date;
  endDate!: Date;
  months: any[] = [];
  currentViewMonth!: number;
  currentViewYear!: number;
  user: Observable<any>;
  selectedDay: number | null = null; // Adaugă această linie
  events: { [key: number]: Event[] } = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private eventService: EventsService
  ) {
    this.user = authService.userData;
    console.log(this.user);
    this.eventService.getEventList().subscribe((data) => {
      for (let date of data) {
        console.log(date);
        if (date) {
          if (!this.events[date.day]) {
            this.events[date.day] = [];
          }
          this.events[date.day].push({
            month: date.month + 1,
            text: date.text,
          });
        }
      }
      console.log(this.events);
    });
  }

  isAdmin(): boolean {
    if (this.authService.isAdmin == true) {
      return true;
    }
    return false;
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['login']);
  }

  loadInternshipPeriod(): void {
    this.authService.getInternshipPeriod().subscribe((doc) => {
      if (doc.exists) {
        const data = doc.data() as InternshipPeriod;
        this.startDate = new Date(data.startDate);
        this.endDate = new Date(data.endDate);
        this.checkDatesAndGenerate();
      }
    });
  }

  saveInternshipPeriod(): void {
    this.authService
      .setInternshipPeriod(this.startDate, this.endDate)
      .then(() => {
        console.log('Internship period saved successfully');
      })
      .catch((error) => {
        console.error('Error saving internship period:', error);
      });
  }

  checkDatesAndGenerate(): void {
    if (this.startDate && this.endDate) {
      this.generateCalendar(this.startDate, this.endDate);
      this.currentViewMonth = this.startDate.getMonth();
      this.currentViewYear = this.startDate.getFullYear();
      console.log(this.currentViewMonth, this.currentViewYear);
    }
  }

  generateCalendar(startDate: Date, endDate: Date): void {
    this.months = []; // Resetează luni existente înainte de regenerare
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const days = [];

      // Calculăm prima zi a lunii curente
      const firstDay = currentDate.getDay();
      // Aflăm ce zi a săptămânii este (0=Duminică, 1=Luni,...)
      let startDayOfWeek = firstDay + 1;
      if (startDayOfWeek === 0) {
        // Dacă este duminică, să înceapă de la 6 pentru a fi ultima
        startDayOfWeek = 6;
      } else {
        startDayOfWeek--; // Altfel, luni să fie 0, marți să fie 1, etc.
      }

      // Umplem zilele dinaintea primei zile a lunii curente
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push(0);
      }

      // Adăugăm zilele lunii curente
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= numDays; day++) {
        const dayDate = new Date(year, month, day);
        if (dayDate >= startDate && dayDate <= endDate) {
          days.push(day);
        }
      }

      // Adăugăm luna și zilele la array-ul de luni
      if (days.length > 0) {
        this.months.push({ year, month, days });
      }

      // Setăm data curentă la începutul lunii următoare
      currentDate = new Date(year, month + 1, 1);
    }
  }

  goToNextMonth(endDate: Date): void {
    if (
      this.currentViewMonth === 11 &&
      this.currentViewYear < endDate.getFullYear()
    ) {
      this.currentViewMonth = 0;
      this.currentViewYear++;
      console.log(this.currentViewMonth);
    } else if (this.currentViewMonth < endDate.getMonth()) {
      this.currentViewMonth++;
      console.log(this.currentViewMonth);
    }
  }

  goToPreviousMonth(startDate: Date): void {
    if (
      this.currentViewMonth === 0 &&
      this.currentViewYear > startDate.getFullYear()
    ) {
      this.currentViewMonth = 11;
      this.currentViewYear--;
    } else if (this.currentViewMonth > startDate.getMonth()) {
      this.currentViewMonth--;
    }
  }

  onDateChange(event: MatDatepickerInputEvent<Date>, dateType: string): void {
    if (dateType === 'start') {
      this.startDate = event.value!;
    } else if (dateType === 'end') {
      this.endDate = event.value!;
    }
    this.checkDatesAndGenerate();
    this.saveInternshipPeriod();
  }

  selectDay(day: number, currentMonth: number): void {
    if (this.selectedDay) {
      this.eventTitle = '';
    }
    this.selectedDay = day; // Setează ziua selectată
    console.log(this.selectedDay);
  }
  eventTitle: string = '';
  newEvent!: EventToFirebase;
  addEvent(text: string): void {
    if (this.selectedDay) {
      if (!this.events[this.selectedDay]) {
        this.events[this.selectedDay] = [];
      }
      this.events[this.selectedDay].push({
        month: this.currentViewMonth + 1,
        text: text,
      });

      this.newEvent = {
        day: this.selectedDay,
        month: this.currentViewMonth,
        text: text,
      };

      this.eventService.addEvent(this.newEvent);

      console.log(this.events[this.selectedDay]);
      this.selectedDay = null; //
      this.eventTitle = '';
    }
  }

  getEventsForSelectedDay(day: number): Event[] {
    return this.events[day] || [];
  }

  closeForm(): void {
    this.selectedDay = null; // Resetează ziua selectată pentru a închide formularul
    this.eventTitle = ''; // Opțional, poți să resetezi și titlul evenimentului
  }
}

interface Event {
  month: number;
  text: string;
}
export interface EventToFirebase {
  day: number;
  month: number;
  text: string;
}
interface InternshipPeriod {
  startDate: string;
  endDate: string;
}
