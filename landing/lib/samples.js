// Code samples of the landing page. They use the public API of sheetsmith 1.0.0 as written in
// its sources: keep them in line with the library when its API changes.

/** The annotated class of the showcase. Its preset and accent are changed by the page. */
export const showcaseClass = `@ExcelSheet(
        title = "Q3 2026 invoices",
        preset = TablePreset.MEDIUM,
        accentColor = "#1F4E79",
        autoFilter = true)
public record InvoiceRow(
        @ExcelColumn(header = "Invoice", order = 10)
        String number,
        @ExcelColumn(header = "Customer", order = 20)
        String customer,
        @ExcelColumn(header = "Issued", order = 30,
                format = "dd/mm/yyyy")
        LocalDate issued,
        @ExcelColumn(header = "Amount", order = 40,
                format = "#,##0.00")
        BigDecimal amount) {
}

// the sheet name is given when generating
sheetsmith.generate(List.of(
        SheetData.of("Invoices", InvoiceRow.class, rows)));`;

/** Region of the sample sheet controlled by each line of the showcase class, by line number. */
export const showcaseRegions = {
	2: 'title',
	3: 'preset',
	4: 'accent',
	5: 'filter',
	7: 'colA',
	8: 'colA',
	9: 'colB',
	10: 'colB',
	11: 'colC',
	12: 'colC',
	13: 'colC',
	14: 'colD',
	15: 'colD',
	16: 'colD',
	20: 'tab',
	21: 'tab',
};

/** Data rows of the sample sheet, as Excel shows them with the formats of the class. */
export const showcaseRows = [
	['INV-0418', 'Northwind Logistics', '03/07/2026', '12,480.00'],
	['INV-0419', 'Brightline Studio', '11/07/2026', '3,250.50'],
	['INV-0420', 'Halden & Co.', '24/07/2026', '8,912.00'],
	['INV-0421', 'Meridian Foods', '06/08/2026', '1,740.25'],
	['INV-0422', 'Corvo Systems', '19/09/2026', '21,005.00'],
];
export const showcaseHeaders = ['Invoice', 'Customer', 'Issued', 'Amount'];
export const showcaseTitle = 'Q3 2026 invoices';
export const showcaseSheet = 'Invoices';

export const dependency = `<dependency>
    <groupId>cloud.baldilorenzo</groupId>
    <artifactId>sheetsmith-spring-boot-starter</artifactId>
    <version>{{release}}</version>
</dependency>`;

export const output = `// one SheetData per tab: sheet name, sheet class, rows
List<SheetData<?>> sheets = List.of(
        SheetData.of("Invoices", InvoiceRow.class, invoices),
        SheetData.of("Customers", CustomerRow.class, customers));

// the whole workbook in memory
byte[] file = sheetsmith.generate(sheets);

// or written straight to a stream, such as an HTTP response:
// the stream is flushed, never closed
sheetsmith.generate(sheets, response.getOutputStream());`;

export const styleSheet = `// named styles, defined once for the whole company
@ExcelStyleSheet
@ExcelStyle(name = "header", bold = Toggle.TRUE,
        fillColor = "#1F4E79", fontColor = "#FFFFFF")
@ExcelStyle(name = "zebra", fillColor = "#EEF3F8")
public final class CorporateStyles {

    private CorporateStyles() {
    }
}`;

export const styleSheetUse = `// any sheet class references them by name
@ExcelSheet(
        styleSheets = CorporateStyles.class,
        header = @HeaderStyles(base = "header"),
        body = @BodyStyles(odd = "zebra"))
public record InvoiceLine(
        @ExcelColumn(header = "Description", order = 10)
        String description) {
}`;

export const beanConverter = `// declared as a bean: applies to every Money column, in every sheet
@Component
public class MoneyConverter implements CellConverter<Money> {

    @Override
    public CellValue convert(Money value, ConversionContext context) {
        return CellValue.number(value.amount().doubleValue());
    }
}`;

export const fieldConverter = `// a plain class, not a bean: the library creates it for this column
public class UuidConverter implements CellConverter<UUID> {

    @Override
    public CellValue convert(UUID value, ConversionContext context) {
        return CellValue.text(value.toString());
    }
}

@ExcelSheet
public record DocumentRow(
        // declared on the field: applies to this column only
        @ExcelColumn(header = "Id", order = 10,
                converter = UuidConverter.class)
        UUID id,
        @ExcelColumn(header = "Title", order = 20)
        String title) {
}`;

export const springService = `// the starter registers a Sheetsmith bean: inject it where you need it
@Service
public class ReportService {

    private final Sheetsmith sheetsmith;

    public ReportService(Sheetsmith sheetsmith) {
        this.sheetsmith = sheetsmith;
    }
}`;

export const springProperties = `# defaults for every sheet class that declares no preset or accent colour
sheetsmith:
  preset: MEDIUM
  accent-color: "#1F4E79"`;

export const plainJava = `// without Spring: depend on sheetsmith-core and build the generator
Sheetsmith sheetsmith = Sheetsmith.builder().build();`;
