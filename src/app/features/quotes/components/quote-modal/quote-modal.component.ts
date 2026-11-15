import { DatePipe } from '@angular/common';
import {
  ElementRef,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
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
import { authorAvatarColor, authorInitial } from '../../../../core/utils/author-initial';
import { ToastService } from '../../../../core/services/toast.service';
import {
  activeRomanWord,
  TeluguEditorEngine,
  TransliterationCandidate,
} from '../../../../core/telugu-engine';
import { MarkdownEditorComponent } from '../../../../shared/components/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-quote-modal',
  imports: [DatePipe, FormField, MarkdownEditorComponent],
  templateUrl: './quote-modal.component.html',
  styleUrl: './quote-modal.component.css',
})
export class QuoteModalComponent {
  readonly avatarColor = authorAvatarColor;
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
  readonly commentSuggestions = signal<TransliterationCandidate[]>([]);
  readonly selectedCommentSuggestionIndex = signal(0);
  readonly metadataSuggestions = signal<TransliterationCandidate[]>([]);
  readonly selectedMetadataSuggestionIndex = signal(0);
  readonly metadataField = signal<'title' | 'author' | 'tags' | null>(null);
  readonly metadataInputFocused = signal(false);
  readonly dialogRoot = viewChild<ElementRef<HTMLElement>>('dialogRoot');
  readonly commentTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('commentTextarea');
  readonly isLoadingComments = signal(false);
  readonly isPostingComment = signal(false);
  readonly isSavingComment = signal(false);
  readonly showHiddenComments = signal(false);
  readonly editingCommentId = signal<string | null>(null);
  readonly commentEditDraft = signal('');
  readonly commentInputFocused = signal(false);
  private readonly transliterator = new TeluguEditorEngine();
  private commentComposition: { roman: string; start: number; end: number } | null = null;
  private previousFocus: HTMLElement | null = null;
  private metadataComposition: {
    field: 'title' | 'author' | 'tags';
    roman: string;
    start: number;
    end: number;
  } | null = null;
  private metadataInput: HTMLInputElement | null = null;

  readonly editorData = signal({
    title: '',
    content: '',
    author: '',
    tags: '',
    language: 'english' as PoetryLanguage,
    transliterationMode: 'native' as TransliterationMode,
  });
  readonly editorForm = form(this.editorData, (path) => {
    required(path.content);
    required(path.author);
    minLength(path.author, 2);
    maxLength(path.title, 120);
    maxLength(path.author, 100);
    validate(path.tags, ({ value }) =>
      value().split(',').some((tag) => tag.trim())
        ? undefined
        : { kind: 'tagsRequired', message: 'Add at least one tag.' },
    );
  });
  readonly commentForm = form(this.commentDraft, (path) => {
    required(path);
    maxLength(path, 1500);
  });
  readonly commentEditForm = form(this.commentEditDraft, (path) => {
    required(path);
    maxLength(path, 1500);
  });
  readonly languageOptions: PoetryLanguage[] = ['english', 'telugu'];
  readonly transliterationOptions: TransliterationMode[] = ['native', 'roman'];

  constructor() {
    effect(() => {
      const quote = this.quote();
      if (quote) {
        this.editorData.set({
          title: quote.title || '',
          content: quote.content,
          author: quote.author,
          tags: quote.tags.join(', '),
          language: quote.language || 'english',
          transliterationMode: quote.transliterationMode || 'native',
        });
        if (!this.editorMode()) {
          this.commentLanguage.set(quote.language || 'english');
          this.loadComments(quote._id);
        }
      } else if (this.editorMode()) {
        this.comments.set([]);
        this.editorData.set({
          title: '',
          content: '',
          author: '',
          tags: '',
          language: 'english',
          transliterationMode: 'native',
        });
      }
    });

    effect(() => {
      const isOpen = this.editorMode() || this.quote() !== null;
      if (isOpen) {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement && activeElement !== document.body) {
          this.previousFocus ??= activeElement;
        }
        queueMicrotask(() =>
          this.dialogRoot()?.nativeElement.querySelector<HTMLElement>('.close-btn')?.focus(),
        );
        return;
      }

      const previousFocus = this.previousFocus;
      this.previousFocus = null;
      if (previousFocus?.isConnected) queueMicrotask(() => previousFocus.focus());
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

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = this.dialogRoot()?.nativeElement;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    const first = focusableElements.item(0);
    const last = focusableElements.item(focusableElements.length - 1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onCopy(): void {
    const q = this.quote();
    if (q) {
      this.copyQuote.emit(q);
    }
  }

  authorInitial(author: string): string {
    return authorInitial(author);
  }

  onSave(event: Event): void {
    event.preventDefault();
    if (!this.editorForm().valid()) {
      this.editorForm.content().markAsTouched();
      this.editorForm.author().markAsTouched();
      this.editorForm.tags().markAsTouched();
      return;
    }

    const formData = this.editorData();
    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length === 0) return;
    this.saveQuote.emit({
      title: formData.title.trim() || undefined,
      content: formData.content.trim(),
      author: formData.author.trim(),
      tags,
      language: formData.language,
      transliterationMode: formData.transliterationMode,
    });
  }

  updateMetadata(field: 'title' | 'author' | 'tags', event: Event): void {
    const input = event.target as HTMLInputElement;
    this.metadataInput = input;
    this.metadataField.set(field);
    const value = input.value;
    if (this.editorData().language !== 'telugu') {
      this.setMetadataValue(field, value);
      this.clearMetadataSuggestions();
      return;
    }

    const cursor = input.selectionStart ?? value.length;
    const converted = this.transliterator.transliterateText(value, true);
    const convertedCursor = this.transliterator.transliterateText(
      value.slice(0, cursor),
      true,
    ).length;
    this.setMetadataValue(field, converted);
    this.updateMetadataSuggestions(field, converted, convertedCursor);
    if (converted !== value) {
      queueMicrotask(() => input.setSelectionRange(convertedCursor, convertedCursor));
    }
  }

  onMetadataFocus(field: 'title' | 'author' | 'tags', event: FocusEvent): void {
    this.metadataField.set(field);
    this.metadataInput = event.target as HTMLInputElement;
    this.metadataInputFocused.set(true);
  }

  onMetadataBlur(): void {
    this.metadataInputFocused.set(false);
    this.clearMetadataSuggestions();
  }

  onMetadataKeydown(event: KeyboardEvent): void {
    const candidates = this.metadataSuggestions();
    if (!candidates.length) {
      if (event.key === 'Escape') this.clearMetadataSuggestions();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedMetadataSuggestionIndex.update((index) =>
        event.key === 'ArrowDown'
          ? Math.min(index + 1, candidates.length - 1)
          : Math.max(index - 1, 0),
      );
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.selectMetadataSuggestion(this.selectedMetadataSuggestionIndex());
    } else if (event.key === 'Escape') {
      this.clearMetadataSuggestions();
    }
  }

  selectMetadataSuggestion(index: number, suffix = ' '): void {
    const suggestion = this.metadataSuggestions()[index];
    const input = this.metadataInput;
    const field = this.metadataField();
    if (!suggestion || !input || !field) return;
    const cursor = input.selectionStart ?? 0;
    const value = this.metadataValue(field);
    const active =
      this.metadataComposition?.field === field
        ? this.metadataComposition
        : activeRomanWord(value, cursor);
    if (!active || value.slice(active.start, active.end) !== active.roman) {
      this.clearMetadataSuggestions();
      return;
    }

    const updated = `${value.slice(0, active.start)}${suggestion.text}${suffix}${value.slice(active.end)}`;
    this.setMetadataValue(field, updated);
    this.transliterator.remember(active.roman, suggestion.text);
    this.clearMetadataSuggestions();
    const nextCursor = active.start + suggestion.text.length + suffix.length;
    queueMicrotask(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  }

  setFormLanguage(language: PoetryLanguage): void {
    this.editorData.update((value) => ({
      ...value,
      language,
      transliterationMode: language === 'telugu' ? 'roman' : 'native',
    }));
    if (language === 'english') {
      this.clearMetadataSuggestions();
    }
  }

  setFormLanguageFromEvent(event: Event): void {
    const language = (event.target as HTMLSelectElement).value;
    this.setFormLanguage(language === 'telugu' ? 'telugu' : 'english');
  }

  private updateMetadataSuggestions(
    field: 'title' | 'author' | 'tags',
    value: string,
    cursor: number,
  ): void {
    const active = activeRomanWord(value, cursor);
    if (!active || active.roman.length < 2) {
      this.clearMetadataSuggestions();
      return;
    }
    this.metadataSuggestions.set(
      this.transliterator
        .suggest({
          before: value.slice(0, active.start),
          current: active.roman,
          after: value.slice(active.end),
          languageMode: 'mixed',
        })
        .slice(0, 6),
    );
    this.metadataComposition = { field, ...active };
    this.selectedMetadataSuggestionIndex.set(0);
  }

  private clearMetadataSuggestions(): void {
    this.metadataSuggestions.set([]);
    this.selectedMetadataSuggestionIndex.set(0);
    this.metadataComposition = null;
  }

  private metadataValue(field: 'title' | 'author' | 'tags'): string {
    return this.editorData()[field];
  }

  private setMetadataValue(field: 'title' | 'author' | 'tags', value: string): void {
    this.editorData.update((data) => ({ ...data, [field]: value }));
  }

  commentAuthor(comment: QuoteComment): string {
    return typeof comment.userId === 'string' ? 'Community member' : comment.userId.username;
  }

  canManageComment(comment: QuoteComment): boolean {
    const user = this.currentUser();
    const authorId = typeof comment.userId === 'string' ? comment.userId : comment.userId._id;
    return !!user && (user.role === 'admin' || (!!user.id && user.id === String(authorId)));
  }

  setCommentLanguage(language: PoetryLanguage): void {
    this.commentLanguage.set(language);
    this.clearCommentSuggestions();
    if (language === 'telugu') this.convertCommentDraft();
  }

  onCommentDraftChange(value: string): void {
    if (this.commentLanguage() !== 'telugu') {
      this.commentDraft.set(value);
      this.clearCommentSuggestions();
      return;
    }

    const textarea = this.commentTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? value.length;
    const converted = this.transliterator.transliterateText(value, true);
    const convertedCursor = this.transliterator.transliterateText(
      value.slice(0, cursor),
      true,
    ).length;
    this.commentDraft.set(converted);
    this.updateCommentSuggestions(converted, convertedCursor);
    if (converted !== value) this.restoreCommentCursor(convertedCursor);
  }

  onCommentInput(event: Event): void {
    this.onCommentDraftChange((event.target as HTMLTextAreaElement).value);
  }

  onCommentKeydown(event: KeyboardEvent): void {
    const candidates = this.commentSuggestions();
    if (!candidates.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedCommentSuggestionIndex.update((index) =>
        event.key === 'ArrowDown'
          ? Math.min(index + 1, candidates.length - 1)
          : Math.max(index - 1, 0),
      );
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.selectCommentSuggestion(this.selectedCommentSuggestionIndex());
    } else if (event.key === 'Escape') {
      this.clearCommentSuggestions();
    }
  }

  selectCommentSuggestion(index: number, suffix = ' '): void {
    const suggestion = this.commentSuggestions()[index];
    const textarea = this.commentTextarea()?.nativeElement;
    if (!suggestion || !textarea) return;

    const active =
      this.commentComposition ?? activeRomanWord(this.commentDraft(), textarea.selectionStart);
    if (!active) return;
    if (this.commentDraft().slice(active.start, active.end) !== active.roman) {
      this.clearCommentSuggestions();
      return;
    }

    const updated = `${this.commentDraft().slice(0, active.start)}${suggestion.text}${suffix}${this.commentDraft().slice(active.end)}`;
    this.commentDraft.set(updated);
    this.transliterator.remember(active.roman, suggestion.text);
    this.clearCommentSuggestions();
    this.restoreCommentCursor(active.start + suggestion.text.length + suffix.length);
  }

  submitComment(event: Event): void {
    event.preventDefault();
    if (!this.commentForm().valid()) {
      this.commentForm().markAsTouched();
      return;
    }
    const quote = this.quote();
    const draft = this.commentDraft().trim();
    const body =
      this.commentLanguage() === 'telugu' ? this.transliterator.transliterateText(draft) : draft;
    if (!quote || !body || this.isPostingComment()) return;
    if (!this.isAuthenticated()) {
      this.signIn();
      return;
    }

    this.isPostingComment.set(true);
    this.clearCommentSuggestions();
    this.apiService.addComment(quote._id, body, this.commentLanguage()).subscribe({
      next: (comment) => {
        this.comments.update((items) => [comment, ...items]);
        this.commentDraft.set('');
        this.isPostingComment.set(false);
        this.toast.success('Comment saved.');
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

  cancelEditComment(): void {
    if (this.isSavingComment()) return;
    this.editingCommentId.set(null);
    this.commentEditDraft.set('');
  }

  saveComment(comment: QuoteComment, event: Event): void {
    event.preventDefault();
    if (!this.commentEditForm().valid()) {
      this.commentEditForm().markAsTouched();
      return;
    }
    const quote = this.quote();
    const body = this.commentEditDraft().trim();
    if (!quote || !body || this.isSavingComment()) return;
    this.isSavingComment.set(true);
    this.apiService.updateComment(quote._id, comment._id, body).subscribe({
      next: (updated) => {
        this.comments.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        this.editingCommentId.set(null);
        this.commentEditDraft.set('');
        this.isSavingComment.set(false);
        this.toast.success('Comment updated.');
      },
      error: (error) => {
        this.isSavingComment.set(false);
        this.toast.error(error.message || 'Unable to update comment.');
      },
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

  private convertCommentDraft(): void {
    const textarea = this.commentTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? this.commentDraft().length;
    const current = this.commentDraft();
    const converted = this.transliterator.transliterateText(current);
    this.commentDraft.set(converted);
    if (converted !== current) {
      const convertedCursor = this.transliterator.transliterateText(
        current.slice(0, cursor),
      ).length;
      this.restoreCommentCursor(convertedCursor);
    }
  }

  private updateCommentSuggestions(value: string, cursor: number): void {
    const active = activeRomanWord(value, cursor);
    if (!active || active.roman.length < 2) {
      this.clearCommentSuggestions();
      return;
    }

    this.commentSuggestions.set(
      this.transliterator
        .suggest({
          before: value.slice(0, active.start),
          current: active.roman,
          after: value.slice(active.end),
          languageMode: 'mixed',
        })
        .slice(0, 6),
    );
    this.commentComposition = active;
    this.selectedCommentSuggestionIndex.set(0);
  }

  private clearCommentSuggestions(): void {
    this.commentSuggestions.set([]);
    this.selectedCommentSuggestionIndex.set(0);
    this.commentComposition = null;
  }

  private restoreCommentCursor(position: number): void {
    queueMicrotask(() => {
      const textarea = this.commentTextarea()?.nativeElement;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(position, position);
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
