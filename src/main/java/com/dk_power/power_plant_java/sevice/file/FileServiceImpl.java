package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_transfer.PidJson;
import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@Transactional
public class FileServiceImpl implements FileService {
    private final FileRepo fileRepo;
    private final LotoPointService lotoPointService;
    private final FileMapper fileMapper;
    private final SessionFactory sessionFactory;
    private final CategoryService categoryService;
    private final ValueService valueService;
    private final FileUploaderService fileUploaderService;
    private final EquipmentService equipmentService;
    private final HtPanelService htPanelService;
    private final ElectricalPanelService electricalPanelService;
    private final HtBreakerService htBreakerService;
    private final ExcelReaderService excelReaderService;
    private final DataDistributionService dataDistributionService;

    public FileServiceImpl(FileRepo fileRepo, LotoPointService lotoPointService, FileMapper fileMapper, SessionFactory sessionFactory, CategoryService categoryService, ValueService valueService, FileUploaderService fileUploaderService, @Lazy EquipmentService equipmentService, HtPanelService htPanelService, ElectricalPanelService electricalPanelService, HtBreakerService htBreakerService, ExcelReaderService excelReaderService, DataDistributionService dataDistributionService) {
        this.fileRepo = fileRepo;
        this.lotoPointService = lotoPointService;
        this.fileMapper = fileMapper;
        this.sessionFactory = sessionFactory;
        this.categoryService = categoryService;
        this.valueService = valueService;
        this.fileUploaderService = fileUploaderService;
        this.equipmentService = equipmentService;
        this.htPanelService = htPanelService;
        this.electricalPanelService = electricalPanelService;
        this.htBreakerService = htBreakerService;
        this.excelReaderService = excelReaderService;
        this.dataDistributionService = dataDistributionService;
    }


    public List<String> getVendors() {
        return fileRepo.getVendors();
    }
    public List<FileObject> getFilesByVendor(String value) {
        return fileRepo.findByVendor(value);
    }

    @Override
    public void createFileObjectsFromFolder(String path, String type, String extension, String vendor) {
        String root = System.getProperty("user.dir").replaceAll("\\\\","/");
        path =root+"/" +path+"/"+extension+"/"+type+"/"+vendor;
        System.out.println(path);
        File[] listOfFiles = fileUploaderService.getListOfFiles(path);
        for (File file : listOfFiles) {
            String fileNumber = null;
            if(file.getName().contains(extension)) fileNumber = file.getName().substring(0,file.getName().indexOf(extension)-1);
            FileObject f = getFileByNumber(fileNumber);
            if(f==null && file.getName().contains(extension)){
                f = new FileObject();
                f.setBaseLink("uploads");
                f.setExtension(extension);
                f.setFileType(valueService.valueSetup("FileType",type));
                f.setVendor(valueService.valueSetup("Vendor",vendor));
                f.setFileNumber(fileNumber);
                System.out.println(f.getFileNumber());
                f.buildFileLink("jpg");
                f.buildFolder();
                save(f);
            }else{
//                throw new RuntimeException("File with this name already exists");
                System.out.println("Skipped: " + file.getName());
            }
        }
    }

    @Override
    public void createFileObjectsFromFolder(String path, String type, String extension, String vendor, String system) {
        path = path+"/"+extension+"/"+type+"/"+vendor+"/";
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
                f.setFileNumber(file.getName().substring(0,file.getName().indexOf(extension)-1));
                System.out.println(f.getFileNumber());
                save(f);
            }else{
                throw new RuntimeException("File with this name already exists");
            }
        }
    }

    @Override
    public void createObjectsFromDirectoryUsingMetaDataExcel(String folder, String type, String extension, String vendor,String system) {
        String root = System.getProperty("user.dir").replaceAll("\\\\","/");
        folder =root+"/" +folder+"/"+extension+"/"+type+"/"+vendor;
        File[] listOfFiles = fileUploaderService.getListOfFiles(folder);
        File excel = Arrays.stream(listOfFiles).filter(e->e.getName().contains(".xl")).findFirst().orElse(null);
        List<Map<String, String>> metadata = null;
        if(excel!=null)metadata = excelReaderService.readExcelFile(folder + "/" + excel.getName());

        for (File file : listOfFiles) {
            String fileNumber = null;
            if(file.getName().contains(extension)) fileNumber = file.getName().substring(0,file.getName().indexOf(extension)-1);
            FileObject f = getFileByNumber(fileNumber);
            if(f==null && file.getName().contains(extension)){
                f = new FileObject();
                f.setBaseLink("uploads");
                f.setExtension(extension);
                f.setFileType(valueService.valueSetup("FileType",type));
                f.setVendor(valueService.valueSetup("Vendor",vendor));
                f.setFileNumber(fileNumber);
                System.out.println(f.getFileNumber());
                f.buildFileLink("jpg");
                f.buildFolder();
                f.setRelatedSystems(system);

                if(metadata!=null){
                    Map<String, String> details = metadata.stream().filter(e -> file.getName().contains(e.get("Document No."))).findFirst().orElse(null);
                    if(details!=null){
                        f.setName(details.get("Title"));
                        f.setDocNum(details.get("VDN"));
                    }

                }

                save(f);
            }else{
//                throw new RuntimeException("File with this name already exists");
                System.out.println("Skipped: " + file.getName());
            }
        }

    }
    public void addDocNumToPIDs(){
        List<PidJson> pidJsons = dataDistributionService.getPidJsons();
        for (PidJson p : pidJsons) {
            String docNum = p.getPidNumber();
            FileObject fileByNumber = getFileByNumber(p.getFileNumber());
            if(fileByNumber!=null){
                fileByNumber.setDocNum(docNum);
                save(fileByNumber);
            }

        }
    }

    @Override
    public void updateMetadata(String folder, String type, String extension, String vendor,String system,boolean forceUpdate) {
        String root = System.getProperty("user.dir").replaceAll("\\\\","/");
        folder =root+"/" +folder+"/"+extension+"/"+type+"/"+vendor;
        File[] listOfFiles = fileUploaderService.getListOfFiles(folder);
        File excel = Arrays.stream(listOfFiles).filter(e->e.getName().contains(".xl")).findFirst().orElse(null);
        List<Map<String, String>> metadata = null;
        if(excel!=null)metadata = excelReaderService.readExcelFile(folder + "/" + excel.getName());

        for (File file : listOfFiles) {
            String fileNumber = null;
            if (file.getName().contains(extension)) fileNumber = file.getName().substring(0, file.getName().indexOf(extension) - 1);
            FileObject f = getFileByNumber(fileNumber);
            if (f == null && file.getName().contains(extension)) {
                f = new FileObject();
                f.setBaseLink("uploads");
                f.setExtension(extension);
                f.setFileType(valueService.valueSetup("FileType", type));
                f.setVendor(valueService.valueSetup("Vendor", vendor));
                f.setFileNumber(fileNumber);
                System.out.println(f.getFileNumber());
                f.buildFileLink("jpg");
                f.buildFolder();
                f.setRelatedSystems(system);

                if (metadata != null) {
                    Map<String, String> details = metadata.stream().filter(e -> file.getName().contains(e.get("Document No."))).findFirst().orElse(null);
                    if (details != null) {
                        f.setName(details.get("Title"));
                        f.setDocNum(details.get("VDN"));
                    }
                }

                save(f);
            } else if (f != null && file.getName().contains(extension) && metadata!=null) {
                Map<String, String> details = metadata.stream().filter(e -> file.getName().contains(e.get("Document No."))).findFirst().orElse(null);
                    if (details != null) {
                        if(f.getName()==null) f.setName(details.get("Title"));
                        if(forceUpdate) f.setName(details.get("Title"));
                        if(f.getDocNum()==null) f.setDocNum(details.get("VDN"));
                        save(f);
                    }
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
                    System.out.println(map.get("Description"));
                    System.out.println(map.get("Eq"));
                    int n = 1;
                    for(LotoPoint el : e.getLotoPoints()){
                        map.put("LP-"+(n++), el.getTagNumber()+", "+el.getSpecificLocation()+", "+el.getIsoPos().getName()+"/"+el.getNormPos().getName()+", "+el.getDescription());
                        System.out.println(map.get("LP-"+(n-1)));
                    }
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

    @Override
    public FileDto copyFromAnotherUnit(String sourceId, String destinationId) {
        FileObject sourceFile = getEntityById(sourceId);
        FileObject destinationFile = getEntityById(destinationId);

        System.out.println("sourceFile.getRelatedSystems() = " + sourceFile.getRelatedSystems());
        System.out.println("destinationFile.getRelatedSystems() = " + destinationFile.getRelatedSystems());

        List<Equipment> sourceFilePoints = sourceFile.getPoints();
        List<Equipment> destinationFilePoints = destinationFile.getPoints();

        for (Equipment p : sourceFilePoints) {
            Equipment equipment = equipmentService.copyEqFromAnotherUnit(p);
            if(equipment!=null){
                equipment.setMainFile(destinationFile);
                destinationFilePoints.add(equipment);
            }
        }
        FileObject ready = save(destinationFile);
        System.out.println("ready.getRelatedSystems() = " + ready.getRelatedSystems());
        return convertToDto(destinationFile);
    }

    @Override
    public List<FileObject> getCompletedFull() {
        return fileRepo.findByCompletedIsTrue();
    }

    @Override
    public FileObject getFileByEqId(Long id) {
        FileObject mainFile = equipmentService.getEntityById(id).getMainFile();
        return mainFile;
    }

    @Override
    public List<String> getHtPanels() {
        return htPanelService.getAll().stream().map(BaseElectricalPanel::getTagNumber).toList();
    }

    @Override
    public List<String> getElPanels() {
        return electricalPanelService.getAll().stream().map(e->e.getTagNumber()).toList();
    }

    @Override
    public List<HtBreakerDto> getHtBrakersByPanelTag(String panelTag) {
        HtPanel byTagNumber = htPanelService.getByTagNumber(panelTag);
        return byTagNumber.getHtBreakers().stream().map(e->htBreakerService.convertToDto(e)).toList();
    }

    @Override
    public List<FileObject> getIfRelatedSystemsContains(String system) {
        return fileRepo.findByRelatedSystemsContaining(system);
    }

    @Override
    public void updateFileRelatedSystems() {
        for (FileObject f : getAll()) {
            f.getPoints().forEach(e->{
                String system = e.getSystem()!=null ? e.getSystem().getName().trim():null;
                if(f.getRelatedSystems()==null && system!=null) f.setRelatedSystems(system);
                else if(system!=null && !f.getRelatedSystems().contains(system)) f.setRelatedSystems(system);
            });
            if(f.getRelatedSystems()!=null){
                System.out.println(f.getFileNumber()+" - "+f.getRelatedSystems());
                System.out.println("++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            }
            save(f);
        }
    }

    public List<FileDto> getAllDtos(String ext) {
        return getAll().stream().map(e->fileMapper.convertToDto(e,ext)).toList();
    }
    public List<FileDto> getAllDtos() {
        return getAll().stream().map(fileMapper::convertToDto).toList();
    }
    public List<String> getSystems() {
        return categoryService.getSystems().stream().map(ValueDto::getName).toList();
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

    @Override
    public List<FileObject> getIfNameContains(String tag) {
        return fileRepo.findByNameContaining(tag);
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
