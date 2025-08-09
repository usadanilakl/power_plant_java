
class Popup {
    constructor(content, options = {}) {
        this.content = content;
        this.options = {
            duration: options.duration ?? 5000,
            type: options.type || 'info',
            position: options.position || 'top-right'
        };
        this.element = null;
        this.create();
        this.show();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = `popup ${this.options.type}`;
        this.element.style.position = 'fixed';
        this.element.style.padding = '10px';
        this.element.style.borderRadius = '5px';
        this.element.style.zIndex = '9999';

        switch (this.options.position) {
            case 'top-right':
                this.element.style.top = '20px';
                this.element.style.right = '20px';
                break;
            case 'top-left':
                this.element.style.top = '20px';
                this.element.style.left = '20px';
                break;
            case 'bottom-right':
                this.element.style.bottom = '20px';
                this.element.style.right = '20px';
                break;
            case 'bottom-left':
                this.element.style.bottom = '20px';
                this.element.style.left = '20px';
                break;
        }

        if (this.options.type === 'error') {
            this.element.style.backgroundColor = '#ffcccc';
            this.element.style.color = '#cc0000';
        } else {
            this.element.style.backgroundColor = '#ccffcc';
            this.element.style.color = '#006600';
        }

        this.updateContent(this.content);
    }

    show() {
        document.body.appendChild(this.element);
        if (this.options.duration > 0) {
            console.log('Popup will be closed after', this.options.duration,'ms');
            setTimeout(() => this.close(), this.options.duration);
        }
    }

    close() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }    updateContent(newContent) {
        this.content = newContent;
        // Remove existing content
        this.element.innerHTML = '';
        // If newContent is a Node, append it, otherwise treat as text
        if (newContent instanceof Node) {
            this.element.appendChild(newContent);
        } else {
            this.element.textContent = newContent;
        }
    }
}