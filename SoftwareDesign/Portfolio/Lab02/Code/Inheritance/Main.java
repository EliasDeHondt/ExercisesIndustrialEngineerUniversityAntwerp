// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Inheritance;

public class Main {
    public Main() {}

    public static void main(String[] args) {
        Main main = new Main();
        main.run();
    }

    public void run() {
        // Create a Programmer instance
        Programmer programmer = new Programmer(20.0, 8.0, 50.0, 3.0);
        printWage("Alice (Programmer)", programmer);

        // Create a CustomerService instance
        CustomerService customerService = new CustomerService(18.0, 8.0, 10.0, 20);
        printWage("Bob (Customer Service)", customerService);

        // Create a DepartmentOfficer instance
        DepartmentOfficer deptOfficer = new DepartmentOfficer(25.0, 8.0, 100.0);
        printWage("Charlie (Department Officer)", deptOfficer);
    }

    public void printWage(String name, Employee e) {
        System.out.println("Employee " + name + ": salary = " + e.calculateDailySalary());
    }
}