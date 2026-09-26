import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, QuoteReaction } from '../../../../core/models/quote.model';

@Component({
  selector: 'app-quote-card',
  imports: [CommonModule],
  templateUrl: './quote-card.component.html',
  styleUrl: './quote-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteCardComponent {
  readonly quote = input.required<Quote>();
  readonly selectQuote = output<Quote>();
  readonly copyQuote = output<Quote>();
  readonly editQuote = output<Quote>();
  readonly deleteQuote = output<Quote>();
  readonly reactionChange = output<QuoteReaction | null>();
  readonly isAuthenticated = input(false);
  readonly showManagementActions = input(false);

  readonly isCopied = signal(false);

  onCardClick(): void {
    this.selectQuote.emit(this.quote());
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
    this.reactionChange.emit(this.quote().userReaction === reaction ? null : reaction);
  }
}
