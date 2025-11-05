// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level;

public final class PaletteDirector {
    public static Palette construct(PaletteBuilder b) {
        b.buildBackground();
        b.buildFloor();
        b.buildWall();
        b.buildTarget();
        b.buildPlayer();
        b.buildBox();
        return b.build();
    }
}