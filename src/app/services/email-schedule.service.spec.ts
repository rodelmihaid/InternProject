import { TestBed } from '@angular/core/testing';

import { EmailScheduleService } from './email-schedule.service';

describe('EmailScheduleService', () => {
  let service: EmailScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
