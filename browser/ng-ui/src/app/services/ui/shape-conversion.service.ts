
import { Injectable } from '@angular/core';
import { RectangleShape, ImageShape, Shape } from '../../models/ui/shape.model';

@Injectable({
  providedIn: 'root'
})
export class ShapeConversionService {

  /**
   * Convert a rectangle shape to an image shape
   */
  async convertRectangleToImage(
    rectangle: RectangleShape,
    file: File
  ): Promise<ImageShape> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const img = new Image();
        
        img.onload = () => {
          const imageShape: ImageShape = {
            ...rectangle,
            type: 'image',
            imageUrl: URL.createObjectURL(file),
            imageData: imageData
          };
          resolve(imageShape);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageData;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert an image shape back to a rectangle shape
   */
  convertImageToRectangle(imageShape: ImageShape): RectangleShape {
    // Clean up the object URL if it exists
    if (imageShape.imageUrl) {
      URL.revokeObjectURL(imageShape.imageUrl);
    }

    // Destructure to remove only image-specific properties
    const { imageUrl, imageData, type, ...baseProps } = imageShape;
    
    return {
      ...baseProps,
      type: 'rectangle',
      x: imageShape.x,
      y: imageShape.y,
      width: imageShape.width,
      height: imageShape.height
    };
  }

  /**
   * Update image for an existing image shape
   */
  async updateImageForShape(
    imageShape: ImageShape,
    file: File
  ): Promise<ImageShape> {
    // Clean up old image URL
    if (imageShape.imageUrl) {
      URL.revokeObjectURL(imageShape.imageUrl);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const img = new Image();
        
        img.onload = () => {
          const updatedShape: ImageShape = {
            ...imageShape,
            imageUrl: URL.createObjectURL(file),
            imageData: imageData
          };
          resolve(updatedShape);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageData;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}