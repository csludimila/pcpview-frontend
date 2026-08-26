import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { OpService } from './op';

describe('OpService', () => {
  let service: OpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(OpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
