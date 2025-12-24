package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagNumberService {
    private final LotoPointRepo lotoPointRepo;
    private final LotoPointMapper lotoPointMapper;
    private final CategoryRepo categoryRepo;

    public List<LotoPointDto> getAllJgTagNumbers() {
        List<LotoPoint> all = lotoPointRepo.findByTagNumberContaining("-JG");
        return all.stream().map(lotoPointMapper::convertToDto).toList();
    }

    public String createNewTagNumber(String unit, String system, String eqType) {
        List<LotoPointDto> allJgTagNumbers = getAllJgTagNumbers();
        if (allJgTagNumbers == null || allJgTagNumbers.isEmpty()) {
            return (unit + "-" + eqType + "-" + system + "001-JG").toUpperCase();
        }

        // Filter tag numbers for the given unit, system, and equipment type
        String prefix = unit + "-" + eqType + "-" + system;
        List<String> matchingTags = allJgTagNumbers.stream()
                .map(LotoPointDto::getTagNumber)
                .filter(tag -> tag.startsWith(prefix))
                .sorted()
                .toList();

        if (matchingTags.isEmpty()) {
            return (prefix + "001-JG").toUpperCase();
        }

        // Find the highest number and increment it
        int highestNumber = matchingTags.stream()
                .mapToInt(tag -> {
                    String numberPart = tag.substring(prefix.length(), tag.length() - 3);
                    return Integer.parseInt(numberPart);
                })
                .max()
                .orElse(0);

        int nextNumber = highestNumber + 1;
        return String.format("%s%03d-JG", prefix, nextNumber).toUpperCase();
    }

    public String createNewTagNumber(Map<String, String> values) {
        return createNewTagNumber(values.get("unit"), values.get("system"), values.get("eqType"));
    }

    public String getSystemTagNumber(String tagNumber) {
        Set<Value> values = categoryRepo.findByAlias("system").getValues();
        Set<String> systems = values.stream().filter(v->v.getName()!=null).map(Value::getName).collect(Collectors.toSet());
        int index = -1;
        for (String system : systems) {
            index = tagNumber.indexOf(system);
        }
        if (index >= 0) {
            String cleanedTag = tagNumber.substring(index);
            int dashIndex = cleanedTag.indexOf("-");
            if(dashIndex!=-1)return cleanedTag.substring(index, dashIndex);
            else return cleanedTag.substring(index);
        }
        return null;
    }
}
