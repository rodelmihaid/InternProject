import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Course, Video } from '../courses/courses.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.css'],
})
export class CourseDetailsComponent implements OnInit {
  course: Course | undefined;
  videoToggles: { [key: string]: boolean } = {}; // Pentru a gestiona starea de toggle pentru fiecare video
  userId: string = '';
  userProgress: { [key: string]: any } = {}; // Pentru a stoca progresul utilizatorului
  courseProgress: any = {}; // Pentru a stoca progresul complet al cursului

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.firestore
        .collection<Course>('courses')
        .doc(courseId)
        .valueChanges()
        .subscribe((course) => {
          if (course) {
            this.course = course;
            this.initializeVideoToggles(course.videoUrls);
          }
        });

      this.authService.user$.subscribe((user) => {
        if (user) {
          this.userId = user.uid;

          this.loadUserProgress();
        }
      });
    }
  }

  initializeVideoToggles(videos: Video[] | undefined) {
    if (videos) {
      videos.forEach((video) => {
        this.videoToggles[video.videoTitle] = false;
      });
    }
  }

  toggleVideo(videoTitle: string) {
    this.videoToggles[videoTitle] = !this.videoToggles[videoTitle];
  }

  loadUserProgress(): any {
    const courseId = this.route.snapshot.paramMap.get('id');
    this.firestore
      .collection('userCourseProgress')
      .doc(this.userId)
      .valueChanges()
      .subscribe((progressData: any) => {
        if (progressData && courseId) {
          const progressArray = progressData[courseId];

          const progressMap: { [key: string]: any } = {};
          if (progressArray)
            progressArray.forEach((progress: any) => {
              progressMap[progress.videoTitle] = progress;
            });
          this.userProgress = progressMap;

          this.courseProgress = progressMap;
        }

        return this.courseProgress;
      });
  }

  saveUserProgress(videoTitle: string, event: Event) {
    const videoElement = event.target as HTMLVideoElement;
    const currentTime = videoElement.currentTime;
    const duration = videoElement.duration;

    const progress = {
      videoTitle,
      currentTime,
      duration,
      status:
        currentTime === 0
          ? 'not started'
          : currentTime < duration
          ? 'in progress'
          : 'completed',
    };

    const courseId = this.route.snapshot.paramMap.get('id');
    const userCourseProgressRef = this.firestore
      .collection('userCourseProgress')
      .doc(this.userId);
    if (courseId) {
      userCourseProgressRef.get().subscribe((doc) => {
        const data = doc.data() as any;
        let progressArray = data && data[courseId] ? data[courseId] : [];

        const existingProgressIndex = progressArray.findIndex(
          (p: any) => p.videoTitle === videoTitle
        );

        if (existingProgressIndex > -1) {
          progressArray[existingProgressIndex] = progress;
        } else {
          progressArray.push(progress);
        }

        userCourseProgressRef.set(
          { [courseId]: progressArray },
          { merge: true }
        );
      });
    }
  }

  setVideoTime(event: Event, videoTitle: string) {
    const videoElement = event.target as HTMLVideoElement;
    const time = this.userProgress[videoTitle]?.currentTime;
    if (time) {
      videoElement.currentTime = time;
      videoElement.play(); // Autoplay the video from the saved time
    }
  }
}
