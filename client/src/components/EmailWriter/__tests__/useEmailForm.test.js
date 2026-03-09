import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailForm } from '../useEmailForm';

describe('useEmailForm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEmailForm());

    expect(result.current.to).toBe('');
    expect(result.current.subject).toBe('');
    expect(result.current.body).toBe('');
    expect(result.current.showCcBcc).toBe(false);
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() =>
      useEmailForm('test@example.com', 'Test Subject', 'Test Body')
    );

    expect(result.current.to).toBe('test@example.com');
    expect(result.current.subject).toBe('Test Subject');
    expect(result.current.body).toBe('Test Body');
  });

  it('should update form fields', () => {
    const { result } = renderHook(() => useEmailForm());

    act(() => {
      result.current.setTo('test@example.com');
      result.current.setSubject('Test');
      result.current.setBody('Body');
    });

    expect(result.current.to).toBe('test@example.com');
    expect(result.current.subject).toBe('Test');
    expect(result.current.body).toBe('Body');
  });

  it('should validate form fields', () => {
    const { result } = renderHook(() => useEmailForm());

    act(() => {
      const isValid = result.current.validate();
      expect(isValid).toBe(false);
    });
    
    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.setTo('test@example.com');
      result.current.setSubject('Test');
      result.current.setBody('Body');
    });

    act(() => {
      const isValid = result.current.validate();
      expect(isValid).toBe(true);
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should get form data', () => {
    const { result } = renderHook(() => useEmailForm());

    act(() => {
      result.current.setTo('test@example.com');
      result.current.setSubject('Test');
      result.current.setBody('Body');
      result.current.setCc('cc@example.com');
    });

    const formData = result.current.getFormData();

    expect(formData.to).toBe('test@example.com');
    expect(formData.subject).toBe('Test');
    expect(formData.body).toBe('Body');
    expect(formData.cc).toBe('cc@example.com');
  });

  it('should reset form', () => {
    const { result } = renderHook(() =>
      useEmailForm('initial@example.com', 'Initial Subject', 'Initial Body')
    );

    act(() => {
      result.current.setTo('changed@example.com');
      result.current.setSubject('Changed');
      result.current.reset();
    });

    expect(result.current.to).toBe('initial@example.com');
    expect(result.current.subject).toBe('Initial Subject');
    expect(result.current.body).toBe('Initial Body');
  });
});
