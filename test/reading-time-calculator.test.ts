import { describe, it, expect } from 'vitest';
import { ReadingTimeCalculator } from '../entrypoints/content/telescope/models/ReadingTimeCalculator';
import { countWords } from '../entrypoints/content/telescope/models/wordCounter';

describe('countWords', () => {
  it('should count words in plain text', () => {
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('The quick brown fox')).toBe(4);
  });

  it('should strip HTML tags', () => {
    expect(countWords('<p>Hello <strong>world</strong></p>')).toBe(2);
    expect(countWords('<div><h1>Title</h1><p>Content here</p></div>')).toBe(3);
  });

  it('should return 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('should return 0 for null or undefined', () => {
    expect(countWords(null as unknown as string)).toBe(0);
    expect(countWords(undefined as unknown as string)).toBe(0);
  });

  it('should handle whitespace normalization', () => {
    expect(countWords('  Hello    world  ')).toBe(2);
    expect(countWords('Hello\n\n\nworld')).toBe(2);
    expect(countWords('Hello\t\tworld')).toBe(2);
  });

  it('should handle HTML with attributes', () => {
    expect(
      countWords('<a href="http://example.com" class="link">Click here</a>')
    ).toBe(2);
  });

  it('should handle nested HTML', () => {
    const html = `
      <div class="content">
        <h1>Title</h1>
        <p>This is a <strong>test</strong> paragraph.</p>
        <ul>
          <li>Item one</li>
          <li>Item two</li>
        </ul>
      </div>
    `;
    // Title (1) + This is a test paragraph (5) + Item one (2) + Item two (2) = 10
    expect(countWords(html)).toBe(10);
  });

  it('should handle whitespace-only content', () => {
    expect(countWords('   \n   \t   ')).toBe(0);
  });
});

describe('ReadingTimeCalculator', () => {
  describe('calculateMinutes', () => {
    it('should calculate minutes based on 200 WPM', () => {
      // 200 words = 1 minute
      const content = 'word '.repeat(200);
      expect(ReadingTimeCalculator.calculateMinutes(content)).toBe(1);
    });

    it('should calculate fractional minutes', () => {
      // 100 words = 0.5 minutes
      const content = 'word '.repeat(100);
      expect(ReadingTimeCalculator.calculateMinutes(content)).toBe(0.5);
    });

    it('should return 0 for empty content', () => {
      expect(ReadingTimeCalculator.calculateMinutes('')).toBe(0);
    });
  });

  describe('formatReadingTime', () => {
    it('should format less than 1 minute', () => {
      expect(ReadingTimeCalculator.formatReadingTime(0.5)).toBe('< 1 min read');
      expect(ReadingTimeCalculator.formatReadingTime(0.9)).toBe('< 1 min read');
    });

    it('should format minutes only (1-59 minutes)', () => {
      expect(ReadingTimeCalculator.formatReadingTime(1)).toBe('1 min read');
      expect(ReadingTimeCalculator.formatReadingTime(5)).toBe('5 min read');
      expect(ReadingTimeCalculator.formatReadingTime(30)).toBe('30 min read');
      expect(ReadingTimeCalculator.formatReadingTime(59)).toBe('59 min read');
    });

    it('should round minutes to nearest integer', () => {
      expect(ReadingTimeCalculator.formatReadingTime(5.4)).toBe('5 min read');
      expect(ReadingTimeCalculator.formatReadingTime(5.6)).toBe('6 min read');
    });

    it('should format hours and minutes (60+ minutes)', () => {
      expect(ReadingTimeCalculator.formatReadingTime(60)).toBe('1 hour read');
      expect(ReadingTimeCalculator.formatReadingTime(75)).toBe(
        '1 hour 15 min read'
      );
      expect(ReadingTimeCalculator.formatReadingTime(90)).toBe(
        '1 hour 30 min read'
      );
      expect(ReadingTimeCalculator.formatReadingTime(120)).toBe('2 hour read');
      expect(ReadingTimeCalculator.formatReadingTime(150)).toBe(
        '2 hour 30 min read'
      );
    });

    it('should return null for invalid input', () => {
      expect(ReadingTimeCalculator.formatReadingTime(0)).toBe(null);
      expect(ReadingTimeCalculator.formatReadingTime(-5)).toBe(null);
      expect(ReadingTimeCalculator.formatReadingTime(Infinity)).toBe(null);
      expect(ReadingTimeCalculator.formatReadingTime(-Infinity)).toBe(null);
      expect(ReadingTimeCalculator.formatReadingTime(NaN)).toBe(null);
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time for short content', () => {
      // 150 words < 1 minute
      const content = 'word '.repeat(150);
      expect(ReadingTimeCalculator.estimateReadingTime(content)).toBe(
        '< 1 min read'
      );
    });

    it('should estimate reading time for medium content', () => {
      // 1000 words = 5 minutes
      const content = 'word '.repeat(1000);
      expect(ReadingTimeCalculator.estimateReadingTime(content)).toBe(
        '5 min read'
      );
    });

    it('should estimate reading time for long content', () => {
      // 15000 words = 75 minutes = 1 hour 15 min
      const content = 'word '.repeat(15000);
      expect(ReadingTimeCalculator.estimateReadingTime(content)).toBe(
        '1 hour 15 min read'
      );
    });

    it('should return null for empty content', () => {
      expect(ReadingTimeCalculator.estimateReadingTime('')).toBe(null);
    });

    it('should handle HTML content', () => {
      // 1000 words in HTML
      const words = 'word '.repeat(1000);
      const htmlContent = `<div><p>${words}</p></div>`;
      expect(ReadingTimeCalculator.estimateReadingTime(htmlContent)).toBe(
        '5 min read'
      );
    });
  });
});
