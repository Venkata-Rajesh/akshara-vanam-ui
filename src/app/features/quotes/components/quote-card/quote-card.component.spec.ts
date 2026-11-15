import { TestBed } from '@angular/core/testing';
import { Quote } from '../../../../core/models/quote.model';
import { QuoteCardComponent } from './quote-card.component';

describe('QuoteCardComponent keyboard interaction', () => {
  const quote: Quote = {
    _id: 'quote-1',
    author: 'A Poet',
    content: 'A short poem.',
    tags: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteCardComponent],
    }).compileComponents();
  });

  it('opens the quote and prevents page scrolling when Space activates the card', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    fixture.componentRef.setInput('quote', quote);
    fixture.detectChanges();

    const selectedQuotes: Quote[] = [];
    fixture.componentInstance.selectQuote.subscribe((selected) => selectedQuotes.push(selected));
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

    card.dispatchEvent(event);

    expect(selectedQuotes).toEqual([quote]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not open the quote when a nested action receives a key event', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    fixture.componentRef.setInput('quote', quote);
    fixture.detectChanges();

    const selectedQuotes: Quote[] = [];
    fixture.componentInstance.selectQuote.subscribe((selected) => selectedQuotes.push(selected));
    const copyButton = fixture.nativeElement.querySelector('.copy-btn') as HTMLButtonElement;
    copyButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(selectedQuotes).toEqual([]);
  });
});
