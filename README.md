<!-- START README.md -->
# File Structure

```
.
├── .gitignore
├── AGENT.md
├── README.md
└── wp-plugin-bonsai
    ├── .eslintrc.json
    ├── README.md
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── public
    │   └── metadata.json
    ├── src
    │   ├── App.tsx
    │   ├── components
    │   │   ├── ApiKeyManager.tsx
    │   │   ├── CodeResultViewer.tsx
    │   │   ├── ConfirmationModal.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── FileEditor.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Header.tsx
    │   │   ├── HistoryControls.tsx
    │   │   ├── IntegrationBuilder.tsx
    │   │   ├── Loader.tsx
    │   │   ├── ModeSwitcher.tsx
    │   │   ├── ModelSelector.tsx
    │   │   ├── MultiPluginUploader.tsx
    │   │   ├── PluginBuilder.tsx
    │   │   ├── PluginPackager.tsx
    │   │   ├── ReviewResults.tsx
    │   │   ├── WorkspaceManager.tsx
    │   │   └── icons
    │   │       ├── CategoryIcons.tsx
    │   │       ├── FileIcons.tsx
    │   │       └── SeverityIcons.tsx
    │   ├── config
    │   │   ├── models.ts
    │   │   └── schemas.ts
    │   ├── data
    │   │   └── wordpress.ts
    │   ├── hooks
    │   │   └── useOnlineStatus.ts
    │   ├── index.css
    │   ├── index.tsx
    │   ├── services
    │   │   ├── aiService.ts
    │   │   ├── anthropicService.ts
    │   │   ├── geminiService.ts
    │   │   ├── localAnalysisService.ts
    │   │   ├── localCodePatcher.ts
    │   │   ├── localPluginPackager.ts
    │   │   ├── openaiService.ts
    │   │   ├── prompts.ts
    │   │   └── storageService.ts
    │   └── types.ts
    ├── test
    │   ├── localAnalysisService.test.ts
    │   └── localCodePatcher.test.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts

11 directories, 51 files
```
<!-- END README.md -->
