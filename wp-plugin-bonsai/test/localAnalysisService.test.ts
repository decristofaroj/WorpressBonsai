// START ./wp-plugin-bonsai/test/localAnalysisService.test.ts
import { describe, it, expect } from 'vitest';
import { performLocalAnalysis } from '../src/services/localAnalysisService';
import { IssueCategory, Plugin } from '../src/types';

function pluginWith(code: string): Plugin {
  return {
    id: 'p1',
    name: 'TestPlugin',
    zipName: null,
    files: [{ id: 'f1', name: 'file.php', code }],
  };
}

describe('performLocalAnalysis', () => {
  it('reports PHP syntax errors', () => {
    const plugin = pluginWith('<?php if (true) { echo "hi";');
    const issues = performLocalAnalysis([plugin]);
    expect(issues.some(i => i.category === IssueCategory.CodeQuality)).toBe(true);
  });

  it('detects unescaped output', () => {
    const plugin = pluginWith('<?php echo $_GET["name"];');
    const issues = performLocalAnalysis([plugin]);
    expect(issues.some(i => i.category === IssueCategory.Security)).toBe(true);
  });

  it('flags deprecated WordPress functions', () => {
    const plugin = pluginWith('<?php add_option_whitelist();');
    const issues = performLocalAnalysis([plugin]);
    expect(issues.some(i => i.category === IssueCategory.BestPractices)).toBe(true);
  });
});
// END ./wp-plugin-bonsai/test/localAnalysisService.test.ts
