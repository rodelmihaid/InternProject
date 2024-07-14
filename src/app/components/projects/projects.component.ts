import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map, switchMap, of, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import firebase from 'firebase/compat/app';

interface Project {
  id: string;
  department: string;
  title: string;
  description: string;
  assignedBy?: string;
}

interface AssignedProject {
  assignedProjectId: string;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  projectsData$: Observable<Project[]>;
  assignedProject$: Observable<AssignedProject | null> = of(null);
  showForm: boolean = false;
  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  selectedDepartment: string = '';
  showDeleteConfirmation: boolean = false;
  projectToDelete: Project | null = null;
  isEditMode: boolean = false;

  newProject: Project = {
    id: '',
    department: '',
    title: '',
    description: '',
    assignedBy: '',
  };
  isAdmin: boolean = false;
  projectToEdit: Project | null = null;
  userId: string = '';
  userEmail: string = '';
  subscriptions: Subscription[] = [];

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.projectsData$ = this.firestore
      .collection<Project>('projects')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Project;
            const id = a.payload.doc.id;
            data.id = id;

            return { ...data };
          })
        )
      );
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.isAdmin$.subscribe((admin) => {
        this.isAdmin = admin;
      })
    );

    this.subscriptions.push(
      this.authService.user$.subscribe((user) => {
        this.userId = user?.uid || null;
        this.userEmail = user?.email || '';
        console.log(this.userEmail);

        if (this.userId) {
          this.assignedProject$ = this.firestore
            .collection<AssignedProject>('assignedProjects')
            .doc(this.userId)
            .valueChanges()
            .pipe(
              switchMap((assignedProject) => {
                if (assignedProject) {
                  return of(assignedProject);
                } else {
                  return of(null);
                }
              })
            );
        }
      })
    );

    this.subscriptions.push(
      this.projectsData$.subscribe((projects) => {
        this.allProjects = projects;
        this.filterProjects();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  openForm(project?: Project) {
    if (project) {
      this.isEditMode = true;
      this.projectToEdit = project;
      this.newProject = { ...project };
    } else {
      this.isEditMode = false;
      this.newProject = { id: '', department: '', title: '', description: '' };
    }
    this.showForm = true;
  }

  filterProjects() {
    if (this.selectedDepartment === '') {
      this.filteredProjects = this.allProjects;
    } else {
      this.filteredProjects = this.allProjects.filter(
        (project) => project.department === this.selectedDepartment
      );
    }
  }

  closeForm() {
    this.showForm = false;
    this.newProject = { id: '', department: '', title: '', description: '' };
  }

  addProject() {
    if (this.isEditMode && this.projectToEdit && this.projectToEdit.id) {
      this.firestore
        .collection('projects')
        .doc(this.projectToEdit.id)
        .update(this.newProject)
        .then(() => {
          this.closeForm();
        });
    } else {
      this.firestore
        .collection('projects')
        .add(this.newProject)
        .then(() => {
          this.closeForm();
        });
    }
  }

  confirmDelete(project: Project) {
    this.showDeleteConfirmation = true;
    this.projectToDelete = project;
  }

  cancelDelete() {
    this.showDeleteConfirmation = false;
    this.projectToDelete = null;
  }

  deleteProject() {
    if (this.projectToDelete && this.projectToDelete.id) {
      this.firestore
        .collection('projects')
        .doc(this.projectToDelete.id)
        .delete()
        .then(() => {
          this.cancelDelete();
        });
    }
  }

  assignProject(projectId: string) {
    if (this.userId) {
      const assignedProject = {
        assignedProjectId: projectId,
      };

      this.firestore
        .collection('assignedProjects')
        .doc(this.userId)
        .set(assignedProject, { merge: true })
        .then(() => {
          // Update the project with the assignedBy field
          this.firestore
            .collection('projects')
            .doc(projectId)
            .update({ assignedBy: this.userEmail })
            .then(() => {
              console.log('Project assigned successfully');
            })
            .catch((error) => {
              console.error('Error updating project with assignedBy: ', error);
            });
        })
        .catch((error) => {
          console.error('Error assigning project: ', error);
        });
    }
  }

  changeProject() {
    if (this.userId) {
      // Retrieve the assigned project ID
      this.firestore
        .collection('assignedProjects')
        .doc(this.userId)
        .get()
        .subscribe(
          (assignedProjectDoc) => {
            const assignedProjectData = assignedProjectDoc.data() as any;

            if (assignedProjectData && assignedProjectData.assignedProjectId) {
              const assignedProjectId = assignedProjectData.assignedProjectId;

              // Remove the assignedBy field from the project document
              this.firestore
                .collection('projects')
                .doc(assignedProjectId)
                .update({
                  assignedBy: firebase.firestore.FieldValue.delete(),
                })
                .then(() => {
                  // Delete the document from the assignedProjects collection
                  this.firestore
                    .collection('assignedProjects')
                    .doc(this.userId)
                    .delete()
                    .then(() => {
                      console.log('Project assignment removed successfully');
                    })
                    .catch((error) => {
                      console.error(
                        'Error deleting assignment from assignedProjects collection: ',
                        error
                      );
                    });
                })
                .catch((error) => {
                  console.error(
                    'Error removing assignedBy field from project document: ',
                    error
                  );
                });
            }
          },
          (error) => {
            console.error('Error retrieving assigned project: ', error);
          }
        );
    }
  }
}
