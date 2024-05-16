import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  currentMonth: number;
  currentYear: number;
  daysOfMonth: number[] = [];
  selectedDay: number | null = null; // Adaugă această linie
  key!: number;
  events: { [key: number]: Event[] } = {};

  constructor() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.generateCalendarDays(this.currentMonth, this.currentYear);
  }

  generateCalendarDays(month: number, year: number): void {
    this.daysOfMonth = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    for (let empty = 0; empty < startDay; empty++) {
      this.daysOfMonth.push(0);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      this.daysOfMonth.push(day);
    }
  }

  goToNextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarDays(this.currentMonth, this.currentYear);
  }

  goToPreviousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendarDays(this.currentMonth, this.currentYear);
  }

  selectedMonth() {}

  selectDay(day: number, currentMonth: number): void {
    if (this.selectedDay) {
      this.eventTitle = '';
    }
    this.selectedDay = day; // Setează ziua selectată
    console.log(this.selectedDay);
  }
  eventTitle: string = '';

  addEvent(text: string): void {
    if (this.selectedDay) {
      if (!this.events[this.selectedDay]) {
        this.events[this.selectedDay] = [];
      }
      this.events[this.selectedDay].push({
        month: this.currentMonth + 1,
        text: text,
      });
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
