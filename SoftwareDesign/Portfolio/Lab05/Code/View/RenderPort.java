// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.View;
import SoftwareDesign.Portfolio.Lab05.Code.Employee.Employee;
import SoftwareDesign.Portfolio.Lab05.Code.Register_entry.RegisterEntry;
import java.util.List;

public interface RenderPort {
    void showPeople(List<Employee> people);

    void showEntries(List<RegisterEntry> entries);

    void clearInputs();

    void setActionsEnabled(boolean hasSelection);

    void showError(String message);
}