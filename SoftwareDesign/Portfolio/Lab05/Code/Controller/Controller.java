// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.Controller;
import SoftwareDesign.Portfolio.Lab05.Code.Employee.Employee;
import java.time.LocalDateTime;

public interface Controller {
    void addPerson(String name, String function);

    void updatePerson(Employee updated);

    void deletePerson(Employee e);

    void checkIn(Employee e);

    void checkOut(Employee e);

    void updateEntry(String entryId, boolean checkIn, LocalDateTime timestamp);

    void deleteEntry(String entryId);
}