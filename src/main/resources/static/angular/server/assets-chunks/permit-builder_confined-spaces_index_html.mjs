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

.wizard-overlay[_ngcontent-ng-c328623377] {
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
.wizard-overlay.minimized[_ngcontent-ng-c328623377] {
  background: transparent;
  pointer-events: none;
}
.wizard-dialog[_ngcontent-ng-c328623377] {
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
.wizard-dialog.is-branch[_ngcontent-ng-c328623377] {
  border: 2px solid #1976d2;
}
.wizard-overlay.minimized[_ngcontent-ng-c328623377]   .wizard-dialog[_ngcontent-ng-c328623377] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: auto;
  max-width: 300px;
  max-height: auto;
}
.dialog-header[_ngcontent-ng-c328623377] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  cursor: move;
}
.header-content[_ngcontent-ng-c328623377] {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.header-title[_ngcontent-ng-c328623377] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-icon[_ngcontent-ng-c328623377] {
  color: #1976d2;
}
.flow-name[_ngcontent-ng-c328623377] {
  font-weight: 500;
  font-size: 16px;
}
.header-actions[_ngcontent-ng-c328623377] {
  display: flex;
  gap: 4px;
}
.header-btn[_ngcontent-ng-c328623377] {
  width: 32px;
  height: 32px;
  line-height: 32px;
}
.header-btn[_ngcontent-ng-c328623377]   mat-icon[_ngcontent-ng-c328623377] {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.close-btn[_ngcontent-ng-c328623377]:hover {
  color: #d32f2f;
}
.dialog-content[_ngcontent-ng-c328623377] {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 300px;
}
.dialog-footer[_ngcontent-ng-c328623377] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}
.footer-left[_ngcontent-ng-c328623377], 
.footer-right[_ngcontent-ng-c328623377] {
  display: flex;
  gap: 8px;
}
.back-btn[_ngcontent-ng-c328623377] {
  color: #666;
}
.skip-btn[_ngcontent-ng-c328623377] {
  color: #666;
}
button[_ngcontent-ng-c328623377]   mat-icon[_ngcontent-ng-c328623377] {
  margin-right: 4px;
}
.footer-right[_ngcontent-ng-c328623377]   button[_ngcontent-ng-c328623377]   mat-icon[_ngcontent-ng-c328623377] {
  margin-right: 4px;
  margin-left: 0;
}
.spinning[_ngcontent-ng-c328623377] {
  animation: _ngcontent-ng-c328623377_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c328623377_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.minimized-info[_ngcontent-ng-c328623377] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
}
.minimized-info[_ngcontent-ng-c328623377]:hover {
  background: #f5f5f5;
}
/*# sourceMappingURL=/wizard-dialog.component.css.map */</style><style ng-app-id="ng">.mat-mdc-fab-base{-webkit-user-select:none;user-select:none;position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:56px;height:56px;padding:0;border:none;fill:currentColor;text-decoration:none;cursor:pointer;-moz-appearance:none;-webkit-appearance:none;overflow:visible;transition:box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),opacity 15ms linear 30ms,transform 270ms 0ms cubic-bezier(0, 0, 0.2, 1);flex-shrink:0;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-fab-base .mat-mdc-button-ripple,.mat-mdc-fab-base .mat-mdc-button-persistent-ripple,.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-fab-base .mat-mdc-button-ripple{overflow:hidden}.mat-mdc-fab-base .mat-mdc-button-persistent-ripple::before{content:"";opacity:0}.mat-mdc-fab-base .mdc-button__label,.mat-mdc-fab-base .mat-icon{z-index:1;position:relative}.mat-mdc-fab-base .mat-focus-indicator{top:0;left:0;right:0;bottom:0;position:absolute}.mat-mdc-fab-base:focus>.mat-focus-indicator::before{content:""}.mat-mdc-fab-base._mat-animation-noopable{transition:none !important;animation:none !important}.mat-mdc-fab-base::before{position:absolute;box-sizing:border-box;width:100%;height:100%;top:0;left:0;border:1px solid rgba(0,0,0,0);border-radius:inherit;content:"";pointer-events:none}.mat-mdc-fab-base[hidden]{display:none}.mat-mdc-fab-base::-moz-focus-inner{padding:0;border:0}.mat-mdc-fab-base:active,.mat-mdc-fab-base:focus{outline:none}.mat-mdc-fab-base:hover{cursor:pointer}.mat-mdc-fab-base>svg{width:100%}.mat-mdc-fab-base .mat-icon,.mat-mdc-fab-base .material-icons{transition:transform 180ms 90ms cubic-bezier(0, 0, 0.2, 1);fill:currentColor;will-change:transform}.mat-mdc-fab-base .mat-focus-indicator::before{margin:calc(calc(var(--mat-focus-indicator-border-width, 3px) + 2px)*-1)}.mat-mdc-fab-base[disabled],.mat-mdc-fab-base.mat-mdc-button-disabled{cursor:default;pointer-events:none}.mat-mdc-fab-base[disabled],.mat-mdc-fab-base[disabled]:focus,.mat-mdc-fab-base.mat-mdc-button-disabled,.mat-mdc-fab-base.mat-mdc-button-disabled:focus{box-shadow:none}.mat-mdc-fab-base.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-fab{background-color:var(--mdc-fab-container-color, var(--mat-sys-primary-container));border-radius:var(--mdc-fab-container-shape, var(--mat-sys-corner-large));color:var(--mat-fab-foreground-color, var(--mat-sys-on-primary-container, inherit));box-shadow:var(--mdc-fab-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab:hover{box-shadow:var(--mdc-fab-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-fab:focus{box-shadow:var(--mdc-fab-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab:active,.mat-mdc-fab:focus:active{box-shadow:var(--mdc-fab-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-fab[disabled],.mat-mdc-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mat-fab-disabled-state-foreground-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));background-color:var(--mat-fab-disabled-state-container-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent))}.mat-mdc-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-fab .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-fab-touch-target-display, block)}.mat-mdc-fab .mat-ripple-element{background-color:var(--mat-fab-ripple-color, color-mix(in srgb, var(--mat-sys-on-primary-container) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-fab .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-state-layer-color, var(--mat-sys-on-primary-container))}.mat-mdc-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-disabled-state-layer-color)}.mat-mdc-fab:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-fab.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-fab.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-fab.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-fab:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-mini-fab{width:40px;height:40px;background-color:var(--mdc-fab-small-container-color, var(--mat-sys-primary-container));border-radius:var(--mdc-fab-small-container-shape, var(--mat-sys-corner-medium));color:var(--mat-fab-small-foreground-color, var(--mat-sys-on-primary-container, inherit));box-shadow:var(--mdc-fab-small-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab:hover{box-shadow:var(--mdc-fab-small-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-mini-fab:focus{box-shadow:var(--mdc-fab-small-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab:active,.mat-mdc-mini-fab:focus:active{box-shadow:var(--mdc-fab-small-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-mini-fab[disabled],.mat-mdc-mini-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mat-fab-small-disabled-state-foreground-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));background-color:var(--mat-fab-small-disabled-state-container-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent))}.mat-mdc-mini-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-mini-fab .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-fab-small-touch-target-display)}.mat-mdc-mini-fab .mat-ripple-element{background-color:var(--mat-fab-small-ripple-color, color-mix(in srgb, var(--mat-sys-on-primary-container) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-mini-fab .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-small-state-layer-color, var(--mat-sys-on-primary-container))}.mat-mdc-mini-fab.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-fab-small-disabled-state-layer-color)}.mat-mdc-mini-fab:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-mini-fab.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-mini-fab.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-mini-fab.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-mini-fab:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-fab-small-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-extended-fab{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;border-radius:24px;padding-left:20px;padding-right:20px;width:auto;max-width:100%;line-height:normal;height:var(--mdc-extended-fab-container-height, 56px);border-radius:var(--mdc-extended-fab-container-shape, var(--mat-sys-corner-large));font-family:var(--mdc-extended-fab-label-text-font, var(--mat-sys-label-large-font));font-size:var(--mdc-extended-fab-label-text-size, var(--mat-sys-label-large-size));font-weight:var(--mdc-extended-fab-label-text-weight, var(--mat-sys-label-large-weight));letter-spacing:var(--mdc-extended-fab-label-text-tracking, var(--mat-sys-label-large-tracking));box-shadow:var(--mdc-extended-fab-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab:hover{box-shadow:var(--mdc-extended-fab-hover-container-elevation-shadow, var(--mat-sys-level4))}.mat-mdc-extended-fab:focus{box-shadow:var(--mdc-extended-fab-focus-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab:active,.mat-mdc-extended-fab:focus:active{box-shadow:var(--mdc-extended-fab-pressed-container-elevation-shadow, var(--mat-sys-level3))}.mat-mdc-extended-fab[disabled],.mat-mdc-extended-fab.mat-mdc-button-disabled{cursor:default;pointer-events:none}.mat-mdc-extended-fab[disabled],.mat-mdc-extended-fab[disabled]:focus,.mat-mdc-extended-fab.mat-mdc-button-disabled,.mat-mdc-extended-fab.mat-mdc-button-disabled:focus{box-shadow:none}.mat-mdc-extended-fab.mat-mdc-button-disabled-interactive{pointer-events:auto}[dir=rtl] .mat-mdc-extended-fab .mdc-button__label+.mat-icon,[dir=rtl] .mat-mdc-extended-fab .mdc-button__label+.material-icons,.mat-mdc-extended-fab>.mat-icon,.mat-mdc-extended-fab>.material-icons{margin-left:-8px;margin-right:12px}.mat-mdc-extended-fab .mdc-button__label+.mat-icon,.mat-mdc-extended-fab .mdc-button__label+.material-icons,[dir=rtl] .mat-mdc-extended-fab>.mat-icon,[dir=rtl] .mat-mdc-extended-fab>.material-icons{margin-left:12px;margin-right:-8px}.mat-mdc-extended-fab .mat-mdc-button-touch-target{width:100%}
</style><style ng-app-id="ng">.mat-focus-indicator{position:relative}.mat-focus-indicator::before{top:0;left:0;right:0;bottom:0;position:absolute;box-sizing:border-box;pointer-events:none;display:var(--mat-focus-indicator-display, none);border-width:var(--mat-focus-indicator-border-width, 3px);border-style:var(--mat-focus-indicator-border-style, solid);border-color:var(--mat-focus-indicator-border-color, transparent);border-radius:var(--mat-focus-indicator-border-radius, 4px)}.mat-focus-indicator:focus::before{content:""}@media(forced-colors: active){html{--mat-focus-indicator-display: block}}
</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style><style ng-app-id="ng">mat-menu{display:none}.mat-mdc-menu-content{margin:0;padding:8px 0;outline:0}.mat-mdc-menu-content,.mat-mdc-menu-content .mat-mdc-menu-item .mat-mdc-menu-item-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;flex:1;white-space:normal;font-family:var(--mat-menu-item-label-text-font, var(--mat-sys-label-large-font));line-height:var(--mat-menu-item-label-text-line-height, var(--mat-sys-label-large-line-height));font-size:var(--mat-menu-item-label-text-size, var(--mat-sys-label-large-size));letter-spacing:var(--mat-menu-item-label-text-tracking, var(--mat-sys-label-large-tracking));font-weight:var(--mat-menu-item-label-text-weight, var(--mat-sys-label-large-weight))}@keyframes _mat-menu-enter{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:none}}@keyframes _mat-menu-exit{from{opacity:1}to{opacity:0}}.mat-mdc-menu-panel{min-width:112px;max-width:280px;overflow:auto;box-sizing:border-box;outline:0;animation:_mat-menu-enter 120ms cubic-bezier(0, 0, 0.2, 1);border-radius:var(--mat-menu-container-shape, var(--mat-sys-corner-extra-small));background-color:var(--mat-menu-container-color, var(--mat-sys-surface-container));box-shadow:var(--mat-menu-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));will-change:transform,opacity}.mat-mdc-menu-panel.mat-menu-panel-exit-animation{animation:_mat-menu-exit 100ms 25ms linear forwards}.mat-mdc-menu-panel.mat-menu-panel-animations-disabled{animation:none}.mat-mdc-menu-panel.mat-menu-panel-animating{pointer-events:none}.mat-mdc-menu-panel.mat-menu-panel-animating:has(.mat-mdc-menu-content:empty){display:none}@media(forced-colors: active){.mat-mdc-menu-panel{outline:solid 1px}}.mat-mdc-menu-panel .mat-divider{color:var(--mat-menu-divider-color, var(--mat-sys-surface-variant));margin-bottom:var(--mat-menu-divider-bottom-spacing, 8px);margin-top:var(--mat-menu-divider-top-spacing, 8px)}.mat-mdc-menu-item{display:flex;position:relative;align-items:center;justify-content:flex-start;overflow:hidden;padding:0;cursor:pointer;width:100%;text-align:left;box-sizing:border-box;color:inherit;font-size:inherit;background:none;text-decoration:none;margin:0;min-height:48px;padding-left:var(--mat-menu-item-leading-spacing, 12px);padding-right:var(--mat-menu-item-trailing-spacing, 12px);-webkit-user-select:none;user-select:none;cursor:pointer;outline:none;border:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-menu-item::-moz-focus-inner{border:0}[dir=rtl] .mat-mdc-menu-item{padding-left:var(--mat-menu-item-trailing-spacing, 12px);padding-right:var(--mat-menu-item-leading-spacing, 12px)}.mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-leading-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-trailing-spacing, 12px)}[dir=rtl] .mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-trailing-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-leading-spacing, 12px)}.mat-mdc-menu-item,.mat-mdc-menu-item:visited,.mat-mdc-menu-item:link{color:var(--mat-menu-item-label-text-color, var(--mat-sys-on-surface))}.mat-mdc-menu-item .mat-icon-no-color,.mat-mdc-menu-item .mat-mdc-menu-submenu-icon{color:var(--mat-menu-item-icon-color, var(--mat-sys-on-surface-variant))}.mat-mdc-menu-item[disabled]{cursor:default;opacity:.38}.mat-mdc-menu-item[disabled]::after{display:block;position:absolute;content:"";top:0;left:0;bottom:0;right:0}.mat-mdc-menu-item:focus{outline:0}.mat-mdc-menu-item .mat-icon{flex-shrink:0;margin-right:var(--mat-menu-item-spacing, 12px);height:var(--mat-menu-item-icon-size, 24px);width:var(--mat-menu-item-icon-size, 24px)}[dir=rtl] .mat-mdc-menu-item{text-align:right}[dir=rtl] .mat-mdc-menu-item .mat-icon{margin-right:0;margin-left:var(--mat-menu-item-spacing, 12px)}.mat-mdc-menu-item:not([disabled]):hover{background-color:var(--mat-menu-item-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent))}.mat-mdc-menu-item:not([disabled]).cdk-program-focused,.mat-mdc-menu-item:not([disabled]).cdk-keyboard-focused,.mat-mdc-menu-item:not([disabled]).mat-mdc-menu-item-highlighted{background-color:var(--mat-menu-item-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent))}@media(forced-colors: active){.mat-mdc-menu-item{margin-top:1px}}.mat-mdc-menu-submenu-icon{width:var(--mat-menu-item-icon-size, 24px);height:10px;fill:currentColor;padding-left:var(--mat-menu-item-spacing, 12px)}[dir=rtl] .mat-mdc-menu-submenu-icon{padding-right:var(--mat-menu-item-spacing, 12px);padding-left:0}[dir=rtl] .mat-mdc-menu-submenu-icon polygon{transform:scaleX(-1);transform-origin:center}@media(forced-colors: active){.mat-mdc-menu-submenu-icon{fill:CanvasText}}.mat-mdc-menu-item .mat-mdc-menu-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none}
</style><style ng-app-id="ng">.mat-ripple{overflow:hidden;position:relative}.mat-ripple:not(:empty){transform:translateZ(0)}.mat-ripple.mat-ripple-unbounded{overflow:visible}.mat-ripple-element{position:absolute;border-radius:50%;pointer-events:none;transition:opacity,transform 0ms cubic-bezier(0, 0, 0.2, 1);transform:scale3d(0, 0, 0);background-color:var(--mat-ripple-color, color-mix(in srgb, var(--mat-sys-on-surface) 10%, transparent))}@media(forced-colors: active){.mat-ripple-element{display:none}}.cdk-drag-preview .mat-ripple-element,.cdk-drag-placeholder .mat-ripple-element{display:none}
</style><style ng-app-id="ng">

app-main-layout[_ngcontent-ng-c874109360] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.header-menus[_ngcontent-ng-c874109360] {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
.menu-container[_ngcontent-ng-c874109360] {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.left-menu-container[_ngcontent-ng-c874109360] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.menu-container[_ngcontent-ng-c874109360]:first-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c874109360]:first-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c874109360]:last-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c874109360]:last-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c874109360]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.menu-container[_ngcontent-ng-c874109360]     a {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.menu-container[_ngcontent-ng-c874109360]     a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
/*# sourceMappingURL=/permit-builder-page.component.css.map */</style><style ng-app-id="ng">

.layout-container[_ngcontent-ng-c3930118923] {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--primary-background);
  color: var(--primary-text);
  position: relative;
  overflow: hidden;
}
.header[_ngcontent-ng-c3930118923] {
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
.header-content[_ngcontent-ng-c3930118923] {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  flex: 1;
  position: relative;
}
.header-content[_ngcontent-ng-c3930118923]::after {
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
.header-content[_ngcontent-ng-c3930118923]::-webkit-scrollbar {
  display: none;
}
.header-content[_ngcontent-ng-c3930118923] {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.header-content[_ngcontent-ng-c3930118923]   h1[_ngcontent-ng-c3930118923] {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.header-actions[_ngcontent-ng-c3930118923] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.auth-btn[_ngcontent-ng-c3930118923] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
}
.auth-btn[_ngcontent-ng-c3930118923]:hover {
  background-color: var(--accent-color-hover);
}
.content-wrapper[_ngcontent-ng-c3930118923] {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.left-menu[_ngcontent-ng-c3930118923] {
  background-color: var(--menu-background);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}
.resizer[_ngcontent-ng-c3930118923] {
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
.resizer[_ngcontent-ng-c3930118923]:hover {
  background-color: var(--accent-color-translucent);
}
.menu-toggle-btn[_ngcontent-ng-c3930118923] {
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
.menu-toggle-btn[_ngcontent-ng-c3930118923]:hover {
  background-color: var(--accent-color);
  transform: translate(-50%, -50%) scale(1.1);
}
.arrow[_ngcontent-ng-c3930118923] {
  border: solid var(--primary-text);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transition: transform 0.3s ease;
}
.arrow[_ngcontent-ng-c3930118923]:not(.collapsed) {
  transform: rotate(135deg);
}
.arrow.collapsed[_ngcontent-ng-c3930118923] {
  transform: rotate(-45deg);
  margin-left: -2px;
}
.main-and-footer[_ngcontent-ng-c3930118923] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.main-content[_ngcontent-ng-c3930118923] {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  background-color: var(--primary-background);
}
.footer-resizer[_ngcontent-ng-c3930118923] {
  height: 5px;
  background-color: var(--border-color);
  cursor: row-resize;
  transition: background-color 0.3s ease;
}
.footer-resizer[_ngcontent-ng-c3930118923]:hover {
  background-color: var(--accent-color);
}
.footer[_ngcontent-ng-c3930118923] {
  overflow: auto;
  background-color: var(--secondary-background);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}
.overlay[_ngcontent-ng-c3930118923] {
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
.overlay.active[_ngcontent-ng-c3930118923] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
@supports (-webkit-touch-callout: none) {
  .layout-container[_ngcontent-ng-c3930118923] {
    height: -webkit-fill-available;
  }
}
@media screen and (max-width: 768px) {
  .layout-container[_ngcontent-ng-c3930118923] {
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    -webkit-overflow-scrolling: touch;
  }
  .content-wrapper[_ngcontent-ng-c3930118923] {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  .main-and-footer[_ngcontent-ng-c3930118923] {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .main-content[_ngcontent-ng-c3930118923] {
    flex: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
  }
}
@media (max-width: 768px) {
  .left-menu[_ngcontent-ng-c3930118923] {
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
  .left-menu.active[_ngcontent-ng-c3930118923] {
    transform: translateX(0) !important;
  }
  .resizer[_ngcontent-ng-c3930118923] {
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
  .resizer[_ngcontent-ng-c3930118923]:hover {
    background-color: transparent !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c3930118923] {
    position: static !important;
    transform: none !important;
    left: auto !important;
    top: auto !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c3930118923]:hover {
    transform: scale(1.1) !important;
  }
  .left-menu.active[_ngcontent-ng-c3930118923]    ~ .resizer[_ngcontent-ng-c3930118923] {
    left: calc(100% - 60px) !important;
  }
  .main-and-footer[_ngcontent-ng-c3930118923] {
    width: 100%;
  }
  .main-content[_ngcontent-ng-c3930118923] {
    padding: 0.5rem;
  }
  .header[_ngcontent-ng-c3930118923] {
    padding: 0.75rem;
  }
  .header-content[_ngcontent-ng-c3930118923]   h1[_ngcontent-ng-c3930118923] {
    font-size: 1.25rem;
  }
  .auth-btn[_ngcontent-ng-c3930118923] {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .left-menu[_ngcontent-ng-c3930118923] {
    max-width: 350px;
  }
}
@media (max-width: 768px) {
  body.menu-open[_ngcontent-ng-c3930118923] {
    overflow: hidden;
  }
}
.clipboard-container[_ngcontent-ng-c3930118923] {
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

[_nghost-ng-c532875483] {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.form-container[_ngcontent-ng-c532875483] {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
}
/*# sourceMappingURL=/confined-space-form.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c2047840338] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
app-confined-space-table[_ngcontent-ng-c2047840338] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
/*# sourceMappingURL=/confined-space-side-menu.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c365889978] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
/*# sourceMappingURL=/confined-space-table.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.table-wrapper[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}
.table-controls[_ngcontent-ng-c2108134260] {
  flex: 0 0 auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
.default-controls[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.button-row[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.button-row[_ngcontent-ng-c2108134260]   button[_ngcontent-ng-c2108134260] {
  margin-right: 10px;
}
.search-row[_ngcontent-ng-c2108134260] {
  width: 100%;
}
.search-input[_ngcontent-ng-c2108134260], 
.filter-input[_ngcontent-ng-c2108134260] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}
cdk-virtual-scroll-viewport.table-container[_ngcontent-ng-c2108134260] {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: auto;
  height: 100%;
}
.cdk-virtual-scroll-content-wrapper[_ngcontent-ng-c2108134260] {
  width: 100%;
  min-width: 100%;
}
table[_ngcontent-ng-c2108134260] {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
thead[_ngcontent-ng-c2108134260] {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f8f8f8;
}
th[_ngcontent-ng-c2108134260] {
  position: sticky;
  top: 0;
  background-color: #f8f8f8;
  z-index: 1;
  box-shadow: 0 1px 0 0 #ddd;
  cursor: pointer;
}
thead[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260]:nth-child(2)   th[_ngcontent-ng-c2108134260] {
  top: 41px;
}
th[_ngcontent-ng-c2108134260], 
td[_ngcontent-ng-c2108134260] {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}
.resizer[_ngcontent-ng-c2108134260] {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
}
tbody[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260] {
  cursor: pointer;
}
tbody[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260]:hover {
  background-color: #f5f5f5;
}
.table-container[_ngcontent-ng-c2108134260]::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.table-container[_ngcontent-ng-c2108134260]::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: rgba(0, 0, 0, .5);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, .5);
}
.table-container[_ngcontent-ng-c2108134260] {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, .5) transparent;
}
tr.selected[_ngcontent-ng-c2108134260] {
  background-color: #e0f7fa;
  font-weight: bold;
}
tr.selected[_ngcontent-ng-c2108134260]:hover {
  background-color: #b2ebf2;
}
.highlighted[_ngcontent-ng-c2108134260] {
  background-color: #ffff99;
  transition: background-color 0.5s ease;
}
.ghost-row[_ngcontent-ng-c2108134260] {
  opacity: 0.5;
  background-color: #e0e0e0;
}
.dragging[_ngcontent-ng-c2108134260] {
  opacity: 0.9;
  background-color: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
  transition: all 0.2s ease;
  z-index: 1000;
  pointer-events: none;
  cursor: grabbing;
}
/*# sourceMappingURL=/table.component.css.map */</style><style ng-app-id="ng">cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}
</style><style ng-app-id="ng">

[_nghost-ng-c1799638334] {
  display: block;
  font-family: Arial, sans-serif;
  max-width: 100%;
  margin: 0 auto;
}
form[_ngcontent-ng-c1799638334] {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 30px;
}
.form-layout-row[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-wrap: nowrap;
  margin: -10px;
  overflow-x: auto;
  margin-bottom: 15px;
}
.form-field-layout-row[_ngcontent-ng-c1799638334] {
  flex: 0 0 auto;
  width: 200px;
  margin: 10px;
  margin-bottom: 15px;
}
.form-layout-column[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.form-field-layout-column[_ngcontent-ng-c1799638334] {
  margin-bottom: 20px;
}
.form-layout-reactive[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-wrap: wrap;
  margin: 10px;
  gap: 10px;
}
.form-layout-grid[_ngcontent-ng-c1799638334] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.form-field-layout-reactive[_ngcontent-ng-c1799638334] {
  flex: 1 1 100%;
}
.group-title[_ngcontent-ng-c1799638334] {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ccc;
  width: 100%;
}
@media (min-width: 600px) {
  .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 calc(50% - 20px);
  }
}
@media (min-width: 900px) {
  .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 calc(33.333% - 20px);
  }
}
button[_ngcontent-ng-c1799638334] {
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button[_ngcontent-ng-c1799638334]:hover {
  background-color: #45a049;
}
button[type=button][_ngcontent-ng-c1799638334] {
  background-color: #f44336;
  margin-left: 10px;
}
button[type=button][_ngcontent-ng-c1799638334]:hover {
  background-color: #d32f2f;
}
@media (max-width: 600px) {
  .form-layout-row[_ngcontent-ng-c1799638334], 
   .form-layout-reactive[_ngcontent-ng-c1799638334] {
    flex-direction: column;
  }
  .form-field-layout-row[_ngcontent-ng-c1799638334], 
   .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 100%;
  }
  .form-layout-grid[_ngcontent-ng-c1799638334] {
    grid-template-columns: 1fr;
  }
  .error-message[_ngcontent-ng-c1799638334] {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
  }
}
/*# sourceMappingURL=/smart-form.component.css.map */</style><style ng-app-id="ng">/* src/app/shared/form-input/form-input.component.css */
.form-input {
  font-family: Arial, sans-serif;
  margin-bottom: 20px;
  position: relative;
}
.form-input label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}
.form-input input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.form-input input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}
.form-input input::placeholder {
  color: #999;
}
.form-input input[type=number] {
  -moz-appearance: textfield;
}
.form-input input[type=number]::-webkit-outer-spin-button,
.form-input input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.form-input input[type=date] {
  padding: 8px 10px;
}
/*# sourceMappingURL=/form-input.component.css.map */
</style><style ng-app-id="ng">

.styled-checkbox-container[_ngcontent-ng-c2778646442] {
  display: inline-block;
  position: relative;
}
.hidden-checkbox[_ngcontent-ng-c2778646442] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  margin: 0;
  padding: 0;
  z-index: 1;
}
label[_ngcontent-ng-c2778646442] {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f9f9f9;
  color: #333;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
  -webkit-user-select: none;
  user-select: none;
}
.hidden-checkbox[_ngcontent-ng-c2778646442]:focus    + label[_ngcontent-ng-c2778646442] {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
label[_ngcontent-ng-c2778646442]:hover {
  background-color: #e9e9e9;
}
label.checked[_ngcontent-ng-c2778646442] {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
label.disabled[_ngcontent-ng-c2778646442] {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #ced4da;
}
.hidden-checkbox[_ngcontent-ng-c2778646442]:disabled {
  cursor: not-allowed;
}
/*# sourceMappingURL=/checkbox-only-label.component.css.map */</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click","mousedown","keydown","submit","contextmenu","input","change"],[]);</script>
  <app-root ng-version="19.2.5" _nghost-ng-c3298958394="" ngh="22" ng-server-context="ssg"><router-outlet _ngcontent-ng-c3298958394=""></router-outlet><app-permit-builder-page _nghost-ng-c874109360="" ngh="13"><app-main-layout _ngcontent-ng-c874109360="" _nghost-ng-c3930118923="" ngh="7"><div _ngcontent-ng-c3930118923="" class="layout-container"><header _ngcontent-ng-c3930118923="" class="header"><div _ngcontent-ng-c3930118923="" class="header-content"><!--container--><h1 _ngcontent-ng-c3930118923="">Jackson Generation</h1><!--container--><app-router-menu _ngcontent-ng-c874109360="" _nghost-ng-c3178853866="" ng-reflect-layout="row" ngh="8"><nav _ngcontent-ng-c3178853866="" class="router-menu row" ng-reflect-ng-class="row"><div _ngcontent-ng-c3178853866="" class="menu-container"><ul _ngcontent-ng-c3178853866="" class="primary-menu"><li _ngcontent-ng-c3178853866="" class="home-link"><a _ngcontent-ng-c3178853866="" routerlink="/" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">Files</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link active"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permits</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Admin</a></li><!--container--></ul><ul _ngcontent-ng-c3178853866="" class="secondary-menu"><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder" href="/permit-builder" class="active-link" jsaction="click:;">Permit Builder</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/scheduler" href="/scheduler" class="" jsaction="click:;">Scheduler</a></li><!--container--></ul><!--container--></div><!--container--><!--container--><!--container--></nav></app-router-menu><!--ng-container--></div><div _ngcontent-ng-c3930118923="" class="header-actions"><app-sync-indicator _ngcontent-ng-c3930118923="" _nghost-ng-c990181552="" ngh="1"><div _ngcontent-ng-c990181552="" class="mat-mdc-tooltip-trigger sync-indicator disconnected" tabindex="0" ng-reflect-router-link="/sync-resync" ng-reflect-message="Server disconnected
Click for " jsaction="click:;"><mat-icon _ngcontent-ng-c990181552="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0"> cloud_off </mat-icon><!--container--><!--container--></div><!--container--></app-sync-indicator><app-tour-trigger _ngcontent-ng-c3930118923="" _nghost-ng-c1184412316="" ngh="4"><button _ngcontent-ng-c1184412316="" mat-icon-button="" mattooltip="Help &amp; Tours" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger tour-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Help &amp; Tours" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c1184412316="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c1184412316="" class="" ngh="3"><!--container--></mat-menu></app-tour-trigger><app-theme-toggle _ngcontent-ng-c3930118923="" _nghost-ng-c3074088440="" ngh="5"><button _ngcontent-ng-c3074088440="" class="theme-toggle-button" jsaction="click:;"><span _ngcontent-ng-c3074088440="">🌙</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button></app-theme-toggle></div></header><div _ngcontent-ng-c3930118923="" class="content-wrapper"><!--container--><div _ngcontent-ng-c3930118923="" class="main-and-footer"><main _ngcontent-ng-c3930118923="" class="main-content"><router-outlet _ngcontent-ng-c874109360=""></router-outlet><app-confined-space ngh="12"><!--container--><app-confined-space-form _nghost-ng-c532875483="" ng-reflect-values="[Computed: [object Object]]" ngh="11"><div _ngcontent-ng-c532875483="" class="form-container"><app-smart-form _ngcontent-ng-c532875483="" _nghost-ng-c1799638334="" ng-reflect-fields="[object Object],[object Object" ng-reflect-layout="column" ng-reflect-values="[Computed: [object Object]]" ng-reflect-title="Confined Space" ng-reflect-submit-button-text="Submit" ng-reflect-delete-button-text="Delete" ngh="10"><h2 _ngcontent-ng-c1799638334="" class="form-header">Confined Space</h2><!--container--><form _ngcontent-ng-c1799638334="" novalidate="" class="form-layout-column ng-untouched ng-pristine ng-valid" ng-reflect-form="[object Object]" jsaction="submit:;contextmenu:;"><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-column"><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Date" ng-reflect-type="date" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Date</label><!--container--></div><!--container--><input class="form-input-element" type="date" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Time" ng-reflect-type="time" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Time</label><!--container--></div><!--container--><input class="form-input-element" type="time" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Confined Space" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Confined Space</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Work Scope" ng-reflect-type="textarea" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Work Scope</label><!--container--></div><!--container--><input class="form-input-element" type="textarea" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Issued To" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Issued To</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Duration" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Duration</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="12 hours" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Meter Model" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Meter Model</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="RKI GX-3R PRO" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Meter Number" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Meter Number</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Calibrated" ng-reflect-id="calibrated" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="calibrated" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="calibrated"> Calibrated </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">Hazards</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Oxygen Deficiency" ng-reflect-id="hazards.oxygenDeficiency" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.oxygenDeficiency" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.oxygenDeficiency"> Oxygen Deficiency </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Flammable Gas" ng-reflect-id="hazards.flammableGas" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.flammableGas" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.flammableGas"> Flammable Gas </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Combustible Dust" ng-reflect-id="hazards.combustibleDust" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.combustibleDust" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.combustibleDust"> Combustible Dust </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Toxic Gas" ng-reflect-id="hazards.toxicGas" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.toxicGas" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.toxicGas"> Toxic Gas </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Rotating Equipment" ng-reflect-id="hazards.rotatingEquipment" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.rotatingEquipment" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.rotatingEquipment"> Rotating Equipment </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Electrical Shock" ng-reflect-id="hazards.electricalShock" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.electricalShock" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.electricalShock"> Electrical Shock </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Entrapment" ng-reflect-id="hazards.entrapment" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.entrapment" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.entrapment"> Entrapment </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Engulfment" ng-reflect-id="hazards.engulfment" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.engulfment" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.engulfment"> Engulfment </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Heat Stress" ng-reflect-id="hazards.heatStress" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.heatStress" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.heatStress"> Heat Stress </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="hazards.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">PPE</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Face Shield" ng-reflect-id="ppe.faceShield" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.faceShield" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.faceShield"> Face Shield </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="FCFI" ng-reflect-id="ppe.fcfi" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.fcfi" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.fcfi"> FCFI </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Low Voltage Tools" ng-reflect-id="ppe.lovVoltageTools" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.lovVoltageTools" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.lovVoltageTools"> Low Voltage Tools </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Explosion Proof Tools" ng-reflect-id="ppe.explosionProofTools" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.explosionProofTools" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.explosionProofTools"> Explosion Proof Tools </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Non-Sparking Tools" ng-reflect-id="ppe.nonSparkingTools" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.nonSparkingTools" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.nonSparkingTools"> Non-Sparking Tools </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fall Protection" ng-reflect-id="ppe.fallProtection" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.fallProtection" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.fallProtection"> Fall Protection </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Retrieval System" ng-reflect-id="ppe.retrievalSystem" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.retrievalSystem" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.retrievalSystem"> Retrieval System </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Lifeline" ng-reflect-id="ppe.lifeline" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.lifeline" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.lifeline"> Lifeline </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Personal Atmospheric Meter" ng-reflect-id="ppe.personalAtmosphericMeter" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.personalAtmosphericMeter" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.personalAtmosphericMeter"> Personal Atmospheric Meter </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Tripod" ng-reflect-id="ppe.tripod" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.tripod" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.tripod"> Tripod </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="ppe.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">Precautions</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Ventilation" ng-reflect-id="precautions.ventilation" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="precautions.ventilation" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="precautions.ventilation"> Ventilation </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Blank/Flanged" ng-reflect-id="precautions.blankFlanged" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="precautions.blankFlanged" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="precautions.blankFlanged"> Blank/Flanged </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Double Block and Bleed" ng-reflect-id="precautions.doubleBlockAndBlee" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="precautions.doubleBlockAndBleed" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="precautions.doubleBlockAndBleed"> Double Block and Bleed </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Barriers" ng-reflect-id="precautions.barriers" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="precautions.barriers" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="precautions.barriers"> Barriers </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="precautions.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="precautions.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="precautions.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Lock Out/Tag Out" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Lock Out/Tag Out</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Hot Work Permit" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="9"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Hot Work Permit</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><!--container--></fieldset><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><button _ngcontent-ng-c1799638334="" type="submit">Submit</button><button _ngcontent-ng-c1799638334="" type="button" jsaction="click:;">Delete</button><!--container--></div></form><!--container--><!--container--><!--container--></app-smart-form><!--container--><!--container--></div></app-confined-space-form><!--container--></app-confined-space><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c3930118923="" class="clipboard-container"><app-clipboard _ngcontent-ng-c3930118923="" _nghost-ng-c450165409="" ngh="6"><div _ngcontent-ng-c450165409="" class="clipboard-wrapper"><div _ngcontent-ng-c450165409="" class="clipboard-icon-wrapper" style="right: 20px; bottom: 20px;" jsaction="mousedown:;click:;"><div _ngcontent-ng-c450165409="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)"><mat-icon _ngcontent-ng-c450165409="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><!--container--></div><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-permit-builder-page><!--container--><app-print-layout _ngcontent-ng-c3298958394="" ngh="14"><!--container--></app-print-layout><app-global-message _ngcontent-ng-c3298958394="" _nghost-ng-c4038518790="" ngh="15"><!--container--></app-global-message><app-global-context-menu _ngcontent-ng-c3298958394="" ngh="16"><!--container--></app-global-context-menu><app-qr-scanner _ngcontent-ng-c3298958394="" _nghost-ng-c3289982237="" ngh="17"><!--container--></app-qr-scanner><app-brady-printer-manager _ngcontent-ng-c3298958394="" _nghost-ng-c3185598614="" ngh="18"><!--container--></app-brady-printer-manager><app-engraver-manager _ngcontent-ng-c3298958394="" _nghost-ng-c3529731854="" ngh="19"><!--container--></app-engraver-manager><app-wizard-dialog _ngcontent-ng-c3298958394="" _nghost-ng-c328623377="" ngh="20"><!--container--></app-wizard-dialog><button _ngcontent-ng-c3298958394="" mat-fab="" color="primary" mattooltip="Start Guide" class="mat-mdc-tooltip-trigger mat-mdc-menu-trigger guide-fab mdc-fab mat-mdc-fab-base mat-mdc-fab mat-primary mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" ng-reflect-color="primary" ng-reflect-message="Start Guide" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="21" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-fab__ripple"></span><mat-icon _ngcontent-ng-c3298958394="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mdc-button__label"></span><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c3298958394="" ngh="3"><!--container--></mat-menu><!--container--></app-root>
<link rel="modulepreload" href="chunk-2DJQGDSD.js"><link rel="modulepreload" href="chunk-TXDUYLVM.js"><script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"1069237980":{"b":{"responseData":{"id":1000008193,"deleted":false,"isVerified":false,"name":"Confined Space","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,32,54,891465000],"dateModified":[2025,9,22,2,23,26,292308000],"modifiedBy":null,"formContainers":[{"id":1000008474,"deleted":false,"isVerified":false,"name":"Date & Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,57,17,86485000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date & Time","position":{"x":585,"y":749},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"42","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008986,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,29,4,475408000],"dateModified":[2025,9,22,21,30,32,201529000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":2,"locked":false,"content":{"name":"isVerified","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":51,"y":66},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"137"},"contentStyle":{}},{"id":1000008475,"deleted":false,"isVerified":false,"name":"Entry Supervisor Name: (Print)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,59,37,547949000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Name: (Print)","position":{"x":39,"y":749},"size":{"width":260,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"40","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008987,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,29,4,475408000],"dateModified":[2025,9,22,21,31,4,53055000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Other","position":{"x":71,"y":65},"size":{"width":330,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"138"},"contentStyle":{"fontSize":14}},{"id":1000008984,"deleted":false,"isVerified":false,"name":"Voice","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,28,2,489606000],"dateModified":[2025,9,22,21,29,2,524703000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":2,"locked":false,"content":{"name":"isVerified","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":229,"y":40},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"135"},"contentStyle":{}},{"id":1000008473,"deleted":false,"isVerified":false,"name":"Statement","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,54,18,433993000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"I certify that conditions in this space are acceptable for entry as long as they remain as discussed in pre-job training.","position":{"x":39,"y":704},"size":{"width":694,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"39","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000008985,"deleted":false,"isVerified":false,"name":"Voice","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,28,2,489606000],"dateModified":[2025,9,22,21,29,1,887604000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Voice","position":{"x":249,"y":40},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"136"},"contentStyle":{"fontSize":14}},{"id":1000008478,"deleted":false,"isVerified":false,"name":"Entry Supervisor Name: (Print)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,3,138978000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Name: (Print)","position":{"x":39,"y":868},"size":{"width":260,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"44","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008990,"deleted":false,"isVerified":false,"name":"Control Room#","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,33,49,48105000],"dateModified":[2025,9,22,21,36,46,87671000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"(111) 222-33-44","position":{"x":537,"y":41},"size":{"width":197,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"141"},"contentStyle":{"fontSize":14}},{"id":1000008479,"deleted":false,"isVerified":false,"name":"Entry Supervisor Signature: (Sign)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,3,138978000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Signature: (Sign)","position":{"x":328,"y":868},"size":{"width":230,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"45","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008991,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,37,1,646662000],"dateModified":[2025,9,22,21,41,4,641899000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Other","position":{"x":421,"y":64},"size":{"width":230,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"142","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008476,"deleted":false,"isVerified":false,"name":"Entry Supervisor Signature: (Sign)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,0,9,123910000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Signature: (Sign)","position":{"x":328,"y":749},"size":{"width":230,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"41","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008988,"deleted":false,"isVerified":false,"name":"10. EMERGENCY CONTACTS","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,31,6,537622000],"dateModified":[2025,9,22,21,39,47,724379000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"10. EMERGENCY CONTACTS","position":{"x":419,"y":19},"size":{"width":318,"height":68},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"139","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008477,"deleted":false,"isVerified":false,"name":"Statement","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,2,6,952483000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"I have reviewed this certificate and because all hazards have been eliminated and the atmosphere found to be within acceptable limits without the use of forced air ventilation. I authorize that this space be considered a RECLACIFIED CONFINED SPACE. Cancellation of this certification shell immediately occur if the limit of hazard is exceeded, the authorized duration is exceeded, or any additional cancellation conditions occur.","position":{"x":39,"y":787},"size":{"width":694,"height":56},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"43","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000008989,"deleted":false,"isVerified":false,"name":"Control Room #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,33,49,48105000],"dateModified":[2025,9,22,21,36,47,122084000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Control Room #","position":{"x":421,"y":40},"size":{"width":230,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"140","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008466,"deleted":false,"isVerified":false,"name":"Purpose for Entry:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,34,29,66451000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Purpose for Entry:","position":{"x":38,"y":82},"size":{"width":120,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"35"},"contentStyle":{"fontSize":12}},{"id":1000008467,"deleted":false,"isVerified":false,"name":"Issued to:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,34,29,383531000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Issued to:","position":{"x":38,"y":102},"size":{"width":120,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"37"},"contentStyle":{"fontSize":12}},{"id":1000008979,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,19,56,283417000],"dateModified":[2025,9,22,21,40,9,312161000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":19,"y":19},"size":{"width":18,"height":954},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#e11414","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"130"},"contentStyle":{}},{"id":1000008464,"deleted":false,"isVerified":false,"name":"7. RECLASSIFICATION CERTIFICATION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,15,8,333159000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"7. RECLASSIFICATION CERTIFICATION","position":{"x":36,"y":768},"size":{"width":702,"height":120},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"32","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008976,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,7,11,195407000],"dateModified":[2025,9,22,21,19,46,422725000],"modifiedBy":null,"groupId":null,"contentType":"variable","pageNumber":2,"locked":false,"content":"space","position":{"x":162,"y":1},"size":{"width":343,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"128"},"contentStyle":{"fontSize":14}},{"id":1000008465,"deleted":false,"isVerified":false,"name":"Space To be Entered:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,32,58,520980000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Space To be Entered:","position":{"x":38,"y":62},"size":{"width":120,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"33"},"contentStyle":{"fontSize":12}},{"id":1000008977,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,12,0,337946000],"dateModified":[2025,9,22,21,15,55,229002000],"modifiedBy":null,"groupId":null,"contentType":"variable","pageNumber":2,"locked":false,"content":"id","position":{"x":584,"y":1},"size":{"width":150,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"129"},"contentStyle":{"fontSize":14}},{"id":1000008470,"deleted":false,"isVerified":false,"name":"Issued to:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,40,32,730760000],"dateModified":[2025,9,26,1,44,19,719141000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"issuedTo","type":"text","label":"","options":[],"initialValue":null},"position":{"x":92,"y":102},"size":{"width":363,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"38"},"contentStyle":{"fontSize":12}},{"id":1000008982,"deleted":false,"isVerified":false,"name":"Two-way radio","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,24,42,697120000],"dateModified":[2025,9,22,21,43,33,105111000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":2,"locked":false,"content":{"name":"isVerified","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":51,"y":40},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"133"},"contentStyle":{}},{"id":1000008983,"deleted":false,"isVerified":false,"name":"Two-way radio","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,26,29,858509000],"dateModified":[2025,9,22,21,28,53,818391000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Two-way radio","position":{"x":71,"y":40},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"134"},"contentStyle":{"fontSize":14}},{"id":1000008468,"deleted":false,"isVerified":false,"name":"Space To be Entered:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,38,46,99158000],"dateModified":[2025,9,26,1,44,10,102031000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"space","type":"text","label":"","options":[],"initialValue":null},"position":{"x":153,"y":62},"size":{"width":300,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"34"},"contentStyle":{"fontSize":12}},{"id":1000008980,"deleted":false,"isVerified":false,"name":"9. COMMUNICATION PLAN - for atendatns & entrants","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,21,42,724951000],"dateModified":[2025,9,22,21,39,47,724379000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"9. COMMUNICATION PLAN - for atendatns & entrants","position":{"x":36,"y":19},"size":{"width":701,"height":68},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"131","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008469,"deleted":false,"isVerified":false,"name":"Purpose for Entry:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,39,45,851914000],"dateModified":[2025,9,26,1,44,22,575137000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"workScope","type":"text","label":"","options":[],"initialValue":null},"position":{"x":135,"y":82},"size":{"width":319,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"36"},"contentStyle":{"fontSize":12}},{"id":1000008981,"deleted":false,"isVerified":false,"name":"11. RESCUE SERVICES ESTABLISHED & AVAILABLE","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,23,3,962161000],"dateModified":[2025,9,22,21,47,52,351371000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"11. RESCUE SERVICES ESTABLISHED & AVAILABLE","position":{"x":36,"y":86},"size":{"width":701,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"132","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008458,"deleted":false,"isVerified":false,"name":"Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,4,32,730777000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Test Results","position":{"x":662,"y":458},"size":{"width":75,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"30","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":15,"whiteSpace":"pre-wrap"}},{"id":1000008970,"deleted":false,"isVerified":false,"name":"Duration(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,24,41,274443000],"dateModified":[2025,9,26,3,31,40,259690000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.hotWorkPermit","type":"text","label":"","options":[],"initialValue":null},"position":{"x":528,"y":174},"size":{"width":200,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"122"},"contentStyle":{"fontSize":12}},{"id":1000008971,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,20,54,28,669863000],"dateModified":[2025,9,22,20,58,53,734586000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":19,"y":767},"size":{"width":18,"height":206},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f2d202","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"123"},"contentStyle":{}},{"id":1000008456,"deleted":false,"isVerified":false,"name":"Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,4,32,257497000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Test Results","position":{"x":498,"y":458},"size":{"width":83,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"28","justifyContent":"center","alignItems":"flex-start","paddingRight":"18px","paddingTop":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":15,"whiteSpace":"pre-wrap"}},{"id":1000008968,"deleted":false,"isVerified":false,"name":"Duration(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,23,7,105974000],"dateModified":[2025,9,26,3,31,20,85314000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.lockOutTagOut","type":"text","label":"","options":[],"initialValue":null},"position":{"x":473,"y":156},"size":{"width":255,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"120"},"contentStyle":{"fontSize":12}},{"id":1000008457,"deleted":false,"isVerified":false,"name":"Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,4,32,480852000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Test Results","position":{"x":580,"y":458},"size":{"width":83,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"29","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":15,"whiteSpace":"pre-wrap"}},{"id":1000008969,"deleted":false,"isVerified":false,"name":"Hot Work Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,24,41,274443000],"dateModified":[2025,9,22,19,26,50,484411000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hot Work Permit #","position":{"x":428,"y":174},"size":{"width":160,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"121","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008974,"deleted":false,"isVerified":false,"name":"PERMIT #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,2,40,362339000],"dateModified":[2025,9,22,21,33,40,591110000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"PERMIT #","position":{"x":507,"y":0},"size":{"width":230,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"126","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008463,"deleted":false,"isVerified":false,"name":"6. ENTRY AUTHORIZATION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,10,51,629135000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"6. ENTRY AUTHORIZATION","position":{"x":36,"y":684},"size":{"width":702,"height":85},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"31","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008975,"deleted":false,"isVerified":false,"name":"CONFINED SPACE:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,4,35,63933000],"dateModified":[2025,9,22,21,19,7,247543000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"CONFINED SPACE:","position":{"x":19,"y":0},"size":{"width":489,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"127","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008972,"deleted":false,"isVerified":false,"name":"Border","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,20,58,31,733414000],"dateModified":[2025,9,22,22,2,30,711503000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":true,"content":null,"position":{"x":19,"y":0},"size":{"width":718,"height":973},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"124"},"contentStyle":{}},{"id":1000008450,"deleted":false,"isVerified":false,"name":"Note: Continuous monitoring required for all Confined space entries.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,48,43,878577000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Note: Continuous monitoring required for all Confined space entries.","position":{"x":36,"y":416},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"10","justifyContent":"center","alignItems":"flex-start","fontWeight":"bold","paddingTop":"0px","paddingRight":"0px","paddingBottom":"5px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008451,"deleted":false,"isVerified":false,"name":"Note","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,48,49,654015000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Document test results for Permit-required spaces at 2-hour intervals and prior to each entry after the space has been vacated. Document test results for Reclassified Spaces once per shift. ","position":{"x":36,"y":429},"size":{"width":701,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"11","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008963,"deleted":false,"isVerified":false,"name":"Heat Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,261516000],"dateModified":[2025,9,26,3,45,21,920922000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.other","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":417,"y":356.3333333333333},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"115"},"contentStyle":{}},{"id":1000008448,"deleted":false,"isVerified":false,"name":"2. HAZARDS","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,45,9,586222000],"dateModified":[2025,9,22,19,19,52,117885000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"2. HAZARDS","position":{"x":36,"y":117},"size":{"width":701,"height":180},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"6","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008960,"deleted":false,"isVerified":false,"name":"Entrapment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,260512000],"dateModified":[2025,9,26,3,42,49,678967000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.personalAtmosphericMeter","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":417,"y":316},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"112"},"contentStyle":{}},{"id":1000008449,"deleted":false,"isVerified":false,"name":"5. ATMOSPHERIC TESTING/MONITORING","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,48,32,361005000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"5. ATMOSPHERIC TESTING/MONITORING","position":{"x":36,"y":398},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"9","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008961,"deleted":false,"isVerified":false,"name":"Personal Atmospheric Meter","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,261516000],"dateModified":[2025,9,26,3,40,57,431494000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Personal Atmospheric Meter","position":{"x":438,"y":318},"size":{"width":175,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"113"},"contentStyle":{"fontSize":12}},{"id":1000008454,"deleted":false,"isVerified":false,"name":"Acceptable Limits","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,2,55,220968000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Acceptable Limits","position":{"x":185,"y":458},"size":{"width":150,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"25","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":15}},{"id":1000008966,"deleted":false,"isVerified":false,"name":"Statement","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,21,9,655664000],"dateModified":[2025,9,22,19,22,56,148358000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hazard eliminated or isolated by any of the following","position":{"x":428,"y":137},"size":{"width":280,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"118"},"contentStyle":{"fontSize":12}},{"id":1000008455,"deleted":false,"isVerified":false,"name":"Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,4,32,25966000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Test Results","position":{"x":416,"y":458},"size":{"width":83,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"27","justifyContent":"center","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":15,"whiteSpace":"pre-wrap"}},{"id":1000008967,"deleted":false,"isVerified":false,"name":"LOTO #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,23,7,105974000],"dateModified":[2025,9,22,19,26,50,484411000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"LOTO #","position":{"x":428,"y":156},"size":{"width":50,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"119","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008452,"deleted":false,"isVerified":false,"name":"Atmospheric Survey","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,56,11,172983000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Atmospheric Survey","position":{"x":36,"y":458},"size":{"width":150,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"24","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":15}},{"id":1000008964,"deleted":false,"isVerified":false,"name":"Tripod","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,261516000],"dateModified":[2025,9,26,3,40,57,431494000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Tripod","position":{"x":440,"y":338.16666666666663},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"116"},"contentStyle":{"fontSize":12}},{"id":1000008453,"deleted":false,"isVerified":false,"name":"Initial Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,3,2,37,953915000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Initial Test\\nResults","position":{"x":334,"y":458},"size":{"width":83,"height":227},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"26","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":15,"whiteSpace":"pre-wrap"}},{"id":1000008506,"deleted":false,"isVerified":false,"name":"Duration(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,55,15,631437000],"dateModified":[2025,9,26,1,44,17,676798000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"duration","type":"text","label":"","options":[],"initialValue":null},"position":{"x":610,"y":101},"size":{"width":125,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"60"},"contentStyle":{"fontSize":12}},{"id":1000009018,"deleted":false,"isVerified":false,"name":"Comments:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,0,28,369307000],"dateModified":[2025,9,22,22,1,3,898834000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":934},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"169","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008507,"deleted":false,"isVerified":false,"name":"Permit Number","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,56,49,439567000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"variable","pageNumber":1,"locked":false,"content":"id","position":{"x":552,"y":44},"size":{"width":182,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"61"},"contentStyle":{"fontSize":12}},{"id":1000009019,"deleted":false,"isVerified":false,"name":"Comments:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,0,46,760729000],"dateModified":[2025,9,22,22,1,3,898834000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":953},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"170","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008504,"deleted":false,"isVerified":false,"name":"Date(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,52,47,746723000],"dateModified":[2025,9,26,1,44,14,393252000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"date","label":"","options":[],"initialValue":null},"position":{"x":572,"y":63},"size":{"width":163,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"58"},"contentStyle":{"fontSize":12}},{"id":1000009016,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,58,26,362000000],"dateModified":[2025,9,22,22,3,38,790848000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":799},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"167","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008505,"deleted":false,"isVerified":false,"name":"Time(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,54,12,227076000],"dateModified":[2025,10,25,23,13,0,665109000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"time","type":"time","label":"","options":[],"initialValue":null},"position":{"x":561,"y":82},"size":{"width":174,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"59"},"contentStyle":{"fontSize":12}},{"id":1000009017,"deleted":false,"isVerified":false,"name":"Comments:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,59,47,481924000],"dateModified":[2025,9,22,22,1,3,898834000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Comments","position":{"x":36,"y":915},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"168","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008510,"deleted":false,"isVerified":false,"name":"Rotating Equipment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,34,626426000],"dateModified":[2025,9,26,1,44,29,541934000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.rotatingEquipment","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":256.66666666666663},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"64"},"contentStyle":{}},{"id":1000009022,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,31,392002000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":474},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"173","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008511,"deleted":false,"isVerified":false,"name":"Rotating Equipment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,34,626426000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Rotating Equipment","position":{"x":61,"y":257.66666666666663},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"65"},"contentStyle":{"fontSize":12}},{"id":1000009023,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,31,678082000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":456},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"174","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008508,"deleted":false,"isVerified":false,"name":"Electric shock","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,8,6,514783000],"dateModified":[2025,9,26,1,44,31,92249000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.electricalShock","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":276.83333333333326},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"62"},"contentStyle":{}},{"id":1000009020,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,30,934686000],"dateModified":[2025,9,22,22,2,45,416323000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":510},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"171","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008509,"deleted":false,"isVerified":false,"name":"Electric shock","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,10,2,640016000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Electric shock","position":{"x":61,"y":277.83333333333326},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"63"},"contentStyle":{"fontSize":12}},{"id":1000009021,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,31,133103000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":492},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"172","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008498,"deleted":false,"isVerified":false,"name":"Meter Make/Model","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,45,989938000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Meter Make/Model","position":{"x":36,"y":507},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"22","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009010,"deleted":false,"isVerified":false,"name":"Performed Contractor Post Entry Critique","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,37,598836000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"____Performed Contractor Post Entry Critique","position":{"x":249.5,"y":838},"size":{"width":246,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"161","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008499,"deleted":false,"isVerified":false,"name":"Tester Initials","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,46,579190000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Tester Initials","position":{"x":36,"y":667},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"12","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009011,"deleted":false,"isVerified":false,"name":"Space Closed and/or Barricaded","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,37,598836000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"____Space Closed and/or Barricaded","position":{"x":530,"y":838},"size":{"width":203,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"162","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008496,"deleted":false,"isVerified":false,"name":"Hydrogen Sulfide","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,45,47910000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hydrogen Sulfide                       \\u003C10ppm","position":{"x":36,"y":603},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"16","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre"}},{"id":1000009008,"deleted":false,"isVerified":false,"name":"14. PERMIT CANCELED/CLOSED","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,951403000],"dateModified":[2025,9,22,22,3,37,598836000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"8. NOT-PERMIT CANCELLATION/CLOSURE","position":{"x":36,"y":818},"size":{"width":325,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"159","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008497,"deleted":false,"isVerified":false,"name":"Flammability","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,45,481035000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Flammability                              \\u003C10 of LEL","position":{"x":36,"y":587},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"17","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre"}},{"id":1000009009,"deleted":false,"isVerified":false,"name":"All Personnel Exited Space ","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,37,598836000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"____All Personnel Exited Space ","position":{"x":38,"y":838},"size":{"width":177,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"160","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008502,"deleted":false,"isVerified":false,"name":"Start Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,51,7,9576000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Start Time:","position":{"x":498,"y":82},"size":{"width":60,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"56","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000009014,"deleted":false,"isVerified":false,"name":"Date & Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,59,605970000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Date & Time","position":{"x":584,"y":897},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"165","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008503,"deleted":false,"isVerified":false,"name":"Date of Entry:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,51,7,114625000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date of Entry:","position":{"x":498,"y":63},"size":{"width":80,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"57","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000009015,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,57,57,688672000],"dateModified":[2025,9,22,21,58,23,494096000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":276},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"166","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008500,"deleted":false,"isVerified":false,"name":"Permit #:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,48,14,251095000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Permit #:","position":{"x":498,"y":44},"size":{"width":60,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"54","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009012,"deleted":false,"isVerified":false,"name":"Entry Supervisor Name: (Print)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,59,605970000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Entry Supervisor Name: (Print)","position":{"x":38,"y":897},"size":{"width":260,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"163","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008501,"deleted":false,"isVerified":false,"name":"Authorized Duration:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,17,49,47,991927000],"dateModified":[2025,9,22,19,23,0,527285000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Authorized Duration:","position":{"x":498,"y":101},"size":{"width":110,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"55","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000009013,"deleted":false,"isVerified":false,"name":"Entry Supervisor Signature: (Sign)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,54,3,952580000],"dateModified":[2025,9,22,22,3,59,605970000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Entry Supervisor Signature: (Sign)","position":{"x":327,"y":897},"size":{"width":230,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"164","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008490,"deleted":false,"isVerified":false,"name":"Meter Cal Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,41,257677000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Meter Cal Date                           Past 30 Days","position":{"x":36,"y":539},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"20","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre"}},{"id":1000009002,"deleted":false,"isVerified":false,"name":"12. ATTENDANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,48,21,46966000],"dateModified":[2025,9,22,21,48,59,904160000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"12. ATTENDANT LOG","position":{"x":36,"y":145},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"153","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008491,"deleted":false,"isVerified":false,"name":"Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,41,915487000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date","position":{"x":36,"y":491},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"23","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009003,"deleted":false,"isVerified":false,"name":"Attendant Name Print","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,48,21,242998000],"dateModified":[2025,9,22,21,50,16,531833000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"     Attendant Name Print","position":{"x":36,"y":163},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"154","fontWeight":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000008488,"deleted":false,"isVerified":false,"name":"Time of Sample","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,18,28,754617000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time of Sample","position":{"x":36,"y":651},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"13","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009000,"deleted":false,"isVerified":false,"name":"Contact Name:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,46,4,143892000],"dateModified":[2025,9,22,21,47,17,266761000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Contact Name:","position":{"x":404,"y":126},"size":{"width":330,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"151"},"contentStyle":{"fontSize":14}},{"id":1000008489,"deleted":false,"isVerified":false,"name":"Meter Serial #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,40,722003000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Meter Serial #","position":{"x":36,"y":523},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"21","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009001,"deleted":false,"isVerified":false,"name":"12. ATTENDANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,47,16,335461000],"dateModified":[2025,9,22,21,51,15,526711000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":235},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"152","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008494,"deleted":false,"isVerified":false,"name":"Ammonia","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,43,574098000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ammonia","position":{"x":36,"y":635},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"14","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000009006,"deleted":false,"isVerified":false,"name":"12. ATTENDANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,48,22,87128000],"dateModified":[2025,9,22,21,50,27,272398000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":217},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"157","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008495,"deleted":false,"isVerified":false,"name":"Oxigen","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,44,142695000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Oxygen                                        >19.5%\\u003C23.6%","position":{"x":36,"y":571},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"18","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre"}},{"id":1000009007,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,51,22,913544000],"dateModified":[2025,9,22,21,52,32,378960000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"12. ATTENDANT LOG","position":{"x":36,"y":257},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"158","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008492,"deleted":false,"isVerified":false,"name":"Meter Bump Test","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,42,537960000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Meter Bump Test                       Performed Daily (Y/N)","position":{"x":36,"y":555},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"19","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre"}},{"id":1000009004,"deleted":false,"isVerified":false,"name":"12. ATTENDANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,48,21,489014000],"dateModified":[2025,9,22,21,50,21,902091000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":181},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"155","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008493,"deleted":false,"isVerified":false,"name":"Carbon Monoxide","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,26,43,51803000],"dateModified":[2025,9,22,19,16,14,755978000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Carbon Monoxide                      \\u003C35ppm","position":{"x":36,"y":619},"size":{"width":701,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"15","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","paddingTop":"2px","paddingRight":"0px","paddingBottom":"3px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009005,"deleted":false,"isVerified":false,"name":"12. ATTENDANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,48,21,840451000],"dateModified":[2025,9,22,21,50,24,584920000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":199},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"156","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008482,"deleted":false,"isVerified":false,"name":"Entry Supervisor Signature: (Sign)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,33,214543000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Signature: (Sign)","position":{"x":327,"y":953},"size":{"width":230,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"48","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008994,"deleted":false,"isVerified":false,"name":"Time Established:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,42,2,693056000],"dateModified":[2025,9,22,21,46,7,385430000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Time Established:","position":{"x":42,"y":125},"size":{"width":330,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"145"},"contentStyle":{"fontSize":14}},{"id":1000008483,"deleted":false,"isVerified":false,"name":"Entry Supervisor Name: (Print)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,33,214543000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"Entry Supervisor Name: (Print)","position":{"x":38,"y":953},"size":{"width":260,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"49","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008995,"deleted":false,"isVerified":false,"name":"Two-way radio","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,43,49,236969000],"dateModified":[2025,9,22,21,44,15,515666000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":2,"locked":false,"content":{"name":"isVerified","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":424,"y":88},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"146"},"contentStyle":{}},{"id":1000008480,"deleted":false,"isVerified":false,"name":"Date & Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,3,138978000],"dateModified":[2025,9,22,19,11,17,238647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date & Time","position":{"x":585,"y":868},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"46","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008992,"deleted":false,"isVerified":false,"name":"Radio Channel #1","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,37,1,646662000],"dateModified":[2025,9,22,21,38,31,71084000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Radio Channel #1,","position":{"x":466,"y":65},"size":{"width":268,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"143"},"contentStyle":{"fontSize":14}},{"id":1000008481,"deleted":false,"isVerified":false,"name":"Date & Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,33,214543000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"Date & Time","position":{"x":584,"y":953},"size":{"width":150,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"47","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000008993,"deleted":false,"isVerified":false,"name":"Rescue Team:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,41,13,265600000],"dateModified":[2025,9,22,21,45,45,410552000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Rescue Team:","position":{"x":42,"y":103},"size":{"width":330,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"144"},"contentStyle":{"fontSize":14}},{"id":1000008486,"deleted":false,"isVerified":false,"name":"Performed Contractor Post Entry Critique","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,13,11,933612000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"____Performed Contractor Post Entry Critique","position":{"x":249.5,"y":907},"size":{"width":246,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"52","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008998,"deleted":false,"isVerified":false,"name":"Two-way radio","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,44,44,246314000],"dateModified":[2025,9,22,21,44,54,651343000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":2,"locked":false,"content":{"name":"isVerified","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":484,"y":88},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"149"},"contentStyle":{}},{"id":1000008487,"deleted":false,"isVerified":false,"name":"Space Closed and/or Barricaded","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,15,6,65961000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"____Space Closed and/or Barricaded","position":{"x":530,"y":907},"size":{"width":203,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"53","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008999,"deleted":false,"isVerified":false,"name":"Contact Number:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,45,22,828120000],"dateModified":[2025,9,22,21,47,17,266761000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Contact Number:","position":{"x":404,"y":104},"size":{"width":330,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"150"},"contentStyle":{"fontSize":14}},{"id":1000008484,"deleted":false,"isVerified":false,"name":"8. NOT-PERMIT CANCELLATION/CLOSURE","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,7,57,207490000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"8. NOT-PERMIT CANCELLATION/CLOSURE","position":{"x":36,"y":887},"size":{"width":325,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"50","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008996,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,43,49,236969000],"dateModified":[2025,9,22,21,44,41,993179000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Yes","position":{"x":444,"y":88},"size":{"width":35,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"147"},"contentStyle":{"fontSize":14}},{"id":1000008485,"deleted":false,"isVerified":false,"name":"All Personnel Exited Space ","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,4,11,31,117791000],"dateModified":[2025,9,22,21,53,56,311940000],"modifiedBy":null,"groupId":"group-1758596036308","contentType":"text","pageNumber":1,"locked":false,"content":"____All Personnel Exited Space ","position":{"x":38,"y":907},"size":{"width":177,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"51","fontWeight":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008997,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,21,44,44,246314000],"dateModified":[2025,9,22,21,45,16,130457000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"No","position":{"x":504,"y":88},"size":{"width":35,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"148"},"contentStyle":{"fontSize":14}},{"id":1000008538,"deleted":false,"isVerified":false,"name":"Barriers","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,32,0,359560000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Barriers","position":{"x":450,"y":257.66666666666663},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"91"},"contentStyle":{"fontSize":12}},{"id":1000008539,"deleted":false,"isVerified":false,"name":"Electric shock","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,44,40,767999000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.other","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":430,"y":276.83333333333326},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"92"},"contentStyle":{}},{"id":1000008536,"deleted":false,"isVerified":false,"name":"Double Block & Bleed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,22,19,28,55,813963000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Double Block & Bleed","position":{"x":450,"y":237.49999999999997},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"89"},"contentStyle":{"fontSize":12}},{"id":1000009048,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,2,50,801325000],"dateModified":[2025,9,22,22,3,0,31222000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":708},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"198","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008537,"deleted":false,"isVerified":false,"name":"Rotating Equipment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,32,10,750441000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.barriers","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":430,"y":256.66666666666663},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"90"},"contentStyle":{}},{"id":1000009049,"deleted":false,"isVerified":false,"name":"Reason Permit cancelled/Closed:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,4,2,651637000],"dateModified":[2025,9,22,22,4,56,332634000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":"Reason Permit cancelled/Closed:","position":{"x":37,"y":853},"size":{"width":700,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"199"},"contentStyle":{"fontSize":14}},{"id":1000008540,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,32,28,498738000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other","position":{"x":450,"y":277.83333333333326},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"93"},"contentStyle":{"fontSize":12}},{"id":1000009042,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,51,425138000],"dateModified":[2025,9,22,22,2,41,386527000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":528},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"193","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008531,"deleted":false,"isVerified":false,"name":"Ventilation","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,30,26,161345000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.ventilation","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":430,"y":196.16666666666666},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"84"},"contentStyle":{}},{"id":1000009043,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,51,830332000],"dateModified":[2025,9,22,22,2,41,386527000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":546},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"194","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008528,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,57,14,879043000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other","position":{"x":294,"y":237.49999999999997},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"82"},"contentStyle":{"fontSize":12}},{"id":1000009040,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,50,968442000],"dateModified":[2025,9,22,22,2,41,386527000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":564},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"191","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008529,"deleted":false,"isVerified":false,"name":"3. REQUIRED PRECAUTIONS","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,8,32,936840000],"dateModified":[2025,9,22,19,19,43,782350000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"3. REQUIRED PRECAUTIONS","position":{"x":425,"y":117},"size":{"width":312,"height":180},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"7","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000009041,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,51,139435000],"dateModified":[2025,9,22,22,2,41,386527000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":582},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"192","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008534,"deleted":false,"isVerified":false,"name":"Blank Flanged","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,22,19,28,14,48064000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Blank Flanged","position":{"x":450,"y":217.33333333333331},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"87"},"contentStyle":{"fontSize":12}},{"id":1000009046,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,2,50,381434000],"dateModified":[2025,9,22,22,3,0,31222000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":726},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"196","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008535,"deleted":false,"isVerified":false,"name":"Double Block & Bleed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,30,56,880292000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.doubleBlockAndBleed","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":430,"y":236.49999999999997},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"88"},"contentStyle":{}},{"id":1000009047,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,2,50,591299000],"dateModified":[2025,9,22,22,3,0,31222000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":744},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"197","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008532,"deleted":false,"isVerified":false,"name":"Ventilation","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,22,19,27,19,195454000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ventilation","position":{"x":450,"y":197.16666666666666},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"85"},"contentStyle":{"fontSize":12}},{"id":1000009044,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,52,138301000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":600},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"195","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008533,"deleted":false,"isVerified":false,"name":"Blank Flanged","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,12,13,392015000],"dateModified":[2025,9,26,3,30,41,671335000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.blankFlanged","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":430,"y":216.33333333333331},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"86"},"contentStyle":{}},{"id":1000009045,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,2,50,378420000],"dateModified":[2025,9,22,22,3,0,31222000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":762},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"196","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008522,"deleted":false,"isVerified":false,"name":"Statement","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,52,26,15777000],"dateModified":[2025,9,22,19,11,17,239647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"(check hazards - atmospheric hazards must be monitored if checked)","position":{"x":39,"y":137},"size":{"width":380,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"76"},"contentStyle":{"fontSize":12}},{"id":1000009034,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,49,654918000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":618},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"185","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008523,"deleted":false,"isVerified":false,"name":"Heat Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,55,25,9542000],"dateModified":[2025,9,26,1,44,35,961543000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.heatStress","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":271,"y":216.33333333333331},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"77"},"contentStyle":{}},{"id":1000009035,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,49,825148000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":636},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"186","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008520,"deleted":false,"isVerified":false,"name":"Entrapment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,37,18680000],"dateModified":[2025,9,26,1,44,32,804828000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.entrapment","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":271,"y":176},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"74"},"contentStyle":{}},{"id":1000009032,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,34,587541000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":294},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"183","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008521,"deleted":false,"isVerified":false,"name":"Entrapment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,37,18680000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Entrapment","position":{"x":292,"y":177},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"75"},"contentStyle":{"fontSize":12}},{"id":1000009033,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,34,985973000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":276},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"184","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008526,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,57,14,414603000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Engulfment","position":{"x":294,"y":197.16666666666666},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"80"},"contentStyle":{"fontSize":12}},{"id":1000009038,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,50,291977000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":654},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"189","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008527,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,57,14,878657000],"dateModified":[2025,9,26,3,44,37,663046000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.other","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":271,"y":236.49999999999997},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"81"},"contentStyle":{}},{"id":1000009039,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,50,457011000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":672},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"190","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008524,"deleted":false,"isVerified":false,"name":"Heat Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,55,50,863420000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Heat Stress","position":{"x":294,"y":217.33333333333331},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"78"},"contentStyle":{"fontSize":12}},{"id":1000009036,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,49,976693000],"dateModified":[2025,9,22,22,2,41,387533000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":690},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"187","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008525,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,57,14,414301000],"dateModified":[2025,9,26,1,44,34,303781000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.engulfment","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":271,"y":196.16666666666666},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"79"},"contentStyle":{}},{"id":1000009037,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,50,126929000],"dateModified":[2025,9,22,22,3,0,31222000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":780},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"188","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008514,"deleted":false,"isVerified":false,"name":"Combustible gas levels","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,35,538265000],"dateModified":[2025,9,26,1,44,27,159860000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.combustibleDust","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":216.33333333333331},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"68"},"contentStyle":{}},{"id":1000009026,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,32,455740000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":402},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"177","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008515,"deleted":false,"isVerified":false,"name":"Combustible dust levels","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,35,538265000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Combustible dust levels","position":{"x":61,"y":217.33333333333331},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"69"},"contentStyle":{"fontSize":12}},{"id":1000009027,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,32,795351000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":384},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"178","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008512,"deleted":false,"isVerified":false,"name":"Toxic Gas Vapors","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,35,36187000],"dateModified":[2025,9,26,1,44,28,318149000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.toxicGas","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":236.49999999999997},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"66"},"contentStyle":{}},{"id":1000009024,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,31,932602000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":438},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"175","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008513,"deleted":false,"isVerified":false,"name":"Toxic gas vapors","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,35,36187000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Toxic gas vapors","position":{"x":61,"y":237.49999999999997},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"67"},"contentStyle":{"fontSize":12}},{"id":1000009025,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,32,182682000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":420},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"176","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008518,"deleted":false,"isVerified":false,"name":"Oxygen deficiency or enrichment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,36,516820000],"dateModified":[2025,9,26,1,44,24,442161000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.oxygenDeficiency","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":176},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"72"},"contentStyle":{}},{"id":1000009030,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,33,868343000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":330},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"181","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008519,"deleted":false,"isVerified":false,"name":"Oxygen deficiency or enrichment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,36,516820000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Oxygen deficiency or enrichment","position":{"x":61,"y":177},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"73"},"contentStyle":{"fontSize":12}},{"id":1000009031,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,34,242875000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":312},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"182","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008516,"deleted":false,"isVerified":false,"name":"Flammable Gasses or Vapors","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,36,31576000],"dateModified":[2025,9,26,1,44,25,770756000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.flammableGas","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":41,"y":196.16666666666666},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"70"},"contentStyle":{}},{"id":1000009028,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,33,80076000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":366},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"179","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008517,"deleted":false,"isVerified":false,"name":"Flammable Gasses or Vapors","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,18,17,36,31576000],"dateModified":[2025,9,22,19,20,22,316632000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Flammable Gasses or Vapors","position":{"x":61,"y":197.16666666666666},"size":{"width":178,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"71"},"contentStyle":{"fontSize":12}},{"id":1000009029,"deleted":false,"isVerified":false,"name":"13. ENTRANT LOG","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,1,33,387266000],"dateModified":[2025,9,22,22,1,47,250306000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":2,"locked":false,"content":null,"position":{"x":36,"y":348},"size":{"width":701,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"180","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008442,"deleted":false,"isVerified":false,"name":"Border","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,21,48,758483000],"dateModified":[2025,9,22,21,53,12,739259000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":19,"y":0},"size":{"width":718,"height":973},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"1"},"contentStyle":{}},{"id":1000008954,"deleted":false,"isVerified":false,"name":"Retrieval System","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"text","pageNumber":1,"locked":false,"content":"Retrieval System","position":{"x":254,"y":358.3333333333333},"size":{"width":130,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"106"},"contentStyle":{"fontSize":12}},{"id":1000008443,"deleted":false,"isVerified":false,"name":"Confined Space Permit (SMP-7)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,27,42,782931000],"dateModified":[2025,9,22,20,59,14,949366000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Confined Space Permit (SMP-7)","position":{"x":19,"y":0},"size":{"width":718,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"2","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":20}},{"id":1000008955,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.fallProtection","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":231,"y":336.16666666666663},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"107"},"contentStyle":{}},{"id":1000008952,"deleted":false,"isVerified":false,"name":"Entrapment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.nonSparkingTools","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":231,"y":316},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"104"},"contentStyle":{}},{"id":1000008953,"deleted":false,"isVerified":false,"name":"Non-Sparking Tools","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"text","pageNumber":1,"locked":false,"content":"Non-Sparking Tools","position":{"x":252,"y":318},"size":{"width":130,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"105"},"contentStyle":{"fontSize":12}},{"id":1000008446,"deleted":false,"isVerified":false,"name":"1. GENERAL INFORMATION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,35,31,68236000],"dateModified":[2025,9,22,19,11,17,239647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"1. GENERAL INFORMATION","position":{"x":36,"y":42},"size":{"width":701,"height":77},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"5","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008958,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,260512000],"dateModified":[2025,9,26,3,40,57,431494000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other","position":{"x":440,"y":358.3333333333333},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"110"},"contentStyle":{"fontSize":12}},{"id":1000008447,"deleted":false,"isVerified":false,"name":"4. REQUIRED PPE AND EQUIPMENT","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,43,21,238236000],"dateModified":[2025,9,26,3,40,58,243454000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"4. REQUIRED PPE AND EQUIPMENT","position":{"x":36,"y":296},"size":{"width":701,"height":103},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"8","fontWeight":"bold"},"contentStyle":{"fontSize":15}},{"id":1000008959,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,44,260512000],"dateModified":[2025,9,26,3,42,54,73012000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.tripod","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":417,"y":336.16666666666663},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"111"},"contentStyle":{}},{"id":1000008444,"deleted":false,"isVerified":false,"name":"Completed Permit must be posted on job site - valid only for indicated date & time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,30,10,178160000],"dateModified":[2025,9,22,19,11,17,239647000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Completed Permit must be posted on job site - valid only for indicated date & time","position":{"x":19,"y":28},"size":{"width":718,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#dad8d8","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"3","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008956,"deleted":false,"isVerified":false,"name":"Liveline","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"text","pageNumber":1,"locked":false,"content":"Liveline","position":{"x":254,"y":378.5},"size":{"width":75,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"108"},"contentStyle":{"fontSize":12}},{"id":1000008445,"deleted":false,"isVerified":false,"name":"Sider","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,2,32,12,484944000],"dateModified":[2025,9,22,21,53,25,982266000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":19,"y":42},"size":{"width":18,"height":727},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#07bb25","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"4"},"contentStyle":{}},{"id":1000008957,"deleted":false,"isVerified":false,"name":"Heat Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.retrievalSystem","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":231,"y":356.3333333333333},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"109"},"contentStyle":{}},{"id":1000008946,"deleted":false,"isVerified":false,"name":"GCFI","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,985670000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"text","pageNumber":1,"locked":false,"content":"GCFI","position":{"x":65,"y":338.16666666666663},"size":{"width":79,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"98"},"contentStyle":{"fontSize":12}},{"id":1000008947,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.explosionProofTools","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":42,"y":376.5},"size":{"width":20,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"99"},"contentStyle":{}},{"id":1000008944,"deleted":false,"isVerified":false,"name":"Entrapment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.faceShield","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":42,"y":316},"size":{"width":20,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"96"},"contentStyle":{}},{"id":1000008945,"deleted":false,"isVerified":false,"name":"Face Shield","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"text","pageNumber":1,"locked":false,"content":"Face Shield","position":{"x":63,"y":318},"size":{"width":79,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"97"},"contentStyle":{"fontSize":12}},{"id":1000008950,"deleted":false,"isVerified":false,"name":"Fall Protection","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"text","pageNumber":1,"locked":false,"content":"Fall Protection","position":{"x":254,"y":338.16666666666663},"size":{"width":130,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"102"},"contentStyle":{"fontSize":12}},{"id":1000008951,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,20,28,586068000],"dateModified":[2025,9,26,3,42,42,191031000],"modifiedBy":null,"groupId":"group-1758586828581-vhvqeuu","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.lifeline","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":231,"y":376.5},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"103"},"contentStyle":{}},{"id":1000008948,"deleted":false,"isVerified":false,"name":"Low Voltage Tools","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,446551000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"text","pageNumber":1,"locked":false,"content":"Low Voltage Tools","position":{"x":65,"y":358.3333333333333},"size":{"width":100,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"100"},"contentStyle":{"fontSize":12}},{"id":1000008949,"deleted":false,"isVerified":false,"name":"Engulfment","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,446551000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.fcfi","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":42,"y":336.16666666666663},"size":{"width":20,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"101"},"contentStyle":{}},{"id":1000008942,"deleted":false,"isVerified":false,"name":"Explosion Proof Tools","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"text","pageNumber":1,"locked":false,"content":"Explosion Proof Tools","position":{"x":65,"y":378.5},"size":{"width":130,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"94"},"contentStyle":{"fontSize":12}},{"id":1000008943,"deleted":false,"isVerified":false,"name":"Heat Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,19,17,24,445544000],"dateModified":[2025,9,26,3,42,10,986662000],"modifiedBy":null,"groupId":"group-1758586664475","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.lovVoltageTools","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":42,"y":356.3333333333333},"size":{"width":20,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"95"},"contentStyle":{}},{"id":1000009267,"deleted":false,"isVerified":false,"name":"Ppe Other(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,3,41,9,516823000],"dateModified":[2025,9,26,3,43,13,828337000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.otherDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":482,"y":359},"size":{"width":200,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"201"},"contentStyle":{"fontSize":12}},{"id":1000009264,"deleted":false,"isVerified":false,"name":"Precautions Other(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,3,32,45,7946000],"dateModified":[2025,9,26,3,34,22,591349000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"precautions.otherDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":482,"y":278},"size":{"width":200,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"200"},"contentStyle":{"fontSize":12}},{"id":1000009270,"deleted":false,"isVerified":false,"name":"tester initials","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,3,46,24,72691000],"dateModified":[2025,9,26,3,46,41,969880000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"text","label":"","options":[],"initialValue":null},"position":{"x":335,"y":492},"size":{"width":80,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"204"},"contentStyle":{}},{"id":1000009268,"deleted":false,"isVerified":false,"name":"Hazards Other(input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,3,43,16,184066000],"dateModified":[2025,9,26,3,44,34,429743000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.otherDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":272,"y":260},"size":{"width":150,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"202"},"contentStyle":{"fontSize":12}},{"id":1000009269,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,3,45,19,4823000],"dateModified":[2025,9,26,3,46,16,399625000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"text","label":"","options":[],"initialValue":null},"position":{"x":335,"y":492},"size":{"width":80,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"203"},"contentStyle":{}}],"size":{"width":7.7,"height":10.15},"formType":"ConfinedSpace","isPrimary":true},"message":"Primary form found.","timestamp":[2026,1,25,15,38,26,247982200]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/forms/get-primary-form-by-type/ConfinedSpace","rt":"json"},"1535148311":{"b":{"responseData":[{"id":4152,"name":"PID","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":4153,"name":"Extra","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4155,"name":"John Cockerill","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4156,"name":"Kiewit","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4157,"name":"Mitsubishi","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4158,"name":"HOLTEC","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4159,"name":"US Water","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4160,"name":"Gas (Vendor)","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":4209,"name":"John Cockeril","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4402,"name":"HPS & HHS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4403,"name":"Condensate System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CND"},{"id":4454,"name":"Closed Cooling Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCW"},{"id":4653,"name":"LPS & HLS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4654,"name":"IPS & HIS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5552,"name":"Cleaver Brooks","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5652,"name":"Heat Trace Iso","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":5653,"name":"Heat Trace","category":{"id":2552,"name":"System","alias":"system"},"alias":"HTS"},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5803,"name":"Cold Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"CRH"},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5903,"name":"Feed Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BFW"},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5905,"name":"LUBE OIL SYSTEM","category":{"id":2552,"name":"System","alias":"system"},"alias":"LOS"},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7653,"name":"Instrument Air","category":{"id":2552,"name":"System","alias":"system"},"alias":"INA"},{"id":7702,"name":"Hot Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"HRH"},{"id":9302,"name":"Aux Steam","category":{"id":2552,"name":"System","alias":"system"},"alias":"AXS"},{"id":9303,"name":"Demin Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWS"},{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10908,"name":"Chemical Feed System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCF"},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12503,"name":"Air Cool Condenser","category":{"id":2552,"name":"System","alias":"system"},"alias":"ACC"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":14102,"name":"Service Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SWS"},{"id":14103,"name":"Blow Down System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BDN"},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17305,"name":"BOP","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18903,"name":"GLAND STEAM","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18905,"name":"STEAM TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"STP"},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20504,"name":"COMBUSTION TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"CTP"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23708,"name":"Potable Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PWS"},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23710,"name":"Fire Protection System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FPS"},{"id":25302,"name":"Sampling System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SMP"},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":28502,"name":"ECA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28503,"name":"TCA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":30102,"name":"Fuel Gas System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FGS"},{"id":30103,"name":"DRAINS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31704,"name":"COMPRESSED GASSES","category":{"id":2552,"name":"System","alias":"system"},"alias":"CMP"},{"id":31705,"name":"2C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31706,"name":"3C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33304,"name":"HRSG","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":34902,"name":"DUCT BURNER","category":{"id":2552,"name":"System","alias":"system"},"alias":"BUR"},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":38102,"name":"AFCU","category":{"id":2552,"name":"System","alias":"system"},"alias":"SCR"},{"id":39702,"name":"Bulk Ammonia System","category":{"id":2552,"name":"System","alias":"system"},"alias":"AQA"},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41302,"name":"CONTROL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"COS"},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":42952,"name":"Electrical Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":42953,"name":"Electrical","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":42954,"name":"Electrical Panel Schedule Picture","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":46202,"name":"SEAL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"SOS"},{"id":1000000546,"name":"Demin Water Treatment System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWT"},{"id":1000000547,"name":"LP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"LPS"},{"id":1000000548,"name":"IP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"IPS"},{"id":1000000549,"name":"HP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"HPS"},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000954,"name":"Sanitary Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SDR"},{"id":1000000955,"name":"Plant Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PDR"},{"id":1000000956,"name":"Waste Water Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"WDR"},{"id":1000008028,"name":"Active","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"ACT"},{"id":1000008029,"name":"Inactive","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"INA"},{"id":1000008030,"name":"Closed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"CLS"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009481,"name":"HT Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009482,"name":"Electrical One and Three Line Diagram","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009483,"name":"HRSG Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009484,"name":"HRSG Isometrics","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009485,"name":"BOP Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009486,"name":"Isometric Large Bore Piping none-stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009487,"name":"Isometric Large Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009488,"name":"Isometric Small Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009492,"name":"processed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000011618,"name":"Unit 1","category":{"id":1000011617,"name":"Unit","alias":"unit"},"alias":"01"},{"id":1000011619,"name":"Unit 2","category":{"id":1000011617,"name":"Unit","alias":"unit"},"alias":"02"},{"id":1000011620,"name":"BOP","category":{"id":1000011617,"name":"Unit","alias":"unit"},"alias":"00"},{"id":1000011622,"name":"No","category":{"id":1000011621,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"NO"},{"id":1000011623,"name":"Yes","category":{"id":1000011621,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"YES"},{"id":1000011624,"name":"Drain Open","category":{"id":1000011621,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"{\\"name\\":\\"Drain Open\\",\\"rawText\\":\\"Verify [tag1] is open\\",\\"segments\\":[{\\"type\\":\\"text\\",\\"content\\":\\"Verify \\"},{\\"type\\":\\"placeholder\\",\\"content\\":\\"tag1\\",\\"placeholderIndex\\":0},{\\"type\\":\\"text\\",\\"content\\":\\" is open\\"}]}"},{"id":1000011640,"name":"Fire Side","category":{"id":1000011639,"name":"Group","alias":"group"},"alias":"FSD"},{"id":1000011641,"name":"Water Side","category":{"id":1000011639,"name":"Group","alias":"group"},"alias":"WSD"},{"id":1000011642,"name":"Unit 1","category":{"id":1000011639,"name":"Group","alias":"group"},"alias":"U1"},{"id":1000011643,"name":"Unit 2","category":{"id":1000011639,"name":"Group","alias":"group"},"alias":"U2"},{"id":1000011679,"name":"TestVen5","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":"TestVen5"},{"id":1000011699,"name":"Strainer","category":{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"},"alias":"STR"},{"id":1000011700,"name":"Terminal Attemperator","category":{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"},"alias":"TERM ATTEMP"},{"id":1000011701,"name":"Interstage Attemperator","category":{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"},"alias":"INTERSTAGE ATTEMP"},{"id":1000011702,"name":"Boiler Feed Pump","category":{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"},"alias":"BFP"},{"id":1000011703,"name":"Condensate Pump","category":{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"},"alias":"CND PMP"},{"id":1000011713,"name":"LIVE-DEAD-LIVE","category":{"id":1000011621,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"{\\"name\\":\\"LIVE-DEAD-LIVE\\",\\"rawText\\":\\"LIVE-DEAD-LIVE AT THE BREAKER\\",\\"segments\\":[{\\"type\\":\\"text\\",\\"content\\":\\"LIVE-DEAD-LIVE AT THE BREAKER\\"}]}"},{"id":5000011547,"name":"New Vend11","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":"nv11"}],"message":"All values retrieved successfully","timestamp":[2026,1,25,15,38,26,364060600]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/all-values","rt":"json"},"2334713637":{"b":{"responseData":[{"id":1000009720,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,3,3,699614000],"dateModified":[2025,10,25,5,3,3,699614000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":null,"space":null,"issuedTo":"Dan Schomig","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":0},{"id":1000009736,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,22,57,44,228061000],"dateModified":[2025,10,25,23,6,53,668379000],"workScope":" HRSG inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24075","date":"2025-10-26","time":"18:00","space":"U1 HRSG LOWER","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":1},{"id":1000009737,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,22,58,8,873827000],"dateModified":[2025,10,25,23,6,53,668379000],"workScope":"HRSG inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24076","date":"2025-10-26","time":"18:00","space":"HRSG UPPER","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":2},{"id":1000009738,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,22,58,12,814015000],"dateModified":[2025,10,26,0,18,7,506666000],"workScope":"Lower duct inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-26","time":"18:00","space":"U1 STED","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":3},{"id":1000009739,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,22,59,5,555689000],"dateModified":[2025,10,25,23,6,53,668379000],"workScope":"CRT and DEA inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24074","date":"2025-10-26","time":"18:00","space":"U1 CRT AND DA","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":4},{"id":1000009747,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,0,17,27,425498000],"dateModified":[2025,10,26,0,19,37,592092000],"workScope":"ACC upper duct inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-26","time":"05:00","space":"ACC Upper","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":5},{"id":1000009757,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,17,24,20,498524000],"dateModified":[2025,10,26,17,26,21,938343000],"workScope":"Clean inside of HRSG","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24080","date":"2025-10-26","time":"18:00","space":"HRSG LOWER","issuedTo":"Danil Klokov","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":6},{"id":1000009765,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,22,32,49,792146000],"dateModified":[2025,10,26,22,33,21,985268000],"workScope":"Enter confined space (GT fireside)\\nEstablish hole watch\\nSet up lighting\\nInspect welds/ liner plates/hardware for cracks and or damage \\nPlan scaffolding if needed \\nSet up tooling ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":null,"space":"GT exhaust ","issuedTo":"John Pittman ","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":7},{"id":1000009852,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,17,24,14,139940000],"dateModified":[2025,10,30,17,28,23,971496000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24116","date":"2025-10-30","time":"19:00","space":"HRSG LOWER","issuedTo":"Corey Brown","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":"3","calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":8},{"id":1000009882,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,33,8,481771000],"dateModified":[2025,10,30,18,35,48,41002000],"workScope":"Break down and remove scaffold that’s has been erected in the manifold","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24117","date":"2025-10-30","time":"07:00","space":"U1 GT INLEN","issuedTo":"Corey Love","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":9},{"id":1000009895,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,42,20,808218000],"dateModified":[2025,10,30,18,45,0,773219000],"workScope":"Inspection, clean area","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24118","date":"2025-10-31","time":"18:42","space":"U1 STED","issuedTo":"Justin W","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":"3","calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":10},{"id":1000009908,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,38,56,275176000],"dateModified":[2025,10,30,20,40,52,265352000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24119","date":"2025-10-31","time":"07:00","space":"HRSG LOWER","issuedTo":"Corey Brown","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":"3","calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":11},{"id":1000009919,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,48,59,888204000],"dateModified":[2025,10,30,20,52,7,275601000],"workScope":"GT exhaust liner repairs","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24120","date":"2025-10-31","time":"07:00","space":"U1 GT EXHAUST","issuedTo":"MITSUBISHI","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":true,"fcfi":true,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":12},{"id":1000009935,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,10,27,307536000],"dateModified":[2025,10,30,21,17,50,866543000],"workScope":"U1 SCR BAFFLE PLATE REPAIR","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24121","date":"2025-10-31","time":"07:00","space":"U1 HRSG LOWER","issuedTo":"Keb Basset","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":13},{"id":1000009953,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,31,30,383422000],"dateModified":[2025,10,31,17,34,4,673633000],"workScope":"Visual inspection of GT inlet.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24125","date":"2025-11-01","time":"08:00","space":"U1 GT INLET","issuedTo":"Corey Love","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":14},{"id":1000009958,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,18,389695000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"Inspections of Upper/Lower ACC, STED, GTED, HRSG","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24129","date":"2025-11-01","time":"05:00","space":"U2 HRSG LOWER","issuedTo":"Ryan sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":15},{"id":1000009959,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,23,115702000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24130","date":"2025-11-01","time":"05:00","space":"U2 HRSG UPPER","issuedTo":"Ryan sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":false,"combustibleDust":true,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":16},{"id":1000009960,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,24,612141000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24127","date":"2025-11-01","time":"05:01","space":"U2 CRT","issuedTo":"Ryan sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":true,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":17},{"id":1000009961,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,27,6838000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24128","date":"2025-11-01","time":"05:00","space":"U2 STED","issuedTo":"Ryan sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":18},{"id":1000009962,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,28,466733000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"INSPECTION","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24126","date":"2025-11-01","time":"05:00","space":"U2 ACC UPPER","issuedTo":"Ryan sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":19},{"id":1000009979,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,8,26,367302000],"dateModified":[2025,11,1,21,10,56,267821000],"workScope":"Build scaffold inside HRSG for SCR upper baffle","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24137","date":"2025-11-02","time":"07:00","space":"U1 HRSG LOWER","issuedTo":"Joe Hart","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":true,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":20},{"id":1000009983,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,17,11,341766000],"dateModified":[2025,11,1,21,20,18,630182000],"workScope":"Weld repairs cracks on supports","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24138","date":"2025-11-01","time":"08:00","space":"U1 HRSG LOWER","issuedTo":"John Pittman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":true,"other":false,"otherDescription":""},"ppe":{"faceShield":true,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":21},{"id":1000009990,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,26,52,988840000],"dateModified":[2025,11,1,21,28,51,232549000],"workScope":"Inspection and pictures","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24139","date":"2025-11-02","time":"10:00","space":"U1 HRSG LOWER","issuedTo":"Ronald McMurtry","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":22},{"id":1000010011,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,19,53,466776000],"dateModified":[2025,11,2,4,22,6,762592000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24140","date":"2025-11-02","time":"05:00","space":null,"issuedTo":"Scott","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":23},{"id":1000010015,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,25,6,274909000],"dateModified":[2025,11,2,4,27,3,981043000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24141","date":"2025-11-02","time":"09:00","space":"U2 HRSG LOWER","issuedTo":"GTS/John Pittman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":24},{"id":1000010019,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,28,11,949442000],"dateModified":[2025,11,2,4,31,6,827844000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24142","date":"2025-11-02","time":"05:00","space":"U1 HRSG LOWER","issuedTo":"John Pittman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":25},{"id":1000010059,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,17,50,59,769354000],"dateModified":[2025,11,2,17,53,43,377174000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24146","date":"2025-11-02","time":"19:00","space":"U1 HRSG LOWER","issuedTo":"Corey Brown","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":"6","calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":26},{"id":1000010078,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,36,28,805987000],"dateModified":[2025,11,2,19,39,19,414517000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24147","date":"2025-11-03","time":"08:00","space":"U2 HRSG LOWER","issuedTo":"John Pittman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":27},{"id":1000010088,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,22,35,30,39927000],"dateModified":[2025,11,2,22,37,38,282827000],"workScope":"Erecting scaffold for the Catalyst change out","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24148","date":"2025-11-03","time":"06:00","space":"U2 HRSG LOWER","issuedTo":"David Hall","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":28},{"id":1000010110,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,33,2,838845000],"dateModified":[2025,11,3,17,35,32,331396000],"workScope":"Enter the unit 1 penthouse to do thickness readings on the header","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24159","date":"2025-11-04","time":"06:00","space":"U1 HRSG UPPER","issuedTo":"Matt Wrightsman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":29},{"id":1000010117,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,43,36,775284000],"dateModified":[2025,11,3,17,45,17,556639000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24160","date":"2025-11-03","time":"19:00","space":"U1 HRSG LOWER","issuedTo":"Corey Brown","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":"6","calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":30},{"id":1000010128,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,18,49,52,897818000],"dateModified":[2025,11,3,18,58,26,959546000],"workScope":"Tear down STED scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24161","date":"2025-11-04","time":"07:00","space":"U1 STED","issuedTo":"Joe Hart","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":31},{"id":1000010129,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,18,49,56,420569000],"dateModified":[2025,11,3,18,58,26,960560000],"workScope":"Tear down HRSG scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24162","date":"2025-11-04","time":"07:00","space":"U1 HRSG LOWER","issuedTo":"Joe Hart","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":32},{"id":1000010141,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,10,15,34030000],"dateModified":[2025,11,3,19,10,41,700401000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-04","time":"08:00","space":"U2 HRSG LOWER","issuedTo":"John Pittman","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":33},{"id":1000010229,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,17,12,443884000],"dateModified":[2025,11,6,18,19,19,978579000],"workScope":"Final inspection Unit 2 Gas Turbine Exhaust","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24192","date":"2025-11-07","time":"06:00","space":"U2 HRSG LOWER","issuedTo":"Ryan Sedler","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":true,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":34},{"id":1000010238,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,19,55,30,329103000],"dateModified":[2025,11,6,19,58,37,211326000],"workScope":"Taking down unit one Erecting scaffold for the Catalyst change out in unit 2","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24193","date":"2025-11-07","time":"06:00","space":"HRSG 2 stage 1 and 2 Catalyst","issuedTo":"David Hall","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":true,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":35},{"id":1000010306,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,7,33,43,439590000],"dateModified":[2025,11,11,7,33,43,439590000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-11","time":null,"space":null,"issuedTo":"Ben Swan","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":36},{"id":1000010315,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,9,29,199131000],"dateModified":[2025,11,11,14,11,13,294219000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24199","date":"2025-11-12","time":null,"space":null,"issuedTo":"Joe Hart","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":37},{"id":1000010321,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,20,9,645628000],"dateModified":[2025,11,11,14,24,3,13143000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24200","date":"2025-11-11","time":null,"space":null,"issuedTo":"Richard Jones","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":38},{"id":1000010324,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,20,9,802865000],"dateModified":[2025,11,11,14,20,9,802865000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-11","time":null,"space":null,"issuedTo":"Richard Jones","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":false,"flammableGas":false,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":false,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":39},{"id":1000010362,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,14,4,13,23,772984000],"dateModified":[2025,11,14,4,17,15,386316000],"workScope":"Taking down unit one Erecting scaffold for the Catalyst change out in unit 2","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24203","date":"2025-11-14","time":"06:00","space":"U2 HRSG LOWER","issuedTo":"David Hall","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":40},{"id":1000010379,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"ConfinedSpace","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,18,1,24,47,477402000],"dateModified":[2025,11,18,1,27,7,8862000],"workScope":"Inspect the synergy work","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24211","date":"2025-11-18","time":"06:00","space":"U2 HRSG LOWER","issuedTo":"MATT WRIGHTSMAN","duration":"12 hours","lotoNum":null,"hotWorkNum":null,"ventilation":false,"blankFlanged":false,"meterModel":"RKI GX-3R PRO","meterNum":null,"calibrated":true,"hazards":{"oxygenDeficiency":true,"flammableGas":true,"combustibleDust":false,"toxicGas":false,"rotatingEquipment":false,"electricalShock":false,"entrapment":false,"engulfment":false,"heatStress":false,"other":false,"otherDescription":""},"ppe":{"faceShield":false,"fcfi":false,"lovVoltageTools":false,"explosionProofTools":false,"nonSparkingTools":false,"fallProtection":true,"retrievalSystem":false,"lifeline":false,"personalAtmosphericMeter":true,"tripod":false,"other":false,"otherDescription":""},"precautions":{"ventilation":false,"blankFlanged":false,"doubleBlockAndBleed":false,"barriers":false,"other":false,"otherDescription":"","lockOutTagOut":"","hotWorkPermit":""},"index":41}],"message":"Confined space requests retrieved successfully","timestamp":[2026,1,25,15,38,26,272132200]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/confined-spaces/get-all-confined-space","rt":"json"},"3998057701":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},{"id":1000011617,"name":"Unit","alias":"unit"},{"id":1000011621,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},{"id":1000011639,"name":"Group","alias":"group"},{"id":1000011698,"name":"Equipment Name","alias":"equipmentName"}],"message":"All categories retrieved successfully","timestamp":[2026,1,25,15,38,26,247982200]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/categories","rt":"json"},"__nghData__":[{},{"c":{"0":[],"3":[],"4":[]},"n":{"2":"1f"},"t":{"3":"t2","4":"t3"}},{"n":{"2":"hfn2"}},{"t":{"0":"t4"},"c":{"0":[]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,11,12,13,14,15,16,17]},{"t":{"1":"t5","2":"t6"},"c":{"1":[{"i":"t5","r":1}],"2":[]}},{"t":{"1":"t10","2":"t12","3":"t13"},"c":{"1":[{"i":"t10","r":1,"c":{"1":[],"4":[]},"n":{"3":"2f"},"t":{"4":"t11"}}],"2":[],"3":[]}},{"t":{"3":"t0","4":"t1","11":"t7","16":"t8"},"c":{"3":[],"4":[{"i":"t1","r":1}],"11":[],"16":[]}},{"t":{"1":"t14","2":"t18","3":"t19"},"c":{"1":[{"i":"t14","r":1,"t":{"6":"t15","7":"t16"},"c":{"6":[{"i":"t15","r":1,"x":5}],"7":[{"i":"t16","r":1,"t":{"2":"t17"},"c":{"2":[{"i":"t17","r":1,"x":2}]}}]}}],"2":[],"3":[]}},{"t":{"1":"t68","3":"t70"},"c":{"1":[{"i":"t68","r":1,"t":{"3":"t69"},"c":{"3":[]}}],"3":[]}},{"t":{"0":"t55","1":"t73","2":"t74"},"c":{"0":[{"i":"t55","r":3,"t":{"0":"t56","3":"t57","7":"t72"},"c":{"0":[{"i":"t56","r":1}],"3":[{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]},"x":8},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]}}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":10},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":11},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":5},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t71"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]},"x":3}]}}],"7":[{"i":"t72","r":1}]}}],"1":[],"2":[]}},{"t":{"1":"t78","2":"t79"},"c":{"1":[{"i":"t78","r":1}],"2":[]}},{"t":{"0":"t76","1":"t77"},"c":{"0":[],"1":[{"i":"t77","r":1}]}},{"n":{"1":"0f4n3","5":"0f2nfnf2"},"d":[3,4],"e":{"1":1,"5":3},"c":{"6":[{"i":"c4196911450","r":1}]}},{"t":{"0":"t32"},"c":{"0":[]}},{"t":{"0":"t33"},"c":{"0":[]}},{"t":{"0":"t34"},"c":{"0":[]}},{"t":{"0":"t35"},"c":{"0":[]}},{"t":{"0":"t36"},"c":{"0":[]}},{"t":{"0":"t37"},"c":{"0":[]}},{"t":{"0":"t38"},"c":{"0":[]}},{"n":{"2":"hfn2","5":"hfn3"}},{"c":{"0":[{"i":"c874109360","r":1}],"8":[{"i":"t39","r":3,"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]}]},"t":{"8":"t39"}}]}</script></body></html>`;