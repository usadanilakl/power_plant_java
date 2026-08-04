package com.dk_power.power_plant_java.sevice.forms;

import com.dk_power.power_plant_java.dto.forms.PrintableFormDto;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.mappers.forms.PrintableFormMapper;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PrintableFormService implements NgCrudService<PrintableForm, PrintableFormDto, PrintableFormRepo, PrintableFormMapper> {
    private final PrintableFormRepo printableFormRepo;
    private final PrintableFormMapper printableFormMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public PrintableFormRepo getRepo() {
        return printableFormRepo;
    }

    @Override
    public PrintableFormMapper getMapper() {
        return printableFormMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public PrintableFormDto getDto() {
        return new PrintableFormDto();
    }

    @Override
    public PrintableForm getEntity() {
        return new PrintableForm();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<PrintableForm> getEntityClass() {
        return PrintableForm.class;
    }

    public PrintableForm save(PrintableForm form) {
        if (form == null) throw new IllegalArgumentException("Form cannot be null");
        if (Boolean.TRUE.equals(form.getIsPrimary())) resetPrimary(form);
        return printableFormRepo.save(form);
    }

    /**
     * Add containers to a form and persist the membership change so that it SYNCS.
     *
     * <p>{@code formContainers} is a unidirectional {@code @OneToMany @JoinColumn}, so adding a
     * container writes only the CHILD row ({@code UPDATE form_container SET printable_form_id=?}).
     * The parent row is untouched, Hibernate never marks it dirty, {@code @PreUpdate} never fires,
     * and {@code FieldChangeEntityListener} therefore emits nothing for the membership change.
     * The container's own CREATE cannot carry the FK either — {@code printable_form_id} has no
     * Java field on {@code FormContainer} — so peers receive the container UNLINKED. That is the
     * mechanism behind the orphaned-container backlog.
     *
     * <p>Touching {@code dateModified} dirties the parent, which makes the listener capture and
     * emit the collection. Removal does not need this: a deleted container emits its own DELETE.
     */
    public PrintableForm addContainers(PrintableForm form, Collection<FormContainer> containers) {
        if (form == null) throw new IllegalArgumentException("Form cannot be null");
        if (containers == null || containers.isEmpty()) return form;
        containers.forEach(form::addFormContainer);
        form.setDateModified(LocalDateTime.now());
        return printableFormRepo.save(form);
    }

    private void resetPrimary(PrintableForm form) {
        List<PrintableForm> formsToUpdate = printableFormRepo.findAllByFormType(form.getFormType());
        formsToUpdate.forEach(f -> f.setIsPrimary(false));
        printableFormRepo.saveAll(formsToUpdate);
        form.setIsPrimary(true);
    }
}
