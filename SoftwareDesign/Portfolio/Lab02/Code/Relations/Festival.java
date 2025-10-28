// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Festival {
    private final String name;
    private final Program program;
    private final List<Venue> venues = new ArrayList<>();

    public Festival(String name) {
        this.name = name;
        this.program = new Program();
    }

    public String getName() {
        return name;
    }

    public Program getProgram() {
        return program;
    }

    public void registerVenue(Venue v) {
        if (v != null && !venues.contains(v)) venues.add(v);
    }

    public List<Venue> getVenues() {
        return Collections.unmodifiableList(venues);
    }
}
