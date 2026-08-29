package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Geometry guard for the seeded paper forms.
 *
 * <p>Two production bugs motivated this, both of which shipped looking fine and were only caught by
 * an operator trying to fill the form in:
 *
 * <ol>
 *   <li><b>Unreachable fields.</b> {@code PrintableForm.formContainers} is a {@code HashSet}, so
 *       the order containers reach the browser is arbitrary rather than the order they were
 *       created in. Without an explicit z-index the renderer stacks by DOM order, and a
 *       section-wrapping box could land on top of the fields it surrounds and swallow every click
 *       inside it. Values still rendered, so the form looked correct in a screenshot while half of
 *       it was dead.</li>
 *   <li><b>Silent overflow.</b> A section whose contents ran past its own box pushed widgets under
 *       the next section — how the Safe Work "GFCI" tick ended up beneath Special Instructions.</li>
 * </ol>
 *
 * <p>The layout methods take a bare {@code PrintableForm} and touch no collaborator, so they are
 * driven reflectively against a seeder built with null dependencies — no Spring context needed.
 */
class PermitFormLayoutTest {

    /** Designer page: 7.7 x 10.15in at 96dpi — the Confined Space and Safe Work rebuilds. */
    private static final double[] DESIGNER = {739, 974};
    /** Letter at 96dpi — the forms seeded before the designer geometry was adopted. */
    private static final double[] LETTER = {816, 1056};

    private record Box(String label, double x, double y, double w, double h, int z, boolean field) {
        boolean covers(double px, double py) {
            return px >= x && px <= x + w && py >= y && py <= y + h;
        }
    }

    static Stream<Arguments> pages() {
        return Stream.of(
                Arguments.of("ConfinedSpace page 1", "csPage1", new Object[]{Boolean.FALSE}, DESIGNER),
                Arguments.of("ConfinedSpace page 2", "csPage2", new Object[]{Boolean.FALSE}, DESIGNER),
                Arguments.of("Reclassified page 1", "csPage1", new Object[]{Boolean.TRUE}, DESIGNER),
                Arguments.of("Reclassified page 2", "csPage2", new Object[]{Boolean.TRUE}, DESIGNER),
                Arguments.of("SafeWork page 1", "swPage1", new Object[]{}, DESIGNER),
                Arguments.of("SafeWork page 2", "swPage2", new Object[]{}, DESIGNER),
                Arguments.of("HotWork page 1", "seedHotWorkPage1", new Object[]{}, LETTER),
                Arguments.of("HotWork page 2", "seedHotWorkPage2", new Object[]{}, LETTER));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("pages")
    @DisplayName("every field is inside the page and reachable by a click at its centre")
    void layoutIsSound(String name, String method, Object[] args, double[] page) throws Exception {
        List<Box> boxes = build(method, args);

        assertThat(boxes)
                .as("%s emitted no containers - the layout method did not run", name)
                .isNotEmpty();

        for (Box b : boxes) {
            assertThat(b.z())
                    .as("%s: container %s has no z-index; stacking would fall back to the arbitrary "
                            + "HashSet order and could bury a field", name, b.label())
                    .isPositive();
            assertThat(b.x() + b.w())
                    .as("%s: container %s runs past the right edge of the page", name, b.label())
                    .isLessThanOrEqualTo(page[0]);
            assertThat(b.y() + b.h())
                    .as("%s: container %s runs past the bottom of the page", name, b.label())
                    .isLessThanOrEqualTo(page[1]);
        }

        // The browser delivers a click to the top-most container covering the point, so a field is
        // only usable if nothing with a higher z-index covers its centre.
        for (Box b : boxes) {
            if (!b.field()) continue;
            double cx = b.x() + b.w() / 2;
            double cy = b.y() + b.h() / 2;
            Box top = b;
            for (Box other : boxes) {
                if (other != b && other.covers(cx, cy) && other.z() > top.z()) top = other;
            }
            assertThat(top)
                    .as("%s: field '%s' (z=%d) is covered at its centre by '%s' (z=%d), so it "
                            + "renders its value but cannot be clicked or typed into",
                            name, b.label(), b.z(), top.label(), top.z())
                    .isSameAs(b);
        }
    }

    private List<Box> build(String method, Object[] args) throws Exception {
        Constructor<?> ctor = PermitFormSeeder.class.getDeclaredConstructors()[0];
        ctor.setAccessible(true);
        PermitFormSeeder seeder = (PermitFormSeeder) ctor.newInstance(new Object[ctor.getParameterCount()]);

        // seedForm() normally resets this; the layout methods are called directly here.
        Field z = PermitFormSeeder.class.getDeclaredField("zOrder");
        z.setAccessible(true);
        z.setInt(seeder, 1);

        Class<?>[] sig = new Class<?>[args.length + 1];
        sig[0] = PrintableForm.class;
        for (int i = 0; i < args.length; i++) sig[i + 1] = boolean.class;
        Method m = PermitFormSeeder.class.getDeclaredMethod(method, sig);
        m.setAccessible(true);

        PrintableForm form = new PrintableForm();
        Object[] call = new Object[args.length + 1];
        call[0] = form;
        System.arraycopy(args, 0, call, 1, args.length);
        m.invoke(seeder, call);

        List<Box> boxes = new ArrayList<>();
        for (FormContainer c : form.getFormContainers()) {
            Object zv = c.getStyleJson() == null ? null : c.getStyleJson().get("zIndex");
            boolean isField = "formField".equals(c.getContentType());
            String label = isField && c.getContentJson() instanceof Map<?, ?> content
                    ? String.valueOf(content.get("name"))
                    : "text:" + c.getContentJson();
            boxes.add(new Box(label,
                    num(c.getPositionJson().get("x")), num(c.getPositionJson().get("y")),
                    num(c.getSizeJson().get("width")), num(c.getSizeJson().get("height")),
                    zv == null ? 0 : Integer.parseInt(zv.toString()),
                    isField));
        }
        return boxes;
    }

    private static double num(Object o) {
        return ((Number) o).doubleValue();
    }
}
