import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { EmailSchedule } from './services/email-schedule.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService, public email: EmailSchedule) {}
  ngOnInit(): void {
    this.email.checkAndSendEmailsForTomorrow();
  }
  title = 'internProject';
  isChatOpen = false;

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }
}
