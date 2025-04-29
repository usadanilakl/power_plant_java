package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrFileDto;
import com.dk_power.power_plant_java.mappers.browser.BrFileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrFileService {
    private final FileRepo fileRepo;
    private final BrFileMapper fileMapper;

    public List<BrFileDto> getAllFiles() {
        return fileMapper.toDtoAll(fileRepo.findAll());
    }

}
