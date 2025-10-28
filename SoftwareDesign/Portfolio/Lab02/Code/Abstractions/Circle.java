// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Abstractions;

public class Circle extends Shape {
    public Circle(double radius, String name) {
        super(radius, name);
    }

    @Override
    public double calcCircumference() {
        return 2 * Math.PI * size;
    }

    @Override
    public double calcArea() {
        return Math.PI * size * size;
    }
}