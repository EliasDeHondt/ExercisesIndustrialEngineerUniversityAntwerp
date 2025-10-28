// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

public class Screening {
    private final Program program;
    private final Work work;
    private final Venue venue;
    private final LocalDateTime startTime;
    private final int capacity;

    private final Set<Staff> crew = new HashSet<>();
    private final List<Booking> bookings = new ArrayList<>();

    Screening(Program program, Work work, Venue venue, LocalDateTime startTime, int capacity) {
        this.program = Objects.requireNonNull(program);
        this.work = Objects.requireNonNull(work);
        this.venue = Objects.requireNonNull(venue);
        this.startTime = Objects.requireNonNull(startTime);
        if (capacity <= 0 || capacity > venue.getCapacity()) throw new IllegalArgumentException("capacity");
        this.capacity = capacity;
    }

    public Program getProgram() {
        return program;
    }

    public Work getWork() {
        return work;
    }

    public Venue getVenue() {
        return venue;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public int getCapacity() {
        return capacity;
    }

    public void assign(Staff s) {
        if (s != null) crew.add(s);
    }

    public Set<Staff> getCrew() {
        return Collections.unmodifiableSet(crew);
    }

    public Booking book(Attendee a, String seatLabel, BigDecimal price) {
        if (a == null || seatLabel == null || price == null) throw new IllegalArgumentException();
        if (bookings.size() >= capacity) throw new IllegalStateException("full");
        Booking b = new Booking(a, this, seatLabel, price, LocalDateTime.now());
        bookings.add(b);
        a.addBooking(b);
        return b;
    }

    public List<Booking> getBookings() {
        return Collections.unmodifiableList(bookings);
    }
}