import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService, QuoteInput } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { authorAvatarColor } from '../../core/utils/author-initial';
import { ThemeService } from '../../core/services/theme.service';
import { PoetryLanguage, Quote, QuoteReaction, QuoteStatus } from '../../core/models/quote.model';
import { QuoteCardComponent } from './components/quote-card/quote-card.component';
import { QuoteModalComponent } from './components/quote-modal/quote-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-quotes-dashboard',
  imports: [CommonModule, FormsModule, QuoteCardComponent, QuoteModalComponent],
  templateUrl: './quotes-dashboard.component.html',
  styleUrl: './quotes-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesDashboardComponent implements OnDestroy, OnInit {
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly avatarColor = authorAvatarColor;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isDark = this.themeService.isDark;
  readonly featuredVoices = [
    {
      quote: 'దేశమంటే మట్టి కాదోయ్,\nదేశమంటే మనుషులోయ్.',
      poet: 'గురజాడ అప్పారావు',
      note: 'మానవతా దృష్టి',
    },
    {
      quote: 'ఏ దేశమేగినా ఎందుకాలిడినా,\nఏ పీఠమెక్కినా ఎవ్వరేమనినా.',
      poet: 'రాయప్రోలు సుబ్బారావు',
      note: 'దేశభక్తి గీతం',
    },
    {
      quote: 'విశ్వదాభిరామ వినుర వేమ.',
      poet: 'వేమన',
      note: 'నీతి పద్యం',
    },
    {
      quote: 'పలికెడిది భాగవతమట,\nపలికించెడు వాడు రామభద్రుండట.',
      poet: 'బమ్మెర పోతన',
      note: 'భక్తి సాహిత్యం',
    },
    {
      quote: 'మరో ప్రపంచం పిలిచింది,\nపదండి ముందుకు.',
      poet: 'శ్రీశ్రీ',
      note: 'ప్రగతి కవిత్వం',
    },
  ] as const;
  readonly activeVoiceIndex = signal(0);
  readonly activeVoice = computed(() => this.featuredVoices[this.activeVoiceIndex()]);
  readonly isVoiceRotationPaused = signal(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  private voiceRotationTimer?: ReturnType<typeof setInterval>;

  // View state signals
  readonly layoutMode = signal<'grid' | 'list'>('grid');
  readonly searchQuery = signal('');
  readonly selectedTag = signal<string | null>(null);
  readonly selectedPoetryLanguage = signal<PoetryLanguage | 'all'>('all');
  readonly showDislikedQuotes = signal(false);
  readonly selectedQuote = signal<Quote | null>(null);
  readonly editorQuote = signal<Quote | null>(null);
  readonly isEditorOpen = signal(false);
  readonly isSaving = signal(false);
  readonly isRestoringAll = signal(false);

  // Data signals
  readonly quotes = signal<Quote[]>([]);
  readonly pendingQuotes = signal<Quote[]>([]);
  readonly isReviewQueueOpen = signal(false);
  readonly isLoading = signal(true);

  // Derived state
  readonly uniqueTags = computed(() => {
    const allQuotes = this.quotes();
    const tagSet = new Set<string>();
    allQuotes.forEach((q) => {
      if (Array.isArray(q.tags)) {
        q.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  });

  readonly filteredQuotes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const tag = this.selectedTag();
    const language = this.selectedPoetryLanguage();
    const showDisliked = this.showDislikedQuotes();
    const list = this.quotes();

    return list.filter((q) => {
      const matchesVisibility = showDisliked
        ? q.userReaction === 'dislike'
        : q.userReaction !== 'dislike';
      const matchesQuery =
        !query ||
        q.content.toLowerCase().includes(query) ||
        q.author.toLowerCase().includes(query) ||
        (q.title || '').toLowerCase().includes(query);

      const matchesTag = showDisliked || !tag || (Array.isArray(q.tags) && q.tags.includes(tag));
      const matchesLanguage = showDisliked || language === 'all' || q.language === language;

      return matchesVisibility && matchesQuery && matchesTag && matchesLanguage;
    });
  });
  readonly dislikedQuoteCount = computed(
    () => this.quotes().filter((quote) => quote.userReaction === 'dislike').length,
  );

  readonly stats = computed(() => {
    const list = this.quotes();
    const tagsCount = this.uniqueTags().length;
    const authorsCount = new Set(list.map((q) => q.author)).size;
    return {
      totalQuotes: list.length,
      totalTags: tagsCount,
      totalAuthors: authorsCount,
    };
  });

  ngOnInit(): void {
    this.voiceRotationTimer = setInterval(() => {
      if (!this.isVoiceRotationPaused()) this.showNextVoice();
    }, 6500);
    this.loadQuotes();
    if (this.isAdmin()) this.loadPendingQuotes();
    this.route.queryParamMap.subscribe((params) => {
      const quoteId = params.get('quote');
      if (!quoteId) return;
      this.apiService.getQuote(quoteId).subscribe({
        next: (quote) => this.selectedQuote.set(quote),
      });
    });
  }

  ngOnDestroy(): void {
    if (this.voiceRotationTimer) clearInterval(this.voiceRotationTimer);
  }

  toggleTheme(event?: MouseEvent): void {
    const bounds =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget.getBoundingClientRect()
        : null;
    const origin = bounds
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
      : undefined;
    this.themeService.toggleTheme(origin);
  }

  showPreviousVoice(): void {
    this.activeVoiceIndex.update((index) =>
      index === 0 ? this.featuredVoices.length - 1 : index - 1,
    );
  }

  showNextVoice(): void {
    this.activeVoiceIndex.update((index) => (index + 1) % this.featuredVoices.length);
  }

  selectVoice(index: number): void {
    this.activeVoiceIndex.set(index);
  }

  toggleVoiceRotation(): void {
    this.isVoiceRotationPaused.update((paused) => !paused);
  }

  loadQuotes(): void {
    this.isLoading.set(true);
    this.apiService.getQuotes().subscribe({
      next: (data) => {
        this.quotes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Failed to load quotes. Please try again.');
      },
    });
  }

  setLayout(layout: 'grid' | 'list'): void {
    this.layoutMode.set(layout);
  }

  toggleTag(tag: string): void {
    this.selectedTag.update((curr) => (curr === tag ? null : tag));
  }

  setLanguageFilter(language: PoetryLanguage | 'all'): void {
    this.selectedPoetryLanguage.set(language);
  }

  toggleDislikedQuotes(): void {
    const showDisliked = !this.showDislikedQuotes();
    this.showDislikedQuotes.set(showDisliked);
    if (showDisliked) {
      this.selectedTag.set(null);
      this.selectedPoetryLanguage.set('all');
    }
  }

  resetQuoteFilters(): void {
    if (this.showDislikedQuotes()) {
      this.showDislikedQuotes.set(false);
      return;
    }
    this.searchQuery.set('');
    this.selectedTag.set(null);
  }

  openQuoteModal(quote: Quote): void {
    this.selectedQuote.set(quote);
  }

  closeQuoteModal(): void {
    this.selectedQuote.set(null);
    this.editorQuote.set(null);
    this.isEditorOpen.set(false);
    this.isSaving.set(false);
  }

  openCreateQuote(): void {
    this.selectedQuote.set(null);
    this.editorQuote.set(null);
    this.isEditorOpen.set(true);
  }

  openEditQuote(quote: Quote): void {
    this.selectedQuote.set(null);
    this.editorQuote.set(quote);
    this.isEditorOpen.set(true);
  }

  saveQuote(input: QuoteInput): void {
    this.isSaving.set(true);
    const quote = this.editorQuote();
    const request = quote
      ? this.apiService.updateQuote(quote._id, input)
      : this.apiService.createQuote(input);
    request.subscribe({
      next: (saved) => {
        this.closeQuoteModal();
        this.quotes.update((quotes) => {
          const withoutSaved = quotes.filter((item) => item._id !== saved._id);
          return saved.status === 'published' ? [saved, ...withoutSaved] : withoutSaved;
        });
        if (saved.status === 'pending') {
          this.toast.success('Submission received. It will appear after admin review.');
        } else {
          this.toast.success(quote ? 'Quote updated successfully.' : 'Quote published.');
        }
      },
      error: (error) => {
        this.isSaving.set(false);
        this.toast.error(error.message || 'Unable to save quote.');
      },
    });
  }

  deleteQuote(quote: Quote): void {
    if (!confirm(`Delete the quote by ${quote.author}?`)) return;
    this.apiService.deleteQuote(quote._id).subscribe({
      next: () => {
        this.quotes.update((quotes) => quotes.filter((item) => item._id !== quote._id));
        this.toast.success('Quote deleted successfully.');
      },
      error: (error) => this.toast.error(error.message || 'Unable to delete quote.'),
    });
  }

  canManageQuote(quote: Quote): boolean {
    const user = this.currentUser();
    return !!user && (user.role === 'admin' || user.id === quote.createdBy);
  }

  setReaction(quoteId: string, reaction: QuoteReaction | null): void {
    if (!this.isAuthenticated()) {
      this.openSignIn();
      return;
    }
    const previousReaction = this.quotes().find((quote) => quote._id === quoteId)?.userReaction;
    const isLastHiddenQuote =
      reaction === null &&
      previousReaction === 'dislike' &&
      this.dislikedQuoteCount() === 1;
    this.apiService.setReaction(quoteId, reaction).subscribe({
      next: (summary) => {
        this.quotes.update((quotes) =>
          quotes.map((quote) => (quote._id === quoteId ? { ...quote, ...summary } : quote)),
        );
        const selected = this.selectedQuote();
        if (selected?._id === quoteId) this.selectedQuote.set({ ...selected, ...summary });
        if (reaction === 'dislike') {
          this.toast.info('Quote hidden. Open Hidden to restore it.');
        } else if (reaction === null && previousReaction === 'dislike') {
          if (isLastHiddenQuote && this.showDislikedQuotes()) this.showDislikedQuotes.set(false);
          this.toast.success('Quote restored to your collection.');
        }
      },
      error: (error) => this.toast.error(error.message || 'Unable to update reaction.'),
    });
  }

  restoreAllDislikedQuotes(): void {
    const hiddenQuotes = this.quotes().filter((quote) => quote.userReaction === 'dislike');
    if (hiddenQuotes.length < 2 || this.isRestoringAll()) return;

    this.isRestoringAll.set(true);
    forkJoin(hiddenQuotes.map((quote) => this.apiService.setReaction(quote._id, null))).subscribe({
      next: (summaries) => {
        const summaryById = new Map(hiddenQuotes.map((quote, index) => [quote._id, summaries[index]]));
        this.quotes.update((quotes) =>
          quotes.map((quote) => {
            const summary = summaryById.get(quote._id);
            return summary ? { ...quote, ...summary } : quote;
          }),
        );
        const selected = this.selectedQuote();
        const selectedSummary = selected ? summaryById.get(selected._id) : undefined;
        if (selected && selectedSummary) this.selectedQuote.set({ ...selected, ...selectedSummary });
        this.showDislikedQuotes.set(false);
        this.toast.success('All hidden quotes restored to your collection.');
        this.isRestoringAll.set(false);
      },
      error: (error) => {
        this.isRestoringAll.set(false);
        this.loadQuotes();
        this.toast.error(error.message || 'Unable to restore all hidden quotes.');
      },
    });
  }

  toggleReviewQueue(): void {
    this.isReviewQueueOpen.update((open) => !open);
    if (this.pendingQuotes().length === 0) this.loadPendingQuotes();
  }

  reviewSubmission(quote: Quote, status: Extract<QuoteStatus, 'published' | 'rejected'>): void {
    this.apiService.reviewQuote(quote._id, status).subscribe({
      next: (reviewed) => {
        this.pendingQuotes.update((items) => items.filter((item) => item._id !== reviewed._id));
        if (status === 'published') this.quotes.update((items) => [reviewed, ...items]);
        this.toast.success(
          status === 'published' ? 'Quote approved and published.' : 'Submission rejected.',
        );
      },
      error: (error) => this.toast.error(error.message || 'Unable to review submission.'),
    });
  }

  openSignIn(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private loadPendingQuotes(): void {
    if (!this.isAdmin()) return;
    this.apiService.getPendingQuotes().subscribe({
      next: (quotes) => this.pendingQuotes.set(quotes),
      error: (error) => this.toast.error(error.message || 'Unable to load review queue.'),
    });
  }

  copyQuote(quote: Quote): void {
    const textToCopy = `"${quote.content}" — ${quote.author}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          this.toast.success('Quote copied to clipboard!');
        },
        () => {
          this.toast.info(`Quote: ${textToCopy}`);
        },
      );
    } else {
      this.toast.info(`Quote: ${textToCopy}`);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
