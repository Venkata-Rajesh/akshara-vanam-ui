import {
  Component,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import {
  TeluguEditorEngine,
  TransliterationCandidate,
  activeRomanWord,
} from '../../../core/telugu-engine';

@Component({
  selector: 'app-markdown-editor',
  template: `
    <div class="md-editor-container" [class.focus]="isFocused()">
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
          <div class="convert-language-group">
            <button
              type="button"
              class="toolbar-btn convert-btn"
              (click)="convertAll()"
              title="Convert all Roman Telugu"
            >
              అ→అ
            </button>
            <button
              type="button"
              class="lang-toggle-pill"
              (click)="toggleLanguage()"
              [class.telugu]="language() === 'telugu'"
              role="switch"
              aria-label="Telugu transliteration"
              [attr.aria-checked]="language() === 'telugu'"
            >
              <div class="lang-slider"></div>
              <span class="lang-label" [class.active]="language() === 'english'">English</span>
              <span class="lang-label" [class.active]="language() === 'telugu'">తెలుగు</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Text Area -->
      <textarea
        #editorTextarea
        class="md-textarea"
        [id]="textareaId()"
        [value]="value()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (focus)="isFocused.set(true)"
        (blur)="isFocused.set(false)"
        [placeholder]="
          language() === 'telugu'
            ? 'Type in English to see తెలుగు... (Markdown supported)'
            : 'Write your markdown here...'
        "
      ></textarea>

      @if (isFocused() && suggestions().length) {
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
              @if (index === 0) {
                <span class="suggestion-hint">Tab</span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './markdown-editor.component.css',
})
export class MarkdownEditorComponent implements FormValueControl<string> {
  readonly textareaId = input('markdown-editor');
  readonly value = model<string>('');
  readonly language = model<'english' | 'telugu'>('telugu');

  readonly editorTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('editorTextarea');
  readonly suggestions = signal<TransliterationCandidate[]>([]);
  readonly selectedSuggestionIndex = signal(0);
  readonly isFocused = signal(false);
  private readonly engine = new TeluguEditorEngine();
  private readonly userWords = new Map<string, string>();
  private composition: { roman: string; start: number; end: number } | null = null;

  constructor() {
    this.restoreUserVocabulary();
  }

  toggleLanguage(): void {
    const newLang = this.language() === 'telugu' ? 'english' : 'telugu';
    this.language.set(newLang);
    this.clearSuggestions();
  }

  onInput(event: Event): void {
    this.onContentChange((event.target as HTMLTextAreaElement).value);
  }

  onContentChange(value: string): void {
    if (this.language() === 'english') {
      this.value.set(value);
      this.clearSuggestions();
      return;
    }

    const textarea = this.editorTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? value.length;
    // Keep the active word in Roman script, but commit every finished word through
    // the same engine that provides suggestions.
    const converted = this.engine.transliterateText(value, true);
    const convertedCursor = this.engine.transliterateText(value.slice(0, cursor), true).length;
    this.value.set(converted);
    this.updateSuggestions(converted, convertedCursor);
    if (converted !== value) this.restoreCursor(convertedCursor);
  }

  onKeydown(event: KeyboardEvent): void {
    const candidates = this.suggestions();
    if (!candidates.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex.update((index) =>
        event.key === 'ArrowDown'
          ? Math.min(index + 1, candidates.length - 1)
          : Math.max(index - 1, 0),
      );
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
    const active = this.composition ?? activeRomanWord(this.value(), cursor);
    if (!active) return;
    if (this.value().slice(active.start, active.end) !== active.roman) {
      this.clearSuggestions();
      return;
    }
    const updated = `${this.value().slice(0, active.start)}${suggestion.text}${suffix}${this.value().slice(active.end)}`;
    this.value.set(updated);
    this.engine.remember(active.roman, suggestion.text);
    this.persistUserWord(active.roman, suggestion.text);
    this.clearSuggestions();
    this.restoreCursor(active.start + suggestion.text.length + suffix.length);
  }

  convertAll(): void {
    if (this.language() !== 'telugu') return;
    const textarea = this.editorTextarea()?.nativeElement;
    const cursor = textarea?.selectionStart ?? this.value().length;
    const current = this.value();
    const converted = this.engine.transliterateText(current);
    this.value.set(converted);
    this.clearSuggestions();
    this.restoreCursor(this.engine.transliterateText(current.slice(0, cursor)).length);
  }

  insertSyntax(prefix: string, suffix: string): void {
    const textarea = this.editorTextarea()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.value();

    const selectedText = current.substring(start, end);
    const before = current.substring(0, start);
    const after = current.substring(end);

    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;

    if (this.language() === 'telugu') {
      this.value.set(this.engine.transliterateText(newContent));
    } else {
      this.value.set(newContent);
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
    this.suggestions.set(
      this.engine
        .suggest({
          before: value.slice(0, active.start),
          current: active.roman,
          after: value.slice(active.end),
          languageMode: 'mixed',
        })
        .slice(0, 6),
    );
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
      const entries: Array<[string, string]> = JSON.parse(
        localStorage.getItem('telugu-editor-user-vocabulary') ?? '[]',
      );
      for (const [roman, telugu] of entries) {
        if (typeof roman === 'string' && typeof telugu === 'string') {
          this.userWords.set(roman, telugu);
          this.engine.remember(roman, telugu);
        }
      }
    } catch {
      /* Invalid browser storage should not interrupt typing. */
    }
  }

  private persistUserWord(roman: string, telugu: string): void {
    this.userWords.set(roman.toLowerCase(), telugu);
    try {
      localStorage.setItem(
        'telugu-editor-user-vocabulary',
        JSON.stringify([...this.userWords.entries()].slice(-500)),
      );
    } catch {
      /* Storage can be unavailable or full; in-memory learning still works. */
    }
  }
}
