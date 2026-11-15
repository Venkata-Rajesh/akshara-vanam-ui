import { Component, input, output, signal } from '@angular/core';
import { Quote, QuoteReaction } from '../../../../core/models/quote.model';
import { authorAvatarColor, authorInitial } from '../../../../core/utils/author-initial';

@Component({
  selector: 'app-quote-card',
  templateUrl: './quote-card.component.html',
  styleUrl: './quote-card.component.css',
})
export class QuoteCardComponent {
  readonly authorInitial = authorInitial;
  readonly quote = input.required<Quote>();
  readonly selectQuote = output<Quote>();
  readonly copyQuote = output<Quote>();
  readonly editQuote = output<Quote>();
  readonly deleteQuote = output<Quote>();
  readonly reactionChange = output<QuoteReaction | null>();
  readonly isAuthenticated = input(false);
  readonly showManagementActions = input(false);
  readonly isHiddenQuote = input(false);
  readonly avatarColor = authorAvatarColor;

  readonly isCopied = signal(false);
  readonly reactionBurst = signal<QuoteReaction | null>(null);
  private reactionBurstTimer?: ReturnType<typeof setTimeout>;

  onCardClick(): void {
    this.selectQuote.emit(this.quote());
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    this.onCardClick();
  }

  onCopyClick(event: MouseEvent): void {
    event.stopPropagation();
    this.copyQuote.emit(this.quote());

    // Temporary checkmark feedback
    this.isCopied.set(true);
    setTimeout(() => {
      this.isCopied.set(false);
    }, 2000);
  }

  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.editQuote.emit(this.quote());
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteQuote.emit(this.quote());
  }

  onReactionClick(event: MouseEvent, reaction: QuoteReaction): void {
    event.stopPropagation();
    const nextReaction = this.quote().userReaction === reaction ? null : reaction;
    if (this.reactionBurstTimer) clearTimeout(this.reactionBurstTimer);
    this.reactionBurst.set(nextReaction && this.isAuthenticated() ? nextReaction : null);
    if (nextReaction && this.isAuthenticated()) {
      this.reactionBurstTimer = setTimeout(() => this.reactionBurst.set(null), 900);
    }
    this.reactionChange.emit(nextReaction);
  }

  onRestoreClick(event: MouseEvent): void {
    event.stopPropagation();
    this.reactionChange.emit(null);
  }
}
