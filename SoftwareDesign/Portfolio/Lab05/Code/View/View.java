// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.View;
import SoftwareDesign.Portfolio.Lab05.Code.Controller.Controller;
import SoftwareDesign.Portfolio.Lab05.Code.Database.Database;
import SoftwareDesign.Portfolio.Lab05.Code.Database.RegistrationEventType;
import SoftwareDesign.Portfolio.Lab05.Code.Employee.Employee;
import SoftwareDesign.Portfolio.Lab05.Code.Register_entry.RegisterEntry;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.util.Comparator;
import java.util.List;

public final class View implements PropertyChangeListener {
    private final Database model;
    private final Controller controller;
    private final RenderPort ui;
    private Employee currentSelection;
    private RegisterEntry currentEntrySelection;

    public View(Database model, Controller controller, RenderPort ui) {
        this.model = model;
        this.controller = controller;
        this.ui = ui;
        model.addPropertyChangeListener(this);
        refreshAll();
    }

    public void onAddPerson(String name, String function) {
        try {
            controller.addPerson(name, function);
            ui.clearInputs();
        } catch (IllegalArgumentException ex) {
            ui.showError(ex.getMessage());
        }
    }

    public void onUpdatePerson(Employee updated) {
        try {
            controller.updatePerson(updated);
        } catch (IllegalArgumentException ex) {
            ui.showError(ex.getMessage());
        }
    }

    public void onDeleteSelected(Employee sel) {
        if (sel != null) {
            controller.deletePerson(sel);
        }
    }

    public void onAddEntry(Employee sel) {
        if (sel == null) return;
        try {
            List<RegisterEntry> hist = model.getEntriesFor(sel);
            RegisterEntry last = hist.stream().max(Comparator.comparing(RegisterEntry::timestamp)).orElse(null);
            boolean nextIsCheckIn = (last == null) || !last.checkIn();
            if (nextIsCheckIn) controller.checkIn(sel);
            else controller.checkOut(sel);
        } catch (IllegalStateException ex) {
            ui.showError(ex.getMessage());
        }
    }

    public void onSelectionChanged(Employee sel) {
        currentSelection = sel;
        ui.setActionsEnabled(sel != null);
        ui.showEntries(sel == null ? List.of() : model.getEntriesFor(sel));
        currentEntrySelection = null;
    }

    public void onEntrySelected(RegisterEntry entry) {
        currentEntrySelection = entry;
    }

    public void onDeleteEntrySelected() {
        if (currentEntrySelection != null) {
            controller.deleteEntry(currentEntrySelection.id());
            currentEntrySelection = null;
        }
    }

    public void onEditEntrySelected(boolean newCheckIn, java.time.LocalDateTime newTimestamp) {
        if (currentEntrySelection != null) {
            try {
                controller.updateEntry(currentEntrySelection.id(), newCheckIn, newTimestamp);
            } catch (IllegalArgumentException ex) {
                ui.showError(ex.getMessage());
            }
        }
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        Object nv = evt.getNewValue();
        if (!(nv instanceof RegistrationEventType re)) return;
        if (re == RegistrationEventType.EMPLOYEE_ADDED
                || re == RegistrationEventType.EMPLOYEE_REMOVED
                || re == RegistrationEventType.EMPLOYEE_UPDATED) {
            ui.showPeople(model.getEmployees());
            if (currentSelection != null) {
                ui.showEntries(model.getEntriesFor(currentSelection));
            }
        } else if (re == RegistrationEventType.ENTRY_ADDED
                || re == RegistrationEventType.ENTRY_UPDATED
                || re == RegistrationEventType.ENTRY_REMOVED) {
            if (currentSelection != null) {
                ui.showEntries(model.getEntriesFor(currentSelection));
            } else {
                ui.showEntries(List.of());
            }
        }
    }

    private void refreshAll() {
        ui.showPeople(model.getEmployees());
        ui.setActionsEnabled(false);
    }
}