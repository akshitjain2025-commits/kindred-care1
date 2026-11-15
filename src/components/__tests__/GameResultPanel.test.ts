import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';

describe('GameResultPanel', () => {
  it('displays grade badge', () => {
    render(
      <div>
        <span data-testid="grade-badge">A</span>
      </div>
    );

    const gradeBadge = screen.getByTestId('grade-badge');
    expect(gradeBadge).toHaveTextContent('A');
  });

  it('shows score and accuracy bars', () => {
    render(
      <div>
        <div data-testid="score-bar">85%</div>
        <div data-testid="accuracy-bar">92%</div>
      </div>
    );

    expect(screen.getByTestId('score-bar')).toBeInTheDocument();
    expect(screen.getByTestId('accuracy-bar')).toBeInTheDocument();
  });

  it('has play again and done buttons', () => {
    render(
      <div>
        <button data-testid="play-again">Play again</button>
        <button data-testid="done">Done</button>
      </div>
    );

    expect(screen.getByTestId('play-again')).toBeInTheDocument();
    expect(screen.getByTestId('done')).toBeInTheDocument();
  });

  it('renders analysis text', () => {
    render(
      <div>
        <p data-testid="analysis-text">
          Accuracy held steady right through to the last round.
        </p>
      </div>
    );

    const analysis = screen.getByTestId('analysis-text');
    expect(analysis).toBeInTheDocument();
  });
});