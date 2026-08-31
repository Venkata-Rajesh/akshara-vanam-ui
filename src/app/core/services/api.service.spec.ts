import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normalize language-aware poetry entries', () => {
    service.getQuotes().subscribe((quotes) => {
      expect(quotes.length).toBe(1);
      expect(quotes[0].language).toBe('telugu');
      expect(quotes[0].content).toBe('Namaskaram');
    });

    const req = httpTesting.expectOne('http://localhost:3000/api/v1/quotes');
    req.flush({
      data: [
        {
          _id: 'poem-1',
          content: 'Namaskaram',
          author: 'కవి',
          tags: ['తెలుగు', 'కవిత'],
          language: 'telugu',
        },
      ],
    });
  });

  it('should surface backend failures', (done) => {
    service.getQuotes().subscribe({
      next: () => done.fail('Expected the request to fail'),
      error: () => done(),
    });

    const req = httpTesting.expectOne('http://localhost:3000/api/v1/quotes');
    req.error(new ProgressEvent('Network error'));
  });
});
