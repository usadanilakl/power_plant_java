class ImageCarousel {
    constructor(containerId, fileObjects, options = {}) {
        this.container = document.getElementById(containerId);
        this.fileObjects = fileObjects;
        this.options = {
            visibleImages: options.visibleImages || 3,
            imageWidth: options.imageWidth || 200,
            gap: options.gap || 10,
            onImageClick: options.onImageClick || this.defaultClickHandler,
            onImageHover: options.onImageHover || this.defaultHoverHandler
        };
        this.currentIndex = 0;
        this.init();
    }

    init() {
        this.container.innerHTML= '';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        this.carouselWrapper = document.createElement('div');
        this.carouselWrapper.style.display = 'flex';
        this.carouselWrapper.style.transition = 'transform 0.3s ease-in-out';
        this.container.appendChild(this.carouselWrapper);

        this.fileObjects.forEach(file => this.createImageElement(file));

        this.createNavigationArrows();
        this.updateCarouselPosition();
    }

    createImageElement(file) {
        const wrapper = document.createElement('div');
        wrapper.className = 'carousel-item';
        wrapper.style.flexShrink = '0';
        wrapper.style.width = `${this.options.imageWidth}px`;
        wrapper.style.marginRight = `${this.options.gap}px`;

        const img = document.createElement('img');
        img.src = "../" + file.fileLink;
        img.alt = file.name;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';

        const caption = document.createElement('p');
        caption.textContent = file.name;
        caption.style.textAlign = 'center';
        caption.style.marginTop = '5px';
        caption.style.overflow = 'hidden';
        caption.style.textOverflow = 'ellipsis';
        caption.style.whiteSpace = 'nowrap';

        wrapper.appendChild(img);
        wrapper.appendChild(caption);

        wrapper.addEventListener('click', () => this.options.onImageClick(file));
        wrapper.addEventListener('mouseenter', () => this.options.onImageHover(file, true));
        wrapper.addEventListener('mouseleave', () => this.options.onImageHover(file, false));

        this.carouselWrapper.appendChild(wrapper);
    }

    createNavigationArrows() {
        const createArrow = (direction) => {
            const arrow = document.createElement('button');
            arrow.textContent = direction === 'left' ? '←' : '→';
            arrow.style.position = 'absolute';
            arrow.style.top = '50%';
            arrow.style.transform = 'translateY(-50%)';
            arrow.style[direction] = '10px';
            arrow.style.zIndex = '1';
            arrow.style.fontSize = '24px';
            arrow.style.padding = '10px';
            arrow.style.cursor = 'pointer';
            arrow.addEventListener('click', () => this.scroll(direction));
            return arrow;
        };

        this.container.appendChild(createArrow('left'));
        this.container.appendChild(createArrow('right'));
    }

    scroll(direction) {
        if (direction === 'left' && this.currentIndex > 0) {
            this.currentIndex--;
        } else if (direction === 'right' && this.currentIndex < this.fileObjects.length - this.options.visibleImages) {
            this.currentIndex++;
        }
        this.updateCarouselPosition();
    }

    updateCarouselPosition() {
        const offset = -(this.currentIndex * (this.options.imageWidth + this.options.gap));
        this.carouselWrapper.style.transform = `translateX(${offset}px)`;
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