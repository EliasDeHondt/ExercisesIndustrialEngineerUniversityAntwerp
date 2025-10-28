// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Inheritance;

public class Employee {
    protected double hourlySalary;
    protected double hoursWorked;

    public Employee(double hourlySalary, double hoursWorked) {
        this.hourlySalary = hourlySalary;
        this.hoursWorked = hoursWorked;
    }

    public double calculateDailySalary() {
        return hourlySalary * hoursWorked;
    }
}