/**
 * WebViewManager - Opens and controls BrowserWindow instances for automation.
 * Replaces the JavaFX WebViewApp for FM Global form filling and other WebView targets.
 */

import { BrowserWindow, session } from 'electron';
import type { WebViewTarget } from '../../shared/types';

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
    if (target === 'gate-website' || target === 'onlocation') {
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
    const configPath = path.join(
      process.cwd(),
      'managed_apps/pid',
      'gate-log-config.json'
    );

    let config: any = {};
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch { /* use empty config */ }

    if (target === 'gate-website') {
      const username = config.gateUsername || 'dklokov';
      const password = config.gatePassword || 'Jackson1';
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

    } else if (target === 'onlocation') {
      const email = config.onLocationEmail || 'jacksonap@jpowerusa.com';
      const password = config.onLocationPassword || 'Jackson1';

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
          'country': 'txtCountry',
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

        function getField(id) {
          var el = document.getElementById(id);
          if (!el) return '';
          if (el.tagName === 'SELECT') {
            return el.options[el.selectedIndex]?.text || '';
          }
          return el.value || '';
        }

        result.name = getField('txtName');
        result.email = getField('txtEmail');
        result.emailCc = getField('txtEmailCc');
        result.clientName = getField('txtClientName');
        result.indexNumber = getField('txtIndexNumber');
        result.streetAddress = getField('txtStreetAddress');
        result.state = getField('txtState');
        result.city = getField('txtCity');
        result.country = getField('txtCountry');
        result.phone = getField('txtPhone');
        result.valveNumber = getField('txtValveNumber');
        result.areaProtected = getField('txtAreaProtected');
        result.reason = getField('txtReason');
        result.office = getField('ddlOffice');
        result.protectionType = getField('ddlProtectionType');

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

    // Listen for console messages from the injected script as communication bridge
    webContents.on('console-message', async (_event, _level, message) => {
      if (message === '__FM_GLOBAL_BTN_BACK__' || message === '__FM_GLOBAL_BTN_SUBMIT__') {
        console.log(`[WebView] FM Global button intercepted: ${message}`);
        try {
          const data = await this.gatherFmGlobalData();
          onFormData(data);
        } catch (err: any) {
          console.error('[WebView] Failed to gather FM Global data:', err.message);
        }
      }
    });

    // Inject the button interceptors
    const script = `
      (function() {
        function interceptButton(btnId, marker) {
          var btn = document.getElementById(btnId);
          if (!btn) return false;

          var originalOnClick = btn.onclick;
          btn.onclick = function(e) {
            console.log(marker);
            if (originalOnClick) {
              setTimeout(function() { originalOnClick.call(btn, e); }, 200);
            }
          };
          return true;
        }

        var backOk = interceptButton('btnBack', '__FM_GLOBAL_BTN_BACK__');
        var submitOk = interceptButton('btnSubmit', '__FM_GLOBAL_BTN_SUBMIT__');
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
      'pjm': 'PJM'
    };
    return titles[target] || target;
  }
}
