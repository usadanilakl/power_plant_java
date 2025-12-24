
package com.dk_power.power_plant_java.sevice.angular.refactor_equipment;

import java.util.List;

public class CoordinatePositioner {
    
    private static final int PADDING = 5;
    private static final float SIZE_REDUCTION_FACTOR = 0.4f; // Reduce to 40% of original size
    
    /**
     * Calculate the next position for a split equipment element
     * Positions elements adjacent to the original element, reduced in size
     * For horizontal elements: place on top and bottom
     * For vertical elements: place on left and right
     */
    public static CoordinateInfo calculateNextPosition(
            CoordinateInfo original, 
            List<CoordinateInfo> existingCoordinates, 
            int index) {
        
        // Determine if original is horizontal or vertical
        boolean isHorizontal = original.width > original.height;
        
        // Calculate reduced dimensions
        int reducedWidth = (int) (original.width * SIZE_REDUCTION_FACTOR);
        int reducedHeight = (int) (original.height * SIZE_REDUCTION_FACTOR);
        
        CoordinateInfo newCoords;
        
        if (isHorizontal) {
            // For horizontal elements: place on top (index 1) or bottom (index 2, 3...)
            newCoords = positionVertically(original, reducedWidth, reducedHeight, index);
        } else {
            // For vertical elements: place on left (index 1) or right (index 2, 3...)
            newCoords = positionHorizontally(original, reducedWidth, reducedHeight, index);
        }
        
        return newCoords;
    }
    
    /**
     * Position elements vertically (top and bottom) for horizontal original elements
     */
    private static CoordinateInfo positionVertically(
            CoordinateInfo original, 
            int reducedWidth, 
            int reducedHeight, 
            int index) {
        
        CoordinateInfo newCoords = new CoordinateInfo(0, 0, 0, 0, reducedWidth, reducedHeight);
        
        // Center horizontally on the original element
        int centerX = original.startX + (original.width - reducedWidth) / 2;
        
        if (index % 2 == 1) {
            // Odd indices (1, 3, 5...) go on top
            newCoords.startY = original.startY - reducedHeight - PADDING;
        } else {
            // Even indices (2, 4, 6...) go on bottom
            newCoords.startY = original.endY + PADDING;
        }
        
        newCoords.startX = centerX;
        newCoords.endX = newCoords.startX + reducedWidth;
        newCoords.endY = newCoords.startY + reducedHeight;
        
        return newCoords;
    }
    
    /**
     * Position elements horizontally (left and right) for vertical original elements
     */
    private static CoordinateInfo positionHorizontally(
            CoordinateInfo original, 
            int reducedWidth, 
            int reducedHeight, 
            int index) {
        
        CoordinateInfo newCoords = new CoordinateInfo(0, 0, 0, 0, reducedWidth, reducedHeight);
        
        // Center vertically on the original element
        int centerY = original.startY + (original.height - reducedHeight) / 2;
        
        if (index % 2 == 1) {
            // Odd indices (1, 3, 5...) go on left
            newCoords.startX = original.startX - reducedWidth - PADDING;
        } else {
            // Even indices (2, 4, 6...) go on right
            newCoords.startX = original.endX + PADDING;
        }
        
        newCoords.startY = centerY;
        newCoords.endX = newCoords.startX + reducedWidth;
        newCoords.endY = newCoords.startY + reducedHeight;
        
        return newCoords;
    }
}