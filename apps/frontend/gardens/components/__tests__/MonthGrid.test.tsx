import { render, screen, fireEvent } from '@testing-library/react';
import MonthGrid from '../MonthGrid';

describe('MonthGrid keyboard navigation', () => {
  const onChange = () => {};
  test('arrows move focus', () => {
    render(<MonthGrid month="2024-09" entries={{}} onChange={onChange} />);
    const first = screen.getByRole('gridcell', { name: 'יום 1' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    const day2 = screen.getByRole('gridcell', { name: 'יום 2' });
    expect(document.activeElement).toBe(day2);
    fireEvent.keyDown(day2, { key: 'ArrowDown' });
    const day9 = screen.getByRole('gridcell', { name: 'יום 9' });
    expect(document.activeElement).toBe(day9);
  });
});
