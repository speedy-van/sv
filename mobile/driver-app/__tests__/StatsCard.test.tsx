import React from 'react';
import { render } from '@testing-library/react-native';
import { StatsCard } from '../components/StatsCard';

describe('StatsCard', () => {
  it('renders title and value correctly', () => {
    const { getByText } = render(
      <StatsCard title="Test Title" value="Test Value" />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Value')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <StatsCard
        title="Test Title"
        value="Test Value"
        subtitle="Test Subtitle"
      />
    );

    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(
      <StatsCard title="Test Title" value="Test Value" />
    );

    expect(queryByText('Test Subtitle')).toBeNull();
  });

  it('renders icon when provided', () => {
    const mockIcon = <React.Fragment>Test Icon</React.Fragment>;
    const { getByText } = render(
      <StatsCard title="Test Title" value="Test Value" icon={mockIcon} />
    );

    expect(getByText('Test Icon')).toBeTruthy();
  });
});