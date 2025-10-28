// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Abstractions;

public class Main {
    public Main() {}

    public static void main(String[] args) {
        Main main = new Main();
        main.run();
    }

    public void run() {
        Circle circle1 = new Circle(5.0, "Small Circle");
        Circle circle2 = new Circle(10.0, "Large Circle");
        Square square1 = new Square(4.0, "Square");
        EquilateralTriangle triangle1 = new EquilateralTriangle(6.0, "Equilateral Triangle");

        printShape(circle1);
        printShape(circle2);
        printShape(square1);
        printShape(triangle1);
    }

    public void printShape(Shape shape) {
        System.out.println("Shape: " + shape.getName());
        System.out.println("Circumference: " + shape.calcCircumference());
        System.out.println("Area: " + shape.calcArea());
        System.out.println();
    }
}