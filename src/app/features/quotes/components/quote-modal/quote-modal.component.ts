import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoetryLanguage,
  Quote,
  QuoteComment,
  TransliterationMode,
} from '../../../../core/models/quote.model';
import { QuoteInput } from '../../../../core/services/api.service';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MarkdownEditorComponent } from '../../../../shared/components/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-quote-modal',
  imports: [CommonModule, FormsModule, MarkdownEditorComponent],
  templateUrl: './quote-modal.component.html',
  styleUrl: './quote-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteModalComponent {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly quote = input<Quote | null>(null);
  readonly editorMode = input(false);
  readonly closeModal = output<void>();
  readonly copyQuote = output<Quote>();
  readonly saveQuote = output<QuoteInput>();
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly comments = signal<QuoteComment[]>([]);
  readonly commentDraft = signal('');
  readonly commentLanguage = signal<PoetryLanguage>('english');
  readonly isLoadingComments = signal(false);
  readonly isPostingComment = signal(false);
  readonly showHiddenComments = signal(false);
  readonly editingCommentId = signal<string | null>(null);
  readonly commentEditDraft = signal('');

  readonly form = signal<QuoteInput>({
    title: '',
    content: '',
    author: '',
    tags: [],
    language: 'english',
    transliterationMode: 'native',
  });
  readonly tagsValue = signal('');
  readonly languageOptions: PoetryLanguage[] = ['english', 'telugu'];
  readonly transliterationOptions: TransliterationMode[] = ['native', 'roman'];

  constructor() {
    effect(() => {
      const quote = this.quote();
      if (quote) {
        this.form.set({
          title: quote.title || '',
          content: quote.content,
          author: quote.author,
          tags: quote.tags,
          language: quote.language || 'english',
          transliterationMode: quote.transliterationMode || 'native',
        });
        this.tagsValue.set(quote.tags.join(', '));
        if (!this.editorMode()) {
          this.commentLanguage.set(quote.language || 'english');
          this.loadComments(quote._id);
        }
      } else if (this.editorMode()) {
        this.comments.set([]);
        this.form.set({
          title: '',
          content: '',
          author: '',
          tags: [],
          language: 'english',
          transliterationMode: 'native',
        });
        this.tagsValue.set('');
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onCopy(): void {
    const q = this.quote();
    if (q) {
      this.copyQuote.emit(q);
    }
  }

  onSave(): void {
    const form = this.form();
    const tags = this.tagsValue()
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!form.content.trim() || !form.author.trim() || tags.length === 0) return;
    this.saveQuote.emit({
      title: form.title?.trim() || undefined,
      content: form.content.trim(),
      author: form.author.trim(),
      tags,
      language: form.language || 'english',
      transliterationMode: form.transliterationMode || 'native',
    });
  }

  commentAuthor(comment: QuoteComment): string {
    return typeof comment.userId === 'string' ? 'Community member' : comment.userId.username;
  }

  canManageComment(comment: QuoteComment): boolean {
    const user = this.currentUser();
    const authorId = typeof comment.userId === 'string' ? comment.userId : comment.userId._id;
    return !!user && (user.role === 'admin' || user.id === authorId);
  }

  submitComment(): void {
    const quote = this.quote();
    const body = this.commentDraft().trim();
    if (!quote || !body || this.isPostingComment()) return;
    if (!this.isAuthenticated()) {
      this.signIn();
      return;
    }

    this.isPostingComment.set(true);
    this.apiService.addComment(quote._id, body, this.commentLanguage()).subscribe({
      next: (comment) => {
        this.comments.update((items) => [comment, ...items]);
        this.commentDraft.set('');
        this.isPostingComment.set(false);
      },
      error: (error) => {
        this.isPostingComment.set(false);
        this.toast.error(error.message || 'Unable to add comment.');
      },
    });
  }

  startEditComment(comment: QuoteComment): void {
    this.editingCommentId.set(comment._id);
    this.commentEditDraft.set(comment.body);
  }

  saveComment(comment: QuoteComment): void {
    const quote = this.quote();
    if (!quote) return;
    this.apiService.updateComment(quote._id, comment._id, this.commentEditDraft()).subscribe({
      next: (updated) => {
        this.comments.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        this.editingCommentId.set(null);
      },
      error: (error) => this.toast.error(error.message || 'Unable to update comment.'),
    });
  }

  deleteComment(comment: QuoteComment): void {
    const quote = this.quote();
    if (!quote || !confirm('Delete this comment?')) return;
    this.apiService.deleteComment(quote._id, comment._id).subscribe({
      next: () => this.comments.update((items) => items.filter((item) => item._id !== comment._id)),
      error: (error) => this.toast.error(error.message || 'Unable to delete comment.'),
    });
  }

  toggleHiddenComments(): void {
    const quote = this.quote();
    if (!quote) return;
    this.showHiddenComments.update((showHidden) => !showHidden);
    this.loadComments(quote._id, this.showHiddenComments() ? 'hidden' : 'visible');
  }

  moderateComment(comment: QuoteComment, status: 'visible' | 'hidden'): void {
    const quote = this.quote();
    if (!quote) return;
    this.apiService.moderateComment(quote._id, comment._id, status).subscribe({
      next: () => this.loadComments(quote._id, this.showHiddenComments() ? 'hidden' : 'visible'),
      error: (error) => this.toast.error(error.message || 'Unable to hide comment.'),
    });
  }

  shareEmail(): void {
    const quote = this.quote();
    if (!quote) return;
    const text = this.shareText(quote);
    window.location.href = `mailto:?subject=${encodeURIComponent(quote.title || 'A quote for you')}&body=${encodeURIComponent(text)}`;
  }

  shareWhatsApp(): void {
    const quote = this.quote();
    if (!quote) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(this.shareText(quote))}`,
      '_blank',
      'noopener',
    );
  }

  shareNative(): void {
    const quote = this.quote();
    if (!quote) return;
    const share = (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share;
    if (!share) {
      this.toast.info('Choose Email or WhatsApp to share this quote.');
      return;
    }
    share
      .call(navigator, {
        title: quote.title || quote.author,
        text: `“${quote.content}” — ${quote.author}`,
        url: this.quoteUrl(quote._id),
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name !== 'AbortError') {
          this.toast.error('Unable to open the share sheet.');
        }
      });
  }

  private loadComments(quoteId: string, status: 'visible' | 'hidden' = 'visible'): void {
    this.isLoadingComments.set(true);
    this.apiService.getComments(quoteId, 1, status).subscribe({
      next: (result) => {
        this.comments.set(result.comments);
        this.isLoadingComments.set(false);
      },
      error: () => this.isLoadingComments.set(false),
    });
  }

  signIn(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private shareText(quote: Quote): string {
    return `“${quote.content}” — ${quote.author}\n\n${this.quoteUrl(quote._id)}`;
  }

  private quoteUrl(quoteId: string): string {
    const url = new URL('/quotes', window.location.origin);
    url.searchParams.set('quote', quoteId);
    return url.toString();
  }
}
