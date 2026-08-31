import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeluguEditorEngine, TransliterationCandidate, activeRomanWord } from '../../../core/telugu-engine';

@Component({
  selector: 'app-markdown-editor',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="md-editor-container" [class.focus]="isFocused">
      <!-- Toolbar -->
      <div class="md-toolbar">
        <div class="toolbar-group">
          <button type="button" class="toolbar-btn" (click)="insertSyntax('**', '**')" title="Bold">
            <b>B</b>
          </button>
          <button type="button" class="toolbar-btn" (click)="insertSyntax('_', '_')" title="Italic">
            <i>I</i>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            (click)="insertSyntax('# ', '')"
            title="Heading"
          >
            <b>H</b>
          </button>
          <div class="divider"></div>
          <button
            type="button"
            class="toolbar-btn"
            (click)="insertSyntax('[', '](url)')"
            title="Link"
          >
            🔗
          </button>
          <button
            type="button"
            class="toolbar-btn"
            (click)="insertSyntax('> ', '')"
            title="Blockquote"
          >
            ❞
          </button>
          <button type="button" class="toolbar-btn convert-btn" (click)="convertAll()" title="Convert all Roman Telugu">
            అ→అ
          </button>
        </div>

        <div class="toolbar-group">
          <!-- Language Toggle -->
          <div
            class="lang-toggle-pill"
            (click)="toggleLanguage()"
            [class.telugu]="language() === 'telugu'"
          >
            <div class="lang-slider"></div>
            <span class="lang-label" [class.active]="language() === 'english'">English</span>
            <span class="lang-label" [class.active]="language() === 'telugu'">తెలుగు</span>
          </div>
        </div>
      </div>

      <!-- Text Area -->
      <textarea
        #editorTextarea
        class="md-textarea"
        [ngModel]="content()"
        (ngModelChange)="onContentChange($event)"
        (keydown)="onKeydown($event)"
        (focus)="isFocused = true"
        (blur)="isFocused = false"
        [placeholder]="
          language() === 'telugu'
            ? 'Type in English to see తెలుగు... (Markdown supported)'
            : 'Write your markdown here...'
        "
      ></textarea>

      @if (isFocused && suggestions().length) {
        <div class="suggestions" role="listbox" aria-label="Telugu transliteration suggestions">
          @for (suggestion of suggestions(); track suggestion.text; let index = $index) {
            <button
              type="button"
              class="suggestion"
              [class.selected]="index === selectedSuggestionIndex()"
              [attr.aria-selected]="index === selectedSuggestionIndex()"
              (mousedown)="$event.preventDefault(); selectSuggestion(index, ' ')"
            >
              <span class="suggestion-text">{{ suggestion.text }}</span>
              @if (index === 0) { <span class="suggestion-hint">Tab</span> }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './markdown-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownEditorComponent {
  readonly content = model<string>('');
  readonly language = model<'english' | 'telugu'>('telugu');

  readonly editorTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('editorTextarea');
  readonly suggestions = signal<TransliterationCandidate[]>([]);
  readonly selectedSuggestionIndex = signal(0);
  isFocused = false;
  private readonly engine = new TeluguEditorEngine();
  private readonly userWords = new Map<string, string>();
  private composition: { roman: string; start: number; end: number } | null = null;

  constructor() {
    this.restoreUserVocabulary();
  }

  toggleLanguage(): void {
    const newLang = this.language() === 'telugu' ? 'english' : 'telugu';
    this.language.set(newLang);
    if (newLang === 'telugu') {
      this.convertAll();
    }
    this.clearSuggestions();
  }

  onContentChange(value: string): void {
    if (this.language() === 'english') {
      this.content.set(value);
      this.clearSuggestions();
      return;
    }

    const textarea = this.editorTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? value.length;
    // Keep the active word in Roman script, but commit every finished word through
    // the same engine that provides suggestions.
    const converted = this.engine.transliterateText(value, true);
    const convertedCursor = this.engine.transliterateText(value.slice(0, cursor), true).length;
    this.content.set(converted);
    this.updateSuggestions(converted, convertedCursor);
    if (converted !== value) this.restoreCursor(convertedCursor);
  }

  onKeydown(event: KeyboardEvent): void {
    const candidates = this.suggestions();
    if (!candidates.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex.update((index) => event.key === 'ArrowDown'
        ? Math.min(index + 1, candidates.length - 1)
        : Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.selectSuggestion(this.selectedSuggestionIndex(), ' ');
    }
  }

  selectSuggestion(index: number, suffix = ''): void {
    const suggestion = this.suggestions()[index];
    const textarea = this.editorTextarea()?.nativeElement;
    if (!suggestion || !textarea) return;
    const cursor = textarea.selectionStart;
    const active = this.composition ?? activeRomanWord(this.content(), cursor);
    if (!active) return;
    if (this.content().slice(active.start, active.end) !== active.roman) {
      this.clearSuggestions();
      return;
    }
    const updated = `${this.content().slice(0, active.start)}${suggestion.text}${suffix}${this.content().slice(active.end)}`;
    this.content.set(updated);
    this.engine.remember(active.roman, suggestion.text);
    this.persistUserWord(active.roman, suggestion.text);
    this.clearSuggestions();
    this.restoreCursor(active.start + suggestion.text.length + suffix.length);
  }

  convertAll(): void {
    if (this.language() !== 'telugu') return;
    const textarea = this.editorTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? this.content().length;
    const current = this.content();
    const converted = this.engine.transliterateText(current);
    this.content.set(converted);
    this.clearSuggestions();
    this.restoreCursor(this.engine.transliterateText(current.slice(0, cursor)).length);
  }

  insertSyntax(prefix: string, suffix: string): void {
    const textarea = this.editorTextarea()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.content();

    const selectedText = current.substring(start, end);
    const before = current.substring(0, start);
    const after = current.substring(end);

    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;

    if (this.language() === 'telugu') {
      this.content.set(this.engine.transliterateText(newContent));
    } else {
      this.content.set(newContent);
    }

    // Restore focus and cursor position after DOM updates
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  private updateSuggestions(value: string, cursor: number): void {
    const active = activeRomanWord(value, cursor);
    if (!active || active.roman.length < 2) {
      this.clearSuggestions();
      return;
    }
    this.suggestions.set(this.engine.suggest({
      before: value.slice(0, active.start),
      current: active.roman,
      after: value.slice(active.end),
      languageMode: 'mixed',
    }).slice(0, 6));
    this.composition = active;
    this.selectedSuggestionIndex.set(0);
  }

  private clearSuggestions(): void {
    this.suggestions.set([]);
    this.selectedSuggestionIndex.set(0);
    this.composition = null;
  }

  private restoreCursor(position: number): void {
    queueMicrotask(() => {
      const textarea = this.editorTextarea()?.nativeElement;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(position, position);
    });
  }

  private restoreUserVocabulary(): void {
    try {
      const entries: Array<[string, string]> = JSON.parse(localStorage.getItem('telugu-editor-user-vocabulary') ?? '[]');
      for (const [roman, telugu] of entries) {
        if (typeof roman === 'string' && typeof telugu === 'string') {
          this.userWords.set(roman, telugu);
          this.engine.remember(roman, telugu);
        }
      }
    } catch { /* Invalid browser storage should not interrupt typing. */ }
  }

  private persistUserWord(roman: string, telugu: string): void {
    this.userWords.set(roman.toLowerCase(), telugu);
    try {
      localStorage.setItem('telugu-editor-user-vocabulary', JSON.stringify([...this.userWords.entries()].slice(-500)));
    } catch { /* Storage can be unavailable or full; in-memory learning still works. */ }
  }
}
