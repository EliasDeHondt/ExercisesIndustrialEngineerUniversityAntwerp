// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Inventory;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class InventoryDB extends Database {
    private static volatile InventoryDB INSTANCE;
    private final Map<String, Integer> stock = new ConcurrentHashMap<>(); // sku -> qty

    private InventoryDB() {}

    public static InventoryDB getInstance() {
        if (INSTANCE == null) {
            synchronized (InventoryDB.class) {
                if (INSTANCE == null) {
                    INSTANCE = new InventoryDB();
                }
            }
        }
        return INSTANCE;
    }

    public void setStock(String sku, int newQty) {
        int oldQty = getStock(sku);
        stock.put(sku, newQty);
        notifyObservers("stockChanged", oldQty, newQty);
    }

    public int getStock(String sku) {
        return stock.getOrDefault(sku, 0);
    }
}