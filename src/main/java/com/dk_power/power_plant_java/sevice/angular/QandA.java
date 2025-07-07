package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.util.FileUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QandA {
    @Value("${qa.directory}")
    private String qaDirectory;

    public List<Map<String,String>> getListOfFiles(){
        List<File> filesFromDirectory = FileUtil.getFilesFromDirectory(qaDirectory);
        return filesFromDirectory.stream().map(file -> {
            Map<String, String> map = new HashMap<>();
            map.put("name", file.getName());
            map.put("url", file.getAbsolutePath());
            return map;
        }).toList();
    }
}
