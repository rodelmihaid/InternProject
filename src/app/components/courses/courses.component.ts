import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthService } from 'src/app/services/auth.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface Course {
  id?: string;
  title: string;
  description: string;
  videoUrls?: Video[];
}
export interface Video {
  url: string;
  videoTitle: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  userProgress: { [courseId: string]: number } = {};
  showForm: boolean = false;
  isAdmin: boolean = false;
  isEditMode: boolean = false;
  newCourse: Course = { title: '', description: '', videoUrls: [] };
  selectedFiles: File[] = [];
  showDeleteConfirmation: boolean = false;
  courseToDelete: Course | null = null;
  courseToEdit: Course | null = null;
  userId: string = '';
  isLoading: boolean = false;

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAdmin$.subscribe((isAdmin) => (this.isAdmin = isAdmin));
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadCourses();
        this.loadUserProgress();
      }
    });
  }

  loadCourses() {
    this.firestore
      .collection<Course>('courses')
      .valueChanges({ idField: 'id' })
      .subscribe((courses) => {
        this.courses = courses;
      });
  }

  loadUserProgress() {
    this.firestore
      .collection('userCourseProgress')
      .doc(this.userId)
      .valueChanges()
      .subscribe((progressData: any) => {
        if (progressData) {
          this.courses.forEach((course) => {
            if (course.id != undefined) {
              const progressArray = progressData[course.id] || [];

              const completedVideos = progressArray.filter(
                (video: any) => video.status === 'completed'
              ).length;

              const totalVideos = course.videoUrls?.length || 1; // evită diviziunea prin zero
              this.userProgress[course.id] =
                (completedVideos / totalVideos) * 100;
            }
          });
        }
      });
  }

  openForm(course?: Course) {
    if (course) {
      this.isEditMode = true;
      this.courseToEdit = course;
      this.newCourse = { ...course };
    } else {
      this.isEditMode = false;
      this.newCourse = { title: '', description: '', videoUrls: [] };
    }
    this.showForm = true;
  }

  navigateToCourse(courseId: string | undefined) {
    if (courseId) {
      this.router.navigate(['/courses', courseId]);
    }
  }

  closeForm() {
    this.showForm = false;
    this.newCourse = { title: '', description: '', videoUrls: [] };
    this.selectedFiles = [];
  }

  onFilesSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  addCourse() {
    if (this.isEditMode && this.courseToEdit && this.courseToEdit.id) {
      this.updateCourse(this.courseToEdit.id);
    } else {
      this.createCourse();
    }
  }

  createCourse(): void {
    this.isLoading = true; // Start spinner
    this.firestore
      .collection('courses')
      .add(this.newCourse)
      .then((docRef) => {
        const courseId = docRef.id;
        const uploadPromises = this.selectedFiles.map((file) =>
          this.uploadFile(courseId, file)
        );

        Promise.all(uploadPromises).then((videos) => {
          this.firestore
            .collection('courses')
            .doc(courseId)
            .update({
              videoUrls: videos,
            })
            .then(() => {
              this.isLoading = false; // Stop spinner
              this.closeForm();
            });
        });
      })
      .catch((error) => {
        this.isLoading = false; // Stop spinner on error
        console.error('Error adding course:', error);
      });
  }

  updateCourse(id: string) {
    this.isLoading = true; // Start spinner
    if (this.selectedFiles.length > 0) {
      const uploadPromises = this.selectedFiles.map((file) =>
        this.uploadFile(id, file)
      );

      Promise.all(uploadPromises).then((videos) => {
        this.newCourse.videoUrls = videos;
        this.firestore
          .collection('courses')
          .doc(id)
          .update(this.newCourse)
          .then(() => {
            this.isLoading = false; // Stop spinner
            this.closeForm();
          })
          .catch((error) => {
            this.isLoading = false; // Stop spinner on error
            console.error('Error updating course:', error);
          });
      });
    } else {
      this.firestore
        .collection('courses')
        .doc(id)
        .update(this.newCourse)
        .then(() => {
          this.isLoading = false; // Stop spinner
          this.closeForm();
        })
        .catch((error) => {
          this.isLoading = false; // Stop spinner on error
          console.error('Error updating course:', error);
        });
    }
  }

  uploadFile(courseId: string, file: File): Promise<Video> {
    const filePath = `courses/${courseId}/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    return new Promise((resolve, reject) => {
      uploadTask
        .snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe(
              (url) => {
                const video: Video = { url, videoTitle: file.name };
                resolve(video);
              },
              (error) => {
                reject(error);
              }
            );
          })
        )
        .subscribe();
    });
  }

  confirmDelete(course: Course) {
    this.showDeleteConfirmation = true;
    this.courseToDelete = course;
  }

  cancelDelete() {
    this.showDeleteConfirmation = false;
    this.courseToDelete = null;
  }

  deleteCourse() {
    if (this.courseToDelete && this.courseToDelete.id) {
      const courseId = this.courseToDelete.id;

      // Șterge videoclipurile din Storage
      if (this.courseToDelete.videoUrls) {
        const deletePromises = this.courseToDelete.videoUrls.map((video) => {
          const fileRef = this.storage.refFromURL(video.url);
          return fileRef.delete().toPromise();
        });

        Promise.all(deletePromises)
          .then(() => {
            // Șterge documentul cursului din Firestore
            return this.firestore.collection('courses').doc(courseId).delete();
          })
          .then(() => {
            this.cancelDelete();
          })
          .catch((error) => {
            console.error('Error deleting course or videos:', error);
          });
      } else {
        // Șterge documentul cursului din Firestore dacă nu există videoclipuri
        this.firestore
          .collection('courses')
          .doc(courseId)
          .delete()
          .then(() => {
            this.cancelDelete();
          });
      }
    }
  }
}
