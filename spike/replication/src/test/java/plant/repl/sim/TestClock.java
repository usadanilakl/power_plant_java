package plant.repl.sim;

import java.util.function.LongSupplier;

/**
 * A physical clock the test drives directly.
 *
 * <p>Every node gets its own, so the simulator can create the condition that breaks
 * the current system: replicas whose wall clocks disagree, drift apart during a long
 * partition, or jump backwards after a restart or an NTP correction.
 *
 * <p>Real time is never read. The testing convention forbids it — a test that depends
 * on the wall clock cannot reproduce a skew bug on demand.
 */
public final class TestClock implements LongSupplier {

    private long millis;

    public TestClock(long startMillis) {
        this.millis = startMillis;
    }

    public void advance(long deltaMillis) {
        millis += deltaMillis;
    }

    /** Jump to an arbitrary time — NTP correction, restart with a wrong clock, drift. */
    public void jumpTo(long absoluteMillis) {
        millis = absoluteMillis;
    }

    @Override
    public long getAsLong() {
        return millis;
    }
}
