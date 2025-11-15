// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.Database.Presence;

public final class PresentState implements PresenceState {
    @Override
    public boolean canCheckIn() {
        return false;
    }

    @Override
    public boolean canCheckOut() {
        return true;
    }

    @Override
    public PresenceState onCheckIn() {
        return this;
    }

    @Override
    public PresenceState onCheckOut() {
        return new AbsentState();
    }
}