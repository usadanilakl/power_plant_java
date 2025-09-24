package com.dk_power.power_plant_java.sevice.forms;

import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PrintableFormService {
    private final PrintableFormRepo printableFormRepo;
    public PrintableForm save(PrintableForm form) {
        if (form == null) throw new IllegalArgumentException("Form cannot be null");
        if(form.getIsPrimary()) resetPrimary(form);
        return printableFormRepo.save(form);
    }

    private void resetPrimary(PrintableForm form) {
        List<PrintableForm> formsToUpdate = printableFormRepo.findAllByFormType("SafeWork");
        formsToUpdate.forEach(f -> f.setIsPrimary(false));
        printableFormRepo.saveAll(formsToUpdate);
        form.setIsPrimary(true);
    }
}
