// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level;

public abstract class PaletteBuilder {
    public abstract void buildBackground();

    public abstract void buildFloor();

    public abstract void buildWall();

    public abstract void buildTarget();

    public abstract void buildPlayer();

    public abstract void buildBox();

    public abstract Palette build();
}