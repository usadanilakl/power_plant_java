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

.print-container[_ngcontent-ng-c4068922724] {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}
/*# sourceMappingURL=/print.component.css.map */</style></head>
<body class="mat-typography"><!--nghm-->
  <app-root ng-version="19.2.5" ngh="11" ng-server-context="ssg"><router-outlet></router-outlet><app-print _nghost-ng-c4068922724="" ngh="0"><p _ngcontent-ng-c4068922724="">print works!</p></app-print><!--container--><app-print-layout ngh="1"><!--container--></app-print-layout><app-global-message _nghost-ng-c4038518790="" ngh="2"><!--container--></app-global-message><app-global-context-menu ngh="3"><!--container--></app-global-context-menu><app-qr-scanner _nghost-ng-c3289982237="" ngh="4"><!--container--></app-qr-scanner><app-brady-printer-manager _nghost-ng-c3185598614="" ngh="5"><!--container--></app-brady-printer-manager><app-engraver-manager _nghost-ng-c585854076="" ngh="6"><!--container--></app-engraver-manager><app-wizard-dialog _nghost-ng-c2307177025="" ngh="7"><!--container--></app-wizard-dialog><app-comments-dialog _nghost-ng-c1372848867="" ngh="8"><!--container--></app-comments-dialog><app-qa-dialog _nghost-ng-c1416530472="" ngh="10"><app-popup-projection _ngcontent-ng-c1416530472="" size="medium" _nghost-ng-c4000021521="" ng-reflect-size="medium" ng-reflect-is-open="false" ng-reflect-title="Help Information" ngh="9"><!--container--></app-popup-projection></app-qa-dialog></app-root>
<link rel="modulepreload" href="chunk-ZGDGC5VH.js"><script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"592816468":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},{"id":4000010604,"name":"Comment Type","alias":"commentType"},{"id":6000011532,"name":"Unit","alias":"unit"},{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},{"id":6000011539,"name":"Group","alias":"group"},{"id":6000011544,"name":"Equipment Name","alias":"equipmentName"},{"id":6000011553,"name":"Processing Status","alias":"processingStatus"}],"message":"Categories retrieved successfully","timestamp":[2026,2,9,23,16,31,658586300]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/categories","rt":"json"},"820227935":{"b":{"responseData":[{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NC"},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":6000011551,"name":"Throttled","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"THRTL"},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"NO"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,31,664486500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/normPos","rt":"json"},"1756457535":{"b":{"responseData":[{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,31,669986100]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/eqType","rt":"json"},"2647878024":{"b":{"responseData":[{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"OPEN"},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"CLOSED"},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":6000011550,"name":"Throttled","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"THRTL"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,31,660604400]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/isoPos","rt":"json"},"2937771502":{"b":{"responseData":[{"id":6000011552,"name":"Control Room","category":{"id":2702,"name":"Location","alias":"location"},"alias":"CR"},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":"SY"},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,31,666827100]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/location","rt":"json"},"4280908195":{"b":{"responseData":[{"id":6000011537,"name":"No","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"NO"},{"id":6000011538,"name":"Yes","category":{"id":6000011536,"name":"Zero Energy Template","alias":"zeroEnergyTemplate"},"alias":"YES"}],"message":"Values retrieved successfully","timestamp":[2026,2,9,23,16,31,673993700]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/rf-values/category/zeroEnergyTemplate","rt":"json"},"__nghData__":[{},{"t":{"0":"t23"},"c":{"0":[]}},{"t":{"0":"t24"},"c":{"0":[]}},{"t":{"0":"t25"},"c":{"0":[]}},{"t":{"0":"t26"},"c":{"0":[]}},{"t":{"0":"t27"},"c":{"0":[]}},{"t":{"0":"t28"},"c":{"0":[]}},{"t":{"0":"t29"},"c":{"0":[]}},{"t":{"0":"t30"},"c":{"0":[]}},{"t":{"0":"t31"},"c":{"0":[]}},{"d":[1]},{"c":{"0":[{"i":"c4068922724","r":1}]}}]}</script></body></html>`;