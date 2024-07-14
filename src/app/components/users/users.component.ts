import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  usersWithProjectStatus: any[] = [];

  constructor(
    private authService: AuthService,
    private firestore: AngularFirestore
  ) {}

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

  getUserProjectStatus(userId: string): Observable<any> {
    return this.firestore
      .collection('assignedProjects')
      .doc(userId)
      .get()
      .pipe(
        switchMap((doc) => {
          const data = doc.data() as any;
          if (data && data.assignedProjectId) {
            return this.firestore
              .collection('projects')
              .doc(data.assignedProjectId)
              .get()
              .pipe(
                map((projectDoc) => {
                  const projectData = projectDoc.data() as any;
                  return {
                    userId,
                    projectTitle: projectData?.title || 'Project not found',
                  };
                })
              );
          } else {
            return of({ userId, projectTitle: 'No project assigned' });
          }
        })
      );
  }

  ngOnInit(): void {
    this.authService.getUsers().subscribe((users) => {
      this.users = users;
      const projectStatusObservables = users.map((user) =>
        this.getUserProjectStatus(user.id)
      );
      forkJoin(projectStatusObservables).subscribe((projectStatuses) => {
        this.usersWithProjectStatus = this.users.map((user) => ({
          ...user,
          projectStatus: projectStatuses.find(
            (status) => status.userId === user.id
          )?.projectTitle,
        }));
      });
    });
  }
}
