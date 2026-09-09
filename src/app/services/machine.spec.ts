import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MachineService } from './machine.service';

describe('MachineService', () => {
  let service: MachineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(MachineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
