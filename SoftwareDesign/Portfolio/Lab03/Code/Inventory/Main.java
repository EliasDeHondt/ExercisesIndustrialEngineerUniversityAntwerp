// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Inventory;

public class Main {
    public static void main(String[] args) {
        new Main().run();
    }

    public void run() {
        InventoryDB db = InventoryDB.getInstance();
        ReorderService reorder = new ReorderService();
        AuditLogger audit = new AuditLogger();
        db.addListener(reorder);
        db.addListener(audit);

        String sku = "widget";
        db.setStock(sku, 5);  // Above threshold: AUDIT only
        db.setStock(sku, 4);  // Still above: AUDIT only
        db.setStock(sku, 2);  // Below threshold: AUDIT + REORDER

        System.out.println("Final stock for " + sku + ": " + db.getStock(sku));
    }
}