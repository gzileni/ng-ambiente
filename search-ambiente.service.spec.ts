import { TestBed } from '@angular/core/testing';

import { SearchAmbienteService } from './search-ambiente.service';

describe('SearchAmbienteService', () => {
  let service: SearchAmbienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchAmbienteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
