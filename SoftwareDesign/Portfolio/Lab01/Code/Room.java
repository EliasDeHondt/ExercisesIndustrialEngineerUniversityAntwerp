// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab01.Code;

import java.util.HashMap;

public class Room {
    private HashMap<Long, Boolean> bookSchedule;

    public Room() {
        bookSchedule = new HashMap<>();
    }

    public Boolean getBooking(long date) {
        return bookSchedule.getOrDefault(date, false);
    }

    public void setBooking(long date, boolean booking) {
        bookSchedule.put(date, booking);
    }
}