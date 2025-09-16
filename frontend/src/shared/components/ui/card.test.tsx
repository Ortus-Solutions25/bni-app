import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card Components', () => {
  it('renders Card component with content', () => {
    render(
      <Card data-testid="card">
        <CardContent>Test content</CardContent>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders CardHeader with title and description', () => {
    render(
      <CardHeader>
        <CardTitle>Test Title</CardTitle>
        <CardDescription>Test Description</CardDescription>
      </CardHeader>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Title');
  });

  it('applies custom className to components', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Title</CardTitle>
        </CardHeader>
        <CardContent className="custom-content">Content</CardContent>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );

    const card = screen.getByText('Title').closest('.custom-card');
    expect(card).toBeInTheDocument();
  });

  it('forwards refs correctly', () => {
    const cardRef = { current: null };
    const headerRef = { current: null };

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>
          <CardTitle>Test</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
  });
});