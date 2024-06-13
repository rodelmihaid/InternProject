import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map, switchMap, of } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

interface Project {
  id: string;
  department: string;
  title: string;
  description: string;
}

interface AssignedProject {
  assignedProjectId: string;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent implements OnInit {
  projectsData$: Observable<Project[]>;
  assignedProject$: Observable<AssignedProject | null> = of(null);
  showForm: boolean = false;
  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  selectedDepartment: string = '';
  showDeleteConfirmation: boolean = false;
  projectToDelete: Project | null = null;
  isEditMode: boolean = false;

  newProject: Project = { id: '', department: '', title: '', description: '' };
  isAdmin: boolean = false;
  projectToEdit: Project | null = null;
  userId: string = '';

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
    this.authService.isAdmin$.subscribe((admin) => {
      this.isAdmin = admin;
    });
    this.authService.user$.subscribe((user) => {
      this.userId = user?.uid || null;
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
    });

    this.projectsData$.subscribe((projects) => {
      this.allProjects = projects;
      this.filterProjects();
    });
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
          console.log('Project assigned successfully');
        })
        .catch((error) => {
          console.error('Error assigning project: ', error);
        });
    }
  }
  changeProject() {
    this.firestore.collection('assignedProjects').doc(this.userId).delete();
  }
}
