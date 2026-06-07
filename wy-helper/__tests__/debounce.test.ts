import { describe, it, expect, vi } from 'vitest';
import { debounceTask } from '../src/tasks/debounce';

describe('debounceTask', () => {
  it('all callers share the same promise until it settles', () => {
    let release!: () => void;
    const action = () =>
      new Promise<string>(r => {
        release = r;
      });
    const task = debounceTask(action);

    const p1 = task();
    const p2 = task();
    expect(p1).toBe(p2);
  });

  it('latest call wins: rejects if winning action rejects', async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error('ignored'))
      .mockRejectedValueOnce(new Error('final'));
    const task = debounceTask(action);

    const promise = task();
    const promise2 = task();

    await expect(promise).rejects.toThrow('final');
    await expect(promise2).rejects.toThrow('final');
  });

  it('repeated calls all resolve with the final action result', async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('newer')
      .mockResolvedValueOnce('final');
    const task = debounceTask(action);

    const p1 = task(1);
    const p2 = task(2);
    const p3 = task(3);

    await expect(p1).resolves.toBe('final');
    await expect(p2).resolves.toBe('final');
    await expect(p3).resolves.toBe('final');
  });

  it('sequential calls work correctly (completes then starts fresh)', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const task = debounceTask(action);

    const r1 = await task('a');
    expect(r1).toBe('ok');

    const r2 = await task('b');
    expect(r2).toBe('ok');

    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenNthCalledWith(1, 'a');
    expect(action).toHaveBeenNthCalledWith(2, 'b');
  });

  it('forwards arguments to the action', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const task = debounceTask(action);

    await task('x', 42, true);
    expect(action).toHaveBeenCalledWith('x', 42, true);
  });

  it('invokes didCall callback on success with correct value', async () => {
    const action = () => Promise.resolve(99);
    const didCall = vi.fn();
    const task = debounceTask(action, didCall);

    await task();
    expect(didCall).toHaveBeenCalledTimes(1);
    expect(didCall.mock.calls[0][0].type).toBe('success');
    expect(didCall.mock.calls[0][0].value).toBe(99);
  });

  it('invokes didCall callback on failure', async () => {
    const action = () => Promise.reject(new Error('boom'));
    const didCall = vi.fn();
    const task = debounceTask(action, didCall);

    await expect(task()).rejects.toThrow('boom');
    expect(didCall).toHaveBeenCalledTimes(1);
    expect(didCall.mock.calls[0][0].type).toBe('error');
  });

  it('returns a new promise after previous call completes', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const task = debounceTask(action);

    const p1 = task();
    await p1;
    const p2 = task();
    expect(p1).not.toBe(p2);
  });

  it('aborted intermediate actions are never returned via didCall', async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce('skip')
      .mockResolvedValueOnce('ok');
    const didCall = vi.fn();
    const task = debounceTask(action, didCall);

    task();
    await task();
    expect(didCall).toHaveBeenCalledTimes(1);
    expect(didCall.mock.calls[0][0].value).toBe('ok');
  });
});
