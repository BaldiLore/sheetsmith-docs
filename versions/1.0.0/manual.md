# sheetsmith User Manual

**Version covered:** 1.0.0
**Audience:** Java developers who generate Excel files from their applications
**Status of this document:** reference manual of the library. Where this manual and the source code disagree, the source code is authoritative and the manual must be corrected.

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Quick start](#2-quick-start)
3. [Concepts](#3-concepts)
4. [Annotation reference](#4-annotation-reference)
5. [API reference](#5-api-reference)
6. [Styling](#6-styling)
7. [Presets](#7-presets)
8. [Shared styles and corporate style](#8-shared-styles-and-corporate-style)
9. [Converters](#9-converters)
10. [Spring Boot integration and configuration properties](#10-spring-boot-integration-and-configuration-properties)
11. [Validation and errors](#11-validation-and-errors)
12. [Limits and known behaviours](#12-limits-and-known-behaviours)
13. [Recipes](#13-recipes)
14. [FAQ and troubleshooting](#14-faq-and-troubleshooting)
15. [Work in progress](#15-work-in-progress)
16. [Appendix A: class census](#appendix-a-class-census)
17. [Appendix B: value domains](#appendix-b-value-domains)
18. [Appendix C: glossary](#appendix-c-glossary)

---

## 1. Introduction

### 1.1 What sheetsmith is

sheetsmith is an open source Java library that generates Excel files in the `.xlsx` format from lists of Java objects. It is built on Apache POI and integrates with Spring Boot through an auto-configuration, while its core works in any Java application.

The structure and the appearance of each sheet are described once, with annotations placed on a Java class called the **sheet class**. The content of each sheet comes from the objects passed at runtime, one object per data row. The library then writes the title, the header row, the data rows, the styles, the formats and the layout options, and returns the file.

### 1.2 What sheetsmith does

sheetsmith provides the following capabilities in version 1.0.0.

| Capability | Description |
| --- | --- |
| Generation component | A single component, `Sheetsmith`, that generates a complete workbook and either returns it as a `byte[]` or writes it to an `OutputStream` supplied by the caller. |
| Multi-sheet workbooks | One workbook can contain any number of sheets, each with its own sheet class, in the order chosen by the caller. |
| Annotation model | Eight annotations describe the sheet, its columns, its named styles, its shared style sheets and the places where styles apply. |
| Opt-in columns | Only fields explicitly annotated become columns. Records, classes and inherited fields are supported. |
| Mandatory, stable column order | Every column declares its position, so the order never depends on reflection. |
| Complete styling | Every cell formatting attribute exposed by Apache POI can be declared: alignment, wrapping, rotation, indentation, borders and border colours, fills, fonts, data formats, protection flags and quote prefix. |
| Role-based styling | Styles can target every data cell, odd and even rows, the first and last data row, the first and last column, a single column, the header, the header of a single column and the title. |
| Deterministic cascade | Styles combine attribute by attribute following a fixed, documented order, so the result of any combination is predictable. |
| Presets | Three ready-made table styles (`LIGHT`, `MEDIUM`, `DARK`) generated from a single accent colour, which can be partially overridden. |
| Shared style sheets | Named styles can be declared once in a style sheet class and reused by any number of sheet classes, which allows every report of an application or an organisation to share the same corporate look. |
| Native cell types | Text, numbers, booleans, enums, `LocalDate` and `LocalDateTime` are written as native Excel values. |
| Converters | Any other type is supported through converters, declared on a single column or registered for a type across the whole application. |
| Default formats | Application-wide default formats for dates, date-times and numbers, applied when a cell has no explicit format. |
| Layout options | Optional title row merged across the table, frozen header, auto-filter, explicit column widths, automatic column sizing with a fallback for environments without fonts, and an outer frame around the table. |
| Document properties | Configurable author and application recorded in every generated file. |
| Fail-fast validation | Twenty validation rules (V-01 to V-20) detect configuration mistakes before anything is written. All errors are reported together, with a stable code, the class and the element involved. |
| Startup validation | In Spring Boot applications, the sheet classes of chosen packages can be validated when the application starts. |
| Precise runtime errors | Data problems are reported with the sheet name, the data row and the field. |
| Thread safety | A generator is immutable and thread-safe, and caches the metadata of each sheet class after the first use. |

### 1.3 Scope of version 1.0.0

Version 1.0.0 writes `.xlsx` files only and builds each workbook entirely in memory before writing it. The following are not part of the library: reading Excel files, the legacy `.xls` format, formulas, charts, images, conditional formatting, data validation, cell comments, sheet protection, native Excel tables and translation of header texts. Header texts are written exactly as declared, so localisation, when needed, is performed by the application before or around the generation.

Planned and evaluated evolutions are listed in [section 15](#15-work-in-progress).

### 1.4 Requirements

| Requirement | Value |
| --- | --- |
| Java | 17 or later |
| Spring Boot | 4.x, only for the Spring Boot integration |
| Apache POI | brought transitively by `sheetsmith-core` (POI 5.5.1 for sheetsmith 1.0.0) |
| Output format | `.xlsx` (Office Open XML) |

### 1.5 Modules and coordinates

The library is published as three Maven artifacts under the group `cloud.baldilorenzo.sheetsmith`.

| Artifact | Content | Depends on Spring |
| --- | --- | --- |
| `sheetsmith-core` | Annotations, metadata extraction and validation, style resolution, presets, converters, workbook writing. | No |
| `sheetsmith-spring-boot-autoconfigure` | The auto-configuration: the `Sheetsmith` bean, the `sheetsmith.*` properties, the Spring converter factory, the startup validator. | Yes |
| `sheetsmith-spring-boot-starter` | No code. It brings the two modules above and `spring-boot-starter`. | Yes |

**Which artifact to import.**

- A Spring Boot application imports only the starter:

```xml
<dependency>
    <groupId>cloud.baldilorenzo.sheetsmith</groupId>
    <artifactId>sheetsmith-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

- Any other Java application imports only the core:

```xml
<dependency>
    <groupId>cloud.baldilorenzo.sheetsmith</groupId>
    <artifactId>sheetsmith-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

With Gradle, the coordinates are the same: `implementation("cloud.baldilorenzo.sheetsmith:sheetsmith-spring-boot-starter:1.0.0")` or `implementation("cloud.baldilorenzo.sheetsmith:sheetsmith-core:1.0.0")`.

The `sheetsmith-spring-boot-autoconfigure` artifact is not meant to be imported directly.

### 1.6 Packages

| Package | Content |
| --- | --- |
| `cloud.baldilorenzo.sheetsmith` | The generator, the sheet data, the application defaults, the document properties and the exceptions. |
| `cloud.baldilorenzo.sheetsmith.annotation` | The annotations that describe a sheet class. |
| `cloud.baldilorenzo.sheetsmith.style` | The enums used as style attribute values, and the presets. |
| `cloud.baldilorenzo.sheetsmith.convert` | The converter contract and the cell values. |
| `cloud.baldilorenzo.sheetsmith.autoconfigure` | The Spring Boot auto-configuration (in `sheetsmith-spring-boot-autoconfigure`). |
| `cloud.baldilorenzo.sheetsmith.internal` and subpackages | Implementation. Not part of the API: see [Appendix A](#appendix-a-class-census). |

---

## 2. Quick start

### 2.1 Spring Boot application

**Step 1. Add the starter** as shown in [section 1.5](#15-modules-and-coordinates). No configuration is required: the auto-configuration registers a `Sheetsmith` bean.

**Step 2. Describe the sheet** with a sheet class. A record is the most compact form:

```java
import cloud.baldilorenzo.sheetsmith.annotation.ExcelColumn;
import cloud.baldilorenzo.sheetsmith.annotation.ExcelSheet;
import cloud.baldilorenzo.sheetsmith.style.TablePreset;

import java.math.BigDecimal;
import java.time.LocalDate;

@ExcelSheet(title = "Customers", preset = TablePreset.MEDIUM, accentColor = "#1F4E79", autoFilter = true)
public record CustomerRow(
        @ExcelColumn(header = "Code", order = 10, width = 12) String code,
        @ExcelColumn(header = "Name", order = 20) String name,
        @ExcelColumn(header = "Customer since", order = 30, format = "dd/mm/yyyy") LocalDate since,
        @ExcelColumn(header = "Revenue", order = 40, format = "#,##0.00") BigDecimal revenue) {
}
```

**Step 3. Inject the bean and generate the file:**

```java
import cloud.baldilorenzo.sheetsmith.SheetData;
import cloud.baldilorenzo.sheetsmith.Sheetsmith;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerExportService {

    private final Sheetsmith sheetsmith;
    private final CustomerRepository customers;

    public CustomerExportService(Sheetsmith sheetsmith, CustomerRepository customers) {
        this.sheetsmith = sheetsmith;
        this.customers = customers;
    }

    public byte[] export() {
        List<CustomerRow> rows = customers.findAll().stream()
                .map(c -> new CustomerRow(c.getCode(), c.getName(), c.getSince(), c.getRevenue()))
                .toList();
        return sheetsmith.generate(List.of(SheetData.of("Customers", CustomerRow.class, rows)));
    }
}
```

The resulting workbook has one sheet named `Customers`, with a merged title row, a header filled with the accent colour and bold contrasting text, a light grid, light zebra rows, a frozen header, an auto-filter and columns sized to their content, except `Code`, which is 12 characters wide.

### 2.2 Plain Java application

Without Spring, create the generator with its builder. Create it once and reuse it: it is immutable, thread-safe and caches the metadata of each sheet class.

```java
import cloud.baldilorenzo.sheetsmith.SheetData;
import cloud.baldilorenzo.sheetsmith.Sheetsmith;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public final class Exports {

    private static final Sheetsmith SHEETSMITH = Sheetsmith.builder().build();

    public static void writeCustomers(List<CustomerRow> rows, Path target) throws Exception {
        byte[] file = SHEETSMITH.generate(List.of(SheetData.of("Customers", CustomerRow.class, rows)));
        Files.write(target, file);
    }
}
```

To write directly to a file without holding the bytes, use the stream variant:

```java
try (OutputStream out = Files.newOutputStream(target)) {
    SHEETSMITH.generate(List.of(SheetData.of("Customers", CustomerRow.class, rows)), out);
}
```

### 2.3 Download from a Spring MVC controller

```java
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
public class CustomerExportController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final Sheetsmith sheetsmith;
    private final CustomerQueries queries;

    public CustomerExportController(Sheetsmith sheetsmith, CustomerQueries queries) {
        this.sheetsmith = sheetsmith;
        this.queries = queries;
    }

    @GetMapping("/exports/customers.xlsx")
    public ResponseEntity<StreamingResponseBody> customers() {
        List<SheetData<?>> sheets = List.of(SheetData.of("Customers", CustomerRow.class, queries.rows()));
        StreamingResponseBody body = out -> sheetsmith.generate(sheets, out);
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("customers.xlsx").build().toString())
                .body(body);
    }
}
```

The data is loaded before the response body is produced, so a database error still produces a regular error response. The stream variant writes nothing to the stream when a configuration or generation error occurs, because the workbook is complete before serialisation starts: see [section 5.2.2](#522-generatelistsheetdata-outputstream). With a streaming body, however, the servlet container may already have committed the status and the headers when the generation runs, so an exception at that point can no longer become a clean error response. When a guaranteed error response matters, generate the bytes first and return them:

```java
@GetMapping("/exports/customers.xlsx")
public ResponseEntity<byte[]> customers() {
    byte[] file = sheetsmith.generate(List.of(SheetData.of("Customers", CustomerRow.class, queries.rows())));
    return ResponseEntity.ok()
            .contentType(XLSX)
            .contentLength(file.length)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename("customers.xlsx").build().toString())
            .body(file);
}
```

The two approaches use practically the same memory: see [section 5.2.3](#523-choosing-between-byte-and-outputstream). Validating the sheet classes at startup ([section 10.4](#104-startup-validation)) removes configuration errors from the request path in both cases.

---

## 3. Concepts

This section explains the mental model of the library. The precise reference of every element follows in sections 4 to 11.

### 3.1 Sheet class, columns and data

A **sheet class** is a Java class or record annotated with `@ExcelSheet`. It describes one table: its optional title, its columns, its styles and its layout options.

A **column** is a field of the sheet class annotated with `@ExcelColumn`. Each column has a header text and an order. Fields without `@ExcelColumn` are ignored: export is opt-in, so adding a field to a class never adds a column by accident.

The **data** of a sheet is a list of instances of the sheet class (or of its subclasses). Each element becomes one data row, in list order. The first element is data row 1.

The pairing of a sheet name, a sheet class and a data list is a **`SheetData`**. A workbook is generated from an ordered list of `SheetData`.

```
List<SheetData<?>>                     workbook
 ├── SheetData("Customers", CustomerRow.class, customers)   → sheet 1
 └── SheetData("Orders",    OrderRow.class,    orders)      → sheet 2
```

### 3.2 Anatomy of a generated sheet

```
row 0   ┌──────────────────────────────────────────────┐
        │ Title (optional, merged across all columns)  │   title: no role, never framed
row 1   ├──────────┬──────────┬──────────┬─────────────┤
        │ Header 1 │ Header 2 │ Header 3 │ Header 4    │   header row
row 2   ├──────────┼──────────┼──────────┼─────────────┤
        │ data row 1 (odd, first row)                  │
row 3   │ data row 2 (even)                            │
row 4   │ data row 3 (odd)                             │
row 5   │ data row 4 (even, last row)                  │
        └──────────┴──────────┴──────────┴─────────────┘
          first column                      last column
```

Without a title, the header is row 0 of the sheet and the data starts on row 1. The title, when present, occupies exactly one row.

### 3.3 Column order

Every column declares an integer `order`. Columns appear from left to right in ascending order. Values must be unique within the sheet class, inherited columns included, but need not be consecutive. Numbering in steps of 10 (10, 20, 30) leaves room to insert columns later without renumbering. The order is mandatory because the Java reflection API does not guarantee the declaration order of fields.

### 3.4 Records, classes and inheritance

Both records and ordinary classes can be sheet classes.

- **Records.** `@ExcelColumn` is written on the record component. It applies to the component field, and the value is read through the component accessor.
- **Classes.** `@ExcelColumn` is written on the field. The value is read through a public getter when a suitable one exists, otherwise directly from the field, even when the field is private. The exact rules are in [section 4.2.1](#421-value-access).
- **Inheritance.** Annotated fields of superclasses are columns too. They are collected from the topmost superclass down to the sheet class and then sorted by `order`. `@ExcelSheet` is not inherited: every class passed to a `SheetData` carries its own `@ExcelSheet`. A superclass that only contributes columns does not need it. Named styles (`@ExcelStyle`) are not inherited either: they are read from the sheet class only.
- **Subclass instances.** A `SheetData` of a sheet class accepts instances of its subclasses. The columns are always those of the sheet class passed as type.

### 3.5 Null values and null elements

- A **null field value** produces an empty cell that keeps its resolved style, so fills and borders remain continuous along the row and the column. The converter is not called.
- A **null element** in the data list is an error: it is reported as a `SheetsmithGenerationException` naming the sheet and the data row.

### 3.6 Named styles and slots

The look of a table is described with two concepts.

A **named style** is a set of formatting attributes, declared once with `@ExcelStyle` and identified by a name. A named style does nothing on its own.

A **slot** is a place where a named style is applied, by name. The slots are:

| Slot | Declared in | Applies to |
| --- | --- | --- |
| `titleStyle` | `@ExcelSheet` | the title row |
| `header.base` | `@ExcelSheet(header = @HeaderStyles(...))` | every header cell |
| `header.firstColumn`, `header.lastColumn` | `@HeaderStyles` | the header cell of the first or last column |
| `headerStyle` | `@ExcelColumn` | the header cell of one column |
| `body.base` | `@ExcelSheet(body = @BodyStyles(...))` | every data cell |
| `body.odd`, `body.even` | `@BodyStyles` | the data cells of odd or even rows |
| `body.firstRow`, `body.lastRow` | `@BodyStyles` | the data cells of the first or last data row |
| `body.firstColumn`, `body.lastColumn` | `@BodyStyles` | the data cells of the first or last column |
| `styles.base`, `styles.odd`, `styles.even`, `styles.firstRow`, `styles.lastRow` | `@ExcelColumn(styles = @ColumnStyles(...))` | the data cells of one column, optionally restricted to odd, even, first or last rows |

One named style can be referenced by any number of slots.

```java
@ExcelSheet(
        header = @HeaderStyles(base = "header"),
        body = @BodyStyles(odd = "zebra", lastRow = "total"))
@ExcelStyle(name = "header", bold = Toggle.TRUE, fillColor = "#1F4E79", fontColor = "#FFFFFF")
@ExcelStyle(name = "zebra", fillColor = "#EEF3F8")
@ExcelStyle(name = "total", bold = Toggle.TRUE, borderTop = Border.DOUBLE)
public record InvoiceLine(
        @ExcelColumn(header = "Description", order = 10) String description,
        @ExcelColumn(header = "Amount", order = 20, format = "#,##0.00") BigDecimal amount) {
}
```

### 3.7 Unset attributes

Every attribute of a named style, apart from its name, has a default that means **unset**. An unset attribute overrides nothing: it leaves the value decided by the levels below. Because annotation attributes cannot be null, "unset" is represented as follows:

| Kind of attribute | Unset value |
| --- | --- |
| Enum attributes (`align`, `border`, `fillPattern`, `underline`, ...) | the constant `INHERIT` of the enum |
| Yes or no attributes (`bold`, `wrapText`, `locked`, ...) | `Toggle.INHERIT` (the three states are `INHERIT`, `TRUE`, `FALSE`) |
| Numeric attributes (`rotation`, `indent`, `fontSize`, and `@ExcelColumn.width`) | `ExcelStyle.UNSET`, equal to `Integer.MIN_VALUE` |
| Text attributes (colours, font name, data format) | the empty string |

`Integer.MIN_VALUE` is used instead of `-1` because `-1` is a valid rotation. A plain `boolean` is not used for yes or no attributes because it cannot express "unset": `Toggle.FALSE` explicitly switches an attribute off, while `Toggle.INHERIT` leaves it to lower levels.

### 3.8 Roles

The **role** of a data cell is its position in the table, and decides which slots apply to it:

- **odd or even row.** Data rows are numbered from 1, in list order, so the first data row is odd.
- **first row and last row.** The first and the last element of the data list.
- **first column and last column.** By position after sorting by `order`.

Roles are independent of each other. With one data row, that row is both first and last. With one column, it is both first and last. A header cell has only the first and last column roles. The title has no role.

### 3.9 The cascade

The **effective style** of a cell is obtained by laying the applicable styles on top of each other, from the least to the most specific, attribute by attribute. Each level overrides only the attributes it sets and keeps the others. Attributes that no level sets keep the Excel defaults (Calibri 11, no fill, no border, general alignment, General format).

**Data cells**, from the least to the most specific level:

| Level | Source |
| --- | --- |
| 1 | the preset body layers, if a preset applies: preset base, then preset odd or even |
| 2 | `body.base` |
| 3 | `body.odd` or `body.even` |
| 4 | the edges of the outer frame (`outerBorder`) |
| 5 | `body.lastColumn`, then `body.firstColumn` |
| 6 | `body.lastRow`, then `body.firstRow` |
| 7 | column `styles.base` |
| 8 | column `styles.odd` or `styles.even` |
| 9 | column `styles.lastRow`, then `styles.firstRow` |
| 10 | the column `format`, as data format |
| (final) | the application default format for the kind of value, only when no level set a format |

**Header cells**, from the least to the most specific level:

| Level | Source |
| --- | --- |
| 1 | the preset header layer, if a preset applies |
| 2 | `header.base` |
| 3 | the edges of the outer frame |
| 4 | `header.lastColumn`, then `header.firstColumn` |
| 5 | the `headerStyle` of the column |

**Title:** the preset title layer, if a preset applies, then `titleStyle`.

### 3.10 Precedence rules that follow from the cascade

The order of the cascade produces a small number of rules worth remembering:

1. **The row wins over the column.** When a body row slot (`firstRow`, `lastRow`) and a body column slot (`firstColumn`, `lastColumn`) set the same attribute on the same cell, the row slot wins, because it is applied later.
2. **The first wins over the last.** With one data row, `lastRow` is applied before `firstRow`, so `firstRow` wins. With one column, `firstColumn` wins over `lastColumn`. The same holds for the header column slots and for the column row slots.
3. **The column is the most specific level.** Column slots come after every table level, so a column can always override the table. Only the column `format` comes after them.
4. **Header and data are separate.** Header slots and column header styles never apply to data cells. Body and column slots never apply to header cells. None of them applies to the title. The header does not inherit anything from the body.
5. **The frame yields to role slots.** The outer frame sits above the base and odd or even levels and below the role slots: a first or last row or column slot, a column slot or a column header style that sets a border side overrides the frame on that side.
6. **The column format is final.** `@ExcelColumn.format` wins over the `dataFormat` of every style applied to the cell and over the application default formats.
7. **Local wins over shared.** A named style declared on the sheet class replaces a style with the same name coming from a style sheet, entirely: the two are not merged.
8. **Any declared style wins over the preset.** The preset is the lowest level of every cascade.

### 3.11 Presets

A **preset** is a ready-made table style generated by the library from one accent colour. It produces a title layer, a header layer and body layers (base, odd, even), applied below every declared style. A preset is chosen per sheet class (`@ExcelSheet.preset`) or for the whole application (application defaults), and can be adjusted with ordinary named styles. Presets are described in [section 7](#7-presets).

### 3.12 Converters

Every field value is turned into a **cell value** by a **converter** before being written. Built-in converters cover text, numbers, booleans, enums, `LocalDate` and `LocalDateTime`. Any other type needs a converter, declared on one column (field converter) or registered for a type across the application (application converter). The converter of each column is chosen once, from the declared type of the field. Converters are described in [section 9](#9-converters).

### 3.13 Lifecycle of a generation

When `generate` is called, the library:

1. validates the input: the list is not empty, sheet names are valid and unique (V-18 to V-20);
2. for each distinct sheet class, obtains its validated metadata (V-01 to V-09, V-13 to V-17) and binds a converter to each column (V-10 to V-12), using the per-class caches when available;
3. if any configuration error was found, throws one `SheetsmithConfigurationException` listing all of them, and writes nothing;
4. creates a new workbook and records the document properties;
5. writes each sheet: title, header, data rows (reading each value, converting it, choosing the effective style), then freeze pane, auto-filter and column widths;
6. serialises the workbook to the stream, flushes the stream, and releases the workbook.

Data problems found during step 5 stop the generation with a `SheetsmithGenerationException`. Nothing is written to the output in that case.

### 3.14 Caching and thread safety

- The **metadata** of a sheet class (columns, resolved styles, value accessors) is computed and validated on first use, then cached per class and shared by every generator. The cache does not retain class loaders, which matters with development tools that restart the application.
- The **converter binding** of a sheet class is cached per generator, because it depends on the converters configured on that generator.
- A **class that fails validation is not cached**: it is rejected at every call, with the same errors, until it is fixed.
- A **generator** is immutable and thread-safe. Every generation builds its own workbook, so concurrent calls do not interfere. Converters are shared between concurrent generations and must be thread-safe.
- Within one generation, the effective style of each distinct combination of column, row parity, first or last row and kind of value is computed once per sheet and reused for every cell with that combination. Equal effective styles share one Excel cell style, fonts and data formats are deduplicated, so the number of cell styles in a file depends on the number of distinct styles and never on the number of cells.

---

## 4. Annotation reference

All annotations are in the package `cloud.baldilorenzo.sheetsmith.annotation` and are retained at runtime.

| Annotation | Target | Purpose |
| --- | --- | --- |
| `@ExcelSheet` | class, record, interface | Marks a sheet class and configures the table as a whole. Mandatory on every sheet class. |
| `@ExcelColumn` | field, record component | Exports a field as a column and configures it. |
| `@ExcelStyle` | class (repeatable) | Declares a named style. |
| `@ExcelStyles` | class | Container of repeated `@ExcelStyle`, generated by the compiler. Not written by hand. |
| `@ExcelStyleSheet` | class | Marks a class that holds shared named styles. |
| `@HeaderStyles` | attribute value only | Header slots, value of `@ExcelSheet.header`. |
| `@BodyStyles` | attribute value only | Body slots at table level, value of `@ExcelSheet.body`. |
| `@ColumnStyles` | attribute value only | Body slots of one column, value of `@ExcelColumn.styles`. |

Each attribute below is documented with the same template: type, default, allowed values, effect, interactions with other attributes, related validation rules and an example.

### 4.1 `@ExcelSheet`

Marks a class as a sheet class and configures its sheet: title, preset, shared style sheets, layout options and the header and body slots.

- **Mandatory** on every class passed to `SheetData`. A class without it violates rule V-01.
- **Not inherited.** Every exported class carries its own `@ExcelSheet`. Superclasses that only contribute columns do not need it.
- **Every attribute is optional.** With all defaults, the sheet has no title, a frozen header, auto-sized columns, no auto-filter, no frame, and no style other than the application default preset (which is `NONE` unless configured).

Summary of the attributes:

| Attribute | Type | Default |
| --- | --- | --- |
| `title` | `String` | `""` (no title) |
| `titleStyle` | `String` | `""` (no style) |
| `preset` | `TablePreset` | `INHERIT` (application default) |
| `accentColor` | `String` | `""` (application default) |
| `styleSheets` | `Class<?>[]` | `{}` |
| `freezeHeader` | `boolean` | `true` |
| `autoFilter` | `boolean` | `false` |
| `autoSizeColumns` | `boolean` | `true` |
| `outerBorder` | `Border` | `INHERIT` (no frame) |
| `outerBorderColor` | `String` | `""` (automatic colour) |
| `header` | `HeaderStyles` | `@HeaderStyles` (no slot set) |
| `body` | `BodyStyles` | `@BodyStyles` (no slot set) |

#### 4.1.1 `title`

| | |
| --- | --- |
| Type | `String` |
| Default | `""`, meaning no title row |
| Allowed values | any text; written as it is |
| Effect | Adds a row above the header. The text is written in the first column and the cell is merged across all the columns of the table. Every cell of the title row receives the title style. |
| Interactions | The title has no role: header and body slots never apply to it. It is outside the outer frame. It is frozen together with the header when `freezeHeader` is true. It is excluded from the auto-filter. Its style is the preset title layer (if any) followed by `titleStyle`. With one column, there is nothing to merge: the title stays in the single cell. |
| Validation | None on the text itself. `titleStyle` requires a title (V-15). |

```java
@ExcelSheet(title = "Open invoices at 30/09/2026")
public record InvoiceRow(/* columns */) { }
```

#### 4.1.2 `titleStyle`

| | |
| --- | --- |
| Type | `String`, the name of a named style |
| Default | `""`, meaning no style |
| Allowed values | the name of a style available to the class: declared on the class or on one of its `styleSheets` |
| Effect | Applied to every cell of the title row, after the preset title layer. |
| Interactions | Allowed only when `title` is set. |
| Validation | V-15 when `title` is empty; V-06 when the name does not exist. |

```java
@ExcelSheet(title = "Quarterly sales", titleStyle = "title")
@ExcelStyle(name = "title", fontSize = 16, bold = Toggle.TRUE, fontColor = "#1F4E79")
public record SalesRow(/* columns */) { }
```

#### 4.1.3 `preset`

| | |
| --- | --- |
| Type | `TablePreset` |
| Default | `TablePreset.INHERIT` |
| Allowed values | `INHERIT`, `NONE`, `LIGHT`, `MEDIUM`, `DARK` |
| Effect | `INHERIT` uses the application default preset (`SheetsmithDefaults.preset`, property `sheetsmith.preset`, `NONE` unless configured). `NONE` applies no preset regardless of the application default. `LIGHT`, `MEDIUM` and `DARK` apply the corresponding preset. |
| Interactions | The preset is the lowest level of the title, header and body cascades: every declared style overrides it attribute by attribute. The colours of the preset come from the effective accent colour. |
| Validation | None. |

```java
@ExcelSheet(preset = TablePreset.LIGHT)      // always LIGHT
@ExcelSheet(preset = TablePreset.NONE)       // never a preset, even if the application default is one
@ExcelSheet                                  // the application default preset
```

#### 4.1.4 `accentColor`

| | |
| --- | --- |
| Type | `String`, a colour |
| Default | `""`, meaning the application default accent colour (`#4472C4` unless configured) |
| Allowed values | `#RRGGBB` in upper or lower case, or the name of an Apache POI `IndexedColors` constant (see [section 6.2](#62-colours)) |
| Effect | The colour from which the preset derives every tone. Hexadecimal values are normalised to upper case. |
| Interactions | Has an effect only when the effective preset is not `NONE`. |
| Validation | V-13 for any other non-empty value. |

```java
@ExcelSheet(preset = TablePreset.MEDIUM, accentColor = "#2E7D32")
```

#### 4.1.5 `styleSheets`

| | |
| --- | --- |
| Type | `Class<?>[]` |
| Default | `{}` |
| Allowed values | classes annotated with `@ExcelStyleSheet` |
| Effect | The named styles of the listed style sheets become available to the slots of this class, as if declared on it. |
| Interactions | A style declared on the sheet class with the same name as a style of a style sheet replaces it entirely (no merge). Listing the same style sheet twice has no effect. The order of the list has no effect. |
| Validation | V-09 for a listed class without `@ExcelStyleSheet` (its styles are then ignored, so references to them also report V-06). V-08 when two listed style sheets declare the same name. |

```java
@ExcelSheet(styleSheets = {CorporateStyles.class, FinanceStyles.class},
        header = @HeaderStyles(base = "corporate-header"))
```

Section 8 is dedicated to shared style sheets.

#### 4.1.6 `freezeHeader`

| | |
| --- | --- |
| Type | `boolean` |
| Default | `true` |
| Effect | Freezes the rows up to and including the header, so they stay visible while scrolling. When the sheet has a title, the title row is frozen too. No column is frozen. |
| Validation | None. |

```java
@ExcelSheet(freezeHeader = false)
```

#### 4.1.7 `autoFilter`

| | |
| --- | --- |
| Type | `boolean` |
| Default | `false` |
| Effect | Adds an Excel auto-filter covering all the columns, from the header row to the last data row. With no data rows, it covers the header row only. The title is never included. |
| Validation | None. |

```java
@ExcelSheet(autoFilter = true)
```

#### 4.1.8 `autoSizeColumns`

| | |
| --- | --- |
| Type | `boolean` |
| Default | `true` |
| Effect | Sizes every column without an explicit `width` to its content. |
| Interactions | Columns with `@ExcelColumn.width` are never auto-sized. When false, columns without `width` keep the width chosen by the spreadsheet application. |
| Validation | None. |

How sizing works:

1. Sizing is delegated to Apache POI, which measures the text with the fonts installed on the machine (Java AWT).
2. On servers or containers without installed fonts, or without the AWT native libraries, that measurement can fail. sheetsmith then falls back to an **estimate**: the length in characters of the longest value of the column **as Excel displays it** (with its format applied, so dates and numbers are measured as shown), header included and title excluded, plus 2 characters, capped at 255.
3. The time spent sizing grows with the number of rows. For large sheets, disable it and set explicit widths: see [section 12.3](#123-very-large-exports).

A known behaviour concerns a sheet with a title and **a single column**: see [section 12.4](#124-automatic-column-sizing).

```java
@ExcelSheet(autoSizeColumns = false)
public record LargeRow(
        @ExcelColumn(header = "Id", order = 10, width = 10) long id,
        @ExcelColumn(header = "Description", order = 20, width = 60) String description) { }
```

#### 4.1.9 `outerBorder`

| | |
| --- | --- |
| Type | `Border` |
| Default | `Border.INHERIT`, meaning no frame |
| Allowed values | every `Border` constant (see [Appendix B](#b3-border)) |
| Effect | Draws a frame around the header and the data rows with a single attribute: along the top of the header row, the left side of the first column, the right side of the last column, and the bottom of the last data row (or of the header row when there are no data rows). The title is never framed. |
| Interactions | Any value other than `INHERIT`, `NONE` included, is applied to those edges: `NONE` therefore removes, on the edges, borders that a preset or a base style would draw. In the cascade, the frame sits above the preset, the base slots and the odd and even slots, and below the first and last row and column slots, the column slots and the column header style: a style at those levels that sets a border side overrides the frame on that side. |
| Validation | None. |

Edges set by the frame, per cell:

| Cell | Sides set by the frame |
| --- | --- |
| Header, every column | top |
| Header, first column | left |
| Header, last column | right |
| Header, every column, only when there are no data rows | bottom |
| Data, first column | left |
| Data, last column | right |
| Data, last row | bottom |

```java
@ExcelSheet(outerBorder = Border.MEDIUM, outerBorderColor = "#1F4E79")
```

#### 4.1.10 `outerBorderColor`

| | |
| --- | --- |
| Type | `String`, a colour |
| Default | `""`, meaning the automatic colour (usually black) |
| Allowed values | `#RRGGBB` or an `IndexedColors` name |
| Effect | Colour of the frame edges. Hexadecimal values are normalised to upper case. |
| Interactions | Has an effect only when `outerBorder` is set. |
| Validation | V-13 for an invalid non-empty value. |

#### 4.1.11 `header`

| | |
| --- | --- |
| Type | `HeaderStyles` |
| Default | `@HeaderStyles`, no slot set |
| Effect | The named styles of the header row: see [section 4.6](#46-headerstyles). |

#### 4.1.12 `body`

| | |
| --- | --- |
| Type | `BodyStyles` |
| Default | `@BodyStyles`, no slot set |
| Effect | The named styles of the data rows at table level: see [section 4.7](#47-bodystyles). |

#### 4.1.13 Complete example

```java
@ExcelSheet(
        title = "Invoice 2026/0042",
        titleStyle = "title",
        preset = TablePreset.LIGHT,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        freezeHeader = true,
        autoFilter = true,
        autoSizeColumns = true,
        outerBorder = Border.THIN,
        outerBorderColor = "#1F4E79",
        header = @HeaderStyles(base = "header", lastColumn = "header-right"),
        body = @BodyStyles(lastRow = "total"))
@ExcelStyle(name = "title", fontSize = 16, bold = Toggle.TRUE)
@ExcelStyle(name = "header-right", align = Align.RIGHT)
@ExcelStyle(name = "total", bold = Toggle.TRUE, borderTop = Border.DOUBLE)
public record InvoiceLine(
        @ExcelColumn(header = "Description", order = 10) String description,
        @ExcelColumn(header = "Quantity", order = 20, format = "0") int quantity,
        @ExcelColumn(header = "Amount", order = 30, format = "#,##0.00") BigDecimal amount) {
}
```

In this example `header` is assumed to be declared on `CorporateStyles`.

### 4.2 `@ExcelColumn`

Exports a field of a sheet class as a column.

- **Opt-in.** Only fields carrying this annotation become columns.
- **Inheritance.** Annotated fields of superclasses are columns too.
- **At least one column** per sheet class (V-02).
- **Not on static fields** (V-05).
- **Records.** On a record component, the annotation applies to the component field.
- **Mandatory attributes.** `header` and `order` have no default, so the compiler rejects a column without them.

Summary of the attributes:

| Attribute | Type | Default |
| --- | --- | --- |
| `header` | `String` | none, mandatory |
| `order` | `int` | none, mandatory |
| `width` | `int` | `ExcelStyle.UNSET` |
| `format` | `String` | `""` |
| `converter` | `Class<? extends CellConverter<?>>` | `CellConverter.None.class` |
| `headerStyle` | `String` | `""` |
| `styles` | `ColumnStyles` | `@ColumnStyles` (no slot set) |

#### 4.2.1 Value access

The value of a column is read as follows:

1. **Record:** through the component accessor (`amount()`).
2. **Class:** through a public, non-static, no-argument getter, declared on the class or inherited, **whose return type is assignable to the field type**:
   - for `boolean` and `Boolean` fields, `isX()` is tried first, then `getX()`;
   - for fields of any other type, `getX()`.
   `X` is the field name with its first letter in upper case.
3. **Otherwise:** directly from the field, even when it is private.

Consequences worth knowing:

- A getter whose return type does not match is **ignored**, and the field is read directly. This includes primitive and wrapper mismatches: a `Boolean active` field with `public boolean isActive()` is read from the field, because `boolean` is not assignable to `Boolean`; the same holds for an `int` field with an `Integer getX()` getter. The value written is the same, but any logic inside the getter is bypassed.
- A getter declared on the sheet class overrides a getter of a superclass, and an instance of a subclass passed as data uses the subclass override (normal virtual dispatch).
- Getters generated by Lombok (`@Getter`, `@Data`, `@Value`) follow the conventions above and are used.
- A getter that throws during generation causes a `SheetsmithGenerationException` naming the sheet, the row and the field, with the original exception as cause.

**Modular applications.** sheetsmith needs reflective access to the packages that contain the sheet classes. Open them in `module-info.java`:

- `opens com.example.export;` (unqualified) works in every setup;
- `opens com.example.export to cloud.baldilorenzo.sheetsmith;` works only when sheetsmith is on the module path, where its module name is `cloud.baldilorenzo.sheetsmith`. When sheetsmith is on the class path, it belongs to the unnamed module and the qualified directive does not reach it.

A value that cannot be accessed violates V-17, and the message names the package to open.

#### 4.2.2 `header`

| | |
| --- | --- |
| Type | `String` |
| Default | none: mandatory |
| Allowed values | any non-blank text |
| Effect | Text of the header cell of the column, written as it is (no translation, no trimming). |
| Validation | V-04 when blank (empty or only whitespace). |

#### 4.2.3 `order`

| | |
| --- | --- |
| Type | `int` |
| Default | none: mandatory |
| Allowed values | any `int`, negative values included; unique within the sheet class, inherited columns included |
| Effect | Columns are placed from left to right in ascending order. |
| Validation | V-03 when two columns share the same value; the error is reported on the second field found and names the first one. |

```java
@ExcelColumn(header = "Code", order = 10) String code;
@ExcelColumn(header = "Name", order = 20) String name;
// later, without renumbering:
@ExcelColumn(header = "Category", order = 15) String category;
```

#### 4.2.4 `width`

| | |
| --- | --- |
| Type | `int`, characters |
| Default | `ExcelStyle.UNSET` |
| Allowed values | 1 to 255, or `UNSET` |
| Effect | Sets the column width in characters (Excel width units of the default font). |
| Interactions | A column with an explicit width keeps it and is excluded from `autoSizeColumns`. With `UNSET`, the width comes from automatic sizing or, when that is disabled, from the spreadsheet application. |
| Validation | V-14 outside 1 to 255. |

#### 4.2.5 `format`

| | |
| --- | --- |
| Type | `String`, an Excel format code |
| Default | `""`, leaving the format to the styles and the application defaults |
| Allowed values | any Excel format code, in the Excel syntax described in [section 6.6](#66-data-formats) |
| Effect | Format of the data cells of the column. |
| Interactions | It is the last level of the body cascade: it wins over the `dataFormat` of every style applied to the cell and over the application default formats. It does not apply to the header cell. The format is written to the file as it is, without validation. |
| Validation | None: an invalid format code is not detected by sheetsmith and may be shown by Excel as a repair message or ignored. |

```java
@ExcelColumn(header = "Due date", order = 30, format = "dd/mm/yyyy") LocalDate due;
@ExcelColumn(header = "Amount", order = 40, format = "#,##0.00 \"EUR\"") BigDecimal amount;
@ExcelColumn(header = "Rate", order = 50, format = "0.0%") double rate;
```

#### 4.2.6 `converter`

| | |
| --- | --- |
| Type | `Class<? extends CellConverter<?>>` |
| Default | `CellConverter.None.class`, meaning no field converter |
| Allowed values | a converter class handling a type assignable from the field type (primitive types count as their wrappers) |
| Effect | The values of this column are converted with this converter instead of the application or built-in converter for the field type. |
| Interactions | One instance per converter class and per generator, shared by every column that declares it. Without Spring, the class must be public with a public no-argument constructor. With the Spring Boot auto-configuration, the bean of that class is used when exactly one exists, otherwise a new instance is created with dependency injection (see [section 9.6](#96-field-converters-and-application-converters)). |
| Validation | V-11 when the handled type is incompatible (checked when the handled type can be determined from the generic declaration of the converter class); V-12 when the converter cannot be created. |

```java
@ExcelColumn(header = "Id", order = 10, converter = UuidAsText.class) UUID id;
```

#### 4.2.7 `headerStyle`

| | |
| --- | --- |
| Type | `String`, the name of a named style |
| Default | `""` |
| Effect | Applied to the header cell of this column. It is the last level of the header cascade: it wins over the preset, the header slots and the frame. |
| Validation | V-06 when the name does not exist. |

```java
@ExcelColumn(header = "Amount", order = 40, headerStyle = "right") BigDecimal amount;
```

#### 4.2.8 `styles`

| | |
| --- | --- |
| Type | `ColumnStyles` |
| Default | `@ColumnStyles`, no slot set |
| Effect | The named styles of the data cells of this column: see [section 4.8](#48-columnstyles). Column slots are the most specific slots of the body cascade. |

#### 4.2.9 Complete example

```java
@ExcelSheet
@ExcelStyle(name = "money", align = Align.RIGHT)
@ExcelStyle(name = "right", align = Align.RIGHT)
@ExcelStyle(name = "negative-highlight", fontColor = "#C00000")
public class LedgerRow {

    @ExcelColumn(header = "Account", order = 10, width = 14)
    private String account;

    @ExcelColumn(header = "Booked on", order = 20, format = "dd/mm/yyyy")
    private LocalDate bookedOn;

    @ExcelColumn(header = "Balance", order = 30, format = "#,##0.00;[Red]-#,##0.00",
            headerStyle = "right", styles = @ColumnStyles(base = "money"))
    private BigDecimal balance;

    @ExcelColumn(header = "Currency", order = 40, converter = CurrencyCodeConverter.class)
    private Currency currency;

    public String getAccount() { return account; }
    public LocalDate getBookedOn() { return bookedOn; }
    public BigDecimal getBalance() { return balance; }
    public Currency getCurrency() { return currency; }
}
```

### 4.3 `@ExcelStyle`

Declares a named style: a set of formatting attributes that slots reference by name.

- **Where.** On the sheet class, or on a style sheet class annotated with `@ExcelStyleSheet` to share it.
- **Repeatable.** Write it as many times as needed on the same class.
- **Names.** Not blank (V-16), unique within the declaring class (V-07). Names are case-sensitive and matched exactly, spaces included.
- **Not inherited** from superclasses.
- **Effect only through slots.** A declared but unreferenced style has no effect.
- **Within one style**, a side-specific border line or colour (`borderTop`, `borderTopColor`, ...) wins over the all-sides attribute (`border`, `borderColor`) on that side.

The attributes, grouped by area. Every attribute other than `name` defaults to "unset".

| Attribute | Type | Unset value | Allowed values | Effect |
| --- | --- | --- | --- | --- |
| `name` | `String` | none, mandatory | non-blank | Name used by slots. |
| `align` | `Align` | `INHERIT` | see [B.1](#b1-align) | Horizontal alignment. |
| `verticalAlign` | `VerticalAlign` | `INHERIT` | see [B.2](#b2-verticalalign) | Vertical alignment. |
| `wrapText` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Long text wraps on several lines. |
| `shrinkToFit` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | The font shrinks so the text fits the cell width. |
| `rotation` | `int` | `UNSET` | -90 to 90, or 255 | Text rotation in degrees; 255 means vertical stacked text. |
| `indent` | `int` | `UNSET` | 0 to 250 | Indentation level. |
| `border` | `Border` | `INHERIT` | see [B.3](#b3-border) | Border line of all four sides. |
| `borderColor` | `String` | `""` | colour | Border colour of all four sides. |
| `borderTop`, `borderBottom`, `borderLeft`, `borderRight` | `Border` | `INHERIT` | see [B.3](#b3-border) | Border line of one side; wins over `border` in the same style. |
| `borderTopColor`, `borderBottomColor`, `borderLeftColor`, `borderRightColor` | `String` | `""` | colour | Border colour of one side; wins over `borderColor` in the same style. |
| `fillColor` | `String` | `""` | colour | Foreground fill colour, the background colour of the cell. |
| `fillBackgroundColor` | `String` | `""` | colour | Second colour, used only by patterned fills. |
| `fillPattern` | `Fill` | `INHERIT` | see [B.4](#b4-fill) | Fill pattern. |
| `fontName` | `String` | `""` | a font name, for example `Arial` | Font family. |
| `fontSize` | `int` | `UNSET` | 1 to 409 | Font size in points. |
| `bold` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Bold font. |
| `italic` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Italic font. |
| `strikeout` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Struck-out text. |
| `underline` | `Underline` | `INHERIT` | see [B.5](#b5-underline) | Underline. |
| `fontColor` | `String` | `""` | colour | Font colour. |
| `script` | `Script` | `INHERIT` | see [B.6](#b6-script) | Superscript or subscript. |
| `dataFormat` | `String` | `""` | Excel format code | Data format of the cells the style applies to. |
| `locked` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Locked cell; effective only on protected sheets. |
| `hidden` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Hidden formula; effective only on protected sheets. |
| `quotePrefix` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Excel quote prefix, which marks the value as text. |

Validation of `@ExcelStyle`:

| Rule | Checked on |
| --- | --- |
| V-16 | `name` blank. The style is then ignored, and the error element is `@ExcelStyle(#n)`, `n` being the 1-based position of the declaration on the class. |
| V-07 | the same `name` declared twice on the same class. |
| V-13 | `borderColor`, the four side colours, `fillColor`, `fillBackgroundColor`, `fontColor`. |
| V-14 | `rotation`, `indent`, `fontSize`. |

Notes on specific attributes:

- **Fill.** When the effective style has a `fillColor` and no `fillPattern`, the fill is solid (`SOLID_FOREGROUND`). A plain background needs `fillColor` only. `fillBackgroundColor` matters only with a patterned fill. Setting `fillPattern = Fill.NO_FILL` at a higher level removes a fill set at a lower level.
- **Removing inherited values.** `Toggle.FALSE`, `Border.NONE`, `Underline.NONE`, `Script.NONE` and `Fill.NO_FILL` explicitly remove what a lower level set, while `INHERIT` keeps it.
- **Protection.** `locked` and `hidden` take effect only when the sheet is protected, and sheetsmith does not protect sheets: they matter only if the reader protects the sheet in Excel.
- **dataFormat.** On data cells, `@ExcelColumn.format` wins over it. When no level sets a format, the application default for the kind of value applies.

```java
@ExcelStyle(name = "header", bold = Toggle.TRUE, fillColor = "#1F4E79", fontColor = "#FFFFFF",
        align = Align.CENTER, verticalAlign = VerticalAlign.CENTER, wrapText = Toggle.TRUE)
@ExcelStyle(name = "zebra", fillColor = "#EEF3F8")
@ExcelStyle(name = "money", align = Align.RIGHT, dataFormat = "#,##0.00")
@ExcelStyle(name = "boxed", border = Border.THIN, borderColor = "#BFBFBF", borderBottom = Border.MEDIUM)
@ExcelStyle(name = "note", italic = Toggle.TRUE, fontColor = "GREY_50_PERCENT", fontSize = 9)
@ExcelStyle(name = "vertical", rotation = 90, align = Align.CENTER)
@ExcelStyle(name = "hatched", fillPattern = Fill.THIN_FORWARD_DIAG, fillColor = "#C00000",
        fillBackgroundColor = "#FFFFFF")
@ExcelStyle(name = "as-text", quotePrefix = Toggle.TRUE)
```

In `boxed`, the bottom side is `MEDIUM` and the other three are `THIN`, all with the colour `#BFBFBF`.

### 4.4 `@ExcelStyles`

Container of repeated `@ExcelStyle` annotations. The compiler uses it automatically when `@ExcelStyle` is repeated on a class. It has one attribute, `value`, of type `ExcelStyle[]`. Writing it explicitly is allowed but never necessary:

```java
// equivalent forms
@ExcelStyle(name = "a", bold = Toggle.TRUE)
@ExcelStyle(name = "b", italic = Toggle.TRUE)

@ExcelStyles({@ExcelStyle(name = "a", bold = Toggle.TRUE), @ExcelStyle(name = "b", italic = Toggle.TRUE)})
```

### 4.5 `@ExcelStyleSheet`

Marks a style sheet: a class that holds named styles shared by several sheet classes. It has no attributes.

- A style sheet carries this annotation and `@ExcelStyle` declarations. Its fields, methods and other annotations play no role. A final class with a private constructor is the usual form.
- Sheet classes reference it in `@ExcelSheet.styleSheets` and can then use its styles by name.
- Only classes carrying this annotation can be referenced (V-09).
- Style names must be unique within the style sheet (V-07). Errors on a style of a style sheet name the style sheet class, not the sheet class.
- The style sheets referenced by one sheet class must not declare the same name (V-08).
- A style declared on the sheet class wins over a style with the same name from a style sheet, and replaces it entirely.

```java
@ExcelStyleSheet
@ExcelStyle(name = "header", bold = Toggle.TRUE, fillColor = "#1F4E79", fontColor = "#FFFFFF")
@ExcelStyle(name = "zebra", fillColor = "#EEF3F8")
public final class CorporateStyles {
    private CorporateStyles() {
    }
}
```

### 4.6 `@HeaderStyles`

Header slots, usable only as the value of `@ExcelSheet.header`. Every attribute is the name of a named style; empty means no style.

| Attribute | Default | Cascade level | Applies to |
| --- | --- | --- | --- |
| `base` | `""` | 2 | every header cell |
| `lastColumn` | `""` | 4, before `firstColumn` | the header cell of the last column |
| `firstColumn` | `""` | 4, after `lastColumn` | the header cell of the first column |

Rules:

- With one column, its header cell is both first and last, and `firstColumn` wins over `lastColumn`.
- The frame sits below `firstColumn`, `lastColumn` and the column `headerStyle`.
- The column `headerStyle` is the most specific level of the header.
- Header slots never apply to data cells.

Validation: V-06 for a name that does not exist (element `@ExcelSheet`, slot `header.base`, `header.firstColumn` or `header.lastColumn`).

```java
@ExcelSheet(header = @HeaderStyles(base = "header", firstColumn = "header-left", lastColumn = "header-right"))
```

### 4.7 `@BodyStyles`

Body slots at table level, usable only as the value of `@ExcelSheet.body`.

| Attribute | Default | Cascade level | Applies to |
| --- | --- | --- | --- |
| `base` | `""` | 2 | every data cell |
| `odd` | `""` | 3 | data cells of rows 1, 3, 5, ... |
| `even` | `""` | 3 | data cells of rows 2, 4, 6, ... |
| `lastColumn` | `""` | 5, before `firstColumn` | data cells of the last column |
| `firstColumn` | `""` | 5, after `lastColumn` | data cells of the first column |
| `lastRow` | `""` | 6, before `firstRow` | data cells of the last data row |
| `firstRow` | `""` | 6, after `lastRow` | data cells of the first data row |

Rules:

- Data rows are numbered from 1, so the first data row is odd.
- The row wins over the column (level 6 after level 5).
- The first wins over the last, for rows and for columns.
- The frame sits below the row and column slots.
- Column slots (`@ColumnStyles`) are more specific than every body slot.
- Body slots never apply to the header or the title.

Validation: V-06 (element `@ExcelSheet`, slot `body.base`, `body.odd`, and so on).

```java
@ExcelSheet(body = @BodyStyles(base = "cell", odd = "zebra", firstColumn = "key", lastRow = "total"))
```

### 4.8 `@ColumnStyles`

Body slots of one column, usable only as the value of `@ExcelColumn.styles`. Applied after every table level, in this order: `base`, `odd` or `even`, `lastRow`, then `firstRow`. Only the column `format` comes after them.

| Attribute | Default | Applies to |
| --- | --- | --- |
| `base` | `""` | every data cell of the column |
| `odd` | `""` | the cells of the column in odd data rows |
| `even` | `""` | the cells of the column in even data rows |
| `lastRow` | `""` | the cell of the column in the last data row |
| `firstRow` | `""` | the cell of the column in the first data row; wins over `lastRow` with one data row |

Column slots have no first and last column attributes, because the column is a single column. They never apply to the header cell of the column, which is styled by `@ExcelColumn.headerStyle`.

Validation: V-06 (element: the field name, slot `styles.base`, `styles.odd`, and so on).

```java
@ExcelColumn(header = "Amount", order = 40, styles = @ColumnStyles(base = "money", lastRow = "money-total"))
BigDecimal amount;
```

---

## 5. API reference

### 5.1 Overview

| Type | Kind | Role |
| --- | --- | --- |
| `Sheetsmith` | interface | The generator. |
| `Sheetsmith.Builder` | interface | Configures and builds generators. |
| `SheetData<T>` | record | One sheet to generate: name, sheet class, data. |
| `SheetsmithDefaults` | record | Application defaults: default formats, default preset and accent colour. |
| `DocumentProperties` | record | Author and application recorded in every file. |
| `SheetsmithException` | sealed abstract class | Base of the library exceptions. |
| `SheetsmithConfigurationException` | final class | Configuration errors, with the list of `ConfigurationError`. |
| `SheetsmithGenerationException` | final class | Data errors during writing, with sheet, row and field. |
| `ConfigurationError` | record | One configuration error. |

All of them are in `cloud.baldilorenzo.sheetsmith`. The converter types are described in [section 9](#9-converters).

### 5.2 `Sheetsmith`

```java
public interface Sheetsmith {
    byte[] generate(List<SheetData<?>> sheets);
    void generate(List<SheetData<?>> sheets, OutputStream out);
    void validate(Class<?> type);
    static Builder builder();
}
```

Instances are immutable and thread-safe. Create one, with the builder or through the Spring Boot auto-configuration, and share it across the application. The default implementation is created by the builder; applications do not implement the interface, apart from test doubles.

#### 5.2.1 `generate(List<SheetData<?>>)`

Generates an `.xlsx` file containing the given sheets and returns its content.

| | |
| --- | --- |
| Parameters | `sheets`: the sheets, in workbook order; not null, without null elements |
| Returns | the content of the file |
| Throws | `SheetsmithConfigurationException` if the input violates V-18 to V-20 or a sheet class violates any of V-01 to V-17, every error listed; `SheetsmithGenerationException` if an element or a value cannot be written; `UncheckedIOException` if serialisation fails (practically unreachable with this method, which writes to memory); `NullPointerException` if `sheets` is null or contains a null element |

Behaviour:

- Sheets appear in the workbook in list order.
- Each sheet can use a different sheet class, and one class can be used by several sheets.
- An empty data list is valid: its sheet contains the title, if any, and the header only.
- The input and every sheet class are validated before anything is written; the errors of the input and of all the classes are reported together.
- A class that fails validation is not cached and is rejected at every call until fixed.

#### 5.2.2 `generate(List<SheetData<?>>, OutputStream)`

Generates the same file and writes it to a stream supplied by the caller.

| | |
| --- | --- |
| Parameters | `sheets`: as above; `out`: the stream that receives the file, not null |
| Throws | as above; `UncheckedIOException` wraps any `IOException` during serialisation, including a failure of the stream itself, with the original exception as cause; `NullPointerException` if `sheets` or `out` is null |

Contract of the stream:

- The stream belongs to the caller: it is **flushed** after the file is written and **never closed**.
- The whole workbook is built before serialisation starts, so **nothing is written** to the stream when a configuration error or a generation error occurs.
- Partial content can be left in the stream only when an I/O failure occurs during serialisation.

#### 5.2.3 Choosing between `byte[]` and `OutputStream`

The two methods produce identical content and use practically the same memory: the whole workbook is built in memory before it is written, its in-memory model is far larger than the file, and the extra copy of the file held by the `byte[]` method is negligible in comparison. Choose by destination:

| Destination of the file | Method |
| --- | --- |
| A file on disk, an HTTP response, a cloud storage upload stream, any other stream | `generate(sheets, out)` |
| Bytes needed as such: an e-mail attachment, a database column, a message payload, a cache, a test assertion, a `Content-Length` header | `generate(sheets)` |

#### 5.2.4 `validate(Class<?>)`

Validates a sheet class without generating anything.

| | |
| --- | --- |
| Parameters | `type`: the sheet class, not null |
| Throws | `SheetsmithConfigurationException` listing every error of the class; `NullPointerException` if `type` is null |

It runs every check that `generate` runs on a class: annotation rules V-01 to V-09 and V-13 to V-17, and converter binding V-10 to V-12, using the application converters and the converter factory of this instance. Validate with an instance configured like the one that generates the files, otherwise a type covered by an application converter can be reported as V-10. Typical uses: unit tests and startup validation.

```java
@Test
void sheetClassesAreValid() {
    Sheetsmith sheetsmith = Sheetsmith.builder().converter(Money.class, new MoneyConverter()).build();
    assertDoesNotThrow(() -> sheetsmith.validate(InvoiceLine.class));
}
```

#### 5.2.5 `builder()`

Returns a new builder with default settings: no application converters (only the built-in converters apply), field converters created through their public no-argument constructor, `SheetsmithDefaults.standard()` and `DocumentProperties.standard()`.

### 5.3 `Sheetsmith.Builder`

| Method | Description | Throws |
| --- | --- | --- |
| `<T> Builder converter(Class<T> type, CellConverter<? super T> converter)` | Registers an application converter for a type. Applies to every column whose declared type is `type` or a subtype, in every sheet class, unless the column has a field converter or a converter is registered for a closer supertype. Primitive types are registered as their wrappers (`double.class` and `Double.class` are the same key). A converter for a type with a built-in converter (`Boolean`, `LocalDate`, `Enum`, ...) replaces the built-in behaviour. The converter must be thread-safe. | `IllegalArgumentException` if a converter is already registered for the type (message: `a converter is already registered for type X`); `NullPointerException` for a null argument |
| `Builder converterFactory(CellConverterFactory factory)` | Sets the factory that creates field converters. Called once per converter class, the first time a sheet class declaring it is validated or generated; the result is reused. A converter the factory cannot create violates V-12. | `NullPointerException` |
| `Builder defaults(SheetsmithDefaults defaults)` | Sets the application defaults. | `NullPointerException` |
| `Builder documentProperties(DocumentProperties properties)` | Sets the author and application recorded in every file. | `NullPointerException` |
| `Sheetsmith build()` | Builds an immutable, thread-safe instance with the current settings. | none |

Every configuration method returns the builder, so calls can be chained.

```java
Sheetsmith sheetsmith = Sheetsmith.builder()
        .defaults(new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "", TablePreset.LIGHT, "#1F4E79"))
        .documentProperties(new DocumentProperties("Example Ltd", "Billing"))
        .converter(Money.class, new MoneyConverter())
        .converter(Instant.class, new InstantConverter(ZoneId.of("Europe/Rome")))
        .build();
```

### 5.4 `SheetData<T>`

```java
public record SheetData<T>(String name, Class<T> type, List<T> rows) {
    public static <T> SheetData<T> of(String name, Class<T> type, List<? extends T> rows);
}
```

| Component | Meaning |
| --- | --- |
| `name` | The sheet name, subject to V-19 and V-20. |
| `type` | The sheet class, annotated with `@ExcelSheet`. |
| `rows` | The objects, in row order; the first element is data row 1. |

- The sheet class is passed explicitly because the element type of a list is erased at runtime and an empty list has no element to inspect.
- The rows are **copied** into an unmodifiable list, so later changes to the original list do not affect the sheet.
- **Null elements are kept** by the copy and reported, at generation time, as a `SheetsmithGenerationException` with their row index.
- `of` accepts a list whose element type is a subtype of the sheet class: a `List<PremiumCustomerRow>` can be written with the sheet class `CustomerRow` without copying or casting. The columns are those of `CustomerRow`.
- The constructor and `of` throw `NullPointerException` for a null argument.
- Sheet names are **not** checked when the record is created: they are checked by `generate`, together with the other configuration errors.

**Sheet name rules** (checked by `generate`):

| Rule | Code |
| --- | --- |
| 1 to 31 characters | V-19 |
| none of the characters `\ / ? * [ ] :` | V-19 |
| does not start or end with an apostrophe `'` | V-19 |
| unique within the workbook, ignoring case | V-20 |

Invalid names are rejected, never truncated or cleaned: names built from data must be cleaned by the caller (see [recipe 13.15](#1315-sheet-names-built-from-data)). Excel also reserves the name `History`, which is not rejected but must be avoided.

```java
List<SheetData<?>> sheets = List.of(
        SheetData.of("Customers", CustomerRow.class, customers),
        SheetData.of("Invoice lines", InvoiceLine.class, lines));
```

### 5.5 `SheetsmithDefaults`

```java
public record SheetsmithDefaults(String dateFormat, String dateTimeFormat, String numberFormat,
                                 TablePreset preset, String accentColor) {
    public static SheetsmithDefaults standard();
}
```

| Component | Meaning | Standard value | Constraint |
| --- | --- | --- | --- |
| `dateFormat` | Default format of date cells, such as `LocalDate` values | `yyyy-mm-dd` | not null, not blank |
| `dateTimeFormat` | Default format of date-time cells, such as `LocalDateTime` values | `yyyy-mm-dd hh:mm:ss` | not null, not blank |
| `numberFormat` | Default format of numeric cells, integers included | `""` (Excel "General") | not null, may be empty |
| `preset` | Preset of sheet classes that declare `INHERIT` | `NONE` | not null, not `INHERIT` |
| `accentColor` | Accent colour of sheet classes that declare none | `#4472C4` | not null, a valid colour (empty not allowed) |

The constructor throws `IllegalArgumentException` for invalid values, with these messages: `dateFormat must not be blank`, `dateTimeFormat must not be blank`, `preset must not be INHERIT`, `accentColor 'X' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant`; and `NullPointerException` for null components.

**When a default format applies.** A default format applies only when the effective style of the cell sets no format, that is when neither `@ExcelColumn.format` nor the `dataFormat` of any style in the cascade sets one. A data cell therefore takes its format from the first of these sources that sets one: the column `format`, the `dataFormat` of the cascade, the default format for its kind of value.

| Kind of cell value | Default format used |
| --- | --- |
| date (`LocalDate`, `CellValue.date`) | `dateFormat` |
| date-time (`LocalDateTime`, `CellValue.dateTime`) | `dateTimeFormat` |
| number (any `Number`, `CellValue.number`) | `numberFormat`, if not empty |
| text, boolean, blank | none |

`numberFormat` applies to every numeric cell, integers included: with `#,##0.00`, an integer column shows two decimals unless it has its own format, for example `format = "0"`.

The accent colour is used only when the effective preset is not `NONE`.

### 5.6 `DocumentProperties`

```java
public record DocumentProperties(String author, String application) {
    public static DocumentProperties standard();   // author "sheetsmith", application "sheetsmith"
}
```

| Component | Meaning | Standard value |
| --- | --- | --- |
| `author` | The author of the documents, shown by Excel in File, Info, and by the operating system among the file properties | `sheetsmith` |
| `application` | The application recorded as the creator of the documents | `sheetsmith` |

- Values are written as they are.
- An **empty value leaves the property out** of the file, so it appears blank.
- Null components throw `NullPointerException`.
- Without configuration, both properties are `sheetsmith`, replacing the "Apache POI" values that the underlying library would otherwise record.

```java
Sheetsmith.builder().documentProperties(new DocumentProperties("Example Ltd", "Billing")).build();
Sheetsmith.builder().documentProperties(new DocumentProperties("", "")).build();   // both left out
```

In Spring Boot, use `sheetsmith.document.author` and `sheetsmith.document.application` ([section 10.3](#103-configuration-properties)).

### 5.7 Exceptions

```
RuntimeException
 └── SheetsmithException                    (sealed, abstract)
      ├── SheetsmithConfigurationException  (final)
      └── SheetsmithGenerationException     (final)
```

All library exceptions are unchecked and serialisable. There are two kinds, which call for different reactions:

| Exception | Meaning | When | Typical reaction |
| --- | --- | --- | --- |
| `SheetsmithConfigurationException` | A sheet class or the input is wrong: a programming error. | Before anything is written: in `generate`, in `validate`, at startup validation. | Fix the code. Catch it early with `validate` in tests or at startup. |
| `SheetsmithGenerationException` | Something went wrong while writing the data: usually unexpected data at runtime. | During the writing of a sheet. | Log it with sheet, row and field; fix the data or the converter. |

A failure while the workbook is serialised is neither: it is an infrastructure error, reported as a `java.io.UncheckedIOException` and deliberately not wrapped in a sheetsmith exception, so that callers can handle it apart from configuration and data errors.

#### 5.7.1 `SheetsmithConfigurationException`

| Member | Description |
| --- | --- |
| `SheetsmithConfigurationException(List<ConfigurationError> errors)` | Public constructor; `errors` not null and not empty (`IllegalArgumentException` if empty). |
| `List<ConfigurationError> errors()` | The errors, in the order they were found; unmodifiable, never empty, preserved by Java serialisation. |
| `getMessage()` | One line per error, in the format described in [section 11.1](#111-reading-a-configuration-error). |

#### 5.7.2 `SheetsmithGenerationException`

| Member | Description |
| --- | --- |
| `SheetsmithGenerationException(String message, String sheetName, int rowIndex, String fieldName, Throwable cause)` | Public constructor. `rowIndex` 0 when not specific to a row (negative values throw `IllegalArgumentException`); `fieldName` and `cause` may be null. The message is completed with the location. |
| `String sheetName()` | The name of the sheet being written. |
| `int rowIndex()` | The 1-based data row, in list order (row 1 is the first element); 0 when the error is not specific to a row, such as too many rows. Title and header are not counted. |
| `Optional<String> fieldName()` | The field involved, as declared in the sheet class; empty when not specific to a field, such as a null element. |
| `getCause()` | The original exception thrown by a getter or a converter, when there is one. |

#### 5.7.3 `ConfigurationError`

```java
public record ConfigurationError(String code, Class<?> type, String element, String message) implements Serializable
```

| Component | Meaning |
| --- | --- |
| `code` | The violated rule, from `V-01` to `V-20`. |
| `type` | The class the error refers to: the sheet class, or the style sheet that declares the faulty style; `null` for errors on the input of `generate` (V-18 to V-20). |
| `element` | The element involved: a field name, `@ExcelSheet`, `@ExcelStyle(name)`, `@ExcelStyle(#n)` when the name is blank, `sheets[i]` for a sheet of the input; empty when the error concerns the class or the input as a whole. |
| `message` | The description of the problem. |

`code`, `element` and `message` are not null (`NullPointerException` otherwise).

---

## 6. Styling

This section collects everything about formatting: colours, the meaning of each group of attributes, the data format syntax and the cascade in practice. The complete lists of enum constants are in [Appendix B](#appendix-b-value-domains).

### 6.1 Defining styles

A named style is declared with `@ExcelStyle` on the sheet class or on a style sheet, and applied through slots. The full attribute list is in [section 4.3](#43-excelstyle). A useful way to organise styles:

- one style per **purpose** (`header`, `zebra`, `money`, `total`, `key`), not per cell;
- combine purposes through the cascade instead of creating one style for every combination: a `total` style that only sets `bold` and a top border works on top of `money`, `zebra` or a preset.

### 6.2 Colours

Every colour attribute of sheetsmith (the colours of `@ExcelStyle`, `@ExcelSheet.accentColor`, `@ExcelSheet.outerBorderColor`, the application default accent colour) accepts:

| Form | Example | Notes |
| --- | --- | --- |
| hexadecimal `#RRGGBB` | `#1F4E79`, `#1f4e79` | Upper or lower case. Normalised to upper case, so `#1f4e79` and `#1F4E79` are the same colour and share one cell style. Exactly six hexadecimal digits: `#FFF` and `1F4E79` are invalid. |
| `IndexedColors` constant name | `DARK_BLUE`, `GREY_25_PERCENT` | The name of a constant of Apache POI `org.apache.poi.ss.usermodel.IndexedColors`, case-sensitive, in upper case as declared. Not normalised. The full list is in [Appendix B.9](#b9-indexedcolors-names). |
| empty string | `""` | Unset. |

Any other value violates V-13. Prefer hexadecimal colours: they are exact, while indexed colours depend on the palette of the application that opens the file. `AUTOMATIC` is accepted; as an accent colour it is treated as black.

### 6.3 Alignment and text control

| Attribute | Notes |
| --- | --- |
| `align` | `GENERAL` is the Excel default: text to the left, numbers and dates to the right. `CENTER_SELECTION` centres across adjacent cells with the same alignment without merging them. `FILL` repeats the content to fill the cell. |
| `verticalAlign` | Excel default is `BOTTOM`. `JUSTIFY` and `DISTRIBUTED` affect wrapped text. |
| `wrapText` | Wraps long text on several lines. sheetsmith does not set row heights: depending on the spreadsheet application, wrapped rows may be shown at the default height until the reader applies an automatic row height. |
| `shrinkToFit` | Reduces the font size so the text fits. Ignored by Excel when `wrapText` is active. |
| `rotation` | -90 to 90 degrees; positive values rotate counter-clockwise. 255 stacks the characters vertically. |
| `indent` | Indentation level, 0 to 250, effective with left, right or distributed alignment. |

### 6.4 Borders

- Each side has a line (`Border`) and a colour.
- `border` and `borderColor` set the four sides at once; the side-specific attributes win over them within the same style.
- Across the cascade, each side is merged independently: a level that sets only `borderBottom` keeps the other three sides of the lower levels.
- `Border.NONE` removes a line set at a lower level; `Border.INHERIT` keeps it.
- A side with a line and no colour uses the automatic colour, usually black.
- Borders of adjacent cells are stored independently: a bottom border on one row and a top border on the next row are two separate settings of two cells.
- The outer frame ([section 4.1.9](#419-outerborder)) is a dedicated level that sets only the edges of the table.

### 6.5 Fills and fonts

- **Solid fill:** set `fillColor` only. The pattern becomes `SOLID_FOREGROUND` automatically.
- **Patterned fill:** set `fillPattern`, `fillColor` (colour of the pattern) and optionally `fillBackgroundColor` (colour behind the pattern).
- **No fill:** `fillPattern = Fill.NO_FILL` removes a fill set at a lower level, for example a preset zebra on one column.
- **Fonts:** `fontName`, `fontSize`, `bold`, `italic`, `strikeout`, `underline`, `fontColor` and `script` are merged attribute by attribute like the rest of the style. The font name must be available on the machine that opens the file, otherwise Excel substitutes it. Fonts are deduplicated in the file.

### 6.6 Data formats

Every format of sheetsmith (`@ExcelColumn.format`, `@ExcelStyle.dataFormat`, the default formats of `SheetsmithDefaults` and the `sheetsmith.formats.*` properties) uses the **Excel format syntax**, the one of the Excel "Format Cells" dialog. It is not the syntax of `java.time.format.DateTimeFormatter` or `java.text.DecimalFormat`: the two look similar but are not the same. Formats are written to the file as they are, without translation and without validation.

**Date and time codes**

| Meaning | Excel | `DateTimeFormatter` |
| --- | --- | --- |
| Day of the month: 5, 05 | `d`, `dd` | `d`, `dd` |
| Day name: Mon, Monday | `ddd`, `dddd` | `EEE`, `EEEE` |
| Month: 3, 03 | `m`, `mm` | `M`, `MM` |
| Month name: Mar, March | `mmm`, `mmmm` | `MMM`, `MMMM` |
| Year: 26, 2026 | `yy`, `yyyy` | `yy`, `yyyy` |
| Hours, 0 to 23 | `h`, `hh` | `H`, `HH` |
| Hours, 1 to 12 with AM/PM | `h AM/PM`, `hh AM/PM` | `h a`, `hh a` |
| Minutes | `m`, `mm` after an hour code or before a seconds code | `m`, `mm` |
| Seconds | `s`, `ss` | `s`, `ss` |
| Elapsed hours beyond 24 | `[h]` | no equivalent |

In Excel, `m` and `mm` mean the month, unless they follow an hour code or precede a seconds code, in which case they mean minutes. So `dd/mm/yyyy hh:mm` shows the day, the month, the year, the hours and the minutes. The Java pattern `dd/MM/yyyy` is written in Excel as `dd/mm/yyyy`, and `HH:mm` as `hh:mm`.

**Number formats**

| Format | Example output |
| --- | --- |
| `0` | `1234` |
| `0.00` | `1234.50` |
| `#,##0` | `1,235` |
| `#,##0.00` | `1,234.50` |
| `0.0%` | `12.5%` (for the value 0.125) |
| `#,##0.00 "EUR"` | `1,234.50 EUR` |
| `#,##0.00;[Red]-#,##0.00` | negative values in red |
| `0.00E+00` | `1.23E+03` |
| `00000` | `00042` (leading zeros on numbers) |
| `@` | the value as text |

In number formats, `0` is a digit always shown, `#` a digit shown only when significant, `,` the thousands separator, `.` the decimal separator, and text in double quotes is shown as it is. A format can have up to four sections separated by `;`: positive, negative, zero, text. The separators actually displayed follow the regional settings of the person who opens the file: `#,##0.00` is displayed as `1.234,50` on an Italian system.

In Java source code, double quotes inside a format must be escaped: `format = "#,##0.00 \"EUR\""`.

### 6.7 The cascade in practice

Consider this sheet class:

```java
@ExcelSheet(
        preset = TablePreset.LIGHT,
        body = @BodyStyles(base = "cell", firstColumn = "key", lastRow = "total"))
@ExcelStyle(name = "cell", fontName = "Arial")
@ExcelStyle(name = "key", bold = Toggle.TRUE, fontColor = "#1F4E79")
@ExcelStyle(name = "total", bold = Toggle.TRUE, fontColor = "#000000", borderTop = Border.DOUBLE)
@ExcelStyle(name = "money", align = Align.RIGHT, dataFormat = "#,##0.00")
public record Row(
        @ExcelColumn(header = "Item", order = 10) String item,
        @ExcelColumn(header = "Amount", order = 20, styles = @ColumnStyles(base = "money"), format = "#,##0")
        BigDecimal amount) { }
```

With three data rows and the default accent `#4472C4`, the effective style of a few cells:

| Cell | Levels applied (low to high) | Result |
| --- | --- | --- |
| Item, row 1 (odd, first) | preset base (bottom line `#D0DCF0`), preset odd (fill `#E3EAF6`), `cell`, `key` | Arial, bold, `#1F4E79` text, light fill, light bottom line |
| Amount, row 2 (even) | preset base, `cell`, `money`, column `format` | Arial, right aligned, format `#,##0` (the column format beats `money`), light bottom line, no fill |
| Item, row 3 (odd, last) | preset base, preset odd, `cell`, `key`, `total` | Arial, bold, black text (`total` beats `key`: the row wins over the column), light fill, double top border, light bottom line |
| Amount, row 3 | preset base, preset odd, `cell`, `total`, `money`, column `format` | Arial, bold, black, right aligned, `#,##0`, double top border, light fill |

---

## 7. Presets

### 7.1 What a preset is

A preset is a ready-made table style that the library generates from one **accent colour** `A`. It produces five layers, applied at the lowest level of the respective cascades:

| Layer | Applied to |
| --- | --- |
| title | the title row |
| header base | every header cell |
| body base | every data cell |
| body odd | data cells of odd rows |
| body even | data cells of even rows |

Tones are derived from `A` by mixing it with white (`tint(A, f)`, where `f` is the fraction of white, from 0 to 1) or with black (`shade(A, f)`, fraction of black). Text placed on a filled background is white or black, whichever has the higher contrast ratio with the background according to WCAG (`contrast(X)`). The two ratios are equal at a relative luminance of about 0.18, so mid-tone backgrounds get black text.

### 7.2 The presets

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Uses the application default preset. Valid only on a sheet class, not as the application default itself. |
| `NONE` | No preset: only the declared styles apply. |
| `LIGHT` | Light table. |
| `MEDIUM` | Medium table. |
| `DARK` | Dark table. |

**Layers of each preset**

| Layer | `LIGHT` | `MEDIUM` | `DARK` |
| --- | --- | --- | --- |
| Title | bold, 14 pt, text `shade(A, 0.25)` | same as `LIGHT` | same as `LIGHT` |
| Header base | bold, text `shade(A, 0.25)`, bottom border `MEDIUM` colour `A` | bold, fill `A`, text `contrast(A)` | bold, fill `shade(A, 0.5)`, text `contrast(shade(A, 0.5))` |
| Body base | bottom border `THIN` colour `tint(A, 0.75)` | all borders `THIN` colour `tint(A, 0.6)` | nothing |
| Body odd | fill `tint(A, 0.85)` | fill `tint(A, 0.8)` | fill `A`, text `contrast(A)` |
| Body even | nothing | nothing | fill `shade(A, 0.25)`, text `contrast(shade(A, 0.25))` |

**In words:**

- **LIGHT.** Header with bold dark accent text and a medium accent line below it; a thin light accent line below each data row; very light accent fill on odd rows and no fill on even rows. Suited to printed reports and dense tables.
- **MEDIUM.** Header with accent fill and bold contrasting text; a thin light accent grid around every data cell; light accent fill on odd rows and no fill on even rows. The most "spreadsheet-like" preset, suited to operational exports.
- **DARK.** Header with dark accent fill and bold contrasting text; no lines; accent fill with contrasting text on odd rows, and darker accent fill with contrasting text on even rows. High visual impact, suited to dashboards and short summary tables.

In every preset the title is bold, 14 pt, with dark accent text, and only the title layer applies to the title.

### 7.3 Computed colours for common accents

The table shows the colours that each preset actually writes for a few accents. `#4472C4` is the default accent.

| Accent `A` | `shade(A,0.25)` (title, LIGHT header text, DARK even fill) | `tint(A,0.75)` (LIGHT row line) | `tint(A,0.85)` (LIGHT odd fill) | `tint(A,0.6)` (MEDIUM grid) | `tint(A,0.8)` (MEDIUM odd fill) | `shade(A,0.5)` (DARK header fill) | Text on `A` | Text on DARK even |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#4472C4` (default blue) | `#335693` | `#D0DCF0` | `#E3EAF6` | `#B4C7E7` | `#DAE3F3` | `#223962` | white | white |
| `#1F4E79` (dark blue) | `#173A5B` | `#C7D3DE` | `#DDE4EB` | `#A5B8C9` | `#D2DCE4` | `#10273C` | white | white |
| `#70AD47` (green) | `#548235` | `#DBEAD1` | `#EAF3E3` | `#C6DEB5` | `#E2EFDA` | `#385624` | black | black |
| `#FFC000` (amber) | `#BF9000` | `#FFEFBF` | `#FFF6D9` | `#FFE699` | `#FFF2CC` | `#806000` | black | black |
| `#C00000` (red) | `#900000` | `#EFBFBF` | `#F6D9D9` | `#E69999` | `#F2CCCC` | `#600000` | white | white |

The DARK header text is white for all five accents.

### 7.4 Choosing the preset and the accent

| Where | How | Scope |
| --- | --- | --- |
| Sheet class | `@ExcelSheet(preset = ..., accentColor = ...)` | that sheet class |
| Application, builder | `SheetsmithDefaults(..., preset, accentColor)` | every sheet class that declares `INHERIT` and no accent |
| Application, Spring Boot | `sheetsmith.preset`, `sheetsmith.accent-color` | same |

Resolution: the effective preset is the class preset, or the application preset when the class declares `INHERIT`. The effective accent is the class accent, or the application accent when the class declares none. A class can therefore inherit the preset and set its own accent, or the opposite.

```java
// The whole application uses LIGHT with the corporate blue...
new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "", TablePreset.LIGHT, "#1F4E79");

// ...this report keeps LIGHT but uses green...
@ExcelSheet(accentColor = "#2E7D32")

// ...and this one uses no preset at all.
@ExcelSheet(preset = TablePreset.NONE)
```

### 7.5 Adjusting a preset

The preset is the lowest level of every cascade, so any declared style overrides it attribute by attribute. Common adjustments:

```java
@ExcelSheet(preset = TablePreset.MEDIUM,
        header = @HeaderStyles(base = "header"),
        body = @BodyStyles(even = "even"))
@ExcelStyle(name = "header", align = Align.CENTER, wrapText = Toggle.TRUE)   // keeps fill and bold, adds alignment
@ExcelStyle(name = "even", fillColor = "#F2F2F2")                           // grey fill on even rows
```

```java
// Remove the zebra on one column, keep it elsewhere
@ExcelColumn(header = "Notes", order = 90, styles = @ColumnStyles(base = "plain"))
String notes;
// ...
@ExcelStyle(name = "plain", fillPattern = Fill.NO_FILL)
```

```java
// Remove the MEDIUM grid from the first column only
@ExcelSheet(preset = TablePreset.MEDIUM, body = @BodyStyles(firstColumn = "no-grid"))
@ExcelStyle(name = "no-grid", border = Border.NONE)
```

### 7.6 Presets and the outer frame

The outer frame sits above the preset. With `MEDIUM`, for example, `outerBorder = Border.MEDIUM` thickens the external edges of the grid while the internal lines stay thin. With `LIGHT`, the frame closes the table on the sides, which the preset leaves open.

### 7.7 Visual examples

The visual rendering of each preset with several accents is meant for the documentation site. The test suite of the library generates sample workbooks for every preset with the accents `#4472C4`, `#FFC000` and `DARK_RED` (test `PresetSamplesTest`, output in `sheetsmith-core/target/preset-samples`), which can be used as the source of screenshots.

---

## 8. Shared styles and corporate style

### 8.1 Why share styles

When an application produces several reports, declaring the same header, zebra and money styles on every sheet class leads to copies that drift apart over time. A **style sheet** declares named styles once; every sheet class that references it uses them by name. Changing the style sheet changes every report.

Combined with the application defaults (preset, accent colour, default formats) and the document properties, style sheets let every workbook of an application, or of an organisation through a shared library, follow the same **business or corporate style**.

### 8.2 Declaring a style sheet

```java
@ExcelStyleSheet
@ExcelStyle(name = "corp-title", fontName = "Arial", fontSize = 16, bold = Toggle.TRUE, fontColor = "#0B3D5C")
@ExcelStyle(name = "corp-header", fontName = "Arial", bold = Toggle.TRUE, fillColor = "#0B3D5C",
        fontColor = "#FFFFFF", verticalAlign = VerticalAlign.CENTER, wrapText = Toggle.TRUE)
@ExcelStyle(name = "corp-cell", fontName = "Arial", fontSize = 10)
@ExcelStyle(name = "corp-zebra", fillColor = "#EEF4F8")
@ExcelStyle(name = "corp-money", align = Align.RIGHT, dataFormat = "#,##0.00")
@ExcelStyle(name = "corp-date", align = Align.CENTER, dataFormat = "dd/mm/yyyy")
@ExcelStyle(name = "corp-total", bold = Toggle.TRUE, borderTop = Border.DOUBLE, borderTopColor = "#0B3D5C")
public final class CorporateStyles {
    private CorporateStyles() {
    }
}
```

### 8.3 Using it

```java
@ExcelSheet(
        title = "Monthly orders",
        titleStyle = "corp-title",
        styleSheets = CorporateStyles.class,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", odd = "corp-zebra", lastRow = "corp-total"),
        autoFilter = true)
public record OrderRow(
        @ExcelColumn(header = "Order", order = 10) String number,
        @ExcelColumn(header = "Date", order = 20, styles = @ColumnStyles(base = "corp-date")) LocalDate date,
        @ExcelColumn(header = "Amount", order = 30, styles = @ColumnStyles(base = "corp-money")) BigDecimal amount) {
}
```

### 8.4 Rules

| Rule | Consequence |
| --- | --- |
| Only classes with `@ExcelStyleSheet` can be referenced (V-09). | A forgotten annotation is reported, and the styles of that class are not available (references to them report V-06). |
| Names are unique within one style sheet (V-07). | The error names the style sheet class. |
| Style sheets referenced together must not share a name (V-08). | Two style sheets used by the same class cannot both define `header`. Use prefixes (`corp-`, `fin-`) to avoid collisions, or redefine the style on the class. |
| A style on the sheet class replaces a shared style with the same name. | Local customisation of a single report, without touching the style sheet. The replacement is complete: attributes are not merged. |
| Style sheets are not inherited and do not reference other style sheets. | Each sheet class lists the style sheets it uses. |

### 8.5 Splitting style sheets

Large organisations can split the corporate style into several style sheets: a base one with fonts and headers, a finance one with money and percentage formats, a reporting one with totals. A sheet class lists the ones it needs: `styleSheets = {CorporateStyles.class, FinanceStyles.class}`. Prefixes keep the names unique across them.

### 8.6 Distributing the corporate style

A style sheet is an ordinary class. To share it across applications, place it, together with a recommended `SheetsmithDefaults` and `DocumentProperties`, in a small internal library on which every application depends:

```java
public final class CorporateSheetsmith {

    public static final SheetsmithDefaults DEFAULTS =
            new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "#,##0.00", TablePreset.LIGHT, "#0B3D5C");

    public static final DocumentProperties DOCUMENT = new DocumentProperties("Example Ltd", "Example Reporting");

    public static Sheetsmith.Builder builder() {
        return Sheetsmith.builder().defaults(DEFAULTS).documentProperties(DOCUMENT);
    }

    private CorporateSheetsmith() {
    }
}
```

In Spring Boot applications, the same values go in a shared `application.yml` fragment or profile (see [section 10.3](#103-configuration-properties)).

### 8.7 Style sheets and presets together

Style sheets and presets combine: the preset gives the overall structure (lines, zebra) derived from the corporate accent, and the style sheet adds fonts, formats and the details the preset does not cover. Because the preset is the lowest level, the shared styles always win over it.

```java
@ExcelSheet(preset = TablePreset.LIGHT, accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"))
```

---

## 9. Converters

All converter types are in `cloud.baldilorenzo.sheetsmith.convert`.

### 9.1 Role of converters

Every non-null field value is turned into a `CellValue` by a converter before being written. Converters produce **values**, never formatting: the display format of a cell always comes from the styles and the application defaults.

### 9.2 Built-in converters

| Registered type | Covers | Cell written |
| --- | --- | --- |
| `CharSequence` | `String`, `StringBuilder`, `StringBuffer`, any `CharSequence` | text, via `toString()` |
| `Character` | `char`, `Character` | text |
| `Number` | `byte`, `short`, `int`, `long`, `float`, `double`, their wrappers, `BigDecimal`, `BigInteger`, `AtomicInteger`, `AtomicLong`, any `Number` | number, via `doubleValue()` |
| `Boolean` | `boolean`, `Boolean` | Excel boolean (`TRUE` / `FALSE`) |
| `Enum` | every enum | text: the constant name (`name()`, not `toString()`) |
| `LocalDate` | `LocalDate` | Excel date |
| `LocalDateTime` | `LocalDateTime` | Excel date with time |

Built-in converters are found through the type hierarchy, so subclasses and implementations of the registered types are covered.

**Types that need a converter** (otherwise V-10), among the most common: `java.util.Date`, `java.sql.Date`, `java.sql.Timestamp`, `Calendar`, `Instant`, `OffsetDateTime`, `ZonedDateTime`, `LocalTime`, `OffsetTime`, `YearMonth`, `Year`, `Duration`, `Period`, `UUID`, `URI`, `URL`, `Path`, `File`, `Currency`, `Locale`, `Optional`, `OptionalInt` and the other optionals, collections, maps, arrays, `Object`, and any type of the application (value objects, nested objects). Types with a time zone are excluded on purpose: Excel has no time zones, and an implicit conversion would hide a choice that belongs to the application.

### 9.3 The contract

```java
@FunctionalInterface
public interface CellConverter<T> {
    CellValue convert(T value, ConversionContext context);
}
```

- The **value is never null**: a null value produces an empty cell that keeps its style, without calling the converter.
- The **result must never be null**. Return `CellValue.blank()` for an empty cell; a null result causes a `SheetsmithGenerationException`.
- Any **`RuntimeException`** thrown by the converter is wrapped in a `SheetsmithGenerationException` that names the sheet, the row and the field, with the original exception as cause.
- A generator uses **one instance** of each converter for all its calls, possibly from several threads at the same time: implementations must be **thread-safe**, ideally stateless.

### 9.4 `CellValue`

A sealed interface with six forms, created with factory methods:

| Factory | Form | Written as |
| --- | --- | --- |
| `CellValue.text(String)` | `CellValue.Text` | A text cell, never interpreted: leading zeros are kept and a text that looks like a number or a formula stays text. Longer than 32,767 characters fails the generation. Null throws `NullPointerException`. |
| `CellValue.number(double)` | `CellValue.Numeric` | A number cell. Excel stores numbers as 64-bit floating point values with 15 significant digits. `NaN` becomes the error `#NUM!`, infinity the error `#DIV/0!`. |
| `CellValue.bool(boolean)` | `CellValue.Bool` | An Excel boolean, shown as `TRUE` or `FALSE`. |
| `CellValue.date(LocalDate)` | `CellValue.Date` | An Excel date; receives the default date format when no format is set. Null throws. |
| `CellValue.dateTime(LocalDateTime)` | `CellValue.DateTime` | An Excel date with time; receives the default date-time format when no format is set. Null throws. |
| `CellValue.blank()` | `CellValue.Blank` | An empty cell that keeps its resolved style. Singleton. |

Because `CellValue` is sealed, converters cannot write anything else, cannot reach the underlying POI cell and cannot bypass the style system.

### 9.5 `ConversionContext`

Passed to every call, it tells where the value is being written. Converters can use it to adapt the value or to build error messages.

| Method | Returns |
| --- | --- |
| `String sheetName()` | the sheet name, as given in `SheetData` |
| `int rowIndex()` | the 1-based data row, in list order |
| `String fieldName()` | the field name, as declared in the sheet class |
| `Class<?> sourceType()` | the sheet class |
| `Class<?> valueType()` | the declared field type; for a primitive field, the primitive type, even though the value is passed boxed |

It is an interface so that methods can be added in future versions without breaking existing converters.

### 9.6 Field converters and application converters

There are two ways to provide a converter.

| | Field converter | Application converter |
| --- | --- | --- |
| Declared with | `@ExcelColumn(converter = X.class)` | `Sheetsmith.Builder.converter(Type.class, instance)`, or a Spring bean |
| Applies to | that column only | every column of that type or of its subtypes, in every sheet class |
| Provided as | a class, created by the converter factory | an instance |
| Can be parameterised | through constructor injection only (Spring or a custom factory) | freely, it is an instance you build |
| Validation | V-11 (compatible type), V-12 (creatable) | duplicates rejected by the builder (`IllegalArgumentException`) or at Spring startup |

**How field converters are created.**

- One instance per converter class and per generator, created the first time a sheet class declaring it is validated or generated, then reused by every column that declares it. A creation that fails is not remembered: it is attempted again, and reported again as V-12, at the next call.
- **Without Spring** (default factory): the converter class must be public, with a public no-argument constructor. A nested converter class must be `public static`.
- **With a custom factory** (`Builder.converterFactory`): the factory decides. A factory that throws or returns null makes the declaring class violate V-12.
- **With the Spring Boot auto-configuration**: if exactly one bean of the converter class exists, that bean is used; otherwise (no bean, or several) a new instance is created with dependency injection (`AutowireCapableBeanFactory.createBean`): its constructor can receive beans and `@Value` properties, without the converter becoming a bean.

**Compatibility check (V-11).** The type handled by a field converter is read from its generic declaration (`implements CellConverter<Money>`, also through superclasses and intermediate interfaces). The field type, boxed if primitive, must be assignable to it: a `CellConverter<Number>` is valid on an `Integer` or `int` field, a `CellConverter<String>` on an `Integer` field is not. When the handled type cannot be determined (for example a generic converter class `MyConverter<T> implements CellConverter<T>`), the check is skipped, and a mismatch shows up at runtime as a `ClassCastException` wrapped in a `SheetsmithGenerationException`.

### 9.7 Resolution order

The converter of a column is chosen once, from the declared type of the field, primitive types being looked up as their wrappers:

1. the field converter, when declared;
2. the application converter registered for the exact type;
3. the application converter registered for the closest superclass;
4. the application converter registered for an implemented interface, the closest first, by breadth-first distance through the type hierarchy;
5. the built-in converters, looked up with the same rules 2 to 4.

Consequences:

- Built-in converters can be replaced by registering an application converter for the same type (for example `Boolean` written as "Yes"/"No").
- An application converter for a **supertype wins over a built-in converter for the exact type**. A converter registered for `Object` therefore applies to every column without a field converter, `String` and numbers included. Register converters for the narrowest type that makes sense.
- When **two interfaces at the same distance** both have an application converter, the resolution is ambiguous and violates V-10. Declare a field converter, or register a converter for the exact type.
- The **declared** type matters, not the runtime type of the value: a field declared as `Object` needs a converter even if it always contains strings.

### 9.8 Spring beans as converters: implications

In a Spring Boot application, **every bean implementing `CellConverter` is registered as an application converter** for the type it handles. This is convenient for types used everywhere, and has consequences that must be understood:

| Situation | What happens |
| --- | --- |
| A converter class annotated with `@Component` (or declared with `@Bean`) | It becomes the application converter for its type: it applies to **every column of that type in every sheet class**, unless a column declares a field converter. |
| Two converter beans handling the same type | Startup fails: `IllegalStateException: converter beans 'a' and 'b' both handle type X; keep only one of them`. |
| A converter bean whose handled type cannot be determined (raw type, or a lambda bean declared with a raw return type) | Startup fails: `IllegalStateException: cannot resolve the type handled by converter bean 'x'; declare it as a class implementing CellConverter<T>, or as a @Bean method returning CellConverter<T>, instead of a lambda or a raw type`. |
| A converter meant for **one column only** | Do **not** declare it as a bean. Declare it on the field with `@ExcelColumn(converter = X.class)`. If it needs dependencies, give it a constructor with those dependencies: the Spring factory creates it with injection without registering it globally. |
| A field converter class that is also a bean (exactly one) | The bean is used for the column, and it is also the application converter for its type. |
| A field converter class with several beans | A new instance is created with injection for the field. |
| Field converter vs application converter on the same column | The field converter always wins. |

Declaring converter beans:

```java
@Component
public class MoneyConverter implements CellConverter<Money> {
    @Override
    public CellValue convert(Money value, ConversionContext context) {
        return CellValue.number(value.amount().doubleValue());
    }
}

@Configuration
class ExportConfiguration {
    @Bean
    CellConverter<UUID> uuidConverter() {               // the generic return type identifies the handled type
        return (value, context) -> CellValue.text(value.toString());
    }
}
```

A field converter with dependencies, not a bean:

```java
public class CountryNameConverter implements CellConverter<String> {

    private final CountryRegistry countries;   // a Spring bean, injected by the factory

    public CountryNameConverter(CountryRegistry countries) {
        this.countries = countries;
    }

    @Override
    public CellValue convert(String isoCode, ConversionContext context) {
        return CellValue.text(countries.displayName(isoCode));
    }
}

@ExcelSheet
public record ShipmentRow(
        @ExcelColumn(header = "Country code", order = 10) String country,
        @ExcelColumn(header = "Country", order = 20, converter = CountryNameConverter.class) String countryName) {
}
```

Here `CountryNameConverter` handles `String`: as a bean it would turn **every** string column of the application into a country name. As a field converter it applies to one column.

### 9.9 Examples

**UUID as text**

```java
public class UuidAsText implements CellConverter<UUID> {
    @Override
    public CellValue convert(UUID value, ConversionContext context) {
        return CellValue.text(value.toString());
    }
}
```

**Instant in a given time zone** (application converter, parameterised)

```java
public final class InstantConverter implements CellConverter<Instant> {

    private final ZoneId zone;

    public InstantConverter(ZoneId zone) {
        this.zone = zone;
    }

    @Override
    public CellValue convert(Instant value, ConversionContext context) {
        return CellValue.dateTime(LocalDateTime.ofInstant(value, zone));
    }
}

Sheetsmith sheetsmith = Sheetsmith.builder()
        .converter(Instant.class, new InstantConverter(ZoneId.of("Europe/Rome")))
        .build();
```

**OffsetDateTime and ZonedDateTime, keeping the local time of the value**

```java
Sheetsmith.builder()
        .converter(OffsetDateTime.class, (value, context) -> CellValue.dateTime(value.toLocalDateTime()))
        .converter(ZonedDateTime.class, (value, context) -> CellValue.dateTime(value.toLocalDateTime()))
        .build();
```

**Legacy `java.util.Date`** (also covers `java.sql.Date` and `java.sql.Timestamp`, which extend it)

```java
public final class LegacyDateConverter implements CellConverter<java.util.Date> {
    private final ZoneId zone;
    public LegacyDateConverter(ZoneId zone) { this.zone = zone; }
    @Override
    public CellValue convert(java.util.Date value, ConversionContext context) {
        return CellValue.dateTime(LocalDateTime.ofInstant(value.toInstant(), zone));
    }
}
```

`java.sql.Date.toInstant()` throws `UnsupportedOperationException`. If `java.sql.Date` values are possible, register a dedicated converter for `java.sql.Date` (closer superclass, so it wins) that uses `toLocalDate()`.

**Enum labels instead of constant names**

```java
public interface Labelled {
    String label();
}

public enum OrderStatus implements Labelled {
    OPEN("Open"), SHIPPED("Shipped"), CANCELLED("Cancelled");
    private final String label;
    OrderStatus(String label) { this.label = label; }
    public String label() { return label; }
}

// Application converter for every enum implementing Labelled.
// For such enums the interface is checked before the built-in Enum converter.
Sheetsmith.builder().converter(Labelled.class, (value, context) -> CellValue.text(value.label())).build();
```

This works because application converters, interfaces included, are searched before built-in converters.

**Boolean as Yes / No** (replaces the built-in behaviour for every boolean column)

```java
Sheetsmith.builder().converter(Boolean.class, (value, context) -> CellValue.text(value ? "Yes" : "No")).build();
```

**Money value object as a number** (format from the style)

```java
public record Money(BigDecimal amount, Currency currency) { }

public final class MoneyConverter implements CellConverter<Money> {
    @Override
    public CellValue convert(Money value, ConversionContext context) {
        return CellValue.number(value.amount().doubleValue());
    }
}

@ExcelColumn(header = "Total", order = 40, format = "#,##0.00", converter = MoneyConverter.class) Money total;
```

**Identifier longer than 15 digits as text**

```java
public final class LongAsText implements CellConverter<Long> {
    @Override
    public CellValue convert(Long value, ConversionContext context) {
        return CellValue.text(Long.toString(value));
    }
}

@ExcelColumn(header = "Card reference", order = 10, converter = LongAsText.class) long reference;
```

**Non-finite numbers as empty cells**

```java
public final class FiniteOrBlank implements CellConverter<Double> {
    @Override
    public CellValue convert(Double value, ConversionContext context) {
        return Double.isFinite(value) ? CellValue.number(value) : CellValue.blank();
    }
}
```

**Optional, collections, durations**

```java
public final class OptionalTextConverter implements CellConverter<Optional<?>> {
    @Override
    public CellValue convert(Optional<?> value, ConversionContext context) {
        return value.map(v -> CellValue.text(v.toString())).orElse(CellValue.blank());
    }
}

public final class TagsConverter implements CellConverter<List<?>> {
    @Override
    public CellValue convert(List<?> value, ConversionContext context) {
        return CellValue.text(value.stream().map(String::valueOf).collect(Collectors.joining(", ")));
    }
}

public final class DurationInHours implements CellConverter<Duration> {
    @Override
    public CellValue convert(Duration value, ConversionContext context) {
        return CellValue.number(value.toMinutes() / 60.0);
    }
}
```

**Using the context in an error**

```java
public final class StrictPercentage implements CellConverter<BigDecimal> {
    @Override
    public CellValue convert(BigDecimal value, ConversionContext context) {
        if (value.signum() < 0 || value.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("percentage out of range in " + context.sourceType().getSimpleName()
                    + "." + context.fieldName() + ": " + value);
        }
        return CellValue.number(value.doubleValue());
    }
}
```

The exception surfaces as a `SheetsmithGenerationException` with sheet, row and field, and with the `IllegalArgumentException` as cause.

### 9.10 `CellConverterFactory`

```java
public interface CellConverterFactory {
    <C extends CellConverter<?>> C create(Class<C> converterClass);
}
```

Creates field converters. Implement it to obtain converters from a dependency injection container other than Spring (CDI, Guice, Dagger, a service locator):

```java
Sheetsmith sheetsmith = Sheetsmith.builder()
        .converterFactory(new CellConverterFactory() {
            @Override
            public <C extends CellConverter<?>> C create(Class<C> type) {
                return injector.getInstance(type);
            }
        })
        .build();
```

The factory is called once per converter class and generator. A `RuntimeException` or a null result is reported as V-12. Spring Boot applications do not need a custom factory: the auto-configuration installs `SpringConverterFactory`.

### 9.11 `CellConverter.None`

The marker used as the default of `@ExcelColumn.converter`, meaning "no field converter". It is never instantiated or invoked; leave the attribute unset instead of writing it.

---

## 10. Spring Boot integration and configuration properties

### 10.1 What the auto-configuration does

With `sheetsmith-spring-boot-starter` on the classpath, the auto-configuration `SheetsmithAutoConfiguration` (registered in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, active when `Sheetsmith` is on the classpath) registers:

1. a **`Sheetsmith` bean**, unless the application defines its own bean of that type. The auto-configured bean is built with:
   - the defaults bound from the `sheetsmith.*` properties;
   - the document properties bound from `sheetsmith.document.*`;
   - a `SpringConverterFactory` for field converters;
   - every `CellConverter` bean of the context as an application converter, registered for its generic type;
2. a **`SheetsmithStartupValidator`**, only when `sheetsmith.validation.packages` is not empty.

No annotation is required in the application: inject `Sheetsmith` where needed.

### 10.2 Defining your own `Sheetsmith` bean

The auto-configured bean is declared with `@ConditionalOnMissingBean`. When the application defines a `Sheetsmith` bean, the auto-configured one backs off and the application bean is used as it is. In that case the application is responsible for its configuration: the `sheetsmith.*` defaults and document properties and the converter beans are **not** applied automatically to a bean built by the application. The startup validator, when enabled, uses whichever `Sheetsmith` bean is in the context.

```java
@Configuration
class SheetsmithConfiguration {

    @Bean
    Sheetsmith sheetsmith(ConfigurableListableBeanFactory beanFactory, SheetsmithProperties properties) {
        return Sheetsmith.builder()
                .defaults(properties.toDefaults())
                .documentProperties(properties.toDocumentProperties())
                .converterFactory(new SpringConverterFactory(beanFactory))
                .converter(Instant.class, new InstantConverter(ZoneId.of("Europe/Rome")))
                .build();
    }
}
```

`SheetsmithProperties.toDefaults()` and `toDocumentProperties()` convert the bound properties; `SpringConverterFactory` is public and can be reused.

### 10.3 Configuration properties

All properties use the prefix `sheetsmith`. They are bound to the immutable record `SheetsmithProperties` and come with metadata for IDE auto-completion.

| Property | Type | Default | Meaning | Constraint |
| --- | --- | --- | --- | --- |
| `sheetsmith.formats.date` | String | `yyyy-mm-dd` | Default Excel format of date cells, such as `LocalDate` values. | not blank |
| `sheetsmith.formats.date-time` | String | `yyyy-mm-dd hh:mm:ss` | Default Excel format of date-time cells, such as `LocalDateTime` values. | not blank |
| `sheetsmith.formats.number` | String | empty (Excel "General") | Default Excel format of numeric cells, integers included. | may be empty |
| `sheetsmith.preset` | `TablePreset` | `NONE` | Preset of sheet classes that declare `preset = INHERIT`: `NONE`, `LIGHT`, `MEDIUM`, `DARK`. | not `INHERIT` |
| `sheetsmith.accent-color` | String | `#4472C4` | Accent colour of sheet classes that declare none: `#RRGGBB` or an `IndexedColors` name. | valid colour |
| `sheetsmith.document.author` | String | `sheetsmith` | Author recorded in every file. Empty leaves it out. | none |
| `sheetsmith.document.application` | String | `sheetsmith` | Application recorded in every file. Empty leaves it out. | none |
| `sheetsmith.validation.packages` | list of String | empty | Packages scanned at startup, subpackages included. Empty disables the startup validation. | none |

Notes:

- **Excel syntax.** Formats use the Excel format syntax ([section 6.6](#66-data-formats)), not `DateTimeFormatter` syntax: `mm` is the month, or the minutes after an hour code.
- **YAML and `#`.** In YAML, quote every value that starts with `#`, otherwise it is read as a comment: `accent-color: "#1F4E79"`, `number: "#,##0.00"`.
- **Invalid values stop the application at startup:** `sheetsmith.preset=INHERIT`, a blank date or date-time format, an invalid accent colour (`IllegalArgumentException` from `SheetsmithDefaults`), or a value that is not a preset name (Spring binding error).
- **Relaxed binding.** Standard Spring Boot relaxed binding applies: enum values can be written in lower case (`light`), and environment variables use the usual form (`SHEETSMITH_PRESET`, `SHEETSMITH_ACCENT_COLOR`, `SHEETSMITH_FORMATS_DATE_TIME`, `SHEETSMITH_DOCUMENT_AUTHOR`, `SHEETSMITH_VALIDATION_PACKAGES=com.example.export,com.example.reports`).

`application.yml`:

```yaml
sheetsmith:
  formats:
    date: dd/mm/yyyy
    date-time: dd/mm/yyyy hh:mm
    number: "#,##0.00"
  preset: LIGHT
  accent-color: "#1F4E79"
  document:
    author: Example Ltd
    application: Billing
  validation:
    packages:
      - com.example.export
      - com.example.reports
```

`application.properties`:

```properties
sheetsmith.formats.date=dd/mm/yyyy
sheetsmith.formats.date-time=dd/mm/yyyy hh:mm
sheetsmith.formats.number=#,##0.00
sheetsmith.preset=LIGHT
sheetsmith.accent-color=#1F4E79
sheetsmith.document.author=Example Ltd
sheetsmith.document.application=Billing
sheetsmith.validation.packages=com.example.export,com.example.reports
```

In `.properties` files `#` starts a comment only at the beginning of a line, so values containing `#` need no quoting.

### 10.4 Startup validation

When `sheetsmith.validation.packages` lists at least one package, the `SheetsmithStartupValidator` runs once all singletons are created:

- it scans the packages and their subpackages for types **annotated directly** with `@ExcelSheet`: concrete and abstract classes, records, interfaces, and nested classes, static or not;
- annotation types are not validated, even when annotated with `@ExcelSheet`, and neither are types only meta-annotated with it through another annotation;
- it calls `validate` on each type with the `Sheetsmith` bean of the context, so converter beans and the Spring converter factory are taken into account;
- the errors of all invalid types are collected into one `SheetsmithConfigurationException`, which stops the application.

Mistakes in sheet classes then surface at startup instead of at the first generation. An interface annotated with `@ExcelSheet` is always reported (it can have no instance fields, so it violates V-02), which is intended: the annotation does not belong on an interface.

### 10.5 Public types of the auto-configuration module

| Type | Role |
| --- | --- |
| `SheetsmithAutoConfiguration` | The auto-configuration. Instantiated by Spring Boot, not by applications. |
| `SheetsmithProperties` (with nested records `Formats`, `Document`, `Validation`) | The bound properties; `toDefaults()` and `toDocumentProperties()` convert them. |
| `SpringConverterFactory` | Creates field converters from the application context. |
| `SheetsmithStartupValidator` | The startup validator (a `SmartInitializingSingleton`). |

---

## 11. Validation and errors

### 11.1 Reading a configuration error

A `SheetsmithConfigurationException` lists every error found, one per line, in this format:

```
[code] package.Class$Nested.element: message
```

| Part | Meaning |
| --- | --- |
| `[code]` | The violated rule, `V-01` to `V-20`. Look it up in [section 11.3](#113-catalogue-of-configuration-errors). |
| `package.Class` | The fully qualified name of the class involved: it tells which source file to open. It is the sheet class, or the style sheet that declares the faulty style. |
| `$Nested` | Present when the class is nested inside another class: `com.example.Reports$InvoiceRow` is the class `InvoiceRow` declared inside `Reports.java`. |
| `element` | What is wrong inside the class: a **field name** (`amount`), **`@ExcelSheet`** (the class-level annotation), **`@ExcelStyle(name)`** (a named style), **`@ExcelStyle(#n)`** (the n-th style declared on the class, when its name is blank), or **`sheets[i]`** (the i-th element, 0-based, of the list passed to `generate`, for input errors). It is omitted when the error concerns the class or the input as a whole. |
| `message` | The problem, often with the attribute or slot involved, for example `(referenced by body.lastRow)`. |

The class and the separating dot are omitted for input errors, and the colon is omitted when there is neither class nor element. Source line numbers are not available: annotations do not carry them at runtime.

Example of a complete message, as it appears in a log:

```
cloud.baldilorenzo.sheetsmith.SheetsmithConfigurationException: [V-06] com.example.export.InvoiceLine.amount: style 'money' not found (referenced by styles.base)
[V-15] com.example.export.InvoiceLine.@ExcelSheet: titleStyle is set but title is empty
[V-13] com.example.export.CorporateStyles.@ExcelStyle(header): fillColor '#1F4E7' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant
[V-19] sheets[1]: sheet name 'Q3/2026' must not contain any of \ / ? * [ ] :
```

Reading it: the first line concerns the field `amount` of `InvoiceLine`, whose column slot `styles.base` references a style `money` that does not exist; the third concerns the style `header` declared on the style sheet `CorporateStyles`; the last concerns the second sheet passed to `generate`.

Programmatic access: `exception.errors()` returns the `ConfigurationError` records, with `code()`, `type()`, `element()` and `message()`.

### 11.2 When validation happens

| Rules | Phase | Checked by |
| --- | --- | --- |
| V-01 to V-09, V-13 to V-17 | Extraction of the metadata of a sheet class | `generate`, `validate`, startup validation |
| V-10 to V-12 | Binding of a converter to each column | `generate`, `validate`, startup validation |
| V-18 to V-20 | Input of `generate` | `generate` only |

Validation is fail-fast but complete: every rule is checked and all the errors of the input and of all the sheet classes involved are reported together in one exception. Nothing is written when there is at least one error. Anomalies are never corrected silently.

### 11.3 Catalogue of configuration errors

Each entry gives the rule, the element reported, a minimal example that triggers it, the message and the fix.

#### V-01: the class is annotated with `@ExcelSheet`

- **Element:** none.
- **Example:** `SheetData.of("Rows", PlainRecord.class, rows)` where `PlainRecord` has no `@ExcelSheet`; or `@ExcelSheet` placed only on a superclass.
- **Message:** `[V-01] com.example.PlainRecord: the class is not annotated with @ExcelSheet`
- **Fix:** annotate the class passed to `SheetData`. The annotation is not inherited.

#### V-02: the class has at least one `@ExcelColumn` field

- **Element:** none.
- **Example:** `@ExcelSheet public record Empty(String name) { }`
- **Message:** `[V-02] com.example.Empty: no field is annotated with @ExcelColumn`
- **Fix:** annotate at least one field. Remember that export is opt-in.

#### V-03: `order` values are unique

- **Element:** the field found second.
- **Example:** two columns with `order = 10`, `code` and `name`.
- **Message:** `[V-03] com.example.Row.name: order 10 is also used by field code`
- **Fix:** give each column a different order. Inherited columns count.

#### V-04: `header` is not blank

- **Element:** the field.
- **Example:** `@ExcelColumn(header = " ", order = 10) String code;`
- **Message:** `[V-04] com.example.Row.code: header is blank`
- **Fix:** set a header text.

#### V-05: `@ExcelColumn` is not on a static field

- **Element:** the field.
- **Example:** `@ExcelColumn(header = "Total", order = 99) static int TOTAL;`
- **Message:** `[V-05] com.example.Row.TOTAL: @ExcelColumn is not allowed on a static field`
- **Fix:** move the annotation to an instance field.

#### V-06: every referenced style exists

- **Element:** the field for `headerStyle` and column slots; `@ExcelSheet` for `titleStyle`, header and body slots.
- **Example:** `body = @BodyStyles(lastRow = "totals")` when the style is named `total`.
- **Message:** `[V-06] com.example.Row.@ExcelSheet: style 'totals' not found (referenced by body.lastRow)`
- **Slot names in the message:** `titleStyle`, `header.base`, `header.firstColumn`, `header.lastColumn`, `body.base`, `body.odd`, `body.even`, `body.firstRow`, `body.lastRow`, `body.firstColumn`, `body.lastColumn`, `headerStyle`, `styles.base`, `styles.odd`, `styles.even`, `styles.firstRow`, `styles.lastRow`.
- **Fix:** declare the style, reference the style sheet that declares it, or fix the name. Names are case-sensitive and matched exactly.

#### V-07: style names are unique within one declaring class

- **Element:** `@ExcelStyle(name)`; the class is the sheet class or the style sheet that declares the duplicate.
- **Example:** `@ExcelStyle(name = "header", bold = Toggle.TRUE)` twice on the same class.
- **Message:** `[V-07] com.example.CorporateStyles.@ExcelStyle(header): style 'header' is declared more than once`
- **Fix:** rename or merge the duplicates. A style on the sheet class with the same name as a style of a style sheet is not a duplicate: it is an intentional override.

#### V-08: the style sheets of one class do not define the same name

- **Element:** `@ExcelSheet` of the sheet class.
- **Example:** `styleSheets = {CorporateStyles.class, FinanceStyles.class}`, both declaring `money`.
- **Message:** `[V-08] com.example.Row.@ExcelSheet: styleSheets: style 'money' is defined by both com.example.CorporateStyles and com.example.FinanceStyles`
- **Fix:** rename the style in one style sheet, or redefine it on the sheet class.

#### V-09: every class in `styleSheets` has `@ExcelStyleSheet`

- **Element:** `@ExcelSheet` of the sheet class.
- **Example:** `styleSheets = CorporateStyles.class` without `@ExcelStyleSheet` on `CorporateStyles`.
- **Message:** `[V-09] com.example.Row.@ExcelSheet: styleSheets: com.example.CorporateStyles is not annotated with @ExcelStyleSheet`
- **Fix:** annotate the style sheet. Expect V-06 errors for its styles in the same report, since they are not loaded.

#### V-10: a converter exists for the column type, and the resolution is not ambiguous

- **Element:** the field.
- **Example (missing):** `@ExcelColumn(header = "Id", order = 10) UUID id;` without a converter.
- **Message:** `[V-10] com.example.Row.id: no converter for type java.util.UUID: declare one with @ExcelColumn(converter = ...) or register one for the type`
- **Example (ambiguous):** a field type implementing two interfaces that both have an application converter, at the same distance.
- **Message:** `[V-10] com.example.Row.code: converter for type com.example.Code is ambiguous: candidates [com.example.Labelled, com.example.Coded]: declare one with @ExcelColumn(converter = ...) or register one for the exact type`
- **Fix:** declare a field converter, or register an application converter for the type (for the exact type in the ambiguous case). Validate with a generator configured like the production one.

#### V-11: the field converter handles a compatible type

- **Element:** the field.
- **Example:** `@ExcelColumn(header = "Qty", order = 20, converter = UuidAsText.class) int quantity;`
- **Message:** `[V-11] com.example.Row.quantity: converter com.example.UuidAsText handles java.util.UUID, which is not assignable from the field type int`
- **Fix:** use a converter whose handled type is the field type or one of its supertypes (primitives count as their wrappers).

#### V-12: the field converter can be created

- **Element:** the field.
- **Examples and messages:**
  - no public no-argument constructor: `[V-12] com.example.Row.amount: converter com.example.MoneyConverter cannot be created: com.example.MoneyConverter has no public no-argument constructor`
  - constructor that throws: `... cannot be created: constructor of com.example.MoneyConverter failed: java.lang.IllegalStateException: ...`
  - class not public, abstract, or otherwise not instantiable: `... cannot be created: cannot instantiate com.example.MoneyConverter: ...`
  - custom factory that returns null: `... cannot be created: the converter factory returned null`
  - Spring factory unable to create it (missing dependency, for example): the message of the Spring exception.
- **Fix:** make the converter a public class (public static if nested) with a public no-argument constructor, or configure a factory that can create it, such as the Spring Boot one.

#### V-13: colours have a valid syntax

- **Element:** `@ExcelStyle(name)` for style colours; `@ExcelSheet` for `accentColor` and `outerBorderColor`.
- **Example:** `fillColor = "#1F4E7"`, `fontColor = "dark_blue"`, `accentColor = "blue"`.
- **Message:** `[V-13] com.example.Row.@ExcelStyle(header): fillColor '#1F4E7' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant`
- **Fix:** use `#RRGGBB` with six hexadecimal digits, or an `IndexedColors` name in upper case.

#### V-14: numeric attributes are in range

- **Element:** `@ExcelStyle(name)` for style attributes; the field for `width`.
- **Ranges and messages:**
  - `rotation` -90 to 90 or 255: `rotation 120 is out of range -90 to 90, or 255`
  - `indent` 0 to 250: `indent 300 is out of range 0 to 250`
  - `fontSize` 1 to 409: `fontSize 0 is out of range 1 to 409`
  - `width` 1 to 255: `[V-14] com.example.Row.description: width 300 is out of range 1 to 255`
- **Fix:** use a value in range. `ExcelStyle.UNSET` is always accepted.

#### V-15: `titleStyle` only with `title`

- **Element:** `@ExcelSheet`.
- **Example:** `@ExcelSheet(titleStyle = "title")` without `title`.
- **Message:** `[V-15] com.example.Row.@ExcelSheet: titleStyle is set but title is empty`
- **Fix:** set a title, or remove the title style.

#### V-16: style names are not blank

- **Element:** `@ExcelStyle(#n)`, n being the 1-based position of the declaration on its class.
- **Example:** `@ExcelStyle(name = "", bold = Toggle.TRUE)` as the second style of the class.
- **Message:** `[V-16] com.example.Row.@ExcelStyle(#2): style name is blank`
- **Fix:** name the style.

#### V-17: every column value is accessible

- **Element:** the field.
- **Example:** a sheet class in a named module whose package is not open, read through a private field.
- **Message:** `[V-17] com.example.export.Row.amount: value is not accessible (<reason>); add a public getter or open package com.example.export to sheetsmith, for example with 'opens com.example.export;' in module-info.java`
- **Fix:** add a public getter with a compatible return type, or open the package ([section 4.2.1](#421-value-access)).

#### V-18: the sheet list is not empty

- **Element:** none; no class.
- **Example:** `sheetsmith.generate(List.of())`.
- **Message:** `[V-18] the sheet list is empty`
- **Fix:** pass at least one sheet. An empty data list for a sheet is valid; an empty list of sheets is not.

#### V-19: sheet names are valid

- **Element:** `sheets[i]`; no class.
- **Messages:**
  - length: `[V-19] sheets[0]: sheet name '' must be 1 to 31 characters long (it has 0)`
  - characters: `[V-19] sheets[2]: sheet name 'Q3/2026' must not contain any of \ / ? * [ ] :`
  - apostrophe: `[V-19] sheets[1]: sheet name ''Draft'' must not start or end with '`
- **Fix:** choose a valid name. sheetsmith never shortens or cleans names.

#### V-20: sheet names are unique, ignoring case

- **Element:** `sheets[i]` of the later duplicate; no class.
- **Example:** sheets named `Summary` and `SUMMARY`.
- **Message:** `[V-20] sheets[3]: sheet name 'SUMMARY' is already used by sheets[0] 'Summary', ignoring case`
- **Fix:** rename one of the sheets.

### 11.4 Generation errors

A `SheetsmithGenerationException` is thrown while a sheet is written. Its message ends with the location: `(sheet 'S', row N, field 'f')`, where the row and the field appear only when relevant.

| Cause | Message | Row | Field | Cause attached |
| --- | --- | --- | --- | --- |
| Null element in the data list | `null element in the data list (sheet 'Orders', row 7)` | yes | no | no |
| Getter, accessor or field read that throws | `cannot read the value (method getTotal()): java.lang.IllegalStateException: ... (sheet 'Orders', row 7, field 'total')` | yes | yes | yes |
| Converter that throws | `converter failed: java.lang.IllegalArgumentException: ... (sheet 'Orders', row 7, field 'total')` | yes | yes | yes |
| Converter that returns null | `converter returned null; return CellValue.blank() for an empty cell (sheet 'Orders', row 7, field 'total')` | yes | yes | no |
| Text longer than 32,767 characters | `text of 40000 characters exceeds the Excel limit of 32767 (sheet 'Orders', row 7, field 'notes')` | yes | yes | no |
| Too many rows for one sheet | `the sheet needs 1048580 rows, more than the Excel limit of 1048576 (sheet 'Orders')` | no (0) | no | no |

The accessor description inside the message is `method getX()` when a getter was used, or `field x` when the field was read directly. The row index is the 1-based position in the data list, so `row 7` is `rows.get(6)`. The row limit counts the title and the header, and is checked before the sheet is written.

Checked exceptions thrown by a getter without declaration (for example through "sneaky throw" techniques) are wrapped in `java.lang.reflect.UndeclaredThrowableException` and then reported like any other getter failure. `Error`s (such as `OutOfMemoryError` or `StackOverflowError`) are not wrapped.

### 11.5 Infrastructure errors

| Error | When | Notes |
| --- | --- | --- |
| `java.io.UncheckedIOException` | Serialisation of the workbook fails, including a failure of the caller's stream (closed connection, full disk) | Not a sheetsmith exception, on purpose. The original `IOException` is the cause. With the stream method, partial content may have been written. |
| `NullPointerException` | A null argument: `sheets`, an element of `sheets`, `out`, `type`, or a null component of the public records | Programming error. |
| `OutOfMemoryError` | The workbook does not fit in the heap | See [section 12.3](#123-very-large-exports). |

### 11.6 Errors outside generation

| Source | Exception | Message |
| --- | --- | --- |
| `Builder.converter` called twice for the same type | `IllegalArgumentException` | `a converter is already registered for type X` |
| `SheetsmithDefaults` with invalid values | `IllegalArgumentException` | `dateFormat must not be blank`, `dateTimeFormat must not be blank`, `preset must not be INHERIT`, `accentColor 'X' is not a valid colour: ...` |
| Two converter beans for the same type (Spring) | `IllegalStateException` at startup | `converter beans 'a' and 'b' both handle type X; keep only one of them` |
| Converter bean with an undeterminable type (Spring) | `IllegalStateException` at startup | `cannot resolve the type handled by converter bean 'x'; ...` |
| Invalid `sheetsmith.*` property (Spring) | binding error or `IllegalArgumentException` at startup | as above |
| Startup validation failure (Spring) | `SheetsmithConfigurationException` at startup | the full list of errors |

### 11.7 Testing sheet classes

```java
class SheetClassesTest {

    private final Sheetsmith sheetsmith = Sheetsmith.builder()
            .converter(Money.class, new MoneyConverter())     // configure like production
            .build();

    @ParameterizedTest
    @ValueSource(classes = {CustomerRow.class, InvoiceLine.class, OrderRow.class})
    void isValid(Class<?> sheetClass) {
        assertDoesNotThrow(() -> sheetsmith.validate(sheetClass));
    }

    @Test
    void reportsTheExpectedError() {
        SheetsmithConfigurationException e = assertThrows(SheetsmithConfigurationException.class,
                () -> sheetsmith.validate(BrokenRow.class));
        assertThat(e.errors()).extracting(ConfigurationError::code).containsExactly("V-06");
    }
}
```

In a Spring Boot test, inject the `Sheetsmith` bean to validate with the real converters, or rely on the startup validation, which fails the test context.

---

## 12. Limits and known behaviours

This section lists every known limit and behaviour that may surprise, including those that were deliberately left as they are and documented instead of being turned into errors.

### 12.1 Excel limits

| Case | What happens | What to do |
| --- | --- | --- |
| Date or date-time before 1900-01-01 | Excel cannot represent it: the cell contains `-1` and is displayed as `#####`. No error is raised. | Convert such values to text with a converter. |
| `NaN` or infinite number | The cell becomes an Excel error: `#NUM!` for `NaN`, `#DIV/0!` for infinity. No error is raised. A `BigInteger` or `BigDecimal` too large for a `double` becomes infinite. | Map them, for example to `CellValue.blank()`. |
| Number with more than 15 significant digits | Precision is lost: Excel stores 64-bit floating point numbers. A `long` above 2^53 or a large or very precise `BigDecimal` is rounded. No error is raised. | Write identifiers and exact decimals as text. |
| Text longer than 32,767 characters | Excel cannot store it: `SheetsmithGenerationException`. | Shorten the text before writing it. |
| More than 1,048,576 rows in a sheet, title and header included | `SheetsmithGenerationException` before the sheet is written. | Split the data across several sheets. |
| Sheet named `History` | Excel reserves the name for change tracking and may refuse or repair the file. It is not rejected by sheetsmith. | Choose another sheet name. |
| Sheet name rules | Enforced by V-19 and V-20. | Clean names built from data. |
| More than 16,384 columns | Beyond the Excel limit; not checked by sheetsmith and not realistic for an annotated class. | None. |
| Cell styles (about 64,000 per file) | Not a practical limit: equal styles are shared, so the number of styles depends on the number of distinct styles, not on the number of cells. | None. |

### 12.2 Value conversion

| Behaviour | Explanation | What to do |
| --- | --- | --- |
| `float` values show extra digits | Numbers are written through `doubleValue()`; a `float` such as `0.1f` becomes `0.10000000149011612`, visible with the General format. | Use `double` or `BigDecimal`, or set a number format such as `0.00`. |
| `BigDecimal` scale is not preserved | `2.50` is written as the number `2.5`; trailing zeros are a display matter. | Set a format, for example `0.00`. |
| Enums are written with `name()` | `toString()` overrides are ignored. | Register a converter ([section 9.9](#99-examples)). |
| Fractions of a second | Excel stores times with a precision of about a millisecond; finer precision of `LocalDateTime` is lost. | None, or write as text. |
| Text that looks like a number or a formula | Text values are always written as text cells: `"00123"` keeps its zeros, `"=SUM(A1:A2)"` is not a formula. | None: this is intended. |
| A getter with a non-matching return type | The getter is ignored and the field is read directly ([section 4.2.1](#421-value-access)). | Align the getter return type with the field type. |
| Default formats for blank cells | Empty cells (null values or `CellValue.blank()`) receive no default format, only the formats set by styles. | None. |
| `numberFormat` applies to integers too | A default `#,##0.00` shows decimals on integer columns. | Give integer columns `format = "0"` or `"#,##0"`. |

### 12.3 Very large exports

The whole workbook is built in memory before it is written, so memory grows with the number of cells. The following measurements come from the acceptance tests of version 1.0.0, with a 4 GB heap and 10 columns. They are **indicative** and depend on the data, the JVM and the hardware.

| Measure | Value |
| --- | --- |
| Heap needed | about 1.4 GB per million cells |
| Generation time | about 10 seconds every 100,000 rows |
| Effect of automatic column sizing | multiplies the time by about 2.4 |
| Largest successful export | 350,000 rows (3.5 million cells) |
| Failed export | 500,000 rows, `OutOfMemoryError` |
| `byte[]` vs `OutputStream` | no measurable difference |

Recommendations:

1. Measure with realistic volumes and size the heap accordingly.
2. For large sheets, set `autoSizeColumns = false` and give each column an explicit `width`.
3. Writing to a stream instead of returning a `byte[]` does not reduce memory significantly: the workbook, not the file, takes most of it.
4. Concurrent large exports add up: limit their concurrency (for example with a bounded executor or a semaphore) on memory-constrained services.
5. Split very large datasets across several workbooks rather than several sheets of one workbook, since all the sheets of a workbook are in memory together.

A streaming mode for very large volumes is not part of version 1.0.0: see [section 15](#15-work-in-progress).

### 12.4 Automatic column sizing

| Behaviour | Explanation |
| --- | --- |
| Depends on installed fonts | Apache POI measures text with Java AWT fonts. On servers or containers without fonts or without the AWT native libraries, measuring fails and sheetsmith falls back to an estimate based on the number of characters of the displayed values, plus 2, capped at 255. The estimate does not account for proportional fonts, bold text or font sizes, so columns may be slightly wider or narrower than an exact measure. |
| Title excluded, with one exception | The merged title never widens its columns. With **a single column and a title**, however, there is nothing to merge: the exact measurement of Apache POI then includes the title text, and the column becomes as wide as the title, while the fallback estimate ignores the title. Set an explicit `width` on the column when this matters. |
| Cost | Sizing reads every cell of the column; on large sheets it dominates the generation time. |
| Width cap | The maximum width is 255 characters. |

To make the exact measurement available on Linux containers, install a font package and fontconfig in the image (for example `fontconfig` and a DejaVu or Liberation font package), and run the JVM with `-Djava.awt.headless=true`.

### 12.5 Layout and styles

| Behaviour | Explanation |
| --- | --- |
| Row heights are not set | Rows with wrapped text keep the default height until the spreadsheet application adjusts them. |
| `locked` and `hidden` have no visible effect | They apply only to protected sheets, and sheetsmith does not protect sheets. |
| Indexed colours vary | They depend on the palette of the application that opens the file. Prefer hexadecimal colours. |
| Font availability | A font name not installed on the reader's machine is substituted by the spreadsheet application. |
| Regional display | Thousand and decimal separators, and month and day names, follow the regional settings of the reader. |
| Data formats are not validated | An invalid format code is written as it is; Excel may ignore it or report the file as needing repair. |
| Empty data list | The sheet has the title (if any) and the header; the auto-filter covers the header only; the outer frame closes below the header. |

### 12.6 Validation and caching

| Behaviour | Explanation |
| --- | --- |
| Invalid classes are re-validated at every call | They are not cached, so the cost of validation is paid again until the class is fixed. |
| A failing field converter creation is retried | It is not remembered as failed; it is attempted again at each validation or generation. |
| Startup validation uses the context bean | A sheet class valid only with a converter registered elsewhere (for example on a different generator) is reported. |
| Metadata cache is shared | All generators of the same class loader share the metadata cache; converter bindings are per generator. |

---

## 13. Recipes

Complete, self-contained use cases. Package declarations and imports are omitted where obvious. All names and data are fictional.

### 13.1 Minimal export

```java
@ExcelSheet
public record ProductRow(
        @ExcelColumn(header = "SKU", order = 10) String sku,
        @ExcelColumn(header = "Name", order = 20) String name,
        @ExcelColumn(header = "Price", order = 30) BigDecimal price) {
}

byte[] file = Sheetsmith.builder().build()
        .generate(List.of(SheetData.of("Products", ProductRow.class, products)));
```

Result: header in row 1, frozen; one row per product; columns sized to content; no styles (Excel defaults); prices in the General format, unless a default number format is configured.

### 13.2 Several sheets with different classes

```java
List<SheetData<?>> sheets = List.of(
        SheetData.of("Summary", SummaryRow.class, List.of(summary)),
        SheetData.of("Customers", CustomerRow.class, customers),
        SheetData.of("Orders", OrderRow.class, orders));

byte[] file = sheetsmith.generate(sheets);
```

Sheets appear in list order. All three classes are validated before anything is written, and their errors, if any, are reported together.

### 13.3 One class, several sheets

```java
Map<YearMonth, List<OrderRow>> byMonth = orders.stream()
        .collect(Collectors.groupingBy(order -> YearMonth.from(order.date()), TreeMap::new, Collectors.toList()));

List<SheetData<?>> sheets = byMonth.entrySet().stream()
        .<SheetData<?>>map(e -> SheetData.of(e.getKey().toString(), OrderRow.class, e.getValue()))
        .toList();

byte[] file = sheetsmith.generate(sheets);
```

`YearMonth.toString()` gives names such as `2026-09`, which are valid sheet names. The metadata of `OrderRow` is computed once.

### 13.4 Totals row

sheetsmith does not compute totals or write formulas: the total is a data row like the others, usually the last element of the list, styled with the `lastRow` slot.

```java
@ExcelSheet(body = @BodyStyles(lastRow = "total"))
@ExcelStyle(name = "total", bold = Toggle.TRUE, borderTop = Border.DOUBLE)
public record SalesRow(
        @ExcelColumn(header = "Region", order = 10) String region,
        @ExcelColumn(header = "Revenue", order = 20, format = "#,##0.00") BigDecimal revenue) {
}

List<SalesRow> rows = new ArrayList<>(regions);
rows.add(new SalesRow("Total", regions.stream().map(SalesRow::revenue).reduce(BigDecimal.ZERO, BigDecimal::add)));
```

With a preset, the total row also receives the zebra of its parity; add `fillPattern = Fill.NO_FILL` or a `fillColor` to `total` to control it. When the auto-filter is enabled, remember that the total row is part of the filtered range.

### 13.5 Zebra rows without a preset

```java
@ExcelSheet(header = @HeaderStyles(base = "header"), body = @BodyStyles(even = "zebra"))
@ExcelStyle(name = "header", bold = Toggle.TRUE, borderBottom = Border.THIN)
@ExcelStyle(name = "zebra", fillColor = "#F2F2F2")
public record LogRow(
        @ExcelColumn(header = "When", order = 10, format = "dd/mm/yyyy hh:mm:ss") LocalDateTime when,
        @ExcelColumn(header = "Message", order = 20, width = 80) String message) {
}
```

### 13.6 Highlighting a key column and right-aligning numbers

```java
@ExcelSheet(preset = TablePreset.MEDIUM, body = @BodyStyles(firstColumn = "key"))
@ExcelStyle(name = "key", bold = Toggle.TRUE)
@ExcelStyle(name = "right", align = Align.RIGHT)
public record StockRow(
        @ExcelColumn(header = "Item", order = 10) String item,
        @ExcelColumn(header = "On hand", order = 20, format = "#,##0", headerStyle = "right") int onHand,
        @ExcelColumn(header = "Reserved", order = 30, format = "#,##0", headerStyle = "right") int reserved) {
}
```

Numbers are right-aligned by Excel by default (`GENERAL` alignment); the `right` style aligns the header texts above them.

### 13.7 Framed table

```java
@ExcelSheet(title = "Attendance", outerBorder = Border.MEDIUM, outerBorderColor = "#404040",
        body = @BodyStyles(base = "grid"))
@ExcelStyle(name = "grid", border = Border.HAIR, borderColor = "#BFBFBF")
public record AttendanceRow(
        @ExcelColumn(header = "Name", order = 10) String name,
        @ExcelColumn(header = "Present", order = 20) boolean present) {
}
```

The frame is drawn on the outer edges of header and data, over the hairline grid; the title stays outside.

### 13.8 Corporate report with a shared style sheet

```java
@ExcelStyleSheet
@ExcelStyle(name = "corp-title", fontName = "Arial", fontSize = 16, bold = Toggle.TRUE, fontColor = "#0B3D5C")
@ExcelStyle(name = "corp-header", fontName = "Arial", bold = Toggle.TRUE, wrapText = Toggle.TRUE,
        verticalAlign = VerticalAlign.CENTER)
@ExcelStyle(name = "corp-cell", fontName = "Arial", fontSize = 10)
@ExcelStyle(name = "corp-money", align = Align.RIGHT, dataFormat = "#,##0.00")
@ExcelStyle(name = "corp-total", bold = Toggle.TRUE, borderTop = Border.DOUBLE, borderTopColor = "#0B3D5C")
public final class CorporateStyles {
    private CorporateStyles() {
    }
}

@ExcelSheet(title = "Supplier balances", titleStyle = "corp-title",
        preset = TablePreset.LIGHT, accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"),
        autoFilter = true)
public record SupplierBalanceRow(
        @ExcelColumn(header = "Supplier", order = 10, width = 40) String supplier,
        @ExcelColumn(header = "Balance", order = 20, styles = @ColumnStyles(base = "corp-money")) BigDecimal balance) {
}
```

Every report referencing `CorporateStyles` gets the same fonts and formats; the `LIGHT` preset with the corporate accent provides lines and zebra.

### 13.9 Value objects and money

```java
public record Money(BigDecimal amount, Currency currency) { }

@Component   // application-wide: every Money column, in every sheet class
public class MoneyConverter implements CellConverter<Money> {
    @Override
    public CellValue convert(Money value, ConversionContext context) {
        return CellValue.number(value.amount().doubleValue());
    }
}

@ExcelSheet
public record InvoiceRow(
        @ExcelColumn(header = "Invoice", order = 10) String number,
        @ExcelColumn(header = "Total", order = 20, format = "#,##0.00") Money total,
        @ExcelColumn(header = "Currency", order = 30, converter = CurrencyCodeConverter.class) Currency currency) {
}

public class CurrencyCodeConverter implements CellConverter<Currency> {
    @Override
    public CellValue convert(Currency value, ConversionContext context) {
        return CellValue.text(value.getCurrencyCode());
    }
}
```

### 13.10 Dates and times with time zones

```java
@Bean
CellConverter<Instant> instantConverter(@Value("${app.export.zone:Europe/Rome}") ZoneId zone) {
    return (value, context) -> CellValue.dateTime(LocalDateTime.ofInstant(value, zone));
}
```

```java
@ExcelSheet
public record AuditRow(
        @ExcelColumn(header = "At", order = 10, format = "dd/mm/yyyy hh:mm:ss") Instant at,
        @ExcelColumn(header = "User", order = 20) String user) {
}
```

The zone is an explicit application choice. Without the converter, `AuditRow` violates V-10.

### 13.11 Codes and identifiers as text

Postal codes, product codes, IBANs and long numeric identifiers must not become numbers: leading zeros would disappear and digits beyond the 15th would be lost.

```java
@ExcelSheet
public record AccountRow(
        @ExcelColumn(header = "Postal code", order = 10) String postalCode,         // String: already text
        @ExcelColumn(header = "Reference", order = 20, converter = LongAsText.class) long reference) {
}
```

Keep such values as `String` in the sheet class whenever possible.

### 13.12 Writing to a file and attaching to an e-mail

```java
// To a file: stream method
try (OutputStream out = Files.newOutputStream(Path.of("report.xlsx"))) {
    sheetsmith.generate(sheets, out);
}

// As an attachment: byte method
byte[] file = sheetsmith.generate(sheets);
helper.addAttachment("report.xlsx", new ByteArrayResource(file),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
```

### 13.13 Download from a plain servlet

```java
@Override
protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    List<SheetData<?>> sheets = List.of(SheetData.of("Customers", CustomerRow.class, loadCustomers()));
    byte[] file = sheetsmith.generate(sheets);   // errors happen here, before the response is touched
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", "attachment; filename=\"customers.xlsx\"");
    response.setContentLength(file.length);
    response.getOutputStream().write(file);
}
```

For the Spring MVC equivalent see [section 2.3](#23-download-from-a-spring-mvc-controller).

### 13.14 Validation at startup and in tests

```yaml
sheetsmith:
  validation:
    packages: com.example.export
```

Every `@ExcelSheet` type under `com.example.export` is validated when the application starts; a mistake prevents the startup with the complete list of errors. For tests, see [section 11.7](#117-testing-sheet-classes).

### 13.15 Sheet names built from data

Names that come from data (customer names, categories) must be made valid by the caller, because sheetsmith rejects invalid names instead of changing them.

```java
static String sheetName(String raw, Set<String> used) {
    String name = raw.replaceAll("[\\\\/?*\\[\\]:]", "_").strip();
    while (name.startsWith("'")) name = name.substring(1);
    while (name.endsWith("'")) name = name.substring(0, name.length() - 1);
    if (name.isEmpty()) name = "Sheet";
    if (name.length() > 31) name = name.substring(0, 31);
    if (name.equalsIgnoreCase("History")) name = "History_";
    String candidate = name;
    for (int i = 2; !used.add(candidate.toLowerCase(Locale.ROOT)); i++) {
        String suffix = " (" + i + ")";
        candidate = name.substring(0, Math.min(name.length(), 31 - suffix.length())) + suffix;
    }
    return candidate;
}
```

### 13.16 Plain Java with a dependency injection container

```java
Sheetsmith sheetsmith = Sheetsmith.builder()
        .converterFactory(new CellConverterFactory() {
            @Override
            public <C extends CellConverter<?>> C create(Class<C> type) {
                return container.get(type);          // CDI, Guice, Dagger, ...
            }
        })
        .converter(Instant.class, new InstantConverter(ZoneId.of("UTC")))
        .defaults(new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "", TablePreset.MEDIUM, "#4472C4"))
        .build();
```

### 13.17 Large exports

```java
@ExcelSheet(autoSizeColumns = false, freezeHeader = true)
public record MovementRow(
        @ExcelColumn(header = "Id", order = 10, width = 12) long id,
        @ExcelColumn(header = "Date", order = 20, width = 12, format = "dd/mm/yyyy") LocalDate date,
        @ExcelColumn(header = "Description", order = 30, width = 50) String description,
        @ExcelColumn(header = "Amount", order = 40, width = 14, format = "#,##0.00") BigDecimal amount) {
}
```

Explicit widths and no automatic sizing; a heap sized from the measurements in [section 12.3](#123-very-large-exports); bounded concurrency; data split across files beyond a few hundred thousand rows.

### 13.18 Columns inherited from a base class

```java
public abstract class AuditedRow {
    @ExcelColumn(header = "Created by", order = 900) protected String createdBy;
    @ExcelColumn(header = "Created on", order = 910, format = "dd/mm/yyyy") protected LocalDate createdOn;
    public String getCreatedBy() { return createdBy; }
    public LocalDate getCreatedOn() { return createdOn; }
}

@ExcelSheet
public class ContractRow extends AuditedRow {
    @ExcelColumn(header = "Contract", order = 10) private String number;
    @ExcelColumn(header = "Party", order = 20) private String party;
    public String getNumber() { return number; }
    public String getParty() { return party; }
}
```

The audit columns (orders 900 and 910) follow the contract columns in every subclass. Orders must be unique across the whole hierarchy. Named styles must be declared on `ContractRow` (or a style sheet), not on `AuditedRow`.

### 13.19 Complete example: monthly case-handling report

A fictional service company produces a monthly report of the cases handled by its teams, in the corporate style shared by all its reports.

```java
public enum CaseStatus implements Labelled {
    OPEN("Open"), WAITING("Waiting for customer"), CLOSED("Closed");
    private final String label;
    CaseStatus(String label) { this.label = label; }
    @Override public String label() { return label; }
}

@ExcelSheet(
        title = "Case handling, September 2026",
        titleStyle = "corp-title",
        preset = TablePreset.LIGHT,
        accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        autoFilter = true,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", firstColumn = "case-number"))
@ExcelStyle(name = "case-number", bold = Toggle.TRUE)
@ExcelStyle(name = "centered", align = Align.CENTER)
public record CaseRow(
        @ExcelColumn(header = "Case", order = 10, width = 14) String number,
        @ExcelColumn(header = "Opened on", order = 20, format = "dd/mm/yyyy",
                styles = @ColumnStyles(base = "centered")) LocalDate openedOn,
        @ExcelColumn(header = "Team", order = 30) String team,
        @ExcelColumn(header = "Category", order = 40) String category,
        @ExcelColumn(header = "Status", order = 50) CaseStatus status,
        @ExcelColumn(header = "Due on", order = 60, format = "dd/mm/yyyy",
                styles = @ColumnStyles(base = "centered")) LocalDate dueOn,
        @ExcelColumn(header = "Days open", order = 70, format = "0") int daysOpen,
        @ExcelColumn(header = "Charged", order = 80, styles = @ColumnStyles(base = "corp-money")) BigDecimal charged,
        @ExcelColumn(header = "Notes", order = 90, width = 60) String notes) {
}
```

Spring configuration:

```yaml
sheetsmith:
  formats:
    date: dd/mm/yyyy
  document:
    author: Example Services Ltd
    application: Case Reporting
  validation:
    packages: com.example.reporting
```

```java
@Configuration
class ReportingConfiguration {
    @Bean
    CellConverter<Labelled> labelConverter() {
        return (value, context) -> CellValue.text(value.label());
    }
}

@Service
class CaseReportService {

    private final Sheetsmith sheetsmith;
    private final CaseQueries queries;

    CaseReportService(Sheetsmith sheetsmith, CaseQueries queries) {
        this.sheetsmith = sheetsmith;
        this.queries = queries;
    }

    void writeMonthlyReport(YearMonth month, OutputStream out) {
        List<SheetData<?>> sheets = List.of(
                SheetData.of("Cases", CaseRow.class, queries.cases(month)),
                SheetData.of("By team", TeamSummaryRow.class, queries.summaryByTeam(month)));
        sheetsmith.generate(sheets, out);
    }
}
```

What the reader sees: a title in the corporate font; a header with bold text, a dark accent line and wrapped labels; light zebra rows separated by thin lines; bold case numbers; centred dates in `dd/mm/yyyy`; status labels instead of constant names; amounts right-aligned with two decimals; an auto-filter on every column; the file properties showing "Example Services Ltd" and "Case Reporting". Styling that depends on the value of a cell, such as overdue cases in red, is not part of version 1.0.0: styles depend on the position of the cell, never on its content.

---

## 14. FAQ and troubleshooting

**The generated column is in the wrong position.**
Columns follow `order` in ascending order, not the declaration order. Check the `order` values, inherited columns included.

**A field does not appear in the sheet.**
Only fields with `@ExcelColumn` are exported. Check that the annotation is on the field (or record component), that it is the sheetsmith annotation (`cloud.baldilorenzo.sheetsmith.annotation.ExcelColumn`) and that the `SheetData` uses the expected class.

**My getter is not called.**
The getter must be public, non-static, without arguments, named `getX` (or `isX` for `boolean`/`Boolean`), and its return type must be assignable to the field type. A primitive/wrapper mismatch makes sheetsmith read the field directly ([section 4.2.1](#421-value-access)).

**Dates are shown as numbers.**
Excel stores dates as numbers; the format makes them look like dates. Built-in date values always get the default date format when no format is set. If a style or column sets a number format on a date column, that format wins. If the value was converted with `CellValue.number`, use `CellValue.date` or `CellValue.dateTime` instead.

**My date format shows minutes instead of months (or the opposite).**
The format uses Excel syntax: `mm` is the month unless it follows an hour code or precedes a seconds code. Write `dd/mm/yyyy` for dates and `hh:mm` for times.

**Numbers show too many decimals.**
Set a format on the column, on a style or as `sheetsmith.formats.number`. `float` fields show binary artefacts: prefer `double` or `BigDecimal`.

**Leading zeros disappear.**
The value is numeric. Keep it as `String` or convert it with `CellValue.text`.

**The application fails at startup with "both handle type".**
Two converter beans handle the same type. Keep one, or turn the column-specific one into a field converter that is not a bean ([section 9.8](#98-spring-beans-as-converters-implications)).

**All my string columns are transformed by a converter I wrote for one column.**
The converter handles `String` and is a Spring bean, so it is an application converter for every `String` column. Remove the bean annotation and declare it with `@ExcelColumn(converter = ...)`.

**V-10 in tests but not in production.**
The test generator lacks the application converters. Validate with a generator configured like production, or inject the Spring bean.

**V-17 in a modular application.**
Open the package of the sheet class: `opens com.example.export;` works whether sheetsmith is on the module path or the class path.

**The preset has no effect.**
Check the effective preset: `@ExcelSheet.preset` must be `LIGHT`, `MEDIUM` or `DARK`, or `INHERIT` with an application default other than `NONE`. Remember that every declared style overrides the preset: a `body.base` with a `fillColor` hides the zebra.

**My `accentColor` is ignored.**
It is used only when the effective preset is not `NONE`.

**The YAML accent colour is ignored or the application fails to start.**
Quote values starting with `#` in YAML: `accent-color: "#1F4E79"`.

**Columns are too narrow or too wide on the server, but fine on my machine.**
The server lacks fonts and the width falls back to an estimate. Install fonts in the image, or set explicit widths ([section 12.4](#124-automatic-column-sizing)).

**The single column of a titled sheet is as wide as the title.**
Known behaviour ([section 12.4](#124-automatic-column-sizing)): set an explicit `width`.

**Excel says the file needs repair.**
The usual causes are an invalid data format code (formats are not validated) or a sheet named `History`.

**The generation is slow or runs out of memory.**
See [section 12.3](#123-very-large-exports): disable automatic sizing, set widths, size the heap, limit concurrency.

**Can I write formulas, images, comments, conditional formatting or data validation?**
Not in version 1.0.0. A text starting with `=` is written as text, not as a formula.

**Can I translate headers?**
Headers are written as declared. Localisation is left to the application, for example by preparing different sheet classes or by post-processing.

**Can I use sheetsmith outside Spring?**
Yes: import `sheetsmith-core` and use `Sheetsmith.builder()`.

**Can I use the classes in `cloud.baldilorenzo.sheetsmith.internal`?**
No. They are implementation details, excluded from the published Javadoc and subject to change without notice ([Appendix A](#appendix-a-class-census)).

---

## 15. Work in progress

This section lists evolutions that are planned or under evaluation. Nothing here is available in version 1.0.0, and nothing here is a commitment on content or dates.

| Topic | Status | Description |
| --- | --- | --- |
| Predefined converters | Planned for 1.1.0 | Ready-made converters for common types that are not written natively today, limited to types with a single, parameter-free canonical representation. Candidate families: identifiers and resources (`UUID`, `URI`, `Path`), date and time types, legacy dates, containers (`Optional`, `List`, arrays). The final subset, and whether they are active automatically or opt-in, will be decided during the implementation. |
| Shareable sheet configuration ("corporate preset") | Under evaluation | Sharing not only named styles (already possible with style sheets) but the whole sheet configuration: preset, accent colour, auto-filter and the binding between slots and styles, as one reusable corporate preset. |
| Catalogue of named table styles | Under evaluation | Building on the shareable configuration, a catalogue of predefined table styles selectable by name, similar to the table style gallery of Excel. Whether the accent colour stays overridable per report, or each colour is a separate entry, is still open. |
| Streaming mode for very large volumes | Under evaluation | A mode that writes rows progressively instead of building the whole workbook in memory, for exports beyond the volumes in [section 12.3](#123-very-large-exports). It would be added as a compatible extension, with a new kind of input for streamed data. |
| Restricting access to internal classes | Under evaluation | Preventing applications from depending on the `internal` packages, which today are public for technical reasons. |
| Documentation assistant | Under evaluation, after the library is stable in production | An assistant on the documentation site that receives a Java class and a description of the desired table and returns the class with the sheetsmith annotations applied, with a short explanation. |

The following are **out of scope** and not planned: reading Excel files, the `.xls` format, native Excel tables (sheetsmith keeps its own style model), and translation of header texts.

---

## Appendix A: class census

### A.1 Public API of `sheetsmith-core`

These types are the supported API. They are documented in the published Javadoc and follow the compatibility rules of the library versions.

| Type | Package | Kind | Usable for |
| --- | --- | --- | --- |
| `Sheetsmith` | `cloud.baldilorenzo.sheetsmith` | interface | generating and validating; obtaining a builder |
| `Sheetsmith.Builder` | same | interface | configuring a generator |
| `SheetData<T>` | same | record | describing a sheet to generate |
| `SheetsmithDefaults` | same | record | application defaults |
| `DocumentProperties` | same | record | author and application of the files |
| `SheetsmithException` | same | sealed abstract class | catching every library exception |
| `SheetsmithConfigurationException` | same | final class | configuration errors |
| `SheetsmithGenerationException` | same | final class | data errors |
| `ConfigurationError` | same | record | one configuration error |
| `ExcelSheet` | `cloud.baldilorenzo.sheetsmith.annotation` | annotation | sheet class |
| `ExcelColumn` | same | annotation | column |
| `ExcelStyle` | same | annotation (repeatable) | named style; also holds the constant `UNSET` |
| `ExcelStyles` | same | annotation | container of `ExcelStyle`, compiler use |
| `ExcelStyleSheet` | same | annotation | style sheet |
| `HeaderStyles` | same | annotation | header slots |
| `BodyStyles` | same | annotation | body slots |
| `ColumnStyles` | same | annotation | column slots |
| `Align` | `cloud.baldilorenzo.sheetsmith.style` | enum | horizontal alignment |
| `VerticalAlign` | same | enum | vertical alignment |
| `Border` | same | enum | border lines |
| `Fill` | same | enum | fill patterns |
| `Underline` | same | enum | underline |
| `Script` | same | enum | superscript and subscript |
| `Toggle` | same | enum | three-state yes/no |
| `TablePreset` | same | enum | presets |
| `CellConverter<T>` | `cloud.baldilorenzo.sheetsmith.convert` | functional interface | converters |
| `CellConverter.None` | same | final class | marker, never used directly |
| `CellConverterFactory` | same | interface | creating field converters |
| `CellValue` | same | sealed interface | values written to cells |
| `CellValue.Text`, `Numeric`, `Bool`, `Date`, `DateTime` | same | records | forms of `CellValue` |
| `CellValue.Blank` | same | final class | the empty cell, singleton |
| `ConversionContext` | same | interface | where a value is written |

### A.2 Public API of `sheetsmith-spring-boot-autoconfigure`

| Type | Kind | Usable for |
| --- | --- | --- |
| `SheetsmithAutoConfiguration` | class | instantiated by Spring Boot only |
| `SheetsmithProperties` | record | reading the bound properties; `toDefaults()`, `toDocumentProperties()` |
| `SheetsmithProperties.Formats` | record | `sheetsmith.formats.*` |
| `SheetsmithProperties.Document` | record | `sheetsmith.document.*` |
| `SheetsmithProperties.Validation` | record | `sheetsmith.validation.*` |
| `SpringConverterFactory` | class | creating field converters from a Spring context, also in application-defined generators |
| `SheetsmithStartupValidator` | class | startup validation; registered automatically |

`sheetsmith-spring-boot-starter` contains no classes.

### A.3 Internal classes

The packages `cloud.baldilorenzo.sheetsmith.internal`, `.internal.convert`, `.internal.metadata`, `.internal.style` and `.internal.write` contain the implementation. Some of their classes are `public` because Java requires it across packages, but they are **not part of the API**: they are excluded from the published Javadoc, and they can change or disappear in any version, including patch versions. Applications must not use them.

| Package | Classes | Responsibility |
| --- | --- | --- |
| `internal` | `DefaultSheetsmith` | default implementation of `Sheetsmith` and of its builder |
| `internal.convert` | `BuiltInConverters`, `ConverterRegistry`, `ConverterTypes`, `ConverterBinder`, `ReflectiveConverterFactory`, `SheetBinding` | built-in converters, resolution, binding of converters to columns, default factory |
| `internal.metadata` | `MetadataExtractor`, `MetadataValidator`, `MetadataCache`, `SheetMetadata`, `ColumnMetadata`, `StyleDefinition`, `ValueAccessor` | reading and validating annotations, caching metadata, accessing values |
| `internal.style` | `StyleAttributes`, `StyleResolver`, `StyleCache`, `PresetFactory`, `ColorUtils`, `OuterBorder`, `CellRole`, `PoiMapping` | style model, cascade, presets, colour arithmetic, conversion to POI styles |
| `internal.write` | `WorkbookWriter`, `SheetWriter`, `WorkbookSupplier`, `WritableSheet` | creating, writing and releasing workbooks |

---

## Appendix B: value domains

### B.1 `Align`

Mirrors Apache POI `HorizontalAlignment`.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set: keeps the value of the lower cascade level (default). |
| `GENERAL` | Excel default: text to the left, numbers and dates to the right. |
| `LEFT` | Aligned to the left edge. |
| `CENTER` | Centred horizontally. |
| `RIGHT` | Aligned to the right edge. |
| `FILL` | Content repeated to fill the width of the cell. |
| `JUSTIFY` | Text wrapped and spaced so that each line reaches both edges. |
| `CENTER_SELECTION` | Centred across adjacent cells with this alignment, without merging. |
| `DISTRIBUTED` | Text wrapped, with the words of each line spread evenly. |

### B.2 `VerticalAlign`

Mirrors Apache POI `VerticalAlignment`.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set (default). |
| `TOP` | Aligned to the top edge. |
| `CENTER` | Centred vertically. |
| `BOTTOM` | Aligned to the bottom edge; the Excel default. |
| `JUSTIFY` | Lines of wrapped text spaced to fill the height. |
| `DISTRIBUTED` | Lines of wrapped text spread evenly across the height. |

### B.3 `Border`

Mirrors Apache POI `BorderStyle`. Used by the border attributes of `@ExcelStyle` and by `@ExcelSheet.outerBorder`.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set (default); on `outerBorder`, no frame. |
| `NONE` | No line, removing a line set by a lower level. |
| `THIN` | Thin solid line. |
| `MEDIUM` | Medium weight solid line. |
| `DASHED` | Thin dashed line. |
| `DOTTED` | Thin dotted line. |
| `THICK` | Thick solid line. |
| `DOUBLE` | Double thin line. |
| `HAIR` | Hairline, the thinnest line. |
| `MEDIUM_DASHED` | Medium weight dashed line. |
| `DASH_DOT` | Thin line of alternating dashes and dots. |
| `MEDIUM_DASH_DOT` | Medium weight line of alternating dashes and dots. |
| `DASH_DOT_DOT` | Thin line of dashes, each followed by two dots. |
| `MEDIUM_DASH_DOT_DOT` | Medium weight line of dashes, each followed by two dots. |
| `SLANTED_DASH_DOT` | Medium weight line of slanted dashes and dots. |

### B.4 `Fill`

Mirrors Apache POI `FillPatternType`. Patterns draw `fillColor` over `fillBackgroundColor`.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set (default). With a `fillColor`, the fill is solid. |
| `NO_FILL` | No fill, removing a fill set by a lower level. |
| `SOLID_FOREGROUND` | Solid fill in the fill colour. |
| `FINE_DOTS` | Dots covering half of the cell ("50% grey"). |
| `ALT_BARS` | Dense dots covering three quarters ("75% grey"). |
| `SPARSE_DOTS` | Sparse dots covering a quarter ("25% grey"). |
| `THICK_HORZ_BANDS` | Thick horizontal stripes. |
| `THICK_VERT_BANDS` | Thick vertical stripes. |
| `THICK_BACKWARD_DIAG` | Thick diagonal stripes, top left to bottom right. |
| `THICK_FORWARD_DIAG` | Thick diagonal stripes, bottom left to top right. |
| `BIG_SPOTS` | Thick horizontal and vertical crosshatch. |
| `BRICKS` | Thick diagonal crosshatch. |
| `THIN_HORZ_BANDS` | Thin horizontal stripes. |
| `THIN_VERT_BANDS` | Thin vertical stripes. |
| `THIN_BACKWARD_DIAG` | Thin diagonal stripes, top left to bottom right. |
| `THIN_FORWARD_DIAG` | Thin diagonal stripes, bottom left to top right. |
| `SQUARES` | Thin horizontal and vertical crosshatch. |
| `DIAMONDS` | Thin diagonal crosshatch. |
| `LESS_DOTS` | Very sparse dots ("12.5% grey"). |
| `LEAST_DOTS` | The sparsest dots ("6.25% grey"). |

### B.5 `Underline`

Mirrors Apache POI `FontUnderline`.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set (default). |
| `SINGLE` | Single line under the text. |
| `DOUBLE` | Double line under the text. |
| `SINGLE_ACCOUNTING` | Single accounting underline, lower and spanning the cell width. |
| `DOUBLE_ACCOUNTING` | Double accounting underline, lower and spanning the cell width. |
| `NONE` | No underline, removing one set by a lower level. |

### B.6 `Script`

No direct POI enum; maps to the POI font type offsets.

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set (default). |
| `NONE` | Normal text on the baseline, removing a superscript or subscript set by a lower level. |
| `SUPER` | Superscript. |
| `SUB` | Subscript. |

### B.7 `Toggle`

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Not set: keeps the value of the lower level (default). |
| `TRUE` | Enables the attribute. |
| `FALSE` | Disables the attribute, overriding a lower level that enables it. |

### B.8 `TablePreset`

| Constant | Meaning |
| --- | --- |
| `INHERIT` | Uses the application default preset. Valid on a sheet class only (default of `@ExcelSheet.preset`). |
| `NONE` | No preset. Default of the application. |
| `LIGHT` | Light table ([section 7.2](#72-the-presets)). |
| `MEDIUM` | Medium table. |
| `DARK` | Dark table. |

The mirrored enums (`Align`, `VerticalAlign`, `Border`, `Fill`, `Underline`) contain `INHERIT` plus exactly one constant for each constant of the corresponding Apache POI enum, with identical names. A test of the library verifies the correspondence, so a future version of POI with new constants is detected when the library is built.

### B.9 `IndexedColors` names

The names accepted as colours are the constants of `org.apache.poi.ss.usermodel.IndexedColors` in the version of Apache POI used by sheetsmith (5.5.1 for sheetsmith 1.0.0):

`BLACK1`, `WHITE1`, `RED1`, `BRIGHT_GREEN1`, `BLUE1`, `YELLOW1`, `PINK1`, `TURQUOISE1`, `BLACK`, `WHITE`, `RED`, `BRIGHT_GREEN`, `BLUE`, `YELLOW`, `PINK`, `TURQUOISE`, `DARK_RED`, `GREEN`, `DARK_BLUE`, `DARK_YELLOW`, `VIOLET`, `TEAL`, `GREY_25_PERCENT`, `GREY_50_PERCENT`, `CORNFLOWER_BLUE`, `MAROON`, `LEMON_CHIFFON`, `LIGHT_TURQUOISE1`, `ORCHID`, `CORAL`, `ROYAL_BLUE`, `LIGHT_CORNFLOWER_BLUE`, `SKY_BLUE`, `LIGHT_TURQUOISE`, `LIGHT_GREEN`, `LIGHT_YELLOW`, `PALE_BLUE`, `ROSE`, `LAVENDER`, `TAN`, `LIGHT_BLUE`, `AQUA`, `LIME`, `GOLD`, `LIGHT_ORANGE`, `ORANGE`, `BLUE_GREY`, `GREY_40_PERCENT`, `DARK_TEAL`, `SEA_GREEN`, `DARK_GREEN`, `OLIVE_GREEN`, `BROWN`, `PLUM`, `INDIGO`, `GREY_80_PERCENT`, `AUTOMATIC`.

Names are case-sensitive. Their actual rendering depends on the palette of the application that opens the file.

### B.10 Numeric ranges

| Attribute | Range | Unset |
| --- | --- | --- |
| `@ExcelStyle.rotation` | -90 to 90, or 255 | `ExcelStyle.UNSET` |
| `@ExcelStyle.indent` | 0 to 250 | `ExcelStyle.UNSET` |
| `@ExcelStyle.fontSize` | 1 to 409 | `ExcelStyle.UNSET` |
| `@ExcelColumn.width` | 1 to 255 | `ExcelStyle.UNSET` |
| `@ExcelColumn.order` | any `int`, unique per class | none (mandatory) |

### B.11 Defaults at a glance

| Setting | Default |
| --- | --- |
| Title | none |
| Frozen header | yes |
| Auto-filter | no |
| Automatic column sizing | yes |
| Outer frame | none |
| Preset | `INHERIT` on the class, `NONE` for the application |
| Accent colour | application default, `#4472C4` |
| Date format | `yyyy-mm-dd` |
| Date-time format | `yyyy-mm-dd hh:mm:ss` |
| Number format | Excel "General" |
| Document author and application | `sheetsmith` |
| Startup validation | disabled |
| Field converter factory | public no-argument constructor (Spring: context beans or injection) |

---

## Appendix C: glossary

| Term | Definition |
| --- | --- |
| Accent colour | The colour from which a preset derives its tones. |
| Application converter | A converter registered for a type, applied to every column of that type or of its subtypes, in every sheet class. |
| Application defaults | The `SheetsmithDefaults` of a generator: default formats, preset and accent colour. |
| Cascade | The fixed order in which styles are laid on top of each other, attribute by attribute, to obtain the effective style of a cell. |
| Cell value | A `CellValue`: what a converter returns and the library writes. |
| Column | A field annotated with `@ExcelColumn`. |
| Converter | An implementation of `CellConverter`, turning a field value into a cell value. |
| Data row | A row produced by one element of the data list, numbered from 1. |
| Effective style | The result of the cascade for one cell. |
| Field converter | A converter declared on one column with `@ExcelColumn.converter`. |
| Frame | The outer border drawn with `@ExcelSheet.outerBorder`. |
| Generator | An instance of `Sheetsmith`. |
| Named style | A set of formatting attributes declared with `@ExcelStyle` and identified by its name. |
| Preset | A ready-made table style generated from an accent colour. |
| Role | The position of a cell in the table (odd or even row, first or last row, first or last column), which selects the slots that apply. |
| Sheet class | A class annotated with `@ExcelSheet`, describing one table. |
| Slot | A place where a named style is applied, by name. |
| Style sheet | A class annotated with `@ExcelStyleSheet` that holds shared named styles. |
| Unset | The default value of a style attribute, which overrides nothing. |
