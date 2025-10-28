// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Abstractions;

public class EquilateralTriangle extends Shape {
    public EquilateralTriangle(double side, String name) {
        super(side, name);
    }

    @Override
    public double calcCircumference() {
        return 3 * size;
    }

    @Override
    public double calcArea() {
        return (Math.sqrt(3) / 4) * size * size;
    }
}