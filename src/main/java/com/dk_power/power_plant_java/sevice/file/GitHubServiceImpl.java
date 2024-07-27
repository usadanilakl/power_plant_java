package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.IOUtils;
import org.kohsuke.github.GHContentUpdateResponse;
import org.kohsuke.github.GitHub;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GitHubServiceImpl implements GitHubSrvice{
    private final GitHub gitHub;
    @Override
    public void uploadFiletoGitHub(FileDto file, String path) {
        try {
            byte[] bytes = IOUtils.toByteArray(file.getFile().getInputStream());
            String encodedContent = Base64.getEncoder().encodeToString(bytes);
            GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                    .getRepository("power_plant_java")
                    .createContent(encodedContent, "automated file upload", path + "/" + file.getFile().getOriginalFilename());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void uploadFilesToGitHub(List<FileDto> files, String path) {

    }
}
