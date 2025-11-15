// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code.Database.Presence;

public interface PresenceState {
    boolean canCheckIn();

    boolean canCheckOut();

    PresenceState onCheckIn();

    PresenceState onCheckOut();
}