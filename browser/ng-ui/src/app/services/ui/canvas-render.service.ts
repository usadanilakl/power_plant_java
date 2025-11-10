// import { Injectable } from '@angular/core';
// import { CircleShape, LineShape, RectangleShape, Shape, TextShape } from '../../models/ui/shape.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class CanvasRenderService {
//   private readonly HANDLE_SIZE = 8;
//   private readonly SELECTED_LINE_WIDTH = 3;
//   private readonly DEFAULT_LINE_WIDTH = 1;

//   drawShapes(
//     canvas: HTMLCanvasElement,
//     shapes: Shape[],
//     scale: number
//   ): void {
//     const ctx = canvas.getContext('2d');
//     if (!ctx) {
//       console.error('Unable to get 2D context from canvas');
//       return;
//     }

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     shapes.forEach(shape => this.drawShape(ctx, shape, scale));
//   }

//   private drawShape(
//     ctx: CanvasRenderingContext2D,
//     shape: Shape,
//     scale: number
//   ): void {
//     ctx.strokeStyle = shape.color;
//     ctx.fillStyle = shape.color;
//     ctx.lineWidth = shape.isSelected ? this.SELECTED_LINE_WIDTH : this.DEFAULT_LINE_WIDTH;

//     const scaledShape = this.scaleShape(shape, scale);

//     switch (scaledShape.type) {
//       case 'rectangle':
//         this.drawRectangle(ctx, scaledShape as RectangleShape, shape, scale);
//         break;
//       case 'circle':
//         this.drawCircle(ctx, scaledShape as CircleShape, scale);
//         break;
//       case 'line':
//         this.drawLine(ctx, scaledShape as LineShape, scale);
//         break;
//       case 'text':
//         this.drawText(ctx, scaledShape as TextShape, scale);
//         break;
//     }
//   }

  
//   private drawRectangle(
//     ctx: CanvasRenderingContext2D,
//     rect: RectangleShape,
//     originalShape: Shape,
//     scale: number
//   ): void {
//     // Don't multiply by scale again - scaledShape already has scaled dimensions
//     ctx.strokeRect(
//       rect.x,
//       rect.y,
//       rect.width,
//       rect.height
//     );
  
//     if (originalShape.isBulkSelected) {
//       this.drawSelectionHandles(ctx, rect, 'orange');
//     }
  
//     if (originalShape.isSelected) {
//       this.drawSelectionHandles(ctx, rect);
//     }
//   }
  
//   private drawCircle(
//     ctx: CanvasRenderingContext2D,
//     circle: CircleShape,
//     scale: number
//   ): void {
//     ctx.beginPath();
//     ctx.arc(
//       circle.x,
//       circle.y,
//       circle.radius,
//       0,
//       2 * Math.PI
//     );
//     ctx.stroke();
//   }
  
//   private drawLine(
//     ctx: CanvasRenderingContext2D,
//     line: LineShape,
//     scale: number
//   ): void {
//     ctx.beginPath();
//     ctx.moveTo(line.startX, line.startY);
//     ctx.lineTo(line.endX, line.endY);
//     ctx.stroke();
//   }
  
//   private drawText(
//     ctx: CanvasRenderingContext2D,
//     text: TextShape,
//     scale: number
//   ): void {
//     ctx.font = `${16 * scale}px Arial`;
//     ctx.fillText(text.text, text.x, text.y);
//   }
  
//   private scaleShape(shape: Shape, scale: number): Shape {
//     switch (shape.type) {
//       case 'rectangle':
//         return {
//           ...shape,
//           x: shape.x * scale,
//           y: shape.y * scale,
//           width: shape.width * scale,
//           height: shape.height * scale,
//         };
//       case 'circle':
//         return {
//           ...shape,
//           x: shape.x * scale,
//           y: shape.y * scale,
//           radius: shape.radius * scale,
//         };
//       case 'line':
//         return {
//           ...shape,
//           startX: shape.startX * scale,
//           startY: shape.startY * scale,
//           endX: shape.endX * scale,
//           endY: shape.endY * scale,
//         };
//       case 'text':
//         return {
//           ...shape,
//           x: shape.x * scale,
//           y: shape.y * scale,
//         };
//       default:
//         return shape;
//     }
//   }
  
//   private drawSelectionHandles(
//     ctx: CanvasRenderingContext2D,
//     shape: Shape,
//     color: string = 'blue'
//   ): void {
//     ctx.fillStyle = color;
//     const corners = this.getShapeCorners(shape);
  
//     corners.forEach(([x, y]) => {
//       ctx.fillRect(
//         x - this.HANDLE_SIZE / 2,
//         y - this.HANDLE_SIZE / 2,
//         this.HANDLE_SIZE,
//         this.HANDLE_SIZE
//       );
//     });
//   }

//   private getShapeCorners(shape: Shape): [number, number][] {
//     switch (shape.type) {
//       case 'rectangle':
//         const rect = shape as RectangleShape;
//         return [
//           [rect.x, rect.y],
//           [rect.x + rect.width, rect.y],
//           [rect.x, rect.y + rect.height],
//           [rect.x + rect.width, rect.y + rect.height]
//         ];
//       case 'circle':
//         const circle = shape as CircleShape;
//         return [
//           [circle.x - circle.radius, circle.y - circle.radius],
//           [circle.x + circle.radius, circle.y - circle.radius],
//           [circle.x - circle.radius, circle.y + circle.radius],
//           [circle.x + circle.radius, circle.y + circle.radius]
//         ];
//       case 'line':
//         const line = shape as LineShape;
//         return [
//           [line.startX, line.startY],
//           [line.endX, line.endY]
//         ];
//       default:
//         return [];
//     }
//   }

  
//     updateCanvasSize(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
//       const imgRect = img.getBoundingClientRect();
//       canvas.width = imgRect.width;
//       canvas.height = imgRect.height;
//     }
  
//     calculateScale(img: HTMLImageElement): number {
//       const imgRect = img.getBoundingClientRect();
//       return imgRect.width / img.naturalWidth;
//     }
  
//     // New method: Calculate base scale without zoom transformation
//     calculateBaseScale(img: HTMLImageElement): number {
//       // Get the actual displayed width without transform
//       const computedStyle = window.getComputedStyle(img);
//       const width = parseFloat(computedStyle.width);
//       return width / img.naturalWidth;
//     }
// }


import { Injectable } from '@angular/core';
import { CircleShape, ImageShape, LineShape, RectangleShape, Shape, TextShape } from '../../models/ui/shape.model';

@Injectable({
  providedIn: 'root'
})
export class CanvasRenderService {
  private readonly HANDLE_SIZE = 8;
  private readonly SELECTED_LINE_WIDTH = 3;
  private readonly DEFAULT_LINE_WIDTH = 1;
  
  // Cache for loaded images to avoid reloading
  private imageCache = new Map<string, HTMLImageElement>();

  drawShapes(
    canvas: HTMLCanvasElement,
    shapes: Shape[],
    scale: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => this.drawShape(ctx, shape, scale));
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    scale: number
  ): void {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected ? this.SELECTED_LINE_WIDTH : this.DEFAULT_LINE_WIDTH;

    const scaledShape = this.scaleShape(shape, scale);

    switch (scaledShape.type) {
      case 'rectangle':
        this.drawRectangle(ctx, scaledShape as RectangleShape, shape, scale);
        break;
      case 'image':
        this.drawImage(ctx, scaledShape as ImageShape, shape, scale);
        break;
      case 'circle':
        this.drawCircle(ctx, scaledShape as CircleShape, scale);
        break;
      case 'line':
        this.drawLine(ctx, scaledShape as LineShape, scale);
        break;
      case 'text':
        this.drawText(ctx, scaledShape as TextShape, scale);
        break;
    }
  }

  private drawRectangle(
    ctx: CanvasRenderingContext2D,
    rect: RectangleShape,
    originalShape: Shape,
    scale: number
  ): void {
    ctx.strokeRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );
  
    if (originalShape.isBulkSelected) {
      this.drawSelectionHandles(ctx, rect, 'orange');
    }
  
    if (originalShape.isSelected) {
      this.drawSelectionHandles(ctx, rect);
    }
  }

  // Add new method to draw image shapes
  private drawImage(
    ctx: CanvasRenderingContext2D,
    imageShape: ImageShape,
    originalShape: Shape,
    scale: number
  ): void {
    const imageSource = imageShape.imageData || imageShape.imageUrl;
    
    // Check cache first
    let img = this.imageCache.get(imageSource);
    
    if (!img) {
      img = new Image();
      img.src = imageSource;
      this.imageCache.set(imageSource, img);
    }

    // Draw image if loaded
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        imageShape.x,
        imageShape.y,
        imageShape.width,
        imageShape.height
      );

      // Draw border around image
      ctx.strokeStyle = imageShape.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        imageShape.x,
        imageShape.y,
        imageShape.width,
        imageShape.height
      );

      // Draw selection handles
      if (originalShape.isBulkSelected) {
        this.drawSelectionHandles(ctx, imageShape, 'orange');
      }
    
      if (originalShape.isSelected) {
        this.drawSelectionHandles(ctx, imageShape);
      }
    } else {
      // Image not loaded yet, draw placeholder
      this.drawImagePlaceholder(ctx, imageShape);
      
      // Redraw when image loads
      img.onload = () => {
        ctx.drawImage(
          img!,
          imageShape.x,
          imageShape.y,
          imageShape.width,
          imageShape.height
        );

        // Draw border
        ctx.strokeStyle = imageShape.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          imageShape.x,
          imageShape.y,
          imageShape.width,
          imageShape.height
        );

        // Draw selection handles if needed
        if (originalShape.isBulkSelected) {
          this.drawSelectionHandles(ctx, imageShape, 'orange');
        }
      
        if (originalShape.isSelected) {
          this.drawSelectionHandles(ctx, imageShape);
        }
      };
    }
  }

  // Helper method to draw placeholder while image loads
  private drawImagePlaceholder(
    ctx: CanvasRenderingContext2D,
    imageShape: ImageShape
  ): void {
    // Draw gray rectangle as placeholder
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(
      imageShape.x,
      imageShape.y,
      imageShape.width,
      imageShape.height
    );

    // Draw border
    ctx.strokeStyle = imageShape.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      imageShape.x,
      imageShape.y,
      imageShape.width,
      imageShape.height
    );

    // Draw loading text
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Loading...',
      imageShape.x + imageShape.width / 2,
      imageShape.y + imageShape.height / 2
    );
  }
  
  private drawCircle(
    ctx: CanvasRenderingContext2D,
    circle: CircleShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.arc(
      circle.x,
      circle.y,
      circle.radius,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }
  
  private drawLine(
    ctx: CanvasRenderingContext2D,
    line: LineShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
  }
  
  private drawText(
    ctx: CanvasRenderingContext2D,
    text: TextShape,
    scale: number
  ): void {
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillText(text.text, text.x, text.y);
  }
  
  private scaleShape(shape: Shape, scale: number): Shape {
    switch (shape.type) {
      case 'rectangle':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          width: shape.width * scale,
          height: shape.height * scale,
        };
      case 'image':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          width: shape.width * scale,
          height: shape.height * scale,
        };
      case 'circle':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          radius: shape.radius * scale,
        };
      case 'line':
        return {
          ...shape,
          startX: shape.startX * scale,
          startY: shape.startY * scale,
          endX: shape.endX * scale,
          endY: shape.endY * scale,
        };
      case 'text':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
        };
      default:
        return shape;
    }
  }
  
  private drawSelectionHandles(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    color: string = 'blue'
  ): void {
    ctx.fillStyle = color;
    const corners = this.getShapeCorners(shape);
  
    corners.forEach(([x, y]) => {
      ctx.fillRect(
        x - this.HANDLE_SIZE / 2,
        y - this.HANDLE_SIZE / 2,
        this.HANDLE_SIZE,
        this.HANDLE_SIZE
      );
    });
  }

  private getShapeCorners(shape: Shape): [number, number][] {
    switch (shape.type) {
      case 'rectangle':
        const rect = shape as RectangleShape;
        return [
          [rect.x, rect.y],
          [rect.x + rect.width, rect.y],
          [rect.x, rect.y + rect.height],
          [rect.x + rect.width, rect.y + rect.height]
        ];
      case 'image':
        const img = shape as ImageShape;
        return [
          [img.x, img.y],
          [img.x + img.width, img.y],
          [img.x, img.y + img.height],
          [img.x + img.width, img.y + img.height]
        ];
      case 'circle':
        const circle = shape as CircleShape;
        return [
          [circle.x - circle.radius, circle.y - circle.radius],
          [circle.x + circle.radius, circle.y - circle.radius],
          [circle.x - circle.radius, circle.y + circle.radius],
          [circle.x + circle.radius, circle.y + circle.radius]
        ];
      case 'line':
        const line = shape as LineShape;
        return [
          [line.startX, line.startY],
          [line.endX, line.endY]
        ];
      default:
        return [];
    }
  }

  updateCanvasSize(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
    const imgRect = img.getBoundingClientRect();
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
  }

  calculateScale(img: HTMLImageElement): number {
    const imgRect = img.getBoundingClientRect();
    return imgRect.width / img.naturalWidth;
  }

  calculateBaseScale(img: HTMLImageElement): number {
    const computedStyle = window.getComputedStyle(img);
    const width = parseFloat(computedStyle.width);
    return width / img.naturalWidth;
  }

  // Add cleanup method to clear image cache
  clearImageCache(): void {
    this.imageCache.forEach((img, src) => {
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    });
    this.imageCache.clear();
  }
}