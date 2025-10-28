// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Attendee extends Person {
    private final List<Booking> bookings = new ArrayList<>();

    public Attendee(String name) {
        super(name);
    }

    void addBooking(Booking b) {
        if (b != null && !bookings.contains(b)) bookings.add(b);
    }

    public List<Booking> getBookings() {
        return Collections.unmodifiableList(bookings);
    }
}