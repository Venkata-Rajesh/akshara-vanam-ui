import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  signal,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-playful-widget',
  imports: [CommonModule],
  templateUrl: './playful-widget.component.html',
  styleUrl: './playful-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayfulWidgetComponent implements AfterViewInit {
  @ViewChild('playground', { static: true }) playground!: ElementRef<HTMLDivElement>;

  readonly noBtnStyle = signal<{ left: string; top: string; transition?: string }>({
    left: '200px',
    top: '180px',
    transition: 'left 300ms ease, top 300ms ease',
  });

  readonly quoteText = signal<string | null>(null);
  readonly quoteStyle = signal<{ left: string; top: string }>({ left: '0px', top: '0px' });
  readonly hearts = signal<Array<{ id: number; left: string }>>([]);

  private heartId = 0;
  private quoteTimer: any = null;

  readonly wittyQuotes = [
    'Fine, be mysterious — but my heart still likes you.',
    "Saying no so fast? That's just your heart flirting with indecision.",
    "If 'no' were a song, I'd still hum along.",
    "You dodge me and yet I care — that's human, not heroic.",
    "A polite 'no' with a wondering heart — that's complicated love.",
    'Hearts over hesitation. Try again?',
    "You say no like it's an art. I'm here for the gallery.",
    'No is brave. So is giving it another thought.',
    "Keep the 'no' — but take this small, unsolicited compliment.",
    "Not ready? That's okay; feelings rarely RSVP on time.",
  ];

  ngAfterViewInit(): void {
    const el = this.playground.nativeElement;
    const rect = el.getBoundingClientRect();
    const margin = 40;
    const x = margin + Math.random() * Math.max(100, rect.width - margin * 3);
    const y = margin + Math.random() * Math.max(100, rect.height - margin * 3);

    this.noBtnStyle.set({
      left: `${x}px`,
      top: `${y}px`,
      transition: 'left 300ms ease, top 300ms ease',
    });
  }

  onPlaygroundMouseMove(e: MouseEvent): void {
    const rect = this.playground.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const btnX = parseFloat(this.noBtnStyle().left);
    const btnY = parseFloat(this.noBtnStyle().top);

    const dx = mouseX - btnX;
    const dy = mouseY - btnY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const threshold = Math.max(100, Math.min(160, rect.width * 0.2));

    if (dist < threshold) {
      this.dodgeFrom(mouseX, mouseY, rect);
      this.showRandomQuoteNear(btnX, btnY, rect);
    }
  }

  private dodgeFrom(mouseX: number, mouseY: number, rect: DOMRect): void {
    const margin = 20;
    const maxX = Math.max(60, rect.width - 120);
    const maxY = Math.max(60, rect.height - 60);

    let newX = mouseX + (mouseX < rect.width / 2 ? 1 : -1) * (90 + Math.random() * 180);
    let newY = mouseY + (mouseY < rect.height / 2 ? 1 : -1) * (50 + Math.random() * 140);

    if (Math.abs(newX - parseFloat(this.noBtnStyle().left)) < 40) {
      newX += (Math.random() - 0.5) * 120;
    }
    if (Math.abs(newY - parseFloat(this.noBtnStyle().top)) < 30) {
      newY += (Math.random() - 0.5) * 100;
    }

    newX = Math.max(margin, Math.min(maxX, newX));
    newY = Math.max(margin, Math.min(maxY, newY));

    this.noBtnStyle.set({
      left: `${newX}px`,
      top: `${newY}px`,
      transition: 'left 250ms ease, top 250ms ease',
    });
  }

  dodgeOnHover(): void {
    const rect = this.playground.nativeElement.getBoundingClientRect();
    this.dodgeFrom(rect.width / 2, rect.height / 2, rect);
    const btnX = parseFloat(this.noBtnStyle().left);
    const btnY = parseFloat(this.noBtnStyle().top);
    this.showRandomQuoteNear(btnX, btnY, rect);
  }

  private showRandomQuoteNear(btnX: number, btnY: number, rect: DOMRect): void {
    const q = this.wittyQuotes[Math.floor(Math.random() * this.wittyQuotes.length)];
    this.quoteText.set(q);

    const left = Math.max(10, Math.min(rect.width - 240, btnX + 10));
    const top = Math.max(10, btnY - 70);

    this.quoteStyle.set({
      left: `${left}px`,
      top: `${top}px`,
    });

    if (this.quoteTimer) {
      clearTimeout(this.quoteTimer);
    }

    this.quoteTimer = setTimeout(() => {
      this.quoteText.set(null);
    }, 3200);
  }

  onNoClick(): void {
    const rect = this.playground.nativeElement.getBoundingClientRect();
    const btnX = parseFloat(this.noBtnStyle().left);
    const btnY = parseFloat(this.noBtnStyle().top);
    this.showRandomQuoteNear(btnX, btnY, rect);
  }

  onYesClick(): void {
    for (let i = 0; i < 10; i++) {
      const id = ++this.heartId;
      const left = 20 + Math.random() * 60 + '%';
      this.hearts.update((h) => [...h, { id, left }]);

      setTimeout(() => {
        this.hearts.update((h) => h.filter((item) => item.id !== id));
      }, 2400);
    }
  }
}
