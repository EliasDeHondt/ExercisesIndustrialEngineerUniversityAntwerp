// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Gen.WorldGenerator;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.CoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.MovementStrategy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Box;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Player;

public abstract class LevelKit {
    public String name() {
        return getClass().getSimpleName().replace("Kit", "");
    }

    public interface RendererHints {
        boolean showSelectionOverlay();
    }

    public Palette palette() {
        return PaletteDirector.construct(paletteBuilder());
    }

    public abstract MovementStrategy movement();

    public abstract WorldGenerator generator();

    public abstract RendererHints hints();

    public abstract Level level();

    public abstract GroundTile floor();

    public abstract GroundTile wall();

    public abstract GroundTile target();

    public abstract Box box();

    public abstract Player player();

    public abstract CoveragePolicy coverage();

    public abstract PaletteBuilder paletteBuilder();
}