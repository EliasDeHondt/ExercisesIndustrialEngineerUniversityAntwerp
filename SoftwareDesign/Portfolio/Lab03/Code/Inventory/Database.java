// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Inventory;
import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

public abstract class Database {
    private final PropertyChangeSupport pcs = new PropertyChangeSupport(this);

    public void addListener(PropertyChangeListener l) {
        pcs.addPropertyChangeListener(l);
    }

    public void removeListener(PropertyChangeListener l) {
        pcs.removePropertyChangeListener(l);
    }

    protected void notifyObservers(String event, Object oldV, Object newV) {
        pcs.firePropertyChange(event, oldV, newV);
    }
}