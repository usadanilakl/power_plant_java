
class FloatingWindow {
    constructor(content, header, id = null) {
        this.content = content;
        this.header = header;
        this.id = id;
        this.element = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeDirection = '';
        this.initialRect = null;
        this.create();
    }

    create() {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'floating-window';
        this.element.id = this.id;

        // Create header
        const headerElement = document.createElement('div');
        headerElement.className = 'floating-window-header';
        headerElement.textContent = this.header;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'floating-window-close';
        closeButton.textContent = 'X';
        closeButton.onclick = () => this.close();

        headerElement.appendChild(closeButton);
        this.element.appendChild(headerElement);

        // Create content container
        const contentElement = document.createElement('div');
        contentElement.className = 'floating-window-content';
    
        if (this.content) {
            // Assuming this.content is a DOM element or a string representation of HTML
            if (typeof this.content === 'string') {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.content;
                while (tempDiv.firstChild) {
                    contentElement.appendChild(tempDiv.firstChild);
                }
            } else if (this.content instanceof Node) {
                contentElement.appendChild(this.content);
            }
        }
        this.element.appendChild(contentElement);

        // Add resize handles
        const directions = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
        directions.forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            this.element.appendChild(handle);
        });

        // Add event listeners
        headerElement.addEventListener('mousedown', this.startDragging.bind(this));
        this.element.addEventListener('mousedown', this.startResizing.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDragging.bind(this));

        // Append to body
        document.body.appendChild(this.element);

        // Listen for theme changes
        document.addEventListener('themeChanged', (e) => {
            this.updateTheme(e.detail.isDarkTheme);
        });
    }

    startDragging(e) {
        if (e.target.tagName.toLowerCase() !== 'button') {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.element.offsetLeft;
            this.dragOffset.y = e.clientY - this.element.offsetTop;
        }
    }

    startResizing(e) {
        if (e.target.classList.contains('resize-handle')) {
            this.isResizing = true;
            this.resizeDirection = e.target.className.split(' ')[1];
            this.initialRect = this.element.getBoundingClientRect();
            this.initialMouseX = e.clientX;
            this.initialMouseY = e.clientY;
        }
    }

    drag(e) {
        if (this.isDragging) {
            this.element.style.left = (e.clientX - this.dragOffset.x) + 'px';
            this.element.style.top = (e.clientY - this.dragOffset.y) + 'px';
        } else if (this.isResizing) {
            const deltaX = e.clientX - this.initialMouseX;
            const deltaY = e.clientY - this.initialMouseY;
            const minWidth = 200;
            const minHeight = 100;

            let newWidth = this.initialRect.width;
            let newHeight = this.initialRect.height;
            let newLeft = this.initialRect.left;
            let newTop = this.initialRect.top;

            if (this.resizeDirection.includes('e')) {
                newWidth = Math.max(minWidth, this.initialRect.width + deltaX);
            }
            if (this.resizeDirection.includes('s')) {
                newHeight = Math.max(minHeight, this.initialRect.height + deltaY);
            }
            if (this.resizeDirection.includes('w')) {
                newWidth = Math.max(minWidth, this.initialRect.width - deltaX);
                newLeft = this.initialRect.right - newWidth;
            }
            if (this.resizeDirection.includes('n')) {
                newHeight = Math.max(minHeight, this.initialRect.height - deltaY);
                newTop = this.initialRect.bottom - newHeight;
            }

            this.element.style.width = `${newWidth}px`;
            this.element.style.height = `${newHeight}px`;
            this.element.style.left = `${newLeft}px`;
            this.element.style.top = `${newTop}px`;
        }
    }

    stopDragging() {
        this.isDragging = false;
        this.isResizing = false;
    }

    close() {
        document.body.removeChild(this.element);
        // Emit a custom event
        const closeEvent = new CustomEvent('floatingWindowClosed', {
            detail: { windowId: this.id }
        });
        document.dispatchEvent(closeEvent);
    }

    updateTheme(isDarkTheme) {
        if (isDarkTheme) {
            this.element.classList.add('dark-theme');
        } else {
            this.element.classList.remove('dark-theme');
        }
    }
}
// class FloatingWindow {
//     constructor(content, header, id = null) {
//         this.content = content;
//         this.header = header;
//         this.id = id;
//         this.element = null;
//         this.isDragging = false;
//         this.isResizing = false;
//         this.dragOffset = { x: 0, y: 0 };
//         this.resizeDirection = '';
//         this.initialRect = null;
//         this.create();
//     }

//     create() {
//         // Create main container
//         this.element = document.createElement('div');
//         this.element.className = 'floating-window';
//         this.element.id = this.id;
//         this.element.style.position = 'absolute';
//         this.element.style.top = '50px';
//         this.element.style.left = '50px';
//         this.element.style.height = '85vh'; 
//         this.element.style.minWidth = '200px';
//         this.element.style.minHeight = '100px';
//         this.element.style.maxWidth = '85vw';
//         this.element.style.maxHeight = '85vh';
//         this.element.style.border = '1px solid #ccc';
//         this.element.style.backgroundColor = '#fff';
//         this.element.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
//         this.element.style.overflow = 'hidden';

//         // Create header
//         const headerElement = document.createElement('div');
//         headerElement.className = 'floating-window-header';
//         headerElement.style.padding = '5px';
//         headerElement.style.backgroundColor = '#f0f0f0';
//         headerElement.style.cursor = 'move';
//         headerElement.style.userSelect = 'none';
//         headerElement.textContent = this.header;

//         // Create close button
//         const closeButton = document.createElement('button');
//         closeButton.textContent = 'X';
//         closeButton.style.float = 'right';
//         closeButton.style.border = 'none';
//         closeButton.style.background = 'none';
//         closeButton.style.cursor = 'pointer';
//         closeButton.onclick = () => this.close();

//         headerElement.appendChild(closeButton);
//         this.element.appendChild(headerElement);

//         // Create content container
//         const contentElement = document.createElement('div');
//         contentElement.className = 'floating-window-content';
//         contentElement.style.padding = '10px';
//         contentElement.style.overflow = 'auto';
//         contentElement.style.height = 'calc(100% - 30px)';
//         contentElement.innerHTML = this.content? this.content : '';
//         this.element.appendChild(contentElement);

//         // Add resize handles
//         const directions = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
//         directions.forEach(dir => {
//             const handle = document.createElement('div');
//             handle.className = `resize-handle ${dir}`;
//             handle.style.position = 'absolute';
//             handle.style.width = handle.style.height = '10px';
//             handle.style.backgroundColor = 'transparent';
//             handle.style.cursor = `${dir}-resize`;
            
//             switch(dir) {
//                 case 'n': handle.style.top = '0'; handle.style.left = '0'; handle.style.right = '0'; break;
//                 case 'e': handle.style.top = '0'; handle.style.right = '0'; handle.style.bottom = '0'; break;
//                 case 's': handle.style.bottom = '0'; handle.style.left = '0'; handle.style.right = '0'; break;
//                 case 'w': handle.style.top = '0'; handle.style.left = '0'; handle.style.bottom = '0'; break;
//                 case 'ne': handle.style.top = '0'; handle.style.right = '0'; break;
//                 case 'se': handle.style.bottom = '0'; handle.style.right = '0'; break;
//                 case 'sw': handle.style.bottom = '0'; handle.style.left = '0'; break;
//                 case 'nw': handle.style.top = '0'; handle.style.left = '0'; break;
//             }
            
//             this.element.appendChild(handle);
//         });

//         // Add event listeners
//         headerElement.addEventListener('mousedown', this.startDragging.bind(this));
//         this.element.addEventListener('mousedown', this.startResizing.bind(this));
//         document.addEventListener('mousemove', this.drag.bind(this));
//         document.addEventListener('mouseup', this.stopDragging.bind(this));

//         // Append to body
//         document.body.appendChild(this.element);
//     }

//     startDragging(e) {
//         if (e.target.tagName.toLowerCase() !== 'button') {
//             this.isDragging = true;
//             this.dragOffset.x = e.clientX - this.element.offsetLeft;
//             this.dragOffset.y = e.clientY - this.element.offsetTop;
//         }
//     }

//     startResizing(e) {
//         if (e.target.className.includes('resize-handle')) {
//             this.isResizing = true;
//             this.resizeDirection = e.target.className.split(' ')[1];
//             this.initialRect = this.element.getBoundingClientRect();
//             this.initialMouseX = e.clientX;
//             this.initialMouseY = e.clientY;
//         }
//     }

//     drag(e) {
//         if (this.isDragging) {
//             this.element.style.left = (e.clientX - this.dragOffset.x) + 'px';
//             this.element.style.top = (e.clientY - this.dragOffset.y) + 'px';
//         } else if (this.isResizing) {
//             const deltaX = e.clientX - this.initialMouseX;
//             const deltaY = e.clientY - this.initialMouseY;
//             const minWidth = 200;
//             const minHeight = 100;

//             let newWidth = this.initialRect.width;
//             let newHeight = this.initialRect.height;
//             let newLeft = this.initialRect.left;
//             let newTop = this.initialRect.top;

//             if (this.resizeDirection.includes('e')) {
//                 newWidth = Math.max(minWidth, this.initialRect.width + deltaX);
//             }
//             if (this.resizeDirection.includes('s')) {
//                 newHeight = Math.max(minHeight, this.initialRect.height + deltaY);
//             }
//             if (this.resizeDirection.includes('w')) {
//                 newWidth = Math.max(minWidth, this.initialRect.width - deltaX);
//                 newLeft = this.initialRect.right - newWidth;
//             }
//             if (this.resizeDirection.includes('n')) {
//                 newHeight = Math.max(minHeight, this.initialRect.height - deltaY);
//                 newTop = this.initialRect.bottom - newHeight;
//             }

//             this.element.style.width = `${newWidth}px`;
//             this.element.style.height = `${newHeight}px`;
//             this.element.style.left = `${newLeft}px`;
//             this.element.style.top = `${newTop}px`;
//         }
//     }

//     stopDragging() {
//         this.isDragging = false;
//         this.isResizing = false;
//     }

//     close() {
//         document.body.removeChild(this.element);
//         // Emit a custom event
//         const closeEvent = new CustomEvent('floatingWindowClosed', {
//             detail: { windowId: this.id }
//         });
//         document.dispatchEvent(closeEvent);
//     }
// }