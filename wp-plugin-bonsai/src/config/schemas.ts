// START ./wp-plugin-bonsai/src/config/schemas.ts
export const reviewSchema = {
  type: 'object',
  properties: {
    review: {
      type: 'array',
      description: "A list of issues found.",
      items: {
        type: 'object',
        properties: {
          pluginName: { type: 'string' },
          fileName: { type: 'string' },
          category: { type: 'string' },
          severity: { type: 'string' },
          description: { type: 'string' },
          impact: { type: 'string', description: "A simple, one-sentence explanation of the real-world impact for a non-technical user." },
          suggestion: { type: 'string' },
        },
        required: ["pluginName", "fileName", "category", "severity", "description", "impact", "suggestion"],
      },
    },
  },
  required: ["review"],
};

export const fixSchema = {
    type: 'object',
    properties: {
        pluginName: { type: 'string' },
        fileName: { type: 'string' },
        changes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: "Type: 'REPLACE_BLOCK', 'INSERT_BEFORE', 'INSERT_AFTER', 'DELETE_BLOCK'." },
                    startLine: { type: 'number' },
                    endLine: { type: 'number' },
                    content: { type: 'string' },
                },
                required: ['type', 'startLine'],
            },
        },
    },
    required: ['pluginName', 'fileName', 'changes'],
};

export const generateFileSchema = {
    type: 'object',
    properties: {
        fileName: { type: 'string' },
        code: { type: 'string' },
    },
    required: ['fileName', 'code'],
};

export const blueprintSchema = {
    type: 'object',
    properties: {
        fileStructure: { type: 'string', description: "A text-based schematic of the proposed file and directory structure." },
        plan: { type: 'string', description: "A detailed description of the plugin's architecture and key functions." },
    },
    required: ['fileStructure', 'plan'],
};

export const integrationAppSchema = {
    type: 'object',
    properties: {
        workspaceScript: { type: 'object', properties: { fileName: { type: 'string' }, code: { type: 'string' }}},
        manifestFile: { type: 'object', properties: { fileName: { type: 'string' }, code: { type: 'string' }}},
        wordpressCode: { type: 'array', items: { type: 'object', properties: { fileName: { type: 'string' }, code: { type: 'string' }, language: { type: 'string' } }, required: ["fileName", "code", "language"]}},
        instructions: { type: 'string', description: "Unified, step-by-step instructions for a total novice on how to set up BOTH platforms. Use markdown." }
    },
    required: ["instructions"],
};

export const pluginBuildSchema = {
  type: 'object',
  properties: {
    pluginName: { type: 'string', description: 'The main slug-like name for the plugin, e.g., "quote-of-the-day".' },
    files: {
      type: 'array',
      items: { type: 'object', properties: { fileName: { type: 'string' }, code: { type: 'string' } }, required: ['fileName', 'code'] },
    },
  },
  required: ['pluginName', 'files'],
};
// END ./wp-plugin-bonsai/src/config/schemas.ts
