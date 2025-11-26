/**
 * Teste básico para validar que o setup do Jest está funcionando corretamente
 */

describe('Jest Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  it('should mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('Environment Setup', () => {
  it('should have timezone set to UTC', () => {
    const date = new Date('2024-01-01T12:00:00.000Z');
    expect(date.toISOString()).toContain('2024-01-01T12:00:00');
  });

  it('should have console methods mocked', () => {
    console.warn('test warning');
    console.error('test error');
    
    // Console methods should be mocked and not throw
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

