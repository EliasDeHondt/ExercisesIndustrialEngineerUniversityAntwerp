// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Glacier;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Config.AppConfig;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Gen.GlacierWorldGenerator;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Gen.WorldGenerator;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Level;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.LevelKit;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.PaletteBuilder;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.ThemedPaletteBuilder;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.CoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.MovementStrategy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.Glacier.GlacierCoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.Glacier.GlacierMovementStrategy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Box;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Player;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Glacier.*;

public final class GlacierKit extends LevelKit {
    @Override
    public RendererHints hints() {
        return () -> true;
    }

    private GlacierKit() {
    }

    public static LevelKit createLevelKit() {
        return Holder.INSTANCE;
    }

    private static final class Holder {
        static final LevelKit INSTANCE = new GlacierKit();
    }

    @Override
    public MovementStrategy movement() {
        return new GlacierMovementStrategy(this);
    }

    @Override
    public WorldGenerator generator() {
        return new GlacierWorldGenerator();
    }

    @Override
    public Level level() {
        return new GlacierLevel();
    }

    @Override
    public GroundTile floor() {
        return new GlacierFloor();
    }

    @Override
    public GroundTile wall() {
        return new GlacierWall();
    }

    @Override
    public GroundTile target() {
        return new GlacierTarget();
    }

    @Override
    public Box box() {
        return new GlacierBox();
    }

    @Override
    public Player player() {
        return new GlacierPlayer();
    }

    @Override
    public CoveragePolicy coverage() {
        return new GlacierCoveragePolicy();
    }

    @Override
    public PaletteBuilder paletteBuilder() {
        return new ThemedPaletteBuilder(AppConfig.get().themeGlacier);
    }
}