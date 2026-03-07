package com.dk_power.power_plant_java.sevice.forms;

import com.dk_power.power_plant_java.dto.forms.PrintableFormDto;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.mappers.forms.PrintableFormMapper;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (form.getIsPrimary()) resetPrimary(form);
        return printableFormRepo.save(form);
    }

    private void resetPrimary(PrintableForm form) {
        List<PrintableForm> formsToUpdate = printableFormRepo.findAllByFormType(form.getFormType());
        formsToUpdate.forEach(f -> f.setIsPrimary(false));
        printableFormRepo.saveAll(formsToUpdate);
        form.setIsPrimary(true);
    }
}
