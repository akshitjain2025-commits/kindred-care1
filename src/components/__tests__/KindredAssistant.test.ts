import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KindredAssistant from '../KindredAssistant';

vi.mock('../freebuffAuth', () => ({
  useFreebuffAuth: () => ({
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    session: {user: null},
  }),
}));

describe('KindredAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the assistant chat interface', () => {
    render(<KindredAssistant residentId="test-resident" />);

    // Should have chat container
    const chatContainer = screen.getByRole('dialog') || screen.getByTestId('assistant-chat');
    expect(chatContainer).toBeInTheDocument();
  });

  it('has voice toggle controls', () => {
    render(<KindredAssistant residentId="test-resident" />);

    const voiceToggle = screen.getByRole('switch') || screen.getByText(/voice on/i);
    expect(voiceToggle).toBeInTheDocument();
  });

  it('has read aloud functionality', () => {
    render(<KindredAssistant residentId="test-resident" />);

    // Should have a speak/read aloud button
    const speakButton = screen.getByRole('button', {name: /read aloud/i }) || screen.getByText(/speak/i);
    expect(speakButton).toBeInTheDocument();
  });
});