import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar responsive navigation and styling', () => {
  it('renders all navigation items on standard desktop view', () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Store online')).toBeInTheDocument();
  });

  it('active item has seamless background styling with zero shadow and zero border', () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Sidebar />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { name: 'Orders' });
    expect(activeLink.className).toContain('bg-[var(--bg-background)]');
    expect(activeLink.className).toContain('border-0');
    expect(activeLink.className).toContain('shadow-none');
    expect(activeLink.className).toContain('-mr-[6px]');
  });

  it('mobile drawer renders full items list without collapse', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Sidebar isMobile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More navigation options' })).not.toBeInTheDocument();
  });
});
