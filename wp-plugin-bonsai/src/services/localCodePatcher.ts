import type { CodeChangeInstruction } from '@/types';

class LocalCodePatcher {
    public applyPatch(originalCode: string, changes: CodeChangeInstruction[]): string {
        if (!changes || changes.length === 0) return originalCode;
        const lines = originalCode.split('\n');
        const sortedChanges = [...changes].sort((a, b) => b.startLine - a.startLine);

        for (const change of sortedChanges) {
            const startIndex = change.startLine - 1;
            switch (change.type) {
                case 'REPLACE_BLOCK': {
                    const endIndex = change.endLine - 1;
                    if (startIndex < 0 || endIndex >= lines.length || startIndex > endIndex) continue;
                    lines.splice(startIndex, endIndex - startIndex + 1, change.content);
                    break;
                }
                case 'INSERT_BEFORE': {
                    if (startIndex < 0 || startIndex > lines.length) continue;
                    lines.splice(startIndex, 0, change.content);
                    break;
                }
                case 'INSERT_AFTER': {
                    if (startIndex < 0 || startIndex >= lines.length) continue;
                    lines.splice(startIndex + 1, 0, change.content);
                    break;
                }
                case 'DELETE_BLOCK': {
                    const endIndex = change.endLine - 1;
                    if (startIndex < 0 || endIndex >= lines.length || startIndex > endIndex) continue;
                    lines.splice(startIndex, endIndex - startIndex + 1);
                    break;
                }
            }
        }
        return lines.join('\n');
    }
}

export const localCodePatcher = new LocalCodePatcher();
