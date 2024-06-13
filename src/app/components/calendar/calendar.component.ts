import { Component, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { EventDialogComponent } from 'src/app/dialogs/event-dialog/event-dialog.component';
import { MonthNamePipe } from 'src/app/pipe/month-name.pipe';
import { AuthService } from 'src/app/services/auth.service';
import { EventsService } from 'src/app/services/events/events.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  ngOnInit(): void {
    this.loadInternshipPeriod();
    this.authService.isAdmin$.subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }
  startDate!: Date;
  endDate!: Date;
  months: any[] = [];
  currentViewMonth!: number;
  currentViewYear!: number;
  user: Observable<any>;
  selectedDay: number | null = null; // Adaugă această linie
  events: { [key: number]: Event[] } = {};
  isAdmin?: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    private eventService: EventsService,
    public dialog: MatDialog // Adăugare MatDialog
  ) {
    this.user = authService.userData;
    console.log(this.user);
    this.eventService.getEventList().subscribe((data) => {
      this.events = {};
      for (let date of data) {
        date.month += 1;
        if (date) {
          if (!this.events[date.day]) {
            this.events[date.day] = [];
          }
          this.events[date.day].push(date);
        }
      }
      this.authService.isAdmin$.subscribe((isAdmin) => {
        this.isAdmin = isAdmin;
      });
    });
  }

  getDayClass(day: number, month: number, year: number): string {
    const currentDate = new Date(year, month, day);
    if (currentDate < this.startDate || currentDate > this.endDate) {
      return 'bg-customBlue-400 bg-opacity-50';
    } else if (currentDate >= this.startDate && currentDate <= this.endDate) {
      if (
        currentDate.toDateString() === this.startDate.toDateString() ||
        currentDate.toDateString() === this.endDate.toDateString()
      ) {
        return 'bg-customOrange-400 bg-opacity-50';
      }
      return 'bg-white'; // Default color for dates within the period
    } else {
      return 'bg-white';
    }
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
    this.startTime = '';
    this.endTime = '';
    if (this.selectedDay) {
      this.eventTitle = '';
    }
    this.selectedDay = day; // Setează ziua selectată
    console.log(this.selectedDay);
  }
  eventTitle: string = '';
  startTime: string = '';
  endTime: string = '';
  newEvent!: Event;
  addEvent(text: string): void {
    if (this.selectedDay) {
      if (!this.events[this.selectedDay]) {
        this.events[this.selectedDay] = [];
      }
      this.events[this.selectedDay].push({
        day: this.selectedDay,
        month: this.currentViewMonth + 1,
        text: text,
        startTime: this.startTime,
        endTime: this.endTime,
      });

      this.newEvent = {
        day: this.selectedDay,
        month: this.currentViewMonth,
        text: text,
        startTime: this.startTime,
        endTime: this.endTime,
      };

      this.eventService.addEvent(this.newEvent);

      this.selectedDay = null;
      this.eventTitle = '';
      this.startTime = '';
      this.endTime = '';
    }
  }

  getEventsForSelectedDay(day: number): Event[] {
    return this.events[day] || [];
  }

  closeForm(): void {
    this.selectedDay = null; // Resetează ziua selectată pentru a închide formularul
    this.eventTitle = ''; // Opțional, poți să resetezi și titlul evenimentului
  }

  getWeeksInMonth(year: number, month: number): number[][] {
    const weeks: number[][] = [];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const numDaysInMonth = new Date(year, month + 1, 0).getDate();
    let week: number[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push(0);
    }

    for (let day = 1; day <= numDaysInMonth; day++) {
      week.push(day);
      if (week.length === 7 || day === numDaysInMonth) {
        weeks.push(week);
        week = [];
      }
    }

    while (week.length > 0 && week.length < 7) {
      week.push(0);
    }
    if (week.length > 0) {
      weeks.push(week);
    }

    return weeks;
  }
  editEvent(event: Event): void {
    const updatedText = prompt('Edit event text:', event.text);
    if (updatedText !== null) {
      event.text = updatedText;
      event.month -= 1;
      this.eventService.updateEvent(event.id!, event);
    }
  }

  deleteEvent(event: Event): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(event.id!);
      const dayEvents = this.events[event.day];
      const index = dayEvents.indexOf(event);
      if (index > -1) {
        dayEvents.splice(index, 1);
      }
    }
  }

  openEventDialog(day: number, month: number): void {
    const events = this.events[day] || [];

    this.dialog.open(EventDialogComponent, {
      data: {
        day,
        month: month + 1,
        events,
      },
    });
  }
}

export interface Event {
  id?: string;
  day: number;
  month: number;
  text: string;
  startTime: string;
  endTime: string;
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
