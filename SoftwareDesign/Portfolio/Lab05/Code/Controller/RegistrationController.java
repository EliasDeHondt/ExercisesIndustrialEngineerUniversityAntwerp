// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.Controller;
import SoftwareDesign.Portfolio.Lab05.Code.Database.Database;
import SoftwareDesign.Portfolio.Lab05.Code.Employee.Employee;
import SoftwareDesign.Portfolio.Lab05.Code.Register_entry.RegisterEntry;
import java.time.LocalDateTime;

public class RegistrationController implements Controller {
    private final Database db;

    public RegistrationController(Database db) {
        this.db = db;
    }

    private static String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Override
    public void addPerson(String name, String function) {
        String n = norm(name);
        String f = norm(function);
        if (n == null || f == null) throw new IllegalArgumentException("Please provide both a name and a profession.");
        db.addEmployee(new Employee(n, f));
    }

    @Override
    public void updatePerson(Employee updated) {
        String n = norm(updated.name());
        String f = norm(updated.function());
        if (n == null || f == null) throw new IllegalArgumentException("Please provide both a name and a profession.");
        Employee u = new Employee(updated.id(), n, f);
        db.updateEmployee(u);
    }

    @Override
    public void deletePerson(Employee e) {
        db.removeEmployee(e);
    }

    @Override
    public void checkIn(Employee e) {
        db.checkIn(e);
    }

    @Override
    public void checkOut(Employee e) {
        db.checkOut(e);
    }

    @Override
    public void updateEntry(String entryId, boolean checkIn, LocalDateTime timestamp) {
        if (timestamp.isAfter(LocalDateTime.now())) throw new IllegalArgumentException("Future timestamps are not allowed.");
        RegisterEntry old = find(entryId);
        RegisterEntry updated = new RegisterEntry(old.id(), old.employee(), checkIn, timestamp);
        db.updateEntry(updated);
    }

    @Override
    public void deleteEntry(String entryId) {
        db.removeEntry(entryId);
    }

    private RegisterEntry find(String id) {
        for (Employee e : db.getEmployees()) {
            for (RegisterEntry re : db.getEntriesFor(e)) {
                if (re.id().equals(id)) return re;
            }
        }
        throw new IllegalArgumentException("Entry not found: " + id);
    }
}