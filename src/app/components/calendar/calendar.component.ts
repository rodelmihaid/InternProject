import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  startDate!: Date;
  endDate!: Date;
  months: any[] = [];
  currentViewMonth!: number;
  currentViewYear!: number;

  constructor() {}

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
    } else if (this.currentViewMonth < endDate.getMonth()) {
      this.currentViewMonth++;
      console.log(this.currentViewMonth);
      console.log(endDate.getMonth());
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

  // currentMonth!: number;
  // currentYear!: number;
  // daysOfMonth: number[] = [];
  selectedDay: number | null = null; // Adaugă această linie
  // key!: number;
  events: { [key: number]: Event[] } = {};
  // startDate!: Date;
  // endDate!: Date;
  // months: any[] = [];

  // constructor() {
  //   const today = new Date();
  //   this.currentMonth = today.getMonth();
  //   this.currentYear = today.getFullYear();
  //   this.generateCalendarDays(this.currentMonth, this.currentYear);
  //   // this.generateCalendar(this.startDate, this.endDate);
  // }

  // generateCalendar(startDate: Date, endDate: Date): void {
  //   this.currentMonth = this.startDate.getMonth();
  //   this.currentYear = this.startDate.getFullYear();
  //   const startMonth = startDate.getMonth();
  //   const endMonth = endDate.getMonth();
  //   const startYear = startDate.getFullYear();
  //   const endYear = endDate.getFullYear();

  //   for (let year = startYear; year <= endYear; year++) {
  //     const firstMonth = year === startYear ? startMonth : 0;
  //     const lastMonth = year === endYear ? endMonth : 11;

  //     for (let month = firstMonth; month <= lastMonth; month++) {
  //       const days = [];
  //       const numDays = new Date(year, month + 1, 0).getDate();

  //       for (let day = 1; day <= numDays; day++) {
  //         const currentDate = new Date(year, month, day);
  //         if (currentDate >= startDate && currentDate <= endDate) {
  //           days.push(day);
  //         }
  //       }
  //       if (days.length > 0) {
  //         this.months.push({ year, month, days });
  //       }
  //     }
  //   }
  // }
  // generateCalendarDays(month: number, year: number): void {
  //   this.daysOfMonth = [];
  //   const daysInMonth = new Date(year, month + 1, 0).getDate();
  //   const startDay = new Date(year, month, 1).getDay();

  //   for (let empty = 0; empty < startDay; empty++) {
  //     this.daysOfMonth.push(0);
  //   }
  //   for (let day = 1; day <= daysInMonth; day++) {
  //     this.daysOfMonth.push(day);
  //   }
  // }

  // goToNextMonth(): void {
  //   if (this.currentMonth === 11) {
  //     this.currentMonth = 0;
  //     this.currentYear++;
  //   } else {
  //     this.currentMonth++;
  //   }
  //   this.generateCalendarDays(this.currentMonth, this.currentYear);
  // }

  // goToPreviousMonth(): void {
  //   if (this.currentMonth === 0) {
  //     this.currentMonth = 11;
  //     this.currentYear--;
  //   } else {
  //     this.currentMonth--;
  //   }
  //   this.generateCalendarDays(this.currentMonth, this.currentYear);
  // }

  // selectedMonth() {}

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
        month: this.currentViewMonth + 1,
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
