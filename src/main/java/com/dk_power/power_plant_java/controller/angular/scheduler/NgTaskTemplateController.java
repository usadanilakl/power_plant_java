package com.dk_power.power_plant_java.controller.angular.scheduler;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.scheduler.TaskDto;
import com.dk_power.power_plant_java.dto.scheduler.TaskTemplateDto;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.enums.TaskLevel;
import com.dk_power.power_plant_java.enums.TaskType;
import com.dk_power.power_plant_java.mappers.scheduler.TaskMapper;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgFlowService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.NgTaskService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.TaskTemplateService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/ng/scheduler/task-templates")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class NgTaskTemplateController {
    private final TaskTemplateService templateService;
    private final ValueService valueService;
    private final NgFlowService flowService;
    private final NgTaskService taskService;
    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper;
    private final com.dk_power.power_plant_java.config.ProcedureTemplateSeeder procedureSeeder;

    @PostMapping("/seed-procedures")
    public ResponseEntity<NgApiResponse<List<String>>> seedProcedures() {
        try {
            List<String> created = procedureSeeder.seedAll();
            String msg = created.isEmpty() ? "All procedures already exist" : "Created: " + String.join(", ", created);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(created, msg));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<TaskTemplateDto>>> getAll() {
        try {
            List<TaskTemplateDto> templates = templateService.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(templates, "Templates retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> getById(@PathVariable Long id) {
        try {
            TaskTemplateDto dto = templateService.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(dto, "Template retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> create(@RequestBody TaskTemplateDto dto) {
        try {
            TaskTemplate template = new TaskTemplate();
            if (dto.getName() != null) template.setName(dto.getName());
            if (dto.getDescription() != null) template.setDescription(dto.getDescription());
            if (dto.getTaskType() != null) template.setTaskType(TaskType.valueOf(dto.getTaskType()));
            if (dto.getStepTemplatesJson() != null) template.setStepTemplatesJson(dto.getStepTemplatesJson());
            if (dto.getDefaultReferenceTypesJson() != null) template.setDefaultReferenceTypesJson(dto.getDefaultReferenceTypesJson());
            if (dto.getDefaultPriority() != null) template.setDefaultPriority(valueService.getEntityById(dto.getDefaultPriority().getId()));

            TaskTemplate saved = templateService.save(template);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> update(@PathVariable Long id, @RequestBody TaskTemplateDto dto) {
        try {
            TaskTemplate existing = templateService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();

            if (dto.getName() != null) existing.setName(dto.getName());
            if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
            if (dto.getTaskType() != null) existing.setTaskType(TaskType.valueOf(dto.getTaskType()));
            if (dto.getStepTemplatesJson() != null) existing.setStepTemplatesJson(dto.getStepTemplatesJson());
            if (dto.getDefaultReferenceTypesJson() != null) existing.setDefaultReferenceTypesJson(dto.getDefaultReferenceTypesJson());
            if (dto.getDefaultPriority() != null) existing.setDefaultPriority(valueService.getEntityById(dto.getDefaultPriority().getId()));

            TaskTemplate saved = templateService.save(existing);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/instantiate")
    public ResponseEntity<NgApiResponse<TaskDto>> instantiate(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            TaskTemplate template = templateService.getEntityById(id);
            if (template == null) return ResponseEntity.notFound().build();

            Long flowId = Long.valueOf(body.get("flowId").toString());
            Flow flow = flowService.getEntityById(flowId);
            if (flow == null) return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Flow not found"));

            // Create the parent task from template
            Task task = new Task();
            task.setName(template.getName());
            task.setDescription(template.getDescription());
            task.setTaskLevel(TaskLevel.TASK);
            task.setTaskType(template.getTaskType() != null ? template.getTaskType() : TaskType.ONE_TIME);
            task.setFlow(flow);
            task.setTemplate(template);
            if (template.getDefaultPriority() != null) task.setPriority(template.getDefaultPriority());
            Task savedTask = taskService.save(task);

            // Create steps from stepTemplatesJson with references and prerequisite chains
            if (template.getStepTemplatesJson() != null && !template.getStepTemplatesJson().isEmpty()) {
                List<Map<String, Object>> stepDefs = objectMapper.readValue(
                        template.getStepTemplatesJson(), new TypeReference<>() {});

                // First pass: create all steps, index by stepKey
                Map<String, Task> stepsByKey = new LinkedHashMap<>();
                Task previousStep = null;
                int order = 0;
                for (Map<String, Object> stepDef : stepDefs) {
                    Task step = new Task();
                    step.setName((String) stepDef.getOrDefault("name", "Step " + (order + 1)));
                    step.setDescription((String) stepDef.get("description"));
                    step.setWarning((String) stepDef.get("warning"));
                    step.setCaution((String) stepDef.get("caution"));
                    Object signoff = stepDef.get("requiresSignoff");
                    if (signoff != null) step.setRequiresSignoff(Boolean.valueOf(signoff.toString()));
                    Object duration = stepDef.get("expectedDurationMinutes");
                    if (duration != null) {
                        try { step.setExpectedDurationMinutes(Integer.valueOf(duration.toString())); }
                        catch (NumberFormatException ignored) {}
                    }
                    step.setTaskLevel(TaskLevel.STEP);
                    step.setTaskType(savedTask.getTaskType());
                    step.setFlow(flow);
                    step.setParentTask(savedTask);
                    step.setSortOrder(stepDef.containsKey("sortOrder") ?
                            Integer.valueOf(stepDef.get("sortOrder").toString()) : order);
                    Task savedStep = taskService.save(step);

                    String stepKey = (String) stepDef.getOrDefault("stepKey", "step-" + String.format("%03d", order + 1));
                    stepsByKey.put(stepKey, savedStep);
                    previousStep = savedStep;
                    order++;
                }

                // Second pass: wire prerequisites and copy references
                order = 0;
                List<Task> stepList = new ArrayList<>(stepsByKey.values());
                for (Map<String, Object> stepDef : stepDefs) {
                    String stepKey = (String) stepDef.getOrDefault("stepKey", "step-" + String.format("%03d", order + 1));
                    Task step = stepsByKey.get(stepKey);

                    // Prerequisites: explicit keys or sequential fallback
                    @SuppressWarnings("unchecked")
                    List<String> prereqKeys = (List<String>) stepDef.get("prerequisiteStepKeys");
                    if (prereqKeys != null && !prereqKeys.isEmpty()) {
                        for (String key : prereqKeys) {
                            Task prereq = stepsByKey.get(key);
                            if (prereq != null) step.addPrerequisite(prereq);
                        }
                    } else if (order > 0) {
                        // Default: sequential — each step depends on the previous
                        step.addPrerequisite(stepList.get(order - 1));
                    }

                    // Copy seeded references from template
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> refs = (List<Map<String, Object>>) stepDef.get("references");
                    if (refs != null) {
                        for (Map<String, Object> ref : refs) {
                            String refType = (String) ref.get("referenceType");
                            Object refIdObj = ref.get("referenceId");
                            if (refType != null && refIdObj != null) {
                                step.addReference(refType, Long.valueOf(refIdObj.toString()));
                            }
                        }
                    }

                    taskService.save(step);
                    order++;
                }
            }

            // Reload to get steps included
            Task reloaded = taskService.getEntityById(savedTask.getId());
            TaskDto result = taskMapper.convertToDto(reloaded);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Task created from template", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Import an Excel procedure file into a new TaskTemplate.
     * Expected format: first row is headers, subsequent rows are steps.
     * Auto-detects columns by header name (case-insensitive):
     *   Step/Number/# → sortOrder, Name/Action/Task → name,
     *   Description/Detail → description, Warning → warning,
     *   Caution → caution, Duration/Time/Minutes → expectedDurationMinutes,
     *   Signoff/Sign-off → requiresSignoff
     * Falls back: col 0 = step#, col 1 = name/description
     */
    @PostMapping("/import-excel")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> importExcel(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "templateName", required = false) String templateName) {
        try {
            org.apache.poi.ss.usermodel.Workbook wb = org.apache.poi.ss.usermodel.WorkbookFactory.create(file.getInputStream());
            org.apache.poi.ss.usermodel.Sheet sheet = wb.getSheetAt(0);

            // Read header row to map columns
            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = new LinkedHashMap<>();
            if (headerRow != null) {
                for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                    org.apache.poi.ss.usermodel.Cell cell = headerRow.getCell(c);
                    if (cell != null) {
                        String header = cell.toString().trim().toLowerCase();
                        colMap.put(header, c);
                    }
                }
            }

            // Resolve column indices
            int colStep = findCol(colMap, -1, "step", "number", "#", "no");
            int colName = findCol(colMap, -1, "name", "action", "task", "title");
            int colDesc = findCol(colMap, -1, "description", "detail", "details", "instructions");
            int colWarning = findCol(colMap, -1, "warning");
            int colCaution = findCol(colMap, -1, "caution");
            int colDuration = findCol(colMap, -1, "duration", "time", "minutes", "min");
            int colSignoff = findCol(colMap, -1, "signoff", "sign-off", "sign off", "approval");

            // If no name column found, fallback: col0=step#, col1=name/desc
            if (colName < 0 && colDesc < 0) {
                colName = colStep >= 0 ? (colStep == 0 ? 1 : 0) : 0;
            }

            // Parse steps
            List<Map<String, Object>> stepDefs = new ArrayList<>();
            int order = 0;
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(r);
                if (row == null) continue;

                String name = cellStr(row, colName);
                String desc = cellStr(row, colDesc);
                // Skip empty rows
                if ((name == null || name.isBlank()) && (desc == null || desc.isBlank())) continue;

                // Use the step number from the spreadsheet if available, otherwise row order
                int stepNum = order;
                String stepNumStr = cellStr(row, colStep);
                if (stepNumStr != null && !stepNumStr.isBlank()) {
                    try { stepNum = Integer.parseInt(stepNumStr.replaceAll("[^0-9]", "")) - 1; }
                    catch (NumberFormatException ignored) { /* keep row order */ }
                }

                Map<String, Object> step = new LinkedHashMap<>();
                step.put("stepKey", "step-" + String.format("%03d", stepNum + 1));
                step.put("name", name != null && !name.isBlank() ? name : ("Step " + (stepNum + 1)));
                step.put("description", desc != null ? desc : "");
                step.put("sortOrder", stepNum);
                step.put("prerequisiteStepKeys", List.of());
                step.put("references", List.of());

                String warning = cellStr(row, colWarning);
                if (warning != null && !warning.isBlank()) step.put("warning", warning);
                else step.put("warning", "");

                String caution = cellStr(row, colCaution);
                if (caution != null && !caution.isBlank()) step.put("caution", caution);
                else step.put("caution", "");

                String durStr = cellStr(row, colDuration);
                if (durStr != null && !durStr.isBlank()) {
                    try { step.put("expectedDurationMinutes", Integer.parseInt(durStr.replaceAll("[^0-9]", ""))); }
                    catch (NumberFormatException ignored) { step.put("expectedDurationMinutes", null); }
                } else {
                    step.put("expectedDurationMinutes", null);
                }

                String signoff = cellStr(row, colSignoff);
                step.put("requiresSignoff", signoff != null &&
                        (signoff.equalsIgnoreCase("yes") || signoff.equalsIgnoreCase("true") || signoff.equals("1")));

                stepDefs.add(step);
                order++;
            }
            wb.close();

            // Dedupe stepKeys — if spreadsheet has repeated step numbers, append suffix
            Set<String> usedKeys = new LinkedHashSet<>();
            for (Map<String, Object> step : stepDefs) {
                String key = (String) step.get("stepKey");
                if (usedKeys.contains(key)) {
                    int suffix = 2;
                    while (usedKeys.contains(key + "-" + suffix)) suffix++;
                    key = key + "-" + suffix;
                    step.put("stepKey", key);
                }
                usedKeys.add(key);
            }
            // Re-assign sortOrder sequentially after dedup to ensure consistency
            for (int i = 0; i < stepDefs.size(); i++) {
                stepDefs.get(i).put("sortOrder", i);
            }

            // Create template
            String tName = (templateName != null && !templateName.isBlank()) ? templateName
                    : file.getOriginalFilename().replaceAll("\\.[^.]+$", "");
            TaskTemplate template = new TaskTemplate();
            template.setName(tName);
            template.setDescription("Imported from " + file.getOriginalFilename());
            template.setTaskType(TaskType.RECURRING);
            template.setStepTemplatesJson(objectMapper.writeValueAsString(stepDefs));

            TaskTemplate saved = templateService.save(template);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Imported " + stepDefs.size() + " steps from Excel", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Import failed: " + e.getMessage()));
        }
    }

    private int findCol(Map<String, Integer> colMap, int defaultVal, String... candidates) {
        for (String candidate : candidates) {
            for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
                if (entry.getKey().contains(candidate)) return entry.getValue();
            }
        }
        return defaultVal;
    }

    private String cellStr(org.apache.poi.ss.usermodel.Row row, int col) {
        if (col < 0 || row == null) return null;
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
            return String.valueOf((int) cell.getNumericCellValue());
        }
        return cell.toString().trim();
    }

    /**
     * Import a Word (.docx) procedure document into a TaskTemplate.
     * Parsing strategy:
     *   1. Numbered list items (1. / 1) / Step 1:) become individual steps
     *   2. Non-numbered paragraphs after a step become its description
     *   3. Lines starting with WARNING/CAUTION (case-insensitive) set safety fields
     *   4. Table rows: if the doc uses a table, col0=step#, col1=action, col2+=description
     */
    @PostMapping("/import-word")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> importWord(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "templateName", required = false) String templateName) {
        try {
            org.apache.poi.xwpf.usermodel.XWPFDocument doc =
                    new org.apache.poi.xwpf.usermodel.XWPFDocument(file.getInputStream());

            List<Map<String, Object>> stepDefs = new ArrayList<>();

            // Strategy 1: Try tables first — many procedures use a table layout
            List<org.apache.poi.xwpf.usermodel.XWPFTable> tables = doc.getTables();
            if (!tables.isEmpty()) {
                for (org.apache.poi.xwpf.usermodel.XWPFTable table : tables) {
                    List<org.apache.poi.xwpf.usermodel.XWPFTableRow> rows = table.getRows();
                    // Skip header row
                    for (int r = 1; r < rows.size(); r++) {
                        List<org.apache.poi.xwpf.usermodel.XWPFTableCell> cells = rows.get(r).getTableCells();
                        if (cells.isEmpty()) continue;

                        String firstCell = cells.get(0).getText().trim();
                        if (firstCell.isBlank()) continue;

                        String name;
                        String desc = "";
                        // If first cell is a number, second cell is the action
                        if (firstCell.matches("\\d+\\.?")) {
                            name = cells.size() > 1 ? cells.get(1).getText().trim() : "Step " + firstCell;
                            desc = cells.size() > 2 ? cells.get(2).getText().trim() : "";
                        } else {
                            name = firstCell;
                            desc = cells.size() > 1 ? cells.get(1).getText().trim() : "";
                        }

                        Map<String, Object> step = buildStepDef(stepDefs.size(), name, desc);
                        // Check remaining cells for warning/caution
                        for (int c = (firstCell.matches("\\d+\\.?") ? 3 : 2); c < cells.size(); c++) {
                            String cellText = cells.get(c).getText().trim();
                            applyWarningCaution(step, cellText);
                        }
                        stepDefs.add(step);
                    }
                }
            }

            // Strategy 2: If no tables (or tables produced no steps), parse paragraphs
            if (stepDefs.isEmpty()) {
                Map<String, Object> currentStep = null;
                for (org.apache.poi.xwpf.usermodel.XWPFParagraph para : doc.getParagraphs()) {
                    String text = para.getText().trim();
                    if (text.isBlank()) continue;

                    // Check for numbered step pattern: "1." "1)" "Step 1:" "Step 1."
                    java.util.regex.Matcher stepMatcher = java.util.regex.Pattern
                            .compile("^(?:step\\s+)?(\\d+)[.):]\\s*(.*)", java.util.regex.Pattern.CASE_INSENSITIVE)
                            .matcher(text);

                    if (stepMatcher.matches()) {
                        String stepName = stepMatcher.group(2).trim();
                        if (stepName.isEmpty()) stepName = "Step " + stepMatcher.group(1);
                        currentStep = buildStepDef(stepDefs.size(), stepName, "");
                        stepDefs.add(currentStep);
                    } else if (currentStep != null) {
                        // Non-numbered line after a step — could be description, warning, or caution
                        if (!applyWarningCaution(currentStep, text)) {
                            String existing = (String) currentStep.get("description");
                            currentStep.put("description",
                                    existing.isEmpty() ? text : existing + "\n" + text);
                        }
                    }
                    // Lines before any step are ignored (document title, headers, etc.)
                }
            }

            doc.close();

            // Dedupe stepKeys
            Set<String> usedKeys = new LinkedHashSet<>();
            for (Map<String, Object> step : stepDefs) {
                String key = (String) step.get("stepKey");
                if (usedKeys.contains(key)) {
                    int suffix = 2;
                    while (usedKeys.contains(key + "-" + suffix)) suffix++;
                    key = key + "-" + suffix;
                    step.put("stepKey", key);
                }
                usedKeys.add(key);
            }
            for (int i = 0; i < stepDefs.size(); i++) {
                stepDefs.get(i).put("sortOrder", i);
            }

            String tName = (templateName != null && !templateName.isBlank()) ? templateName
                    : file.getOriginalFilename().replaceAll("\\.[^.]+$", "");
            TaskTemplate template = new TaskTemplate();
            template.setName(tName);
            template.setDescription("Imported from " + file.getOriginalFilename());
            template.setTaskType(TaskType.RECURRING);
            template.setStepTemplatesJson(objectMapper.writeValueAsString(stepDefs));

            TaskTemplate saved = templateService.save(template);
            TaskTemplateDto result = templateService.toDto(saved);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Imported " + stepDefs.size() + " steps from Word document", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Word import failed: " + e.getMessage()));
        }
    }

    private Map<String, Object> buildStepDef(int index, String name, String description) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("stepKey", "step-" + String.format("%03d", index + 1));
        step.put("name", name);
        step.put("description", description);
        step.put("sortOrder", index);
        step.put("prerequisiteStepKeys", List.of());
        step.put("references", List.of());
        step.put("warning", "");
        step.put("caution", "");
        step.put("requiresSignoff", false);
        step.put("expectedDurationMinutes", null);
        return step;
    }

    /** Returns true if the text was a warning/caution line and was applied. */
    private boolean applyWarningCaution(Map<String, Object> step, String text) {
        String upper = text.toUpperCase();
        if (upper.startsWith("WARNING")) {
            step.put("warning", text.replaceFirst("(?i)^WARNING[:\\s-]*", "").trim());
            return true;
        }
        if (upper.startsWith("CAUTION")) {
            step.put("caution", text.replaceFirst("(?i)^CAUTION[:\\s-]*", "").trim());
            return true;
        }
        if (upper.contains("SIGN-OFF") || upper.contains("SIGNOFF") || upper.contains("SUPERVISOR APPROVAL")) {
            step.put("requiresSignoff", true);
            return true;
        }
        return false;
    }

    /**
     * Export a task template as an Excel (.xlsx) file.
     */
    @GetMapping("/{id}/export-excel")
    public void exportExcel(@PathVariable Long id, jakarta.servlet.http.HttpServletResponse response) {
        try {
            TaskTemplate template = templateService.getEntityById(id);
            if (template == null) {
                response.sendError(404, "Template not found");
                return;
            }

            List<Map<String, Object>> stepDefs = template.getStepTemplatesJson() != null
                    ? objectMapper.readValue(template.getStepTemplatesJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {})
                    : List.of();

            org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            org.apache.poi.ss.usermodel.Sheet sheet = wb.createSheet(template.getName() != null ? template.getName() : "Procedure");

            // Header style
            org.apache.poi.ss.usermodel.CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            // Warning style
            org.apache.poi.ss.usermodel.CellStyle warnStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font warnFont = wb.createFont();
            warnFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.RED.getIndex());
            warnFont.setBold(true);
            warnStyle.setFont(warnFont);

            String[] headers = {"Step", "Name", "Description", "Warning", "Caution", "Duration (min)", "Signoff"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int c = 0; c < headers.length; c++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers[c]);
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < stepDefs.size(); i++) {
                Map<String, Object> stepDef = stepDefs.get(i);
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(strVal(stepDef, "name"));
                row.createCell(2).setCellValue(strVal(stepDef, "description"));

                String warning = strVal(stepDef, "warning");
                org.apache.poi.ss.usermodel.Cell warnCell = row.createCell(3);
                warnCell.setCellValue(warning);
                if (!warning.isEmpty()) warnCell.setCellStyle(warnStyle);

                row.createCell(4).setCellValue(strVal(stepDef, "caution"));

                Object dur = stepDef.get("expectedDurationMinutes");
                if (dur != null) row.createCell(5).setCellValue(Double.parseDouble(dur.toString()));

                Object signoff = stepDef.get("requiresSignoff");
                row.createCell(6).setCellValue(signoff != null && Boolean.parseBoolean(signoff.toString()) ? "Yes" : "No");
            }

            // Auto-size columns
            for (int c = 0; c < headers.length; c++) sheet.autoSizeColumn(c);

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                    "attachment; filename=\"" + (template.getName() != null ? template.getName() : "procedure") + ".xlsx\"");
            wb.write(response.getOutputStream());
            wb.close();
        } catch (Exception e) {
            e.printStackTrace();
            try { response.sendError(500, "Export failed: " + e.getMessage()); } catch (Exception ignored) {}
        }
    }

    private String strVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<TaskTemplateDto>> delete(@PathVariable Long id) {
        try {
            TaskTemplate existing = templateService.getEntityById(id);
            if (existing == null) return ResponseEntity.notFound().build();
            TaskTemplate deleted = templateService.softDelete(existing);
            TaskTemplateDto result = templateService.toDto(deleted);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Template deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
