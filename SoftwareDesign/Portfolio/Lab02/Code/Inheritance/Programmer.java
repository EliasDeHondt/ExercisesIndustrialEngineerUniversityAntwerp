// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Inheritance;

public class Programmer extends Employee {
    protected double bonusPerBug;
    protected double numberOfBugs;

    public Programmer(double hourlySalary, double hoursWorked, double bonusPerBug, double numberOfBugs) {
        super(hourlySalary, hoursWorked);
        this.bonusPerBug = bonusPerBug;
        this.numberOfBugs = numberOfBugs;
    }

    @Override
    public double calculateDailySalary() {
        return super.calculateDailySalary() + (bonusPerBug * numberOfBugs);
    }
}