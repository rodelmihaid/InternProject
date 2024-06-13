import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthName',
})
export class MonthNamePipe implements PipeTransform {
  private monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  transform(value: number): string {
    return this.monthNames[value - 1];
  }
}
