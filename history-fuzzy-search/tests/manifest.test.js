import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Safari Web Extension Manifest', () => {
  let manifest;
  const manifestPath = path.join(__dirname, '..', 'manifest.json');

  beforeAll(() => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  describe('Basic Structure', () => {
    it('should have a valid manifest version', () => {
      expect(manifest.manifest_version).toBe(3);
    });

    it('should have extension name', () => {
      expect(manifest.name).toBe('History Fuzzy Search');
    });

    it('should have extension version', () => {
      expect(manifest.version).toBeDefined();
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have extension description', () => {
      expect(manifest.description).toBeDefined();
      expect(manifest.description).toContain('fuzzy search');
    });
  });

  describe('Required Permissions', () => {
    it('should have history permission for accessing browser history', () => {
      expect(manifest.permissions).toContain('history');
    });

    it('should have tabs permission for creating new tabs', () => {
      expect(manifest.permissions).toContain('tabs');
    });

    it('should have storage permission for caching', () => {
      expect(manifest.permissions).toContain('storage');
    });

    it('should have activeTab permission for content script injection', () => {
      expect(manifest.permissions).toContain('activeTab');
    });
  });

  describe('Background Script', () => {
    it('should have a background service worker', () => {
      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBe('background/background.js');
      expect(manifest.background.persistent).toBe(false);
    });
  });

  describe('Content Scripts', () => {
    it('should have content script configuration', () => {
      expect(manifest.content_scripts).toBeDefined();
      expect(manifest.content_scripts).toBeInstanceOf(Array);
      expect(manifest.content_scripts.length).toBeGreaterThan(0);
    });

    it('should inject content script on all URLs', () => {
      const contentScript = manifest.content_scripts[0];
      expect(contentScript.matches).toContain('<all_urls>');
      expect(contentScript.js).toContain('content/content.js');
    });
  });

  describe('Keyboard Commands', () => {
    it('should register cmd+/ keyboard shortcut', () => {
      expect(manifest.commands).toBeDefined();
      expect(manifest.commands._execute_action).toBeDefined();
      expect(manifest.commands._execute_action.suggested_key).toBeDefined();
      expect(manifest.commands._execute_action.suggested_key.default).toBe('Cmd+Slash');
      expect(manifest.commands._execute_action.description).toContain('search');
    });
  });

  describe('Icons', () => {
    it('should have icon definitions for different sizes', () => {
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons['16']).toBe('icons/icon-16.png');
      expect(manifest.icons['32']).toBe('icons/icon-32.png');
      expect(manifest.icons['48']).toBe('icons/icon-48.png');
      expect(manifest.icons['128']).toBe('icons/icon-128.png');
    });
  });

  describe('Action (Toolbar Icon)', () => {
    it('should have action configuration', () => {
      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_title).toBe('History Fuzzy Search');
      expect(manifest.action.default_icon).toBeDefined();
    });
  });
});