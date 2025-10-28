// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;

public abstract class Work {
    private final String title;
    private final int runtimeMinutes;

    protected Work(String title, int runtimeMinutes) {
        this.title = title;
        this.runtimeMinutes = runtimeMinutes;
    }

    public String getTitle() {
        return title;
    }

    public int getRuntimeMinutes() {
        return runtimeMinutes;
    }
}