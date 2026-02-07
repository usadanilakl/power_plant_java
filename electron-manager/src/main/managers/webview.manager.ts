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

    win.on('closed', () => {
      this.windows.delete(target);
    });

    this.windows.set(target, { target, window: win });

    await win.loadURL(url);
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
      'gate-website': 'Gate Log',
      'weather': 'Weather',
      'pjm': 'PJM'
    };
    return titles[target] || target;
  }
}
