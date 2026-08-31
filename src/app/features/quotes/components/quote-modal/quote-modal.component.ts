import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoetryLanguage, Quote, TransliterationMode } from '../../../../core/models/quote.model';
import { QuoteInput } from '../../../../core/services/api.service';
import { MarkdownEditorComponent } from '../../../../shared/components/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-quote-modal',
  imports: [CommonModule, FormsModule, MarkdownEditorComponent],
  templateUrl: './quote-modal.component.html',
  styleUrl: './quote-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteModalComponent {
  readonly quote = input<Quote | null>(null);
  readonly editorMode = input(false);
  readonly closeModal = output<void>();
  readonly copyQuote = output<Quote>();
  readonly saveQuote = output<QuoteInput>();

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
      } else if (this.editorMode()) {
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
}
