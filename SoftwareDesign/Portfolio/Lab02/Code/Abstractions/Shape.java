// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Abstractions;

public abstract class Shape {
    protected double size;
    protected String name;

    public Shape(double size, String name) {
        if (size <= 0) throw new IllegalArgumentException("Size must be greater than 0");
        this.size = size;
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public abstract double calcCircumference();

    public abstract double calcArea();
}
