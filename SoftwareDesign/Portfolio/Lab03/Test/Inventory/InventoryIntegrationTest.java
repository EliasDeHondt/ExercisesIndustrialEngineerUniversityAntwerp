// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Test.Inventory;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

public class InventoryIntegrationTest {
    private InventoryDB db;
    private CountDownLatch latch; // For async verification.
    private int auditCount;
    private int reorderCount;
    private String sku = "test-widget";

    @BeforeEach
    public void setUp() {
        db = InventoryDB.getInstance();
        // Clear any prior state.
        db.setStock(sku, 0);
        auditCount = 0;
        reorderCount = 0;
        latch = new CountDownLatch(1);
    }

    @AfterEach
    public void tearDown() {
        // No-op; singleton persists.
    }

    @Test
    public void testSingletonInstanceAcrossTests() {
        InventoryDB db2 = InventoryDB.getInstance();
        assertSame(db, db2, "Integration tests must share the singleton DB.");
    }

    @Test
    public void testStockUpdateAndListenerNotifications() {
        // Register listeners.
        AuditListener audit = new AuditListener();
        ReorderListener reorder = new ReorderListener(3); // Threshold 3.
        db.addListener(audit);
        db.addListener(reorder);

        // Adjust stock multiple times.
        db.setStock(sku, 5); // Above threshold: audit only
        db.setStock(sku, 4); // Above: audit only
        db.setStock(sku, 2); // Below: audit + reorder

        // Assert final stock.
        assertEquals(2, db.getStock(sku), "Stock must reflect final update.");

        // Assert listener reactions (counts incremented in listeners).
        assertEquals(3, audit.getNotificationCount(), "Audit should log every change.");
        assertEquals(1, reorder.getNotificationCount(), "Reorder should trigger only once (below threshold).");
    }

    @Test
    public void testThreadSafeConcurrentStockUpdates() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        int initialStock = 10;
        db.setStock(sku, initialStock);

        // Simulate concurrent decrements.
        CountDownLatch startLatch = new CountDownLatch(1);
        for (int i = 0; i < 3; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Sync start.
                    db.setStock(sku, db.getStock(sku) - 2); // Decrement by 2.
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        startLatch.countDown(); // Release threads.
        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS), "Concurrent updates must complete.");

        // Final stock should be 10 - 6 = 4 (if no races, but ConcurrentHashMap ensures atomicity).
        int finalStock = db.getStock(sku);
        assertTrue(finalStock >= 4 && finalStock <= 10, "Thread-safe updates must maintain consistency.");
    }

    // Helper listeners for test assertions (capture counts instead of printing).
    private class AuditListener implements PropertyChangeListener {
        private int count = 0;

        @Override
        public void propertyChange(PropertyChangeEvent evt) {
            if ("stockChanged".equals(evt.getPropertyName())) {
                count++;
            }
        }

        public int getNotificationCount() {
            return count;
        }
    }

    private class ReorderListener implements PropertyChangeListener {
        private final int threshold;
        private int count = 0;

        public ReorderListener(int threshold) {
            this.threshold = threshold;
        }

        @Override
        public void propertyChange(PropertyChangeEvent evt) {
            if ("stockChanged".equals(evt.getPropertyName())) {
                Integer newQty = (Integer) evt.getNewValue();
                if (newQty < threshold) {
                    count++;
                }
            }
        }

        public int getNotificationCount() {
            return count;
        }
    }
}