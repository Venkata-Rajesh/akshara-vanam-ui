import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../auth/auth.models';
import { PoetryLanguage, Quote, TransliterationMode } from '../models/quote.model';

export interface QuoteQuery {
  q?: string;
  tag?: string;
  author?: string;
  language?: PoetryLanguage;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'author';
  sortOrder?: 'asc' | 'desc';
}

export interface QuoteInput {
  title?: string;
  content: string;
  author: string;
  tags: string[];
  language?: PoetryLanguage;
  transliterationMode?: TransliterationMode;
}

export interface QuotePage {
  quotes: Quote[];
  meta?: Record<string, unknown>;
}

export interface LikeResult {
  liked: boolean;
  likes: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(API_BASE_URL)}/quotes`;

  getQuotes(query: QuoteQuery = {}): Observable<Quote[]> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });

    return this.http
      .get<ApiResponse<Quote[]>>(this.apiUrl, { params })
      .pipe(
        map((res) =>
          Array.isArray(res.data) ? res.data.map((quote) => this.normalizeQuote(quote)) : [],
        ),
      );
  }

  getQuote(id: string): Observable<Quote> {
    return this.http
      .get<ApiResponse<Quote>>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.normalizeQuote(res.data)));
  }

  getTags(): Observable<string[]> {
    return this.http
      .get<ApiResponse<Array<string | { tag: string }>>>(`${this.apiUrl}/tags`)
      .pipe(map((res) => res.data.map((item) => (typeof item === 'string' ? item : item.tag))));
  }

  createQuote(input: QuoteInput): Observable<Quote> {
    return this.http
      .post<ApiResponse<Quote>>(this.apiUrl, input)
      .pipe(map((res) => this.normalizeQuote(res.data)));
  }

  updateQuote(id: string, input: Partial<QuoteInput>): Observable<Quote> {
    return this.http
      .put<ApiResponse<Quote>>(`${this.apiUrl}/${encodeURIComponent(id)}`, input)
      .pipe(map((res) => this.normalizeQuote(res.data)));
  }

  deleteQuote(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  toggleLike(id: string): Observable<LikeResult> {
    return this.http
      .post<ApiResponse<LikeResult>>(`${this.apiUrl}/${encodeURIComponent(id)}/like`, {})
      .pipe(map((res) => res.data));
  }

  private normalizeQuote(item: any): Quote {
    const language = item.language === 'telugu' ? 'telugu' : 'english';
    return {
      _id: item._id || item.id || Math.random().toString(36).substring(2, 9),
      title: item.title || item.poemTitle || '',
      author: item.author || item.a || 'Unknown',
      content: item.content || item.quote || item.q || item.text || '',
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
          ? item.tags.split(',').map((t: string) => t.trim())
          : ['General'],
      language,
      transliterationMode: item.transliterationMode === 'roman' ? 'roman' : 'native',
      dateAdded: item.dateAdded || item.dateModified || new Date().toISOString().split('T')[0],
      length: item.length || (item.content ? item.content.length : 0),
      createdBy: item.createdBy?.toString(),
      likesCount: item.likesCount ?? 0,
    };
  }
}
