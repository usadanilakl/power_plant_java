/**
 * Main entry point for the Electron application.
 */

import { app, BrowserWindow } from 'electron';
import App from './app';
import { logFatal } from './fatal-log';

// Installed BEFORE App.main so nothing can throw ahead of them.
//
// Without these, Electron's default uncaught-exception reporter shows a modal
// "A JavaScript error occurred in the main process" dialog and calls console.error to print the
// error. Because IpcHandlers.interceptConsole() replaces console.error, a throw originating inside
// that interceptor was reported through the interceptor — recursing until the stack blew. The
// interceptor now has its own re-entrancy guard; this is the second line of defence, and it also
// stops any *other* main-process throw from putting a blocking dialog in front of an operator.
//
// Deliberately does NOT exit: a modal dialog on an unattended cork-board kiosk is worse than a
// degraded-but-running app. The tradeoff is that genuine faults now surface only in the log.
// logFatal writes to disk, not just stderr: stderr is a discard handle in a packaged Windows GUI
// app, so a stderr-only reporter would silently swallow the very failures these handlers exist to
// surface. See App.onReady's own .catch() in app.ts — swallowing an unhandled rejection there would
// otherwise leave the window up with no backend and no trace.
process.on('uncaughtException', (err) => logFatal('uncaughtException', err));
process.on('unhandledRejection', (reason) => logFatal('unhandledRejection', reason));

App.main(app, BrowserWindow);
