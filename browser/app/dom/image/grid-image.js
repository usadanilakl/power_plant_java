class ImageGrid {
    constructor(containerId, fileObjects, options = {}) {
        this.container = document.getElementById(containerId);
        this.fileObjects = fileObjects;
        this.options = {
            columns: options.columns || 4,
            previewSize: options.previewSize || 200,
            gap: options.gap || 10,
            onImageClick: options.onImageClick || this.defaultClickHandler,
            onImageHover: options.onImageHover || this.defaultHoverHandler
        };
        this.init();
    }

    init() {
        this.container.style.display = 'grid';
        this.container.style.gridTemplateColumns = `repeat(${this.options.columns}, 1fr)`;
        this.container.style.gap = `${this.options.gap}px`;
        this.container.style.padding = `${this.options.gap}px`;

        this.fileObjects.forEach(file => this.createImageElement(file));
    }

    createImageElement(file) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-grid-item';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.src = "../"+file.fileLink;
        img.alt = file.name;
        img.style.width = `${this.options.previewSize}px`;
        img.style.height = `${this.options.previewSize}px`;
        img.style.objectFit = 'contain';

        const caption = document.createElement('p');
        caption.textContent = file.name;
        caption.style.textAlign = 'center';
        caption.style.marginTop = '5px';
        caption.style.width = '100%';
        caption.style.overflow = 'hidden';
        caption.style.textOverflow = 'ellipsis';
        caption.style.whiteSpace = 'nowrap';

        wrapper.appendChild(img);
        wrapper.appendChild(caption);

        wrapper.addEventListener('click', () => this.options.onImageClick(file));
        wrapper.addEventListener('mouseenter', () => this.options.onImageHover(file, true));
        wrapper.addEventListener('mouseleave', () => this.options.onImageHover(file, false));

        this.container.appendChild(wrapper);
    }

    defaultClickHandler(file) {
        console.log('Image clicked:', file);
        // Implement default click behavior here
    }

    defaultHoverHandler(file, isHovering) {
        console.log(`Image ${isHovering ? 'hovered' : 'unhovered'}:`, file);
        // Implement default hover behavior here
    }
}