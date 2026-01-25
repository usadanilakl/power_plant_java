export default `<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <title>Frontend</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link rel="stylesheet" href="styles.css"><style ng-app-id="ng">

.guide-fab[_ngcontent-ng-c3298958394] {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
}
/*# sourceMappingURL=/app.component.css.map */</style><style ng-app-id="ng">

.overlay[_ngcontent-ng-c4038518790] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}
.overlay.transparent-overlay[_ngcontent-ng-c4038518790] {
  background-color: transparent;
  pointer-events: none;
}
.overlay.transparent-overlay[_ngcontent-ng-c4038518790]   .message-box[_ngcontent-ng-c4038518790] {
  pointer-events: auto;
}
.message-box[_ngcontent-ng-c4038518790] {
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 1.1rem;
  max-width: 80%;
  text-align: center;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.message-box.informational[_ngcontent-ng-c4038518790] {
  animation: _ngcontent-ng-c4038518790_pulse-in 0.3s ease-out;
}
.minimized-message[_ngcontent-ng-c4038518790] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 18px;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  font-size: 0.95rem;
  max-width: 300px;
  text-align: center;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  z-index: 9999;
  animation: _ngcontent-ng-c4038518790_slide-to-corner 0.4s ease-out;
  opacity: 0.95;
}
.minimized-message[_ngcontent-ng-c4038518790]:hover {
  opacity: 1;
  transform: scale(1.02);
}
@keyframes _ngcontent-ng-c4038518790_slide-to-corner {
  0% {
    opacity: 0;
    transform: translateX(100px) translateY(100px);
  }
  100% {
    opacity: 0.95;
    transform: translateX(0) translateY(0);
  }
}
@keyframes _ngcontent-ng-c4038518790_pulse-in {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.message-box.red[_ngcontent-ng-c4038518790], 
.minimized-message.red[_ngcontent-ng-c4038518790] {
  background-color: #c75c5c;
  color: #fff5f5;
}
.message-box.green[_ngcontent-ng-c4038518790], 
.minimized-message.green[_ngcontent-ng-c4038518790] {
  background-color: #5c9575;
  color: #f1fbf7;
}
.message-box.white[_ngcontent-ng-c4038518790], 
.minimized-message.white[_ngcontent-ng-c4038518790] {
  background-color: #f5f5f5;
  color: #333;
}
.message-box.yellow[_ngcontent-ng-c4038518790], 
.minimized-message.yellow[_ngcontent-ng-c4038518790] {
  background-color: #d4c66d;
  color: #2f2e18;
}
/*# sourceMappingURL=/global-message.component.css.map */</style><style ng-app-id="ng">

.scanner-overlay[_ngcontent-ng-c3289982237] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.scanner-container[_ngcontent-ng-c3289982237] {
  position: relative;
  background: var(--background-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
}
.close-btn[_ngcontent-ng-c3289982237] {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-color);
  cursor: pointer;
}
.permission-denied[_ngcontent-ng-c3289982237] {
  color: #ff4d4d;
  margin-top: 10px;
  text-align: center;
}
h2[_ngcontent-ng-c3289982237] {
  text-align: center;
  margin-bottom: 15px;
}
/*# sourceMappingURL=/qr-scanner.component.css.map */</style><style ng-app-id="ng">

.printer-manager-container[_ngcontent-ng-c3185598614] {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background-color: var(--card-background);
  color: var(--primary-text);
}
.printer-manager-container.queue-mode[_ngcontent-ng-c3185598614] {
  flex-direction: row;
  gap: 1.5rem;
}
.queue-sidebar[_ngcontent-ng-c3185598614] {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}
.queue-header[_ngcontent-ng-c3185598614] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.queue-header[_ngcontent-ng-c3185598614]   h4[_ngcontent-ng-c3185598614] {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text);
}
.queue-count[_ngcontent-ng-c3185598614] {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
  background: var(--primary-background);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}
.queue-list[_ngcontent-ng-c3185598614] {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}
.queue-list[_ngcontent-ng-c3185598614]::-webkit-scrollbar {
  width: 6px;
}
.queue-list[_ngcontent-ng-c3185598614]::-webkit-scrollbar-track {
  background: transparent;
}
.queue-list[_ngcontent-ng-c3185598614]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color);
  border-radius: 3px;
  opacity: 0.5;
}
.queue-item[_ngcontent-ng-c3185598614] {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  background: var(--primary-background);
  border: 2px solid transparent;
  transition: all 0.2s ease;
}
.queue-item[_ngcontent-ng-c3185598614]:hover {
  transform: translateY(-1px);
  background: var(--hover-color);
}
.queue-item.active[_ngcontent-ng-c3185598614] {
  border-color: var(--accent-color);
  background: var(--menu-item-hover-bg-color);
}
.queue-item.completed[_ngcontent-ng-c3185598614] {
  opacity: 0.75;
  background: var(--success-background);
}
.queue-item.error[_ngcontent-ng-c3185598614] {
  background: var(--error-background);
}
.queue-item.printing[_ngcontent-ng-c3185598614] {
  background: var(--menu-item-hover-bg-color);
  border-color: var(--accent-color);
}
.queue-item-status[_ngcontent-ng-c3185598614] {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 0.9rem;
}
.status-icon[_ngcontent-ng-c3185598614] {
  display: inline-block;
}
.status-icon.pending[_ngcontent-ng-c3185598614] {
  color: var(--secondary-text);
}
.queue-item.completed[_ngcontent-ng-c3185598614]   .status-icon[_ngcontent-ng-c3185598614] {
  color: #27ae60;
}
.queue-item.error[_ngcontent-ng-c3185598614]   .status-icon[_ngcontent-ng-c3185598614] {
  color: #e74c3c;
}
.queue-item.printing[_ngcontent-ng-c3185598614]   .status-icon[_ngcontent-ng-c3185598614] {
  color: var(--accent-color);
  animation: _ngcontent-ng-c3185598614_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c3185598614_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.queue-item-content[_ngcontent-ng-c3185598614] {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.queue-item-line1[_ngcontent-ng-c3185598614] {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family:
    "Consolas",
    "Monaco",
    monospace;
}
.queue-item-line2[_ngcontent-ng-c3185598614] {
  font-size: 0.75rem;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.queue-actions[_ngcontent-ng-c3185598614] {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
.queue-actions[_ngcontent-ng-c3185598614]   .btn[_ngcontent-ng-c3185598614] {
  width: 100%;
}
.main-content[_ngcontent-ng-c3185598614] {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.status-section[_ngcontent-ng-c3185598614] {
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-color);
}
.status-section[_ngcontent-ng-c3185598614]   p[_ngcontent-ng-c3185598614] {
  margin: 0.35rem 0;
  font-size: 0.9rem;
  color: var(--primary-text);
}
.status-section[_ngcontent-ng-c3185598614]   .connected[_ngcontent-ng-c3185598614] {
  color: #27ae60;
  font-weight: 600;
  background: var(--success-background);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  display: inline-block;
}
.status-section[_ngcontent-ng-c3185598614]   .disconnected[_ngcontent-ng-c3185598614] {
  color: #e74c3c;
  font-weight: 600;
  background: var(--error-background);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  display: inline-block;
}
.error-message[_ngcontent-ng-c3185598614] {
  background: var(--error-background);
  border-left: 3px solid #e74c3c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-top: 0.75rem;
  color: var(--primary-text);
  font-size: 0.85rem;
}
.error-message[_ngcontent-ng-c3185598614]   p[_ngcontent-ng-c3185598614] {
  margin: 0;
}
.actions-section[_ngcontent-ng-c3185598614] {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.btn[_ngcontent-ng-c3185598614] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn[_ngcontent-ng-c3185598614]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--disabled-background) !important;
}
.btn.primary[_ngcontent-ng-c3185598614] {
  background: var(--accent-color);
  color: #ffffff;
  box-shadow: var(--accent-color-shadow) 0 2px 8px;
}
.btn.primary[_ngcontent-ng-c3185598614]:hover:not(:disabled) {
  background: var(--accent-color-hover);
  transform: translateY(-1px);
  box-shadow: var(--accent-color-shadow) 0 4px 12px;
}
.btn.secondary[_ngcontent-ng-c3185598614] {
  background: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
}
.btn.secondary[_ngcontent-ng-c3185598614]:hover:not(:disabled) {
  background: var(--hover-color);
  border-color: var(--accent-color);
}
.btn.danger[_ngcontent-ng-c3185598614] {
  background: #e74c3c;
  color: #ffffff;
  box-shadow: rgba(231, 76, 60, 0.3) 0 2px 8px;
}
.btn.danger[_ngcontent-ng-c3185598614]:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: rgba(231, 76, 60, 0.4) 0 4px 12px;
}
hr[_ngcontent-ng-c3185598614] {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 0.5rem 0;
}
h3[_ngcontent-ng-c3185598614] {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-text);
}
.preview-area[_ngcontent-ng-c3185598614] {
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  border: 1px solid var(--border-color);
}
.preview-area[_ngcontent-ng-c3185598614]   h4[_ngcontent-ng-c3185598614] {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--secondary-text);
}
.preview-container[_ngcontent-ng-c3185598614] {
  background: var(--primary-background);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-container[_ngcontent-ng-c3185598614]   canvas[_ngcontent-ng-c3185598614] {
  max-width: 100%;
  height: auto;
}
.form-group[_ngcontent-ng-c3185598614] {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group[_ngcontent-ng-c3185598614]   label[_ngcontent-ng-c3185598614] {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--secondary-text);
}
.form-group[_ngcontent-ng-c3185598614]   input[_ngcontent-ng-c3185598614] {
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--primary-background);
  color: var(--primary-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group[_ngcontent-ng-c3185598614]   input[_ngcontent-ng-c3185598614]::placeholder {
  color: var(--secondary-text);
  opacity: 0.7;
}
.form-group[_ngcontent-ng-c3185598614]   input[_ngcontent-ng-c3185598614]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-shadow);
}
.print-status[_ngcontent-ng-c3185598614] {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--menu-item-hover-bg-color);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--accent-color);
  text-align: center;
}
@media (max-width: 768px) {
  .printer-manager-container.queue-mode[_ngcontent-ng-c3185598614] {
    flex-direction: column;
  }
  .queue-sidebar[_ngcontent-ng-c3185598614] {
    width: 100%;
    min-width: 100%;
    max-height: 250px;
  }
  .queue-list[_ngcontent-ng-c3185598614] {
    max-height: 150px;
  }
}
/*# sourceMappingURL=/brady-printer-manager.component.css.map */</style><style ng-app-id="ng">

.engraver-container[_ngcontent-ng-c3529731854] {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  background-color: var(--card-background);
  color: var(--primary-text);
  min-height: 400px;
}
.batch-sidebar[_ngcontent-ng-c3529731854] {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}
.batch-header[_ngcontent-ng-c3529731854] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.batch-header[_ngcontent-ng-c3529731854]   h4[_ngcontent-ng-c3529731854] {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text);
}
.batch-count[_ngcontent-ng-c3529731854] {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
  background: var(--primary-background);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}
.progress-bar-container[_ngcontent-ng-c3529731854] {
  height: 6px;
  background: var(--primary-background);
  border-radius: 3px;
  margin-bottom: 1rem;
  overflow: hidden;
}
.progress-bar[_ngcontent-ng-c3529731854] {
  height: 100%;
  background: var(--accent-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.batch-list[_ngcontent-ng-c3529731854] {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}
.batch-list[_ngcontent-ng-c3529731854]::-webkit-scrollbar {
  width: 6px;
}
.batch-list[_ngcontent-ng-c3529731854]::-webkit-scrollbar-track {
  background: transparent;
}
.batch-list[_ngcontent-ng-c3529731854]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color);
  border-radius: 3px;
}
.batch-item[_ngcontent-ng-c3529731854] {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  background: var(--primary-background);
  border: 2px solid transparent;
  transition: all 0.2s ease;
}
.batch-item[_ngcontent-ng-c3529731854]:hover {
  transform: translateY(-1px);
  background: var(--hover-color);
}
.batch-item.active[_ngcontent-ng-c3529731854] {
  border-color: var(--accent-color);
  background: var(--menu-item-hover-bg-color);
}
.batch-item.completed[_ngcontent-ng-c3529731854] {
  opacity: 0.85;
  background: var(--success-background);
}
.batch-item.error[_ngcontent-ng-c3529731854] {
  background: var(--error-background);
}
.batch-item.processing[_ngcontent-ng-c3529731854] {
  background: var(--menu-item-hover-bg-color);
  border-color: var(--accent-color);
}
.batch-item-status[_ngcontent-ng-c3529731854] {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 0.9rem;
}
.status-icon[_ngcontent-ng-c3529731854] {
  display: inline-block;
  color: var(--secondary-text);
}
.status-icon.spinning[_ngcontent-ng-c3529731854] {
  animation: _ngcontent-ng-c3529731854_spin 1s linear infinite;
  color: var(--accent-color);
}
.batch-item.completed[_ngcontent-ng-c3529731854]   .status-icon[_ngcontent-ng-c3529731854] {
  color: #27ae60;
}
.batch-item.error[_ngcontent-ng-c3529731854]   .status-icon[_ngcontent-ng-c3529731854] {
  color: #e74c3c;
}
@keyframes _ngcontent-ng-c3529731854_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.batch-item-content[_ngcontent-ng-c3529731854] {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.batch-item-title[_ngcontent-ng-c3529731854] {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.batch-item-count[_ngcontent-ng-c3529731854] {
  font-size: 0.75rem;
  color: var(--secondary-text);
}
.batch-info[_ngcontent-ng-c3529731854] {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.85rem;
  color: var(--secondary-text);
}
.batch-info[_ngcontent-ng-c3529731854]   p[_ngcontent-ng-c3529731854] {
  margin: 0.25rem 0;
}
.main-content[_ngcontent-ng-c3529731854] {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.current-batch-header[_ngcontent-ng-c3529731854] {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.current-batch-header[_ngcontent-ng-c3529731854]   h3[_ngcontent-ng-c3529731854] {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-text);
}
.batch-status-badge[_ngcontent-ng-c3529731854] {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.batch-status-badge.pending[_ngcontent-ng-c3529731854] {
  background: var(--secondary-background);
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
}
.batch-status-badge.processing[_ngcontent-ng-c3529731854] {
  background: var(--menu-item-hover-bg-color);
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
}
.batch-status-badge.completed[_ngcontent-ng-c3529731854] {
  background: var(--success-background);
  color: #27ae60;
  border: 1px solid #27ae60;
}
.batch-status-badge.error[_ngcontent-ng-c3529731854] {
  background: var(--error-background);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}
.batch-items-table[_ngcontent-ng-c3529731854] {
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  overflow: hidden;
}
.batch-items-table[_ngcontent-ng-c3529731854]   table[_ngcontent-ng-c3529731854] {
  width: 100%;
  border-collapse: collapse;
}
.batch-items-table[_ngcontent-ng-c3529731854]   th[_ngcontent-ng-c3529731854], 
.batch-items-table[_ngcontent-ng-c3529731854]   td[_ngcontent-ng-c3529731854] {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}
.batch-items-table[_ngcontent-ng-c3529731854]   th[_ngcontent-ng-c3529731854] {
  background: var(--primary-background);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.batch-items-table[_ngcontent-ng-c3529731854]   tr[_ngcontent-ng-c3529731854]:last-child   td[_ngcontent-ng-c3529731854] {
  border-bottom: none;
}
.batch-items-table[_ngcontent-ng-c3529731854]   .row-number[_ngcontent-ng-c3529731854] {
  width: 40px;
  text-align: center;
  color: var(--secondary-text);
  font-weight: 500;
}
.batch-items-table[_ngcontent-ng-c3529731854]   .tag-number[_ngcontent-ng-c3529731854] {
  font-family:
    "Consolas",
    "Monaco",
    monospace;
  font-weight: 600;
  color: var(--accent-color);
  white-space: nowrap;
}
.batch-items-table[_ngcontent-ng-c3529731854]   .description[_ngcontent-ng-c3529731854] {
  color: var(--primary-text);
}
.batch-items-table[_ngcontent-ng-c3529731854]   .empty-row[_ngcontent-ng-c3529731854] {
  opacity: 0.5;
}
.batch-items-table[_ngcontent-ng-c3529731854]   .empty-cell[_ngcontent-ng-c3529731854] {
  text-align: center;
  font-style: italic;
  color: var(--secondary-text);
}
.actions-section[_ngcontent-ng-c3529731854] {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.navigation-section[_ngcontent-ng-c3529731854] {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.btn[_ngcontent-ng-c3529731854] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn[_ngcontent-ng-c3529731854]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--disabled-background) !important;
}
.btn.primary[_ngcontent-ng-c3529731854] {
  background: var(--accent-color);
  color: #ffffff;
  box-shadow: var(--accent-color-shadow) 0 2px 8px;
}
.btn.primary[_ngcontent-ng-c3529731854]:hover:not(:disabled) {
  background: var(--accent-color-hover);
  transform: translateY(-1px);
  box-shadow: var(--accent-color-shadow) 0 4px 12px;
}
.btn.secondary[_ngcontent-ng-c3529731854] {
  background: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
}
.btn.secondary[_ngcontent-ng-c3529731854]:hover:not(:disabled) {
  background: var(--hover-color);
  border-color: var(--accent-color);
}
.btn.success[_ngcontent-ng-c3529731854] {
  background: #27ae60;
  color: #ffffff;
  box-shadow: rgba(39, 174, 96, 0.3) 0 2px 8px;
}
.btn.success[_ngcontent-ng-c3529731854]:hover:not(:disabled) {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: rgba(39, 174, 96, 0.4) 0 4px 12px;
}
.status-message[_ngcontent-ng-c3529731854] {
  padding: 0.75rem 1rem;
  background: var(--menu-item-hover-bg-color);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--accent-color);
}
.error-message[_ngcontent-ng-c3529731854] {
  padding: 0.75rem 1rem;
  background: var(--error-background);
  border: 1px solid #e74c3c;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #e74c3c;
}
.completed-message[_ngcontent-ng-c3529731854] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--success-background);
  border: 1px solid #27ae60;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #27ae60;
}
.check-icon[_ngcontent-ng-c3529731854] {
  font-size: 1.1rem;
}
.all-complete-message[_ngcontent-ng-c3529731854] {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--success-background);
  border: 2px solid #27ae60;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #27ae60;
}
.success-icon[_ngcontent-ng-c3529731854] {
  font-size: 1.5rem;
}
.qr-toggle-section[_ngcontent-ng-c3529731854] {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
.btn.qr-toggle[_ngcontent-ng-c3529731854] {
  width: 100%;
  background: var(--secondary-background);
  color: var(--secondary-text);
  border: 2px solid var(--border-color);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn.qr-toggle[_ngcontent-ng-c3529731854]:hover {
  border-color: var(--accent-color);
  background: var(--hover-color);
}
.btn.qr-toggle.active[_ngcontent-ng-c3529731854] {
  background: var(--accent-color);
  color: #ffffff;
  border-color: var(--accent-color);
}
.btn.qr-toggle[_ngcontent-ng-c3529731854]   .qr-icon[_ngcontent-ng-c3529731854] {
  font-size: 1.1rem;
  margin-right: 0.25rem;
}
@media (max-width: 768px) {
  .engraver-container[_ngcontent-ng-c3529731854] {
    flex-direction: column;
  }
  .batch-sidebar[_ngcontent-ng-c3529731854] {
    width: 100%;
    min-width: 100%;
    max-height: 250px;
  }
  .batch-list[_ngcontent-ng-c3529731854] {
    max-height: 120px;
  }
}
/*# sourceMappingURL=/engraver-manager.component.css.map */</style><style ng-app-id="ng">

.wizard-overlay[_ngcontent-ng-c1981356277] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.wizard-overlay.minimized[_ngcontent-ng-c1981356277] {
  background: transparent;
  pointer-events: none;
}
.wizard-dialog[_ngcontent-ng-c1981356277] {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
}
.wizard-dialog.is-branch[_ngcontent-ng-c1981356277] {
  border: 2px solid #1976d2;
}
.wizard-overlay.minimized[_ngcontent-ng-c1981356277]   .wizard-dialog[_ngcontent-ng-c1981356277] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: auto;
  max-width: 300px;
  max-height: auto;
}
.dialog-header[_ngcontent-ng-c1981356277] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  cursor: move;
}
.header-content[_ngcontent-ng-c1981356277] {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.header-title[_ngcontent-ng-c1981356277] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-icon[_ngcontent-ng-c1981356277] {
  color: #1976d2;
}
.flow-name[_ngcontent-ng-c1981356277] {
  font-weight: 500;
  font-size: 16px;
}
.header-actions[_ngcontent-ng-c1981356277] {
  display: flex;
  gap: 4px;
}
.header-btn[_ngcontent-ng-c1981356277] {
  width: 32px;
  height: 32px;
  line-height: 32px;
}
.header-btn[_ngcontent-ng-c1981356277]   mat-icon[_ngcontent-ng-c1981356277] {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.close-btn[_ngcontent-ng-c1981356277]:hover {
  color: #d32f2f;
}
.dialog-content[_ngcontent-ng-c1981356277] {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 300px;
}
.dialog-footer[_ngcontent-ng-c1981356277] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}
.footer-left[_ngcontent-ng-c1981356277], 
.footer-right[_ngcontent-ng-c1981356277] {
  display: flex;
  gap: 8px;
}
.back-btn[_ngcontent-ng-c1981356277] {
  color: #666;
}
.skip-btn[_ngcontent-ng-c1981356277] {
  color: #666;
}
button[_ngcontent-ng-c1981356277]   mat-icon[_ngcontent-ng-c1981356277] {
  margin-right: 4px;
}
.footer-right[_ngcontent-ng-c1981356277]   button[_ngcontent-ng-c1981356277]   mat-icon[_ngcontent-ng-c1981356277] {
  margin-right: 4px;
  margin-left: 0;
}
.spinning[_ngcontent-ng-c1981356277] {
  animation: _ngcontent-ng-c1981356277_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c1981356277_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.minimized-info[_ngcontent-ng-c1981356277] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
}
.minimized-info[_ngcontent-ng-c1981356277]:hover {
  background: #f5f5f5;
}
/*# sourceMappingURL=/wizard-dialog.component.css.map */</style><style ng-app-id="ng">.mat-mdc-fab-base{-webkit-user-select:none;user-select:none;position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:56px;height:56px;padding:0;border:none;fill:currentColor;text-decoration:none;cursor:pointer;-moz-appearance:none;-webkit-appearance:none;overflow:visible;transition:box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),opacity 15ms linear 30ms,transform 270ms 0ms cubic-bezier(0, 0, 0.2, 1);flex-shrink:0;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-fab-base .mat-mdc-button-ripple,.mat-mdc-fab-base .mat-mdc-button-persistent-ripple,.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-fab-base .mat-mdc-button-ripple{overflow:hidden}.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before{content:"";opacity:0}.mat-mdc-fab-base .mdc-button__label,.mat-mdc-fab-base .mat-icon{z-index:1;position:relative}.mat-mdc-fab-base .mat-focus-indicator{top:0;left:0;right:0;bottom:0;position:absolute}.mat-mdc-fab-base:focus>.mat-focus-indicator::before{content:""}.mat-mdc-fab-base._mat-animation-noopable{transition:none !important;animation:none !important}.mat-mdc-fab-base::before{position:absolute;box-sizing:border-box;width:100%;height:100%;top:0;left:0;border:1px solid rgba(0,0,0,0);border-radius:inherit;content:"";pointer-events:none}.mat-mdc-fab-base[hidden]{display:none}.mat-mdc-fab-base::-moz-focus-inner{padding:0;border:0}.mat-mdc-fab-base:active,.mat-mdc-fab-base:focus{outline:none}.mat-mdc-fab-base:hover{cursor:pointer}.mat-mdc-fab-base>svg{width:100%}.mat-mdc-fab-base .mat-icon,.mat-mdc-fab-base .material-icons{transition:transform 180ms 90ms cubic-bezier(0, 0, 0.2, 1);fill:currentColor;will-change:transform}.mat-mdc-fab-base .mat-focus-indicator::before{margin:calc(calc(var(--mat-focus-indicator-border-width, 3px) + 2px)*-1)}.mat-mdc-fab-base[disabled],.mat-mdc-fab-base.mat-mdc-button-disabled{cursor:default;pointer-events:none}.mat-mdc-fab-base[disabled],.mat-mdc-fab-base[disabled]:focus,.mat-mdc-fab-base.mat-mdc-button-disabled,.mat-mdc-fab-base.mat-mdc-button-disabled:focus{box-shadow:none}.mat-mdc-fab-base.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-fab{background-color:var(--mdc-fab-container-color, var(--mat-sys-primary-container));border-radius:var(--mdc-fab-container-shape, var(--mat-sys-corner-large));color:var(--mat-fab-foreground-color, var(--mat-sys-on-primary-container, inherit));box-shadow:var(--mdc-fab-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab:hover{box-shadow:var(--mdc-fab-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-fab:focus{box-shadow:var(--mdc-fab-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab:active,.mat-mdc-fab:focus:active{box-shadow:var(--mdc-fab-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab[disabled],.mat-mdc-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mat-fab-disabled-state-foreground-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));background-color:var(--mat-fab-disabled-state-container-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent))}.mat-mdc-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-fab .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-fab-touch-target-display, block)}.mat-mdc-fab .mat-ripple-element{background-color:var(--mat-fab-ripple-color, color-mix(in srgb, var(--mat-sys-on-primary-container) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-fab .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-state-layer-color, var(--mat-sys-on-primary-container))}.mat-mdc-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-disabled-state-layer-color)}.mat-mdc-fab:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-fab.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-fab.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-fab.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-fab:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-mini-fab{width:40px;height:40px;background-color:var(--mdc-fab-small-container-color, var(--mat-sys-primary-container));border-radius:var(--mdc-fab-small-container-shape, var(--mat-sys-corner-medium));color:var(--mat-fab-small-foreground-color, var(--mat-sys-on-primary-container, inherit));box-shadow:var(--mdc-fab-small-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab:hover{box-shadow:var(--mdc-fab-small-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-mini-fab:focus{box-shadow:var(--mdc-fab-small-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab:active,.mat-mdc-mini-fab:focus:active{box-shadow:var(--mdc-fab-small-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab[disabled],.mat-mdc-mini-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mat-fab-small-disabled-state-foreground-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));background-color:var(--mat-fab-small-disabled-state-container-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent))}.mat-mdc-mini-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-mini-fab .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-fab-small-touch-target-display)}.mat-mdc-mini-fab .mat-ripple-element{background-color:var(--mat-fab-small-ripple-color, color-mix(in srgb, var(--mat-sys-on-primary-container) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-mini-fab .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-small-state-layer-color, var(--mat-sys-on-primary-container))}.mat-mdc-mini-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-small-disabled-state-layer-color)}.mat-mdc-mini-fab:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-mini-fab.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-mini-fab.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-mini-fab.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-mini-fab:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-extended-fab{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;border-radius:24px;padding-left:20px;padding-right:20px;width:auto;max-width:100%;line-height:normal;height:var(--mdc-extended-fab-container-height, 56px);border-radius:var(--mdc-extended-fab-container-shape, var(--mat-sys-corner-large));font-family:var(--mdc-extended-fab-label-text-font, var(--mat-sys-label-large-font));font-size:var(--mdc-extended-fab-label-text-size, var(--mat-sys-label-large-size));font-weight:var(--mdc-extended-fab-label-text-weight, var(--mat-sys-label-large-weight));letter-spacing:var(--mdc-extended-fab-label-text-tracking, var(--mat-sys-label-large-tracking));box-shadow:var(--mdc-extended-fab-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab:hover{box-shadow:var(--mdc-extended-fab-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-extended-fab:focus{box-shadow:var(--mdc-extended-fab-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab:active,.mat-mdc-extended-fab:focus:active{box-shadow:var(--mdc-extended-fab-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab[disabled],.mat-mdc-extended-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none}.mat-mdc-extended-fab[disabled],.mat-mdc-extended-fab[disabled]:focus,.mat-mdc-extended-fab.mat-mdc-button-disabled,.mat-mdc-extended-fab.mat-mdc-button-disabled:focus{box-shadow:none}.mat-mdc-extended-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}[dir=rtl] .mat-mdc-extended-fab .mdc-button__label+.mat-icon,[dir=rtl] .mat-mdc-extended-fab .mdc-button__label+.material-icons,.mat-mdc-extended-fab>.mat-icon,.mat-mdc-extended-fab>.material-icons{margin-left:-8px;margin-right:12px}.mat-mdc-extended-fab .mdc-button__label+.mat-icon,.mat-mdc-extended-fab .mdc-button__label+.material-icons,[dir=rtl] .mat-mdc-extended-fab>.mat-icon,[dir=rtl] .mat-mdc-extended-fab>.material-icons{margin-left:12px;margin-right:-8px}.mat-mdc-extended-fab .mat-mdc-button-touch-target{width:100%}
</style><style ng-app-id="ng">.mat-focus-indicator{position:relative}.mat-focus-indicator::before{top:0;left:0;right:0;bottom:0;position:absolute;box-sizing:border-box;pointer-events:none;display:var(--mat-focus-indicator-display, none);border-width:var(--mat-focus-indicator-border-width, 3px);border-style:var(--mat-focus-indicator-border-style, solid);border-color:var(--mat-focus-indicator-border-color, transparent);border-radius:var(--mat-focus-indicator-border-radius, 4px)}.mat-focus-indicator:focus::before{content:""}@media(forced-colors: active){html{--mat-focus-indicator-display: block}}
</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style><style ng-app-id="ng">mat-menu{display:none}.mat-mdc-menu-content{margin:0;padding:8px 0;outline:0}.mat-mdc-menu-content,.mat-mdc-menu-content .mat-mdc-menu-item .mat-mdc-menu-item-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;flex:1;white-space:normal;font-family:var(--mat-menu-item-label-text-font, var(--mat-sys-label-large-font));line-height:var(--mat-menu-item-label-text-line-height, var(--mat-sys-label-large-line-height));font-size:var(--mat-menu-item-label-text-size, var(--mat-sys-label-large-size));letter-spacing:var(--mat-menu-item-label-text-tracking, var(--mat-sys-label-large-tracking));font-weight:var(--mat-menu-item-label-text-weight, var(--mat-sys-label-large-weight))}@keyframes _mat-menu-enter{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:none}}@keyframes _mat-menu-exit{from{opacity:1}to{opacity:0}}.mat-mdc-menu-panel{min-width:112px;max-width:280px;overflow:auto;box-sizing:border-box;outline:0;animation:_mat-menu-enter 120ms cubic-bezier(0, 0, 0.2, 1);border-radius:var(--mat-menu-container-shape, var(--mat-sys-corner-extra-small));background-color:var(--mat-menu-container-color, var(--mat-sys-surface-container));box-shadow:var(--mat-menu-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));will-change:transform,opacity}.mat-mdc-menu-panel.mat-menu-panel-exit-animation{animation:_mat-menu-exit 100ms 25ms linear forwards}.mat-mdc-menu-panel.mat-menu-panel-animations-disabled{animation:none}.mat-mdc-menu-panel.mat-menu-panel-animating{pointer-events:none}.mat-mdc-menu-panel.mat-menu-panel-animating:has(.mat-mdc-menu-content:empty){display:none}@media(forced-colors: active){.mat-mdc-menu-panel{outline:solid 1px}}.mat-mdc-menu-panel .mat-divider{color:var(--mat-menu-divider-color, var(--mat-sys-surface-variant));margin-bottom:var(--mat-menu-divider-bottom-spacing, 8px);margin-top:var(--mat-menu-divider-top-spacing, 8px)}.mat-mdc-menu-item{display:flex;position:relative;align-items:center;justify-content:flex-start;overflow:hidden;padding:0;cursor:pointer;width:100%;text-align:left;box-sizing:border-box;color:inherit;font-size:inherit;background:none;text-decoration:none;margin:0;min-height:48px;padding-left:var(--mat-menu-item-leading-spacing, 12px);padding-right:var(--mat-menu-item-trailing-spacing, 12px);-webkit-user-select:none;user-select:none;cursor:pointer;outline:none;border:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-menu-item::-moz-focus-inner{border:0}[dir=rtl] .mat-mdc-menu-item{padding-left:var(--mat-menu-item-trailing-spacing, 12px);padding-right:var(--mat-menu-item-leading-spacing, 12px)}.mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-leading-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-trailing-spacing, 12px)}[dir=rtl] .mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-trailing-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-leading-spacing, 12px)}.mat-mdc-menu-item,.mat-mdc-menu-item:visited,.mat-mdc-menu-item:link{color:var(--mat-menu-item-label-text-color, var(--mat-sys-on-surface))}.mat-mdc-menu-item .mat-icon-no-color,.mat-mdc-menu-item .mat-mdc-menu-submenu-icon{color:var(--mat-menu-item-icon-color, var(--mat-sys-on-surface-variant))}.mat-mdc-menu-item[disabled]{cursor:default;opacity:.38}.mat-mdc-menu-item[disabled]::after{display:block;position:absolute;content:"";top:0;left:0;bottom:0;right:0}.mat-mdc-menu-item:focus{outline:0}.mat-mdc-menu-item .mat-icon{flex-shrink:0;margin-right:var(--mat-menu-item-spacing, 12px);height:var(--mat-menu-item-icon-size, 24px);width:var(--mat-menu-item-icon-size, 24px)}[dir=rtl] .mat-mdc-menu-item{text-align:right}[dir=rtl] .mat-mdc-menu-item .mat-icon{margin-right:0;margin-left:var(--mat-menu-item-spacing, 12px)}.mat-mdc-menu-item:not([disabled]):hover{background-color:var(--mat-menu-item-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent))}.mat-mdc-menu-item:not([disabled]).cdk-program-focused,.mat-mdc-menu-item:not([disabled]).cdk-keyboard-focused,.mat-mdc-menu-item:not([disabled]).mat-mdc-menu-item-highlighted{background-color:var(--mat-menu-item-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent))}@media(forced-colors: active){.mat-mdc-menu-item{margin-top:1px}}.mat-mdc-menu-submenu-icon{width:var(--mat-menu-item-icon-size, 24px);height:10px;fill:currentColor;padding-left:var(--mat-menu-item-spacing, 12px)}[dir=rtl] .mat-mdc-menu-submenu-icon{padding-right:var(--mat-menu-item-spacing, 12px);padding-left:0}[dir=rtl] .mat-mdc-menu-submenu-icon polygon{transform:scaleX(-1);transform-origin:center}@media(forced-colors: active){.mat-mdc-menu-submenu-icon{fill:CanvasText}}.mat-mdc-menu-item .mat-mdc-menu-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none}
</style><style ng-app-id="ng">.mat-ripple{overflow:hidden;position:relative}.mat-ripple:not(:empty){transform:translateZ(0)}.mat-ripple.mat-ripple-unbounded{overflow:visible}.mat-ripple-element{position:absolute;border-radius:50%;pointer-events:none;transition:opacity,transform 0ms cubic-bezier(0, 0, 0.2, 1);transform:scale3d(0, 0, 0);background-color:var(--mat-ripple-color, color-mix(in srgb, var(--mat-sys-on-surface) 10%, transparent))}@media(forced-colors: active){.mat-ripple-element{display:none}}.cdk-drag-preview .mat-ripple-element,.cdk-drag-placeholder .mat-ripple-element{display:none}
</style><style ng-app-id="ng">

[_nghost-ng-c3098161097] {
  display: block;
  width: 100%;
  height: 100%;
}
/*# sourceMappingURL=/rf-file-page.component.css.map */</style><style ng-app-id="ng">

.layout-container[_ngcontent-ng-c3342727180] {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--primary-background);
  color: var(--primary-text);
  position: relative;
  overflow: hidden;
}
.header[_ngcontent-ng-c3342727180] {
  position: relative;
  background-color: var(--header-background);
  color: var(--header-text);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  z-index: 100;
}
.header-content[_ngcontent-ng-c3342727180] {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  flex: 1;
  position: relative;
}
.header-content[_ngcontent-ng-c3342727180]::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  background:
    linear-gradient(
      to right,
      hsla(0, 0%, 100%, 0),
      var(--header-background));
  pointer-events: none;
}
.header-content[_ngcontent-ng-c3342727180]::-webkit-scrollbar {
  display: none;
}
.header-content[_ngcontent-ng-c3342727180] {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.header-content[_ngcontent-ng-c3342727180]   h1[_ngcontent-ng-c3342727180] {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.header-actions[_ngcontent-ng-c3342727180] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.auth-btn[_ngcontent-ng-c3342727180] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
}
.auth-btn[_ngcontent-ng-c3342727180]:hover {
  background-color: var(--accent-color-hover);
}
.content-wrapper[_ngcontent-ng-c3342727180] {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.left-menu[_ngcontent-ng-c3342727180] {
  background-color: var(--menu-background);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}
.resizer[_ngcontent-ng-c3342727180] {
  width: 15px;
  cursor: col-resize;
  background-color: transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease-in-out;
  flex-shrink: 0;
  z-index: 10;
}
.resizer[_ngcontent-ng-c3342727180]:hover {
  background-color: var(--accent-color-translucent);
}
.menu-toggle-btn[_ngcontent-ng-c3342727180] {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--secondary-background);
  border: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  z-index: 1002;
}
.menu-toggle-btn[_ngcontent-ng-c3342727180]:hover {
  background-color: var(--accent-color);
  transform: translate(-50%, -50%) scale(1.1);
}
.arrow[_ngcontent-ng-c3342727180] {
  border: solid var(--primary-text);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transition: transform 0.3s ease;
}
.arrow[_ngcontent-ng-c3342727180]:not(.collapsed) {
  transform: rotate(135deg);
}
.arrow.collapsed[_ngcontent-ng-c3342727180] {
  transform: rotate(-45deg);
  margin-left: -2px;
}
.main-and-footer[_ngcontent-ng-c3342727180] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.main-content[_ngcontent-ng-c3342727180] {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  background-color: var(--primary-background);
}
.footer-resizer[_ngcontent-ng-c3342727180] {
  height: 5px;
  background-color: var(--border-color);
  cursor: row-resize;
  transition: background-color 0.3s ease;
}
.footer-resizer[_ngcontent-ng-c3342727180]:hover {
  background-color: var(--accent-color);
}
.footer[_ngcontent-ng-c3342727180] {
  overflow: auto;
  background-color: var(--secondary-background);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}
.overlay[_ngcontent-ng-c3342727180] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  z-index: 1000;
  pointer-events: none;
}
.overlay.active[_ngcontent-ng-c3342727180] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
@supports (-webkit-touch-callout: none) {
  .layout-container[_ngcontent-ng-c3342727180] {
    height: -webkit-fill-available;
  }
}
@media screen and (max-width: 768px) {
  .layout-container[_ngcontent-ng-c3342727180] {
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    -webkit-overflow-scrolling: touch;
  }
  .content-wrapper[_ngcontent-ng-c3342727180] {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  .main-and-footer[_ngcontent-ng-c3342727180] {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .main-content[_ngcontent-ng-c3342727180] {
    flex: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
  }
}
@media (max-width: 768px) {
  .left-menu[_ngcontent-ng-c3342727180] {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    z-index: 1002 !important;
    transform: translateX(-100%) !important;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2) !important;
    transition: transform 0.3s ease-in-out !important;
  }
  .left-menu.active[_ngcontent-ng-c3342727180] {
    transform: translateX(0) !important;
  }
  .resizer[_ngcontent-ng-c3342727180] {
    width: 50px !important;
    cursor: default !important;
    background-color: transparent !important;
    position: fixed !important;
    left: 0 !important;
    top: 50% !important;
    height: auto !important;
    z-index: 1003 !important;
    transform: translateY(-50%) !important;
  }
  .resizer[_ngcontent-ng-c3342727180]:hover {
    background-color: transparent !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c3342727180] {
    position: static !important;
    transform: none !important;
    left: auto !important;
    top: auto !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c3342727180]:hover {
    transform: scale(1.1) !important;
  }
  .left-menu.active[_ngcontent-ng-c3342727180]    ~ .resizer[_ngcontent-ng-c3342727180] {
    left: calc(100% - 60px) !important;
  }
  .main-and-footer[_ngcontent-ng-c3342727180] {
    width: 100%;
  }
  .main-content[_ngcontent-ng-c3342727180] {
    padding: 0.5rem;
  }
  .header[_ngcontent-ng-c3342727180] {
    padding: 0.75rem;
  }
  .header-content[_ngcontent-ng-c3342727180]   h1[_ngcontent-ng-c3342727180] {
    font-size: 1.25rem;
  }
  .auth-btn[_ngcontent-ng-c3342727180] {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .left-menu[_ngcontent-ng-c3342727180] {
    max-width: 350px;
  }
}
@media (max-width: 768px) {
  body.menu-open[_ngcontent-ng-c3342727180] {
    overflow: hidden;
  }
}
.clipboard-container[_ngcontent-ng-c3342727180] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  cursor: move;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background-color: white;
  max-width: 400px;
}
/*# sourceMappingURL=/main-layout.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c3178853866] {
  --router-menu-text-color: inherit;
  --router-menu-text-hover-color: inherit;
}
.router-menu[_ngcontent-ng-c3178853866]   ul[_ngcontent-ng-c3178853866] {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.router-menu.column[_ngcontent-ng-c3178853866]   ul[_ngcontent-ng-c3178853866] {
  display: flex;
  flex-direction: column;
}
.router-menu.row[_ngcontent-ng-c3178853866]   ul[_ngcontent-ng-c3178853866] {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.router-menu.row[_ngcontent-ng-c3178853866]   li[_ngcontent-ng-c3178853866] {
  margin-right: 15px;
}
.router-menu.column[_ngcontent-ng-c3178853866]   li[_ngcontent-ng-c3178853866] {
  margin-bottom: 10px;
}
.router-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  text-decoration: none;
  color: var(--router-menu-text-color);
}
.router-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  color: var(--router-menu-text-hover-color);
}
.menu-container[_ngcontent-ng-c3178853866] {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.primary-menu[_ngcontent-ng-c3178853866] {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.primary-menu[_ngcontent-ng-c3178853866]   li[_ngcontent-ng-c3178853866] {
  margin: 0;
}
.home-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.home-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.menu-group-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
}
.menu-group-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.menu-group-link.active[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  background-color: rgba(0, 0, 0, 0.08);
  font-weight: 600;
}
.secondary-menu[_ngcontent-ng-c3178853866] {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  border-top: 1px solid var(--border-color, #e0e0e0);
  flex-wrap: wrap;
}
.secondary-menu[_ngcontent-ng-c3178853866]   li[_ngcontent-ng-c3178853866] {
  margin: 0;
}
.secondary-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  transition: all 0.2s;
}
.secondary-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.secondary-menu[_ngcontent-ng-c3178853866]   a.active-link[_ngcontent-ng-c3178853866] {
  background-color: rgba(0, 0, 0, 0.1);
  font-weight: 600;
}
.router-menu.column[_ngcontent-ng-c3178853866]   .menu-container[_ngcontent-ng-c3178853866] {
  gap: 12px;
}
.router-menu.column[_ngcontent-ng-c3178853866]   .primary-menu[_ngcontent-ng-c3178853866] {
  flex-direction: column;
  align-items: flex-start;
}
.router-menu.column[_ngcontent-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866] {
  flex-direction: column;
  align-items: flex-start;
  border-top: none;
  border-left: 2px solid var(--border-color, #e0e0e0);
  padding: 0 0 0 12px;
  margin-left: 8px;
}
.dark-mode[_nghost-ng-c3178853866]   .home-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover, .dark-mode   [_nghost-ng-c3178853866]   .home-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover, 
.dark-mode[_nghost-ng-c3178853866]   .menu-group-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover, .dark-mode   [_nghost-ng-c3178853866]   .menu-group-link[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.dark-mode[_nghost-ng-c3178853866]   .menu-group-link.active[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866], .dark-mode   [_nghost-ng-c3178853866]   .menu-group-link.active[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866] {
  background-color: rgba(255, 255, 255, 0.15);
}
.dark-mode[_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866], .dark-mode   [_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866] {
  border-color: var(--border-color-dark, #444);
}
.dark-mode[_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover, .dark-mode   [_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866]   a[_ngcontent-ng-c3178853866]:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.dark-mode[_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866]   a.active-link[_ngcontent-ng-c3178853866], .dark-mode   [_nghost-ng-c3178853866]   .secondary-menu[_ngcontent-ng-c3178853866]   a.active-link[_ngcontent-ng-c3178853866] {
  background-color: rgba(255, 255, 255, 0.15);
}
/*# sourceMappingURL=/router-menu.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c1199198902] {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}
.file-menu-container[_ngcontent-ng-c1199198902] {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--secondary-background);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
}
.menu-header[_ngcontent-ng-c1199198902] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--card-background);
  border-bottom: 2px solid var(--border-color);
}
.menu-header[_ngcontent-ng-c1199198902]   h2[_ngcontent-ng-c1199198902] {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary-text);
}
.header-actions[_ngcontent-ng-c1199198902] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-button[_ngcontent-ng-c1199198902] {
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-button[_ngcontent-ng-c1199198902]   .icon[_ngcontent-ng-c1199198902] {
  font-size: 1.25rem;
  line-height: 1;
  color: var(--primary-text);
}
.icon-button[_ngcontent-ng-c1199198902]:hover:not(:disabled) {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.icon-button[_ngcontent-ng-c1199198902]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.add-button[_ngcontent-ng-c1199198902] {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}
.add-button[_ngcontent-ng-c1199198902]   .icon[_ngcontent-ng-c1199198902] {
  color: white;
  font-weight: bold;
}
.add-button[_ngcontent-ng-c1199198902]:hover:not(:disabled) {
  background-color: var(--accent-color-hover);
  border-color: var(--accent-color-hover);
  transform: scale(1.05);
}
.file-type-controls[_ngcontent-ng-c1199198902] {
  padding: 0.75rem 1rem;
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
}
.controls-label[_ngcontent-ng-c1199198902] {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--secondary-text);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.file-type-buttons[_ngcontent-ng-c1199198902] {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.type-button[_ngcontent-ng-c1199198902] {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  background-color: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.type-button[_ngcontent-ng-c1199198902]:hover:not(:disabled) {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.type-button.active[_ngcontent-ng-c1199198902] {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.type-button[_ngcontent-ng-c1199198902]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.loading-state[_ngcontent-ng-c1199198902] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: var(--secondary-text);
}
.spinner[_ngcontent-ng-c1199198902] {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: _ngcontent-ng-c1199198902_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c1199198902_spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.error-state[_ngcontent-ng-c1199198902] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.75rem;
  color: var(--error-text, #d32f2f);
}
.error-icon[_ngcontent-ng-c1199198902] {
  font-size: 2rem;
}
.error-message[_ngcontent-ng-c1199198902] {
  text-align: center;
  font-size: 0.875rem;
}
.retry-button[_ngcontent-ng-c1199198902] {
  padding: 0.5rem 1rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.retry-button[_ngcontent-ng-c1199198902]:hover {
  background-color: var(--accent-color-hover);
}
app-rf-toggle-menu[_ngcontent-ng-c1199198902] {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}
@media (max-width: 600px) {
  .file-type-buttons[_ngcontent-ng-c1199198902] {
    flex-direction: column;
  }
  .type-button[_ngcontent-ng-c1199198902] {
    width: 100%;
  }
}
/*# sourceMappingURL=/rf-file-left-menu.component.css.map */</style><style ng-app-id="ng">

.popup-overlay[_ngcontent-ng-c3889602632] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.popup-content[_ngcontent-ng-c3889602632] {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}
.popup-small[_ngcontent-ng-c3889602632] {
  width: 400px;
}
.popup-medium[_ngcontent-ng-c3889602632] {
  width: 600px;
}
.popup-large[_ngcontent-ng-c3889602632] {
  width: 900px;
}
.popup-auto[_ngcontent-ng-c3889602632] {
  width: auto;
  max-width: 90vw;
}
.popup-header[_ngcontent-ng-c3889602632] {
  flex-shrink: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.popup-header[_ngcontent-ng-c3889602632]   h2[_ngcontent-ng-c3889602632] {
  margin: 0;
  font-size: 1.5em;
  flex: 1;
}
.close-button[_ngcontent-ng-c3889602632] {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.close-button[_ngcontent-ng-c3889602632]:hover {
  color: #333;
  background-color: #f0f0f0;
  border-radius: 4px;
}
.popup-body[_ngcontent-ng-c3889602632] {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  display: flex;
  border-top: 1px solid #e0e0e0;
}
.popup-body[_ngcontent-ng-c3889602632]    > *[_ngcontent-ng-c3889602632] {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
/*# sourceMappingURL=/rf-popup-projection.component.css.map */</style><style ng-app-id="ng">

.file-form-wrapper[_ngcontent-ng-c3625216738] {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.file-autofill-section[_ngcontent-ng-c3625216738] {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: var(--card-background, #f8f9fa);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  flex-shrink: 0;
}
.file-form-wrapper[_ngcontent-ng-c3625216738]    > app-rf-reactive-form[_ngcontent-ng-c3625216738] {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.toggle-row[_ngcontent-ng-c3625216738] {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.toggle-label[_ngcontent-ng-c3625216738] {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
.toggle-label[_ngcontent-ng-c3625216738]   input[type=checkbox][_ngcontent-ng-c3625216738] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent-color, #2196f3);
}
.toggle-text[_ngcontent-ng-c3625216738] {
  font-size: 14px;
  color: var(--primary-text, #333);
}
.selected-file-hint[_ngcontent-ng-c3625216738] {
  font-size: 13px;
  color: var(--secondary-text, #666);
  font-style: italic;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.processing-overlay[_ngcontent-ng-c3625216738] {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
}
.processing-content[_ngcontent-ng-c3625216738] {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 48px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.spinner[_ngcontent-ng-c3625216738] {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: _ngcontent-ng-c3625216738_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c3625216738_spin {
  to {
    transform: rotate(360deg);
  }
}
.processing-message[_ngcontent-ng-c3625216738] {
  font-size: 16px;
  font-weight: 500;
  color: var(--primary-text);
}
.clipboard-controls[_ngcontent-ng-c3625216738] {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.clipboard-label[_ngcontent-ng-c3625216738] {
  font-weight: 500;
  color: var(--primary-text);
  white-space: nowrap;
  flex-shrink: 0;
}
.clipboard-input[_ngcontent-ng-c3625216738] {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-background, #fff);
  color: var(--primary-text);
  font-size: 16px;
  line-height: 1.8;
  width: 70px;
  transition: border-color 0.3s ease;
  flex-shrink: 0;
}
.clipboard-input[_ngcontent-ng-c3625216738]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.1);
}
.clipboard-input[_ngcontent-ng-c3625216738]:disabled {
  background-color: var(--disabled-background, #f5f5f5);
  color: var(--disabled-text, #999);
  cursor: not-allowed;
}
.clipboard-button[_ngcontent-ng-c3625216738] {
  padding: 8px 16px;
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.clipboard-button[_ngcontent-ng-c3625216738]:hover:not(:disabled) {
  background-color: var(--accent-color-hover);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.clipboard-button[_ngcontent-ng-c3625216738]:active:not(:disabled) {
  transform: translateY(0);
}
.clipboard-button[_ngcontent-ng-c3625216738]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 480px) {
  .clipboard-controls[_ngcontent-ng-c3625216738] {
    width: 100%;
  }
  .clipboard-input[_ngcontent-ng-c3625216738] {
    flex: 1;
    min-width: 60px;
  }
  .clipboard-button[_ngcontent-ng-c3625216738] {
    flex-shrink: 0;
  }
}
/*# sourceMappingURL=/rf-file-form.component.css.map */</style><style ng-app-id="ng">

.multi-upload-overlay[_ngcontent-ng-c2088088856] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.multi-upload-dialog[_ngcontent-ng-c2088088856] {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.dialog-header[_ngcontent-ng-c2088088856] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}
.dialog-header[_ngcontent-ng-c2088088856]   h2[_ngcontent-ng-c2088088856] {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.close-btn[_ngcontent-ng-c2088088856] {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
}
.close-btn[_ngcontent-ng-c2088088856]:hover {
  color: #333;
}
.close-btn[_ngcontent-ng-c2088088856]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dialog-content[_ngcontent-ng-c2088088856] {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.form-row[_ngcontent-ng-c2088088856] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.form-group[_ngcontent-ng-c2088088856] {
  display: flex;
  flex-direction: column;
}
.shared-name-section[_ngcontent-ng-c2088088856] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}
.toggle-label[_ngcontent-ng-c2088088856] {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
.toggle-label[_ngcontent-ng-c2088088856]   input[type=checkbox][_ngcontent-ng-c2088088856] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2196f3;
}
.toggle-text[_ngcontent-ng-c2088088856] {
  font-size: 14px;
  color: #333;
}
.shared-name-input[_ngcontent-ng-c2088088856] {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}
.shared-name-input[_ngcontent-ng-c2088088856]:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}
.shared-name-hint[_ngcontent-ng-c2088088856] {
  font-size: 12px;
  color: #666;
  font-style: italic;
}
.drop-zone[_ngcontent-ng-c2088088856] {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  min-height: 200px;
  transition: all 0.2s;
}
.drop-zone.drag-over[_ngcontent-ng-c2088088856] {
  border-color: #2196f3;
  background: #e3f2fd;
}
.drop-zone.has-files[_ngcontent-ng-c2088088856] {
  border-style: solid;
  border-color: #e0e0e0;
}
.drop-zone-content[_ngcontent-ng-c2088088856] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: #666;
}
.drop-icon[_ngcontent-ng-c2088088856] {
  font-size: 48px;
  margin-bottom: 12px;
}
.drop-zone-content[_ngcontent-ng-c2088088856]   p[_ngcontent-ng-c2088088856] {
  margin: 4px 0;
}
.drop-hint[_ngcontent-ng-c2088088856] {
  color: #999;
  font-size: 13px;
}
.browse-btn[_ngcontent-ng-c2088088856] {
  margin-top: 12px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.browse-btn[_ngcontent-ng-c2088088856]:hover {
  background: #1976d2;
}
.file-list-header[_ngcontent-ng-c2088088856] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}
.header-actions[_ngcontent-ng-c2088088856] {
  display: flex;
  gap: 8px;
}
.add-more-btn[_ngcontent-ng-c2088088856] {
  padding: 4px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.add-more-btn[_ngcontent-ng-c2088088856]:hover {
  background: #e0e0e0;
}
.clear-btn[_ngcontent-ng-c2088088856] {
  padding: 4px 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #f44336;
  transition: all 0.2s;
}
.clear-btn[_ngcontent-ng-c2088088856]:hover {
  background: #ffebee;
  border-color: #f44336;
}
.clear-btn[_ngcontent-ng-c2088088856]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.file-list[_ngcontent-ng-c2088088856] {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-item[_ngcontent-ng-c2088088856] {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  gap: 12px;
}
.file-item.uploading[_ngcontent-ng-c2088088856] {
  background: #e3f2fd;
}
.file-item.success[_ngcontent-ng-c2088088856] {
  background: #e8f5e9;
}
.file-item.error[_ngcontent-ng-c2088088856] {
  background: #ffebee;
}
.file-icon[_ngcontent-ng-c2088088856] {
  font-size: 20px;
}
.file-info[_ngcontent-ng-c2088088856] {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.file-name[_ngcontent-ng-c2088088856] {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-size[_ngcontent-ng-c2088088856] {
  font-size: 12px;
  color: #666;
}
.file-error[_ngcontent-ng-c2088088856] {
  font-size: 12px;
  color: #f44336;
}
.remove-btn[_ngcontent-ng-c2088088856] {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px 8px;
  line-height: 1;
}
.remove-btn[_ngcontent-ng-c2088088856]:hover {
  color: #f44336;
}
.message[_ngcontent-ng-c2088088856] {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
}
.message.error[_ngcontent-ng-c2088088856] {
  background: #ffebee;
  color: #c62828;
  border-left: 3px solid #f44336;
}
.message.success[_ngcontent-ng-c2088088856] {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 3px solid #4caf50;
}
.message.info[_ngcontent-ng-c2088088856] {
  background: #e3f2fd;
  color: #1565c0;
  border-left: 3px solid #2196f3;
  display: flex;
  align-items: center;
  gap: 12px;
}
.spinner[_ngcontent-ng-c2088088856] {
  width: 16px;
  height: 16px;
  border: 2px solid #bbdefb;
  border-top-color: #1565c0;
  border-radius: 50%;
  animation: _ngcontent-ng-c2088088856_spin 0.8s linear infinite;
}
@keyframes _ngcontent-ng-c2088088856_spin {
  to {
    transform: rotate(360deg);
  }
}
.dialog-footer[_ngcontent-ng-c2088088856] {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}
.cancel-btn[_ngcontent-ng-c2088088856] {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.cancel-btn[_ngcontent-ng-c2088088856]:hover {
  background: #e0e0e0;
}
.cancel-btn[_ngcontent-ng-c2088088856]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.upload-btn[_ngcontent-ng-c2088088856] {
  padding: 10px 24px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.upload-btn[_ngcontent-ng-c2088088856]:hover:not(:disabled) {
  background: #43a047;
}
.upload-btn[_ngcontent-ng-c2088088856]:disabled {
  background: #ccc;
  cursor: not-allowed;
}
/*# sourceMappingURL=/rf-multi-upload.component.css.map */</style><style ng-app-id="ng">

.export-dialog-content[_ngcontent-ng-c2960541796] {
  padding: 16px;
  min-width: 350px;
}
.export-description[_ngcontent-ng-c2960541796] {
  margin-bottom: 16px;
  color: var(--text-secondary, #666);
}
.export-options[_ngcontent-ng-c2960541796] {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.export-option-btn[_ngcontent-ng-c2960541796] {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--bg-color, #fff);
  text-align: left;
}
.export-option-btn[_ngcontent-ng-c2960541796]:hover:not(.disabled) {
  background-color: var(--hover-bg, #f5f5f5);
  border-color: var(--primary-color, #1976d2);
}
.export-option-btn.selected[_ngcontent-ng-c2960541796] {
  background-color: var(--primary-light, #e3f2fd);
  border-color: var(--primary-color, #1976d2);
  box-shadow: 0 0 0 1px var(--primary-color, #1976d2);
}
.export-option-btn.selected[_ngcontent-ng-c2960541796]   .option-label[_ngcontent-ng-c2960541796]   strong[_ngcontent-ng-c2960541796] {
  color: var(--primary-color, #1976d2);
}
.export-option-btn.disabled[_ngcontent-ng-c2960541796] {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--disabled-bg, #f5f5f5);
}
.option-label[_ngcontent-ng-c2960541796] {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.option-label[_ngcontent-ng-c2960541796]   strong[_ngcontent-ng-c2960541796] {
  color: var(--text-primary, #333);
  font-size: 14px;
}
.option-description[_ngcontent-ng-c2960541796] {
  font-size: 0.85em;
  color: var(--text-secondary, #666);
}
.error-message[_ngcontent-ng-c2960541796] {
  padding: 12px;
  background-color: var(--error-bg, #ffebee);
  color: var(--error-color, #c62828);
  border-radius: 4px;
  margin-bottom: 16px;
}
.dialog-actions[_ngcontent-ng-c2960541796] {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn[_ngcontent-ng-c2960541796] {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn[_ngcontent-ng-c2960541796]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary[_ngcontent-ng-c2960541796] {
  background-color: var(--secondary-bg, #e0e0e0);
  color: var(--text-primary, #333);
}
.btn-primary[_ngcontent-ng-c2960541796] {
  background-color: var(--primary-color, #1976d2);
  color: white;
}
.btn-primary[_ngcontent-ng-c2960541796]:hover:not(:disabled) {
  background-color: var(--primary-dark, #1565c0);
}
.spinner[_ngcontent-ng-c2960541796] {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: _ngcontent-ng-c2960541796_spin 0.8s linear infinite;
}
@keyframes _ngcontent-ng-c2960541796_spin {
  to {
    transform: rotate(360deg);
  }
}
/*# sourceMappingURL=/export-dialog.component.css.map */</style><style ng-app-id="ng">

.sync-indicator[_ngcontent-ng-c990181552] {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}
.sync-indicator[_ngcontent-ng-c990181552]:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.sync-indicator.connected[_ngcontent-ng-c990181552]   mat-icon[_ngcontent-ng-c990181552] {
  color: #4caf50;
}
.sync-indicator.connecting[_ngcontent-ng-c990181552]   mat-icon[_ngcontent-ng-c990181552] {
  color: #ff9800;
}
.sync-indicator.disconnected[_ngcontent-ng-c990181552]   mat-icon[_ngcontent-ng-c990181552] {
  color: #f44336;
}
.sync-indicator.out-of-sync[_ngcontent-ng-c990181552]   mat-icon[_ngcontent-ng-c990181552] {
  color: #f44336;
}
.sync-indicator.possibly-out-of-sync[_ngcontent-ng-c990181552]   mat-icon[_ngcontent-ng-c990181552] {
  color: #ff9800;
}
.pulse[_ngcontent-ng-c990181552] {
  animation: _ngcontent-ng-c990181552_pulse 1.5s ease-in-out infinite;
}
@keyframes _ngcontent-ng-c990181552_pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.update-badge[_ngcontent-ng-c990181552] {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #2196f3;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 14px;
  text-align: center;
}
.warning-indicator[_ngcontent-ng-c990181552] {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background-color: #ff9800;
  color: white;
  font-size: 9px;
  font-weight: bold;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.warning-indicator.error[_ngcontent-ng-c990181552] {
  background-color: #f44336;
  animation: _ngcontent-ng-c990181552_pulse 1s ease-in-out infinite;
}
/*# sourceMappingURL=/sync-indicator.component.css.map */</style><style ng-app-id="ng">

.tour-trigger-btn[_ngcontent-ng-c1184412316] {
  color: inherit;
}
.tour-menu-header[_ngcontent-ng-c1184412316] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  color: var(--text-primary, #333);
}
.tour-menu-header[_ngcontent-ng-c1184412316]   mat-icon[_ngcontent-ng-c1184412316] {
  color: var(--primary-color, #1976d2);
}
.tour-menu-divider[_ngcontent-ng-c1184412316] {
  height: 1px;
  background: var(--border-color, #e0e0e0);
  margin: 4px 0;
}
button.completed[_ngcontent-ng-c1184412316] {
  background-color: var(--success-bg, rgba(76, 175, 80, 0.1));
}
.check-icon[_ngcontent-ng-c1184412316] {
  margin-left: auto;
  color: var(--success-color, #4caf50);
  font-size: 18px;
  width: 18px;
  height: 18px;
}
/*# sourceMappingURL=/tour-trigger.component.css.map */</style><style ng-app-id="ng">

.theme-toggle-button[_ngcontent-ng-c3074088440] {
  background-color: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.theme-toggle-button[_ngcontent-ng-c3074088440]:hover {
  background-color: color-mix(in srgb, var(--secondary-background) 80%, var(--primary-text));
}
/*# sourceMappingURL=/theme-toggle.component.css.map */</style><style ng-app-id="ng">

.clipboard-wrapper[_ngcontent-ng-c450165409] {
  position: relative;
}
.clipboard-icon-wrapper[_ngcontent-ng-c450165409] {
  position: fixed;
  z-index: 1000;
  cursor: grab;
}
.clipboard-icon-wrapper[_ngcontent-ng-c450165409]:active {
  cursor: grabbing;
}
.clipboard-icon-button[_ngcontent-ng-c450165409] {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.clipboard-icon-button[_ngcontent-ng-c450165409]:hover {
  background-color: var(--accent-color-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.item-badge[_ngcontent-ng-c450165409] {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
.clipboard-container[_ngcontent-ng-c450165409] {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 400px;
  max-height: 600px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border: 1px solid var(--border-color);
}
.clipboard-header[_ngcontent-ng-c450165409] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--header-background);
  color: var(--header-text);
  border-radius: 8px 8px 0 0;
  cursor: grab;
  -webkit-user-select: none;
  user-select: none;
}
.clipboard-header[_ngcontent-ng-c450165409]:active {
  cursor: grabbing;
}
.drag-handle[_ngcontent-ng-c450165409] {
  display: flex;
  align-items: center;
  margin-right: 8px;
  opacity: 0.7;
}
.drag-handle[_ngcontent-ng-c450165409]   mat-icon[_ngcontent-ng-c450165409] {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.clipboard-header[_ngcontent-ng-c450165409]   h3[_ngcontent-ng-c450165409] {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}
.close-button[_ngcontent-ng-c450165409] {
  background: none;
  border: none;
  color: var(--header-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.close-button[_ngcontent-ng-c450165409]:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
.clipboard-content[_ngcontent-ng-c450165409] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.sections-tabs[_ngcontent-ng-c450165409] {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  background-color: var(--secondary-background);
  flex-shrink: 0;
}
.section-tab[_ngcontent-ng-c450165409] {
  padding: 6px 12px;
  border: none;
  background-color: var(--secondary-background);
  color: var(--secondary-text);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}
.section-tab[_ngcontent-ng-c450165409]:hover {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.section-tab.active[_ngcontent-ng-c450165409] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border-color: var(--accent-color);
}
.section-count[_ngcontent-ng-c450165409] {
  font-size: 11px;
  opacity: 0.8;
  margin-left: 4px;
}
.section-items[_ngcontent-ng-c450165409] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.section-actions[_ngcontent-ng-c450165409] {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--secondary-background);
}
.action-button[_ngcontent-ng-c450165409] {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  background-color: var(--card-background);
  color: var(--primary-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}
.action-button[_ngcontent-ng-c450165409]:hover:not(:disabled) {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.action-button[_ngcontent-ng-c450165409]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.action-button[_ngcontent-ng-c450165409]   mat-icon[_ngcontent-ng-c450165409] {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
.items-list[_ngcontent-ng-c450165409] {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.clipboard-item[_ngcontent-ng-c450165409] {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: var(--secondary-background);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  align-items: center;
}
.clipboard-item[_ngcontent-ng-c450165409]:hover {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.item-summary[_ngcontent-ng-c450165409] {
  flex: 1;
  min-width: 0;
}
.item-title[_ngcontent-ng-c450165409] {
  font-size: 13px;
  color: var(--primary-text);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-actions[_ngcontent-ng-c450165409] {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.item-action-button[_ngcontent-ng-c450165409] {
  padding: 4px;
  border: none;
  background-color: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.item-action-button[_ngcontent-ng-c450165409]:hover {
  background-color: var(--hover-color);
  color: var(--accent-color);
}
.item-action-button[_ngcontent-ng-c450165409]   mat-icon[_ngcontent-ng-c450165409] {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
.empty-state[_ngcontent-ng-c450165409] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--secondary-text);
  text-align: center;
}
.empty-state[_ngcontent-ng-c450165409]   mat-icon[_ngcontent-ng-c450165409] {
  font-size: 48px;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}
.empty-state[_ngcontent-ng-c450165409]   p[_ngcontent-ng-c450165409] {
  margin: 0;
  font-size: 14px;
}
.items-list[_ngcontent-ng-c450165409]::-webkit-scrollbar {
  width: 6px;
}
.items-list[_ngcontent-ng-c450165409]::-webkit-scrollbar-track {
  background: var(--secondary-background);
  border-radius: 3px;
}
.items-list[_ngcontent-ng-c450165409]::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 3px;
}
.items-list[_ngcontent-ng-c450165409]::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color-hover);
}
.item-dialog-overlay[_ngcontent-ng-c450165409] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.item-dialog[_ngcontent-ng-c450165409] {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}
.item-dialog-header[_ngcontent-ng-c450165409] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--header-background);
  color: var(--header-text);
  border-radius: 8px 8px 0 0;
}
.item-dialog-header[_ngcontent-ng-c450165409]   h4[_ngcontent-ng-c450165409] {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}
.item-dialog-content[_ngcontent-ng-c450165409] {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
.item-properties[_ngcontent-ng-c450165409] {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.property-row[_ngcontent-ng-c450165409] {
  display: flex;
  padding: 8px 12px;
  background-color: var(--secondary-background);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  gap: 12px;
}
.property-row.nested[_ngcontent-ng-c450165409] {
  background-color: var(--card-background);
}
.property-label[_ngcontent-ng-c450165409] {
  font-weight: 600;
  color: var(--secondary-text);
  min-width: 140px;
  flex-shrink: 0;
  font-size: 13px;
}
.property-value[_ngcontent-ng-c450165409] {
  color: var(--primary-text);
  word-break: break-word;
  font-size: 13px;
}
.item-dialog-content[_ngcontent-ng-c450165409]   pre[_ngcontent-ng-c450165409] {
  margin: 0;
  font-size: 12px;
  color: var(--primary-text);
  white-space: pre-wrap;
  word-break: break-word;
  background-color: var(--secondary-background);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
.item-dialog-actions[_ngcontent-ng-c450165409] {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background-color: var(--secondary-background);
  border-radius: 0 0 8px 8px;
}
.dialog-button[_ngcontent-ng-c450165409] {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  background-color: var(--accent-color);
  color: var(--header-text);
}
.dialog-button[_ngcontent-ng-c450165409]:hover {
  background-color: var(--accent-color-hover);
}
.dialog-button.secondary[_ngcontent-ng-c450165409] {
  background-color: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
}
.dialog-button.secondary[_ngcontent-ng-c450165409]:hover {
  background-color: var(--hover-color);
}
.dialog-button[_ngcontent-ng-c450165409]   mat-icon[_ngcontent-ng-c450165409] {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
@media (max-width: 768px) {
  .clipboard-container[_ngcontent-ng-c450165409] {
    width: 90vw;
    max-width: 400px;
    max-height: 70vh;
  }
  .item-dialog[_ngcontent-ng-c450165409] {
    width: 95%;
    max-height: 85vh;
  }
}
@media (max-width: 480px) {
  .clipboard-container[_ngcontent-ng-c450165409] {
    width: 95vw;
    max-height: 80vh;
  }
  .section-tab[_ngcontent-ng-c450165409] {
    font-size: 11px;
    padding: 4px 8px;
  }
  .action-button[_ngcontent-ng-c450165409] {
    font-size: 11px;
    padding: 4px 6px;
  }
}
/*# sourceMappingURL=/clipboard.component.css.map */</style><style ng-app-id="ng">.mat-mdc-icon-button{-webkit-user-select:none;user-select:none;display:inline-block;position:relative;box-sizing:border-box;border:none;outline:none;background-color:rgba(0,0,0,0);fill:currentColor;color:inherit;text-decoration:none;cursor:pointer;z-index:0;overflow:visible;border-radius:50%;flex-shrink:0;text-align:center;width:var(--mdc-icon-button-state-layer-size, 40px);height:var(--mdc-icon-button-state-layer-size, 40px);padding:calc(calc(var(--mdc-icon-button-state-layer-size, 40px) - var(--mdc-icon-button-icon-size, 24px)) / 2);font-size:var(--mdc-icon-button-icon-size, 24px);color:var(--mdc-icon-button-icon-color, var(--mat-sys-on-surface-variant));-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-icon-button .mat-mdc-button-ripple,.mat-mdc-icon-button .mat-mdc-button-persistent-ripple,.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-icon-button .mat-mdc-button-ripple{overflow:hidden}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{content:"";opacity:0}.mat-mdc-icon-button .mdc-button__label,.mat-mdc-icon-button .mat-icon{z-index:1;position:relative}.mat-mdc-icon-button .mat-focus-indicator{top:0;left:0;right:0;bottom:0;position:absolute}.mat-mdc-icon-button:focus>.mat-focus-indicator::before{content:""}.mat-mdc-icon-button .mat-ripple-element{background-color:var(--mat-icon-button-ripple-color, color-mix(in srgb, var(--mat-sys-on-surface-variant) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-icon-button-state-layer-color, var(--mat-sys-on-surface-variant))}.mat-mdc-icon-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-icon-button-disabled-state-layer-color, var(--mat-sys-on-surface-variant))}.mat-mdc-icon-button:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-icon-button.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-icon-button.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-icon-button.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-icon-button:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-icon-button .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-icon-button-touch-target-display, block)}.mat-mdc-icon-button._mat-animation-noopable{transition:none !important;animation:none !important}.mat-mdc-icon-button[disabled],.mat-mdc-icon-button.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mdc-icon-button-disabled-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent))}.mat-mdc-icon-button.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-icon-button img,.mat-mdc-icon-button svg{width:var(--mdc-icon-button-icon-size, 24px);height:var(--mdc-icon-button-icon-size, 24px);vertical-align:baseline}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple{border-radius:50%}.mat-mdc-icon-button[hidden]{display:none}.mat-mdc-icon-button.mat-unthemed:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-primary:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-accent:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-warn:not(.mdc-ripple-upgraded):focus::before{background:rgba(0,0,0,0);opacity:1}
</style><style ng-app-id="ng">@media(forced-colors: active){.mat-mdc-button:not(.mdc-button--outlined),.mat-mdc-unelevated-button:not(.mdc-button--outlined),.mat-mdc-raised-button:not(.mdc-button--outlined),.mat-mdc-outlined-button:not(.mdc-button--outlined),.mat-mdc-icon-button.mat-mdc-icon-button,.mat-mdc-outlined-button .mdc-button__ripple{outline:solid 1px}}
</style><style ng-app-id="ng">

[_nghost-ng-c1347709916] {
  display: contents;
}
.toggle-container[_ngcontent-ng-c1347709916] {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 10001;
}
.guide-toggle-btn[_ngcontent-ng-c1347709916] {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color, #1976d2);
  color: white;
  cursor: grab;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: background 0.3s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.guide-toggle-btn[_ngcontent-ng-c1347709916]:hover {
  background: var(--primary-hover, #1565c0);
  transform: scale(1.05);
}
.guide-toggle-btn[_ngcontent-ng-c1347709916]:active {
  cursor: grabbing;
}
.guide-toggle-btn.active[_ngcontent-ng-c1347709916] {
  background: var(--success-color, #4caf50);
  animation: _ngcontent-ng-c1347709916_pulse-glow 2s infinite;
}
@keyframes _ngcontent-ng-c1347709916_pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.6);
  }
}
.guide-toggle-btn[_ngcontent-ng-c1347709916]   mat-icon[_ngcontent-ng-c1347709916] {
  font-size: 28px;
  width: 28px;
  height: 28px;
}
.contextual-panel[_ngcontent-ng-c1347709916] {
  position: fixed;
  top: 100px;
  left: 24px;
  width: 340px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 150px);
  background: var(--surface-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: _ngcontent-ng-c1347709916_slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 10001;
}
@keyframes _ngcontent-ng-c1347709916_slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.contextual-panel.minimized[_ngcontent-ng-c1347709916] {
  width: auto;
  min-width: 180px;
}
.panel-header[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 10px 14px;
  background: var(--primary-color, #1976d2);
  color: white;
  cursor: grab;
}
.panel-header[_ngcontent-ng-c1347709916]:active {
  cursor: grabbing;
}
.header-left[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-icon[_ngcontent-ng-c1347709916] {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.page-name[_ngcontent-ng-c1347709916] {
  font-size: 14px;
  font-weight: 500;
}
.header-actions[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 2px;
}
.header-btn[_ngcontent-ng-c1347709916] {
  width: 28px;
  height: 28px;
  line-height: 28px;
  color: rgba(255, 255, 255, 0.9);
}
.header-btn[_ngcontent-ng-c1347709916]:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}
.header-btn[_ngcontent-ng-c1347709916]   mat-icon[_ngcontent-ng-c1347709916] {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
.close-btn[_ngcontent-ng-c1347709916]:hover {
  background: rgba(255, 0, 0, 0.2);
}
.panel-content[_ngcontent-ng-c1347709916] {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.no-actions[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: var(--text-tertiary, #888);
  font-size: 13px;
}
.no-actions[_ngcontent-ng-c1347709916]   mat-icon[_ngcontent-ng-c1347709916] {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
.guide-section[_ngcontent-ng-c1347709916] {
  border-bottom: 1px solid var(--border-light, #f0f0f0);
}
.guide-section[_ngcontent-ng-c1347709916]:last-child {
  border-bottom: none;
}
.section-header[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.section-header[_ngcontent-ng-c1347709916]:hover {
  background: var(--hover-bg, #f5f5f5);
}
.section-header.expanded[_ngcontent-ng-c1347709916] {
  background: var(--primary-light, #e3f2fd);
}
.section-icon[_ngcontent-ng-c1347709916] {
  color: var(--primary-color, #1976d2);
  font-size: 22px;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.section-title[_ngcontent-ng-c1347709916] {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #333);
}
.section-chevron[_ngcontent-ng-c1347709916] {
  color: var(--text-tertiary, #888);
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.section-content[_ngcontent-ng-c1347709916] {
  padding: 0 0 8px 0;
  animation: _ngcontent-ng-c1347709916_expandIn 0.2s ease;
}
@keyframes _ngcontent-ng-c1347709916_expandIn {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}
.guide-subsection[_ngcontent-ng-c1347709916] {
  margin-left: 12px;
  border-left: 2px solid var(--border-light, #e0e0e0);
}
.subsection-header[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}
.subsection-header[_ngcontent-ng-c1347709916]:hover {
  background: var(--hover-bg, #fafafa);
}
.subsection-header.expanded[_ngcontent-ng-c1347709916] {
  background: var(--primary-extra-light, #f3f9ff);
}
.subsection-icon[_ngcontent-ng-c1347709916] {
  color: var(--text-secondary, #666);
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.subsection-title[_ngcontent-ng-c1347709916] {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #555);
}
.subsection-chevron[_ngcontent-ng-c1347709916] {
  color: var(--text-tertiary, #aaa);
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.subsection-actions[_ngcontent-ng-c1347709916] {
  padding: 4px 0 4px 16px;
}
.section-actions[_ngcontent-ng-c1347709916] {
  padding: 4px 0 4px 8px;
}
.action-group[_ngcontent-ng-c1347709916] {
  margin-bottom: 4px;
}
.group-header[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--primary-color, #1976d2);
  letter-spacing: 0.5px;
}
.group-icon[_ngcontent-ng-c1347709916] {
  font-size: 14px;
  width: 14px;
  height: 14px;
}
.group-actions[_ngcontent-ng-c1347709916] {
  display: flex;
  flex-direction: column;
}
.action-button[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  width: 100%;
  border-radius: 6px;
  margin: 1px 0;
}
.action-button[_ngcontent-ng-c1347709916]:hover, 
.action-button.selected[_ngcontent-ng-c1347709916] {
  background: var(--primary-light, #e3f2fd);
}
.action-button.has-execute[_ngcontent-ng-c1347709916]:hover {
  background: var(--success-bg, #e8f5e9);
}
.action-icon[_ngcontent-ng-c1347709916] {
  color: var(--primary-color, #1976d2);
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.action-button.has-execute[_ngcontent-ng-c1347709916]   .action-icon[_ngcontent-ng-c1347709916] {
  color: var(--success-color, #4caf50);
}
.action-text[_ngcontent-ng-c1347709916] {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.action-label[_ngcontent-ng-c1347709916] {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary, #333);
}
.action-description[_ngcontent-ng-c1347709916] {
  font-size: 10px;
  color: var(--text-tertiary, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.action-arrow[_ngcontent-ng-c1347709916] {
  color: var(--success-color, #4caf50);
  font-size: 16px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.hint-bar[_ngcontent-ng-c1347709916] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--warning-bg, #fff8e1);
  border-top: 1px solid var(--border-color, #e0e0e0);
  font-size: 12px;
  color: var(--text-secondary, #666);
}
.hint-bar[_ngcontent-ng-c1347709916]   mat-icon[_ngcontent-ng-c1347709916] {
  color: var(--warning-color, #f9a825);
  font-size: 16px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
@media (max-width: 480px) {
  .toggle-container[_ngcontent-ng-c1347709916] {
    bottom: 16px;
    left: 16px;
  }
  .contextual-panel[_ngcontent-ng-c1347709916] {
    top: auto;
    bottom: 80px;
    left: 16px;
    width: calc(100vw - 32px);
    max-height: 50vh;
  }
  .guide-toggle-btn[_ngcontent-ng-c1347709916] {
    width: 48px;
    height: 48px;
  }
  .guide-toggle-btn[_ngcontent-ng-c1347709916]   mat-icon[_ngcontent-ng-c1347709916] {
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
}
/*# sourceMappingURL=/contextual-guide-panel.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c1477014605] {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
form[_ngcontent-ng-c1477014605] {
  background-color: var(--card-background);
  color: var(--primary-text);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  gap: 0;
  padding: 0;
}
.form-header[_ngcontent-ng-c1477014605] {
  flex-shrink: 0;
  margin: 0;
  padding: 20px 20px 10px 20px;
  font-size: 1.5em;
  font-weight: bold;
}
.form-content[_ngcontent-ng-c1477014605] {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  min-height: 0;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  clip-path: none;
}
.form-content[_ngcontent-ng-c1477014605]::-webkit-scrollbar {
  width: 8px;
}
.form-content[_ngcontent-ng-c1477014605]::-webkit-scrollbar-track {
  background: transparent;
}
.form-content[_ngcontent-ng-c1477014605]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color, #ccc);
  border-radius: 4px;
  transition: background 0.3s ease;
}
.form-content[_ngcontent-ng-c1477014605]::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color, #999);
}
.form-content[_ngcontent-ng-c1477014605] {
  scrollbar-color: var(--border-color, #ccc) transparent;
  scrollbar-width: thin;
}
.form-actions[_ngcontent-ng-c1477014605] {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--card-background);
  min-height: 60px;
  align-items: center;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
.form-group[_ngcontent-ng-c1477014605] {
  border: none;
  padding: 0;
  margin: 0 0 20px 0;
  flex-shrink: 0;
  position: relative;
}
.group-title[_ngcontent-ng-c1477014605] {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.form-layout-row[_ngcontent-ng-c1477014605] {
  display: flex;
  flex-wrap: nowrap;
  gap: 15px;
  overflow-x: auto;
}
.form-layout-column[_ngcontent-ng-c1477014605] {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-layout-grid[_ngcontent-ng-c1477014605] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.form-layout-reactive[_ngcontent-ng-c1477014605] {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.form-field-layout-row[_ngcontent-ng-c1477014605] {
  flex: 0 0 auto;
  width: 200px;
}
.form-field-layout-column[_ngcontent-ng-c1477014605] {
  width: 100%;
}
.form-field-layout-grid[_ngcontent-ng-c1477014605] {
  width: 100%;
}
.form-field-layout-reactive[_ngcontent-ng-c1477014605] {
  flex: 1 1 calc(50% - 7.5px);
}
.form-field-layout-column[_ngcontent-ng-c1477014605], 
.form-field-layout-grid[_ngcontent-ng-c1477014605], 
.form-field-layout-row[_ngcontent-ng-c1477014605], 
.form-field-layout-reactive[_ngcontent-ng-c1477014605] {
  position: relative;
}
button[_ngcontent-ng-c1477014605] {
  padding: 10px 20px;
  font-size: 16px;
  color: var(--header-text);
  background-color: var(--accent-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
}
button[_ngcontent-ng-c1477014605]:hover {
  background-color: var(--accent-color-hover);
}
button[type=button][_ngcontent-ng-c1477014605] {
  background-color: #f44336;
}
button[type=button][_ngcontent-ng-c1477014605]:hover {
  background-color: #d32f2f;
}
.error-message[_ngcontent-ng-c1477014605] {
  color: #f44336;
  font-size: 0.8em;
  margin-top: 5px;
}
.field-wrapper[_ngcontent-ng-c1477014605] {
  position: relative;
}
.field-tooltip[_ngcontent-ng-c1477014605] {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  padding: 10px 14px;
  background-color: #333;
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 6px;
  width: 280px;
  max-width: 90vw;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  white-space: normal;
  word-wrap: break-word;
}
.field-tooltip[_ngcontent-ng-c1477014605]::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 20px;
  border: 6px solid transparent;
  border-top-color: #333;
}
.field-wrapper[_ngcontent-ng-c1477014605]:hover   .field-tooltip[_ngcontent-ng-c1477014605] {
  display: block;
}
@media (max-width: 900px) {
  .form-layout-grid[_ngcontent-ng-c1477014605] {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-field-layout-reactive[_ngcontent-ng-c1477014605] {
    flex: 1 1 calc(50% - 7.5px);
  }
}
@media (max-width: 600px) {
  .form-layout-row[_ngcontent-ng-c1477014605], 
   .form-layout-reactive[_ngcontent-ng-c1477014605], 
   .form-layout-grid[_ngcontent-ng-c1477014605] {
    flex-direction: column;
    grid-template-columns: 1fr;
  }
  .form-field-layout-row[_ngcontent-ng-c1477014605], 
   .form-field-layout-reactive[_ngcontent-ng-c1477014605] {
    flex: 1 1 100%;
    width: 100%;
  }
  .form-actions[_ngcontent-ng-c1477014605] {
    flex-wrap: wrap;
  }
  button[_ngcontent-ng-c1477014605] {
    flex: 1 1 calc(50% - 5px);
    min-width: 100px;
  }
}
/*# sourceMappingURL=/rf-reactive-form.component.css.map */</style><style ng-app-id="ng">

.clipboard-form-container[_ngcontent-ng-c1413445369] {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-background);
  margin-bottom: 16px;
  box-shadow: var(--card-shadow);
}
.clipboard-header[_ngcontent-ng-c1413445369] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 2px solid var(--border-color);
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: background-color 0.2s ease;
  background-color: var(--secondary-background);
}
.clipboard-header[_ngcontent-ng-c1413445369]:hover {
  background-color: var(--hover-color);
}
.header-content[_ngcontent-ng-c1413445369] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.clipboard-header[_ngcontent-ng-c1413445369]   h3[_ngcontent-ng-c1413445369] {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-text);
}
.item-count[_ngcontent-ng-c1413445369] {
  font-size: 12px;
  color: var(--primary-text);
  background-color: var(--accent-color-shadow);
  padding: 2px 8px;
  border-radius: 12px;
}
.clipboard-actions[_ngcontent-ng-c1413445369] {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--secondary-background);
}
.add-to-clipboard-btn[_ngcontent-ng-c1413445369] {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.add-to-clipboard-btn[_ngcontent-ng-c1413445369]:hover:not(:disabled) {
  background-color: var(--accent-color-hover);
}
.add-to-clipboard-btn[_ngcontent-ng-c1413445369]:disabled {
  background-color: var(--secondary-background);
  color: var(--secondary-text);
  cursor: not-allowed;
  border: 1px solid var(--border-color);
}
.collapse-btn[_ngcontent-ng-c1413445369] {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-text);
}
.collapse-icon[_ngcontent-ng-c1413445369] {
  font-size: 12px;
  transition: transform 0.2s ease;
}
.collapse-btn.collapsed[_ngcontent-ng-c1413445369]   .collapse-icon[_ngcontent-ng-c1413445369] {
  transform: rotate(-90deg);
}
.clipboard-list[_ngcontent-ng-c1413445369] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
}
.clipboard-item[_ngcontent-ng-c1413445369] {
  padding: 8px 12px;
  background-color: var(--primary-background);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition: all 0.2s ease;
  color: var(--primary-text);
}
.clipboard-item[_ngcontent-ng-c1413445369]:hover {
  background-color: var(--secondary-background);
  border-color: var(--accent-color);
  color: var(--accent-color);
}
.clipboard-item[_ngcontent-ng-c1413445369]:active {
  background-color: var(--accent-color-shadow);
}
.empty-state[_ngcontent-ng-c1413445369] {
  padding: 16px;
  text-align: center;
  color: var(--secondary-text);
  font-size: 12px;
}
/*# sourceMappingURL=/clipboard-form.component.css.map */</style><style ng-app-id="ng">

.rf-value-select[_ngcontent-ng-c437257282] {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dialog-overlay[_ngcontent-ng-c437257282] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog-content[_ngcontent-ng-c437257282] {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.dialog-content[_ngcontent-ng-c437257282]   h3[_ngcontent-ng-c437257282] {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}
.dialog-content[_ngcontent-ng-c437257282]   p[_ngcontent-ng-c437257282] {
  margin: 0 0 16px 0;
  color: #666;
}
.form-group[_ngcontent-ng-c437257282] {
  margin-bottom: 16px;
}
.form-group[_ngcontent-ng-c437257282]   label[_ngcontent-ng-c437257282] {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 14px;
}
.input-field[_ngcontent-ng-c437257282] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}
.input-field[_ngcontent-ng-c437257282]:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}
.dialog-actions[_ngcontent-ng-c437257282] {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
.save-btn[_ngcontent-ng-c437257282] {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.save-btn[_ngcontent-ng-c437257282]:hover:not(:disabled) {
  background: #45a049;
}
.save-btn[_ngcontent-ng-c437257282]:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.delete-btn-confirm[_ngcontent-ng-c437257282] {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.delete-btn-confirm[_ngcontent-ng-c437257282]:hover {
  background: #da190b;
}
.cancel-btn[_ngcontent-ng-c437257282] {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.cancel-btn[_ngcontent-ng-c437257282]:hover {
  background: #e0e0e0;
}
.error-message[_ngcontent-ng-c437257282] {
  color: #f44336;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  background: #ffebee;
  border-radius: 4px;
  border-left: 3px solid #f44336;
}
.loading-message[_ngcontent-ng-c437257282] {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1565c0;
  font-size: 14px;
  margin-bottom: 16px;
}
.spinner[_ngcontent-ng-c437257282] {
  width: 20px;
  height: 20px;
  border: 2px solid #bbdefb;
  border-top-color: #1565c0;
  border-radius: 50%;
  animation: _ngcontent-ng-c437257282_spin 0.8s linear infinite;
}
@keyframes _ngcontent-ng-c437257282_spin {
  to {
    transform: rotate(360deg);
  }
}
.delete-btn-confirm[_ngcontent-ng-c437257282]:disabled, 
.cancel-btn[_ngcontent-ng-c437257282]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/*# sourceMappingURL=/rf-value-select.component.css.map */</style><style ng-app-id="ng">

  .transparent-backdrop {
  background-color: transparent !important;
  pointer-events: none !important;
}
  .cdk-overlay-container {
  z-index: 999999 !important;
}
  .cdk-overlay-pane {
  z-index: 1000000 !important;
  pointer-events: auto !important;
}
  .cdk-overlay-backdrop {
  z-index: 999998 !important;
  pointer-events: none !important;
}
.dropdown-container[_ngcontent-ng-c2683223691] {
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
}
.dropdown-container[_ngcontent-ng-c2683223691]   label[_ngcontent-ng-c2683223691] {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.dropdown-input[_ngcontent-ng-c2683223691] {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--primary-background);
  color: var(--primary-text);
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 38px;
  position: relative;
  z-index: 1;
}
.dropdown-input[_ngcontent-ng-c2683223691]:hover {
  border-color: var(--accent-color);
}
.dropdown-input.disabled[_ngcontent-ng-c2683223691] {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--secondary-background);
}
.dropdown-input.disabled[_ngcontent-ng-c2683223691]:hover {
  border-color: var(--border-color);
}
.dropdown-input.open[_ngcontent-ng-c2683223691], 
.dropdown-input[_ngcontent-ng-c2683223691]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 0.2rem var(--accent-color-shadow);
}
.dropdown-options[_ngcontent-ng-c2683223691] {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: var(--card-shadow);
  min-width: 100%;
  visibility: visible;
  opacity: 1;
  display: block;
  padding: 0;
  margin: 0;
}
.search-container[_ngcontent-ng-c2683223691] {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border-color);
}
.search-container[_ngcontent-ng-c2683223691]   input[_ngcontent-ng-c2683223691] {
  flex: 1;
  padding: 0.75rem;
  border: none;
  box-sizing: border-box;
  background-color: var(--primary-background);
  color: var(--primary-text);
}
.search-container[_ngcontent-ng-c2683223691]   input[_ngcontent-ng-c2683223691]:focus {
  outline: none;
  background-color: var(--secondary-background);
}
.search-mode-toggle[_ngcontent-ng-c2683223691] {
  padding: 0.5rem 0.75rem;
  border: none;
  border-left: 1px solid var(--border-color);
  background-color: var(--secondary-background);
  color: var(--primary-text);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  min-width: 40px;
}
.search-mode-toggle[_ngcontent-ng-c2683223691]:hover {
  background-color: var(--accent-color);
  color: var(--header-text);
}
.search-mode-toggle.or-mode[_ngcontent-ng-c2683223691] {
  background-color: var(--accent-color);
  color: var(--header-text);
}
.dropdown-option[_ngcontent-ng-c2683223691] {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--primary-text);
  line-height: 1.4;
  display: flex;
  align-items: center;
}
.dropdown-option[_ngcontent-ng-c2683223691]:hover {
  background-color: var(--menu-item-hover-bg-color);
}
.dropdown-option.selected[_ngcontent-ng-c2683223691] {
  background-color: var(--accent-color);
  color: var(--header-text);
}
.no-options[_ngcontent-ng-c2683223691] {
  padding: 0.5rem 0.75rem;
  color: var(--secondary-text);
  text-align: center;
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-new-option[_ngcontent-ng-c2683223691] {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--primary-text);
  border-top: 1px solid var(--border-color);
  line-height: 1.4;
}
.add-new-option[_ngcontent-ng-c2683223691]:hover {
  background-color: var(--menu-item-hover-bg-color);
}
.add-new-option.delete-option[_ngcontent-ng-c2683223691] {
  color: var(--error-color, #dc3545);
}
.add-new-option.delete-option[_ngcontent-ng-c2683223691]   .plus-icon[_ngcontent-ng-c2683223691] {
  color: var(--error-color, #dc3545);
}
.add-new-option.delete-option[_ngcontent-ng-c2683223691]:hover {
  background-color: rgba(220, 53, 69, 0.1);
}
.dropdown-options[_ngcontent-ng-c2683223691]::-webkit-scrollbar {
  width: 8px;
}
.dropdown-options[_ngcontent-ng-c2683223691]::-webkit-scrollbar-track {
  background: var(--secondary-background);
}
.dropdown-options[_ngcontent-ng-c2683223691]::-webkit-scrollbar-thumb {
  background: var(--secondary-text);
  border-radius: 4px;
}
.dropdown-options[_ngcontent-ng-c2683223691]::-webkit-scrollbar-thumb:hover {
  background: var(--primary-text);
}
.plus-icon[_ngcontent-ng-c2683223691] {
  margin-right: 8px;
  font-weight: bold;
  color: var(--accent-color);
}
.label-container[_ngcontent-ng-c2683223691] {
  display: flex;
  align-items: center;
}
.question-icon[_ngcontent-ng-c2683223691] {
  margin-left: 5px;
  cursor: pointer;
  color: var(--accent-color);
}
.question-icon[_ngcontent-ng-c2683223691]:hover {
  color: var(--accent-color-hover);
}
/*# sourceMappingURL=/searchable-select-input.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c818257060] {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}
.file-table-container[_ngcontent-ng-c818257060] {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.file-table-container[_ngcontent-ng-c818257060]   app-table[_ngcontent-ng-c818257060] {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.error-message[_ngcontent-ng-c818257060] {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
  margin-bottom: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}
.loading-indicator[_ngcontent-ng-c818257060] {
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
}
app-table[_ngcontent-ng-c818257060] {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
/*# sourceMappingURL=/rf-file-table.component.css.map */</style><style ng-app-id="ng">

.table-wrapper[_ngcontent-ng-c661839562] {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  overflow: visible;
  position: relative;
}
.table-wrapper.resizing[_ngcontent-ng-c661839562] {
  -webkit-user-select: none;
  user-select: none;
}
.table-controls[_ngcontent-ng-c661839562] {
  flex: 0 0 auto;
  padding: 12px 10px;
  background-color: var(--secondary-background, #f9f9f9);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  overflow: visible;
  position: relative;
  z-index: 10;
}
.table-controls[_ngcontent-ng-c661839562]   button.guide-active[_ngcontent-ng-c661839562], 
.table-controls[_ngcontent-ng-c661839562]   button.guide-highlight[_ngcontent-ng-c661839562] {
  position: relative;
  z-index: 100;
  outline: none !important;
  box-shadow: inset 0 0 0 3px rgba(25, 118, 210, 0.8) !important;
}
.table-controls[_ngcontent-ng-c661839562]   button.guide-active.guide-pulse[_ngcontent-ng-c661839562] {
  animation: _ngcontent-ng-c661839562_guide-button-pulse-inset 1.5s ease-in-out infinite !important;
}
@keyframes _ngcontent-ng-c661839562_guide-button-pulse-inset {
  0% {
    box-shadow: inset 0 0 0 3px rgba(25, 118, 210, 1);
  }
  50% {
    box-shadow: inset 0 0 0 5px rgba(25, 118, 210, 0.5), inset 0 0 15px rgba(25, 118, 210, 0.3);
  }
  100% {
    box-shadow: inset 0 0 0 3px rgba(25, 118, 210, 1);
  }
}
.table-controls[_ngcontent-ng-c661839562]:empty {
  display: none;
}
.search-bar[_ngcontent-ng-c661839562] {
  padding: 12px;
  background-color: var(--secondary-background, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}
.global-search[_ngcontent-ng-c661839562] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--primary-background, white);
  color: var(--primary-text, #333);
}
.table[_ngcontent-ng-c661839562] {
  border-collapse: collapse;
  font-size: 14px;
  table-layout: auto;
  width: auto;
}
th[_ngcontent-ng-c661839562], 
td[_ngcontent-ng-c661839562] {
  border: 1px solid var(--border-color, #ddd);
  padding: 8px 12px;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  color: var(--primary-text, #333);
}
.table-header[_ngcontent-ng-c661839562] {
  background-color: var(--secondary-background, #f9f9f9);
}
.table-header[_ngcontent-ng-c661839562]   thead[_ngcontent-ng-c661839562]   th[_ngcontent-ng-c661839562] {
  padding: 0;
  text-align: left;
  font-weight: 600;
  color: var(--primary-text, #333);
  border-right: 1px solid var(--border-color, #e0e0e0);
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: background-color 0.2s;
  display: table-cell;
  word-break: break-word;
  position: relative;
  box-sizing: border-box;
  background-color: var(--secondary-background, #f9f9f9);
}
.table-header[_ngcontent-ng-c661839562]   thead[_ngcontent-ng-c661839562]   th[_ngcontent-ng-c661839562]:hover {
  background-color: var(--hover-color, #f0f0f0);
}
.sortable-header[_ngcontent-ng-c661839562] {
  position: relative;
  padding: 0;
  -webkit-user-select: none;
  user-select: none;
  display: table-cell;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.header-content[_ngcontent-ng-c661839562] {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  gap: 8px;
  flex: 1;
  -webkit-user-select: none;
  user-select: none;
  box-sizing: border-box;
}
.header-content[_ngcontent-ng-c661839562]   span[_ngcontent-ng-c661839562]:first-child {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sort-indicator[_ngcontent-ng-c661839562] {
  font-size: 12px;
  color: var(--secondary-text, #666);
  margin-left: 4px;
  flex-shrink: 0;
}
.column-filter[_ngcontent-ng-c661839562] {
  display: block;
  width: calc(100% - 16px);
  padding: 4px 8px;
  margin: 4px 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 3px;
  font-size: 12px;
  box-sizing: border-box;
  background-color: var(--primary-background, white);
  color: var(--primary-text, #333);
}
.column-filter[_ngcontent-ng-c661839562]:focus {
  outline: none;
  border-color: var(--accent-color, #2196f3);
  box-shadow: 0 0 4px var(--accent-color-shadow, rgba(33, 150, 243, 0.3));
}
.filter-logic-toggle[_ngcontent-ng-c661839562] {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  color: #666;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-left: 4px;
  width: 100%;
}
.filter-logic-toggle[_ngcontent-ng-c661839562]:hover {
  background-color: #e8e8e8;
  border-color: #999;
}
.filter-logic-toggle.active[_ngcontent-ng-c661839562] {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}
.filter-logic-toggle.active[_ngcontent-ng-c661839562]:hover {
  background-color: #2980b9;
  border-color: #1f618d;
}
.resize-handle[_ngcontent-ng-c661839562] {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s ease;
  -webkit-user-select: none;
  user-select: none;
  z-index: 10;
  flex-shrink: 0;
}
.resize-handle[_ngcontent-ng-c661839562]:hover {
  background-color: var(--accent-color, #2196f3);
}
.resize-handle.resizing[_ngcontent-ng-c661839562] {
  background-color: var(--accent-color-hover, #1976d2);
  box-shadow: inset 0 0 4px var(--accent-color-shadow, rgba(25, 118, 210, 0.5));
}
.header-container[_ngcontent-ng-c661839562] {
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 2px solid var(--border-color, #e0e0e0);
  flex-shrink: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.header-container[_ngcontent-ng-c661839562]::-webkit-scrollbar {
  display: none;
}
.table-container[_ngcontent-ng-c661839562] {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
}
.table-wrapper[_ngcontent-ng-c661839562] {
  position: relative;
}
.table-wrapper.resizing[_ngcontent-ng-c661839562] {
  -webkit-user-select: none;
  user-select: none;
}
.viewport[_ngcontent-ng-c661839562] {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  scrollbar-width: auto;
  -ms-overflow-style: auto;
}
.viewport[_ngcontent-ng-c661839562]::-webkit-scrollbar {
  display: block;
  width: 8px;
  height: 8px;
}
.viewport[_ngcontent-ng-c661839562]::-webkit-scrollbar-track {
  background: var(--secondary-background, #f1f1f1);
}
.viewport[_ngcontent-ng-c661839562]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color, #888);
  border-radius: 4px;
}
.viewport[_ngcontent-ng-c661839562]::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-text, #555);
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr[_ngcontent-ng-c661839562] {
  display: table-row;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  transition: background-color 0.15s;
  background-color: var(--primary-background, white);
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr[_ngcontent-ng-c661839562]:hover {
  background-color: var(--hover-color, #f9f9f9);
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr.selected[_ngcontent-ng-c661839562] {
  border-color: #2196f3;
  background-color: var(--accent-color-shadow, #e3f2fd) !important;
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr.external-hover[_ngcontent-ng-c661839562] {
  background-color: #fff3cd;
  border-left: 3px solid #ffa500;
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr.dragged[_ngcontent-ng-c661839562] {
  opacity: 0.6;
  background-color: var(--accent-color-shadow, #fff3cd);
}
.drag-hover-top[_ngcontent-ng-c661839562] {
  border-top: 2px solid var(--accent-color, #ff008c);
  box-shadow: inset 0 1px 0 var(--accent-color, #007bff);
}
.table-body[_ngcontent-ng-c661839562]   tbody[_ngcontent-ng-c661839562]   tr.ghost-row[_ngcontent-ng-c661839562] {
  background-color: var(--accent-color-shadow, #f0f8ff);
}
.table-cell[_ngcontent-ng-c661839562] {
  padding: 12px;
  border-right: 1px solid var(--border-color, #e0e0e0);
  display: table-cell;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
  overflow-wrap: break-word;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  color: var(--primary-text, #333);
}
.empty-state[_ngcontent-ng-c661839562] {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--secondary-text, #999);
  font-size: 16px;
}
.selection-info[_ngcontent-ng-c661839562] {
  padding: 12px;
  background-color: var(--accent-color-shadow, #e3f2fd);
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--primary-text, #333);
  min-height: 50px;
}
.delete-btn[_ngcontent-ng-c661839562], 
.clear-btn[_ngcontent-ng-c661839562] {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}
.delete-btn[_ngcontent-ng-c661839562] {
  background-color: #f44336;
  color: white;
}
.delete-btn[_ngcontent-ng-c661839562]:hover {
  background-color: #d32f2f;
}
.clear-btn[_ngcontent-ng-c661839562] {
  background-color: var(--secondary-text, #757575);
  color: var(--primary-background, white);
}
.clear-btn[_ngcontent-ng-c661839562]:hover {
  background-color: var(--primary-text, #616161);
}
/*# sourceMappingURL=/table.component.css.map */</style><style ng-app-id="ng">/* src/app/shared/reactive-form/refactored/input-fields/form-input/rf-form-input.component.css */
:host {
  display: block;
  font-family: Arial, sans-serif;
  max-width: 100%;
  margin: 0 auto;
}
.form-input {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: 100%;
}
.label-container {
  margin-bottom: 0.5rem;
}
.form-input .field-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.form-input-element {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--primary-background);
  color: var(--primary-text);
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input-element:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-shadow);
}
.form-input-element[readonly] {
  background-color: var(--secondary-background);
  cursor: not-allowed;
}
textarea.form-input-element {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}
/*# sourceMappingURL=/rf-form-input.component.css.map */
</style><style ng-app-id="ng">

[_nghost-ng-c3469192182] {
  display: block;
  width: 100%;
}
.multi-input-container[_ngcontent-ng-c3469192182] {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.label-container[_ngcontent-ng-c3469192182] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.label-container[_ngcontent-ng-c3469192182]   label[_ngcontent-ng-c3469192182] {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.question-icon[_ngcontent-ng-c3469192182] {
  cursor: pointer;
  color: var(--accent-color);
  font-size: 0.875rem;
}
.question-icon[_ngcontent-ng-c3469192182]:hover {
  color: var(--accent-color-hover);
}
.input-values[_ngcontent-ng-c3469192182] {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-value[_ngcontent-ng-c3469192182] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.input-value[_ngcontent-ng-c3469192182]   input[_ngcontent-ng-c3469192182] {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--primary-background);
  color: var(--primary-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-value[_ngcontent-ng-c3469192182]   input[_ngcontent-ng-c3469192182]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-shadow);
}
.input-value[_ngcontent-ng-c3469192182]   input[_ngcontent-ng-c3469192182]::placeholder {
  color: var(--secondary-text);
}
.input-value[_ngcontent-ng-c3469192182]   button[_ngcontent-ng-c3469192182] {
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: transparent;
  color: var(--error-text, #d32f2f);
  border: 1px solid var(--error-text, #d32f2f);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}
.input-value[_ngcontent-ng-c3469192182]   button[_ngcontent-ng-c3469192182]:hover {
  background-color: var(--error-background, #ffebee);
  color: var(--error-text, #c62828);
}
.add-button[_ngcontent-ng-c3469192182] {
  align-self: flex-start;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.add-button[_ngcontent-ng-c3469192182]:hover {
  background-color: var(--accent-color-hover);
}
.add-button[_ngcontent-ng-c3469192182]:active {
  transform: scale(0.98);
}
/*# sourceMappingURL=/multi-text-input.component.css.map */</style><style ng-app-id="ng">

.file-input-wrapper[_ngcontent-ng-c3690393075] {
  margin-bottom: 1rem;
}
.file-input-wrapper[_ngcontent-ng-c3690393075]   .label-container[_ngcontent-ng-c3690393075] {
  margin-bottom: 0.5rem;
}
.file-input-wrapper[_ngcontent-ng-c3690393075]   .field-label[_ngcontent-ng-c3690393075] {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.file-input-container[_ngcontent-ng-c3690393075] {
  border: 2px dashed var(--border-color);
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  color: var(--primary-text);
}
.file-input-container.dragover[_ngcontent-ng-c3690393075] {
  background-color: var(--secondary-background);
  border-color: var(--accent-color);
}
.drop-zone[_ngcontent-ng-c3690393075] {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.file-input-label[_ngcontent-ng-c3690393075] {
  padding: 10px 15px;
  background-color: var(--accent-color);
  color: var(--header-text);
  border-radius: 4px;
  cursor: pointer;
  display: inline-block;
  margin-top: 10px;
}
.file-input[_ngcontent-ng-c3690393075] {
  display: none;
}
.file-info[_ngcontent-ng-c3690393075] {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.file-name[_ngcontent-ng-c3690393075] {
  font-size: 0.9em;
  color: var(--secondary-text);
}
.remove-file[_ngcontent-ng-c3690393075] {
  background-color: transparent;
  color: var(--error-text, #d32f2f);
  border: 1px solid var(--error-text, #d32f2f);
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.remove-file[_ngcontent-ng-c3690393075]:hover {
  background-color: var(--error-background, #ffebee);
  color: var(--error-text, #c62828);
}
.file-input-label[_ngcontent-ng-c3690393075]:hover {
  background-color: var(--accent-color-hover);
}
/*# sourceMappingURL=/file-input.component.css.map */</style><style ng-app-id="ng">

.radio-group[_ngcontent-ng-c2360028039] {
  margin-bottom: 15px;
}
.group-label[_ngcontent-ng-c2360028039] {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 1.1em;
  color: var(--primary-text);
}
.options-container[_ngcontent-ng-c2360028039] {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.option[_ngcontent-ng-c2360028039] {
  position: relative;
}
.radio-group[_ngcontent-ng-c2360028039]   input[type=radio][_ngcontent-ng-c2360028039] {
  display: none;
}
.radio-group[_ngcontent-ng-c2360028039]   label[_ngcontent-ng-c2360028039] {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
  background-color: var(--card-background);
  color: var(--primary-text);
}
.radio-group[_ngcontent-ng-c2360028039]   input[type=radio][_ngcontent-ng-c2360028039]:checked    + label[_ngcontent-ng-c2360028039] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border-color: var(--accent-color);
}
.radio-group[_ngcontent-ng-c2360028039]   label[_ngcontent-ng-c2360028039]:hover {
  background-color: var(--secondary-background);
}
.radio-group[_ngcontent-ng-c2360028039]   input[type=radio][_ngcontent-ng-c2360028039]:checked    + label[_ngcontent-ng-c2360028039]:hover {
  background-color: var(--accent-color-hover);
}
/*# sourceMappingURL=/rf-radio-group.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c3672196454] {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--primary-background);
  color: var(--primary-text);
}
.rf-toggle-menu[_ngcontent-ng-c3672196454] {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 8px;
}
.search-section[_ngcontent-ng-c3672196454] {
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: var(--secondary-background);
  border-bottom: 1px solid var(--border-color);
}
.search-input-wrapper[_ngcontent-ng-c3672196454] {
  position: relative;
  flex: 1;
}
.search-input[_ngcontent-ng-c3672196454] {
  width: 100%;
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-background);
  color: var(--primary-text);
  transition: all 0.2s ease;
}
.search-input[_ngcontent-ng-c3672196454]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-shadow);
}
.search-input[_ngcontent-ng-c3672196454]::placeholder {
  color: var(--secondary-text);
  opacity: 0.6;
}
.clear-search-btn[_ngcontent-ng-c3672196454] {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  color: var(--secondary-text);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.clear-search-btn[_ngcontent-ng-c3672196454]:hover {
  background-color: var(--hover-color);
  color: var(--primary-text);
}
.search-mode-toggle[_ngcontent-ng-c3672196454] {
  min-width: 60px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-background);
  color: var(--primary-text);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.search-mode-toggle[_ngcontent-ng-c3672196454]:hover {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.search-mode-toggle[data-mode=AND][_ngcontent-ng-c3672196454] {
  border-color: var(--accent-color);
  background-color: var(--accent-color);
  color: white;
}
.search-mode-toggle[data-mode=OR][_ngcontent-ng-c3672196454] {
  border-color: var(--warning-background);
  background-color: var(--warning-background);
  color: var(--primary-text);
}
.mode-label[_ngcontent-ng-c3672196454] {
  display: block;
  text-align: center;
}
.menu-list-container[_ngcontent-ng-c3672196454] {
  flex: 1;
  min-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.menu-list-container[_ngcontent-ng-c3672196454]   app-toggle-list-virtual-scroll[_ngcontent-ng-c3672196454] {
  flex: 1;
  min-height: 300px;
}
.no-results[_ngcontent-ng-c3672196454], 
.empty-state[_ngcontent-ng-c3672196454] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
  color: var(--secondary-text);
}
.no-results-icon[_ngcontent-ng-c3672196454], 
.empty-state-icon[_ngcontent-ng-c3672196454] {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.no-results-text[_ngcontent-ng-c3672196454], 
.empty-state-text[_ngcontent-ng-c3672196454] {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--primary-text);
}
.no-results-hint[_ngcontent-ng-c3672196454] {
  font-size: 13px;
  color: var(--secondary-text);
  opacity: 0.8;
}
@media (max-width: 768px) {
  .search-section[_ngcontent-ng-c3672196454] {
    padding: 8px;
  }
  .search-input[_ngcontent-ng-c3672196454] {
    font-size: 13px;
    padding: 6px 28px 6px 10px;
  }
  .search-mode-toggle[_ngcontent-ng-c3672196454] {
    min-width: 50px;
    padding: 6px 12px;
    font-size: 12px;
  }
}
.search-input[_ngcontent-ng-c3672196454]:focus-visible, 
.search-mode-toggle[_ngcontent-ng-c3672196454]:focus-visible, 
.clear-search-btn[_ngcontent-ng-c3672196454]:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}
@keyframes _ngcontent-ng-c3672196454_fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.no-results[_ngcontent-ng-c3672196454], 
.empty-state[_ngcontent-ng-c3672196454] {
  animation: _ngcontent-ng-c3672196454_fadeIn 0.3s ease;
}
/*# sourceMappingURL=/rf-toggle-menu.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c980351347] {
  display: block;
  height: 100%;
  min-height: 300px;
}
.toggle-list[_ngcontent-ng-c980351347] {
  height: 100%;
  min-height: 300px;
}
cdk-virtual-scroll-viewport.toggle-list[_ngcontent-ng-c980351347] {
  height: 100%;
  min-height: 300px;
}
.item-content[_ngcontent-ng-c980351347] {
  padding: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
}
.item-content[_ngcontent-ng-c980351347]:hover {
  background-color: #f0f0f0;
  transform: translateX(5px);
}
.clicked[_ngcontent-ng-c980351347] {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  font-weight: bold;
}
.last-clicked[_ngcontent-ng-c980351347] {
  border-left: 3px solid #007bff;
}
.toggle-icon[_ngcontent-ng-c980351347] {
  margin-right: 8px;
  flex-shrink: 0;
}
.item-text[_ngcontent-ng-c980351347] {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
}
.item-name[_ngcontent-ng-c980351347] {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-subtitle[_ngcontent-ng-c980351347] {
  font-size: 0.75em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.item-content.has-subtitle[_ngcontent-ng-c980351347] {
  min-height: 50px;
  display: flex;
  align-items: center;
}
.highlighted[_ngcontent-ng-c980351347]:hover {
  background-color: #f0f0f0;
}
.level-1[_ngcontent-ng-c980351347] {
  margin-left: 0;
}
.level-2[_ngcontent-ng-c980351347] {
  margin-left: 20px;
}
.level-3[_ngcontent-ng-c980351347] {
  margin-left: 40px;
}
[_ngcontent-ng-c980351347]::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
[_ngcontent-ng-c980351347]::-webkit-scrollbar-track {
  background: #f1f1f1;
}
[_ngcontent-ng-c980351347]::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
[_ngcontent-ng-c980351347]::-webkit-scrollbar-thumb:hover {
  background: #555;
}
/*# sourceMappingURL=/toggle-list-virtual-scroll.component.css.map */</style><style ng-app-id="ng">cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}
</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click","mousedown","keydown","input"],[]);</script>
  <app-root ng-version="19.2.5" _nghost-ng-c3298958394="" ngh="24" ng-server-context="ssg"><router-outlet _ngcontent-ng-c3298958394=""></router-outlet><app-rf-file-page _nghost-ng-c3098161097="" ngh="15"><app-main-layout _ngcontent-ng-c3098161097="" _nghost-ng-c3342727180="" ng-reflect-is-bottom-menu-enabled="true" ng-reflect-is-side-menu-enabled="true" ngh="8"><div _ngcontent-ng-c3342727180="" class="layout-container"><header _ngcontent-ng-c3342727180="" class="header"><div _ngcontent-ng-c3342727180="" class="header-content"><!--container--><h1 _ngcontent-ng-c3342727180="">Jackson Generation</h1><!--container--><app-router-menu _ngcontent-ng-c3098161097="" _nghost-ng-c3178853866="" ng-reflect-layout="row" ngh="9"><nav _ngcontent-ng-c3178853866="" class="router-menu row" ng-reflect-ng-class="row"><div _ngcontent-ng-c3178853866="" class="menu-container"><ul _ngcontent-ng-c3178853866="" class="primary-menu"><li _ngcontent-ng-c3178853866="" class="home-link"><a _ngcontent-ng-c3178853866="" routerlink="/" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link active"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">Files</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permits</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Admin</a></li><!--container--></ul><ul _ngcontent-ng-c3178853866="" class="secondary-menu"><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/file" href="/file" class="active-link" jsaction="click:;">View Files</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/tag-number" href="/tag-number" class="" jsaction="click:;">Create New Tag</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/print" href="/print" class="" jsaction="click:;">Print</a></li><!--container--></ul><!--container--></div><!--container--><!--container--><!--container--></nav></app-router-menu><!--ng-container--></div><div _ngcontent-ng-c3342727180="" class="header-actions"><app-sync-indicator _ngcontent-ng-c3342727180="" _nghost-ng-c990181552="" ngh="1"><div _ngcontent-ng-c990181552="" class="mat-mdc-tooltip-trigger sync-indicator disconnected" tabindex="0" ng-reflect-router-link="/sync-resync" ng-reflect-message="Server disconnected
Click for " jsaction="click:;"><mat-icon _ngcontent-ng-c990181552="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0"> cloud_off </mat-icon><!--container--><!--container--></div><!--container--></app-sync-indicator><app-tour-trigger _ngcontent-ng-c3342727180="" _nghost-ng-c1184412316="" ngh="4"><button _ngcontent-ng-c1184412316="" mat-icon-button="" mattooltip="Help &amp; Tours" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger tour-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Help &amp; Tours" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c1184412316="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c1184412316="" class="" ngh="3"><!--container--></mat-menu></app-tour-trigger><app-theme-toggle _ngcontent-ng-c3342727180="" _nghost-ng-c3074088440="" ngh="5"><button _ngcontent-ng-c3074088440="" class="theme-toggle-button" jsaction="click:;"><span _ngcontent-ng-c3074088440="">🌙</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button></app-theme-toggle></div></header><div _ngcontent-ng-c3342727180="" class="content-wrapper"><div _ngcontent-ng-c3342727180="" class="overlay" jsaction="click:;"></div><nav _ngcontent-ng-c3342727180="" id="leftMenu" class="left-menu" style="width: 400px;"><app-rf-file-left-menu _ngcontent-ng-c3098161097="" _nghost-ng-c1199198902="" ngh="12"><div _ngcontent-ng-c1199198902="" class="file-menu-container"><div _ngcontent-ng-c1199198902="" class="menu-header"><h2 _ngcontent-ng-c1199198902="">Files</h2><div _ngcontent-ng-c1199198902="" class="header-actions"><button _ngcontent-ng-c1199198902="" title="Add New File" class="icon-button add-button" jsaction="click:;"><span _ngcontent-ng-c1199198902="" class="icon">+</span></button><button _ngcontent-ng-c1199198902="" title="Upload Multiple Files" class="icon-button multi-upload-button" jsaction="click:;"><span _ngcontent-ng-c1199198902="" class="icon">📁</span></button><button _ngcontent-ng-c1199198902="" title="Refresh" class="icon-button refresh-button" jsaction="click:;"><span _ngcontent-ng-c1199198902="" class="icon">↻</span></button></div></div><div _ngcontent-ng-c1199198902="" class="file-type-controls"><label _ngcontent-ng-c1199198902="" class="controls-label">File Type:</label><div _ngcontent-ng-c1199198902="" class="file-type-buttons"><button _ngcontent-ng-c1199198902="" class="type-button active" jsaction="click:;">PID</button><button _ngcontent-ng-c1199198902="" class="type-button" jsaction="click:;">Electrical</button><button _ngcontent-ng-c1199198902="" class="type-button" jsaction="click:;">Heat Trace</button><button _ngcontent-ng-c1199198902="" class="type-button" jsaction="click:;">Isometrics</button></div></div><!--container--><!--container--><app-rf-toggle-menu _ngcontent-ng-c1199198902="" _nghost-ng-c3672196454="" ng-reflect-menu-items="[object Object]" ng-reflect-enable-search="true" ng-reflect-search-placeholder="Search files..." ngh="11"><div _ngcontent-ng-c3672196454="" class="rf-toggle-menu"><div _ngcontent-ng-c3672196454="" class="search-section"><div _ngcontent-ng-c3672196454="" class="search-input-wrapper"><input _ngcontent-ng-c3672196454="" type="text" class="search-input" placeholder="Search files..." value="" jsaction="input:;"><!--container--></div><button _ngcontent-ng-c3672196454="" class="search-mode-toggle" title="Match all words" data-mode="AND" jsaction="click:;"><span _ngcontent-ng-c3672196454="" class="mode-label">AND</span></button></div><!--container--><div _ngcontent-ng-c3672196454="" class="menu-list-container"><app-toggle-list-virtual-scroll _ngcontent-ng-c3672196454="" _nghost-ng-c980351347="" ng-reflect-items="[object Object]" ng-reflect-track-last-clicked="true" ng-reflect-track-all-clicked="true" ng-reflect-highlight-on-hover="false" ngh="10"><cdk-virtual-scroll-viewport _ngcontent-ng-c980351347="" class="cdk-virtual-scroll-viewport toggle-list cdk-virtual-scrollable cdk-virtual-scroll-orientation-vertical" ng-reflect-item-size="40" ngh="0"><div class="cdk-virtual-scroll-content-wrapper"><!--bindings={
  "ng-reflect-cdk-virtual-for-track-by": "trackByFn(index, item) {\\n    r"
}--></div><div class="cdk-virtual-scroll-spacer"></div></cdk-virtual-scroll-viewport></app-toggle-list-virtual-scroll><!--container--><!--container--><!--container--></div></div></app-rf-toggle-menu><!--container--></div><!--container--></app-rf-file-left-menu><!--ng-container--></nav><div _ngcontent-ng-c3342727180="" id="resizer" class="resizer" jsaction="mousedown:;"><button _ngcontent-ng-c3342727180="" class="menu-toggle-btn" jsaction="click:;"><i _ngcontent-ng-c3342727180="" class="arrow"></i></button></div><!--container--><div _ngcontent-ng-c3342727180="" class="main-and-footer"><main _ngcontent-ng-c3342727180="" class="main-content"><router-outlet _ngcontent-ng-c3098161097=""></router-outlet><!--container--><!--ng-container--></main><div _ngcontent-ng-c3342727180="" class="footer-resizer" jsaction="mousedown:;"></div><footer _ngcontent-ng-c3342727180="" class="footer" style=""><!--container--><!--ng-container--></footer><!--container--></div></div><div _ngcontent-ng-c3342727180="" class="clipboard-container"><app-clipboard _ngcontent-ng-c3342727180="" _nghost-ng-c450165409="" ngh="6"><div _ngcontent-ng-c450165409="" class="clipboard-wrapper"><div _ngcontent-ng-c450165409="" class="clipboard-icon-wrapper" style="right: 20px; bottom: 20px;" jsaction="mousedown:;click:;"><div _ngcontent-ng-c450165409="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)"><mat-icon _ngcontent-ng-c450165409="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><!--container--></div><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div><app-guide-menu _ngcontent-ng-c3342727180="" ngh="0"><app-contextual-guide-panel _nghost-ng-c1347709916="" ngh="7"><div _ngcontent-ng-c1347709916="" cdkdrag="" class="cdk-drag toggle-container"><button _ngcontent-ng-c1347709916="" cdkdraghandle="" class="mat-mdc-tooltip-trigger cdk-drag-handle guide-toggle-btn" ng-reflect-message="Enable Smart Helper" jsaction="click:;"><mat-icon _ngcontent-ng-c1347709916="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon></button><!--container--></div><!--container--><!--container--></app-contextual-guide-panel></app-guide-menu></div></app-main-layout><app-rf-popup-projection _ngcontent-ng-c3098161097="" _nghost-ng-c3889602632="" ng-reflect-is-open="false" ngh="13"><!--container--></app-rf-popup-projection><app-rf-popup-projection _ngcontent-ng-c3098161097="" _nghost-ng-c3889602632="" ng-reflect-is-open="false" ngh="13"><!--container--></app-rf-popup-projection><app-export-dialog _ngcontent-ng-c3098161097="" _nghost-ng-c2960541796="" ngh="14"><!--container--></app-export-dialog></app-rf-file-page><!--container--><app-print-layout _ngcontent-ng-c3298958394="" ngh="16"><!--container--></app-print-layout><app-global-message _ngcontent-ng-c3298958394="" _nghost-ng-c4038518790="" ngh="17"><!--container--></app-global-message><app-global-context-menu _ngcontent-ng-c3298958394="" ngh="18"><!--container--></app-global-context-menu><app-qr-scanner _ngcontent-ng-c3298958394="" _nghost-ng-c3289982237="" ngh="19"><!--container--></app-qr-scanner><app-brady-printer-manager _ngcontent-ng-c3298958394="" _nghost-ng-c3185598614="" ngh="20"><!--container--></app-brady-printer-manager><app-engraver-manager _ngcontent-ng-c3298958394="" _nghost-ng-c3529731854="" ngh="21"><!--container--></app-engraver-manager><app-wizard-dialog _ngcontent-ng-c3298958394="" _nghost-ng-c1981356277="" ngh="22"><!--container--></app-wizard-dialog><button _ngcontent-ng-c3298958394="" mat-fab="" color="primary" mattooltip="Start Guide" class="mat-mdc-tooltip-trigger mat-mdc-menu-trigger guide-fab mdc-fab mat-mdc-fab-base mat-mdc-fab mat-primary mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" ng-reflect-color="primary" ng-reflect-message="Start Guide" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="23" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-fab__ripple"></span><mat-icon _ngcontent-ng-c3298958394="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mdc-button__label"></span><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c3298958394="" ngh="3"><!--container--></mat-menu><!--container--></app-root>
<link rel="modulepreload" href="chunk-LCTRLMJA.js"><link rel="modulepreload" href="chunk-TXDUYLVM.js"><script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"101343115":{"b":{"responseData":[],"message":"Files retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/files/by-type/ht panel","rt":"json"},"592816468":{"b":{"responseData":[{"id":6000000001,"name":"File Type","alias":"fileType"},{"id":6000000003,"name":"Vendor","alias":"vendor"},{"id":6000000007,"name":"Eq Type","alias":"eqType"},{"id":6000000009,"name":"Iso Pos","alias":"isoPos"},{"id":6000000011,"name":"Norm Pos","alias":"normPos"},{"id":6000000013,"name":"Location","alias":"location"},{"id":6000000015,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"}],"message":"Categories retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/categories","rt":"json"},"820227935":{"b":{"responseData":[{"id":6000000012,"name":"Open","category":{"id":6000000011,"name":"Norm Pos","alias":"normPos"},"alias":"OP"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/normPos","rt":"json"},"1756457535":{"b":{"responseData":[{"id":6000000008,"name":"Manual Valve","category":{"id":6000000007,"name":"Eq Type","alias":"eqType"},"alias":"MV"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/eqType","rt":"json"},"2356453652":{"b":{"responseData":[],"message":"Files retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/files/by-type/elect","rt":"json"},"2647878024":{"b":{"responseData":[{"id":6000000010,"name":"Closed","category":{"id":6000000009,"name":"Iso Pos","alias":"isoPos"},"alias":"CL"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/isoPos","rt":"json"},"2937771502":{"b":{"responseData":[{"id":6000000014,"name":"CRT AREA","category":{"id":6000000013,"name":"Location","alias":"location"},"alias":"CRT"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/location","rt":"json"},"2987367370":{"b":{"responseData":[],"message":"Files retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/files/by-type/iso","rt":"json"},"2993523536":{"b":{"responseData":[{"id":6000000005,"deleted":false,"isVerified":false,"name":"equipment-test-file","note":null,"createdBy":null,"objectType":"FileObject","dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"fileType":{"id":6000000002,"name":"PID-Equipment-Test","category":{"id":6000000001,"name":"File Type","alias":"fileType"},"alias":"pid"},"fileLink":"uploads/pdf/PID-Equipment-Test/Equipment-Test-Vendor/equipment-test-file__SEP__.pdf","baseLink":"uploads","folder":null,"system":null,"relatedSystems":null,"fileNumber":["equipment-test-file"],"vendor":{"id":6000000004,"name":"Equipment-Test-Vendor","category":{"id":6000000003,"name":"Vendor","alias":"vendor"},"alias":"ETV"},"points":null,"extension":null,"extensions":["jpg","pdf"],"heatTraceList":null,"bulkEditStep":"eqTagNumber","highlights":null,"docNum":null,"fileNumberAsString":"equipment-test-file"}],"message":"Files retrieved successfully","timestamp":[2026,1,25,8,14,5,176419700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/files/by-type/pid","rt":"json"},"3230780623":{"b":{"responseData":[{"id":6000000002,"name":"PID-Equipment-Test","category":{"id":6000000001,"name":"File Type","alias":"fileType"},"alias":"pid"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,387305500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/fileType","rt":"json"},"4279266561":{"b":{"responseData":[{"id":6000000004,"name":"Equipment-Test-Vendor","category":{"id":6000000003,"name":"Vendor","alias":"vendor"},"alias":"ETV"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,500243300]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/vendor","rt":"json"},"4280908195":{"b":{"responseData":[{"id":6000000016,"name":"Test Phrase 1769349812746","category":{"id":6000000015,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"{\\"name\\":\\"Test Phrase 1769349812746\\",\\"rawText\\":\\"Open [tag1] drain and verify [tag2] level gauge is empty\\",\\"segments\\":[{\\"type\\":\\"text\\",\\"content\\":\\"Open \\"},{\\"type\\":\\"placeholder\\",\\"content\\":\\"tag1\\",\\"placeholderIndex\\":0},{\\"type\\":\\"text\\",\\"content\\":\\" drain and verify \\"},{\\"type\\":\\"placeholder\\",\\"content\\":\\"tag2\\",\\"placeholderIndex\\":1},{\\"type\\":\\"text\\",\\"content\\":\\" level gauge is empty\\"}]}"}],"message":"Values retrieved successfully","timestamp":[2026,1,25,8,14,5,189622400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/zeroEnergyTemplate","rt":"json"},"__nghData__":[{},{"c":{"0":[],"3":[],"4":[]},"n":{"2":"1f"},"t":{"3":"t2","4":"t3"}},{"n":{"2":"hfn2"}},{"t":{"0":"t4"},"c":{"0":[]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,11,12,13,14,15,16,17]},{"t":{"1":"t5","2":"t6"},"c":{"1":[{"i":"t5","r":1}],"2":[]}},{"t":{"1":"t10","2":"t12","3":"t13"},"c":{"1":[{"i":"t10","r":1,"c":{"1":[],"4":[]},"n":{"3":"2f"},"t":{"4":"t11"}}],"2":[],"3":[]}},{"c":{"0":[],"1":[],"4":[]},"n":{"3":"2f"},"t":{"4":"t14"}},{"t":{"3":"t0","4":"t1","11":"t7","16":"t8"},"c":{"3":[],"4":[{"i":"t1","r":1}],"11":[{"i":"t7","r":3}],"16":[{"i":"t8","r":2,"t":{"4":"t9"},"c":{"4":[]}}]}},{"t":{"1":"t15","2":"t19","3":"t20"},"c":{"1":[{"i":"t15","r":1,"t":{"6":"t16","7":"t17"},"c":{"6":[{"i":"t16","r":1,"x":5}],"7":[{"i":"t17","r":1,"t":{"2":"t18"},"c":{"2":[{"i":"t18","r":1,"x":3}]}}]}}],"2":[],"3":[]}},{"n":{"1":"0f2"},"t":{"1":"t27"},"c":{"1":[]}},{"t":{"1":"t24","3":"t26","4":"t28","5":"t29"},"c":{"1":[{"i":"t24","r":1,"t":{"3":"t25"},"c":{"3":[]}}],"3":[{"i":"t26","r":1}],"4":[],"5":[]}},{"t":{"26":"t21","27":"t22","28":"t23","29":"t30"},"c":{"26":[],"27":[],"28":[{"i":"t23","r":1}],"29":[]}},{"t":{"0":"t31"},"c":{"0":[]}},{"t":{"0":"t32"},"c":{"0":[]}},{"n":{"1":"0f4n3","3":"0f2nfnf","5":"0f2nfn4f2","7":"0f2nfn4fn2fn"},"e":{"1":1,"3":1,"5":2,"7":0},"c":{"6":[]},"d":[9,11]},{"t":{"0":"t33"},"c":{"0":[]}},{"t":{"0":"t34"},"c":{"0":[]}},{"t":{"0":"t35"},"c":{"0":[]}},{"t":{"0":"t36"},"c":{"0":[]}},{"t":{"0":"t37"},"c":{"0":[]}},{"t":{"0":"t38"},"c":{"0":[]}},{"t":{"0":"t39"},"c":{"0":[]}},{"n":{"2":"hfn2","5":"hfn3"}},{"c":{"0":[{"i":"c3098161097","r":1}],"8":[{"i":"t40","r":3,"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]}]},"t":{"8":"t40"}}]}</script></body></html>`;