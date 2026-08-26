import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ExecutionOrderService } from './execution-order.service';

describe('ExecutionOrderService', () => {
  let service: ExecutionOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ExecutionOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
