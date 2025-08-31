// START ./wp-plugin-bonsai/test/localCodePatcher.test.ts
import { describe, it, expect } from 'vitest';
import { localCodePatcher } from '../src/services/localCodePatcher';
import type { CodeChangeInstruction } from '../src/types';

describe('localCodePatcher.applyPatch', () => {
  it('applies replace, insert, and delete operations', () => {
    const original = ['one', 'two', 'three'].join('\n');
    const changes: CodeChangeInstruction[] = [
      { type: 'REPLACE_BLOCK', startLine: 2, endLine: 2, content: 'TWO' },
      { type: 'INSERT_BEFORE', startLine: 1, endLine: 1, content: 'zero' },
      { type: 'INSERT_AFTER', startLine: 3, endLine: 3, content: 'four' },
      { type: 'DELETE_BLOCK', startLine: 2, endLine: 2, content: '' }
    ];
    const result = localCodePatcher.applyPatch(original, changes);
    expect(result).toBe(['zero', 'one', 'three', 'four'].join('\n'));
  });

  it('ignores out-of-range instructions', () => {
    const original = ['a', 'b'].join('\n');
    const changes: CodeChangeInstruction[] = [
      { type: 'DELETE_BLOCK', startLine: 10, endLine: 12, content: '' },
      { type: 'INSERT_BEFORE', startLine: -1, endLine: -1, content: 'x' }
    ];
    const result = localCodePatcher.applyPatch(original, changes);
    expect(result).toBe(original);
  });
});
// END ./wp-plugin-bonsai/test/localCodePatcher.test.ts
