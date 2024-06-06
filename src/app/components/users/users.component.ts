import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: any[] = [];

  constructor(private authService: AuthService) {}

  deleteUser(id: string): void {
    this.authService
      .deleteUser(id)
      .then(() => {
        console.log('User deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
      });
  }
  ngOnInit(): void {
    this.authService.getUsers().subscribe((x) => {
      this.users = x;
    });
    console.log(this.users);
  }
}
