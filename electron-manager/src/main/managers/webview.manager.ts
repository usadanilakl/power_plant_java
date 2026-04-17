/**
 * WebViewManager - Opens and controls BrowserWindow instances for automation.
 * Replaces the JavaFX WebViewApp for FM Global form filling and other WebView targets.
 */

import { BrowserWindow, session } from 'electron';
import type { WebViewTarget } from '../../shared/types';
import { getWorkingDir } from '../paths';

interface WebViewInstance {
  target: WebViewTarget;
  window: BrowserWindow;
}

export class WebViewManager {
  private windows: Map<string, WebViewInstance> = new Map();
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Open a WebView window to a target URL.
   * For FM Global, this opens https://redetag.fmglobal.com for form filling.
   */
  public async open(target: WebViewTarget, url: string): Promise<void> {
    // Close existing window for this target if any
    if (this.windows.has(target)) {
      this.close(target);
    }

    const win = new BrowserWindow({
      width: 1100,
      height: 800,
      parent: this.mainWindow,
      title: this.getTitle(target),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        // Separate session partition per target to avoid cookie conflicts
        partition: `persist:${target}`
      }
    });

    // Accept self-signed certs for gate website
    if (target === 'gate-website') {
      win.webContents.session.setCertificateVerifyProc((_request, callback) => {
        callback(0);
      });
    }

    win.on('closed', () => {
      this.windows.delete(target);
    });

    this.windows.set(target, { target, window: win });

    // Register auto-login listener BEFORE loadURL (loadURL resolves on did-finish-load,
    // so attaching the listener after await would miss the event — race condition)
    if (target === 'gate-website' || target === 'onlocation' || target === 'perry-weather') {
      win.webContents.once('did-finish-load', () => {
        console.log(`[WebView] ${target} page loaded, attempting auto-login...`);
        this.autoLogin(target).catch((err) => {
          console.warn(`[WebView] Auto-login failed for ${target}:`, err.message);
        });
      });
    }

    await win.loadURL(url);
    console.log(`[WebView] ${target} loadURL completed: ${url}`);
  }

  /**
   * Auto-login for gate-website and onlocation WebView windows.
   * Credentials are read from the GateLogManager config via the config file.
   */
  private async autoLogin(target: WebViewTarget): Promise<void> {
    const instance = this.windows.get(target);
    if (!instance || instance.window.isDestroyed()) return;

    // Read gate-log config for credentials
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(getWorkingDir(), 'gate-log-config.json');

    let config: any = {};
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch { /* use empty config */ }

    if (target === 'gate-website') {
      const username = config.gateUsername || '';
      const password = config.gatePassword || '';
      const wc = instance.window.webContents;

      // Gate form requires Chromium-level input (insertText). JS keyboard events
      // and .value= don't trigger the form's validation.
      const fieldsExist = await wc.executeJavaScript(`
        (function() {
          return {
            login: !!document.getElementById('login'),
            password: !!document.getElementById('password'),
            loginBtn: !!document.getElementById('login-button')
          };
        })();
      `);
      console.log(`[WebView] Gate fields check: ${JSON.stringify(fieldsExist)}`);

      if (!fieldsExist.login || !fieldsExist.password || !fieldsExist.loginBtn) {
        console.warn('[WebView] Gate login fields not found, skipping auto-login');
        return;
      }

      // Focus username field and type via insertText (Chromium input pipeline)
      await wc.executeJavaScript(`
        var el = document.getElementById('login');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 500));
      await wc.insertText(username);

      // Focus password field and type
      await wc.executeJavaScript(`
        var el = document.getElementById('password');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 200));
      await wc.insertText(password);

      // Click login button
      await wc.executeJavaScript(`document.getElementById('login-button').click()`);
      console.log(`[WebView] Gate website auto-login: submitted via insertText`);

      // Wait for post-login page, then navigate to report
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (instance.window.isDestroyed()) return;

      await wc.executeJavaScript(`
        var el = document.getElementById('main_reports_link');
        if (el) el.click();
      `);
      console.log('[WebView] Gate website: clicked Reports link');
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (instance.window.isDestroyed()) return;

      await wc.executeJavaScript(`
        var el = document.getElementById('sub_custom_report_reports_link');
        if (el) el.click();
      `);
      console.log('[WebView] Gate website: clicked Custom Reports link');
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (instance.window.isDestroyed()) return;

      await wc.executeJavaScript(`
        var link = document.querySelector("a[href*='/reports/5962a30f47b74045/grid']");
        if (link) link.click();
      `);
      console.log('[WebView] Gate website: clicked specific report link');

    } else if (target === 'onlocation') {
      const email = config.onLocationEmail || '';
      const password = config.onLocationPassword || '';

      // OnLocation login is a two-step process: email first, then password
      const emailScript = `
        (function() {
          var emailInput = document.getElementById('email_input');
          var nextBtn = document.getElementById('nextBtn');
          if (emailInput && nextBtn) {
            emailInput.value = ${JSON.stringify(email)};
            emailInput.dispatchEvent(new Event('input'));
            nextBtn.click();
            return 'email-submitted';
          }
          return 'email-fields-not-found';
        })();
      `;

      const emailResult = await instance.window.webContents.executeJavaScript(emailScript);
      console.log(`[WebView] OnLocation email step: ${emailResult}`);

      // Wait for password page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (instance.window.isDestroyed()) return;

      const passwordScript = `
        (function() {
          var passInput = document.getElementById('password_input');
          var signInBtn = document.getElementById('signInBtn');
          if (passInput && signInBtn) {
            passInput.value = ${JSON.stringify(password)};
            passInput.dispatchEvent(new Event('input'));
            signInBtn.click();
            return 'password-submitted';
          }
          return 'password-fields-not-found';
        })();
      `;

      const passResult = await instance.window.webContents.executeJavaScript(passwordScript);
      console.log(`[WebView] OnLocation password step: ${passResult}`);

      // Wait for login to complete, then navigate to visitors report
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (instance.window.isDestroyed()) return;

      const visitorsReportUrl = 'https://us3.whosonlocation.com/reports/show?report_source=visitors&report_period=onsite';
      const navScript = `
        (function() {
          if (!document.URL.includes('/reports/show?report_source=visitors')) {
            window.location.href = ${JSON.stringify(visitorsReportUrl)};
            return 'navigating-to-visitors-report';
          }
          return 'already-on-visitors-report';
        })();
      `;

      const navResult = await instance.window.webContents.executeJavaScript(navScript);
      console.log(`[WebView] OnLocation post-login navigation: ${navResult}`);

    } else if (target === 'perry-weather') {
      const perryPath = require('path');
      const perryFs = require('fs');
      const perryConfigPath = perryPath.join(getWorkingDir(), 'perry-config.json');
      let perryConfig: any = {};
      try {
        if (perryFs.existsSync(perryConfigPath)) {
          perryConfig = JSON.parse(perryFs.readFileSync(perryConfigPath, 'utf-8'));
        }
      } catch { /* use empty config */ }

      const perryUsername = perryConfig.perryUsername || '';
      const perryPassword = perryConfig.perryPassword || '';
      const wc = instance.window.webContents;

      const hasForm = await wc.executeJavaScript(`!!document.getElementById('usernameInput')`);
      if (!hasForm) {
        console.log('[WebView] Perry login form not found, may already be logged in');
        return;
      }

      // Fill username via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('usernameInput');
        if (el) { el.focus(); el.click(); el.value = ''; }
      `);
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.insertText(perryUsername);

      // Fill password via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('passwordInput');
        if (el) { el.focus(); el.click(); el.value = ''; }
      `);
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.insertText(perryPassword);

      // Click login button
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.executeJavaScript(`
        var btn = document.getElementById('loginButton');
        if (btn) btn.click();
      `);
      console.log('[WebView] Perry Weather auto-login: submitted');
    }
  }

  /**
   * Inject JavaScript into a WebView window.
   * Used for form filling automation (FM Global) and data scraping.
   */
  public async inject(target: WebViewTarget, script: string): Promise<any> {
    const instance = this.windows.get(target);
    if (!instance || instance.window.isDestroyed()) {
      throw new Error(`No WebView window open for target: ${target}`);
    }

    return instance.window.webContents.executeJavaScript(script);
  }

  /**
   * Click the "Create New Impairment" button on the FM Global landing page.
   * Returns a promise that resolves when the form page finishes loading.
   */
  public async clickFmGlobalCreateButton(): Promise<void> {
    const instance = this.windows.get('fm-global');
    if (!instance || instance.window.isDestroyed()) {
      throw new Error('FM Global WebView is not open');
    }

    const webContents = instance.window.webContents;

    // Check if the Create button exists on the current page
    const hasButton = await webContents.executeJavaScript(`
      !!document.getElementById('MainContent_btnCreate')
    `);

    if (!hasButton) {
      console.log('[WebView] MainContent_btnCreate not found — may already be on form page');
      return;
    }

    // Set up a promise that resolves when the next page finishes loading
    const pageLoaded = new Promise<void>((resolve) => {
      webContents.once('did-finish-load', () => {
        resolve();
      });
    });

    // Click the Create button
    await webContents.executeJavaScript(`
      document.getElementById('MainContent_btnCreate').click();
    `);
    console.log('[WebView] Clicked MainContent_btnCreate');

    // Wait for the form page to load
    await pageLoaded;
    console.log('[WebView] FM Global form page loaded');
  }

  /**
   * Fill FM Global impairment form with provided data.
   * Mirrors the fillImparementDetails() from the JavaFX WebViewApp.
   */
  public async fillFmGlobalForm(data: Record<string, string>): Promise<number> {
    const instance = this.windows.get('fm-global');
    if (!instance || instance.window.isDestroyed()) {
      throw new Error('FM Global WebView is not open');
    }

    // JavaScript that fills the form fields, matching the FM Global form field IDs
    const script = `
      (function() {
        var fieldsSet = 0;
        var fieldMap = ${JSON.stringify(data)};

        function setField(id, value) {
          if (!value) return false;
          var el = document.getElementById(id);
          if (el) {
            if (el.tagName === 'SELECT') {
              for (var i = 0; i < el.options.length; i++) {
                if (el.options[i].text.includes(value) || el.options[i].value.includes(value)) {
                  el.selectedIndex = i;
                  el.dispatchEvent(new Event('change'));
                  return true;
                }
              }
            } else {
              el.value = value;
              el.dispatchEvent(new Event('input'));
              el.dispatchEvent(new Event('change'));
              return true;
            }
          }
          return false;
        }

        // Map of DTO field names to FM Global form element IDs
        var mapping = {
          'name': 'txtName',
          'email': 'txtEmail',
          'emailCc': 'txtEmailCc',
          'clientName': 'txtClientName',
          'indexNumber': 'txtIndexNumber',
          'streetAddress': 'txtStreetAddress',
          'state': 'txtState',
          'city': 'txtCity',
          'country': 'ddlCountry',
          'phone': 'txtPhone',
          'valveNumber': 'txtValveNumber',
          'areaProtected': 'txtAreaProtected',
          'reason': 'txtReason',
          'office': 'ddlOffice',
          'protectionType': 'ddlProtectionType'
        };

        for (var key in mapping) {
          if (fieldMap[key] && setField(mapping[key], fieldMap[key])) {
            fieldsSet++;
          }
        }

        // Also set valveNumber from protectionType if not already set
        if (!fieldMap['valveNumber'] && fieldMap['protectionType']) {
          if (setField('txtValveNumber', fieldMap['protectionType'])) {
            fieldsSet++;
          }
        }

        return fieldsSet;
      })();
    `;

    return instance.window.webContents.executeJavaScript(script);
  }

  /**
   * Gather form data from the FM Global form after user modifications.
   */
  public async gatherFmGlobalData(): Promise<Record<string, string>> {
    const instance = this.windows.get('fm-global');
    if (!instance || instance.window.isDestroyed()) {
      throw new Error('FM Global WebView is not open');
    }

    const script = `
      (function() {
        var result = {};

        // Known field mappings (FM Global form ID -> DTO key)
        var knownFields = {
          'txtName': 'name',
          'txtEmail': 'email',
          'txtEmailCc': 'emailCc',
          'txtClientName': 'clientName',
          'txtIndexNumber': 'indexNumber',
          'txtStreetAddress': 'streetAddress',
          'txtState': 'state',
          'txtCity': 'city',
          'txtCountry': 'country',
          'txtPhone': 'phone',
          'txtValveNumber': 'valveNumber',
          'txtAreaProtected': 'areaProtected',
          'txtReason': 'reason',
          'ddlOffice': 'office',
          'ddlProtectionType': 'protectionType'
        };

        // Gather known fields
        for (var formId in knownFields) {
          var el = document.getElementById(formId);
          if (!el) continue;
          if (el.tagName === 'SELECT') {
            result[knownFields[formId]] = el.options[el.selectedIndex]?.text || '';
          } else {
            result[knownFields[formId]] = el.value || '';
          }
        }

        // Dynamically gather ALL remaining inputs, selects, textareas
        var knownIds = new Set(Object.keys(knownFields));
        knownIds.add('txtOther'); // handled separately in precautions
        var allFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="hidden"], select, textarea');
        allFields.forEach(function(el) {
          if (!el.id || knownIds.has(el.id)) return;
          if (el.type === 'checkbox' || el.type === 'radio') return;
          var key = el.id;
          if (el.tagName === 'SELECT') {
            result[key] = el.options[el.selectedIndex]?.text || '';
          } else {
            result[key] = el.value || '';
          }
        });

        // Gather precautions checkboxes
        var checkboxes = document.querySelectorAll('#MainContent_pnlPrecautions input[type="checkbox"]');
        var precautions = [];
        checkboxes.forEach(function(cb) {
          if (cb.checked) {
            var label = cb.parentElement?.textContent?.trim() || cb.value;
            precautions.push(label);
          }
        });

        var otherField = document.getElementById('txtOther');
        if (otherField && otherField.value) {
          precautions.push('Other: ' + otherField.value);
        }

        result.precautions = precautions.join('; ');

        return JSON.stringify(result);
      })();
    `;

    const jsonStr = await instance.window.webContents.executeJavaScript(script);
    return JSON.parse(jsonStr);
  }

  /**
   * Intercept Back and Submit buttons on FM Global form.
   * When clicked, gathers form data and calls the provided callback before the original action.
   * Uses console-message bridge since the WebView has contextIsolation=true.
   * Mirrors the JavaFX WebViewApp button interception.
   */
  public async interceptFmGlobalButtons(
    onFormData: (data: Record<string, string>) => void
  ): Promise<void> {
    const instance = this.windows.get('fm-global');
    if (!instance || instance.window.isDestroyed()) {
      throw new Error('FM Global WebView is not open');
    }

    const webContents = instance.window.webContents;

    // Listen for button click signals from injected script
    webContents.on('console-message', async (_event, _level, message) => {
      if (message !== '__FM_GLOBAL_BTN_CLICKED__') return;

      console.log('[WebView] FM Global button clicked, gathering form data...');
      try {
        // Page is frozen (PostBack blocked) — gather data from main process
        const data = await this.gatherFmGlobalData();
        console.log('[WebView] FM Global form data captured:', Object.keys(data).length, 'fields');
        onFormData(data);
      } catch (err: any) {
        console.error('[WebView] Failed to gather FM Global data:', err.message);
      }

      // Now release the PostBack
      try {
        if (!instance.window.isDestroyed()) {
          await webContents.executeJavaScript('window.__fmGlobalProceed && window.__fmGlobalProceed()');
        }
      } catch (err: any) {
        console.error('[WebView] Failed to release PostBack:', err.message);
      }
    });

    // Inject button interceptors that BLOCK PostBack until main process gathers data
    const script = `
      (function() {
        function interceptButton(btnId) {
          var btn = document.getElementById(btnId);
          if (!btn) return false;

          var originalOnClick = btn.onclick;
          btn.onclick = function(e) {
            e.preventDefault();
            // Signal main process to gather data
            console.log('__FM_GLOBAL_BTN_CLICKED__');
            // Main process will call window.__fmGlobalProceed() after gathering
            window.__fmGlobalProceed = function() {
              if (originalOnClick) {
                originalOnClick.call(btn, e);
              }
            };
            return false;
          };
          return true;
        }

        var backOk = interceptButton('btnBack');
        var submitOk = interceptButton('btnSubmit');
        return 'Intercepted: back=' + backOk + ', submit=' + submitOk;
      })();
    `;

    const result = await webContents.executeJavaScript(script);
    console.log(`[WebView] FM Global button interception: ${result}`);
  }

  public close(target: WebViewTarget): void {
    const instance = this.windows.get(target);
    if (instance && !instance.window.isDestroyed()) {
      instance.window.close();
    }
    this.windows.delete(target);
  }

  public closeAll(): void {
    for (const [target] of this.windows) {
      this.close(target as WebViewTarget);
    }
  }

  public isOpen(target: WebViewTarget): boolean {
    const instance = this.windows.get(target);
    return !!instance && !instance.window.isDestroyed();
  }

  private getTitle(target: WebViewTarget): string {
    const titles: Record<WebViewTarget, string> = {
      'fm-global': 'FM Global - Fire Impairment',
      'gate-website': 'Gate Access System',
      'onlocation': 'WhosOnLocation',
      'weather': 'Weather',
      'pjm': 'PJM',
      'perry-weather': 'Perry Weather'
    };
    return titles[target] || target;
  }
}
