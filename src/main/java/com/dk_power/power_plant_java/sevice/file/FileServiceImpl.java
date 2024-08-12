package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import lombok.AllArgsConstructor;
import lombok.val;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@AllArgsConstructor
@Transactional
public class FileServiceImpl implements FileService {
    private final FileRepo fileRepo;
    private final LotoPointService lotoPointService;
    private final FileMapper fileMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
    private final ValueService valueService;
    private final FileUploaderService fileUploaderService;


    public List<String> getVendors() {
        return fileRepo.getVendors();
    }
    public List<FileObject> getFilesByVendor(String value) {
        return fileRepo.findByVendor(value);
    }

    @Override
    public void createFileObjectsFromFolder(String path, String type, String extension, String vendor) {
        File[] listOfFiles = fileUploaderService.getListOfFiles(path);
        for (File file : listOfFiles) {
            FileObject f = getFileByNumber(file.getName());
            if(f==null){
                f = new FileObject();
                f.setBaseLink("uploads");
                f.setExtension(extension);
                f.setFileType(valueService.valueSetup("FileType",type));
                f.setVendor(valueService.valueSetup("Vendor",vendor));
                f.setFileNumber(file.getName().replace(extension,""));
                save(f);
            }else{
                throw new RuntimeException("File with this name already exists");
            }
        }
    }

    @Override
    public void createFileObjectsFromFolder(String path, String type, String extension, String vendor, String system) {
        File[] listOfFiles = fileUploaderService.getListOfFiles(path);
        for (File file : listOfFiles) {
            FileObject f = getFileByNumber(file.getName());
            if(f==null){
                f = new FileObject();
                f.setBaseLink("uploads");
                f.setExtension(extension);
                f.setFileType(valueService.valueSetup("FileType",type));
                f.setVendor(valueService.valueSetup("Vendor",vendor));
                f.setSystem(valueService.valueSetup("System",system));
                f.setRelatedSystems(system);
                f.setFileNumber(file.getName());
                save(f);
            }else{
                throw new RuntimeException("File with this name already exists");
            }
        }
    }

    @Override
    public void createNewFile(FileDto file) {
        if(getFileByNumber(file.getFileNumber())==null){
            String name = file.getFile().getOriginalFilename();
            String baseLink = "/src/main/resources/static/";
            String folder = baseLink+file.getFolder()+"/";
            String baseDir = System.getProperty("user.dir") + folder;
            Path path = Paths.get(baseDir + name);
            try {
                Files.createDirectories(path.getParent());
                file.getFile().transferTo(path.toFile());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            save(file);
        }else{
            throw new RuntimeException("File with name: " + file.getFileNumber() + " already exists");
        }


    }

    @Override
    public void updateFile(FileDto file) {
        FileObject oldFile = getEntityById(file.getId());
        Path oldPath = Paths.get(System.getProperty("user.dir")+"/"+oldFile.getFileLink());
        oldFile.setFileNumber(oldFile.getFileNumber()+"deleted");
        Path newPath = Paths.get(System.getProperty("user.dir") + "/" + oldFile.getFileLink());
        //as an option, create oldFiles field in FileObject entity and concatenate file names that are deleted

        try {
            Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
            createNewFile(file);
        } catch (IOException e) {
            // Handle the exception
            e.printStackTrace();
        }

    }

    @Override
    public List<FileDtoLight> getCompletedPids() {
        return fileRepo.getAllCompletedLight();
    }

    @Override
    public List<FileDtoLight> getIncompletePids() {
        return fileRepo.getAllIncompleteLight();
    }

    @Override
    public List<Map<String, String>> verifyPid(String pid) {
            FileObject fileObject = getEntityById(pid);
            List<Map<String,String>> list = new ArrayList<>();
            fileObject.getPoints().forEach(e->{

                Map<String,String> map = new HashMap<>();
                try {
//                    System.out.println(e.getTagNumber());
//                    System.out.println(e.getLotoPoints().stream().map(el->el.getTagNumber()).toList());
//                    System.out.println(e.getLocation().getName());
//                    System.out.println(e.getSystem().getName());
//                    System.out.println("==================================================================");
                    map.put("Description","*******************************"+e.getDescription()+"***********************************");
                    map.put("Eq",e.getTagNumber()+", "+e.getLocation().getName() +", "+e.getSystem().getName()+", "+e.getEqType().getName());
                    e.getLotoPoints().forEach(el->{
                        map.put("LP", el.getTagNumber()+", "+el.getSpecificLocation()+", "+el.getIsoPos().getName()+"/"+el.getNormPos().getName()+", "+el.getDescription());
                    });
                    System.out.println(map.get("Description"));
                    System.out.println(map.get("Eq"));
                    System.out.println(map.get("LP"));
                    list.add(map);
                }catch (Exception ex){
                }
            });

            return list;
    }

    @Override
    public List<FileDto> getSkipped() {
        return fileRepo.findByBulkEditStep("skip").stream().map(this::convertToDto).toList();
    }

    public List<FileDto> getAllDtos(String ext) {
        return getAll().stream().map(e->fileMapper.convertToDto(e,ext)).toList();
    }
    public List<FileDto> getAllDtos() {
        return getAll().stream().map(fileMapper::convertToDto).toList();
    }
    public List<String> getSystems() {
        return fileRepo.getSystems();
    }
    public FileObject saveForTransfer(FileDto transfer){
        FileObject file = convertToEntity(transfer);
        if(file.getFileType()!=null)file.setFileType(valueService.valueSetup("File Type",transfer.getFileType().getName()));
        if(file.getVendor()!=null)file.setVendor(valueService.valueSetup("Vendor",file.getVendor().getName()));
        file.setBaseLink("uploads");
        file.setExtension("jpg");
        file.buildFileLink();
        return save(file);
    }

    @Override
    public List<FileDtoLight> getAllLight() {
        return fileRepo.getAllLight();
    }

    @Override
    public FileObject getByFileLink(String fileLink) {
        return fileRepo.findByFileLink(fileLink);
    }

    public List<FileObject> getIfNumberContains(String pid) {
        return fileRepo.findByFileNumberContaining(pid);
    }
    public FileObject getFileByNumber(String s) {
        return fileRepo.findByFileNumber(s);
    }
    @Override
    public FileObject getEntity() {
        return new FileObject();
    }
    @Override
    public FileDto getDto() {
        return new FileDto();
    }
    @Override
    public FileRepo getRepo() {
        return fileRepo;
    }
    @Override
    public FileMapper getMapper() {
        return fileMapper;
    }
    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public FileObject convertToEntity(FileDto dto) {
        return fileMapper.convertToEntity(dto);
    }

    @Override
    public FileDto convertToDto(FileObject entity) {
        return fileMapper.convertToDto(entity);
    }
    @Override
    public List<FileObject> getByVendor(Value oldVal) {
        return fileRepo.findByVendor(oldVal);
    }
    @Override
    public List<FileObject> getBySystem(Value oldVal) {
        return fileRepo.findBySystem(oldVal);
    }
    @Override
    public List<FileObject> getByFileType(Value oldVal) {
        return fileRepo.findByFileType(oldVal);
    }

    @Override
    public List<FileObject> getByValue(Value val) {
        List<FileObject> result = new ArrayList<>();
        String cat = val.getCategory().getAlias();
        if(cat.equals("vendor")) result.addAll(getByVendor(val));
        if(cat.equals("system")) result.addAll(getBySystem(val));
        if(cat.equals("fileType")) result.addAll(getByFileType(val));
        return result;
    }

    @Override
    public void refactor(Value old, Value _new) {
        String cat = old.getCategory().getAlias();
        for (FileObject f : getByValue(old)) {
            if(cat.equals("vendor"))f.setVendor(_new);
            if(cat.equals("system"))f.setSystem(_new);
            if(cat.equals("fileType"))f.setFileType(_new);
            save(f);
        }
    }
}
