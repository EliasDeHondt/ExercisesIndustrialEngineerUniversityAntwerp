// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Test.Singleton;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class IdGeneratorTest {
    private IdGenerator generator;

    @BeforeEach
    public void setUp() {
        // Reset for each test by creating a new instance (in real scenarios, use reflection or a reset method if available).
        // For singleton testing, we verify instance equality instead.
        generator = IdGenerator.getInstance();
    }

    @AfterEach
    public void tearDown() {
        // No-op; singleton persists, but tests are isolated by design.
    }

    @Test
    public void testSingletonInstanceEquality() {
        IdGenerator instance1 = IdGenerator.getInstance();
        IdGenerator instance2 = IdGenerator.getInstance();
        Assertions.assertSame(instance1, instance2, "Singleton instances must be the same object.");
    }

    @Test
    public void testNextIdStartsAtOne() {
        Assertions.assertEquals(1L, generator.nextId(), "First ID should be 1.");
    }

    @Test
    public void testIdsAreMonotonicallyIncreasing() {
        long id1 = generator.nextId(); // 1
        long id2 = generator.nextId(); // 2
        long id3 = generator.nextId(); // 3
        Assertions.assertTrue(id2 > id1, "IDs must increase.");
        Assertions.assertTrue(id3 > id2, "IDs must increase.");
        Assertions.assertEquals(3L, id3, "Third ID should be 3.");
    }

    @Test
    public void testMultipleCallsFromDifferentThreadsShareCounter() {
        // Simple concurrency test: spawn threads to call nextId.
        Runnable incrementer = () -> generator.nextId();
        Thread[] threads = new Thread[5];
        for (int i = 0; i < 5; i++) {
            threads[i] = new Thread(incrementer);
            threads[i].start();
        }
        for (Thread t : threads) {
            try {
                t.join();
            } catch (InterruptedException e) {
                Assertions.fail("Thread interrupted unexpectedly.");
            }
        }
        // After 5 increments, next should be 6 (starting from 1).
        Assertions.assertEquals(6L, generator.nextId(), "Shared singleton counter must be thread-safe.");
    }
}