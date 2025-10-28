// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Program {
    private final List<Screening> screenings = new ArrayList<>();

    Program() {
    }

    public Screening schedule(Work work, Venue venue, LocalDateTime start, int capacity) {
        if (work == null || venue == null || start == null) throw new IllegalArgumentException();
        if (capacity <= 0 || capacity > venue.getCapacity()) throw new IllegalArgumentException("capacity");
        Screening s = new Screening(this, work, venue, start, capacity); // passes top-level Program
        screenings.add(s);
        return s;
    }

    public List<Screening> getScreenings() {
        return Collections.unmodifiableList(screenings);
    }
}