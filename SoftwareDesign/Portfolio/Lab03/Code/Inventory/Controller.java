// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Inventory;

public class Controller {
    private final InventoryDB db;

    public Controller(InventoryDB db) {
        this.db = db;
    }

    public void adjust(String sku, int newQty) {
        db.setStock(sku, newQty);
    }
}