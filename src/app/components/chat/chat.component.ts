import {
  Component,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { ChatService, Message } from 'src/app/services/chat.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages$: Observable<Message[]>;
  form: FormGroup;
  isAdmin: boolean = false;
  actualUserId: string = '';
  editMode: boolean = false;
  messageToEdit: Message | null = null;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private fb: FormBuilder,
    private authService: AuthService,
    private firebase: AngularFirestore
  ) {
    this.messages$ = this.chatService.getMessages();
    this.messages$.subscribe((messages) => console.log(messages));
    this.form = this.fb.group({
      message: [''],
    });
  }

  ngOnInit(): void {
    this.authService.isAdmin$.subscribe((isAdmin) => (this.isAdmin = isAdmin));
    this.authService.user$.subscribe((user) => {
      this.actualUserId = user.uid;
      console.log(this.actualUserId);
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const content = this.form.get('message')?.value;
    if (content) {
      if (this.editMode && this.messageToEdit) {
        this.updateMessage(this.messageToEdit.id, content);
      } else {
        this.chatService.sendMessage(content);
      }
      this.form.reset();
      this.editMode = false;
      this.messageToEdit = null;
    }
  }

  deleteMessage(messageId: string | undefined) {
    if (messageId) {
      this.firebase.collection('messages').doc(messageId).delete();
      this.messages$ = this.chatService.getMessages();
    }
  }

  editMessage(message: Message) {
    this.editMode = true;
    this.messageToEdit = message;
    this.form.patchValue({ message: message.content });
  }

  updateMessage(messageId: string | undefined, content: string) {
    if (messageId) {
      this.firebase.collection('messages').doc(messageId).update({ content });
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll to bottom failed:', err);
    }
  }
}
