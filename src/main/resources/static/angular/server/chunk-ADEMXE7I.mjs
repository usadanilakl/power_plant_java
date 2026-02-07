import './polyfills.server.mjs';
import {
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-5WKMABBB.mjs";

// node_modules/@bradycorporation/brady-web-sdk/dist/bundle.js
var e;
var t = {};
t.g = function() {
  if ("object" == typeof globalThis) return globalThis;
  try {
    return this || new Function("return this")();
  } catch (e2) {
    if ("object" == typeof window) return window;
  }
}(), function(e2) {
  e2.Landscape = "Landscape", e2.Portrait = "Portrait";
}(e || (e = {}));
var n = class {
  constructor() {
    this.partsDB = `<?xml version="1.0" encoding="UTF-8"?>
        <PartsDatabase FileSchemaVersion="1.0">
          <PrinterTypes>
            <PrinterType ID="{66df6eb1-934c-4424-b374-1cb5c02063a5}">
              <Name>M211</Name>
              <Monochrome>false</Monochrome>
              <SpotColor>false</SpotColor>
              <FullColor>false</FullColor>
              <DitherToMono>false</DitherToMono>
              <TransparentBlt>false</TransparentBlt>
              <Cutter>false</Cutter>
              <PosterPrinter>false</PosterPrinter>
              <PsiFromVglDriver>false</PsiFromVglDriver>
              <AppControlsDriver>false</AppControlsDriver>
              <THT>false</THT>
              <PrinterRibbonColors />
              <PrinterTapeColors />
            </PrinterType>
            <PrinterType ID="{f2056529-51b4-458a-b18f-9950d28e7ae8}">
              <Name>M511</Name>
              <Monochrome>true</Monochrome>
              <SpotColor>false</SpotColor>
              <FullColor>false</FullColor>
              <DitherToMono>false</DitherToMono>
              <TransparentBlt>false</TransparentBlt>
              <Cutter>false</Cutter>
              <PosterPrinter>false</PosterPrinter>
              <PsiFromVglDriver>false</PsiFromVglDriver>
              <AppControlsDriver>false</AppControlsDriver>
              <THT>false</THT>
              <PrinterRibbonColors />
              <PrinterTapeColors />
            </PrinterType>
          </PrinterTypes>
          <Families>
            <PartFamily ID="{c2f8588e-506d-4a23-ab17-1770051005f9}">
              <Name>Terminal Block</Name>
            </PartFamily>
            <PartFamily ID="{fe03d5b5-d964-4848-8820-36dd783d5370}">
              <Name>Two Sided Sleeve</Name>
            </PartFamily>
            <PartFamily ID="{6419929a-eae0-4e53-b4e8-4728a304045c}">
              <Name>One Sided Sleeve</Name>
            </PartFamily>
            <PartFamily ID="{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}">
              <Name>Continuous</Name>
            </PartFamily>
            <PartFamily ID="{18b0dd57-76c8-468f-baef-edc3256aaf2e}">
              <Name>Die-Cut</Name>
            </PartFamily>
            <PartFamily ID="{dab39f30-9685-4f2d-a2b8-4e7bf76a9a9b}">
              <Name>Rigid</Name>
            </PartFamily>
          </Families>
          <Parts>
            <Part ID="{91116311-0611-488e-b0b9-e3a743583d54}">
              <Name>M21-500</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-500-403" YNumber="4939593" />
                <RelatedPart PartName="M21-500-414" YNumber="4857739" />
                <RelatedPart PartName="M21-500-423" YNumber="4900629" />
                <RelatedPart PartName="M21-500-430" YNumber="4900630" />
                <RelatedPart PartName="M21-500-430-WT-CL" YNumber="4900631" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M21-500-461" YNumber="4900632" />
                <RelatedPart PartName="M21-500-488" YNumber="4900633" />
                <RelatedPart PartName="M21-500-499" YNumber="4900634" />
                <RelatedPart PartName="M21-500-581-WT" YNumber="4939571" />
                <RelatedPart PartName="M21-500-595-BK" YNumber="4900636" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M21-500-595-BL" YNumber="4900637" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M21-500-595-BR" YNumber="4900638" Color="{648e129c-71a1-46b5-b8f4-a96e42cd8db1}" />
                <RelatedPart PartName="M21-500-595-GN" YNumber="4900639" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M21-500-595-GY" YNumber="4900640" Color="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" />
                <RelatedPart PartName="M21-500-595-OR" YNumber="4900641" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M21-500-595-PL" YNumber="4900642" Color="{30dc552b-8784-4aa8-b089-8f9a7f57808e}" />
                <RelatedPart PartName="M21-500-595-RD" YNumber="4900643" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M21-500-595-WT" YNumber="4900644" />
                <RelatedPart PartName="M21-500-595-YL" YNumber="4900645" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M21-500-7425" YNumber="4900646" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>0</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>5000</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{cce88c6b-e2cd-49ae-8e7d-02a7dc0114b8}">
              <Name>M21-500-499-TB</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-500-499-TB" YNumber="4900635" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>0</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>5000</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{0ec6c62f-4be0-4945-89f7-b113ea2475a0}">
              <Name>M21-375</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-375-423" YNumber="4900609" />
                <RelatedPart PartName="M21-375-430" YNumber="4900610" />
                <RelatedPart PartName="M21-375-430-WT-CL" YNumber="4900611" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M21-375-488" YNumber="4900613" />
                <RelatedPart PartName="M21-375-499" YNumber="4900614" />
                <RelatedPart PartName="M21-375-595-BK" YNumber="4900616" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M21-375-595-BL" YNumber="4900617" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M21-375-595-BR" YNumber="4900618" Color="{648e129c-71a1-46b5-b8f4-a96e42cd8db1}" />
                <RelatedPart PartName="M21-375-595-GN" YNumber="4900619" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M21-375-595-GY" YNumber="4900620" Color="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" />
                <RelatedPart PartName="M21-375-595-OR" YNumber="4900621" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M21-375-595-PL" YNumber="4900622" Color="{30dc552b-8784-4aa8-b089-8f9a7f57808e}" />
                <RelatedPart PartName="M21-375-595-RD" YNumber="4900623" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M21-375-595-WT" YNumber="4900624" />
                <RelatedPart PartName="M21-375-595-YL" YNumber="4900625" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M21-375-7425" YNumber="4900626" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>3700</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{4d44a792-a2f0-4869-af39-fdf38475a2c2}">
              <Name>M21-375-499-TB</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-375-499-TB" YNumber="4900615" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{c2f8588e-506d-4a23-ab17-1770051005f9}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>3750</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{066ff78f-9b79-4b10-b58d-0f98aded2573}">
              <Name>M21-750</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-750-403" YNumber="4900647" />
                <RelatedPart PartName="M21-750-414" YNumber="4857740" />
                <RelatedPart PartName="M21-750-423" YNumber="4900648" />
                <RelatedPart PartName="M21-750-430" YNumber="4900650" />
                <RelatedPart PartName="M21-750-430-WT-CL" YNumber="4900651" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M21-750-461" YNumber="4900652" />
                <RelatedPart PartName="M21-750-488" YNumber="4900653" />
                <RelatedPart PartName="M21-750-581-WT" YNumber="4939592" />
                <RelatedPart PartName="M21-750-595-BK" YNumber="4900655" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M21-750-595-BL" YNumber="4900656" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M21-750-595-BR" YNumber="4900657" Color="{648e129c-71a1-46b5-b8f4-a96e42cd8db1}" />
                <RelatedPart PartName="M21-750-595-GN" YNumber="4900658" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M21-750-595-GY" YNumber="4900659" Color="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" />
                <RelatedPart PartName="M21-750-595-OR" YNumber="4900660" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M21-750-595-PL" YNumber="4900661" Color="{30dc552b-8784-4aa8-b089-8f9a7f57808e}" />
                <RelatedPart PartName="M21-750-595-RD" YNumber="4900662" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M21-750-595-WT" YNumber="4900663" />
                <RelatedPart PartName="M21-750-595-YL" YNumber="4900664" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="-M21-750-7425" YNumber="4926952" />
                <RelatedPart PartName="M21-750-7425" YNumber="4900665" />
                <RelatedPart PartName="M21-750-499" YNumber="4900654" />
                <RelatedPart PartName="-M21-750-499" YNumber="4926435" />
                <RelatedPart PartName="M21-750-599" YNumber="5175396" Color="{806ebb07-5c10-4c32-908e-349373838131}" />
                <RelatedPart PartName="M21-750-584" YNumber="5175390" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>0</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{6ba977f5-e6f2-4f52-b89b-1164b6e7449d}">
              <Name>M21-750-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-750-427" YNumber="4900649" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{333059bc-84e4-4369-ac16-6abeaeff3dc6}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="2550" Height="5000" OffsetX="1200" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7b04093d-9760-49c6-85be-8671f319f8a7}">
              <Name>M21-1250-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-1250-427" YNumber="4900577" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>12500</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>12500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{1f650fc7-a8e2-44d1-8913-f81f8585387c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="4300" Height="5000" OffsetX="8100" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{ae47c43b-3cd3-46a3-b9f7-81bf1752c61f}">
              <Name>M21-1000-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-1000-427" YNumber="4900576" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10000</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{d69c9f6c-6d92-4425-9bf2-f639190bef3e}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3350" Height="5000" OffsetX="5850" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{410d091c-af2f-408e-aa57-4a2124150ed1}">
              <Name>M21-1500-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-1500-427" YNumber="4900579" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>1500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{3a3bcd06-9967-42b1-90f6-824204ff44c1}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="5000" OffsetX="8100" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{91ef66a9-4fc4-43ba-ba6f-9a6ae8b9ac95}">
              <Name>M21-125-C</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-125-C-342" YNumber="4900592" />
                <RelatedPart PartName="M21-125-C-342-YL" YNumber="4900578" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>2350</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>2700</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>4530</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{f86369e4-b126-4271-ace8-cd60ab953d0f}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="1900" Height="5000" OffsetX="200" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{c6a9cb51-c1d8-48d8-a83c-b6e1020019a9}">
              <Name>M21-187-C</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-187-C-342" YNumber="4900580" />
                <RelatedPart PartName="M21-187-C-342-YL" YNumber="4900581" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>3350</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>3350</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>4530</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{b734426b-9447-46b2-bea8-e07df1c59ffd}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="2500" Height="5000" OffsetX="650" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{6a50dd1a-9ab1-4904-8cc1-894099660a18}">
              <Name>M21-250-C</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-250-C-342" YNumber="4900607" />
                <RelatedPart PartName="M21-250-C-342-YL" YNumber="4900608" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>4390</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>4390</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{eb752b2c-6084-49fa-81ea-a67f7e86a7a3}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="2200" Height="5000" OffsetX="1300" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{9ddd07aa-9f17-4def-812d-28f413fec15a}">
              <Name>M21-375-C</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-375-C-342" YNumber="4900627" />
                <RelatedPart PartName="M21-375-C-342-YL" YNumber="4900628" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>6450</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6450</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{64cecba2-a08f-4de1-b6fc-033211124d84}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5700" Height="5000" OffsetX="750" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{9a9ae97b-6bdf-4d30-ba09-4998e97b3e0c}">
              <Name>M21-250</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-250-414" YNumber="4857738" />
                <RelatedPart PartName="M21-250-423" YNumber="4900602" />
                <RelatedPart PartName="M21-250-430" YNumber="4900603" />
                <RelatedPart PartName="M21-250-430-WT-CL" YNumber="4900604" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M21-250-595-WT" YNumber="4900605" />
                <RelatedPart PartName="M21-250-595-YL" YNumber="4900606" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>2500</Width>
              <Height>0</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>2500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{8db3f8ef-48e4-4886-a5ef-b91c06a76865}">
              <Name>M21-11-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-11-427" YNumber="4918675" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>5000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{4f2fd54e-2c89-437e-911a-f0631d5365fe}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3700" Height="5000" OffsetX="550" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Printable Area1</Name>
              </Zone>
            </Part>
            <Part ID="{92a61864-5061-4613-bb0b-df51889295f2}">
              <Name>M21-11</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-11-499" YNumber="4918682" />
                <RelatedPart PartName="M21-11-595-WT" YNumber="5175391" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>7500</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{1445b5f1-faf6-4b40-b74d-8fd157ff663b}">
              <Name>M21-131</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-131-499" YNumber="4918683" />
                <RelatedPart PartName="M21-131-461" YNumber="5027106" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>10000</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{1047c4bf-0ccf-4edb-820a-e66afad85617}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="9500" OffsetX="0" OffsetY="450" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{f0def72a-11e8-4cd5-9226-2a11132f7f81}">
              <Name>M21-18-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-18-427" YNumber="4918676" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>10000</Height>
              <MarginLeft>900</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{a5775caa-125b-4838-9fd7-b30bcbc2ad19}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3700" Height="10000" OffsetX="550" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Printable Area1</Name>
              </Zone>
            </Part>
            <Part ID="{d4f43222-da61-4c99-ba93-ea2889617bbb}">
              <Name>M21-136</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-136-499" YNumber="4918685" />
                <RelatedPart PartName="M21-136-595-WT" YNumber="5175394" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>15000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{a8dcbcd5-4736-4edc-a7f8-7a13488f6f72}">
              <Name>M21-137</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-137-423" YNumber="4918691" />
                <RelatedPart PartName="M21-137-499" YNumber="4918686" />
                <RelatedPart PartName="M21-137-595-WT" YNumber="5175395" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>20000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{3e02a453-cdab-43c3-b9f5-6f6ce9a232a3}">
              <Name>M21-17</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-17-423" YNumber="4918688" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>10000</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{201ecb1c-ed66-46ed-9645-6bf0f46c4c89}">
              <Name>M21-18</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-18-423" YNumber="4918689" />
                <RelatedPart PartName="M21-18-499" YNumber="4918684" />
                <RelatedPart PartName="M21-18-595-WT" YNumber="5175393" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>10000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{ffb9eed1-017a-4662-bc72-5ff1ec40daa5}">
              <Name>M21-30</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-30-423" YNumber="4918690" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>15000</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>7500</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{1e674076-ce24-4077-970e-f053f78b65be}">
              <Name>M21-7</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-7-423" YNumber="4918687" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>7500</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{659aa946-abeb-4b9f-9f41-281aecb8fd23}">
              <Name>M21-89-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-89-427" YNumber="4918678" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>5000</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{d732674f-d020-4235-a7d1-bc448c1278dd}">
              <Name>M21RO-206-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21RO-206-427" YNumber="4918680" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>24375</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{9d9a9dcb-3f45-4ea3-8e46-1f27facd6b5c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="4376" Height="6300" OffsetX="475" OffsetY="7500" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{a0f4fbfe-cc52-4f31-ba48-1f369a577a54}">
              <Name>M21RO-207-427</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21RO-207-427" YNumber="4918681" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>38125</Height>
              <MarginLeft>700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>6400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>None</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{01ce63f6-9122-420d-919c-83489b833fc3}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="4376" Height="10000" OffsetX="475" OffsetY="11875" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{6ec35075-ea82-42e3-a59a-0debbcf08e2e}">
              <Name>M5-97</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-97-481" YNumber="5072933" />
                <RelatedPart PartName="M5-97-488" YNumber="5072935" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9000</Width>
              <Height>9000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{70e4820f-f445-4fa9-901b-da40013de9dc}">
              <Name>M5C-1500</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1500-595-WT-BK" YNumber="5073058" />
                <RelatedPart PartName="M5C-1500-595-WT-BK-BULK" YNumber="5153508" />
                <RelatedPart PartName="M5C-1500-584-YL" YNumber="5072992" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M5C-1500-595-YL-BK" YNumber="5072988" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M5C-1500-595-WT-RD" YNumber="5073044" />
                <RelatedPart PartName="M5C-1500-595-RD-WT" YNumber="5072907" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M5C-1500-595-OR-BK" YNumber="5072987" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M5C-1500-595-GN-WT" YNumber="5072906" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M5C-1500-595-CL-WT" YNumber="5072905" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M5C-1500-595-CL-BK" YNumber="5072986" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M5C-1500-595-BL-WT" YNumber="5072904" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M5C-1500-595-BK-WT" YNumber="5072903" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M5C-1500-584" YNumber="5072991" />
                <RelatedPart PartName="M5C-1500-499" YNumber="5073115" />
                <RelatedPart PartName="M5C-1500-422" YNumber="5073114" />
                <RelatedPart PartName="M5C-1500-403" YNumber="5073082" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{7b5feafe-f555-449b-89df-f90a9e1c0719}">
              <Name>M4-91 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-91-427" YNumber="5073059" />
                <RelatedPart PartName="M4-91-427-YL" YNumber="5073062" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4-91-417" YNumber="5073125" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>15000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{ad62e61c-42e4-4e89-8d3f-90fb3cc21417}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d53ecdfa-8c81-432c-a143-db47b6b48a1e}">
              <Name>M4-131</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-131-499" YNumber="5072964" />
                <RelatedPart PartName="M4-131-498" YNumber="5072954" />
                <RelatedPart PartName="M4-131-492" YNumber="5072945" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>10000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{4a637362-e6a7-4902-912c-deeed5b044a6}">
              <Name>M5-111</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-111-145FR-GY" YNumber="5072993" Color="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" />
                <RelatedPart PartName="M5-111-145FR-GY" YNumber="6947299" Color="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>12060</Width>
              <Height>15160</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>300</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>7960</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{191b4d7f-cc77-4dff-b4d9-3c91ba48f84a}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="8120" Height="7580" OffsetX="2810" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{defb62a7-b739-4f31-b316-50368c6a9d83}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="8120" Height="7580" OffsetX="2810" OffsetY="7580" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{1b5af79b-d383-4d1c-a5e7-0bd64f2a7c5a}">
              <Name>M5-112</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-112-490" YNumber="5072939" />
                <RelatedPart PartName="M5-112-492" YNumber="5073032" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>12500</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{d4cfe30d-b8e0-4601-84e1-aac959569ed3}">
              <Name>M5-113</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-113-490" YNumber="5072940" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>22000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{f56ce319-6fc3-42eb-b541-d5cf017368d7}">
              <Name>M5-114</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-114-490" YNumber="5072941" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>38750</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{b9f7c2cb-69d5-4889-9176-34c0951491e6}">
              <Name>M4-19</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-19-422" YNumber="5092730" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>10000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{60b41d03-1269-4951-a5f2-dc53404f78a8}">
              <Name>M5-117</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-117-499" YNumber="5072966" />
                <RelatedPart PartName="M5-117-492" YNumber="5072951" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{32de86a8-d7c4-4a4c-bac3-a090ad03f89a}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="9000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{b79b1ccc-968f-43aa-ac18-b19168b9272f}" Type="Printable" Shape="Circle" LabelSide="0" Width="4380" Height="4380" OffsetX="10000" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{85d1ffc1-cb4b-4e88-92b6-794ec791e35b}">
              <Name>M5-12</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-12-109" YNumber="5072867" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>22000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>8000</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{088358da-c512-48a0-9376-3354b0b58157}">
              <Name>M5-127</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-127-481" YNumber="5090812" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10500</Width>
              <Height>2500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{87a27c99-3711-40ad-b4a9-24ef8db2c668}">
              <Name>M5-132</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-132-499" YNumber="5072968" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>12500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{e35f1959-5f94-4c80-a8c7-610427dd7cfd}">
              <Name>M4-141</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-141-499" YNumber="5073003" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>22500</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{80706313-63d6-4377-a8d0-ec5877313b4c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="11250" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{b30f66f6-ab61-45e4-8564-9f5d24936ac4}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="11250" OffsetX="0" OffsetY="11250" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{22a5870d-8feb-479f-90da-0dceb75b538e}">
              <Name>M5-152</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-152-499" YNumber="5072898" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>12500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{3bb4bdcf-e32f-4fb2-98ef-79c510d3803c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="6250" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{80f2b191-9a61-4685-ba6c-7472aa2b6a3b}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="6250" OffsetX="0" OffsetY="6250" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{ea385e2b-d1ba-4726-97af-82c8548fc8a8}">
              <Name>M5-155</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-155-492" YNumber="5072953" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>12500</Width>
              <Height>2500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>6250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{04e9fe8a-a8a1-4b49-b4f5-41e5f53aff05}">
              <Name>M5-156</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-156-492" YNumber="5072948" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9000</Width>
              <Height>10000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{efde89c5-6052-4d6f-bbe4-10dae32b833a}">
              <Name>M4-163</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-163-498" YNumber="5072891" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>10000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{a7f557db-528d-43fe-b82a-55bf3e3e7a7f}">
              <Name>M5-17</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-17-432-CL-BK" YNumber="5072996" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M5-17-351" YNumber="5072994" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{fa94dbcc-8ab4-40b1-b208-eedb295dadf8}">
              <Name>M4-214</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-214-483" YNumber="5073124" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>20000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{59e89162-f130-40d0-9a8d-091ca085485f}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="10000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{a1465583-bc7c-4e0d-a5b3-c0fd684b3ab0}">
              <Name>M5-29</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-29-428" YNumber="5072887" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{d6aec13d-4d64-423d-b1b9-b9e842aeb34e}">
              <Name>M5-30</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-30-428" YNumber="5072888" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>7500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{2abe0981-bd63-4ec6-ad27-c741897c8220}">
              <Name>M5-375</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-375-1-342" YNumber="5073078" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10300</Width>
              <Height>6440</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>3560</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{48edc3ef-a3b3-44a1-8b9b-b9bba6edbca0}">
              <Name>M4-60</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-60-483" YNumber="5073013" />
                <RelatedPart PartName="M4-60-428" YNumber="5073016" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>20000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{ba6028bc-36a2-4218-9163-29bafe571e0e}">
              <Name>M4-61</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-61-483" YNumber="5072975" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>20000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{3f509f9e-084a-4c85-a139-d0a82c00b15f}">
              <Name>M4-7</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-7-498" YNumber="5072895" />
                <RelatedPart PartName="M4-7-422" YNumber="5072974" />
                <RelatedPart PartName="M4-7-595" YNumber="5175385" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{590ded42-4714-4cfe-87c9-2af208bf140d}">
              <Name>M4-81</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-81-488" YNumber="5072934" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>2500</Width>
              <Height>19000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{7f690c8e-17bc-4cb0-98aa-654bd1939d16}">
              <Name>M4-82</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-82-499-YL-BK" YNumber="5072961" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4-82-499-RD-BK" YNumber="5072957" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M4-82-499-OR-BK" YNumber="5072955" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M4-82-499" YNumber="5072959" />
                <RelatedPart PartName="M4-82-492" YNumber="5072942" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{6cda5fb0-c9e3-45f3-9967-5ff0c7aabebe}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{a5f0e71f-fe67-41c4-9749-9e25c06d3b01}">
              <Name>M5-95</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-95-492" YNumber="5073031" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10400</Width>
              <Height>16250</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{89d58c53-c939-4380-b828-436a1c33f7fc}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="6000" Height="16250" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{081dd0e8-0b79-40c0-8c7b-12c595b2e0b4}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="6650" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{11afb215-63c9-4f52-af8f-f771e3cf08df}">
              <Name>M4-128</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-128-499" YNumber="5073014" />
                <RelatedPart PartName="M4-128-498" YNumber="5073005" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>19000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c2696306-a80b-4879-80af-f1febc745272}">
              <Name>M4-130</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-130-499" YNumber="5072963" />
                <RelatedPart PartName="M4-130-492" YNumber="5072943" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>8250</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{1e5e5863-d9b4-4a37-b32d-0b684534eb7d}">
              <Name>M4C-125</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-125-7641-YL" YNumber="5073026" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-125-7641" YNumber="5073035" />
                <RelatedPart PartName="M4C-125-342-YL" YNumber="5072858" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-125-342" YNumber="5072857" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>1760</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>1600</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c8b54213-c7a5-447d-82b4-f30878677166}">
              <Name>M4C-187</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-187-7641-YL" YNumber="5073027" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-187-7641" YNumber="5073036" />
                <RelatedPart PartName="M4C-187-342-YL" YNumber="5072860" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-187-342" YNumber="5072859" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>2760</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>1600</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{7cd6c886-76d0-4ef9-88bb-13c02bd55a10}">
              <Name>M4C-240</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-240-498" YNumber="5072892" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{c2f8588e-506d-4a23-ab17-1770051005f9}</FamilyInfo>
              <Description />
              <Width>2400</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{8586cc67-dc56-4125-a656-4861de95528e}">
              <Name>M4C-318</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-318-498" YNumber="5072893" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>3180</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{118b766a-ddc5-4f41-ba9c-bc1fead6b270}">
              <Name>M4C-475</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-475-422" YNumber="5072971" />
                <RelatedPart PartName="M4C-475-412" YNumber="5072884" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>4750</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{428f7180-2ea1-4f0a-b1f3-c16790713d11}">
              <Name>M4C-625</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-625-422" YNumber="5072973" />
                <RelatedPart PartName="M4C-625-412" YNumber="5072885" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>6250</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{af17b181-5d7a-439b-815d-6365d086d4a1}">
              <Name>M4-102 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-102-427" YNumber="5073046" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>12500</Height>
              <MarginLeft>2400</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{9fe166c4-b5b4-4b48-ab74-5baccb1c613c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{5740e460-2c0f-4368-83d9-5a5025699238}">
              <Name>M5-103</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-103-498" YNumber="5072889" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>12500</Height>
              <MarginLeft>2400</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{86dd49e8-ff44-4784-a22b-469c35c0171a}">
              <Name>M4-11</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-11-498" YNumber="5072890" />
                <RelatedPart PartName="M4-11-499" YNumber="5072897" />
                <RelatedPart PartName="M4-11-595" YNumber="5175386" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{73836732-658e-445b-9089-5ad1e47351ab}">
              <Name>M4-11 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-11-417" YNumber="5073127" />
                <RelatedPart PartName="M4-11-427" YNumber="5073047" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{4fad1641-78eb-43ef-8604-af6f82fc7412}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{40366653-2935-4ed2-8cc6-72f718fdc87b}">
              <Name>M5-115 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-115-427" YNumber="5073049" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>12500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{6cadf82a-c07f-428f-a671-6e7b43fe3350}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="15000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d7f8d67c-bfe7-4de2-a485-463f736ef4ed}">
              <Name>M5-118</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-118-499" YNumber="5072965" />
                <RelatedPart PartName="M5-118-492" YNumber="5072949" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{ecc79636-1a12-42b9-ae29-389796147851}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{787b405a-6fd9-4ad0-8df3-7d94d293737d}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="10650" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{8683cb80-070f-4a7d-a0d3-510a8c84fcd6}">
              <Name>M5-119 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-119-461" YNumber="5072930" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>37500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{294b31af-ea46-4060-9718-2e8c6e20862b}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="12500" OffsetX="0" OffsetY="25000" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{4c8ef8aa-4f9c-4f09-97d3-b50376b2473f}">
              <Name>M5-120</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-120-499" YNumber="5072967" />
                <RelatedPart PartName="M5-120-492" YNumber="5072950" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{07734767-e26b-4eb5-b0f3-22c3799b396b}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{9910e431-5347-4a1f-9eeb-4a715ca49df8}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="10650" OffsetY="1250" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{a86ab518-9e53-4205-a12b-f5c30ddbf08e}">
              <Name>M5-120 Unprintable Top</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-120-494-YL" YNumber="5073089">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{ca5bbbe2-f638-4edf-8c2b-64fe882b68ce}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-120-494-RD" YNumber="5073092">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{2cb4f4b6-dea8-4ac3-9bc4-26fee8fe8026}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-120-494-PK" YNumber="5073104">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{7fe235a8-1a95-4c6c-91a0-56e1929e0c1e}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-120-494-OR" YNumber="5073098">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{96dc87c2-3ff2-43b3-9ab6-e57dcd7c9e58}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-120-494-GN" YNumber="5073101">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{b6fd0f50-868e-480d-bbdb-db78c7276aa5}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-120-494-BL" YNumber="5073095">
                  <ZoneColors>
                    <ZoneColor ZoneId="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Color="{c064c1ed-3cb7-4ba6-b3c3-070f9f964375}" />
                  </ZoneColors>
                </RelatedPart>
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>14400</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{508c847f-0ee4-47c9-9c80-15e65d18e2d9}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{387463f0-4fc0-46fb-ad6f-71509f5338be}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="11000" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{0a386927-351e-4e80-9da0-51aff262fba3}">
              <Name>M5-118 Unprintable Top</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-118-494-YL" YNumber="5073108">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{ca5bbbe2-f638-4edf-8c2b-64fe882b68ce}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{ca5bbbe2-f638-4edf-8c2b-64fe882b68ce}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-118-494-RD" YNumber="5073110">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{2cb4f4b6-dea8-4ac3-9bc4-26fee8fe8026}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{2cb4f4b6-dea8-4ac3-9bc4-26fee8fe8026}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-118-494-PK" YNumber="5073105">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{7fe235a8-1a95-4c6c-91a0-56e1929e0c1e}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{7fe235a8-1a95-4c6c-91a0-56e1929e0c1e}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-118-494-OR" YNumber="5073106">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{96dc87c2-3ff2-43b3-9ab6-e57dcd7c9e58}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{96dc87c2-3ff2-43b3-9ab6-e57dcd7c9e58}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-118-494-GN" YNumber="5073109">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{b6fd0f50-868e-480d-bbdb-db78c7276aa5}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{b6fd0f50-868e-480d-bbdb-db78c7276aa5}" />
                  </ZoneColors>
                </RelatedPart>
                <RelatedPart PartName="M5-118-494-BL" YNumber="5073107">
                  <ZoneColors>
                    <ZoneColor ZoneId="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Color="{c064c1ed-3cb7-4ba6-b3c3-070f9f964375}" />
                    <ZoneColor ZoneId="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Color="{c064c1ed-3cb7-4ba6-b3c3-070f9f964375}" />
                  </ZoneColors>
                </RelatedPart>
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>14400</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{e7b8b149-2ce5-46ba-ab72-cfd41bb2a8f8}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="2500" OffsetX="0" OffsetY="1250" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{9c6d12a1-8c57-4293-a26a-1d540f7c3725}" Type="Printable" Shape="Circle" LabelSide="0" Width="3750" Height="3750" OffsetX="11000" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
              <Zone ID="{393e2fb2-8992-4e9e-9acf-84fe2c7d13d7}" Type="Nonprintable" Shape="Rectangle" LabelSide="0" Width="10000" Height="1250" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone3</Name>
              </Zone>
            </Part>
            <Part ID="{5161348d-3c81-4fd2-a05a-837ef4ef9ef0}">
              <Name>M5-122 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-122-461" YNumber="5072928" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>11250</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>3750</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{8c86d7b2-6952-40a2-8e53-4a525f897a46}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="7500" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{b6120d4f-f29e-401e-9f51-b80d8c14786c}">
              <Name>M5-123 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-123-461" YNumber="5072932" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>11250</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>5000</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{00a98223-2ec1-4341-bc36-0171f93630cc}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="7500" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{00932bad-6fc3-480c-80dd-459d9ad2ae2a}">
              <Name>M5-124</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-124-492" YNumber="5073033" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>16500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c2ea96d7-104b-4c2d-9172-f77e27161528}">
              <Name>M4-124 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-124-461" YNumber="5072919" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>16500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{e06a6eab-844b-4f3d-8531-30c7269dfed7}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="7500" OffsetX="0" OffsetY="9000" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{c551c622-0029-4066-88f3-6247620e7a6b}">
              <Name>M4-126</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-126-490" YNumber="5072937" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>6000</Width>
              <Height>18000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{03b6b0b3-5326-4802-ae7b-6c83ff5cfcfd}">
              <Name>M4-126 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-126-461" YNumber="5072923" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>6000</Width>
              <Height>18000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{81ed8782-bb25-4fbc-8ae1-e1e0cf0e3ae1}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="6000" Height="10000" OffsetX="0" OffsetY="8000" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{006f66bb-af80-4c6d-8f1a-bf0821ec14f6}">
              <Name>M5-129 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-129-461" YNumber="5072931" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>22500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{ddfc0431-7bf6-404f-8f20-41b212719b55}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="12500" OffsetX="0" OffsetY="10000" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{2fd45a74-67b9-4fb5-a290-6d8ee61c0fd7}">
              <Name>M5-131 Unprintable Top</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-131-494-YL" YNumber="5073087" />
                <RelatedPart PartName="M5-131-494-RD" YNumber="5073090" />
                <RelatedPart PartName="M5-131-494-PK" YNumber="5073102" />
                <RelatedPart PartName="M5-131-494-OR" YNumber="5073096" />
                <RelatedPart PartName="M5-131-494-GN" YNumber="5073099" />
                <RelatedPart PartName="M5-131-494-BL" YNumber="5073093" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>10000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{4245648b-f3c3-42c6-8624-f2c1ffc1d76f}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="10000" OffsetX="1250" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{da75b6c3-59fd-460d-b7d9-fcdb9187c090}">
              <Name>M5-133 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-133-427" YNumber="5073048" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>17500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{e7d1bf44-d169-407c-b112-4275499e1735}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="17500" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{a6c84378-3cc0-4e7a-8e99-b730be18470b}">
              <Name>M5-134 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-134-427" YNumber="5073051" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>17500</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{cb97ef1f-343e-4466-83fa-7ab4a328cbe9}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="17500" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{f34221a4-0a66-4be8-b78c-488d8dcb9894}">
              <Name>M4-135 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-135-427-AW" YNumber="5073064" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>2500</Width>
              <Height>11000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{fab86bb9-4e3e-4101-b5c5-0124fd636cd8}">
              <Name>M4-47</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-47-483" YNumber="5073017" />
                <RelatedPart PartName="M4-47-428" YNumber="5073015" />
                <RelatedPart PartName="M4-47-422" YNumber="5073006" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{007ed0f9-3d2e-4cf1-b2ed-2d63c8323000}">
              <Name>M4-47 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-47-427" YNumber="5073072" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{913b92fa-6e11-4480-886e-6e63d92ccd3b}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{a71fd6c3-f85d-4d7d-a9cc-666216535d24}">
              <Name>M4-48</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-48-498" YNumber="5073002" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>7500</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{5da9a741-08e2-4738-bbf8-0b53c83b7ed4}">
              <Name>M4-49</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-49-498" YNumber="5073004" />
                <RelatedPart PartName="M4-49-422" YNumber="5073020" />
                <RelatedPart PartName="M4-49-595" YNumber="5175388" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>10000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{5949db32-4605-4305-9d3a-559fe8cb063a}">
              <Name>M5-49 Unprintable Top</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-49-494-YL" YNumber="5073088" />
                <RelatedPart PartName="M5-49-494-RD" YNumber="5073091" />
                <RelatedPart PartName="M5-49-494-PK" YNumber="5073103" />
                <RelatedPart PartName="M5-49-494-OR" YNumber="5073097" />
                <RelatedPart PartName="M5-49-494-GN" YNumber="5073100" />
                <RelatedPart PartName="M5-49-494-BL" YNumber="5073094" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>10000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{58500399-811e-44e7-ad89-36bfbc802e27}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="8750" OffsetX="0" OffsetY="1150" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d3234378-0ca0-4af0-8c78-6171c2f91b06}">
              <Name>M4-72 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-72-461" YNumber="5072920" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>17500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{2aad9c70-e482-4931-8bc5-f363964a2029}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="7500" OffsetX="0" OffsetY="10000" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{944abff9-3017-48c5-bb44-8f417ea59ffe}">
              <Name>M4-53 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-53-427-YL" YNumber="5073073" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4-53-427" YNumber="5073071" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>40000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{95450dc9-61a2-49f1-a831-4e9945e14122}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="10000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{1b2b3158-747f-40ea-9a41-b649227950e7}">
              <Name>M4-74 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-74-461" YNumber="5072921" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>22000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1750</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{f46c799b-2806-4cee-a2ab-e2553c210b11}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="7500" OffsetX="0" OffsetY="14500" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d865bbd2-66c8-4bdb-ad11-1f31d65642ac}">
              <Name>M5-75 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-75-461" YNumber="5072926" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>26250</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{6547fc2c-8c20-4c7d-9c79-a5e48b0cac22}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="10000" OffsetX="0" OffsetY="16250" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{5b9aa3a7-4773-4bb8-834e-7351f6117179}">
              <Name>M5-78</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-78-492" YNumber="5072952" />
                <RelatedPart PartName="M5-78-432-CL-BK" YNumber="5072997" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>19000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{402958ae-42b1-4e1f-bdae-a1896c7ca13d}">
              <Name>M4-83 Headless Printable</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-83-492" YNumber="5072944" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{526ae76b-3609-4b42-a5dd-58fedd040f52}" Type="Printable" Shape="Circle" LabelSide="0" Width="5000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{8fb624b6-7cf0-4107-a4da-85f67f899e5f}">
              <Name>M4-83</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-83-499-YL-BK" YNumber="5072962" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4-83-499-RD-BK" YNumber="5072958" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M4-83-499-OR-BK" YNumber="5072956" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M4-83-499" YNumber="5072960" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{6292a0f3-182b-4c15-a34c-27393ebf4050}" Type="Printable" Shape="Circle" LabelSide="0" Width="5000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7353737f-cf60-4a0b-9c12-1b6470fa2cfb}">
              <Name>M5-84</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-84-499" YNumber="5072902" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{eb9235b8-d2b7-49a2-8a82-2c80aa2ae968}">
              <Name>M4-86 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-86-461" YNumber="5072924" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>6000</Width>
              <Height>26250</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{5d70b9a7-1ced-46e9-894b-7cf5a68ae25e}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="6000" Height="10000" OffsetX="0" OffsetY="16250" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{763e2fca-bbae-42eb-88d4-0ba7c6baef9e}">
              <Name>M4-89</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-89-422" YNumber="5072999" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>15000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{4fe99bbf-1a91-477d-941f-a0a40a9579e8}">
              <Name>M4-89 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-89-427" YNumber="5073063" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>15000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{09d734bb-ef23-4311-80d9-8cee7b819198}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{c1d849e2-c6ec-43a1-90d2-da2c788faab7}">
              <Name>M4-90</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-90-422" YNumber="5072998" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>15000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{e6efa726-93d4-48f2-8f3a-49a52c8de49c}">
              <Name>M4-90 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-90-427" YNumber="5073061" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>15000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{9c51f6ff-db5c-47dd-9c80-c3a72d203ada}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="7500" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7e4cb342-a983-41b1-a06d-622394ed9214}">
              <Name>M4-91</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-91-498" YNumber="5073000" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>15000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{6ae7d5dc-df23-4d53-ba77-396e29be1873}">
              <Name>M5-116 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-116-427" YNumber="5073052" />
                <RelatedPart PartName="M5-116-417" YNumber="5073132" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>25000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{25ca8d02-3eff-448d-a916-5351ed908640}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="15000" Height="7500" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{968a5fa4-b978-4534-b367-c7abde8ac825}">
              <Name>M5-125</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-125-492" YNumber="5073034" />
                <RelatedPart PartName="M5-125-490" YNumber="5072938" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>17500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c52c2610-aa01-4a1b-945f-5124aae70987}">
              <Name>M5-125 Self Lam </Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-125-461" YNumber="5072925" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>17500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{1e8bbd45-81c6-4f1c-9db0-7bfbf354c15c}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="10000" OffsetX="0" OffsetY="7500" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{9166b888-4170-4979-b46a-bca682dd807a}">
              <Name>M4-125-075 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-125-075-342" YNumber="5073023" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>2340</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>1200</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>5160</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{9f1e492d-90b9-4c07-9018-877f2cb16247}">
              <Name>M5-125-1 Sleeve (R66)</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-125-1-342-R66" YNumber="5073084" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9510</Width>
              <Height>2210</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>5290</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{61d6ab02-504b-4d6f-abd5-583854ae0bb3}">
              <Name>M5-125-1 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-125-1-342" YNumber="5073079" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10300</Width>
              <Height>2340</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>5160</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{91a45c8f-134b-4e39-8cff-6f0fd1c97363}">
              <Name>M4-136 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-136-427" YNumber="5073067" />
                <RelatedPart PartName="M4-136-417" YNumber="5073129" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>7500</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{5a1fdc96-a268-4215-8665-fb07bfa73e32}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{6f979c92-eeb2-4692-87df-4667d5785ed9}">
              <Name>M4-143 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-143-427" YNumber="5073060" />
                <RelatedPart PartName="M4-143-417" YNumber="5073128" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>12500</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{7dff5ce7-d760-4d0c-9e03-edfca95a085d}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{b9b8d16b-129c-4e39-b151-d2af5142c22e}">
              <Name>M4-48 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-48-427" YNumber="5073069" />
                <RelatedPart PartName="M4-48-417" YNumber="5073131" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>7500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{f643dc31-5ea7-4b5c-b28d-755fd95abeb7}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="7500" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{f30e1ffc-b5b4-4d2b-9cb2-61a5f5162b43}">
              <Name>M4-49 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-49-427" YNumber="5073066" />
                <RelatedPart PartName="M4-49-417" YNumber="5073130" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>10000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{0c3c5299-985d-43c5-b664-43f07402ca67}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="3750" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{bb9157a1-e0f6-4dbc-a324-0decf4150fcf}">
              <Name>M4-51 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-51-427-YL" YNumber="5073070" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4-51-427" YNumber="5073065" />
                <RelatedPart PartName="M4-51-417" YNumber="5073126" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>25000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{92889255-cc4c-4bb4-94b5-e3f4c5ea825f}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="7500" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{9fd7b500-49f4-4f63-86df-cdad9799916a}">
              <Name>M4-187-075 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-187-075-342" YNumber="5073021" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>3340</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>1300</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4160</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{2a8d2b67-c32c-4eb2-90c6-75805fd18f71}">
              <Name>M5-187-1 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-187-1-342" YNumber="5073076" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10300</Width>
              <Height>3340</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4160</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{7dd73401-9795-4c7e-9c2e-6e0686b4b707}">
              <Name>M5-194</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-194-481" YNumber="5072947" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9000</Width>
              <Height>7500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{d2f6d8fc-ab8d-4e1a-99f4-b4701afe39c7}">
              <Name>M5-20</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-20-351" YNumber="5072995" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>20000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{eae6193d-5999-4db4-ba45-5dbd2d6ee304}">
              <Name>M4-203 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-203-RO-427" YNumber="5073120" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>24500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>5500</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{22190601-27ff-4c8b-a0b4-1207c015742e}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="7000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7508b7f1-d001-41c2-9e72-1d23f287dd4c}">
              <Name>M4-206 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-206-RO-427" YNumber="5073119" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>24500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2000</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{0a4bd34c-a4b7-4576-a401-728b4355a2f0}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="7000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d320a3be-0115-43dc-90ad-b304b5278d4a}">
              <Name>M4-207 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-207-RO-427" YNumber="5073122" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>38500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2750</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{2966ebf9-a6fd-46b6-b37a-2fa1f26b63e0}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="11000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7565fd85-0f33-46bf-9fc1-be72314843c0}">
              <Name>M4-209 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-209-RO-427" YNumber="5073123" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>38500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2750</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{93fd4011-2644-4792-8acc-9e2b2c74bac6}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="11000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{6e4dcf55-7aaa-4c68-9e8e-0869431523bf}">
              <Name>M4-211 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-211-RO-427" YNumber="5073121" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>17000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2000</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{922128c9-7572-4326-86d4-6b2cc4a11c12}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="10000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{c208a9da-89d8-4753-bbc5-414b5eeac7e7}">
              <Name>M5-250-1 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-250-1-342" YNumber="5073077" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10300</Width>
              <Height>4380</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4370</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{0e252b7a-cedb-4d01-95b9-bd7b472e2261}">
              <Name>M5-250-1 Sleeve (R66)</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-250-1-342-R66" YNumber="5073086" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9510</Width>
              <Height>4180</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4570</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{cbeea650-e514-4567-975a-a5958502bc85}">
              <Name>M5-31 Portrait</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-31-7425" YNumber="5073080" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>14400</Width>
              <Height>10000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{0696bd71-8890-4fb4-b8f0-9f6a1ce8fba8}">
              <Name>M5-32 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-32-427" YNumber="5073050" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>15000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{d86aca7c-a11d-4739-91ca-2ee086d1aec3}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="15000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{fde27e67-7981-4e39-a3e6-d041421384b6}">
              <Name>M5-33 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-33-427" YNumber="5073053" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>40000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{13e59df7-52a5-4b00-b0ef-92e7d4a9a737}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="10000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{ebf83cd3-64f0-4655-aaa3-d9ea00489c85}">
              <Name>M5-34 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-34-427" YNumber="5073054" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>60000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{b0ba1ebe-4d06-4a28-8bd8-f87e4fe01432}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="14400" Height="15000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{b9d0d5af-34c7-4f7b-9b00-210b81c4825d}">
              <Name>M4-375-075</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-375-075-342" YNumber="5073024" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>6440</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>1520</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>3560</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c0b2a225-3e1b-48ad-bd1c-384d66c9756c}">
              <Name>M5C-1000</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1000-461" YNumber="5072927" />
                <RelatedPart PartName="M5C-1000-584-YL" YNumber="5072990" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M5C-1000-584" YNumber="5072989" />
                <RelatedPart PartName="M5C-1000-499" YNumber="5072896" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{ff3e4d41-222a-4882-99be-c444540970d8}">
              <Name>M5C-1000 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1000-427" YNumber="5073041" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{55cf464d-b606-4bac-a7dd-10bd6946d054}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="0" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{d354ea59-957e-421c-866f-281a9bdc28fb}">
              <Name>M5C-1250 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1250-427" YNumber="5073042" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>12500</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>15630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{9c4ddf71-6987-40c9-a520-2902301c0734}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="0" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{6824d5b3-e438-4923-8520-a051b2ee546e}">
              <Name>M5C-1250</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1250-461" YNumber="5072929" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>12500</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{4205073c-0347-4ec9-84a1-3bd9b5245ff5}">
              <Name>M5C-1500 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5C-1500-427" YNumber="5073055" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>15000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{be2df048-aae8-42ef-bd6f-4712ee36ca9e}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="5000" Height="5000" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{064a320e-2108-4e8f-874c-2005424f3625}">
              <Name>M4C-250 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-250-7641-YL" YNumber="5073028" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-250-7641" YNumber="5073037" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-250-342-YL" YNumber="5072882" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-250-342" YNumber="5072861" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>3550</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>300</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{c4f4e550-32b4-4d59-9117-37b24f2dece4}">
              <Name>M4C-375</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-375-461" YNumber="5072918" />
                <RelatedPart PartName="M4C-375-595-YL-BK" YNumber="5073039" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-375-595-WT-BK" YNumber="5073075" />
                <RelatedPart PartName="M4C-375-595-RD-WT" YNumber="5073113" />
                <RelatedPart PartName="M4C-375-499" YNumber="5072899" />
                <RelatedPart PartName="M4C-375-422" YNumber="5072970" />
                <RelatedPart PartName="M4C-375-412" YNumber="5072883" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{6cc6bfe8-7b20-494e-baf4-c3aee9c1ec1d}">
              <Name>M4C-375 Terminal Block</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-375-498" YNumber="5072894" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{c2f8588e-506d-4a23-ab17-1770051005f9}</FamilyInfo>
              <Description />
              <Width>3750</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{f8495761-844e-44ee-971e-aa4dcfc54327}">
              <Name>M4C-500</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-500-461" YNumber="5072922" />
                <RelatedPart PartName="M4C-500-595-YL-BK" YNumber="5072978" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-500-595-WT-RD" YNumber="5073040" />
                <RelatedPart PartName="M4C-500-595-WT-BK" YNumber="5073056" />
                <RelatedPart PartName="M4C-500-595-RD-WT" YNumber="5072912" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M4C-500-595-OR-BK" YNumber="5072977" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M4C-500-595-GN-WT" YNumber="5072911" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M4C-500-595-CL-WT" YNumber="5072910" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-500-595-CL-BK" YNumber="5072976" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-500-595-BL-WT" YNumber="5072909" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M4C-500-595-BK-WT" YNumber="5072908" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M4C-500-584-YL" YNumber="5072983" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-500-584" YNumber="5072982" />
                <RelatedPart PartName="M4C-500-499" YNumber="5072900" />
                <RelatedPart PartName="M4C-500-492" YNumber="5072946" />
                <RelatedPart PartName="M4C-500-422" YNumber="5072972" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{cbcd8c5b-047d-4652-98b1-aa830e61e5b6}">
              <Name>M4C-500 Velcro</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-500-414" YNumber="5073117" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>760</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{b43a86d0-0e40-449d-b511-e1cf758a2b31}">
              <Name>M4C-750</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-750-595-YL-BK" YNumber="5072981" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-750-595-WT-RD" YNumber="5073045" />
                <RelatedPart PartName="M4C-750-595-WT-BK" YNumber="5073057" />
                <RelatedPart PartName="M4C-750-595-RD-WT" YNumber="5072917" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M4C-750-595-OR-BK" YNumber="5072980" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M4C-750-595-GN-WT" YNumber="5072916" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M4C-750-595-CL-WT" YNumber="5072915" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-750-595-CL-BK" YNumber="5072979" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-750-595-BL-WT" YNumber="5072914" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M4C-750-595-BK-WT" YNumber="5072913" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M4C-750-584-YL" YNumber="5072985" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-750-584" YNumber="5072984" />
                <RelatedPart PartName="M4C-750-499" YNumber="5072901" />
                <RelatedPart PartName="M4C-750-403" YNumber="5073083" />
                <RelatedPart PartName="M4C-750-351" YNumber="6342401" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{27fe0e8b-750e-4147-bcbe-2f7fc487f8b8}">
              <Name>M4C-750 Velcro</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-750-414" YNumber="5073118" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>6000</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>760</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{49e15c9a-fcef-4326-a450-8e5a38c307c0}">
              <Name>M4C-750 Self Lam</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-750-427" YNumber="5073043" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{0e67ab7a-471a-403f-9a5f-224a51ea876f}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3750" Height="0" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{7501af29-22e5-4bcf-a2d7-8b3423535ac0}">
              <Name>M4C-1000</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-1000-595-YL-BK" YNumber="5073001" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-1000-595-WT-RD" YNumber="5073074" />
                <RelatedPart PartName="M4C-1000-595-WT-BK" YNumber="5073068" />
                <RelatedPart PartName="M4C-1000-595-WT-BK" YNumber="5153511" />
                <RelatedPart PartName="M4C-1000-595-RD-WT" YNumber="5073010" Color="{420418dc-d97d-4696-a643-ea5db7990ebd}" />
                <RelatedPart PartName="M4C-1000-595-OR-BK" YNumber="5073007" Color="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" />
                <RelatedPart PartName="M4C-1000-595-GN-WT" YNumber="5073012" Color="{efd92612-00dc-4c04-a8bc-aae43db50aab}" />
                <RelatedPart PartName="M4C-1000-595-CL-WT" YNumber="5073019" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-1000-595-CL-BK" YNumber="5073011" Color="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" />
                <RelatedPart PartName="M4C-1000-595-BL-WT" YNumber="5073008" Color="{2d72aced-f608-404e-97de-cff5121af135}" />
                <RelatedPart PartName="M4C-1000-595-BK-WT" YNumber="5073018" Color="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" />
                <RelatedPart PartName="M4C-1000-422" YNumber="5073009" />
                <RelatedPart PartName="M4C-1000-423" YNumber="5475267" />
                <RelatedPart PartName="M4C-1000-430" YNumber="5475328" />
                <RelatedPart PartName="M4C-1000-581-WT" YNumber="5475329" />
                <RelatedPart PartName="M4C-1000-7425" YNumber="5475333" />
                <RelatedPart PartName="M4C-1000-351" YNumber="6342402" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>2160</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{78e7b603-4e28-41ce-8754-30cc1581b29d}">
              <Name>M4-92</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-92-428-BB" YNumber="5073025" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>3760</Width>
              <Height>10060</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>2440</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{7c9fdd79-b88c-479f-8846-8c29a1f4d817}">
              <Name>M5-01</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-01-425-FT" YNumber="5072886" />
                <RelatedPart PartName="M5-01-8425-FT" YNumber="6342399" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>11810</Width>
              <Height>15750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1400</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{a4b4b15d-f00b-4a3f-9077-cc1794f43335}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="11810" Height="3940" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{84362cdf-93f3-4af3-b943-226c7a56d429}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="11810" Height="3940" OffsetX="0" OffsetY="3940" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{266b0d63-982a-4c8c-a4db-0c0cd12d7fdf}">
              <Name>M4C-250 Velcro</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-250-414" YNumber="5073116" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>2500</Width>
              <Height>0</Height>
              <MarginLeft>5620</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{5260649a-3d10-454a-b457-257ea3e85ca2}">
              <Name>M4C-250</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-250-595-YL-BK" YNumber="5073111" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-250-595-WT-BK" YNumber="5073112" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>2500</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{d944afb5-ca97-4192-9f52-4daae6c8c131}">
              <Name>M5-187-075 Sleeve (R66)</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-187-1-342-R66" YNumber="5073085" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9510</Width>
              <Height>3150</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4350</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{68000dcf-edaa-4716-ad7b-bf3377ac83d3}">
              <Name>M4-250-075 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-250-075-342" YNumber="5073022" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>4380</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>1330</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>4370</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{1f96233d-5bd6-4b44-b316-02582ed39e4b}">
              <Name>M4C-375 Sleeve</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4C-375-7641-YL" YNumber="5073029" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
                <RelatedPart PartName="M4C-375-7641" YNumber="5073038" />
                <RelatedPart PartName="M4C-375-342" YNumber="5073030" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>5470</Width>
              <Height>0</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>10630</WebWidth>
              <UnPrintableLeft>1140</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{e68a5e0d-b055-4750-99ca-94073fc84c4a}">
              <Name>M5-195</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-195-481" YNumber="5072969" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>9000</Width>
              <Height>3750</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{83c38b82-b708-42ba-9e88-f7018560625c}">
              <Name>M4-17</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-17-595" YNumber="5175387" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>5000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{43a21f8a-7ba6-4c27-8c86-947021db826e}">
              <Name>M5-31</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-31-595" YNumber="5175389" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>14400</Width>
              <Height>10000</Height>
              <MarginLeft>2060</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>18130</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{19a7a728-6a1b-4685-aa88-3de273e16429}">
              <Name>M4-124</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-124-490" YNumber="5072936" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>16500</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>8120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>180</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{65f67b51-a82b-428d-b60b-8201112a518b}">
              <Name>M4-22</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-22-499" YNumber="5475332" />
                <RelatedPart PartName="M4-22-595" YNumber="5475331" />
                <RelatedPart PartName="M4-22-423" YNumber="6342400" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>30000</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{a2f187fd-be96-4856-b0e2-e351b17d2437}">
              <Name>M4-1-FP</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-1-425-FP" YNumber="5475266" />
                <RelatedPart PartName="M4-1-8425-FP" YNumber="6342398" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7880</Width>
              <Height>19290</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>13120</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1335</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{4a00f456-18fd-4e33-a46a-73c4fe6269fd}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3940" Height="11810" OffsetX="0" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
              <Zone ID="{43594f64-e3b9-4e7e-81cd-4586c703e5f1}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="3940" Height="11810" OffsetX="3940" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone2</Name>
              </Zone>
            </Part>
            <Part ID="{cd0243fb-64b7-47f7-b593-86475575d9b9}">
              <Name>M21-224</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-224-109" YNumber="6261770" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{40d9fa4d-337e-4fe5-8b09-d60bb38c3311}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>0</Height>
              <MarginLeft>1700</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>0</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Continuous</SensorType>
              <IsContinuous>true</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{2a2d9f2e-3356-4e1e-92ee-6d15164b4550}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="4800" Height="0" OffsetX="1500" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{b23c7a3b-935b-4343-be54-ef6241d0906e}">
              <Name>M21-223</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M21-223-483" YNumber="6261771" />
              </RelatedParts>
              <PrinterType>{66df6eb1-934c-4424-b374-1cb5c02063a5}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>7500</Width>
              <Height>17500</Height>
              <MarginLeft>0</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>8400</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>1250</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Portrait</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Gap</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
              <Zone ID="{88b0962e-40fc-48a1-9690-0eefcdbed520}" Type="Printable" Shape="Rectangle" LabelSide="0" Width="6300" Height="7500" OffsetX="1200" OffsetY="0" CornerRadius="0" UserEditable="false">
                <Name>Zone1</Name>
              </Zone>
            </Part>
            <Part ID="{bfb4f0ad-d150-4820-8c53-517282eb2780}">
              <Name>M5-22 Slug</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M5-22-109" YNumber="6342291" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>10000</Width>
              <Height>22660</Height>
              <MarginLeft>3350</MarginLeft>
              <MarginTop>0</MarginTop>
              <WebWidth>15620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>7340</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{08814b61-8c58-40ec-9410-2c650c196371}">
              <Name>M4-230 No Print Zone</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-230-109" YNumber="6709348" />
                <RelatedPart PartName="M4-230-109-YL" YNumber="7244421" Color="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>22200</Height>
              <MarginLeft>2360</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>7800</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
            <Part ID="{506e245f-9726-438c-8b16-8cc415265b2f}">
              <Name>M4-61 No Print Zone</Name>
              <DefaultYNumber>
              </DefaultYNumber>
              <RelatedParts>
                <RelatedPart PartName="M4-61-109" YNumber="6342290" />
              </RelatedParts>
              <PrinterType>{e27f84ae-b994-45c7-96a1-84196eb60f89}</PrinterType>
              <PrinterType>{f2056529-51b4-458a-b18f-9950d28e7ae8}</PrinterType>
              <FamilyInfo>{18b0dd57-76c8-468f-baef-edc3256aaf2e}</FamilyInfo>
              <Description />
              <Width>5000</Width>
              <Height>12500</Height>
              <MarginLeft>3350</MarginLeft>
              <MarginTop>600</MarginTop>
              <WebWidth>10620</WebWidth>
              <UnPrintableLeft>0</UnPrintableLeft>
              <UnPrintableTop>0</UnPrintableTop>
              <ColumnsPerSheet>1</ColumnsPerSheet>
              <RowsPerSheet>1</RowsPerSheet>
              <GapVertical>7500</GapVertical>
              <GapHorizontal>0</GapHorizontal>
              <Rotation>0</Rotation>
              <OutputOrientation>Landscape</OutputOrientation>
              <IsFactoryDefined>true</IsFactoryDefined>
              <IsCustom>false</IsCustom>
              <IsPrePrinted>false</IsPrePrinted>
              <IsDoubleSided>false</IsDoubleSided>
              <SensorType>Notch</SensorType>
              <IsContinuous>false</IsContinuous>
              <IsSlitSleeve>false</IsSlitSleeve>
            </Part>
          </Parts>
          <TapeColors>
            <TapeColorType ID="{00000000-0000-0000-0000-000000000000}" rgb="255,255,255">
              <Culture name="EN-US">White</Culture>
              <Culture name="ID-ID">Putih</Culture>
              <Culture name="MS-MY">Putih</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E02\u0E32\u0E27</Culture>
              <Culture name="BG">\u0411\u044F\u043B\u043E</Culture>
              <Culture name="ZH-CN">\u767D\u8272</Culture>
              <Culture name="ZH-TW">\u767D\u8272</Culture>
              <Culture name="HR">Bijelo</Culture>
              <Culture name="CS">B\xEDl\xE1</Culture>
              <Culture name="DA">Hvid</Culture>
              <Culture name="NL">Wit</Culture>
              <Culture name="EN-GB">White</Culture>
              <Culture name="ET">Valge</Culture>
              <Culture name="FI">Valkoinen</Culture>
              <Culture name="FR-CA">Blanc</Culture>
              <Culture name="FR-FR">Blanc</Culture>
              <Culture name="HU">feh\xE9r</Culture>
              <Culture name="DE">Wei\xDF</Culture>
              <Culture name="JA">\u767D</Culture>
              <Culture name="IT">Bianco</Culture>
              <Culture name="KO">\uD770\uC0C9</Culture>
              <Culture name="NO">Hvit</Culture>
              <Culture name="PL">Bia\u0142y</Culture>
              <Culture name="PT-BR">Branco</Culture>
              <Culture name="PT-PT">Branco</Culture>
              <Culture name="RO">Alb</Culture>
              <Culture name="RU">\u0411\u0435\u043B\u044B\u0439</Culture>
              <Culture name="SK">Biela</Culture>
              <Culture name="SL">Bela</Culture>
              <Culture name="ES-MX">Blanco</Culture>
              <Culture name="ES-ES">Blanco</Culture>
              <Culture name="SV">Vit</Culture>
              <Culture name="TR">Beyaz</Culture>
              <Culture name="VI">Tr\u1EAFng</Culture>
              <Culture name="AR">\u0623\u0628\u064A\u0636</Culture>
              <Culture name="HE-IL">\u05DC\u05D1\u05DF</Culture>
              <Culture name="HI-IN">\u0938\u092B\u093C\u0947\u0926</Culture>
            </TapeColorType>
            <TapeColorType ID="{c064c1ed-3cb7-4ba6-b3c3-070f9f964375}" rgb="146,193,233">
              <Culture name="EN-US">Pastel Blue</Culture>
            </TapeColorType>
            <TapeColorType ID="{e4fb8c2d-005d-4531-9ce5-0946f3af2d52}" rgb="200,154,79">
              <Culture name="EN-US">Gold</Culture>
              <Culture name="ID-ID">Emas</Culture>
              <Culture name="MS-MY">Emas</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E17\u0E2D\u0E07</Culture>
              <Culture name="BG">\u0417\u043B\u0430\u0442\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u91D1\u8272</Culture>
              <Culture name="ZH-TW">\u91D1\u8272</Culture>
              <Culture name="HR">Zlatno</Culture>
              <Culture name="CS">Zlat\xE1</Culture>
              <Culture name="DA">Guld</Culture>
              <Culture name="NL">Goud</Culture>
              <Culture name="EN-GB">Gold</Culture>
              <Culture name="ET">Kuldne</Culture>
              <Culture name="FI">Kulta</Culture>
              <Culture name="FR-CA">Or</Culture>
              <Culture name="FR-FR">Or</Culture>
              <Culture name="HU">arany</Culture>
              <Culture name="DE">Gold</Culture>
              <Culture name="JA">\u30B4\u30FC\u30EB\u30C9</Culture>
              <Culture name="IT">Oro</Culture>
              <Culture name="KO">\uAE08\uC0C9</Culture>
              <Culture name="NO">Gull</Culture>
              <Culture name="PL">Z\u0142oty</Culture>
              <Culture name="PT-BR">Dourado</Culture>
              <Culture name="PT-PT">Ouro</Culture>
              <Culture name="RO">Auriu</Culture>
              <Culture name="RU">\u0417\u043E\u043B\u043E\u0442\u0438\u0441\u0442\u044B\u0439</Culture>
              <Culture name="SK">Zlat\xE1</Culture>
              <Culture name="SL">Zlata</Culture>
              <Culture name="ES-MX">Dorado</Culture>
              <Culture name="ES-ES">Dorado</Culture>
              <Culture name="SV">Guld</Culture>
              <Culture name="TR">Alt\u0131n Sar\u0131s\u0131</Culture>
              <Culture name="VI">V\xE0ng</Culture>
            </TapeColorType>
            <TapeColorType ID="{2cb4f4b6-dea8-4ac3-9bc4-26fee8fe8026}" rgb="228,0,43">
              <Culture name="EN-US">Pastel Red</Culture>
            </TapeColorType>
            <TapeColorType ID="{806ebb07-5c10-4c32-908e-349373838131}" rgb="231,231,231">
              <Culture name="EN-US">Silver Metallized</Culture>
              <Culture name="ID-ID">Perak Metalik</Culture>
              <Culture name="MS-MY">Logam Perak</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E07\u0E34\u0E19\u0E40\u0E21\u0E17\u0E31\u0E25\u0E44\u0E25\u0E0B\u0E4C</Culture>
              <Culture name="BG">\u0421\u0440\u0435\u0431\u0440\u0438\u0441\u0442 \u043C\u0435\u0442\u0430\u043B\u0438\u043A</Culture>
              <Culture name="ZH-CN">\u6709\u91D1\u5C5E\u7535\u9540\u8D28\u611F\u7684\u94F6\u8272</Culture>
              <Culture name="ZH-TW">\u6709\u91D1\u5C6C\u96FB\u934D\u8CEA\u611F\u7684\u9280\u8272</Culture>
              <Culture name="HR">Srebrno metalik</Culture>
              <Culture name="CS">St\u0159\xEDbrn\xE1 metal\xEDza</Culture>
              <Culture name="DA">S\xF8lv metalliseret</Culture>
              <Culture name="NL">Gemetalliseerd zilver</Culture>
              <Culture name="EN-GB">Silver Metallized</Culture>
              <Culture name="ET">H\xF5bemetallik</Culture>
              <Culture name="FI">Metallinhohtoinen hopea</Culture>
              <Culture name="FR-CA">Argent m\xE9tallis\xE9</Culture>
              <Culture name="FR-FR">Argent m\xE9tallis\xE9</Culture>
              <Culture name="HU">f\xE9mes ez\xFCst</Culture>
              <Culture name="DE">Metallisiertes Silber</Culture>
              <Culture name="JA">\u30E1\u30BF\u30EA\u30C3\u30AF\u30B7\u30EB\u30D0\u30FC</Culture>
              <Culture name="IT">Argento metallizzato</Culture>
              <Culture name="KO">\uAE08\uC18D\uC131 \uC740\uC0C9</Culture>
              <Culture name="NO">Metallisert s\xF8lvfarge</Culture>
              <Culture name="PL">Srebrny metaliczny</Culture>
              <Culture name="PT-BR">Prateado met\xE1lico</Culture>
              <Culture name="PT-PT">Prata metalizada</Culture>
              <Culture name="RO">Argintiu metalizat</Culture>
              <Culture name="RU">\u0421\u0435\u0440\u0435\u0431\u0440\u0438\u0441\u0442\u044B\u0439 \u043C\u0435\u0442\u0430\u043B\u043B\u0438\u043A</Culture>
              <Culture name="SK">Pokovovan\xE1 strieborn\xE1</Culture>
              <Culture name="SL">Kovinska srebrna</Culture>
              <Culture name="ES-MX">Plateado metalizado</Culture>
              <Culture name="ES-ES">Plata metalizada</Culture>
              <Culture name="SV">Silvermetalliserat</Culture>
              <Culture name="TR">Metal G\xFCm\xFC\u015F Rengi</Culture>
              <Culture name="VI">B\u1EA1c \u0111\u01B0\u1EE3c kim lo\u1EA1i h\xF3a</Culture>
            </TapeColorType>
            <TapeColorType ID="{7fe235a8-1a95-4c6c-91a0-56e1929e0c1e}" rgb="244,166,215">
              <Culture name="EN-US">Pastel Pink</Culture>
            </TapeColorType>
            <TapeColorType ID="{372af2b9-5fe5-407d-a984-63b0256a0abf}" rgb="190,255,190">
              <Culture name="EN-US">BradyGlo</Culture>
              <Culture name="ID-ID">BradyGlo</Culture>
              <Culture name="MS-MY">BradyGlo</Culture>
              <Culture name="TH-TH">BradyGlo</Culture>
              <Culture name="BG">BradyGlo</Culture>
              <Culture name="ZH-CN">BradyGlo</Culture>
              <Culture name="ZH-TW">BradyGlo</Culture>
              <Culture name="HR">BradyGlo</Culture>
              <Culture name="CS">BradyGlo</Culture>
              <Culture name="DA">BradyGlo</Culture>
              <Culture name="NL">BradyGlo</Culture>
              <Culture name="EN-GB">BradyGlo</Culture>
              <Culture name="ET">BradyGlo</Culture>
              <Culture name="FI">BradyGlo</Culture>
              <Culture name="FR-CA">BradyGlo</Culture>
              <Culture name="FR-FR">BradyGlo</Culture>
              <Culture name="HU">BradyGlo</Culture>
              <Culture name="DE">BradyGlo</Culture>
              <Culture name="JA">\u30D6\u30EC\u30C7\u30A3\u30B0\u30ED\u30FC</Culture>
              <Culture name="IT">BradyGlo</Culture>
              <Culture name="KO">BradyGlo</Culture>
              <Culture name="NO">BradyGlo</Culture>
              <Culture name="PL">BradyGlo</Culture>
              <Culture name="PT-BR">BradyGlo</Culture>
              <Culture name="PT-PT">BradyGlo</Culture>
              <Culture name="RO">BradyGlo</Culture>
              <Culture name="RU">BradyGlo</Culture>
              <Culture name="SK">BradyGlo</Culture>
              <Culture name="SL">BradyGlo</Culture>
              <Culture name="ES-MX">BradyGlo</Culture>
              <Culture name="ES-ES">BradyGlo</Culture>
              <Culture name="SV">BradyGlo</Culture>
              <Culture name="TR">BradyGlo</Culture>
              <Culture name="VI">BradyGlo</Culture>
            </TapeColorType>
            <TapeColorType ID="{ca5bbbe2-f638-4edf-8c2b-64fe882b68ce}" rgb="246,229,0">
              <Culture name="EN-US">Pastel Yellow</Culture>
            </TapeColorType>
            <TapeColorType ID="{fae5f7ce-935b-4b2d-9293-652e1d5e8aed}" rgb="148,152,159">
              <Culture name="EN-US">Grey</Culture>
              <Culture name="ID-ID">Abu-Abu</Culture>
              <Culture name="MS-MY">Kelabu</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E17\u0E32</Culture>
              <Culture name="BG">\u0421\u0438\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u7070\u8272</Culture>
              <Culture name="ZH-TW">\u7070\u8272</Culture>
              <Culture name="HR">Sivo</Culture>
              <Culture name="CS">\u0160ed\xE1</Culture>
              <Culture name="DA">Gr\xE5</Culture>
              <Culture name="NL">Grijs</Culture>
              <Culture name="EN-GB">Grey</Culture>
              <Culture name="ET">Hall</Culture>
              <Culture name="FI">Harmaa</Culture>
              <Culture name="FR-CA">Gris</Culture>
              <Culture name="FR-FR">Gris</Culture>
              <Culture name="HU">sz\xFCrke</Culture>
              <Culture name="DE">Grau</Culture>
              <Culture name="JA">\u7070\u8272</Culture>
              <Culture name="IT">Grigio</Culture>
              <Culture name="KO">\uD68C\uC0C9</Culture>
              <Culture name="NO">Gr\xE5</Culture>
              <Culture name="PL">Szary</Culture>
              <Culture name="PT-BR">Cinza</Culture>
              <Culture name="PT-PT">Cinzento</Culture>
              <Culture name="RO">Gri</Culture>
              <Culture name="RU">\u0421\u0435\u0440\u044B\u0439</Culture>
              <Culture name="SK">Siv\xE1</Culture>
              <Culture name="SL">Siva</Culture>
              <Culture name="ES-MX">Gris</Culture>
              <Culture name="ES-ES">Gris</Culture>
              <Culture name="SV">Gr\xE5</Culture>
              <Culture name="TR">Gri</Culture>
              <Culture name="VI">X\xE1m</Culture>
            </TapeColorType>
            <TapeColorType ID="{542432aa-21d6-4e98-907a-705821d33810}" rgb="255,255,185">
              <Culture name="EN-US">Phosphorescent</Culture>
              <Culture name="ID-ID">Berpendar</Culture>
              <Culture name="MS-MY">Pendarfosfor</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E23\u0E37\u0E2D\u0E07\u0E41\u0E2A\u0E07</Culture>
              <Culture name="BG">\u0424\u043E\u0441\u0444\u0440\u0435\u0441\u0446\u0438\u0440\u0430\u0449\u043E</Culture>
              <Culture name="ZH-CN">\u78F7\u5149</Culture>
              <Culture name="ZH-TW">\u78F7\u5149</Culture>
              <Culture name="HR">Fosforoscentno</Culture>
              <Culture name="CS">Fosforeskuj\xEDc\xED</Culture>
              <Culture name="DA">Fosforescerende</Culture>
              <Culture name="NL">Lichtgevend</Culture>
              <Culture name="EN-GB">Phosphorescent</Culture>
              <Culture name="ET">Helenduv</Culture>
              <Culture name="FI">Fosforisoiva</Culture>
              <Culture name="FR-CA">Phosphorescent</Culture>
              <Culture name="FR-FR">Phosphorescent</Culture>
              <Culture name="HU">foszforeszk\xE1l\xF3</Culture>
              <Culture name="DE">Phosphoreszierend</Culture>
              <Culture name="JA">\u30EA\u30F3\u5149</Culture>
              <Culture name="IT">Fosforescente</Culture>
              <Culture name="KO">\uC57C\uAD11</Culture>
              <Culture name="NO">Selvlysende</Culture>
              <Culture name="PL">Fosforyczny</Culture>
              <Culture name="PT-BR">Fosforescente</Culture>
              <Culture name="PT-PT">Fosforescente</Culture>
              <Culture name="RO">Fosforescent</Culture>
              <Culture name="RU">\u0424\u043E\u0441\u0444\u043E\u0440\u0435\u0441\u0446\u0438\u0440\u0443\u044E\u0449\u0438\u0439</Culture>
              <Culture name="SK">Svetielkuj\xFAca</Culture>
              <Culture name="SL">Fosforescentna</Culture>
              <Culture name="ES-MX">Fluorescente</Culture>
              <Culture name="ES-ES">Fosforescente</Culture>
              <Culture name="SV">sj\xE4lvlysande</Culture>
              <Culture name="TR">Fosforlu</Culture>
              <Culture name="VI">L\xE2n quang</Culture>
            </TapeColorType>
            <TapeColorType ID="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" rgb="0,0,0">
              <Culture name="EN-US">Black</Culture>
              <Culture name="ID-ID">Hitam</Culture>
              <Culture name="MS-MY">Hitam</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E14\u0E33</Culture>
              <Culture name="BG">\u0427\u0435\u0440\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u9ED1\u8272</Culture>
              <Culture name="ZH-TW">\u9ED1\u8272</Culture>
              <Culture name="HR">Crno</Culture>
              <Culture name="CS">\u010Cern\xE1</Culture>
              <Culture name="DA">Sort</Culture>
              <Culture name="NL">Zwart</Culture>
              <Culture name="EN-GB">Black</Culture>
              <Culture name="ET">Must</Culture>
              <Culture name="FI">Musta</Culture>
              <Culture name="FR-CA">Noir</Culture>
              <Culture name="FR-FR">Noir</Culture>
              <Culture name="HU">fekete</Culture>
              <Culture name="DE">Schwarz</Culture>
              <Culture name="JA">\u9ED2</Culture>
              <Culture name="IT">Nero</Culture>
              <Culture name="KO">\uAC80\uC815\uC0C9</Culture>
              <Culture name="NO">Svart</Culture>
              <Culture name="PL">Czarny</Culture>
              <Culture name="PT-BR">Preto</Culture>
              <Culture name="PT-PT">Preto</Culture>
              <Culture name="RO">Negru</Culture>
              <Culture name="RU">\u0427\u0435\u0440\u043D\u044B\u0439</Culture>
              <Culture name="SK">\u010Cierna</Culture>
              <Culture name="SL">\u010Crna</Culture>
              <Culture name="ES-MX">Negro</Culture>
              <Culture name="ES-ES">Negro</Culture>
              <Culture name="SV">Svart</Culture>
              <Culture name="TR">Siyah</Culture>
              <Culture name="VI">\u0110en</Culture>
              <Culture name="AR">\u0623\u0633\u0648\u062F</Culture>
              <Culture name="HE-IL">\u05E9\u05D7\u05D5\u05E8</Culture>
              <Culture name="HI-IN">\u0915\u093E\u0932\u093E</Culture>
            </TapeColorType>
            <TapeColorType ID="{aa0f9cbc-8817-4995-be00-75878ff3d777}" rgb="44,163,207">
              <Culture name="EN-US">Light Blue</Culture>
              <Culture name="ID-ID">Biru Muda</Culture>
              <Culture name="MS-MY">Biru Cerah</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E48\u0E2D\u0E19</Culture>
              <Culture name="BG">\u0421\u0432\u0435\u0442\u043B\u043E\u0441\u0438\u043D\u044C\u043E</Culture>
              <Culture name="ZH-CN">\u6D45\u84DD\u8272</Culture>
              <Culture name="ZH-TW">\u6DFA\u85CD\u8272</Culture>
              <Culture name="HR">Svijetlo plavo</Culture>
              <Culture name="CS">Sv\u011Btle modr\xE1</Culture>
              <Culture name="DA">Lysebl\xE5</Culture>
              <Culture name="NL">Lichtblauw</Culture>
              <Culture name="EN-GB">Light Blue</Culture>
              <Culture name="ET">Helesinine</Culture>
              <Culture name="FI">Vaaleansininen</Culture>
              <Culture name="FR-CA">Bleu p\xE2le</Culture>
              <Culture name="FR-FR">Bleu clair</Culture>
              <Culture name="HU">vil\xE1gosk\xE9k</Culture>
              <Culture name="DE">Hellblau</Culture>
              <Culture name="JA">\u6C34\u8272</Culture>
              <Culture name="IT">Azzurro</Culture>
              <Culture name="KO">\uC5F0\uD55C \uD30C\uB780\uC0C9</Culture>
              <Culture name="NO">Lysbl\xE5</Culture>
              <Culture name="PL">Jasnoniebieski</Culture>
              <Culture name="PT-BR">Azul-claro</Culture>
              <Culture name="PT-PT">Azul claro</Culture>
              <Culture name="RO">Albastru deschis</Culture>
              <Culture name="RU">\u0413\u043E\u043B\u0443\u0431\u043E\u0439</Culture>
              <Culture name="SK">Svetlomodr\xE1</Culture>
              <Culture name="SL">Svetlomodra</Culture>
              <Culture name="ES-MX">Azul claro</Culture>
              <Culture name="ES-ES">Azul claro</Culture>
              <Culture name="SV">Ljusbl\xE5</Culture>
              <Culture name="TR">A\xE7\u0131k Mavi</Culture>
              <Culture name="VI">Xanh d\u01B0\u01A1ng nh\u1EA1t</Culture>
            </TapeColorType>
            <TapeColorType ID="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" rgb="255,205,0">
              <Culture name="EN-US">Yellow</Culture>
              <Culture name="ID-ID">Kuning</Culture>
              <Culture name="MS-MY">Kuning</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07</Culture>
              <Culture name="BG">\u0416\u044A\u043B\u0442\u043E</Culture>
              <Culture name="ZH-CN">\u9EC4\u8272</Culture>
              <Culture name="ZH-TW">\u9EC3\u8272</Culture>
              <Culture name="HR">\u017Duto</Culture>
              <Culture name="CS">\u017Dlut\xE1</Culture>
              <Culture name="DA">Gul</Culture>
              <Culture name="NL">Geel</Culture>
              <Culture name="EN-GB">Yellow</Culture>
              <Culture name="ET">Kollane</Culture>
              <Culture name="FI">Keltainen</Culture>
              <Culture name="FR-CA">Jaune</Culture>
              <Culture name="FR-FR">Jaune</Culture>
              <Culture name="HU">s\xE1rga</Culture>
              <Culture name="DE">Gelb</Culture>
              <Culture name="JA">\u9EC4\u8272</Culture>
              <Culture name="IT">Giallo</Culture>
              <Culture name="KO">\uB178\uB780\uC0C9</Culture>
              <Culture name="NO">Gul</Culture>
              <Culture name="PL">\u017B\xF3\u0142ty</Culture>
              <Culture name="PT-BR">Amarelo</Culture>
              <Culture name="PT-PT">Amarelo</Culture>
              <Culture name="RO">Galben</Culture>
              <Culture name="RU">\u0416\u0435\u043B\u0442\u044B\u0439</Culture>
              <Culture name="SK">\u017Dlt\xE1</Culture>
              <Culture name="SL">Rumena</Culture>
              <Culture name="ES-MX">Amarillo</Culture>
              <Culture name="ES-ES">Amarillo</Culture>
              <Culture name="SV">Gul</Culture>
              <Culture name="TR">Sar\u0131</Culture>
              <Culture name="VI">V\xE0ng</Culture>
              <Culture name="AR">\u0623\u0635\u0641\u0631</Culture>
              <Culture name="HE-IL">\u05E6\u05D4\u05D5\u05D1</Culture>
              <Culture name="HI-IN">\u092A\u0940\u0932\u093E</Culture>
            </TapeColorType>
            <TapeColorType ID="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" rgb="255,100,0">
              <Culture name="EN-US">Orange</Culture>
              <Culture name="ID-ID">Oranye</Culture>
              <Culture name="MS-MY">Jingga</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E2A\u0E49\u0E21</Culture>
              <Culture name="BG">\u041E\u0440\u0430\u043D\u0436\u0435\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u6A59\u8272</Culture>
              <Culture name="ZH-TW">\u6A59\u8272</Culture>
              <Culture name="HR">Naran\u010Dasto</Culture>
              <Culture name="CS">Oran\u017Eov\xE1</Culture>
              <Culture name="DA">Orange</Culture>
              <Culture name="NL">Oranje</Culture>
              <Culture name="EN-GB">Orange</Culture>
              <Culture name="ET">Oran\u017E</Culture>
              <Culture name="FI">Oranssi</Culture>
              <Culture name="FR-CA">Orange</Culture>
              <Culture name="FR-FR">Orange</Culture>
              <Culture name="HU">narancss\xE1rga</Culture>
              <Culture name="DE">Orange</Culture>
              <Culture name="JA">\u30AA\u30EC\u30F3\u30B8</Culture>
              <Culture name="IT">Arancione</Culture>
              <Culture name="KO">\uC8FC\uD669\uC0C9</Culture>
              <Culture name="NO">Oransje</Culture>
              <Culture name="PL">Pomara\u0144czowy</Culture>
              <Culture name="PT-BR">Laranja</Culture>
              <Culture name="PT-PT">Laranja</Culture>
              <Culture name="RO">Portocaliu</Culture>
              <Culture name="RU">\u041E\u0440\u0430\u043D\u0436\u0435\u0432\u044B\u0439</Culture>
              <Culture name="SK">Oran\u017Eov\xE1</Culture>
              <Culture name="SL">Oran\u017Ena</Culture>
              <Culture name="ES-MX">Naranja</Culture>
              <Culture name="ES-ES">Naranja</Culture>
              <Culture name="SV">Orange</Culture>
              <Culture name="TR">Turuncu</Culture>
              <Culture name="VI">Cam</Culture>
              <Culture name="AR">\u0628\u0631\u062A\u0642\u0627\u0644\u064A</Culture>
              <Culture name="HE-IL">\u05DB\u05EA\u05D5\u05DD</Culture>
              <Culture name="HI-IN">\u0928\u093E\u0930\u0902\u0917\u0940</Culture>
            </TapeColorType>
            <TapeColorType ID="{30dc552b-8784-4aa8-b089-8f9a7f57808e}" rgb="172,45,134">
              <Culture name="EN-US">Purple</Culture>
              <Culture name="ID-ID">Ungu</Culture>
              <Culture name="MS-MY">Ungu</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E21\u0E48\u0E27\u0E07</Culture>
              <Culture name="BG">\u041B\u0438\u043B\u0430\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u7D2B\u8272</Culture>
              <Culture name="ZH-TW">\u7D2B\u8272</Culture>
              <Culture name="HR">Ljubi\u010Dasto</Culture>
              <Culture name="CS">Purpurov\xE1</Culture>
              <Culture name="DA">Lilla</Culture>
              <Culture name="NL">Paars</Culture>
              <Culture name="EN-GB">Purple</Culture>
              <Culture name="ET">Lilla</Culture>
              <Culture name="FI">Violetti</Culture>
              <Culture name="FR-CA">Mauve</Culture>
              <Culture name="FR-FR">Pourpre</Culture>
              <Culture name="HU">b\xEDbor</Culture>
              <Culture name="DE">Violett</Culture>
              <Culture name="JA">\u7D2B\u8272</Culture>
              <Culture name="IT">Viola</Culture>
              <Culture name="KO">\uBCF4\uB77C\uC0C9</Culture>
              <Culture name="NO">Lilla</Culture>
              <Culture name="PL">Purpurowy</Culture>
              <Culture name="PT-BR">Roxo</Culture>
              <Culture name="PT-PT">Roxo</Culture>
              <Culture name="RO">Mov</Culture>
              <Culture name="RU">\u0424\u0438\u043E\u043B\u0435\u0442\u043E\u0432\u044B\u0439</Culture>
              <Culture name="SK">Purpurov\xE1</Culture>
              <Culture name="SL">\u0160krlatna</Culture>
              <Culture name="ES-MX">Morado</Culture>
              <Culture name="ES-ES">Morado</Culture>
              <Culture name="SV">Lila</Culture>
              <Culture name="TR">Mor</Culture>
              <Culture name="VI">T\xEDm</Culture>
            </TapeColorType>
            <TapeColorType ID="{55a0b884-2595-4176-a0ad-a0654c43d4c8}" rgb="253,179,170">
              <Culture name="EN-US">Pink</Culture>
              <Culture name="ID-ID">Merah Muda</Culture>
              <Culture name="MS-MY">Merah Jambu</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E0A\u0E21\u0E1E\u0E39</Culture>
              <Culture name="BG">\u0420\u043E\u0437\u043E\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u7C89\u8272</Culture>
              <Culture name="ZH-TW">\u7C89\u8272</Culture>
              <Culture name="HR">Ru\u017Ei\u010Dasto</Culture>
              <Culture name="CS">R\u016F\u017Eov\xE1</Culture>
              <Culture name="DA">Lyser\xF8d</Culture>
              <Culture name="NL">Rose</Culture>
              <Culture name="EN-GB">Pink</Culture>
              <Culture name="ET">Roosa</Culture>
              <Culture name="FI">Vaaleanpunainen</Culture>
              <Culture name="FR-CA">Rose</Culture>
              <Culture name="FR-FR">Rose</Culture>
              <Culture name="HU">r\xF3zsasz\xEDn</Culture>
              <Culture name="DE">Rosa</Culture>
              <Culture name="JA">\u30D4\u30F3\u30AF</Culture>
              <Culture name="IT">Rosa</Culture>
              <Culture name="KO">\uBD84\uD64D\uC0C9</Culture>
              <Culture name="NO">Rosa</Culture>
              <Culture name="PL">R\xF3\u017Cowy</Culture>
              <Culture name="PT-BR">Rosa</Culture>
              <Culture name="PT-PT">Rosa</Culture>
              <Culture name="RO">Roz</Culture>
              <Culture name="RU">\u0420\u043E\u0437\u043E\u0432\u044B\u0439</Culture>
              <Culture name="SK">Ru\u017Eov\xE1</Culture>
              <Culture name="SL">Roza</Culture>
              <Culture name="ES-MX">Rosa</Culture>
              <Culture name="ES-ES">Rosa</Culture>
              <Culture name="SV">Rosa</Culture>
              <Culture name="TR">Pembe</Culture>
              <Culture name="VI">H\u1ED3ng</Culture>
            </TapeColorType>
            <TapeColorType ID="{648e129c-71a1-46b5-b8f4-a96e42cd8db1}" rgb="117,58,0">
              <Culture name="EN-US">Brown</Culture>
              <Culture name="ID-ID">Cokelat</Culture>
              <Culture name="MS-MY">Coklat</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25</Culture>
              <Culture name="BG">\u041A\u0430\u0444\u044F\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u8910\u8272</Culture>
              <Culture name="ZH-TW">\u8910\u8272</Culture>
              <Culture name="HR">Sme\u0111e</Culture>
              <Culture name="CS">Hn\u011Bd\xE1</Culture>
              <Culture name="DA">Brun</Culture>
              <Culture name="NL">Bruin</Culture>
              <Culture name="EN-GB">Brown</Culture>
              <Culture name="ET">Pruun</Culture>
              <Culture name="FI">Ruskea</Culture>
              <Culture name="FR-CA">Brun</Culture>
              <Culture name="FR-FR">Marron</Culture>
              <Culture name="HU">barna</Culture>
              <Culture name="DE">Braun</Culture>
              <Culture name="JA">\u8336\u8272</Culture>
              <Culture name="IT">Marrone</Culture>
              <Culture name="KO">\uAC08\uC0C9</Culture>
              <Culture name="NO">Brun</Culture>
              <Culture name="PL">Br\u0105zowy</Culture>
              <Culture name="PT-BR">Marrom</Culture>
              <Culture name="PT-PT">Castanho</Culture>
              <Culture name="RO">Maro</Culture>
              <Culture name="RU">\u041A\u043E\u0440\u0438\u0447\u043D\u0435\u0432\u044B\u0439</Culture>
              <Culture name="SK">Hned\xE1</Culture>
              <Culture name="SL">Rjava</Culture>
              <Culture name="ES-MX">Caf\xE9</Culture>
              <Culture name="ES-ES">Marr\xF3n</Culture>
              <Culture name="SV">Brun</Culture>
              <Culture name="TR">Kahverengi</Culture>
              <Culture name="VI">N\xE2u</Culture>
            </TapeColorType>
            <TapeColorType ID="{efd92612-00dc-4c04-a8bc-aae43db50aab}" rgb="60,132,52">
              <Culture name="EN-US">Green</Culture>
              <Culture name="ID-ID">Hijau</Culture>
              <Culture name="MS-MY">Hijau</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27</Culture>
              <Culture name="BG">\u0417\u0435\u043B\u0435\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u7EFF\u8272</Culture>
              <Culture name="ZH-TW">\u7DA0\u8272</Culture>
              <Culture name="HR">Zeleno</Culture>
              <Culture name="CS">Zelen\xE1</Culture>
              <Culture name="DA">Gr\xF8n</Culture>
              <Culture name="NL">Groen</Culture>
              <Culture name="EN-GB">Green</Culture>
              <Culture name="ET">Roheline</Culture>
              <Culture name="FI">Vihre\xE4</Culture>
              <Culture name="FR-CA">Vert</Culture>
              <Culture name="FR-FR">Vert</Culture>
              <Culture name="HU">z\xF6ld</Culture>
              <Culture name="DE">Gr\xFCn</Culture>
              <Culture name="JA">\u7DD1\u8272</Culture>
              <Culture name="IT">Verde</Culture>
              <Culture name="KO">\uB179\uC0C9</Culture>
              <Culture name="NO">Gr\xF8nn</Culture>
              <Culture name="PL">Zielony</Culture>
              <Culture name="PT-BR">Verde</Culture>
              <Culture name="PT-PT">Verde</Culture>
              <Culture name="RO">Verde</Culture>
              <Culture name="RU">\u0417\u0435\u043B\u0435\u043D\u044B\u0439</Culture>
              <Culture name="SK">Zelen\xE1</Culture>
              <Culture name="SL">Zelena</Culture>
              <Culture name="ES-MX">Verde</Culture>
              <Culture name="ES-ES">Verde</Culture>
              <Culture name="SV">Gr\xF6n</Culture>
              <Culture name="TR">Ye\u015Fil</Culture>
              <Culture name="VI">Xanh l\xE1</Culture>
              <Culture name="AR">\u0623\u062E\u0636\u0631</Culture>
              <Culture name="HE-IL">\u05D9\u05E8\u05D5\u05E7</Culture>
              <Culture name="HI-IN">\u0939\u0930\u093E</Culture>
            </TapeColorType>
            <TapeColorType ID="{e48bbc14-0cc4-4b0f-a201-b255a2656449}" rgb="185,185,185">
              <Culture name="EN-US">Clear</Culture>
              <Culture name="ID-ID">Hapus</Culture>
              <Culture name="MS-MY">Kosongkan</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E43\u0E2A</Culture>
              <Culture name="BG">\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u900F\u660E</Culture>
              <Culture name="ZH-TW">\u6E05\u9664</Culture>
              <Culture name="HR">Obri\u0161i</Culture>
              <Culture name="CS">\u010Cist\xE1</Culture>
              <Culture name="DA">Ryd</Culture>
              <Culture name="NL">Wissen</Culture>
              <Culture name="EN-GB">Clear</Culture>
              <Culture name="ET">V\xE4rvitu</Culture>
              <Culture name="FI">Kirkas</Culture>
              <Culture name="FR-CA">Transparent</Culture>
              <Culture name="FR-FR">Transparent</Culture>
              <Culture name="HU">T\xF6rl\xE9s</Culture>
              <Culture name="DE">Transparent</Culture>
              <Culture name="JA">\u900F\u660E</Culture>
              <Culture name="IT">Annulla</Culture>
              <Culture name="KO">\uD22C\uBA85</Culture>
              <Culture name="NO">Klar</Culture>
              <Culture name="PL">Wyra\u017Any</Culture>
              <Culture name="PT-BR">Transparente</Culture>
              <Culture name="PT-PT">Limpar</Culture>
              <Culture name="RO">Transparent</Culture>
              <Culture name="RU">\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0439</Culture>
              <Culture name="SK">\u010C\xEDra</Culture>
              <Culture name="SL">Prozorna</Culture>
              <Culture name="ES-MX">Borrar</Culture>
              <Culture name="ES-ES">Transparente</Culture>
              <Culture name="SV">Rensa</Culture>
              <Culture name="TR">Temizle</Culture>
              <Culture name="VI">Trong su\u1ED1t</Culture>
            </TapeColorType>
            <TapeColorType ID="{3e9c809a-a1bc-4e00-84e3-b98ce2e3a639}" rgb="75,125,175">
              <Culture name="EN-US">Sky Blue</Culture>
              <Culture name="ID-ID">Biru Langit</Culture>
              <Culture name="MS-MY">Biru Langit</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E1F\u0E49\u0E32</Culture>
              <Culture name="BG">\u041D\u0435\u0431\u0435\u0441\u043D\u043E\u0441\u0438\u043D\u044C\u043E</Culture>
              <Culture name="ZH-CN">\u5929\u84DD\u8272</Culture>
              <Culture name="ZH-TW">\u5929\u7A7A\u85CD</Culture>
              <Culture name="HR">Nebeski plavo</Culture>
              <Culture name="CS">Nebesky modr\xE1</Culture>
              <Culture name="DA">Himmelbl\xE5</Culture>
              <Culture name="NL">Hemelsblauw</Culture>
              <Culture name="EN-GB">Sky Blue</Culture>
              <Culture name="ET">Taevasinine</Culture>
              <Culture name="FI">Taivaansininen</Culture>
              <Culture name="FR-CA">Bleu azur\xE9</Culture>
              <Culture name="FR-FR">Bleu ciel</Culture>
              <Culture name="HU">\xE9gsz\xEDnk\xE9k</Culture>
              <Culture name="DE">Himmelblau</Culture>
              <Culture name="JA">\u30B9\u30AB\u30A4\u30D6\u30EB\u30FC</Culture>
              <Culture name="IT">Blu cielo</Culture>
              <Culture name="KO">\uD558\uB298\uC0C9</Culture>
              <Culture name="NO">Himmelbl\xE5</Culture>
              <Culture name="PL">B\u0142\u0119kitny</Culture>
              <Culture name="PT-BR">Azul-celeste</Culture>
              <Culture name="PT-PT">Azul c\xE9u</Culture>
              <Culture name="RO">Azuriu</Culture>
              <Culture name="RU">\u041B\u0430\u0437\u0443\u0440\u043D\u044B\u0439</Culture>
              <Culture name="SK">Belas\xE1</Culture>
              <Culture name="SL">Nebesno modra</Culture>
              <Culture name="ES-MX">Azul cielo</Culture>
              <Culture name="ES-ES">Azul cielo</Culture>
              <Culture name="SV">Himmelsbl\xE5</Culture>
              <Culture name="TR">G\xF6k Mavisi</Culture>
              <Culture name="VI">Thi\xEAn thanh</Culture>
            </TapeColorType>
            <TapeColorType ID="{25c8d031-5c27-4426-9567-c4bf6162aad4}" rgb="185,95,0">
              <Culture name="EN-US">Ochre</Culture>
              <Culture name="ID-ID">Kuning Tua</Culture>
              <Culture name="MS-MY">Kuning Tanah</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07\u0E2D\u0E2D\u0E01\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25</Culture>
              <Culture name="BG">\u041E\u0445\u0440\u0430</Culture>
              <Culture name="ZH-CN">\u8D6D\u8272</Culture>
              <Culture name="ZH-TW">\u8D6D\u8272</Culture>
              <Culture name="HR">Oker</Culture>
              <Culture name="CS">Okrov\xE1</Culture>
              <Culture name="DA">Okker</Culture>
              <Culture name="NL">Oker</Culture>
              <Culture name="EN-GB">Ochre</Culture>
              <Culture name="ET">Ookerkollane</Culture>
              <Culture name="FI">Kellanruskea</Culture>
              <Culture name="FR-CA">Ocre</Culture>
              <Culture name="FR-FR">Ocre</Culture>
              <Culture name="HU">okker</Culture>
              <Culture name="DE">Ocker</Culture>
              <Culture name="JA">\u9EC4\u571F\u8272</Culture>
              <Culture name="IT">Giallo ocra</Culture>
              <Culture name="KO">\uD669\uD1A0\uC0C9</Culture>
              <Culture name="NO">Okergul</Culture>
              <Culture name="PL">Ochra</Culture>
              <Culture name="PT-BR">Ocre</Culture>
              <Culture name="PT-PT">Ocre</Culture>
              <Culture name="RO">Ocru</Culture>
              <Culture name="RU">\u041E\u0445\u0440\u0430</Culture>
              <Culture name="SK">Okrov\xE1</Culture>
              <Culture name="SL">Oker</Culture>
              <Culture name="ES-MX">Ocre</Culture>
              <Culture name="ES-ES">Ocre</Culture>
              <Culture name="SV">Ockergul</Culture>
              <Culture name="TR">Koyu Sar\u0131</Culture>
              <Culture name="VI">N\xE2u v\xE0ng nh\u1EA1t</Culture>
            </TapeColorType>
            <TapeColorType ID="{3484bd2e-1868-4059-bc9d-cfc6dd02c02f}" rgb="123,75,170">
              <Culture name="EN-US">Violet</Culture>
              <Culture name="ID-ID">Violet</Culture>
              <Culture name="MS-MY">Lembayung</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E21\u0E48\u0E27\u0E07\u0E2D\u0E21\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19</Culture>
              <Culture name="BG">\u0412\u0438\u043E\u043B\u0435\u0442\u043E\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u7D2B\u7F57\u5170\u8272</Culture>
              <Culture name="ZH-TW">\u7D2B\u8272</Culture>
              <Culture name="HR">Ljubi\u010Dasto</Culture>
              <Culture name="CS">Fialov\xE1</Culture>
              <Culture name="DA">Violet</Culture>
              <Culture name="NL">Violet</Culture>
              <Culture name="EN-GB">Violet</Culture>
              <Culture name="ET">Violetne</Culture>
              <Culture name="FI">Violetti</Culture>
              <Culture name="FR-CA">Violet</Culture>
              <Culture name="FR-FR">Violet</Culture>
              <Culture name="HU">lila</Culture>
              <Culture name="DE">Purpur</Culture>
              <Culture name="JA">\u30D0\u30A4\u30AA\u30EC\u30C3\u30C8</Culture>
              <Culture name="IT">Violetto</Culture>
              <Culture name="KO">\uC5F0\uBCF4\uB77C\uC0C9</Culture>
              <Culture name="NO">Fiolett</Culture>
              <Culture name="PL">Fioletowy</Culture>
              <Culture name="PT-BR">Violeta</Culture>
              <Culture name="PT-PT">Violeta</Culture>
              <Culture name="RO">Violet</Culture>
              <Culture name="RU">\u041B\u0438\u043B\u043E\u0432\u044B\u0439</Culture>
              <Culture name="SK">Fialov\xE1</Culture>
              <Culture name="SL">Vijoli\u010Dna</Culture>
              <Culture name="ES-MX">Violeta</Culture>
              <Culture name="ES-ES">Violeta</Culture>
              <Culture name="SV">Violett</Culture>
              <Culture name="TR">Mor</Culture>
              <Culture name="VI">T\xEDm</Culture>
            </TapeColorType>
            <TapeColorType ID="{2d72aced-f608-404e-97de-cff5121af135}" rgb="27,53,143">
              <Culture name="EN-US">Blue</Culture>
              <Culture name="ID-ID">Biru</Culture>
              <Culture name="MS-MY">Biru</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E1F\u0E49\u0E32</Culture>
              <Culture name="BG">\u0421\u0438\u043D\u044C\u043E</Culture>
              <Culture name="ZH-CN">\u84DD\u8272</Culture>
              <Culture name="ZH-TW">\u85CD\u8272</Culture>
              <Culture name="HR">Plavo</Culture>
              <Culture name="CS">Modr\xE1</Culture>
              <Culture name="DA">Bl\xE5</Culture>
              <Culture name="NL">Blauw</Culture>
              <Culture name="EN-GB">Blue</Culture>
              <Culture name="ET">Sinine</Culture>
              <Culture name="FI">Sininen</Culture>
              <Culture name="FR-CA">Bleu</Culture>
              <Culture name="FR-FR">Bleu</Culture>
              <Culture name="HU">k\xE9k</Culture>
              <Culture name="DE">Blau</Culture>
              <Culture name="JA">\u9752\u8272</Culture>
              <Culture name="IT">Blu</Culture>
              <Culture name="KO">\uD30C\uB780\uC0C9</Culture>
              <Culture name="NO">Bl\xE5</Culture>
              <Culture name="PL">Niebieski</Culture>
              <Culture name="PT-BR">Azul</Culture>
              <Culture name="PT-PT">Azul</Culture>
              <Culture name="RO">Albastru</Culture>
              <Culture name="RU">\u0421\u0438\u043D\u0438\u0439</Culture>
              <Culture name="SK">Modr\xE1</Culture>
              <Culture name="SL">Modra</Culture>
              <Culture name="ES-MX">Azul</Culture>
              <Culture name="ES-ES">Azul</Culture>
              <Culture name="SV">Bl\xE5</Culture>
              <Culture name="TR">Mavi</Culture>
              <Culture name="VI">Xanh d\u01B0\u01A1ng</Culture>
              <Culture name="AR">\u0623\u0632\u0631\u0642</Culture>
              <Culture name="HE-IL">\u05DB\u05D7\u05D5\u05DC</Culture>
              <Culture name="HI-IN">\u0928\u0940\u0932\u093E</Culture>
            </TapeColorType>
            <TapeColorType ID="{b6fd0f50-868e-480d-bbdb-db78c7276aa5}" rgb="0,177,64">
              <Culture name="EN-US">Pastel Green</Culture>
            </TapeColorType>
            <TapeColorType ID="{cda5fc33-617e-46a9-bb0f-dc79fc9c4054}" rgb="240,210,140">
              <Culture name="EN-US">Tan</Culture>
              <Culture name="ID-ID">Sawo Matang</Culture>
              <Culture name="MS-MY">Perang</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E44\u0E2B\u0E21\u0E49</Culture>
              <Culture name="BG">\u0416\u044A\u043B\u0442\u0435\u043D\u0438\u043A\u0430\u0432\u043E \u043A\u0430\u0444\u044F\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u68D5\u8910\u8272</Culture>
              <Culture name="ZH-TW">\u68D5\u8910\u8272</Culture>
              <Culture name="HR">\u017Duto-sme\u0111e</Culture>
              <Culture name="CS">Sv\u011Btle hn\u011Bd\xE1</Culture>
              <Culture name="DA">Gyldenbrun</Culture>
              <Culture name="NL">Geelbruin</Culture>
              <Culture name="EN-GB">Tan</Culture>
              <Culture name="ET">Bee\u017E</Culture>
              <Culture name="FI">Beigenruskea</Culture>
              <Culture name="FR-CA">Havane</Culture>
              <Culture name="FR-FR">Caramel</Culture>
              <Culture name="HU">s\xE1rg\xE1sbarna</Culture>
              <Culture name="DE">Gelbbraun</Culture>
              <Culture name="JA">\u9EC4\u8910\u8272</Culture>
              <Culture name="IT">Marrone chiaro</Culture>
              <Culture name="KO">\uD669\uAC08\uC0C9</Culture>
              <Culture name="NO">Hudfarge</Culture>
              <Culture name="PL">Opalony</Culture>
              <Culture name="PT-BR">Bege</Culture>
              <Culture name="PT-PT">Pele</Culture>
              <Culture name="RO">Bronz</Culture>
              <Culture name="RU">\u0416\u0435\u043B\u0442\u043E-\u043A\u043E\u0440\u0438\u0447\u043D\u0435\u0432\u044B\u0439</Culture>
              <Culture name="SK">Svetlohned\xE1</Culture>
              <Culture name="SL">Ko\u017Ena barva</Culture>
              <Culture name="ES-MX">Bronceado</Culture>
              <Culture name="ES-ES">Tostado</Culture>
              <Culture name="SV">Mellanbrun</Culture>
              <Culture name="TR">Ten Rengi</Culture>
              <Culture name="VI">N\xE2u v\xE0ng</Culture>
            </TapeColorType>
            <TapeColorType ID="{96dc87c2-3ff2-43b3-9ab6-e57dcd7c9e58}" rgb="255,127,65">
              <Culture name="EN-US">Pastel Orange</Culture>
            </TapeColorType>
            <TapeColorType ID="{4d652414-d965-4bfc-bcff-e76e7da5f0cf}" rgb="192,192,192">
              <Culture name="EN-US">Silver</Culture>
              <Culture name="ID-ID">Perak</Culture>
              <Culture name="MS-MY">Perak</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E07\u0E34\u0E19</Culture>
              <Culture name="BG">\u0421\u0440\u0435\u0431\u0440\u0438\u0441\u0442\u043E</Culture>
              <Culture name="ZH-CN">\u94F6\u8272</Culture>
              <Culture name="ZH-TW">\u9280\u8272</Culture>
              <Culture name="HR">Srebrno</Culture>
              <Culture name="CS">St\u0159\xEDbrn\xE1</Culture>
              <Culture name="DA">S\xF8lv</Culture>
              <Culture name="NL">Zilver</Culture>
              <Culture name="EN-GB">Silver</Culture>
              <Culture name="ET">H\xF5bedane</Culture>
              <Culture name="FI">Hopea</Culture>
              <Culture name="FR-CA">Argent</Culture>
              <Culture name="FR-FR">Argent</Culture>
              <Culture name="HU">ez\xFCst</Culture>
              <Culture name="DE">Silbern</Culture>
              <Culture name="JA">\u30B7\u30EB\u30D0\u30FC</Culture>
              <Culture name="IT">Argento</Culture>
              <Culture name="KO">\uC740\uC0C9</Culture>
              <Culture name="NO">S\xF8lv</Culture>
              <Culture name="PL">Srebrny</Culture>
              <Culture name="PT-BR">Prateado</Culture>
              <Culture name="PT-PT">Prata</Culture>
              <Culture name="RO">Argintiu</Culture>
              <Culture name="RU">\u0421\u0435\u0440\u0435\u0431\u0440\u0438\u0441\u0442\u044B\u0439</Culture>
              <Culture name="SK">Strieborn\xE1</Culture>
              <Culture name="SL">Srebrna</Culture>
              <Culture name="ES-MX">Plateado</Culture>
              <Culture name="ES-ES">Plateado</Culture>
              <Culture name="SV">Silver</Culture>
              <Culture name="TR">G\xFCm\xFC\u015F</Culture>
              <Culture name="VI">B\u1EA1c</Culture>
            </TapeColorType>
            <TapeColorType ID="{420418dc-d97d-4696-a643-ea5db7990ebd}" rgb="200,31,31">
              <Culture name="EN-US">Red</Culture>
              <Culture name="ID-ID">Merah</Culture>
              <Culture name="MS-MY">Merah</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E41\u0E14\u0E07</Culture>
              <Culture name="BG">\u0427\u0435\u0440\u0432\u0435\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u7EA2\u8272</Culture>
              <Culture name="ZH-TW">\u7D05\u8272</Culture>
              <Culture name="HR">Crveno</Culture>
              <Culture name="CS">\u010Cerven\xE1</Culture>
              <Culture name="DA">R\xF8d</Culture>
              <Culture name="NL">Rood</Culture>
              <Culture name="EN-GB">Red</Culture>
              <Culture name="ET">Punane</Culture>
              <Culture name="FI">Punainen</Culture>
              <Culture name="FR-CA">Rouge</Culture>
              <Culture name="FR-FR">Rouge</Culture>
              <Culture name="HU">piros</Culture>
              <Culture name="DE">Rot</Culture>
              <Culture name="JA">\u8D64\u8272</Culture>
              <Culture name="IT">Rosso</Culture>
              <Culture name="KO">\uBE68\uAC04\uC0C9</Culture>
              <Culture name="NO">R\xF8d</Culture>
              <Culture name="PL">Czerwony</Culture>
              <Culture name="PT-BR">Vermelho</Culture>
              <Culture name="PT-PT">Vermelho</Culture>
              <Culture name="RO">Ro\u0219u</Culture>
              <Culture name="RU">\u041A\u0440\u0430\u0441\u043D\u044B\u0439</Culture>
              <Culture name="SK">\u010Cerven\xE1</Culture>
              <Culture name="SL">Rde\u010Da</Culture>
              <Culture name="ES-MX">Rojo</Culture>
              <Culture name="ES-ES">Rojo</Culture>
              <Culture name="SV">R\xF6d</Culture>
              <Culture name="TR">K\u0131rm\u0131z\u0131</Culture>
              <Culture name="VI">\u0110\u1ECF</Culture>
              <Culture name="AR">\u0623\u062D\u0645\u0631</Culture>
              <Culture name="HE-IL">\u05D0\u05D3\u05D5\u05DD</Culture>
              <Culture name="HI-IN">\u0932\u093E\u0932</Culture>
            </TapeColorType>
          </TapeColors>
          <RibbonColors>
            <RibbonColorType ID="{00000000-0000-0000-0000-000000000000}" rgb="255,255,255">
              <Culture name="EN-US">White</Culture>
              <Culture name="ID-ID">Putih</Culture>
              <Culture name="MS-MY">Putih</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E02\u0E32\u0E27</Culture>
              <Culture name="BG">\u0411\u044F\u043B\u043E</Culture>
              <Culture name="ZH-CN">\u767D\u8272</Culture>
              <Culture name="ZH-TW">\u767D\u8272</Culture>
              <Culture name="HR">Bijelo</Culture>
              <Culture name="CS">B\xEDl\xE1</Culture>
              <Culture name="DA">Hvid</Culture>
              <Culture name="NL">Wit</Culture>
              <Culture name="EN-GB">White</Culture>
              <Culture name="ET">Valge</Culture>
              <Culture name="FI">Valkoinen</Culture>
              <Culture name="FR-CA">Blanc</Culture>
              <Culture name="FR-FR">Blanc</Culture>
              <Culture name="HU">feh\xE9r</Culture>
              <Culture name="DE">Wei\xDF</Culture>
              <Culture name="JA">\u767D</Culture>
              <Culture name="IT">Bianco</Culture>
              <Culture name="KO">\uD770\uC0C9</Culture>
              <Culture name="NO">Hvit</Culture>
              <Culture name="PL">Bia\u0142y</Culture>
              <Culture name="PT-BR">Branco</Culture>
              <Culture name="PT-PT">Branco</Culture>
              <Culture name="RO">Alb</Culture>
              <Culture name="RU">\u0411\u0435\u043B\u044B\u0439</Culture>
              <Culture name="SK">Biela</Culture>
              <Culture name="SL">Bela</Culture>
              <Culture name="ES-MX">Blanco</Culture>
              <Culture name="ES-ES">Blanco</Culture>
              <Culture name="SV">Vit</Culture>
              <Culture name="TR">Beyaz</Culture>
              <Culture name="VI">Tr\u1EAFng</Culture>
              <Culture name="AR">\u0623\u0628\u064A\u0636</Culture>
              <Culture name="HE-IL">\u05DC\u05D1\u05DF</Culture>
              <Culture name="HI-IN">\u0938\u092B\u093C\u0947\u0926</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{167b90d0-cd37-4b32-a8f3-73a41ff9e09e}" rgb="0,0,0">
              <Culture name="EN-US">Black</Culture>
              <Culture name="ID-ID">Hitam</Culture>
              <Culture name="MS-MY">Hitam</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E14\u0E33</Culture>
              <Culture name="BG">\u0427\u0435\u0440\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u9ED1\u8272</Culture>
              <Culture name="ZH-TW">\u9ED1\u8272</Culture>
              <Culture name="HR">Crno</Culture>
              <Culture name="CS">\u010Cern\xE1</Culture>
              <Culture name="DA">Sort</Culture>
              <Culture name="NL">Zwart</Culture>
              <Culture name="EN-GB">Black</Culture>
              <Culture name="ET">Must</Culture>
              <Culture name="FI">Musta</Culture>
              <Culture name="FR-CA">Noir</Culture>
              <Culture name="FR-FR">Noir</Culture>
              <Culture name="HU">fekete</Culture>
              <Culture name="DE">Schwarz</Culture>
              <Culture name="JA">\u9ED2</Culture>
              <Culture name="IT">Nero</Culture>
              <Culture name="KO">\uAC80\uC815\uC0C9</Culture>
              <Culture name="NO">Svart</Culture>
              <Culture name="PL">Czarny</Culture>
              <Culture name="PT-BR">Preto</Culture>
              <Culture name="PT-PT">Preto</Culture>
              <Culture name="RO">Negru</Culture>
              <Culture name="RU">\u0427\u0435\u0440\u043D\u044B\u0439</Culture>
              <Culture name="SK">\u010Cierna</Culture>
              <Culture name="SL">\u010Crna</Culture>
              <Culture name="ES-MX">Negro</Culture>
              <Culture name="ES-ES">Negro</Culture>
              <Culture name="SV">Svart</Culture>
              <Culture name="TR">Siyah</Culture>
              <Culture name="VI">\u0110en</Culture>
              <Culture name="AR">\u0623\u0633\u0648\u062F</Culture>
              <Culture name="HE-IL">\u05E9\u05D7\u05D5\u05E8</Culture>
              <Culture name="HI-IN">\u0915\u093E\u0932\u093E</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{8791ea2b-733a-43f6-b837-7992a7e10dfb}" rgb="255,205,0">
              <Culture name="EN-US">Yellow</Culture>
              <Culture name="ID-ID">Kuning</Culture>
              <Culture name="MS-MY">Kuning</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07</Culture>
              <Culture name="BG">\u0416\u044A\u043B\u0442\u043E</Culture>
              <Culture name="ZH-CN">\u9EC4\u8272</Culture>
              <Culture name="ZH-TW">\u9EC3\u8272</Culture>
              <Culture name="HR">\u017Duto</Culture>
              <Culture name="CS">\u017Dlut\xE1</Culture>
              <Culture name="DA">Gul</Culture>
              <Culture name="NL">Geel</Culture>
              <Culture name="EN-GB">Yellow</Culture>
              <Culture name="ET">Kollane</Culture>
              <Culture name="FI">Keltainen</Culture>
              <Culture name="FR-CA">Jaune</Culture>
              <Culture name="FR-FR">Jaune</Culture>
              <Culture name="HU">s\xE1rga</Culture>
              <Culture name="DE">Gelb</Culture>
              <Culture name="JA">\u9EC4\u8272</Culture>
              <Culture name="IT">Giallo</Culture>
              <Culture name="KO">\uB178\uB780\uC0C9</Culture>
              <Culture name="NO">Gul</Culture>
              <Culture name="PL">\u017B\xF3\u0142ty</Culture>
              <Culture name="PT-BR">Amarelo</Culture>
              <Culture name="PT-PT">Amarelo</Culture>
              <Culture name="RO">Galben</Culture>
              <Culture name="RU">\u0416\u0435\u043B\u0442\u044B\u0439</Culture>
              <Culture name="SK">\u017Dlt\xE1</Culture>
              <Culture name="SL">Rumena</Culture>
              <Culture name="ES-MX">Amarillo</Culture>
              <Culture name="ES-ES">Amarillo</Culture>
              <Culture name="SV">Gul</Culture>
              <Culture name="TR">Sar\u0131</Culture>
              <Culture name="VI">V\xE0ng</Culture>
              <Culture name="AR">\u0623\u0635\u0641\u0631</Culture>
              <Culture name="HE-IL">\u05E6\u05D4\u05D5\u05D1</Culture>
              <Culture name="HI-IN">\u092A\u0940\u0932\u093E</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{460dfda1-ff09-412a-8fdc-85f3ae4bfd0f}" rgb="255,100,0">
              <Culture name="EN-US">Orange</Culture>
              <Culture name="ID-ID">Oranye</Culture>
              <Culture name="MS-MY">Jingga</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E2A\u0E49\u0E21</Culture>
              <Culture name="BG">\u041E\u0440\u0430\u043D\u0436\u0435\u0432\u043E</Culture>
              <Culture name="ZH-CN">\u6A59\u8272</Culture>
              <Culture name="ZH-TW">\u6A59\u8272</Culture>
              <Culture name="HR">Naran\u010Dasto</Culture>
              <Culture name="CS">Oran\u017Eov\xE1</Culture>
              <Culture name="DA">Orange</Culture>
              <Culture name="NL">Oranje</Culture>
              <Culture name="EN-GB">Orange</Culture>
              <Culture name="ET">Oran\u017E</Culture>
              <Culture name="FI">Oranssi</Culture>
              <Culture name="FR-CA">Orange</Culture>
              <Culture name="FR-FR">Orange</Culture>
              <Culture name="HU">narancss\xE1rga</Culture>
              <Culture name="DE">Orange</Culture>
              <Culture name="JA">\u30AA\u30EC\u30F3\u30B8</Culture>
              <Culture name="IT">Arancione</Culture>
              <Culture name="KO">\uC8FC\uD669\uC0C9</Culture>
              <Culture name="NO">Oransje</Culture>
              <Culture name="PL">Pomara\u0144czowy</Culture>
              <Culture name="PT-BR">Laranja</Culture>
              <Culture name="PT-PT">Laranja</Culture>
              <Culture name="RO">Portocaliu</Culture>
              <Culture name="RU">\u041E\u0440\u0430\u043D\u0436\u0435\u0432\u044B\u0439</Culture>
              <Culture name="SK">Oran\u017Eov\xE1</Culture>
              <Culture name="SL">Oran\u017Ena</Culture>
              <Culture name="ES-MX">Naranja</Culture>
              <Culture name="ES-ES">Naranja</Culture>
              <Culture name="SV">Orange</Culture>
              <Culture name="TR">Turuncu</Culture>
              <Culture name="VI">Cam</Culture>
              <Culture name="AR">\u0628\u0631\u062A\u0642\u0627\u0644\u064A</Culture>
              <Culture name="HE-IL">\u05DB\u05EA\u05D5\u05DD</Culture>
              <Culture name="HI-IN">\u0928\u093E\u0930\u0902\u0917\u0940</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{efd92612-00dc-4c04-a8bc-aae43db50aab}" rgb="60,132,52">
              <Culture name="EN-US">Green</Culture>
              <Culture name="ID-ID">Hijau</Culture>
              <Culture name="MS-MY">Hijau</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27</Culture>
              <Culture name="BG">\u0417\u0435\u043B\u0435\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u7EFF\u8272</Culture>
              <Culture name="ZH-TW">\u7DA0\u8272</Culture>
              <Culture name="HR">Zeleno</Culture>
              <Culture name="CS">Zelen\xE1</Culture>
              <Culture name="DA">Gr\xF8n</Culture>
              <Culture name="NL">Groen</Culture>
              <Culture name="EN-GB">Green</Culture>
              <Culture name="ET">Roheline</Culture>
              <Culture name="FI">Vihre\xE4</Culture>
              <Culture name="FR-CA">Vert</Culture>
              <Culture name="FR-FR">Vert</Culture>
              <Culture name="HU">z\xF6ld</Culture>
              <Culture name="DE">Gr\xFCn</Culture>
              <Culture name="JA">\u7DD1\u8272</Culture>
              <Culture name="IT">Verde</Culture>
              <Culture name="KO">\uB179\uC0C9</Culture>
              <Culture name="NO">Gr\xF8nn</Culture>
              <Culture name="PL">Zielony</Culture>
              <Culture name="PT-BR">Verde</Culture>
              <Culture name="PT-PT">Verde</Culture>
              <Culture name="RO">Verde</Culture>
              <Culture name="RU">\u0417\u0435\u043B\u0435\u043D\u044B\u0439</Culture>
              <Culture name="SK">Zelen\xE1</Culture>
              <Culture name="SL">Zelena</Culture>
              <Culture name="ES-MX">Verde</Culture>
              <Culture name="ES-ES">Verde</Culture>
              <Culture name="SV">Gr\xF6n</Culture>
              <Culture name="TR">Ye\u015Fil</Culture>
              <Culture name="VI">Xanh l\xE1</Culture>
              <Culture name="AR">\u0623\u062E\u0636\u0631</Culture>
              <Culture name="HE-IL">\u05D9\u05E8\u05D5\u05E7</Culture>
              <Culture name="HI-IN">\u0939\u0930\u093E</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{2d72aced-f608-404e-97de-cff5121af135}" rgb="27,53,143">
              <Culture name="EN-US">Blue</Culture>
              <Culture name="ID-ID">Biru</Culture>
              <Culture name="MS-MY">Biru</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E1F\u0E49\u0E32</Culture>
              <Culture name="BG">\u0421\u0438\u043D\u044C\u043E</Culture>
              <Culture name="ZH-CN">\u84DD\u8272</Culture>
              <Culture name="ZH-TW">\u85CD\u8272</Culture>
              <Culture name="HR">Plavo</Culture>
              <Culture name="CS">Modr\xE1</Culture>
              <Culture name="DA">Bl\xE5</Culture>
              <Culture name="NL">Blauw</Culture>
              <Culture name="EN-GB">Blue</Culture>
              <Culture name="ET">Sinine</Culture>
              <Culture name="FI">Sininen</Culture>
              <Culture name="FR-CA">Bleu</Culture>
              <Culture name="FR-FR">Bleu</Culture>
              <Culture name="HU">k\xE9k</Culture>
              <Culture name="DE">Blau</Culture>
              <Culture name="JA">\u9752\u8272</Culture>
              <Culture name="IT">Blu</Culture>
              <Culture name="KO">\uD30C\uB780\uC0C9</Culture>
              <Culture name="NO">Bl\xE5</Culture>
              <Culture name="PL">Niebieski</Culture>
              <Culture name="PT-BR">Azul</Culture>
              <Culture name="PT-PT">Azul</Culture>
              <Culture name="RO">Albastru</Culture>
              <Culture name="RU">\u0421\u0438\u043D\u0438\u0439</Culture>
              <Culture name="SK">Modr\xE1</Culture>
              <Culture name="SL">Modra</Culture>
              <Culture name="ES-MX">Azul</Culture>
              <Culture name="ES-ES">Azul</Culture>
              <Culture name="SV">Bl\xE5</Culture>
              <Culture name="TR">Mavi</Culture>
              <Culture name="VI">Xanh d\u01B0\u01A1ng</Culture>
              <Culture name="AR">\u0623\u0632\u0631\u0642</Culture>
              <Culture name="HE-IL">\u05DB\u05D7\u05D5\u05DC</Culture>
              <Culture name="HI-IN">\u0928\u0940\u0932\u093E</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{420418dc-d97d-4696-a643-ea5db7990ebd}" rgb="200,31,31">
              <Culture name="EN-US">Red</Culture>
              <Culture name="ID-ID">Merah</Culture>
              <Culture name="MS-MY">Merah</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E41\u0E14\u0E07</Culture>
              <Culture name="BG">\u0427\u0435\u0440\u0432\u0435\u043D\u043E</Culture>
              <Culture name="ZH-CN">\u7EA2\u8272</Culture>
              <Culture name="ZH-TW">\u7D05\u8272</Culture>
              <Culture name="HR">Crveno</Culture>
              <Culture name="CS">\u010Cerven\xE1</Culture>
              <Culture name="DA">R\xF8d</Culture>
              <Culture name="NL">Rood</Culture>
              <Culture name="EN-GB">Red</Culture>
              <Culture name="ET">Punane</Culture>
              <Culture name="FI">Punainen</Culture>
              <Culture name="FR-CA">Rouge</Culture>
              <Culture name="FR-FR">Rouge</Culture>
              <Culture name="HU">piros</Culture>
              <Culture name="DE">Rot</Culture>
              <Culture name="JA">\u8D64\u8272</Culture>
              <Culture name="IT">Rosso</Culture>
              <Culture name="KO">\uBE68\uAC04\uC0C9</Culture>
              <Culture name="NO">R\xF8d</Culture>
              <Culture name="PL">Czerwony</Culture>
              <Culture name="PT-BR">Vermelho</Culture>
              <Culture name="PT-PT">Vermelho</Culture>
              <Culture name="RO">Ro\u0219u</Culture>
              <Culture name="RU">\u041A\u0440\u0430\u0441\u043D\u044B\u0439</Culture>
              <Culture name="SK">\u010Cerven\xE1</Culture>
              <Culture name="SL">Rde\u010Da</Culture>
              <Culture name="ES-MX">Rojo</Culture>
              <Culture name="ES-ES">Rojo</Culture>
              <Culture name="SV">R\xF6d</Culture>
              <Culture name="TR">K\u0131rm\u0131z\u0131</Culture>
              <Culture name="VI">\u0110\u1ECF</Culture>
              <Culture name="AR">\u0623\u062D\u0645\u0631</Culture>
              <Culture name="HE-IL">\u05D0\u05D3\u05D5\u05DD</Culture>
              <Culture name="HI-IN">\u0932\u093E\u0932</Culture>
            </RibbonColorType>
            <RibbonColorType ID="{9d50f15c-c09a-4ac3-a68f-7779e6367b02}" rgb="255,0,255">
              <Culture name="EN-US">Magenta</Culture>
              <Culture name="ID-ID">Magenta</Culture>
              <Culture name="MS-MY">Magenta</Culture>
              <Culture name="TH-TH">\u0E2A\u0E35\u0E21\u0E48\u0E27\u0E07\u0E41\u0E14\u0E07</Culture>
              <Culture name="BG">\u041F\u0443\u0440\u043F\u0443\u0440</Culture>
              <Culture name="ZH-CN">\u6D0B\u7EA2\u8272</Culture>
              <Culture name="ZH-TW">\u6D0B\u7D05\u8272</Culture>
              <Culture name="HR">Purpurno crveno</Culture>
              <Culture name="CS">Fuchsiov\xE1</Culture>
              <Culture name="DA">Magenta</Culture>
              <Culture name="NL">Magenta</Culture>
              <Culture name="EN-GB">Magenta</Culture>
              <Culture name="ET">Fuksia</Culture>
              <Culture name="FI">Magenta</Culture>
              <Culture name="FR-CA">Magenta</Culture>
              <Culture name="FR-FR">Magenta</Culture>
              <Culture name="HU">magenta</Culture>
              <Culture name="DE">Magenta</Culture>
              <Culture name="JA">\u30DE\u30BC\u30F3\u30BF</Culture>
              <Culture name="IT">Magenta</Culture>
              <Culture name="KO">\uC790\uC8FC\uC0C9</Culture>
              <Culture name="NO">Magentar\xF8d</Culture>
              <Culture name="PL">Magenta</Culture>
              <Culture name="PT-BR">Magenta</Culture>
              <Culture name="PT-PT">Magenta</Culture>
              <Culture name="RO">Fucsia</Culture>
              <Culture name="RU">\u041F\u0443\u0440\u043F\u0443\u0440\u043D\u044B\u0439</Culture>
              <Culture name="SK">Purpurov\xE1</Culture>
              <Culture name="SL">Magenta</Culture>
              <Culture name="ES-MX">Magenta</Culture>
              <Culture name="ES-ES">Magenta</Culture>
              <Culture name="SV">Magenta</Culture>
              <Culture name="TR">Eflatun</Culture>
              <Culture name="VI">\u0110\u1ECF s\u1EADm</Culture>
              <Culture name="AR">\u0623\u0631\u062C\u0648\u0627\u0646\u064A</Culture>
              <Culture name="HE-IL">\u05DE\u05D2'\u05E0\u05D8\u05D4</Culture>
              <Culture name="HI-IN">\u092E\u0948\u091C\u0947\u0902\u091F\u093E</Culture>
            </RibbonColorType>
          </RibbonColors>
        </PartsDatabase>`;
  }
};
var r;
var a = function(e2, t2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(a2, i2) {
    function s2(e3) {
      try {
        u2(r2.next(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function o2(e3) {
      try {
        u2(r2.throw(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function u2(e3) {
      var t3;
      e3.done ? a2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
        e4(t3);
      })).then(s2, o2);
    }
    u2((r2 = r2.apply(e2, t2 || [])).next());
  });
};
var i = class {
  constructor(e2, t2, n2, r2, a2, i2, s2, o2) {
    this.partNames = e2, this.mediaIsDieCut = t2, this.mediaIsSelfLam = r2, this.mediaIsPermaSleeve = n2, this.width = a2 / 100, this.height = i2 / 100, this.leftOffset = s2 / 100, this.verticalOffset = o2 / 100;
  }
};
var s = class {
  constructor(t2, n2) {
    this.zoneDimensions = {}, this.yNumber = t2, this.partInfo = n2, this.partNames = this.partInfo.hasOwnProperty("RelatedParts") ? this.findPartName() : n2.Name, this.mediaIsDieCut = "true" !== this.partInfo.IsContinuous.toString().toLowerCase(), this.orientation = "Landscape" === this.partInfo.OutputOrientation ? e.Landscape : e.Portrait, this.findZoneDimensions(), this.width = "string" == typeof this.partInfo.Width ? parseFloat(this.partInfo.Width) / 1e4 : this.partInfo.Width / 1e4, this.height = "string" == typeof this.partInfo.Height ? parseFloat(this.partInfo.Height) / 1e4 : this.partInfo.Height / 1e4, this.zoneDimensions.hasOwnProperty("rotation") ? this.rotation = this.zoneDimensions.rotation : this.partInfo.hasOwnProperty("Rotation") ? this.rotation = parseFloat(this.partInfo.Rotation) : this.rotation = 0, this.zoneDimensions.hasOwnProperty("offsetX") ? this.leftOffset = this.zoneDimensions.offsetX : this.partInfo.hasOwnProperty("MarginLeft") ? this.leftOffset = parseFloat(this.partInfo.MarginLeft) / 1e4 : this.leftOffset = 0, this.zoneDimensions.hasOwnProperty("offsetY") ? this.verticalOffset = this.zoneDimensions.offsetY : this.partInfo.hasOwnProperty("MarginTop") ? this.verticalOffset = parseFloat(this.partInfo.MarginTop) / 1e4 : this.verticalOffset = 0;
  }
  findZoneDimensions() {
    if (this.partInfo.Zones) {
      const e2 = this.partInfo.Zones;
      if (Array.isArray(e2)) "Printable" === e2[0].Type && (this.zoneDimensions.width = e2[0].Width / 1e4, this.zoneDimensions.height = e2[0].Height / 1e4, this.zoneDimensions.offsetX = e2[0].LeftOffset / 1e4, this.zoneDimensions.offsetY = e2[0].VerticalOffset / 1e4, this.zoneDimensions.rotation = e2[0].Rotation);
      else for (const t2 in e2) if ("Printable" === e2[t2].Type) {
        this.zoneDimensions.width = parseFloat(e2[t2].Width) / 1e4, this.zoneDimensions.height = parseFloat(e2[t2].Height) / 1e4, this.zoneDimensions.offsetX = parseFloat(e2[t2].OffsetX) / 1e4, this.zoneDimensions.offsetY = parseFloat(e2[t2].OffsetY) / 1e4;
        break;
      }
    }
  }
  findPartName() {
    if ("RelatedParts" in this.partInfo) {
      for (const e2 in this.partInfo.RelatedParts) if (this.partInfo.RelatedParts[e2].YNumber === this.yNumber) return this.partInfo.RelatedParts[e2].PartName;
    }
  }
};
var o = class {
  constructor() {
    this.initialize();
  }
  initialize() {
    return a(this, void 0, void 0, function* () {
      this.parsedData = yield this.parsePartsDbData();
    });
  }
  parsePartsDbData() {
    return a(this, void 0, void 0, function* () {
      try {
        const e2 = new n(), t2 = new DOMParser().parseFromString(e2.partsDB, "text/xml").getElementsByTagName("Parts")[0];
        return Array.from(t2.children).map((e3) => {
          const t3 = {
            Name: "",
            ColumnsPerSheet: "",
            DefaultYNumber: "",
            Description: "",
            FamilyInfo: "",
            GapHorizontal: "",
            GapVertical: "",
            Width: "",
            Height: "",
            IsContinuous: "",
            OutputOrientation: "",
            IsCustom: "",
            IsDoubleSided: "",
            IsFactoryDefined: "",
            IsPrePrinted: "",
            IsSlitSleeve: "",
            MarginLeft: "",
            MarginTop: "",
            Rotation: "",
            RelatedParts: {}
          }, n2 = {};
          return Array.from(e3.children).forEach((e4) => {
            if ("RelatedParts" === e4.nodeName) {
              let n3 = 0;
              const r2 = {};
              Array.from(e4.children).forEach((e5) => {
                const t4 = {
                  PartName: e5.getAttribute("PartName") || "",
                  YNumber: e5.getAttribute("YNumber") || ""
                };
                r2[n3.toString()] = t4, n3++;
              }), t3[e4.nodeName] = r2;
            } else if ("Zone" === e4.nodeName) {
              const r2 = {
                ID: e4.getAttribute("ID") || "",
                Type: e4.getAttribute("Type") || "",
                Shape: e4.getAttribute("Shape") || "",
                LabelSide: e4.getAttribute("LabelSide") || "",
                Width: e4.getAttribute("Width") || "",
                Height: e4.getAttribute("Height") || "",
                OffsetX: e4.getAttribute("OffsetX") || "",
                OffsetY: e4.getAttribute("OffsetY") || "",
                CornerRadius: e4.getAttribute("CornerRadius") || "",
                UserEditable: e4.getAttribute("UserEditable") || ""
              };
              n2[r2.ID] = r2, t3.Zones = n2;
            } else t3[e4.nodeName] = e4.textContent;
          }), t3;
        });
      } catch (e2) {
        return console.error("Error parsing parts database:", e2), [];
      }
    });
  }
};
var u = class {
  constructor() {
    this.potentialParts = [], this.invalidMediaPart = null, this.partInfoList = [], this.partInfoList.push(new i([new l("4918675", "M21-11-427")], true, false, true, 37, 50, 9, 0)), this.partInfoList.push(new i([new l("4918682", "M21-11-499"), new l("4918687", "M21-7-423")], true, false, false, 50, 75, 7, 0)), this.partInfoList.push(new i([new l("4900592", "M21-125-C-342"), new l("4900578", "M21-125-C-342-YL")], false, true, false, 21, 0, 0, 0)), this.partInfoList.push(new i([new l("4900577", "M21-1250-427")], false, false, true, 50, 0, 0, 0)), this.partInfoList.push(new i([new l("5027106", "M21-131-461"), new l("4918683", "M21-131-499"), new l("4918688", "M21-17-423")], true, false, false, 50, 100, 7, 0)), this.partInfoList.push(new i([new l("4918676", "M21-18-427")], true, false, true, 37, 100, 9, 0)), this.partInfoList.push(new i([new l("4918685", "M21-136-499"), new l("4918690", "M21-30-423")], true, false, false, 75, 150, 0, 0)), this.partInfoList.push(new i([new l("4918691", "M21-137-423"), new l("4918686", "M21-137-499")], true, false, false, 75, 200, 0, 0)), this.partInfoList.push(new i([new l("4900579", "M21-1500-427")], false, false, true, 50, 0, 23, 0)), this.partInfoList.push(new i([new l("4918689", "M21-18-423"), new l("4918684", "M21-18-499")], true, false, false, 75, 100, 0, 0)), this.partInfoList.push(new i([new l("4900580", "M21-187-C-342"), new l("4900581", "M21-187-C-342-YL")], false, true, false, 31, 0, 0, 0)), this.partInfoList.push(new i([new l("4857738", "M21-250-414"), new l("4900602", "M21-250-423"), new l("4900603", "M21-250-430"), new l("4900604", "M21-250-430-WT-CL"), new l("4900605", "M21-250-595-WT"), new l("4900606", "M21-250-595-YL")], false, false, false, 25, 0, 0, 0)), this.partInfoList.push(new i([new l("4900607", "M21-250-C-342"), new l("4900608", "M21-250-C-342-YL")], false, true, false, 41, 0, 0, 0)), this.partInfoList.push(new i([new l("4900609", "M21-375-423"), new l("4900610", "M21-375-430"), new l("4900611", "M21-375-430-WT-CL"), new l("4900612", "M21-375-461"), new l("4900613", "M21-375-488"), new l("4900614", "M21-375-499"), new l("4900616", "M21-375-595-BK"), new l("4900617", "M21-375-595-BL"), new l("4900618", "M21-375-595-BR"), new l("4900619", "M21-375-595-GN"), new l("4900620", "M21-375-595-GY"), new l("4900621", "M21-375-595-OR"), new l("4900622", "M21-375-595-PL"), new l("4900623", "M21-375-595-RD"), new l("4900624", "M21-375-595-WT"), new l("4900625", "M21-375-595-YL"), new l("4900626", "M21-375-7425")], false, false, false, 37, 0, 8, 0)), this.partInfoList.push(new i([new l("4900615", "M21-375-499-TB")], false, false, false, 37, 0, 8, 0)), this.partInfoList.push(new i([new l("4900627", "M21-375-C-342"), new l("4900628", "M21-375-C-342-YL")], false, true, false, 60, 0, 0, 0)), this.partInfoList.push(new i([new l("4939593", "M21-500-403"), new l("4857739", "M21-500-414"), new l("4900629", "M21-500-423"), new l("4900630", "M21-500-430"), new l("4900631", "M21-500-430-WT-CL"), new l("4900632", "M21-500-461"), new l("4900633", "M21-500-488"), new l("4900634", "M21-500-499"), new l("4939571", "M21-500-581"), new l("4900636", "M21-500-595-BK"), new l("4900637", "M21-500-595-BL"), new l("4900638", "M21-500-595-BR"), new l("4900639", "M21-500-595-GN"), new l("4900640", "M21-500-595-GY"), new l("4900641", "M21-500-595-OR"), new l("4900642", "M21-500-595-PL"), new l("4900643", "M21-500-595-RD"), new l("4900644", "M21-500-595-WT"), new l("4900645", "M21-500-595-YL"), new l("4900646", "M21-500-7425")], false, false, false, 50, 0, 9, 0)), this.partInfoList.push(new i([new l("4900635", "M21-500-499-TB")], false, false, false, 50, 0, 9, 0)), this.partInfoList.push(new i([new l("4900654", "M21-750-499"), new l("4900647", "M21-750-403"), new l("4857740", "M21-750-414"), new l("4900648", "M21-750-423"), new l("4900650", "M21-750-430"), new l("4900651", "M21-750-430-WT-CL"), new l("4900652", "M21-750-461"), new l("4900653", "M21-750-488"), new l("4939592", "M21-750-581"), new l("4900655", "M21-750-595-BK"), new l("4900656", "M21-750-595-BL"), new l("4900657", "M21-750-595-BR"), new l("4900658", "M21-750-595-GN"), new l("4900659", "M21-750-595-GY"), new l("4900660", "M21-750-595-OR"), new l("4900661", "M21-750-595-PL"), new l("4900662", "M21-750-595-RD"), new l("4900663", "M21-750-595-WT"), new l("4900664", "M21-750-595-YL"), new l("4900665", "M21-750-7425")], false, false, false, 75, 0, 0, 0)), this.partInfoList.push(new i([new l("4900649", "M21-750-427")], false, false, true, 37, 0, 37, 0)), this.partInfoList.push(new i([new l("4918678", "M21-89-427")], true, false, false, 50, 50, 7, 0)), this.partInfoList.push(new i([new l("4918680", "M21R0-206-427")], true, false, false, 50, 70, 7, 70)), this.partInfoList.push(new i([new l("4918681", "M21RO-207-427")], true, false, false, 50, 110, 7, 110)), this.partInfoList.push(new i([new l("4900654", "M21-750-499")], false, false, false, 75, 0, 9, 0)), this.potentialParts.push(this.partInfoList);
  }
};
var l = class {
  constructor(e2, t2) {
    this.yNumber = e2, this.partName = t2;
  }
};
var d = class _d {
  constructor() {
    this.propertyGetResponses = [];
  }
  static buildJsonPiclPacketFromString(e2) {
    const t2 = new TextEncoder().encode(e2), n2 = t2.length, r2 = new Uint8Array([255 & n2, n2 >>> 8 & 255, n2 >>> 16 & 255, n2 >>> 24 & 255]), a2 = new Uint8Array([150, 194, 247, 74, 29, 33, 66, 50, 134, 120, 32, 239, 233, 123, 194, 211]), i2 = new Uint8Array(a2.length + r2.length + n2);
    return i2.set(a2, 0), i2.set(r2, a2.length), i2.set(t2, a2.length + r2.length), i2;
  }
  static unpackJsonPiclPacket(e2) {
    const t2 = '{"PropertyGetResponses":[' + new TextDecoder("utf-8").decode(e2).split(":[")[1], n2 = JSON.parse(t2), r2 = new _d(), a2 = [];
    for (var i2 = 0; i2 < n2.PropertyGetResponses.length; i2++) {
      var s2, o2, u2, l2 = n2.PropertyGetResponses[i2];
      for (var p2 in l2) "ID" == p2 ? s2 = l2[p2] : "Value" == p2 ? o2 = l2[p2] : "Status" == p2 && (u2 = l2[p2]);
      a2.push(new f(s2, o2, u2));
    }
    return r2.propertyGetResponses = a2, r2;
  }
};
var f = class {
  constructor(e2, t2, n2) {
    this.id = e2, this.value = t2, this.status = n2;
  }
};
var p = class {
  constructor() {
    this.apolloChipIdMappingList = this.getApolloChipIdMappingList();
  }
  getApolloChipIdMappingList() {
    var e2 = [];
    try {
      const s2 = JSON.parse('{"ApolloMapping":[{"UniqueId":4,"YNumber":4900576,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":75,"YNumber":4918675,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":80,"YNumber":4918682,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":10,"YNumber":4900592,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":6,"YNumber":4900578,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":5,"YNumber":4900577,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":93,"YNumber":5027106,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":81,"YNumber":4918683,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":76,"YNumber":4918676,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":83,"YNumber":4918685,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":89,"YNumber":4918691,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":84,"YNumber":4918686,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":7,"YNumber":4900579,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":86,"YNumber":4918688,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":87,"YNumber":4918689,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":82,"YNumber":4918684,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":8,"YNumber":4900580,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":9,"YNumber":4900581,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":1,"YNumber":4857738,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":11,"YNumber":4900602,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":12,"YNumber":4900603,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":13,"YNumber":4900604,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":14,"YNumber":4900605,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":15,"YNumber":4900606,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":16,"YNumber":4900607,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":17,"YNumber":4900608,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":88,"YNumber":4918690,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":18,"YNumber":4900609,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":19,"YNumber":4900610,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":20,"YNumber":4900611,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":21,"YNumber":4900612,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":22,"YNumber":4900613,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":23,"YNumber":4900614,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":24,"YNumber":4900615,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":25,"YNumber":4900616,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":26,"YNumber":4900617,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":27,"YNumber":4900618,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":28,"YNumber":4900619,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":29,"YNumber":4900620,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":30,"YNumber":4900621,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":31,"YNumber":4900622,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":32,"YNumber":4900623,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":33,"YNumber":4900624,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":34,"YNumber":4900625,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":35,"YNumber":4900626,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":36,"YNumber":4900627,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":37,"YNumber":4900628,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":92,"YNumber":4939593,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":2,"YNumber":4857739,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":38,"YNumber":4900629,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":39,"YNumber":4900630,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":40,"YNumber":4900631,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":41,"YNumber":4900632,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":42,"YNumber":4900633,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":43,"YNumber":4900634,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":44,"YNumber":4900635,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":90,"YNumber":4939571,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":45,"YNumber":4900636,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":46,"YNumber":4900637,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":47,"YNumber":4900638,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":48,"YNumber":4900639,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":49,"YNumber":4900640,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":50,"YNumber":4900641,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":51,"YNumber":4900642,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":52,"YNumber":4900643,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":53,"YNumber":4900644,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":54,"YNumber":4900645,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":55,"YNumber":4900646,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":85,"YNumber":4918687,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":56,"YNumber":4900647,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":3,"YNumber":4857740,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":57,"YNumber":4900648,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":58,"YNumber":4900649,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":59,"YNumber":4900650,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":60,"YNumber":4900651,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":61,"YNumber":4900652,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":62,"YNumber":4900653,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":91,"YNumber":4939592,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":64,"YNumber":4900655,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":65,"YNumber":4900656,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":66,"YNumber":4900657,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":67,"YNumber":4900658,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":68,"YNumber":4900659,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":69,"YNumber":4900660,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":70,"YNumber":4900661,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":71,"YNumber":4900662,"RibbonColorTypeId":"00000000-0000-0000-0000-000000000000"},{"UniqueId":72,"YNumber":4900663,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":73,"YNumber":4900664,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":77,"YNumber":4918678,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":78,"YNumber":4918680,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":79,"YNumber":4918681,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":74,"YNumber":4926952,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":94,"YNumber":4900665,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":63,"YNumber":4900654,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"},{"UniqueId":95,"YNumber":4900654,"RibbonColorTypeId":"167b90d0-cd37-4b32-a8f3-73a41ff9e09e"}]}');
      for (var t2 = 0; t2 < s2.ApolloMapping.length; t2++) {
        const o2 = s2.ApolloMapping[t2];
        var n2, r2, a2;
        for (var i2 in o2) "UniqueId" == i2 ? n2 = o2[i2] : "YNumber" == i2 ? r2 = o2[i2] : "RibbonColorTypeId" == i2 && (a2 = o2[i2]);
        const u2 = new b(n2, r2, a2);
        e2.push(u2);
      }
    } catch (e3) {
      console.log(e3);
    }
    return e2;
  }
};
var b = class {
  constructor(e2, t2, n2) {
    this.uniqueId = e2, this.yNumber = t2, this.ribbonColorTypeId = n2;
  }
};
var h = class {
  constructor() {
    this.PropertyKey = Object.freeze({
      FatalError: "0006",
      CutError: "0005",
      MediaIsInvalid: "000A",
      SubstrateRemainingOut: "001C",
      LowPowerError: "0021",
      DismissibleError: "0027",
      SubstrateOutError: "0025",
      PrintJobError: "0009",
      BatteryChargeStatus: "0001",
      BatteryACConnected: "0024",
      CutButtonIdentifier: "0004",
      FeedButtonIdentifier: "0007",
      ShutdownTimeoutInMins: "0026",
      SubstratePrintableWidth: "000C",
      SubstrateLabelLinerLeftOffset: "000D",
      SubstratePrintableHeight: "000E",
      SubstrateVerticalOffset: "000F",
      SubstrateIsBlackStriped: "0012",
      SubstrateIsDieCut: "0013",
      SubstrateIsPermasleeve: "0014",
      SubstrateIsSelfLam: "0015",
      SubstrateRemainingPercent: "0016",
      SubstrateUniqueId: "002A",
      JobPrintingComplete: "001F",
      FirmwareVersion: "0020",
      PrintJobIdAndStatus: "0029",
      MediaYNumberIdentifier: "004D",
      LeadingEdgeErrorIdentifier: "005A",
      SubstrateStallErrorIdentifier: "0061",
      HeadOpenErrorIdentifier: "0066"
    }), this.clearPiclResponses(), this.piclValueDictionary = /* @__PURE__ */ new Map(), this.piclValueDictionary.set(this.PropertyKey.FatalError, new P(this.PropertyKey.FatalError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.CutError, new P(this.PropertyKey.CutError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.MediaIsInvalid, new P(this.PropertyKey.MediaIsInvalid, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateRemainingOut, new P(this.PropertyKey.SubstrateRemainingOut, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.LowPowerError, new P(this.PropertyKey.LowPowerError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.DismissibleError, new P(this.PropertyKey.DismissibleError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateOutError, new P(this.PropertyKey.SubstrateOutError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.PrintJobError, new P(this.PropertyKey.PrintJobError, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.BatteryChargeStatus, new P(this.PropertyKey.BatteryChargeStatus, "String")), this.piclValueDictionary.set(this.PropertyKey.BatteryACConnected, new P(this.PropertyKey.BatteryACConnected, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.ShutdownTimeoutInMins, new P(this.PropertyKey.ShutdownTimeoutInMins, "Integer")), this.piclValueDictionary.set(this.PropertyKey.SubstratePrintableWidth, new P(this.PropertyKey.SubstratePrintableWidth, "Integer")), this.piclValueDictionary.set(this.PropertyKey.SubstrateLabelLinerLeftOffset, new P(this.PropertyKey.SubstrateLabelLinerLeftOffset, "Integer")), this.piclValueDictionary.set(this.PropertyKey.SubstratePrintableHeight, new P(this.PropertyKey.SubstratePrintableHeight, "Integer")), this.piclValueDictionary.set(this.PropertyKey.SubstrateVerticalOffset, new P(this.PropertyKey.SubstrateVerticalOffset, "Integer")), this.piclValueDictionary.set(this.PropertyKey.SubstrateIsBlackStriped, new P(this.PropertyKey.SubstrateIsBlackStriped, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateIsDieCut, new P(this.PropertyKey.SubstrateIsDieCut, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateIsPermasleeve, new P(this.PropertyKey.SubstrateIsPermasleeve, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateIsSelfLam, new P(this.PropertyKey.SubstrateIsSelfLam, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateRemainingPercent, new P(this.PropertyKey.SubstrateRemainingPercent, "Integer")), this.piclValueDictionary.set(this.PropertyKey.JobPrintingComplete, new P(this.PropertyKey.JobPrintingComplete, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateUniqueId, new P(this.PropertyKey.SubstrateUniqueId, "Integer")), this.piclValueDictionary.set(this.PropertyKey.FirmwareVersion, new P(this.PropertyKey.FirmwareVersion, "String")), this.piclValueDictionary.set(this.PropertyKey.PrintJobIdAndStatus, new P(this.PropertyKey.PrintJobIdAndStatus, "String")), this.piclValueDictionary.set(this.PropertyKey.MediaYNumberIdentifier, new P(this.PropertyKey.MediaYNumberIdentifier, "Integer")), this.piclValueDictionary.set(this.PropertyKey.LeadingEdgeErrorIdentifier, new P(this.PropertyKey.LeadingEdgeErrorIdentifier, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.SubstrateStallErrorIdentifier, new P(this.PropertyKey.SubstrateStallErrorIdentifier, "Boolean")), this.piclValueDictionary.set(this.PropertyKey.HeadOpenErrorIdentifier, new P(this.PropertyKey.HeadOpenErrorIdentifier, "Boolean")), this.parsedDB = new o();
  }
  addOrUpdatePiclValues(e2) {
    for (let t2 in e2) {
      const n2 = e2[t2], r2 = n2.value;
      let a2 = null;
      this.piclValueDictionary.has(n2.id) && (a2 = this.piclValueDictionary.get(n2.id)), "Property Not Found" != n2.status && "Property No Longer Available" != n2.status || null != a2 && null != this.piclResponseDictionary.get(a2.identifier) && this.piclResponseDictionary.delete(a2.identifier);
      let i2 = null;
      if (null != a2) {
        i2 = a2.propertyType;
        const e3 = a2.identifier;
        "String" == i2 ? this.piclResponseDictionary.set(e3, new C(r2, n2.status, n2.id, i2)) : "Integer" == i2 ? this.piclResponseDictionary.set(e3, new c(r2, n2.status, n2.id, i2)) : "Boolean" == i2 && this.piclResponseDictionary.set(e3, new m(r2, n2.status, n2.id, i2));
      }
    }
    this.TryToIdentifyPart();
  }
  clearPiclResponses() {
    this.piclResponseDictionary = /* @__PURE__ */ new Map();
  }
  TryToIdentifyPart() {
    this.isPropertyTrue(this.PropertyKey.MediaIsInvalid) ? console.log("Media part is invalid!") : this.identifiedPart = null;
    const e2 = this.isPropertyTrue(this.PropertyKey.SubstrateIsDieCut), t2 = this.isPropertyTrue(this.PropertyKey.SubstrateIsSelfLam), n2 = this.isPropertyTrue(this.PropertyKey.SubstrateIsPermasleeve);
    let r2 = 0;
    "Integer" == this.piclResponseDictionary.get(this.PropertyKey.SubstratePrintableHeight).propertyType && (r2 = Number(this.piclResponseDictionary.get(this.PropertyKey.SubstratePrintableHeight).value));
    let a2 = 0;
    "Integer" == this.piclResponseDictionary.get(this.PropertyKey.SubstratePrintableWidth).propertyType && (a2 = Number(this.piclResponseDictionary.get(this.PropertyKey.SubstratePrintableWidth).value));
    let o2 = 0;
    "Integer" == this.piclResponseDictionary.get(this.PropertyKey.SubstrateLabelLinerLeftOffset).propertyType && (o2 = Number(this.piclResponseDictionary.get(this.PropertyKey.SubstrateLabelLinerLeftOffset).value));
    let l2 = 0;
    "Integer" == this.piclResponseDictionary.get(this.PropertyKey.SubstrateVerticalOffset).propertyType && (l2 = Number(this.piclResponseDictionary.get(this.PropertyKey.SubstrateVerticalOffset).value)), this.piclResponseDictionary.get(this.PropertyKey.MediaYNumberIdentifier) && "Integer" == this.piclResponseDictionary.get(this.PropertyKey.MediaYNumberIdentifier).propertyType && (this.substrateYNumber = Number(this.piclResponseDictionary.get(this.PropertyKey.MediaYNumberIdentifier).value)), this.piclResponseDictionary.get(this.PropertyKey.SubstrateUniqueId) && "Integer" == this.piclResponseDictionary.get(this.PropertyKey.SubstrateUniqueId).propertyType && (this.substrateUniqueId = Number(this.piclResponseDictionary.get(this.PropertyKey.SubstrateUniqueId).value));
    let d2 = new p().getApolloChipIdMappingList();
    if (null != this.parsedDB.parsedData) {
      if (this.substrateUniqueId) {
        for (let e3 in d2) if (this.substrateUniqueId == d2[e3].uniqueId) {
          let t3 = d2[e3].yNumber;
          for (let e4 = 0; e4 < this.parsedDB.parsedData.length; e4++) {
            const n4 = this.parsedDB.parsedData[e4];
            for (const r3 in this.parsedDB.parsedData[e4].RelatedParts) if (this.parsedDB.parsedData[e4].RelatedParts[r3].YNumber == t3) return this.identifiedPart = new s(this.parsedDB.parsedData[e4].RelatedParts[r3].YNumber, n4), void (this.identifiedPart.partWasFound = true);
          }
          const n3 = new u();
          for (let e4 = 0; e4 < n3.partInfoList.length; e4++) {
            const r3 = n3.partInfoList[e4];
            for (let e5 = 0; e5 < r3.partNames.length; e5++) if (r3.partNames[e5].yNumber == t3) return this.identifiedPart = r3, this.identifiedPart.partNames = [r3.partNames[e5]], void (this.identifiedPart.partWasFound = true);
          }
        }
      } else if (this.substrateYNumber) for (let e3 = 0; e3 < this.parsedDB.parsedData.length; e3++) {
        const t3 = this.parsedDB.parsedData[e3];
        for (const n3 in this.parsedDB.parsedData[e3].RelatedParts) if (this.parsedDB.parsedData[e3].RelatedParts[n3].YNumber == this.substrateYNumber) return this.identifiedPart = new s(this.parsedDB.parsedData[e3].RelatedParts[n3].YNumber, t3), void (this.identifiedPart.partWasFound = true);
      }
    }
    const f2 = new u();
    for (let i2 = 0; i2 < f2.potentialParts.length; i2++) {
      const s2 = f2.potentialParts[i2];
      for (let i3 in s2) if (a2 == s2[i3].width && r2 == s2[i3].height && o2 == s2[i3].leftOffset && l2 == s2[i3].verticalOffset && e2 == s2[i3].mediaIsDieCut && t2 == s2[i3].mediaIsSelfLam && n2 == s2[i3].mediaIsPermaSleeve) return void (this.identifiedPart = s2[i3]);
    }
    this.identifiedPart = new i(null, e2, n2, t2, a2, r2, o2, l2);
  }
  isPropertyTrue(e2) {
    if (this.tryToGetValue(e2) && "Boolean" == this.piclResponseDictionary.get(e2).propertyType) return "True" == this.piclResponseDictionary.get(e2).value;
  }
  tryToGetValue(e2) {
    try {
      return !("Boolean" != this.piclResponseDictionary.get(e2).propertyType && "Integer" != this.piclResponseDictionary.get(e2).propertyType && "String" != this.piclResponseDictionary.get(e2).propertyType || null == this.piclResponseDictionary.get(e2));
    } catch (e3) {
      return false;
    }
  }
};
var P = class {
  constructor(e2, t2) {
    this.identifier = e2, this.propertyType = t2;
  }
};
var m = class extends P {
  constructor(e2, t2, n2, r2) {
    super(n2, r2), this.value = e2, this.status = t2;
  }
};
var c = class extends P {
  constructor(e2, t2, n2, r2) {
    super(n2, r2), this.value = e2, this.status = t2;
  }
};
var C = class extends P {
  constructor(e2, t2, n2, r2) {
    super(n2, r2), this.value = e2, this.status = t2;
  }
};
var I = class {
  constructor() {
  }
  hashU32(e2) {
    return -1252372727 ^ (e2 = (e2 = (e2 = 374761393 + (e2 = -949894596 ^ (e2 = 2127912214 + (e2 |= 0) + (e2 << 12) | 0) ^ e2 >>> 19) + (e2 << 5) | 0) - 744332180 ^ e2 << 9) - 42973499 + (e2 << 3) | 0) ^ e2 >>> 16;
  }
  readU64(e2, t2) {
    var n2 = 0;
    return n2 |= 0 | e2[t2++], n2 |= e2[t2++] << 8, n2 |= e2[t2++] << 16, n2 |= e2[t2++] << 24, n2 |= e2[t2++] << 32, n2 |= e2[t2++] << 40, (n2 |= e2[t2++] << 48) | e2[t2++] << 56;
  }
  readU32(e2, t2) {
    var n2 = 0;
    return n2 |= 0 | e2[t2++], n2 |= e2[t2++] << 8, (n2 |= e2[t2++] << 16) | e2[t2++] << 24;
  }
  writeU32(e2, t2, n2) {
    e2[t2++] = 255 & n2, e2[t2++] = n2 >> 8 & 255, e2[t2++] = n2 >> 16 & 255, e2[t2++] = n2 >> 24 & 255;
  }
  imul(e2, t2) {
    var n2 = 65535 & e2, r2 = 65535 & t2;
    return n2 * r2 + ((e2 >>> 16) * r2 + n2 * (t2 >>> 16) << 16) | 0;
  }
};
var S = class {
  constructor() {
    this.util = new I(), this.prime1 = 2654435761, this.prime2 = 2246822519, this.prime3 = 3266489917, this.prime4 = 668265263, this.prime5 = 374761393;
  }
  rotl32(e2, t2) {
    return (e2 |= 0) >>> (32 - (t2 |= 0) | 0) | e2 << t2;
  }
  rotmul32(e2, t2, n2) {
    return e2 |= 0, t2 |= 0, n2 |= 0, 0 | this.util.imul(e2 >>> (32 - t2 | 0) | e2 << t2, n2);
  }
  shiftxor32(e2, t2) {
    return (e2 |= 0) >>> (t2 |= 0) ^ e2;
  }
  xxhapply(e2, t2, n2, r2, a2) {
    return this.rotmul32(this.util.imul(t2, n2) + e2, r2, a2);
  }
  xxh1(e2, t2, n2) {
    return this.rotmul32(e2 + this.util.imul(t2[n2], this.prime5), 11, this.prime1);
  }
  xxh4(e2, t2, n2) {
    return this.xxhapply(e2, this.util.readU32(t2, n2), this.prime3, 17, this.prime4);
  }
  xxh16(e2, t2, n2) {
    return [this.xxhapply(e2[0], this.util.readU32(t2, n2 + 0), this.prime2, 13, this.prime1), this.xxhapply(e2[1], this.util.readU32(t2, n2 + 4), this.prime2, 13, this.prime1), this.xxhapply(e2[2], this.util.readU32(t2, n2 + 8), this.prime2, 13, this.prime1), this.xxhapply(e2[3], this.util.readU32(t2, n2 + 12), this.prime2, 13, this.prime1)];
  }
  xxh32(e2, t2, n2, r2) {
    var a2, i2;
    if (i2 = r2, r2 >= 16) {
      for (a2 = [e2 + this.prime1 + this.prime2, e2 + this.prime2, e2, e2 - this.prime1]; r2 >= 16; ) a2 = this.xxh16(a2, t2, n2), n2 += 16, r2 -= 16;
      a2 = this.rotl32(a2[0], 1) + this.rotl32(a2[1], 7) + this.rotl32(a2[2], 12) + this.rotl32(a2[3], 18) + i2;
    } else a2 = e2 + this.prime5 + r2 >>> 0;
    for (; r2 >= 4; ) a2 = this.xxh4(a2, t2, n2), n2 += 4, r2 -= 4;
    for (; r2 > 0; ) a2 = this.xxh1(a2, t2, n2), n2++, r2--;
    return (a2 = this.shiftxor32(this.util.imul(this.shiftxor32(this.util.imul(this.shiftxor32(a2, 15), this.prime2), 13), this.prime3), 16)) >>> 0;
  }
};
var y = class {
  constructor() {
    this.minMatch = 4, this.minLength = 13, this.searchLimit = 5, this.skipTrigger = 6, this.hashSize = 65536, this.mlBits = 4, this.mlMask = (1 << this.mlBits) - 1, this.runBits = 4, this.runMask = (1 << this.runBits) - 1, this.blockBuf = this.makeBuffer(5 << 20), this.hashTable = this.makeHashTable(), this.magicNum = 407708164, this.fdContentChksum = 4, this.fdContentSize = 8, this.fdBlockChksum = 16, this.fdVersion = 64, this.fdVersionMask = 192, this.bsUncompressed = 2147483648, this.bsDefault = 7, this.bsShift = 4, this.bsMask = 7, this.bsMap = {
      4: 65536,
      5: 262144,
      6: 1048576,
      7: 4194304
    }, this.xxhash = new S(), this.util = new I();
  }
  makeHashTable() {
    try {
      return new Uint32Array(this.hashSize);
    } catch (n2) {
      for (var e2 = new Array(this.hashSize), t2 = 0; t2 < this.hashSize; t2++) e2[t2] = 0;
      return e2;
    }
  }
  clearHashTable(e2) {
    for (var t2 = 0; t2 < this.hashSize; t2++) this.hashTable[t2] = 0;
  }
  makeBuffer(e2) {
    try {
      return new Uint8Array(e2);
    } catch (r2) {
      for (var t2 = new Array(e2), n2 = 0; n2 < e2; n2++) t2[n2] = 0;
      return t2;
    }
  }
  sliceArray(e2, t2, n2) {
    if (e2 instanceof Uint8Array) {
      if (Uint8Array.prototype.slice) return e2.slice(t2, n2);
      var r2 = e2.length;
      t2 = (t2 |= 0) < 0 ? Math.max(r2 + t2, 0) : Math.min(t2, r2), n2 = (n2 = void 0 === n2 ? r2 : 0 | n2) < 0 ? Math.max(r2 + n2, 0) : Math.min(n2, r2);
      for (var a2 = new Uint8Array(n2 - t2), i2 = t2, s2 = 0; i2 < n2; ) a2[s2++] = e2[i2++];
      return a2;
    }
    return e2.slice(t2, n2);
  }
  compressBound(e2) {
    return e2 + e2 / 255 + 16 | 0;
  }
  decompressBound(e2) {
    var t2 = 0;
    if (this.util.readU32(e2, t2) !== this.magicNum) throw new Error("invalid magic number");
    t2 += 4;
    var n2 = e2[t2++];
    if ((n2 & this.fdVersionMask) !== this.fdVersion) throw new Error("incompatible descriptor version " + (n2 & this.fdVersionMask));
    var r2 = 0 !== (n2 & this.fdBlockChksum), a2 = 0 !== (n2 & this.fdContentSize), i2 = e2[t2++] >> this.bsShift & this.bsMask;
    if (void 0 === this.bsMap[i2]) throw new Error("invalid block size " + i2);
    var s2 = this.bsMap[i2];
    if (a2) return this.util.readU64(e2, t2);
    t2++;
    for (var o2 = 0; ; ) {
      var u2 = this.util.readU32(e2, t2);
      if (t2 += 4, u2 & this.bsUncompressed ? o2 += u2 &= ~this.bsUncompressed : o2 += s2, 0 === u2) return o2;
      r2 && (t2 += 4), t2 += u2;
    }
  }
  decompressBlock(e2, t2, n2, r2, a2) {
    var i2, s2, o2, u2, l2;
    for (o2 = n2 + r2; n2 < o2; ) {
      var d2 = e2[n2++], f2 = d2 >> 4;
      if (f2 > 0) {
        if (15 === f2) for (; f2 += e2[n2], 255 === e2[n2++]; ) ;
        for (u2 = n2 + f2; n2 < u2; ) t2[a2++] = e2[n2++];
      }
      if (n2 >= o2) break;
      if (i2 = 15 & d2, s2 = e2[n2++] | e2[n2++] << 8, 15 === i2) for (; i2 += e2[n2], 255 === e2[n2++]; ) ;
      for (u2 = (l2 = a2 - s2) + (i2 += this.minMatch); l2 < u2; ) t2[a2++] = 0 | t2[l2++];
    }
    return a2;
  }
  compressBlock(e2, t2, n2, r2, a2) {
    var i2, s2, o2, u2, l2, d2, f2, p2;
    if (d2 = 0, f2 = r2 + n2, s2 = n2, r2 >= this.minLength) for (var b2 = 3 + (1 << this.skipTrigger); n2 + this.minMatch < f2 - this.searchLimit; ) {
      var h2 = this.util.readU32(e2, n2), P2 = this.util.hashU32(h2) >>> 0;
      if (i2 = a2[P2 = (P2 >> 16 ^ P2) >>> 0 & 65535] - 1, a2[P2] = n2 + 1, i2 < 0 || n2 - i2 >>> 16 > 0 || this.util.readU32(e2, i2) !== h2) n2 += b2++ >> this.skipTrigger;
      else {
        for (b2 = 3 + (1 << this.skipTrigger), l2 = n2 - s2, u2 = n2 - i2, n2 += this.minMatch, i2 += this.minMatch, o2 = n2; n2 < f2 - this.searchLimit && e2[n2] === e2[i2]; ) n2++, i2++;
        var m2 = (o2 = n2 - o2) < this.mlMask ? o2 : this.mlMask;
        if (l2 >= this.runMask) {
          for (t2[d2++] = (this.runMask << this.mlBits) + m2, p2 = l2 - this.runMask; p2 >= 255; p2 -= 255) t2[d2++] = 255;
          t2[d2++] = p2;
        } else t2[d2++] = (l2 << this.mlBits) + m2;
        for (var c2 = 0; c2 < l2; c2++) t2[d2++] = e2[s2 + c2];
        if (t2[d2++] = u2, t2[d2++] = u2 >> 8, o2 >= this.mlMask) {
          for (p2 = o2 - this.mlMask; p2 >= 255; p2 -= 255) t2[d2++] = 255;
          t2[d2++] = p2;
        }
        s2 = n2;
      }
    }
    if (0 === s2) return 0;
    if ((l2 = f2 - s2) >= this.runMask) {
      for (t2[d2++] = this.runMask << this.mlBits, p2 = l2 - this.runMask; p2 >= 255; p2 -= 255) t2[d2++] = 255;
      t2[d2++] = p2;
    } else t2[d2++] = l2 << this.mlBits;
    for (n2 = s2; n2 < f2; ) t2[d2++] = e2[n2++];
    return d2;
  }
  decompressFrame(e2, t2) {
    var n2, r2, a2, i2, s2 = 0, o2 = 0;
    if (this.util.readU32(e2, s2) !== this.magicNum) throw new Error("invalid magic number");
    if (s2 += 4, ((i2 = e2[s2++]) & this.fdVersionMask) !== this.fdVersion) throw new Error("incompatible descriptor version");
    n2 = 0 !== (i2 & this.fdBlockChksum), r2 = 0 !== (i2 & this.fdContentChksum), a2 = 0 !== (i2 & this.fdContentSize);
    var u2 = e2[s2++] >> this.bsShift & this.bsMask;
    if (void 0 === this.bsMap[u2]) throw new Error("invalid block size");
    for (a2 && (s2 += 8), s2++; ; ) {
      var l2;
      if (l2 = this.util.readU32(e2, s2), s2 += 4, 0 === l2) break;
      if (n2 && (s2 += 4), 0 !== (l2 & this.bsUncompressed)) {
        l2 &= ~this.bsUncompressed;
        for (var d2 = 0; d2 < l2; d2++) t2[o2++] = e2[s2++];
      } else o2 = this.decompressBlock(e2, t2, s2, l2, o2), s2 += l2;
    }
    return r2 && (s2 += 4), o2;
  }
  compressFrame(e2, t2) {
    var n2 = 0;
    this.util.writeU32(t2, n2, this.magicNum), n2 += 4, t2[n2++] = this.fdVersion, t2[n2++] = this.bsDefault << this.bsShift, t2[n2] = this.xxhash.xxh32(0, t2, 4, n2 - 4) >> 8, n2++;
    var r2 = this.bsMap[this.bsDefault], a2 = e2.length, i2 = 0;
    for (this.clearHashTable(this.hashTable); a2 > 0; ) {
      var s2, o2 = a2 > r2 ? r2 : a2;
      if ((s2 = this.compressBlock(e2, this.blockBuf, i2, o2, this.hashTable)) > o2 || 0 === s2) {
        this.util.writeU32(t2, n2, 2147483648 | o2), n2 += 4;
        for (var u2 = i2 + o2; i2 < u2; ) t2[n2++] = e2[i2++];
        a2 -= o2;
      } else {
        this.util.writeU32(t2, n2, s2), n2 += 4;
        for (var l2 = 0; l2 < s2; ) t2[n2++] = this.blockBuf[l2++];
        i2 += o2, a2 -= o2;
      }
    }
    return this.util.writeU32(t2, n2, 0), n2 + 4;
  }
  decompress(e2, t2) {
    var n2, r2;
    return void 0 === t2 && (t2 = this.decompressBound(e2)), n2 = this.makeBuffer(t2), (r2 = this.decompressFrame(e2, n2)) !== t2 && (n2 = this.sliceArray(n2, 0, r2)), n2;
  }
  compress(e2, t2) {
    var n2, r2;
    return void 0 === t2 && (t2 = this.compressBound(e2.length)), n2 = this.makeBuffer(t2), (r2 = this.compressFrame(e2, n2)) !== t2 && (n2 = this.sliceArray(n2, 0, r2)), n2;
  }
};
function g() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(e2) {
    const t2 = 16 * Math.random() | 0;
    return ("x" == e2 ? t2 : 3 & t2 | 8).toString(16);
  });
}
!function(e2) {
  e2.M211 = "M211", e2.M511 = "M511", e2.M610 = "M610", e2.M710 = "M710", e2.M611 = "M611", e2.S3700 = "S3700", e2.i7500 = "i7500";
}(r || (r = {}));
var T = function(e2, t2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(a2, i2) {
    function s2(e3) {
      try {
        u2(r2.next(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function o2(e3) {
      try {
        u2(r2.throw(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function u2(e3) {
      var t3;
      e3.done ? a2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
        e4(t3);
      })).then(s2, o2);
    }
    u2((r2 = r2.apply(e2, t2 || [])).next());
  });
};
var D = new class {
  constructor() {
    this.totalLength = 0, this.inputBuffer = [], this.foundTheHeader = false, this.piclHeader = [], this.payloadLength = 0, this.piclUuid = [], this.packetNum = 0;
  }
  pushData(e2) {
    this.totalLength += e2.length, this.totalOutputData = new Int8Array(this.totalLength), this.inputBuffer.push(e2);
    for (var t2 = 0, n2 = 0; n2 < this.inputBuffer.length; n2++) for (var r2 = 0; r2 < this.inputBuffer[n2].length; r2++) this.totalOutputData[t2] = this.inputBuffer[n2][r2], t2++;
  }
  getNextPiclPacket() {
    if (!this.foundTheHeader) {
      if (this.piclHeader = this.totalOutputData.slice(0, 20), -113 == this.piclHeader[0] && -103 == this.piclHeader[1]) {
        let e3 = 255 & this.piclHeader[2] | (255 & this.piclHeader[3]) << 8 | (255 & this.piclHeader[4]) << 16 | (255 & this.piclHeader[5]) << 24;
        if (this.totalOutputData.length < e3 + 6) return null;
        let t2 = [];
        t2.push(4, 34, 77, 24, 64, 112, 223), t2.push(...this.piclHeader.slice(2, 6)), t2.push(...this.totalOutputData.slice(10, this.totalOutputData.length)), this.payloadLength = 255 & this.piclHeader[6] | (255 & this.piclHeader[7]) << 8 | (255 & this.piclHeader[8]) << 16 | (255 & this.piclHeader[9]) << 24;
        let n2 = new Uint8Array(t2), r2 = new y().decompress(n2, this.payloadLength);
        return this.inputBuffer = [], this.totalLength = 0, this.foundTheHeader = false, this.totalOutputData = [], r2;
      }
      this.payloadLength = 255 & this.piclHeader[16] | (255 & this.piclHeader[17]) << 8 | (255 & this.piclHeader[18]) << 16 | (255 & this.piclHeader[19]) << 24, this.piclUuid = this.piclHeader.slice(0, 16), this.foundTheHeader = true;
    }
    const e2 = this.piclHeader.length + this.payloadLength;
    if (this.totalOutputData.length >= e2) {
      this.inputBuffer = [], this.totalLength = 0, this.foundTheHeader = false;
      const e3 = this.totalOutputData;
      return this.totalOutputData = [], e3;
    }
    return null;
  }
}();
var R;
var N;
var M;
var O;
var L;
var A = new h();
var E = class {
  constructor(e2) {
    this.APOLLO_SERVICE_UUID = "0000fd1c-0000-1000-8000-00805f9b34fb", this.APOLLO_SERVICE_SESSION_ID_CHARACTERISTIC_UUID = "fc0018d8-cf12-46be-87b1-cce29b1e6c34", this.APOLLO_SERVICE_PRINT_JOB_CHARACTERISTIC_UUID = "7d9d9a4d-b530-4d13-8d61-e0ff445add19", this.APOLLO_SERVICE_PICL_REQUEST_CHARACTERISTIC_UUID = "a61ae408-3273-420c-a9db-0669f4f23b69", this.APOLLO_SERVICE_PICL_RESPONSE_CHARACTERISTIC_UUID = "786af345-1b68-c594-c643-e2867da117e3", this.APOLLO_SERVICE_PICL_RESPONSE_CONFIG_DESCRIPTOR_UUID = "00002902-0000-1000-8000-00805f9b34fb", R = e2, this.isConnected = false;
  }
  promptForBleDeviceConnection(e2) {
    return T(this, void 0, void 0, function* () {
      try {
        if (null != navigator.bluetooth && (yield navigator.bluetooth.getAvailability())) try {
          if (M = yield navigator.bluetooth.requestDevice({
            filters: [{
              services: [this.APOLLO_SERVICE_UUID]
            }]
          }), this.device = M, console.log("Attempting connection to " + M.name + "..."), this.bluetoothGatt = yield M.gatt.connect(), console.log("Connected to gatt..."), console.log("Getting the primary service..."), this.service = yield this.bluetoothGatt.getPrimaryService(this.APOLLO_SERVICE_UUID), console.log("Getting the service characteristics..."), (M.name.includes(r.M211) || M.name.includes(r.M610)) && (this.sessionCharacteristic = yield this.service.getCharacteristic(this.APOLLO_SERVICE_SESSION_ID_CHARACTERISTIC_UUID)), this.printJobCharacteristic = yield this.service.getCharacteristic(this.APOLLO_SERVICE_PRINT_JOB_CHARACTERISTIC_UUID), this.piclRequestCharacteristic = yield this.service.getCharacteristic(this.APOLLO_SERVICE_PICL_REQUEST_CHARACTERISTIC_UUID), this.piclResponseCharacteristic = yield this.service.getCharacteristic(this.APOLLO_SERVICE_PICL_RESPONSE_CHARACTERISTIC_UUID), this.piclResponseCharacteristic.addEventListener("characteristicvaluechanged", B), yield this.piclResponseCharacteristic.startNotifications(), this.sessionUUID = "" == e2 || null == e2 ? g() : e2, M.name.includes(r.M211) || M.name.includes(r.M610)) {
            let e3 = (t2 = this.sessionUUID, n2 = [], t2.split("-").map((e4, t3) => {
              (t3 < 3 ? e4.match(/.{1,2}/g).reverse() : e4.match(/.{1,2}/g)).map((e5) => {
                n2.push(parseInt(e5, 16));
              });
            }), n2);
            e3.push(0);
            const r2 = new Uint8Array(e3);
            yield this.sessionCharacteristic.writeValue(r2);
          }
          return M.name.includes(r.M610) || M.name.includes(r.M710) ? (O = true, this.isBmpProtocol = O) : M.name.includes(r.i7500) ? (L = true, this.isPiclEnabled = true) : (O = false, this.isBmpProtocol = O), this.isConnected = true, this.sessionUUID;
        } catch (e3) {
          return console.log("Connection Failed!"), 9 == e3.code && this.device.name.includes(r.M211) ? console.log("Hold the power button on this M211 for 5 seconds to release ownership.") : 9 == e3.code && this.device.name.includes(r.M610) && console.log('"Forget" this device on your printer to release ownership and try connecting again'), this.isConnected = false, "";
        }
      } catch (e3) {
        return console.log("Connection Failed!"), console.log("This browser does not support the Web Bluetooth API."), this.isConnected = false, "";
      }
      var t2, n2;
    });
  }
  disconnect() {
    return T(this, void 0, void 0, function* () {
      if (null == this.device) return false;
      if (localStorage.removeItem("ownershipID"), this.device.gatt.connected) {
        if (A = new h(), this.device.name.includes(r.M211) || this.device.name.includes(r.M610)) {
          const e2 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
          this.sessionCharacteristic.writeValue(e2);
        }
        return N = null, this.device.gatt.disconnect(), this.isConnected = false, true;
      }
      return console.log("Bluetooth Device is already disconnected"), A.clearPiclResponses(), false;
    });
  }
  subscribeToTheDesiredPiclProperties() {
    return T(this, void 0, void 0, function* () {
      let e2;
      e2 = this.device.name.includes(r.M211) ? '{"PropertySubscribeRequests":[{"ID": "' + A.PropertyKey.FatalError + '"},{"ID": "' + A.PropertyKey.CutError + '"},{"ID": "' + A.PropertyKey.MediaIsInvalid + '"},{"ID": "' + A.PropertyKey.SubstrateRemainingOut + '"},{"ID": "' + A.PropertyKey.LowPowerError + '"},{"ID": "' + A.PropertyKey.DismissibleError + '"},{"ID": "' + A.PropertyKey.SubstrateOutError + '"},{"ID": "' + A.PropertyKey.PrintJobError + '"},{"ID": "' + A.PropertyKey.PrintJobIdAndStatus + '"},{"ID": "' + A.PropertyKey.BatteryChargeStatus + '"},{"ID": "' + A.PropertyKey.BatteryACConnected + '"},{"ID": "' + A.PropertyKey.ShutdownTimeoutInMins + '"},{"ID": "' + A.PropertyKey.SubstratePrintableWidth + '"},{"ID": "' + A.PropertyKey.SubstrateLabelLinerLeftOffset + '"},{"ID": "' + A.PropertyKey.SubstratePrintableHeight + '"},{"ID": "' + A.PropertyKey.SubstrateVerticalOffset + '"},{"ID": "' + A.PropertyKey.SubstrateIsBlackStriped + '"},{"ID": "' + A.PropertyKey.SubstrateIsDieCut + '"},{"ID": "' + A.PropertyKey.SubstrateIsPermasleeve + '"},{"ID": "' + A.PropertyKey.SubstrateIsSelfLam + '" },{"ID": "' + A.PropertyKey.SubstrateRemainingPercent + '" },{"ID": "' + A.PropertyKey.SubstrateUniqueId + '" },{"ID": "' + A.PropertyKey.HeadOpenErrorIdentifier + '"},{"ID": "' + A.PropertyKey.SubstrateStallErrorIdentifier + '"},{"ID": "' + A.PropertyKey.LeadingEdgeErrorIdentifier + '"},{"ID": "' + A.PropertyKey.MediaYNumberIdentifier + '"},{"ID": "' + A.PropertyKey.JobPrintingComplete + '" },{"ID": "' + A.PropertyKey.FirmwareVersion + '" }]}' : '{"PropertySubscribeRequests":[{"ID": "' + A.PropertyKey.FatalError + '"},{"ID": "' + A.PropertyKey.CutError + '"},{"ID": "' + A.PropertyKey.MediaIsInvalid + '"},{"ID": "' + A.PropertyKey.SubstrateRemainingOut + '"},{"ID": "' + A.PropertyKey.LowPowerError + '"},{"ID": "' + A.PropertyKey.DismissibleError + '"},{"ID": "' + A.PropertyKey.SubstrateOutError + '"},{"ID": "' + A.PropertyKey.PrintJobError + '"},{"ID": "' + A.PropertyKey.PrintJobIdAndStatus + '"},{"ID": "' + A.PropertyKey.BatteryChargeStatus + '"},{"ID": "' + A.PropertyKey.BatteryACConnected + '"},{"ID": "' + A.PropertyKey.ShutdownTimeoutInMins + '"},{"ID": "' + A.PropertyKey.SubstratePrintableWidth + '"},{"ID": "' + A.PropertyKey.SubstrateLabelLinerLeftOffset + '"},{"ID": "' + A.PropertyKey.SubstratePrintableHeight + '"},{"ID": "' + A.PropertyKey.SubstrateVerticalOffset + '"},{"ID": "' + A.PropertyKey.SubstrateIsDieCut + '"},{"ID": "' + A.PropertyKey.SubstrateRemainingPercent + '" },{"ID": "' + A.PropertyKey.HeadOpenErrorIdentifier + '"},{"ID": "' + A.PropertyKey.SubstrateStallErrorIdentifier + '"},{"ID": "' + A.PropertyKey.LeadingEdgeErrorIdentifier + '"},{"ID": "' + A.PropertyKey.MediaYNumberIdentifier + '"},{"ID": "' + A.PropertyKey.JobPrintingComplete + '" },{"ID": "' + A.PropertyKey.FirmwareVersion + '" }]}';
      const t2 = d.buildJsonPiclPacketFromString(e2);
      return this.sendDataToPrinter(this.piclRequestCharacteristic, t2);
    });
  }
  feed() {
    return T(this, void 0, void 0, function* () {
      const e2 = '{"PropertySetRequests":[{"ID": "' + A.PropertyKey.FeedButtonIdentifier + '", "Value": "True"}]}', t2 = d.buildJsonPiclPacketFromString(e2);
      return this.sendDataToPrinter(this.piclRequestCharacteristic, t2);
    });
  }
  cut() {
    return T(this, void 0, void 0, function* () {
      const e2 = '{"PropertySetRequests":[{"ID": "' + A.PropertyKey.CutButtonIdentifier + '", "Value": "True"}]}', t2 = d.buildJsonPiclPacketFromString(e2);
      return this.sendDataToPrinter(this.piclRequestCharacteristic, t2);
    });
  }
  print(e2, t2) {
    return T(this, void 0, void 0, function* () {
      let n2;
      if (n2 = yield this.sendDataToPrinter(this.printJobCharacteristic, e2), !t2) return n2;
      {
        let e3 = 60;
        R.receivedPrinterUpdates = false;
        for (let r2 = 0; r2 < e3; r2++) {
          if (R.receivedPrinterUpdates && A.tryToGetValue(A.PropertyKey.PrintJobIdAndStatus)) {
            const e4 = A.piclResponseDictionary.get(A.PropertyKey.PrintJobIdAndStatus).value.split(":"), r3 = e4[0], a2 = e4[1];
            if (t2 === r3) return "Successful" === a2 ? (n2 = true, n2) : (console.log("Print job failed!"), n2 = false, n2);
          }
          yield this.sleep(1e3);
        }
        console.log("Print job timed out!"), n2 = false;
      }
      return n2;
    });
  }
  sleep(e2) {
    return T(this, void 0, void 0, function* () {
      return new Promise((t2) => setTimeout(t2, e2));
    });
  }
  sendDataToPrinter(e2, t2) {
    return T(this, void 0, void 0, function* () {
      let n2 = t2.length, a2 = 0, i2 = 0, s2 = null, o2 = false, u2 = 0, l2 = 0, d2 = 0;
      try {
        for (; i2 < n2; ) {
          var f2;
          f2 = i2 + 148 > n2 ? n2 - i2 : 148, null != s2 && s2.length == f2 + 3 || (s2 = new Uint8Array(f2 + 3));
          const b2 = n2 == i2 + f2;
          var p2;
          p2 = this.device.name.includes(r.M211) ? i2 + f2 - u2 >= 4096 : a2 > 0 && (a2 + 1) % 16 == 0;
          const h2 = new Uint8Array([b2 ? 3 : p2 ? 2 : 1, 255 & a2, a2 >> 8 & 255]);
          s2.set(h2), s2.set(t2.slice(i2, i2 + f2), 3), yield e2.writeValue(s2), b2 && (o2 = true), i2 += f2, a2 += 1, p2 && (u2 = i2, l2 = a2), d2 > 0 && --d2;
        }
      } catch (e3) {
        console.log(e3.stack), console.log("Failed to write to characteristic...");
      }
      return o2;
    });
  }
};
function B(e2) {
  console.log("PICL packet received...");
  const t2 = new Int8Array(e2.target.value.buffer);
  if (O) F(t2);
  else for (D.pushData(Array.from(t2)); ; ) try {
    const e3 = D.getNextPiclPacket();
    if (null == e3 || 0 == e3.length) break;
    if (M.name.includes(r.M211) || M.name.includes(r.M511)) {
      const t3 = d.unpackJsonPiclPacket(e3);
      A.addOrUpdatePiclValues(t3.propertyGetResponses), R.receivePrinterUpdates(A);
    } else F(e3);
  } catch (e3) {
    console.log(e3.stack);
    break;
  }
  R.receivePrinterUpdates(A);
}
function F(e2) {
  null == N ? (N = R.piclService.parseBootPropertiesAndBuildSubscribeRequests(e2), R.setFullPiclSubscribeRequests(N), console.log("Created all subscribe requests from Boot Packet...")) : R.piclService.dispatchPacket(e2);
}
var w = class {
  constructor(e2, t2, n2, r2, a2) {
    this.propertyName = e2, this.componentId = t2, this.groupId = n2, this.propertyId = r2, this.isBidiProperty = a2;
  }
  Equals(e2) {
    return e2.GUID == this.groupId + ":" + this.propertyId;
  }
};
var W = class {
};
W.FirmwareDriver = "B80EB2EA-4F49-423A-875C-8ACB1ACB9734", W.PerMainAndApps = "9829BC5B-6892-46DB-A8AA-A6FEAB588255", W.PrintSpooler = "90AF7DE7-6DB1-45AF-A46F-C66605612E61", W.MainEditor = "D3997F5A-EBEA-46EC-AE7C-026E45702086";
var v = W;
var H = class {
};
H.Error = "2EBF9DEF-D51C-47FE-935E-5EDCC530B867", H.Components = "ADC1E631-2C12-4267-B128-95830EC9857D", H.General = "99A61D40-20CE-41EA-A579-EB92C6ED94C6", H.RibbonPrinterProperties = "CC359C57-F0F2-44E3-9940-3F1BFF1685BC", H.SubstratePrinterProperties = "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3", H.UserError = "3423DD8F-23D7-44C7-A6DA-01ED76A7A544", H.Battery = "FDA4C5D4-8C46-45E5-80E4-48504451C7B5", H.AllJobsGroup = "D3BDA7E5-BDC4-46E4-85F9-286A2602048D", H.ProductInfo = "222D688A-1554-4C0E-B7A0-0BC377EF4071", H.AccessoryProperties = "AE766260-8427-4D56-B979-E1D9D5524B3E", H.SubstrateArea0Group = "Substrate Area 0", H.SubstrateArea1Group = "Substrate Area 1", H.SubstrateArea2Group = "Substrate Area 2", H.SubstrateArea3Group = "Substrate Area 3";
var U = H;
var G = class {
};
G.PrintheadOpenError = "33A0B25B-1660-4F29-9AF3-40B70CE291B2", G.FirmwareDriver = "F2EF2A72-D816-4D36-8F0D-905C3528A5D6", G.FirmwareVersion = "ACEB1224-1DAF-42A2-BBAA-4678D5D3C8DA", G.PrinterSerialNumber = "AE2955D7-1AE3-4520-BB1C-1DC0C2B5A58B", G.DotsPerInch = "890AF444-4F6B-44E9-B3F6-EA0239DE6317", G.RibbonPartNumber = "349FA937-C9C0-4605-A382-B5FEE4A56C0D", G.RibbonYNumber = "3CA46968-3332-4DA5-AAFA-4069F9B72BF6", G.RibbonWidth = "109CB11B-6C99-4FB2-BFD2-78871FAFB934", G.RibbonColor = "44AB42C3-3804-4D41-805A-F7D59E3C9982", G.RibbonRemainingPercent = "5DA4C82D-C498-4DB2-A87A-D65499E225A0", G.RibbonIsInvalid = "FB01FE2F-A52D-4A67-A8D5-B4D122CD4B43", G.SubstratePartNumber = "1F59F145-04F2-4199-ABC9-4FA9BDEC89EB", G.SubstrateYNumber = "778B241E-BEA5-4600-8871-D5EAF833B775", G.SubstrateLabelColor = "64D5F9B9-B239-458D-B8B7-20E2979E3E18", G.SubstrateWidth = "DA6D0191-4329-4E8C-9B68-456ACEB4F7DF", G.SubstrateHeight = "0A610815-EE87-45D1-8CC8-1C719C558332", G.SubstrateRemainingPercent = "946A015D-6FE0-42B8-A194-79994463B4D3", G.SubstrateIsInvalid = "3033B200-8D64-4D46-A50E-12E93BA03F42", G.SubstratePrintableWidth = "921C0E3E-45F4-466E-B748-CA1509E75C9D", G.SubstratePrintableHeight = "FCD0EDDD-3D48-427D-B27C-0D2D7BBC8AC2", G.SubstrateIsTearoff = "F9518A79-64DB-470E-A92A-A288FA2BFEC4", G.SubstrateIsCustom = "3AFAE21B-3C42-4E3D-920C-3EE6DC6CACA3", G.SubstrateIsPrePrinted = "3D4394AA-91FB-4F5B-819B-B56005AD283D", G.SubstratePartsAcross = "677EDED8-529E-4BAF-A801-4812E5798E87", G.SubstrateVerticalGap = "0C1E32F1-22F7-4286-92B2-4F2F7D135003", G.SubstrateHorizontalGap = "E37D3767-2D08-43AC-B74E-58ADB7EC6E59", G.SubstrateLinerWidth = "E2A9DCBF-13A2-4F56-91A1-5A609E7672F1", G.SubstrateIsDieCut = "1BC6EE50-5F32-4CAA-8D32-D70167E0792D", G.SubstrateIsContinuous = "1AB35077-D002-403D-899B-C59CFF7D111E", G.SubstrateIsGapSensed = "8C4BC54C-FB49-4B44-9CA9-4B77929EC8BD", G.SubstrateIsEdgeNotched = "29320F92-4FEF-4269-834F-0B4A2C996F7A", G.SubstrateIsDirectThermal = "878DDE29-ED21-430D-9047-9B2FC05669DF", G.SubstrateLabelLinerLeftOffset = "86E9EBA1-DF9A-4BC3-9957-E3D6777D6C76", G.NumberOfAreas = "2270433C-3F11-4328-83AB-D7B439E0125C", G.DisplayedErrorBody = "1465C679-31E4-4FE0-8AAE-739B226735EF", G.DisplayedErrorRemedy = "CDA4804D-E2DB-4645-AB48-36C18F18E3DE", G.DisplayedErrorSeverity = "78C70C95-068B-4EBA-AC29-9B72246F7D87", G.DisplayedErrorShortTitle = "ABF1EA80-0162-49F7-ADDA-47763F2BB392", G.DisplayedErrorTitle = "ACDA858D-A78B-4E3E-B185-ED7D4E8C2D1C", G.AcConnected = "ECDD0A3C-DFCB-4F47-A2EA-235C5803657C", G.BatteryChargePercentage = "62160CE4-7FED-4F3B-BE27-9D773CFB84DC", G.ExternalJobStatus = "B32A3258-62D1-4E43-8D73-3B352B61B6C8", G.TotalJobsQueued = "90F8019C-1732-4C60-9E16-450C9557E354", G.JobCreator = "CC969A1D-1E79-416A-8644-8EFFC63F87A3", G.JobExternalId = "09ADF412-B765-4E71-A202-E93762F4442F", G.JobId = "2F46CD7D-FA0F-40C9-87FE-6128F9DD2BD5", G.JobName = "BD3B1263-94AB-47E6-82AB-3146D000EBE6", G.JobTime = "2FDFC795-7E7B-4BFE-801C-F4B65F976DD3", G.JobNumberOfPages = "9420F174-13FC-4788-89FC-D270F6AC4B9D", G.PostPrintAccessoryType = "1CC7C409-31A2-4A09-B864-FCE3A6D15FE2", G.AreaHeight = "165A7A98-82D0-44D3-84FA-FB272645E95B", G.AreaHorizontalOffset = "EA0869B1-04FD-4B2C-9045-E9A8A0E330AC", G.AreaIsPrintable = "C08750A3-80E7-4961-833D-580ED41581DD", G.AreaRotation = "E7CBB620-9556-4979-AEF0-76DAB1FBAC8E", G.AreaShape = "397C7C34-8B09-4B78-8F0F-2849BD059C99", G.AreaVerticalOffset = "E0741817-145E-4CF6-9CAA-FDFAB711CEA1", G.AreaWidth = "63F071EC-F39C-45B3-AE59-4A1400B7C956";
var Y = G;
var V = class {
  constructor() {
  }
};
V.RibbonPartNumber = new w("Ribbon Part Number", v.FirmwareDriver, U.RibbonPrinterProperties, Y.RibbonPartNumber, true), V.RibbonYNumber = new w("Ribbon Y Number", v.FirmwareDriver, U.RibbonPrinterProperties, Y.RibbonYNumber, true), V.RibbonWidth = new w("Ribbon Width", v.FirmwareDriver, U.RibbonPrinterProperties, Y.RibbonWidth, true), V.RibbonColor = new w("Ribbon Color", v.FirmwareDriver, U.RibbonPrinterProperties, Y.RibbonColor, true), V.RibbonRemainingPercent = new w("Ribbon Remaining Percent", v.FirmwareDriver, U.RibbonPrinterProperties, Y.RibbonRemainingPercent, true), V.RibbonIsInvalid = new w("Ribbon Is Invalid", v.FirmwareDriver, U.Error, Y.RibbonIsInvalid, true), V.SubstratePartNumber = new w("Substrate Part Number", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstratePartNumber, true), V.SubstrateYNumber = new w("Substrate Y Number", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateYNumber, true), V.SubstrateWidth = new w("Substrate Width", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateWidth, true), V.SubstrateHeight = new w("Substrate Height", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateHeight, true), V.SubstratePrintableWidth = new w("Substrate Printable Width", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstratePrintableWidth, true), V.SubstratePrintableHeight = new w("Substrate Printable Height", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstratePrintableHeight, true), V.SubstrateLabelColor = new w("Substrate Label Color", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateLabelColor, true), V.SubstrateRemainingPercent = new w("Substrate Remaining Percent", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateRemainingPercent, true), V.SubstrateIsInvalid = new w("Media Is Invalid", v.FirmwareDriver, U.Error, Y.SubstrateIsInvalid, true), V.SubstrateIsTearoff = new w("Substrate Is Tearoff", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsTearoff, true), V.SubstrateIsCustom = new w("Substrate Is Custom", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsCustom), V.SubstrateIsPrePrinted = new w("Substrate Is Pre Printed", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsPrePrinted), V.SubstrateLabelLinerLeftOffset = new w("Substrate Label Liner Left Offset", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateLabelLinerLeftOffset), V.SubstratePartsAcross = new w("Substrate Parts Across", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstratePartsAcross), V.SubstrateVerticalGap = new w("Substrate Vertical Gap", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateVerticalGap), V.SubstrateHorizontalGap = new w("Substrate Horizontal Gap", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateHorizontalGap), V.SubstrateLinerWidth = new w("Substrate Liner Width", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateLinerWidth), V.SubstrateIsDieCut = new w("Substrate Is Die Cut", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsDieCut), V.SubstrateIsContinuous = new w("Substrate Is Continuous", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsContinuous, true), V.SubstrateIsGapSensed = new w("Substrate Is Gap Sensed", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsGapSensed), V.SubstrateIsEdgeNotched = new w("Substrate Is Edge Notched", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsEdgeNotched), V.SubstrateIsDirectThermal = new w("Substrate Is Direct Thermal", v.FirmwareDriver, U.SubstratePrinterProperties, Y.SubstrateIsDirectThermal, true), V.SubstrateNumberOfAreas = new w("Substrate Number Of Areas", v.FirmwareDriver, U.SubstratePrinterProperties, Y.NumberOfAreas), V.DisplayedErrorBody = new w("Displayed Error Body", v.PerMainAndApps, U.UserError, Y.DisplayedErrorBody, true), V.DisplayedErrorRemedy = new w("Displayed Error Remedy", v.PerMainAndApps, U.UserError, Y.DisplayedErrorRemedy, true), V.DisplayedErrorSeverity = new w("Displayed Error Severity", v.PerMainAndApps, U.UserError, Y.DisplayedErrorSeverity, true), V.DisplayedErrorShortTitle = new w("Displayed Error Short Title", v.PerMainAndApps, U.UserError, Y.DisplayedErrorShortTitle, true), V.DisplayedErrorTitle = new w("Displayed Error Title", v.PerMainAndApps, U.UserError, Y.DisplayedErrorTitle, true), V.MainEditorDisplayedErrorBody = new w("Displayed Error Body", v.MainEditor, U.UserError, Y.DisplayedErrorBody, true), V.MainEditorDisplayedErrorRemedy = new w("Displayed Error Remedy", v.MainEditor, U.UserError, Y.DisplayedErrorRemedy, true), V.MainEditorDisplayedErrorSeverity = new w("Displayed Error Severity", v.MainEditor, U.UserError, Y.DisplayedErrorSeverity, true), V.MainEditorDisplayedErrorShortTitle = new w("Displayed Error Short Title", v.MainEditor, U.UserError, Y.DisplayedErrorShortTitle, true), V.MainEditorDisplayedErrorTitle = new w("Displayed Error Title", v.MainEditor, U.UserError, Y.DisplayedErrorTitle, true), V.PrintheadOpenError = new w("Printhead Open Error", v.FirmwareDriver, U.Error, Y.PrintheadOpenError), V.FirmwareDriverName = new w("Firmware Driver Name", v.FirmwareDriver, U.ProductInfo, Y.FirmwareDriver), V.FirmwareVersion = new w("Firmware Version", v.FirmwareDriver, U.ProductInfo, Y.FirmwareVersion, true), V.PrinterSerialNumber = new w("Printer Serial Number", v.FirmwareDriver, U.ProductInfo, Y.PrinterSerialNumber), V.DotsPerInch = new w("Dots Per Inch", v.FirmwareDriver, U.General, Y.DotsPerInch, true), V.AcConnected = new w("Battery AC Connected", v.FirmwareDriver, U.Battery, Y.AcConnected, true), V.BatteryChargePercentage = new w("Battery Charge Percentage", v.FirmwareDriver, U.Battery, Y.BatteryChargePercentage, true), V.TotalJobsQueued = new w("Total Jobs Queued", v.PrintSpooler, U.General, Y.TotalJobsQueued, true), V.AllJobsGroup = new w("All Jobs Group", v.PrintSpooler, U.AllJobsGroup, null, true), V.PostPrintAccessoryType = new w("Post Print Accessory Type", v.FirmwareDriver, U.AccessoryProperties, Y.PostPrintAccessoryType, true), V.SubstrateArea0Width = new w("Substrate Area 0 Width", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaWidth), V.SubstrateArea0Height = new w("Substrate Area 0 Height", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaHeight), V.SubstrateArea0HorizontalOffset = new w("Substrate Area 0 Horizontal Offset", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaHorizontalOffset), V.SubstrateArea0IsPrintable = new w("Substrate Area 0 Is Printable", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaIsPrintable), V.SubstrateArea0Rotation = new w("Substrate Area 0 Is Printable", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaRotation), V.SubstrateArea0VerticalOffset = new w("Substrate Area 0 Vertical Offset", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaVerticalOffset), V.SubstrateArea0Shape = new w("Substrate Area 0 Shape", v.FirmwareDriver, U.SubstrateArea0Group, Y.AreaShape), V.SubstrateArea1Width = new w("Substrate Area 1 Width", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaWidth), V.SubstrateArea1Height = new w("Substrate Area 1 Height", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaHeight), V.SubstrateArea1HorizontalOffset = new w("Substrate Area 1 Horizontal Offset", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaHorizontalOffset), V.SubstrateArea1IsPrintable = new w("Substrate Area 1 Is Printable", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaIsPrintable), V.SubstrateArea1Rotation = new w("Substrate Area 1 Is Printable", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaRotation), V.SubstrateArea1VerticalOffset = new w("Substrate Area 1 Vertical Offset", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaVerticalOffset), V.SubstrateArea1Shape = new w("Substrate Area 1 Shape", v.FirmwareDriver, U.SubstrateArea1Group, Y.AreaShape), V.SubstrateArea2Width = new w("Substrate Area 2 Width", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaWidth), V.SubstrateArea2Height = new w("Substrate Area 2 Height", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaHeight), V.SubstrateArea2HorizontalOffset = new w("Substrate Area 2 Horizontal Offset", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaHorizontalOffset), V.SubstrateArea2IsPrintable = new w("Substrate Area 2 Is Printable", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaIsPrintable), V.SubstrateArea2Rotation = new w("Substrate Area 2 Is Printable", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaRotation), V.SubstrateArea2VerticalOffset = new w("Substrate Area 2 Vertical Offset", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaVerticalOffset), V.SubstrateArea2Shape = new w("Substrate Area 2 Shape", v.FirmwareDriver, U.SubstrateArea2Group, Y.AreaShape), V.SubstrateArea3Width = new w("Substrate Area 3 Width", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaWidth), V.SubstrateArea3Height = new w("Substrate Area 3 Height", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaHeight), V.SubstrateArea3HorizontalOffset = new w("Substrate Area 3 Horizontal Offset", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaHorizontalOffset), V.SubstrateArea3IsPrintable = new w("Substrate Area 3 Is Printable", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaIsPrintable), V.SubstrateArea3Rotation = new w("Substrate Area 3 Is Printable", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaRotation), V.SubstrateArea3VerticalOffset = new w("Substrate Area 3 Vertical Offset", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaVerticalOffset), V.SubstrateArea3Shape = new w("Substrate Area 3 Shape", v.FirmwareDriver, U.SubstrateArea3Group, Y.AreaShape);
var _ = V;
var z = class {
  constructor() {
    this.m_rawBuffer = null, this.machineType = 0, this.printerStatus = 0, this.labelCellVersion = 0, this.ribbonCellVersion = 0, this.partNumber = "", this.ribbonPartNumber = "", this.partYNumber = 0, this.ribbonYNumber = 0, this.isCustom = false, this.isPrePrinted = false, this.sensorType = null, this.isContinuous = false, this.isDieCut = false, this.isNotched = false, this.temperature = 0, this.printSpeedPercentage = 0, this.linerWidth = 0, this.linerToLabelOffset = 0, this.notchToLabelOffset = 0, this.notchRepeat = 0, this.notchHeight = 0, this.labelsPerRow = 0, this.xGap = 0, this.labelWidth = 0, this.printWidth = 0, this.labelHeight = 0, this.printHeight = 0, this.offsetX = 0, this.offsetY = 0, this.zoneCount = 0, this.m_zones = null, this.supplyRemainingPercentage = 0, this.ribbonRemainingPercentage = 0;
  }
  getRawBuffer() {
    return this.m_rawBuffer;
  }
  setRawBuffer(e2) {
    this.m_rawBuffer = e2;
  }
  getMachineType() {
    return this.machineType;
  }
  setMachineType(e2) {
    this.machineType = e2;
  }
  getPrinterStatus() {
    return this.printerStatus;
  }
  setPrinterStatus(e2) {
    this.printerStatus = e2;
  }
  getLabelCellVersion() {
    return this.labelCellVersion;
  }
  setLabelCellVersion(e2) {
    this.labelCellVersion = e2;
  }
  getRibbonCellVersion() {
    return this.ribbonCellVersion;
  }
  setRibbonCellVersion(e2) {
    this.ribbonCellVersion = e2;
  }
  getPartNumber() {
    return this.partNumber;
  }
  setPartNumber(e2) {
    this.partNumber = e2;
  }
  getRibbonPartNumber() {
    return this.ribbonPartNumber;
  }
  setRibbonPartNumber(e2) {
    this.ribbonPartNumber = e2;
  }
  getPartYNumber() {
    return this.partYNumber;
  }
  setPartYNumber(e2) {
    this.partYNumber = e2;
  }
  getRibbonYNumber() {
    return this.ribbonYNumber;
  }
  setRibbonYNumber(e2) {
    this.ribbonYNumber = e2;
  }
  getIsCustom() {
    return this.isCustom;
  }
  setIsCustom(e2) {
    this.isCustom = e2;
  }
  getIsPrePrinted() {
    return this.isPrePrinted;
  }
  setIsPrePrinted(e2) {
    this.isPrePrinted = e2;
  }
  getSensorType() {
    return this.sensorType;
  }
  setSensorType(e2) {
    this.sensorType = e2;
  }
  getIsContinuous() {
    return this.isContinuous;
  }
  setIsContinuous(e2) {
    this.isContinuous = e2;
  }
  getIsDieCut() {
    return this.isDieCut;
  }
  setIsDieCut(e2) {
    this.isDieCut = e2;
  }
  getIsNotched() {
    return this.isNotched;
  }
  setIsNotched(e2) {
    this.isNotched = e2;
  }
  getTemperature() {
    return this.temperature;
  }
  setTemperature(e2) {
    this.temperature = e2;
  }
  getPrintSpeedPercentage() {
    return this.printSpeedPercentage;
  }
  setPrintSpeedPercentage(e2) {
    this.printSpeedPercentage = e2;
  }
  getLinerWidth() {
    return this.linerWidth;
  }
  setLinerWidth(e2) {
    this.linerWidth = e2;
  }
  getLinerToLabelOffset() {
    return this.linerToLabelOffset;
  }
  setLinerToLabelOffset(e2) {
    this.linerToLabelOffset = e2;
  }
  getNotchToLabelOffset() {
    return this.notchToLabelOffset;
  }
  setNotchToLabelOffset(e2) {
    this.notchToLabelOffset = e2;
  }
  getNotchRepeat() {
    return this.notchRepeat;
  }
  setNotchRepeat(e2) {
    this.notchRepeat = e2;
  }
  getNotchHeight() {
    return this.notchHeight;
  }
  setNotchHeight(e2) {
    this.notchHeight = e2;
  }
  getLabelsPerRow() {
    return this.labelsPerRow;
  }
  setLabelsPerRow(e2) {
    this.labelsPerRow = e2;
  }
  getXGap() {
    return this.xGap;
  }
  setXGap(e2) {
    this.xGap = e2;
  }
  getLabelWidth() {
    return this.labelWidth;
  }
  setLabelWidth(e2) {
    this.labelWidth = e2;
  }
  getPrintWidth() {
    return this.printWidth;
  }
  setPrintWidth(e2) {
    this.printWidth = e2;
  }
  getLabelHeight() {
    return this.labelHeight;
  }
  setLabelHeight(e2) {
    this.labelHeight = e2;
  }
  getPrintHeight() {
    return this.printHeight;
  }
  setPrintHeight(e2) {
    this.printHeight = e2;
  }
  getXOffset() {
    return this.offsetX;
  }
  setXOffset(e2) {
    this.offsetX = e2;
  }
  getYOffset() {
    return this.offsetY;
  }
  setYOffset(e2) {
    this.offsetY = e2;
  }
  getZoneCount() {
    return this.zoneCount;
  }
  setZoneCount(e2) {
    this.zoneCount = e2;
  }
  getZones() {
    return this.m_zones;
  }
  setZones(e2) {
    this.m_zones = e2;
  }
  getLabelColor() {
    return this.labelColor;
  }
  setLabelColor(e2) {
    this.labelColor = e2;
  }
  getRibbonColor() {
    return this.ribbonColor;
  }
  setRibbonColor(e2) {
    this.ribbonColor = e2;
  }
  getSupplyRemainingPercentage() {
    return this.supplyRemainingPercentage;
  }
  setSupplyRemainingPercentage(e2) {
    this.supplyRemainingPercentage = e2;
  }
  getRibbonRemainingPercentage() {
    return this.ribbonRemainingPercentage;
  }
  setRibbonRemainingPercentage(e2) {
    this.ribbonRemainingPercentage = e2;
  }
};
z._maxZoneParametersCount = 4;
var Z = z;
var x;
var k;
var J;
var K;
!function(e2) {
  e2[e2.Continuous = 0] = "Continuous", e2[e2.ContinuousNotched = 1] = "ContinuousNotched", e2[e2.DieCutNotched = 2] = "DieCutNotched", e2[e2.DieCutGapped = 3] = "DieCutGapped";
}(x || (x = {})), function(e2) {
  e2.Printable = "Printable", e2.SelfLaminated = "SelfLaminated", e2.Cutout = "Cutout", e2.ZoneTypeNotDefined = "ZoneTypeNotDefined";
}(k || (k = {})), function(e2) {
  e2.Rectangle = "Rectangle", e2.Elliptical = "Elliptical";
}(J || (J = {}));
var q = class {
  constructor(e2, t2, n2, r2, a2, i2, s2, o2) {
    this.width = e2, this.height = t2, this.offsetX = n2, this.offsetY = r2, this.zoneShape = a2, this.bmpZoneType = i2, this.orientation = s2, this.id = o2;
  }
};
!function(e2) {
  e2.HeadOpen = "HeadOpen", e2.OutOfMedia = "OutOfMedia", e2.OutOfRibbon = "OutOfRibbon", e2.NoMediaInstalled = "NoMediaInstalled", e2.NoRibbonInstalled = "NoRibbonInstalled", e2.InvalidMedia = "InvalidMedia", e2.Media_RibbonMismatch = "Media_RibbonMismatch", e2.CutterJam = "CutterJam", e2.BatteryTooLow = "BatteryTooLow";
}(K || (K = {}));
var X = class extends Z {
  constructor() {
    super(...arguments), this.structureVersion = 0, this.batteryChargePercent = 0, this.isCharging = false, this.printerErrorStatus = null;
  }
  getStructureVersion() {
    return this.structureVersion;
  }
  setStructureVersion(e2) {
    this.structureVersion = e2;
  }
  getBatteryChargePercent() {
    return this.batteryChargePercent;
  }
  setBatteryChargePercent(e2) {
    this.batteryChargePercent = e2;
  }
  getIsCharging() {
    return this.isCharging;
  }
  setIsCharging(e2) {
    this.isCharging = e2;
  }
  getPrinterErrorStatusValue(e2) {
    switch (e2) {
      case 1:
        return K.HeadOpen;
      case 2:
        return K.OutOfMedia;
      case 4:
        return K.OutOfRibbon;
      case 8:
        return K.NoMediaInstalled;
      case 16:
        return K.NoRibbonInstalled;
      case 32:
        return K.InvalidMedia;
      case 64:
        return K.Media_RibbonMismatch;
      case 128:
        return K.CutterJam;
      case 256:
        return K.BatteryTooLow;
      default:
        return null;
    }
  }
  getPrinterErrorStatus() {
    return this.printerErrorStatus;
  }
  setPrinterErrorStatus(e2) {
    this.printerErrorStatus = e2;
  }
  refresh(e2) {
    e2.length < 80 || (this.m_rawBuffer = null, this.labelCellVersion = 0, this.ribbonCellVersion = 0, this.partNumber = "", this.ribbonPartNumber = "", this.partYNumber = 0, this.ribbonYNumber = 0, this.isCustom = false, this.isPrePrinted = false, this.sensorType = x.Continuous, this.temperature = 0, this.printSpeedPercentage = 0, this.linerWidth = 0, this.linerToLabelOffset = 0, this.notchToLabelOffset = 0, this.notchRepeat = 0, this.notchHeight = 0, this.printerErrorStatus = null, this.batteryChargePercent = 0, this.structureVersion = 0, this.machineType = 0, this.parseData(e2), this.m_rawBuffer = e2);
  }
  parseData(e2) {
    try {
      let t2, n2 = 0;
      n2 += 2, this.machineType = e2[n2], n2++, this.structureVersion = e2[n2], n2++, this.labelCellVersion = e2[n2], n2++, this.ribbonCellVersion = e2[n2], n2++;
      let r2 = n2;
      for (; 0 !== e2[r2] && r2 < e2.length; ) r2++;
      for (this.partNumber = String.fromCharCode.apply(null, e2.slice(n2, r2)), n2 += this.partNumber.length + 1, r2 = n2; 0 !== e2[r2] && r2 < e2.length; ) r2++;
      this.ribbonPartNumber = String.fromCharCode.apply(null, e2.slice(n2, r2)), n2 += this.ribbonPartNumber.length + 1, this.partYNumber = this.toInt32(e2, n2), n2 += 4, this.ribbonYNumber = this.toInt32(e2, n2), n2 += 4, t2 = this.toInt16(e2, n2), this.isCustom = 1 === t2, n2 += 2, t2 = this.toInt16(e2, n2), this.isPrePrinted = 4 === t2, n2 += 2, t2 = this.toInt16(e2, n2), this.decodeSensorType(t2), n2 += 2, this.temperature = this.toInt16(e2, n2), n2 += 2, this.printSpeedPercentage = this.toInt16(e2, n2), n2 += 2, this.linerWidth = this.toInt16(e2, n2), n2 += 2, this.linerToLabelOffset = this.toInt16(e2, n2), n2 += 2, this.notchToLabelOffset = this.toInt16(e2, n2), n2 += 2, this.notchRepeat = this.toInt16(e2, n2), n2 += 2, this.notchHeight = this.toInt16(e2, n2), n2 += 2, this.labelsPerRow = this.toInt16(e2, n2), n2 += 2, this.xGap = this.toInt16(e2, n2), n2 += 2, this.labelWidth = this.toInt16(e2, n2), n2 += 2, this.printWidth = this.toInt16(e2, n2), n2 += 2, this.labelHeight = this.toInt16(e2, n2), n2 += 2, this.printHeight = this.toInt16(e2, n2), n2 += 2, this.offsetX = this.toInt16(e2, n2), n2 += 2, this.offsetY = this.toInt16(e2, n2), n2 += 2, this.zoneCount = this.toInt16(e2, n2), n2 += 2, n2 = this.decodeZones(e2, n2), this.labelColor = this.rgb(e2[n2], e2[n2 + 1], e2[n2 + 2]), n2 += 3, this.ribbonColor = this.rgb(e2[n2], e2[n2 + 1], e2[n2 + 2]), n2 += 3, n2 += 16, this.supplyRemainingPercentage = e2[n2], n2++, this.ribbonRemainingPercentage = e2[n2], n2++, this.batteryChargePercent = -128 === e2[n2] ? 100 : 127 & e2[n2];
      const a2 = e2[n2] >> 7;
      this.isCharging = 0 !== a2, n2++, this.printerErrorStatus = this.getPrinterErrorStatusValue(this.toInt32(e2, n2)), n2 += 4;
    } catch (e3) {
      console.error(e3);
    }
  }
  decodeZones(t2, n2) {
    this.m_zones = [];
    const r2 = [];
    for (let a2 = 0; a2 < this.zoneCount; a2++) {
      r2[0] = t2[n2], r2[1] = t2[n2 + 1];
      const i2 = this.toInt16(r2, 0);
      n2 += 2, r2[0] = t2[n2], r2[1] = t2[n2 + 1];
      const s2 = this.toInt16(r2, 0);
      n2 += 2, r2[0] = t2[n2], r2[1] = t2[n2 + 1];
      const o2 = this.toInt16(r2, 0);
      n2 += 2, r2[0] = t2[n2], r2[1] = t2[n2 + 1];
      const u2 = this.toInt16(r2, 0);
      let l2, d2, f2;
      switch (t2[n2 += 2]) {
        case 0:
          l2 = J.Rectangle;
          break;
        case 1:
          l2 = J.Elliptical;
      }
      switch (t2[n2 += 1]) {
        case 0:
          d2 = k.Printable;
          break;
        case 1:
          d2 = k.SelfLaminated;
          break;
        case 2:
          d2 = k.Cutout;
          break;
        default:
          d2 = k.ZoneTypeNotDefined;
      }
      switch (t2[n2 += 1]) {
        case 0:
        case 2:
          f2 = e.Portrait;
          break;
        case 1:
        case 3:
          f2 = e.Landscape;
      }
      n2 += 1;
      const p2 = new q(i2 / 1e3, s2 / 1e3, o2, u2, l2, d2, f2, a2);
      this.m_zones.push(p2);
    }
    return n2;
  }
  decodeSensorType(e2) {
    let t2 = x.Continuous;
    switch (3 & e2) {
      case 0:
        break;
      case 1:
        t2 = x.DieCutGapped;
        break;
      case 2:
        t2 = x.ContinuousNotched;
        break;
      case 3:
        t2 = x.DieCutNotched;
        break;
      default:
        throw new Error();
    }
    this.isContinuous = !(1 & e2), this.isDieCut = !(1 & ~e2), this.isNotched = (3 & e2) > 1, this.sensorType = t2;
  }
  toInt32(e2, t2) {
    return 255 & e2[t2] | (255 & e2[t2 + 1]) << 8 | (255 & e2[t2 + 2]) << 16 | (255 & e2[t2 + 3]) << 24;
  }
  toInt16(e2, t2) {
    return (255 & e2[t2 + 1]) << 8 | 255 & e2[t2];
  }
  rgb(e2, t2, n2) {
    return `rgb(${e2},${t2},${n2})`;
  }
};
var j = class {
  constructor(e2, t2, n2) {
    if (this.printerDiscovery = e2, this.printerName = e2.bleApi.device.name, this.bleBidi = t2, this.printerDiscovery.bleApi.device.name.includes(r.M211) ? (this.printerModel = r.M211, this.updateWithLatestBleProperties()) : this.printerDiscovery.bleApi.device.name.includes(r.M511) && (this.printerModel = r.M511, this.updateWithLatestBleProperties()), this.printerDiscovery.bleApi.device.name.includes(r.M611) || this.printerDiscovery.bleApi.device.name.includes(r.S3700) || this.printerDiscovery.bleApi.device.name.includes(r.i7500)) {
      switch (true) {
        case this.printerDiscovery.bleApi.device.name.includes(r.M611):
          this.printerModel = r.M611;
          break;
        case this.printerDiscovery.bleApi.device.name.includes(r.S3700):
          this.printerModel = r.S3700;
          break;
        case this.printerDiscovery.bleApi.device.name.includes(r.i7500):
          this.printerModel = r.i7500;
      }
      this.piclService = n2, this.piclService.addInternalPrinterConnectionListener(this), this.subscribeToZones = true, this.updateWithLatestBidiProperties();
    } else (this.printerDiscovery.bleApi.device.name.includes(r.M610) || this.printerDiscovery.bleApi.device.name.includes(r.M710)) && (this.printerDiscovery.bleApi.device.name.includes("M610") ? this.printerModel = r.M610 : this.printerModel = r.M710, this.piclService = n2, this.piclService.addInternalPrinterConnectionListener(this), this.updateWithLatestPiclBmpProperties());
  }
  updateWithLatestBleProperties() {
    var e2 = [];
    const t2 = this.bleBidi.identifiedPart;
    if (this.status = "Connected", this.message = "PrinterStatus_Initialized", this.messageTitle = "PrinterStatus_Initialized_Title", this.messageRemedy = "PrinterStatus_Initialized_Remedy", this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.PrintJobIdAndStatus)) {
      const t3 = this.bleBidi.piclResponseDictionary.get(this.bleBidi.PropertyKey.PrintJobIdAndStatus);
      this.printJobIdAndStatus = t3, null != this.printJobIdAndStatus && t3 == this.printJobIdAndStatus || (e2.push("PrintJobIdAndStatus"), this.printJobStatus = this.printJobIdAndStatus.split(":")[1], "Successful" == this.printJobStatus ? console.log("Print Successful!") : console.log("Print Failed!"));
    }
    if (this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.MediaIsInvalid) && (this.status = "Error", this.message = "PrinterStatus_InvalidMedia", this.messageTitle = "PrinterStatus_InvalidMedia_Title", this.messageRemedy = "PrinterStatus_InvalidMedia_Remedy", "PrinterStatus_InvalidMedia_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.CutError) && (this.status = "Error", this.message = "PrinterStatus_CutError", this.messageTitle = "PrinterStatus_CutError_Title", this.messageRemedy = "PrinterStatus_CutError_Remedy", "PrinterStatus_CutError_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.LowPowerError) && (this.status = "Error", this.message = "PrinterStatus_LowPowerError", this.messageTitle = "PrinterStatus_LowPowerError_Title", this.messageRemedy = "PrinterStatus_LowPowerError_Remedy", "PrinterStatus_LowPowerError_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.SubstrateOutError) && (this.status = "Error", this.message = "PrinterStatus_SubstrateOutError", this.messageTitle = "PrinterStatus_SubstrateOutError_Title", this.messageRemedy = "PrinterStatus_SubstrateOutError_Remedy", "PrinterStatus_SubstrateOutError_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.HeadOpenErrorIdentifier) && (this.status = "Error", this.message = "PrinterStatus_HeadOpenErrorIdentifier", this.messageTitle = "PrinterStatus_HeadOpenErrorIdentifier_Title", this.messageRemedy = "PrinterStatus_HeadOpenErrorIdentifier_Remedy", "PrinterStatus_HeadOpenErrorIdentifier_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.LeadingEdgeErrorIdentifier) && (this.status = "Error", this.message = "PrinterStatus_LeadingEdgeErrorIdentifier", this.messageTitle = "PrinterStatus_LeadingEdgeErrorIdentifier_Title", this.messageRemedy = "PrinterStatus_LeadingEdgeErrorIdentifier_Remedy", "PrinterStatus_LeadingEdgeErrorIdentifier_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.SubstrateStallErrorIdentifier) && (this.status = "Error", this.message = "PrinterStatus_SubstrateStallErrorIdentifier", this.messageTitle = "PrinterStatus_SubstrateStallErrorIdentifier_Title", this.messageRemedy = "PrinterStatus_SubstrateStallErrorIdentifier_Remedy", "PrinterStatus_SubstrateStallErrorIdentifier_Title" == this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"))), this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.FirmwareVersion)) {
      const t3 = this.bleBidi.piclResponseDictionary.get(this.bleBidi.PropertyKey.FirmwareVersion);
      this.firmwareVersion = t3, null != this.firmwareVersion && t3 != this.firmwareVersion && e2.push("FirmwareVersion");
    }
    if (this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.ShutdownTimeoutInMins)) {
      const t3 = this.bleBidi.piclResponseDictionary.get(this.bleBidi.PropertyKey.ShutdownTimeoutInMins).value;
      t3 != this.autoShutoffTimeInMinutes && (this.autoShutoffTimeInMinutes = t3, e2.push("AutoShutOffTime"));
    }
    const n2 = this.bleBidi.isPropertyTrue(this.bleBidi.PropertyKey.BatteryACConnected);
    if (n2 != this.isAcConnected && (this.isAcConnected = n2, e2.push("BatteryAcConnected")), this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.BatteryChargeStatus)) {
      var r2 = this.bleBidi.piclResponseDictionary.get(this.bleBidi.PropertyKey.BatteryChargeStatus);
      if (null != r2) switch (r2.value) {
        case "High":
          this.batteryLevelPercentage = 100;
          break;
        case "MediumAbove":
          this.batteryLevelPercentage = 75;
          break;
        case "Medium":
          this.batteryLevelPercentage = 50;
          break;
        case "Low":
          this.batteryLevelPercentage = 11;
          break;
        default:
          this.batteryLevelPercentage = 9;
      }
    }
    if (null != this.batteryLevelPercentage && (this.batteryLevelPercentage >= 10 ? this.lastPrinterWarnedThatBatteryIsLow = false : this.batteryLevelPercentage < 10 && this.batteryLevelPercentage > 2 ? (this.status = "Warning", this.message = "PrinterStatus_BatteryLow", this.messageTitle = "PrinterStatus_BatteryLow_Title", this.messageRemedy = "PrinterStatus_BatteryLow_Remedy", "PrinterStatus_BatteryLow_Title" != this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"), e2.push("BatteryChargePercentage"))) : (this.status = "Error", this.message = "PrinterStatus_BatteryLow", this.messageTitle = "PrinterStatus_BatteryLow_Title", this.messageRemedy = "PrinterStatus_BatteryLow_Remedy", "PrinterStatus_BatteryLow_Title" != this.lastCheckedMessageTitle && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy"), e2.push("BatteryChargePercentage")))), this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.SubstrateRemainingPercent)) {
      var a2 = this.bleBidi.piclResponseDictionary.get(this.bleBidi.PropertyKey.SubstrateRemainingPercent).value;
      a2 != this.supplyRemainingPercentage && (this.supplyRemainingPercentage = a2, e2.push("SupplyRemainingPercent")), this.supplyRemainingPercentage = null != a2 ? a2 : 0;
    }
    if (null != t2 && 0 != this.bleBidi.substrateUniqueId && (t2 instanceof s ? (this.supplyName != t2.partNames && (e2.push("SupplyName"), this.supplyName = t2.partNames), this.substrateYNumber != t2.yNumber && (e2.push("SupplyYNumber"), this.substrateYNumber = t2.yNumber)) : (this.supplyName != t2.partNames[0].partName && (e2.push("SupplyName"), this.supplyName = t2.partNames[0].partName), this.substrateYNumber != t2.partNames[0].yNumber && (e2.push("SupplyYNumber"), this.substrateYNumber = t2.partNames[0].yNumber))), this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.SubstratePrintableHeight) && this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.SubstratePrintableWidth) && (this.bleBidi.piclResponseDictionary.size < this.bleBidi.piclValueDictionary.size ? this.bleBidi.identifiedPart ? (this.bleBidi.identifiedPart.height != this.substrateHeight && (this.substrateHeight = this.bleBidi.identifiedPart.height, e2.push("SupplyHeight")), this.bleBidi.identifiedPart.width != this.substrateWidth && (this.substrateWidth = this.bleBidi.identifiedPart.width, e2.push("SupplyWidth"))) : (this.substrateHeight = parseInt(this.bleBidi.piclResponseDictionary.get("000E").value) / 1e3, e2.push("SupplyHeight"), this.substrateWidth = parseInt(this.bleBidi.piclResponseDictionary.get("000C").value) / 1e3, e2.push("SupplyWidth")) : (this.bleBidi.identifiedPart.height != this.substrateHeight && (this.substrateHeight = this.bleBidi.identifiedPart.height, e2.push("SupplyHeight")), this.bleBidi.identifiedPart.width != this.substrateWidth && (this.substrateWidth = this.bleBidi.identifiedPart.width, e2.push("SupplyWidth"))), this.supplyDimensions = this.substrateHeight + " x " + this.substrateWidth), this.bleBidi.tryToGetValue(this.bleBidi.PropertyKey.SubstrateIsDieCut)) {
      if (this.bleBidi.piclResponseDictionary.size < this.bleBidi.piclValueDictionary.size) {
        if (null == this.mediaIsDieCut) {
          let e3 = "True" === this.bleBidi.piclResponseDictionary.get("0013").value;
          this.mediaIsDieCut = e3;
        }
      } else null != this.mediaIsDieCut && this.bleBidi.identifiedPart.mediaIsDieCut == this.mediaIsDieCut || (this.mediaIsDieCut = this.bleBidi.identifiedPart.mediaIsDieCut);
      e2.push("SupplyIsPresized");
    }
    return this.identifiedPartCheck(t2), this.lastCheckedStatusText != this.status && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy")), this.lastCheckedStatusText = this.status, null != this.messageTitle && (this.lastCheckedMessageTitle = this.messageTitle), e2;
  }
  updateWithLatestBidiProperties() {
    let e2 = [], t2 = false, n2 = this.piclService.getLatestBidiProperties();
    if (null == n2) return null;
    for (var r2 = 0; r2 < n2.length; r2++) {
      let a2 = n2[r2];
      if (_.RibbonPartNumber.Equals(a2)) {
        let t3 = a2.Value;
        this.ribbonName != t3 && this.validRibbon && (e2.push("Ribbon Part Number"), this.ribbonName = t3);
        continue;
      }
      if (_.RibbonColor.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value);
        null != this.ribbonColor && this.ribbonColor != t3 && e2.push("Ribbon Color"), this.ribbonColor = t3;
        continue;
      }
      if (_.RibbonRemainingPercent.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value);
        null != this.ribbonRemainingPercent && this.ribbonRemainingPercent != t3 && e2.push("Ribbon Remaining Percent"), this.ribbonRemainingPercent = t3;
        continue;
      }
      if (_.RibbonIsInvalid.Equals(a2)) {
        let t3 = !("True" == a2.Value);
        null == this.ribbonName || "" == this.ribbonName || t3 || (this.ribbonName = ""), null != this.validRibbon && this.validRibbon != t3 && e2.push("Ribbon Is Invalid"), this.validRibbon = t3;
        continue;
      }
      if (_.SubstratePartNumber.Equals(a2)) {
        let n3 = a2.Value;
        null != this.supplyName && this.supplyName != n3 && (e2.push("Supply Name"), t2 = true), this.supplyName = n3;
        continue;
      }
      if (_.SubstrateYNumber.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value);
        null != this.substrateYNumber && this.substrateYNumber != t3 && e2.push("Substrate YNumber"), this.substrateYNumber = t3;
        continue;
      }
      if (_.SubstrateLabelColor.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value);
        null != this.substrateLabelColor && this.substrateLabelColor != t3 && e2.push("Substrate Label Color"), this.substrateLabelColor = t3;
        continue;
      }
      if (_.SubstrateWidth.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value) / 1e3;
        null != this.substrateWidth && this.substrateWidth != t3 && e2.push("Substrate Width"), this.substrateWidth = t3;
        continue;
      }
      if (_.SubstrateHeight.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value) / 1e3;
        null != this.substrateHeight && this.substrateHeight != t3 && e2.push("Substrate Height"), this.substrateHeight = t3;
        continue;
      }
      if (_.SubstrateRemainingPercent.Equals(a2) && Number(a2.Value) >= 0) {
        let t3 = Number(a2.Value);
        null != this.supplyRemainingPercentage && this.supplyRemainingPercentage != t3 && e2.push("Substrate Remaining Percent"), this.supplyRemainingPercentage = t3;
        continue;
      }
      if (_.SubstrateIsInvalid.Equals(a2)) {
        let t3 = !("True" == a2.Value);
        null != this.validSupply && this.validSupply != t3 && e2.push("Substrate Is Invalid"), this.validSupply = t3;
        continue;
      }
      if (_.SubstrateIsTearoff.Equals(a2)) {
        let t3 = a2.Value;
        null != this.substrateIsTearoff && this.substrateIsTearoff != t3 && e2.push("Substrate Is Tearoff"), this.substrateIsTearoff = t3;
        continue;
      }
      if (_.SubstrateIsContinuous.Equals(a2)) {
        let t3 = !("True" == a2.Value);
        null != this.mediaIsDieCut && this.mediaIsDieCut != t3 && e2.push("Substrate Is Pre-Sized"), this.mediaIsDieCut = t3;
        continue;
      }
      if (_.SubstrateIsDirectThermal.Equals(a2)) {
        let t3 = "True" == a2.Value;
        t3 && (this.ribbonName = "", this.validRibbon = false), null != this.substrateIsDirectThermal && this.substrateIsDirectThermal != t3 && e2.push("Substrate Is Direct Thermal"), this.substrateIsDirectThermal = null != t3 && t3;
        continue;
      }
      if (_.BatteryChargePercentage.Equals(a2)) {
        if ("Invalid Value" != a2.Value && Number(a2.Value) >= 0) {
          let t3 = Number(a2.Value);
          null != this.batteryLevelPercentage && this.batteryLevelPercentage != t3 && e2.push("Battery Level Percentage"), this.batteryLevelPercentage = t3;
        }
      } else {
        if (_.AcConnected.Equals(a2)) {
          let t3 = "True" == a2.Value;
          null != this.isAcConnected && this.isAcConnected != t3 && e2.push("Is AcConnected"), this.isAcConnected = t3;
          continue;
        }
        if (_.FirmwareVersion.Equals(a2)) {
          let t3 = a2.Value;
          null != this.firmwareVersion && this.firmwareVersion != t3 && e2.push("Firmware Version"), this.firmwareVersion = t3;
          continue;
        }
        this.supplyDimensions = this.substrateWidth + " x " + this.substrateHeight, _.DisplayedErrorBody.Equals(a2) ? this.userErrorBody = a2.Value.replace(/\\\\r\\\\n/g, "\r\n") : _.DisplayedErrorRemedy.Equals(a2) ? this.userErrorRemedy = a2.Value : _.DisplayedErrorSeverity.Equals(a2) ? this.userErrorSeverity = a2.Value : _.DisplayedErrorShortTitle.Equals(a2) ? this.userErrorShortTitle = a2.Value : _.DisplayedErrorTitle.Equals(a2) ? this.userErrorTitle = a2.Value : _.MainEditorDisplayedErrorBody.Equals(a2) ? this.userErrorBody = a2.Value.replace(/\\\\r\\\\n/g, "\r\n") : _.MainEditorDisplayedErrorRemedy.Equals(a2) ? this.userErrorRemedy = a2.Value : _.MainEditorDisplayedErrorSeverity.Equals(a2) ? this.userErrorSeverity = a2.Value : _.MainEditorDisplayedErrorTitle.Equals(a2) && (this.userErrorTitle = a2.Value);
      }
    }
    if (t2 || this.subscribeToZones) {
      const e3 = {
        Zones: this.setFullPiclIdentifiedPart(n2),
        Name: this.supplyName,
        DefaultYNumber: this.substrateYNumber,
        Width: 1e4 * this.substrateWidth,
        Height: 1e4 * this.substrateHeight,
        IsContinuous: !this.mediaIsDieCut,
        OutputOrientation: this.mediaIsDieCut ? "Portrait" : "Landscape"
      }, r3 = new s(this.substrateYNumber, e3);
      this.identifiedPartCheck(r3), t2 = false, this.subscribeToZones = false;
    }
    return e2 = this.updatePrinterStatusDetails(e2), e2;
  }
  updateWithLatestPiclBmpProperties() {
    let e2 = [], t2 = this.piclService.getLatestBMPBidiProperties();
    if (null === t2) return null;
    if (t2 instanceof X) {
      this.userErrorBody = "", this.userErrorRemedy = "", this.userErrorSeverity = "", this.userErrorShortTitle = "", this.userErrorTitle = "";
      let n2 = false, r2 = false, a2 = false, i2 = t2;
      this.ribbonName !== i2.ribbonPartNumber && "" !== i2.ribbonPartNumber && (e2.push("RibbonPartNumber"), this.ribbonName = i2.getRibbonPartNumber()), null !== this.ribbonRemainingPercent && this.ribbonRemainingPercent === i2.ribbonRemainingPercentage || (e2.push("RibbonRemainingPercent"), this.ribbonRemainingPercent = i2.getRibbonRemainingPercentage()), (null === this.batteryLevelPercentage || this.batteryLevelPercentage !== Math.min(i2.batteryChargePercent, 100) && 0 !== i2.batteryChargePercent) && (e2.push("BatteryChargePercentage"), this.batteryLevelPercentage = Math.min(i2.getBatteryChargePercent(), 100)), void 0 !== this.isAcConnected && this.isAcConnected === i2.isCharging || (e2.push("BatteryAcConnected"), this.isAcConnected = i2.getIsCharging());
      let s2 = i2.printerErrorStatus;
      if (null === i2.printerErrorStatus && (n2 = true), s2 === K.HeadOpen && (this.userErrorBody = "PrinterStatus_HeadOpen_ErrorBody", this.userErrorRemedy = "PrinterStatus_HeadOpen_ErrorRemedy", this.userErrorTitle = "PrinterStatus_HeadOpen_ErrorTitle", this.userErrorSeverity = "Error", n2 = true), s2 === K.OutOfMedia && (this.userErrorBody = "PrinterStatus_SubstrateRemainingOut_Description", this.userErrorRemedy = "PrinterStatus_SubstrateRemainingOut_Remedy", this.userErrorTitle = "PrinterStatus_SubstrateRemainingOut_Title", this.userErrorSeverity = "Error", n2 = true), s2 === K.OutOfRibbon && (this.userErrorBody = "PrinterStatus_OutOfRibbon_ErrorBody", this.userErrorRemedy = "PrinterStatus_OutOfRibbon_ErrorRemedy", this.userErrorTitle = "PrinterStatus_OutOfRibbon_ErrorTitle", this.userErrorSeverity = "Error", n2 = true), s2 === K.NoMediaInstalled && (this.userErrorBody = "PrinterStatus_NoMediaInstalled_ErrorBody", this.userErrorRemedy = "PrinterStatus_NoMediaInstalled_ErrorRemedy", this.userErrorTitle = "PrinterStatus_NoMediaInstalled_ErrorTitle", this.userErrorSeverity = "Error", n2 = true), s2 === K.NoRibbonInstalled && (this.userErrorBody = "PrinterStatus_NoRibbonInstalled_ErrorBody", this.userErrorRemedy = "PrinterStatus_NoRibbonInstalled_ErrorRemedy", this.userErrorTitle = "PrinterStatus_NoRibbonInstalled_ErrorTitle", this.userErrorSeverity = "Error", n2 = true), s2 === K.InvalidMedia && (this.userErrorBody = "PrinterStatus_InvalidMedia_Description", this.userErrorRemedy = "PrinterStatus_InvalidMedia_Remedy", this.userErrorTitle = "PrinterStatus_InvalidMedia_Title", this.userErrorSeverity = "Error", n2 = true), s2 === K.Media_RibbonMismatch && (this.userErrorBody = "PrinterStatus_SupplyAndRibbonMismatch_Description", this.userErrorRemedy = "PrinterStatus_SupplyAndRibbonMismatch_Remedy", this.userErrorTitle = "PrinterStatus_SupplyAndRibbonMismatch_Title", this.userErrorSeverity = "Error", n2 = true), s2 === K.CutterJam && (this.userErrorBody = "PrinterStatus_CutterJammed_Description", this.userErrorRemedy = "PrinterStatus_CutterJammed_Remedy", this.userErrorTitle = "PrinterStatus_CutterJammed_Title", this.userErrorSeverity = "Error", n2 = true), s2 === K.BatteryTooLow && (this.userErrorBody = "PrinterStatus_BatteryLow_Description", this.userErrorRemedy = "PrinterStatus_BatteryLow_Remedy", this.userErrorTitle = "PrinterStatus_BatteryLow", this.userErrorSeverity = "Error", n2 = true), null !== this.supplyName && this.supplyName === i2.partNumber || (e2.push("SupplyName"), this.supplyName = i2.getPartNumber()), null !== this.substrateYNumber && String(i2.partYNumber) === this.substrateYNumber || (e2.push("SupplyYNumber"), this.substrateYNumber = String(i2.getPartYNumber()), r2 = true, n2 = true), this.substrateWidth !== i2.labelWidth / 1e3 && 0 !== i2.labelWidth && (e2.push("SupplyWidth"), a2 = true, this.substrateWidth = i2.getLabelWidth() / 1e3), this.substrateHeight !== i2.labelHeight / 1e3 && 0 !== i2.labelHeight && (e2.push("SupplyHeight"), a2 = true, this.substrateHeight = i2.getLabelHeight() / 1e3), this.mediaIsDieCut !== i2.isDieCut && (e2.push("SupplyIsPresized"), this.mediaIsDieCut = i2.getIsDieCut()), null !== this.supplyRemainingPercentage && this.supplyRemainingPercentage === i2.supplyRemainingPercentage || (e2.push("SupplyRemainingPercent"), this.supplyRemainingPercentage = i2.getSupplyRemainingPercentage()), a2 && (this.supplyDimensions = this.substrateHeight + " x " + this.substrateWidth), i2.m_zones && (this.zoneDimensions = i2.m_zones), this.zoneDimensions && Array.isArray(this.zoneDimensions)) {
        for (let e3 = 0; e3 < this.zoneDimensions.length; e3++) if (this.zoneDimensions[e3].bmpZoneType === k.Printable) {
          this.orientation !== this.zoneDimensions[e3].orientation && (this.orientation = this.zoneDimensions[e3].orientation);
          break;
        }
      }
      this.lastCheckedStatusText != this.status && (e2.push("CurrentStatus"), e2.push("Message"), e2.push("MessageTitle"), e2.push("MessageRemedy")), this.lastCheckedStatusText = this.status, null != this.messageTitle && (this.lastCheckedMessageTitle = this.messageTitle), n2 && (e2 = this.updatePrinterStatusDetails(e2));
    }
    return e2;
  }
  identifiedPartCheck(e2) {
    e2 instanceof s && this.rotation !== e2.rotation && (this.rotation = e2.rotation), e2 instanceof s && this.orientation !== e2.orientation && (this.orientation = e2.orientation), e2 instanceof s && this.mediaIsDieCut !== e2.mediaIsDieCut && (this.mediaIsDieCut = e2.mediaIsDieCut), e2 instanceof s && this.leftOffset !== e2.leftOffset && (this.leftOffset = e2.leftOffset), e2 instanceof s && this.verticalOffset !== e2.verticalOffset && (this.verticalOffset = e2.verticalOffset), e2 instanceof s && this.zoneDimensions !== e2.zoneDimensions && (this.zoneDimensions = e2.zoneDimensions);
  }
  setFullPiclIdentifiedPart(e2) {
    const t2 = {}, n2 = {}, r2 = {}, a2 = {};
    for (let i3 of e2) if ("Property Not Found" !== i3.Status) if (_.SubstrateArea0IsPrintable.Equals(i3)) {
      let e3;
      e3 = "Area Is Printable" === i3.NameString ? "Printable" : "Nonprintable", t2.Type = e3;
    } else if (_.SubstrateArea0Shape.Equals(i3)) {
      let e3;
      e3 = "Oval" === i3.Value ? "Circle" : i3.Value, t2.Shape = e3;
    } else if (_.SubstrateArea0Width.Equals(i3)) t2.Width = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea0Height.Equals(i3)) t2.Height = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea0HorizontalOffset.Equals(i3)) t2.LeftOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea0VerticalOffset.Equals(i3)) t2.VerticalOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea0Rotation.Equals(i3)) t2.Rotation = parseInt(i3.Value);
    else if (_.SubstrateArea1IsPrintable.Equals(i3)) {
      let e3;
      e3 = "Area Is Printable" === i3.NameString ? "Printable" : "Nonprintable", n2.Type = e3;
    } else if (_.SubstrateArea1Shape.Equals(i3)) {
      let e3;
      e3 = "Oval" === i3.Value ? "Circle" : i3.Value, n2.Shape = e3;
    } else if (_.SubstrateArea1Width.Equals(i3)) n2.Width = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea1Height.Equals(i3)) n2.Height = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea1HorizontalOffset.Equals(i3)) n2.LeftOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea1VerticalOffset.Equals(i3)) n2.VerticalOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea1Rotation.Equals(i3)) n2.Rotation = parseInt(i3.Value);
    else if (_.SubstrateArea2IsPrintable.Equals(i3)) {
      let e3;
      e3 = "Area Is Printable" === i3.NameString ? "Printable" : "Nonprintable", r2.Type = e3;
    } else if (_.SubstrateArea2Shape.Equals(i3)) {
      let e3;
      e3 = "Oval" === i3.Value ? "Circle" : i3.Value, r2.Shape = e3;
    } else if (_.SubstrateArea2Width.Equals(i3)) r2.Width = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea2Height.Equals(i3)) r2.Height = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea2HorizontalOffset.Equals(i3)) r2.LeftOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea2VerticalOffset.Equals(i3)) r2.VerticalOffset = 10 * parseFloat(i3.Value);
    else if (_.SubstrateArea2Rotation.Equals(i3)) r2.Rotation = parseInt(i3.Value);
    else if (_.SubstrateArea3IsPrintable.Equals(i3)) {
      let e3;
      e3 = "Area Is Printable" === i3.NameString ? "Printable" : "Nonprintable", a2.Type = e3;
    } else if (_.SubstrateArea3Shape.Equals(i3)) {
      let e3;
      e3 = "Oval" === i3.Value ? "Circle" : i3.Value, a2.Shape = e3;
    } else _.SubstrateArea3Width.Equals(i3) ? a2.Width = 10 * parseFloat(i3.Value) : _.SubstrateArea3Height.Equals(i3) ? a2.Height = 10 * parseFloat(i3.Value) : _.SubstrateArea3HorizontalOffset.Equals(i3) ? a2.LeftOffset = 10 * parseFloat(i3.Value) : _.SubstrateArea3VerticalOffset.Equals(i3) ? a2.VerticalOffset = 10 * parseFloat(i3.Value) : _.SubstrateArea3Rotation.Equals(i3) && (a2.Rotation = parseInt(i3.Value));
    const i2 = [];
    return i2.push(t2), i2.push(n2), i2.push(r2), i2.push(a2), i2;
  }
  updatePrinterStatusDetails(e2) {
    let t2 = this.status, n2 = this.messageTitle, r2 = this.message, a2 = this.messageRemedy;
    return "" != this.userErrorBody || "" != this.userErrorRemedy || "" != this.userErrorSeverity || "" != this.userErrorShortTitle || "" != this.userErrorTitle ? (this.status = this.userErrorSeverity, this.messageTitle = this.userErrorTitle, this.message = this.userErrorBody, this.messageRemedy = this.userErrorRemedy) : (this.status = "Connected", this.message = "PrinterStatus_Initialized", this.messageTitle = "PrinterStatus_Initialized_Title", this.messageRemedy = "PrinterStatus_Initialized_Remedy"), t2 != this.status && e2.push("Connection Status"), n2 != this.messageTitle && e2.push("Status Message Title"), r2 != this.message && e2.push("Satus Message"), a2 != this.messageRemedy && e2.push("Status Message Remedy"), e2;
  }
};
var $ = class {
  constructor(e2, t2, n2) {
    this.requiresConnectBeforeWrite = false, this.newPacketFormat = false, this._updateBidiPropertiesAction = e2, this._driverName = t2, this._isBluetooth = n2;
  }
  getDriverName() {
    return this._driverName;
  }
  setDriverName(e2) {
    this._driverName = e2;
  }
  getPrinterSerialNumber() {
    return this.printerSerialNumber;
  }
  setPrinterSerialNumber(e2) {
    this.printerSerialNumber = e2;
  }
  getFirmwareVersionNumber() {
    return this.firmwareVersionNumber;
  }
  setFirmwareVersionNumber(e2) {
    this.firmwareVersionNumber = e2;
  }
  getBluetoothVersionNumber() {
    return this.bluetoothVersionNumber;
  }
  setBluetoothVersionNumber(e2) {
    this.bluetoothVersionNumber = e2;
  }
  getWifiVersionNumber() {
    return this.wifiVersionNumber;
  }
  setWifiVersionNumber(e2) {
    this.wifiVersionNumber = e2;
  }
  getYBFileVersionNumber() {
    return this.ybFileVersionNumber;
  }
  setYBFileVersionNumber(e2) {
    this.ybFileVersionNumber = e2;
  }
  getAnalyticsArchivedFiles() {
    return this.analyticsArchivedFiles;
  }
  setAnalyticsArchivedFiles(e2) {
    this.analyticsArchivedFiles = e2;
  }
  isSubscribedToAllCurrentAndNewProperties() {
    return false;
  }
  setSubscribedToAllCurrentAndNewProperties(e2) {
  }
  getBootPacket() {
    return new Uint8Array([113, 86]);
  }
  getStoreCommand() {
    return [];
  }
  getSubscribeRequests(e2) {
    return this.parseBootPropertiesAndBuildSubscribeRequests(e2, false);
  }
  parseBootPropertiesAndBuildSubscribeRequests(e2, t2) {
    if (e2 && 0 !== e2.length) {
      const t3 = String.fromCharCode.apply(null, e2);
      if ("\0" === t3.charAt(0)) return null;
      const n2 = t3.split(",");
      for (const e3 of n2) {
        const t4 = e3.split(":");
        if (2 === t4.length) switch (t4[0]) {
          case "Name":
            break;
          case "SN":
            this.setPrinterSerialNumber(t4[1]);
            break;
          case "FW":
            this.setFirmwareVersionNumber(t4[1]);
            break;
          case "BT":
            this.setBluetoothVersionNumber(t4[1]);
            break;
          case "WiFi":
            this.setWifiVersionNumber(t4[1]);
            break;
          case "Y":
            this.setYBFileVersionNumber(t4[1]);
        }
      }
    }
    return new Uint8Array([27, 73]);
  }
  getPartDefinitionPropertyRequests() {
    return null;
  }
  getAllJobsGroupRequests() {
    return null;
  }
  dispatchPacket(e2) {
    this.getPrinterSerialNumber() ? this._bmpData = new X() : this._bmpData = new Z();
    try {
      this._bmpData instanceof X && this._bmpData.refresh(e2);
    } catch (e3) {
    }
    this._updateBidiPropertiesAction && this._updateBidiPropertiesAction.executeUpdateBMPBidiPropertiesCallback(this._bmpData);
  }
  sendHeartbeat() {
  }
  generatePrivatePropertyRequest(e2) {
    return null;
  }
  buildSubscribeRequests(e2) {
    return [];
  }
  getNextOutputPacket(e2) {
    return [];
  }
  enqueuePiclPacket(e2) {
  }
};
var Q = class {
  constructor() {
  }
};
var ee = class {
  constructor(e2, t2) {
    this.Component = e2, this.GUID = t2;
  }
};
var te = class {
  constructor(e2) {
    this.piclService = e2, this.activePrivatePiclRequests = /* @__PURE__ */ new Map();
  }
  getBootPacket() {
    const e2 = [{
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "222D688A-1554-4C0E-B7A0-0BC377EF4071",
      IsBidiProperty: false,
      PropertyId: "F2EF2A72-D816-4D36-8F0D-905C3528A5D6",
      PropertyName: "Firmware Driver Name"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "222D688A-1554-4C0E-B7A0-0BC377EF4071",
      IsBidiProperty: false,
      PropertyId: "ACEB1224-1DAF-42A2-BBAA-4678D5D3C8DA",
      PropertyName: "Firmware Version"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "222D688A-1554-4C0E-B7A0-0BC377EF4071",
      IsBidiProperty: false,
      PropertyId: "AE2955D7-1AE3-4520-BB1C-1DC0C2B5A58B",
      PropertyName: "Printer Serial Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "99A61D40-20CE-41EA-A579-EB92C6ED94C6",
      IsBidiProperty: false,
      PropertyId: "890AF444-4F6B-44E9-B3F6-EA0239DE6317",
      PropertyName: "Dots Per Inch"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "AE766260-8427-4D56-B979-E1D9D5524B3E",
      IsBidiProperty: false,
      PropertyId: "1CC7C409-31A2-4A09-B864-FCE3A6D15FE2",
      PropertyName: "Post Print Accessory Type"
    }];
    let t2 = [];
    for (let n3 = 0; n3 < e2.length; n3++) t2.push(new ee(e2[n3].ComponentId, e2[n3].GroupId + ":" + e2[n3].PropertyId));
    let n2 = new Q();
    return n2.PropertyGetRequests = t2, this.buildJsonPacket(n2);
  }
  getSubscribeRequests(e2) {
    let [t2, n2] = this.parseData(e2);
    const a2 = '{"PropertyGetResponses":[' + new TextDecoder("utf-8").decode(n2).split(":[")[1], i2 = JSON.parse(a2), s2 = new Q();
    s2.PropertyGetResponses = i2.PropertyGetResponses;
    let o2 = null;
    for (let e3 = 0; e3 < s2.PropertyGetResponses.length; e3++) "Firmware Driver" == s2.PropertyGetResponses[e3].ComponentString && (s2.PropertyGetResponses[e3].Value == r.M611 || s2.PropertyGetResponses[e3].Value == r.i7500 ? o2 = this.getEdisonPiclBidiProperties() : s2.PropertyGetResponses[e3].Value == r.S3700 ? o2 = this.getMainEditorPiclBidiProperties() : "Post Print Accessory Type" == s2.PropertyGetResponses[e3].NameString ? "Invalid Value" !== s2.PropertyGetResponses[e3].Value && (this.postPrintAccessoryType = parseInt(s2.PropertyGetResponses[e3].Value)) : "Dots Per Inch" == s2.PropertyGetResponses[e3].NameString && "Invalid Value" !== s2.PropertyGetResponses[e3].Value && (this.printerDpi = parseInt(s2.PropertyGetResponses[e3].Value)));
    let u2 = [];
    for (let e3 = 0; e3 < o2.length; e3++) o2[e3].isBidiProperty && u2.push(o2[e3]);
    this.bidiProperties = /* @__PURE__ */ new Map();
    for (let e3 = 0; e3 < u2.length; e3++) this.bidiProperties.set(u2[e3].groupId + ":" + u2[e3].propertyId, u2[e3]);
    let l2 = this.generateGetRequests(o2);
    return s2.PropertySubscribeRequests = l2, this.buildJsonPacket(s2);
  }
  getPostPrintAccessoryType() {
    return this.postPrintAccessoryType;
  }
  getPrinterDpi() {
    return this.printerDpi;
  }
  setPostPrintAccessoryType(e2) {
    this.postPrintAccessoryType = e2;
  }
  generateGetRequests(e2) {
    let t2 = [];
    for (let n2 = 0; n2 < e2.length; n2++) t2.push(new ee(e2[n2].componentId, e2[n2].groupId + ":" + e2[n2].propertyId));
    return t2;
  }
  parseData(e2) {
    return [e2.slice(0, 16), e2.slice(20, e2.length)];
  }
  buildJsonPacket(e2) {
    const t2 = JSON.stringify(e2), n2 = new TextEncoder().encode(t2), r2 = n2.length, a2 = new Uint8Array([255 & r2, r2 >>> 8 & 255, r2 >>> 16 & 255, r2 >>> 24 & 255]), i2 = new Uint8Array([179, 236, 9, 154, 34, 146, 72, 250, 131, 208, 6, 132, 11, 201, 145, 2]), s2 = new Uint8Array(i2.length + a2.length + r2);
    return s2.set(i2, 0), s2.set(a2, i2.length), s2.set(n2, i2.length + a2.length), s2;
  }
  dispatchPacket(e2) {
    let [t2, n2] = this.parseData(e2);
    const r2 = '{"PropertyGetResponses":[' + new TextDecoder("utf-8").decode(n2).split(":[")[1], a2 = JSON.parse(r2), i2 = new Q();
    i2.PropertyGetResponses = a2.PropertyGetResponses, this.dispatchJsonPiclObject(i2);
  }
  dispatchJsonPiclObject(e2) {
    let [t2, n2, r2] = this.filterPropertyResponses(e2.PropertyGetResponses);
    t2.length > 0 && this.piclService.executeUpdateBidiProperties(t2), n2.length > 0 && this.piclService.executePrintQueueProperties(n2), r2.length > 0 && this.piclService.executePiclProperties(r2);
  }
  filterPropertyResponses(e2) {
    let t2 = [], n2 = [], r2 = [];
    for (let a2 = 0; a2 < e2.length; a2++) this.bidiProperties.has(e2[a2].GUID) && t2.push(e2[a2]), e2[a2].Component == v.PrintSpooler && n2.push(e2[a2]), null != this.activePrivatePiclRequests.get(e2[a2].GUID) && (this.activePrivatePiclRequests.delete(e2[a2].GUID), r2.push(e2[a2]));
    return [t2, n2, r2];
  }
  getEdisonPiclBidiProperties() {
    let e2 = [{
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "2EBF9DEF-D51C-47FE-935E-5EDCC530B867",
      IsBidiProperty: false,
      PropertyId: "33A0B25B-1660-4F29-9AF3-40B70CE291B2",
      PropertyName: "Printhead Open Error"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "222D688A-1554-4C0E-B7A0-0BC377EF4071",
      IsBidiProperty: true,
      PropertyId: "ACEB1224-1DAF-42A2-BBAA-4678D5D3C8DA",
      PropertyName: "Firmware Version"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "99A61D40-20CE-41EA-A579-EB92C6ED94C6",
      IsBidiProperty: false,
      PropertyId: "AE2955D7-1AE3-4520-BB1C-1DC0C2B5A58B",
      PropertyName: "Printer Serial Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "99A61D40-20CE-41EA-A579-EB92C6ED94C6",
      IsBidiProperty: true,
      PropertyId: "890AF444-4F6B-44E9-B3F6-EA0239DE6317",
      PropertyName: "Dots Per Inch"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "349FA937-C9C0-4605-A382-B5FEE4A56C0D",
      PropertyName: "Ribbon Part Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "3CA46968-3332-4DA5-AAFA-4069F9B72BF6",
      PropertyName: "Ribbon Y Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "109CB11B-6C99-4FB2-BFD2-78871FAFB934",
      PropertyName: "Ribbon Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "44AB42C3-3804-4D41-805A-F7D59E3C9982",
      PropertyName: "Ribbon Color"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "5DA4C82D-C498-4DB2-A87A-D65499E225A0",
      PropertyName: "Ribbon Remaining Percent"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "2EBF9DEF-D51C-47FE-935E-5EDCC530B867",
      IsBidiProperty: true,
      PropertyId: "FB01FE2F-A52D-4A67-A8D5-B4D122CD4B43",
      PropertyName: "Ribbon Is Invalid"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "1F59F145-04F2-4199-ABC9-4FA9BDEC89EB",
      PropertyName: "Substrate Part Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "778B241E-BEA5-4600-8871-D5EAF833B775",
      PropertyName: "Substrate Y Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "64D5F9B9-B239-458D-B8B7-20E2979E3E18",
      PropertyName: "Substrate Label Color"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "0A610815-EE87-45D1-8CC8-1C719C558332",
      PropertyName: "Substrate Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "DA6D0191-4329-4E8C-9B68-456ACEB4F7DF",
      PropertyName: "Substrate Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "FCD0EDDD-3D48-427D-B27C-0D2D7BBC8AC2",
      PropertyName: "Substrate Printable Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "921C0E3E-45F4-466E-B748-CA1509E75C9D",
      PropertyName: "Substrate Printable Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "946A015D-6FE0-42B8-A194-79994463B4D3",
      PropertyName: "Substrate Remaining Percent"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "1AB35077-D002-403D-899B-C59CFF7D111E",
      PropertyName: "Substrate Is Continuous"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "2EBF9DEF-D51C-47FE-935E-5EDCC530B867",
      IsBidiProperty: true,
      PropertyId: "3033B200-8D64-4D46-A50E-12E93BA03F42",
      PropertyName: "Media Is Invalid"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "F9518A79-64DB-470E-A92A-A288FA2BFEC4",
      PropertyName: "Substrate Is Tearoff"
    }, {
      ComponentId: "9829BC5B-6892-46DB-A8AA-A6FEAB588255",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "1465C679-31E4-4FE0-8AAE-739B226735EF",
      PropertyName: "Displayed Error Body"
    }, {
      ComponentId: "9829BC5B-6892-46DB-A8AA-A6FEAB588255",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "CDA4804D-E2DB-4645-AB48-36C18F18E3DE",
      PropertyName: "Displayed Error Remedy"
    }, {
      ComponentId: "9829BC5B-6892-46DB-A8AA-A6FEAB588255",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "78C70C95-068B-4EBA-AC29-9B72246F7D87",
      PropertyName: "Displayed Error Severity"
    }, {
      ComponentId: "9829BC5B-6892-46DB-A8AA-A6FEAB588255",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "ABF1EA80-0162-49F7-ADDA-47763F2BB392",
      PropertyName: "Displayed Error Short Title"
    }, {
      ComponentId: "9829BC5B-6892-46DB-A8AA-A6FEAB588255",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "ACDA858D-A78B-4E3E-B185-ED7D4E8C2D1C",
      PropertyName: "Displayed Error Title"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "FDA4C5D4-8C46-45E5-80E4-48504451C7B5",
      IsBidiProperty: true,
      PropertyId: "ECDD0A3C-DFCB-4F47-A2EA-235C5803657C",
      PropertyName: "AC Connected"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "FDA4C5D4-8C46-45E5-80E4-48504451C7B5",
      IsBidiProperty: true,
      PropertyId: "62160CE4-7FED-4F3B-BE27-9D773CFB84DC",
      PropertyName: "Battery Charge Percentage"
    }, {
      ComponentId: "90AF7DE7-6DB1-45AF-A46F-C66605612E61",
      GroupId: "99A61D40-20CE-41EA-A579-EB92C6ED94C6",
      IsBidiProperty: true,
      PropertyId: "90F8019C-1732-4C60-9E16-450C9557E354",
      PropertyName: "TotalJobsQueued"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "878DDE29-ED21-430D-9047-9B2FC05669DF",
      PropertyName: "Substrate Is Direct Thermal"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "C08750A3-80E7-4961-833D-580ED41581DD",
      PropertyName: "Area Is Printable"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "165A7A98-82D0-44D3-84FA-FB272645E95B",
      PropertyName: "Area Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "63F071EC-F39C-45B3-AE59-4A1400B7C956",
      PropertyName: "Area Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "397C7C34-8B09-4B78-8F0F-2849BD059C99",
      PropertyName: "Area Shape"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "EA0869B1-04FD-4B2C-9045-E9A8A0E330AC",
      PropertyName: "Area Horizontal Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "E0741817-145E-4CF6-9CAA-FDFAB711CEA1",
      PropertyName: "Area Vertical Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 0",
      IsBidiProperty: true,
      PropertyId: "E7CBB620-9556-4979-AEF0-76DAB1FBAC8E",
      PropertyName: "Area Rotation"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "C08750A3-80E7-4961-833D-580ED41581DD",
      PropertyName: "Area Is Printable"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "165A7A98-82D0-44D3-84FA-FB272645E95B",
      PropertyName: "Area Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "63F071EC-F39C-45B3-AE59-4A1400B7C956",
      PropertyName: "Area Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "397C7C34-8B09-4B78-8F0F-2849BD059C99",
      PropertyName: "Area Shape"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "EA0869B1-04FD-4B2C-9045-E9A8A0E330AC",
      PropertyName: "Area Horizontal Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "E0741817-145E-4CF6-9CAA-FDFAB711CEA1",
      PropertyName: "Area Vertical Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 1",
      IsBidiProperty: true,
      PropertyId: "E7CBB620-9556-4979-AEF0-76DAB1FBAC8E",
      PropertyName: "Area Rotation"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "C08750A3-80E7-4961-833D-580ED41581DD",
      PropertyName: "Area Is Printable"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "165A7A98-82D0-44D3-84FA-FB272645E95B",
      PropertyName: "Area Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "63F071EC-F39C-45B3-AE59-4A1400B7C956",
      PropertyName: "Area Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "397C7C34-8B09-4B78-8F0F-2849BD059C99",
      PropertyName: "Area Shape"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "EA0869B1-04FD-4B2C-9045-E9A8A0E330AC",
      PropertyName: "Area Horizontal Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "E0741817-145E-4CF6-9CAA-FDFAB711CEA1",
      PropertyName: "Area Vertical Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 2",
      IsBidiProperty: true,
      PropertyId: "E7CBB620-9556-4979-AEF0-76DAB1FBAC8E",
      PropertyName: "Area Rotation"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "C08750A3-80E7-4961-833D-580ED41581DD",
      PropertyName: "Area Is Printable"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "165A7A98-82D0-44D3-84FA-FB272645E95B",
      PropertyName: "Area Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "63F071EC-F39C-45B3-AE59-4A1400B7C956",
      PropertyName: "Area Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "397C7C34-8B09-4B78-8F0F-2849BD059C99",
      PropertyName: "Area Shape"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "EA0869B1-04FD-4B2C-9045-E9A8A0E330AC",
      PropertyName: "Area Horizontal Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "E0741817-145E-4CF6-9CAA-FDFAB711CEA1",
      PropertyName: "Area Vertical Offset"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "Substrate Area 3",
      IsBidiProperty: true,
      PropertyId: "E7CBB620-9556-4979-AEF0-76DAB1FBAC8E",
      PropertyName: "Area Rotation"
    }];
    const t2 = [];
    for (let n2 = 0; n2 < e2.length; n2++) {
      const r2 = e2[n2];
      t2.push(new w(r2.PropertyName, r2.ComponentId, r2.GroupId, r2.PropertyId, r2.IsBidiProperty));
    }
    return t2;
  }
  getMainEditorPiclBidiProperties() {
    let e2 = [{
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "222D688A-1554-4C0E-B7A0-0BC377EF4071",
      IsBidiProperty: true,
      PropertyId: "ACEB1224-1DAF-42A2-BBAA-4678D5D3C8DA",
      PropertyName: "Firmware Version"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "349FA937-C9C0-4605-A382-B5FEE4A56C0D",
      PropertyName: "Ribbon Part Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "44AB42C3-3804-4D41-805A-F7D59E3C9982",
      PropertyName: "Ribbon Color"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "CC359C57-F0F2-44E3-9940-3F1BFF1685BC",
      IsBidiProperty: true,
      PropertyId: "5DA4C82D-C498-4DB2-A87A-D65499E225A0",
      PropertyName: "Ribbon Remaining Percent"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "2EBF9DEF-D51C-47FE-935E-5EDCC530B867",
      IsBidiProperty: true,
      PropertyId: "FB01FE2F-A52D-4A67-A8D5-B4D122CD4B43",
      PropertyName: "Ribbon Is Invalid"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "1F59F145-04F2-4199-ABC9-4FA9BDEC89EB",
      PropertyName: "Substrate Part Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "778B241E-BEA5-4600-8871-D5EAF833B775",
      PropertyName: "Substrate Y Number"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "1AB35077-D002-403D-899B-C59CFF7D111E",
      PropertyName: "Substrate Is Continuous"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "64D5F9B9-B239-458D-B8B7-20E2979E3E18",
      PropertyName: "Substrate Label Color"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "0A610815-EE87-45D1-8CC8-1C719C558332",
      PropertyName: "Substrate Height"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "DA6D0191-4329-4E8C-9B68-456ACEB4F7DF",
      PropertyName: "Substrate Width"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "946A015D-6FE0-42B8-A194-79994463B4D3",
      PropertyName: "Substrate Remaining Percent"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "2EBF9DEF-D51C-47FE-935E-5EDCC530B867",
      IsBidiProperty: true,
      PropertyId: "3033B200-8D64-4D46-A50E-12E93BA03F42",
      PropertyName: "Media Is Invalid"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "F9518A79-64DB-470E-A92A-A288FA2BFEC4",
      PropertyName: "Substrate Is Tearoff"
    }, {
      ComponentId: "D3997F5A-EBEA-46EC-AE7C-026E45702086",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "1465C679-31E4-4FE0-8AAE-739B226735EF",
      PropertyName: "Displayed Error Body"
    }, {
      ComponentId: "D3997F5A-EBEA-46EC-AE7C-026E45702086",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "CDA4804D-E2DB-4645-AB48-36C18F18E3DE",
      PropertyName: "Displayed Error Remedy"
    }, {
      ComponentId: "D3997F5A-EBEA-46EC-AE7C-026E45702086",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "78C70C95-068B-4EBA-AC29-9B72246F7D87",
      PropertyName: "Displayed Error Severity"
    }, {
      ComponentId: "D3997F5A-EBEA-46EC-AE7C-026E45702086",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "ABF1EA80-0162-49F7-ADDA-47763F2BB392",
      PropertyName: "Displayed Error Short Title"
    }, {
      ComponentId: "D3997F5A-EBEA-46EC-AE7C-026E45702086",
      GroupId: "3423DD8F-23D7-44C7-A6DA-01ED76A7A544",
      IsBidiProperty: true,
      PropertyId: "ACDA858D-A78B-4E3E-B185-ED7D4E8C2D1C",
      PropertyName: "Displayed Error Title"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "FDA4C5D4-8C46-45E5-80E4-48504451C7B5",
      IsBidiProperty: true,
      PropertyId: "ECDD0A3C-DFCB-4F47-A2EA-235C5803657C",
      PropertyName: "AC Connected"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "FDA4C5D4-8C46-45E5-80E4-48504451C7B5",
      IsBidiProperty: true,
      PropertyId: "62160CE4-7FED-4F3B-BE27-9D773CFB84DC",
      PropertyName: "Battery Charge Percentage"
    }, {
      ComponentId: "90AF7DE7-6DB1-45AF-A46F-C66605612E61",
      GroupId: "99A61D40-20CE-41EA-A579-EB92C6ED94C6",
      IsBidiProperty: true,
      PropertyId: "90F8019C-1732-4C60-9E16-450C9557E354",
      PropertyName: "TotalJobsQueued"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "B20821F0-23E6-4B5E-ACE7-95B2DD33B0C4",
      PropertyName: "File Revision Y"
    }, {
      ComponentId: "B80EB2EA-4F49-423A-875C-8ACB1ACB9734",
      GroupId: "41B87577-BD88-48CE-BF21-BF5A6BFC9FE3",
      IsBidiProperty: true,
      PropertyId: "C2AFA71A-1D52-4AF7-8809-B19A1F239D6A",
      PropertyName: "YB File Json Revision"
    }];
    const t2 = [];
    for (let n2 = 0; n2 < e2.length; n2++) {
      const r2 = e2[n2];
      t2.push(new w(r2.PropertyName, r2.ComponentId, r2.GroupId, r2.PropertyId, r2.IsBidiProperty));
    }
    return t2;
  }
};
var ne = class {
  constructor(e2, t2, n2) {
    this.connectionContext = t2, this.sessionId = g(), this.packetManager = n2 ? new $(e2) : new te(e2);
  }
  getBootPacket() {
    return this.packetManager.getBootPacket();
  }
  getPostPrintAccessoryType() {
    if (this.packetManager instanceof te) return this.packetManager.getPostPrintAccessoryType();
  }
  getPrinterDpi() {
    if (this.packetManager instanceof te) return this.packetManager.getPrinterDpi();
  }
  parseBootPropertiesAndBuildSubscribeRequests(e2) {
    return this.packetManager.getSubscribeRequests(e2);
  }
  dispatchPacket(e2) {
    return this.packetManager, this.packetManager.dispatchPacket(e2);
  }
};
var re = class {
  constructor(e2, t2, n2, r2) {
    this.connectionContext = e2, this.reconnectIfPossible = t2, this.dummyService = n2, this.currentPiclServiceSession = new ne(this, this.connectionContext, r2);
  }
  addInternalPrinterConnectionListener(e2) {
    this.internalPrinterConnectionListener = e2;
  }
  executeUpdateBidiProperties(e2) {
    this.bidiDictionary = /* @__PURE__ */ new Map();
    for (let t2 = 0; t2 < e2.length; t2++) this.bidiDictionary.set(e2[t2].GUID, e2[t2]);
    null != this.internalPrinterConnectionListener && this.internalPrinterConnectionListener.updateWithLatestBidiProperties();
  }
  executeUpdateBMPBidiPropertiesCallback(e2, t2) {
    this._bmpData = e2, null != this.internalPrinterConnectionListener && this.internalPrinterConnectionListener.updateWithLatestPiclBmpProperties();
  }
  executePrintQueueProperties(e2) {
  }
  executePiclProperties(e2) {
    this.bidiDictionary = /* @__PURE__ */ new Map();
    for (let t2 = 0; t2 < e2.length; t2++) this.bidiDictionary.set(e2[t2].GUID, e2[t2]);
  }
  getBootPacket() {
    return null != this.currentPiclServiceSession ? this.currentPiclServiceSession.getBootPacket() : null;
  }
  parseBootPropertiesAndBuildSubscribeRequests(e2) {
    return null != this.currentPiclServiceSession ? this.currentPiclServiceSession.parseBootPropertiesAndBuildSubscribeRequests(e2) : null;
  }
  dispatchPacket(e2) {
    return null != this.currentPiclServiceSession ? this.currentPiclServiceSession.dispatchPacket(e2) : null;
  }
  getLatestBidiProperties() {
    let e2 = [];
    if (null != this.bidiDictionary) {
      let n2 = this.bidiDictionary.values();
      for (var t2 = 0; t2 < this.bidiDictionary.size; t2++) e2.push(n2.next().value);
      return e2;
    }
    return null;
  }
  getLatestBMPBidiProperties() {
    return null != this.currentPiclServiceSession ? this._bmpData : null;
  }
  getPostPrintAccessoryType() {
    return null != this.currentPiclServiceSession ? this.currentPiclServiceSession.getPostPrintAccessoryType() : null;
  }
  getPrinterDpi() {
    return null != this.currentPiclServiceSession ? this.currentPiclServiceSession.getPrinterDpi() : 300;
  }
};
var ae;
var ie;
var se;
var oe = function(e2, t2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(a2, i2) {
    function s2(e3) {
      try {
        u2(r2.next(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function o2(e3) {
      try {
        u2(r2.throw(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function u2(e3) {
      var t3;
      e3.done ? a2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
        e4(t3);
      })).then(s2, o2);
    }
    u2((r2 = r2.apply(e2, t2 || [])).next());
  });
};
var ue = class {
  constructor(e2) {
    this.bradySdk = e2, this.bleApi = new E(this), this.viewModel = null;
  }
  startBlePrinterDiscovery(e2) {
    return oe(this, void 0, void 0, function* () {
      const t2 = yield this.bleApi.promptForBleDeviceConnection(e2);
      if (null != this.bleApi.device && null != this.bleApi.device.name) {
        if (this.bleApi.device.name.includes(r.M211) || this.bleApi.device.name.includes(r.M511)) yield this.bleApi.subscribeToTheDesiredPiclProperties();
        else if (this.bleApi.device.name.includes(r.M611) || this.bleApi.device.name.includes(r.M610) || this.bleApi.device.name.includes(r.M710) || this.bleApi.device.name.includes(r.S3700) || this.bleApi.device.name.includes(r.i7500)) {
          null !== this.fullPiclSubscribeRequests && (this.fullPiclSubscribeRequests = null), this.piclService && (this.piclService = null), this.piclService = new re(this.bleApi.device, false, true, this.bleApi.isBmpProtocol);
          let e3 = this.piclService.getBootPacket(), t3 = this.compressPacket(e3, this.bleApi.isBmpProtocol), n2 = yield this.bleApi.sendDataToPrinter(this.bleApi.piclRequestCharacteristic, t3);
          if (console.log("Setting up PICL Service..."), this.bleApi.isBmpProtocol) {
            const e4 = setInterval(() => oe(this, void 0, void 0, function* () {
              this.bleApi.isConnected ? this.getCompressedPiclRequests(n2) : clearInterval(e4);
            }), 3e3);
          } else this.getCompressedPiclRequests(n2);
        }
      }
      return this.isConnected = this.bleApi.isConnected, t2;
    });
  }
  getCompressedPiclRequests(e2) {
    return oe(this, void 0, void 0, function* () {
      if (!e2) return null;
      for (; null == this.fullPiclSubscribeRequests; ) yield this.sleep(200);
      let t2 = this.compressPacket(this.fullPiclSubscribeRequests, this.bleApi.isBmpProtocol);
      yield this.bleApi.sendDataToPrinter(this.bleApi.piclRequestCharacteristic, t2), this.isConnected = this.bleApi.isConnected;
    });
  }
  setFullPiclSubscribeRequests(e2) {
    this.fullPiclSubscribeRequests = e2;
  }
  sleep(e2) {
    return oe(this, void 0, void 0, function* () {
      return new Promise((t2) => setTimeout(t2, e2));
    });
  }
  feed() {
    return oe(this, void 0, void 0, function* () {
      return yield this.bleApi.feed();
    });
  }
  cut() {
    return oe(this, void 0, void 0, function* () {
      return yield this.bleApi.cut();
    });
  }
  printBitmap(e2, t2) {
    return oe(this, void 0, void 0, function* () {
      return t2 ? yield this.bleApi.print(e2, t2) : yield this.bleApi.print(e2);
    });
  }
  receivePrinterUpdates(e2) {
    let t2;
    null == this.viewModel ? this.viewModel = new j(this, e2, this.piclService) : this.viewModel.printerModel == r.M211 || this.viewModel.printerModel == r.M511 ? t2 = this.viewModel.updateWithLatestBleProperties() : this.viewModel.printerModel === r.M611 || this.viewModel.printerModel === r.S3700 || this.viewModel.printerModel === r.i7500 ? t2 = this.viewModel.updateWithLatestBidiProperties() : this.viewModel.printerModel !== r.M610 && this.viewModel.printerModel !== r.M710 || (t2 = this.viewModel.updateWithLatestPiclBmpProperties()), this.bradySdk.status = this.viewModel.status, this.bradySdk.printerName = this.viewModel.printerName, this.bradySdk.printerModel = this.viewModel.printerModel, this.bradySdk.supplyName = this.viewModel.supplyName, this.bradySdk.supplyDimensions = this.viewModel.supplyDimensions, this.bradySdk.supplyRemainingPercentage = this.viewModel.supplyRemainingPercentage, this.bradySdk.ribbonRemainingPercent = this.viewModel.ribbonRemainingPercent, this.bradySdk.substrateYNumber = this.viewModel.substrateYNumber, this.bradySdk.substrateWidth = this.viewModel.substrateWidth, this.bradySdk.substrateHeight = this.viewModel.substrateHeight, this.bradySdk.mediaIsDieCut = this.viewModel.mediaIsDieCut, this.bradySdk.rotation = this.viewModel.rotation, this.bradySdk.orientation = this.viewModel.orientation, this.bradySdk.leftOffset = this.viewModel.leftOffset, this.bradySdk.verticalOffset = this.viewModel.verticalOffset, this.bradySdk.zoneDimensions = this.viewModel.zoneDimensions, this.bradySdk.batteryLevelPercentage = this.viewModel.batteryLevelPercentage, this.bradySdk.isAcConnected = this.viewModel.isAcConnected, this.bradySdk.firmwareVersion = this.viewModel.firmwareVersion, this.bradySdk.autoShutoffTimeInMinutes = this.viewModel.autoShutoffTimeInMinutes, this.bradySdk.message = this.viewModel.message, this.bradySdk.messageTitle = this.viewModel.messageTitle, this.bradySdk.messageRemedy = this.viewModel.messageRemedy, this.bradySdk.supplyIsDirectThermal = this.viewModel.substrateIsDirectThermal, this.bradySdk.mostRecentUpdates = t2, this.bradySdk.postPrintAccessoryType = null != this.getPostPrintAccessoryType() ? this.getPostPrintAccessoryType() : "None", this.bradySdk.dotsPerInch = this.getDotsPerInch(), this.bradySdk.supplyIsDirectThermal = this.isDirectThermalSupply(), this.receivedPrinterUpdates = true, this.bradySdk.printerUpdatesCallback(t2);
  }
  disconnect() {
    return oe(this, void 0, void 0, function* () {
      return this.viewModel = null, yield this.bleApi.disconnect();
    });
  }
  compressPacket(e2, t2) {
    if (t2) return e2;
    {
      let t3 = new y(), n2 = new Uint8Array(e2.slice(20, e2.length)), r2 = t3.compress(n2), a2 = r2.slice(11, r2.length), i2 = [143, 153];
      const s2 = a2.length, o2 = new Uint8Array([255 & s2, s2 >>> 8 & 255, s2 >>> 16 & 255, s2 >>> 24 & 255]), u2 = e2.length - 20, l2 = new Uint8Array([255 & u2, u2 >>> 8 & 255, u2 >>> 16 & 255, u2 >>> 24 & 255]);
      return i2.push(...o2), i2.push(...l2), i2.push(...a2), i2.slice(0, i2.length - 4);
    }
  }
  getPostPrintAccessoryType() {
    if (null == this.piclService) return null;
    switch (this.piclService.getPostPrintAccessoryType()) {
      case 0:
        return "TearBar";
      case 1:
        return "AutoCutter";
      case 2:
        return "PeelWithoutLabelTakenSensor";
      case 3:
        return "PeelWithLabelTakenSensor";
      case 4:
        return "PerforationCutter";
      default:
        return "None";
    }
  }
  getDotsPerInch() {
    let e2 = 300;
    return "M211" == this.viewModel.printerModel ? e2 = 203 : null != this.piclService && (e2 = this.piclService.getPrinterDpi()), e2;
  }
  isDirectThermalSupply() {
    return this.viewModel.substrateIsDirectThermal;
  }
};
var le = class {
  constructor(e2, t2) {
    this._x = e2, this._y = t2;
  }
};
var de = class {
  constructor(e2, t2) {
    this.m_paginator = e2, this.m_bitmap = t2;
  }
  setLabelSet(e2) {
    this.m_labelSet = e2;
  }
  setPageSize(e2, t2, n2) {
    this.m_fPageWidth = e2, this.m_fPageHeight = false === n2 ? this.m_bitmap.naturalWidth * this.m_fPageWidth / this.m_bitmap.naturalHeight : t2;
  }
  getPageSize() {
    return this.m_fPageWidth || (this.m_fPageWidth = 0.5), this.m_fPageHeight || (this.m_fPageHeight = this.m_bitmap.naturalWidth * this.m_fPageWidth / this.m_bitmap.naturalHeight), [this.m_fPageWidth, this.m_fPageHeight];
  }
  setPageType(e2) {
    this.m_nPrintPageType = e2;
  }
  getPageType() {
    return this.m_nPrintPageType;
  }
};
var fe = class {
  constructor(e2, t2, n2, r2, a2, i2, s2) {
    this.m_fPageWidth = e2, this.m_fPageHeight = t2, this.m_fMediaIsDieCut = n2, this.m_fOrientation = r2, this.m_bitmap = a2, this.m_pages = [], this.setPageCount(i2, s2);
  }
  setPageCount(e2, t2) {
    this.m_pageCount = t2 !== r.M511 ? e2 : 1, this.paginateLabels();
  }
  paginateLabels() {
    for (let e2 = 0; e2 < this.m_pageCount; e2++) {
      const e3 = new de(this, this.m_bitmap);
      e3.setLabelSet([0]), e3.setPageSize(this.m_fPageWidth, this.m_fPageHeight, this.m_fMediaIsDieCut), e3.setPageType(1), this.m_pages.push(e3);
    }
  }
  getPage(e2) {
    return this.m_pages[e2];
  }
  getPageSize() {
    return [this.m_fPageWidth, this.m_fPageHeight];
  }
};
var pe = class {
  constructor() {
  }
};
!function(e2) {
  e2[e2.EndOfJob = 0] = "EndOfJob", e2[e2.EndOfLabel = 1] = "EndOfLabel", e2[e2.Never = 2] = "Never", e2[e2.CutAfterRow = 3] = "CutAfterRow", e2[e2.UsePrinterSettings = 4] = "UsePrinterSettings";
}(ae || (ae = {}));
var be = class {
  static sendPrintJobName(e2, t2) {
    e2.push(2, 75, 0, 10);
    let n2 = new TextEncoder().encode(t2);
    return e2.push(...n2), e2.push(13), e2;
  }
  static sendLabelPartName(e2, t2) {
    e2.push(2, 75, 0, 9);
    let n2 = new TextEncoder().encode(t2), r2 = Math.min(n2.length, 10);
    for (let t3 = 0; t3 < r2; t3++) e2.push(n2[t3]);
    return e2.push(13), e2;
  }
  static sendPrintJobNameEnd(e2) {
    return e2.push(2, 75, 0, 11), e2;
  }
  static sendStxM(e2, t2) {
    e2.push(2, 77);
    var n2 = 0;
    return t2 == ae.EndOfLabel ? n2 = 1 : t2 == ae.EndOfJob ? n2 = 0 : t2 == ae.Never && (n2 = 2), e2.push(n2), e2;
  }
  static sendLabelPageSize(e2, t2, n2) {
    e2.push(2, 75, 0, 12);
    var r2 = this.convertNum(4, t2, false, false, true, 10);
    return e2.push(...r2), r2 = this.convertNum(4, n2, false, false, true, 10), e2.push(...r2), e2;
  }
  static sendSTXA(e2) {
    return e2.push(2, 65), e2;
  }
  static sendSTXG(e2) {
    return e2.push(2, 71), e2;
  }
  static sendSTXQ(e2) {
    return e2.push(2, 81), e2;
  }
  static sendSTXa(e2) {
    return e2.push(2, 97), e2;
  }
  static sendSTXD(e2, t2) {
    return e2.push(2, 68, 43, 48, 48, 48, 49), e2;
  }
  static sendSTXC(e2, t2) {
    return e2.push(2, 67, 43, 48, 48, 48, 48 + t2), e2;
  }
  static sendSTXc(e2, t2) {
    e2.push(2, 99);
    let n2 = t2 ? 1 : 0;
    return e2.push(n2), e2;
  }
  static sendSTXI(e2, t2) {
    e2.push(2, 73, 66, 85, 108, 98, 108);
    const n2 = this.convertNum(0, t2, false, false, true, 10);
    return e2.push(...n2), e2.push(13), e2;
  }
  static sendSTXW(e2, t2) {
    let n2;
    return n2 = t2 ? 1 : 0, e2.push(2, 87, n2), e2;
  }
  static sendXCURS(e2, t2) {
    return e2.push(88), e2.push(t2), e2.push(t2 >> 8), e2;
  }
  static sendYCURS(e2, t2) {
    return e2.push(89), e2.push(t2 << 24 >> 24), e2.push(t2 >> 8), e2;
  }
  static sendDotRow(e2, t2, n2, r2) {
    e2.push(-128), e2.push(r2);
    let a2 = t2.slice(n2, n2 + r2);
    e2.push(...a2);
  }
  static sendRleRow(e2, t2) {
    return e2.push(-127), e2.push(t2), e2;
  }
  static sendSTXITerminator(e2) {
    return e2.push(-1, -1, 13), e2;
  }
  static sendLineRepeat(e2, t2) {
    return e2.push(0, 0, -1), e2.push(t2), e2;
  }
  static convertNum(e2, t2, n2, r2, a2, i2) {
    var s2 = 0, o2 = 0, u2 = 0, l2 = 0, d2 = 0, f2 = 0, p2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (a2 && (f2 = 48), s2 = t2, n2 && (t2 < 0 ? (p2[l2++] = 45, s2 = -t2) : p2[l2++] = 43), 0 == e2) if (0 == s2) e2 = 1;
    else for (o2 = s2; 0 != o2; ) e2++, o2 /= i2;
    for (r2 ? d2 = 1 : (l2 += e2 - 1, d2 = -1), u2 = 0; u2 < e2; u2++) {
      var b2 = s2 - Math.floor(s2 / i2) * i2;
      p2[l2] = b2 + f2, l2 += d2, s2 = Math.floor(s2 / i2);
    }
    for (; 0 === p2[p2.length - 1]; ) p2.pop();
    return p2;
  }
};
var he = class {
  constructor() {
    this._numberOfLabelsWritten = false;
  }
  printJobStart(e2, t2, n2, a2) {
    this._printJobOutputStream = e2, this._numberOfLabelsWritten || (this._printJobOutputStream.push(a2.copies, 0, 0, 0), this._numberOfLabelsWritten = true), this._printJobStreamOffset = this._printJobOutputStream.length, this._printJobOutputStream instanceof Int8Array && (this._printJobOutputStream = Array.from(this._printJobOutputStream)), this._printJobOutputStream.push(0, 0, 0, 0, 4, 0, 0, 0), this._pageCount = 0;
    var i2 = "", s2 = t2;
    null != s2 && (i2 = (s2 = s2.includes(" :Y") ? s2.replace(" :Y", "*") : s2.replace(" | ", "*")).split("\\*")[0]);
    const o2 = g().split("-").join("");
    return this._printJobOutputStream = be.sendPrintJobName(this._printJobOutputStream, o2), this._printJobOutputStream = be.sendLabelPartName(this._printJobOutputStream, i2), n2 === r.M511 && (this._printJobOutputStream = be.sendSTXD(this._printJobOutputStream, 1), this._printJobOutputStream = be.sendSTXC(this._printJobOutputStream, a2.copies), this._printJobOutputStream = be.sendSTXc(this._printJobOutputStream, a2.collate)), this._printJobOutputStream.push(2, 112, 43, 48, 48), this._printJobOutputStream.push(2, 111, 43, 48, 48), this._printJobOutputStream.push(2, 79, 43, 48, 48), this._printJobOutputStream.push(2, 98, 43, 48, 48), this._printJobOutputStream;
  }
  printJobEnd(e2) {
    this._printJobOutputStream = be.sendPrintJobNameEnd(e2);
    const t2 = e2.length - this._printJobStreamOffset - 8, n2 = Int8Array.from(this._printJobOutputStream), r2 = new ArrayBuffer(4);
    let a2 = new DataView(r2);
    a2.setUint32(0, t2, true);
    let i2 = new Int8Array(a2.buffer);
    for (let e3 = 0; e3 < i2.length; e3++) n2[this._printJobStreamOffset + e3] = i2[e3];
    return this._printJobOutputStream = n2, this._printJobOutputStream;
  }
  printPageStart(e2, t2, n2, r2, a2, i2, s2, o2, u2, l2) {
    l2 && t2 === ae.EndOfJob && o2 !== u2 && (t2 = ae.Never), e2 instanceof Int8Array && (e2 = Array.from(e2)), this._printJobOutputStream = be.sendStxM(e2, t2);
    const d2 = Math.floor(r2 * i2), f2 = Math.floor(a2 * s2);
    this._printJobOutputStream = be.sendLabelPageSize(e2, d2, f2), n2 && (this._printJobOutputStream = be.sendSTXW(this._printJobOutputStream, true)), this._printJobOutputStream = be.sendSTXA(this._printJobOutputStream), this._printJobOutputStream = be.sendSTXQ(this._printJobOutputStream), this._printJobOutputStream = be.sendSTXa(this._printJobOutputStream), this._printJobOutputStream = be.sendSTXI(this._printJobOutputStream, this._pageCount), this._printJobOutputStream = be.sendXCURS(this._printJobOutputStream, 0), this._printJobOutputStream = be.sendYCURS(this._printJobOutputStream, 0), this._rasterLineCount = 0, this._rasterLineByteOffset = 0;
  }
  printPageEnd(e2, t2) {
    3 != t2.m_nPrintPageType && (be.sendSTXITerminator(e2.printJobOutputStream), be.sendSTXa(e2.printJobOutputStream), be.sendSTXG(e2.printJobOutputStream), be.sendSTXA(e2.printJobOutputStream));
  }
  cutPageStart() {
  }
  cutPageEnd() {
  }
  setPageProcessingStartLocation(e2) {
    180 == e2.rotation && (e2.nPageProcessingStartLoc = 2);
  }
  startRunLengthLine(e2, t2) {
    0 != this._rasterLineByteOffset && (this._rasterLineByteOffset = 0, be.sendXCURS(e2, this._rasterLineByteOffset)), be.sendRleRow(e2, t2), this._rasterLineCount++;
  }
  sendLineRepeat(e2, t2) {
    for (this._rasterLineCount += t2; t2 > 0; ) {
      let n2 = t2;
      n2 > 255 && (n2 = 255), be.sendLineRepeat(e2, n2), t2 -= n2;
    }
  }
  sendEmptyLines(e2, t2) {
    this._rasterLineCount += t2, be.sendYCURS(e2, this._rasterLineCount);
  }
  setRibbonColor(e2, t2, n2, r2, a2) {
    console.log("not yet implemented");
  }
  sendGraphicsLine(e2, t2, n2) {
    let r2 = 0;
    for (; 0 == t2[r2]; ) r2++;
    r2 < 3 && (r2 = 0), this._rasterLineByteOffset != r2 && (this._rasterLineByteOffset = r2, be.sendXCURS(e2, 8 * this._rasterLineByteOffset)), be.sendDotRow(e2, t2, this._rasterLineByteOffset, n2 - this._rasterLineByteOffset), this._rasterLineCount++;
  }
  startGraphicsLine() {
    try {
      throw new TypeError("Invalid Operation Exception (should not call).");
    } catch (e2) {
      console.error(e2);
    }
  }
  useStartGraphicsLine() {
    return false;
  }
};
function Pe(e2, t2) {
  let n2 = new Int8Array([t2, t2 >>> 8, t2 >>> 16, t2 >>> 24]);
  e2.push(...n2);
}
function me(e2, t2) {
  let n2 = new Int8Array([t2, t2 >>> 8]);
  e2.push(...n2);
}
!function(e2) {
  e2[e2.EndOfLabel = 0] = "EndOfLabel", e2[e2.EndOfJob = 1] = "EndOfJob", e2[e2.Never = 2] = "Never", e2[e2.CutAfterIndex = 3] = "CutAfterIndex", e2[e2.PerfEndOfJob = 4] = "PerfEndOfJob", e2[e2.PerfAfterIndex = 5] = "PerfAfterIndex", e2[e2.PerfAndCutAfterIndexes = 6] = "PerfAndCutAfterIndexes";
}(ie || (ie = {}));
var ce = class {
  constructor() {
    this._count = 0;
  }
  printJobStart(e2, t2) {
    this._printJobOutputStream = e2;
    const n2 = new Int8Array([127, 66, 238, 65, 169, 29, 64, 144, 155, 236, 255, 122, 102, 20, 204, 34]);
    this._printJobGuid = g().split("-").join("");
    const r2 = function() {
      const e3 = /* @__PURE__ */ new Date(), t3 = e3.getFullYear(), n3 = e3.getMonth() + 1, r3 = e3.getDate(), a3 = e3.getHours(), i3 = e3.getMinutes(), s3 = e3.getSeconds();
      let o3 = n3 < 10 ? "0" + n3 : "" + n3, u3 = r3 < 10 ? "0" + r3 : "" + r3, l3 = a3 < 10 ? "0" + a3 : "" + a3, d2 = i3 < 10 ? "0" + i3 : "" + i3, f2 = s3 < 10 ? "0" + s3 : "" + s3, p2 = "";
      return o3 = n3 < 10 ? "0" + n3 : "" + n3, u3 = r3 < 10 ? "0" + r3 : "" + r3, l3 = a3 < 10 ? "0" + a3 : "" + a3, d2 = i3 < 10 ? "0" + i3 : "" + i3, f2 = s3 < 10 ? "0" + s3 : "" + s3, p2 = t3 + o3 + u3 + l3 + d2 + f2, p2;
    }();
    let a2 = {
      JobID: this._printJobGuid,
      JobName: "Brady Print Document",
      JobTime: r2,
      NumberOfPages: t2.printOptions.copies,
      SubstratePart: t2.supplyName,
      JobType: "Print",
      JobSource: "Web SDK",
      UserPostPrintOperation: t2.printOptions.getUserPostPrintOperation()
    }, i2 = new TextEncoder().encode(JSON.stringify(a2)), s2 = "";
    for (let e3 = 0; e3 < i2.length; e3++) s2 += i2[e3] + ", ";
    this._printJobOutputStream.push(...n2);
    const o2 = new ArrayBuffer(4);
    let u2 = new DataView(o2);
    u2.setUint32(0, i2.length, true);
    const l2 = new Int8Array(u2.buffer);
    return this._printJobOutputStream.push(...l2), this._printJobOutputStream.push(...i2), this._printJobOutputStream;
  }
  printPageStart(e2, t2, n2) {
    this._pageBmpLayersAdded = 0, this._pageWidth = e2, this._pageHeight = t2;
    let r2 = e2 * n2;
    this._bmpPixelLineByteCount = 4 * Math.floor((r2 + 31) / 32);
    const a2 = new Int8Array([127, 66, 238, 65, 169, 29, 64, 144, 155, 236, 255, 122, 102, 20, 204, 34]);
    this._printJobOutputStream.push(...a2);
  }
  sendEmptyLines(e2, t2) {
    console.log("not yet supported");
  }
  sendLineRepeat(e2, t2) {
    console.log("not yet supported");
  }
  startRunLengthLine(e2, t2) {
    console.log("not yet supported");
  }
  setPageProcessingStartLocation(t2) {
    t2.orientation == e.Landscape && (t2.nPageProcessingStartLoc = 2, this._landscapeIsRotated && (t2.nPageProcessingStartLoc -= 2));
  }
  useStartGraphicsLine() {
    return true;
  }
  sendGraphicsLine(e2, t2, n2) {
    for (let e3 = 0; e3 < n2; e3++) t2[e3] = ~t2[e3];
    this._count += t2.length, e2.push(...t2);
    let r2 = this._bmpPixelLineByteCount - n2;
    if (r2 > 0 && r2 < 4) for (let t3 = 0; t3 < r2; t3++) {
      let t4 = new Int8Array([255]);
      e2.push(...t4);
    }
  }
  sendMonoBitmap(e2, t2) {
    let n2 = function(e3, t3, n3) {
      let r2 = function(e4, t4, n4) {
        let r3 = [];
        return Pe(r3, 40), Pe(r3, t4), Pe(r3, -n4), me(r3, 1), me(r3, 1), Pe(r3, 0), Pe(r3, e4), Pe(r3, 0), Pe(r3, 0), Pe(r3, 0), Pe(r3, 0), r3;
      }(e3.length, t3, n3), a2 = function() {
        let e4 = [];
        return Pe(e4, 0), Pe(e4, 16777215), e4;
      }(), i2 = function(e4, t4, n4) {
        let r3 = [];
        return me(r3, 19778), Pe(r3, 14 + e4.length + t4.length + n4), me(r3, 0), me(r3, 0), Pe(r3, 14 + e4.length + t4.length), r3;
      }(r2, a2, e3.length), s2 = [];
      try {
        s2.push(...i2), s2.push(...r2), s2.push(...a2), e3.unshift(...s2);
      } catch (t4) {
        e3 = [], console.log(t4.name), console.log(t4.message), console.log(t4.stack);
      }
      return e3;
    }(t2, e2.nRasterLinePixelCount, e2.nRasterLineCount);
    if (0 != n2.length) {
      let t3 = new y().compress(new Uint8Array(n2)), r2 = t3.slice(11, t3.length - 4), a2 = window.btoa(String.fromCharCode.apply(null, r2)), i2 = {
        PrintFileName: `Page${e2.currentPage + 1}.prn`,
        JobID: this._printJobGuid,
        PageNumber: parseInt(`${e2.currentPage}`),
        LabelWidth: 1e3 * this._pageWidth,
        LabelHeight: 1e3 * this._pageHeight,
        Pages: {
          Layers: [{
            Bitmap: a2,
            Compression: "lz4"
          }],
          PrePrintOperations: "",
          PostPrintOperations: []
        }
      };
      e2.printOptions.usePrinterSettings ? i2.Pages.PostPrintOperations = [{
        SetByPrinter: "SetByPrinter"
      }] : this.setPostPrintOperations(e2, i2);
      let s2 = new TextEncoder().encode(JSON.stringify(i2));
      const o2 = new ArrayBuffer(4);
      let u2 = new DataView(o2);
      u2.setUint32(0, s2.length, true);
      const l2 = new Int8Array(u2.buffer);
      return this._printJobOutputStream.push(...l2), this._printJobOutputStream.push(...s2), true;
    }
    return false;
  }
  printPageEnd() {
  }
  printJobEnd() {
    return this._printJobOutputStream;
  }
  setPostPrintOperations(e2, t2) {
    this.isShearByOptions(e2) ? t2.Pages.PostPrintOperations = [{
      Cut: "Shear"
    }] : t2.Pages.PostPrintOperations = [{
      Separator: "DrawCutMarks"
    }];
  }
  isShearByOptions(e2) {
    if (e2.printOptions.endOfJobCutOption === ie.Never) return false;
    let t2 = e2.currentPage === e2.printOptions.copies - 1, n2 = e2.printOptions.endOfJobCutOption === ie.EndOfLabel, r2 = e2.printOptions.endOfJobCutOption === ie.EndOfJob && t2, a2 = e2.printOptions.endOfJobCutOption == ie.CutAfterIndex && this.isCutAfterIndexReady(e2) || t2;
    return n2 || r2 || a2;
  }
  isCutAfterIndexReady(e2) {
    return 0 !== e2.printOptions.getPostPrintCutAfterRow() && (e2.currentPage + 1) % e2.printOptions.getPostPrintCutAfterRow() === 0;
  }
};
!function(e2) {
  e2.RLE = "RLE", e2.JSON = "JSON";
}(se || (se = {}));
var Ce = class {
  setPageProcessingStartLocation(t2) {
    t2.orientation == e.Landscape && (t2.nPageProcessingStartLoc = 2);
  }
  printJobStart(e2, t2, n2) {
    let r2;
    const a2 = [27, 88, 0], i2 = [27, 77];
    try {
      t2.push(...a2), t2.push(...i2), r2 = e2.printOptions.cutOption == ae.EndOfLabel ? 1 : e2.printOptions.cutOption == ae.EndOfJob ? 0 : 2, t2.push(r2), r2 = 0, t2.push(r2);
    } catch (e3) {
      throw new Error(e3);
    }
    return t2;
  }
  printPageStart(e2) {
  }
  printPageEnd(e2, t2) {
    if (3 !== e2.m_nPrintPageType) {
      const e3 = [27, 69];
      try {
        t2.push(...e3);
      } catch (e4) {
        throw new Error(e4);
      }
    }
    return t2;
  }
  printJobEnd(e2) {
    const t2 = [27, 68];
    try {
      e2.push(...t2);
    } catch (e3) {
      throw new Error(e3);
    }
    return e2;
  }
  sendEmptyLines(e2, t2) {
    const n2 = new Uint8Array([27, 90]);
    try {
      e2.push(...n2), e2.push(...new Uint8Array([255 & t2, t2 >> 8 & 255]));
    } catch (e3) {
      throw new Error(e3);
    }
  }
  startRunLengthLine(e2, t2) {
    const n2 = new Uint8Array([27, 104]);
    try {
      e2.push(...n2), e2.push(...new Uint8Array([255 & t2, t2 >> 8 & 255]));
    } catch (e3) {
      throw new Error(e3);
    }
  }
  startGraphicsLine(e2, t2) {
    const n2 = new Uint8Array([27, 103]);
    try {
      e2.push(...n2), e2.push(...new Uint8Array([255 & t2, t2 >> 8 & 255]));
    } catch (e3) {
      throw new Error(e3);
    }
  }
  sendGraphicsLine(e2, t2, n2) {
  }
  sendLineRepeat(e2, t2) {
  }
  printerLanguageImageTypeSupported() {
    return se.RLE;
  }
  setRibbonColor(e2, t2, n2, r2, a2) {
  }
  cutPageStart(e2) {
  }
  cutPageEnd(e2) {
  }
  cutPath(e2, t2, n2, r2) {
  }
  sendMonoBitmap(e2, t2, n2) {
  }
  supportsLineRepeat() {
    return false;
  }
  useStartGraphicsLine() {
    return true;
  }
};
var Ie = class {
  constructor(e2, t2, n2, a2) {
    this.renderData = e2, this.m_nPrinterColor = t2, this.m_nRasterLinePixelCount = n2, this.m_bOverPrint = a2, this.m_nDrawingColors = [], this.m_idxBeginFill = 0, this.m_mskBeginFill = 0, this.m_nEmptyLineCount = 0, this.m_cWritten = 0, this.m_cFirstWritten = 0, this.m_bWrittenMask = 0, this.m_nRasterLineCount = 0, this.m_panelHasWrittenPixel = false, this.m_cProcessColorPanels = null, this.m_nRasterLineByteCount = Math.floor((this.m_nRasterLinePixelCount + 7) / 8), this.m_rasterLineData = new Int8Array(this.m_nRasterLineByteCount).fill(0), this.m_pRepeatLine = null, this.m_nRepeatLineByteCount = 0, this.m_nRepeatLineCount = 0, this.m_plImageType = e2.printerModel !== r.M611 && e2.printerModel !== r.S3700 && e2.printerModel !== r.i7500 ? se.RLE : se.JSON, this.m_PrintJobOutputStream = [];
  }
  setPixel(e2, t2) {
    0 === this.m_cWritten && (this.m_cFirstWritten = e2);
    let n2 = this.m_rasterLineData[e2], r2 = t2;
    r2 &= 255, n2 &= 255;
    let a2 = n2 |= r2;
    this.m_rasterLineData[e2] = 255 & a2, this.m_cWritten = e2 + 1, this.m_bWrittenMask = t2;
  }
  nextLine(e2, t2, n2) {
    if (0 != this.m_cWritten && (this.m_panelHasWrittenPixel = true), this.m_plImageType == se.RLE) {
      if (0 != this.m_cWritten) {
        if (0 != this.m_nEmptyLineCount && this.sendEmptyLines(e2), this.m_rasterLineData = new Int8Array(this.m_rasterLineData), !this.checkForLineRepeat(e2, this.m_rasterLineData, this.m_cWritten)) for (let t3 = 0; t3 < n2; t3++) this.compressAddLine(e2, this.m_rasterLineData, this.m_cWritten);
        for (let e3 = 0; e3 < this.m_nRasterLineByteCount; e3++) this.m_rasterLineData[e3] = 0;
        this.m_cWritten = 0, this.m_cFirstWritten = 0;
      } else this.sendLineRepeat(e2, true), this.m_nEmptyLineCount += n2;
    } else e2.plGenerator.sendGraphicsLine(this.m_PrintJobOutputStream, this.m_rasterLineData, this.m_nRasterLineByteCount), this.m_rasterLineData.fill(0, 0, this.m_nRasterLineByteCount), this.m_cWritten = 0, this.m_cFirstWritten = 0;
    this.m_idxBeginFill = 0, this.m_mskBeginFill = 0, this.m_nRasterLineCount += n2;
  }
  sendEmptyLines(e2) {
    this.sendLineRepeat(e2, true), this.renderData.plGenerator.sendEmptyLines(this.m_PrintJobOutputStream, this.m_nEmptyLineCount), this.m_nEmptyLineCount = 0;
  }
  sendLineRepeat(e2, t2) {
    let n2 = this.m_nRepeatLineByteCount;
    if (this.m_nRepeatLineCount > 0 && (e2.plGenerator.sendLineRepeat(this.m_PrintJobOutputStream, this.m_nRepeatLineCount), this.m_nRepeatLineCount = 0, this.m_nRepeatLineByteCount = 0), t2) for (let e3 = 0; e3 < n2; e3++) this.m_pRepeatLine[e3] = 0;
  }
  checkForLineRepeat(e2, t2, n2) {
    let r2 = true;
    if (null != this.m_pRepeatLine) {
      if (n2 == this.m_nRepeatLineByteCount) {
        r2 = false;
        let e3 = n2;
        for (; --e3 >= 0 && !r2; ) this.m_pRepeatLine[e3] != t2[e3] && (r2 = true);
      }
      if (r2) {
        this.sendLineRepeat(e2, false), this.m_nRepeatLineByteCount = n2;
        for (let e3 = 0; e3 < this.m_nRepeatLineByteCount; e3++) this.m_pRepeatLine[e3] = t2[e3];
      } else this.m_nRepeatLineCount++;
    }
    return !r2;
  }
  wasPanelWrittenIn() {
    let e2 = false;
    return e2 = this.m_plImageType == se.RLE && 0 != this.m_PrintJobOutputStream.length || this.m_panelHasWrittenPixel, e2;
  }
  spoolPanel(e2, t2, n2, r2, a2, i2, s2) {
    let o2 = false;
    if (this.m_nEmptyLineCount_When_SpoolPanel = this.m_nEmptyLineCount, a2) return this.m_nEmptyLineCount = 0, this.m_nRasterLineCount = 0, this.m_nRepeatLineCount = 0, this.m_panelHasWrittenPixel = false, s2;
    let u2 = this.wasPanelWrittenIn();
    if (this.m_plImageType != se.JSON && !u2) {
      if (!i2 || 0 == this.m_nEmptyLineCount || s2) return this.m_nEmptyLineCount = 0, this.m_nRasterLineCount = 0, s2;
      s2 = true;
    }
    this.sendLineRepeat(e2, true), 0 != this.m_nEmptyLineCount && this.sendEmptyLines(e2);
    let l2 = true;
    return 0 != this.m_PrintJobOutputStream.length && (t2 || !u2 ? this.m_plImageType == se.JSON ? (l2 = this.renderData.plGenerator.sendMonoBitmap(e2, this.m_PrintJobOutputStream), o2 = true) : o2 = this.sendRasterData(e2) : this.m_plImageType == se.JSON ? (l2 = this.renderData.plGenerator.sendMonoBitmap(e2, this.m_PrintJobOutputStream), o2 = true) : ((e2.plGenerator instanceof he || e2.plGenerator instanceof Ce) && e2.plGenerator.setRibbonColor(e2.printJobOutputStream, this.m_bOverPrint, n2, r2, this.m_nPrinterColor), o2 = this.sendRasterData(e2))), this.m_nRasterLineCount = 0, this.m_panelHasWrittenPixel = false, {
      first: o2,
      second: s2,
      third: l2
    };
  }
  startRunLengthLine(e2, t2) {
    e2.plGenerator.startRunLengthLine(this.m_PrintJobOutputStream, t2);
  }
  compressAddLine(e2, t2, n2) {
    this.compressLine(e2, t2, n2) || this.sendGraphicsLine(e2, t2, n2);
  }
  sendGraphicsLine(e2, t2, n2) {
    if (this.m_plImageType == se.RLE) {
      if (e2.plGenerator.useStartGraphicsLine()) {
        e2.plGenerator instanceof he ? e2.plGenerator.startGraphicsLine() : e2.plGenerator instanceof Ce && e2.plGenerator.startGraphicsLine(this.m_PrintJobOutputStream, n2);
        let r2 = n2 - 1;
        for (; r2 >= 0 && 0 === t2[r2]; ) r2--;
        this.m_PrintJobOutputStream.push(...t2.slice(0, r2 + 1));
      } else e2.plGenerator.sendGraphicsLine(this.m_PrintJobOutputStream, t2, n2);
    } else this.m_plImageType == se.JSON && e2.plGenerator.sendGraphicsLine(this.m_PrintJobOutputStream, t2, n2);
  }
  isOverPrint() {
    return this.m_bOverPrint;
  }
  compressLine(e2, t2, n2) {
    let r2, a2 = [], i2 = 0, s2 = 0, o2 = 0, u2 = 0, l2 = 0;
    r2 = 0;
    let d2 = 0, f2 = 0, p2 = 0;
    for (a2 = new Array(1536).fill(null), i2 = n2; n2 > 0; n2--, d2++) if (0 != (f2 = t2[d2] ^ l2)) {
      if (128 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 64 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 32 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 16 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 8 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 4 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 2 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, 1 & f2 && (a2[s2++] = p2 | 32768 & l2, p2 = 0, l2 = ~l2, f2 = ~f2), p2++, s2 >= i2) return false;
    } else p2 += 8;
    if (32768 & l2 && (a2[s2++] = p2 | 32768 & l2), s2 >= i2) return false;
    for (u2 = s2, s2 = 0, i2 = 0; s2 < u2; s2++) i2 = i2 + ((32767 & a2[s2]) - 1 >> 7) + 1;
    for (this.startRunLengthLine(e2, i2), s2 = 0; s2 < u2; s2++) for (o2 = 32767 & a2[s2], l2 = (32768 & a2[s2]) >> 8; 0 != o2; o2 -= i2 + 1) {
      i2 = o2 - 1, i2 > 127 && (i2 = 127), r2 = i2 | l2, r2 = new Int8Array([r2]);
      try {
        this.m_PrintJobOutputStream.push(r2[0]);
      } catch (e3) {
        console.log(e3);
      }
    }
    return true;
  }
  sendRasterData(e2) {
    let t2 = true;
    try {
      e2.printJobOutputStream.push(...this.m_PrintJobOutputStream);
    } catch (e3) {
      t2 = false;
    }
    return t2;
  }
};
var Se = class {
  constructor() {
    this.copyPixel_srcRect = new ye();
  }
};
var ye = class {
  constructor() {
  }
};
var ge = function(e2, t2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(a2, i2) {
    function s2(e3) {
      try {
        u2(r2.next(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function o2(e3) {
      try {
        u2(r2.throw(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function u2(e3) {
      var t3;
      e3.done ? a2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
        e4(t3);
      })).then(s2, o2);
    }
    u2((r2 = r2.apply(e2, t2 || [])).next());
  });
};
var Te = class {
  constructor(e2, t2, n2, a2, i2, s2, o2, u2, l2, d2, f2) {
    this.bitmap = e2, this.printerModel = t2, this.supplyName = n2, this.supplyWidth = a2, this.supplyHeight = i2, this.mediaIsDieCut = s2, this.rotation = o2, this.orientation = u2, this.leftOffset = l2, this.verticalOffset = d2, this.truePrintableWidth = this.supplyWidth, this.truePrintableHeight = this.supplyHeight, this.printOptions = f2, this.nonContinuousOffsetX = 0, this.nonContinuousOffsetY = 0, this.paginator = new fe(this.supplyWidth, this.supplyHeight, this.mediaIsDieCut, this.orientation, this.bitmap, this.printOptions.copies, this.printerModel), this.printerModel == r.M211 ? (this.xUPI = 203, this.yUPI = 203, this.printTrailer = true, this.nPageProcessingStartLoc = 0, this.sendOnePageAtATime = true, this.truePrintableWidth = 0.63, this.nonContinuousOffsetX = 0.04, this.nonContinuousOffsetY = 0.04, this.locationOfFirstDotFromDatumEdge = 0.04) : (this.xUPI = 300, this.yUPI = 300, this.printTrailer = false, this.nPageProcessingStartLoc = 0), this.bPrintEmptyPages = false;
  }
  setUpThePrintJob() {
    return ge(this, void 0, void 0, function* () {
      let e2;
      if (e2 = [], null != this.printerModel) {
        if (this.printerModel == r.M211 || this.printerModel == r.M511 ? this.plGenerator = new he() : this.printerModel == r.M611 || this.printerModel == r.S3700 || this.printerModel == r.i7500 ? (this.plGenerator = new ce(), this.printerModel == r.S3700 || this.printerModel == r.i7500 ? this.plGenerator._landscapeIsRotated = true : this.plGenerator._landscapeIsRotated = false) : this.printerModel != r.M610 && this.printerModel != r.M710 || (this.plGenerator = new Ce()), this.plGenerator instanceof he ? this.printJobOutputStream = this.plGenerator.printJobStart(e2, this.supplyName, this.printerModel, this.printOptions) : this.plGenerator instanceof ce ? this.printJobOutputStream = this.plGenerator.printJobStart(e2, this) : this.plGenerator instanceof Ce && (this.printJobOutputStream = this.plGenerator.printJobStart(this, e2)), this.printOptions.cutOption == ae.EndOfLabel) {
          if (!(yield this.processThePrintPages(3, this.printJobOutputStream))) return null;
        } else if (!(yield this.processThePrintPages(1, this.printJobOutputStream))) return null;
        return e2 = this.printJobOutputStream, this.plGenerator instanceof he ? this.printJobOutputStream = this.plGenerator.printJobEnd(e2) : this.plGenerator instanceof ce ? this.printJobOutputStream = this.plGenerator.printJobEnd() : this.plGenerator instanceof Ce && (this.printJobOutputStream = this.plGenerator.printJobEnd(e2)), this.printJobOutputStream;
      }
      return null;
    });
  }
  processThePrintPages(e2, t2) {
    return ge(this, void 0, void 0, function* () {
      let n2 = true;
      const a2 = this.buildPrintPages();
      let i2 = 0;
      for (; i2 < a2.length && n2; ) {
        this.currentPage = i2, i2 > 0 && this.printerModel === r.M211 && (t2 = this.printJobOutputStream, this.printJobOutputStream = this.plGenerator.printJobEnd(t2), t2 = this.printJobOutputStream, this.printJobOutputStream = this.plGenerator.printJobStart(t2, this.supplyName, this.printerModel, this.printOptions));
        let s2 = a2[i2];
        this.plGenerator.setPageProcessingStartLocation(this), 0 != s2.m_nPrintPageType && 1 != s2.m_nPrintPageType && 3 != s2.m_nPrintPageType || 1 != e2 && 3 != e2 || (this.plGenerator instanceof he ? this.plGenerator.printPageStart(this.printJobOutputStream, this.printOptions.cutOption, this.printTrailer, s2.m_OverallPageWidth, s2.m_OverallPageHeight, this.xUPI, this.yUPI, this.printOptions.copies, i2 + 1, this.sendOnePageAtATime) : this.plGenerator instanceof ce && this.plGenerator.printPageStart(this.supplyWidth, this.supplyHeight, this.xUPI), n2 = yield this.printThePage(s2), i2++, 1 == s2.m_nPrintPageType && (this.plGenerator instanceof he ? this.plGenerator.printPageEnd(this, s2) : this.plGenerator instanceof ce ? this.plGenerator.printPageEnd() : this.plGenerator instanceof Ce && this.plGenerator.printPageEnd(s2, t2)));
      }
      return n2;
    });
  }
  printThePage(e2) {
    return ge(this, void 0, void 0, function* () {
      this.printerModel == r.M211 && this.adjustLabelPosition(e2), this.nRasterLinePixelCount = Math.floor(e2.m_OverallPageWidth * this.xUPI), this.nRasterLineByteCount = 4 * this.nRasterLinePixelCount, this.nRasterLineCount = Math.floor(e2.m_OverallPageHeight * this.yUPI), this.setupBanding().then((e3) => {
        this.uncompressedImageData = e3, console.log("Drawing Target Bitmap...");
      }), yield this.sleep(2e3), this.loadColorPanels();
      const t2 = new Se();
      return this.setPrintProcessControlVars(t2), yield this.printMonoOrSpotColorPage(t2), yield this.sendThePrintPage();
    });
  }
  sleep(e2) {
    return ge(this, void 0, void 0, function* () {
      return new Promise((t2) => setTimeout(t2, e2));
    });
  }
  sendThePrintPage() {
    return ge(this, void 0, void 0, function* () {
      let e2, t2 = true, n2 = false, r2 = false, a2 = false;
      if (e2 = this.shouldEmptyColorPanelBeSent(), this.m_cColorPanels[0].m_cProcessColorPanels, t2 && null != this.m_cColorPanels) {
        let i2, s2 = true, o2 = [];
        o2 = null;
        let u2 = this.getColorPanelOrder(o2), l2 = u2.first;
        if (o2 = u2.second, l2) {
          let u3 = o2.length;
          for (let l3 = 0; l3 < u3; l3++) if (i2 = o2[l3], !this.m_cColorPanels[i2].isOverPrint()) {
            let o3 = this.m_cColorPanels[i2].spoolPanel(this, s2, 1, n2, r2, e2, a2);
            if (a2 = o3.second, 0 == o3.first || 0 == o3.third) {
              t2 = false;
              break;
            }
          }
          for (let l3 = 0; l3 < u3; l3++) if (i2 = o2[l3], this.m_cColorPanels[i2].isOverPrint()) {
            r2 = false;
            let o3 = this.m_cColorPanels[i2].spoolPanel(this, s2, 1, n2, r2, e2, a2);
            if (a2 = o3.second, 0 == o3.first) {
              t2 = false;
              break;
            }
          }
        } else t2 = false;
      }
      return t2;
    });
  }
  getColorPanelOrder(e2) {
    let t2 = this.m_cColorPanels.length;
    e2 = new Array(t2);
    for (let n2 = 0; n2 < t2; n2++) e2[n2] = n2;
    return {
      first: true,
      second: e2
    };
  }
  shouldEmptyColorPanelBeSent() {
    let e2;
    if (e2 = this.m_cColorPanels[0].renderData.bPrintEmptyPages, e2) {
      null != this.m_cColorPanels && (this.m_cColorPanels[0].wasPanelWrittenIn() || this.m_cColorPanels[1].wasPanelWrittenIn() || this.m_cColorPanels[2].wasPanelWrittenIn()) && (e2 = false);
      let t2 = 0;
      for (; t2 < this.m_cColorPanels.length && e2; ) this.m_cColorPanels[t2].wasPanelWrittenIn() && (e2 = false), t2++;
    }
    return e2;
  }
  setupBanding() {
    return ge(this, void 0, void 0, function* () {
      return new Promise((t2, n2) => ge(this, void 0, void 0, function* () {
        const r2 = new Image();
        r2.crossOrigin = "", r2.src = this.bitmap.src, r2.onload = () => {
          let n3 = document.createElement("canvas");
          const a2 = n3.getContext("2d");
          let i2, s2;
          this.leftOffsetPixels = Math.floor(this.leftOffset * this.xUPI + this.nonContinuousOffsetX * this.xUPI), this.verticalOffsetPixels = Math.floor(this.verticalOffset * this.yUPI + this.nonContinuousOffsetY * this.yUPI);
          let o2 = this.nRasterLinePixelCount, u2 = this.nRasterLineCount;
          if (this.orientation !== e.Landscape) {
            const e2 = o2;
            o2 = u2, u2 = e2, i2 = Math.floor(this.truePrintableWidth * this.xUPI), s2 = Math.floor(this.truePrintableHeight * this.yUPI);
          } else i2 = Math.floor(this.truePrintableHeight * this.yUPI), s2 = Math.floor(this.truePrintableWidth * this.xUPI);
          if (false !== this.mediaIsDieCut) {
            let e2 = i2 / this.bitmap.naturalWidth, t3 = s2 / this.bitmap.naturalHeight, l3 = Math.min(e2, t3);
            n3.width = u2, n3.height = o2, a2.fillStyle = "white";
            let d3 = this.leftOffsetPixels, f3 = this.verticalOffsetPixels;
            this.leftOffsetPixels < 0 && (d3 = -1 * this.leftOffsetPixels), this.verticalOffsetPixels < 0 && (f3 = -1 * this.verticalOffsetPixels), a2.fillRect(0, 0, u2 + d3, o2 + f3), a2.drawImage(r2, 0, 0, this.bitmap.naturalWidth, this.bitmap.naturalHeight, this.leftOffsetPixels, this.verticalOffsetPixels, this.bitmap.naturalWidth * l3, this.bitmap.naturalHeight * l3);
          } else n3.width = u2, n3.height = o2, a2.fillStyle = "white", a2.fillRect(0, 0, u2, o2), a2.drawImage(r2, 0, 0, u2, o2);
          let l2 = a2.getImageData(0, 0, u2, o2);
          const d2 = l2.data;
          for (let e2 = 0; e2 < d2.length; e2 += 4) {
            const t3 = 0.3 * d2[e2] + 0.59 * d2[e2 + 1] + 0.11 * d2[e2 + 2] > 128 ? 255 : 0;
            d2[e2] = t3, d2[e2 + 1] = t3, d2[e2 + 2] = t3;
          }
          a2.putImageData(l2, 0, 0);
          const f2 = new Int32Array(l2.data.buffer);
          t2(f2);
        }, r2.onerror = (e2) => n2(e2);
      }));
    });
  }
  adjustLabelPosition(t2) {
    let n2 = false, r2 = Math.min(t2.m_OverallPageWidth, this.truePrintableWidth);
    this.leftOffset += t2.m_OverallPageWidth - r2, n2 = this.leftOffset > 0, this.truePrintableWidth = r2, true !== this.mediaIsDieCut ? this.orientation === e.Portrait ? (0 === this.leftOffset && (this.truePrintableWidth -= this.locationOfFirstDotFromDatumEdge), this.leftOffset = 0) : 0 === this.leftOffset && (this.leftOffset = this.locationOfFirstDotFromDatumEdge, this.truePrintableWidth -= this.leftOffset) : this.nonContinuousOffsetX > 0 && (this.orientation === e.Portrait ? 0 === this.leftOffset ? (this.leftOffset = this.nonContinuousOffsetX, this.truePrintableWidth -= this.leftOffset) : n2 && (this.leftOffset = 0) : 0 === this.leftOffset && (this.truePrintableWidth -= this.nonContinuousOffsetX)), 0 === this.verticalOffset && (this.verticalOffset = this.nonContinuousOffsetY, this.truePrintableHeight -= this.verticalOffset);
  }
  getImgBlob() {
    return ge(this, void 0, void 0, function* () {
      const e2 = yield fetch(this.bitmap.src);
      return e2.ok ? e2.blob() : Promise.reject(e2.status);
    });
  }
  loadColorPanels() {
    this.m_cColorPanels = [new Ie(this, 0, this.nRasterLinePixelCount, false)];
  }
  setPrintProcessControlVars(t2) {
    this.orientation === e.Landscape ? (t2.copyPixel_srcRect.Y = 0, t2.copyPixel_srcRect.Width = 1, t2.copyPixel_srcRect.Height = this.nRasterLinePixelCount, t2.copyPixel_yInc = 0, t2.copyPixel_stride = 4, t2.xNextPixelInc = 0, t2.yNextLineInc = 0, 0 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.X = 0, t2.copyPixel_xInc = 1, t2.nSrcIndexStart = this.nRasterLinePixelCount - 1, t2.nSrcIndexAdvance = -1, t2.xStartLoc = 0, t2.yStartLoc = this.nRasterLinePixelCount - 1, t2.yNextPixelInc = -1, t2.xNextLineInc = 1) : 1 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.X = 0, t2.copyPixel_xInc = 1, t2.nSrcIndexStart = 0, t2.nSrcIndexAdvance = 1, t2.xStartLoc = 0, t2.yStartLoc = 0, t2.yNextPixelInc = 1, t2.xNextLineInc = 1) : 2 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.X = this.nRasterLineCount - 1, t2.copyPixel_xInc = -1, t2.nSrcIndexStart = 0, t2.nSrcIndexAdvance = 1, t2.xStartLoc = this.nRasterLineCount - 1, t2.yStartLoc = 0, t2.yNextPixelInc = 1, t2.xNextLineInc = -1) : (t2.copyPixel_srcRect.X = this.nRasterLineCount - 1, t2.copyPixel_xInc = -1, t2.nSrcIndexStart = this.nRasterLinePixelCount - 1, t2.nSrcIndexAdvance = -1, t2.xStartLoc = this.nRasterLineCount - 1, t2.yStartLoc = this.nRasterLinePixelCount - 1, t2.yNextPixelInc = -1, t2.xNextLineInc = -1)) : (t2.copyPixel_srcRect.X = 0, t2.copyPixel_srcRect.Width = this.nRasterLinePixelCount, t2.copyPixel_srcRect.Height = 1, t2.copyPixel_xInc = 0, t2.copyPixel_stride = this.nRasterLineByteCount, t2.yNextPixelInc = 0, t2.xNextLineInc = 0, 0 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.Y = 0, t2.copyPixel_yInc = 1, t2.nSrcIndexStart = 0, t2.nSrcIndexAdvance = 1, t2.xStartLoc = 0, t2.yStartLoc = 0, t2.xNextPixelInc = 1, t2.yNextLineInc = 1) : 1 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.Y = 0, t2.copyPixel_yInc = 1, t2.nSrcIndexStart = this.nRasterLinePixelCount - 1, t2.nSrcIndexAdvance = -1, t2.xStartLoc = this.nRasterLinePixelCount - 1, t2.yStartLoc = 0, t2.xNextPixelInc = -1, t2.yNextLineInc = 1) : 2 == this.nPageProcessingStartLoc ? (t2.copyPixel_srcRect.Y = this.nRasterLineCount - 1, t2.copyPixel_yInc = -1, t2.nSrcIndexStart = this.nRasterLinePixelCount - 1, t2.nSrcIndexAdvance = -1, t2.xStartLoc = this.nRasterLinePixelCount - 1, t2.yStartLoc = this.nRasterLineCount - 1, t2.xNextPixelInc = -1, t2.yNextLineInc = -1) : (t2.copyPixel_srcRect.Y = this.nRasterLineCount - 1, t2.copyPixel_yInc = -1, t2.nSrcIndexStart = 0, t2.nSrcIndexAdvance = 1, t2.xStartLoc = 0, t2.yStartLoc = this.nRasterLineCount - 1, t2.xNextPixelInc = 1, t2.yNextLineInc = -1));
  }
  printMonoOrSpotColorPage(t2) {
    return ge(this, void 0, void 0, function* () {
      let n2, r2 = 1;
      0 == this.nPageProcessingStartLoc || 1 == this.nPageProcessingStartLoc ? (this.nCurrentBand = 1, r2 = 1) : (this.nCurrentBand = 1, r2 = -1);
      const a2 = this.uncompressedImageData, i2 = this.m_cColorPanels[0];
      let s2 = 0, o2 = 0, u2 = this.orientation === e.Landscape ? this.nRasterLineCount : this.nRasterLinePixelCount, l2 = t2.xStartLoc, d2 = t2.yStartLoc;
      for (let e2 = 0; e2 < this.nRasterLineCount; e2++) {
        s2 = 0, o2 = -128, n2 = 1 * (l2 + d2 * u2);
        for (let e3 = 0; e3 < this.nRasterLinePixelCount; e3++) {
          let e4 = 0;
          e4 = a2[n2], -1 != e4 && i2.setPixel(s2, o2), o2 = (255 & o2) >>> 1, 0 == o2 && (o2 = -128, s2 += 1), n2 += 1 * (t2.xNextPixelInc + t2.yNextPixelInc * u2);
        }
        i2.nextLine(this, this.nRasterLinePixelCount, 1), l2 += t2.xNextLineInc, d2 += t2.yNextLineInc;
      }
      return i2.m_PrintJobOutputStream;
    });
  }
  buildPrintPages() {
    const e2 = [];
    let t2 = 0, n2 = new le(0, 0), r2 = 0, a2 = 0;
    for (; t2 < this.paginator.m_pageCount; ) {
      let i2 = this.paginator.getPage(t2);
      t2++;
      let s2 = new pe();
      s2.m_DirectPageContentList = [], s2.m_PageLocation = [], s2.m_DirectPageContentList.push(i2), s2.m_PageLocation.push(n2);
      let [o2, u2] = i2.getPageSize();
      r2 = o2, a2 = u2, s2.m_OverallPageWidth = r2, s2.m_OverallPageHeight = a2, s2.m_nPrintPageType = i2.getPageType(), e2.push(s2);
    }
    return e2;
  }
  detectOS() {
    return -1 != window.navigator.userAgent.indexOf("Windows NT 10.0") ? "Windows 10" : -1 != window.navigator.userAgent.indexOf("Windows NT 6.3") ? "Windows 8.1" : -1 != window.navigator.userAgent.indexOf("Windows NT 6.2") ? "Windows 8" : -1 != window.navigator.userAgent.indexOf("Windows NT 6.1") ? "Windows 7" : -1 != window.navigator.userAgent.indexOf("Windows NT 6.0") ? "Windows Vista" : -1 != window.navigator.userAgent.indexOf("Windows NT 5.1") ? "Windows XP" : -1 != window.navigator.userAgent.indexOf("Windows NT 5.0") ? "Windows 2000" : -1 != window.navigator.userAgent.indexOf("Mac") ? "Mac/iOS" : -1 != window.navigator.userAgent.indexOf("X11") ? "UNIX" : -1 != window.navigator.userAgent.indexOf("Linux") ? "Linux" : void 0;
  }
  detectBrowser() {
    let e2, t2 = navigator.userAgent, n2 = "Unknown Browser", r2 = "Unknown Version";
    const a2 = [{
      name: "Mozilla Firefox",
      pattern: /Firefox\/([0-9.]+)/
    }, {
      name: "Samsung Internet",
      pattern: /SamsungBrowser\/([0-9.]+)/
    }, {
      name: "Opera",
      pattern: /OPR\/([0-9.]+)|Opera\/([0-9.]+)/
    }, {
      name: "Microsoft Internet Explorer",
      pattern: /Trident\/.*rv:([0-9.]+)/
    }, {
      name: "Microsoft Edge",
      pattern: /Edge\/([0-9.]+)|Edg\/([0-9.]+)/
    }, {
      name: "Google Chrome",
      pattern: /Chrome\/([0-9.]+)/
    }, {
      name: "Apple Safari",
      pattern: /Version\/([0-9.]+).*Safari/
    }];
    for (let i2 = 0; i2 < a2.length; i2++) {
      let s2 = a2[i2];
      if (e2 = t2.match(s2.pattern)) {
        n2 = s2.name, r2 = e2[1] || e2[2];
        break;
      }
    }
    return n2 + " " + r2;
  }
  detectIP() {
    return ge(this, void 0, void 0, function* () {
      return fetch("https://api.ipify.org?format=json").then((e2) => e2.json()).then((e2) => e2.ip).catch((e2) => console.error("Error fetching IP address:", e2));
    });
  }
};
var De = class {
  constructor(e2, t2) {
    if (t2 !== r.M611 && t2 !== r.M610 && t2 !== r.M710 && t2 !== r.S3700 && t2 !== r.i7500) {
      let t3 = new Int8Array(e2.slice(0, 4)), n2 = new DataView(t3.buffer);
      this.numberOfPrintJobs = n2.getInt8(0), this.printJob = e2.slice(4, e2.length);
    } else this.numberOfPrintJobs = 1, this.printJob = e2;
  }
  print() {
    const e2 = [];
    for (; this.printJob.length; ) {
      var t2 = new Int8Array(this.printJob.slice(0, 4));
      let s2 = new DataView(new ArrayBuffer(t2.length));
      for (let e3 = 0; e3 < t2.length; e3++) s2.setUint8(e3, t2[e3]);
      const o2 = s2.getInt32(0, true);
      var n2 = this.printJob.slice(4, o2 + 8), r2 = new Int8Array(n2.slice(0, 4));
      const u2 = new DataView(r2.buffer).getInt8(0);
      var a2 = n2.slice(4, n2.length), i2 = new Int8Array(a2.slice(u2, u2 + 32));
      const l2 = new TextDecoder("utf-8").decode(i2);
      if (e2.push({
        documentName: l2,
        printJob: a2
      }), o2 === this.printJob.length - 8) {
        this.printJob = new Int8Array(0);
        break;
      }
      this.printJob = this.printJob.slice(o2 + 8, this.printJob.length);
    }
    return e2;
  }
  printMultiple() {
    var e2 = new Int8Array(this.printJob.slice(0, 4));
    new DataView(e2.buffer).getInt8(0);
    var t2 = this.printJob.slice(4, this.printJob.length), n2 = new Int8Array(t2.slice(0, 4));
    const r2 = new DataView(n2.buffer).getInt8(0);
    var a2 = t2.slice(4, t2.length), i2 = new Int8Array(a2.slice(r2, r2 + 32));
    return new TextDecoder("utf-8").decode(i2), a2;
  }
};
var Re = class {
  constructor() {
    this.copies = 1, this.collate = false, this.cutOption = ae.EndOfJob, this.usePrinterSettings = false;
  }
  getUsePrinterSettings() {
    return this.usePrinterSettings;
  }
  setUsePrinterSettings(e2) {
    this.usePrinterSettings = e2;
  }
  getPostPrintCutAfterRow() {
    return this.cutAfterRow;
  }
  getUserPostPrintOperation() {
    return this.usePrinterSettings ? "SetByPrinter" : this.endOfJobCutOption === ie.CutAfterIndex ? `Cut;4;${this.cutAfterRow}` : `Cut;${this.endOfJobCutOption}`;
  }
  setPostPrintCutAfterRow(e2) {
    this.cutAfterRow = e2;
  }
  getEndOfJobCutOption() {
    return this.endOfJobCutOption;
  }
  setEndOfJobCutOption(e2) {
    this.endOfJobCutOption = e2;
  }
};
var Ne = function(e2) {
  const t2 = [];
  let n2 = 0;
  for (let r2 = 0; r2 < e2.length; r2++) {
    let a2 = e2.charCodeAt(r2);
    a2 < 128 ? t2[n2++] = a2 : a2 < 2048 ? (t2[n2++] = a2 >> 6 | 192, t2[n2++] = 63 & a2 | 128) : 55296 == (64512 & a2) && r2 + 1 < e2.length && 56320 == (64512 & e2.charCodeAt(r2 + 1)) ? (a2 = 65536 + ((1023 & a2) << 10) + (1023 & e2.charCodeAt(++r2)), t2[n2++] = a2 >> 18 | 240, t2[n2++] = a2 >> 12 & 63 | 128, t2[n2++] = a2 >> 6 & 63 | 128, t2[n2++] = 63 & a2 | 128) : (t2[n2++] = a2 >> 12 | 224, t2[n2++] = a2 >> 6 & 63 | 128, t2[n2++] = 63 & a2 | 128);
  }
  return t2;
};
var Me = {
  byteToCharMap_: null,
  charToByteMap_: null,
  byteToCharMapWebSafe_: null,
  charToByteMapWebSafe_: null,
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  HAS_NATIVE_SUPPORT: "function" == typeof atob,
  encodeByteArray(e2, t2) {
    if (!Array.isArray(e2)) throw Error("encodeByteArray takes an array as a parameter");
    this.init_();
    const n2 = t2 ? this.byteToCharMapWebSafe_ : this.byteToCharMap_, r2 = [];
    for (let t3 = 0; t3 < e2.length; t3 += 3) {
      const a2 = e2[t3], i2 = t3 + 1 < e2.length, s2 = i2 ? e2[t3 + 1] : 0, o2 = t3 + 2 < e2.length, u2 = o2 ? e2[t3 + 2] : 0, l2 = a2 >> 2, d2 = (3 & a2) << 4 | s2 >> 4;
      let f2 = (15 & s2) << 2 | u2 >> 6, p2 = 63 & u2;
      o2 || (p2 = 64, i2 || (f2 = 64)), r2.push(n2[l2], n2[d2], n2[f2], n2[p2]);
    }
    return r2.join("");
  },
  encodeString(e2, t2) {
    return this.HAS_NATIVE_SUPPORT && !t2 ? btoa(e2) : this.encodeByteArray(Ne(e2), t2);
  },
  decodeString(e2, t2) {
    return this.HAS_NATIVE_SUPPORT && !t2 ? atob(e2) : function(e3) {
      const t3 = [];
      let n2 = 0, r2 = 0;
      for (; n2 < e3.length; ) {
        const a2 = e3[n2++];
        if (a2 < 128) t3[r2++] = String.fromCharCode(a2);
        else if (a2 > 191 && a2 < 224) {
          const i2 = e3[n2++];
          t3[r2++] = String.fromCharCode((31 & a2) << 6 | 63 & i2);
        } else if (a2 > 239 && a2 < 365) {
          const i2 = ((7 & a2) << 18 | (63 & e3[n2++]) << 12 | (63 & e3[n2++]) << 6 | 63 & e3[n2++]) - 65536;
          t3[r2++] = String.fromCharCode(55296 + (i2 >> 10)), t3[r2++] = String.fromCharCode(56320 + (1023 & i2));
        } else {
          const i2 = e3[n2++], s2 = e3[n2++];
          t3[r2++] = String.fromCharCode((15 & a2) << 12 | (63 & i2) << 6 | 63 & s2);
        }
      }
      return t3.join("");
    }(this.decodeStringToByteArray(e2, t2));
  },
  decodeStringToByteArray(e2, t2) {
    this.init_();
    const n2 = t2 ? this.charToByteMapWebSafe_ : this.charToByteMap_, r2 = [];
    for (let t3 = 0; t3 < e2.length; ) {
      const a2 = n2[e2.charAt(t3++)], i2 = t3 < e2.length ? n2[e2.charAt(t3)] : 0;
      ++t3;
      const s2 = t3 < e2.length ? n2[e2.charAt(t3)] : 64;
      ++t3;
      const o2 = t3 < e2.length ? n2[e2.charAt(t3)] : 64;
      if (++t3, null == a2 || null == i2 || null == s2 || null == o2) throw new Oe();
      const u2 = a2 << 2 | i2 >> 4;
      if (r2.push(u2), 64 !== s2) {
        const e3 = i2 << 4 & 240 | s2 >> 2;
        if (r2.push(e3), 64 !== o2) {
          const e4 = s2 << 6 & 192 | o2;
          r2.push(e4);
        }
      }
    }
    return r2;
  },
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {}, this.charToByteMap_ = {}, this.byteToCharMapWebSafe_ = {}, this.charToByteMapWebSafe_ = {};
      for (let e2 = 0; e2 < this.ENCODED_VALS.length; e2++) this.byteToCharMap_[e2] = this.ENCODED_VALS.charAt(e2), this.charToByteMap_[this.byteToCharMap_[e2]] = e2, this.byteToCharMapWebSafe_[e2] = this.ENCODED_VALS_WEBSAFE.charAt(e2), this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e2]] = e2, e2 >= this.ENCODED_VALS_BASE.length && (this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e2)] = e2, this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e2)] = e2);
    }
  }
};
var Oe = class extends Error {
  constructor() {
    super(...arguments), this.name = "DecodeBase64StringError";
  }
};
var Le = function(e2) {
  return function(e3) {
    const t2 = Ne(e3);
    return Me.encodeByteArray(t2, true);
  }(e2).replace(/\./g, "");
};
var Ae = () => {
  try {
    return function() {
      if ("undefined" != typeof self) return self;
      if ("undefined" != typeof window) return window;
      if (void 0 !== t.g) return t.g;
      throw new Error("Unable to locate global object.");
    }().__FIREBASE_DEFAULTS__ || (() => {
      if ("undefined" == typeof process || void 0 === process.env) return;
      const e2 = process.env.__FIREBASE_DEFAULTS__;
      return e2 ? JSON.parse(e2) : void 0;
    })() || (() => {
      if ("undefined" == typeof document) return;
      let e2;
      try {
        e2 = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
      } catch (e3) {
        return;
      }
      const t2 = e2 && function(e3) {
        try {
          return Me.decodeString(e3, true);
        } catch (e4) {
          console.error("base64Decode failed: ", e4);
        }
        return null;
      }(e2[1]);
      return t2 && JSON.parse(t2);
    })();
  } catch (e2) {
    return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e2}`);
  }
};
var Ee = () => {
  var e2;
  return null === (e2 = Ae()) || void 0 === e2 ? void 0 : e2.config;
};
var Be = class {
  constructor() {
    this.reject = () => {
    }, this.resolve = () => {
    }, this.promise = new Promise((e2, t2) => {
      this.resolve = e2, this.reject = t2;
    });
  }
  wrapCallback(e2) {
    return (t2, n2) => {
      t2 ? this.reject(t2) : this.resolve(n2), "function" == typeof e2 && (this.promise.catch(() => {
      }), 1 === e2.length ? e2(t2) : e2(t2, n2));
    };
  }
};
function Fe() {
  const e2 = "object" == typeof chrome ? chrome.runtime : "object" == typeof browser ? browser.runtime : void 0;
  return "object" == typeof e2 && void 0 !== e2.id;
}
function we() {
  try {
    return "object" == typeof indexedDB;
  } catch (e2) {
    return false;
  }
}
function We() {
  return new Promise((e2, t2) => {
    try {
      let n2 = true;
      const r2 = "validate-browser-context-for-indexeddb-analytics-module", a2 = self.indexedDB.open(r2);
      a2.onsuccess = () => {
        a2.result.close(), n2 || self.indexedDB.deleteDatabase(r2), e2(true);
      }, a2.onupgradeneeded = () => {
        n2 = false;
      }, a2.onerror = () => {
        var e3;
        t2((null === (e3 = a2.error) || void 0 === e3 ? void 0 : e3.message) || "");
      };
    } catch (e3) {
      t2(e3);
    }
  });
}
function ve() {
  return !("undefined" == typeof navigator || !navigator.cookieEnabled);
}
var He = class _He extends Error {
  constructor(e2, t2, n2) {
    super(t2), this.code = e2, this.customData = n2, this.name = "FirebaseError", Object.setPrototypeOf(this, _He.prototype), Error.captureStackTrace && Error.captureStackTrace(this, Ue.prototype.create);
  }
};
var Ue = class {
  constructor(e2, t2, n2) {
    this.service = e2, this.serviceName = t2, this.errors = n2;
  }
  create(e2, ...t2) {
    const n2 = t2[0] || {}, r2 = `${this.service}/${e2}`, a2 = this.errors[e2], i2 = a2 ? function(e3, t3) {
      return e3.replace(Ge, (e4, n3) => {
        const r3 = t3[n3];
        return null != r3 ? String(r3) : `<${n3}?>`;
      });
    }(a2, n2) : "Error", s2 = `${this.serviceName}: ${i2} (${r2}).`;
    return new He(r2, s2, n2);
  }
};
var Ge = /\{\$([^}]+)}/g;
function Ye(e2, t2) {
  if (e2 === t2) return true;
  const n2 = Object.keys(e2), r2 = Object.keys(t2);
  for (const a2 of n2) {
    if (!r2.includes(a2)) return false;
    const n3 = e2[a2], i2 = t2[a2];
    if (Ve(n3) && Ve(i2)) {
      if (!Ye(n3, i2)) return false;
    } else if (n3 !== i2) return false;
  }
  for (const e3 of r2) if (!n2.includes(e3)) return false;
  return true;
}
function Ve(e2) {
  return null !== e2 && "object" == typeof e2;
}
function _e(e2, t2 = 1e3, n2 = 2) {
  const r2 = t2 * Math.pow(n2, e2), a2 = Math.round(0.5 * r2 * (Math.random() - 0.5) * 2);
  return Math.min(144e5, r2 + a2);
}
function ze(e2) {
  return e2 && e2._delegate ? e2._delegate : e2;
}
var Ze = class {
  constructor(e2, t2, n2) {
    this.name = e2, this.instanceFactory = t2, this.type = n2, this.multipleInstances = false, this.serviceProps = {}, this.instantiationMode = "LAZY", this.onInstanceCreated = null;
  }
  setInstantiationMode(e2) {
    return this.instantiationMode = e2, this;
  }
  setMultipleInstances(e2) {
    return this.multipleInstances = e2, this;
  }
  setServiceProps(e2) {
    return this.serviceProps = e2, this;
  }
  setInstanceCreatedCallback(e2) {
    return this.onInstanceCreated = e2, this;
  }
};
var xe = "[DEFAULT]";
var ke = class {
  constructor(e2, t2) {
    this.name = e2, this.container = t2, this.component = null, this.instances = /* @__PURE__ */ new Map(), this.instancesDeferred = /* @__PURE__ */ new Map(), this.instancesOptions = /* @__PURE__ */ new Map(), this.onInitCallbacks = /* @__PURE__ */ new Map();
  }
  get(e2) {
    const t2 = this.normalizeInstanceIdentifier(e2);
    if (!this.instancesDeferred.has(t2)) {
      const e3 = new Be();
      if (this.instancesDeferred.set(t2, e3), this.isInitialized(t2) || this.shouldAutoInitialize()) try {
        const n2 = this.getOrInitializeService({
          instanceIdentifier: t2
        });
        n2 && e3.resolve(n2);
      } catch (e4) {
      }
    }
    return this.instancesDeferred.get(t2).promise;
  }
  getImmediate(e2) {
    var t2;
    const n2 = this.normalizeInstanceIdentifier(null == e2 ? void 0 : e2.identifier), r2 = null !== (t2 = null == e2 ? void 0 : e2.optional) && void 0 !== t2 && t2;
    if (!this.isInitialized(n2) && !this.shouldAutoInitialize()) {
      if (r2) return null;
      throw Error(`Service ${this.name} is not available`);
    }
    try {
      return this.getOrInitializeService({
        instanceIdentifier: n2
      });
    } catch (e3) {
      if (r2) return null;
      throw e3;
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(e2) {
    if (e2.name !== this.name) throw Error(`Mismatching Component ${e2.name} for Provider ${this.name}.`);
    if (this.component) throw Error(`Component for ${this.name} has already been provided`);
    if (this.component = e2, this.shouldAutoInitialize()) {
      if (function(e3) {
        return "EAGER" === e3.instantiationMode;
      }(e2)) try {
        this.getOrInitializeService({
          instanceIdentifier: xe
        });
      } catch (e3) {
      }
      for (const [e3, t2] of this.instancesDeferred.entries()) {
        const n2 = this.normalizeInstanceIdentifier(e3);
        try {
          const e4 = this.getOrInitializeService({
            instanceIdentifier: n2
          });
          t2.resolve(e4);
        } catch (e4) {
        }
      }
    }
  }
  clearInstance(e2 = xe) {
    this.instancesDeferred.delete(e2), this.instancesOptions.delete(e2), this.instances.delete(e2);
  }
  delete() {
    return __async(this, null, function* () {
      const e2 = Array.from(this.instances.values());
      yield Promise.all([...e2.filter((e3) => "INTERNAL" in e3).map((e3) => e3.INTERNAL.delete()), ...e2.filter((e3) => "_delete" in e3).map((e3) => e3._delete())]);
    });
  }
  isComponentSet() {
    return null != this.component;
  }
  isInitialized(e2 = xe) {
    return this.instances.has(e2);
  }
  getOptions(e2 = xe) {
    return this.instancesOptions.get(e2) || {};
  }
  initialize(e2 = {}) {
    const {
      options: t2 = {}
    } = e2, n2 = this.normalizeInstanceIdentifier(e2.instanceIdentifier);
    if (this.isInitialized(n2)) throw Error(`${this.name}(${n2}) has already been initialized`);
    if (!this.isComponentSet()) throw Error(`Component ${this.name} has not been registered yet`);
    const r2 = this.getOrInitializeService({
      instanceIdentifier: n2,
      options: t2
    });
    for (const [e3, t3] of this.instancesDeferred.entries()) n2 === this.normalizeInstanceIdentifier(e3) && t3.resolve(r2);
    return r2;
  }
  onInit(e2, t2) {
    var n2;
    const r2 = this.normalizeInstanceIdentifier(t2), a2 = null !== (n2 = this.onInitCallbacks.get(r2)) && void 0 !== n2 ? n2 : /* @__PURE__ */ new Set();
    a2.add(e2), this.onInitCallbacks.set(r2, a2);
    const i2 = this.instances.get(r2);
    return i2 && e2(i2, r2), () => {
      a2.delete(e2);
    };
  }
  invokeOnInitCallbacks(e2, t2) {
    const n2 = this.onInitCallbacks.get(t2);
    if (n2) for (const r2 of n2) try {
      r2(e2, t2);
    } catch (e3) {
    }
  }
  getOrInitializeService({
    instanceIdentifier: e2,
    options: t2 = {}
  }) {
    let n2 = this.instances.get(e2);
    if (!n2 && this.component && (n2 = this.component.instanceFactory(this.container, {
      instanceIdentifier: (r2 = e2, r2 === xe ? void 0 : r2),
      options: t2
    }), this.instances.set(e2, n2), this.instancesOptions.set(e2, t2), this.invokeOnInitCallbacks(n2, e2), this.component.onInstanceCreated)) try {
      this.component.onInstanceCreated(this.container, e2, n2);
    } catch (e3) {
    }
    var r2;
    return n2 || null;
  }
  normalizeInstanceIdentifier(e2 = xe) {
    return this.component ? this.component.multipleInstances ? e2 : xe : e2;
  }
  shouldAutoInitialize() {
    return !!this.component && "EXPLICIT" !== this.component.instantiationMode;
  }
};
var Je = class {
  constructor(e2) {
    this.name = e2, this.providers = /* @__PURE__ */ new Map();
  }
  addComponent(e2) {
    const t2 = this.getProvider(e2.name);
    if (t2.isComponentSet()) throw new Error(`Component ${e2.name} has already been registered with ${this.name}`);
    t2.setComponent(e2);
  }
  addOrOverwriteComponent(e2) {
    this.getProvider(e2.name).isComponentSet() && this.providers.delete(e2.name), this.addComponent(e2);
  }
  getProvider(e2) {
    if (this.providers.has(e2)) return this.providers.get(e2);
    const t2 = new ke(e2, this);
    return this.providers.set(e2, t2), t2;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
};
var Ke = [];
var qe;
!function(e2) {
  e2[e2.DEBUG = 0] = "DEBUG", e2[e2.VERBOSE = 1] = "VERBOSE", e2[e2.INFO = 2] = "INFO", e2[e2.WARN = 3] = "WARN", e2[e2.ERROR = 4] = "ERROR", e2[e2.SILENT = 5] = "SILENT";
}(qe || (qe = {}));
var Xe = {
  debug: qe.DEBUG,
  verbose: qe.VERBOSE,
  info: qe.INFO,
  warn: qe.WARN,
  error: qe.ERROR,
  silent: qe.SILENT
};
var je = qe.INFO;
var $e = {
  [qe.DEBUG]: "log",
  [qe.VERBOSE]: "log",
  [qe.INFO]: "info",
  [qe.WARN]: "warn",
  [qe.ERROR]: "error"
};
var Qe = (e2, t2, ...n2) => {
  if (t2 < e2.logLevel) return;
  const r2 = (/* @__PURE__ */ new Date()).toISOString(), a2 = $e[t2];
  if (!a2) throw new Error(`Attempted to log a message with an invalid logType (value: ${t2})`);
  console[a2](`[${r2}]  ${e2.name}:`, ...n2);
};
var et = class {
  constructor(e2) {
    this.name = e2, this._logLevel = je, this._logHandler = Qe, this._userLogHandler = null, Ke.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(e2) {
    if (!(e2 in qe)) throw new TypeError(`Invalid value "${e2}" assigned to \`logLevel\``);
    this._logLevel = e2;
  }
  setLogLevel(e2) {
    this._logLevel = "string" == typeof e2 ? Xe[e2] : e2;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(e2) {
    if ("function" != typeof e2) throw new TypeError("Value assigned to `logHandler` must be a function");
    this._logHandler = e2;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(e2) {
    this._userLogHandler = e2;
  }
  debug(...e2) {
    this._userLogHandler && this._userLogHandler(this, qe.DEBUG, ...e2), this._logHandler(this, qe.DEBUG, ...e2);
  }
  log(...e2) {
    this._userLogHandler && this._userLogHandler(this, qe.VERBOSE, ...e2), this._logHandler(this, qe.VERBOSE, ...e2);
  }
  info(...e2) {
    this._userLogHandler && this._userLogHandler(this, qe.INFO, ...e2), this._logHandler(this, qe.INFO, ...e2);
  }
  warn(...e2) {
    this._userLogHandler && this._userLogHandler(this, qe.WARN, ...e2), this._logHandler(this, qe.WARN, ...e2);
  }
  error(...e2) {
    this._userLogHandler && this._userLogHandler(this, qe.ERROR, ...e2), this._logHandler(this, qe.ERROR, ...e2);
  }
};
var tt;
var nt;
var rt = /* @__PURE__ */ new WeakMap();
var at = /* @__PURE__ */ new WeakMap();
var it = /* @__PURE__ */ new WeakMap();
var st = /* @__PURE__ */ new WeakMap();
var ot = /* @__PURE__ */ new WeakMap();
var ut = {
  get(e2, t2, n2) {
    if (e2 instanceof IDBTransaction) {
      if ("done" === t2) return at.get(e2);
      if ("objectStoreNames" === t2) return e2.objectStoreNames || it.get(e2);
      if ("store" === t2) return n2.objectStoreNames[1] ? void 0 : n2.objectStore(n2.objectStoreNames[0]);
    }
    return dt(e2[t2]);
  },
  set: (e2, t2, n2) => (e2[t2] = n2, true),
  has: (e2, t2) => e2 instanceof IDBTransaction && ("done" === t2 || "store" === t2) || t2 in e2
};
function lt(e2) {
  return "function" == typeof e2 ? (t2 = e2) !== IDBDatabase.prototype.transaction || "objectStoreNames" in IDBTransaction.prototype ? (nt || (nt = [IDBCursor.prototype.advance, IDBCursor.prototype.continue, IDBCursor.prototype.continuePrimaryKey])).includes(t2) ? function(...e3) {
    return t2.apply(ft(this), e3), dt(rt.get(this));
  } : function(...e3) {
    return dt(t2.apply(ft(this), e3));
  } : function(e3, ...n3) {
    const r2 = t2.call(ft(this), e3, ...n3);
    return it.set(r2, e3.sort ? e3.sort() : [e3]), dt(r2);
  } : (e2 instanceof IDBTransaction && function(e3) {
    if (at.has(e3)) return;
    const t3 = new Promise((t4, n3) => {
      const r2 = () => {
        e3.removeEventListener("complete", a2), e3.removeEventListener("error", i2), e3.removeEventListener("abort", i2);
      }, a2 = () => {
        t4(), r2();
      }, i2 = () => {
        n3(e3.error || new DOMException("AbortError", "AbortError")), r2();
      };
      e3.addEventListener("complete", a2), e3.addEventListener("error", i2), e3.addEventListener("abort", i2);
    });
    at.set(e3, t3);
  }(e2), n2 = e2, (tt || (tt = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])).some((e3) => n2 instanceof e3) ? new Proxy(e2, ut) : e2);
  var t2, n2;
}
function dt(e2) {
  if (e2 instanceof IDBRequest) return function(e3) {
    const t3 = new Promise((t4, n2) => {
      const r2 = () => {
        e3.removeEventListener("success", a2), e3.removeEventListener("error", i2);
      }, a2 = () => {
        t4(dt(e3.result)), r2();
      }, i2 = () => {
        n2(e3.error), r2();
      };
      e3.addEventListener("success", a2), e3.addEventListener("error", i2);
    });
    return t3.then((t4) => {
      t4 instanceof IDBCursor && rt.set(t4, e3);
    }).catch(() => {
    }), ot.set(t3, e3), t3;
  }(e2);
  if (st.has(e2)) return st.get(e2);
  const t2 = lt(e2);
  return t2 !== e2 && (st.set(e2, t2), ot.set(t2, e2)), t2;
}
var ft = (e2) => ot.get(e2);
function pt(e2, t2, {
  blocked: n2,
  upgrade: r2,
  blocking: a2,
  terminated: i2
} = {}) {
  const s2 = indexedDB.open(e2, t2), o2 = dt(s2);
  return r2 && s2.addEventListener("upgradeneeded", (e3) => {
    r2(dt(s2.result), e3.oldVersion, e3.newVersion, dt(s2.transaction), e3);
  }), n2 && s2.addEventListener("blocked", (e3) => n2(e3.oldVersion, e3.newVersion, e3)), o2.then((e3) => {
    i2 && e3.addEventListener("close", () => i2()), a2 && e3.addEventListener("versionchange", (e4) => a2(e4.oldVersion, e4.newVersion, e4));
  }).catch(() => {
  }), o2;
}
var bt = ["get", "getKey", "getAll", "getAllKeys", "count"];
var ht = ["put", "add", "delete", "clear"];
var Pt = /* @__PURE__ */ new Map();
function mt(e2, t2) {
  if (!(e2 instanceof IDBDatabase) || t2 in e2 || "string" != typeof t2) return;
  if (Pt.get(t2)) return Pt.get(t2);
  const n2 = t2.replace(/FromIndex$/, ""), r2 = t2 !== n2, a2 = ht.includes(n2);
  if (!(n2 in (r2 ? IDBIndex : IDBObjectStore).prototype) || !a2 && !bt.includes(n2)) return;
  const i2 = function(e3, ...t3) {
    return __async(this, null, function* () {
      const i3 = this.transaction(e3, a2 ? "readwrite" : "readonly");
      let s2 = i3.store;
      return r2 && (s2 = s2.index(t3.shift())), (yield Promise.all([s2[n2](...t3), a2 && i3.done]))[0];
    });
  };
  return Pt.set(t2, i2), i2;
}
var ct;
ct = ut, ut = __spreadProps(__spreadValues({}, ct), {
  get: (e2, t2, n2) => mt(e2, t2) || ct.get(e2, t2, n2),
  has: (e2, t2) => !!mt(e2, t2) || ct.has(e2, t2)
});
var Ct = class {
  constructor(e2) {
    this.container = e2;
  }
  getPlatformInfoString() {
    return this.container.getProviders().map((e2) => {
      if (function(e3) {
        const t2 = e3.getComponent();
        return "VERSION" === (null == t2 ? void 0 : t2.type);
      }(e2)) {
        const t2 = e2.getImmediate();
        return `${t2.library}/${t2.version}`;
      }
      return null;
    }).filter((e2) => e2).join(" ");
  }
};
var It = "@firebase/app";
var St = "0.10.13";
var yt = new et("@firebase/app");
var gt = "@firebase/app-compat";
var Tt = "@firebase/analytics-compat";
var Dt = "@firebase/analytics";
var Rt = "@firebase/app-check-compat";
var Nt = "@firebase/app-check";
var Mt = "@firebase/auth";
var Ot = "@firebase/auth-compat";
var Lt = "@firebase/database";
var At = "@firebase/data-connect";
var Et = "@firebase/database-compat";
var Bt = "@firebase/functions";
var Ft = "@firebase/functions-compat";
var wt = "@firebase/installations";
var Wt = "@firebase/installations-compat";
var vt = "@firebase/messaging";
var Ht = "@firebase/messaging-compat";
var Ut = "@firebase/performance";
var Gt = "@firebase/performance-compat";
var Yt = "@firebase/remote-config";
var Vt = "@firebase/remote-config-compat";
var _t = "@firebase/storage";
var zt = "@firebase/storage-compat";
var Zt = "@firebase/firestore";
var xt = "@firebase/vertexai-preview";
var kt = "@firebase/firestore-compat";
var Jt = "firebase";
var Kt = "[DEFAULT]";
var qt = {
  [It]: "fire-core",
  [gt]: "fire-core-compat",
  [Dt]: "fire-analytics",
  [Tt]: "fire-analytics-compat",
  [Nt]: "fire-app-check",
  [Rt]: "fire-app-check-compat",
  [Mt]: "fire-auth",
  [Ot]: "fire-auth-compat",
  [Lt]: "fire-rtdb",
  [At]: "fire-data-connect",
  [Et]: "fire-rtdb-compat",
  [Bt]: "fire-fn",
  [Ft]: "fire-fn-compat",
  [wt]: "fire-iid",
  [Wt]: "fire-iid-compat",
  [vt]: "fire-fcm",
  [Ht]: "fire-fcm-compat",
  [Ut]: "fire-perf",
  [Gt]: "fire-perf-compat",
  [Yt]: "fire-rc",
  [Vt]: "fire-rc-compat",
  [_t]: "fire-gcs",
  [zt]: "fire-gcs-compat",
  [Zt]: "fire-fst",
  [kt]: "fire-fst-compat",
  [xt]: "fire-vertex",
  "fire-js": "fire-js",
  [Jt]: "fire-js-all"
};
var Xt = /* @__PURE__ */ new Map();
var jt = /* @__PURE__ */ new Map();
var $t = /* @__PURE__ */ new Map();
function Qt(e2, t2) {
  try {
    e2.container.addComponent(t2);
  } catch (n2) {
    yt.debug(`Component ${t2.name} failed to register with FirebaseApp ${e2.name}`, n2);
  }
}
function en(e2) {
  const t2 = e2.name;
  if ($t.has(t2)) return yt.debug(`There were multiple attempts to register component ${t2}.`), false;
  $t.set(t2, e2);
  for (const t3 of Xt.values()) Qt(t3, e2);
  for (const t3 of jt.values()) Qt(t3, e2);
  return true;
}
function tn(e2, t2) {
  const n2 = e2.container.getProvider("heartbeat").getImmediate({
    optional: true
  });
  return n2 && n2.triggerHeartbeat(), e2.container.getProvider(t2);
}
var nn = new Ue("app", "Firebase", {
  "no-app": "No Firebase App '{$appName}' has been created - call initializeApp() first",
  "bad-app-name": "Illegal App name: '{$appName}'",
  "duplicate-app": "Firebase App named '{$appName}' already exists with different options or config",
  "app-deleted": "Firebase App named '{$appName}' already deleted",
  "server-app-deleted": "Firebase Server App has been deleted",
  "no-options": "Need to provide options, when not being deployed to hosting via source.",
  "invalid-app-argument": "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  "invalid-log-argument": "First argument to `onLog` must be null or a function.",
  "idb-open": "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-get": "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-set": "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-delete": "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  "finalization-registry-not-supported": "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  "invalid-server-app-environment": "FirebaseServerApp is not for use in browser environments."
});
var rn = class {
  constructor(e2, t2, n2) {
    this._isDeleted = false, this._options = Object.assign({}, e2), this._config = Object.assign({}, t2), this._name = t2.name, this._automaticDataCollectionEnabled = t2.automaticDataCollectionEnabled, this._container = n2, this.container.addComponent(new Ze("app", () => this, "PUBLIC"));
  }
  get automaticDataCollectionEnabled() {
    return this.checkDestroyed(), this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(e2) {
    this.checkDestroyed(), this._automaticDataCollectionEnabled = e2;
  }
  get name() {
    return this.checkDestroyed(), this._name;
  }
  get options() {
    return this.checkDestroyed(), this._options;
  }
  get config() {
    return this.checkDestroyed(), this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(e2) {
    this._isDeleted = e2;
  }
  checkDestroyed() {
    if (this.isDeleted) throw nn.create("app-deleted", {
      appName: this._name
    });
  }
};
function an(e2, t2 = {}) {
  let n2 = e2;
  "object" != typeof t2 && (t2 = {
    name: t2
  });
  const r2 = Object.assign({
    name: Kt,
    automaticDataCollectionEnabled: false
  }, t2), a2 = r2.name;
  if ("string" != typeof a2 || !a2) throw nn.create("bad-app-name", {
    appName: String(a2)
  });
  if (n2 || (n2 = Ee()), !n2) throw nn.create("no-options");
  const i2 = Xt.get(a2);
  if (i2) {
    if (Ye(n2, i2.options) && Ye(r2, i2.config)) return i2;
    throw nn.create("duplicate-app", {
      appName: a2
    });
  }
  const s2 = new Je(a2);
  for (const e3 of $t.values()) s2.addComponent(e3);
  const o2 = new rn(n2, r2, s2);
  return Xt.set(a2, o2), o2;
}
function sn(e2, t2, n2) {
  var r2;
  let a2 = null !== (r2 = qt[e2]) && void 0 !== r2 ? r2 : e2;
  n2 && (a2 += `-${n2}`);
  const i2 = a2.match(/\s|\//), s2 = t2.match(/\s|\//);
  if (i2 || s2) {
    const e3 = [`Unable to register library "${a2}" with version "${t2}":`];
    return i2 && e3.push(`library name "${a2}" contains illegal characters (whitespace or "/")`), i2 && s2 && e3.push("and"), s2 && e3.push(`version name "${t2}" contains illegal characters (whitespace or "/")`), void yt.warn(e3.join(" "));
  }
  en(new Ze(`${a2}-version`, () => ({
    library: a2,
    version: t2
  }), "VERSION"));
}
var on = "firebase-heartbeat-store";
var un = null;
function ln() {
  return un || (un = pt("firebase-heartbeat-database", 1, {
    upgrade: (e2, t2) => {
      if (0 === t2) try {
        e2.createObjectStore(on);
      } catch (e3) {
        console.warn(e3);
      }
    }
  }).catch((e2) => {
    throw nn.create("idb-open", {
      originalErrorMessage: e2.message
    });
  })), un;
}
function dn(e2, t2) {
  return __async(this, null, function* () {
    try {
      const n2 = (yield ln()).transaction(on, "readwrite"), r2 = n2.objectStore(on);
      yield r2.put(t2, fn(e2)), yield n2.done;
    } catch (e3) {
      if (e3 instanceof He) yt.warn(e3.message);
      else {
        const t3 = nn.create("idb-set", {
          originalErrorMessage: null == e3 ? void 0 : e3.message
        });
        yt.warn(t3.message);
      }
    }
  });
}
function fn(e2) {
  return `${e2.name}!${e2.options.appId}`;
}
var pn = class {
  constructor(e2) {
    this.container = e2, this._heartbeatsCache = null;
    const t2 = this.container.getProvider("app").getImmediate();
    this._storage = new hn(t2), this._heartbeatsCachePromise = this._storage.read().then((e3) => (this._heartbeatsCache = e3, e3));
  }
  triggerHeartbeat() {
    return __async(this, null, function* () {
      var e2, t2;
      try {
        const n2 = this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(), r2 = bn();
        if (null == (null === (e2 = this._heartbeatsCache) || void 0 === e2 ? void 0 : e2.heartbeats) && (this._heartbeatsCache = yield this._heartbeatsCachePromise, null == (null === (t2 = this._heartbeatsCache) || void 0 === t2 ? void 0 : t2.heartbeats))) return;
        if (this._heartbeatsCache.lastSentHeartbeatDate === r2 || this._heartbeatsCache.heartbeats.some((e3) => e3.date === r2)) return;
        return this._heartbeatsCache.heartbeats.push({
          date: r2,
          agent: n2
        }), this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter((e3) => {
          const t3 = new Date(e3.date).valueOf();
          return Date.now() - t3 <= 2592e6;
        }), this._storage.overwrite(this._heartbeatsCache);
      } catch (e3) {
        yt.warn(e3);
      }
    });
  }
  getHeartbeatsHeader() {
    return __async(this, null, function* () {
      var e2;
      try {
        if (null === this._heartbeatsCache && (yield this._heartbeatsCachePromise), null == (null === (e2 = this._heartbeatsCache) || void 0 === e2 ? void 0 : e2.heartbeats) || 0 === this._heartbeatsCache.heartbeats.length) return "";
        const t2 = bn(), {
          heartbeatsToSend: n2,
          unsentEntries: r2
        } = function(e3, t3 = 1024) {
          const n3 = [];
          let r3 = e3.slice();
          for (const a3 of e3) {
            const e4 = n3.find((e5) => e5.agent === a3.agent);
            if (e4) {
              if (e4.dates.push(a3.date), Pn(n3) > t3) {
                e4.dates.pop();
                break;
              }
            } else if (n3.push({
              agent: a3.agent,
              dates: [a3.date]
            }), Pn(n3) > t3) {
              n3.pop();
              break;
            }
            r3 = r3.slice(1);
          }
          return {
            heartbeatsToSend: n3,
            unsentEntries: r3
          };
        }(this._heartbeatsCache.heartbeats), a2 = Le(JSON.stringify({
          version: 2,
          heartbeats: n2
        }));
        return this._heartbeatsCache.lastSentHeartbeatDate = t2, r2.length > 0 ? (this._heartbeatsCache.heartbeats = r2, yield this._storage.overwrite(this._heartbeatsCache)) : (this._heartbeatsCache.heartbeats = [], this._storage.overwrite(this._heartbeatsCache)), a2;
      } catch (e3) {
        return yt.warn(e3), "";
      }
    });
  }
};
function bn() {
  return (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
}
var hn = class {
  constructor(e2) {
    this.app = e2, this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  runIndexedDBEnvironmentCheck() {
    return __async(this, null, function* () {
      return !!we() && We().then(() => true).catch(() => false);
    });
  }
  read() {
    return __async(this, null, function* () {
      if (yield this._canUseIndexedDBPromise) {
        const e2 = yield function(e3) {
          return __async(this, null, function* () {
            try {
              const t2 = (yield ln()).transaction(on), n2 = yield t2.objectStore(on).get(fn(e3));
              return yield t2.done, n2;
            } catch (e4) {
              if (e4 instanceof He) yt.warn(e4.message);
              else {
                const t2 = nn.create("idb-get", {
                  originalErrorMessage: null == e4 ? void 0 : e4.message
                });
                yt.warn(t2.message);
              }
            }
          });
        }(this.app);
        return (null == e2 ? void 0 : e2.heartbeats) ? e2 : {
          heartbeats: []
        };
      }
      return {
        heartbeats: []
      };
    });
  }
  overwrite(e2) {
    return __async(this, null, function* () {
      var t2;
      if (yield this._canUseIndexedDBPromise) {
        const n2 = yield this.read();
        return dn(this.app, {
          lastSentHeartbeatDate: null !== (t2 = e2.lastSentHeartbeatDate) && void 0 !== t2 ? t2 : n2.lastSentHeartbeatDate,
          heartbeats: e2.heartbeats
        });
      }
    });
  }
  add(e2) {
    return __async(this, null, function* () {
      var t2;
      if (yield this._canUseIndexedDBPromise) {
        const n2 = yield this.read();
        return dn(this.app, {
          lastSentHeartbeatDate: null !== (t2 = e2.lastSentHeartbeatDate) && void 0 !== t2 ? t2 : n2.lastSentHeartbeatDate,
          heartbeats: [...n2.heartbeats, ...e2.heartbeats]
        });
      }
    });
  }
};
function Pn(e2) {
  return Le(JSON.stringify({
    version: 2,
    heartbeats: e2
  })).length;
}
en(new Ze("platform-logger", (e2) => new Ct(e2), "PRIVATE")), en(new Ze("heartbeat", (e2) => new pn(e2), "PRIVATE")), sn(It, St, ""), sn(It, St, "esm2017"), sn("fire-js", "");
var mn = "@firebase/installations";
var cn = "0.6.9";
var Cn = `w:${cn}`;
var In = "FIS_v2";
var Sn = new Ue("installations", "Installations", {
  "missing-app-config-values": 'Missing App configuration value: "{$valueName}"',
  "not-registered": "Firebase Installation is not registered.",
  "installation-not-found": "Firebase Installation not found.",
  "request-failed": '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
  "app-offline": "Could not process request. Application offline.",
  "delete-pending-registration": "Can't delete installation while there is a pending registration request."
});
function yn(e2) {
  return e2 instanceof He && e2.code.includes("request-failed");
}
function gn({
  projectId: e2
}) {
  return `https://firebaseinstallations.googleapis.com/v1/projects/${e2}/installations`;
}
function Tn(e2) {
  return {
    token: e2.token,
    requestStatus: 2,
    expiresIn: (t2 = e2.expiresIn, Number(t2.replace("s", "000"))),
    creationTime: Date.now()
  };
  var t2;
}
function Dn(e2, t2) {
  return __async(this, null, function* () {
    const n2 = (yield t2.json()).error;
    return Sn.create("request-failed", {
      requestName: e2,
      serverCode: n2.code,
      serverMessage: n2.message,
      serverStatus: n2.status
    });
  });
}
function Rn({
  apiKey: e2
}) {
  return new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-goog-api-key": e2
  });
}
function Nn(e2) {
  return __async(this, null, function* () {
    const t2 = yield e2();
    return t2.status >= 500 && t2.status < 600 ? e2() : t2;
  });
}
function Mn(e2) {
  return new Promise((t2) => {
    setTimeout(t2, e2);
  });
}
var On = /^[cdef][\w-]{21}$/;
function Ln() {
  try {
    const e2 = new Uint8Array(17);
    (self.crypto || self.msCrypto).getRandomValues(e2), e2[0] = 112 + e2[0] % 16;
    const t2 = function(e3) {
      var t3;
      return (t3 = e3, btoa(String.fromCharCode(...t3)).replace(/\+/g, "-").replace(/\//g, "_")).substr(0, 22);
    }(e2);
    return On.test(t2) ? t2 : "";
  } catch (e2) {
    return "";
  }
}
function An(e2) {
  return `${e2.appName}!${e2.appId}`;
}
var En = /* @__PURE__ */ new Map();
function Bn(e2, t2) {
  const n2 = An(e2);
  Fn(n2, t2), function(e3, t3) {
    const n3 = (!wn && "BroadcastChannel" in self && (wn = new BroadcastChannel("[Firebase] FID Change"), wn.onmessage = (e4) => {
      Fn(e4.data.key, e4.data.fid);
    }), wn);
    n3 && n3.postMessage({
      key: e3,
      fid: t3
    }), 0 === En.size && wn && (wn.close(), wn = null);
  }(n2, t2);
}
function Fn(e2, t2) {
  const n2 = En.get(e2);
  if (n2) for (const e3 of n2) e3(t2);
}
var wn = null;
var Wn = "firebase-installations-store";
var vn = null;
function Hn() {
  return vn || (vn = pt("firebase-installations-database", 1, {
    upgrade: (e2, t2) => {
      0 === t2 && e2.createObjectStore(Wn);
    }
  })), vn;
}
function Un(e2, t2) {
  return __async(this, null, function* () {
    const n2 = An(e2), r2 = (yield Hn()).transaction(Wn, "readwrite"), a2 = r2.objectStore(Wn), i2 = yield a2.get(n2);
    return yield a2.put(t2, n2), yield r2.done, i2 && i2.fid === t2.fid || Bn(e2, t2.fid), t2;
  });
}
function Gn(e2) {
  return __async(this, null, function* () {
    const t2 = An(e2), n2 = (yield Hn()).transaction(Wn, "readwrite");
    yield n2.objectStore(Wn).delete(t2), yield n2.done;
  });
}
function Yn(e2, t2) {
  return __async(this, null, function* () {
    const n2 = An(e2), r2 = (yield Hn()).transaction(Wn, "readwrite"), a2 = r2.objectStore(Wn), i2 = yield a2.get(n2), s2 = t2(i2);
    return void 0 === s2 ? yield a2.delete(n2) : yield a2.put(s2, n2), yield r2.done, !s2 || i2 && i2.fid === s2.fid || Bn(e2, s2.fid), s2;
  });
}
function Vn(e2) {
  return __async(this, null, function* () {
    let t2;
    const n2 = yield Yn(e2.appConfig, (n3) => {
      const r2 = function(e3) {
        return Zn(e3 || {
          fid: Ln(),
          registrationStatus: 0
        });
      }(n3), a2 = function(e3, t3) {
        if (0 === t3.registrationStatus) {
          if (!navigator.onLine) return {
            installationEntry: t3,
            registrationPromise: Promise.reject(Sn.create("app-offline"))
          };
          const n4 = {
            fid: t3.fid,
            registrationStatus: 1,
            registrationTime: Date.now()
          }, r3 = function(e4, t4) {
            return __async(this, null, function* () {
              try {
                const n5 = yield function(_0, _1) {
                  return __async(this, arguments, function* ({
                    appConfig: e5,
                    heartbeatServiceProvider: t5
                  }, {
                    fid: n6
                  }) {
                    const r4 = gn(e5), a3 = Rn(e5), i2 = t5.getImmediate({
                      optional: true
                    });
                    if (i2) {
                      const e6 = yield i2.getHeartbeatsHeader();
                      e6 && a3.append("x-firebase-client", e6);
                    }
                    const s2 = {
                      fid: n6,
                      authVersion: In,
                      appId: e5.appId,
                      sdkVersion: Cn
                    }, o2 = {
                      method: "POST",
                      headers: a3,
                      body: JSON.stringify(s2)
                    }, u2 = yield Nn(() => fetch(r4, o2));
                    if (u2.ok) {
                      const e6 = yield u2.json();
                      return {
                        fid: e6.fid || n6,
                        registrationStatus: 2,
                        refreshToken: e6.refreshToken,
                        authToken: Tn(e6.authToken)
                      };
                    }
                    throw yield Dn("Create Installation", u2);
                  });
                }(e4, t4);
                return Un(e4.appConfig, n5);
              } catch (n5) {
                throw yn(n5) && 409 === n5.customData.serverCode ? yield Gn(e4.appConfig) : yield Un(e4.appConfig, {
                  fid: t4.fid,
                  registrationStatus: 0
                }), n5;
              }
            });
          }(e3, n4);
          return {
            installationEntry: n4,
            registrationPromise: r3
          };
        }
        return 1 === t3.registrationStatus ? {
          installationEntry: t3,
          registrationPromise: _n(e3)
        } : {
          installationEntry: t3
        };
      }(e2, r2);
      return t2 = a2.registrationPromise, a2.installationEntry;
    });
    return "" === n2.fid ? {
      installationEntry: yield t2
    } : {
      installationEntry: n2,
      registrationPromise: t2
    };
  });
}
function _n(e2) {
  return __async(this, null, function* () {
    let t2 = yield zn(e2.appConfig);
    for (; 1 === t2.registrationStatus; ) yield Mn(100), t2 = yield zn(e2.appConfig);
    if (0 === t2.registrationStatus) {
      const {
        installationEntry: t3,
        registrationPromise: n2
      } = yield Vn(e2);
      return n2 || t3;
    }
    return t2;
  });
}
function zn(e2) {
  return Yn(e2, (e3) => {
    if (!e3) throw Sn.create("installation-not-found");
    return Zn(e3);
  });
}
function Zn(e2) {
  return 1 === (t2 = e2).registrationStatus && t2.registrationTime + 1e4 < Date.now() ? {
    fid: e2.fid,
    registrationStatus: 0
  } : e2;
  var t2;
}
function xn(_0, _1) {
  return __async(this, arguments, function* ({
    appConfig: e2,
    heartbeatServiceProvider: t2
  }, n2) {
    const r2 = function(e3, {
      fid: t3
    }) {
      return `${gn(e3)}/${t3}/authTokens:generate`;
    }(e2, n2), a2 = function(e3, {
      refreshToken: t3
    }) {
      const n3 = Rn(e3);
      return n3.append("Authorization", function(e4) {
        return `${In} ${e4}`;
      }(t3)), n3;
    }(e2, n2), i2 = t2.getImmediate({
      optional: true
    });
    if (i2) {
      const e3 = yield i2.getHeartbeatsHeader();
      e3 && a2.append("x-firebase-client", e3);
    }
    const s2 = {
      installation: {
        sdkVersion: Cn,
        appId: e2.appId
      }
    }, o2 = {
      method: "POST",
      headers: a2,
      body: JSON.stringify(s2)
    }, u2 = yield Nn(() => fetch(r2, o2));
    if (u2.ok) return Tn(yield u2.json());
    throw yield Dn("Generate Auth Token", u2);
  });
}
function kn(e2, t2 = false) {
  return __async(this, null, function* () {
    let n2;
    const r2 = yield Yn(e2.appConfig, (r3) => {
      if (!Kn(r3)) throw Sn.create("not-registered");
      const a2 = r3.authToken;
      if (!t2 && 2 === (i2 = a2).requestStatus && !function(e3) {
        const t3 = Date.now();
        return t3 < e3.creationTime || e3.creationTime + e3.expiresIn < t3 + 36e5;
      }(i2)) return r3;
      var i2;
      if (1 === a2.requestStatus) return n2 = function(e3, t3) {
        return __async(this, null, function* () {
          let n3 = yield Jn(e3.appConfig);
          for (; 1 === n3.authToken.requestStatus; ) yield Mn(100), n3 = yield Jn(e3.appConfig);
          const r4 = n3.authToken;
          return 0 === r4.requestStatus ? kn(e3, t3) : r4;
        });
      }(e2, t2), r3;
      {
        if (!navigator.onLine) throw Sn.create("app-offline");
        const t3 = function(e3) {
          const t4 = {
            requestStatus: 1,
            requestTime: Date.now()
          };
          return Object.assign(Object.assign({}, e3), {
            authToken: t4
          });
        }(r3);
        return n2 = function(e3, t4) {
          return __async(this, null, function* () {
            try {
              const n3 = yield xn(e3, t4), r4 = Object.assign(Object.assign({}, t4), {
                authToken: n3
              });
              return yield Un(e3.appConfig, r4), n3;
            } catch (n3) {
              if (!yn(n3) || 401 !== n3.customData.serverCode && 404 !== n3.customData.serverCode) {
                const n4 = Object.assign(Object.assign({}, t4), {
                  authToken: {
                    requestStatus: 0
                  }
                });
                yield Un(e3.appConfig, n4);
              } else yield Gn(e3.appConfig);
              throw n3;
            }
          });
        }(e2, t3), t3;
      }
    });
    return n2 ? yield n2 : r2.authToken;
  });
}
function Jn(e2) {
  return Yn(e2, (e3) => {
    if (!Kn(e3)) throw Sn.create("not-registered");
    return 1 === (t2 = e3.authToken).requestStatus && t2.requestTime + 1e4 < Date.now() ? Object.assign(Object.assign({}, e3), {
      authToken: {
        requestStatus: 0
      }
    }) : e3;
    var t2;
  });
}
function Kn(e2) {
  return void 0 !== e2 && 2 === e2.registrationStatus;
}
function qn(e2) {
  return Sn.create("missing-app-config-values", {
    valueName: e2
  });
}
var Xn = "installations";
en(new Ze(Xn, (e2) => {
  const t2 = e2.getProvider("app").getImmediate(), n2 = function(e3) {
    if (!e3 || !e3.options) throw qn("App Configuration");
    if (!e3.name) throw qn("App Name");
    const t3 = ["projectId", "apiKey", "appId"];
    for (const n3 of t3) if (!e3.options[n3]) throw qn(n3);
    return {
      appName: e3.name,
      projectId: e3.options.projectId,
      apiKey: e3.options.apiKey,
      appId: e3.options.appId
    };
  }(t2);
  return {
    app: t2,
    appConfig: n2,
    heartbeatServiceProvider: tn(t2, "heartbeat"),
    _delete: () => Promise.resolve()
  };
}, "PUBLIC")), en(new Ze("installations-internal", (e2) => {
  const t2 = tn(e2.getProvider("app").getImmediate(), Xn).getImmediate();
  return {
    getId: () => function(e3) {
      return __async(this, null, function* () {
        const t3 = e3, {
          installationEntry: n2,
          registrationPromise: r2
        } = yield Vn(t3);
        return r2 ? r2.catch(console.error) : kn(t3).catch(console.error), n2.fid;
      });
    }(t2),
    getToken: (e3) => function(e4, t3 = false) {
      return __async(this, null, function* () {
        const n2 = e4;
        return yield function(e5) {
          return __async(this, null, function* () {
            const {
              registrationPromise: t4
            } = yield Vn(e5);
            t4 && (yield t4);
          });
        }(n2), (yield kn(n2, t3)).token;
      });
    }(t2, e3)
  };
}, "PRIVATE")), sn(mn, cn), sn(mn, cn, "esm2017");
var jn = "analytics";
var $n = "https://www.googletagmanager.com/gtag/js";
var Qn = new et("@firebase/analytics");
var er = new Ue("analytics", "Analytics", {
  "already-exists": "A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.",
  "already-initialized": "initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.",
  "already-initialized-settings": "Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.",
  "interop-component-reg-failed": "Firebase Analytics Interop Component failed to instantiate: {$reason}",
  "invalid-analytics-context": "Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  "indexeddb-unavailable": "IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  "fetch-throttle": "The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.",
  "config-fetch-failed": "Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}",
  "no-api-key": 'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',
  "no-app-id": 'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',
  "no-client-id": 'The "client_id" field is empty.',
  "invalid-gtag-resource": "Trusted Types detected an invalid gtag resource: {$gtagURL}."
});
function tr(e2) {
  if (!e2.startsWith($n)) {
    const t2 = er.create("invalid-gtag-resource", {
      gtagURL: e2
    });
    return Qn.warn(t2.message), "";
  }
  return e2;
}
function nr(e2) {
  return Promise.all(e2.map((e3) => e3.catch((e4) => e4)));
}
var rr = new class {
  constructor(e2 = {}, t2 = 1e3) {
    this.throttleMetadata = e2, this.intervalMillis = t2;
  }
  getThrottleMetadata(e2) {
    return this.throttleMetadata[e2];
  }
  setThrottleMetadata(e2, t2) {
    this.throttleMetadata[e2] = t2;
  }
  deleteThrottleMetadata(e2) {
    delete this.throttleMetadata[e2];
  }
}();
function ar(e2) {
  return new Headers({
    Accept: "application/json",
    "x-goog-api-key": e2
  });
}
function ir(_0) {
  return __async(this, arguments, function* (e2, t2 = rr, n2) {
    const {
      appId: r2,
      apiKey: a2,
      measurementId: i2
    } = e2.options;
    if (!r2) throw er.create("no-app-id");
    if (!a2) {
      if (i2) return {
        measurementId: i2,
        appId: r2
      };
      throw er.create("no-api-key");
    }
    const s2 = t2.getThrottleMetadata(r2) || {
      backoffCount: 0,
      throttleEndTimeMillis: Date.now()
    }, o2 = new or();
    return setTimeout(() => __async(this, null, function* () {
      o2.abort();
    }), void 0 !== n2 ? n2 : 6e4), sr({
      appId: r2,
      apiKey: a2,
      measurementId: i2
    }, s2, o2, t2);
  });
}
function sr(_0, _1, _2) {
  return __async(this, arguments, function* (e2, {
    throttleEndTimeMillis: t2,
    backoffCount: n2
  }, r2, a2 = rr) {
    var i2;
    const {
      appId: s2,
      measurementId: o2
    } = e2;
    try {
      yield function(e3, t3) {
        return new Promise((n3, r3) => {
          const a3 = Math.max(t3 - Date.now(), 0), i3 = setTimeout(n3, a3);
          e3.addEventListener(() => {
            clearTimeout(i3), r3(er.create("fetch-throttle", {
              throttleEndTimeMillis: t3
            }));
          });
        });
      }(r2, t2);
    } catch (e3) {
      if (o2) return Qn.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${o2} provided in the "measurementId" field in the local Firebase config. [${null == e3 ? void 0 : e3.message}]`), {
        appId: s2,
        measurementId: o2
      };
      throw e3;
    }
    try {
      const t3 = yield function(e3) {
        return __async(this, null, function* () {
          var t4;
          const {
            appId: n3,
            apiKey: r3
          } = e3, a3 = {
            method: "GET",
            headers: ar(r3)
          }, i3 = "https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig".replace("{app-id}", n3), s3 = yield fetch(i3, a3);
          if (200 !== s3.status && 304 !== s3.status) {
            let e4 = "";
            try {
              const n4 = yield s3.json();
              (null === (t4 = n4.error) || void 0 === t4 ? void 0 : t4.message) && (e4 = n4.error.message);
            } catch (e5) {
            }
            throw er.create("config-fetch-failed", {
              httpStatus: s3.status,
              responseMessage: e4
            });
          }
          return s3.json();
        });
      }(e2);
      return a2.deleteThrottleMetadata(s2), t3;
    } catch (t3) {
      const u2 = t3;
      if (!function(e3) {
        if (!(e3 instanceof He && e3.customData)) return false;
        const t4 = Number(e3.customData.httpStatus);
        return 429 === t4 || 500 === t4 || 503 === t4 || 504 === t4;
      }(u2)) {
        if (a2.deleteThrottleMetadata(s2), o2) return Qn.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${o2} provided in the "measurementId" field in the local Firebase config. [${null == u2 ? void 0 : u2.message}]`), {
          appId: s2,
          measurementId: o2
        };
        throw t3;
      }
      const l2 = 503 === Number(null === (i2 = null == u2 ? void 0 : u2.customData) || void 0 === i2 ? void 0 : i2.httpStatus) ? _e(n2, a2.intervalMillis, 30) : _e(n2, a2.intervalMillis), d2 = {
        throttleEndTimeMillis: Date.now() + l2,
        backoffCount: n2 + 1
      };
      return a2.setThrottleMetadata(s2, d2), Qn.debug(`Calling attemptFetch again in ${l2} millis`), sr(e2, d2, r2, a2);
    }
  });
}
var or = class {
  constructor() {
    this.listeners = [];
  }
  addEventListener(e2) {
    this.listeners.push(e2);
  }
  abort() {
    this.listeners.forEach((e2) => e2());
  }
};
var ur;
var lr;
function dr(e2, t2, n2, r2, a2, i2, s2) {
  return __async(this, null, function* () {
    var o2;
    const u2 = ir(e2);
    u2.then((t3) => {
      n2[t3.measurementId] = t3.appId, e2.options.measurementId && t3.measurementId !== e2.options.measurementId && Qn.warn(`The measurement ID in the local Firebase config (${e2.options.measurementId}) does not match the measurement ID fetched from the server (${t3.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`);
    }).catch((e3) => Qn.error(e3)), t2.push(u2);
    const l2 = function() {
      return __async(this, null, function* () {
        if (!we()) return Qn.warn(er.create("indexeddb-unavailable", {
          errorInfo: "IndexedDB is not available in this environment."
        }).message), false;
        try {
          yield We();
        } catch (e3) {
          return Qn.warn(er.create("indexeddb-unavailable", {
            errorInfo: null == e3 ? void 0 : e3.toString()
          }).message), false;
        }
        return true;
      });
    }().then((e3) => e3 ? r2.getId() : void 0), [d2, f2] = yield Promise.all([u2, l2]);
    (function(e3) {
      const t3 = window.document.getElementsByTagName("script");
      for (const n3 of Object.values(t3)) if (n3.src && n3.src.includes($n) && n3.src.includes(e3)) return n3;
      return null;
    })(i2) || function(e3, t3) {
      const n3 = function(e4, t4) {
        let n4;
        return window.trustedTypes && (n4 = window.trustedTypes.createPolicy("firebase-js-sdk-policy", t4)), n4;
      }(0, {
        createScriptURL: tr
      }), r3 = document.createElement("script"), a3 = `${$n}?l=${e3}&id=${t3}`;
      r3.src = n3 ? null == n3 ? void 0 : n3.createScriptURL(a3) : a3, r3.async = true, document.head.appendChild(r3);
    }(i2, d2.measurementId), lr && (a2("consent", "default", lr), lr = void 0), a2("js", /* @__PURE__ */ new Date());
    const p2 = null !== (o2 = null == s2 ? void 0 : s2.config) && void 0 !== o2 ? o2 : {};
    return p2.origin = "firebase", p2.update = true, null != f2 && (p2.firebase_id = f2), a2("config", d2.measurementId, p2), ur && (a2("set", ur), ur = void 0), d2.measurementId;
  });
}
var fr = class {
  constructor(e2) {
    this.app = e2;
  }
  _delete() {
    return delete pr[this.app.options.appId], Promise.resolve();
  }
};
var pr = {};
var br = [];
var hr = {};
var Pr;
var mr;
var cr = "dataLayer";
var Cr = false;
function Ir(e2, t2, n2) {
  !function() {
    const e3 = [];
    if (Fe() && e3.push("This is a browser extension environment."), ve() || e3.push("Cookies are not available."), e3.length > 0) {
      const t3 = e3.map((e4, t4) => `(${t4 + 1}) ${e4}`).join(" "), n3 = er.create("invalid-analytics-context", {
        errorInfo: t3
      });
      Qn.warn(n3.message);
    }
  }();
  const r2 = e2.options.appId;
  if (!r2) throw er.create("no-app-id");
  if (!e2.options.apiKey) {
    if (!e2.options.measurementId) throw er.create("no-api-key");
    Qn.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e2.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);
  }
  if (null != pr[r2]) throw er.create("already-exists", {
    id: r2
  });
  if (!Cr) {
    !function(e4) {
      let t4 = [];
      Array.isArray(window[e4]) ? t4 = window[e4] : window[e4] = t4;
    }(cr);
    const {
      wrappedGtag: e3,
      gtagCore: t3
    } = function(e4, t4, n3, r3, a2) {
      let i2 = function(...e5) {
        window[r3].push(arguments);
      };
      return window[a2] && "function" == typeof window[a2] && (i2 = window[a2]), window[a2] = /* @__PURE__ */ function(e5, t5, n4, r4) {
        return function(a3, ...i3) {
          return __async(this, null, function* () {
            try {
              if ("event" === a3) {
                const [r5, a4] = i3;
                yield function(e6, t6, n5, r6, a5) {
                  return __async(this, null, function* () {
                    try {
                      let i4 = [];
                      if (a5 && a5.send_to) {
                        let e7 = a5.send_to;
                        Array.isArray(e7) || (e7 = [e7]);
                        const r7 = yield nr(n5);
                        for (const n6 of e7) {
                          const e8 = r7.find((e9) => e9.measurementId === n6), a6 = e8 && t6[e8.appId];
                          if (!a6) {
                            i4 = [];
                            break;
                          }
                          i4.push(a6);
                        }
                      }
                      0 === i4.length && (i4 = Object.values(t6)), yield Promise.all(i4), e6("event", r6, a5 || {});
                    } catch (e7) {
                      Qn.error(e7);
                    }
                  });
                }(e5, t5, n4, r5, a4);
              } else if ("config" === a3) {
                const [a4, s2] = i3;
                yield function(e6, t6, n5, r5, a5, i4) {
                  return __async(this, null, function* () {
                    const s3 = r5[a5];
                    try {
                      if (s3) yield t6[s3];
                      else {
                        const e7 = (yield nr(n5)).find((e8) => e8.measurementId === a5);
                        e7 && (yield t6[e7.appId]);
                      }
                    } catch (e7) {
                      Qn.error(e7);
                    }
                    e6("config", a5, i4);
                  });
                }(e5, t5, n4, r4, a4, s2);
              } else if ("consent" === a3) {
                const [t6, n5] = i3;
                e5("consent", t6, n5);
              } else if ("get" === a3) {
                const [t6, n5, r5] = i3;
                e5("get", t6, n5, r5);
              } else if ("set" === a3) {
                const [t6] = i3;
                e5("set", t6);
              } else e5(a3, ...i3);
            } catch (e6) {
              Qn.error(e6);
            }
          });
        };
      }(i2, e4, t4, n3), {
        gtagCore: i2,
        wrappedGtag: window[a2]
      };
    }(pr, br, hr, cr, "gtag");
    mr = e3, Pr = t3, Cr = true;
  }
  return pr[r2] = dr(e2, br, hr, t2, Pr, cr, n2), new fr(e2);
}
function Sr(e2, t2, n2, r2) {
  e2 = ze(e2), function(e3, t3, n3, r3, a2) {
    return __async(this, null, function* () {
      if (a2 && a2.global) e3("event", n3, r3);
      else {
        const a3 = yield t3;
        e3("event", n3, Object.assign(Object.assign({}, r3), {
          send_to: a3
        }));
      }
    });
  }(mr, pr[e2.app.options.appId], t2, n2, r2).catch((e3) => Qn.error(e3));
}
var yr = "@firebase/analytics";
var gr = "0.10.8";
en(new Ze(jn, (e2, {
  options: t2
}) => Ir(e2.getProvider("app").getImmediate(), e2.getProvider("installations-internal").getImmediate(), t2), "PUBLIC")), en(new Ze("analytics-internal", function(e2) {
  try {
    const t2 = e2.getProvider(jn).getImmediate();
    return {
      logEvent: (e3, n2, r2) => Sr(t2, e3, n2, r2)
    };
  } catch (e3) {
    throw er.create("interop-component-reg-failed", {
      reason: e3
    });
  }
}, "PRIVATE")), sn(yr, gr), sn(yr, gr, "esm2017");
var Tr = "WebSDK";
var Dr = "PrinterSerialNumber";
var Rr = "PrinterFirmwareVersion";
var Nr = "PrinterCatalogNumber";
var Mr = "PartInPrinterYNumber";
var Or = "PartInPrinterName";
var Lr = "LabelHeightWidth";
var Ar = "PrintCopies";
var Er = "PrintCutOption";
var Br = "OSVersion";
var Fr = "DeviceModel";
var wr = "IPAddress";
var Wr = "Collated";
var vr = "Protocol";
var Hr = "PrintedAsTemplate";
var Ur = "SdkVersion";
var Gr = "PrintJobLength";
var Yr = "PrintActionSuperEvent";
sn("firebase", "10.14.1", "app");
var Vr = an({
  apiKey: "AIzaSyC1wiTZZF06G7VEOhmG0wlIBUFKB4J8CDc",
  authDomain: "sdk-web-prod.firebaseapp.com",
  projectId: "sdk-web-prod",
  storageBucket: "sdk-web-prod",
  messagingSenderId: "1042846884346",
  appId: "1:1042846884346:web:9979f482392b69a0a28443",
  measurementId: "G-V3D9DJRFER"
});
var _r = (e2) => {
  return t2 = void 0, n2 = void 0, a2 = function* () {
    let t3 = null;
    const n3 = yield function() {
      return __async(this, null, function* () {
        if (Fe()) return false;
        if (!ve()) return false;
        if (!we()) return false;
        try {
          return yield We();
        } catch (e3) {
          return false;
        }
      });
    }();
    return n3 && (t3 = function(e3 = function(e4 = Kt) {
      const t4 = Xt.get(e4);
      if (!t4 && e4 === Kt && Ee()) return an();
      if (!t4) throw nn.create("no-app", {
        appName: e4
      });
      return t4;
    }()) {
      const t4 = tn(e3 = ze(e3), jn);
      return t4.isInitialized() ? t4.getImmediate() : function(e4, t5 = {}) {
        const n4 = tn(e4, jn);
        if (n4.isInitialized()) {
          const e5 = n4.getImmediate();
          if (Ye(t5, n4.getOptions())) return e5;
          throw er.create("already-initialized");
        }
        return n4.initialize({
          options: t5
        });
      }(e3);
    }(Vr), a3 = !(!t3 || !n3 || false === e2), r3 = ze(r3 = t3), function(e3, t4) {
      return __async(this, null, function* () {
        const n4 = yield e3;
        window[`ga-disable-${n4}`] = !t4;
      });
    }(pr[r3.app.options.appId], a3).catch((e3) => Qn.error(e3))), t3;
    var r3, a3;
  }, new ((r2 = void 0) || (r2 = Promise))(function(e3, i2) {
    function s2(e4) {
      try {
        u2(a2.next(e4));
      } catch (e5) {
        i2(e5);
      }
    }
    function o2(e4) {
      try {
        u2(a2.throw(e4));
      } catch (e5) {
        i2(e5);
      }
    }
    function u2(t3) {
      var n3;
      t3.done ? e3(t3.value) : (n3 = t3.value, n3 instanceof r2 ? n3 : new r2(function(e4) {
        e4(n3);
      })).then(s2, o2);
    }
    u2((a2 = a2.apply(t2, n2 || [])).next());
  });
  var t2, n2, r2, a2;
};
var zr = function(e2, t2, n2, r2) {
  return new (n2 || (n2 = Promise))(function(a2, i2) {
    function s2(e3) {
      try {
        u2(r2.next(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function o2(e3) {
      try {
        u2(r2.throw(e3));
      } catch (e4) {
        i2(e4);
      }
    }
    function u2(e3) {
      var t3;
      e3.done ? a2(e3.value) : (t3 = e3.value, t3 instanceof n2 ? t3 : new n2(function(e4) {
        e4(t3);
      })).then(s2, o2);
    }
    u2((r2 = r2.apply(e2, t2 || [])).next());
  });
};
var Zr = class {
  constructor(e2, t2) {
    this.printerDiscovery = new ue(this), this.printerUpdatesCallback = e2, this.printOptions = new Re(), this.initializeAnalytics(t2);
  }
  showDiscoveredBleDevices() {
    return zr(this, void 0, void 0, function* () {
      const e2 = localStorage.getItem("ownershipID"), t2 = yield this.printerDiscovery.startBlePrinterDiscovery(e2);
      return !(null == t2 || !this.isConnected() || (localStorage.setItem("ownershipID", t2), 0));
    });
  }
  initializeAnalytics(e2) {
    return zr(this, void 0, void 0, function* () {
      false !== e2 && "undefined" != typeof localStorage && (this.analytics = yield _r(e2), null == localStorage.getItem("user_id") || "" == localStorage.getItem("user_id") ? (this.userId = g(), localStorage.setItem("user_id", this.userId)) : this.userId = localStorage.getItem("user_id"));
    });
  }
  isConnected() {
    return this.printerDiscovery.isConnected;
  }
  isSupportedBrowser() {
    return !(null == navigator.bluetooth || !navigator.bluetooth.getAvailability());
  }
  feed() {
    return zr(this, void 0, void 0, function* () {
      return yield this.printerDiscovery.feed();
    });
  }
  cut() {
    return zr(this, void 0, void 0, function* () {
      return yield this.printerDiscovery.cut();
    });
  }
  printBitmap(t2) {
    return zr(this, arguments, void 0, function* (t3, n2 = 0, a2 = 0) {
      if (this.printerModel !== r.M511 || this.supplyName || (this.supplyName = "M5C-1500-595-WT-BK"), void 0 === this.supplyName && (this.supplyName = ""), void 0 === this.orientation && (this.orientation = e.Landscape), void 0 === this.rotation && (this.rotation = 0), this.printOptions.cutOption !== ae.CutAfterRow || this.printOptions.cutAfterRow || (this.printOptions.cutOption = ae.EndOfJob), null != this.printerModel && null != this.supplyName && null != this.substrateWidth && null != this.substrateHeight) {
        if (Array.isArray(this.zoneDimensions) ? null != this.zoneDimensions[0].width && null != this.zoneDimensions[0].height && (this.substrateWidth = this.zoneDimensions[0].width, this.substrateHeight = this.zoneDimensions[0].height, void 0 !== this.zoneDimensions[0].offsetX && (this.leftOffset = this.zoneDimensions[0].offsetX), void 0 !== this.zoneDimensions[0].offsetY && (this.verticalOffset = this.zoneDimensions[0].offsetY)) : null != this.zoneDimensions.width && null != this.zoneDimensions.height && (this.substrateWidth = this.zoneDimensions.width, this.substrateHeight = this.zoneDimensions.height, this.zoneDimensions.offsetX && (this.leftOffset = this.zoneDimensions.offsetX), this.zoneDimensions.offsetY && (this.verticalOffset = this.zoneDimensions.offsetY)), this.printerModel === r.i7500) {
          if ("MANUAL" === this.supplyName) return void console.log("The Brady Print SDK does not support MANUAL parts for the i7500 printer.");
          null !== this.printerDiscovery.getPostPrintAccessoryType() && "None" !== this.printerDiscovery.getPostPrintAccessoryType() ? (this.postPrintAccessoryType = this.printerDiscovery.getPostPrintAccessoryType(), this.printOptions.usePrinterSettings = "AutoCutter" !== this.printerDiscovery.getPostPrintAccessoryType() || this.printOptions.usePrinterSettings) : this.printOptions.usePrinterSettings ? console.log("CutOption.UsePrinterSettings is not supported on this printer.") : this.printOptions.endOfJobCutOption === ie.CutAfterIndex && console.log("CutOption.CutAfterRow is not supported on this printer.");
        }
        const e2 = new Te(t3, this.printerModel, this.supplyName, this.substrateWidth, this.substrateHeight, this.mediaIsDieCut, this.rotation, this.orientation, this.leftOffset + n2, this.verticalOffset + a2, this.printOptions);
        null != this.printerDiscovery.piclService && null != this.printerDiscovery.piclService.getPrinterDpi() && (e2.xUPI = this.printerDiscovery.piclService.getPrinterDpi(), e2.yUPI = this.printerDiscovery.piclService.getPrinterDpi());
        let i2 = yield e2.setUpThePrintJob();
        if (this.analytics) try {
          let n3 = e2.detectOS(), r2 = e2.detectBrowser();
          this.printActionUUID = g();
          let a3, i3 = yield e2.detectIP();
          switch (this.printOptions.cutOption) {
            case 0:
              a3 = "EndOfJob";
              break;
            case 1:
              a3 = "EndOfLabel";
              break;
            case 2:
              a3 = "Never";
          }
          let s2 = this.calculatePrintJobLength(e2, t3);
          Sr(this.analytics, Nr, {
            user_id: this.userId,
            category: Tr,
            action: Nr,
            label: this.printerModel,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Dr, {
            category: Tr,
            action: Dr,
            label: this.printerDiscovery.bleApi.device.name,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Rr, {
            category: Tr,
            action: Rr,
            label: this.firmwareVersion instanceof C ? this.firmwareVersion.value : this.firmwareVersion,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Mr, {
            category: Tr,
            action: Mr,
            label: this.substrateYNumber,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Or, {
            category: Tr,
            action: Or,
            label: this.supplyName,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Lr, {
            category: Tr,
            action: Lr,
            label: this.supplyDimensions,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Ar, {
            category: Tr,
            action: Ar,
            label: this.printOptions.copies,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Er, {
            category: Tr,
            action: Er,
            label: a3,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Br, {
            category: Tr,
            action: Br,
            label: n3,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Fr, {
            category: Tr,
            action: Fr,
            label: r2,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, wr, {
            category: Tr,
            action: wr,
            label: i3,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Wr, {
            category: Tr,
            action: Wr,
            label: this.printOptions.collate,
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, vr, {
            category: Tr,
            action: vr,
            label: "BLE",
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Hr, {
            category: Tr,
            action: Hr,
            label: "false",
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Ur, {
            category: Tr,
            action: Ur,
            label: "3.1.2",
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          }), Sr(this.analytics, Gr, {
            category: Tr,
            action: Gr,
            label: s2.toString(),
            superEventName: Yr,
            superEventInstance: this.printActionUUID
          });
        } catch (e3) {
          console.error("Failed to log print action to analytics");
        }
        if (null != i2) {
          const e3 = new De(i2, this.printerModel);
          if (this.printerModel === r.M211) {
            let t4, n3 = 0;
            const r2 = e3.print();
            for (; n3 < this.printOptions.copies; ) {
              if (t4 = yield this.printerDiscovery.printBitmap(r2[n3].printJob, r2[n3].documentName), !t4) return false;
              n3++;
            }
            return t4;
          }
          return this.printerModel === r.M511 && (i2 = e3.printMultiple()), yield this.printerDiscovery.printBitmap(i2);
        }
      }
      return false;
    });
  }
  setCopies(e2) {
    this.printOptions.copies = e2;
  }
  setCollate(e2) {
    this.printOptions.collate = e2;
  }
  setCutOption(e2) {
    switch (e2) {
      case ae.EndOfLabel:
        this.printOptions.cutOption = ae.EndOfLabel, this.printOptions.endOfJobCutOption = ie.EndOfLabel, this.printOptions.usePrinterSettings = false;
        break;
      case ae.Never:
        this.printOptions.cutOption = ae.Never, this.printOptions.endOfJobCutOption = ie.Never, this.printOptions.usePrinterSettings = false;
        break;
      case ae.CutAfterRow:
        this.printOptions.endOfJobCutOption = ie.CutAfterIndex, console.log("The CutOption.CutAfterRow will default to CutOption.EndOfJob unless 'setCutAfterRowValue' is called afterwards."), this.printOptions.usePrinterSettings = false;
        break;
      case ae.UsePrinterSettings:
        this.printOptions.endOfJobCutOption = ie.EndOfLabel, this.printOptions.usePrinterSettings = true;
        break;
      case ae.EndOfJob:
      default:
        this.printOptions.cutOption = ae.EndOfJob, this.printOptions.endOfJobCutOption = ie.EndOfJob, this.printOptions.usePrinterSettings = false;
    }
  }
  setCutAfterRowValue(e2) {
    if (!(e2 >= 0) || this.printerModel !== r.M611 && this.printerModel !== r.i7500 && this.printerModel !== r.S3700) return this.printOptions.cutOption = ae.EndOfJob, void console.log("The CutAfterRowValue must be greater than or equal to 0 and be supported by your printer.");
    this.printOptions.cutAfterRow = e2, this.printOptions.cutOption = ae.CutAfterRow;
  }
  disconnect() {
    return zr(this, void 0, void 0, function* () {
      return yield this.printerDiscovery.disconnect();
    });
  }
  calculatePrintJobLength(t2, n2) {
    let a2 = 0;
    if (t2.mediaIsDieCut) a2 = (t2.orientation == e.Portrait ? this.substrateWidth : this.substrateHeight) * this.printOptions.copies;
    else {
      let e2 = 0;
      e2 = this.printerModel == r.M211 ? t2.printTrailer ? 0.87 : 0.435 : 0.125, a2 = (n2.width * this.substrateWidth / n2.height + e2) * this.printOptions.copies;
    }
    return Math.round(100 * a2) / 100;
  }
};
export {
  Zr as default
};
/*! Bundled license information:

@bradycorporation/brady-web-sdk/dist/bundle.js:
  (*! For license information please see bundle.js.LICENSE.txt *)
*/
//# sourceMappingURL=chunk-ADEMXE7I.mjs.map
