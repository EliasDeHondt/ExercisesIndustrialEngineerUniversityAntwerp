// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Singleton;

public class IdGenerator {
    private static final IdGenerator INSTANCE = new IdGenerator();
    private long counter = 0;

    private IdGenerator() {}

    public static IdGenerator getInstance() {
        return INSTANCE;
    }

    public long nextId() {
        return ++counter;
    }
}