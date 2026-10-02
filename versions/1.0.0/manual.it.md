# Manuale utente di sheetsmith

**Versione trattata:** 1.0.0
**Destinatari:** sviluppatori Java che generano file Excel dalle proprie applicazioni
**Stato di questo documento:** manuale di riferimento della libreria. Dove questo manuale e il codice sorgente non concordano, fa fede il codice sorgente e il manuale deve essere corretto.

---

## Indice

1. [Introduzione](#1-introduzione)
2. [Avvio rapido](#2-avvio-rapido)
3. [Concetti](#3-concetti)
4. [Riferimento delle annotazioni](#4-riferimento-delle-annotazioni)
5. [Riferimento API](#5-riferimento-api)
6. [Stili](#6-stili)
7. [Preset](#7-preset)
8. [Stili condivisi e stile aziendale](#8-stili-condivisi-e-stile-aziendale)
9. [Converter](#9-converter)
10. [Integrazione con Spring Boot e proprietà di configurazione](#10-integrazione-con-spring-boot-e-proprietà-di-configurazione)
11. [Validazione ed errori](#11-validazione-ed-errori)
12. [Limiti e comportamenti noti](#12-limiti-e-comportamenti-noti)
13. [Ricette](#13-ricette)
14. [FAQ e risoluzione dei problemi](#14-faq-e-risoluzione-dei-problemi)
15. [Lavori in corso](#15-lavori-in-corso)
16. [Appendice A: censimento delle classi](#appendice-a-censimento-delle-classi)
17. [Appendice B: domini dei valori](#appendice-b-domini-dei-valori)
18. [Appendice C: glossario](#appendice-c-glossario)

---

## 1. Introduzione

### 1.1 Cos'è sheetsmith

sheetsmith è una libreria Java open source che genera file Excel in formato `.xlsx` a partire da liste di oggetti Java. È costruita su Apache POI e si integra con Spring Boot tramite un'auto-configurazione, mentre il suo nucleo funziona in qualsiasi applicazione Java.

La struttura e l'aspetto di ciascun foglio vengono descritti una sola volta, con annotazioni poste su una classe Java chiamata **classe sheet**. Il contenuto di ciascun foglio proviene dagli oggetti passati a runtime, un oggetto per ogni riga di dati. La libreria scrive poi il titolo, la riga di intestazione, le righe di dati, gli stili, i formati e le opzioni di layout, e restituisce il file.

### 1.2 Cosa fa sheetsmith

sheetsmith fornisce le seguenti funzionalità nella versione 1.0.0.

| Funzionalità | Descrizione |
| --- | --- |
| Componente di generazione | Un unico componente, `Sheetsmith`, che genera una cartella di lavoro completa e la restituisce come `byte[]` oppure la scrive su un `OutputStream` fornito dal chiamante. |
| Cartelle di lavoro multi-foglio | Una cartella di lavoro può contenere un numero qualsiasi di fogli, ciascuno con la propria classe sheet, nell'ordine scelto dal chiamante. |
| Modello ad annotazioni | Otto annotazioni descrivono il foglio, le sue colonne, i suoi stili con nome, i suoi fogli di stile condivisi e i punti in cui gli stili si applicano. |
| Colonne opt-in | Diventano colonne solo i campi annotati esplicitamente. Sono supportati record, classi e campi ereditati. |
| Ordine delle colonne obbligatorio e stabile | Ogni colonna dichiara la propria posizione, quindi l'ordine non dipende mai dalla reflection. |
| Stili completi | Si può dichiarare ogni attributo di formattazione delle celle esposto da Apache POI: allineamento, a capo automatico, rotazione, rientro, bordi e colori dei bordi, riempimenti, caratteri, formati dei dati, flag di protezione e prefisso apice. |
| Stili basati sui ruoli | Gli stili possono avere come destinazione ogni cella di dati, le righe dispari e pari, la prima e l'ultima riga di dati, la prima e l'ultima colonna, una singola colonna, l'intestazione, l'intestazione di una singola colonna e il titolo. |
| Cascata deterministica | Gli stili si combinano attributo per attributo seguendo un ordine fisso e documentato, quindi il risultato di qualsiasi combinazione è prevedibile. |
| Preset | Tre stili di tabella già pronti (`LIGHT`, `MEDIUM`, `DARK`) generati a partire da un unico colore di accento, che possono essere sovrascritti in parte. |
| Fogli di stile condivisi | Gli stili con nome possono essere dichiarati una sola volta in una classe foglio di stile e riutilizzati da un numero qualsiasi di classi sheet, il che permette a tutti i report di un'applicazione o di un'organizzazione di condividere lo stesso aspetto aziendale. |
| Tipi di cella nativi | Testo, numeri, booleani, enum, `LocalDate` e `LocalDateTime` vengono scritti come valori Excel nativi. |
| Converter | Qualsiasi altro tipo è supportato tramite converter, dichiarati su una singola colonna o registrati per un tipo in tutta l'applicazione. |
| Formati predefiniti | Formati predefiniti a livello di applicazione per date, date con ora e numeri, applicati quando una cella non ha un formato esplicito. |
| Opzioni di layout | Riga del titolo opzionale unita su tutta la tabella, intestazione bloccata, filtro automatico, larghezze di colonna esplicite, dimensionamento automatico delle colonne con un ripiego per gli ambienti privi di font, e una cornice esterna attorno alla tabella. |
| Proprietà del documento | Autore e applicazione configurabili, registrati in ogni file generato. |
| Validazione fail-fast | Venti regole di validazione (da V-01 a V-20) rilevano gli errori di configurazione prima che venga scritto qualsiasi dato. Tutti gli errori vengono segnalati insieme, con un codice stabile, la classe e l'elemento coinvolti. |
| Validazione all'avvio | Nelle applicazioni Spring Boot, le classi sheet dei package scelti possono essere validate all'avvio dell'applicazione. |
| Errori di runtime precisi | I problemi sui dati vengono segnalati con il nome del foglio, la riga di dati e il campo. |
| Thread safety | Un generatore è immutabile e thread-safe, e mette in cache i metadati di ciascuna classe sheet dopo il primo utilizzo. |

### 1.3 Ambito della versione 1.0.0

La versione 1.0.0 scrive solo file `.xlsx` e costruisce ogni cartella di lavoro interamente in memoria prima di scriverla. Non fanno parte della libreria: la lettura di file Excel, il formato legacy `.xls`, le formule, i grafici, le immagini, la formattazione condizionale, la validazione dei dati, i commenti alle celle, la protezione dei fogli, le tabelle Excel native e la traduzione dei testi di intestazione. I testi di intestazione vengono scritti esattamente come dichiarati, quindi la localizzazione, quando serve, viene eseguita dall'applicazione prima o intorno alla generazione.

Le evoluzioni pianificate e valutate sono elencate nella [sezione 15](#15-lavori-in-corso).

### 1.4 Requisiti

| Requisito | Valore |
| --- | --- |
| Java | 17 o successivo |
| Spring Boot | 4.x, solo per l'integrazione con Spring Boot |
| Apache POI | fornito in modo transitivo da `sheetsmith-core` (POI 5.5.1 per sheetsmith 1.0.0) |
| Formato di output | `.xlsx` (Office Open XML) |

### 1.5 Moduli e coordinate

La libreria è pubblicata come tre artefatti Maven sotto il gruppo `cloud.baldilorenzo`.

| Artefatto | Contenuto | Dipende da Spring |
| --- | --- | --- |
| `sheetsmith-core` | Annotazioni, estrazione dei metadati e validazione, risoluzione degli stili, preset, converter, scrittura della cartella di lavoro. | No |
| `sheetsmith-spring-boot-autoconfigure` | L'auto-configurazione: il bean `Sheetsmith`, le proprietà `sheetsmith.*`, la converter factory di Spring, il validatore all'avvio. | Sì |
| `sheetsmith-spring-boot-starter` | Nessun codice. Porta con sé i due moduli precedenti e `spring-boot-starter`. | Sì |

**Quale artefatto importare.**

- Un'applicazione Spring Boot importa solo lo starter:

```xml
<dependency>
    <groupId>cloud.baldilorenzo</groupId>
    <artifactId>sheetsmith-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

- Qualsiasi altra applicazione Java importa solo il core:

```xml
<dependency>
    <groupId>cloud.baldilorenzo</groupId>
    <artifactId>sheetsmith-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

Con Gradle le coordinate sono le stesse: `implementation("cloud.baldilorenzo:sheetsmith-spring-boot-starter:1.0.0")` oppure `implementation("cloud.baldilorenzo:sheetsmith-core:1.0.0")`.

L'artefatto `sheetsmith-spring-boot-autoconfigure` non è pensato per essere importato direttamente.

### 1.6 Package

| Package | Contenuto |
| --- | --- |
| `cloud.baldilorenzo.sheetsmith` | Il generatore, i dati del foglio, i valori predefiniti dell'applicazione, le proprietà del documento e le eccezioni. |
| `cloud.baldilorenzo.sheetsmith.annotation` | Le annotazioni che descrivono una classe sheet. |
| `cloud.baldilorenzo.sheetsmith.style` | Le enum usate come valori degli attributi di stile, e i preset. |
| `cloud.baldilorenzo.sheetsmith.convert` | Il contratto dei converter e i valori delle celle. |
| `cloud.baldilorenzo.sheetsmith.autoconfigure` | L'auto-configurazione di Spring Boot (in `sheetsmith-spring-boot-autoconfigure`). |
| `cloud.baldilorenzo.sheetsmith.internal` e sottopackage | Implementazione. Non fa parte dell'API: vedere l'[Appendice A](#appendice-a-censimento-delle-classi). |

---

## 2. Avvio rapido

### 2.1 Applicazione Spring Boot

**Passo 1. Aggiungere lo starter** come mostrato nella [sezione 1.5](#15-moduli-e-coordinate). Non è richiesta alcuna configurazione: l'auto-configurazione registra un bean `Sheetsmith`.

**Passo 2. Descrivere il foglio** con una classe sheet. Un record è la forma più compatta:

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

**Passo 3. Iniettare il bean e generare il file:**

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

La cartella di lavoro risultante ha un foglio chiamato `Customers`, con una riga del titolo unita, un'intestazione riempita con il colore di accento e testo in grassetto a contrasto, una griglia chiara, righe alternate chiare, un'intestazione bloccata, un filtro automatico e colonne dimensionate sul contenuto, tranne `Code`, larga 12 caratteri.

### 2.2 Applicazione Java semplice

Senza Spring, si crea il generatore con il suo builder. Va creato una sola volta e riutilizzato: è immutabile, thread-safe e mette in cache i metadati di ciascuna classe sheet.

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

Per scrivere direttamente su un file senza tenere in memoria i byte, usare la variante con stream:

```java
try (OutputStream out = Files.newOutputStream(target)) {
    SHEETSMITH.generate(List.of(SheetData.of("Customers", CustomerRow.class, rows)), out);
}
```

### 2.3 Download da un controller Spring MVC

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

I dati vengono caricati prima che il corpo della risposta sia prodotto, quindi un errore del database produce comunque una normale risposta di errore. La variante con stream non scrive nulla sullo stream quando si verifica un errore di configurazione o di generazione, perché la cartella di lavoro è completa prima che inizi la serializzazione: vedere la [sezione 5.2.2](#522-generatelistsheetdata-outputstream). Con un corpo in streaming, tuttavia, il servlet container può aver già inviato lo stato e gli header quando la generazione viene eseguita, quindi un'eccezione a quel punto non può più diventare una risposta di errore pulita. Quando serve una risposta di errore garantita, generare prima i byte e poi restituirli:

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

I due approcci usano praticamente la stessa memoria: vedere la [sezione 5.2.3](#523-scelta-tra-byte-e-outputstream). Validare le classi sheet all'avvio ([sezione 10.4](#104-validazione-allavvio)) elimina gli errori di configurazione dal percorso della richiesta in entrambi i casi.

---

## 3. Concetti

Questa sezione spiega il modello mentale della libreria. Il riferimento preciso di ogni elemento segue nelle sezioni da 4 a 11.

### 3.1 Classe sheet, colonne e dati

Una **classe sheet** è una classe o un record Java annotato con `@ExcelSheet`. Descrive una tabella: il suo titolo opzionale, le sue colonne, i suoi stili e le sue opzioni di layout.

Una **colonna** è un campo della classe sheet annotato con `@ExcelColumn`. Ogni colonna ha un testo di intestazione e un ordine. I campi senza `@ExcelColumn` vengono ignorati: l'esportazione è opt-in, quindi aggiungere un campo a una classe non aggiunge mai una colonna per caso.

I **dati** di un foglio sono una lista di istanze della classe sheet (o delle sue sottoclassi). Ogni elemento diventa una riga di dati, nell'ordine della lista. Il primo elemento è la riga di dati 1.

L'abbinamento di un nome di foglio, di una classe sheet e di una lista di dati è un **`SheetData`**. Una cartella di lavoro viene generata a partire da una lista ordinata di `SheetData`.

```
List<SheetData<?>>                     workbook
 ├── SheetData("Customers", CustomerRow.class, customers)   → sheet 1
 └── SheetData("Orders",    OrderRow.class,    orders)      → sheet 2
```

### 3.2 Anatomia di un foglio generato

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

Senza titolo, l'intestazione è la riga 0 del foglio e i dati iniziano alla riga 1. Il titolo, quando presente, occupa esattamente una riga.

### 3.3 Ordine delle colonne

Ogni colonna dichiara un `order` intero. Le colonne compaiono da sinistra a destra in ordine crescente. I valori devono essere univoci all'interno della classe sheet, colonne ereditate comprese, ma non devono essere consecutivi. Numerare a passi di 10 (10, 20, 30) lascia spazio per inserire colonne in seguito senza rinumerare. L'ordine è obbligatorio perché l'API di reflection di Java non garantisce l'ordine di dichiarazione dei campi.

### 3.4 Record, classi ed ereditarietà

Sia i record sia le classi ordinarie possono essere classi sheet.

- **Record.** `@ExcelColumn` si scrive sul componente del record. Si applica al campo del componente e il valore viene letto tramite l'accessor del componente.
- **Classi.** `@ExcelColumn` si scrive sul campo. Il valore viene letto tramite un getter pubblico quando ne esiste uno adatto, altrimenti direttamente dal campo, anche se è privato. Le regole esatte sono nella [sezione 4.2.1](#421-accesso-al-valore).
- **Ereditarietà.** Anche i campi annotati delle superclassi sono colonne. Vengono raccolti dalla superclasse più alta fino alla classe sheet e poi ordinati per `order`. `@ExcelSheet` non è ereditata: ogni classe passata a un `SheetData` porta la propria `@ExcelSheet`. Una superclasse che contribuisce solo con colonne non ne ha bisogno. Nemmeno gli stili con nome (`@ExcelStyle`) sono ereditati: vengono letti solo dalla classe sheet.
- **Istanze di sottoclassi.** Un `SheetData` di una classe sheet accetta istanze delle sue sottoclassi. Le colonne sono sempre quelle della classe sheet passata come tipo.

### 3.5 Valori null ed elementi null

- Un **valore null di un campo** produce una cella vuota che mantiene lo stile risolto, così riempimenti e bordi restano continui lungo la riga e la colonna. Il converter non viene chiamato.
- Un **elemento null** nella lista dei dati è un errore: viene segnalato come `SheetsmithGenerationException` che indica il foglio e la riga di dati.

### 3.6 Stili con nome e slot

L'aspetto di una tabella è descritto con due concetti.

Uno **stile con nome** è un insieme di attributi di formattazione, dichiarato una sola volta con `@ExcelStyle` e identificato da un nome. Uno stile con nome non fa nulla di per sé.

Uno **slot** è un punto in cui uno stile con nome viene applicato, per nome. Gli slot sono:

| Slot | Dichiarato in | Si applica a |
| --- | --- | --- |
| `titleStyle` | `@ExcelSheet` | la riga del titolo |
| `header.base` | `@ExcelSheet(header = @HeaderStyles(...))` | ogni cella di intestazione |
| `header.firstColumn`, `header.lastColumn` | `@HeaderStyles` | la cella di intestazione della prima o dell'ultima colonna |
| `headerStyle` | `@ExcelColumn` | la cella di intestazione di una colonna |
| `body.base` | `@ExcelSheet(body = @BodyStyles(...))` | ogni cella di dati |
| `body.odd`, `body.even` | `@BodyStyles` | le celle di dati delle righe dispari o pari |
| `body.firstRow`, `body.lastRow` | `@BodyStyles` | le celle di dati della prima o dell'ultima riga di dati |
| `body.firstColumn`, `body.lastColumn` | `@BodyStyles` | le celle di dati della prima o dell'ultima colonna |
| `styles.base`, `styles.odd`, `styles.even`, `styles.firstRow`, `styles.lastRow` | `@ExcelColumn(styles = @ColumnStyles(...))` | le celle di dati di una colonna, eventualmente limitate alle righe dispari, pari, prima o ultima |

Uno stile con nome può essere referenziato da un numero qualsiasi di slot.

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

### 3.7 Attributi non impostati

Ogni attributo di uno stile con nome, a parte il nome, ha un valore predefinito che significa **non impostato**. Un attributo non impostato non sovrascrive nulla: lascia il valore deciso dai livelli inferiori. Poiché gli attributi delle annotazioni non possono essere null, "non impostato" è rappresentato come segue:

| Tipo di attributo | Valore non impostato |
| --- | --- |
| Attributi enum (`align`, `border`, `fillPattern`, `underline`, ...) | la costante `INHERIT` dell'enum |
| Attributi sì/no (`bold`, `wrapText`, `locked`, ...) | `Toggle.INHERIT` (i tre stati sono `INHERIT`, `TRUE`, `FALSE`) |
| Attributi numerici (`rotation`, `indent`, `fontSize` e `@ExcelColumn.width`) | `ExcelStyle.UNSET`, uguale a `Integer.MIN_VALUE` |
| Attributi di testo (colori, nome del font, formato dei dati) | la stringa vuota |

Si usa `Integer.MIN_VALUE` al posto di `-1` perché `-1` è una rotazione valida. Per gli attributi sì/no non si usa un semplice `boolean` perché non può esprimere "non impostato": `Toggle.FALSE` disattiva esplicitamente un attributo, mentre `Toggle.INHERIT` lo lascia ai livelli inferiori.

### 3.8 Ruoli

Il **ruolo** di una cella di dati è la sua posizione nella tabella e decide quali slot le si applicano:

- **riga dispari o pari.** Le righe di dati sono numerate da 1, nell'ordine della lista, quindi la prima riga di dati è dispari.
- **prima riga e ultima riga.** Il primo e l'ultimo elemento della lista dei dati.
- **prima colonna e ultima colonna.** In base alla posizione dopo l'ordinamento per `order`.

I ruoli sono indipendenti tra loro. Con una sola riga di dati, quella riga è sia la prima sia l'ultima. Con una sola colonna, questa è sia la prima sia l'ultima. Una cella di intestazione ha solo i ruoli di prima e ultima colonna. Il titolo non ha alcun ruolo.

### 3.9 La cascata

Lo **stile effettivo** di una cella si ottiene sovrapponendo gli stili applicabili, dal meno specifico al più specifico, attributo per attributo. Ogni livello sovrascrive solo gli attributi che imposta e mantiene gli altri. Gli attributi che nessun livello imposta mantengono i valori predefiniti di Excel (Calibri 11, nessun riempimento, nessun bordo, allineamento generale, formato Generale).

**Celle di dati**, dal livello meno specifico al più specifico:

| Livello | Origine |
| --- | --- |
| 1 | i livelli del corpo del preset, se si applica un preset: base del preset, poi dispari o pari del preset |
| 2 | `body.base` |
| 3 | `body.odd` o `body.even` |
| 4 | i bordi della cornice esterna (`outerBorder`) |
| 5 | `body.lastColumn`, poi `body.firstColumn` |
| 6 | `body.lastRow`, poi `body.firstRow` |
| 7 | `styles.base` della colonna |
| 8 | `styles.odd` o `styles.even` della colonna |
| 9 | `styles.lastRow` della colonna, poi `styles.firstRow` |
| 10 | il `format` della colonna, come formato dei dati |
| (finale) | il formato predefinito dell'applicazione per il tipo di valore, solo quando nessun livello ha impostato un formato |

**Celle di intestazione**, dal livello meno specifico al più specifico:

| Livello | Origine |
| --- | --- |
| 1 | il livello di intestazione del preset, se si applica un preset |
| 2 | `header.base` |
| 3 | i bordi della cornice esterna |
| 4 | `header.lastColumn`, poi `header.firstColumn` |
| 5 | il `headerStyle` della colonna |

**Titolo:** il livello del titolo del preset, se si applica un preset, poi `titleStyle`.

### 3.10 Regole di precedenza che derivano dalla cascata

L'ordine della cascata produce un piccolo numero di regole da ricordare:

1. **La riga vince sulla colonna.** Quando uno slot di riga del corpo (`firstRow`, `lastRow`) e uno slot di colonna del corpo (`firstColumn`, `lastColumn`) impostano lo stesso attributo sulla stessa cella, vince lo slot di riga, perché viene applicato dopo.
2. **Il primo vince sull'ultimo.** Con una sola riga di dati, `lastRow` viene applicato prima di `firstRow`, quindi vince `firstRow`. Con una sola colonna, `firstColumn` vince su `lastColumn`. Lo stesso vale per gli slot di colonna dell'intestazione e per gli slot di riga della colonna.
3. **La colonna è il livello più specifico.** Gli slot di colonna vengono dopo ogni livello della tabella, quindi una colonna può sempre sovrascrivere la tabella. Solo il `format` della colonna viene dopo di essi.
4. **Intestazione e dati sono separati.** Gli slot di intestazione e gli stili di intestazione delle colonne non si applicano mai alle celle di dati. Gli slot del corpo e delle colonne non si applicano mai alle celle di intestazione. Nessuno di essi si applica al titolo. L'intestazione non eredita nulla dal corpo.
5. **La cornice cede agli slot di ruolo.** La cornice esterna si colloca sopra i livelli base e dispari o pari e sotto gli slot di ruolo: uno slot di prima o ultima riga o colonna, uno slot di colonna o uno stile di intestazione di colonna che imposta un lato del bordo sovrascrive la cornice su quel lato.
6. **Il formato della colonna è definitivo.** `@ExcelColumn.format` vince sul `dataFormat` di ogni stile applicato alla cella e sui formati predefiniti dell'applicazione.
7. **Il locale vince sul condiviso.** Uno stile con nome dichiarato sulla classe sheet sostituisce interamente uno stile con lo stesso nome proveniente da un foglio di stile: i due non vengono uniti.
8. **Qualsiasi stile dichiarato vince sul preset.** Il preset è il livello più basso di ogni cascata.

### 3.11 Preset

Un **preset** è uno stile di tabella già pronto generato dalla libreria a partire da un colore di accento. Produce un livello per il titolo, un livello per l'intestazione e livelli per il corpo (base, dispari, pari), applicati sotto ogni stile dichiarato. Un preset si sceglie per classe sheet (`@ExcelSheet.preset`) o per l'intera applicazione (valori predefiniti dell'applicazione), e può essere regolato con normali stili con nome. I preset sono descritti nella [sezione 7](#7-preset).

### 3.12 Converter

Ogni valore di campo viene trasformato in un **valore di cella** da un **converter** prima di essere scritto. I converter integrati coprono testo, numeri, booleani, enum, `LocalDate` e `LocalDateTime`. Qualsiasi altro tipo richiede un converter, dichiarato su una colonna (converter di campo) o registrato per un tipo in tutta l'applicazione (converter di applicazione). Il converter di ciascuna colonna viene scelto una sola volta, a partire dal tipo dichiarato del campo. I converter sono descritti nella [sezione 9](#9-converter).

### 3.13 Ciclo di vita di una generazione

Quando viene chiamato `generate`, la libreria:

1. valida l'input: la lista non è vuota, i nomi dei fogli sono validi e univoci (da V-18 a V-20);
2. per ogni classe sheet distinta, ottiene i suoi metadati validati (da V-01 a V-09, da V-13 a V-17) e associa un converter a ciascuna colonna (da V-10 a V-12), usando le cache per classe quando disponibili;
3. se è stato trovato un errore di configurazione, lancia una sola `SheetsmithConfigurationException` che li elenca tutti, e non scrive nulla;
4. crea una nuova cartella di lavoro e registra le proprietà del documento;
5. scrive ogni foglio: titolo, intestazione, righe di dati (leggendo ogni valore, convertendolo, scegliendo lo stile effettivo), quindi riquadro bloccato, filtro automatico e larghezze delle colonne;
6. serializza la cartella di lavoro sullo stream, esegue il flush dello stream e rilascia la cartella di lavoro.

I problemi sui dati rilevati durante il passo 5 interrompono la generazione con una `SheetsmithGenerationException`. In tal caso non viene scritto nulla in output.

### 3.14 Cache e thread safety

- I **metadati** di una classe sheet (colonne, stili risolti, accessor dei valori) vengono calcolati e validati al primo utilizzo, poi messi in cache per classe e condivisi da ogni generatore. La cache non trattiene i class loader, cosa che conta con gli strumenti di sviluppo che riavviano l'applicazione.
- L'**associazione dei converter** di una classe sheet è messa in cache per generatore, perché dipende dai converter configurati su quel generatore.
- Una **classe che non supera la validazione non viene messa in cache**: viene rifiutata a ogni chiamata, con gli stessi errori, finché non viene corretta.
- Un **generatore** è immutabile e thread-safe. Ogni generazione costruisce la propria cartella di lavoro, quindi le chiamate concorrenti non interferiscono. I converter sono condivisi tra generazioni concorrenti e devono essere thread-safe.
- All'interno di una generazione, lo stile effettivo di ogni combinazione distinta di colonna, parità della riga, prima o ultima riga e tipo di valore viene calcolato una volta per foglio e riutilizzato per ogni cella con quella combinazione. Gli stili effettivi uguali condividono un unico stile di cella Excel, i font e i formati dei dati vengono deduplicati, quindi il numero di stili di cella in un file dipende dal numero di stili distinti e mai dal numero di celle.

---

## 4. Riferimento delle annotazioni

Tutte le annotazioni si trovano nel package `cloud.baldilorenzo.sheetsmith.annotation` e sono mantenute a runtime.

| Annotazione | Destinazione | Scopo |
| --- | --- | --- |
| `@ExcelSheet` | classe, record, interfaccia | Contrassegna una classe sheet e configura la tabella nel suo insieme. Obbligatoria su ogni classe sheet. |
| `@ExcelColumn` | campo, componente di record | Esporta un campo come colonna e lo configura. |
| `@ExcelStyle` | classe (ripetibile) | Dichiara uno stile con nome. |
| `@ExcelStyles` | classe | Contenitore di `@ExcelStyle` ripetute, generato dal compilatore. Non si scrive a mano. |
| `@ExcelStyleSheet` | classe | Contrassegna una classe che contiene stili con nome condivisi. |
| `@HeaderStyles` | solo valore di attributo | Slot dell'intestazione, valore di `@ExcelSheet.header`. |
| `@BodyStyles` | solo valore di attributo | Slot del corpo a livello di tabella, valore di `@ExcelSheet.body`. |
| `@ColumnStyles` | solo valore di attributo | Slot del corpo di una colonna, valore di `@ExcelColumn.styles`. |

Ogni attributo qui sotto è documentato con lo stesso modello: tipo, valore predefinito, valori ammessi, effetto, interazioni con altri attributi, regole di validazione correlate ed esempio.

### 4.1 `@ExcelSheet`

Contrassegna una classe come classe sheet e ne configura il foglio: titolo, preset, fogli di stile condivisi, opzioni di layout e slot di intestazione e corpo.

- **Obbligatoria** su ogni classe passata a `SheetData`. Una classe che ne è priva viola la regola V-01.
- **Non ereditata.** Ogni classe esportata porta la propria `@ExcelSheet`. Le superclassi che contribuiscono solo con colonne non ne hanno bisogno.
- **Ogni attributo è opzionale.** Con tutti i valori predefiniti, il foglio non ha titolo, ha l'intestazione bloccata, colonne dimensionate automaticamente, nessun filtro automatico, nessuna cornice e nessuno stile diverso dal preset predefinito dell'applicazione (che è `NONE` se non configurato).

Riepilogo degli attributi:

| Attributo | Tipo | Valore predefinito |
| --- | --- | --- |
| `title` | `String` | `""` (nessun titolo) |
| `titleStyle` | `String` | `""` (nessuno stile) |
| `preset` | `TablePreset` | `INHERIT` (predefinito dell'applicazione) |
| `accentColor` | `String` | `""` (predefinito dell'applicazione) |
| `styleSheets` | `Class<?>[]` | `{}` |
| `freezeHeader` | `boolean` | `true` |
| `autoFilter` | `boolean` | `false` |
| `autoSizeColumns` | `boolean` | `true` |
| `outerBorder` | `Border` | `INHERIT` (nessuna cornice) |
| `outerBorderColor` | `String` | `""` (colore automatico) |
| `header` | `HeaderStyles` | `@HeaderStyles` (nessuno slot impostato) |
| `body` | `BodyStyles` | `@BodyStyles` (nessuno slot impostato) |

#### 4.1.1 `title`

| | |
| --- | --- |
| Tipo | `String` |
| Valore predefinito | `""`, cioè nessuna riga del titolo |
| Valori ammessi | qualsiasi testo; scritto così com'è |
| Effetto | Aggiunge una riga sopra l'intestazione. Il testo viene scritto nella prima colonna e la cella viene unita su tutte le colonne della tabella. Ogni cella della riga del titolo riceve lo stile del titolo. |
| Interazioni | Il titolo non ha alcun ruolo: gli slot di intestazione e corpo non si applicano mai ad esso. È fuori dalla cornice esterna. Viene bloccato insieme all'intestazione quando `freezeHeader` è true. È escluso dal filtro automatico. Il suo stile è il livello del titolo del preset (se presente) seguito da `titleStyle`. Con una sola colonna non c'è nulla da unire: il titolo resta nell'unica cella. |
| Validazione | Nessuna sul testo in sé. `titleStyle` richiede un titolo (V-15). |

```java
@ExcelSheet(title = "Open invoices at 30/09/2026")
public record InvoiceRow(/* columns */) { }
```

#### 4.1.2 `titleStyle`

| | |
| --- | --- |
| Tipo | `String`, il nome di uno stile con nome |
| Valore predefinito | `""`, cioè nessuno stile |
| Valori ammessi | il nome di uno stile disponibile per la classe: dichiarato sulla classe o su uno dei suoi `styleSheets` |
| Effetto | Applicato a ogni cella della riga del titolo, dopo il livello del titolo del preset. |
| Interazioni | Consentito solo quando `title` è impostato. |
| Validazione | V-15 quando `title` è vuoto; V-06 quando il nome non esiste. |

```java
@ExcelSheet(title = "Quarterly sales", titleStyle = "title")
@ExcelStyle(name = "title", fontSize = 16, bold = Toggle.TRUE, fontColor = "#1F4E79")
public record SalesRow(/* columns */) { }
```

#### 4.1.3 `preset`

| | |
| --- | --- |
| Tipo | `TablePreset` |
| Valore predefinito | `TablePreset.INHERIT` |
| Valori ammessi | `INHERIT`, `NONE`, `LIGHT`, `MEDIUM`, `DARK` |
| Effetto | `INHERIT` usa il preset predefinito dell'applicazione (`SheetsmithDefaults.preset`, proprietà `sheetsmith.preset`, `NONE` se non configurato). `NONE` non applica alcun preset indipendentemente dal valore predefinito dell'applicazione. `LIGHT`, `MEDIUM` e `DARK` applicano il preset corrispondente. |
| Interazioni | Il preset è il livello più basso delle cascate di titolo, intestazione e corpo: ogni stile dichiarato lo sovrascrive attributo per attributo. I colori del preset derivano dal colore di accento effettivo. |
| Validazione | Nessuna. |

```java
@ExcelSheet(preset = TablePreset.LIGHT)      // always LIGHT
@ExcelSheet(preset = TablePreset.NONE)       // never a preset, even if the application default is one
@ExcelSheet                                  // the application default preset
```

#### 4.1.4 `accentColor`

| | |
| --- | --- |
| Tipo | `String`, un colore |
| Valore predefinito | `""`, cioè il colore di accento predefinito dell'applicazione (`#4472C4` se non configurato) |
| Valori ammessi | `#RRGGBB` in maiuscolo o minuscolo, oppure il nome di una costante `IndexedColors` di Apache POI (vedere la [sezione 6.2](#62-colori)) |
| Effetto | Il colore da cui il preset deriva ogni tonalità. I valori esadecimali vengono normalizzati in maiuscolo. |
| Interazioni | Ha effetto solo quando il preset effettivo non è `NONE`. |
| Validazione | V-13 per qualsiasi altro valore non vuoto. |

```java
@ExcelSheet(preset = TablePreset.MEDIUM, accentColor = "#2E7D32")
```

#### 4.1.5 `styleSheets`

| | |
| --- | --- |
| Tipo | `Class<?>[]` |
| Valore predefinito | `{}` |
| Valori ammessi | classi annotate con `@ExcelStyleSheet` |
| Effetto | Gli stili con nome dei fogli di stile elencati diventano disponibili per gli slot di questa classe, come se fossero dichiarati su di essa. |
| Interazioni | Uno stile dichiarato sulla classe sheet con lo stesso nome di uno stile di un foglio di stile lo sostituisce interamente (nessuna unione). Elencare due volte lo stesso foglio di stile non ha effetto. L'ordine dell'elenco non ha effetto. |
| Validazione | V-09 per una classe elencata senza `@ExcelStyleSheet` (i suoi stili vengono quindi ignorati, per cui i riferimenti ad essi segnalano anche V-06). V-08 quando due fogli di stile elencati dichiarano lo stesso nome. |

```java
@ExcelSheet(styleSheets = {CorporateStyles.class, FinanceStyles.class},
        header = @HeaderStyles(base = "corporate-header"))
```

La sezione 8 è dedicata ai fogli di stile condivisi.

#### 4.1.6 `freezeHeader`

| | |
| --- | --- |
| Tipo | `boolean` |
| Valore predefinito | `true` |
| Effetto | Blocca le righe fino all'intestazione inclusa, così restano visibili durante lo scorrimento. Quando il foglio ha un titolo, viene bloccata anche la riga del titolo. Nessuna colonna viene bloccata. |
| Validazione | Nessuna. |

```java
@ExcelSheet(freezeHeader = false)
```

#### 4.1.7 `autoFilter`

| | |
| --- | --- |
| Tipo | `boolean` |
| Valore predefinito | `false` |
| Effetto | Aggiunge un filtro automatico di Excel che copre tutte le colonne, dalla riga di intestazione all'ultima riga di dati. Senza righe di dati copre solo la riga di intestazione. Il titolo non è mai incluso. |
| Validazione | Nessuna. |

```java
@ExcelSheet(autoFilter = true)
```

#### 4.1.8 `autoSizeColumns`

| | |
| --- | --- |
| Tipo | `boolean` |
| Valore predefinito | `true` |
| Effetto | Dimensiona sul contenuto ogni colonna priva di `width` esplicito. |
| Interazioni | Le colonne con `@ExcelColumn.width` non vengono mai dimensionate automaticamente. Quando è false, le colonne senza `width` mantengono la larghezza scelta dall'applicazione di fogli di calcolo. |
| Validazione | Nessuna. |

Come funziona il dimensionamento:

1. Il dimensionamento è delegato ad Apache POI, che misura il testo con i font installati sulla macchina (Java AWT).
2. Su server o container senza font installati, o senza le librerie native di AWT, questa misurazione può fallire. sheetsmith ripiega allora su una **stima**: la lunghezza in caratteri del valore più lungo della colonna **come lo mostra Excel** (con il suo formato applicato, quindi date e numeri sono misurati come visualizzati), intestazione inclusa e titolo escluso, più 2 caratteri, con un massimo di 255.
3. Il tempo impiegato per il dimensionamento cresce con il numero di righe. Per i fogli di grandi dimensioni, disattivarlo e impostare larghezze esplicite: vedere la [sezione 12.3](#123-esportazioni-molto-grandi).

Un comportamento noto riguarda un foglio con un titolo e **una sola colonna**: vedere la [sezione 12.4](#124-dimensionamento-automatico-delle-colonne).

```java
@ExcelSheet(autoSizeColumns = false)
public record LargeRow(
        @ExcelColumn(header = "Id", order = 10, width = 10) long id,
        @ExcelColumn(header = "Description", order = 20, width = 60) String description) { }
```

#### 4.1.9 `outerBorder`

| | |
| --- | --- |
| Tipo | `Border` |
| Valore predefinito | `Border.INHERIT`, cioè nessuna cornice |
| Valori ammessi | ogni costante di `Border` (vedere l'[Appendice B](#b3-border)) |
| Effetto | Disegna una cornice attorno all'intestazione e alle righe di dati con un solo attributo: lungo il lato superiore della riga di intestazione, il lato sinistro della prima colonna, il lato destro dell'ultima colonna e il lato inferiore dell'ultima riga di dati (o della riga di intestazione quando non ci sono righe di dati). Il titolo non è mai incorniciato. |
| Interazioni | Qualsiasi valore diverso da `INHERIT`, `NONE` compreso, viene applicato a quei bordi: `NONE` quindi rimuove, sui bordi, i bordi che un preset o uno stile base disegnerebbero. Nella cascata, la cornice si colloca sopra il preset, gli slot base e gli slot dispari e pari, e sotto gli slot di prima e ultima riga e colonna, gli slot di colonna e lo stile di intestazione della colonna: uno stile a quei livelli che imposta un lato del bordo sovrascrive la cornice su quel lato. |
| Validazione | Nessuna. |

Bordi impostati dalla cornice, per cella:

| Cella | Lati impostati dalla cornice |
| --- | --- |
| Intestazione, ogni colonna | superiore |
| Intestazione, prima colonna | sinistro |
| Intestazione, ultima colonna | destro |
| Intestazione, ogni colonna, solo quando non ci sono righe di dati | inferiore |
| Dati, prima colonna | sinistro |
| Dati, ultima colonna | destro |
| Dati, ultima riga | inferiore |

```java
@ExcelSheet(outerBorder = Border.MEDIUM, outerBorderColor = "#1F4E79")
```

#### 4.1.10 `outerBorderColor`

| | |
| --- | --- |
| Tipo | `String`, un colore |
| Valore predefinito | `""`, cioè il colore automatico (di solito nero) |
| Valori ammessi | `#RRGGBB` oppure un nome di `IndexedColors` |
| Effetto | Colore dei bordi della cornice. I valori esadecimali vengono normalizzati in maiuscolo. |
| Interazioni | Ha effetto solo quando `outerBorder` è impostato. |
| Validazione | V-13 per un valore non vuoto non valido. |

#### 4.1.11 `header`

| | |
| --- | --- |
| Tipo | `HeaderStyles` |
| Valore predefinito | `@HeaderStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome della riga di intestazione: vedere la [sezione 4.6](#46-headerstyles). |

#### 4.1.12 `body`

| | |
| --- | --- |
| Tipo | `BodyStyles` |
| Valore predefinito | `@BodyStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome delle righe di dati a livello di tabella: vedere la [sezione 4.7](#47-bodystyles). |

#### 4.1.13 Esempio completo

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

In questo esempio si presume che `header` sia dichiarato in `CorporateStyles`.

### 4.2 `@ExcelColumn`

Esporta un campo di una classe sheet come colonna.

- **Opt-in.** Diventano colonne solo i campi che portano questa annotazione.
- **Ereditarietà.** Anche i campi annotati delle superclassi sono colonne.
- **Almeno una colonna** per classe sheet (V-02).
- **Non sui campi static** (V-05).
- **Record.** Su un componente di record, l'annotazione si applica al campo del componente.
- **Attributi obbligatori.** `header` e `order` non hanno un valore predefinito, quindi il compilatore rifiuta una colonna che ne è priva.

Riepilogo degli attributi:

| Attributo | Tipo | Valore predefinito |
| --- | --- | --- |
| `header` | `String` | nessuno, obbligatorio |
| `order` | `int` | nessuno, obbligatorio |
| `width` | `int` | `ExcelStyle.UNSET` |
| `format` | `String` | `""` |
| `converter` | `Class<? extends CellConverter<?>>` | `CellConverter.None.class` |
| `headerStyle` | `String` | `""` |
| `styles` | `ColumnStyles` | `@ColumnStyles` (nessuno slot impostato) |

#### 4.2.1 Accesso al valore

Il valore di una colonna viene letto come segue:

1. **Record:** tramite l'accessor del componente (`amount()`).
2. **Classe:** tramite un getter pubblico, non static e senza argomenti, dichiarato sulla classe o ereditato, **il cui tipo di ritorno è assegnabile al tipo del campo**:
   - per i campi `boolean` e `Boolean` si prova prima `isX()`, poi `getX()`;
   - per i campi di qualsiasi altro tipo, `getX()`.
   `X` è il nome del campo con la prima lettera maiuscola.
3. **Altrimenti:** direttamente dal campo, anche se è privato.

Conseguenze da conoscere:

- Un getter il cui tipo di ritorno non corrisponde viene **ignorato** e il campo viene letto direttamente. Questo include le incongruenze tra primitivi e wrapper: un campo `Boolean active` con `public boolean isActive()` viene letto dal campo, perché `boolean` non è assegnabile a `Boolean`; lo stesso vale per un campo `int` con un getter `Integer getX()`. Il valore scritto è lo stesso, ma qualsiasi logica interna al getter viene aggirata.
- Un getter dichiarato sulla classe sheet sovrascrive un getter di una superclasse, e un'istanza di una sottoclasse passata come dato usa l'override della sottoclasse (normale dispatch virtuale).
- I getter generati da Lombok (`@Getter`, `@Data`, `@Value`) seguono le convenzioni sopra e vengono usati.
- Un getter che lancia un'eccezione durante la generazione provoca una `SheetsmithGenerationException` che indica il foglio, la riga e il campo, con l'eccezione originale come causa.

**Applicazioni modulari.** sheetsmith ha bisogno di accesso reflection ai package che contengono le classi sheet. Aprirli in `module-info.java`:

- `opens com.example.export;` (non qualificato) funziona in ogni configurazione;
- `opens com.example.export to cloud.baldilorenzo.sheetsmith;` funziona solo quando sheetsmith è nel module path, dove il suo nome di modulo è `cloud.baldilorenzo.sheetsmith`. Quando sheetsmith è nel class path, appartiene al modulo senza nome e la direttiva qualificata non lo raggiunge.

Un valore a cui non si può accedere viola V-17, e il messaggio indica il package da aprire.

#### 4.2.2 `header`

| | |
| --- | --- |
| Tipo | `String` |
| Valore predefinito | nessuno: obbligatorio |
| Valori ammessi | qualsiasi testo non vuoto |
| Effetto | Testo della cella di intestazione della colonna, scritto così com'è (nessuna traduzione, nessun trim). |
| Validazione | V-04 quando è vuoto (stringa vuota o solo spazi). |

#### 4.2.3 `order`

| | |
| --- | --- |
| Tipo | `int` |
| Valore predefinito | nessuno: obbligatorio |
| Valori ammessi | qualsiasi `int`, compresi i valori negativi; univoco all'interno della classe sheet, colonne ereditate comprese |
| Effetto | Le colonne sono disposte da sinistra a destra in ordine crescente. |
| Validazione | V-03 quando due colonne hanno lo stesso valore; l'errore è segnalato sul secondo campo trovato e nomina il primo. |

```java
@ExcelColumn(header = "Code", order = 10) String code;
@ExcelColumn(header = "Name", order = 20) String name;
// later, without renumbering:
@ExcelColumn(header = "Category", order = 15) String category;
```

#### 4.2.4 `width`

| | |
| --- | --- |
| Tipo | `int`, caratteri |
| Valore predefinito | `ExcelStyle.UNSET` |
| Valori ammessi | da 1 a 255, oppure `UNSET` |
| Effetto | Imposta la larghezza della colonna in caratteri (unità di larghezza di Excel del font predefinito). |
| Interazioni | Una colonna con una larghezza esplicita la mantiene ed è esclusa da `autoSizeColumns`. Con `UNSET`, la larghezza deriva dal dimensionamento automatico o, quando è disattivato, dall'applicazione di fogli di calcolo. |
| Validazione | V-14 al di fuori dell'intervallo da 1 a 255. |

#### 4.2.5 `format`

| | |
| --- | --- |
| Tipo | `String`, un codice di formato Excel |
| Valore predefinito | `""`, che lascia il formato agli stili e ai valori predefiniti dell'applicazione |
| Valori ammessi | qualsiasi codice di formato Excel, nella sintassi di Excel descritta nella [sezione 6.6](#66-formati-dei-dati) |
| Effetto | Formato delle celle di dati della colonna. |
| Interazioni | È l'ultimo livello della cascata del corpo: vince sul `dataFormat` di ogni stile applicato alla cella e sui formati predefiniti dell'applicazione. Non si applica alla cella di intestazione. Il formato viene scritto nel file così com'è, senza validazione. |
| Validazione | Nessuna: un codice di formato non valido non viene rilevato da sheetsmith e Excel può mostrarlo come messaggio di riparazione o ignorarlo. |

```java
@ExcelColumn(header = "Due date", order = 30, format = "dd/mm/yyyy") LocalDate due;
@ExcelColumn(header = "Amount", order = 40, format = "#,##0.00 \"EUR\"") BigDecimal amount;
@ExcelColumn(header = "Rate", order = 50, format = "0.0%") double rate;
```

#### 4.2.6 `converter`

| | |
| --- | --- |
| Tipo | `Class<? extends CellConverter<?>>` |
| Valore predefinito | `CellConverter.None.class`, cioè nessun converter di campo |
| Valori ammessi | una classe converter che gestisce un tipo assegnabile dal tipo del campo (i tipi primitivi contano come i rispettivi wrapper) |
| Effetto | I valori di questa colonna vengono convertiti con questo converter invece che con il converter di applicazione o integrato per il tipo del campo. |
| Interazioni | Un'istanza per classe converter e per generatore, condivisa da ogni colonna che la dichiara. Senza Spring, la classe deve essere pubblica con un costruttore pubblico senza argomenti. Con l'auto-configurazione di Spring Boot, viene usato il bean di quella classe quando ne esiste esattamente uno, altrimenti viene creata una nuova istanza con dependency injection (vedere la [sezione 9.6](#96-converter-di-campo-e-converter-di-applicazione)). |
| Validazione | V-11 quando il tipo gestito è incompatibile (verificato quando il tipo gestito può essere determinato dalla dichiarazione generica della classe converter); V-12 quando il converter non può essere creato. |

```java
@ExcelColumn(header = "Id", order = 10, converter = UuidAsText.class) UUID id;
```

#### 4.2.7 `headerStyle`

| | |
| --- | --- |
| Tipo | `String`, il nome di uno stile con nome |
| Valore predefinito | `""` |
| Effetto | Applicato alla cella di intestazione di questa colonna. È l'ultimo livello della cascata dell'intestazione: vince sul preset, sugli slot di intestazione e sulla cornice. |
| Validazione | V-06 quando il nome non esiste. |

```java
@ExcelColumn(header = "Amount", order = 40, headerStyle = "right") BigDecimal amount;
```

#### 4.2.8 `styles`

| | |
| --- | --- |
| Tipo | `ColumnStyles` |
| Valore predefinito | `@ColumnStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome delle celle di dati di questa colonna: vedere la [sezione 4.8](#48-columnstyles). Gli slot di colonna sono gli slot più specifici della cascata del corpo. |

#### 4.2.9 Esempio completo

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

Dichiara uno stile con nome: un insieme di attributi di formattazione che gli slot referenziano per nome.

- **Dove.** Sulla classe sheet, oppure su una classe foglio di stile annotata con `@ExcelStyleSheet` per condividerlo.
- **Ripetibile.** Si può scrivere tutte le volte che serve sulla stessa classe.
- **Nomi.** Non vuoti (V-16), univoci all'interno della classe che li dichiara (V-07). I nomi distinguono maiuscole e minuscole e vengono confrontati esattamente, spazi compresi.
- **Non ereditato** dalle superclassi.
- **Ha effetto solo tramite gli slot.** Uno stile dichiarato ma non referenziato non ha effetto.
- **All'interno di uno stile**, una linea o un colore di bordo specifico per lato (`borderTop`, `borderTopColor`, ...) vince sull'attributo per tutti i lati (`border`, `borderColor`) su quel lato.

Gli attributi, raggruppati per area. Ogni attributo diverso da `name` ha come valore predefinito "non impostato".

| Attributo | Tipo | Valore non impostato | Valori ammessi | Effetto |
| --- | --- | --- | --- | --- |
| `name` | `String` | nessuno, obbligatorio | non vuoto | Nome usato dagli slot. |
| `align` | `Align` | `INHERIT` | vedere [B.1](#b1-align) | Allineamento orizzontale. |
| `verticalAlign` | `VerticalAlign` | `INHERIT` | vedere [B.2](#b2-verticalalign) | Allineamento verticale. |
| `wrapText` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Il testo lungo va a capo su più righe. |
| `shrinkToFit` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Il font si riduce affinché il testo stia nella larghezza della cella. |
| `rotation` | `int` | `UNSET` | da -90 a 90, oppure 255 | Rotazione del testo in gradi; 255 significa testo impilato verticalmente. |
| `indent` | `int` | `UNSET` | da 0 a 250 | Livello di rientro. |
| `border` | `Border` | `INHERIT` | vedere [B.3](#b3-border) | Linea del bordo di tutti e quattro i lati. |
| `borderColor` | `String` | `""` | colore | Colore del bordo di tutti e quattro i lati. |
| `borderTop`, `borderBottom`, `borderLeft`, `borderRight` | `Border` | `INHERIT` | vedere [B.3](#b3-border) | Linea del bordo di un lato; vince su `border` nello stesso stile. |
| `borderTopColor`, `borderBottomColor`, `borderLeftColor`, `borderRightColor` | `String` | `""` | colore | Colore del bordo di un lato; vince su `borderColor` nello stesso stile. |
| `fillColor` | `String` | `""` | colore | Colore di riempimento in primo piano, cioè il colore di sfondo della cella. |
| `fillBackgroundColor` | `String` | `""` | colore | Secondo colore, usato solo dai riempimenti a motivo. |
| `fillPattern` | `Fill` | `INHERIT` | vedere [B.4](#b4-fill) | Motivo di riempimento. |
| `fontName` | `String` | `""` | un nome di font, ad esempio `Arial` | Famiglia di font. |
| `fontSize` | `int` | `UNSET` | da 1 a 409 | Dimensione del font in punti. |
| `bold` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Font in grassetto. |
| `italic` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Font in corsivo. |
| `strikeout` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Testo barrato. |
| `underline` | `Underline` | `INHERIT` | vedere [B.5](#b5-underline) | Sottolineatura. |
| `fontColor` | `String` | `""` | colore | Colore del font. |
| `script` | `Script` | `INHERIT` | vedere [B.6](#b6-script) | Apice o pedice. |
| `dataFormat` | `String` | `""` | codice di formato Excel | Formato dei dati delle celle a cui si applica lo stile. |
| `locked` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Cella bloccata; efficace solo sui fogli protetti. |
| `hidden` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Formula nascosta; efficace solo sui fogli protetti. |
| `quotePrefix` | `Toggle` | `INHERIT` | `TRUE`, `FALSE` | Prefisso apice di Excel, che contrassegna il valore come testo. |

Validazione di `@ExcelStyle`:

| Regola | Verificata su |
| --- | --- |
| V-16 | `name` vuoto. Lo stile viene quindi ignorato e l'elemento dell'errore è `@ExcelStyle(#n)`, dove `n` è la posizione, a partire da 1, della dichiarazione sulla classe. |
| V-07 | lo stesso `name` dichiarato due volte sulla stessa classe. |
| V-13 | `borderColor`, i quattro colori dei lati, `fillColor`, `fillBackgroundColor`, `fontColor`. |
| V-14 | `rotation`, `indent`, `fontSize`. |

Note su attributi specifici:

- **Riempimento.** Quando lo stile effettivo ha un `fillColor` e nessun `fillPattern`, il riempimento è pieno (`SOLID_FOREGROUND`). Per uno sfondo semplice basta `fillColor`. `fillBackgroundColor` conta solo con un riempimento a motivo. Impostare `fillPattern = Fill.NO_FILL` a un livello superiore rimuove un riempimento impostato a un livello inferiore.
- **Rimozione dei valori ereditati.** `Toggle.FALSE`, `Border.NONE`, `Underline.NONE`, `Script.NONE` e `Fill.NO_FILL` rimuovono esplicitamente ciò che un livello inferiore ha impostato, mentre `INHERIT` lo mantiene.
- **Protezione.** `locked` e `hidden` hanno effetto solo quando il foglio è protetto, e sheetsmith non protegge i fogli: contano solo se chi legge protegge il foglio in Excel.
- **dataFormat.** Sulle celle di dati, `@ExcelColumn.format` vince su di esso. Quando nessun livello imposta un formato, si applica il valore predefinito dell'applicazione per il tipo di valore.

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

In `boxed`, il lato inferiore è `MEDIUM` e gli altri tre sono `THIN`, tutti con il colore `#BFBFBF`.

### 4.4 `@ExcelStyles`

Contenitore di annotazioni `@ExcelStyle` ripetute. Il compilatore lo usa automaticamente quando `@ExcelStyle` è ripetuta su una classe. Ha un attributo, `value`, di tipo `ExcelStyle[]`. Scriverlo esplicitamente è consentito ma mai necessario:

```java
// equivalent forms
@ExcelStyle(name = "a", bold = Toggle.TRUE)
@ExcelStyle(name = "b", italic = Toggle.TRUE)

@ExcelStyles({@ExcelStyle(name = "a", bold = Toggle.TRUE), @ExcelStyle(name = "b", italic = Toggle.TRUE)})
```

### 4.5 `@ExcelStyleSheet`

Contrassegna un foglio di stile: una classe che contiene stili con nome condivisi da più classi sheet. Non ha attributi.

- Un foglio di stile porta questa annotazione e le dichiarazioni `@ExcelStyle`. I suoi campi, metodi e altre annotazioni non hanno alcun ruolo. La forma abituale è una classe final con un costruttore privato.
- Le classi sheet lo referenziano in `@ExcelSheet.styleSheets` e possono quindi usare i suoi stili per nome.
- Si possono referenziare solo classi che portano questa annotazione (V-09).
- I nomi degli stili devono essere univoci all'interno del foglio di stile (V-07). Gli errori su uno stile di un foglio di stile nominano la classe del foglio di stile, non la classe sheet.
- I fogli di stile referenziati da una classe sheet non devono dichiarare lo stesso nome (V-08).
- Uno stile dichiarato sulla classe sheet vince su uno stile con lo stesso nome proveniente da un foglio di stile, e lo sostituisce interamente.

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

Slot dell'intestazione, utilizzabili solo come valore di `@ExcelSheet.header`. Ogni attributo è il nome di uno stile con nome; vuoto significa nessuno stile.

| Attributo | Valore predefinito | Livello della cascata | Si applica a |
| --- | --- | --- | --- |
| `base` | `""` | 2 | ogni cella di intestazione |
| `lastColumn` | `""` | 4, prima di `firstColumn` | la cella di intestazione dell'ultima colonna |
| `firstColumn` | `""` | 4, dopo `lastColumn` | la cella di intestazione della prima colonna |

Regole:

- Con una sola colonna, la sua cella di intestazione è sia la prima sia l'ultima, e `firstColumn` vince su `lastColumn`.
- La cornice si colloca sotto `firstColumn`, `lastColumn` e il `headerStyle` della colonna.
- Il `headerStyle` della colonna è il livello più specifico dell'intestazione.
- Gli slot di intestazione non si applicano mai alle celle di dati.

Validazione: V-06 per un nome che non esiste (elemento `@ExcelSheet`, slot `header.base`, `header.firstColumn` o `header.lastColumn`).

```java
@ExcelSheet(header = @HeaderStyles(base = "header", firstColumn = "header-left", lastColumn = "header-right"))
```

### 4.7 `@BodyStyles`

Slot del corpo a livello di tabella, utilizzabili solo come valore di `@ExcelSheet.body`.

| Attributo | Valore predefinito | Livello della cascata | Si applica a |
| --- | --- | --- | --- |
| `base` | `""` | 2 | ogni cella di dati |
| `odd` | `""` | 3 | celle di dati delle righe 1, 3, 5, ... |
| `even` | `""` | 3 | celle di dati delle righe 2, 4, 6, ... |
| `lastColumn` | `""` | 5, prima di `firstColumn` | celle di dati dell'ultima colonna |
| `firstColumn` | `""` | 5, dopo `lastColumn` | celle di dati della prima colonna |
| `lastRow` | `""` | 6, prima di `firstRow` | celle di dati dell'ultima riga di dati |
| `firstRow` | `""` | 6, dopo `lastRow` | celle di dati della prima riga di dati |

Regole:

- Le righe di dati sono numerate da 1, quindi la prima riga di dati è dispari.
- La riga vince sulla colonna (livello 6 dopo il livello 5).
- Il primo vince sull'ultimo, per le righe e per le colonne.
- La cornice si colloca sotto gli slot di riga e di colonna.
- Gli slot di colonna (`@ColumnStyles`) sono più specifici di ogni slot del corpo.
- Gli slot del corpo non si applicano mai all'intestazione o al titolo.

Validazione: V-06 (elemento `@ExcelSheet`, slot `body.base`, `body.odd` e così via).

```java
@ExcelSheet(body = @BodyStyles(base = "cell", odd = "zebra", firstColumn = "key", lastRow = "total"))
```

### 4.8 `@ColumnStyles`

Slot del corpo di una colonna, utilizzabili solo come valore di `@ExcelColumn.styles`. Applicati dopo ogni livello della tabella, in quest'ordine: `base`, `odd` o `even`, `lastRow`, poi `firstRow`. Solo il `format` della colonna viene dopo di essi.

| Attributo | Valore predefinito | Si applica a |
| --- | --- | --- |
| `base` | `""` | ogni cella di dati della colonna |
| `odd` | `""` | le celle della colonna nelle righe di dati dispari |
| `even` | `""` | le celle della colonna nelle righe di dati pari |
| `lastRow` | `""` | la cella della colonna nell'ultima riga di dati |
| `firstRow` | `""` | la cella della colonna nella prima riga di dati; vince su `lastRow` con una sola riga di dati |

Gli slot di colonna non hanno attributi di prima e ultima colonna, perché la colonna è una sola. Non si applicano mai alla cella di intestazione della colonna, che viene stilizzata da `@ExcelColumn.headerStyle`.

Validazione: V-06 (elemento: il nome del campo, slot `styles.base`, `styles.odd` e così via).

```java
@ExcelColumn(header = "Amount", order = 40, styles = @ColumnStyles(base = "money", lastRow = "money-total"))
BigDecimal amount;
```

---

## 5. Riferimento API

### 5.1 Panoramica

| Tipo | Genere | Ruolo |
| --- | --- | --- |
| `Sheetsmith` | interfaccia | Il generatore. |
| `Sheetsmith.Builder` | interfaccia | Configura e costruisce i generatori. |
| `SheetData<T>` | record | Un foglio da generare: nome, classe sheet, dati. |
| `SheetsmithDefaults` | record | Valori predefiniti dell'applicazione: formati predefiniti, preset predefinito e colore di accento. |
| `DocumentProperties` | record | Autore e applicazione registrati in ogni file. |
| `SheetsmithException` | classe abstract sealed | Base delle eccezioni della libreria. |
| `SheetsmithConfigurationException` | classe final | Errori di configurazione, con la lista di `ConfigurationError`. |
| `SheetsmithGenerationException` | classe final | Errori sui dati durante la scrittura, con foglio, riga e campo. |
| `ConfigurationError` | record | Un errore di configurazione. |

Tutti si trovano in `cloud.baldilorenzo.sheetsmith`. I tipi dei converter sono descritti nella [sezione 9](#9-converter).

### 5.2 `Sheetsmith`

```java
public interface Sheetsmith {
    byte[] generate(List<SheetData<?>> sheets);
    void generate(List<SheetData<?>> sheets, OutputStream out);
    void validate(Class<?> type);
    static Builder builder();
}
```

Le istanze sono immutabili e thread-safe. Se ne crea una, con il builder o tramite l'auto-configurazione di Spring Boot, e la si condivide in tutta l'applicazione. L'implementazione predefinita è creata dal builder; le applicazioni non implementano l'interfaccia, se non per i test double.

#### 5.2.1 `generate(List<SheetData<?>>)`

Genera un file `.xlsx` contenente i fogli indicati e ne restituisce il contenuto.

| | |
| --- | --- |
| Parametri | `sheets`: i fogli, nell'ordine della cartella di lavoro; non null, senza elementi null |
| Restituisce | il contenuto del file |
| Lancia | `SheetsmithConfigurationException` se l'input viola da V-18 a V-20 o se una classe sheet viola una qualsiasi regola da V-01 a V-17, con tutti gli errori elencati; `SheetsmithGenerationException` se un elemento o un valore non può essere scritto; `UncheckedIOException` se la serializzazione fallisce (praticamente irraggiungibile con questo metodo, che scrive in memoria); `NullPointerException` se `sheets` è null o contiene un elemento null |

Comportamento:

- I fogli compaiono nella cartella di lavoro nell'ordine della lista.
- Ogni foglio può usare una classe sheet diversa, e una classe può essere usata da più fogli.
- Una lista di dati vuota è valida: il suo foglio contiene solo il titolo, se presente, e l'intestazione.
- L'input e ogni classe sheet vengono validati prima che venga scritto qualsiasi dato; gli errori dell'input e di tutte le classi vengono segnalati insieme.
- Una classe che non supera la validazione non viene messa in cache e viene rifiutata a ogni chiamata finché non è corretta.

#### 5.2.2 `generate(List<SheetData<?>>, OutputStream)`

Genera lo stesso file e lo scrive su uno stream fornito dal chiamante.

| | |
| --- | --- |
| Parametri | `sheets`: come sopra; `out`: lo stream che riceve il file, non null |
| Lancia | come sopra; `UncheckedIOException` incapsula qualsiasi `IOException` durante la serializzazione, compreso un guasto dello stream stesso, con l'eccezione originale come causa; `NullPointerException` se `sheets` o `out` è null |

Contratto dello stream:

- Lo stream appartiene al chiamante: viene sottoposto a **flush** dopo la scrittura del file e **non viene mai chiuso**.
- L'intera cartella di lavoro viene costruita prima che inizi la serializzazione, quindi **non viene scritto nulla** sullo stream quando si verifica un errore di configurazione o di generazione.
- Può restare contenuto parziale nello stream solo quando si verifica un errore di I/O durante la serializzazione.

#### 5.2.3 Scelta tra `byte[]` e `OutputStream`

I due metodi producono contenuto identico e usano praticamente la stessa memoria: l'intera cartella di lavoro viene costruita in memoria prima di essere scritta, il suo modello in memoria è molto più grande del file, e la copia aggiuntiva del file tenuta dal metodo con `byte[]` è trascurabile al confronto. La scelta dipende dalla destinazione:

| Destinazione del file | Metodo |
| --- | --- |
| Un file su disco, una risposta HTTP, uno stream di upload su cloud storage, qualsiasi altro stream | `generate(sheets, out)` |
| Byte necessari come tali: un allegato e-mail, una colonna di database, il payload di un messaggio, una cache, un'asserzione di test, un header `Content-Length` | `generate(sheets)` |

#### 5.2.4 `validate(Class<?>)`

Valida una classe sheet senza generare nulla.

| | |
| --- | --- |
| Parametri | `type`: la classe sheet, non null |
| Lancia | `SheetsmithConfigurationException` che elenca ogni errore della classe; `NullPointerException` se `type` è null |

Esegue ogni controllo che `generate` esegue su una classe: le regole sulle annotazioni da V-01 a V-09 e da V-13 a V-17, e l'associazione dei converter da V-10 a V-12, usando i converter di applicazione e la converter factory di questa istanza. Validare con un'istanza configurata come quella che genera i file, altrimenti un tipo coperto da un converter di applicazione può essere segnalato come V-10. Usi tipici: test unitari e validazione all'avvio.

```java
@Test
void sheetClassesAreValid() {
    Sheetsmith sheetsmith = Sheetsmith.builder().converter(Money.class, new MoneyConverter()).build();
    assertDoesNotThrow(() -> sheetsmith.validate(InvoiceLine.class));
}
```

#### 5.2.5 `builder()`

Restituisce un nuovo builder con le impostazioni predefinite: nessun converter di applicazione (si applicano solo i converter integrati), converter di campo creati tramite il loro costruttore pubblico senza argomenti, `SheetsmithDefaults.standard()` e `DocumentProperties.standard()`.

### 5.3 `Sheetsmith.Builder`

| Metodo | Descrizione | Lancia |
| --- | --- | --- |
| `<T> Builder converter(Class<T> type, CellConverter<? super T> converter)` | Registra un converter di applicazione per un tipo. Si applica a ogni colonna il cui tipo dichiarato è `type` o un suo sottotipo, in ogni classe sheet, a meno che la colonna abbia un converter di campo o sia registrato un converter per un supertipo più vicino. I tipi primitivi vengono registrati come i rispettivi wrapper (`double.class` e `Double.class` sono la stessa chiave). Un converter per un tipo che ha un converter integrato (`Boolean`, `LocalDate`, `Enum`, ...) sostituisce il comportamento integrato. Il converter deve essere thread-safe. | `IllegalArgumentException` se è già registrato un converter per il tipo (messaggio: `a converter is already registered for type X`); `NullPointerException` per un argomento null |
| `Builder converterFactory(CellConverterFactory factory)` | Imposta la factory che crea i converter di campo. Viene chiamata una volta per classe converter, la prima volta che una classe sheet che la dichiara viene validata o generata; il risultato viene riutilizzato. Un converter che la factory non riesce a creare viola V-12. | `NullPointerException` |
| `Builder defaults(SheetsmithDefaults defaults)` | Imposta i valori predefiniti dell'applicazione. | `NullPointerException` |
| `Builder documentProperties(DocumentProperties properties)` | Imposta l'autore e l'applicazione registrati in ogni file. | `NullPointerException` |
| `Sheetsmith build()` | Costruisce un'istanza immutabile e thread-safe con le impostazioni correnti. | nessuna |

Ogni metodo di configurazione restituisce il builder, quindi le chiamate possono essere concatenate.

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

| Componente | Significato |
| --- | --- |
| `name` | Il nome del foglio, soggetto a V-19 e V-20. |
| `type` | La classe sheet, annotata con `@ExcelSheet`. |
| `rows` | Gli oggetti, in ordine di riga; il primo elemento è la riga di dati 1. |

- La classe sheet viene passata esplicitamente perché il tipo degli elementi di una lista viene cancellato a runtime e una lista vuota non ha alcun elemento da ispezionare.
- Le righe vengono **copiate** in una lista non modificabile, quindi le modifiche successive alla lista originale non influiscono sul foglio.
- Gli **elementi null vengono mantenuti** dalla copia e segnalati, al momento della generazione, come `SheetsmithGenerationException` con il loro indice di riga.
- `of` accetta una lista il cui tipo di elemento è un sottotipo della classe sheet: una `List<PremiumCustomerRow>` può essere scritta con la classe sheet `CustomerRow` senza copie né cast. Le colonne sono quelle di `CustomerRow`.
- Il costruttore e `of` lanciano `NullPointerException` per un argomento null.
- I nomi dei fogli **non** vengono controllati quando il record viene creato: li controlla `generate`, insieme agli altri errori di configurazione.

**Regole sul nome del foglio** (controllate da `generate`):

| Regola | Codice |
| --- | --- |
| da 1 a 31 caratteri | V-19 |
| nessuno dei caratteri `\ / ? * [ ] :` | V-19 |
| non inizia né finisce con un apostrofo `'` | V-19 |
| univoco all'interno della cartella di lavoro, ignorando maiuscole e minuscole | V-20 |

I nomi non validi vengono rifiutati, mai troncati o ripuliti: i nomi costruiti a partire da dati devono essere ripuliti dal chiamante (vedere la [ricetta 13.15](#1315-nomi-di-foglio-costruiti-da-dati)). Excel riserva inoltre il nome `History`, che non viene rifiutato ma va evitato.

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

| Componente | Significato | Valore standard | Vincolo |
| --- | --- | --- | --- |
| `dateFormat` | Formato predefinito delle celle data, come i valori `LocalDate` | `yyyy-mm-dd` | non null, non vuoto |
| `dateTimeFormat` | Formato predefinito delle celle data e ora, come i valori `LocalDateTime` | `yyyy-mm-dd hh:mm:ss` | non null, non vuoto |
| `numberFormat` | Formato predefinito delle celle numeriche, interi compresi | `""` ("Generale" di Excel) | non null, può essere vuoto |
| `preset` | Preset delle classi sheet che dichiarano `INHERIT` | `NONE` | non null, non `INHERIT` |
| `accentColor` | Colore di accento delle classi sheet che non ne dichiarano | `#4472C4` | non null, un colore valido (vuoto non ammesso) |

Il costruttore lancia `IllegalArgumentException` per valori non validi, con questi messaggi: `dateFormat must not be blank`, `dateTimeFormat must not be blank`, `preset must not be INHERIT`, `accentColor 'X' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant`; e `NullPointerException` per componenti null.

**Quando si applica un formato predefinito.** Un formato predefinito si applica solo quando lo stile effettivo della cella non imposta alcun formato, cioè quando né `@ExcelColumn.format` né il `dataFormat` di alcuno stile della cascata ne imposta uno. Una cella di dati prende quindi il proprio formato dalla prima di queste fonti che ne imposta uno: il `format` della colonna, il `dataFormat` della cascata, il formato predefinito per il tipo di valore.

| Tipo di valore della cella | Formato predefinito usato |
| --- | --- |
| data (`LocalDate`, `CellValue.date`) | `dateFormat` |
| data e ora (`LocalDateTime`, `CellValue.dateTime`) | `dateTimeFormat` |
| numero (qualsiasi `Number`, `CellValue.number`) | `numberFormat`, se non vuoto |
| testo, booleano, vuoto | nessuno |

`numberFormat` si applica a ogni cella numerica, interi compresi: con `#,##0.00`, una colonna di interi mostra due decimali a meno che abbia un proprio formato, ad esempio `format = "0"`.

Il colore di accento viene usato solo quando il preset effettivo non è `NONE`.

### 5.6 `DocumentProperties`

```java
public record DocumentProperties(String author, String application) {
    public static DocumentProperties standard();   // author "sheetsmith", application "sheetsmith"
}
```

| Componente | Significato | Valore standard |
| --- | --- | --- |
| `author` | L'autore dei documenti, mostrato da Excel in File, Informazioni, e dal sistema operativo tra le proprietà del file | `sheetsmith` |
| `application` | L'applicazione registrata come creatrice dei documenti | `sheetsmith` |

- I valori vengono scritti così come sono.
- Un **valore vuoto omette la proprietà** dal file, che quindi appare vuota.
- I componenti null lanciano `NullPointerException`.
- Senza configurazione, entrambe le proprietà valgono `sheetsmith`, al posto dei valori "Apache POI" che la libreria sottostante registrerebbe altrimenti.

```java
Sheetsmith.builder().documentProperties(new DocumentProperties("Example Ltd", "Billing")).build();
Sheetsmith.builder().documentProperties(new DocumentProperties("", "")).build();   // both left out
```

In Spring Boot, usare `sheetsmith.document.author` e `sheetsmith.document.application` ([sezione 10.3](#103-proprietà-di-configurazione)).

### 5.7 Eccezioni

```
RuntimeException
 └── SheetsmithException                    (sealed, abstract)
      ├── SheetsmithConfigurationException  (final)
      └── SheetsmithGenerationException     (final)
```

Tutte le eccezioni della libreria sono unchecked e serializzabili. Ce ne sono due tipi, che richiedono reazioni diverse:

| Eccezione | Significato | Quando | Reazione tipica |
| --- | --- | --- | --- |
| `SheetsmithConfigurationException` | Una classe sheet o l'input è errato: un errore di programmazione. | Prima che venga scritto qualsiasi dato: in `generate`, in `validate`, nella validazione all'avvio. | Correggere il codice. Intercettarla presto con `validate` nei test o all'avvio. |
| `SheetsmithGenerationException` | Qualcosa è andato storto durante la scrittura dei dati: di solito dati inattesi a runtime. | Durante la scrittura di un foglio. | Registrarla nel log con foglio, riga e campo; correggere i dati o il converter. |

Un errore durante la serializzazione della cartella di lavoro non è nessuno dei due: è un errore di infrastruttura, segnalato come `java.io.UncheckedIOException` e deliberatamente non incapsulato in un'eccezione di sheetsmith, in modo che i chiamanti possano gestirlo separatamente dagli errori di configurazione e di dati.

#### 5.7.1 `SheetsmithConfigurationException`

| Membro | Descrizione |
| --- | --- |
| `SheetsmithConfigurationException(List<ConfigurationError> errors)` | Costruttore pubblico; `errors` non null e non vuoto (`IllegalArgumentException` se vuoto). |
| `List<ConfigurationError> errors()` | Gli errori, nell'ordine in cui sono stati trovati; non modificabile, mai vuoto, preservato dalla serializzazione Java. |
| `getMessage()` | Una riga per errore, nel formato descritto nella [sezione 11.1](#111-lettura-di-un-errore-di-configurazione). |

#### 5.7.2 `SheetsmithGenerationException`

| Membro | Descrizione |
| --- | --- |
| `SheetsmithGenerationException(String message, String sheetName, int rowIndex, String fieldName, Throwable cause)` | Costruttore pubblico. `rowIndex` 0 quando non è specifico di una riga (i valori negativi lanciano `IllegalArgumentException`); `fieldName` e `cause` possono essere null. Il messaggio viene completato con la posizione. |
| `String sheetName()` | Il nome del foglio in scrittura. |
| `int rowIndex()` | La riga di dati, a partire da 1, nell'ordine della lista (la riga 1 è il primo elemento); 0 quando l'errore non è specifico di una riga, ad esempio troppe righe. Titolo e intestazione non vengono contati. |
| `Optional<String> fieldName()` | Il campo coinvolto, come dichiarato nella classe sheet; vuoto quando non è specifico di un campo, ad esempio un elemento null. |
| `getCause()` | L'eccezione originale lanciata da un getter o da un converter, quando c'è. |

#### 5.7.3 `ConfigurationError`

```java
public record ConfigurationError(String code, Class<?> type, String element, String message) implements Serializable
```

| Componente | Significato |
| --- | --- |
| `code` | La regola violata, da `V-01` a `V-20`. |
| `type` | La classe a cui si riferisce l'errore: la classe sheet, o il foglio di stile che dichiara lo stile difettoso; `null` per gli errori sull'input di `generate` (da V-18 a V-20). |
| `element` | L'elemento coinvolto: un nome di campo, `@ExcelSheet`, `@ExcelStyle(name)`, `@ExcelStyle(#n)` quando il nome è vuoto, `sheets[i]` per un foglio dell'input; vuoto quando l'errore riguarda la classe o l'input nel suo complesso. |
| `message` | La descrizione del problema. |

`code`, `element` e `message` non sono null (altrimenti `NullPointerException`).

---

## 6. Stili

Questa sezione raccoglie tutto ciò che riguarda la formattazione: i colori, il significato di ogni gruppo di attributi, la sintassi dei formati dei dati e la cascata in pratica. Gli elenchi completi delle costanti enum sono nell'[Appendice B](#appendice-b-domini-dei-valori).

### 6.1 Definizione degli stili

Uno stile con nome si dichiara con `@ExcelStyle` sulla classe sheet o su un foglio di stile, e si applica tramite gli slot. L'elenco completo degli attributi è nella [sezione 4.3](#43-excelstyle). Un modo utile per organizzare gli stili:

- uno stile per **scopo** (`header`, `zebra`, `money`, `total`, `key`), non per cella;
- combinare gli scopi tramite la cascata invece di creare uno stile per ogni combinazione: uno stile `total` che imposta solo `bold` e un bordo superiore funziona sopra `money`, `zebra` o un preset.

### 6.2 Colori

Ogni attributo di colore di sheetsmith (i colori di `@ExcelStyle`, `@ExcelSheet.accentColor`, `@ExcelSheet.outerBorderColor`, il colore di accento predefinito dell'applicazione) accetta:

| Forma | Esempio | Note |
| --- | --- | --- |
| esadecimale `#RRGGBB` | `#1F4E79`, `#1f4e79` | Maiuscolo o minuscolo. Normalizzato in maiuscolo, quindi `#1f4e79` e `#1F4E79` sono lo stesso colore e condividono uno stesso stile di cella. Esattamente sei cifre esadecimali: `#FFF` e `1F4E79` non sono validi. |
| nome di costante `IndexedColors` | `DARK_BLUE`, `GREY_25_PERCENT` | Il nome di una costante di Apache POI `org.apache.poi.ss.usermodel.IndexedColors`, con distinzione tra maiuscole e minuscole, in maiuscolo come dichiarato. Non normalizzato. L'elenco completo è nell'[Appendice B.9](#b9-nomi-di-indexedcolors). |
| stringa vuota | `""` | Non impostato. |

Qualsiasi altro valore viola V-13. Preferire i colori esadecimali: sono esatti, mentre i colori indicizzati dipendono dalla tavolozza dell'applicazione che apre il file. `AUTOMATIC` è accettato; come colore di accento viene trattato come nero.

### 6.3 Allineamento e controllo del testo

| Attributo | Note |
| --- | --- |
| `align` | `GENERAL` è il valore predefinito di Excel: testo a sinistra, numeri e date a destra. `CENTER_SELECTION` centra attraverso le celle adiacenti con lo stesso allineamento senza unirle. `FILL` ripete il contenuto per riempire la cella. |
| `verticalAlign` | Il valore predefinito di Excel è `BOTTOM`. `JUSTIFY` e `DISTRIBUTED` influiscono sul testo che va a capo. |
| `wrapText` | Manda a capo il testo lungo su più righe. sheetsmith non imposta l'altezza delle righe: a seconda dell'applicazione di fogli di calcolo, le righe con testo a capo possono essere mostrate con l'altezza predefinita finché chi legge non applica un'altezza di riga automatica. |
| `shrinkToFit` | Riduce la dimensione del font affinché il testo stia nella cella. Ignorato da Excel quando `wrapText` è attivo. |
| `rotation` | Da -90 a 90 gradi; i valori positivi ruotano in senso antiorario. 255 impila i caratteri verticalmente. |
| `indent` | Livello di rientro, da 0 a 250, efficace con allineamento a sinistra, a destra o distribuito. |

### 6.4 Bordi

- Ogni lato ha una linea (`Border`) e un colore.
- `border` e `borderColor` impostano i quattro lati in una volta; gli attributi specifici per lato vincono su di essi all'interno dello stesso stile.
- Lungo la cascata, ogni lato viene unito in modo indipendente: un livello che imposta solo `borderBottom` mantiene gli altri tre lati dei livelli inferiori.
- `Border.NONE` rimuove una linea impostata a un livello inferiore; `Border.INHERIT` la mantiene.
- Un lato con una linea e senza colore usa il colore automatico, di solito nero.
- I bordi delle celle adiacenti sono memorizzati in modo indipendente: un bordo inferiore su una riga e un bordo superiore sulla riga successiva sono due impostazioni distinte di due celle.
- La cornice esterna ([sezione 4.1.9](#419-outerborder)) è un livello dedicato che imposta solo i bordi della tabella.

### 6.5 Riempimenti e font

- **Riempimento pieno:** impostare solo `fillColor`. Il motivo diventa automaticamente `SOLID_FOREGROUND`.
- **Riempimento a motivo:** impostare `fillPattern`, `fillColor` (colore del motivo) e, facoltativamente, `fillBackgroundColor` (colore dietro il motivo).
- **Nessun riempimento:** `fillPattern = Fill.NO_FILL` rimuove un riempimento impostato a un livello inferiore, ad esempio le righe alternate di un preset su una colonna.
- **Font:** `fontName`, `fontSize`, `bold`, `italic`, `strikeout`, `underline`, `fontColor` e `script` vengono uniti attributo per attributo come il resto dello stile. Il nome del font deve essere disponibile sulla macchina che apre il file, altrimenti Excel lo sostituisce. I font vengono deduplicati nel file.

### 6.6 Formati dei dati

Ogni formato di sheetsmith (`@ExcelColumn.format`, `@ExcelStyle.dataFormat`, i formati predefiniti di `SheetsmithDefaults` e le proprietà `sheetsmith.formats.*`) usa la **sintassi dei formati di Excel**, quella della finestra di dialogo "Formato celle" di Excel. Non è la sintassi di `java.time.format.DateTimeFormatter` né di `java.text.DecimalFormat`: le due sembrano simili ma non sono uguali. I formati vengono scritti nel file così come sono, senza traduzione e senza validazione.

**Codici di data e ora**

| Significato | Excel | `DateTimeFormatter` |
| --- | --- | --- |
| Giorno del mese: 5, 05 | `d`, `dd` | `d`, `dd` |
| Nome del giorno: lun, lunedì | `ddd`, `dddd` | `EEE`, `EEEE` |
| Mese: 3, 03 | `m`, `mm` | `M`, `MM` |
| Nome del mese: mar, marzo | `mmm`, `mmmm` | `MMM`, `MMMM` |
| Anno: 26, 2026 | `yy`, `yyyy` | `yy`, `yyyy` |
| Ore, da 0 a 23 | `h`, `hh` | `H`, `HH` |
| Ore, da 1 a 12 con AM/PM | `h AM/PM`, `hh AM/PM` | `h a`, `hh a` |
| Minuti | `m`, `mm` dopo un codice dell'ora o prima di un codice dei secondi | `m`, `mm` |
| Secondi | `s`, `ss` | `s`, `ss` |
| Ore trascorse oltre 24 | `[h]` | nessun equivalente |

In Excel, `m` e `mm` indicano il mese, a meno che seguano un codice dell'ora o precedano un codice dei secondi, nel qual caso indicano i minuti. Quindi `dd/mm/yyyy hh:mm` mostra il giorno, il mese, l'anno, le ore e i minuti. Il pattern Java `dd/MM/yyyy` si scrive in Excel come `dd/mm/yyyy`, e `HH:mm` come `hh:mm`.

**Formati numerici**

| Formato | Esempio di output |
| --- | --- |
| `0` | `1234` |
| `0.00` | `1234.50` |
| `#,##0` | `1,235` |
| `#,##0.00` | `1,234.50` |
| `0.0%` | `12.5%` (per il valore 0.125) |
| `#,##0.00 "EUR"` | `1,234.50 EUR` |
| `#,##0.00;[Red]-#,##0.00` | valori negativi in rosso |
| `0.00E+00` | `1.23E+03` |
| `00000` | `00042` (zeri iniziali sui numeri) |
| `@` | il valore come testo |

Nei formati numerici, `0` è una cifra sempre mostrata, `#` una cifra mostrata solo se significativa, `,` il separatore delle migliaia, `.` il separatore decimale, e il testo tra doppi apici viene mostrato così com'è. Un formato può avere fino a quattro sezioni separate da `;`: positivo, negativo, zero, testo. I separatori effettivamente visualizzati seguono le impostazioni regionali di chi apre il file: `#,##0.00` viene visualizzato come `1.234,50` su un sistema italiano.

Nel codice sorgente Java, i doppi apici all'interno di un formato devono essere preceduti da escape: `format = "#,##0.00 \"EUR\""`.

### 6.7 La cascata in pratica

Si consideri questa classe sheet:

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

Con tre righe di dati e l'accento predefinito `#4472C4`, lo stile effettivo di alcune celle:

| Cella | Livelli applicati (dal basso all'alto) | Risultato |
| --- | --- | --- |
| Item, riga 1 (dispari, prima) | base del preset (linea inferiore `#D0DCF0`), dispari del preset (riempimento `#E3EAF6`), `cell`, `key` | Arial, grassetto, testo `#1F4E79`, riempimento chiaro, linea inferiore chiara |
| Amount, riga 2 (pari) | base del preset, `cell`, `money`, `format` della colonna | Arial, allineato a destra, formato `#,##0` (il formato della colonna prevale su `money`), linea inferiore chiara, nessun riempimento |
| Item, riga 3 (dispari, ultima) | base del preset, dispari del preset, `cell`, `key`, `total` | Arial, grassetto, testo nero (`total` prevale su `key`: la riga vince sulla colonna), riempimento chiaro, bordo superiore doppio, linea inferiore chiara |
| Amount, riga 3 | base del preset, dispari del preset, `cell`, `total`, `money`, `format` della colonna | Arial, grassetto, nero, allineato a destra, `#,##0`, bordo superiore doppio, riempimento chiaro |

---

## 7. Preset

### 7.1 Cos'è un preset

Un preset è uno stile di tabella già pronto che la libreria genera a partire da un **colore di accento** `A`. Produce cinque livelli, applicati al livello più basso delle rispettive cascate:

| Livello | Applicato a |
| --- | --- |
| titolo | la riga del titolo |
| base dell'intestazione | ogni cella di intestazione |
| base del corpo | ogni cella di dati |
| dispari del corpo | celle di dati delle righe dispari |
| pari del corpo | celle di dati delle righe pari |

Le tonalità derivano da `A` mescolandolo con il bianco (`tint(A, f)`, dove `f` è la frazione di bianco, da 0 a 1) o con il nero (`shade(A, f)`, frazione di nero). Il testo posto su uno sfondo colorato è bianco o nero, a seconda di quale abbia il rapporto di contrasto più alto con lo sfondo secondo WCAG (`contrast(X)`). I due rapporti sono uguali a una luminanza relativa di circa 0.18, quindi gli sfondi a tonalità media ottengono testo nero.

### 7.2 I preset

| Costante | Significato |
| --- | --- |
| `INHERIT` | Usa il preset predefinito dell'applicazione. Valido solo su una classe sheet, non come preset predefinito dell'applicazione stessa. |
| `NONE` | Nessun preset: si applicano solo gli stili dichiarati. |
| `LIGHT` | Tabella chiara. |
| `MEDIUM` | Tabella media. |
| `DARK` | Tabella scura. |

**Livelli di ciascun preset**

| Livello | `LIGHT` | `MEDIUM` | `DARK` |
| --- | --- | --- | --- |
| Titolo | grassetto, 14 pt, testo `shade(A, 0.25)` | come `LIGHT` | come `LIGHT` |
| Base dell'intestazione | grassetto, testo `shade(A, 0.25)`, bordo inferiore `MEDIUM` colore `A` | grassetto, riempimento `A`, testo `contrast(A)` | grassetto, riempimento `shade(A, 0.5)`, testo `contrast(shade(A, 0.5))` |
| Base del corpo | bordo inferiore `THIN` colore `tint(A, 0.75)` | tutti i bordi `THIN` colore `tint(A, 0.6)` | niente |
| Dispari del corpo | riempimento `tint(A, 0.85)` | riempimento `tint(A, 0.8)` | riempimento `A`, testo `contrast(A)` |
| Pari del corpo | niente | niente | riempimento `shade(A, 0.25)`, testo `contrast(shade(A, 0.25))` |

**In parole:**

- **LIGHT.** Intestazione con testo in grassetto nel colore di accento scuro e una linea di accento media sotto di essa; una linea sottile di accento chiaro sotto ogni riga di dati; riempimento di accento molto chiaro sulle righe dispari e nessun riempimento sulle righe pari. Adatto a report stampati e tabelle dense.
- **MEDIUM.** Intestazione con riempimento di accento e testo in grassetto a contrasto; una griglia sottile di accento chiaro attorno a ogni cella di dati; riempimento di accento chiaro sulle righe dispari e nessun riempimento sulle righe pari. Il preset più "da foglio di calcolo", adatto alle esportazioni operative.
- **DARK.** Intestazione con riempimento di accento scuro e testo in grassetto a contrasto; nessuna linea; riempimento di accento con testo a contrasto sulle righe dispari, e riempimento di accento più scuro con testo a contrasto sulle righe pari. Forte impatto visivo, adatto a dashboard e brevi tabelle riepilogative.

In ogni preset il titolo è in grassetto, 14 pt, con testo di accento scuro, e al titolo si applica solo il livello del titolo.

### 7.3 Colori calcolati per accenti comuni

La tabella mostra i colori che ciascun preset scrive effettivamente per alcuni accenti. `#4472C4` è l'accento predefinito.

| Accento `A` | `shade(A,0.25)` (titolo, testo intestazione LIGHT, riempimento pari DARK) | `tint(A,0.75)` (linea riga LIGHT) | `tint(A,0.85)` (riempimento dispari LIGHT) | `tint(A,0.6)` (griglia MEDIUM) | `tint(A,0.8)` (riempimento dispari MEDIUM) | `shade(A,0.5)` (riempimento intestazione DARK) | Testo su `A` | Testo su pari DARK |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#4472C4` (blu predefinito) | `#335693` | `#D0DCF0` | `#E3EAF6` | `#B4C7E7` | `#DAE3F3` | `#223962` | bianco | bianco |
| `#1F4E79` (blu scuro) | `#173A5B` | `#C7D3DE` | `#DDE4EB` | `#A5B8C9` | `#D2DCE4` | `#10273C` | bianco | bianco |
| `#70AD47` (verde) | `#548235` | `#DBEAD1` | `#EAF3E3` | `#C6DEB5` | `#E2EFDA` | `#385624` | nero | nero |
| `#FFC000` (ambra) | `#BF9000` | `#FFEFBF` | `#FFF6D9` | `#FFE699` | `#FFF2CC` | `#806000` | nero | nero |
| `#C00000` (rosso) | `#900000` | `#EFBFBF` | `#F6D9D9` | `#E69999` | `#F2CCCC` | `#600000` | bianco | bianco |

Il testo dell'intestazione DARK è bianco per tutti e cinque gli accenti.

### 7.4 Scelta del preset e dell'accento

| Dove | Come | Ambito |
| --- | --- | --- |
| Classe sheet | `@ExcelSheet(preset = ..., accentColor = ...)` | quella classe sheet |
| Applicazione, builder | `SheetsmithDefaults(..., preset, accentColor)` | ogni classe sheet che dichiara `INHERIT` e nessun accento |
| Applicazione, Spring Boot | `sheetsmith.preset`, `sheetsmith.accent-color` | stesso |

Risoluzione: il preset effettivo è il preset della classe, oppure il preset dell'applicazione quando la classe dichiara `INHERIT`. L'accento effettivo è l'accento della classe, oppure l'accento dell'applicazione quando la classe non ne dichiara. Una classe può quindi ereditare il preset e impostare il proprio accento, o viceversa.

```java
// The whole application uses LIGHT with the corporate blue...
new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "", TablePreset.LIGHT, "#1F4E79");

// ...this report keeps LIGHT but uses green...
@ExcelSheet(accentColor = "#2E7D32")

// ...and this one uses no preset at all.
@ExcelSheet(preset = TablePreset.NONE)
```

### 7.5 Regolazione di un preset

Il preset è il livello più basso di ogni cascata, quindi qualsiasi stile dichiarato lo sovrascrive attributo per attributo. Regolazioni comuni:

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

### 7.6 Preset e cornice esterna

La cornice esterna si colloca sopra il preset. Con `MEDIUM`, ad esempio, `outerBorder = Border.MEDIUM` ispessisce i bordi esterni della griglia mentre le linee interne restano sottili. Con `LIGHT`, la cornice chiude la tabella sui lati, che il preset lascia aperti.

### 7.7 Esempi visivi

La resa visiva di ciascun preset con diversi accenti è destinata al sito della documentazione. La suite di test della libreria genera cartelle di lavoro di esempio per ogni preset con gli accenti `#4472C4`, `#FFC000` e `DARK_RED` (test `PresetSamplesTest`, output in `sheetsmith-core/target/preset-samples`), che possono essere usate come fonte per gli screenshot.

---

## 8. Stili condivisi e stile aziendale

### 8.1 Perché condividere gli stili

Quando un'applicazione produce più report, dichiarare gli stessi stili di intestazione, righe alternate e importi su ogni classe sheet porta a copie che nel tempo divergono. Un **foglio di stile** dichiara gli stili con nome una sola volta; ogni classe sheet che lo referenzia li usa per nome. Modificare il foglio di stile modifica ogni report.

Combinati con i valori predefiniti dell'applicazione (preset, colore di accento, formati predefiniti) e con le proprietà del documento, i fogli di stile permettono a ogni cartella di lavoro di un'applicazione, o di un'organizzazione tramite una libreria condivisa, di seguire lo stesso **stile aziendale**.

### 8.2 Dichiarare un foglio di stile

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

### 8.3 Utilizzarlo

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

### 8.4 Regole

| Regola | Conseguenza |
| --- | --- |
| Si possono referenziare solo classi con `@ExcelStyleSheet` (V-09). | Un'annotazione dimenticata viene segnalata e gli stili di quella classe non sono disponibili (i riferimenti ad essi segnalano V-06). |
| I nomi sono univoci all'interno di un foglio di stile (V-07). | L'errore nomina la classe del foglio di stile. |
| I fogli di stile referenziati insieme non devono condividere un nome (V-08). | Due fogli di stile usati dalla stessa classe non possono definire entrambi `header`. Usare prefissi (`corp-`, `fin-`) per evitare collisioni, oppure ridefinire lo stile sulla classe. |
| Uno stile sulla classe sheet sostituisce uno stile condiviso con lo stesso nome. | Personalizzazione locale di un singolo report, senza toccare il foglio di stile. La sostituzione è completa: gli attributi non vengono uniti. |
| I fogli di stile non sono ereditati e non referenziano altri fogli di stile. | Ogni classe sheet elenca i fogli di stile che usa. |

### 8.5 Suddividere i fogli di stile

Le grandi organizzazioni possono suddividere lo stile aziendale in più fogli di stile: uno di base con font e intestazioni, uno finanziario con formati per importi e percentuali, uno di reportistica con i totali. Una classe sheet elenca quelli che le servono: `styleSheets = {CorporateStyles.class, FinanceStyles.class}`. I prefissi mantengono univoci i nomi tra di essi.

### 8.6 Distribuire lo stile aziendale

Un foglio di stile è una classe ordinaria. Per condividerlo tra applicazioni, collocarlo, insieme a `SheetsmithDefaults` e `DocumentProperties` consigliati, in una piccola libreria interna da cui dipende ogni applicazione:

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

Nelle applicazioni Spring Boot, gli stessi valori vanno in un frammento condiviso di `application.yml` o in un profilo (vedere la [sezione 10.3](#103-proprietà-di-configurazione)).

### 8.7 Fogli di stile e preset insieme

I fogli di stile e i preset si combinano: il preset fornisce la struttura generale (linee, righe alternate) derivata dall'accento aziendale, e il foglio di stile aggiunge font, formati e i dettagli che il preset non copre. Poiché il preset è il livello più basso, gli stili condivisi vincono sempre su di esso.

```java
@ExcelSheet(preset = TablePreset.LIGHT, accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"))
```

---

## 9. Converter

Tutti i tipi dei converter si trovano in `cloud.baldilorenzo.sheetsmith.convert`.

### 9.1 Ruolo dei converter

Ogni valore di campo non null viene trasformato in un `CellValue` da un converter prima di essere scritto. I converter producono **valori**, mai formattazione: il formato di visualizzazione di una cella proviene sempre dagli stili e dai valori predefiniti dell'applicazione.

### 9.2 Converter integrati

| Tipo registrato | Copre | Cella scritta |
| --- | --- | --- |
| `CharSequence` | `String`, `StringBuilder`, `StringBuffer`, qualsiasi `CharSequence` | testo, tramite `toString()` |
| `Character` | `char`, `Character` | testo |
| `Number` | `byte`, `short`, `int`, `long`, `float`, `double`, i rispettivi wrapper, `BigDecimal`, `BigInteger`, `AtomicInteger`, `AtomicLong`, qualsiasi `Number` | numero, tramite `doubleValue()` |
| `Boolean` | `boolean`, `Boolean` | booleano di Excel (`TRUE` / `FALSE`) |
| `Enum` | ogni enum | testo: il nome della costante (`name()`, non `toString()`) |
| `LocalDate` | `LocalDate` | data di Excel |
| `LocalDateTime` | `LocalDateTime` | data di Excel con ora |

I converter integrati vengono trovati tramite la gerarchia dei tipi, quindi sono coperte le sottoclassi e le implementazioni dei tipi registrati.

**Tipi che richiedono un converter** (altrimenti V-10), tra i più comuni: `java.util.Date`, `java.sql.Date`, `java.sql.Timestamp`, `Calendar`, `Instant`, `OffsetDateTime`, `ZonedDateTime`, `LocalTime`, `OffsetTime`, `YearMonth`, `Year`, `Duration`, `Period`, `UUID`, `URI`, `URL`, `Path`, `File`, `Currency`, `Locale`, `Optional`, `OptionalInt` e gli altri optional, collezioni, mappe, array, `Object`, e qualsiasi tipo dell'applicazione (value object, oggetti annidati). I tipi con fuso orario sono esclusi di proposito: Excel non ha fusi orari, e una conversione implicita nasconderebbe una scelta che spetta all'applicazione.

### 9.3 Il contratto

```java
@FunctionalInterface
public interface CellConverter<T> {
    CellValue convert(T value, ConversionContext context);
}
```

- Il **valore non è mai null**: un valore null produce una cella vuota che mantiene il suo stile, senza chiamare il converter.
- Il **risultato non deve mai essere null**. Restituire `CellValue.blank()` per una cella vuota; un risultato null causa una `SheetsmithGenerationException`.
- Qualsiasi **`RuntimeException`** lanciata dal converter viene incapsulata in una `SheetsmithGenerationException` che indica il foglio, la riga e il campo, con l'eccezione originale come causa.
- Un generatore usa **un'unica istanza** di ciascun converter per tutte le sue chiamate, possibilmente da più thread contemporaneamente: le implementazioni devono essere **thread-safe**, idealmente senza stato.

### 9.4 `CellValue`

Un'interfaccia sealed con sei forme, create con metodi factory:

| Factory | Forma | Scritto come |
| --- | --- | --- |
| `CellValue.text(String)` | `CellValue.Text` | Una cella di testo, mai interpretato: gli zeri iniziali vengono mantenuti e un testo che sembra un numero o una formula resta testo. Oltre 32.767 caratteri la generazione fallisce. Null lancia `NullPointerException`. |
| `CellValue.number(double)` | `CellValue.Numeric` | Una cella numerica. Excel memorizza i numeri come valori in virgola mobile a 64 bit con 15 cifre significative. `NaN` diventa l'errore `#NUM!`, l'infinito l'errore `#DIV/0!`. |
| `CellValue.bool(boolean)` | `CellValue.Bool` | Un booleano di Excel, mostrato come `TRUE` o `FALSE`. |
| `CellValue.date(LocalDate)` | `CellValue.Date` | Una data di Excel; riceve il formato data predefinito quando non è impostato alcun formato. Null lancia un'eccezione. |
| `CellValue.dateTime(LocalDateTime)` | `CellValue.DateTime` | Una data di Excel con ora; riceve il formato data e ora predefinito quando non è impostato alcun formato. Null lancia un'eccezione. |
| `CellValue.blank()` | `CellValue.Blank` | Una cella vuota che mantiene lo stile risolto. Singleton. |

Poiché `CellValue` è sealed, i converter non possono scrivere nient'altro, non possono raggiungere la cella POI sottostante e non possono aggirare il sistema degli stili.

### 9.5 `ConversionContext`

Passato a ogni chiamata, indica dove viene scritto il valore. I converter possono usarlo per adattare il valore o per costruire messaggi di errore.

| Metodo | Restituisce |
| --- | --- |
| `String sheetName()` | il nome del foglio, come indicato in `SheetData` |
| `int rowIndex()` | la riga di dati, a partire da 1, nell'ordine della lista |
| `String fieldName()` | il nome del campo, come dichiarato nella classe sheet |
| `Class<?> sourceType()` | la classe sheet |
| `Class<?> valueType()` | il tipo dichiarato del campo; per un campo primitivo, il tipo primitivo, anche se il valore viene passato in forma boxed |

È un'interfaccia in modo che si possano aggiungere metodi nelle versioni future senza rompere i converter esistenti.

### 9.6 Converter di campo e converter di applicazione

Ci sono due modi per fornire un converter.

| | Converter di campo | Converter di applicazione |
| --- | --- | --- |
| Dichiarato con | `@ExcelColumn(converter = X.class)` | `Sheetsmith.Builder.converter(Type.class, instance)`, oppure un bean Spring |
| Si applica a | solo quella colonna | ogni colonna di quel tipo o dei suoi sottotipi, in ogni classe sheet |
| Fornito come | una classe, creata dalla converter factory | un'istanza |
| Può essere parametrizzato | solo tramite iniezione nel costruttore (Spring o una factory personalizzata) | liberamente, è un'istanza che si costruisce |
| Validazione | V-11 (tipo compatibile), V-12 (creabile) | duplicati rifiutati dal builder (`IllegalArgumentException`) o all'avvio di Spring |

**Come vengono creati i converter di campo.**

- Un'istanza per classe converter e per generatore, creata la prima volta che una classe sheet che la dichiara viene validata o generata, poi riutilizzata da ogni colonna che la dichiara. Una creazione fallita non viene memorizzata: viene tentata di nuovo, e segnalata di nuovo come V-12, alla chiamata successiva.
- **Senza Spring** (factory predefinita): la classe converter deve essere pubblica, con un costruttore pubblico senza argomenti. Una classe converter annidata deve essere `public static`.
- **Con una factory personalizzata** (`Builder.converterFactory`): decide la factory. Una factory che lancia un'eccezione o restituisce null fa violare V-12 alla classe che dichiara il converter.
- **Con l'auto-configurazione di Spring Boot**: se esiste esattamente un bean della classe converter, viene usato quel bean; altrimenti (nessun bean, o più di uno) viene creata una nuova istanza con dependency injection (`AutowireCapableBeanFactory.createBean`): il suo costruttore può ricevere bean e proprietà `@Value`, senza che il converter diventi un bean.

**Verifica di compatibilità (V-11).** Il tipo gestito da un converter di campo viene letto dalla sua dichiarazione generica (`implements CellConverter<Money>`, anche attraverso superclassi e interfacce intermedie). Il tipo del campo, in forma boxed se primitivo, deve essere assegnabile ad esso: un `CellConverter<Number>` è valido su un campo `Integer` o `int`, un `CellConverter<String>` su un campo `Integer` no. Quando il tipo gestito non può essere determinato (ad esempio una classe converter generica `MyConverter<T> implements CellConverter<T>`), la verifica viene saltata, e un'incongruenza emerge a runtime come `ClassCastException` incapsulata in una `SheetsmithGenerationException`.

### 9.7 Ordine di risoluzione

Il converter di una colonna viene scelto una sola volta, a partire dal tipo dichiarato del campo, cercando i tipi primitivi come i rispettivi wrapper:

1. il converter di campo, quando dichiarato;
2. il converter di applicazione registrato per il tipo esatto;
3. il converter di applicazione registrato per la superclasse più vicina;
4. il converter di applicazione registrato per un'interfaccia implementata, la più vicina per prima, per distanza in ampiezza attraverso la gerarchia dei tipi;
5. i converter integrati, cercati con le stesse regole da 2 a 4.

Conseguenze:

- I converter integrati possono essere sostituiti registrando un converter di applicazione per lo stesso tipo (ad esempio `Boolean` scritto come "Sì"/"No").
- Un converter di applicazione per un **supertipo vince su un converter integrato per il tipo esatto**. Un converter registrato per `Object` si applica quindi a ogni colonna priva di converter di campo, `String` e numeri compresi. Registrare i converter per il tipo più ristretto sensato.
- Quando **due interfacce alla stessa distanza** hanno entrambe un converter di applicazione, la risoluzione è ambigua e viola V-10. Dichiarare un converter di campo, oppure registrare un converter per il tipo esatto.
- Conta il tipo **dichiarato**, non il tipo a runtime del valore: un campo dichiarato come `Object` richiede un converter anche se contiene sempre stringhe.

### 9.8 Bean Spring come converter: implicazioni

In un'applicazione Spring Boot, **ogni bean che implementa `CellConverter` viene registrato come converter di applicazione** per il tipo che gestisce. È comodo per i tipi usati ovunque, e ha conseguenze che vanno comprese:

| Situazione | Cosa succede |
| --- | --- |
| Una classe converter annotata con `@Component` (o dichiarata con `@Bean`) | Diventa il converter di applicazione per il suo tipo: si applica a **ogni colonna di quel tipo in ogni classe sheet**, a meno che una colonna dichiari un converter di campo. |
| Due bean converter che gestiscono lo stesso tipo | L'avvio fallisce: `IllegalStateException: converter beans 'a' and 'b' both handle type X; keep only one of them`. |
| Un bean converter il cui tipo gestito non può essere determinato (tipo raw, o un bean lambda dichiarato con un tipo di ritorno raw) | L'avvio fallisce: `IllegalStateException: cannot resolve the type handled by converter bean 'x'; declare it as a class implementing CellConverter<T>, or as a @Bean method returning CellConverter<T>, instead of a lambda or a raw type`. |
| Un converter destinato a **una sola colonna** | **Non** dichiararlo come bean. Dichiararlo sul campo con `@ExcelColumn(converter = X.class)`. Se ha bisogno di dipendenze, dargli un costruttore con quelle dipendenze: la factory di Spring lo crea con iniezione senza registrarlo globalmente. |
| Una classe converter di campo che è anche un bean (esattamente uno) | Il bean viene usato per la colonna, ed è anche il converter di applicazione per il suo tipo. |
| Una classe converter di campo con più bean | Viene creata una nuova istanza con iniezione per il campo. |
| Converter di campo e converter di applicazione sulla stessa colonna | Vince sempre il converter di campo. |

Dichiarazione di bean converter:

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

Un converter di campo con dipendenze, non un bean:

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

Qui `CountryNameConverter` gestisce `String`: come bean trasformerebbe **ogni** colonna di tipo stringa dell'applicazione in un nome di paese. Come converter di campo si applica a una sola colonna.

### 9.9 Esempi

**UUID come testo**

```java
public class UuidAsText implements CellConverter<UUID> {
    @Override
    public CellValue convert(UUID value, ConversionContext context) {
        return CellValue.text(value.toString());
    }
}
```

**Instant in un dato fuso orario** (converter di applicazione, parametrizzato)

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

**OffsetDateTime e ZonedDateTime, mantenendo l'ora locale del valore**

```java
Sheetsmith.builder()
        .converter(OffsetDateTime.class, (value, context) -> CellValue.dateTime(value.toLocalDateTime()))
        .converter(ZonedDateTime.class, (value, context) -> CellValue.dateTime(value.toLocalDateTime()))
        .build();
```

**`java.util.Date` legacy** (copre anche `java.sql.Date` e `java.sql.Timestamp`, che lo estendono)

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

`java.sql.Date.toInstant()` lancia `UnsupportedOperationException`. Se sono possibili valori `java.sql.Date`, registrare un converter dedicato per `java.sql.Date` (superclasse più vicina, quindi vince) che usi `toLocalDate()`.

**Etichette degli enum invece dei nomi delle costanti**

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

Funziona perché i converter di applicazione, interfacce comprese, vengono cercati prima dei converter integrati.

**Boolean come Sì / No** (sostituisce il comportamento integrato per ogni colonna booleana)

```java
Sheetsmith.builder().converter(Boolean.class, (value, context) -> CellValue.text(value ? "Yes" : "No")).build();
```

**Value object monetario come numero** (formato dallo stile)

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

**Identificatore con più di 15 cifre come testo**

```java
public final class LongAsText implements CellConverter<Long> {
    @Override
    public CellValue convert(Long value, ConversionContext context) {
        return CellValue.text(Long.toString(value));
    }
}

@ExcelColumn(header = "Card reference", order = 10, converter = LongAsText.class) long reference;
```

**Numeri non finiti come celle vuote**

```java
public final class FiniteOrBlank implements CellConverter<Double> {
    @Override
    public CellValue convert(Double value, ConversionContext context) {
        return Double.isFinite(value) ? CellValue.number(value) : CellValue.blank();
    }
}
```

**Optional, collezioni, durate**

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

**Uso del contesto in un errore**

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

L'eccezione emerge come `SheetsmithGenerationException` con foglio, riga e campo, e con l'`IllegalArgumentException` come causa.

### 9.10 `CellConverterFactory`

```java
public interface CellConverterFactory {
    <C extends CellConverter<?>> C create(Class<C> converterClass);
}
```

Crea i converter di campo. Implementarla per ottenere i converter da un container di dependency injection diverso da Spring (CDI, Guice, Dagger, un service locator):

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

La factory viene chiamata una volta per classe converter e per generatore. Una `RuntimeException` o un risultato null vengono segnalati come V-12. Le applicazioni Spring Boot non hanno bisogno di una factory personalizzata: l'auto-configurazione installa `SpringConverterFactory`.

### 9.11 `CellConverter.None`

Il marcatore usato come valore predefinito di `@ExcelColumn.converter`, che significa "nessun converter di campo". Non viene mai istanziato né invocato; lasciare l'attributo non impostato invece di scriverlo.

---

## 10. Integrazione con Spring Boot e proprietà di configurazione

### 10.1 Cosa fa l'auto-configurazione

Con `sheetsmith-spring-boot-starter` nel classpath, l'auto-configurazione `SheetsmithAutoConfiguration` (registrata in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, attiva quando `Sheetsmith` è nel classpath) registra:

1. un **bean `Sheetsmith`**, a meno che l'applicazione definisca un proprio bean di quel tipo. Il bean auto-configurato viene costruito con:
   - i valori predefiniti associati dalle proprietà `sheetsmith.*`;
   - le proprietà del documento associate da `sheetsmith.document.*`;
   - una `SpringConverterFactory` per i converter di campo;
   - ogni bean `CellConverter` del contesto come converter di applicazione, registrato per il suo tipo generico;
2. un **`SheetsmithStartupValidator`**, solo quando `sheetsmith.validation.packages` non è vuoto.

Non è richiesta alcuna annotazione nell'applicazione: iniettare `Sheetsmith` dove serve.

### 10.2 Definire un proprio bean `Sheetsmith`

Il bean auto-configurato è dichiarato con `@ConditionalOnMissingBean`. Quando l'applicazione definisce un bean `Sheetsmith`, quello auto-configurato si ritira e il bean dell'applicazione viene usato così com'è. In tal caso l'applicazione è responsabile della sua configurazione: i valori predefiniti `sheetsmith.*`, le proprietà del documento e i bean converter **non** vengono applicati automaticamente a un bean costruito dall'applicazione. Il validatore all'avvio, quando abilitato, usa il bean `Sheetsmith` presente nel contesto.

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

`SheetsmithProperties.toDefaults()` e `toDocumentProperties()` convertono le proprietà associate; `SpringConverterFactory` è pubblica e può essere riutilizzata.

### 10.3 Proprietà di configurazione

Tutte le proprietà usano il prefisso `sheetsmith`. Sono associate al record immutabile `SheetsmithProperties` e sono dotate di metadati per l'auto-completamento dell'IDE.

| Proprietà | Tipo | Valore predefinito | Significato | Vincolo |
| --- | --- | --- | --- | --- |
| `sheetsmith.formats.date` | String | `yyyy-mm-dd` | Formato Excel predefinito delle celle data, come i valori `LocalDate`. | non vuoto |
| `sheetsmith.formats.date-time` | String | `yyyy-mm-dd hh:mm:ss` | Formato Excel predefinito delle celle data e ora, come i valori `LocalDateTime`. | non vuoto |
| `sheetsmith.formats.number` | String | vuoto ("Generale" di Excel) | Formato Excel predefinito delle celle numeriche, interi compresi. | può essere vuoto |
| `sheetsmith.preset` | `TablePreset` | `NONE` | Preset delle classi sheet che dichiarano `preset = INHERIT`: `NONE`, `LIGHT`, `MEDIUM`, `DARK`. | non `INHERIT` |
| `sheetsmith.accent-color` | String | `#4472C4` | Colore di accento delle classi sheet che non ne dichiarano: `#RRGGBB` o un nome di `IndexedColors`. | colore valido |
| `sheetsmith.document.author` | String | `sheetsmith` | Autore registrato in ogni file. Se vuoto viene omesso. | nessuno |
| `sheetsmith.document.application` | String | `sheetsmith` | Applicazione registrata in ogni file. Se vuota viene omessa. | nessuno |
| `sheetsmith.validation.packages` | lista di String | vuoto | Package analizzati all'avvio, sottopackage compresi. Se vuoto disabilita la validazione all'avvio. | nessuno |

Note:

- **Sintassi di Excel.** I formati usano la sintassi dei formati di Excel ([sezione 6.6](#66-formati-dei-dati)), non quella di `DateTimeFormatter`: `mm` è il mese, oppure i minuti dopo un codice dell'ora.
- **YAML e `#`.** In YAML, racchiudere tra apici ogni valore che inizia con `#`, altrimenti viene letto come commento: `accent-color: "#1F4E79"`, `number: "#,##0.00"`.
- **I valori non validi bloccano l'applicazione all'avvio:** `sheetsmith.preset=INHERIT`, un formato data o data e ora vuoto, un colore di accento non valido (`IllegalArgumentException` da `SheetsmithDefaults`), o un valore che non è il nome di un preset (errore di binding di Spring).
- **Relaxed binding.** Si applica il relaxed binding standard di Spring Boot: i valori enum possono essere scritti in minuscolo (`light`), e le variabili d'ambiente usano la forma consueta (`SHEETSMITH_PRESET`, `SHEETSMITH_ACCENT_COLOR`, `SHEETSMITH_FORMATS_DATE_TIME`, `SHEETSMITH_DOCUMENT_AUTHOR`, `SHEETSMITH_VALIDATION_PACKAGES=com.example.export,com.example.reports`).

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

Nei file `.properties` il carattere `#` inizia un commento solo a inizio riga, quindi i valori che contengono `#` non richiedono apici.

### 10.4 Validazione all'avvio

Quando `sheetsmith.validation.packages` elenca almeno un package, lo `SheetsmithStartupValidator` viene eseguito una volta creati tutti i singleton:

- analizza i package e i loro sottopackage alla ricerca di tipi **annotati direttamente** con `@ExcelSheet`: classi concrete e abstract, record, interfacce e classi annidate, static o no;
- i tipi annotazione non vengono validati, anche se annotati con `@ExcelSheet`, e nemmeno i tipi che ne sono solo meta-annotati tramite un'altra annotazione;
- chiama `validate` su ciascun tipo con il bean `Sheetsmith` del contesto, così i bean converter e la converter factory di Spring vengono presi in considerazione;
- gli errori di tutti i tipi non validi vengono raccolti in un'unica `SheetsmithConfigurationException`, che blocca l'applicazione.

Gli errori nelle classi sheet emergono quindi all'avvio invece che alla prima generazione. Un'interfaccia annotata con `@ExcelSheet` viene sempre segnalata (non può avere campi di istanza, quindi viola V-02), come previsto: l'annotazione non va messa su un'interfaccia.

### 10.5 Tipi pubblici del modulo di auto-configurazione

| Tipo | Ruolo |
| --- | --- |
| `SheetsmithAutoConfiguration` | L'auto-configurazione. Istanziata da Spring Boot, non dalle applicazioni. |
| `SheetsmithProperties` (con i record annidati `Formats`, `Document`, `Validation`) | Le proprietà associate; `toDefaults()` e `toDocumentProperties()` le convertono. |
| `SpringConverterFactory` | Crea i converter di campo a partire dal contesto dell'applicazione. |
| `SheetsmithStartupValidator` | Il validatore all'avvio (un `SmartInitializingSingleton`). |

---

## 11. Validazione ed errori

### 11.1 Lettura di un errore di configurazione

Una `SheetsmithConfigurationException` elenca ogni errore trovato, uno per riga, in questo formato:

```
[code] package.Class$Nested.element: message
```

| Parte | Significato |
| --- | --- |
| `[code]` | La regola violata, da `V-01` a `V-20`. Consultarla nella [sezione 11.3](#113-catalogo-degli-errori-di-configurazione). |
| `package.Class` | Il nome completo della classe coinvolta: indica quale file sorgente aprire. È la classe sheet, o il foglio di stile che dichiara lo stile difettoso. |
| `$Nested` | Presente quando la classe è annidata in un'altra classe: `com.example.Reports$InvoiceRow` è la classe `InvoiceRow` dichiarata dentro `Reports.java`. |
| `element` | Cosa non va all'interno della classe: un **nome di campo** (`amount`), **`@ExcelSheet`** (l'annotazione a livello di classe), **`@ExcelStyle(name)`** (uno stile con nome), **`@ExcelStyle(#n)`** (l'n-esimo stile dichiarato sulla classe, quando il suo nome è vuoto), o **`sheets[i]`** (l'i-esimo elemento, a partire da 0, della lista passata a `generate`, per gli errori sull'input). Viene omesso quando l'errore riguarda la classe o l'input nel suo complesso. |
| `message` | Il problema, spesso con l'attributo o lo slot coinvolto, ad esempio `(referenced by body.lastRow)`. |

La classe e il punto di separazione vengono omessi per gli errori sull'input, e i due punti vengono omessi quando non ci sono né classe né elemento. I numeri di riga del sorgente non sono disponibili: le annotazioni non li portano a runtime.

Esempio di messaggio completo, come appare in un log:

```
cloud.baldilorenzo.sheetsmith.SheetsmithConfigurationException: [V-06] com.example.export.InvoiceLine.amount: style 'money' not found (referenced by styles.base)
[V-15] com.example.export.InvoiceLine.@ExcelSheet: titleStyle is set but title is empty
[V-13] com.example.export.CorporateStyles.@ExcelStyle(header): fillColor '#1F4E7' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant
[V-19] sheets[1]: sheet name 'Q3/2026' must not contain any of \ / ? * [ ] :
```

Lettura: la prima riga riguarda il campo `amount` di `InvoiceLine`, il cui slot di colonna `styles.base` referenzia uno stile `money` che non esiste; la terza riguarda lo stile `header` dichiarato sul foglio di stile `CorporateStyles`; l'ultima riguarda il secondo foglio passato a `generate`.

Accesso programmatico: `exception.errors()` restituisce i record `ConfigurationError`, con `code()`, `type()`, `element()` e `message()`.

### 11.2 Quando avviene la validazione

| Regole | Fase | Verificate da |
| --- | --- | --- |
| da V-01 a V-09, da V-13 a V-17 | Estrazione dei metadati di una classe sheet | `generate`, `validate`, validazione all'avvio |
| da V-10 a V-12 | Associazione di un converter a ciascuna colonna | `generate`, `validate`, validazione all'avvio |
| da V-18 a V-20 | Input di `generate` | solo `generate` |

La validazione è fail-fast ma completa: ogni regola viene verificata e tutti gli errori dell'input e di tutte le classi sheet coinvolte vengono segnalati insieme in un'unica eccezione. Non viene scritto nulla se c'è almeno un errore. Le anomalie non vengono mai corrette silenziosamente.

### 11.3 Catalogo degli errori di configurazione

Ogni voce riporta la regola, l'elemento segnalato, un esempio minimo che la innesca, il messaggio e la correzione.

#### V-01: la classe è annotata con `@ExcelSheet`

- **Elemento:** nessuno.
- **Esempio:** `SheetData.of("Rows", PlainRecord.class, rows)` dove `PlainRecord` non ha `@ExcelSheet`; oppure `@ExcelSheet` posta solo su una superclasse.
- **Messaggio:** `[V-01] com.example.PlainRecord: the class is not annotated with @ExcelSheet`
- **Correzione:** annotare la classe passata a `SheetData`. L'annotazione non è ereditata.

#### V-02: la classe ha almeno un campo `@ExcelColumn`

- **Elemento:** nessuno.
- **Esempio:** `@ExcelSheet public record Empty(String name) { }`
- **Messaggio:** `[V-02] com.example.Empty: no field is annotated with @ExcelColumn`
- **Correzione:** annotare almeno un campo. Ricordare che l'esportazione è opt-in.

#### V-03: i valori di `order` sono univoci

- **Elemento:** il campo trovato per secondo.
- **Esempio:** due colonne con `order = 10`, `code` e `name`.
- **Messaggio:** `[V-03] com.example.Row.name: order 10 is also used by field code`
- **Correzione:** dare a ogni colonna un ordine diverso. Le colonne ereditate contano.

#### V-04: `header` non è vuoto

- **Elemento:** il campo.
- **Esempio:** `@ExcelColumn(header = " ", order = 10) String code;`
- **Messaggio:** `[V-04] com.example.Row.code: header is blank`
- **Correzione:** impostare un testo di intestazione.

#### V-05: `@ExcelColumn` non è su un campo static

- **Elemento:** il campo.
- **Esempio:** `@ExcelColumn(header = "Total", order = 99) static int TOTAL;`
- **Messaggio:** `[V-05] com.example.Row.TOTAL: @ExcelColumn is not allowed on a static field`
- **Correzione:** spostare l'annotazione su un campo di istanza.

#### V-06: ogni stile referenziato esiste

- **Elemento:** il campo per `headerStyle` e gli slot di colonna; `@ExcelSheet` per `titleStyle` e gli slot di intestazione e corpo.
- **Esempio:** `body = @BodyStyles(lastRow = "totals")` quando lo stile si chiama `total`.
- **Messaggio:** `[V-06] com.example.Row.@ExcelSheet: style 'totals' not found (referenced by body.lastRow)`
- **Nomi degli slot nel messaggio:** `titleStyle`, `header.base`, `header.firstColumn`, `header.lastColumn`, `body.base`, `body.odd`, `body.even`, `body.firstRow`, `body.lastRow`, `body.firstColumn`, `body.lastColumn`, `headerStyle`, `styles.base`, `styles.odd`, `styles.even`, `styles.firstRow`, `styles.lastRow`.
- **Correzione:** dichiarare lo stile, referenziare il foglio di stile che lo dichiara, oppure correggere il nome. I nomi distinguono maiuscole e minuscole e vengono confrontati esattamente.

#### V-07: i nomi degli stili sono univoci all'interno di una classe dichiarante

- **Elemento:** `@ExcelStyle(name)`; la classe è la classe sheet o il foglio di stile che dichiara il duplicato.
- **Esempio:** `@ExcelStyle(name = "header", bold = Toggle.TRUE)` due volte sulla stessa classe.
- **Messaggio:** `[V-07] com.example.CorporateStyles.@ExcelStyle(header): style 'header' is declared more than once`
- **Correzione:** rinominare o unire i duplicati. Uno stile sulla classe sheet con lo stesso nome di uno stile di un foglio di stile non è un duplicato: è una sovrascrittura intenzionale.

#### V-08: i fogli di stile di una classe non definiscono lo stesso nome

- **Elemento:** `@ExcelSheet` della classe sheet.
- **Esempio:** `styleSheets = {CorporateStyles.class, FinanceStyles.class}`, entrambi dichiarano `money`.
- **Messaggio:** `[V-08] com.example.Row.@ExcelSheet: styleSheets: style 'money' is defined by both com.example.CorporateStyles and com.example.FinanceStyles`
- **Correzione:** rinominare lo stile in uno dei fogli di stile, oppure ridefinirlo sulla classe sheet.

#### V-09: ogni classe in `styleSheets` ha `@ExcelStyleSheet`

- **Elemento:** `@ExcelSheet` della classe sheet.
- **Esempio:** `styleSheets = CorporateStyles.class` senza `@ExcelStyleSheet` su `CorporateStyles`.
- **Messaggio:** `[V-09] com.example.Row.@ExcelSheet: styleSheets: com.example.CorporateStyles is not annotated with @ExcelStyleSheet`
- **Correzione:** annotare il foglio di stile. Aspettarsi errori V-06 per i suoi stili nello stesso report, poiché non vengono caricati.

#### V-10: esiste un converter per il tipo della colonna e la risoluzione non è ambigua

- **Elemento:** il campo.
- **Esempio (mancante):** `@ExcelColumn(header = "Id", order = 10) UUID id;` senza un converter.
- **Messaggio:** `[V-10] com.example.Row.id: no converter for type java.util.UUID: declare one with @ExcelColumn(converter = ...) or register one for the type`
- **Esempio (ambiguo):** un tipo di campo che implementa due interfacce che hanno entrambe un converter di applicazione, alla stessa distanza.
- **Messaggio:** `[V-10] com.example.Row.code: converter for type com.example.Code is ambiguous: candidates [com.example.Labelled, com.example.Coded]: declare one with @ExcelColumn(converter = ...) or register one for the exact type`
- **Correzione:** dichiarare un converter di campo, oppure registrare un converter di applicazione per il tipo (per il tipo esatto nel caso ambiguo). Validare con un generatore configurato come quello di produzione.

#### V-11: il converter di campo gestisce un tipo compatibile

- **Elemento:** il campo.
- **Esempio:** `@ExcelColumn(header = "Qty", order = 20, converter = UuidAsText.class) int quantity;`
- **Messaggio:** `[V-11] com.example.Row.quantity: converter com.example.UuidAsText handles java.util.UUID, which is not assignable from the field type int`
- **Correzione:** usare un converter il cui tipo gestito sia il tipo del campo o uno dei suoi supertipi (i primitivi contano come i rispettivi wrapper).

#### V-12: il converter di campo può essere creato

- **Elemento:** il campo.
- **Esempi e messaggi:**
  - nessun costruttore pubblico senza argomenti: `[V-12] com.example.Row.amount: converter com.example.MoneyConverter cannot be created: com.example.MoneyConverter has no public no-argument constructor`
  - costruttore che lancia un'eccezione: `... cannot be created: constructor of com.example.MoneyConverter failed: java.lang.IllegalStateException: ...`
  - classe non pubblica, abstract o comunque non istanziabile: `... cannot be created: cannot instantiate com.example.MoneyConverter: ...`
  - factory personalizzata che restituisce null: `... cannot be created: the converter factory returned null`
  - factory di Spring che non riesce a crearlo (dipendenza mancante, ad esempio): il messaggio dell'eccezione di Spring.
- **Correzione:** rendere il converter una classe pubblica (public static se annidata) con un costruttore pubblico senza argomenti, oppure configurare una factory in grado di crearlo, come quella di Spring Boot.

#### V-13: i colori hanno una sintassi valida

- **Elemento:** `@ExcelStyle(name)` per i colori degli stili; `@ExcelSheet` per `accentColor` e `outerBorderColor`.
- **Esempio:** `fillColor = "#1F4E7"`, `fontColor = "dark_blue"`, `accentColor = "blue"`.
- **Messaggio:** `[V-13] com.example.Row.@ExcelStyle(header): fillColor '#1F4E7' is not a valid colour: expected #RRGGBB or the name of an IndexedColors constant`
- **Correzione:** usare `#RRGGBB` con sei cifre esadecimali, oppure un nome di `IndexedColors` in maiuscolo.

#### V-14: gli attributi numerici sono nell'intervallo

- **Elemento:** `@ExcelStyle(name)` per gli attributi di stile; il campo per `width`.
- **Intervalli e messaggi:**
  - `rotation` da -90 a 90 oppure 255: `rotation 120 is out of range -90 to 90, or 255`
  - `indent` da 0 a 250: `indent 300 is out of range 0 to 250`
  - `fontSize` da 1 a 409: `fontSize 0 is out of range 1 to 409`
  - `width` da 1 a 255: `[V-14] com.example.Row.description: width 300 is out of range 1 to 255`
- **Correzione:** usare un valore nell'intervallo. `ExcelStyle.UNSET` è sempre accettato.

#### V-15: `titleStyle` solo con `title`

- **Elemento:** `@ExcelSheet`.
- **Esempio:** `@ExcelSheet(titleStyle = "title")` senza `title`.
- **Messaggio:** `[V-15] com.example.Row.@ExcelSheet: titleStyle is set but title is empty`
- **Correzione:** impostare un titolo, oppure rimuovere lo stile del titolo.

#### V-16: i nomi degli stili non sono vuoti

- **Elemento:** `@ExcelStyle(#n)`, dove n è la posizione, a partire da 1, della dichiarazione sulla sua classe.
- **Esempio:** `@ExcelStyle(name = "", bold = Toggle.TRUE)` come secondo stile della classe.
- **Messaggio:** `[V-16] com.example.Row.@ExcelStyle(#2): style name is blank`
- **Correzione:** dare un nome allo stile.

#### V-17: il valore di ogni colonna è accessibile

- **Elemento:** il campo.
- **Esempio:** una classe sheet in un modulo con nome il cui package non è aperto, letta tramite un campo privato.
- **Messaggio:** `[V-17] com.example.export.Row.amount: value is not accessible (<reason>); add a public getter or open package com.example.export to sheetsmith, for example with 'opens com.example.export;' in module-info.java`
- **Correzione:** aggiungere un getter pubblico con un tipo di ritorno compatibile, oppure aprire il package ([sezione 4.2.1](#421-accesso-al-valore)).

#### V-18: la lista dei fogli non è vuota

- **Elemento:** nessuno; nessuna classe.
- **Esempio:** `sheetsmith.generate(List.of())`.
- **Messaggio:** `[V-18] the sheet list is empty`
- **Correzione:** passare almeno un foglio. Una lista di dati vuota per un foglio è valida; una lista di fogli vuota no.

#### V-19: i nomi dei fogli sono validi

- **Elemento:** `sheets[i]`; nessuna classe.
- **Messaggi:**
  - lunghezza: `[V-19] sheets[0]: sheet name '' must be 1 to 31 characters long (it has 0)`
  - caratteri: `[V-19] sheets[2]: sheet name 'Q3/2026' must not contain any of \ / ? * [ ] :`
  - apostrofo: `[V-19] sheets[1]: sheet name ''Draft'' must not start or end with '`
- **Correzione:** scegliere un nome valido. sheetsmith non abbrevia né ripulisce mai i nomi.

#### V-20: i nomi dei fogli sono univoci, ignorando maiuscole e minuscole

- **Elemento:** `sheets[i]` del duplicato successivo; nessuna classe.
- **Esempio:** fogli chiamati `Summary` e `SUMMARY`.
- **Messaggio:** `[V-20] sheets[3]: sheet name 'SUMMARY' is already used by sheets[0] 'Summary', ignoring case`
- **Correzione:** rinominare uno dei fogli.

### 11.4 Errori di generazione

Una `SheetsmithGenerationException` viene lanciata mentre si scrive un foglio. Il suo messaggio termina con la posizione: `(sheet 'S', row N, field 'f')`, dove la riga e il campo compaiono solo quando pertinenti.

| Causa | Messaggio | Riga | Campo | Causa allegata |
| --- | --- | --- | --- | --- |
| Elemento null nella lista dei dati | `null element in the data list (sheet 'Orders', row 7)` | sì | no | no |
| Getter, accessor o lettura di campo che lancia un'eccezione | `cannot read the value (method getTotal()): java.lang.IllegalStateException: ... (sheet 'Orders', row 7, field 'total')` | sì | sì | sì |
| Converter che lancia un'eccezione | `converter failed: java.lang.IllegalArgumentException: ... (sheet 'Orders', row 7, field 'total')` | sì | sì | sì |
| Converter che restituisce null | `converter returned null; return CellValue.blank() for an empty cell (sheet 'Orders', row 7, field 'total')` | sì | sì | no |
| Testo più lungo di 32.767 caratteri | `text of 40000 characters exceeds the Excel limit of 32767 (sheet 'Orders', row 7, field 'notes')` | sì | sì | no |
| Troppe righe per un foglio | `the sheet needs 1048580 rows, more than the Excel limit of 1048576 (sheet 'Orders')` | no (0) | no | no |

La descrizione dell'accessor nel messaggio è `method getX()` quando è stato usato un getter, oppure `field x` quando il campo è stato letto direttamente. L'indice di riga è la posizione, a partire da 1, nella lista dei dati, quindi `row 7` è `rows.get(6)`. Il limite di righe conta il titolo e l'intestazione, ed è verificato prima che il foglio venga scritto.

Le eccezioni checked lanciate da un getter senza dichiarazione (ad esempio tramite tecniche di "sneaky throw") vengono incapsulate in `java.lang.reflect.UndeclaredThrowableException` e poi segnalate come qualsiasi altro errore di un getter. Gli `Error` (come `OutOfMemoryError` o `StackOverflowError`) non vengono incapsulati.

### 11.5 Errori di infrastruttura

| Errore | Quando | Note |
| --- | --- | --- |
| `java.io.UncheckedIOException` | La serializzazione della cartella di lavoro fallisce, compreso un guasto dello stream del chiamante (connessione chiusa, disco pieno) | Non è un'eccezione di sheetsmith, di proposito. L'`IOException` originale è la causa. Con il metodo con stream, potrebbe essere stato scritto contenuto parziale. |
| `NullPointerException` | Un argomento null: `sheets`, un elemento di `sheets`, `out`, `type`, o un componente null dei record pubblici | Errore di programmazione. |
| `OutOfMemoryError` | La cartella di lavoro non sta nell'heap | Vedere la [sezione 12.3](#123-esportazioni-molto-grandi). |

### 11.6 Errori al di fuori della generazione

| Origine | Eccezione | Messaggio |
| --- | --- | --- |
| `Builder.converter` chiamato due volte per lo stesso tipo | `IllegalArgumentException` | `a converter is already registered for type X` |
| `SheetsmithDefaults` con valori non validi | `IllegalArgumentException` | `dateFormat must not be blank`, `dateTimeFormat must not be blank`, `preset must not be INHERIT`, `accentColor 'X' is not a valid colour: ...` |
| Due bean converter per lo stesso tipo (Spring) | `IllegalStateException` all'avvio | `converter beans 'a' and 'b' both handle type X; keep only one of them` |
| Bean converter con un tipo non determinabile (Spring) | `IllegalStateException` all'avvio | `cannot resolve the type handled by converter bean 'x'; ...` |
| Proprietà `sheetsmith.*` non valida (Spring) | errore di binding o `IllegalArgumentException` all'avvio | come sopra |
| Fallimento della validazione all'avvio (Spring) | `SheetsmithConfigurationException` all'avvio | l'elenco completo degli errori |

### 11.7 Testare le classi sheet

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

In un test Spring Boot, iniettare il bean `Sheetsmith` per validare con i converter reali, oppure affidarsi alla validazione all'avvio, che fa fallire il contesto del test.

---

## 12. Limiti e comportamenti noti

Questa sezione elenca ogni limite noto e ogni comportamento che può sorprendere, compresi quelli lasciati deliberatamente così come sono e documentati invece di essere trasformati in errori.

### 12.1 Limiti di Excel

| Caso | Cosa succede | Cosa fare |
| --- | --- | --- |
| Data o data e ora precedente al 1900-01-01 | Excel non può rappresentarla: la cella contiene `-1` e viene visualizzata come `#####`. Non viene sollevato alcun errore. | Convertire tali valori in testo con un converter. |
| Numero `NaN` o infinito | La cella diventa un errore di Excel: `#NUM!` per `NaN`, `#DIV/0!` per l'infinito. Non viene sollevato alcun errore. Un `BigInteger` o `BigDecimal` troppo grande per un `double` diventa infinito. | Mapparli, ad esempio a `CellValue.blank()`. |
| Numero con più di 15 cifre significative | Si perde precisione: Excel memorizza numeri in virgola mobile a 64 bit. Un `long` oltre 2^53 o un `BigDecimal` grande o molto preciso viene arrotondato. Non viene sollevato alcun errore. | Scrivere gli identificatori e i decimali esatti come testo. |
| Testo più lungo di 32.767 caratteri | Excel non può memorizzarlo: `SheetsmithGenerationException`. | Accorciare il testo prima di scriverlo. |
| Più di 1.048.576 righe in un foglio, titolo e intestazione inclusi | `SheetsmithGenerationException` prima che il foglio venga scritto. | Suddividere i dati su più fogli. |
| Foglio chiamato `History` | Excel riserva il nome al rilevamento delle modifiche e può rifiutare o riparare il file. Non viene rifiutato da sheetsmith. | Scegliere un altro nome di foglio. |
| Regole sul nome del foglio | Applicate da V-19 e V-20. | Ripulire i nomi costruiti a partire da dati. |
| Più di 16.384 colonne | Oltre il limite di Excel; non controllato da sheetsmith e non realistico per una classe annotata. | Nessuna. |
| Stili di cella (circa 64.000 per file) | Non è un limite pratico: gli stili uguali sono condivisi, quindi il numero di stili dipende dal numero di stili distinti, non dal numero di celle. | Nessuna. |

### 12.2 Conversione dei valori

| Comportamento | Spiegazione | Cosa fare |
| --- | --- | --- |
| I valori `float` mostrano cifre in più | I numeri vengono scritti tramite `doubleValue()`; un `float` come `0.1f` diventa `0.10000000149011612`, visibile con il formato Generale. | Usare `double` o `BigDecimal`, oppure impostare un formato numerico come `0.00`. |
| La scala di `BigDecimal` non viene preservata | `2.50` viene scritto come il numero `2.5`; gli zeri finali sono una questione di visualizzazione. | Impostare un formato, ad esempio `0.00`. |
| Le enum vengono scritte con `name()` | Gli override di `toString()` vengono ignorati. | Registrare un converter ([sezione 9.9](#99-esempi)). |
| Frazioni di secondo | Excel memorizza gli orari con una precisione di circa un millisecondo; la precisione più fine di `LocalDateTime` va persa. | Nessuna, oppure scrivere come testo. |
| Testo che sembra un numero o una formula | I valori di testo vengono sempre scritti come celle di testo: `"00123"` mantiene gli zeri, `"=SUM(A1:A2)"` non è una formula. | Nessuna: è voluto. |
| Un getter con tipo di ritorno non corrispondente | Il getter viene ignorato e il campo viene letto direttamente ([sezione 4.2.1](#421-accesso-al-valore)). | Allineare il tipo di ritorno del getter al tipo del campo. |
| Formati predefiniti per le celle vuote | Le celle vuote (valori null o `CellValue.blank()`) non ricevono alcun formato predefinito, solo i formati impostati dagli stili. | Nessuna. |
| `numberFormat` si applica anche agli interi | Un `#,##0.00` predefinito mostra decimali nelle colonne di interi. | Dare alle colonne di interi `format = "0"` oppure `"#,##0"`. |

### 12.3 Esportazioni molto grandi

L'intera cartella di lavoro viene costruita in memoria prima di essere scritta, quindi la memoria cresce con il numero di celle. Le misure seguenti provengono dai test di accettazione della versione 1.0.0, con un heap di 4 GB e 10 colonne. Sono **indicative** e dipendono dai dati, dalla JVM e dall'hardware.

| Misura | Valore |
| --- | --- |
| Heap necessario | circa 1,4 GB per milione di celle |
| Tempo di generazione | circa 10 secondi ogni 100.000 righe |
| Effetto del dimensionamento automatico delle colonne | moltiplica il tempo di circa 2,4 volte |
| Esportazione riuscita più grande | 350.000 righe (3,5 milioni di celle) |
| Esportazione fallita | 500.000 righe, `OutOfMemoryError` |
| `byte[]` contro `OutputStream` | nessuna differenza misurabile |

Raccomandazioni:

1. Misurare con volumi realistici e dimensionare di conseguenza l'heap.
2. Per i fogli di grandi dimensioni, impostare `autoSizeColumns = false` e dare a ogni colonna un `width` esplicito.
3. Scrivere su uno stream invece di restituire un `byte[]` non riduce in modo significativo la memoria: la cartella di lavoro, non il file, ne occupa la maggior parte.
4. Le esportazioni grandi concorrenti si sommano: limitarne la concorrenza (ad esempio con un executor limitato o un semaforo) sui servizi con memoria limitata.
5. Suddividere i dataset molto grandi su più cartelle di lavoro piuttosto che su più fogli di una stessa cartella di lavoro, poiché tutti i fogli di una cartella di lavoro stanno in memoria insieme.

Una modalità streaming per volumi molto grandi non fa parte della versione 1.0.0: vedere la [sezione 15](#15-lavori-in-corso).

### 12.4 Dimensionamento automatico delle colonne

| Comportamento | Spiegazione |
| --- | --- |
| Dipende dai font installati | Apache POI misura il testo con i font Java AWT. Su server o container senza font o senza le librerie native di AWT, la misurazione fallisce e sheetsmith ripiega su una stima basata sul numero di caratteri dei valori visualizzati, più 2, con un massimo di 255. La stima non tiene conto di font proporzionali, testo in grassetto o dimensioni del font, quindi le colonne possono risultare leggermente più larghe o più strette rispetto a una misura esatta. |
| Titolo escluso, con un'eccezione | Il titolo unito non allarga mai le sue colonne. Con **una sola colonna e un titolo**, tuttavia, non c'è nulla da unire: la misurazione esatta di Apache POI include allora il testo del titolo, e la colonna diventa larga quanto il titolo, mentre la stima di ripiego ignora il titolo. Impostare un `width` esplicito sulla colonna quando la cosa conta. |
| Costo | Il dimensionamento legge ogni cella della colonna; sui fogli grandi domina il tempo di generazione. |
| Limite di larghezza | La larghezza massima è di 255 caratteri. |

Per rendere disponibile la misurazione esatta sui container Linux, installare nell'immagine un pacchetto di font e fontconfig (ad esempio `fontconfig` e un pacchetto di font DejaVu o Liberation), ed eseguire la JVM con `-Djava.awt.headless=true`.

### 12.5 Layout e stili

| Comportamento | Spiegazione |
| --- | --- |
| Le altezze delle righe non sono impostate | Le righe con testo a capo mantengono l'altezza predefinita finché l'applicazione di fogli di calcolo non le regola. |
| `locked` e `hidden` non hanno effetto visibile | Si applicano solo ai fogli protetti, e sheetsmith non protegge i fogli. |
| I colori indicizzati variano | Dipendono dalla tavolozza dell'applicazione che apre il file. Preferire i colori esadecimali. |
| Disponibilità dei font | Un nome di font non installato sulla macchina di chi legge viene sostituito dall'applicazione di fogli di calcolo. |
| Visualizzazione regionale | I separatori delle migliaia e dei decimali, e i nomi dei mesi e dei giorni, seguono le impostazioni regionali di chi legge. |
| I formati dei dati non sono validati | Un codice di formato non valido viene scritto così com'è; Excel può ignorarlo o segnalare che il file richiede una riparazione. |
| Lista di dati vuota | Il foglio ha il titolo (se presente) e l'intestazione; il filtro automatico copre solo l'intestazione; la cornice esterna si chiude sotto l'intestazione. |

### 12.6 Validazione e cache

| Comportamento | Spiegazione |
| --- | --- |
| Le classi non valide vengono rivalidate a ogni chiamata | Non vengono messe in cache, quindi il costo della validazione si paga di nuovo finché la classe non viene corretta. |
| La creazione di un converter di campo che fallisce viene ritentata | Non viene memorizzata come fallita; viene tentata di nuovo a ogni validazione o generazione. |
| La validazione all'avvio usa il bean del contesto | Una classe sheet valida solo con un converter registrato altrove (ad esempio su un generatore diverso) viene segnalata. |
| La cache dei metadati è condivisa | Tutti i generatori dello stesso class loader condividono la cache dei metadati; le associazioni dei converter sono per generatore. |

---

## 13. Ricette

Casi d'uso completi e autosufficienti. Le dichiarazioni di package e gli import sono omessi dove ovvio. Tutti i nomi e i dati sono di fantasia.

### 13.1 Esportazione minima

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

Risultato: intestazione nella riga 1, bloccata; una riga per prodotto; colonne dimensionate sul contenuto; nessuno stile (valori predefiniti di Excel); prezzi nel formato Generale, a meno che sia configurato un formato numerico predefinito.

### 13.2 Più fogli con classi diverse

```java
List<SheetData<?>> sheets = List.of(
        SheetData.of("Summary", SummaryRow.class, List.of(summary)),
        SheetData.of("Customers", CustomerRow.class, customers),
        SheetData.of("Orders", OrderRow.class, orders));

byte[] file = sheetsmith.generate(sheets);
```

I fogli compaiono nell'ordine della lista. Tutte e tre le classi vengono validate prima che venga scritto qualsiasi dato, e i loro errori, se presenti, vengono segnalati insieme.

### 13.3 Una classe, più fogli

```java
Map<YearMonth, List<OrderRow>> byMonth = orders.stream()
        .collect(Collectors.groupingBy(order -> YearMonth.from(order.date()), TreeMap::new, Collectors.toList()));

List<SheetData<?>> sheets = byMonth.entrySet().stream()
        .<SheetData<?>>map(e -> SheetData.of(e.getKey().toString(), OrderRow.class, e.getValue()))
        .toList();

byte[] file = sheetsmith.generate(sheets);
```

`YearMonth.toString()` produce nomi come `2026-09`, che sono nomi di foglio validi. I metadati di `OrderRow` vengono calcolati una sola volta.

### 13.4 Riga dei totali

sheetsmith non calcola i totali né scrive formule: il totale è una riga di dati come le altre, di solito l'ultimo elemento della lista, stilizzata con lo slot `lastRow`.

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

Con un preset, la riga dei totali riceve anche le righe alternate della sua parità; aggiungere `fillPattern = Fill.NO_FILL` o un `fillColor` a `total` per controllarlo. Quando il filtro automatico è abilitato, ricordare che la riga dei totali fa parte dell'intervallo filtrato.

### 13.5 Righe alternate senza preset

```java
@ExcelSheet(header = @HeaderStyles(base = "header"), body = @BodyStyles(even = "zebra"))
@ExcelStyle(name = "header", bold = Toggle.TRUE, borderBottom = Border.THIN)
@ExcelStyle(name = "zebra", fillColor = "#F2F2F2")
public record LogRow(
        @ExcelColumn(header = "When", order = 10, format = "dd/mm/yyyy hh:mm:ss") LocalDateTime when,
        @ExcelColumn(header = "Message", order = 20, width = 80) String message) {
}
```

### 13.6 Evidenziare una colonna chiave e allineare i numeri a destra

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

I numeri sono allineati a destra da Excel per impostazione predefinita (allineamento `GENERAL`); lo stile `right` allinea i testi di intestazione sopra di essi.

### 13.7 Tabella incorniciata

```java
@ExcelSheet(title = "Attendance", outerBorder = Border.MEDIUM, outerBorderColor = "#404040",
        body = @BodyStyles(base = "grid"))
@ExcelStyle(name = "grid", border = Border.HAIR, borderColor = "#BFBFBF")
public record AttendanceRow(
        @ExcelColumn(header = "Name", order = 10) String name,
        @ExcelColumn(header = "Present", order = 20) boolean present) {
}
```

La cornice viene disegnata sui bordi esterni di intestazione e dati, sopra la griglia sottilissima; il titolo resta fuori.

### 13.8 Report aziendale con un foglio di stile condiviso

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

Ogni report che referenzia `CorporateStyles` ottiene gli stessi font e formati; il preset `LIGHT` con l'accento aziendale fornisce linee e righe alternate.

### 13.9 Value object e importi

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

### 13.10 Date e ore con fusi orari

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

Il fuso è una scelta esplicita dell'applicazione. Senza il converter, `AuditRow` viola V-10.

### 13.11 Codici e identificatori come testo

CAP, codici prodotto, IBAN e identificatori numerici lunghi non devono diventare numeri: gli zeri iniziali scomparirebbero e le cifre oltre la quindicesima andrebbero perse.

```java
@ExcelSheet
public record AccountRow(
        @ExcelColumn(header = "Postal code", order = 10) String postalCode,         // String: already text
        @ExcelColumn(header = "Reference", order = 20, converter = LongAsText.class) long reference) {
}
```

Mantenere tali valori come `String` nella classe sheet ogni volta che è possibile.

### 13.12 Scrivere su file e allegare a un'e-mail

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

### 13.13 Download da una servlet semplice

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

Per l'equivalente con Spring MVC vedere la [sezione 2.3](#23-download-da-un-controller-spring-mvc).

### 13.14 Validazione all'avvio e nei test

```yaml
sheetsmith:
  validation:
    packages: com.example.export
```

Ogni tipo `@ExcelSheet` sotto `com.example.export` viene validato all'avvio dell'applicazione; un errore impedisce l'avvio con l'elenco completo degli errori. Per i test, vedere la [sezione 11.7](#117-testare-le-classi-sheet).

### 13.15 Nomi di foglio costruiti da dati

I nomi che provengono da dati (nomi di clienti, categorie) devono essere resi validi dal chiamante, perché sheetsmith rifiuta i nomi non validi invece di modificarli.

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

### 13.16 Java semplice con un container di dependency injection

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

### 13.17 Esportazioni grandi

```java
@ExcelSheet(autoSizeColumns = false, freezeHeader = true)
public record MovementRow(
        @ExcelColumn(header = "Id", order = 10, width = 12) long id,
        @ExcelColumn(header = "Date", order = 20, width = 12, format = "dd/mm/yyyy") LocalDate date,
        @ExcelColumn(header = "Description", order = 30, width = 50) String description,
        @ExcelColumn(header = "Amount", order = 40, width = 14, format = "#,##0.00") BigDecimal amount) {
}
```

Larghezze esplicite e nessun dimensionamento automatico; un heap dimensionato in base alle misure della [sezione 12.3](#123-esportazioni-molto-grandi); concorrenza limitata; dati suddivisi su più file oltre qualche centinaio di migliaia di righe.

### 13.18 Colonne ereditate da una classe base

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

Le colonne di audit (ordini 900 e 910) seguono le colonne del contratto in ogni sottoclasse. Gli ordini devono essere univoci in tutta la gerarchia. Gli stili con nome devono essere dichiarati su `ContractRow` (o in un foglio di stile), non su `AuditedRow`.

### 13.19 Esempio completo: report mensile di gestione delle pratiche

Un'azienda di servizi di fantasia produce un report mensile delle pratiche gestite dai suoi team, nello stile aziendale condiviso da tutti i suoi report.

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

Configurazione di Spring:

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

Cosa vede chi legge: un titolo nel font aziendale; un'intestazione con testo in grassetto, una linea di accento scuro e etichette con testo a capo; righe alternate chiare separate da linee sottili; numeri di pratica in grassetto; date centrate in `dd/mm/yyyy`; etichette di stato invece dei nomi delle costanti; importi allineati a destra con due decimali; un filtro automatico su ogni colonna; le proprietà del file che mostrano "Example Services Ltd" e "Case Reporting". Lo stile che dipende dal valore di una cella, come le pratiche scadute in rosso, non fa parte della versione 1.0.0: gli stili dipendono dalla posizione della cella, mai dal suo contenuto.

---

## 14. FAQ e risoluzione dei problemi

**La colonna generata è nella posizione sbagliata.**
Le colonne seguono `order` in ordine crescente, non l'ordine di dichiarazione. Controllare i valori di `order`, colonne ereditate comprese.

**Un campo non compare nel foglio.**
Vengono esportati solo i campi con `@ExcelColumn`. Controllare che l'annotazione sia sul campo (o sul componente del record), che sia l'annotazione di sheetsmith (`cloud.baldilorenzo.sheetsmith.annotation.ExcelColumn`) e che `SheetData` usi la classe prevista.

**Il mio getter non viene chiamato.**
Il getter deve essere pubblico, non static, senza argomenti, chiamato `getX` (o `isX` per `boolean`/`Boolean`), e il suo tipo di ritorno deve essere assegnabile al tipo del campo. Un'incongruenza tra primitivo e wrapper fa sì che sheetsmith legga direttamente il campo ([sezione 4.2.1](#421-accesso-al-valore)).

**Le date vengono mostrate come numeri.**
Excel memorizza le date come numeri; il formato le fa apparire come date. I valori data integrati ricevono sempre il formato data predefinito quando non è impostato alcun formato. Se uno stile o una colonna imposta un formato numerico su una colonna di date, quel formato vince. Se il valore è stato convertito con `CellValue.number`, usare invece `CellValue.date` o `CellValue.dateTime`.

**Il mio formato data mostra i minuti al posto dei mesi (o viceversa).**
Il formato usa la sintassi di Excel: `mm` è il mese a meno che segua un codice dell'ora o precede un codice dei secondi. Scrivere `dd/mm/yyyy` per le date e `hh:mm` per gli orari.

**I numeri mostrano troppi decimali.**
Impostare un formato sulla colonna, su uno stile o come `sheetsmith.formats.number`. I campi `float` mostrano artefatti binari: preferire `double` o `BigDecimal`.

**Gli zeri iniziali scompaiono.**
Il valore è numerico. Mantenerlo come `String` oppure convertirlo con `CellValue.text`.

**L'applicazione non si avvia con l'errore "both handle type".**
Due bean converter gestiscono lo stesso tipo. Tenerne uno, oppure trasformare quello specifico di una colonna in un converter di campo che non sia un bean ([sezione 9.8](#98-bean-spring-come-converter-implicazioni)).

**Tutte le mie colonne di tipo stringa vengono trasformate da un converter che ho scritto per una sola colonna.**
Il converter gestisce `String` ed è un bean Spring, quindi è un converter di applicazione per ogni colonna `String`. Rimuovere l'annotazione del bean e dichiararlo con `@ExcelColumn(converter = ...)`.

**V-10 nei test ma non in produzione.**
Il generatore dei test non ha i converter di applicazione. Validare con un generatore configurato come quello di produzione, oppure iniettare il bean Spring.

**V-17 in un'applicazione modulare.**
Aprire il package della classe sheet: `opens com.example.export;` funziona sia che sheetsmith si trovi nel module path sia nel class path.

**Il preset non ha effetto.**
Controllare il preset effettivo: `@ExcelSheet.preset` deve essere `LIGHT`, `MEDIUM` o `DARK`, oppure `INHERIT` con un valore predefinito dell'applicazione diverso da `NONE`. Ricordare che ogni stile dichiarato sovrascrive il preset: un `body.base` con un `fillColor` nasconde le righe alternate.

**Il mio `accentColor` viene ignorato.**
Viene usato solo quando il preset effettivo non è `NONE`.

**Il colore di accento in YAML viene ignorato oppure l'applicazione non si avvia.**
Racchiudere tra apici i valori che iniziano con `#` in YAML: `accent-color: "#1F4E79"`.

**Le colonne sono troppo strette o troppo larghe sul server, ma vanno bene sulla mia macchina.**
Sul server mancano i font e la larghezza ripiega su una stima. Installare i font nell'immagine, oppure impostare larghezze esplicite ([sezione 12.4](#124-dimensionamento-automatico-delle-colonne)).

**L'unica colonna di un foglio con titolo è larga quanto il titolo.**
Comportamento noto ([sezione 12.4](#124-dimensionamento-automatico-delle-colonne)): impostare un `width` esplicito.

**Excel dice che il file richiede una riparazione.**
Le cause abituali sono un codice di formato dei dati non valido (i formati non vengono validati) oppure un foglio chiamato `History`.

**La generazione è lenta o esaurisce la memoria.**
Vedere la [sezione 12.3](#123-esportazioni-molto-grandi): disattivare il dimensionamento automatico, impostare le larghezze, dimensionare l'heap, limitare la concorrenza.

**Posso scrivere formule, immagini, commenti, formattazione condizionale o validazione dei dati?**
Non nella versione 1.0.0. Un testo che inizia con `=` viene scritto come testo, non come formula.

**Posso tradurre le intestazioni?**
Le intestazioni vengono scritte come dichiarate. La localizzazione è lasciata all'applicazione, ad esempio preparando classi sheet diverse o con una post-elaborazione.

**Posso usare sheetsmith al di fuori di Spring?**
Sì: importare `sheetsmith-core` e usare `Sheetsmith.builder()`.

**Posso usare le classi in `cloud.baldilorenzo.sheetsmith.internal`?**
No. Sono dettagli di implementazione, esclusi dal Javadoc pubblicato e soggetti a modifiche senza preavviso ([Appendice A](#appendice-a-censimento-delle-classi)).

---

## 15. Lavori in corso

Questa sezione elenca le evoluzioni pianificate o in valutazione. Nulla di quanto riportato qui è disponibile nella versione 1.0.0, e nulla costituisce un impegno su contenuti o date.

| Argomento | Stato | Descrizione |
| --- | --- | --- |
| Converter predefiniti | Pianificato per la 1.1.0 | Converter già pronti per i tipi comuni che oggi non sono gestiti in modo nativo, limitati ai tipi con un'unica rappresentazione canonica priva di parametri. Famiglie candidate: identificatori e risorse (`UUID`, `URI`, `Path`), tipi di data e ora, date legacy, contenitori (`Optional`, `List`, array). Il sottoinsieme finale, e se saranno attivi automaticamente o opt-in, verrà deciso durante l'implementazione. |
| Configurazione condivisibile del foglio ("preset aziendale") | In valutazione | Condividere non solo gli stili con nome (già possibile con i fogli di stile) ma l'intera configurazione del foglio: preset, colore di accento, filtro automatico e l'associazione tra slot e stili, come un unico preset aziendale riutilizzabile. |
| Catalogo di stili di tabella con nome | In valutazione | Partendo dalla configurazione condivisibile, un catalogo di stili di tabella predefiniti selezionabili per nome, simile alla galleria degli stili di tabella di Excel. Resta aperta la questione se il colore di accento rimanga modificabile per ogni report, o se ogni colore sia una voce separata. |
| Modalità streaming per volumi molto grandi | In valutazione | Una modalità che scrive le righe progressivamente invece di costruire l'intera cartella di lavoro in memoria, per esportazioni oltre i volumi indicati nella [sezione 12.3](#123-esportazioni-molto-grandi). Verrebbe aggiunta come estensione compatibile, con un nuovo tipo di input per i dati in streaming. |
| Limitazione dell'accesso alle classi interne | In valutazione | Impedire alle applicazioni di dipendere dai package `internal`, che oggi sono pubblici per ragioni tecniche. |
| Assistente per la documentazione | In valutazione, dopo che la libreria sarà stabile in produzione | Un assistente sul sito della documentazione che riceve una classe Java e una descrizione della tabella desiderata e restituisce la classe con le annotazioni di sheetsmith applicate, con una breve spiegazione. |

Sono **fuori ambito** e non pianificati: la lettura di file Excel, il formato `.xls`, le tabelle Excel native (sheetsmith mantiene il proprio modello di stile) e la traduzione dei testi di intestazione.

---

## Appendice A: censimento delle classi

### A.1 API pubblica di `sheetsmith-core`

Questi tipi costituiscono l'API supportata. Sono documentati nel Javadoc pubblicato e seguono le regole di compatibilità delle versioni della libreria.

| Tipo | Package | Genere | Utilizzabile per |
| --- | --- | --- | --- |
| `Sheetsmith` | `cloud.baldilorenzo.sheetsmith` | interfaccia | generare e validare; ottenere un builder |
| `Sheetsmith.Builder` | stesso | interfaccia | configurare un generatore |
| `SheetData<T>` | stesso | record | descrivere un foglio da generare |
| `SheetsmithDefaults` | stesso | record | valori predefiniti dell'applicazione |
| `DocumentProperties` | stesso | record | autore e applicazione dei file |
| `SheetsmithException` | stesso | classe abstract sealed | intercettare ogni eccezione della libreria |
| `SheetsmithConfigurationException` | stesso | classe final | errori di configurazione |
| `SheetsmithGenerationException` | stesso | classe final | errori sui dati |
| `ConfigurationError` | stesso | record | un errore di configurazione |
| `ExcelSheet` | `cloud.baldilorenzo.sheetsmith.annotation` | annotazione | classe sheet |
| `ExcelColumn` | stesso | annotazione | colonna |
| `ExcelStyle` | stesso | annotazione (ripetibile) | stile con nome; contiene anche la costante `UNSET` |
| `ExcelStyles` | stesso | annotazione | contenitore di `ExcelStyle`, uso del compilatore |
| `ExcelStyleSheet` | stesso | annotazione | foglio di stile |
| `HeaderStyles` | stesso | annotazione | slot dell'intestazione |
| `BodyStyles` | stesso | annotazione | slot del corpo |
| `ColumnStyles` | stesso | annotazione | slot di colonna |
| `Align` | `cloud.baldilorenzo.sheetsmith.style` | enum | allineamento orizzontale |
| `VerticalAlign` | stesso | enum | allineamento verticale |
| `Border` | stesso | enum | linee del bordo |
| `Fill` | stesso | enum | motivi di riempimento |
| `Underline` | stesso | enum | sottolineatura |
| `Script` | stesso | enum | apice e pedice |
| `Toggle` | stesso | enum | sì/no a tre stati |
| `TablePreset` | stesso | enum | preset |
| `CellConverter<T>` | `cloud.baldilorenzo.sheetsmith.convert` | interfaccia funzionale | converter |
| `CellConverter.None` | stesso | classe final | marcatore, mai usato direttamente |
| `CellConverterFactory` | stesso | interfaccia | creare converter di campo |
| `CellValue` | stesso | interfaccia sealed | valori scritti nelle celle |
| `CellValue.Text`, `Numeric`, `Bool`, `Date`, `DateTime` | stesso | record | forme di `CellValue` |
| `CellValue.Blank` | stesso | classe final | la cella vuota, singleton |
| `ConversionContext` | stesso | interfaccia | dove viene scritto un valore |

### A.2 API pubblica di `sheetsmith-spring-boot-autoconfigure`

| Tipo | Genere | Utilizzabile per |
| --- | --- | --- |
| `SheetsmithAutoConfiguration` | classe | istanziata solo da Spring Boot |
| `SheetsmithProperties` | record | leggere le proprietà associate; `toDefaults()`, `toDocumentProperties()` |
| `SheetsmithProperties.Formats` | record | `sheetsmith.formats.*` |
| `SheetsmithProperties.Document` | record | `sheetsmith.document.*` |
| `SheetsmithProperties.Validation` | record | `sheetsmith.validation.*` |
| `SpringConverterFactory` | classe | creare converter di campo da un contesto Spring, anche in generatori definiti dall'applicazione |
| `SheetsmithStartupValidator` | classe | validazione all'avvio; registrato automaticamente |

`sheetsmith-spring-boot-starter` non contiene classi.

### A.3 Classi interne

I package `cloud.baldilorenzo.sheetsmith.internal`, `.internal.convert`, `.internal.metadata`, `.internal.style` e `.internal.write` contengono l'implementazione. Alcune delle loro classi sono `public` perché Java lo richiede tra package diversi, ma **non fanno parte dell'API**: sono escluse dal Javadoc pubblicato e possono cambiare o scomparire in qualsiasi versione, comprese quelle di patch. Le applicazioni non devono usarle.

| Package | Classi | Responsabilità |
| --- | --- | --- |
| `internal` | `DefaultSheetsmith` | implementazione predefinita di `Sheetsmith` e del suo builder |
| `internal.convert` | `BuiltInConverters`, `ConverterRegistry`, `ConverterTypes`, `ConverterBinder`, `ReflectiveConverterFactory`, `SheetBinding` | converter integrati, risoluzione, associazione dei converter alle colonne, factory predefinita |
| `internal.metadata` | `MetadataExtractor`, `MetadataValidator`, `MetadataCache`, `SheetMetadata`, `ColumnMetadata`, `StyleDefinition`, `ValueAccessor` | lettura e validazione delle annotazioni, cache dei metadati, accesso ai valori |
| `internal.style` | `StyleAttributes`, `StyleResolver`, `StyleCache`, `PresetFactory`, `ColorUtils`, `OuterBorder`, `CellRole`, `PoiMapping` | modello degli stili, cascata, preset, aritmetica dei colori, conversione in stili POI |
| `internal.write` | `WorkbookWriter`, `SheetWriter`, `WorkbookSupplier`, `WritableSheet` | creazione, scrittura e rilascio delle cartelle di lavoro |

---

## Appendice B: domini dei valori

### B.1 `Align`

Rispecchia `HorizontalAlignment` di Apache POI.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato: mantiene il valore del livello inferiore della cascata (predefinito). |
| `GENERAL` | Valore predefinito di Excel: testo a sinistra, numeri e date a destra. |
| `LEFT` | Allineato al bordo sinistro. |
| `CENTER` | Centrato orizzontalmente. |
| `RIGHT` | Allineato al bordo destro. |
| `FILL` | Contenuto ripetuto per riempire la larghezza della cella. |
| `JUSTIFY` | Testo a capo e spaziato in modo che ogni riga raggiunga entrambi i bordi. |
| `CENTER_SELECTION` | Centrato attraverso le celle adiacenti con questo allineamento, senza unirle. |
| `DISTRIBUTED` | Testo a capo, con le parole di ogni riga distribuite uniformemente. |

### B.2 `VerticalAlign`

Rispecchia `VerticalAlignment` di Apache POI.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato (predefinito). |
| `TOP` | Allineato al bordo superiore. |
| `CENTER` | Centrato verticalmente. |
| `BOTTOM` | Allineato al bordo inferiore; valore predefinito di Excel. |
| `JUSTIFY` | Righe di testo a capo spaziate per riempire l'altezza. |
| `DISTRIBUTED` | Righe di testo a capo distribuite uniformemente su tutta l'altezza. |

### B.3 `Border`

Rispecchia `BorderStyle` di Apache POI. Usato dagli attributi di bordo di `@ExcelStyle` e da `@ExcelSheet.outerBorder`.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato (predefinito); su `outerBorder`, nessuna cornice. |
| `NONE` | Nessuna linea, che rimuove una linea impostata da un livello inferiore. |
| `THIN` | Linea continua sottile. |
| `MEDIUM` | Linea continua di spessore medio. |
| `DASHED` | Linea tratteggiata sottile. |
| `DOTTED` | Linea punteggiata sottile. |
| `THICK` | Linea continua spessa. |
| `DOUBLE` | Doppia linea sottile. |
| `HAIR` | Linea sottilissima, la più sottile. |
| `MEDIUM_DASHED` | Linea tratteggiata di spessore medio. |
| `DASH_DOT` | Linea sottile alternata di trattini e punti. |
| `MEDIUM_DASH_DOT` | Linea di spessore medio alternata di trattini e punti. |
| `DASH_DOT_DOT` | Linea sottile di trattini, ciascuno seguito da due punti. |
| `MEDIUM_DASH_DOT_DOT` | Linea di spessore medio di trattini, ciascuno seguito da due punti. |
| `SLANTED_DASH_DOT` | Linea di spessore medio di trattini inclinati e punti. |

### B.4 `Fill`

Rispecchia `FillPatternType` di Apache POI. I motivi disegnano `fillColor` sopra `fillBackgroundColor`.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato (predefinito). Con un `fillColor`, il riempimento è pieno. |
| `NO_FILL` | Nessun riempimento, che rimuove un riempimento impostato da un livello inferiore. |
| `SOLID_FOREGROUND` | Riempimento pieno nel colore di riempimento. |
| `FINE_DOTS` | Punti che coprono metà della cella ("grigio 50%"). |
| `ALT_BARS` | Punti fitti che coprono tre quarti ("grigio 75%"). |
| `SPARSE_DOTS` | Punti radi che coprono un quarto ("grigio 25%"). |
| `THICK_HORZ_BANDS` | Strisce orizzontali spesse. |
| `THICK_VERT_BANDS` | Strisce verticali spesse. |
| `THICK_BACKWARD_DIAG` | Strisce diagonali spesse, da in alto a sinistra a in basso a destra. |
| `THICK_FORWARD_DIAG` | Strisce diagonali spesse, da in basso a sinistra a in alto a destra. |
| `BIG_SPOTS` | Reticolo spesso orizzontale e verticale. |
| `BRICKS` | Reticolo diagonale spesso. |
| `THIN_HORZ_BANDS` | Strisce orizzontali sottili. |
| `THIN_VERT_BANDS` | Strisce verticali sottili. |
| `THIN_BACKWARD_DIAG` | Strisce diagonali sottili, da in alto a sinistra a in basso a destra. |
| `THIN_FORWARD_DIAG` | Strisce diagonali sottili, da in basso a sinistra a in alto a destra. |
| `SQUARES` | Reticolo sottile orizzontale e verticale. |
| `DIAMONDS` | Reticolo diagonale sottile. |
| `LESS_DOTS` | Punti molto radi ("grigio 12,5%"). |
| `LEAST_DOTS` | I punti più radi ("grigio 6,25%"). |

### B.5 `Underline`

Rispecchia `FontUnderline` di Apache POI.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato (predefinito). |
| `SINGLE` | Linea singola sotto il testo. |
| `DOUBLE` | Linea doppia sotto il testo. |
| `SINGLE_ACCOUNTING` | Sottolineatura contabile singola, più in basso e estesa a tutta la larghezza della cella. |
| `DOUBLE_ACCOUNTING` | Sottolineatura contabile doppia, più in basso e estesa a tutta la larghezza della cella. |
| `NONE` | Nessuna sottolineatura, che rimuove quella impostata da un livello inferiore. |

### B.6 `Script`

Nessuna enum POI diretta; corrisponde agli offset del tipo di font di POI.

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato (predefinito). |
| `NONE` | Testo normale sulla linea di base, che rimuove un apice o un pedice impostato da un livello inferiore. |
| `SUPER` | Apice. |
| `SUB` | Pedice. |

### B.7 `Toggle`

| Costante | Significato |
| --- | --- |
| `INHERIT` | Non impostato: mantiene il valore del livello inferiore (predefinito). |
| `TRUE` | Abilita l'attributo. |
| `FALSE` | Disabilita l'attributo, sovrascrivendo un livello inferiore che lo abilita. |

### B.8 `TablePreset`

| Costante | Significato |
| --- | --- |
| `INHERIT` | Usa il preset predefinito dell'applicazione. Valido solo su una classe sheet (valore predefinito di `@ExcelSheet.preset`). |
| `NONE` | Nessun preset. Valore predefinito dell'applicazione. |
| `LIGHT` | Tabella chiara ([sezione 7.2](#72-i-preset)). |
| `MEDIUM` | Tabella media. |
| `DARK` | Tabella scura. |

Le enum rispecchiate (`Align`, `VerticalAlign`, `Border`, `Fill`, `Underline`) contengono `INHERIT` più esattamente una costante per ciascuna costante della corrispondente enum di Apache POI, con nomi identici. Un test della libreria verifica la corrispondenza, così una versione futura di POI con nuove costanti viene rilevata quando la libreria viene compilata.

### B.9 Nomi di `IndexedColors`

I nomi accettati come colori sono le costanti di `org.apache.poi.ss.usermodel.IndexedColors` nella versione di Apache POI usata da sheetsmith (5.5.1 per sheetsmith 1.0.0):

`BLACK1`, `WHITE1`, `RED1`, `BRIGHT_GREEN1`, `BLUE1`, `YELLOW1`, `PINK1`, `TURQUOISE1`, `BLACK`, `WHITE`, `RED`, `BRIGHT_GREEN`, `BLUE`, `YELLOW`, `PINK`, `TURQUOISE`, `DARK_RED`, `GREEN`, `DARK_BLUE`, `DARK_YELLOW`, `VIOLET`, `TEAL`, `GREY_25_PERCENT`, `GREY_50_PERCENT`, `CORNFLOWER_BLUE`, `MAROON`, `LEMON_CHIFFON`, `LIGHT_TURQUOISE1`, `ORCHID`, `CORAL`, `ROYAL_BLUE`, `LIGHT_CORNFLOWER_BLUE`, `SKY_BLUE`, `LIGHT_TURQUOISE`, `LIGHT_GREEN`, `LIGHT_YELLOW`, `PALE_BLUE`, `ROSE`, `LAVENDER`, `TAN`, `LIGHT_BLUE`, `AQUA`, `LIME`, `GOLD`, `LIGHT_ORANGE`, `ORANGE`, `BLUE_GREY`, `GREY_40_PERCENT`, `DARK_TEAL`, `SEA_GREEN`, `DARK_GREEN`, `OLIVE_GREEN`, `BROWN`, `PLUM`, `INDIGO`, `GREY_80_PERCENT`, `AUTOMATIC`.

I nomi distinguono maiuscole e minuscole. La loro resa effettiva dipende dalla tavolozza dell'applicazione che apre il file.

### B.10 Intervalli numerici

| Attributo | Intervallo | Non impostato |
| --- | --- | --- |
| `@ExcelStyle.rotation` | da -90 a 90, oppure 255 | `ExcelStyle.UNSET` |
| `@ExcelStyle.indent` | da 0 a 250 | `ExcelStyle.UNSET` |
| `@ExcelStyle.fontSize` | da 1 a 409 | `ExcelStyle.UNSET` |
| `@ExcelColumn.width` | da 1 a 255 | `ExcelStyle.UNSET` |
| `@ExcelColumn.order` | qualsiasi `int`, univoco per classe | nessuno (obbligatorio) |

### B.11 Valori predefiniti in sintesi

| Impostazione | Valore predefinito |
| --- | --- |
| Titolo | nessuno |
| Intestazione bloccata | sì |
| Filtro automatico | no |
| Dimensionamento automatico delle colonne | sì |
| Cornice esterna | nessuna |
| Preset | `INHERIT` sulla classe, `NONE` per l'applicazione |
| Colore di accento | predefinito dell'applicazione, `#4472C4` |
| Formato data | `yyyy-mm-dd` |
| Formato data e ora | `yyyy-mm-dd hh:mm:ss` |
| Formato numerico | "Generale" di Excel |
| Autore e applicazione del documento | `sheetsmith` |
| Validazione all'avvio | disabilitata |
| Factory dei converter di campo | costruttore pubblico senza argomenti (Spring: bean del contesto o iniezione) |

---

## Appendice C: glossario

| Termine | Definizione |
| --- | --- |
| Colore di accento | Il colore da cui un preset deriva le proprie tonalità. |
| Converter di applicazione | Un converter registrato per un tipo, applicato a ogni colonna di quel tipo o dei suoi sottotipi, in ogni classe sheet. |
| Valori predefiniti dell'applicazione | I `SheetsmithDefaults` di un generatore: formati predefiniti, preset e colore di accento. |
| Cascata | L'ordine fisso con cui gli stili vengono sovrapposti, attributo per attributo, per ottenere lo stile effettivo di una cella. |
| Valore di cella | Un `CellValue`: ciò che un converter restituisce e che la libreria scrive. |
| Colonna | Un campo annotato con `@ExcelColumn`. |
| Converter | Un'implementazione di `CellConverter`, che trasforma il valore di un campo in un valore di cella. |
| Riga di dati | Una riga prodotta da un elemento della lista dei dati, numerata da 1. |
| Stile effettivo | Il risultato della cascata per una cella. |
| Converter di campo | Un converter dichiarato su una colonna con `@ExcelColumn.converter`. |
| Cornice | Il bordo esterno disegnato con `@ExcelSheet.outerBorder`. |
| Generatore | Un'istanza di `Sheetsmith`. |
| Stile con nome | Un insieme di attributi di formattazione dichiarato con `@ExcelStyle` e identificato dal suo nome. |
| Preset | Uno stile di tabella già pronto generato a partire da un colore di accento. |
| Ruolo | La posizione di una cella nella tabella (riga dispari o pari, prima o ultima riga, prima o ultima colonna), che seleziona gli slot da applicare. |
| Classe sheet | Una classe annotata con `@ExcelSheet`, che descrive una tabella. |
| Slot | Un punto in cui uno stile con nome viene applicato, per nome. |
| Foglio di stile | Una classe annotata con `@ExcelStyleSheet` che contiene stili con nome condivisi. |
| Non impostato | Il valore predefinito di un attributo di stile, che non sovrascrive nulla. |
