package com.dk_power.power_plant_java.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class RenamedMultipartFile implements MultipartFile {
    private final MultipartFile delegate;
    private final String filename;

    public RenamedMultipartFile(MultipartFile delegate, String filename) {
        this.delegate = delegate;
        this.filename = filename;
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public String getOriginalFilename() {
        return filename;
    }

    @Override
    public String getContentType() {
        return delegate.getContentType();
    }

    @Override
    public boolean isEmpty() {
        return delegate.isEmpty();
    }

    @Override
    public long getSize() {
        return delegate.getSize();
    }

    @Override
    public byte[] getBytes() throws IOException {
        return delegate.getBytes();
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return delegate.getInputStream();
    }

    @Override
    public void transferTo(File dest) throws IOException, IllegalStateException {
        delegate.transferTo(dest);
    }

    // Implement other methods by delegating to the original MultipartFile
    // ...
}