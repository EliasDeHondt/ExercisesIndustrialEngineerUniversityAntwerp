// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.Database.Presence;

public final class AbsentState implements PresenceState {
    @Override
    public boolean canCheckIn() {
        return true;
    }

    @Override
    public boolean canCheckOut() {
        return false;
    }

    @Override
    public PresenceState onCheckIn() {
        return new PresentState();
    }

    @Override
    public PresenceState onCheckOut() {
        return this;
    }
}