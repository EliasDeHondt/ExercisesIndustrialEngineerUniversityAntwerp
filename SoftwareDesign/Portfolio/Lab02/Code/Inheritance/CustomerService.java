// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Inheritance;

public class CustomerService extends Employee {
    protected double bonusPerCustomer;
    protected int numberOfCustomers;

    public CustomerService(double hourlySalary, double hoursWorked, double bonusPerCustomer, int numberOfCustomers) {
        super(hourlySalary, hoursWorked);
        this.bonusPerCustomer = bonusPerCustomer;
        this.numberOfCustomers = numberOfCustomers;
    }

    @Override
    public double calculateDailySalary() {
        return super.calculateDailySalary() + (bonusPerCustomer * numberOfCustomers);
    }
}