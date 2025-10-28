// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Abstractions;

public class Square extends Shape {
    public Square(double side, String name) {
        super(side, name);
    }

    @Override
    public double calcCircumference() {
        return 4 * size;
    }

    @Override
    public double calcArea() {
        return size * size;
    }
}