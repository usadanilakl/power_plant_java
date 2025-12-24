package com.dk_power.power_plant_java.sevice.angular.refactor_equipment;

public class CoordinateInfo {
    public int startX;
    public int startY;
    public int endX;
    public int endY;
    public int width;
    public int height;
    
    private static final int PADDING = 20; // Padding between elements
    
    public CoordinateInfo(int startX, int startY, int endX, int endY, int width, int height) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.width = width;
        this.height = height;
    }
    
    @Override
    public String toString() {
        return String.format("startX:%d,startY:%d,endX:%d,endY:%d,width:%d,height:%d",
                startX, startY, endX, endY, width, height);
    }
    
    public boolean overlaps(CoordinateInfo other) {
        return !(this.endX + PADDING < other.startX || 
                 other.endX + PADDING < this.startX || 
                 this.endY + PADDING < other.startY || 
                 other.endY + PADDING < this.startY);
    }
    
    public int getRightEdge() {
        return this.endX;
    }
    
    public int getBottomEdge() {
        return this.endY;
    }
}