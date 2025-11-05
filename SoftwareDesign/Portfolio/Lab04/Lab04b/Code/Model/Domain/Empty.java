// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import javafx.scene.canvas.GraphicsContext;

public final class Empty extends Entity {

    private Empty() {
    }

    public static Empty instance() {
        return Holder.INSTANCE;
    }

    @Override
    public boolean isEmpty() {
        return true;
    }

    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s, boolean isTarget) {
        // NOOP
    }

    private static final class Holder {
        static final Empty INSTANCE = new Empty();
    }
}