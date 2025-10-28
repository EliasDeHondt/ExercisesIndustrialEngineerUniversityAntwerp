// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Inheritance;

public class DepartmentOfficer extends Employee {
    protected double companyBonus;

    public DepartmentOfficer(double hourlySalary, double hoursWorked, double companyBonus) {
        super(hourlySalary, hoursWorked);
        this.companyBonus = companyBonus;
    }

    @Override
    public double calculateDailySalary() {
        return super.calculateDailySalary() + companyBonus;
    }
}