export default `<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <title>Frontend</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link rel="stylesheet" href="styles.css"><style ng-app-id="ng">

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
  padding: 1.25rem;
  overflow-y: auto;
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
  min-height: 0;
  overflow-y: auto;
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
  padding: 0.5rem 0;
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
  white-space: nowrap;
  flex-shrink: 0;
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

.engraver-container[_ngcontent-ng-c585854076] {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  background-color: var(--card-background);
  color: var(--primary-text);
  min-height: 400px;
  padding-bottom: 0.5rem;
}
.batch-sidebar[_ngcontent-ng-c585854076] {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  align-self: flex-start;
}
.batch-header[_ngcontent-ng-c585854076] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.batch-header[_ngcontent-ng-c585854076]   h4[_ngcontent-ng-c585854076] {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text);
}
.batch-count[_ngcontent-ng-c585854076] {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
  background: var(--primary-background);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}
.progress-bar-container[_ngcontent-ng-c585854076] {
  height: 6px;
  background: var(--primary-background);
  border-radius: 3px;
  margin-bottom: 1rem;
  overflow: hidden;
}
.progress-bar[_ngcontent-ng-c585854076] {
  height: 100%;
  background: var(--accent-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.batch-list[_ngcontent-ng-c585854076] {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}
.batch-list[_ngcontent-ng-c585854076]::-webkit-scrollbar {
  width: 6px;
}
.batch-list[_ngcontent-ng-c585854076]::-webkit-scrollbar-track {
  background: transparent;
}
.batch-list[_ngcontent-ng-c585854076]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color);
  border-radius: 3px;
}
.batch-item[_ngcontent-ng-c585854076] {
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
.batch-item[_ngcontent-ng-c585854076]:hover {
  transform: translateY(-1px);
  background: var(--hover-color);
}
.batch-item.active[_ngcontent-ng-c585854076] {
  border-color: var(--accent-color);
  background: var(--menu-item-hover-bg-color);
}
.batch-item.completed[_ngcontent-ng-c585854076] {
  opacity: 0.85;
  background: var(--success-background);
}
.batch-item.error[_ngcontent-ng-c585854076] {
  background: var(--error-background);
}
.batch-item.processing[_ngcontent-ng-c585854076] {
  background: var(--menu-item-hover-bg-color);
  border-color: var(--accent-color);
}
.batch-item-status[_ngcontent-ng-c585854076] {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 0.9rem;
}
.status-icon[_ngcontent-ng-c585854076] {
  display: inline-block;
  color: var(--secondary-text);
}
.status-icon.spinning[_ngcontent-ng-c585854076] {
  animation: _ngcontent-ng-c585854076_spin 1s linear infinite;
  color: var(--accent-color);
}
.batch-item.completed[_ngcontent-ng-c585854076]   .status-icon[_ngcontent-ng-c585854076] {
  color: #27ae60;
}
.batch-item.error[_ngcontent-ng-c585854076]   .status-icon[_ngcontent-ng-c585854076] {
  color: #e74c3c;
}
@keyframes _ngcontent-ng-c585854076_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.batch-item-content[_ngcontent-ng-c585854076] {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.batch-item-title[_ngcontent-ng-c585854076] {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-text);
}
.batch-item-count[_ngcontent-ng-c585854076] {
  font-size: 0.75rem;
  color: var(--secondary-text);
}
.batch-info[_ngcontent-ng-c585854076] {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.85rem;
  color: var(--secondary-text);
}
.batch-info[_ngcontent-ng-c585854076]   p[_ngcontent-ng-c585854076] {
  margin: 0.25rem 0;
}
.main-content[_ngcontent-ng-c585854076] {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  padding-bottom: 0.5rem;
}
.current-batch-header[_ngcontent-ng-c585854076] {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}
.current-batch-header[_ngcontent-ng-c585854076]   h3[_ngcontent-ng-c585854076] {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-text);
}
.batch-status-badge[_ngcontent-ng-c585854076] {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.batch-status-badge.pending[_ngcontent-ng-c585854076] {
  background: var(--secondary-background);
  color: var(--secondary-text);
  border: 1px solid var(--border-color);
}
.batch-status-badge.processing[_ngcontent-ng-c585854076] {
  background: var(--menu-item-hover-bg-color);
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
}
.batch-status-badge.completed[_ngcontent-ng-c585854076] {
  background: var(--success-background);
  color: #27ae60;
  border: 1px solid #27ae60;
}
.batch-status-badge.error[_ngcontent-ng-c585854076] {
  background: var(--error-background);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}
.batch-items-table[_ngcontent-ng-c585854076] {
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  overflow: hidden;
}
.batch-items-table[_ngcontent-ng-c585854076]   table[_ngcontent-ng-c585854076] {
  width: 100%;
  border-collapse: collapse;
}
.batch-items-table[_ngcontent-ng-c585854076]   th[_ngcontent-ng-c585854076], 
.batch-items-table[_ngcontent-ng-c585854076]   td[_ngcontent-ng-c585854076] {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}
.batch-items-table[_ngcontent-ng-c585854076]   th[_ngcontent-ng-c585854076] {
  background: var(--primary-background);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.batch-items-table[_ngcontent-ng-c585854076]   tr[_ngcontent-ng-c585854076]:last-child   td[_ngcontent-ng-c585854076] {
  border-bottom: none;
}
.batch-items-table[_ngcontent-ng-c585854076]   .row-number[_ngcontent-ng-c585854076] {
  width: 40px;
  text-align: center;
  color: var(--secondary-text);
  font-weight: 500;
}
.batch-items-table[_ngcontent-ng-c585854076]   .tag-number[_ngcontent-ng-c585854076] {
  font-family:
    "Consolas",
    "Monaco",
    monospace;
  font-weight: 600;
  color: var(--accent-color);
  white-space: nowrap;
}
.batch-items-table[_ngcontent-ng-c585854076]   .description[_ngcontent-ng-c585854076] {
  color: var(--primary-text);
}
.batch-items-table[_ngcontent-ng-c585854076]   .empty-row[_ngcontent-ng-c585854076] {
  opacity: 0.5;
}
.batch-items-table[_ngcontent-ng-c585854076]   .empty-cell[_ngcontent-ng-c585854076] {
  text-align: center;
  font-style: italic;
  color: var(--secondary-text);
}
.batch-items-table[_ngcontent-ng-c585854076]   .remove-col[_ngcontent-ng-c585854076] {
  width: 36px;
  text-align: center;
  padding: 0.5rem;
}
.btn-remove[_ngcontent-ng-c585854076] {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--secondary-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}
.btn-remove[_ngcontent-ng-c585854076]:hover {
  background: var(--error-background);
  color: #e74c3c;
}
.actions-section[_ngcontent-ng-c585854076] {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}
.navigation-section[_ngcontent-ng-c585854076] {
  display: flex;
  gap: 0.75rem;
}
.btn[_ngcontent-ng-c585854076] {
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
  flex-shrink: 0;
  white-space: nowrap;
}
.btn[_ngcontent-ng-c585854076]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--disabled-background) !important;
}
.btn.primary[_ngcontent-ng-c585854076] {
  background: var(--accent-color);
  color: #ffffff;
  box-shadow: var(--accent-color-shadow) 0 2px 8px;
}
.btn.primary[_ngcontent-ng-c585854076]:hover:not(:disabled) {
  background: var(--accent-color-hover);
  transform: translateY(-1px);
  box-shadow: var(--accent-color-shadow) 0 4px 12px;
}
.btn.secondary[_ngcontent-ng-c585854076] {
  background: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
}
.btn.secondary[_ngcontent-ng-c585854076]:hover:not(:disabled) {
  background: var(--hover-color);
  border-color: var(--accent-color);
}
.btn.success[_ngcontent-ng-c585854076] {
  background: #27ae60;
  color: #ffffff;
  box-shadow: rgba(39, 174, 96, 0.3) 0 2px 8px;
}
.btn.success[_ngcontent-ng-c585854076]:hover:not(:disabled) {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: rgba(39, 174, 96, 0.4) 0 4px 12px;
}
.status-message[_ngcontent-ng-c585854076] {
  padding: 0.75rem 1rem;
  background: var(--menu-item-hover-bg-color);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--accent-color);
}
.error-message[_ngcontent-ng-c585854076] {
  padding: 0.75rem 1rem;
  background: var(--error-background);
  border: 1px solid #e74c3c;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #e74c3c;
}
.completed-message[_ngcontent-ng-c585854076] {
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
.check-icon[_ngcontent-ng-c585854076] {
  font-size: 1.1rem;
}
.all-complete-message[_ngcontent-ng-c585854076] {
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
.success-icon[_ngcontent-ng-c585854076] {
  font-size: 1.5rem;
}
.config-section[_ngcontent-ng-c585854076] {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.config-label[_ngcontent-ng-c585854076] {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.config-select[_ngcontent-ng-c585854076] {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--primary-background);
  color: var(--primary-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: auto;
}
.config-select[_ngcontent-ng-c585854076]:hover {
  border-color: var(--accent-color);
}
.config-select[_ngcontent-ng-c585854076]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-shadow);
}
.qr-toggle-section[_ngcontent-ng-c585854076] {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
.btn.qr-toggle[_ngcontent-ng-c585854076] {
  width: 100%;
  background: var(--secondary-background);
  color: var(--secondary-text);
  border: 2px solid var(--border-color);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn.qr-toggle[_ngcontent-ng-c585854076]:hover {
  border-color: var(--accent-color);
  background: var(--hover-color);
}
.btn.qr-toggle.active[_ngcontent-ng-c585854076] {
  background: var(--accent-color);
  color: #ffffff;
  border-color: var(--accent-color);
}
.btn.qr-toggle[_ngcontent-ng-c585854076]   .qr-icon[_ngcontent-ng-c585854076] {
  font-size: 1.1rem;
  margin-right: 0.25rem;
}
.tag-preview-section[_ngcontent-ng-c585854076] {
  background: var(--secondary-background);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}
.tag-preview-section[_ngcontent-ng-c585854076]   h4[_ngcontent-ng-c585854076] {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tag-previews-grid[_ngcontent-ng-c585854076] {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}
.tag-preview[_ngcontent-ng-c585854076] {
  position: relative;
  background: #e8e4d8;
  border: 2px solid #999;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
}
.tag-preview.tag-2x3[_ngcontent-ng-c585854076] {
  width: 270px;
  height: 181px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076] {
  width: 200px;
  height: 134px;
}
.tag-el[_ngcontent-ng-c585854076] {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 79%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: "Arial", sans-serif;
  color: #111;
}
.tag-el-overflow[_ngcontent-ng-c585854076] {
  text-decoration: underline wavy #e74c3c;
}
.tag-num-el[_ngcontent-ng-c585854076] {
  top: 7.8%;
  font-size: 31px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transform: translate(-50%, -50%) scaleX(1.06);
}
.tag-qr-el[_ngcontent-ng-c585854076] {
  top: 44.5%;
  width: 107px;
  height: 82px;
  border: 1.5px solid #777;
  background: #f5f2ea;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: none;
  overflow: visible;
}
.qr-pattern[_ngcontent-ng-c585854076] {
  width: 70%;
  height: 70%;
  background:
    linear-gradient(
      90deg,
      #555 25%,
      transparent 25%,
      transparent 75%,
      #555 75%),
    linear-gradient(
      #555 25%,
      transparent 25%,
      transparent 75%,
      #555 75%);
  background-size: 33% 33%;
  opacity: 0.45;
}
.tag-desc-1l[_ngcontent-ng-c585854076] {
  top: 76.5%;
  font-size: 55px;
  font-weight: 600;
}
.tag-desc-2l-1[_ngcontent-ng-c585854076] {
  top: 72.0%;
  font-size: 29px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.18);
}
.tag-desc-2l-2[_ngcontent-ng-c585854076] {
  top: 87.7%;
  font-size: 29px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.18);
}
.tag-desc-3l-1[_ngcontent-ng-c585854076] {
  top: 71.1%;
  font-size: 17px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.25);
}
.tag-desc-3l-2[_ngcontent-ng-c585854076] {
  top: 81.4%;
  font-size: 17px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.25);
}
.tag-desc-3l-3[_ngcontent-ng-c585854076] {
  top: 91.7%;
  font-size: 17px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.25);
}
.tag-desc-4l-1[_ngcontent-ng-c585854076] {
  top: 69.8%;
  font-size: 13px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.06);
}
.tag-desc-4l-2[_ngcontent-ng-c585854076] {
  top: 77.9%;
  font-size: 13px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.06);
}
.tag-desc-4l-3[_ngcontent-ng-c585854076] {
  top: 86.0%;
  font-size: 13px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.06);
}
.tag-desc-4l-4[_ngcontent-ng-c585854076] {
  top: 94.2%;
  font-size: 13px;
  font-weight: 500;
  transform: translate(-50%, -50%) scaleX(1.06);
}
.tag-hole-el[_ngcontent-ng-c585854076] {
  position: absolute;
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid #999;
  background: var(--secondary-background, #2a2a2e);
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-num-el[_ngcontent-ng-c585854076] {
  font-size: 23px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-qr-el[_ngcontent-ng-c585854076] {
  width: 79px;
  height: 61px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-1l[_ngcontent-ng-c585854076] {
  font-size: 41px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-2l-1[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-2l-2[_ngcontent-ng-c585854076] {
  font-size: 21px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-3l-1[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-3l-2[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-3l-3[_ngcontent-ng-c585854076] {
  font-size: 13px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-4l-1[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-4l-2[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-4l-3[_ngcontent-ng-c585854076], 
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-desc-4l-4[_ngcontent-ng-c585854076] {
  font-size: 10px;
}
.tag-preview.tag-2x1[_ngcontent-ng-c585854076]   .tag-hole-el[_ngcontent-ng-c585854076] {
  width: 8px;
  height: 8px;
}
@media (max-width: 768px) {
  .engraver-container[_ngcontent-ng-c585854076] {
    flex-direction: column;
  }
  .batch-sidebar[_ngcontent-ng-c585854076] {
    width: 100%;
    min-width: 100%;
    max-height: 250px;
  }
  .batch-list[_ngcontent-ng-c585854076] {
    max-height: 120px;
  }
}
/*# sourceMappingURL=/engraver-manager.component.css.map */</style><style ng-app-id="ng">

.wizard-overlay[_ngcontent-ng-c2307177025] {
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
.wizard-overlay.minimized[_ngcontent-ng-c2307177025] {
  background: transparent;
  pointer-events: none;
}
.wizard-dialog[_ngcontent-ng-c2307177025] {
  background: var(--card-background, #ffffff);
  color: var(--primary-text, #212529);
  border-radius: 12px;
  box-shadow: var(--card-shadow, 0 8px 32px rgba(0, 0, 0, 0.2));
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
}
.wizard-dialog.is-branch[_ngcontent-ng-c2307177025] {
  border: 2px solid var(--accent-color, #1976d2);
}
.wizard-overlay.minimized[_ngcontent-ng-c2307177025]   .wizard-dialog[_ngcontent-ng-c2307177025] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: auto;
  max-width: 300px;
  max-height: auto;
}
.dialog-header[_ngcontent-ng-c2307177025] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--secondary-background, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  cursor: move;
}
.header-content[_ngcontent-ng-c2307177025] {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.header-title[_ngcontent-ng-c2307177025] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-icon[_ngcontent-ng-c2307177025] {
  color: var(--accent-color, #1976d2);
}
.flow-name[_ngcontent-ng-c2307177025] {
  font-weight: 500;
  font-size: 16px;
  color: var(--primary-text, #212529);
}
.header-actions[_ngcontent-ng-c2307177025] {
  display: flex;
  gap: 4px;
}
.header-btn[_ngcontent-ng-c2307177025] {
  width: 32px;
  height: 32px;
  line-height: 32px;
  color: var(--secondary-text, #495057);
}
.header-btn[_ngcontent-ng-c2307177025]   mat-icon[_ngcontent-ng-c2307177025] {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.close-btn[_ngcontent-ng-c2307177025]:hover {
  color: #d32f2f;
}
.dialog-content[_ngcontent-ng-c2307177025] {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 300px;
  background: var(--card-background, #ffffff);
}
.dialog-footer[_ngcontent-ng-c2307177025] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--secondary-background, #fafafa);
}
.footer-left[_ngcontent-ng-c2307177025], 
.footer-right[_ngcontent-ng-c2307177025] {
  display: flex;
  gap: 8px;
}
.back-btn[_ngcontent-ng-c2307177025] {
  color: var(--secondary-text, #666);
}
.skip-btn[_ngcontent-ng-c2307177025] {
  color: var(--secondary-text, #666);
}
button[_ngcontent-ng-c2307177025]   mat-icon[_ngcontent-ng-c2307177025] {
  margin-right: 4px;
}
.footer-right[_ngcontent-ng-c2307177025]   button[_ngcontent-ng-c2307177025]   mat-icon[_ngcontent-ng-c2307177025] {
  margin-right: 4px;
  margin-left: 0;
}
.spinning[_ngcontent-ng-c2307177025] {
  animation: _ngcontent-ng-c2307177025_spin 1s linear infinite;
}
@keyframes _ngcontent-ng-c2307177025_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.minimized-info[_ngcontent-ng-c2307177025] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  color: var(--secondary-text, #666);
}
.minimized-info[_ngcontent-ng-c2307177025]:hover {
  background: var(--hover-color, #f5f5f5);
}
/*# sourceMappingURL=/wizard-dialog.component.css.map */</style><style ng-app-id="ng">

.comments-dialog-content[_ngcontent-ng-c1372848867] {
  padding: 16px;
  min-width: 400px;
  max-width: 600px;
}
.new-comment-section[_ngcontent-ng-c1372848867] {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #ddd);
}
.comment-textarea[_ngcontent-ng-c1372848867] {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
}
.new-comment-row[_ngcontent-ng-c1372848867] {
  margin-top: 8px;
}
.new-comment-actions[_ngcontent-ng-c1372848867] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.checkbox-label[_ngcontent-ng-c1372848867] {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
.filter-toolbar[_ngcontent-ng-c1372848867] {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.search-input[_ngcontent-ng-c1372848867] {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}
.filter-select[_ngcontent-ng-c1372848867] {
  padding: 6px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background: var(--bg-color, #fff);
  min-width: 120px;
}
.comments-list[_ngcontent-ng-c1372848867] {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}
.comment-item[_ngcontent-ng-c1372848867] {
  padding: 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  background: var(--bg-color, #fff);
}
.comment-item.needs-attention[_ngcontent-ng-c1372848867] {
  border-left: 3px solid var(--warning-color, #ff9800);
}
.comment-item.resolved[_ngcontent-ng-c1372848867] {
  opacity: 0.7;
  border-left: 3px solid var(--success-color, #4caf50);
}
.comment-header[_ngcontent-ng-c1372848867] {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.comment-author[_ngcontent-ng-c1372848867] {
  font-weight: 600;
  font-size: 13px;
}
.comment-date[_ngcontent-ng-c1372848867] {
  font-size: 12px;
  color: var(--text-secondary, #888);
}
.comment-type-badge[_ngcontent-ng-c1372848867] {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--primary-light, #e3f2fd);
  color: var(--primary-color, #1976d2);
  border-radius: 4px;
}
.attention-badge[_ngcontent-ng-c1372848867] {
  font-size: 11px;
  padding: 2px 6px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 4px;
}
.resolved-badge[_ngcontent-ng-c1372848867] {
  font-size: 11px;
  padding: 2px 6px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
}
.comment-body[_ngcontent-ng-c1372848867] {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  margin-bottom: 6px;
}
.comment-actions[_ngcontent-ng-c1372848867] {
  display: flex;
  gap: 12px;
}
.comment-edit[_ngcontent-ng-c1372848867] {
  margin-top: 4px;
}
.edit-actions[_ngcontent-ng-c1372848867] {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.btn-link[_ngcontent-ng-c1372848867] {
  background: none;
  border: none;
  color: var(--primary-color, #1976d2);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}
.btn-link[_ngcontent-ng-c1372848867]:hover {
  text-decoration: underline;
}
.btn-link.btn-danger[_ngcontent-ng-c1372848867] {
  color: var(--error-color, #c62828);
}
.btn[_ngcontent-ng-c1372848867] {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-sm[_ngcontent-ng-c1372848867] {
  padding: 4px 10px;
  font-size: 12px;
}
.btn-primary[_ngcontent-ng-c1372848867] {
  background-color: var(--primary-color, #1976d2);
  color: white;
}
.btn-primary[_ngcontent-ng-c1372848867]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary[_ngcontent-ng-c1372848867] {
  background-color: var(--secondary-bg, #e0e0e0);
  color: var(--text-primary, #333);
}
.loading[_ngcontent-ng-c1372848867], 
.empty-state[_ngcontent-ng-c1372848867] {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary, #888);
}
/*# sourceMappingURL=/comments-dialog.component.css.map */</style><style ng-app-id="ng">

.qa-dialog-content[_ngcontent-ng-c1416530472] {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.qa-text[_ngcontent-ng-c1416530472] {
  line-height: 1.6;
  color: var(--primary-text, #333);
}
.qa-media-list[_ngcontent-ng-c1416530472] {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.qa-media-item[_ngcontent-ng-c1416530472] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--secondary-background, #f8f9fa);
  border-radius: 6px;
  border: 1px solid var(--border-color, #e0e0e0);
}
.qa-image[_ngcontent-ng-c1416530472] {
  max-width: 100%;
  border-radius: 4px;
}
.qa-video-player[_ngcontent-ng-c1416530472] {
  width: 100%;
  border-radius: 4px;
}
.qa-media-caption[_ngcontent-ng-c1416530472] {
  font-size: 0.9em;
  color: var(--secondary-text, #666);
  line-height: 1.5;
  padding: 8px 0 0 0;
  border-top: 1px solid var(--border-color, #e0e0e0);
}
.qa-files[_ngcontent-ng-c1416530472]   h3[_ngcontent-ng-c1416530472] {
  margin: 0 0 8px 0;
  font-size: 0.95em;
  color: var(--secondary-text, #666);
}
.qa-files[_ngcontent-ng-c1416530472]   ul[_ngcontent-ng-c1416530472] {
  list-style: none;
  padding: 0;
  margin: 0;
}
.qa-files[_ngcontent-ng-c1416530472]   li[_ngcontent-ng-c1416530472] {
  padding: 4px 0;
}
.qa-files[_ngcontent-ng-c1416530472]   a[_ngcontent-ng-c1416530472] {
  color: var(--accent-color, #007bff);
  text-decoration: none;
  cursor: pointer;
}
.qa-files[_ngcontent-ng-c1416530472]   a[_ngcontent-ng-c1416530472]:hover {
  text-decoration: underline;
  color: var(--accent-color-hover, #0056b3);
}
/*# sourceMappingURL=/qa-dialog.component.css.map */</style><style ng-app-id="ng">

.popup-overlay[_ngcontent-ng-c4000021521] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.popup-content[_ngcontent-ng-c4000021521] {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  max-width: 90%;
  max-height: 90vh;
  width: 100%;
  height: 100%;
}
.popup-header[_ngcontent-ng-c4000021521] {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  color: var(--primary-text);
}
.popup-body[_ngcontent-ng-c4000021521] {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.popup-scroll-content[_ngcontent-ng-c4000021521] {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.close-button[_ngcontent-ng-c4000021521] {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--secondary-text);
  transition: color 0.2s ease;
}
.close-button[_ngcontent-ng-c4000021521]:hover {
  color: var(--primary-text);
}
.popup-small[_ngcontent-ng-c4000021521] {
  width: 300px;
}
.popup-medium[_ngcontent-ng-c4000021521] {
  width: 500px;
}
.popup-large[_ngcontent-ng-c4000021521] {
  width: 90vw;
}
@media (max-width: 768px) {
  .popup-content[_ngcontent-ng-c4000021521] {
    width: 95%;
    max-height: 95vh;
  }
  .popup-small[_ngcontent-ng-c4000021521], 
   .popup-medium[_ngcontent-ng-c4000021521], 
   .popup-large[_ngcontent-ng-c4000021521] {
    width: 100%;
  }
}
/*# sourceMappingURL=/popup-projection.component.css.map */</style><style ng-app-id="ng">

.header-menus[_ngcontent-ng-c1481485715] {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
.menu-container[_ngcontent-ng-c1481485715] {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.menu-container[_ngcontent-ng-c1481485715]:first-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c1481485715]:first-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c1481485715]:last-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c1481485715]:last-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c1481485715]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.menu-container[_ngcontent-ng-c1481485715]     a {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.menu-container[_ngcontent-ng-c1481485715]     a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
/*# sourceMappingURL=/loto.component.css.map */</style><style ng-app-id="ng">

.layout-container[_ngcontent-ng-c2755335437] {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--primary-background);
  color: var(--primary-text);
  position: relative;
  overflow: hidden;
}
.header[_ngcontent-ng-c2755335437] {
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
.header-content[_ngcontent-ng-c2755335437] {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  flex: 1;
  position: relative;
}
.header-content[_ngcontent-ng-c2755335437]::after {
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
.header-content[_ngcontent-ng-c2755335437]::-webkit-scrollbar {
  display: none;
}
.header-content[_ngcontent-ng-c2755335437] {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.header-content[_ngcontent-ng-c2755335437]   h1[_ngcontent-ng-c2755335437] {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.header-actions[_ngcontent-ng-c2755335437] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.auth-btn[_ngcontent-ng-c2755335437] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
}
.auth-btn[_ngcontent-ng-c2755335437]:hover {
  background-color: var(--accent-color-hover);
}
.content-wrapper[_ngcontent-ng-c2755335437] {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.left-menu[_ngcontent-ng-c2755335437] {
  background-color: var(--menu-background);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}
.resizer[_ngcontent-ng-c2755335437] {
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
.resizer[_ngcontent-ng-c2755335437]:hover {
  background-color: var(--accent-color-translucent);
}
.menu-toggle-btn[_ngcontent-ng-c2755335437] {
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
.menu-toggle-btn[_ngcontent-ng-c2755335437]:hover {
  background-color: var(--accent-color);
  transform: translate(-50%, -50%) scale(1.1);
}
.arrow[_ngcontent-ng-c2755335437] {
  border: solid var(--primary-text);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transition: transform 0.3s ease;
}
.arrow[_ngcontent-ng-c2755335437]:not(.collapsed) {
  transform: rotate(135deg);
}
.arrow.collapsed[_ngcontent-ng-c2755335437] {
  transform: rotate(-45deg);
  margin-left: -2px;
}
.main-and-footer[_ngcontent-ng-c2755335437] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.main-content[_ngcontent-ng-c2755335437] {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  background-color: var(--primary-background);
}
.footer-resizer[_ngcontent-ng-c2755335437] {
  height: 5px;
  background-color: var(--border-color);
  cursor: row-resize;
  transition: background-color 0.3s ease;
}
.footer-resizer[_ngcontent-ng-c2755335437]:hover {
  background-color: var(--accent-color);
}
.footer[_ngcontent-ng-c2755335437] {
  overflow: auto;
  background-color: var(--secondary-background);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}
.overlay[_ngcontent-ng-c2755335437] {
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
.overlay.active[_ngcontent-ng-c2755335437] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
@supports (-webkit-touch-callout: none) {
  .layout-container[_ngcontent-ng-c2755335437] {
    height: -webkit-fill-available;
  }
}
@media screen and (max-width: 768px) {
  .layout-container[_ngcontent-ng-c2755335437] {
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    -webkit-overflow-scrolling: touch;
  }
  .content-wrapper[_ngcontent-ng-c2755335437] {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  .main-and-footer[_ngcontent-ng-c2755335437] {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .main-content[_ngcontent-ng-c2755335437] {
    flex: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
  }
}
@media (max-width: 768px) {
  .left-menu[_ngcontent-ng-c2755335437] {
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
  .left-menu.active[_ngcontent-ng-c2755335437] {
    transform: translateX(0) !important;
  }
  .resizer[_ngcontent-ng-c2755335437] {
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
  .resizer[_ngcontent-ng-c2755335437]:hover {
    background-color: transparent !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c2755335437] {
    position: static !important;
    transform: none !important;
    left: auto !important;
    top: auto !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c2755335437]:hover {
    transform: scale(1.1) !important;
  }
  .left-menu.active[_ngcontent-ng-c2755335437]    ~ .resizer[_ngcontent-ng-c2755335437] {
    left: calc(100% - 60px) !important;
  }
  .main-and-footer[_ngcontent-ng-c2755335437] {
    width: 100%;
  }
  .main-content[_ngcontent-ng-c2755335437] {
    padding: 0.5rem;
  }
  .header[_ngcontent-ng-c2755335437] {
    padding: 0.75rem;
  }
  .header-content[_ngcontent-ng-c2755335437]   h1[_ngcontent-ng-c2755335437] {
    font-size: 1.25rem;
  }
  .auth-btn[_ngcontent-ng-c2755335437] {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .left-menu[_ngcontent-ng-c2755335437] {
    max-width: 350px;
  }
}
@media (max-width: 768px) {
  body.menu-open[_ngcontent-ng-c2755335437] {
    overflow: hidden;
  }
}
.clipboard-container[_ngcontent-ng-c2755335437] {
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

.sync-indicator-wrapper[_ngcontent-ng-c2707160083] {
  position: relative;
}
.sync-indicator[_ngcontent-ng-c2707160083] {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}
.sync-indicator[_ngcontent-ng-c2707160083]:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.sync-indicator.state-connected[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #4caf50;
}
.sync-indicator.state-connecting[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #ff9800;
}
.sync-indicator.state-disconnected[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #f44336;
}
.sync-indicator.state-disabled[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #9e9e9e;
}
.sync-indicator.state-out-of-sync[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #f44336;
}
.sync-indicator.state-possibly-out-of-sync[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  color: #ff9800;
}
.pulse[_ngcontent-ng-c2707160083] {
  animation: _ngcontent-ng-c2707160083_pulse 1.5s ease-in-out infinite;
}
@keyframes _ngcontent-ng-c2707160083_pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.update-badge[_ngcontent-ng-c2707160083] {
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
.warning-indicator[_ngcontent-ng-c2707160083] {
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
.warning-indicator.error[_ngcontent-ng-c2707160083] {
  background-color: #f44336;
  animation: _ngcontent-ng-c2707160083_pulse 1s ease-in-out infinite;
}
.sync-popover[_ngcontent-ng-c2707160083] {
  position: fixed;
  width: 300px;
  background: var(--card-background, #fff);
  color: var(--primary-text, #333);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  overflow: hidden;
}
.popover-header[_ngcontent-ng-c2707160083] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}
.popover-title[_ngcontent-ng-c2707160083] {
  font-weight: 600;
  font-size: 14px;
}
.popover-close[_ngcontent-ng-c2707160083] {
  cursor: pointer;
  font-size: 18px;
  width: 18px;
  height: 18px;
  opacity: 0.6;
}
.popover-close[_ngcontent-ng-c2707160083]:hover {
  opacity: 1;
}
.popover-body[_ngcontent-ng-c2707160083] {
  padding: 12px 16px;
}
.status-row[_ngcontent-ng-c2707160083] {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.status-row[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  font-size: 28px;
  width: 28px;
  height: 28px;
}
.status-row[_ngcontent-ng-c2707160083]   .icon-green[_ngcontent-ng-c2707160083] {
  color: #4caf50;
}
.status-row[_ngcontent-ng-c2707160083]   .icon-orange[_ngcontent-ng-c2707160083] {
  color: #ff9800;
}
.status-row[_ngcontent-ng-c2707160083]   .icon-red[_ngcontent-ng-c2707160083] {
  color: #f44336;
}
.status-row[_ngcontent-ng-c2707160083]   .icon-grey[_ngcontent-ng-c2707160083] {
  color: #9e9e9e;
}
.status-text[_ngcontent-ng-c2707160083] {
  display: flex;
  flex-direction: column;
}
.status-label[_ngcontent-ng-c2707160083] {
  font-weight: 600;
  font-size: 13px;
}
.status-detail[_ngcontent-ng-c2707160083] {
  font-size: 11px;
  opacity: 0.7;
}
.info-grid[_ngcontent-ng-c2707160083] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
}
.info-item[_ngcontent-ng-c2707160083] {
  display: flex;
  flex-direction: column;
}
.info-label[_ngcontent-ng-c2707160083] {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.5;
  letter-spacing: 0.5px;
}
.info-value[_ngcontent-ng-c2707160083] {
  font-size: 13px;
  font-weight: 500;
}
.resync-suggestion[_ngcontent-ng-c2707160083] {
  background: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
  padding: 8px 12px;
  font-size: 12px;
  margin: 8px 0;
  border-radius: 0 4px 4px 0;
}
.resync-suggestion.auto-resync-active[_ngcontent-ng-c2707160083] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.resync-suggestion.auto-resync-active[_ngcontent-ng-c2707160083]   .spin[_ngcontent-ng-c2707160083] {
  font-size: 16px;
  width: 16px;
  height: 16px;
  animation: _ngcontent-ng-c2707160083_spin 1.5s linear infinite;
}
.resync-suggestion.auto-resync-failed[_ngcontent-ng-c2707160083] {
  background: rgba(244, 67, 54, 0.1);
  border-left-color: #f44336;
}
.resync-actions[_ngcontent-ng-c2707160083] {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
@keyframes _ngcontent-ng-c2707160083_spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.toggle-row[_ngcontent-ng-c2707160083] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}
.toggle-label[_ngcontent-ng-c2707160083] {
  font-size: 13px;
  font-weight: 500;
}
.disabled-warning[_ngcontent-ng-c2707160083] {
  background: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
  padding: 8px 12px;
  font-size: 12px;
  margin: 4px 0 8px;
  border-radius: 0 4px 4px 0;
}
.popover-actions[_ngcontent-ng-c2707160083] {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.popover-actions[_ngcontent-ng-c2707160083]   button[_ngcontent-ng-c2707160083] {
  flex: 1;
  font-size: 12px;
}
.popover-actions[_ngcontent-ng-c2707160083]   mat-icon[_ngcontent-ng-c2707160083] {
  font-size: 16px;
  width: 16px;
  height: 16px;
  margin-right: 4px;
}
/*# sourceMappingURL=/sync-indicator.component.css.map */</style><style ng-app-id="ng">

.guide-trigger-btn[_ngcontent-ng-c3916921435] {
  color: inherit;
}
/*# sourceMappingURL=/guide-trigger.component.css.map */</style><style ng-app-id="ng">

.qa-toggle-btn[_ngcontent-ng-c3176921999] {
  color: inherit;
}
.qa-toggle-btn.qa-active[_ngcontent-ng-c3176921999] {
  color: var(--primary-color, #1976d2);
  background-color: var(--primary-light, rgba(25, 118, 210, 0.12));
  border-radius: 50%;
}
/*# sourceMappingURL=/qa-toggle.component.css.map */</style><style ng-app-id="ng">

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
/*# sourceMappingURL=/clipboard.component.css.map */</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style><style ng-app-id="ng">.mat-mdc-icon-button{-webkit-user-select:none;user-select:none;display:inline-block;position:relative;box-sizing:border-box;border:none;outline:none;background-color:rgba(0,0,0,0);fill:currentColor;color:inherit;text-decoration:none;cursor:pointer;z-index:0;overflow:visible;border-radius:50%;flex-shrink:0;text-align:center;width:var(--mdc-icon-button-state-layer-size, 40px);height:var(--mdc-icon-button-state-layer-size, 40px);padding:calc(calc(var(--mdc-icon-button-state-layer-size, 40px) - var(--mdc-icon-button-icon-size, 24px)) / 2);font-size:var(--mdc-icon-button-icon-size, 24px);color:var(--mdc-icon-button-icon-color, var(--mat-sys-on-surface-variant));-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-icon-button .mat-mdc-button-ripple,.mat-mdc-icon-button .mat-mdc-button-persistent-ripple,.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-icon-button .mat-mdc-button-ripple{overflow:hidden}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{content:"";opacity:0}.mat-mdc-icon-button .mdc-button__label,.mat-mdc-icon-button .mat-icon{z-index:1;position:relative}.mat-mdc-icon-button .mat-focus-indicator{top:0;left:0;right:0;bottom:0;position:absolute}.mat-mdc-icon-button:focus>.mat-focus-indicator::before{content:""}.mat-mdc-icon-button .mat-ripple-element{background-color:var(--mat-icon-button-ripple-color, color-mix(in srgb, var(--mat-sys-on-surface-variant) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent))}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-icon-button-state-layer-color, var(--mat-sys-on-surface-variant))}.mat-mdc-icon-button.mat-mdc-button-disabled .mat-mdc-button-persistent-ripple::before{background-color:var(--mat-icon-button-disabled-state-layer-color, var(--mat-sys-on-surface-variant))}.mat-mdc-icon-button:hover>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity))}.mat-mdc-icon-button.cdk-program-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-icon-button.cdk-keyboard-focused>.mat-mdc-button-persistent-ripple::before,.mat-mdc-icon-button.mat-mdc-button-disabled-interactive:focus>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity))}.mat-mdc-icon-button:active>.mat-mdc-button-persistent-ripple::before{opacity:var(--mat-icon-button-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity))}.mat-mdc-icon-button .mat-mdc-button-touch-target{position:absolute;top:50%;height:48px;left:50%;width:48px;transform:translate(-50%, -50%);display:var(--mat-icon-button-touch-target-display, block)}.mat-mdc-icon-button._mat-animation-noopable{transition:none !important;animation:none !important}.mat-mdc-icon-button[disabled],.mat-mdc-icon-button.mat-mdc-button-disabled{cursor:default;pointer-events:none;color:var(--mdc-icon-button-disabled-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent))}.mat-mdc-icon-button.mat-mdc-button-disabled-interactive{pointer-events:auto}.mat-mdc-icon-button img,.mat-mdc-icon-button svg{width:var(--mdc-icon-button-icon-size, 24px);height:var(--mdc-icon-button-icon-size, 24px);vertical-align:baseline}.mat-mdc-icon-button .mat-mdc-button-persistent-ripple{border-radius:50%}.mat-mdc-icon-button[hidden]{display:none}.mat-mdc-icon-button.mat-unthemed:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-primary:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-accent:not(.mdc-ripple-upgraded):focus::before,.mat-mdc-icon-button.mat-warn:not(.mdc-ripple-upgraded):focus::before{background:rgba(0,0,0,0);opacity:1}
</style><style ng-app-id="ng">@media(forced-colors: active){.mat-mdc-button:not(.mdc-button--outlined),.mat-mdc-unelevated-button:not(.mdc-button--outlined),.mat-mdc-raised-button:not(.mdc-button--outlined),.mat-mdc-outlined-button:not(.mdc-button--outlined),.mat-mdc-icon-button.mat-mdc-icon-button,.mat-mdc-outlined-button .mdc-button__ripple{outline:solid 1px}}
</style><style ng-app-id="ng">.mat-focus-indicator{position:relative}.mat-focus-indicator::before{top:0;left:0;right:0;bottom:0;position:absolute;box-sizing:border-box;pointer-events:none;display:var(--mat-focus-indicator-display, none);border-width:var(--mat-focus-indicator-border-width, 3px);border-style:var(--mat-focus-indicator-border-style, solid);border-color:var(--mat-focus-indicator-border-color, transparent);border-radius:var(--mat-focus-indicator-border-radius, 4px)}.mat-focus-indicator:focus::before{content:""}@media(forced-colors: active){html{--mat-focus-indicator-display: block}}
</style><style ng-app-id="ng">mat-menu{display:none}.mat-mdc-menu-content{margin:0;padding:8px 0;outline:0}.mat-mdc-menu-content,.mat-mdc-menu-content .mat-mdc-menu-item .mat-mdc-menu-item-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;flex:1;white-space:normal;font-family:var(--mat-menu-item-label-text-font, var(--mat-sys-label-large-font));line-height:var(--mat-menu-item-label-text-line-height, var(--mat-sys-label-large-line-height));font-size:var(--mat-menu-item-label-text-size, var(--mat-sys-label-large-size));letter-spacing:var(--mat-menu-item-label-text-tracking, var(--mat-sys-label-large-tracking));font-weight:var(--mat-menu-item-label-text-weight, var(--mat-sys-label-large-weight))}@keyframes _mat-menu-enter{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:none}}@keyframes _mat-menu-exit{from{opacity:1}to{opacity:0}}.mat-mdc-menu-panel{min-width:112px;max-width:280px;overflow:auto;box-sizing:border-box;outline:0;animation:_mat-menu-enter 120ms cubic-bezier(0, 0, 0.2, 1);border-radius:var(--mat-menu-container-shape, var(--mat-sys-corner-extra-small));background-color:var(--mat-menu-container-color, var(--mat-sys-surface-container));box-shadow:var(--mat-menu-container-elevation-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));will-change:transform,opacity}.mat-mdc-menu-panel.mat-menu-panel-exit-animation{animation:_mat-menu-exit 100ms 25ms linear forwards}.mat-mdc-menu-panel.mat-menu-panel-animations-disabled{animation:none}.mat-mdc-menu-panel.mat-menu-panel-animating{pointer-events:none}.mat-mdc-menu-panel.mat-menu-panel-animating:has(.mat-mdc-menu-content:empty){display:none}@media(forced-colors: active){.mat-mdc-menu-panel{outline:solid 1px}}.mat-mdc-menu-panel .mat-divider{color:var(--mat-menu-divider-color, var(--mat-sys-surface-variant));margin-bottom:var(--mat-menu-divider-bottom-spacing, 8px);margin-top:var(--mat-menu-divider-top-spacing, 8px)}.mat-mdc-menu-item{display:flex;position:relative;align-items:center;justify-content:flex-start;overflow:hidden;padding:0;cursor:pointer;width:100%;text-align:left;box-sizing:border-box;color:inherit;font-size:inherit;background:none;text-decoration:none;margin:0;min-height:48px;padding-left:var(--mat-menu-item-leading-spacing, 12px);padding-right:var(--mat-menu-item-trailing-spacing, 12px);-webkit-user-select:none;user-select:none;cursor:pointer;outline:none;border:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-menu-item::-moz-focus-inner{border:0}[dir=rtl] .mat-mdc-menu-item{padding-left:var(--mat-menu-item-trailing-spacing, 12px);padding-right:var(--mat-menu-item-leading-spacing, 12px)}.mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-leading-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-trailing-spacing, 12px)}[dir=rtl] .mat-mdc-menu-item:has(.material-icons,mat-icon,[matButtonIcon]){padding-left:var(--mat-menu-item-with-icon-trailing-spacing, 12px);padding-right:var(--mat-menu-item-with-icon-leading-spacing, 12px)}.mat-mdc-menu-item,.mat-mdc-menu-item:visited,.mat-mdc-menu-item:link{color:var(--mat-menu-item-label-text-color, var(--mat-sys-on-surface))}.mat-mdc-menu-item .mat-icon-no-color,.mat-mdc-menu-item .mat-mdc-menu-submenu-icon{color:var(--mat-menu-item-icon-color, var(--mat-sys-on-surface-variant))}.mat-mdc-menu-item[disabled]{cursor:default;opacity:.38}.mat-mdc-menu-item[disabled]::after{display:block;position:absolute;content:"";top:0;left:0;bottom:0;right:0}.mat-mdc-menu-item:focus{outline:0}.mat-mdc-menu-item .mat-icon{flex-shrink:0;margin-right:var(--mat-menu-item-spacing, 12px);height:var(--mat-menu-item-icon-size, 24px);width:var(--mat-menu-item-icon-size, 24px)}[dir=rtl] .mat-mdc-menu-item{text-align:right}[dir=rtl] .mat-mdc-menu-item .mat-icon{margin-right:0;margin-left:var(--mat-menu-item-spacing, 12px)}.mat-mdc-menu-item:not([disabled]):hover{background-color:var(--mat-menu-item-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent))}.mat-mdc-menu-item:not([disabled]).cdk-program-focused,.mat-mdc-menu-item:not([disabled]).cdk-keyboard-focused,.mat-mdc-menu-item:not([disabled]).mat-mdc-menu-item-highlighted{background-color:var(--mat-menu-item-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent))}@media(forced-colors: active){.mat-mdc-menu-item{margin-top:1px}}.mat-mdc-menu-submenu-icon{width:var(--mat-menu-item-icon-size, 24px);height:10px;fill:currentColor;padding-left:var(--mat-menu-item-spacing, 12px)}[dir=rtl] .mat-mdc-menu-submenu-icon{padding-right:var(--mat-menu-item-spacing, 12px);padding-left:0}[dir=rtl] .mat-mdc-menu-submenu-icon polygon{transform:scaleX(-1);transform-origin:center}@media(forced-colors: active){.mat-mdc-menu-submenu-icon{fill:CanvasText}}.mat-mdc-menu-item .mat-mdc-menu-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none}
</style><style ng-app-id="ng">.mat-ripple{overflow:hidden;position:relative}.mat-ripple:not(:empty){transform:translateZ(0)}.mat-ripple.mat-ripple-unbounded{overflow:visible}.mat-ripple-element{position:absolute;border-radius:50%;pointer-events:none;transition:opacity,transform 0ms cubic-bezier(0, 0, 0.2, 1);transform:scale3d(0, 0, 0);background-color:var(--mat-ripple-color, color-mix(in srgb, var(--mat-sys-on-surface) 10%, transparent))}@media(forced-colors: active){.mat-ripple-element{display:none}}.cdk-drag-preview .mat-ripple-element,.cdk-drag-placeholder .mat-ripple-element{display:none}
</style><style ng-app-id="ng">

[_nghost-ng-c3710739997] {
  display: block;
  width: 100%;
  height: 100%;
}
.container[_ngcontent-ng-c3710739997] {
  background-color: var(--card-background);
  color: var(--primary-text);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
h1[_ngcontent-ng-c3710739997] {
  color: var(--accent-color);
  margin: 0 0 1.5rem 0;
  text-align: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}
.header-controls[_ngcontent-ng-c3710739997] {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}
.device-grid[_ngcontent-ng-c3710739997] {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
}
.device-card[_ngcontent-ng-c3710739997] {
  background-color: var(--secondary-background);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;
}
.device-card[_ngcontent-ng-c3710739997]:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}
.device-header[_ngcontent-ng-c3710739997] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.device-name[_ngcontent-ng-c3710739997] {
  margin: 0;
  font-size: 1.3rem;
  color: var(--primary-text);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.device-status[_ngcontent-ng-c3710739997] {
  flex-shrink: 0;
}
.status-badge[_ngcontent-ng-c3710739997] {
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}
.status-badge.online[_ngcontent-ng-c3710739997] {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}
.status-badge.offline[_ngcontent-ng-c3710739997] {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}
.status-badge.checking[_ngcontent-ng-c3710739997] {
  background-color: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
  border: 1px solid #f1c40f;
  animation: _ngcontent-ng-c3710739997_pulse 1.5s ease-in-out infinite;
}
.device-info[_ngcontent-ng-c3710739997] {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.info-row[_ngcontent-ng-c3710739997] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.info-label[_ngcontent-ng-c3710739997] {
  color: var(--secondary-text);
  font-size: 0.9rem;
  font-weight: 500;
  flex-shrink: 0;
}
.info-value[_ngcontent-ng-c3710739997] {
  color: var(--primary-text);
  font-size: 0.95rem;
  text-align: right;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}
.toggle-switch[_ngcontent-ng-c3710739997] {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch[_ngcontent-ng-c3710739997]   input[_ngcontent-ng-c3710739997] {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider[_ngcontent-ng-c3710739997] {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #95a5a6;
  transition: 0.3s;
  border-radius: 24px;
}
.toggle-slider[_ngcontent-ng-c3710739997]:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
.toggle-switch[_ngcontent-ng-c3710739997]   input[_ngcontent-ng-c3710739997]:checked    + .toggle-slider[_ngcontent-ng-c3710739997] {
  background-color: var(--accent-color);
}
.toggle-switch[_ngcontent-ng-c3710739997]   input[_ngcontent-ng-c3710739997]:checked    + .toggle-slider[_ngcontent-ng-c3710739997]:before {
  transform: translateX(24px);
}
.toggle-label[_ngcontent-ng-c3710739997] {
  font-size: 0.9rem;
  font-weight: 500;
}
.device-actions[_ngcontent-ng-c3710739997] {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}
.btn-action[_ngcontent-ng-c3710739997] {
  flex: 1;
  min-width: 90px;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.btn-initialize[_ngcontent-ng-c3710739997] {
  background-color: var(--accent-color);
  color: var(--header-text);
}
.btn-initialize[_ngcontent-ng-c3710739997]:hover:not(:disabled) {
  background-color: var(--accent-color-hover);
  box-shadow: 0 4px 8px var(--accent-color-shadow);
  transform: translateY(-1px);
}
.btn-turn-off[_ngcontent-ng-c3710739997] {
  background-color: #e74c3c;
  color: white;
}
.btn-turn-off[_ngcontent-ng-c3710739997]:hover:not(:disabled) {
  background-color: #c0392b;
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.4);
  transform: translateY(-1px);
}
.btn-check[_ngcontent-ng-c3710739997] {
  background-color: #3498db;
  color: white;
}
.btn-check[_ngcontent-ng-c3710739997]:hover:not(:disabled) {
  background-color: #2980b9;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.4);
  transform: translateY(-1px);
}
.btn-action[_ngcontent-ng-c3710739997]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.btn-primary[_ngcontent-ng-c3710739997], 
.btn-secondary[_ngcontent-ng-c3710739997] {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.btn-primary[_ngcontent-ng-c3710739997] {
  background-color: var(--accent-color);
  color: var(--header-text);
}
.btn-primary[_ngcontent-ng-c3710739997]:hover:not(:disabled) {
  background-color: var(--accent-color-hover);
  box-shadow: 0 4px 12px var(--accent-color-shadow);
  transform: translateY(-2px);
}
.btn-secondary[_ngcontent-ng-c3710739997] {
  background-color: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
}
.btn-secondary[_ngcontent-ng-c3710739997]:hover:not(:disabled) {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.btn-primary[_ngcontent-ng-c3710739997]:disabled, 
.btn-secondary[_ngcontent-ng-c3710739997]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.empty-state[_ngcontent-ng-c3710739997] {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--secondary-text);
}
.empty-state[_ngcontent-ng-c3710739997]   p[_ngcontent-ng-c3710739997] {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}
.empty-hint[_ngcontent-ng-c3710739997] {
  font-size: 0.9rem;
  color: var(--tertiary-text);
}
.status-message[_ngcontent-ng-c3710739997] {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--secondary-background);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  color: var(--primary-text);
  font-size: 0.95rem;
  text-align: center;
  flex-shrink: 0;
}
.loading[_ngcontent-ng-c3710739997] {
  text-align: center;
  margin-top: 1rem;
  color: var(--accent-color);
  font-size: 1.2rem;
  font-weight: 600;
  animation: _ngcontent-ng-c3710739997_pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes _ngcontent-ng-c3710739997_pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.container[_ngcontent-ng-c3710739997]::-webkit-scrollbar, 
.device-grid[_ngcontent-ng-c3710739997]::-webkit-scrollbar {
  width: 8px;
}
.container[_ngcontent-ng-c3710739997]::-webkit-scrollbar-track, 
.device-grid[_ngcontent-ng-c3710739997]::-webkit-scrollbar-track {
  background: var(--secondary-background);
}
.container[_ngcontent-ng-c3710739997]::-webkit-scrollbar-thumb, 
.device-grid[_ngcontent-ng-c3710739997]::-webkit-scrollbar-thumb {
  background: var(--scroll-bar-color);
  border-radius: 4px;
}
.container[_ngcontent-ng-c3710739997]::-webkit-scrollbar-thumb:hover, 
.device-grid[_ngcontent-ng-c3710739997]::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color);
}
@media (max-width: 1200px) {
  .device-grid[_ngcontent-ng-c3710739997] {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
@media (max-width: 768px) {
  .container[_ngcontent-ng-c3710739997] {
    padding: 1rem;
  }
  h1[_ngcontent-ng-c3710739997] {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  .header-controls[_ngcontent-ng-c3710739997] {
    flex-direction: column;
    gap: 0.75rem;
  }
  .device-grid[_ngcontent-ng-c3710739997] {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .device-card[_ngcontent-ng-c3710739997] {
    padding: 1rem;
  }
  .device-name[_ngcontent-ng-c3710739997] {
    font-size: 1.1rem;
  }
  .device-actions[_ngcontent-ng-c3710739997] {
    flex-direction: column;
  }
  .btn-action[_ngcontent-ng-c3710739997] {
    width: 100%;
  }
}
@media (max-width: 480px) {
  h1[_ngcontent-ng-c3710739997] {
    font-size: 1.3rem;
  }
  .info-row[_ngcontent-ng-c3710739997] {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .info-value[_ngcontent-ng-c3710739997] {
    justify-content: flex-start;
    text-align: left;
  }
}
/*# sourceMappingURL=/esp-device-list.component.css.map */</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click","mousedown","keydown"],[]);</script>
  <app-root ng-version="19.2.5" ngh="23" ng-server-context="ssg"><router-outlet></router-outlet><app-loto _nghost-ng-c1481485715="" ngh="12"><app-main-layout _ngcontent-ng-c1481485715="" _nghost-ng-c2755335437="" ngh="9"><div _ngcontent-ng-c2755335437="" class="layout-container"><header _ngcontent-ng-c2755335437="" class="header"><div _ngcontent-ng-c2755335437="" class="header-content"><!--container--><h1 _ngcontent-ng-c2755335437="">Jackson Generation</h1><!--container--><app-router-menu _ngcontent-ng-c1481485715="" _nghost-ng-c3178853866="" ng-reflect-layout="row" ngh="10"><nav _ngcontent-ng-c3178853866="" class="router-menu row" ng-reflect-ng-class="row"><div _ngcontent-ng-c3178853866="" class="menu-container"><ul _ngcontent-ng-c3178853866="" class="primary-menu"><li _ngcontent-ng-c3178853866="" class="home-link"><a _ngcontent-ng-c3178853866="" routerlink="/" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">Files</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link active"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permits</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/log" href="/log" jsaction="click:;">Log</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Admin</a></li><!--container--></ul><ul _ngcontent-ng-c3178853866="" class="secondary-menu"><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/loto" href="/loto" class="active-link" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="create-loto-point:menu-item" ng-reflect-guide-message="Click here to navigate to LOTO" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/loto-points" href="/loto-points" class="" jsaction="click:;">Loto Points</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/loto-standard" href="/loto-standard" class="" jsaction="click:;">LOTO Standards</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/loto-builder" href="/loto-builder" class="" jsaction="click:;">Loto Builder</a></li><!--container--></ul><!--container--></div><!--container--><!--container--><!--container--></nav></app-router-menu><!--ng-container--></div><div _ngcontent-ng-c2755335437="" class="header-actions"><app-sync-indicator _ngcontent-ng-c2755335437="" _nghost-ng-c2707160083="" ngh="1"><div _ngcontent-ng-c2707160083="" class="sync-indicator-wrapper"><div _ngcontent-ng-c2707160083="" class="mat-mdc-tooltip-trigger sync-indicator state-connecting" ng-reflect-message="Checking..." jsaction="click:;"><mat-icon _ngcontent-ng-c2707160083="" role="img" class="mat-icon notranslate pulse material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0"> cloud_sync </mat-icon><!--container--><!--container--></div><!--container--><!--container--></div></app-sync-indicator><app-guide-trigger _ngcontent-ng-c2755335437="" _nghost-ng-c3916921435="" ngh="4"><button _ngcontent-ng-c3916921435="" mat-icon-button="" mattooltip="Start Guide" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger guide-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Start Guide" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c3916921435="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">auto_fix_high</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c3916921435="" ngh="3"><!--container--></mat-menu><!--container--></app-guide-trigger><app-qa-toggle _ngcontent-ng-c2755335437="" _nghost-ng-c3176921999="" ngh="5"><button _ngcontent-ng-c3176921999="" mat-icon-button="" class="mat-mdc-tooltip-trigger qa-toggle-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Enable Help Mode" ngh="2" jsaction="click:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c3176921999="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--></app-qa-toggle><app-tour-trigger _ngcontent-ng-c2755335437="" _nghost-ng-c1184412316="" ngh="6"><button _ngcontent-ng-c1184412316="" mat-icon-button="" mattooltip="Help &amp; Tours" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger tour-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Help &amp; Tours" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c1184412316="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c1184412316="" class="" ngh="3"><!--container--></mat-menu></app-tour-trigger><app-theme-toggle _ngcontent-ng-c2755335437="" _nghost-ng-c3074088440="" ngh="7"><button _ngcontent-ng-c3074088440="" class="theme-toggle-button" jsaction="click:;"><span _ngcontent-ng-c3074088440="">🌙</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button></app-theme-toggle></div></header><div _ngcontent-ng-c2755335437="" class="content-wrapper"><!--container--><div _ngcontent-ng-c2755335437="" class="main-and-footer"><main _ngcontent-ng-c2755335437="" class="main-content"><router-outlet _ngcontent-ng-c1481485715=""></router-outlet><app-esp-device-list _nghost-ng-c3710739997="" ngh="11"><div _ngcontent-ng-c3710739997="" class="container"><h1 _ngcontent-ng-c3710739997="">ESP Device Management</h1><div _ngcontent-ng-c3710739997="" class="header-controls"><button _ngcontent-ng-c3710739997="" class="btn-primary" jsaction="click:;"> Initialize All Devices </button><button _ngcontent-ng-c3710739997="" class="btn-secondary" jsaction="click:;"> Refresh </button></div><div _ngcontent-ng-c3710739997="" class="device-grid"><!--container--><div _ngcontent-ng-c3710739997="" class="empty-state"><p _ngcontent-ng-c3710739997="">No ESP devices found</p><p _ngcontent-ng-c3710739997="" class="empty-hint">Add ESP devices to the database to get started</p></div><!--container--></div><div _ngcontent-ng-c3710739997="" class="status-message">Loaded 0 ESP devices</div><!--container--><!--container--></div></app-esp-device-list><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c2755335437="" class="clipboard-container"><app-clipboard _ngcontent-ng-c2755335437="" _nghost-ng-c450165409="" ngh="8"><div _ngcontent-ng-c450165409="" class="clipboard-wrapper"><div _ngcontent-ng-c450165409="" class="clipboard-icon-wrapper" style="right: 20px; bottom: 20px;" jsaction="mousedown:;click:;"><div _ngcontent-ng-c450165409="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)"><mat-icon _ngcontent-ng-c450165409="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><!--container--></div><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-loto><!--container--><app-print-layout ngh="13"><!--container--></app-print-layout><app-global-message _nghost-ng-c4038518790="" ngh="14"><!--container--></app-global-message><app-global-context-menu ngh="15"><!--container--></app-global-context-menu><app-qr-scanner _nghost-ng-c3289982237="" ngh="16"><!--container--></app-qr-scanner><app-brady-printer-manager _nghost-ng-c3185598614="" ngh="17"><!--container--></app-brady-printer-manager><app-engraver-manager _nghost-ng-c585854076="" ngh="18"><!--container--></app-engraver-manager><app-wizard-dialog _nghost-ng-c2307177025="" ngh="19"><!--container--></app-wizard-dialog><app-comments-dialog _nghost-ng-c1372848867="" ngh="20"><!--container--></app-comments-dialog><app-qa-dialog _nghost-ng-c1416530472="" ngh="22"><app-popup-projection _ngcontent-ng-c1416530472="" size="medium" _nghost-ng-c4000021521="" ng-reflect-size="medium" ng-reflect-is-open="false" ng-reflect-title="Help Information" ngh="21"><!--container--></app-popup-projection></app-qa-dialog></app-root>
<link rel="modulepreload" href="chunk-ZGDGC5VH.js"><script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"592816468":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},{"id":4000010604,"name":"Comment Type","alias":"commentType"},{"id":6000011532,"name":"Unit","alias":"unit"},{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},{"id":6000011539,"name":"Group","alias":"group"},{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},{"id":6000011553,"name":"Processing Status","alias":"processingStatus"}],"message":"Categories retrieved successfully","timestamp":[2026,2,9,23,16,16,533654400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/categories","rt":"json"},"820227935":{"b":{"responseData":[{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NC"},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":6000011551,"name":"Throttled","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"THRTL"},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NO"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,16,535188500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/normPos","rt":"json"},"1756457535":{"b":{"responseData":[{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,16,536716900]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/eqType","rt":"json"},"2647878024":{"b":{"responseData":[{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"OPEN"},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"CLOSED"},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":6000011550,"name":"Throttled","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"THRTL"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,16,533654400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/isoPos","rt":"json"},"2937771502":{"b":{"responseData":[{"id":6000011552,"name":"Control Room","category":{"id":2702,"name":"Location","alias":"location"},"alias":"CR"},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":"SY"},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,16,540257500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/location","rt":"json"},"3708790176":{"b":{"responseData":[],"message":"ESP devices retrieved successfully","timestamp":[2026,2,9,23,16,16,551039100]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/esp-devices/all","rt":"json"},"4280908195":{"b":{"responseData":[{"id":6000011537,"name":"No","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"NO"},{"id":6000011538,"name":"Yes","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"YES"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,16,534658800]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/zeroEnergyTemplate","rt":"json"},"__nghData__":[{},{"c":{"1":[],"4":[],"5":[],"6":[]},"n":{"3":"2f"},"t":{"4":"t2","5":"t3","6":"t4"}},{"n":{"2":"hfn2"}},{"t":{"0":"t6"},"c":{"0":[]}},{"t":{"0":"t5"},"c":{"0":[{"i":"t5","r":3,"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]}]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,11,12,13,14,15,16,17]},{"t":{"1":"t7","2":"t8"},"c":{"1":[{"i":"t7","r":1}],"2":[]}},{"t":{"1":"t11","2":"t13","3":"t14"},"c":{"1":[{"i":"t11","r":1,"c":{"1":[],"4":[]},"n":{"3":"2f"},"t":{"4":"t12"}}],"2":[],"3":[]}},{"t":{"3":"t0","4":"t1","13":"t9","18":"t10"},"c":{"3":[],"4":[{"i":"t1","r":1}],"13":[],"18":[]}},{"t":{"1":"t15","2":"t19","3":"t20"},"c":{"1":[{"i":"t15","r":1,"t":{"6":"t16","7":"t17"},"c":{"6":[{"i":"t16","r":1,"x":6}],"7":[{"i":"t17","r":1,"t":{"2":"t18"},"c":{"2":[{"i":"t18","r":1,"x":4}]}}]}}],"2":[],"3":[]}},{"t":{"10":"t46","11":"t47","12":"t48","13":"t49"},"c":{"10":[],"11":[{"i":"t47","r":1}],"12":[{"i":"t48","r":1}],"13":[]}},{"n":{"1":"0f4n3","5":"0f2nfnf2"},"d":[3,4],"e":{"1":1,"5":3},"c":{"6":[{"i":"c3710739997","r":1}]}},{"t":{"0":"t27"},"c":{"0":[]}},{"t":{"0":"t28"},"c":{"0":[]}},{"t":{"0":"t29"},"c":{"0":[]}},{"t":{"0":"t30"},"c":{"0":[]}},{"t":{"0":"t31"},"c":{"0":[]}},{"t":{"0":"t32"},"c":{"0":[]}},{"t":{"0":"t33"},"c":{"0":[]}},{"t":{"0":"t34"},"c":{"0":[]}},{"t":{"0":"t35"},"c":{"0":[]}},{"d":[1]},{"c":{"0":[{"i":"c1481485715","r":1}]}}]}</script></body></html>`;