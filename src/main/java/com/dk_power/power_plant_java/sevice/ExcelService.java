package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.plant.RevisedExcelPoints;
import com.dk_power.power_plant_java.repository.plant.RevisedExcelPointsRepo;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

@Service
public class ExcelService {
    private Sheet workSheet;
    private Workbook workBook;
    private String path;
    private FileInputStream excelFile;
    private final RevisedExcelPointsRepo revisedExcelPointsRepo;

    public ExcelService(@Value("${excel.path}") String path, @Value("${excel.sheetName}") String sheetName, RevisedExcelPointsRepo revisedExcelPointsRepo) {
        this.path=path;
        this.revisedExcelPointsRepo = revisedExcelPointsRepo;
        try {
            // Open the Excel file
            excelFile = new FileInputStream(path);
            // Access the required test data sheet
//            workBook = new XSSFWorkbook(excelFile);
            workBook = WorkbookFactory.create(excelFile);
            workSheet = workBook.getSheet(sheetName);
            // check if sheet is null or not. null means  sheetname was wrong
            //Assert.assertNotNull(workSheet, "Sheet: \""+sheetName+"\" does not exist\n");

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String getCellData(int rowNum, int colNum) {
        Cell cell;
        try {
            cell = workSheet.getRow(rowNum).getCell(colNum);
            String cellData = cell.toString();
            return cellData;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String[][] getDataArray() {

        String[][] data = new String[rowCount()][columnCount()];

        for (int i = 0; i <rowCount(); i++) {
            for (int j = 0; j < columnCount(); j++) {
                String value = getCellData(i, j);
                data[i][j] = value;
            }
        }
        return data;

    }

    //this method will return data table as 2d array
    //we need this format because of data provider.
    public String[][] getDataArrayWithoutFirstRow() {

        String[][] data = new String[rowCount()-1][columnCount()];

        for (int i = 1; i < rowCount(); i++) {
            for (int j = 0; j < columnCount(); j++) {
                String value = getCellData(i, j);
                data[i-1][j] = value;
            }
        }
        return data;

    }

    public List<LinkedHashMap<String, String>> getDataList() {
        // get all columns
        List<String> columns = getColumnsNames();
        // this will be returned
        List<LinkedHashMap<String, String>> data = new ArrayList<>();

        for (int i = 1; i < rowCount(); i++) {
            // get each row
            Row row = workSheet.getRow(i);
            // create map of the row using the column and value
            // column map key, cell value --> map bvalue
            LinkedHashMap<String, String> rowMap = new LinkedHashMap<String, String>();
            int cellNum = 0;
            try{
                //int cellNum = 0;
                for (Cell cell : row) {
                    if(cell == null) row.createCell(cellNum).setCellValue("no data");
                    int columnIndex = cell.getColumnIndex();
                    if(cell.getCellType() != CellType.BLANK)
                        rowMap.put(columns.get(columnIndex), cell.toString());
                    else rowMap.put(columns.get(columnIndex), "no data");
                    cellNum++;
                }
            }catch(Exception e){
                System.out.println("row: "+i);
                System.out.println(("column: "+cellNum));
                e.printStackTrace();
            }

            data.add(rowMap);
        }

        return data;
    }

    public List<String> getColumnsNames() {
        List<String> columns = new ArrayList<>();

        for (Cell cell : workSheet.getRow(0)) {
            columns.add(cell.toString());
        }
        return columns;
    }

    public void setCellData(String value, int rowNum, int colNum) {
        Cell cell=null;
        Row row;

        try {
            row = workSheet.getRow(rowNum);
            cell = row.getCell(colNum);

            if (cell == null) {
                cell = row.createCell(colNum);
                cell.setCellValue(value);
            } else {
                cell.setCellValue(value);
            }
            FileOutputStream fileOut = new FileOutputStream(path);
            workBook.write(fileOut);

            fileOut.close();
            workBook.close();
            excelFile.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setCellData(String value, String columnName, int row) {
        int column = getColumnsNames().indexOf(columnName);
        setCellData(value, row, column);
    }

    public int columnCount() {
        return workSheet.getRow(0).getLastCellNum();
    }

    public int rowCount() {
        return workSheet.getLastRowNum()+1;
    }

    public static void fillEmptyCells(List<LinkedHashMap<String,String>> data){

        for(LinkedHashMap<String,String> s : data){
            for(String e : s.keySet()){
                //System.out.println(s);
                s.putIfAbsent(e, "no data");

            }
        }
    }

    public void saveRevisedPoints(LinkedHashMap<String,String> excelPoint){
        RevisedExcelPoints point = new RevisedExcelPoints();
        point.setUnit(excelPoint.get("Unit"));
        point.setTagged(excelPoint.get("Tagged"));
        point.setLabel(excelPoint.get("ID"));
        point.setDescription(excelPoint.get("Description"));
        point.setLocation(excelPoint.get("Location"));
        point.setStandard(excelPoint.get("Standard"));
        point.setGeneralLocation(excelPoint.get("GENERAL LOCATION"));
        point.setEquipment(excelPoint.get("Equipment"));
        point.setExtraInfo(excelPoint.get("Extra Info"));
        point.setType(excelPoint.get("Type"));
        point.setSystem(excelPoint.get("System"));
        point.setNormalPosition(excelPoint.get("Normal Pos"));
        point.setIsolatedPosition(excelPoint.get("Iso Pos"));
        point.setFluid(excelPoint.get("Fluid"));
        point.setSize(excelPoint.get("Size"));
        point.setElectricalCheckStatus(excelPoint.get("T"));
        point.setRedTagId(excelPoint.get("Rec ID"));
        revisedExcelPointsRepo.save(point);
    }
}
