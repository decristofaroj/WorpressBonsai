import PhpParser from 'php-parser';
import type { Node, Identifier } from 'php-parser';
import type { Plugin, ReviewIssue } from '@/types';
import { IssueCategory, IssueSeverity } from '@/types';
import { deprecatedWordPressFunctions } from '@/data/wordpress';

const parser = new (PhpParser as any)({
  parser: {
    extractDoc: true,
    php7: true,
  },
  lexer: {
    all_tokens: true,
    comment_tokens: true,
  },
});

const checkSyntax = (fileCode: string, fileName: string, pluginName: string): ReviewIssue[] => {
  try {
    parser.parseCode(fileCode, fileName);
    return [];
  } catch (e: any) {
    const error: ReviewIssue = {
      pluginName,
      fileName,
      category: IssueCategory.CodeQuality,
      severity: IssueSeverity.Critical,
      description: `PHP Syntax Error: ${e.message}`,
      impact: 'This is a fatal error that will crash your website.',
      suggestion: `Check the code around line ${e.lineNumber}, column ${e.columnNumber} for mistakes like missing semicolons, incorrect variable names, or mismatched brackets.`,
      source: 'Local Scanner',
    };
    return [error];
  }
};

const checkUnescapedOutput = (fileCode: string, fileName: string, pluginName: string): ReviewIssue[] => {
  const issues: ReviewIssue[] = [];
  const lines = fileCode.split('\n');
  const unescapedRegex = /(echo|print|printf|=>)\s*\$_(GET|POST|REQUEST)\[/i;

  lines.forEach((line, index) => {
    // Avoid flagging legitimate uses like in a nonce check
    if (unescapedRegex.test(line) && !line.includes('wp_verify_nonce')) {
      issues.push({
        pluginName,
        fileName,
        category: IssueCategory.Security,
        severity: IssueSeverity.Critical,
        description: `Potential Cross-Site Scripting (XSS) vulnerability on line ${index + 1}.`,
        impact: 'This could allow an attacker to inject malicious scripts into your website, potentially stealing user data or defacing the site.',
        suggestion: `Always escape output. Sanitize and validate all user input. Use WordPress escaping functions like esc_html(), esc_attr(), or esc_url() on the variable from $_GET or $_POST before echoing it. For example: echo esc_html( $_POST['user_input'] );`,
        source: 'Local Scanner',
      });
    }
  });

  return issues;
};


const checkDeprecatedFunctions = (ast: Node, fileName: string, pluginName: string): ReviewIssue[] => {
  const issues: ReviewIssue[] = [];
  
  function walk(node: Node) {
    if (!node) return;

    if (node.kind === 'call') {
      const callNode = node as any;
      if (callNode.what.kind === 'name') {
        const functionName = (callNode.what as Identifier).name;
        if (deprecatedWordPressFunctions.has(functionName)) {
          issues.push({
            pluginName,
            fileName,
            category: IssueCategory.BestPractices,
            severity: IssueSeverity.Warning,
            description: `Usage of deprecated WordPress function: ${functionName}()`,
            impact: 'Using outdated functions can lead to bugs or break your site in future WordPress versions.',
            suggestion: `Replace ${functionName}() with its modern equivalent. Check the official WordPress developer documentation for the recommended alternative.`,
            source: 'Local Scanner',
          });
        }
      }
    }

    // Traverse children
    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = (node as any)[key];
            if (Array.isArray(child)) {
                child.forEach(walk);
            } else if (child && typeof child === 'object' && child.kind) {
                walk(child);
            }
        }
    }
  }

  walk(ast);
  return issues;
};

export const performLocalAnalysis = (plugins: Plugin[]): ReviewIssue[] => {
  let allIssues: ReviewIssue[] = [];

  for (const plugin of plugins) {
    for (const file of plugin.files) {
      if (file.name.toLowerCase().endsWith('.php')) {
        const syntaxErrors = checkSyntax(file.code, file.name, plugin.name);
        if (syntaxErrors.length > 0) {
          allIssues = [...allIssues, ...syntaxErrors];
          continue; 
        }

        allIssues.push(...checkUnescapedOutput(file.code, file.name, plugin.name));

        try {
            const ast = parser.parseCode(file.code, file.name) as Node;
            allIssues.push(...checkDeprecatedFunctions(ast, file.name, plugin.name));
        } catch(e) {
            console.error(`Parser failed unexpectedly on ${file.name} after syntax check passed.`, e);
        }
      }
    }
  }

  return allIssues;
};
