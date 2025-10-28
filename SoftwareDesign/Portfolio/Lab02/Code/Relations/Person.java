// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;

public abstract class Person {
    private final String name;

    protected Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}