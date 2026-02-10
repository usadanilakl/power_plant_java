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

[_nghost-ng-c3330600245] {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.form-container[_ngcontent-ng-c3330600245] {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
}
/*# sourceMappingURL=/safe-work-form.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c821275273] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
app-safe-work-table[_ngcontent-ng-c821275273] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
/*# sourceMappingURL=/safe-work-side-menu.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c2612898786] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
/*# sourceMappingURL=/safe-work-table.component.css.map */</style><style ng-app-id="ng">

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
  <app-root ng-version="19.2.5" ngh="26" ng-server-context="ssg"><router-outlet></router-outlet><app-permit-builder-page _nghost-ng-c874109360="" ngh="15"><app-main-layout _ngcontent-ng-c874109360="" _nghost-ng-c2755335437="" ngh="9"><div _ngcontent-ng-c2755335437="" class="layout-container"><header _ngcontent-ng-c2755335437="" class="header"><div _ngcontent-ng-c2755335437="" class="header-content"><!--container--><h1 _ngcontent-ng-c2755335437="">Jackson Generation</h1><!--container--><app-router-menu _ngcontent-ng-c874109360="" _nghost-ng-c3178853866="" ng-reflect-layout="row" ngh="10"><nav _ngcontent-ng-c3178853866="" class="router-menu row" ng-reflect-ng-class="row"><div _ngcontent-ng-c3178853866="" class="menu-container"><ul _ngcontent-ng-c3178853866="" class="primary-menu"><li _ngcontent-ng-c3178853866="" class="home-link"><a _ngcontent-ng-c3178853866="" routerlink="/" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">Files</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link active"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permits</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/log" href="/log" jsaction="click:;">Log</a></li><li _ngcontent-ng-c3178853866="" class="menu-group-link"><a _ngcontent-ng-c3178853866="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Admin</a></li><!--container--></ul><ul _ngcontent-ng-c3178853866="" class="secondary-menu"><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/daily-packages" href="/permit-builder/daily-packages" class="" jsaction="click:;">Daily Packages</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/work-requests" href="/permit-builder/work-requests" class="" jsaction="click:;">Work Requests</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/jobs" href="/permit-builder/jobs" class="" jsaction="click:;">Job Logs</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/safe-works" href="/permit-builder/safe-works" class="active-link" jsaction="click:;">Safe Works</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/hot-works" href="/permit-builder/hot-works" class="" jsaction="click:;">Hot Works</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/permit-builder/confined-space" href="/permit-builder/confined-spaces" class="" jsaction="click:;">Confined Spaces</a></li><li _ngcontent-ng-c3178853866="" ng-reflect-app-guide="" ng-reflect-guide-message="" class="" jsaction="click:;"><a _ngcontent-ng-c3178853866="" routerlinkactive="active-link" ng-reflect-router-link-active="active-link" ng-reflect-router-link="/scheduler" href="/scheduler" class="" jsaction="click:;">Scheduler</a></li><!--container--></ul><!--container--></div><!--container--><!--container--><!--container--></nav></app-router-menu><!--ng-container--></div><div _ngcontent-ng-c2755335437="" class="header-actions"><app-sync-indicator _ngcontent-ng-c2755335437="" _nghost-ng-c2707160083="" ngh="1"><div _ngcontent-ng-c2707160083="" class="sync-indicator-wrapper"><div _ngcontent-ng-c2707160083="" class="mat-mdc-tooltip-trigger sync-indicator state-connecting" ng-reflect-message="Checking..." jsaction="click:;"><mat-icon _ngcontent-ng-c2707160083="" role="img" class="mat-icon notranslate pulse material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0"> cloud_sync </mat-icon><!--container--><!--container--></div><!--container--><!--container--></div></app-sync-indicator><app-guide-trigger _ngcontent-ng-c2755335437="" _nghost-ng-c3916921435="" ngh="4"><button _ngcontent-ng-c3916921435="" mat-icon-button="" mattooltip="Start Guide" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger guide-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Start Guide" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c3916921435="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">auto_fix_high</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c3916921435="" ngh="3"><!--container--></mat-menu><!--container--></app-guide-trigger><app-qa-toggle _ngcontent-ng-c2755335437="" _nghost-ng-c3176921999="" ngh="5"><button _ngcontent-ng-c3176921999="" mat-icon-button="" class="mat-mdc-tooltip-trigger qa-toggle-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Enable Help Mode" ngh="2" jsaction="click:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c3176921999="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--></app-qa-toggle><app-tour-trigger _ngcontent-ng-c2755335437="" _nghost-ng-c1184412316="" ngh="6"><button _ngcontent-ng-c1184412316="" mat-icon-button="" mattooltip="Help &amp; Tours" class="mat-mdc-menu-trigger mat-mdc-tooltip-trigger tour-trigger-btn mdc-icon-button mat-mdc-icon-button mat-unthemed mat-mdc-button-base" mat-ripple-loader-uninitialized="" mat-ripple-loader-class-name="mat-mdc-button-ripple" mat-ripple-loader-centered="" ng-reflect-message="Help &amp; Tours" ng-reflect-menu="[object Object]" aria-haspopup="menu" aria-expanded="false" ngh="2" jsaction="click:;mousedown:;keydown:;"><span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span><mat-icon _ngcontent-ng-c1184412316="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">help_outline</mat-icon><span class="mat-focus-indicator"></span><span class="mat-mdc-button-touch-target"></span></button><!--container--><mat-menu _ngcontent-ng-c1184412316="" class="" ngh="3"><!--container--></mat-menu></app-tour-trigger><app-theme-toggle _ngcontent-ng-c2755335437="" _nghost-ng-c3074088440="" ngh="7"><button _ngcontent-ng-c3074088440="" class="theme-toggle-button" jsaction="click:;"><span _ngcontent-ng-c3074088440="">🌙</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button></app-theme-toggle></div></header><div _ngcontent-ng-c2755335437="" class="content-wrapper"><!--container--><div _ngcontent-ng-c2755335437="" class="main-and-footer"><main _ngcontent-ng-c2755335437="" class="main-content"><router-outlet _ngcontent-ng-c874109360=""></router-outlet><app-safe-work ngh="14"><!--container--><app-safe-work-form _nghost-ng-c3330600245="" ng-reflect-values="[Computed: [object Object]]" ngh="13"><div _ngcontent-ng-c3330600245="" class="form-container"><app-smart-form _ngcontent-ng-c3330600245="" _nghost-ng-c1799638334="" ng-reflect-fields="[object Object],[object Object" ng-reflect-layout="column" ng-reflect-values="[Computed: [object Object]]" ng-reflect-title="Safe Work" ng-reflect-submit-button-text="Submit" ng-reflect-delete-button-text="Delete" ngh="12"><h2 _ngcontent-ng-c1799638334="" class="form-header">Safe Work</h2><!--container--><form _ngcontent-ng-c1799638334="" novalidate="" class="form-layout-column ng-untouched ng-pristine ng-valid" ng-reflect-form="[object Object]" jsaction="submit:;contextmenu:;"><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-column"><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Date" ng-reflect-type="date" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Date</label><!--container--></div><!--container--><input class="form-input-element" type="date" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Time" ng-reflect-type="time" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Time</label><!--container--></div><!--container--><input class="form-input-element" type="time" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Company Person" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Company Person</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Location" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Location</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Work Scope" ng-reflect-type="textarea" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Work Scope</label><!--container--></div><!--container--><input class="form-input-element" type="textarea" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Special Instructions" ng-reflect-type="textarea" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Special Instructions</label><!--container--></div><!--container--><input class="form-input-element" type="textarea" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Requested By" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Requested By</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">Hazards</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="High Temp" ng-reflect-id="hazards.highTemp" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.highTemp" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.highTemp"> High Temp </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="High Pressure" ng-reflect-id="hazards.highPressure" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.highPressure" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.highPressure"> High Pressure </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Energized" ng-reflect-id="hazards.energized" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.energized" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.energized"> Energized </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Stored Energy" ng-reflect-id="hazards.storedEnergy" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.storedEnergy" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.storedEnergy"> Stored Energy </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Eye Hazard" ng-reflect-id="hazards.eyeHazard" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.eyeHazard" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.eyeHazard"> Eye Hazard </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Egress/Access" ng-reflect-id="hazards.egressAccess" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.egressAccess" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.egressAccess"> Egress/Access </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Ergonomic Hazard" ng-reflect-id="hazards.ergonomicHazard" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.ergonomicHazard" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.ergonomicHazard"> Ergonomic Hazard </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Falling Object" ng-reflect-id="hazards.fallingObject" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.fallingObject" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.fallingObject"> Falling Object </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="High Noise" ng-reflect-id="hazards.highNoise" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.highNoise" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.highNoise"> High Noise </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Dust/Particulate" ng-reflect-id="hazards.dustParticulate" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.dustParticulate" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.dustParticulate"> Dust/Particulate </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Combustible Dust" ng-reflect-id="hazards.combustibleDust" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.combustibleDust" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.combustibleDust"> Combustible Dust </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fire Hazard" ng-reflect-id="hazards.fireHazard" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.fireHazard" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.fireHazard"> Fire Hazard </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Hot Surface" ng-reflect-id="hazards.hotSurface" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.hotSurface" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.hotSurface"> Hot Surface </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Slippery" ng-reflect-id="hazards.slippery" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.slippery" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.slippery"> Slippery </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Ventilation Required" ng-reflect-id="hazards.ventilationRequired" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.ventilationRequired" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.ventilationRequired"> Ventilation Required </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Lighting Restrictions" ng-reflect-id="hazards.lightingRestrictions" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.lightingRestrictions" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.lightingRestrictions"> Lighting Restrictions </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Chemical Exposure" ng-reflect-id="hazards.chemicalExposure" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.chemicalExposure" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.chemicalExposure"> Chemical Exposure </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Lifting Hazard" ng-reflect-id="hazards.liftingHazard" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.liftingHazard" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.liftingHazard"> Lifting Hazard </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Hand Traps" ng-reflect-id="hazards.handTraps" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.handTraps" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.handTraps"> Hand Traps </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Heat/Cold Stress" ng-reflect-id="hazards.heatColdStress" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.heatColdStress" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.heatColdStress"> Heat/Cold Stress </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Elevated Surface" ng-reflect-id="hazards.elevatedSurface" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.elevatedSurface" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.elevatedSurface"> Elevated Surface </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Environmental" ng-reflect-id="hazards.environmental" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.environmental" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.environmental"> Environmental </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="hazards.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="hazards.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="hazards.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">Permits</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="LOTO Required" ng-reflect-id="permits.lotoRequired" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.lotoRequired" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.lotoRequired"> LOTO Required </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="LOTO Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>LOTO Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Confined Space" ng-reflect-id="permits.confinedSpace" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.confinedSpace" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.confinedSpace"> Confined Space </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Confined Space Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Confined Space Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Hot Work" ng-reflect-id="permits.hotWork" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.hotWork" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.hotWork"> Hot Work </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Hot Work Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Hot Work Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Venting/Purging" ng-reflect-id="permits.ventingPurging" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.ventingPurging" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.ventingPurging"> Venting/Purging </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Venting/Purging Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Venting/Purging Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="JHA" ng-reflect-id="permits.jha" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.jha" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="permits.jha"> JHA </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Gas Testing" ng-reflect-id="permits.gasTesting" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.gasTesting" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.gasTesting"> Gas Testing </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Excavation Permit" ng-reflect-id="permits.excavationPermit" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.excavationPermit" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.excavationPermit"> Excavation Permit </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Energized Permit" ng-reflect-id="permits.energizedPermit" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.energizedPermit" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.energizedPermit"> Energized Permit </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="permits.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="permits.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="permits.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">PPE</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Hardhat" ng-reflect-id="ppe.hardhat" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.hardhat" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.hardhat"> Hardhat </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Safety Glasses" ng-reflect-id="ppe.safetyGlasses" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.safetyGlasses" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.safetyGlasses"> Safety Glasses </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Hearing Protection" ng-reflect-id="ppe.hearingProtection" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.hearingProtection" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.hearingProtection"> Hearing Protection </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Boots" ng-reflect-id="ppe.boots" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.boots" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.boots"> Boots </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fall Protection" ng-reflect-id="ppe.fallProtection" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.fallProtection" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.fallProtection"> Fall Protection </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="GFI" ng-reflect-id="ppe.gfi" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.gfi" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.gfi"> GFI </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Respirator" ng-reflect-id="ppe.respirator" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.respirator" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.respirator"> Respirator </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Dust Mask" ng-reflect-id="ppe.dustMask" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.dustMask" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.dustMask"> Dust Mask </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Gloves" ng-reflect-id="ppe.gloves" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.gloves" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="ppe.gloves"> Gloves </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Ice Cleats" ng-reflect-id="ppe.iceCleats" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.iceCleats" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.iceCleats"> Ice Cleats </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Acid Suit" ng-reflect-id="ppe.acidSuit" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.acidSuit" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.acidSuit"> Acid Suit </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Barricade" ng-reflect-id="ppe.barricade" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.barricade" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.barricade"> Barricade </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Face Shield" ng-reflect-id="ppe.faceShield" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.faceShield" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.faceShield"> Face Shield </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Gas Monitor" ng-reflect-id="ppe.gasMonitor" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.gasMonitor" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.gasMonitor"> Gas Monitor </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Arc Flash PPE" ng-reflect-id="ppe.arcFlashPpe" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.arcFlashPpe" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.arcFlashPpe"> Arc Flash PPE </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Welding Jacket" ng-reflect-id="ppe.weldingJacket" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.weldingJacket" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.weldingJacket"> Welding Jacket </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Welding Shield" ng-reflect-id="ppe.weldingShield" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.weldingShield" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.weldingShield"> Welding Shield </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Welding Gloves" ng-reflect-id="ppe.weldingGloves" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.weldingGloves" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.weldingGloves"> Welding Gloves </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Purging Ventilation" ng-reflect-id="ppe.purgingVentilation" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.purgingVentilation" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.purgingVentilation"> Purging Ventilation </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Other" ng-reflect-id="ppe.other" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="ppe.other" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="" for="ppe.other"> Other </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Other Description" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="11"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Other Description</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="" jsaction="input:;"></div></app-form-input><!--container--><!--container--></div><!--container--></fieldset><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><button _ngcontent-ng-c1799638334="" type="submit">Submit</button><button _ngcontent-ng-c1799638334="" type="button" jsaction="click:;">Delete</button><!--container--></div></form><!--container--><!--container--><!--container--></app-smart-form><!--container--><!--container--></div></app-safe-work-form><!--container--></app-safe-work><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c2755335437="" class="clipboard-container"><app-clipboard _ngcontent-ng-c2755335437="" _nghost-ng-c450165409="" ngh="8"><div _ngcontent-ng-c450165409="" class="clipboard-wrapper"><div _ngcontent-ng-c450165409="" class="clipboard-icon-wrapper" style="right: 20px; bottom: 20px;" jsaction="mousedown:;click:;"><div _ngcontent-ng-c450165409="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)"><mat-icon _ngcontent-ng-c450165409="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><!--container--></div><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-permit-builder-page><!--container--><app-print-layout ngh="16"><!--container--></app-print-layout><app-global-message _nghost-ng-c4038518790="" ngh="17"><!--container--></app-global-message><app-global-context-menu ngh="18"><!--container--></app-global-context-menu><app-qr-scanner _nghost-ng-c3289982237="" ngh="19"><!--container--></app-qr-scanner><app-brady-printer-manager _nghost-ng-c3185598614="" ngh="20"><!--container--></app-brady-printer-manager><app-engraver-manager _nghost-ng-c585854076="" ngh="21"><!--container--></app-engraver-manager><app-wizard-dialog _nghost-ng-c2307177025="" ngh="22"><!--container--></app-wizard-dialog><app-comments-dialog _nghost-ng-c1372848867="" ngh="23"><!--container--></app-comments-dialog><app-qa-dialog _nghost-ng-c1416530472="" ngh="25"><app-popup-projection _ngcontent-ng-c1416530472="" size="medium" _nghost-ng-c4000021521="" ng-reflect-size="medium" ng-reflect-is-open="false" ng-reflect-title="Help Information" ngh="24"><!--container--></app-popup-projection></app-qa-dialog></app-root>
<link rel="modulepreload" href="chunk-ZGDGC5VH.js"><script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"592816468":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},{"id":4000010604,"name":"Comment Type","alias":"commentType"},{"id":6000011532,"name":"Unit","alias":"unit"},{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},{"id":6000011539,"name":"Group","alias":"group"},{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},{"id":6000011553,"name":"Processing Status","alias":"processingStatus"}],"message":"Categories retrieved successfully","timestamp":[2026,2,9,23,16,24,82529900]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/categories","rt":"json"},"820227935":{"b":{"responseData":[{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NC"},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":6000011551,"name":"Throttled","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"THRTL"},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NO"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,24,294950400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/normPos","rt":"json"},"1535148311":{"b":{"responseData":[{"id":4152,"name":"PID","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":"PID"},{"id":4153,"name":"Extra","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4155,"name":"John Cockerill","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4156,"name":"Kiewit","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":"KWT"},{"id":4157,"name":"Mitsubishi","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4158,"name":"HOLTEC","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4159,"name":"US Water","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4160,"name":"Gas (Vendor)","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":4209,"name":"John Cockeril","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4402,"name":"HPS & HHS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4403,"name":"Condensate System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CND"},{"id":4454,"name":"Closed Cooling Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCW"},{"id":4653,"name":"LPS & HLS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4654,"name":"IPS & HIS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NC"},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"CLOSED"},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NO"},{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"OPEN"},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5552,"name":"Cleaver Brooks","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5652,"name":"Heat Trace Iso","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":5653,"name":"Heat Trace","category":{"id":2552,"name":"System","alias":"system"},"alias":"HTS"},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5803,"name":"Cold Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"CRH"},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5903,"name":"Feed Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BFW"},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5905,"name":"LUBE OIL SYSTEM","category":{"id":2552,"name":"System","alias":"system"},"alias":"LOS"},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7653,"name":"Instrument Air","category":{"id":2552,"name":"System","alias":"system"},"alias":"INA"},{"id":7702,"name":"Hot Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"HRH"},{"id":9302,"name":"Aux Steam","category":{"id":2552,"name":"System","alias":"system"},"alias":"AXS"},{"id":9303,"name":"Demin Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWS"},{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10908,"name":"Chemical Feed System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCF"},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12503,"name":"Air Cool Condenser","category":{"id":2552,"name":"System","alias":"system"},"alias":"ACC"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":14102,"name":"Service Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SWS"},{"id":14103,"name":"Blow Down System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BDN"},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17305,"name":"BOP","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18903,"name":"GLAND STEAM","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18905,"name":"STEAM TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"STP"},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20504,"name":"COMBUSTION TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"CTP"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23708,"name":"Potable Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PWS"},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":"SY"},{"id":23710,"name":"Fire Protection System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FPS"},{"id":25302,"name":"Sampling System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SMP"},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":28502,"name":"ECA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28503,"name":"TCA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":30102,"name":"Fuel Gas System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FGS"},{"id":30103,"name":"DRAINS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31704,"name":"COMPRESSED GASSES","category":{"id":2552,"name":"System","alias":"system"},"alias":"CMP"},{"id":31705,"name":"2C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31706,"name":"3C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33304,"name":"HRSG","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":34902,"name":"DUCT BURNER","category":{"id":2552,"name":"System","alias":"system"},"alias":"BUR"},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":38102,"name":"AFCU","category":{"id":2552,"name":"System","alias":"system"},"alias":"SCR"},{"id":39702,"name":"Bulk Ammonia System","category":{"id":2552,"name":"System","alias":"system"},"alias":"AQA"},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41302,"name":"CONTROL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"COS"},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":42952,"name":"Electrical Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":42953,"name":"Electrical","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":42954,"name":"Electrical Panel Schedule Picture","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":46202,"name":"SEAL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"SOS"},{"id":1000000546,"name":"Demin Water Treatment System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWT"},{"id":1000000547,"name":"LP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"LPS"},{"id":1000000548,"name":"IP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"IPS"},{"id":1000000549,"name":"HP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"HPS"},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000954,"name":"Sanitary Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SDR"},{"id":1000000955,"name":"Plant Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PDR"},{"id":1000000956,"name":"Waste Water Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"WDR"},{"id":1000008028,"name":"Active","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"ACT"},{"id":1000008029,"name":"Inactive","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"INA"},{"id":1000008030,"name":"Closed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"CLS"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009481,"name":"HT Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009482,"name":"Electrical One and Three Line Diagram","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009483,"name":"HRSG Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009484,"name":"HRSG Isometrics","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009485,"name":"BOP Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009486,"name":"Isometric Large Bore Piping none-stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009487,"name":"Isometric Large Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009488,"name":"Isometric Small Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009492,"name":"processed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":4000010605,"name":"General","category":{"id":4000010604,"name":"Comment Type","alias":"commentType"},"alias":"GEN"},{"id":4000010606,"name":"Correction Needed","category":{"id":4000010604,"name":"Comment Type","alias":"commentType"},"alias":"COR"},{"id":4000010607,"name":"Note","category":{"id":4000010604,"name":"Comment Type","alias":"commentType"},"alias":"NOTE"},{"id":4000010608,"name":"QA","category":{"id":4000010604,"name":"Comment Type","alias":"commentType"},"alias":"QA"},{"id":6000011533,"name":"Unit 1","category":{"id":6000011532,"name":"Unit","alias":"unit"},"alias":"01"},{"id":6000011534,"name":"Unit 2","category":{"id":6000011532,"name":"Unit","alias":"unit"},"alias":"02"},{"id":6000011535,"name":"BOP","category":{"id":6000011532,"name":"Unit","alias":"unit"},"alias":"00"},{"id":6000011537,"name":"No","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"NO"},{"id":6000011538,"name":"Yes","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"YES"},{"id":6000011540,"name":"Fire Side","category":{"id":6000011539,"name":"Group","alias":"group"},"alias":"FSD"},{"id":6000011541,"name":"Water Side","category":{"id":6000011539,"name":"Group","alias":"group"},"alias":"WSD"},{"id":6000011542,"name":"Unit 1","category":{"id":6000011539,"name":"Group","alias":"group"},"alias":"U1"},{"id":6000011543,"name":"Unit 2","category":{"id":6000011539,"name":"Group","alias":"group"},"alias":"U2"},{"id":6000011545,"name":"Strainer","category":{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},"alias":"STR"},{"id":6000011546,"name":"Terminal Attemperator","category":{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},"alias":"TERM ATTEMP"},{"id":6000011547,"name":"Interstage Attemperator","category":{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},"alias":"INTERSTAGE ATTEMP"},{"id":6000011548,"name":"Boiler Feed Pump","category":{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},"alias":"BFP"},{"id":6000011549,"name":"Condensate Pump","category":{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},"alias":"CND PMP"},{"id":6000011550,"name":"Throttled","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"THRTL"},{"id":6000011551,"name":"Throttled","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"THRTL"},{"id":6000011552,"name":"Control Room","category":{"id":2702,"name":"Location","alias":"location"},"alias":"CR"},{"id":6000011554,"name":"Not Processed","category":{"id":6000011553,"name":"Processing Status","alias":"processingStatus"},"alias":"NP"},{"id":6000011555,"name":"In Progress","category":{"id":6000011553,"name":"Processing Status","alias":"processingStatus"},"alias":"IP"},{"id":6000011556,"name":"Verified","category":{"id":6000011553,"name":"Processing Status","alias":"processingStatus"},"alias":"VRF"}],"message":"All values retrieved successfully","timestamp":[2026,2,9,23,16,24,779935000]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/all-values","rt":"json"},"1756457535":{"b":{"responseData":[{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,24,280422700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/eqType","rt":"json"},"2184816037":{"b":{"responseData":[{"id":1000009432,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,17,4,30,0,708460000],"dateModified":[2025,10,17,4,30,0,708460000],"workScope":null,"system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":null,"time":null,"companyPerson":null,"location":null,"specialInstructions":null,"requestedBy":null,"hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":false,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":false,"safetyGlasses":false,"hearingProtection":false,"boots":false,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":false,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":0},{"id":1000009497,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,18,0,56,35,472353000],"dateModified":[2025,10,24,20,21,37,923318000],"workScope":"Changing fuel gas strainers ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-19","time":"06:00","companyPerson":"Depue/Andrew gorlik","location":"U1 GT enclosure ","specialInstructions":"","requestedBy":"Andrew gorlik","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":true,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":1},{"id":1000009510,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,23,12,39,41,392500000],"dateModified":[2025,10,23,12,39,41,392500000],"workScope":null,"system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":null,"time":null,"companyPerson":null,"location":null,"specialInstructions":null,"requestedBy":null,"hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":false,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":false,"safetyGlasses":false,"hearingProtection":false,"boots":false,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":false,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":2},{"id":1000009513,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,23,15,49,18,495093000],"dateModified":[2025,10,23,15,50,24,84718000],"workScope":"Winterization scaffolding ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-24","time":"07:00","companyPerson":"Brand/Joe hart","location":"Site wide","specialInstructions":null,"requestedBy":"Joe hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":false,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":3},{"id":1000009514,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,23,16,51,17,7039000],"dateModified":[2025,10,24,20,21,16,285321000],"workScope":"Changing fuel gas strainers ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-19","time":"06:00","companyPerson":"Depue/Andrew gorlik","location":"U1 GT enclosure ","specialInstructions":null,"requestedBy":"Andrew gorlik","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":false,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":false,"safetyGlasses":false,"hearingProtection":false,"boots":false,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":false,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":4},{"id":1000009560,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,24,4,53,2,677234000],"dateModified":[2025,10,24,4,53,2,677234000],"workScope":null,"system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":null,"time":null,"companyPerson":null,"location":null,"specialInstructions":null,"requestedBy":null,"hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":false,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":5},{"id":1000009566,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,24,20,13,50,938476000],"dateModified":[2025,10,24,20,14,27,901128000],"workScope":"Offload consumable parts kit","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-24","time":"07:00","companyPerson":"Mitsubishi Power/Austin Rotz","location":"GT1 Bay","specialInstructions":null,"requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":true,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":6},{"id":1000009711,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,4,40,41,774990000],"dateModified":[2025,10,25,4,42,16,34665000],"workScope":"Winterization scaffolding ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":null,"requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":7},{"id":1000009713,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,0,45,207141000],"dateModified":[2025,10,25,5,3,3,832294000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 ACC Fan Shrouds","specialInstructions":null,"requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":8},{"id":1000009714,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,1,41,714988000],"dateModified":[2025,10,25,5,3,3,832294000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 ACC Fan Shrouds","specialInstructions":null,"requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":9},{"id":1000009721,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,3,3,830284000],"dateModified":[2025,10,25,5,3,3,830284000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 ACC Fan Shrouds","specialInstructions":null,"requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":10},{"id":1000009733,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,17,47,3,437112000],"dateModified":[2025,10,25,17,49,45,582896000],"workScope":"Opening HRSG Doors","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32089","date":"2025-10-25","time":"17:43","companyPerson":"Jackson/Danil Klokov","location":"U1 HRSG","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Danil Klokov","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":11},{"id":1000009735,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,22,50,27,432510000],"dateModified":[2025,10,26,0,17,27,543175000],"workScope":"ACC upper/lower duct inspections, CRT and DEA inspections, HRSG inspections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-26","time":"06:00","companyPerson":"Jackson/Ryan Sedler","location":"Unit 1 ","specialInstructions":"LOTO Boxes: [33, 34]","requestedBy":"Ryan Sedler","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":12},{"id":1000009741,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,23,46,47,366140000],"dateModified":[2025,10,25,23,50,23,230249000],"workScope":"-Build scaffolding near tophats\\n-Remove insulation around fuel piping and nozzles\\n-Remove dummy pilot fuel nozzles\\n-Remove inlet manways","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32002","date":"2025-10-26","time":"07:00","companyPerson":"Mitsubishi /Austin Rotz","location":"GT1 Enclosure ","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":13},{"id":1000009745,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,23,54,57,626058000],"dateModified":[2025,10,25,23,58,51,293014000],"workScope":"Cut out old valves and weld new ones","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32003","date":"2025-10-27","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 West side ground of HRSG","specialInstructions":"LOTO Boxes: [33]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":14},{"id":1000009756,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,17,22,55,696953000],"dateModified":[2025,10,26,17,26,21,938343000],"workScope":"Clean inside of HRSG","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32101","date":"2025-10-26","time":"18:00","companyPerson":"Jackson/Danil Klokov","location":"U1 HRSG","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Danil Klokov","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":15},{"id":1000009759,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,22,27,51,192249000],"dateModified":[2025,10,26,22,29,22,396388000],"workScope":"Remove U1 control pump A / package and deliver to local repair shop for inspection and seal kit replacement ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"10:30","companyPerson":"GTS mechanical /John Pittman","location":"U1 Control Oil skid","specialInstructions":"","requestedBy":"John Pittman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":true,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":16},{"id":1000009761,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,22,29,41,386203000],"dateModified":[2025,10,26,22,30,53,277319000],"workScope":"Remove Polishing pump / package and deliver to local repair shop for inspection and seal kit replacement.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"12:00","companyPerson":"GTS Mechanical /John Pittman","location":"U1 Control Oil skid","specialInstructions":"LOTO Boxes: [37]","requestedBy":"John Pittman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":true,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":17},{"id":1000009764,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,26,22,31,50,182459000],"dateModified":[2025,10,26,22,34,16,890625000],"workScope":"Enter confined space (GT fireside)\\nEstablish hole watch\\nSet up lighting\\nInspect welds/ liner plates/hardware for cracks and or damage \\nPlan scaffolding if needed \\nSet up tooling ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"09:00","companyPerson":"GTS Mechanical /John Pittman ","location":"U1 exhaust duct (Turbine side)","specialInstructions":"LOTO Boxes: [62, 34]","requestedBy":"John Pittman ","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":18},{"id":1000009776,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,27,17,21,4,878336000],"dateModified":[2025,10,27,17,22,20,736221000],"workScope":"-Determ heater, lighting, and sensors\\n-Remove H20 fire suppression piping\\n-Remove exciter enclose\\n","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","time":"14:05","companyPerson":"Mitsubishi /Austin Rotz","location":"GTG1 Exciter Enclosure ","specialInstructions":"","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":19},{"id":1000009779,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,27,19,13,36,315903000],"dateModified":[2025,10,27,19,15,11,148352000],"workScope":"Modify pump enclosure steel so we can get the heater probe out, Cut tube steel & weld plate","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-28","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 BFW Pump Enclosure","specialInstructions":"LOTO Boxes: [33]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":true,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":20},{"id":1000009851,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,17,23,42,125466000],"dateModified":[2025,10,30,17,28,23,972435000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32215","date":"2025-10-30","time":"19:00","companyPerson":"pro Serv/Corey Brown","location":"HRSG 1 stage and 2 catalyst","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Corey Brown","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":true,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":true,"respirator":false,"dustMask":true,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":21},{"id":1000009855,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,17,39,6,291916000],"dateModified":[2025,10,30,17,40,41,237347000],"workScope":"Install insulation around combustor and replace CPFM sensors","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32216","date":"2025-10-30","time":"20:00","companyPerson":"Mitsubishi Power/Corey Love","location":"GT Enclosure","specialInstructions":"","requestedBy":"Corey Love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":22},{"id":1000009861,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,16,17,862021000],"dateModified":[2025,10,30,18,17,45,197444000],"workScope":"Replace gaskets on flange connections","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-31","time":"09:00","companyPerson":"Mitsubishi Power/Corey Love","location":"GT enclosure","specialInstructions":"LOTO Boxes: [8]","requestedBy":"Corey Love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":23},{"id":1000009864,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,19,55,174028000],"dateModified":[2025,10,30,18,23,4,18394000],"workScope":"change out valves and weld new flanges in","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32218","date":"2025-10-31","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 & U2 fuel gas valves","specialInstructions":"LOTO Boxes: [12]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":24},{"id":1000009868,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,24,35,764037000],"dateModified":[2025,10,30,18,25,31,632829000],"workScope":"Install conduit and wiring for HRG systems","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32219","date":"2025-10-31","time":"07:00","companyPerson":"Block/Travis Wills","location":"Plant wide elec. rooms","specialInstructions":"","requestedBy":"Travis Wills","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":25},{"id":1000009877,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,30,30,297242000],"dateModified":[2025,10,30,18,31,32,540747000],"workScope":"Winterization scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32220","date":"2025-10-31","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":26},{"id":1000009879,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,31,50,124648000],"dateModified":[2025,10,30,18,32,51,426602000],"workScope":"Removal of insulation and install insulation plant wide","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32221","date":"2025-10-31","time":"06:00","companyPerson":"M&O/Daniel Werner","location":"Insulation removal/repairs","specialInstructions":"","requestedBy":"Daniel Werner","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":27},{"id":1000009881,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,33,7,404706000],"dateModified":[2025,10,30,18,35,48,42008000],"workScope":"Break down and remove scaffold that’s has been erected in the manifold","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32222","date":"2025-10-30","time":"08:00","companyPerson":"Mitsubishi power/Corey Love","location":"GT1 inlet manifold","specialInstructions":"LOTO Boxes: [33, 62]","requestedBy":"Corey Love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":28},{"id":1000009894,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,42,19,470618000],"dateModified":[2025,10,30,18,45,0,773219000],"workScope":"Inspection, clean area","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32223","date":"2025-10-31","time":"19:40","companyPerson":"Jackson Generation/Justin W","location":"Unit 1 Steam exhaust duct","specialInstructions":"LOTO Boxes: [33, 62]","requestedBy":"Justin W","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":29},{"id":1000009898,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,30,40,284142000],"dateModified":[2025,10,30,20,32,11,843439000],"workScope":"Setup machine tooling and begin machining operations","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32224","date":"2025-10-30","time":"08:00","companyPerson":"Mitsubishi Power/Corey love","location":"GT1 collector ring","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Corey love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":30},{"id":1000009910,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,38,56,275176000],"dateModified":[2025,10,30,20,40,52,266359000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32225","date":"2025-10-31","time":"07:00","companyPerson":"pro Serv/Corey Brown","location":"HRSG 1 stage and 2 catalyst","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Corey Brown","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":true,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":true,"respirator":false,"dustMask":true,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":31},{"id":1000009917,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,48,58,24155000],"dateModified":[2025,10,30,20,52,7,275601000],"workScope":"GT exhaust liner repairs","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32226","date":"2025-10-31","time":"07:00","companyPerson":"Mitsubishi/","location":"U1 GT EXHAUST","specialInstructions":"LOTO Boxes: [62, 34]","requestedBy":"","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":true,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":32},{"id":1000009925,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,2,40,161083000],"dateModified":[2025,10,30,21,3,55,86418000],"workScope":"U1 Generator air filter modifications","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32227","date":"2025-10-31","time":"07:00","companyPerson":"Mitsubishi/","location":"U1 Generator","specialInstructions":"LOTO Boxes: [20]","requestedBy":"","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":33},{"id":1000009927,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,4,12,792192000],"dateModified":[2025,10,30,21,5,13,590096000],"workScope":"U1 GT CPFM replacement","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32228","date":"2025-10-31","time":"07:00","companyPerson":"Mitsubishi/","location":"U1 GT","specialInstructions":"LOTO Boxes: [34]","requestedBy":"","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":34},{"id":1000009929,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,5,45,90608000],"dateModified":[2025,10,30,21,9,55,11992000],"workScope":"U1 ECA HEAT TRACE","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32229","date":"2025-10-31","time":"07:00","companyPerson":"Mitsubishi/","location":"U1 ECA","specialInstructions":"LOTO Boxes: [4, 33]","requestedBy":"","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":35},{"id":1000009933,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,10,24,612118000],"dateModified":[2025,10,30,21,17,50,867543000],"workScope":"U1 SCR BAFFLE PLATE REPAIR","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32230","date":"2025-10-31","time":"07:00","companyPerson":"Jackson/Keb Basset","location":"U1 SCR","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Keb Basset","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":36},{"id":1000009947,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,24,18,799939000],"dateModified":[2025,10,31,17,25,4,7217000],"workScope":"U1 Generator air filter modifications","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32250","date":"2025-11-01","time":"07:00","companyPerson":"Mitsubishi/","location":"U1 Generator","specialInstructions":"LOTO Boxes: [20]","requestedBy":"","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":37},{"id":1000009949,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,26,58,967149000],"dateModified":[2025,10,31,17,29,32,377065000],"workScope":"weld mifting lugs on flow meter","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32252","date":"2025-11-01","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 fuel gas flow meter","specialInstructions":"LOTO Boxes: [12]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":true,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":38},{"id":1000009952,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,31,25,839009000],"dateModified":[2025,10,31,17,34,4,673633000],"workScope":"Visual inspection of GT inlet.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32253","date":"2025-11-01","time":"08:00","companyPerson":"Mitsubishi Power/Corey Love","location":"GT1 inlet manifold","specialInstructions":"LOTO Boxes: [62, 34]","requestedBy":"Corey Love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":39},{"id":1000009955,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,37,22,987519000],"dateModified":[2025,10,31,17,38,22,366502000],"workScope":"Machining of collector ring","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32254","date":"2025-11-01","time":"08:00","companyPerson":"Mitsubishi Power/Corey love","location":"GT1 collector ring","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Corey love","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":40},{"id":1000009957,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,42,2,850601000],"dateModified":[2025,10,31,17,49,56,744916000],"workScope":"Inspections of Upper/Lower ACC, STED, GTED, HRSG","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32255","date":"2025-11-01","time":"05:00","companyPerson":"Jackson/Ryan sedler","location":"ACC/HRSG","specialInstructions":"LOTO Boxes: [36, 35]","requestedBy":"Ryan sedler","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":41},{"id":1000009976,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,19,38,33,389558000],"dateModified":[2025,11,1,19,39,51,813520000],"workScope":"Generator purge","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32272","date":"2025-11-01","time":"19:34","companyPerson":"Jackson Generation/Geo Martinez","location":"U2  Turbine building","specialInstructions":"","requestedBy":"Geo Martinez","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":42},{"id":1000009978,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,8,5,243138000],"dateModified":[2025,11,1,21,10,56,267821000],"workScope":"Build scaffold inside HRSG for SCR upper baffle","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32273","date":"2025-11-02","time":"07:00","companyPerson":"Brand/Joe Hart","location":"U1 SRC upper baffle","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":43},{"id":1000009981,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,17,7,295615000],"dateModified":[2025,11,1,21,20,18,630182000],"workScope":"Weld repairs cracks on supports","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32274","date":"2025-11-01","time":"08:00","companyPerson":"GTS/John Pittman","location":"U1 exhaust duct","specialInstructions":"LOTO Boxes: [62, 34]","requestedBy":"John Pittman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":44},{"id":1000009985,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,22,9,682910000],"dateModified":[2025,11,1,21,23,28,858421000],"workScope":"Install heat trace to ECA transmitter tubing lines","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32275","date":"2025-11-01","time":"08:00","companyPerson":"GTS/Raymundo Ortiz","location":"U1 ECA transmitters heat trace","specialInstructions":"","requestedBy":"Raymundo Ortiz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":45},{"id":1000009987,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,23,50,699996000],"dateModified":[2025,11,1,21,26,2,625704000],"workScope":"Collector ring machining ","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32276","date":"2025-11-02","time":"07:00","companyPerson":"Mitsubishi /Austin Rotz","location":"GTG1 Exciter House","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":46},{"id":1000009989,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,26,51,948034000],"dateModified":[2025,11,1,21,28,51,233544000],"workScope":"Inspection and pictures","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32277","date":"2025-11-02","time":"10:00","companyPerson":"Mitsubishi/Ronald McMurtry","location":"U2 GT exhaust duct","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Ronald McMurtry","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":47},{"id":1000009992,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,29,31,171972000],"dateModified":[2025,11,1,21,30,41,996900000],"workScope":"Install new bus duct filter box and filters","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32278","date":"2025-11-02","time":"07:00","companyPerson":"Mitsubishi/Ben Swan","location":"GTG-2 Bus Duct","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":48},{"id":1000009994,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,31,17,606285000],"dateModified":[2025,11,1,21,32,29,445159000],"workScope":"-Machine collector ring\\n-Dimensionally inspect collector rings","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32279","date":"2025-11-02","time":"07:00","companyPerson":"Mitsubishi/Austin Rotz","location":"GTG-1 Excitor House","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":49},{"id":1000009996,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,33,25,120018000],"dateModified":[2025,11,1,21,35,7,490783000],"workScope":"LUBE OIL SYSTEM TESTING","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32280","date":"2025-11-02","time":"07:00","companyPerson":"Mitsubishi/Austin Rotz","location":"GT-1 Enclosure","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":50},{"id":1000010010,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,19,52,282145000],"dateModified":[2025,11,2,4,22,6,763592000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32281","date":"2025-11-02","time":"05:00","companyPerson":"Jackson/Scott","location":"U2 HRSG LOWER","specialInstructions":"LOTO Boxes: [36, 63]","requestedBy":"Scott","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":51},{"id":1000010013,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,23,25,152002000],"dateModified":[2025,11,2,4,24,44,669090000],"workScope":"Install heat trace to ECA transmitter tubing lines","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32282","date":"2025-11-02","time":"08:00","companyPerson":"GTS/Raymundo Ortiz","location":"U1 ECA transmitters heat trace","specialInstructions":"","requestedBy":"Raymundo Ortiz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":52},{"id":1000010016,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,25,6,274909000],"dateModified":[2025,11,2,4,27,3,981043000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32283","date":"2025-11-02","time":"09:00","companyPerson":"GTS/John Pittman","location":"U2 HRSG LOWER","specialInstructions":"LOTO Boxes: [36, 63]","requestedBy":"Scott","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":53},{"id":1000010018,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,4,28,7,930770000],"dateModified":[2025,11,2,4,31,6,827844000],"workScope":"Inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32284","date":"2025-11-02","time":"08:00","companyPerson":"GTS/John Pittman","location":"U1 exhaust duct","specialInstructions":"LOTO Boxes: [62, 34]","requestedBy":"John Pittman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":54},{"id":1000010057,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,17,50,56,988067000],"dateModified":[2025,11,2,17,53,43,378180000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32295","date":"2025-11-02","time":"19:00","companyPerson":"Pro Serv/Corey Brown","location":"HRSG 1 stage and 2 catalyst","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Corey Brown","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":55},{"id":1000010063,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,22,15,686706000],"dateModified":[2025,11,2,19,24,3,746810000],"workScope":"Clean glycol fans","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32296","date":"2025-11-03","time":"07:00","companyPerson":"Chart Industries/Mike Miles","location":"Unit 1 glycol fans","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Mike Miles","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":true,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":56},{"id":1000010065,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,24,50,817155000],"dateModified":[2025,11,2,19,25,52,213088000],"workScope":"Install conduit\\nPull wire \\nTerminate cables","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32297","date":"2025-11-03","time":"07:00","companyPerson":"Block electric/Travis wills","location":"Acc units","specialInstructions":"","requestedBy":"Travis wills","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":57},{"id":1000010067,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,26,25,653266000],"dateModified":[2025,11,2,19,28,22,52037000],"workScope":"unbolt flanges to see what pipe does","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32298","date":"2025-11-03","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 & U2 HHS999 relief valve","specialInstructions":"LOTO Boxes: [33, 35]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":58},{"id":1000010069,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,29,1,293268000],"dateModified":[2025,11,2,19,31,12,818163000],"workScope":"Weld new flanges & change out 3 existing valves","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32299","date":"2025-11-03","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 & U2 fuel gas valves","specialInstructions":"LOTO Boxes: [12]","requestedBy":"Dan Schomig","hazards":{"highTemp":true,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":59},{"id":1000010072,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,32,39,341907000],"dateModified":[2025,11,2,19,34,5,287287000],"workScope":"Brush visual inspection.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32300","date":"2025-11-03","time":"09:00","companyPerson":"Mitsubishi Generator/Satoru Nakayama","location":"Unit.2 Generator collector housing","specialInstructions":"","requestedBy":"satoru nakayama","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":60},{"id":1000010074,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,34,30,414297000],"dateModified":[2025,11,2,19,36,4,99668000],"workScope":"Unbolt and install Safety Relief Valves","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32301","date":"2025-11-03","time":"07:00","companyPerson":"Depue, Jackson, Kiewit, Cockrill/Ryan Sedler","location":"Unit 1 & 2","specialInstructions":"LOTO Boxes: [33, 35]","requestedBy":"Ryan sedler","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":61},{"id":1000010076,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,36,27,111015000],"dateModified":[2025,11,2,19,39,19,415507000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32302","date":"2025-11-03","time":"08:00","companyPerson":"GTS/John Pittman","location":"U2 exhaust duct","specialInstructions":"LOTO Boxes: [36]","requestedBy":"John Pittman","hazards":{"highTemp":true,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":true,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":62},{"id":1000010080,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,40,4,957488000],"dateModified":[2025,11,2,19,41,8,257351000],"workScope":"Install heat trace to ECA instrument tubing lines\\nPull wire thru conduit to heat trace panel","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32303","date":"2025-11-03","time":"08:00","companyPerson":"GTS/Raymundo Ortiz","location":"U1 ECA instrument heat trace","specialInstructions":"","requestedBy":"Raymundo Ortiz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":63},{"id":1000010082,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,44,37,304539000],"dateModified":[2025,11,2,19,46,25,715343000],"workScope":"Perform maintenance on SSS Clutch","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32304","date":"2025-11-03","time":"07:00","companyPerson":"Mitsubishi Power/Benjamin Swan","location":"ST Enclosure","specialInstructions":"LOTO Boxes: [58, 3, 63]","requestedBy":"Benjamin Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":true,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":64},{"id":1000010084,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,47,8,621954000],"dateModified":[2025,11,2,19,48,49,313772000],"workScope":"Machine collector rings","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32305","date":"2025-11-03","time":"07:00","companyPerson":"Mitsubishi/Austin Rotz","location":"GTG-1 Excitor House","specialInstructions":"LOTO Boxes: [20, 62]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":65},{"id":1000010087,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,22,35,27,731558000],"dateModified":[2025,11,2,22,37,38,282827000],"workScope":"Erecting scaffold for the Catalyst change out","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32306","date":"2025-11-03","time":"06:00","companyPerson":"ProServ/David Hall","location":"HRSG 2 stage 1 and 2 Catalyst Scaffolding","specialInstructions":"LOTO Boxes: [36]","requestedBy":"David Hall","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":66},{"id":1000010101,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,24,34,416223000],"dateModified":[2025,11,3,17,27,1,358751000],"workScope":"SSS Clutch Disassembly and Removal","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32331","date":"2025-11-03","time":"19:00","companyPerson":"Mitsubishi Power/Richard Jones","location":"ST-2 Enclosure","specialInstructions":"FIRE SYSTEM IS OOS, LOTO Boxes: [58, 3, 63]","requestedBy":"Richard Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":67},{"id":1000010103,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,28,16,947018000],"dateModified":[2025,11,3,17,31,57,920669000],"workScope":"Install high resistance grounding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32332","date":"2025-11-04","time":"06:00","companyPerson":"Block electric/Travis wills","location":"All over the plant in MCC’s","specialInstructions":"LOTO Boxes: [28, 27]","requestedBy":"Travis wills","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":68},{"id":1000010109,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,33,0,413950000],"dateModified":[2025,11,3,17,35,32,331396000],"workScope":"Enter the unit 1 penthouse to do thickness readings on the header","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32333","date":"2025-11-04","time":"06:00","companyPerson":"Jackson Generation/Matt Wrightsman","location":"Unit 1 HRSG penthouse","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Matt Wrightsman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":69},{"id":1000010113,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,36,50,677115000],"dateModified":[2025,11,3,17,38,39,576831000],"workScope":"Install the high resistance ground systems","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32334","date":"2025-11-04","time":"08:00","companyPerson":"Resa/Matt Wrightsman","location":"Unit 1 and unit 2 ACC MCC","specialInstructions":"LOTO Boxes: [28, 27]","requestedBy":"Matt Wrightsman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":70},{"id":1000010115,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,39,8,479162000],"dateModified":[2025,11,3,17,41,13,481164000],"workScope":"install witches hat's","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32335","date":"2025-11-04","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 GT Enclosure","specialInstructions":"FIRE SYSTEM IS OOS;, LOTO Boxes: [34]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":71},{"id":1000010119,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,43,36,775284000],"dateModified":[2025,11,3,17,45,17,556639000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32336","date":"2025-11-03","time":"19:00","companyPerson":"Pro Serv/Corey Brown","location":"HRSG 1 stage and 2 catalyst","specialInstructions":"LOTO Boxes: [34]","requestedBy":"Corey Brown","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":72},{"id":1000010125,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,18,46,50,88728000],"dateModified":[2025,11,3,18,48,31,612334000],"workScope":"xray welds and bolt up valves","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32337","date":"2025-11-04","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U1 & U2 fuel gas valves","specialInstructions":"LOTO Boxes: [12]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":73},{"id":1000010127,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,18,49,51,430693000],"dateModified":[2025,11,3,18,58,26,960560000],"workScope":"Tear down HRSG /STED scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32338","date":"2025-11-04","time":"07:00","companyPerson":"Brand/Joe Hart","location":"U1 HRSG/STED","specialInstructions":"LOTO Boxes: [33, 34]","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":74},{"id":1000010131,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,18,59,18,500774000],"dateModified":[2025,11,3,19,3,42,45872000],"workScope":"SSS Clutch Disassembly and Removal","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32339","date":"2025-11-04","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"ST-2 Enclosure","specialInstructions":"FIRE SYSTEM IS OOS, LOTO Boxes: [58, 3, 63]","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":75},{"id":1000010133,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,5,6,793141000],"dateModified":[2025,11,3,19,8,58,919066000],"workScope":"Clean unit 1 and 2 glycol fans","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32340","date":"2025-11-04","time":"07:00","companyPerson":"Chart Industries/Mike Miles","location":"Unit 1 and 2 glycol fans","specialInstructions":"LOTO Boxes: [33, 60]","requestedBy":"Mike Miles","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":true,"dustMask":true,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":76},{"id":1000010139,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,10,13,280657000],"dateModified":[2025,11,3,19,11,23,369932000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-04","time":"08:00","companyPerson":"GTS/John Pittman","location":"U2 exhaust duct","specialInstructions":null,"requestedBy":"John Pittman","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":77},{"id":1000010143,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,17,57,725386000],"dateModified":[2025,11,3,19,21,37,569836000],"workScope":"Pull wire thru conduit to heat trace panel\\nTerminate wire at heat trace panel","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32341","date":"2025-11-04","time":"08:00","companyPerson":"GTS/Raymundo Ortiz","location":"U1 ECA instrument heat trace","specialInstructions":"","requestedBy":"Raymundo Ortiz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":78},{"id":1000010145,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,21,57,868273000],"dateModified":[2025,11,3,19,23,52,44817000],"workScope":"Term Collector\\nInstall collector doghouse","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32342","date":"2025-11-04","time":"07:00","companyPerson":"Mitsubishi Power/Austin Rotz","location":"GTG-1","specialInstructions":"LOTO Boxes: [20, 62, 34]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":79},{"id":1000010147,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,24,42,305253000],"dateModified":[2025,11,3,19,26,11,206990000],"workScope":"Remove CPFMs","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32343","date":"2025-11-04","time":"07:00","companyPerson":"Mitsubishi Power/Austin Rotz","location":"GT-1 Enclosure","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS;, LOTO Boxes: [34]","requestedBy":"Austin Rotz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":80},{"id":1000010203,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,19,36,324451000],"dateModified":[2025,11,6,17,28,2,27633000],"workScope":"Clean components and equipment in unit 2 crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32416","date":"2025-11-06","time":"19:00","companyPerson":"Mitsubishi Power/Richard Jones","location":"Unit 2 Crane Bay","specialInstructions":"","requestedBy":"Richard Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":true,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":81},{"id":1000010205,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,29,28,950417000],"dateModified":[2025,11,6,17,31,59,538950000],"workScope":"SSS Clutch Disassembly and Removal","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32417","date":"2025-11-06","time":"19:00","companyPerson":"Mitsubishi Power/Richard Jones","location":"ST-2 Enclosure","specialInstructions":"Fire Protection System is OOS, LOTO Boxes: [36, 3, 63]","requestedBy":"Richard Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":82},{"id":1000010207,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,42,41,287925000],"dateModified":[2025,11,6,17,43,28,877830000],"workScope":"Semi-annual Fire alarm inspection","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32418","date":"2025-11-07","time":"06:00","companyPerson":"Shambaugh Fire Protection Services/Michael Rodriguez","location":"Switch Yard , Turbine 1 and 2","specialInstructions":"","requestedBy":"Michael Rodriguez","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":83},{"id":1000010209,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,46,25,307694000],"dateModified":[2025,11,6,17,47,23,811972000],"workScope":"Generator slip ring on line inspection \\nTemperature, vibration, current, pulling out brushes visual check\\nI would like to borrow a face shield for arc","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32419","date":"2025-11-07","time":"09:00","companyPerson":"Mitsubishi Generator/Satoru Nakayama","location":"Unit.1 Generator","specialInstructions":"","requestedBy":"Satoru Nakayama","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":84},{"id":1000010211,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,48,24,211810000],"dateModified":[2025,11,6,17,56,46,359083000],"workScope":"Install transformer and test unit operation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32420","date":"2025-11-07","time":"08:00","companyPerson":"GTS IC &E/Curtis Peterson","location":"U2 TCP","specialInstructions":"LOTO Boxes: [47]","requestedBy":"Curtis Peterson","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":85},{"id":1000010215,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,17,58,43,830751000],"dateModified":[2025,11,6,17,59,42,728690000],"workScope":"Continue to run PVC conduit and pull #6 awg ground wire in preparation of installing the new system","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32421","date":"2025-11-07","time":"07:00","companyPerson":"Block Electric/Ron Webb","location":"Medium Voltage building","specialInstructions":"","requestedBy":"Ron Webb","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":86},{"id":1000010217,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,8,33,310543000],"dateModified":[2025,11,6,18,9,42,158080000],"workScope":"rebuild valve and pressure test","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32422","date":"2025-11-07","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 Duct burner skid","specialInstructions":"LOTO Boxes: [36]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":87},{"id":1000010219,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,10,33,669313000],"dateModified":[2025,11,6,18,14,8,449945000],"workScope":"Modify BFW pump enclosure so the house can pull the heater","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32423","date":"2025-11-07","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 BFW pump A","specialInstructions":"LOTO Boxes: [69]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":true,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":88},{"id":1000010224,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,14,44,660324000],"dateModified":[2025,11,6,18,15,50,875595000],"workScope":"Install heat trace on relief valve","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32424","date":"2025-11-07","time":"07:00","companyPerson":"Kiewit/Mike Miles","location":"Unit 2 pressure relief valve 999","specialInstructions":"","requestedBy":"Mike Miles","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":89},{"id":1000010226,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,16,7,916660000],"dateModified":[2025,11,6,18,16,56,721911000],"workScope":"Winterization scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32425","date":"2025-11-07","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":90},{"id":1000010228,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,17,11,271760000],"dateModified":[2025,11,6,18,19,19,979602000],"workScope":"Final inspection Unit 2 Gas Turbine Exhaust","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32426","date":"2025-11-07","time":"06:00","companyPerson":"JG/Ryan Sedler","location":"Unit 2 Gas Turbine exhaust","specialInstructions":"LOTO Boxes: [36, 63]","requestedBy":"Ryan Sedler","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":true,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":91},{"id":1000010232,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,51,21,485933000],"dateModified":[2025,11,6,18,52,27,844609000],"workScope":"SSS Clutch Disassembly","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32427","date":"2025-11-07","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"ST-2 Enclosure","specialInstructions":"LOTO Boxes: [36, 3, 63]","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":92},{"id":1000010234,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,54,50,534656000],"dateModified":[2025,11,6,18,56,22,145698000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32428","date":"2025-11-07","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"Unit 2 Crane Bay","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":true,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":93},{"id":1000010237,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,19,55,15,866343000],"dateModified":[2025,11,6,19,58,37,212327000],"workScope":"REMOVE/INSTALL CATALIST","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32432","date":"2025-11-07","time":"06:00","companyPerson":"ProServ/David Hall","location":"HRSG 2 stage 1 and 2","specialInstructions":"LOTO Boxes: [36]","requestedBy":"David Hall","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":true,"gasMonitor":true,"arcFlashPpe":false,"weldingJacket":true,"weldingShield":true,"weldingGloves":true,"purgingVentilation":false,"other":false,"otherDescription":""},"index":94},{"id":1000010277,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,7,17,47,54,945618000],"dateModified":[2025,11,7,17,49,7,331569000],"workScope":"Install ECA heat trace conduit runs","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32440","date":"2025-11-08","time":"08:30","companyPerson":"GTS IC& E/Ray Ortiz","location":"U2 ECA","specialInstructions":"","requestedBy":"Ray Ortiz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":95},{"id":1000010279,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,7,17,51,15,707540000],"dateModified":[2025,11,7,17,52,21,29275000],"workScope":"Insulation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32441","date":"2025-11-08","time":"08:00","companyPerson":"GTS/Fidelmar romero","location":"U1 ECA transmitters","specialInstructions":"","requestedBy":"Fidelmar romero","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":true,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":96},{"id":1000010284,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,8,2,56,29,605370000],"dateModified":[2025,11,8,2,59,45,810780000],"workScope":"SSS Clutch Alignment, Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32444","date":"2025-11-08","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"ST-2 Enclosure","specialInstructions":"LOTO Boxes: [36, 58, 3, 63]","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":true,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":97},{"id":1000010286,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,8,3,1,33,178833000],"dateModified":[2025,11,8,3,3,13,79409000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32445","date":"2025-11-08","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"Unit 2 Crane Bay","specialInstructions":"","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":true,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":true,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":98},{"id":1000010305,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,7,33,43,439590000],"dateModified":[2025,11,11,7,33,43,439590000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-11","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"ST-2 Enclosure","specialInstructions":null,"requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":99},{"id":1000010316,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,9,29,199131000],"dateModified":[2025,11,11,14,11,13,294219000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32497","date":"2025-11-12","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":100},{"id":1000010342,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,28,22,561813000],"dateModified":[2025,11,13,17,31,38,289895000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32534","date":"2025-11-13","time":"19:00","companyPerson":"Mitsubishi Power/Richard Jones","location":"ST-2 Enclosure","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS, LOTO Boxes: [36, 58, 3, 63]","requestedBy":"Richard Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":101},{"id":1000010344,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,32,10,597973000],"dateModified":[2025,11,13,17,34,51,34754000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32535","date":"2025-11-13","time":"19:00","companyPerson":"Mitsubishi Power/Richard Jones","location":"Unit 2 Crane Bay","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","requestedBy":"Richard Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":true,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":102},{"id":1000010348,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,36,9,40118000],"dateModified":[2025,11,13,17,37,10,296019000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32536","date":"2025-11-14","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":103},{"id":1000010350,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,46,53,321357000],"dateModified":[2025,11,13,17,48,15,262377000],"workScope":"PT welds and put valve handles on and clean up","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32537","date":"2025-11-14","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 Top of HRSG","specialInstructions":"LOTO Boxes: [35]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":104},{"id":1000010352,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,48,27,632645000],"dateModified":[2025,11,13,17,49,43,598743000],"workScope":"change out gaskets on both port flanges","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32538","date":"2025-11-14","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"u2 pipe rack","specialInstructions":"LOTO Boxes: [35]","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":105},{"id":1000010354,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,50,27,939510000],"dateModified":[2025,11,13,17,51,58,646014000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32539","date":"2025-11-14","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"Unit 2 Crane Bay","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":true,"combustibleDust":false,"fireHazard":true,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":106},{"id":1000010357,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,54,21,52724000],"dateModified":[2025,11,13,18,0,17,585462000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32540","date":"2025-11-14","time":"07:00","companyPerson":"Mitsubishi Power/Ben Swan","location":"ST-2 Enclosure","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS, LOTO Boxes: [36, 58, 3, 63]","requestedBy":"Ben Swan","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":107},{"id":1000010360,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,14,4,13,21,683638000],"dateModified":[2025,11,14,4,17,15,387333000],"workScope":"HRSG 2 stage 1 and 2 Catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32541","date":"2025-11-14","time":"06:00","companyPerson":"ProServ/David Hall","location":"HRSG 2 stage 1 and 2 Catalyst","specialInstructions":"LOTO Boxes: [36]","requestedBy":"David Hall","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":true,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":true,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":108},{"id":1000010378,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,18,1,24,46,66221000],"dateModified":[2025,11,18,1,27,7,9877000],"workScope":"Inspect the synergy work","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32571","date":"2025-11-18","time":"06:00","companyPerson":"Environex/MATT WRIGHTSMAN","location":"Unit 2 HRSG lower","specialInstructions":"LOTO Boxes: [36]","requestedBy":"MATT WRIGHTSMAN","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":true,"lotoDescription":"","confinedSpace":true,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":109},{"id":1000010381,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,18,1,29,42,815415000],"dateModified":[2025,11,18,1,30,43,707944000],"workScope":"Slim cutting new light poles","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32572","date":"2025-11-18","time":"07:00","companyPerson":"Brieser/Ryan Sedler","location":"South Gate contractor parking lot","specialInstructions":"","requestedBy":"Ryan Sedler","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":true,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":110},{"id":1000010383,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,18,1,31,5,606763000],"dateModified":[2025,11,18,1,32,2,606197000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32573","date":"2025-11-18","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":111},{"id":1000010428,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,21,4,39,43,417664000],"dateModified":[2025,11,21,4,40,45,190631000],"workScope":"Insulate various location for outage and winterization","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32610","date":"2025-11-22","time":"00:24","companyPerson":"M&O/Michael Kielanowicz","location":"Site Wide","specialInstructions":"","requestedBy":"Michael Kielanowicz","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":true,"egressAccess":false,"ergonomicHazard":true,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":112},{"id":1000010430,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,21,4,40,58,494371000],"dateModified":[2025,11,21,4,41,49,657273000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32611","date":"2025-11-21","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Site wide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":true,"ergonomicHazard":true,"fallingObject":true,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":true,"chemicalExposure":false,"liftingHazard":true,"handTraps":true,"heatColdStress":false,"elevatedSurface":true,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":true,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":113},{"id":1000010432,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,21,4,42,15,256262000],"dateModified":[2025,11,21,4,43,1,333000],"workScope":"Repair oil leak on bearing strainer pot 4 and install LPSV","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32612","date":"2025-11-21","time":"10:31","companyPerson":"Mitsubishi power/Rick Jones","location":"ST-2","specialInstructions":"","requestedBy":"Rick Jones","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":true,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":true,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":114},{"id":1000010477,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,10,1,18,1,103947000],"dateModified":[2025,12,10,1,18,1,103947000],"workScope":"Fix a leak on 1C and fix tubing on 3E & F","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-12-10","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 ACC deck by fan's","specialInstructions":null,"requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":115},{"id":1000010478,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,10,1,18,10,281325000],"dateModified":[2025,12,10,1,20,36,944517000],"workScope":"Fix a leak on 1C and fix tubing on 3E & F","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32675","date":"2025-12-10","time":"06:00","companyPerson":"Depue/Dan Schomig","location":"U2 ACC deck by fan's","specialInstructions":"","requestedBy":"Dan Schomig","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":116},{"id":1000010480,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,10,1,22,47,416766000],"dateModified":[2025,12,10,1,23,58,511751000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32676","date":"2025-12-10","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Sitewide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":117},{"id":1000010481,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,10,1,22,51,62398000],"dateModified":[2025,12,10,1,23,58,511751000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32677","date":"2025-12-10","time":"07:00","companyPerson":"Brand/Joe Hart","location":"Sitewide","specialInstructions":"","requestedBy":"Joe Hart","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":118},{"id":1000010535,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,30,19,2,29,877307000],"dateModified":[2025,12,30,19,3,36,480282000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32724","date":"2025-12-31","time":"07:00","companyPerson":"Brand/Rick Peters","location":"SCR skid","specialInstructions":"","requestedBy":"Rick Peters","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":119},{"id":1000010536,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,12,30,19,2,33,203723000],"dateModified":[2025,12,30,19,3,36,480282000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32723","date":"2025-12-31","time":"07:00","companyPerson":"Brand/Rick Peters","location":"SCR skid","specialInstructions":"","requestedBy":"Rick Peters","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":120},{"id":1000010568,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"SafeWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2026,1,8,23,26,45,525768000],"dateModified":[2026,1,8,23,27,46,364123000],"workScope":"Install lights on Jackson sign & troubleshoot contractor parking light\\n\\nOld LOTO was 24419. Please re-issue","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"32747","date":"2026-01-12","time":"07:00","companyPerson":"Block Electric/Cfuhrmann for Block","location":"South Gate Entrance","specialInstructions":"","requestedBy":"Cfuhrmann for Block","hazards":{"highTemp":false,"highPressure":false,"energized":false,"storedEnergy":false,"eyeHazard":false,"egressAccess":false,"ergonomicHazard":false,"fallingObject":false,"highNoise":false,"dustParticulate":false,"combustibleDust":false,"fireHazard":false,"hotSurface":false,"slippery":false,"ventilationRequired":false,"lightingRestrictions":false,"chemicalExposure":false,"liftingHazard":false,"handTraps":false,"heatColdStress":false,"elevatedSurface":false,"environmental":false,"weatherHazards":false,"weatherHazardDescription":"","other":false,"otherDescription":""},"permits":{"lotoRequired":false,"lotoDescription":"","confinedSpace":false,"confinedSpaceDescription":false,"hotWork":false,"hotWorkDescription":"","ventingPurging":false,"ventingPurgingDescription":"","jha":true,"gasTesting":false,"excavationPermit":false,"energizedPermit":false,"other":false},"ppe":{"hardhat":true,"safetyGlasses":true,"hearingProtection":true,"boots":true,"fallProtection":false,"gfi":false,"respirator":false,"dustMask":false,"gloves":true,"iceCleats":false,"acidSuit":false,"barricade":false,"faceShield":false,"gasMonitor":false,"arcFlashPpe":false,"weldingJacket":false,"weldingShield":false,"weldingGloves":false,"purgingVentilation":false,"other":false,"otherDescription":""},"index":121}],"message":"Safe work requests retrieved successfully","timestamp":[2026,2,9,23,16,30,913795800]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/safe-works/get-all-safe-work","rt":"json"},"2357121760":{"b":{"responseData":{"id":1000008169,"deleted":false,"isVerified":false,"name":"Safe Work Main","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,29,26,479033000],"dateModified":[2025,10,25,4,41,14,102497000],"modifiedBy":null,"formContainers":[{"id":1000008186,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,15,55,626172000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"text","pageNumber":1,"locked":false,"content":"Time Issued:","position":{"x":99,"y":86},"size":{"width":100,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"14","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008187,"deleted":false,"isVerified":false,"name":"Time (input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,15,55,633470000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"time","type":"time","label":"","options":[],"initialValue":null},"position":{"x":99,"y":102},"size":{"width":100,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"15","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":11}},{"id":1000008184,"deleted":false,"isVerified":false,"name":"Spacer","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,59,17,370629000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":381},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c6c6","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"13"},"contentStyle":{}},{"id":1000008185,"deleted":false,"isVerified":false,"name":"Location","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,59,51,219301000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Specific Location of Work:","position":{"x":0,"y":120},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"11","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008190,"deleted":false,"isVerified":false,"name":"Company/Person Performing Work","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,20,43,82526000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"text","pageNumber":1,"locked":false,"content":"Company/Person Performing Work","position":{"x":198,"y":86},"size":{"width":443,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"18","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008191,"deleted":false,"isVerified":false,"name":"Company/Person Performing Work(data)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,20,43,82526000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"companyPerson","type":"text","label":"","options":[],"initialValue":null},"position":{"x":198,"y":102},"size":{"width":443,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"19","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":11}},{"id":1000008188,"deleted":false,"isVerified":false,"name":"Permit Number","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,17,52,294993000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"text","pageNumber":1,"locked":false,"content":"Permit Num","position":{"x":639,"y":86},"size":{"width":100,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"16","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008189,"deleted":false,"isVerified":false,"name":"Permit Number(data)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,21,17,52,294993000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"variable","pageNumber":1,"locked":false,"content":"id","position":{"x":639,"y":102},"size":{"width":100,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"17","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":11}},{"id":1000008178,"deleted":false,"isVerified":false,"name":"IDENTIFY SAFETY HAZARDS","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,46,55,808787000],"dateModified":[2025,9,22,0,37,50,731769000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"IDENTIFY SAFETY HAZARDS","position":{"x":0,"y":168},"size":{"width":739,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"7","fontWeight":"bold","justifyContent":"center","alignItems":"center","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000009202,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,149912000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":829},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"217"},"contentStyle":{}},{"id":1000009203,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,150920000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":845},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"218"},"contentStyle":{}},{"id":1000009200,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,149912000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":909},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"215"},"contentStyle":{}},{"id":1000008177,"deleted":false,"isVerified":false,"name":"Hazard Checkboxes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,45,15,879746000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":185},"size":{"width":739,"height":198},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"6"},"contentStyle":{}},{"id":1000009201,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,149912000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":813},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"216"},"contentStyle":{}},{"id":1000008182,"deleted":false,"isVerified":false,"name":"Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,54,5,968523000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"text","pageNumber":1,"locked":false,"content":"Date Issued:","position":{"x":0,"y":86},"size":{"width":100,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"0px","borderLeftWidth":"1px","zIndex":"8","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000009206,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,150920000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":893},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"221"},"contentStyle":{}},{"id":1000008183,"deleted":false,"isVerified":false,"name":"Date (input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,55,32,923116000],"dateModified":[2025,10,25,22,51,13,756928000],"modifiedBy":null,"groupId":"group-1758424831996","contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"date","label":"","options":[],"initialValue":null},"position":{"x":0,"y":102},"size":{"width":100,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"10","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":11}},{"id":1000009204,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,150920000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":861},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"219"},"contentStyle":{}},{"id":1000008181,"deleted":false,"isVerified":false,"name":"Permit Checkboxes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,20,50,25,3952000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":414},"size":{"width":739,"height":90},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"9","fontWeight":"bold","justifyContent":"center","alignItems":"center","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000009205,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,150920000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":877},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"220"},"contentStyle":{}},{"id":1000008170,"deleted":false,"isVerified":false,"name":"Border","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,29,53,344671000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":43},"size":{"width":739,"height":930},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"1"},"contentStyle":{}},{"id":1000009194,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,43,401343000],"dateModified":[2025,9,26,1,42,54,946166000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":829},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"209"},"contentStyle":{}},{"id":1000009195,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,43,868881000],"dateModified":[2025,9,26,1,42,54,946166000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":845},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"210"},"contentStyle":{}},{"id":1000009192,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,41,49,727155000],"dateModified":[2025,9,26,1,42,25,28755000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":909},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"207"},"contentStyle":{}},{"id":1000009193,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,42,959745000],"dateModified":[2025,9,26,1,42,54,946166000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":813},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"208"},"contentStyle":{}},{"id":1000008174,"deleted":false,"isVerified":false,"name":"Spacer","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,53,8,620932000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":0,"y":152},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#cac9c9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"4"},"contentStyle":{}},{"id":1000009198,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,45,388692000],"dateModified":[2025,9,26,1,42,54,947165000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":893},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"213"},"contentStyle":{}},{"id":1000008175,"deleted":false,"isVerified":false,"name":"REQUIRED PERMITS/TEST/ACTIONS","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,53,46,245993000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"REQUIRED PERMITS/TEST/ACTIONS","position":{"x":0,"y":397},"size":{"width":739,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"5","fontWeight":"bold","justifyContent":"center","alignItems":"center","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000009199,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,43,3,148920000],"dateModified":[2025,9,26,1,44,3,447705000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":700,"y":797},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"214"},"contentStyle":{}},{"id":1000008172,"deleted":false,"isVerified":false,"name":"Spacer","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,49,5,572595000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":0,"y":70},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c6c3c3","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"2"},"contentStyle":{}},{"id":1000009196,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,44,398165000],"dateModified":[2025,9,26,1,42,54,946166000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":861},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"211"},"contentStyle":{}},{"id":1000008173,"deleted":false,"isVerified":false,"name":"Date/Company/Number - container","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,18,52,9,482741000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":0,"y":86},"size":{"width":739,"height":36},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"3","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{}},{"id":1000009197,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,42,44,893565000],"dateModified":[2025,9,26,1,42,54,947165000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":877},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"212"},"contentStyle":{}},{"id":1000009190,"deleted":false,"isVerified":false,"name":"completion checkbox","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,40,51,165958000],"dateModified":[2025,9,26,1,42,9,209878000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":636,"y":797},"size":{"width":13,"height":13},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"206"},"contentStyle":{}},{"id":1000008346,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,22,231938000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":795},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"121","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008344,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,22,231938000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":795},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"116","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008350,"deleted":false,"isVerified":false,"name":"Weather Hazards","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,34,345438000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Weather Hazards_______________","position":{"x":523,"y":287},"size":{"width":210,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"119","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008348,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,34,345438000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":811},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"118","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008349,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,34,345438000],"dateModified":[2025,9,22,0,38,33,581142000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.weatherHazards","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":286},"size":{"width":20,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"183","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008338,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,42,537060000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":907},"size":{"width":739,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"114","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008336,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,26,227637000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":875},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"112","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008337,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,26,603530000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":891},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"113","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008342,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,30,20,915640000],"dateModified":[2025,9,21,23,39,3,749984000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":907},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"117","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008340,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,30,16,515792000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":907},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"115","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008331,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,26,46,874761000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":795},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"102","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008328,"deleted":false,"isVerified":false,"name":"Work Authorization text","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,20,19,147420000],"dateModified":[2025,9,22,1,27,57,689846000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Plant Manager (as Required) \\n\\nX________________________________","position":{"x":365.5,"y":709},"size":{"width":184.75,"height":54},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"110","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":11,"whiteSpace":"pre-wrap"}},{"id":1000008329,"deleted":false,"isVerified":false,"name":"Work Authorization text","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,20,19,925266000],"dateModified":[2025,10,25,22,51,42,110428000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Requestor \\n\\nX________________________________","position":{"x":548.25,"y":709},"size":{"width":191,"height":54},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"111","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":11,"whiteSpace":"pre-wrap"}},{"id":1000008334,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,25,313226000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":843},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"108","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008335,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,25,773707000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":859},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"109","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008332,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,24,459009000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":811},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"104","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008333,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,27,24,863560000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":827},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"106","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008323,"deleted":false,"isVerified":false,"name":"Scope of Work (input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,2,6,16,226076000],"dateModified":[2025,10,25,22,54,46,652286000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"workScope","type":"textarea","label":"","options":[],"initialValue":null},"position":{"x":203.5,"y":138},"size":{"width":531,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"101","justifyContent":"flex-start","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008320,"deleted":false,"isVerified":false,"name":"Safety Manual Procedure - 17","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,57,9,463634000],"dateModified":[2025,10,25,22,51,46,549554000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Safety Manual Procedure - 17","position":{"x":239,"y":0},"size":{"width":500,"height":36},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"99","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":18}},{"id":1000008321,"deleted":false,"isVerified":false,"name":"NAES","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,59,59,108810000],"dateModified":[2025,10,25,22,53,29,585382000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"NAES","position":{"x":0,"y":0},"size":{"width":240,"height":72},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"100","fontWeight":"bold","fontStyle":"italic","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":24}},{"id":1000008327,"deleted":false,"isVerified":false,"name":"Work Authority","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,20,14,403800000],"dateModified":[2025,9,22,1,27,24,231938000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Work Authority\\n\\nX________________________________","position":{"x":182.75,"y":709},"size":{"width":184.75,"height":54},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"107","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":11,"whiteSpace":"pre-wrap"}},{"id":1000008324,"deleted":false,"isVerified":false,"name":"Location (input)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,2,9,17,50095000],"dateModified":[2025,10,25,22,53,17,24447000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"location","type":"textarea","label":"","options":[],"initialValue":null},"position":{"x":145.5,"y":121},"size":{"width":588,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"103","justifyContent":"flex-start","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008325,"deleted":false,"isVerified":false,"name":"Work Authorization text","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,15,9,104900000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"The work scope has been reviewed, pre-job briefing held, and the work may proceed","position":{"x":0,"y":709},"size":{"width":184.75,"height":54},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"105","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":11}},{"id":1000008376,"deleted":false,"isVerified":false,"name":"Work Completed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,44,4,761459000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"Work Completed","position":{"x":623,"y":762},"size":{"width":116,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"134","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":13}},{"id":1000008382,"deleted":false,"isVerified":false,"name":"High Pressure (>100 psi)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,57,13,781262000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other______________________","position":{"x":523,"y":303},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"138","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008383,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,57,13,781262000],"dateModified":[2025,9,22,0,37,28,423045000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.other","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":302},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"182","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008380,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,54,44,126089000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":811},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"137","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008370,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,36,1,433619000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":891},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"135","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008371,"deleted":false,"isVerified":false,"name":"Sign On Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,36,41,912804000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Sign On Date","position":{"x":375,"y":762},"size":{"width":63,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"129","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12}},{"id":1000008368,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,36,1,433619000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":891},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"127","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008374,"deleted":false,"isVerified":false,"name":"Sign Off Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,41,32,955587000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Sign Off Date","position":{"x":499,"y":762},"size":{"width":63,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"132","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12}},{"id":1000008375,"deleted":false,"isVerified":false,"name":"Sign Off Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,41,33,402594000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Sign Off Time","position":{"x":561,"y":762},"size":{"width":63,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"133","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12}},{"id":1000008372,"deleted":false,"isVerified":false,"name":"Company","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,39,23,785370000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Company","position":{"x":260,"y":762},"size":{"width":116,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"136","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":13}},{"id":1000008373,"deleted":false,"isVerified":false,"name":"Sign On Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,41,32,646122000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"Sign On Time","position":{"x":437,"y":762},"size":{"width":63,"height":162},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"131","fontWeight":"bold","fontStyle":"normal","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12}},{"id":1000008362,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,50,944626000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":859},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"128","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008360,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,50,944626000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":859},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"123","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008366,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,55,768058000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":875},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"130","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008364,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,55,768058000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":875},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"125","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008354,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,41,75072000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":827},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"124","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008352,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,41,75072000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":827},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"120","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008358,"deleted":false,"isVerified":false,"name":"No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,46,763123000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"No","position":{"x":708,"y":843},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"126","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008356,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,35,46,763123000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes","position":{"x":647,"y":843},"size":{"width":31,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","padding":"5px","zIndex":"122","fontWeight":"normal","fontStyle":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008410,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,44,23,97979000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.heatColdStress","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":236},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"181","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008411,"deleted":false,"isVerified":false,"name":"Elevated Work Surface","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Elevated Work Surface","position":{"x":523,"y":252},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"193","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008408,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,44,17,767369000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.handTraps","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":219},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"180","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008409,"deleted":false,"isVerified":false,"name":"Heat/Cold Stress","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Heat/Cold Stress","position":{"x":523,"y":236},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"192","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008414,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,45,35,516867000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.environmental","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":269},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"179","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008415,"deleted":false,"isVerified":false,"name":"Slick Foot Surface","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,90210000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Slick Foot Surface","position":{"x":274,"y":287},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"195","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008412,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,44,40,536518000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.elevatedSurface","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":252},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"178","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008413,"deleted":false,"isVerified":false,"name":"Environmental Concern","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,22,851736000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Environmental Concern","position":{"x":523,"y":269},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"194","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008402,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,725508000],"dateModified":[2025,9,21,23,42,13,491889000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.energized","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":219},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"177","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008403,"deleted":false,"isVerified":false,"name":"Possible Chemical Exposure","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Possible Chemical Exposure","position":{"x":523,"y":186},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"189","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008400,"deleted":false,"isVerified":false,"name":"Energized Electrical","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,725508000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"*Energized Electrical","position":{"x":36,"y":219},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"187","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008401,"deleted":false,"isVerified":false,"name":"Note","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,725508000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"(Requires Energized Electrical Work Permit)","position":{"x":5,"y":238},"size":{"width":230,"height":31},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"188","fontWeight":"bold","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008406,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,44,7,850322000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.liftingHazard","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":202},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"176","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008407,"deleted":false,"isVerified":false,"name":"Hand Traps","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hand Traps","position":{"x":523,"y":219},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"191","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008404,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,44,9,418819000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.chemicalExposure","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":503,"y":186},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"175","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008405,"deleted":false,"isVerified":false,"name":"Lifting Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,8,10,180400000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Lifting Hazard","position":{"x":523,"y":202},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"190","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008394,"deleted":false,"isVerified":false,"name":"Ergonomic Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,5,17,525806000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ergonomic Hazard","position":{"x":30,"y":320},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"174","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008395,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,5,17,525806000],"dateModified":[2025,9,21,23,42,20,278323000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.ergonomicHazard","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":320},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"173","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008392,"deleted":false,"isVerified":false,"name":"Note","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"*REQUIRES PLANT MANAGER APPROVAL","position":{"x":2,"y":342},"size":{"width":230,"height":34},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"159","fontWeight":"bold","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008393,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,42,18,334042000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.egressAccess","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":303},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"172","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008398,"deleted":false,"isVerified":false,"name":"High Pressure (>100 psi)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,724035000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"*High Pressure (>100 psi)","position":{"x":36,"y":202},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"186","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008399,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,724035000],"dateModified":[2025,9,21,23,42,11,322124000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.highPressure","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":202},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"171","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008396,"deleted":false,"isVerified":false,"name":"High Temperature (>140F)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,724035000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"*High Temperature (>140F)","position":{"x":36,"y":186},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"185","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008397,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,7,47,724035000],"dateModified":[2025,9,21,23,42,8,913935000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.highTemp","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":186},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"184","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008386,"deleted":false,"isVerified":false,"name":"Lighting/Visibility Restrictions","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,0,42,158020000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Lighting/Visibility Restrictions","position":{"x":274,"y":320},"size":{"width":180,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"139","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008387,"deleted":false,"isVerified":false,"name":"Stored Energy","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Stored Energy","position":{"x":30,"y":270},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"140","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008385,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,3,59,10,715675000],"dateModified":[2025,9,21,23,43,48,409105000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.lightingRestrictions","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":319},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"170","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008390,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,42,16,639366000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.eyeHazard","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":287},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"169","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008391,"deleted":false,"isVerified":false,"name":"Egress & Access Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Egress & Access Hazard","position":{"x":30,"y":303},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"158","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008388,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,42,15,81113000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.storedEnergy","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":16,"y":270},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"168","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008389,"deleted":false,"isVerified":false,"name":"Eye Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,2,36,15440000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Eye Hazard","position":{"x":30,"y":287},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"141","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008440,"deleted":false,"isVerified":false,"name":"Haz Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,1,23,33,852112000],"dateModified":[2025,9,26,1,39,11,592103000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.otherDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":558,"y":304},"size":{"width":179,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"204","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008441,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,1,28,36,555543000],"dateModified":[2025,9,26,1,39,28,528976000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.otherDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":649,"y":614},"size":{"width":88,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"205","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008439,"deleted":false,"isVerified":false,"name":"Weather Hazards","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,1,21,14,905329000],"dateModified":[2025,9,26,1,39,7,215729000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.weatherHazardDescription","type":"text","label":"","options":[],"initialValue":null},"position":{"x":621,"y":286},"size":{"width":115,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"203","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008426,"deleted":false,"isVerified":false,"name":"Falling Object Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Falling Object Hazard","position":{"x":274,"y":186},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"200","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008427,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,42,40,693861000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.highNoise","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":202},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"167","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008424,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,43,6,76966000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.fireHazard","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":252},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"166","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008425,"deleted":false,"isVerified":false,"name":"Hot Surface","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hot Surface","position":{"x":274,"y":269},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"199","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008430,"deleted":false,"isVerified":false,"name":"High Noise","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"High Noise","position":{"x":274,"y":202},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"202","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008428,"deleted":false,"isVerified":false,"name":"Dust/Particulate","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Dust/Particulate","position":{"x":274,"y":219},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"201","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008429,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,42,30,618217000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.fallingObject","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":186},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"165","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008418,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,43,38,165294000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.ventilationRequired","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":302},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"164","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008419,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,42,56,397128000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.combustibleDust","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":236},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"163","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008416,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,43,29,932650000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.slippery","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":286},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"162","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008417,"deleted":false,"isVerified":false,"name":"Ventilation Req'd (Meck/Natural)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ventilation Req'd (Meck/Natural)","position":{"x":274,"y":303},"size":{"width":189,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"196","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008422,"deleted":false,"isVerified":false,"name":"Combustible Dust","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Combustible Dust","position":{"x":274,"y":236},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"198","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008423,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,43,16,767173000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.hotSurface","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":269},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"161","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008420,"deleted":false,"isVerified":false,"name":"Fire/Explosion Hazard","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire/Explosion Hazard","position":{"x":274,"y":252},"size":{"width":163,"height":17},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"197","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008421,"deleted":false,"isVerified":false,"name":"Yes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,4,9,1,91208000],"dateModified":[2025,9,21,23,42,48,95284000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"hazards.dustParticulate","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":254,"y":219},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"160","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008203,"deleted":false,"isVerified":false,"name":"Sign On Header","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,24,54,844646000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"Sign and Print Name","position":{"x":0,"y":761},"size":{"width":739,"height":36},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"22","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008200,"deleted":false,"isVerified":false,"name":"PROTECTIVE EQUIPMENT REQUIRED","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,15,41,168346000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"PROTECTIVE EQUIPMENT REQUIRED","position":{"x":0,"y":518},"size":{"width":739,"height":19},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"21","fontWeight":"bold","justifyContent":"center","alignItems":"center","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008201,"deleted":false,"isVerified":false,"name":"Special Instructions:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,17,56,480700000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"Special Instructions:","position":{"x":0,"y":639},"size":{"width":739,"height":72},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"23","fontWeight":"bold","justifyContent":"flex-start","alignItems":"flex-start","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008205,"deleted":false,"isVerified":false,"name":"SW Released","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,27,21,948654000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":"Safe Work Permit Released. Work Authority: ________________________________","position":{"x":0,"y":944},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"1px","borderBottomWidth":"0px","borderLeftWidth":"1px","padding":"5px","zIndex":"24","fontWeight":"bold","justifyContent":"flex-start","alignItems":"center","fontSize":8},"contentStyle":{"fontSize":14}},{"id":1000008198,"deleted":false,"isVerified":false,"name":"Spacer","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,15,41,167348000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":0,"y":502},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#b8b7b7","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"20"},"contentStyle":{}},{"id":1000008197,"deleted":false,"isVerified":false,"name":"Scope Of Work","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,2,47,784403000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Description of Work to be Performed:","position":{"x":0,"y":136},"size":{"width":739,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"12","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000008250,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other____________","position":{"x":619,"y":618},"size":{"width":115,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"96","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008251,"deleted":false,"isVerified":false,"name":"Welding Jacket","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Welding Jacket","position":{"x":619,"y":552},"size":{"width":115,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"95","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008248,"deleted":false,"isVerified":false,"name":"Welding Gloves","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Welding Gloves","position":{"x":619,"y":584},"size":{"width":115,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"94","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008249,"deleted":false,"isVerified":false,"name":"Welding Shield?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.weldingShield","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":567,"y":568},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"72","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008254,"deleted":false,"isVerified":false,"name":"Ice Cleats?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,26,1,39,48,570303000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.other","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":567,"y":617},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"71","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008255,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":567,"y":536},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"41","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008252,"deleted":false,"isVerified":false,"name":"Welding Shield","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Welding Shield","position":{"x":619,"y":568},"size":{"width":115,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"93","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008253,"deleted":false,"isVerified":false,"name":"Welding Jacket?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,165363000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.weldingJacket","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":567,"y":552},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"70","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008242,"deleted":false,"isVerified":false,"name":"Other","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,16,12,153761000],"dateModified":[2025,9,26,1,39,12,484122000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Other","position":{"x":588,"y":462},"size":{"width":130,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"33","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008243,"deleted":false,"isVerified":false,"name":"Venting/Purging Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,16,27,165298000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"______________","position":{"x":214,"y":478},"size":{"width":101,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"34","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008240,"deleted":false,"isVerified":false,"name":"Energized Electrical Work?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,15,17,589203000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.energizedPermit","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":536,"y":446},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"69","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008241,"deleted":false,"isVerified":false,"name":"LOTO Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,15,51,522494000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"______________________","position":{"x":159,"y":430},"size":{"width":156,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"27","justifyContent":"center","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008246,"deleted":false,"isVerified":false,"name":"Hot Work Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,57,56,624453000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"___________________","position":{"x":184,"y":462},"size":{"width":130,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"30","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008244,"deleted":false,"isVerified":false,"name":"LOTO Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,55,26,968857000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Excavation Permit","position":{"x":588,"y":430},"size":{"width":107,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"28","justifyContent":"center","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008245,"deleted":false,"isVerified":false,"name":"Energized Electrical Work","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,57,12,683252000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Energized Electrical Work","position":{"x":588,"y":446},"size":{"width":148,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"29","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008235,"deleted":false,"isVerified":false,"name":"Excavation Permit?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,20,22,44,36,407800000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.excavationPermit","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":536,"y":430},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"68","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008239,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,9,20,355983000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":536,"y":414},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"40","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008236,"deleted":false,"isVerified":false,"name":"Confined Space #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,5,13,374489000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"_______________________","position":{"x":164,"y":446},"size":{"width":149,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"26","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008237,"deleted":false,"isVerified":false,"name":"Hot Work Required?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,0,5,24,281654000],"dateModified":[2025,9,26,1,39,15,320308000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.other","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":536,"y":462},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"67","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008282,"deleted":false,"isVerified":false,"name":"Fall Protection","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,319316000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fall Protection","position":{"x":56,"y":618},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"92","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008283,"deleted":false,"isVerified":false,"name":"Hardhat","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hardhat","position":{"x":56,"y":552},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"91","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"normal"}},{"id":1000008280,"deleted":false,"isVerified":false,"name":"Purging/Ventilation","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,49,520384000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Purging/Ventilation","position":{"x":619,"y":600},"size":{"width":115,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"90","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008281,"deleted":false,"isVerified":false,"name":"Purging/Ventilation?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,49,520384000],"dateModified":[2025,9,21,23,39,3,750988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.purgingVentilation","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":567,"y":600},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"66","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008286,"deleted":false,"isVerified":false,"name":"Fall Protection?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.fallProtection","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":617},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"62","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008287,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":11,"y":536},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"35","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008284,"deleted":false,"isVerified":false,"name":"Hearing Protection #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hearing Protection","position":{"x":56,"y":584},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"89","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008285,"deleted":false,"isVerified":false,"name":"Safety Glasses?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.safetyGlasses","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":568},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"61","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008274,"deleted":false,"isVerified":false,"name":"Confined Space?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.confinedSpace","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":446},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"73","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008275,"deleted":false,"isVerified":false,"name":"Venting/Purging Required?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.ventingPurging","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":478},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"47","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008272,"deleted":false,"isVerified":false,"name":"LOTO Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,629815000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"LOTO Required #","position":{"x":56,"y":430},"size":{"width":105,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"46","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008273,"deleted":false,"isVerified":false,"name":"Hot Work Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,629815000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hot Work Required #","position":{"x":56,"y":462},"size":{"width":130,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"48","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008278,"deleted":false,"isVerified":false,"name":"LOTO Required?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.lotoRequired","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":430},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"60","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008279,"deleted":false,"isVerified":false,"name":"Hot Work Required?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.hotWork","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":462},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"75","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008276,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":4,"y":414},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"39","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008277,"deleted":false,"isVerified":false,"name":"Confined Space #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,630812000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Confined Space #","position":{"x":56,"y":446},"size":{"width":110,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"64","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008264,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,2,37,63953000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":335,"y":414},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"38","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008271,"deleted":false,"isVerified":false,"name":"Venting/Purging Required #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,12,27,629815000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Venting/Purging Required #","position":{"x":56,"y":478},"size":{"width":160,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"63","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008258,"deleted":false,"isVerified":false,"name":"Gas Testing?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,2,37,61917000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.gasTesting","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":335,"y":446},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"44","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008256,"deleted":false,"isVerified":false,"name":"Welding Gloves?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,1,48,166356000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.weldingGloves","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":567,"y":584},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"65","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008262,"deleted":false,"isVerified":false,"name":"JHA?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,2,37,63953000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"permits.jha","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":335,"y":430},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"42","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008260,"deleted":false,"isVerified":false,"name":"JHA","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,2,37,61917000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"JHA","position":{"x":387,"y":430},"size":{"width":105,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"45","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal"},"contentStyle":{"fontSize":12}},{"id":1000008261,"deleted":false,"isVerified":false,"name":"Gas Testing Required","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,2,37,63953000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Gas Testing Required","position":{"x":387,"y":446},"size":{"width":126,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"43","justifyContent":"flex-start","alignItems":"center","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008314,"deleted":false,"isVerified":false,"name":"Face Shield/Goggles?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.faceShield","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":383,"y":584},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"59","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008315,"deleted":false,"isVerified":false,"name":"Divider","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,38,23,924014000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":244.35,"y":186},"size":{"width":246.3,"height":196},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"98"},"contentStyle":{}},{"id":1000008312,"deleted":false,"isVerified":false,"name":"Gas Monitor","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Gas Monitor","position":{"x":435,"y":601},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"88","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008313,"deleted":false,"isVerified":false,"name":"Gas Monitor?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.gasMonitor","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":383,"y":600},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"58","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008318,"deleted":false,"isVerified":false,"name":"Divider","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,51,46,899379000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":187,"y":536},"size":{"width":191,"height":104},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"25","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008319,"deleted":false,"isVerified":false,"name":"Safe Work Permit - Jackson Generation","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,54,25,847782000],"dateModified":[2025,10,25,22,53,31,757724000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Safe Work Permit - Jackson Generation","position":{"x":239,"y":35},"size":{"width":500,"height":36},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","padding":"5px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"97","fontWeight":"normal","fontStyle":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":18}},{"id":1000008316,"deleted":false,"isVerified":false,"name":"Divider","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,43,27,588909000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":564,"y":536},"size":{"width":175,"height":104},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"32"},"contentStyle":{}},{"id":1000008317,"deleted":false,"isVerified":false,"name":"Divider","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,50,21,355466000],"dateModified":[2025,9,21,23,41,24,392289000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":327,"y":414},"size":{"width":202,"height":89},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","padding":"5px","zIndex":"31"},"contentStyle":{}},{"id":1000008306,"deleted":false,"isVerified":false,"name":"Face Shield/Goggles","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Face Shield/Goggles","position":{"x":435,"y":586},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"87","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008307,"deleted":false,"isVerified":false,"name":"Barricade/Rope Off?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.barricade","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":383,"y":568},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"57","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008304,"deleted":false,"isVerified":false,"name":"Arc Flash PPE","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Arc Flash PPE","position":{"x":435,"y":618},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"86","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008305,"deleted":false,"isVerified":false,"name":"Acid Suit/Rainsuit","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Acid Suit/Rainsuit","position":{"x":435,"y":550},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"85","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008310,"deleted":false,"isVerified":false,"name":"Barricade/Rope Off","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Barricade/Rope Off","position":{"x":435,"y":567},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"84","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008311,"deleted":false,"isVerified":false,"name":"Acid Suit/Rainsuit?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.acidSuit","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":383,"y":552},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"56","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008308,"deleted":false,"isVerified":false,"name":"Arc Flash PPE?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.arcFlashPpe","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":383,"y":617},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"76","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008309,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,51,191481000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":383,"y":536},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"37","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008298,"deleted":false,"isVerified":false,"name":"Yes/No","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Yes    No","position":{"x":192,"y":536},"size":{"width":42,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"36","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008299,"deleted":false,"isVerified":false,"name":"Respirator","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,287598000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Respirator","position":{"x":244,"y":568},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"83","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008296,"deleted":false,"isVerified":false,"name":"Respirator?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.respirator","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":192,"y":569},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"55","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008297,"deleted":false,"isVerified":false,"name":"Ice Cleats?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.iceCleats","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":192,"y":618},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"74","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008302,"deleted":false,"isVerified":false,"name":"Protective Gloves?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,287598000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.gloves","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":192,"y":601},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"54","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008303,"deleted":false,"isVerified":false,"name":"Dust Mask?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,287598000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.dustMask","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":192,"y":585},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"53","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008300,"deleted":false,"isVerified":false,"name":"GFI?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,287598000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.gfi","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":192,"y":553},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"52","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008301,"deleted":false,"isVerified":false,"name":"Protective Gloves","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,287598000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Protective Gloves","position":{"x":244,"y":600},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"82","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008290,"deleted":false,"isVerified":false,"name":"Protective Footwear","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Protective Footwear","position":{"x":56,"y":600},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"81","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008291,"deleted":false,"isVerified":false,"name":"Protective Footwear?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.boots","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":600},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"51","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008288,"deleted":false,"isVerified":false,"name":"Safety Glasses","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Safety Glasses","position":{"x":56,"y":568},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"80","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008289,"deleted":false,"isVerified":false,"name":"Hardhat?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.hardhat","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":552},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"50","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008294,"deleted":false,"isVerified":false,"name":"GFI","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"GFI","position":{"x":244,"y":552},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"79","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008295,"deleted":false,"isVerified":false,"name":"Dust Mask","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Dust Mask","position":{"x":244,"y":584},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"78","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}},{"id":1000008292,"deleted":false,"isVerified":false,"name":"Hearing Protection?","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,18,30,320319000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"ppe.hearingProtection","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":11,"y":584},"size":{"width":41,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"49","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{}},{"id":1000008293,"deleted":false,"isVerified":false,"name":"Ice Cleats","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,21,1,24,10,286600000],"dateModified":[2025,9,21,23,39,3,751988000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ice Cleats","position":{"x":244,"y":618},"size":{"width":122,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","padding":"5px","zIndex":"77","justifyContent":"flex-start","alignItems":"flex-start","fontWeight":"normal","fontStyle":"normal","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12}}],"size":{"width":7.7,"height":10.15},"formType":"SafeWork","isPrimary":true},"message":"Primary form found.","timestamp":[2026,2,9,23,16,24,858103400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/forms/get-primary-form-by-type/SafeWork","rt":"json"},"2647878024":{"b":{"responseData":[{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"OPEN"},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"CLOSED"},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":6000011550,"name":"Throttled","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"THRTL"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,24,288405900]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/isoPos","rt":"json"},"2937771502":{"b":{"responseData":[{"id":6000011552,"name":"Control Room","category":{"id":2702,"name":"Location","alias":"location"},"alias":"CR"},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":"SY"},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,24,86579900]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/location","rt":"json"},"3998057701":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},{"id":4000010604,"name":"Comment Type","alias":"commentType"},{"id":6000011532,"name":"Unit","alias":"unit"},{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},{"id":6000011539,"name":"Group","alias":"group"},{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},{"id":6000011553,"name":"Processing Status","alias":"processingStatus"}],"message":"All categories retrieved successfully","timestamp":[2026,2,9,23,16,24,785740000]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/categories","rt":"json"},"4280908195":{"b":{"responseData":[{"id":6000011537,"name":"No","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"NO"},{"id":6000011538,"name":"Yes","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"YES"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,24,259140700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/zeroEnergyTemplate","rt":"json"},"__nghData__":[{},{"c":{"1":[],"4":[],"5":[],"6":[]},"n":{"3":"2f"},"t":{"4":"t2","5":"t3","6":"t4"}},{"n":{"2":"hfn2"}},{"t":{"0":"t6"},"c":{"0":[]}},{"t":{"0":"t5"},"c":{"0":[{"i":"t5","r":3,"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]}]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]}},{"n":{"1":"0fn","2":"1f"},"c":{"0":[]},"d":[5,6,7,8,9,11,12,13,14,15,16,17]},{"t":{"1":"t7","2":"t8"},"c":{"1":[{"i":"t7","r":1}],"2":[]}},{"t":{"1":"t11","2":"t13","3":"t14"},"c":{"1":[{"i":"t11","r":1,"c":{"1":[],"4":[]},"n":{"3":"2f"},"t":{"4":"t12"}}],"2":[],"3":[]}},{"t":{"3":"t0","4":"t1","13":"t9","18":"t10"},"c":{"3":[],"4":[{"i":"t1","r":1}],"13":[],"18":[]}},{"t":{"1":"t15","2":"t18","3":"t19"},"c":{"1":[{"i":"t15","r":1,"t":{"6":"t16","7":"t17"},"c":{"6":[{"i":"t16","r":1,"x":6}],"7":[{"i":"t17","r":1,"t":{"2":"t32"},"c":{"2":[{"i":"t32","r":1,"x":7}]}}]}}],"2":[],"3":[]}},{"t":{"1":"t68"},"c":{"1":[{"i":"t68","r":1,"t":{"3":"t69"},"c":{"3":[]}}]}},{"t":{"0":"t55","1":"t72","2":"t73"},"c":{"0":[{"i":"t55","r":3,"t":{"0":"t56","3":"t57","7":"t71"},"c":{"0":[{"i":"t56","r":1}],"3":[{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]},"x":7}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":23},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":5},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}}]}},{"i":"t57","r":1,"t":{"1":"t58","3":"t59"},"c":{"1":[{"i":"t58","r":1}],"3":[{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[{"i":"t62","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":20},{"i":"t59","r":1,"t":{"1":"t60","2":"t61","3":"t62","4":"t63","5":"t64","6":"t65","7":"t66","8":"t67","9":"t70"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t67","r":1}],"9":[]}}]}}],"7":[{"i":"t71","r":1}]}}],"1":[],"2":[]}},{"t":{"1":"t54","2":"t74"},"c":{"1":[{"i":"t54","r":1}],"2":[]}},{"t":{"0":"t52","1":"t53"},"c":{"0":[],"1":[{"i":"t53","r":1}]}},{"n":{"1":"0f4n3","5":"0f2nfnf2"},"d":[3,4],"e":{"1":1,"5":3},"c":{"6":[{"i":"c1878096574","r":1}]}},{"t":{"0":"t23"},"c":{"0":[]}},{"t":{"0":"t24"},"c":{"0":[]}},{"t":{"0":"t25"},"c":{"0":[]}},{"t":{"0":"t26"},"c":{"0":[]}},{"t":{"0":"t27"},"c":{"0":[]}},{"t":{"0":"t28"},"c":{"0":[]}},{"t":{"0":"t29"},"c":{"0":[]}},{"t":{"0":"t30"},"c":{"0":[]}},{"t":{"0":"t31"},"c":{"0":[]}},{"d":[1]},{"c":{"0":[{"i":"c874109360","r":1}]}}]}</script></body></html>`;