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

  it('sets an explicit quote reaction', () => {
    service.setReaction('507f1f77bcf86cd799439011', 'dislike').subscribe((summary) => {
      expect(summary.dislikesCount).toBe(1);
      expect(summary.userReaction).toBe('dislike');
    });

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/v1/quotes/507f1f77bcf86cd799439011/reaction',
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ type: 'dislike' });
    req.flush({ data: { likesCount: 0, dislikesCount: 1, userReaction: 'dislike' } });
  });

  it('loads visible comments for a quote', () => {
    service.getComments('507f1f77bcf86cd799439011').subscribe((page) => {
      expect(page.comments.length).toBe(1);
      expect(page.comments[0].body).toBe('Thoughtful words');
    });

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/v1/quotes/507f1f77bcf86cd799439011/comments?page=1&limit=20',
    );
    req.flush({
      data: [{ _id: 'comment-1', body: 'Thoughtful words' }],
      meta: { total: 1, page: 1 },
    });
  });

  it('sends the selected language when adding a comment', () => {
    service
      .addComment('507f1f77bcf86cd799439011', 'తెలుగు వ్యాఖ్య', 'telugu')
      .subscribe((comment) => {
        expect(comment.language).toBe('telugu');
      });

    const req = httpTesting.expectOne(
      'http://localhost:3000/api/v1/quotes/507f1f77bcf86cd799439011/comments',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ body: 'తెలుగు వ్యాఖ్య', language: 'telugu' });
    req.flush({ data: { _id: 'comment-2', body: 'తెలుగు వ్యాఖ్య', language: 'telugu' } });
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
