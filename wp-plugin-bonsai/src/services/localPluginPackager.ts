import { UploadedFile } from '@/types';

export interface PluginHeaderData {
    pluginName?: string;
    version?: string;
    author?: string;
}

export interface LocalPackageAnalysis {
    hasMainFile: boolean;
    mainFileName: string | null;
    hasReadme: boolean;
    hasUninstall: boolean;
    headerData: PluginHeaderData;
    fileTypes: {
        php: number;
        js: number;
        css: number;
        pot: number;
        other: number;
    };
}

const parsePluginHeader = (fileContent: string): PluginHeaderData => {
    const header: PluginHeaderData = {};
    const lines = fileContent.substring(0, 2000).split('\n'); // Only check the top of the file
    
    const headerFields: { key: keyof PluginHeaderData, regex: RegExp }[] = [
        { key: 'pluginName', regex: /^\s*\*\s*Plugin Name:\s*(.*)/i },
        { key: 'version', regex: /^\s*\*\s*Version:\s*(.*)/i },
        { key: 'author', regex: /^\s*\*\s*Author:\s*(.*)/i },
    ];

    for (const line of lines) {
        for (const field of headerFields) {
            const match = line.match(field.regex);
            if (match) {
                header[field.key] = match[1].trim();
            }
        }
    }
    return header;
};

export const analyzePackageContents = (files: UploadedFile[]): LocalPackageAnalysis => {
    const analysis: LocalPackageAnalysis = {
        hasMainFile: false,
        mainFileName: null,
        hasReadme: false,
        hasUninstall: false,
        headerData: {},
        fileTypes: { php: 0, js: 0, css: 0, pot: 0, other: 0 },
    };

    for (const file of files) {
        const lowerCaseName = file.name.toLowerCase();
        
        if (lowerCaseName.endsWith('.php')) {
            analysis.fileTypes.php++;
            const headerData = parsePluginHeader(file.content);
            if (headerData.pluginName) {
                analysis.hasMainFile = true;
                analysis.mainFileName = file.name;
                analysis.headerData = headerData;
            }
        } else if (lowerCaseName.endsWith('.js')) {
            analysis.fileTypes.js++;
        } else if (lowerCaseName.endsWith('.css')) {
            analysis.fileTypes.css++;
        } else if (lowerCaseName.endsWith('.pot')) {
            analysis.fileTypes.pot++;
        } else {
            analysis.fileTypes.other++;
        }
        
        if (lowerCaseName === 'readme.txt') {
            analysis.hasReadme = true;
        }

        if (lowerCaseName === 'uninstall.php') {
            analysis.hasUninstall = true;
        }
    }
    
    return analysis;
};


export const getBoilerplateUninstall = (): { fileName: string; code: string } => {
    const fileName = 'uninstall.php';
    const code = `<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package   My_Custom_Plugin
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// TODO: Add cleanup logic here, such as deleting options and custom tables.
// For example:
// delete_option( 'my_plugin_option_name' );
`;
    return { fileName, code };
};
