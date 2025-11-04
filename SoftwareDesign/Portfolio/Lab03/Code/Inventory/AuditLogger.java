// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Inventory;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

public class AuditLogger implements PropertyChangeListener {
    @Override
    public void propertyChange(PropertyChangeEvent evt) {
        if ("stockChanged".equals(evt.getPropertyName())) {
            Integer newQty = (Integer) evt.getNewValue();
            System.out.println("AUDIT: " + newQty);
        }
    }
}