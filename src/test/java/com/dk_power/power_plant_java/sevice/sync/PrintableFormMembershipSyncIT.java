package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.forms.PrintableFormService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Membership sync for {@code PrintableForm.formContainers}.
 *
 * <p>The collection is a unidirectional {@code @OneToMany @JoinColumn}, so adding a container
 * writes only the CHILD row. The parent is never dirtied, {@code @PreUpdate} never fires, and the
 * membership change emits no {@link FieldChange} — while the container's own CREATE cannot carry
 * the FK, because {@code printable_form_id} has no Java field on {@link FormContainer}. Peers
 * therefore receive the container UNLINKED. That is the mechanism behind the orphaned-container
 * backlog (670 rows on one node, 490 from device 1 and 180 from device 3).
 *
 * <p>These tests pin the two fixes in this repo's half of the work:
 * <ul>
 *   <li>{@link PrintableFormService#addContainers} dirties the parent so the change emits;</li>
 *   <li>{@code FieldSyncService.isProtectedAggregateMembershipField} makes the apply path additive
 *       so a stale or partial payload cannot detach a peer's container.</li>
 * </ul>
 *
 * <p>The concurrent-add case is {@code @Disabled} — it additionally needs the LWW bypass in
 * {@code shouldApplyChange}, which is owned by the sync agent. See
 * {@code project/features/permits/printable-forms/SYNC-HANDOFF.md}.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:printable-form-membership-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("PrintableForm.formContainers membership sync")
@Transactional
@Rollback(false)
class PrintableFormMembershipSyncIT {

    @Autowired private PrintableFormRepo printableFormRepo;
    @Autowired private FormContainerRepo formContainerRepo;
    @Autowired private PrintableFormService printableFormService;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private EntityManager em;

    // Boot-only mocks: RedTagAutomationService's constructor inits SikuliX, which throws in a headless
    // CI/test environment ("running in headless environment") and fails the whole ApplicationContext load;
    // the GitHub publisher would hit the network on save. Mirrors BisectOnRollbackIT / LotoBoxOneToOneMoveSyncIT.
    @org.springframework.boot.test.mock.mockito.MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @org.springframework.boot.test.mock.mockito.MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private PrintableForm newForm(String name) {
        PrintableForm form = new PrintableForm();
        form.setName(name);
        form.setFormType("MembershipIT");
        form.setIsPrimary(false);
        form.setSize(Map.of("width", 8.5, "height", 11));
        return printableFormRepo.save(form);
    }

    private FormContainer newContainer(String content) {
        FormContainer c = new FormContainer();
        c.setContentType("text");
        c.setContentJson(content);
        c.setPositionJson(Map.of("x", 10, "y", 10));
        c.setSizeJson(Map.of("width", 100, "height", 20));
        c.setPageNumber(1);
        return formContainerRepo.save(c);
    }

    /** printable_form_id has no Java field, so it is only observable via native SQL. */
    private Long parentIdOf(Long containerId) {
        Object v = em.createNativeQuery(
                        "SELECT printable_form_id FROM form_container WHERE id = :id")
                .setParameter("id", containerId)
                .getSingleResult();
        return v == null ? null : ((Number) v).longValue();
    }

    private List<FieldChange> membershipChanges(Long formId) {
        return fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("PrintableForm", formId)
                .stream()
                .filter(fc -> "formContainers".equals(fc.getFieldName()))
                .toList();
    }

    @Test
    @DisplayName("addContainers dirties the parent, so the membership change emits a FieldChange")
    void addContainersEmitsMembershipChange() {
        PrintableForm form = newForm("emits");
        FormContainer a = newContainer("A");
        em.flush();

        printableFormService.addContainers(form, List.of(a));
        em.flush();

        assertThat(parentIdOf(a.getId()))
                .as("container should be linked to the form")
                .isEqualTo(form.getId());
        assertThat(membershipChanges(form.getId()))
                .as("adding a container must emit a formContainers FieldChange, "
                        + "otherwise peers receive the container unlinked")
                .isNotEmpty();
    }

    @Test
    @org.junit.jupiter.api.Disabled("Behavior drifted: the naive add path now EMITS a formContainers "
            + "FieldChange, i.e. the orphaned-container bug this test characterized appears resolved by a "
            + "separate membership-emission change. Proven UNRELATED to the OneToOne apply fix (fails "
            + "identically with that change stashed; no other emission source is modified in the tree). It "
            + "was masked until 2026-09-03 because this class failed to load its ApplicationContext (headless "
            + "SikuliX in RedTagAutomationService, now @MockBean'd). Left disabled rather than flipping the "
            + "assertion: confirming the naive path fully re-links on peers (not just emits) is the "
            + "membership-emission owner's call — then delete this or assert emission.")
    @DisplayName("characterisation: the naive add path emits nothing (this is the bug)")
    void naiveAddEmitsNothing() {
        PrintableForm form = newForm("naive");
        FormContainer a = newContainer("A");
        em.flush();

        // Exactly what the controller used to do. The child FK is written, but the parent row is
        // untouched, so no lifecycle callback fires on PrintableForm.
        form.addFormContainer(a);
        printableFormRepo.save(form);
        em.flush();

        assertThat(parentIdOf(a.getId()))
                .as("the FK is still written locally — the data is fine on THIS node")
                .isEqualTo(form.getId());
        assertThat(membershipChanges(form.getId()))
                .as("no FieldChange is emitted, which is why the container arrives orphaned on peers")
                .isEmpty();
    }

    @Test
    @DisplayName("apply is additive: a partial payload must not detach an existing container")
    void applyDoesNotDetachContainersMissingFromPayload() {
        PrintableForm form = newForm("additive");
        FormContainer a = newContainer("A");
        FormContainer b = newContainer("B");
        printableFormService.addContainers(form, List.of(a, b));
        em.flush();
        em.clear();

        // A peer that only knows about A sends its full post-mutation id set — which omits B.
        // Without the protected-aggregate guard this NULLs every child FK before re-pointing,
        // silently detaching B.
        FieldChange stale = new FieldChange(
                "PrintableForm", form.getId(), "formContainers",
                null, "[" + a.getId() + "]",
                "peer-machine", "peer", FieldChange.ChangeType.UPDATE);
        stale.setRelationshipType("OneToMany");

        fieldSyncService.applyIncomingChanges(List.of(stale));
        em.flush();
        em.clear();

        assertThat(parentIdOf(a.getId())).isEqualTo(form.getId());
        assertThat(parentIdOf(b.getId()))
                .as("B is absent from the payload but must keep its link — membership is grow-only")
                .isEqualTo(form.getId());
    }

    @Test
    @Disabled("Needs the OneToMany LWW bypass in FieldSyncService.shouldApplyChange, owned by the "
            + "sync agent. Without it, batchFetchLatestChanges collapses both concurrent changes "
            + "to a single winner and the loser's container stays unlinked. See SYNC-HANDOFF.md.")
    @DisplayName("acceptance criterion 3: two nodes adding different containers both converge")
    void concurrentAddsFromTwoNodesBothSurvive() {
        PrintableForm form = newForm("concurrent");
        FormContainer base = newContainer("base");
        printableFormService.addContainers(form, List.of(base));
        em.flush();

        FormContainer fromA = newContainer("added-by-A");
        FormContainer fromB = newContainer("added-by-B");
        em.flush();
        em.clear();

        // Node A saw {base, fromA}; node B saw {base, fromB}. Neither saw the other's container.
        FieldChange changeA = new FieldChange(
                "PrintableForm", form.getId(), "formContainers",
                null, "[" + base.getId() + "," + fromA.getId() + "]",
                "machine-A", "A", FieldChange.ChangeType.UPDATE);
        changeA.setRelationshipType("OneToMany");
        FieldChange changeB = new FieldChange(
                "PrintableForm", form.getId(), "formContainers",
                null, "[" + base.getId() + "," + fromB.getId() + "]",
                "machine-B", "B", FieldChange.ChangeType.UPDATE);
        changeB.setRelationshipType("OneToMany");

        fieldSyncService.applyIncomingChanges(List.of(changeA, changeB));
        em.flush();
        em.clear();

        assertThat(parentIdOf(base.getId())).isEqualTo(form.getId());
        assertThat(parentIdOf(fromA.getId()))
                .as("A's container must survive B's concurrent change")
                .isEqualTo(form.getId());
        assertThat(parentIdOf(fromB.getId()))
                .as("B's container must survive A's concurrent change")
                .isEqualTo(form.getId());
    }
}
