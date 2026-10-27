# Manuale utente di sheetsmith

**Versione trattata:** 1.1.0
**Destinatari:** sviluppatori Java che generano file Excel dalle proprie applicazioni
**Stato di questo documento:** manuale di riferimento della libreria. Dove questo manuale e il codice sorgente non concordano, fa fede il codice sorgente e il manuale deve essere corretto.

---

## Indice

1. [Novità della 1.1.0](#1-novità-della-110)
2. [Migrazione dalla 1.0.0 alla 1.1.0](#2-migrazione-dalla-100-alla-110)
3. [Introduzione](#3-introduzione)
4. [Avvio rapido](#4-avvio-rapido)
5. [Concetti](#5-concetti)
6. [Riferimento delle annotazioni](#6-riferimento-delle-annotazioni)
7. [Riferimento API](#7-riferimento-api)
8. [Stili](#8-stili)
9. [Preset](#9-preset)
10. [Stili condivisi, template e stile aziendale](#10-stili-condivisi-template-e-stile-aziendale)
11. [Converter](#11-converter)
12. [Integrazione con Spring Boot e proprietà di configurazione](#12-integrazione-con-spring-boot-e-proprietà-di-configurazione)
13. [Validazione ed errori](#13-validazione-ed-errori)
14. [Limiti e comportamenti noti](#14-limiti-e-comportamenti-noti)
15. [Ricette](#15-ricette)
16. [FAQ e risoluzione dei problemi](#16-faq-e-risoluzione-dei-problemi)
17. [Lavori in corso](#17-lavori-in-corso)
18. [Appendice A: censimento delle classi](#appendice-a-censimento-delle-classi)
19. [Appendice B: domini dei valori](#appendice-b-domini-dei-valori)
20. [Appendice C: glossario](#appendice-c-glossario)

---

## 1. Novità della 1.1.0

La versione 1.1.0 aggiunge a sheetsmith tre funzionalità: converter integrati per più tipi Java, collegamenti ipertestuali nelle celle e template di foglio. Corregge inoltre il modo in cui vengono segnalati gli errori di configurazione condivisi. Le applicazioni scritte per la 1.0.0 richiedono alcune modifiche meccaniche, elencate con la relativa correzione nella [sezione 2](#2-migrazione-dalla-100-alla-110).

| Modifica | In breve | Dettagli |
| --- | --- | --- |
| Più converter integrati | Sedici tipi in più vengono scritti senza converter: identificativi, risorse, valute, fusi orari, impostazioni locali, mesi, anni, numeri opzionali, date `java.sql` e collegamenti ipertestuali. | [sezione 1.1](#11-più-converter-integrati) |
| Collegamenti ipertestuali nelle celle | Un campo di tipo `Hyperlink` diventa un collegamento cliccabile, e qualsiasi converter può produrre un collegamento. | [sezione 1.2](#12-collegamenti-ipertestuali-nelle-celle) |
| Template di foglio | La configurazione di un foglio viene dichiarata una sola volta in un template e riusata da ogni classe sheet. | [sezione 1.3](#13-template-di-foglio) |
| Meno errori duplicati | Un errore di un template o di un foglio di stile condiviso da più classi sheet viene segnalato una sola volta. | [sezione 1.4](#14-correzioni) |
| Opzioni di layout come `Toggle` | `freezeHeader`, `autoFilter` e `autoSizeColumns` di `@ExcelSheet` sono ora `Toggle`, così che un template possa impostarle. | [sezione 2.2](#22-opzioni-di-layout-di-excelsheet) |

### 1.1 Più converter integrati

I tipi seguenti vengono scritti direttamente, senza dichiarare né registrare un converter.

| Tipo | Cella scritta |
| --- | --- |
| `UUID`, `URI`, `URL`, `File` | testo |
| `Currency` | testo, il codice ISO 4217, come `EUR` |
| `ZoneId`, `ZoneOffset` | testo, come `Europe/Rome` o `+02:00` |
| `Locale` | testo, il tag di lingua, come `it-IT` |
| `YearMonth` | testo, come `2026-10` |
| `Year` | numero |
| `AtomicBoolean` | booleano di Excel |
| `OptionalInt`, `OptionalLong`, `OptionalDouble` | numero, oppure una cella vuota quando il valore è assente |
| `java.sql.Date`, `java.sql.Timestamp` | data di Excel e data di Excel con ora, nel fuso orario predefinito della JVM |
| `Hyperlink` | collegamento cliccabile ([sezione 1.2](#12-collegamenti-ipertestuali-nelle-celle)) |

I converter scritti dall'applicazione, su un campo o registrati per un tipo, continuano a vincere su quelli integrati, quindi le esportazioni esistenti non cambiano. L'elenco completo e le regole di conversione sono nella [sezione 11.2](#112-converter-integrati).

### 1.2 Collegamenti ipertestuali nelle celle

Il nuovo tipo `Hyperlink`, nel package `cloud.baldilorenzo.sheetsmith.value`, contiene un indirizzo e un testo facoltativo da mostrare. Un campo di questo tipo diventa un collegamento cliccabile, con il consueto aspetto blu e sottolineato di Excel.

```java
@ExcelSheet(title = "Invoices Q3")
public record InvoiceLine(
        @ExcelColumn(header = "Number", order = 10) String number,
        @ExcelColumn(header = "Amount", order = 20, format = "#,##0.00") BigDecimal amount,
        @ExcelColumn(header = "Document", order = 30) Hyperlink document) {
}

new InvoiceLine("2026/101", new BigDecimal("4200.00"),
        Hyperlink.of("https://billing.example.com/invoices/2026-101", "Open invoice"));
```

- Gli indirizzi ammessi sono `http`, `https` e `mailto`. Vengono controllati quando l'`Hyperlink` viene creato, quindi un indirizzo non valido fallisce nel codice che costruisce i dati, non durante la generazione.
- Senza testo, la cella mostra l'indirizzo.
- Qualsiasi converter può produrre un collegamento con `CellValue.link`, la nuova forma di `CellValue`. Un tipo di dominio come un numero d'ordine può quindi diventare un collegamento alla pagina dell'ordine.
- Excel accetta al massimo 65.530 collegamenti in un foglio: oltre questo limite la generazione fallisce, invece di produrre un file che Excel riparerebbe rimuovendo ogni collegamento.

I collegamenti ipertestuali sono descritti nella [sezione 11.5](#115-collegamenti-ipertestuali).

### 1.3 Template di foglio

Nella 1.0.0 un foglio di stile condivide gli stili con nome tra le classi sheet, ma il resto della configurazione (preset, colore di accento, stile del titolo, filtro automatico, cornice e quale stile va in quale slot) si ripete su ogni classe sheet. La versione 1.1.0 aggiunge il **template di foglio**: una classe annotata con `@ExcelSheetTemplate` che dichiara quella configurazione una sola volta. Le classi sheet lo referenziano con `@ExcelSheet(template = ...)`.

L'esempio seguente è un'applicazione che produce molti report, ciascuno con le proprie colonne, tutti con lo stesso aspetto aziendale.

Il foglio di stile è lo stesso in entrambe le versioni:

```java
@ExcelStyleSheet
@ExcelStyle(name = "corp-title", fontSize = 14, bold = Toggle.TRUE)
@ExcelStyle(name = "corp-header", bold = Toggle.TRUE, align = Align.CENTER)
@ExcelStyle(name = "corp-total", bold = Toggle.TRUE, borderTop = Border.DOUBLE)
public final class CorporateStyles {
    private CorporateStyles() {
    }
}
```

**Prima, con la 1.0.0.** Ogni classe sheet ripete l'intera configurazione:

```java
@ExcelSheet(
        title = "Invoices Q3",
        preset = TablePreset.MEDIUM,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = true,
        outerBorder = Border.MEDIUM,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(lastRow = "corp-total"))
public record InvoiceLine(
        @ExcelColumn(header = "Number", order = 10) String number,
        @ExcelColumn(header = "Issued", order = 20) LocalDate issued,
        @ExcelColumn(header = "Amount", order = 30, format = "#,##0.00") BigDecimal amount) {
}

@ExcelSheet(
        title = "Staff",
        preset = TablePreset.MEDIUM,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = true,
        outerBorder = Border.MEDIUM,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(lastRow = "corp-total"))
public record EmployeeLine(
        @ExcelColumn(header = "Name", order = 10) String name,
        @ExcelColumn(header = "Hired", order = 20) LocalDate hired) {
}
```

**Dopo, con la 1.1.0.** La configurazione viene dichiarata una sola volta, nel template:

```java
@ExcelSheetTemplate(
        preset = TablePreset.MEDIUM,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = Toggle.TRUE,
        outerBorder = Border.MEDIUM,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(lastRow = "corp-total"))
public final class CorporateReport {
    private CorporateReport() {
    }
}
```

e ogni classe sheet dichiara soltanto il proprio titolo, il proprio template e le proprie colonne:

```java
@ExcelSheet(title = "Invoices Q3", template = CorporateReport.class)
public record InvoiceLine(
        @ExcelColumn(header = "Number", order = 10) String number,
        @ExcelColumn(header = "Issued", order = 20) LocalDate issued,
        @ExcelColumn(header = "Amount", order = 30, format = "#,##0.00") BigDecimal amount) {
}

@ExcelSheet(title = "Staff", template = CorporateReport.class)
public record EmployeeLine(
        @ExcelColumn(header = "Name", order = 10) String name,
        @ExcelColumn(header = "Hired", order = 20) LocalDate hired) {
}
```

Una classe sheet può comunque impostare da sé qualsiasi attributo, tranne il preset, e ciò che imposta vince sul template: un report molto grande può disattivare il dimensionamento automatico, il report di un altro reparto può usare un proprio colore di accento.

Che cosa cambia nella manutenzione di molti report:

| Attività | 1.0.0 | 1.1.0 |
| --- | --- | --- |
| Configurazione dello stile su ogni classe sheet | una decina di righe | un attributo, `template` |
| Cambiare il colore aziendale, o aggiungere una cornice a ogni report | ogni classe sheet | il template |
| Un report che dimentica il filtro automatico, o sbaglia a scrivere un colore | possibile, e inosservato | non possibile, salvo che la classe sheet lo imposti di proposito |
| Condividere l'aspetto tra applicazioni tramite una libreria | solo gli stili con nome | gli stili con nome e l'intera configurazione del foglio |

I template sono descritti nella [sezione 10](#10-stili-condivisi-template-e-stile-aziendale). Portano con sé cinque nuove regole di validazione, da V-21 a V-25 ([sezione 13.3](#133-catalogo-degli-errori-di-configurazione)).

### 1.4 Correzioni

Quando più classi sheet generate insieme referenziavano lo stesso foglio di stile non valido, `generate` segnalava ogni errore del foglio di stile una volta per ciascuna classe sheet. Ora ogni errore viene segnalato una sola volta, come già faceva la validazione all'avvio. Lo stesso vale per i template.

### 1.5 Altre modifiche

- L'integrazione con Spring Boot è compilata con Spring Boot 4.1.2. Apache POI resta invariato, 5.5.1.
- La libreria è compilata e testata su Java 17, 21 e 25.

---

## 2. Migrazione dalla 1.0.0 alla 1.1.0

La versione 1.1.0 contiene due modifiche che interrompono la compilazione di alcune applicazioni, e richiede di ricompilare ogni classe sheet. Questa sezione elenca ciascun caso, l'errore che produce e la correzione. Le applicazioni che non usano gli attributi e i tipi indicati sotto devono solo aggiornare la versione.

| Modifica | Riguarda | Errore | Sezione |
| --- | --- | --- | --- |
| `freezeHeader`, `autoFilter` e `autoSizeColumns` sono `Toggle` | le classi sheet che ne impostano almeno uno | errore di compilazione | [2.2](#22-opzioni-di-layout-di-excelsheet) |
| I valori delle annotazioni vengono letti con i nuovi tipi | ogni classe sheet compilata con la 1.0.0, anche dentro altri jar | `AnnotationTypeMismatchException` a runtime | [2.3](#23-ricompilare-ogni-classe-sheet) |
| `CellValue` ha una settima forma, `CellValue.Link` | il codice con uno `switch` esaustivo su `CellValue` | errore di compilazione | [2.4](#24-switch-esaustivo-su-cellvalue) |
| Più tipi hanno un converter integrato | non si rompe nulla | nessuno | [2.5](#25-nuovi-converter-integrati) |

### 2.1 Aggiornare la versione

```xml
<dependency>
    <groupId>cloud.baldilorenzo.sheetsmith</groupId>
    <artifactId>sheetsmith-spring-boot-starter</artifactId>
    <version>1.1.0</version>
</dependency>
```

Lo stesso vale per `sheetsmith-core` nelle applicazioni senza Spring Boot.

### 2.2 Opzioni di layout di `@ExcelSheet`

`freezeHeader`, `autoFilter` e `autoSizeColumns` cambiano tipo da `boolean` a `Toggle`, così da poter essere lasciati non impostati su una classe sheet e presi dal suo template. Una classe sheet che ne imposta uno non compila più:

```
incompatible types: boolean cannot be converted to cloud.baldilorenzo.sheetsmith.style.Toggle
```

**Correzione.** Scrivere `Toggle.TRUE` al posto di `true` e `Toggle.FALSE` al posto di `false`, e importare `cloud.baldilorenzo.sheetsmith.style.Toggle`.

```java
// 1.0.0
@ExcelSheet(title = "Orders", freezeHeader = false, autoFilter = true)

// 1.1.0
@ExcelSheet(title = "Orders", freezeHeader = Toggle.FALSE, autoFilter = Toggle.TRUE)
```

I valori predefiniti non sono cambiati: quando né la classe sheet né il suo template li impostano, l'intestazione è bloccata, non viene aggiunto alcun filtro automatico e le colonne vengono dimensionate automaticamente. `freezeHeader = true` e `autoSizeColumns = true` ripetono il valore predefinito e possono semplicemente essere rimossi.

### 2.3 Ricompilare ogni classe sheet

I valori delle annotazioni sono memorizzati nelle classi compilate. Una classe sheet compilata con la 1.0.0 che imposta una delle tre opzioni di layout contiene ancora un valore `boolean`, che la 1.1.0 legge come `Toggle`. Succede quando la libreria viene aggiornata e le classi non vengono ricompilate, per esempio dopo una build incrementale dell'IDE che salta i sorgenti non modificati, oppure quando le classi sheet si trovano in un jar compilato con la 1.0.0. In questo caso non c'è alcun errore di compilazione: la prima validazione o generazione della classe fallisce a runtime.

```
java.lang.annotation.AnnotationTypeMismatchException: Incorrectly typed data found for annotation element
public abstract cloud.baldilorenzo.sheetsmith.style.Toggle cloud.baldilorenzo.sheetsmith.annotation.ExcelSheet.autoFilter()
(Found data of type java.lang.Boolean[true])
```

Con la validazione all'avvio attiva, l'applicazione non parte.

**Correzione.** Ricompilare l'applicazione da zero, per esempio con `mvn clean verify`, oppure con il comando di ricompilazione completa dell'IDE: il compilatore segnala allora ogni caso della [sezione 2.2](#22-opzioni-di-layout-di-excelsheet). Anche i jar che contengono classi sheet, come una libreria condivisa di report aziendali, vanno ricompilati e pubblicati con la 1.1.0.

### 2.4 `switch` esaustivo su `CellValue`

`CellValue` è un'interfaccia sealed, e la 1.1.0 aggiunge una settima forma, `CellValue.Link`, per i collegamenti ipertestuali. Il codice che esegue uno `switch` su tutte le forme di `CellValue` senza un ramo `default`, tipicamente nei test di un converter, non compila più:

```
the switch expression does not cover all possible input values
```

(oppure `the switch statement does not cover ...` per un'istruzione `switch`).

**Correzione.** Aggiungere il nuovo caso, oppure un ramo `default`:

```java
static String describe(CellValue value) {
    return switch (value) {
        case CellValue.Text text -> "text " + text.value();
        case CellValue.Numeric numeric -> "number " + numeric.value();
        case CellValue.Bool bool -> "boolean " + bool.value();
        case CellValue.Date date -> "date " + date.value();
        case CellValue.DateTime dateTime -> "date-time " + dateTime.value();
        case CellValue.Link link -> "link " + link.value().address();    // new in 1.1.0
        case CellValue.Blank blank -> "blank";
    };
}
```

Uno `switch` con un ramo `default`, e il codice che usa `instanceof` sulle singole forme, compilano senza modifiche.

### 2.5 Nuovi converter integrati

Le colonne dei tipi elencati nella [sezione 1.1](#11-più-converter-integrati) non hanno più bisogno di un converter. Non si rompe nulla:

- i converter già dichiarati su un campo o registrati per uno di questi tipi continuano a essere usati, perché vincono sempre su quelli integrati;
- una colonna di uno di questi tipi che veniva rifiutata con V-10 ora viene scritta dal converter integrato.

Un converter di applicazione può essere rimosso quando la rappresentazione integrata va bene: confrontare le due prima di rimuoverlo, perché la rappresentazione può essere diversa (per esempio `Currency` viene scritta come codice, `EUR`, non come simbolo).

### 2.6 Lista di controllo

1. Aggiornare la versione della dipendenza.
2. Ricompilare da zero e correggere ogni uso di `freezeHeader`, `autoFilter` e `autoSizeColumns`.
3. Correggere ogni `switch` esaustivo su `CellValue`.
4. Ricompilare e pubblicare i jar che contengono classi sheet.
5. Eseguire i test, e la validazione all'avvio se è attiva.

---

## 3. Introduzione

### 3.1 Cos'è sheetsmith

sheetsmith è una libreria Java open source che genera file Excel in formato `.xlsx` a partire da liste di oggetti Java. È costruita su Apache POI e si integra con Spring Boot tramite un'auto-configurazione, mentre il suo nucleo funziona in qualsiasi applicazione Java.

La struttura e l'aspetto di ciascun foglio vengono descritti una sola volta, con annotazioni poste su una classe Java chiamata **classe sheet**. Il contenuto di ciascun foglio proviene dagli oggetti passati a runtime, un oggetto per ogni riga di dati. La libreria scrive poi il titolo, la riga di intestazione, le righe di dati, gli stili, i formati e le opzioni di layout, e restituisce il file.

### 3.2 Cosa fa sheetsmith

sheetsmith fornisce le seguenti funzionalità nella versione 1.1.0.

| Funzionalità | Descrizione |
| --- | --- |
| Componente di generazione | Un unico componente, `Sheetsmith`, che genera una cartella di lavoro completa e la restituisce come `byte[]` oppure la scrive su un `OutputStream` fornito dal chiamante. |
| Cartelle di lavoro multi-foglio | Una cartella di lavoro può contenere un numero qualsiasi di fogli, ciascuno con la propria classe sheet, nell'ordine scelto dal chiamante. |
| Modello ad annotazioni | Nove annotazioni descrivono il foglio, le sue colonne, i suoi stili con nome, i suoi fogli di stile condivisi e i template, e i punti in cui gli stili si applicano. |
| Colonne opt-in | Diventano colonne solo i campi annotati esplicitamente. Sono supportati record, classi e campi ereditati. |
| Ordine delle colonne obbligatorio e stabile | Ogni colonna dichiara la propria posizione, quindi l'ordine non dipende mai dalla reflection. |
| Stili completi | Si può dichiarare ogni attributo di formattazione delle celle esposto da Apache POI: allineamento, a capo automatico, rotazione, rientro, bordi e colori dei bordi, riempimenti, caratteri, formati dei dati, flag di protezione e prefisso apice. |
| Stili basati sui ruoli | Gli stili possono avere come destinazione ogni cella di dati, le righe dispari e pari, la prima e l'ultima riga di dati, la prima e l'ultima colonna, una singola colonna, l'intestazione, l'intestazione di una singola colonna e il titolo. |
| Cascata deterministica | Gli stili si combinano attributo per attributo seguendo un ordine fisso e documentato, quindi il risultato di qualsiasi combinazione è prevedibile. |
| Preset | Tre stili di tabella già pronti (`LIGHT`, `MEDIUM`, `DARK`) generati a partire da un unico colore di accento, che possono essere sovrascritti in parte. |
| Fogli di stile condivisi | Gli stili con nome possono essere dichiarati una sola volta in una classe foglio di stile e riutilizzati da un numero qualsiasi di classi sheet, il che permette a tutti i report di un'applicazione o di un'organizzazione di condividere lo stesso aspetto aziendale. |
| Template di foglio | L'intera configurazione di un foglio (preset, colore di accento, fogli di stile, stile del titolo, opzioni di layout, cornice e associazione tra slot e stili) può essere dichiarata una sola volta in un template e riusata da un numero qualsiasi di classi sheet, che possono comunque sovrascriverla. |
| Tipi di cella nativi | Testo, numeri, booleani, enum, date e date con ora (`LocalDate`, `LocalDateTime`, `java.sql.Date`, `java.sql.Timestamp`) vengono scritti come valori Excel nativi. Identificativi, risorse, valute, fusi orari, impostazioni locali, mesi, anni e numeri opzionali vengono scritti senza alcun converter. |
| Collegamenti ipertestuali | I campi di tipo `Hyperlink` diventano collegamenti cliccabili a pagine web o indirizzi e-mail, e qualsiasi converter può produrre un collegamento. |
| Converter | Qualsiasi altro tipo è supportato tramite converter, dichiarati su una singola colonna o registrati per un tipo in tutta l'applicazione. |
| Formati predefiniti | Formati predefiniti a livello di applicazione per date, date con ora e numeri, applicati quando una cella non ha un formato esplicito. |
| Opzioni di layout | Riga del titolo opzionale unita su tutta la tabella, intestazione bloccata, filtro automatico, larghezze di colonna esplicite, dimensionamento automatico delle colonne con un ripiego per gli ambienti privi di font, e una cornice esterna attorno alla tabella. |
| Proprietà del documento | Autore e applicazione configurabili, registrati in ogni file generato. |
| Validazione fail-fast | Venticinque regole di validazione (da V-01 a V-25) rilevano gli errori di configurazione prima che venga scritto qualsiasi dato. Tutti gli errori vengono segnalati insieme, ciascuno una sola volta, con un codice stabile, la classe e l'elemento coinvolti. |
| Validazione all'avvio | Nelle applicazioni Spring Boot, le classi sheet e i template dei package scelti possono essere validati all'avvio dell'applicazione. |
| Errori di runtime precisi | I problemi sui dati vengono segnalati con il nome del foglio, la riga di dati e il campo. |
| Thread safety | Un generatore è immutabile e thread-safe, e mette in cache i metadati di ciascuna classe sheet dopo il primo utilizzo. |

### 3.3 Ambito della versione 1.1.0

La versione 1.1.0 scrive solo file `.xlsx` e costruisce ogni cartella di lavoro interamente in memoria prima di scriverla. Non fanno parte della libreria: la lettura di file Excel, il formato legacy `.xls`, le formule, i grafici, le immagini, la formattazione condizionale, la validazione dei dati, i commenti alle celle, la protezione dei fogli, le tabelle Excel native, i collegamenti ad altri fogli o celle della cartella di lavoro e la traduzione dei testi di intestazione. I testi di intestazione vengono scritti esattamente come dichiarati, quindi la localizzazione, quando serve, viene eseguita dall'applicazione prima o intorno alla generazione.

Le evoluzioni pianificate e valutate sono elencate nella [sezione 17](#17-lavori-in-corso).

### 3.4 Requisiti

| Requisito | Valore |
| --- | --- |
| Java | 17 o successiva (compilata e testata su Java 17, 21 e 25) |
| Spring Boot | 4.x, solo per l'integrazione con Spring Boot |
| Apache POI | fornito in modo transitivo da `sheetsmith-core` (POI 5.5.1 per sheetsmith 1.1.0) |
| Formato di output | `.xlsx` (Office Open XML) |

### 3.5 Moduli e coordinate

La libreria è pubblicata come tre artefatti Maven sotto il gruppo `cloud.baldilorenzo.sheetsmith`.

| Artefatto | Contenuto | Dipende da Spring |
| --- | --- | --- |
| `sheetsmith-core` | Annotazioni, estrazione dei metadati e validazione, risoluzione degli stili, preset, converter, scrittura della cartella di lavoro. | No |
| `sheetsmith-spring-boot-autoconfigure` | L'auto-configurazione: il bean `Sheetsmith`, le proprietà `sheetsmith.*`, la converter factory di Spring, il validatore all'avvio. | Sì |
| `sheetsmith-spring-boot-starter` | Nessun codice. Porta con sé i due moduli precedenti e `spring-boot-starter`. | Sì |

**Quale artefatto importare.**

- Un'applicazione Spring Boot importa solo lo starter:

```xml
<dependency>
    <groupId>cloud.baldilorenzo.sheetsmith</groupId>
    <artifactId>sheetsmith-spring-boot-starter</artifactId>
    <version>1.1.0</version>
</dependency>
```

- Qualsiasi altra applicazione Java importa solo il core:

```xml
<dependency>
    <groupId>cloud.baldilorenzo.sheetsmith</groupId>
    <artifactId>sheetsmith-core</artifactId>
    <version>1.1.0</version>
</dependency>
```

Con Gradle le coordinate sono le stesse: `implementation("cloud.baldilorenzo.sheetsmith:sheetsmith-spring-boot-starter:1.1.0")` oppure `implementation("cloud.baldilorenzo.sheetsmith:sheetsmith-core:1.1.0")`.

L'artefatto `sheetsmith-spring-boot-autoconfigure` non è pensato per essere importato direttamente.

### 3.6 Package

| Package | Contenuto |
| --- | --- |
| `cloud.baldilorenzo.sheetsmith` | Il generatore, i dati del foglio, i valori predefiniti dell'applicazione, le proprietà del documento e le eccezioni. |
| `cloud.baldilorenzo.sheetsmith.annotation` | Le annotazioni che descrivono una classe sheet, i suoi stili e il suo template. |
| `cloud.baldilorenzo.sheetsmith.style` | Le enum usate come valori degli attributi di stile, e i preset. |
| `cloud.baldilorenzo.sheetsmith.convert` | Il contratto dei converter e i valori delle celle. |
| `cloud.baldilorenzo.sheetsmith.value` | Tipi di valore forniti da sheetsmith: `Hyperlink`. |
| `cloud.baldilorenzo.sheetsmith.autoconfigure` | L'auto-configurazione di Spring Boot (in `sheetsmith-spring-boot-autoconfigure`). |
| `cloud.baldilorenzo.sheetsmith.internal` e sottopackage | Implementazione. Non fa parte dell'API: vedere l'[Appendice A](#appendice-a-censimento-delle-classi). |

---

## 4. Avvio rapido

### 4.1 Applicazione Spring Boot

**Passo 1. Aggiungere lo starter** come mostrato nella [sezione 3.5](#35-moduli-e-coordinate). Non è richiesta alcuna configurazione: l'auto-configurazione registra un bean `Sheetsmith`.

**Passo 2. Descrivere il foglio** con una classe sheet. Un record è la forma più compatta:

```java
import cloud.baldilorenzo.sheetsmith.annotation.ExcelColumn;
import cloud.baldilorenzo.sheetsmith.annotation.ExcelSheet;
import cloud.baldilorenzo.sheetsmith.style.TablePreset;
import cloud.baldilorenzo.sheetsmith.style.Toggle;

import java.math.BigDecimal;
import java.time.LocalDate;

@ExcelSheet(title = "Customers", preset = TablePreset.MEDIUM, accentColor = "#1F4E79", autoFilter = Toggle.TRUE)
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

### 4.2 Applicazione Java semplice

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

### 4.3 Download da un controller Spring MVC

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

I dati vengono caricati prima che il corpo della risposta sia prodotto, quindi un errore del database produce comunque una normale risposta di errore. La variante con stream non scrive nulla sullo stream quando si verifica un errore di configurazione o di generazione, perché la cartella di lavoro è completa prima che inizi la serializzazione: vedere la [sezione 7.2.2](#722-generatelistsheetdata-outputstream). Con un corpo in streaming, tuttavia, il servlet container può aver già inviato lo stato e gli header quando la generazione viene eseguita, quindi un'eccezione a quel punto non può più diventare una risposta di errore pulita. Quando serve una risposta di errore garantita, generare prima i byte e poi restituirli:

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

I due approcci usano praticamente la stessa memoria: vedere la [sezione 7.2.3](#723-scelta-tra-byte-e-outputstream). Validare le classi sheet all'avvio ([sezione 12.4](#124-validazione-allavvio)) elimina gli errori di configurazione dal percorso della richiesta in entrambi i casi.

---

## 5. Concetti

Questa sezione spiega il modello mentale della libreria. Il riferimento preciso di ogni elemento segue nelle sezioni da 6 a 13.

### 5.1 Classe sheet, colonne e dati

Una **classe sheet** è una classe o un record Java annotato con `@ExcelSheet`. Descrive una tabella: il suo titolo opzionale, le sue colonne, i suoi stili e le sue opzioni di layout.

Una **colonna** è un campo della classe sheet annotato con `@ExcelColumn`. Ogni colonna ha un testo di intestazione e un ordine. I campi senza `@ExcelColumn` vengono ignorati: l'esportazione è opt-in, quindi aggiungere un campo a una classe non aggiunge mai una colonna per caso.

I **dati** di un foglio sono una lista di istanze della classe sheet (o delle sue sottoclassi). Ogni elemento diventa una riga di dati, nell'ordine della lista. Il primo elemento è la riga di dati 1.

L'abbinamento di un nome di foglio, di una classe sheet e di una lista di dati è un **`SheetData`**. Una cartella di lavoro viene generata a partire da una lista ordinata di `SheetData`.

```
List<SheetData<?>>                     workbook
 ├── SheetData("Customers", CustomerRow.class, customers)   → sheet 1
 └── SheetData("Orders",    OrderRow.class,    orders)      → sheet 2
```

### 5.2 Anatomia di un foglio generato

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

### 5.3 Ordine delle colonne

Ogni colonna dichiara un `order` intero. Le colonne compaiono da sinistra a destra in ordine crescente. I valori devono essere univoci all'interno della classe sheet, colonne ereditate comprese, ma non devono essere consecutivi. Numerare a passi di 10 (10, 20, 30) lascia spazio per inserire colonne in seguito senza rinumerare. L'ordine è obbligatorio perché l'API di reflection di Java non garantisce l'ordine di dichiarazione dei campi.

### 5.4 Record, classi ed ereditarietà

Sia i record sia le classi ordinarie possono essere classi sheet.

- **Record.** `@ExcelColumn` si scrive sul componente del record. Si applica al campo del componente e il valore viene letto tramite l'accessor del componente.
- **Classi.** `@ExcelColumn` si scrive sul campo. Il valore viene letto tramite un getter pubblico quando ne esiste uno adatto, altrimenti direttamente dal campo, anche se è privato. Le regole esatte sono nella [sezione 6.2.1](#621-accesso-al-valore).
- **Ereditarietà.** Anche i campi annotati delle superclassi sono colonne. Vengono raccolti dalla superclasse più alta fino alla classe sheet e poi ordinati per `order`. `@ExcelSheet` non è ereditata: ogni classe passata a un `SheetData` porta la propria `@ExcelSheet`. Una superclasse che contribuisce solo con colonne non ne ha bisogno. Nemmeno gli stili con nome (`@ExcelStyle`) sono ereditati: vengono letti solo dalla classe sheet, insieme a quelli dei suoi fogli di stile e dei fogli di stile del suo template.
- **Istanze di sottoclassi.** Un `SheetData` di una classe sheet accetta istanze delle sue sottoclassi. Le colonne sono sempre quelle della classe sheet passata come tipo.

### 5.5 Valori null ed elementi null

- Un **valore null di un campo** produce una cella vuota che mantiene lo stile risolto, così riempimenti e bordi restano continui lungo la riga e la colonna. Il converter non viene chiamato.
- Un **elemento null** nella lista dei dati è un errore: viene segnalato come `SheetsmithGenerationException` che indica il foglio e la riga di dati.

### 5.6 Stili con nome e slot

L'aspetto di una tabella è descritto con due concetti.

Uno **stile con nome** è un insieme di attributi di formattazione, dichiarato una sola volta con `@ExcelStyle` e identificato da un nome. Uno stile con nome non fa nulla di per sé.

Uno **slot** è un punto in cui uno stile con nome viene applicato, per nome. Gli slot sono:

| Slot | Dichiarato in | Si applica a |
| --- | --- | --- |
| `titleStyle` | `@ExcelSheet` o `@ExcelSheetTemplate` | la riga del titolo |
| `header.base` | `@ExcelSheet(header = @HeaderStyles(...))` | ogni cella di intestazione |
| `header.firstColumn`, `header.lastColumn` | `@HeaderStyles` | la cella di intestazione della prima o dell'ultima colonna |
| `headerStyle` | `@ExcelColumn` | la cella di intestazione di una colonna |
| `body.base` | `@ExcelSheet(body = @BodyStyles(...))` | ogni cella di dati |
| `body.odd`, `body.even` | `@BodyStyles` | le celle di dati delle righe dispari o pari |
| `body.firstRow`, `body.lastRow` | `@BodyStyles` | le celle di dati della prima o dell'ultima riga di dati |
| `body.firstColumn`, `body.lastColumn` | `@BodyStyles` | le celle di dati della prima o dell'ultima colonna |
| `styles.base`, `styles.odd`, `styles.even`, `styles.firstRow`, `styles.lastRow` | `@ExcelColumn(styles = @ColumnStyles(...))` | le celle di dati di una colonna, eventualmente limitate alle righe dispari, pari, prima o ultima |

Uno stile con nome può essere referenziato da un numero qualsiasi di slot. Gli slot del titolo, dell'intestazione e del corpo possono anche essere dichiarati una sola volta in un template di foglio ([sezione 10.7](#107-template-di-foglio)): uno slot impostato sulla classe sheet vince sullo stesso slot del suo template.

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

### 5.7 Attributi non impostati

Ogni attributo di uno stile con nome, a parte il nome, ha un valore predefinito che significa **non impostato**. Un attributo non impostato non sovrascrive nulla: lascia il valore deciso dai livelli inferiori. Poiché gli attributi delle annotazioni non possono essere null, "non impostato" è rappresentato come segue:

| Tipo di attributo | Valore non impostato |
| --- | --- |
| Attributi enum (`align`, `border`, `fillPattern`, `underline`, ...) | la costante `INHERIT` dell'enum |
| Attributi sì/no (`bold`, `wrapText`, `locked`, ...) | `Toggle.INHERIT` (i tre stati sono `INHERIT`, `TRUE`, `FALSE`) |
| Attributi numerici (`rotation`, `indent`, `fontSize` e `@ExcelColumn.width`) | `ExcelStyle.UNSET`, uguale a `Integer.MIN_VALUE` |
| Attributi di testo (colori, nome del font, formato dei dati) | la stringa vuota |

`Integer.MIN_VALUE` viene usato al posto di `-1` perché `-1` è una rotazione valida. Per gli attributi sì o no non si usa un semplice `boolean` perché non può esprimere "non impostato": `Toggle.FALSE` disattiva esplicitamente un attributo, mentre `Toggle.INHERIT` lo lascia ai livelli inferiori. Per lo stesso motivo anche le opzioni di layout di `@ExcelSheet` (`freezeHeader`, `autoFilter`, `autoSizeColumns`) sono `Toggle`: `INHERIT` lascia la scelta al template della classe, se presente, e poi al valore predefinito della libreria.

### 5.8 Ruoli

Il **ruolo** di una cella di dati è la sua posizione nella tabella e decide quali slot le si applicano:

- **riga dispari o pari.** Le righe di dati sono numerate da 1, nell'ordine della lista, quindi la prima riga di dati è dispari.
- **prima riga e ultima riga.** Il primo e l'ultimo elemento della lista dei dati.
- **prima colonna e ultima colonna.** In base alla posizione dopo l'ordinamento per `order`.

I ruoli sono indipendenti tra loro. Con una sola riga di dati, quella riga è sia la prima sia l'ultima. Con una sola colonna, questa è sia la prima sia l'ultima. Una cella di intestazione ha solo i ruoli di prima e ultima colonna. Il titolo non ha alcun ruolo.

### 5.9 La cascata

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

**I template non sono un livello della cascata.** Quando una classe sheet referenzia un template, i due vengono fusi prima della cascata, attributo per attributo e slot per slot ([sezione 10.10](#1010-che-cosa-prende-una-classe-sheet-dal-suo-template)). La cascata lavora poi sulla configurazione fusa, esattamente come se ogni attributo fosse stato dichiarato sulla classe sheet.

**Celle con collegamento.** Dopo la cascata, una cella scritta come collegamento riceve l'aspetto di un collegamento, una sottolineatura singola e il colore `#0563C1`, per ciascuno dei due attributi che nessun livello ha impostato ([sezione 11.5.4](#1154-aspetto)).

### 5.10 Regole di precedenza che derivano dalla cascata

L'ordine della cascata produce un piccolo numero di regole da ricordare:

1. **La riga vince sulla colonna.** Quando uno slot di riga del corpo (`firstRow`, `lastRow`) e uno slot di colonna del corpo (`firstColumn`, `lastColumn`) impostano lo stesso attributo sulla stessa cella, vince lo slot di riga, perché viene applicato dopo.
2. **Il primo vince sull'ultimo.** Con una sola riga di dati, `lastRow` viene applicato prima di `firstRow`, quindi vince `firstRow`. Con una sola colonna, `firstColumn` vince su `lastColumn`. Lo stesso vale per gli slot di colonna dell'intestazione e per gli slot di riga della colonna.
3. **La colonna è il livello più specifico.** Gli slot di colonna vengono dopo ogni livello della tabella, quindi una colonna può sempre sovrascrivere la tabella. Solo il `format` della colonna viene dopo di essi.
4. **Intestazione e dati sono separati.** Gli slot di intestazione e gli stili di intestazione delle colonne non si applicano mai alle celle di dati. Gli slot del corpo e delle colonne non si applicano mai alle celle di intestazione. Nessuno di essi si applica al titolo. L'intestazione non eredita nulla dal corpo.
5. **La cornice cede agli slot di ruolo.** La cornice esterna si colloca sopra i livelli base e dispari o pari e sotto gli slot di ruolo: uno slot di prima o ultima riga o colonna, uno slot di colonna o uno stile di intestazione di colonna che imposta un lato del bordo sovrascrive la cornice su quel lato.
6. **Il formato della colonna è definitivo.** `@ExcelColumn.format` vince sul `dataFormat` di ogni stile applicato alla cella e sui formati predefiniti dell'applicazione.
7. **Il locale vince sul condiviso.** Uno stile con nome dichiarato sulla classe sheet sostituisce interamente uno stile con lo stesso nome proveniente da un foglio di stile: i due non vengono uniti.
8. **Qualsiasi stile dichiarato vince sul preset.** Il preset è il livello più basso di ogni cascata.
9. **La classe sheet vince sul suo template.** Ogni attributo e ogni slot impostato sulla classe sheet vince sul suo template, tranne il preset, che quando c'è un template sceglie solo il template. Tra stili con nome con lo stesso nome, lo stile dichiarato sulla classe sheet vince sui fogli di stile della classe, che vincono sui fogli di stile del template.

### 5.11 Preset

Un **preset** è uno stile di tabella già pronto generato dalla libreria a partire da un colore di accento. Produce un livello per il titolo, un livello per l'intestazione e livelli per il corpo (base, dispari, pari), applicati sotto ogni stile dichiarato. Un preset si sceglie per classe sheet (`@ExcelSheet.preset`), per template (`@ExcelSheetTemplate.preset`) o per l'intera applicazione (valori predefiniti dell'applicazione), e può essere regolato con normali stili con nome. I preset sono descritti nella [sezione 9](#9-preset).

### 5.12 Converter

Ogni valore di campo viene trasformato in un **valore di cella** da un **converter** prima di essere scritto. I converter integrati coprono testo, numeri, booleani, enum, date e date con ora, collegamenti ipertestuali e tipi comuni come `UUID`, `Currency` o `YearMonth` ([sezione 11.2](#112-converter-integrati)). Qualsiasi altro tipo richiede un converter, dichiarato su una colonna (converter di campo) o registrato per un tipo in tutta l'applicazione (converter di applicazione). Il converter di ciascuna colonna viene scelto una sola volta, a partire dal tipo dichiarato del campo. I converter sono descritti nella [sezione 11](#11-converter).

### 5.13 Ciclo di vita di una generazione

Quando viene chiamato `generate`, la libreria:

1. valida l'input: la lista non è vuota, i nomi dei fogli sono validi e univoci (da V-18 a V-20);
2. per ogni classe sheet distinta, ottiene i suoi metadati validati, fusi con il suo template se presente (da V-01 a V-09, da V-13 a V-17, da V-21 a V-25), e associa un converter a ciascuna colonna (da V-10 a V-12), usando le cache per classe quando disponibili;
3. se è stato trovato un errore di configurazione, lancia una sola `SheetsmithConfigurationException` che li elenca tutti, ciascuno una sola volta, e non scrive nulla;
4. crea una nuova cartella di lavoro e registra le proprietà del documento;
5. scrive ogni foglio: titolo, intestazione, righe di dati (leggendo ogni valore, convertendolo, scegliendo lo stile effettivo), quindi riquadro bloccato, filtro automatico e larghezze delle colonne;
6. serializza la cartella di lavoro sullo stream, esegue il flush dello stream e rilascia la cartella di lavoro.

I problemi sui dati rilevati durante il passo 5 interrompono la generazione con una `SheetsmithGenerationException`. In tal caso non viene scritto nulla in output.

### 5.14 Cache e thread safety

- I **metadati** di una classe sheet (colonne, stili risolti, accessor dei valori, configurazione fusa con il suo template) vengono calcolati e validati al primo utilizzo, poi messi in cache per classe e condivisi da ogni generatore. La cache non trattiene i class loader, cosa che conta con gli strumenti di sviluppo che riavviano l'applicazione.
- L'**associazione dei converter** di una classe sheet è messa in cache per generatore, perché dipende dai converter configurati su quel generatore.
- Una **classe che non supera la validazione non viene messa in cache**: viene rifiutata a ogni chiamata, con gli stessi errori, finché non viene corretta.
- Un **generatore** è immutabile e thread-safe. Ogni generazione costruisce la propria cartella di lavoro, quindi le chiamate concorrenti non interferiscono. I converter sono condivisi tra generazioni concorrenti e devono essere thread-safe.
- All'interno di una generazione, lo stile effettivo di ogni combinazione distinta di colonna, parità della riga, prima o ultima riga e tipo di valore viene calcolato una volta per foglio e riutilizzato per ogni cella con quella combinazione. Gli stili effettivi uguali condividono un unico stile di cella Excel, i font e i formati dei dati vengono deduplicati, quindi il numero di stili di cella in un file dipende dal numero di stili distinti e mai dal numero di celle.

---

## 6. Riferimento delle annotazioni

Tutte le annotazioni si trovano nel package `cloud.baldilorenzo.sheetsmith.annotation` e sono mantenute a runtime.

| Annotazione | Destinazione | Scopo |
| --- | --- | --- |
| `@ExcelSheet` | classe, record, interfaccia | Contrassegna una classe sheet e configura la tabella nel suo insieme. Obbligatoria su ogni classe sheet. |
| `@ExcelColumn` | campo, componente di record | Esporta un campo come colonna e lo configura. |
| `@ExcelStyle` | classe (ripetibile) | Dichiara uno stile con nome. |
| `@ExcelStyles` | classe | Contenitore di `@ExcelStyle` ripetute, generato dal compilatore. Non si scrive a mano. |
| `@ExcelStyleSheet` | classe | Contrassegna una classe che contiene stili con nome condivisi. |
| `@ExcelSheetTemplate` | classe | Contrassegna un template di foglio: una classe che dichiara una configurazione di foglio condivisa da più classi sheet. |
| `@HeaderStyles` | solo valore di attributo | Slot dell'intestazione, valore di `@ExcelSheet.header` e di `@ExcelSheetTemplate.header`. |
| `@BodyStyles` | solo valore di attributo | Slot del corpo a livello di tabella, valore di `@ExcelSheet.body` e di `@ExcelSheetTemplate.body`. |
| `@ColumnStyles` | solo valore di attributo | Slot del corpo di una colonna, valore di `@ExcelColumn.styles`. |

Ogni attributo qui sotto è documentato con lo stesso modello: tipo, valore predefinito, valori ammessi, effetto, interazioni con altri attributi, regole di validazione correlate ed esempio.

### 6.1 `@ExcelSheet`

Contrassegna una classe come classe sheet e ne configura il foglio: titolo, preset, fogli di stile condivisi, template, opzioni di layout e slot di intestazione e corpo.

- **Obbligatoria** su ogni classe passata a `SheetData`. Una classe che ne è priva viola la regola V-01.
- **Non ereditata.** Ogni classe esportata porta la propria `@ExcelSheet`. Le superclassi che contribuiscono solo con colonne non ne hanno bisogno.
- **Può prendere la configurazione da un template.** Con `template`, la classe prende da un template di foglio ogni attributo che non imposta da sé ([sezione 6.1.13](#6113-template)).
- **Ogni attributo è opzionale.** Con tutti i valori predefiniti, il foglio non ha titolo, ha l'intestazione bloccata, colonne dimensionate automaticamente, nessun filtro automatico, nessuna cornice e nessuno stile diverso dal preset predefinito dell'applicazione (che è `NONE` se non configurato).

Riepilogo degli attributi:

| Attributo | Tipo | Valore predefinito |
| --- | --- | --- |
| `title` | `String` | `""` (nessun titolo) |
| `titleStyle` | `String` | `""` (nessuno stile) |
| `preset` | `TablePreset` | `INHERIT` (template, poi predefinito dell'applicazione) |
| `accentColor` | `String` | `""` (template, poi predefinito dell'applicazione) |
| `styleSheets` | `Class<?>[]` | `{}` |
| `freezeHeader` | `Toggle` | `INHERIT` (template, poi bloccata) |
| `autoFilter` | `Toggle` | `INHERIT` (template, poi nessun filtro automatico) |
| `autoSizeColumns` | `Toggle` | `INHERIT` (template, poi dimensionamento automatico) |
| `outerBorder` | `Border` | `INHERIT` (template, poi nessuna cornice) |
| `outerBorderColor` | `String` | `""` (template, poi colore automatico) |
| `header` | `HeaderStyles` | `@HeaderStyles` (nessuno slot impostato) |
| `body` | `BodyStyles` | `@BodyStyles` (nessuno slot impostato) |
| `template` | `Class<?>` | `ExcelSheetTemplate.None.class` (nessun template) |

Quando la classe referenzia un template, "template, poi ..." significa che un attributo lasciato non impostato sulla classe viene preso dal template, e il valore predefinito si applica solo quando anche il template lo lascia non impostato.

#### 6.1.1 `title`

| | |
| --- | --- |
| Tipo | `String` |
| Valore predefinito | `""`, cioè nessuna riga del titolo |
| Valori ammessi | qualsiasi testo; scritto così com'è |
| Effetto | Aggiunge una riga sopra l'intestazione. Il testo viene scritto nella prima colonna e la cella viene unita su tutte le colonne della tabella. Ogni cella della riga del titolo riceve lo stile del titolo. |
| Interazioni | Il titolo non ha alcun ruolo: gli slot di intestazione e corpo non si applicano mai ad esso. È fuori dalla cornice esterna. Viene bloccato insieme all'intestazione quando l'intestazione è bloccata. È escluso dal filtro automatico. Il suo stile è il livello del titolo del preset (se presente) seguito da `titleStyle`. Con una sola colonna non c'è nulla da unire: il titolo resta nell'unica cella. |
| Validazione | Nessuna sul testo in sé. `titleStyle` richiede un titolo (V-15). |

```java
@ExcelSheet(title = "Open invoices at 30/09/2026")
public record InvoiceRow(/* columns */) { }
```

#### 6.1.2 `titleStyle`

| | |
| --- | --- |
| Tipo | `String`, il nome di uno stile con nome |
| Valore predefinito | `""`, cioè nessuno stile |
| Valori ammessi | il nome di uno stile disponibile alla classe: dichiarato sulla classe, su uno dei suoi `styleSheets` o su uno dei fogli di stile del suo template |
| Effetto | Applicato a ogni cella della riga del titolo, dopo il livello del titolo del preset. |
| Interazioni | Ammesso solo quando `title` è impostato. Quando è vuoto, si applica lo stile del titolo del template, se presente. Uno stile del titolo impostato dal template viene ignorato, senza errore, quando la classe non ha un titolo. |
| Validazione | V-15 quando `title` è vuoto; V-06 quando il nome non esiste. |

```java
@ExcelSheet(title = "Quarterly sales", titleStyle = "title")
@ExcelStyle(name = "title", fontSize = 16, bold = Toggle.TRUE, fontColor = "#1F4E79")
public record SalesRow(/* columns */) { }
```

#### 6.1.3 `preset`

| | |
| --- | --- |
| Tipo | `TablePreset` |
| Valore predefinito | `TablePreset.INHERIT` |
| Valori ammessi | `INHERIT`, `NONE`, `LIGHT`, `MEDIUM`, `DARK` |
| Effetto | `INHERIT` usa il preset del template, se la classe ne referenzia uno, altrimenti il preset predefinito dell'applicazione (`SheetsmithDefaults.preset`, proprietà `sheetsmith.preset`, `NONE` se non configurato). `NONE` non applica alcun preset indipendentemente dal valore predefinito dell'applicazione. `LIGHT`, `MEDIUM` e `DARK` applicano il preset corrispondente. |
| Interazioni | Il preset è il livello più basso delle cascate di titolo, intestazione e corpo: ogni stile dichiarato lo sovrascrive attributo per attributo. I colori del preset derivano dal colore di accento effettivo. Una classe che referenzia un template non può impostare un preset: lo sceglie il template. |
| Validazione | V-22 quando è impostato insieme a `template`. |

```java
@ExcelSheet(preset = TablePreset.LIGHT)      // always LIGHT
@ExcelSheet(preset = TablePreset.NONE)       // never a preset, even if the application default is one
@ExcelSheet                                  // the application default preset
```

#### 6.1.4 `accentColor`

| | |
| --- | --- |
| Tipo | `String`, un colore |
| Valore predefinito | `""`, cioè il colore di accento del template, se ne imposta uno, altrimenti il colore di accento predefinito dell'applicazione (`#4472C4` se non configurato) |
| Valori ammessi | `#RRGGBB` in maiuscolo o minuscolo, oppure il nome di una costante `IndexedColors` di Apache POI (vedere la [sezione 8.2](#82-colori)) |
| Effetto | Il colore da cui il preset deriva ogni tonalità. I valori esadecimali vengono normalizzati in maiuscolo. |
| Interazioni | Ha effetto solo quando il preset effettivo non è `NONE`. Vince sul colore di accento del template: lo stesso template può essere usato in colori diversi. |
| Validazione | V-13 per qualsiasi altro valore non vuoto. |

```java
@ExcelSheet(preset = TablePreset.MEDIUM, accentColor = "#2E7D32")
```

#### 6.1.5 `styleSheets`

| | |
| --- | --- |
| Tipo | `Class<?>[]` |
| Valore predefinito | `{}` |
| Valori ammessi | classi annotate con `@ExcelStyleSheet` |
| Effetto | Gli stili con nome dei fogli di stile elencati diventano disponibili per gli slot di questa classe, come se fossero dichiarati su di essa. |
| Interazioni | Uno stile dichiarato sulla classe sheet con lo stesso nome di uno stile di un foglio di stile lo sostituisce interamente (nessuna fusione). Elencare due volte lo stesso foglio di stile non ha effetto. L'ordine dell'elenco non ha effetto. Con un template, gli stili di questi fogli di stile vincono sugli stili con lo stesso nome dei fogli di stile del template, e un foglio di stile elencato sia qui sia nel template non è un conflitto. |
| Validazione | V-09 per una classe elencata senza `@ExcelStyleSheet` (i suoi stili vengono quindi ignorati, per cui i riferimenti ad essi segnalano anche V-06). V-08 quando due fogli di stile elencati dichiarano lo stesso nome. |

```java
@ExcelSheet(styleSheets = {CorporateStyles.class, FinanceStyles.class},
        header = @HeaderStyles(base = "corporate-header"))
```

La sezione 10 è dedicata ai fogli di stile condivisi e ai template.

#### 6.1.6 `freezeHeader`

| | |
| --- | --- |
| Tipo | `Toggle` |
| Valore predefinito | `Toggle.INHERIT`: la scelta del template, se presente, altrimenti bloccata |
| Effetto | `TRUE` blocca le righe fino all'intestazione inclusa, così restano visibili durante lo scorrimento. Quando il foglio ha un titolo, viene bloccata anche la riga del titolo. Nessuna colonna viene bloccata. `FALSE` non blocca nulla. |
| Interazioni | Vince sul template. |
| Validazione | Nessuna. |

```java
@ExcelSheet(freezeHeader = Toggle.FALSE)
```

#### 6.1.7 `autoFilter`

| | |
| --- | --- |
| Tipo | `Toggle` |
| Valore predefinito | `Toggle.INHERIT`: la scelta del template, se presente, altrimenti nessun filtro automatico |
| Effetto | `TRUE` aggiunge un filtro automatico di Excel che copre tutte le colonne, dalla riga di intestazione all'ultima riga di dati. Senza righe di dati copre solo la riga di intestazione. Il titolo non è mai incluso. `FALSE` non ne aggiunge. |
| Interazioni | Vince sul template. |
| Validazione | Nessuna. |

```java
@ExcelSheet(autoFilter = Toggle.TRUE)
```

#### 6.1.8 `autoSizeColumns`

| | |
| --- | --- |
| Tipo | `Toggle` |
| Valore predefinito | `Toggle.INHERIT`: la scelta del template, se presente, altrimenti dimensionamento automatico |
| Effetto | `TRUE` dimensiona in base al contenuto ogni colonna senza una `width` esplicita. `FALSE` lascia quelle colonne alla larghezza scelta dall'applicazione di fogli di calcolo. |
| Interazioni | Le colonne con `@ExcelColumn.width` non vengono mai dimensionate automaticamente. Vince sul template. |
| Validazione | Nessuna. |

Come funziona il dimensionamento:

1. Il dimensionamento è delegato ad Apache POI, che misura il testo con i font installati sulla macchina (Java AWT).
2. Su server o container senza font installati, o senza le librerie native di AWT, questa misurazione può fallire. sheetsmith ripiega allora su una **stima**: la lunghezza in caratteri del valore più lungo della colonna **come lo mostra Excel** (con il suo formato applicato, quindi date e numeri sono misurati come visualizzati), intestazione inclusa e titolo escluso, più 2 caratteri, con un massimo di 255.
3. Il tempo impiegato per il dimensionamento cresce con il numero di righe. Per i fogli di grandi dimensioni, disattivarlo e impostare larghezze esplicite: vedere la [sezione 14.3](#143-esportazioni-molto-grandi).

Un comportamento noto riguarda un foglio con un titolo e **una sola colonna**: vedere la [sezione 14.4](#144-dimensionamento-automatico-delle-colonne).

```java
@ExcelSheet(autoSizeColumns = Toggle.FALSE)
public record LargeRow(
        @ExcelColumn(header = "Id", order = 10, width = 10) long id,
        @ExcelColumn(header = "Description", order = 20, width = 60) String description) { }
```

#### 6.1.9 `outerBorder`

| | |
| --- | --- |
| Tipo | `Border` |
| Valore predefinito | `Border.INHERIT`, cioè la cornice del template, se presente, altrimenti nessuna cornice |
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

#### 6.1.10 `outerBorderColor`

| | |
| --- | --- |
| Tipo | `String`, un colore |
| Valore predefinito | `""`, cioè il colore della cornice del template, se presente, altrimenti il colore automatico (di solito nero) |
| Valori ammessi | `#RRGGBB` oppure un nome di `IndexedColors` |
| Effetto | Colore dei bordi della cornice. I valori esadecimali vengono normalizzati in maiuscolo. |
| Interazioni | Ha effetto solo quando viene disegnata una cornice. `outerBorder` e `outerBorderColor` vengono presi dal template separatamente: un colore della cornice impostato dal template resta quando la classe cambia il colore di accento. |
| Validazione | V-13 per un valore non vuoto non valido. |

#### 6.1.11 `header`

| | |
| --- | --- |
| Tipo | `HeaderStyles` |
| Valore predefinito | `@HeaderStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome della riga di intestazione: vedi [sezione 6.7](#67-headerstyles). Ogni slot impostato qui vince sullo stesso slot del template; gli slot lasciati vuoti mantengono lo stile indicato dal template. |

#### 6.1.12 `body`

| | |
| --- | --- |
| Tipo | `BodyStyles` |
| Valore predefinito | `@BodyStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome delle righe di dati a livello di tabella: vedi [sezione 6.8](#68-bodystyles). Ogni slot impostato qui vince sullo stesso slot del template; gli slot lasciati vuoti mantengono lo stile indicato dal template. |

#### 6.1.13 `template`

| | |
| --- | --- |
| Tipo | `Class<?>` |
| Valore predefinito | `ExcelSheetTemplate.None.class`, cioè nessun template |
| Valori ammessi | una classe annotata con `@ExcelSheetTemplate` |
| Effetto | La classe prende dal template ogni attributo che non imposta da sé: preset, colore di accento, fogli di stile, stile del titolo, opzioni di layout, cornice e slot. Gli stili dei fogli di stile del template diventano disponibili alla classe, come livello più debole. |
| Interazioni | Ogni attributo impostato sulla classe sheet vince sul template, tranne `preset`, che deve restare `INHERIT`. Gli slot vengono presi uno per uno. Le regole precise sono nella [sezione 10.10](#1010-che-cosa-prende-una-classe-sheet-dal-suo-template). Un template non può referenziare un altro template. |
| Validazione | V-21 quando la classe non è un template; V-22 quando è impostato anche `preset`. Il template stesso viene validato con le regole V-06, V-08, V-09, V-13 e da V-23 a V-25, e i suoi errori nominano la classe del template. |

```java
@ExcelSheet(title = "Monthly orders", template = CorporateReport.class)
public record OrderRow(/* columns */) { }

@ExcelSheet(title = "Purchases", template = CorporateReport.class, accentColor = "#7F6000")   // same look, another colour
public record PurchaseRow(/* columns */) { }
```

#### 6.1.14 Esempio completo

```java
@ExcelSheet(
        title = "Invoice 2026/0042",
        titleStyle = "title",
        preset = TablePreset.LIGHT,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        freezeHeader = Toggle.TRUE,
        autoFilter = Toggle.TRUE,
        autoSizeColumns = Toggle.TRUE,
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

### 6.2 `@ExcelColumn`

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

#### 6.2.1 Accesso al valore

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

#### 6.2.2 `header`

| | |
| --- | --- |
| Tipo | `String` |
| Valore predefinito | nessuno: obbligatorio |
| Valori ammessi | qualsiasi testo non vuoto |
| Effetto | Testo della cella di intestazione della colonna, scritto così com'è (nessuna traduzione, nessun trim). |
| Validazione | V-04 quando è vuoto (stringa vuota o solo spazi). |

#### 6.2.3 `order`

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

#### 6.2.4 `width`

| | |
| --- | --- |
| Tipo | `int`, caratteri |
| Valore predefinito | `ExcelStyle.UNSET` |
| Valori ammessi | da 1 a 255, oppure `UNSET` |
| Effetto | Imposta la larghezza della colonna in caratteri (unità di larghezza di Excel del font predefinito). |
| Interazioni | Una colonna con una larghezza esplicita la mantiene ed è esclusa da `autoSizeColumns`. Con `UNSET`, la larghezza deriva dal dimensionamento automatico o, quando è disattivato, dall'applicazione di fogli di calcolo. |
| Validazione | V-14 al di fuori dell'intervallo da 1 a 255. |

#### 6.2.5 `format`

| | |
| --- | --- |
| Tipo | `String`, un codice di formato Excel |
| Valore predefinito | `""`, che lascia il formato agli stili e ai valori predefiniti dell'applicazione |
| Valori ammessi | qualsiasi codice di formato Excel, nella sintassi di Excel descritta nella [sezione 8.6](#86-formati-dei-dati) |
| Effetto | Formato delle celle di dati della colonna. |
| Interazioni | È l'ultimo livello della cascata del corpo: vince sul `dataFormat` di ogni stile applicato alla cella e sui formati predefiniti dell'applicazione. Non si applica alla cella di intestazione. Il formato viene scritto nel file così com'è, senza validazione. |
| Validazione | Nessuna: un codice di formato non valido non viene rilevato da sheetsmith e Excel può mostrarlo come messaggio di riparazione o ignorarlo. |

```java
@ExcelColumn(header = "Due date", order = 30, format = "dd/mm/yyyy") LocalDate due;
@ExcelColumn(header = "Amount", order = 40, format = "#,##0.00 \"EUR\"") BigDecimal amount;
@ExcelColumn(header = "Rate", order = 50, format = "0.0%") double rate;
```

#### 6.2.6 `converter`

| | |
| --- | --- |
| Tipo | `Class<? extends CellConverter<?>>` |
| Valore predefinito | `CellConverter.None.class`, cioè nessun converter di campo |
| Valori ammessi | una classe converter che gestisce un tipo assegnabile dal tipo del campo (i tipi primitivi contano come i rispettivi wrapper) |
| Effetto | I valori di questa colonna vengono convertiti con questo converter invece che con il converter di applicazione o integrato per il tipo del campo. |
| Interazioni | Un'istanza per classe converter e per generatore, condivisa da ogni colonna che la dichiara. Senza Spring, la classe deve essere pubblica con un costruttore pubblico senza argomenti. Con l'auto-configurazione di Spring Boot, viene usato il bean di quella classe quando ne esiste esattamente uno, altrimenti viene creata una nuova istanza con dependency injection (vedere la [sezione 11.7](#117-converter-di-campo-e-converter-di-applicazione)). |
| Validazione | V-11 quando il tipo gestito è incompatibile (verificato quando il tipo gestito può essere determinato dalla dichiarazione generica della classe converter); V-12 quando il converter non può essere creato. |

```java
@ExcelColumn(header = "Hours", order = 10, converter = DurationInHours.class) Duration timeSpent;
```

#### 6.2.7 `headerStyle`

| | |
| --- | --- |
| Tipo | `String`, il nome di uno stile con nome |
| Valore predefinito | `""` |
| Effetto | Applicato alla cella di intestazione di questa colonna. È l'ultimo livello della cascata dell'intestazione: vince sul preset, sugli slot di intestazione e sulla cornice. |
| Validazione | V-06 quando il nome non esiste. |

```java
@ExcelColumn(header = "Amount", order = 40, headerStyle = "right") BigDecimal amount;
```

#### 6.2.8 `styles`

| | |
| --- | --- |
| Tipo | `ColumnStyles` |
| Valore predefinito | `@ColumnStyles`, nessuno slot impostato |
| Effetto | Gli stili con nome delle celle di dati di questa colonna: vedere la [sezione 6.9](#69-columnstyles). Gli slot di colonna sono gli slot più specifici della cascata del corpo. |

#### 6.2.9 Esempio completo

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

    @ExcelColumn(header = "Tags", order = 40, converter = TagsConverter.class)
    private List<String> tags;

    public String getAccount() { return account; }
    public LocalDate getBookedOn() { return bookedOn; }
    public BigDecimal getBalance() { return balance; }
    public List<String> getTags() { return tags; }
}
```

### 6.3 `@ExcelStyle`

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

### 6.4 `@ExcelStyles`

Contenitore di annotazioni `@ExcelStyle` ripetute. Il compilatore lo usa automaticamente quando `@ExcelStyle` è ripetuta su una classe. Ha un attributo, `value`, di tipo `ExcelStyle[]`. Scriverlo esplicitamente è consentito ma mai necessario:

```java
// equivalent forms
@ExcelStyle(name = "a", bold = Toggle.TRUE)
@ExcelStyle(name = "b", italic = Toggle.TRUE)

@ExcelStyles({@ExcelStyle(name = "a", bold = Toggle.TRUE), @ExcelStyle(name = "b", italic = Toggle.TRUE)})
```

### 6.5 `@ExcelStyleSheet`

Contrassegna un foglio di stile: una classe che contiene stili con nome condivisi da più classi sheet. Non ha attributi.

- Un foglio di stile porta questa annotazione e le dichiarazioni `@ExcelStyle`. I suoi campi, metodi e altre annotazioni non hanno alcun ruolo. La forma abituale è una classe final con un costruttore privato.
- Le classi sheet lo referenziano in `@ExcelSheet.styleSheets` e possono quindi usare i suoi stili per nome.
- Si possono referenziare solo classi che portano questa annotazione (V-09).
- I nomi degli stili devono essere univoci all'interno del foglio di stile (V-07). Gli errori su uno stile di un foglio di stile nominano la classe del foglio di stile, non la classe sheet.
- I fogli di stile referenziati da una classe sheet non devono dichiarare lo stesso nome (V-08).
- Uno stile dichiarato sulla classe sheet vince su uno stile con lo stesso nome proveniente da un foglio di stile, e lo sostituisce interamente.
- Anche i template di foglio referenziano fogli di stile, con `@ExcelSheetTemplate.styleSheets`. Una classe sheet che usa un template può allora usarne gli stili, come livello più debole: i suoi stili e quelli dei suoi fogli di stile vincono su di essi ([sezione 10.11](#1011-stili-disponibili-a-una-classe-sheet-con-un-template)).

```java
@ExcelStyleSheet
@ExcelStyle(name = "header", bold = Toggle.TRUE, fillColor = "#1F4E79", fontColor = "#FFFFFF")
@ExcelStyle(name = "zebra", fillColor = "#EEF3F8")
public final class CorporateStyles {
    private CorporateStyles() {
    }
}
```

### 6.6 `@ExcelSheetTemplate`

Contrassegna un template di foglio: una classe che dichiara una sola volta la configurazione di foglio condivisa da più classi sheet. Le classi sheet lo referenziano con `@ExcelSheet(template = ...)`. I template sono spiegati nella [sezione 10.7](#107-template-di-foglio).

- Un template porta solo questa annotazione. I suoi campi, metodi e altre annotazioni non hanno alcun ruolo, salvo quelli vietati dalle regole seguenti. La forma abituale è una classe final con un costruttore privato.
- I suoi attributi hanno gli stessi nomi, tipi e significato degli attributi di `@ExcelSheet`. Il titolo non fa parte di un template.
- Ogni attributo è facoltativo, e un attributo lasciato non impostato passa ai valori predefiniti della classe sheet: vedi [sezione 10.10](#1010-che-cosa-prende-una-classe-sheet-dal-suo-template).
- Un template viene validato da solo: i suoi errori nominano la classe del template, con `@ExcelSheetTemplate` come elemento.

| Attributo | Tipo | Valore predefinito | Significato sul template |
| --- | --- | --- | --- |
| `preset` | `TablePreset` | `INHERIT` (predefinito dell'applicazione) | Il preset di ogni classe sheet che usa il template. Le classi sheet non possono cambiarlo (V-22). |
| `accentColor` | `String` | `""` (predefinito dell'applicazione) | Il colore di accento, salvo che la classe sheet ne imposti uno proprio. V-13 per un colore non valido. |
| `styleSheets` | `Class<?>[]` | `{}` | I fogli di stile i cui stili possono essere referenziati dal template e dalle classi sheet che lo usano. Il livello più debole degli stili disponibili. V-09, V-08. |
| `titleStyle` | `String` | `""` | Lo stile del titolo, salvo che la classe sheet ne imposti uno proprio. Ignorato dalle classi sheet senza titolo. V-06 quando lo stile non esiste nei fogli di stile del template. |
| `freezeHeader` | `Toggle` | `INHERIT` (bloccata) | Se l'intestazione è bloccata, salvo che decida la classe sheet. |
| `autoFilter` | `Toggle` | `INHERIT` (nessun filtro automatico) | Se viene aggiunto un filtro automatico, salvo che decida la classe sheet. |
| `autoSizeColumns` | `Toggle` | `INHERIT` (dimensionamento automatico) | Se le colonne senza larghezza vengono dimensionate in base al contenuto, salvo che decida la classe sheet. |
| `outerBorder` | `Border` | `INHERIT` (nessuna cornice) | La linea della cornice, salvo che la classe sheet ne imposti una propria. |
| `outerBorderColor` | `String` | `""` (colore automatico) | Il colore della cornice, salvo che la classe sheet ne imposti uno proprio. V-13 per un colore non valido. |
| `header` | `HeaderStyles` | `@HeaderStyles` | Gli slot dell'intestazione; ogni slot impostato sulla classe sheet vince sullo stesso slot qui. V-06 per uno stile assente dai fogli di stile del template. |
| `body` | `BodyStyles` | `@BodyStyles` | Gli slot del corpo, con la stessa regola. |

Regole controllate sulla classe del template:

| Regola | Codice |
| --- | --- |
| La classe non è annotata anche con `@ExcelSheet` o `@ExcelStyleSheet`. | V-23 |
| La classe non dichiara alcun `@ExcelStyle`. | V-24 |
| La classe non ha campi annotati con `@ExcelColumn`, campi ereditati inclusi. | V-25 |
| Ogni stile che nomina esiste nei suoi fogli di stile. | V-06 |
| I suoi fogli di stile sono fogli di stile, senza nomi duplicati tra loro. | V-09, V-08 |
| I suoi colori sono validi. | V-13 |

```java
@ExcelSheetTemplate(
        preset = TablePreset.LIGHT,
        accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = Toggle.TRUE,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"))
public final class CorporateReport {
    private CorporateReport() {
    }
}
```

**`ExcelSheetTemplate.None`** è il valore predefinito di `@ExcelSheet.template`, e significa "nessun template". Non viene mai istanziato né scritto a mano: lasciare invece l'attributo non impostato.

### 6.7 `@HeaderStyles`

Slot dell'intestazione, utilizzabili solo come valore di `@ExcelSheet.header` e di `@ExcelSheetTemplate.header`. Ogni attributo è il nome di uno stile con nome; vuoto significa nessuno stile.

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

Validazione: V-06 per un nome che non esiste (elemento `@ExcelSheet`, slot `header.base`, `header.firstColumn` o `header.lastColumn`). Su un template l'elemento è `@ExcelSheetTemplate` e il nome deve esistere nei fogli di stile del template.

```java
@ExcelSheet(header = @HeaderStyles(base = "header", firstColumn = "header-left", lastColumn = "header-right"))
```

### 6.8 `@BodyStyles`

Slot del corpo a livello di tabella, utilizzabili solo come valore di `@ExcelSheet.body` e di `@ExcelSheetTemplate.body`.

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

Validazione: V-06 (elemento `@ExcelSheet`, slot `body.base`, `body.odd` e così via). Su un template l'elemento è `@ExcelSheetTemplate` e il nome deve esistere nei fogli di stile del template.

```java
@ExcelSheet(body = @BodyStyles(base = "cell", odd = "zebra", firstColumn = "key", lastRow = "total"))
```

### 6.9 `@ColumnStyles`

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

## 7. Riferimento API

### 7.1 Panoramica

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

Tutti si trovano in `cloud.baldilorenzo.sheetsmith`. I tipi dei converter sono descritti nella [sezione 11](#11-converter).

### 7.2 `Sheetsmith`

```java
public interface Sheetsmith {
    byte[] generate(List<SheetData<?>> sheets);
    void generate(List<SheetData<?>> sheets, OutputStream out);
    void validate(Class<?> type);
    static Builder builder();
}
```

Le istanze sono immutabili e thread-safe. Se ne crea una, con il builder o tramite l'auto-configurazione di Spring Boot, e la si condivide in tutta l'applicazione. L'implementazione predefinita è creata dal builder; le applicazioni non implementano l'interfaccia, se non per i test double.

#### 7.2.1 `generate(List<SheetData<?>>)`

Genera un file `.xlsx` contenente i fogli indicati e ne restituisce il contenuto.

| | |
| --- | --- |
| Parametri | `sheets`: i fogli, nell'ordine della cartella di lavoro; non null, senza elementi null |
| Restituisce | il contenuto del file |
| Lancia | `SheetsmithConfigurationException` se l'input viola da V-18 a V-20 o se una classe sheet viola una qualsiasi regola da V-01 a V-17 o da V-21 a V-25, con tutti gli errori elencati una sola volta; `SheetsmithGenerationException` se un elemento o un valore non può essere scritto; `UncheckedIOException` se la serializzazione fallisce (praticamente irraggiungibile con questo metodo, che scrive in memoria); `NullPointerException` se `sheets` è null o contiene un elemento null |

Comportamento:

- I fogli compaiono nella cartella di lavoro nell'ordine della lista.
- Ogni foglio può usare una classe sheet diversa, e una classe può essere usata da più fogli.
- Una lista di dati vuota è valida: il suo foglio contiene solo il titolo, se presente, e l'intestazione.
- L'input e ogni classe sheet, con il suo template, vengono validati prima che venga scritto qualsiasi cosa; gli errori dell'input e di tutte le classi vengono segnalati insieme, ciascuno una sola volta, anche quando più classi sheet condividono un template o un foglio di stile non valido.
- Un template non può essere passato come classe di un `SheetData`: viola V-01.
- Una classe che non supera la validazione non viene messa in cache e viene rifiutata a ogni chiamata finché non è corretta.

#### 7.2.2 `generate(List<SheetData<?>>, OutputStream)`

Genera lo stesso file e lo scrive su uno stream fornito dal chiamante.

| | |
| --- | --- |
| Parametri | `sheets`: come sopra; `out`: lo stream che riceve il file, non null |
| Lancia | come sopra; `UncheckedIOException` incapsula qualsiasi `IOException` durante la serializzazione, compreso un guasto dello stream stesso, con l'eccezione originale come causa; `NullPointerException` se `sheets` o `out` è null |

Contratto dello stream:

- Lo stream appartiene al chiamante: viene sottoposto a **flush** dopo la scrittura del file e **non viene mai chiuso**.
- L'intera cartella di lavoro viene costruita prima che inizi la serializzazione, quindi **non viene scritto nulla** sullo stream quando si verifica un errore di configurazione o di generazione.
- Può restare contenuto parziale nello stream solo quando si verifica un errore di I/O durante la serializzazione.

#### 7.2.3 Scelta tra `byte[]` e `OutputStream`

I due metodi producono contenuto identico e usano praticamente la stessa memoria: l'intera cartella di lavoro viene costruita in memoria prima di essere scritta, il suo modello in memoria è molto più grande del file, e la copia aggiuntiva del file tenuta dal metodo con `byte[]` è trascurabile al confronto. La scelta dipende dalla destinazione:

| Destinazione del file | Metodo |
| --- | --- |
| Un file su disco, una risposta HTTP, uno stream di upload su cloud storage, qualsiasi altro stream | `generate(sheets, out)` |
| Byte necessari come tali: un allegato e-mail, una colonna di database, il payload di un messaggio, una cache, un'asserzione di test, un header `Content-Length` | `generate(sheets)` |

#### 7.2.4 `validate(Class<?>)`

Valida una classe sheet, o un template di foglio, senza generare nulla.

| | |
| --- | --- |
| Parametri | `type`: la classe sheet o il template di foglio, non null |
| Lancia | `SheetsmithConfigurationException` che elenca ogni errore della classe; `NullPointerException` se `type` è null |

Per una **classe sheet**, esegue ogni controllo che `generate` esegue su una classe: le regole sulle annotazioni da V-01 a V-09, da V-13 a V-17 e da V-21 a V-25, template della classe incluso, e l'associazione dei converter da V-10 a V-12, usando i converter di applicazione e la factory dei converter di questa istanza. Validare con un'istanza configurata come quella che genera i file, altrimenti un tipo coperto da un converter di applicazione può essere segnalato come V-10. Usi tipici: test unitari e validazione all'avvio.

Per un **template di foglio**, cioè una classe annotata con `@ExcelSheetTemplate`, valida il template da solo, con i controlli che gli si applicano per ogni classe sheet che lo referenzia: le regole V-06, V-08, V-09, V-13 e da V-23 a V-25. Una classe annotata né con `@ExcelSheet` né con `@ExcelSheetTemplate` viola V-01.

```java
@Test
void sheetClassesAreValid() {
    Sheetsmith sheetsmith = Sheetsmith.builder().converter(Money.class, new MoneyConverter()).build();
    assertDoesNotThrow(() -> sheetsmith.validate(InvoiceLine.class));
    assertDoesNotThrow(() -> sheetsmith.validate(CorporateReport.class));   // a template
}
```

#### 7.2.5 `builder()`

Restituisce un nuovo builder con le impostazioni predefinite: nessun converter di applicazione (si applicano solo i converter integrati), converter di campo creati tramite il loro costruttore pubblico senza argomenti, `SheetsmithDefaults.standard()` e `DocumentProperties.standard()`.

### 7.3 `Sheetsmith.Builder`

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

### 7.4 `SheetData<T>`

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

I nomi non validi vengono rifiutati, mai troncati o ripuliti: i nomi costruiti a partire da dati devono essere ripuliti dal chiamante (vedere la [ricetta 13.15](#1515-nomi-di-foglio-costruiti-da-dati)). Excel riserva inoltre il nome `History`, che non viene rifiutato ma va evitato.

```java
List<SheetData<?>> sheets = List.of(
        SheetData.of("Customers", CustomerRow.class, customers),
        SheetData.of("Invoice lines", InvoiceLine.class, lines));
```

### 7.5 `SheetsmithDefaults`

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
| `preset` | Preset delle classi sheet che dichiarano `INHERIT` e il cui template, se presente, non ne imposta uno | `NONE` | non null, non `INHERIT` |
| `accentColor` | Colore di accento delle classi sheet che non ne dichiarano uno e il cui template, se presente, non ne imposta uno | `#4472C4` | non null, un colore valido (vuoto non ammesso) |

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

### 7.6 `DocumentProperties`

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

In Spring Boot, usare `sheetsmith.document.author` e `sheetsmith.document.application` ([sezione 12.3](#123-proprietà-di-configurazione)).

### 7.7 Eccezioni

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

#### 7.7.1 `SheetsmithConfigurationException`

| Membro | Descrizione |
| --- | --- |
| `SheetsmithConfigurationException(List<ConfigurationError> errors)` | Costruttore pubblico; `errors` non null e non vuoto (`IllegalArgumentException` se vuoto). |
| `List<ConfigurationError> errors()` | Gli errori, nell'ordine in cui sono stati trovati; non modificabile, mai vuoto, preservato dalla serializzazione Java. |
| `getMessage()` | Una riga per errore, nel formato descritto nella [sezione 13.1](#131-lettura-di-un-errore-di-configurazione). |

#### 7.7.2 `SheetsmithGenerationException`

| Membro | Descrizione |
| --- | --- |
| `SheetsmithGenerationException(String message, String sheetName, int rowIndex, String fieldName, Throwable cause)` | Costruttore pubblico. `rowIndex` 0 quando non è specifico di una riga (i valori negativi lanciano `IllegalArgumentException`); `fieldName` e `cause` possono essere null. Il messaggio viene completato con la posizione. |
| `String sheetName()` | Il nome del foglio in scrittura. |
| `int rowIndex()` | La riga di dati, a partire da 1, nell'ordine della lista (la riga 1 è il primo elemento); 0 quando l'errore non è specifico di una riga, ad esempio troppe righe. Titolo e intestazione non vengono contati. |
| `Optional<String> fieldName()` | Il campo coinvolto, come dichiarato nella classe sheet; vuoto quando non è specifico di un campo, ad esempio un elemento null. |
| `getCause()` | L'eccezione originale lanciata da un getter o da un converter, quando c'è. |

#### 7.7.3 `ConfigurationError`

```java
public record ConfigurationError(String code, Class<?> type, String element, String message) implements Serializable
```

| Componente | Significato |
| --- | --- |
| `code` | La regola violata, da `V-01` a `V-25`. |
| `type` | La classe a cui si riferisce l'errore: la classe sheet, il template di foglio o il foglio di stile che dichiara lo stile errato; `null` per gli errori sull'input di `generate` (da V-18 a V-20). |
| `element` | L'elemento coinvolto: un nome di campo, `@ExcelSheet`, `@ExcelSheetTemplate`, `@ExcelStyle(nome)`, `@ExcelStyle(#n)` quando il nome è vuoto, `sheets[i]` per un foglio dell'input; vuoto quando l'errore riguarda la classe o l'input nel suo insieme. |
| `message` | La descrizione del problema. |

`code`, `element` e `message` non sono null (altrimenti `NullPointerException`).

---

## 8. Stili

Questa sezione raccoglie tutto ciò che riguarda la formattazione: i colori, il significato di ogni gruppo di attributi, la sintassi dei formati dei dati e la cascata in pratica. Gli elenchi completi delle costanti enum sono nell'[Appendice B](#appendice-b-domini-dei-valori).

### 8.1 Definizione degli stili

Uno stile con nome si dichiara con `@ExcelStyle` sulla classe sheet o su un foglio di stile, e si applica tramite gli slot. L'elenco completo degli attributi è nella [sezione 6.3](#63-excelstyle). Un modo utile per organizzare gli stili:

- uno stile per **scopo** (`header`, `zebra`, `money`, `total`, `key`), non per cella;
- combinare gli scopi tramite la cascata invece di creare uno stile per ogni combinazione: uno stile `total` che imposta solo `bold` e un bordo superiore funziona sopra `money`, `zebra` o un preset.

### 8.2 Colori

Ogni attributo di colore di sheetsmith (i colori di `@ExcelStyle`, `@ExcelSheet.accentColor`, `@ExcelSheet.outerBorderColor`, il colore di accento predefinito dell'applicazione) accetta:

| Forma | Esempio | Note |
| --- | --- | --- |
| esadecimale `#RRGGBB` | `#1F4E79`, `#1f4e79` | Maiuscolo o minuscolo. Normalizzato in maiuscolo, quindi `#1f4e79` e `#1F4E79` sono lo stesso colore e condividono uno stesso stile di cella. Esattamente sei cifre esadecimali: `#FFF` e `1F4E79` non sono validi. |
| nome di costante `IndexedColors` | `DARK_BLUE`, `GREY_25_PERCENT` | Il nome di una costante di Apache POI `org.apache.poi.ss.usermodel.IndexedColors`, con distinzione tra maiuscole e minuscole, in maiuscolo come dichiarato. Non normalizzato. L'elenco completo è nell'[Appendice B.9](#b9-nomi-di-indexedcolors). |
| stringa vuota | `""` | Non impostato. |

Qualsiasi altro valore viola V-13. Preferire i colori esadecimali: sono esatti, mentre i colori indicizzati dipendono dalla tavolozza dell'applicazione che apre il file. `AUTOMATIC` è accettato; come colore di accento viene trattato come nero.

### 8.3 Allineamento e controllo del testo

| Attributo | Note |
| --- | --- |
| `align` | `GENERAL` è il valore predefinito di Excel: testo a sinistra, numeri e date a destra. `CENTER_SELECTION` centra attraverso le celle adiacenti con lo stesso allineamento senza unirle. `FILL` ripete il contenuto per riempire la cella. |
| `verticalAlign` | Il valore predefinito di Excel è `BOTTOM`. `JUSTIFY` e `DISTRIBUTED` influiscono sul testo che va a capo. |
| `wrapText` | Manda a capo il testo lungo su più righe. sheetsmith non imposta l'altezza delle righe: a seconda dell'applicazione di fogli di calcolo, le righe con testo a capo possono essere mostrate con l'altezza predefinita finché chi legge non applica un'altezza di riga automatica. |
| `shrinkToFit` | Riduce la dimensione del font affinché il testo stia nella cella. Ignorato da Excel quando `wrapText` è attivo. |
| `rotation` | Da -90 a 90 gradi; i valori positivi ruotano in senso antiorario. 255 impila i caratteri verticalmente. |
| `indent` | Livello di rientro, da 0 a 250, efficace con allineamento a sinistra, a destra o distribuito. |

### 8.4 Bordi

- Ogni lato ha una linea (`Border`) e un colore.
- `border` e `borderColor` impostano i quattro lati in una volta; gli attributi specifici per lato vincono su di essi all'interno dello stesso stile.
- Lungo la cascata, ogni lato viene unito in modo indipendente: un livello che imposta solo `borderBottom` mantiene gli altri tre lati dei livelli inferiori.
- `Border.NONE` rimuove una linea impostata a un livello inferiore; `Border.INHERIT` la mantiene.
- Un lato con una linea e senza colore usa il colore automatico, di solito nero.
- I bordi delle celle adiacenti sono memorizzati in modo indipendente: un bordo inferiore su una riga e un bordo superiore sulla riga successiva sono due impostazioni distinte di due celle.
- La cornice esterna ([sezione 6.1.9](#619-outerborder)) è un livello dedicato che imposta solo i bordi della tabella.

### 8.5 Riempimenti e font

- **Riempimento pieno:** impostare solo `fillColor`. Il motivo diventa automaticamente `SOLID_FOREGROUND`.
- **Riempimento a motivo:** impostare `fillPattern`, `fillColor` (colore del motivo) e, facoltativamente, `fillBackgroundColor` (colore dietro il motivo).
- **Nessun riempimento:** `fillPattern = Fill.NO_FILL` rimuove un riempimento impostato a un livello inferiore, ad esempio le righe alternate di un preset su una colonna.
- **Font:** `fontName`, `fontSize`, `bold`, `italic`, `strikeout`, `underline`, `fontColor` e `script` vengono uniti attributo per attributo come il resto dello stile. Il nome del font deve essere disponibile sulla macchina che apre il file, altrimenti Excel lo sostituisce. I font vengono deduplicati nel file.

### 8.6 Formati dei dati

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

### 8.7 La cascata in pratica

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

## 9. Preset

### 9.1 Cos'è un preset

Un preset è uno stile di tabella già pronto che la libreria genera a partire da un **colore di accento** `A`. Produce cinque livelli, applicati al livello più basso delle rispettive cascate:

| Livello | Applicato a |
| --- | --- |
| titolo | la riga del titolo |
| base dell'intestazione | ogni cella di intestazione |
| base del corpo | ogni cella di dati |
| dispari del corpo | celle di dati delle righe dispari |
| pari del corpo | celle di dati delle righe pari |

Le tonalità derivano da `A` mescolandolo con il bianco (`tint(A, f)`, dove `f` è la frazione di bianco, da 0 a 1) o con il nero (`shade(A, f)`, frazione di nero). Il testo posto su uno sfondo colorato è bianco o nero, a seconda di quale abbia il rapporto di contrasto più alto con lo sfondo secondo WCAG (`contrast(X)`). I due rapporti sono uguali a una luminanza relativa di circa 0.18, quindi gli sfondi a tonalità media ottengono testo nero.

### 9.2 I preset

| Costante | Significato |
| --- | --- |
| `INHERIT` | Usa il preset del template, se presente, altrimenti il preset predefinito dell'applicazione. Valido solo su una classe sheet o su un template, non come preset predefinito dell'applicazione stessa. |
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

### 9.3 Colori calcolati per accenti comuni

La tabella mostra i colori che ciascun preset scrive effettivamente per alcuni accenti. `#4472C4` è l'accento predefinito.

| Accento `A` | `shade(A,0.25)` (titolo, testo intestazione LIGHT, riempimento pari DARK) | `tint(A,0.75)` (linea riga LIGHT) | `tint(A,0.85)` (riempimento dispari LIGHT) | `tint(A,0.6)` (griglia MEDIUM) | `tint(A,0.8)` (riempimento dispari MEDIUM) | `shade(A,0.5)` (riempimento intestazione DARK) | Testo su `A` | Testo su pari DARK |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#4472C4` (blu predefinito) | `#335693` | `#D0DCF0` | `#E3EAF6` | `#B4C7E7` | `#DAE3F3` | `#223962` | bianco | bianco |
| `#1F4E79` (blu scuro) | `#173A5B` | `#C7D3DE` | `#DDE4EB` | `#A5B8C9` | `#D2DCE4` | `#10273C` | bianco | bianco |
| `#70AD47` (verde) | `#548235` | `#DBEAD1` | `#EAF3E3` | `#C6DEB5` | `#E2EFDA` | `#385624` | nero | nero |
| `#FFC000` (ambra) | `#BF9000` | `#FFEFBF` | `#FFF6D9` | `#FFE699` | `#FFF2CC` | `#806000` | nero | nero |
| `#C00000` (rosso) | `#900000` | `#EFBFBF` | `#F6D9D9` | `#E69999` | `#F2CCCC` | `#600000` | bianco | bianco |

Il testo dell'intestazione DARK è bianco per tutti e cinque gli accenti.

### 9.4 Scelta del preset e dell'accento

| Dove | Come | Ambito |
| --- | --- | --- |
| Classe sheet | `@ExcelSheet(preset = ..., accentColor = ...)` | quella classe sheet |
| Template | `@ExcelSheetTemplate(preset = ..., accentColor = ...)` | ogni classe sheet che referenzia il template |
| Applicazione, builder | `SheetsmithDefaults(..., preset, accentColor)` | ogni classe sheet che dichiara `INHERIT` e nessun accento |
| Applicazione, Spring Boot | `sheetsmith.preset`, `sheetsmith.accent-color` | stesso |

Risoluzione: il preset effettivo è il preset della classe, oppure il preset del suo template, oppure il preset dell'applicazione, in questo ordine; una classe che referenzia un template lascia non impostato il proprio preset (V-22). L'accento effettivo è l'accento della classe, oppure l'accento del suo template, oppure l'accento dell'applicazione. Una classe può quindi ereditare il preset e impostare un proprio accento, o il contrario.

```java
// The whole application uses LIGHT with the corporate blue...
new SheetsmithDefaults("dd/mm/yyyy", "dd/mm/yyyy hh:mm", "", TablePreset.LIGHT, "#1F4E79");

// ...this report keeps LIGHT but uses green...
@ExcelSheet(accentColor = "#2E7D32")

// ...and this one uses no preset at all.
@ExcelSheet(preset = TablePreset.NONE)
```

### 9.5 Regolazione di un preset

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

### 9.6 Preset e cornice esterna

La cornice esterna si colloca sopra il preset. Con `MEDIUM`, ad esempio, `outerBorder = Border.MEDIUM` ispessisce i bordi esterni della griglia mentre le linee interne restano sottili. Con `LIGHT`, la cornice chiude la tabella sui lati, che il preset lascia aperti.

### 9.7 Esempi visivi

La resa visiva di ciascun preset con diversi accenti è destinata al sito della documentazione. La suite di test della libreria genera cartelle di lavoro di esempio per ogni preset con gli accenti `#4472C4`, `#FFC000` e `DARK_RED` (test `PresetSamplesTest`, output in `sheetsmith-core/target/preset-samples`), che possono essere usate come fonte per gli screenshot.

---

## 10. Stili condivisi, template e stile aziendale

Un'applicazione che produce più report di solito vuole che abbiano tutti lo stesso aspetto. sheetsmith offre due tipi di classi per condividere ciò che altrimenti verrebbe ripetuto su ogni classe sheet:

- un **foglio di stile**, annotato con `@ExcelStyleSheet`, condivide **stili con nome**: com'è fatta l'intestazione aziendale, il totale o le celle degli importi;
- un **template di foglio**, annotato con `@ExcelSheetTemplate`, condivide **l'intera configurazione di un foglio**: il preset e il suo colore di accento, i fogli di stile, lo stile del titolo, le opzioni di layout, la cornice, e quale stile con nome va in quale slot.

I due lavorano insieme: un template referenzia i fogli di stile di cui colloca gli stili negli slot. Questa sezione descrive prima i fogli di stile, poi i template, poi come distribuire lo stile aziendale tra le applicazioni.

### 10.1 Perché condividere stili e configurazione

Quando un'applicazione produce più report, dichiarare gli stessi stili di intestazione, righe alternate e importi su ogni classe sheet porta a copie che nel tempo divergono. Un **foglio di stile** dichiara gli stili con nome una sola volta; ogni classe sheet che lo referenzia li usa per nome. Modificare il foglio di stile modifica ogni report.

Un foglio di stile non decide dove vanno i suoi stili, né quale preset, colore di accento, filtro automatico o cornice usa un foglio: quella configurazione resta su ogni classe sheet. Anche un **template di foglio** la dichiara una sola volta, così che una classe sheet descriva soltanto il proprio titolo e le proprie colonne.

Combinati con i valori predefiniti dell'applicazione (preset, colore di accento, formati predefiniti) e con le proprietà del documento, fogli di stile e template permettono a ogni cartella di lavoro di un'applicazione, o di un'organizzazione tramite una libreria condivisa, di seguire lo stesso **stile aziendale**.

### 10.2 Dichiarare un foglio di stile

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

### 10.3 Usare un foglio di stile

```java
@ExcelSheet(
        title = "Monthly orders",
        titleStyle = "corp-title",
        styleSheets = CorporateStyles.class,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", odd = "corp-zebra", lastRow = "corp-total"),
        autoFilter = Toggle.TRUE)
public record OrderRow(
        @ExcelColumn(header = "Order", order = 10) String number,
        @ExcelColumn(header = "Date", order = 20, styles = @ColumnStyles(base = "corp-date")) LocalDate date,
        @ExcelColumn(header = "Amount", order = 30, styles = @ColumnStyles(base = "corp-money")) BigDecimal amount) {
}
```

### 10.4 Regole dei fogli di stile

| Regola | Conseguenza |
| --- | --- |
| Si possono referenziare solo classi con `@ExcelStyleSheet` (V-09). | Un'annotazione dimenticata viene segnalata e gli stili di quella classe non sono disponibili (i riferimenti ad essi segnalano V-06). |
| I nomi sono univoci all'interno di un foglio di stile (V-07). | L'errore nomina la classe del foglio di stile. |
| I fogli di stile referenziati insieme non devono condividere un nome (V-08). | Due fogli di stile usati dalla stessa classe non possono definire entrambi `header`. Usare prefissi (`corp-`, `fin-`) per evitare collisioni, oppure ridefinire lo stile sulla classe. |
| Uno stile sulla classe sheet sostituisce uno stile condiviso con lo stesso nome. | Personalizzazione locale di un singolo report, senza toccare il foglio di stile. La sostituzione è completa: gli attributi non vengono uniti. |
| I fogli di stile non sono ereditati e non referenziano altri fogli di stile. | Ogni classe sheet elenca i fogli di stile che usa, oppure li prende dal suo template ([sezione 10.11](#1011-stili-disponibili-a-una-classe-sheet-con-un-template)). |

### 10.5 Suddividere i fogli di stile

Le grandi organizzazioni possono suddividere lo stile aziendale in più fogli di stile: uno di base con font e intestazioni, uno finanziario con formati per importi e percentuali, uno di reportistica con i totali. Una classe sheet elenca quelli che le servono: `styleSheets = {CorporateStyles.class, FinanceStyles.class}`. I prefissi mantengono univoci i nomi tra di essi.

### 10.6 Fogli di stile e preset insieme

I fogli di stile e i preset si combinano: il preset fornisce la struttura generale (linee, righe alternate) derivata dall'accento aziendale, e il foglio di stile aggiunge font, formati e i dettagli che il preset non copre. Poiché il preset è il livello più basso, gli stili condivisi vincono sempre su di esso.

```java
@ExcelSheet(preset = TablePreset.LIGHT, accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"))
```

### 10.7 Template di foglio

Le classi sheet della [sezione 10.3](#103-usare-un-foglio-di-stile) e della [sezione 10.6](#106-fogli-di-stile-e-preset-insieme) ripetono ancora lo stile del titolo, il preset, il colore di accento, i fogli di stile, gli slot e il filtro automatico. Con molti report quelle righe vengono copiate su ogni classe, e nulla garantisce che ogni report le mantenga allineate.

Un **template di foglio** è una classe annotata con `@ExcelSheetTemplate` che dichiara quella configurazione una sola volta. Le classi sheet lo referenziano con `@ExcelSheet(template = ...)` e ne prendono ogni attributo che non impostano da sé.

| Un template può impostare | Un template non può impostare |
| --- | --- |
| `preset`, `accentColor`, `styleSheets`, `titleStyle`, `freezeHeader`, `autoFilter`, `autoSizeColumns`, `outerBorder`, `outerBorderColor`, `header`, `body` | il titolo, che è il contenuto di un singolo report; le colonne; gli stili con nome, che appartengono ai fogli di stile |

Gli attributi di `@ExcelSheetTemplate` hanno gli stessi nomi, tipi e significato di quelli di `@ExcelSheet`, quindi spostare la configurazione da una classe sheet a un template è questione di copia e incolla. Il riferimento completo è nella [sezione 6.6](#66-excelsheettemplate).

### 10.8 Dichiarare un template

Un template è di solito una classe final con un costruttore privato, che porta solo l'annotazione. Referenzia i fogli di stile di cui colloca gli stili negli slot:

```java
@ExcelSheetTemplate(
        preset = TablePreset.LIGHT,
        accentColor = "#0B3D5C",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = Toggle.TRUE,
        outerBorder = Border.THIN,
        outerBorderColor = "#0B3D5C",
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(base = "corp-cell", lastRow = "corp-total"))
public final class CorporateReport {
    private CorporateReport() {
    }
}
```

`freezeHeader` e `autoSizeColumns` qui non sono impostati: i fogli che usano il template mantengono i valori predefiniti, intestazione bloccata e dimensionamento automatico delle colonne.

### 10.9 Usare un template

Una classe sheet referenzia il template e dichiara il proprio titolo e le proprie colonne. Gli slot di colonna continuano a usare per nome gli stili dei fogli di stile del template:

```java
@ExcelSheet(title = "Monthly orders", template = CorporateReport.class)
public record OrderRow(
        @ExcelColumn(header = "Order", order = 10) String number,
        @ExcelColumn(header = "Date", order = 20, styles = @ColumnStyles(base = "corp-date")) LocalDate date,
        @ExcelColumn(header = "Amount", order = 30, styles = @ColumnStyles(base = "corp-money")) BigDecimal amount) {
}

@ExcelSheet(title = "Supplier balances", template = CorporateReport.class)
public record SupplierBalanceRow(
        @ExcelColumn(header = "Supplier", order = 10, width = 40) String supplier,
        @ExcelColumn(header = "Balance", order = 20, styles = @ColumnStyles(base = "corp-money")) BigDecimal balance) {
}
```

Entrambi i report ricevono il titolo aziendale, il preset `LIGHT` nel blu aziendale, l'intestazione e le celle aziendali, il filtro automatico, la cornice sottile e il totale in grassetto sull'ultima riga.

Una classe sheet può comunque decidere da sé. Qui un'esportazione molto grande disattiva il dimensionamento automatico e aggiunge le righe alternate sulle righe dispari, e mantiene tutto il resto dal template:

```java
@ExcelSheet(title = "Movements", template = CorporateReport.class,
        autoSizeColumns = Toggle.FALSE,
        body = @BodyStyles(odd = "corp-zebra"))
public record MovementRow(
        @ExcelColumn(header = "Id", order = 10, width = 12) long id,
        @ExcelColumn(header = "Date", order = 20, width = 12, styles = @ColumnStyles(base = "corp-date")) LocalDate date,
        @ExcelColumn(header = "Amount", order = 30, width = 14, styles = @ColumnStyles(base = "corp-money")) BigDecimal amount) {
}
```

Lo slot `body.odd` è impostato sulla classe sheet; `body.base` e `body.lastRow` vengono ancora dal template.

### 10.10 Che cosa prende una classe sheet dal suo template

Per ogni attributo si considera prima la classe sheet, poi il suo template, poi i valori predefiniti. Un attributo lasciato non impostato, cioè `INHERIT` o vuoto, passa al livello successivo.

| Attributo | Regola |
| --- | --- |
| `preset` | Lo sceglie solo il template. Una classe sheet che referenzia un template deve lasciare `preset` non impostato (V-22). Un template che lo lascia non impostato usa il preset predefinito dell'applicazione. |
| `accentColor` | La classe sheet può sovrascriverlo: lo stesso template funziona allora in colori diversi. Quando nessuno dei due lo imposta, si applica il colore di accento predefinito dell'applicazione. |
| `styleSheets` | Si applicano entrambi gli elenchi, a livelli diversi: vedi [sezione 10.11](#1011-stili-disponibili-a-una-classe-sheet-con-un-template). |
| `titleStyle` | La classe sheet può sovrascriverlo. Lo stile del titolo di un template viene ignorato, senza errore, dalle classi sheet senza titolo, così lo stesso template serve fogli con e senza titolo. |
| `freezeHeader`, `autoFilter`, `autoSizeColumns` | La classe sheet può sovrascriverli, in entrambe le direzioni, con `Toggle.TRUE` o `Toggle.FALSE`. Quando nessuno dei due li imposta, l'intestazione è bloccata, non viene aggiunto alcun filtro automatico e le colonne vengono dimensionate automaticamente. |
| `outerBorder`, `outerBorderColor` | Ciascuno separatamente: una classe sheet può cambiare la linea della cornice e mantenere il colore del template, o il contrario. |
| `header`, `body` | Slot per slot: uno slot impostato sulla classe sheet vince sullo stesso slot del template, gli altri slot mantengono lo stile indicato dal template. |

La fusione avviene una sola volta, quando vengono costruiti i metadati della classe sheet. La cascata della [sezione 5.9](#59-la-cascata) lavora poi sulla configurazione fusa, esattamente come se ogni attributo fosse stato dichiarato sulla classe sheet.

Due conseguenze meritano attenzione:

- **Il colore della cornice non segue l'accento.** Un colore della cornice dichiarato nel template resta lo stesso quando una classe sheet cambia il colore di accento, perché ogni attributo viene preso separatamente. Un template pensato per essere usato con accenti diversi dovrebbe lasciare `outerBorderColor` non impostato, oppure ogni classe sheet dovrebbe impostare il proprio.
- **Gli stili con nome si fondono con il preset attributo per attributo.** Uno stile che imposta una linea del bordo senza il suo colore prende il colore che il preset dà a quel bordo, se c'è: lo stesso stile del template può quindi apparire leggermente diverso sotto preset diversi. Impostare il colore nello stile quando conta.

### 10.11 Stili disponibili a una classe sheet con un template

Gli stili con nome che una classe sheet può usare, nei propri slot, negli slot che prende dal template e nelle proprie colonne, provengono da tre livelli, dal più forte al più debole:

1. gli stili dichiarati sulla classe sheet con `@ExcelStyle`;
2. gli stili dei fogli di stile della classe sheet (`@ExcelSheet.styleSheets`);
3. gli stili dei fogli di stile del template (`@ExcelSheetTemplate.styleSheets`).

Uno stile trovato a un livello più forte sostituisce interamente uno stile con lo stesso nome di un livello più debole. Questo permette a un singolo report di cambiare lo stile di uno slot del template senza toccare il template: basta dichiarare uno stile con lo stesso nome.

```java
// The total of this report is red: the style "corp-total" of the class
// replaces the one of CorporateStyles, also in the slot body.lastRow of the template.
@ExcelSheet(title = "Overdue invoices", template = CorporateReport.class)
@ExcelStyle(name = "corp-total", bold = Toggle.TRUE, fontColor = "#C00000", borderTop = Border.DOUBLE)
public record OverdueInvoiceRow(
        @ExcelColumn(header = "Invoice", order = 10) String number,
        @ExcelColumn(header = "Amount", order = 20, styles = @ColumnStyles(base = "corp-money")) BigDecimal amount) {
}
```

La regola V-08 si applica solo tra i fogli di stile dello stesso livello. Un foglio di stile referenziato sia dal template sia dalla classe sheet non è un conflitto.

### 10.12 Regole dei template

Un template è condiviso da molte classi sheet, quindi deve essere valido **da solo**, qualunque siano le classi sheet che lo usano. I suoi errori nominano la classe del template, con `@ExcelSheetTemplate` come elemento.

| Regola | Conseguenza |
| --- | --- |
| Una classe sheet può referenziare solo una classe annotata con `@ExcelSheetTemplate` (V-21). | Un'annotazione dimenticata viene segnalata sulla classe sheet. |
| Una classe sheet che referenzia un template lascia `preset` non impostato (V-22). | Il preset appartiene al template. Per usare un altro preset, dichiarare un altro template. |
| Un template non è anche una classe sheet o un foglio di stile (V-23). | Template, classi sheet e fogli di stile sono classi separate. |
| Un template non dichiara alcun `@ExcelStyle` (V-24). | Gli stili condivisi appartengono ai fogli di stile, che il template referenzia. Uno stile dichiarato su un template viene ignorato, quindi uno slot che lo usa segnala anche V-06: spostare lo stile in un foglio di stile corregge entrambi. |
| Un template non ha colonne, ereditate incluse (V-25). | Le colonne appartengono alle classi sheet. |
| Ogni stile nominato dal template esiste nei suoi fogli di stile (V-06). | Un template non può contare su stili che alcune classi sheet si trovano a dichiarare: anche se una classe sheet definisce lo stile mancante, il template viene segnalato. |
| I fogli di stile del template sono validi, i colori del template sono validi (da V-07 a V-09, V-13). | Segnalato sul template o sui suoi fogli di stile. |
| Un template non può referenziare un altro template. | `@ExcelSheetTemplate` non ha un attributo `template`: ogni classe sheet referenzia al massimo un template. |

Gli errori di un template non valido vengono segnalati insieme a quelli di ogni classe sheet che lo usa, ciascuno una sola volta, senza ulteriori errori sulle classi sheet causati dal template. Anche `Sheetsmith.validate` accetta una classe template e la valida da sola, e la validazione all'avvio dell'integrazione con Spring Boot valida ogni template trovato nei package scansionati, anche quando nessuna classe sheet lo referenzia ([sezione 12.4](#124-validazione-allavvio)).

### 10.13 Foglio di stile o template?

| Esigenza | Usare |
| --- | --- |
| Condividere com'è fatta una cella: caratteri, riempimenti, bordi, formati | un foglio di stile |
| Condividere come è impostato un intero foglio: preset, accento, slot, filtro, cornice, stile del titolo | un template, che referenzia uno o più fogli di stile |
| Usare gli stili aziendali in un report con un layout insolito | il solo foglio di stile, senza il template |
| Dare a un report un colore diverso, senza cambiare nient'altro | il template, con `accentColor` sulla classe sheet |
| Dare a un report un preset diverso | un altro template |

Un foglio di stile può essere usato da un numero qualsiasi di template e classi sheet: lo stesso `CorporateStyles` può servire un template `CorporateReport`, un template `CorporateListing` con un layout diverso e alcune classi sheet senza alcun template.

### 10.14 Distribuire lo stile aziendale

Fogli di stile e template sono classi ordinarie. Per condividerli tra applicazioni, collocarli, insieme a `SheetsmithDefaults` e `DocumentProperties` consigliati, in una piccola libreria interna da cui dipende ogni applicazione:

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

La libreria contiene allora `CorporateStyles`, `CorporateReport` e `CorporateSheetsmith`, e ogni applicazione scrive soltanto le proprie classi sheet. Nelle applicazioni Spring Boot, i valori predefiniti e le proprietà del documento vanno in un frammento o profilo condiviso di `application.yml` (vedi [sezione 12.3](#123-proprietà-di-configurazione)).

**Un template condiviso è un contratto visivo.** Cambiare un template, o gli stili dei suoi fogli di stile, cambia ogni foglio che lo usa, in ogni applicazione che aggiorna la libreria, senza alcuna modifica al loro codice. A volte è proprio l'obiettivo, come con un nuovo colore aziendale; spesso no. Trattare un template condiviso come un'API:

- cambiarlo solo quando deve cambiare ogni report che lo usa;
- quando solo alcuni report devono avere un aspetto diverso, pubblicare un nuovo template accanto a quello esistente, invece di modificarlo;
- registrare le modifiche visibili nelle note di rilascio della libreria condivisa, così che le applicazioni sappiano che cosa cambierà quando la aggiornano.

---

## 11. Converter

Tutti i tipi dei converter si trovano in `cloud.baldilorenzo.sheetsmith.convert`.

### 11.1 Ruolo dei converter

Ogni valore di campo non null viene trasformato in un `CellValue` da un converter prima di essere scritto. I converter producono **valori**, mai formattazione: il formato di visualizzazione di una cella proviene sempre dagli stili e dai valori predefiniti dell'applicazione.

### 11.2 Converter integrati

| Tipo registrato | Copre | Cella scritta |
| --- | --- | --- |
| `CharSequence` | `String`, `StringBuilder`, `StringBuffer`, qualsiasi `CharSequence` | testo, tramite `toString()` |
| `Character` | `char`, `Character` | testo |
| `Number` | `byte`, `short`, `int`, `long`, `float`, `double`, i rispettivi wrapper, `BigDecimal`, `BigInteger`, `AtomicInteger`, `AtomicLong`, qualsiasi `Number` | numero, tramite `doubleValue()` |
| `Boolean` | `boolean`, `Boolean` | booleano di Excel (`TRUE` / `FALSE`) |
| `AtomicBoolean` | `AtomicBoolean` | booleano di Excel |
| `Enum` | ogni enum | testo: il nome della costante (`name()`, non `toString()`) |
| `LocalDate` | `LocalDate` | data di Excel |
| `LocalDateTime` | `LocalDateTime` | data di Excel con ora |
| `java.sql.Date` | `java.sql.Date` | data di Excel, tramite `toLocalDate()` |
| `java.sql.Timestamp` | `java.sql.Timestamp` | data di Excel con ora, tramite `toLocalDateTime()`, nel fuso orario predefinito della JVM |
| `YearMonth` | `YearMonth` | testo in forma ISO, come `2026-10` |
| `Year` | `Year` | numero, come `2026`; vedi la nota sotto sul suo formato |
| `UUID` | `UUID` | testo, in forma canonica |
| `URI` | `URI` | testo, tramite `toString()` |
| `URL` | `URL` | testo, tramite `toExternalForm()` |
| `File` | `File` | testo, il suo percorso tramite `getPath()`, con il separatore del sistema operativo |
| `Currency` | `Currency` | testo, il codice ISO 4217, come `EUR` |
| `ZoneId` | `ZoneId`, `ZoneOffset` | testo, l'identificativo, come `Europe/Rome`, `+02:00` o `Z` |
| `Locale` | `Locale` | testo, il tag di lingua tramite `toLanguageTag()`, come `it-IT`; `und` per `Locale.ROOT` |
| `OptionalInt`, `OptionalLong`, `OptionalDouble` | gli stessi tipi | numero, oppure una cella vuota che mantiene il suo stile quando il valore è assente |
| `Hyperlink` | `Hyperlink` | un collegamento cliccabile che mostra il suo testo: vedi [sezione 11.5](#115-collegamenti-ipertestuali) |

I converter integrati vengono trovati tramite la gerarchia dei tipi, quindi sono coperte le sottoclassi e le implementazioni dei tipi registrati. A parte `CharSequence`, ogni tipo registrato è una classe: registrare interfacce renderebbe ambiguo un tipo di dominio che ne implementa due.

Note su alcuni tipi:

- **`Year`** è un numero, quindi segue il formato numerico della cella, compreso quello predefinito dell'applicazione: con un valore predefinito di `#,##0.00`, l'anno 2026 viene mostrato come `2,026.00`. Dichiarare `format = "0"` sulla colonna per mostrare `2026`.
- **`OptionalLong`** segue le regole di ogni numero: i valori oltre le 15 cifre significative perdono precisione ([sezione 14.1](#141-limiti-di-excel)).
- **`java.sql.Date` e `java.sql.Timestamp`** vengono convertiti nel fuso orario predefinito della JVM, come fa JDBC. Un `Timestamp` che cade nell'ora saltata da un cambio dell'ora legale viene spostato di un'ora da JDBC stesso. I millisecondi di un `Timestamp` sono conservati nel file, Excel memorizza gli orari al millisecondo circa, ma un formato come `hh:mm` non li mostra. Questi due converter sono disponibili quando è presente il modulo `java.sql`, cosa sempre vera sul class path; un'applicazione modulare che non legge `java.sql` semplicemente non li ha.
- **Conta il tipo dichiarato.** Un campo dichiarato come `java.util.Date` non ha un converter integrato, anche quando a runtime contiene un `java.sql.Timestamp`: dichiarare il campo come `java.sql.Timestamp`, oppure dargli un converter.

**Tipi che richiedono un converter** (altrimenti V-10), tra i più comuni, e perché:

| Tipi | Perché non c'è un converter integrato |
| --- | --- |
| `Instant`, `OffsetDateTime`, `ZonedDateTime`, `java.util.Date`, `Calendar` | Descrivono un istante, ed Excel non ha fusi orari: scriverli richiede di scegliere un fuso orario, una scelta che spetta all'applicazione ([sezione 11.10](#1110-esempi)). |
| `LocalTime`, `OffsetTime`, `java.sql.Time` | Un valore di cella non ha una forma solo orario, e associare un orario a una data arbitraria sarebbe fuorviante. |
| `Duration`, `Period`, `MonthDay` | Non esiste un'unica rappresentazione: una durata può essere in ore, minuti o giorni, come numero o come testo. |
| `Path` e le altre interfacce | I converter sono registrati solo per classi, a parte `CharSequence`. Scrivere i percorsi come testo con un converter, oppure usare `File`. |
| `Optional`, collezioni, mappe, array | Contengono altri valori, la cui conversione spetta all'applicazione. |
| `Object`, e qualsiasi tipo dell'applicazione (value object, oggetti annidati) | La loro rappresentazione spetta all'applicazione. |

### 11.3 Il contratto

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

### 11.4 `CellValue`

Un'interfaccia sealed con sette forme, create con metodi factory:

| Factory | Forma | Scritto come |
| --- | --- | --- |
| `CellValue.text(String)` | `CellValue.Text` | Una cella di testo, mai interpretato: gli zeri iniziali vengono mantenuti e un testo che sembra un numero o una formula resta testo. Oltre 32.767 caratteri la generazione fallisce. Null lancia `NullPointerException`. |
| `CellValue.number(double)` | `CellValue.Numeric` | Una cella numerica. Excel memorizza i numeri come valori in virgola mobile a 64 bit con 15 cifre significative. `NaN` diventa l'errore `#NUM!`, l'infinito l'errore `#DIV/0!`. |
| `CellValue.bool(boolean)` | `CellValue.Bool` | Un booleano di Excel, mostrato come `TRUE` o `FALSE`. |
| `CellValue.date(LocalDate)` | `CellValue.Date` | Una data di Excel; riceve il formato data predefinito quando non è impostato alcun formato. Null lancia un'eccezione. |
| `CellValue.dateTime(LocalDateTime)` | `CellValue.DateTime` | Una data di Excel con ora; riceve il formato data e ora predefinito quando non è impostato alcun formato. Null lancia un'eccezione. |
| `CellValue.link(Hyperlink)` | `CellValue.Link` | Un collegamento: la cella mostra il testo dell'`Hyperlink` e apre il suo indirizzo ([sezione 11.5](#115-collegamenti-ipertestuali)). Il testo segue lo stesso limite di una cella di testo. Null lancia un'eccezione. |
| `CellValue.blank()` | `CellValue.Blank` | Una cella vuota che mantiene lo stile risolto. Singleton. |

Poiché `CellValue` è sealed, i converter non possono scrivere nient'altro, non possono raggiungere la cella POI sottostante e non possono aggirare il sistema degli stili.

### 11.5 Collegamenti ipertestuali

Una cella può contenere un **collegamento cliccabile**: Excel mostra un testo e apre un indirizzo quando si fa clic sulla cella. In sheetsmith un collegamento è un valore come gli altri: un campo di tipo `Hyperlink` viene scritto come collegamento dal suo converter integrato, e qualsiasi converter può produrre un collegamento restituendo `CellValue.link`.

#### 11.5.1 Il tipo `Hyperlink`

```java
package cloud.baldilorenzo.sheetsmith.value;

public record Hyperlink(URI address, String description) {
    public static Hyperlink of(URI address);
    public static Hyperlink of(URI address, String description);
    public static Hyperlink of(String address);
    public static Hyperlink of(String address, String description);
    public String text();
}
```

| Membro | Significato |
| --- | --- |
| `address` | L'indirizzo che il collegamento apre. Non null. |
| `description` | Il testo mostrato nella cella, oppure null. Una descrizione vuota conta come assente e viene memorizzata come null. |
| `text()` | Il testo mostrato nella cella: la descrizione, oppure l'indirizzo quando non c'è. |

**Indirizzi ammessi.** L'indirizzo viene controllato quando l'`Hyperlink` viene creato, quindi un indirizzo non valido fallisce nel codice che costruisce i dati, prima di qualsiasi generazione:

| Indirizzo | Risultato |
| --- | --- |
| `https://example.com/invoices/2026-101` | accettato |
| `http://example.com` | accettato |
| `mailto:info@example.com` | accettato |
| `mailto:info@example.com?subject=Report%20Q3` | accettato: apre il client di posta con l'oggetto compilato |
| `mailto:?subject=Report` | accettato: valido secondo RFC 6068, apre il client di posta senza destinatario |
| `HTTPS://EXAMPLE.COM/Upper` | accettato: lo schema non distingue maiuscole e minuscole |
| `ftp://example.com/file` | `IllegalArgumentException`: `hyperlink address ftp://example.com/file has the scheme ftp: the allowed schemes are http, https or mailto` |
| `/docs` | `IllegalArgumentException`: `hyperlink address /docs is not absolute: it needs the scheme http, https or mailto` |
| `https:example.com` | `IllegalArgumentException`: `hyperlink address https:example.com has no host` |
| `https://exa mple.com` | `IllegalArgumentException`: `invalid hyperlink address: Illegal character in authority at index 11: https://exa mple.com` |
| `mailto:` | `IllegalArgumentException`: `invalid hyperlink address: Expected scheme-specific part at index 7: mailto:` |
| `null` | `NullPointerException`: `address` |

Sono ammessi solo `http`, `https` e `mailto`: altri schemi, come `file`, `ftp` o `javascript`, aprirebbero risorse locali o eseguirebbero codice sulla macchina di chi legge. I collegamenti ad altri fogli o celle della stessa cartella di lavoro non sono supportati.

Le factory con `String` analizzano l'indirizzo con `URI.create`: l'indirizzo deve essere già un URI valido, con caratteri come gli spazi codificati in percentuale. I caratteri validi in un URI ma non ASCII, come le lettere accentate in un percorso, sono accettati: la cella mostra l'indirizzo come è stato scritto, e il file memorizza la sua forma ASCII (`https://it.wikipedia.org/wiki/Città` viene memorizzato come `https://it.wikipedia.org/wiki/Citt%C3%A0`).

#### 11.5.2 Una colonna di collegamenti

```java
@ExcelSheet(title = "Invoices Q3")
public record InvoiceRow(
        @ExcelColumn(header = "Number", order = 10) String number,
        @ExcelColumn(header = "Amount", order = 20, format = "#,##0.00") BigDecimal amount,
        @ExcelColumn(header = "Document", order = 30) Hyperlink document,
        @ExcelColumn(header = "Contact", order = 40) Hyperlink contact) {
}

List<InvoiceRow> rows = List.of(
        new InvoiceRow("2026/101", new BigDecimal("4200.00"),
                Hyperlink.of("https://billing.example.com/invoices/2026-101", "Open invoice"),
                Hyperlink.of("mailto:accounts@example.com?subject=Invoice%202026%2F101", "Write to accounts")),
        new InvoiceRow("2026/102", new BigDecimal("3150.00"),
                Hyperlink.of("https://billing.example.com/invoices/2026-102"),
                null));
```

- Ogni riga ha il proprio indirizzo e il proprio testo.
- Senza descrizione, la cella mostra l'indirizzo (seconda riga, colonna `Document`).
- Un campo null produce una cella vuota, senza collegamento, che mantiene il suo stile (seconda riga, colonna `Contact`).
- Gli indirizzi `mailto` vengono scritti come collegamenti e-mail, gli altri come collegamenti web.

#### 11.5.3 Collegamenti prodotti dai converter

`CellValue.link(Hyperlink)` è una forma di valore di cella come le altre, quindi qualsiasi converter può produrre un collegamento: un converter di campo, un converter di applicazione o un bean converter. Un uso tipico è un tipo di dominio che identifica qualcosa con una pagina propria, come un numero d'ordine:

```java
public record OrderNumber(String value) { }

@Component   // application converter: every OrderNumber column becomes a link to the order
public class OrderNumberConverter implements CellConverter<OrderNumber> {

    @Override
    public CellValue convert(OrderNumber value, ConversionContext context) {
        String path = URLEncoder.encode(value.value(), StandardCharsets.UTF_8);
        return CellValue.link(Hyperlink.of("https://shop.example.com/orders/" + path, value.value()));
    }
}
```

- **Codificare i valori inseriti in un indirizzo.** Un valore che contiene uno spazio o un altro carattere non ammesso in un URI fa lanciare a `Hyperlink.of` una `IllegalArgumentException`; la generazione fallisce allora con `converter failed` e con il foglio, la riga e il campo del valore. Codificare il valore, come sopra, lo evita.
- **Decide ciò che il converter restituisce.** Un converter che restituisce `CellValue.link` produce un collegamento; un converter che restituisce `CellValue.text` produce una semplice cella di testo, anche per un campo di tipo `Hyperlink`. Un converter di campo su una colonna `Hyperlink` può quindi scrivere l'indirizzo come testo, oppure mostrare un testo diverso con lo stesso indirizzo.
- **Vincono i converter di applicazione per i supertipi.** `Hyperlink` è un record: un converter di applicazione registrato per `Record`, la sua superclasse, o per `Object`, si applica anche alle colonne `Hyperlink` e sostituisce il converter integrato ([sezione 11.8](#118-ordine-di-risoluzione)).

#### 11.5.4 Aspetto

Una cella con collegamento riceve il consueto aspetto di un collegamento, una sottolineatura singola e il colore `#0563C1`, ciascuno **solo quando gli stili della cella lo lasciano non impostato**. L'aspetto del collegamento viene applicato dopo l'intera cascata:

| Stili della cella | Risultato |
| --- | --- |
| nessun colore del carattere, nessuna sottolineatura | blu `#0563C1` e sottolineato |
| un colore del carattere, da uno stile con nome o da un preset | quel colore, sottolineato |
| una sottolineatura, `Underline.NONE` compreso | blu, con quella sottolineatura (nessuna, per `NONE`) |
| entrambi | esattamente come dichiarato |

Con il preset `DARK`, le cui righe di dati hanno un carattere bianco a contrasto, i collegamenti mantengono il carattere bianco e ricevono solo la sottolineatura, così restano leggibili sulle righe scure.

**LibreOffice Calc** mostra i collegamenti con i propri colori, blu e sottolineati, e ignora il colore del carattere e la sottolineatura della cella: i colori dichiarati, le sottolineature dichiarate e il carattere bianco di `DARK` sono visibili solo in Excel. Con `DARK`, in LibreOffice i collegamenti risultano blu su blu scuro. Il file è corretto.

#### 11.5.5 Limiti

| Limite | Che cosa succede |
| --- | --- |
| Il testo mostrato, la descrizione o l'indirizzo quando manca, supera i 32.767 caratteri | La generazione fallisce, come per qualsiasi testo ([sezione 14.1](#141-limiti-di-excel)). |
| Più di 65.530 collegamenti in un foglio | La generazione fallisce al 65.531° collegamento, con foglio, riga e campo: `hyperlink 65531 exceeds the Excel limit of 65530 hyperlinks in a sheet`. Excel non può aprire un foglio con più collegamenti senza riparare il file, e la riparazione rimuove **tutti** i collegamenti del foglio. Il limite vale per ciascun foglio separatamente: una cartella di lavoro può contenere più fogli con 65.530 collegamenti ciascuno. Dividere i dati su più fogli, oppure scrivere come testo i collegamenti meno importanti. |
| Indirizzi lunghi | Indirizzi fino a 8.000 caratteri sono stati verificati e funzionano in Excel. Oltre, il comportamento dipende da Excel e dal browser. |

I collegamenti vengono contati su tutte le colonne del foglio; le celle vuote e le celle di testo non vengono contate.

### 11.6 `ConversionContext`

Passato a ogni chiamata, indica dove viene scritto il valore. I converter possono usarlo per adattare il valore o per costruire messaggi di errore.

| Metodo | Restituisce |
| --- | --- |
| `String sheetName()` | il nome del foglio, come indicato in `SheetData` |
| `int rowIndex()` | la riga di dati, a partire da 1, nell'ordine della lista |
| `String fieldName()` | il nome del campo, come dichiarato nella classe sheet |
| `Class<?> sourceType()` | la classe sheet |
| `Class<?> valueType()` | il tipo dichiarato del campo; per un campo primitivo, il tipo primitivo, anche se il valore viene passato in forma boxed |

È un'interfaccia in modo che si possano aggiungere metodi nelle versioni future senza rompere i converter esistenti.

### 11.7 Converter di campo e converter di applicazione

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

### 11.8 Ordine di risoluzione

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
- La regola del supertipo vale anche per le interfacce. Un converter di applicazione registrato per `Comparable` o `Serializable` si applica anche alle colonne di tipo `UUID` o `LocalDate`, che le implementano, al posto dei loro converter integrati. Per mantenere il comportamento integrato su queste colonne, dichiarare un converter di campo, oppure registrare un converter di applicazione per il tipo esatto.
- Un converter di applicazione registrato per `java.util.Date` si applica anche alle colonne dichiarate come `java.sql.Date` o `java.sql.Timestamp`, che lo estendono, al posto dei loro converter integrati. Uno registrato per `Record` si applica alle colonne `Hyperlink`, essendo `Hyperlink` un record.

### 11.9 Bean Spring come converter: implicazioni

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
    CellConverter<Duration> durationConverter() {       // the generic return type identifies the handled type
        return (value, context) -> CellValue.number(value.toMinutes() / 60.0);
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

### 11.10 Esempi

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

**`java.util.Date` legacy in un fuso orario dato**

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

Registrato come converter di applicazione, riceve anche i valori delle colonne dichiarate come `java.sql.Date` o `java.sql.Timestamp`, che estendono `java.util.Date` ([sezione 11.8](#118-ordine-di-risoluzione)). `java.sql.Date.toInstant()` lancia `UnsupportedOperationException`: quando le classi sheet hanno anche colonne `java.sql.Date`, registrare converter anche per i tipi `java.sql` esatti, poiché un tipo esatto vince su un supertipo:

```java
Sheetsmith sheetsmith = Sheetsmith.builder()
        .converter(java.util.Date.class, new LegacyDateConverter(ZoneId.of("Europe/Rome")))
        .converter(java.sql.Date.class, (value, context) -> CellValue.date(value.toLocalDate()))
        .converter(java.sql.Timestamp.class, (value, context) -> CellValue.dateTime(value.toLocalDateTime()))
        .build();
```

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

### 11.11 `CellConverterFactory`

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

### 11.12 `CellConverter.None`

Il marcatore usato come valore predefinito di `@ExcelColumn.converter`, che significa "nessun converter di campo". Non viene mai istanziato né invocato; lasciare l'attributo non impostato invece di scriverlo.

---

## 12. Integrazione con Spring Boot e proprietà di configurazione

### 12.1 Cosa fa l'auto-configurazione

Con `sheetsmith-spring-boot-starter` nel classpath, l'auto-configurazione `SheetsmithAutoConfiguration` (registrata in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, attiva quando `Sheetsmith` è nel classpath) registra:

1. un **bean `Sheetsmith`**, a meno che l'applicazione definisca un proprio bean di quel tipo. Il bean auto-configurato viene costruito con:
   - i valori predefiniti associati dalle proprietà `sheetsmith.*`;
   - le proprietà del documento associate da `sheetsmith.document.*`;
   - una `SpringConverterFactory` per i converter di campo;
   - ogni bean `CellConverter` del contesto come converter di applicazione, registrato per il suo tipo generico;
2. un **`SheetsmithStartupValidator`**, solo quando `sheetsmith.validation.packages` non è vuoto.

Non è richiesta alcuna annotazione nell'applicazione: iniettare `Sheetsmith` dove serve.

### 12.2 Definire un proprio bean `Sheetsmith`

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

### 12.3 Proprietà di configurazione

Tutte le proprietà usano il prefisso `sheetsmith`. Sono associate al record immutabile `SheetsmithProperties` e sono dotate di metadati per l'auto-completamento dell'IDE.

| Proprietà | Tipo | Valore predefinito | Significato | Vincolo |
| --- | --- | --- | --- | --- |
| `sheetsmith.formats.date` | String | `yyyy-mm-dd` | Formato Excel predefinito delle celle data, come i valori `LocalDate`. | non vuoto |
| `sheetsmith.formats.date-time` | String | `yyyy-mm-dd hh:mm:ss` | Formato Excel predefinito delle celle data e ora, come i valori `LocalDateTime`. | non vuoto |
| `sheetsmith.formats.number` | String | vuoto ("Generale" di Excel) | Formato Excel predefinito delle celle numeriche, interi compresi. | può essere vuoto |
| `sheetsmith.preset` | `TablePreset` | `NONE` | Preset delle classi sheet che dichiarano `preset = INHERIT` e il cui template, se presente, non ne imposta uno: `NONE`, `LIGHT`, `MEDIUM`, `DARK`. | non `INHERIT` |
| `sheetsmith.accent-color` | String | `#4472C4` | Colore di accento delle classi sheet che non ne dichiarano e il cui template, se presente, non ne imposta uno: `#RRGGBB` o un nome di `IndexedColors`. | colore valido |
| `sheetsmith.document.author` | String | `sheetsmith` | Autore registrato in ogni file. Se vuoto viene omesso. | nessuno |
| `sheetsmith.document.application` | String | `sheetsmith` | Applicazione registrata in ogni file. Se vuota viene omessa. | nessuno |
| `sheetsmith.validation.packages` | lista di String | vuoto | Package analizzati all'avvio alla ricerca di classi sheet e template, sottopackage compresi. Se vuoto disabilita la validazione all'avvio. | nessuno |

Note:

- **Sintassi di Excel.** I formati usano la sintassi dei formati di Excel ([sezione 8.6](#86-formati-dei-dati)), non quella di `DateTimeFormatter`: `mm` è il mese, oppure i minuti dopo un codice dell'ora.
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

### 12.4 Validazione all'avvio

Quando `sheetsmith.validation.packages` elenca almeno un package, lo `SheetsmithStartupValidator` viene eseguito una volta creati tutti i singleton:

- analizza i package e i loro sottopackage alla ricerca di tipi **annotati direttamente** con `@ExcelSheet` o `@ExcelSheetTemplate`: classi concrete e abstract, record, interfacce e classi annidate, static o no;
- i tipi annotazione non vengono validati, anche se annotati con `@ExcelSheet` o `@ExcelSheetTemplate`, e nemmeno i tipi che ne sono solo meta-annotati tramite un'altra annotazione;
- chiama `validate` su ciascun tipo con il bean `Sheetsmith` del contesto, così i bean converter e la converter factory di Spring vengono presi in considerazione; un template viene validato da solo, **anche quando nessuna classe sheet lo referenzia**;
- gli errori di tutti i tipi non validi vengono raccolti in un'unica `SheetsmithConfigurationException`, che blocca l'applicazione. Ogni errore viene segnalato una sola volta, anche quando più classi sheet referenziano lo stesso template o foglio di stile non valido.

Gli errori nelle classi sheet e nei template emergono quindi all'avvio invece che alla prima generazione. Un'interfaccia annotata con `@ExcelSheet` viene sempre segnalata (non può avere campi di istanza, quindi viola V-02), come previsto: l'annotazione non va messa su un'interfaccia.

### 12.5 Tipi pubblici del modulo di auto-configurazione

| Tipo | Ruolo |
| --- | --- |
| `SheetsmithAutoConfiguration` | L'auto-configurazione. Istanziata da Spring Boot, non dalle applicazioni. |
| `SheetsmithProperties` (con i record annidati `Formats`, `Document`, `Validation`) | Le proprietà associate; `toDefaults()` e `toDocumentProperties()` le convertono. |
| `SpringConverterFactory` | Crea i converter di campo a partire dal contesto dell'applicazione. |
| `SheetsmithStartupValidator` | Il validatore all'avvio (un `SmartInitializingSingleton`). |

---

## 13. Validazione ed errori

### 13.1 Lettura di un errore di configurazione

Una `SheetsmithConfigurationException` elenca ogni errore trovato, uno per riga, in questo formato:

```
[code] package.Class$Nested.element: message
```

| Parte | Significato |
| --- | --- |
| `[code]` | La regola violata, da `V-01` a `V-25`. Consultarla nella [sezione 13.3](#133-catalogo-degli-errori-di-configurazione). |
| `package.Class` | Il nome completo della classe coinvolta: indica quale file sorgente aprire. È la classe sheet, il template di foglio o il foglio di stile che dichiara lo stile difettoso. |
| `$Nested` | Presente quando la classe è annidata in un'altra classe: `com.example.Reports$InvoiceRow` è la classe `InvoiceRow` dichiarata dentro `Reports.java`. |
| `element` | Cosa non va all'interno della classe: un **nome di campo** (`amount`), **`@ExcelSheet`** (l'annotazione a livello di classe), **`@ExcelSheetTemplate`** (l'annotazione di un template), **`@ExcelStyle(name)`** (uno stile con nome), **`@ExcelStyle(#n)`** (l'n-esimo stile dichiarato sulla classe, quando il suo nome è vuoto), o **`sheets[i]`** (l'i-esimo elemento, a partire da 0, della lista passata a `generate`, per gli errori sull'input). Viene omesso quando l'errore riguarda la classe o l'input nel suo complesso. |
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

### 13.2 Quando avviene la validazione

| Regole | Fase | Verificate da |
| --- | --- | --- |
| da V-01 a V-09, da V-13 a V-17, da V-21 a V-25 | Estrazione dei metadati di una classe sheet, fusi con il suo template | `generate`, `validate`, validazione all'avvio |
| V-06, V-08, V-09, V-13, da V-23 a V-25 | Un template da solo | `generate` e `validate` di ogni classe sheet che lo referenzia, `validate` del template, validazione all'avvio |
| da V-10 a V-12 | Associazione di un converter a ciascuna colonna | `generate`, `validate`, validazione all'avvio |
| da V-18 a V-20 | Input di `generate` | solo `generate` |

La validazione è fail-fast ma completa: ogni regola viene verificata e tutti gli errori dell'input e di tutte le classi sheet coinvolte, con i loro template, vengono segnalati insieme in un'unica eccezione, ciascuno una sola volta. Non viene scritto nulla se c'è almeno un errore. Le anomalie non vengono mai corrette silenziosamente.

### 13.3 Catalogo degli errori di configurazione

Ogni voce riporta la regola, l'elemento segnalato, un esempio minimo che la innesca, il messaggio e la correzione.

#### V-01: la classe è annotata con `@ExcelSheet`

- **Elemento:** nessuno.
- **Esempio:** `SheetData.of("Rows", PlainRecord.class, rows)` dove `PlainRecord` non ha `@ExcelSheet`; oppure `@ExcelSheet` posta solo su una superclasse.
- **Messaggio:** `[V-01] com.example.PlainRecord: the class is not annotated with @ExcelSheet`
- **Messaggio, per un template passato a `generate`:** `[V-01] com.example.CorporateReport: the class is annotated with @ExcelSheetTemplate, not with @ExcelSheet: a template cannot be exported, reference it from a sheet class with @ExcelSheet(template = ...)`
- **Messaggio, per `validate` su una classe senza nessuna delle due annotazioni:** `[V-01] com.example.PlainRecord: the class is not annotated with @ExcelSheet or @ExcelSheetTemplate`
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

- **Elemento:** il campo per `headerStyle` e gli slot di colonna; `@ExcelSheet` per `titleStyle` e gli slot di intestazione e corpo; `@ExcelSheetTemplate` per lo stile del titolo e gli slot di un template, i cui nomi devono esistere nei fogli di stile del template.
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
- **Esempio (mancante):** `@ExcelColumn(header = "Time spent", order = 10) Duration timeSpent;` senza un converter.
- **Messaggio:** `[V-10] com.example.Row.timeSpent: no converter for type java.time.Duration: declare one with @ExcelColumn(converter = ...) or register one for the type`
- **Esempio (ambiguo):** un tipo di campo che implementa due interfacce che hanno entrambe un converter di applicazione, alla stessa distanza.
- **Messaggio:** `[V-10] com.example.Row.code: converter for type com.example.Code is ambiguous: candidates [com.example.Labelled, com.example.Coded]: declare one with @ExcelColumn(converter = ...) or register one for the exact type`
- **Correzione:** dichiarare un converter di campo, oppure registrare un converter di applicazione per il tipo (per il tipo esatto nel caso ambiguo). Validare con un generatore configurato come quello di produzione.

#### V-11: il converter di campo gestisce un tipo compatibile

- **Elemento:** il campo.
- **Esempio:** `@ExcelColumn(header = "Qty", order = 20, converter = DurationInHours.class) int quantity;`
- **Messaggio:** `[V-11] com.example.Row.quantity: converter com.example.DurationInHours handles java.time.Duration, which is not assignable from the field type int`
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
- **Correzione:** aggiungere un getter pubblico con un tipo di ritorno compatibile, oppure aprire il package ([sezione 6.2.1](#621-accesso-al-valore)).

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

#### V-21: il template di una classe sheet è un template

- **Elemento:** `@ExcelSheet`, sulla classe sheet.
- **Esempio:** `@ExcelSheet(template = CorporateStyles.class)`, dove `CorporateStyles` è un foglio di stile e non un template.
- **Messaggio:** `[V-21] com.example.OrderRow.@ExcelSheet: template: com.example.CorporateStyles is not annotated with @ExcelSheetTemplate`
- **Correzione:** annotare la classe del template con `@ExcelSheetTemplate`, oppure referenziare la classe giusta.

#### V-22: una classe sheet con un template non imposta il preset

- **Elemento:** `@ExcelSheet`, sulla classe sheet.
- **Esempio:** `@ExcelSheet(template = CorporateReport.class, preset = TablePreset.DARK)`.
- **Messaggio:** `[V-22] com.example.OrderRow.@ExcelSheet: preset DARK is set together with template com.example.CorporateReport: remove preset from the sheet class, or declare it in the template`
- **Correzione:** rimuovere `preset` dalla classe sheet. Per usare un altro preset, dichiarare un altro template, oppure non usare un template su quella classe.

#### V-23: un template non è anche una classe sheet o un foglio di stile

- **Elemento:** `@ExcelSheetTemplate`, sulla classe del template.
- **Esempio:** una classe annotata sia con `@ExcelSheetTemplate` sia con `@ExcelSheet`, oppure sia con `@ExcelSheetTemplate` sia con `@ExcelStyleSheet`.
- **Messaggi:**
  - `[V-23] com.example.CorporateReport.@ExcelSheetTemplate: a template cannot also be a sheet class: move the sheet configuration to a separate class with @ExcelSheet(template = ...)`
  - `[V-23] com.example.CorporateReport.@ExcelSheetTemplate: a template cannot also be annotated with @ExcelStyleSheet: declare the template on a separate class`
- **Correzione:** dichiarare template, classi sheet e fogli di stile su classi separate.

#### V-24: un template non dichiara stili con nome

- **Elemento:** `@ExcelSheetTemplate`, sulla classe del template.
- **Esempio:** `@ExcelStyle(name = "header", bold = Toggle.TRUE)` dichiarato sulla classe del template.
- **Messaggio:** `[V-24] com.example.CorporateReport.@ExcelSheetTemplate: a template cannot declare @ExcelStyle: move the styles to a style sheet and reference it with styleSheets`
- **Segnalato anche:** gli stili dichiarati su un template vengono ignorati, quindi ogni slot del template che ne referenzia uno segnala anche V-06: `[V-06] com.example.CorporateReport.@ExcelSheetTemplate: style 'header' not found (referenced by header.base)`.
- **Correzione:** spostare gli stili in un foglio di stile ed elencarlo in `styleSheets` del template. Entrambi gli errori scompaiono.

#### V-25: un template non ha colonne

- **Elemento:** `@ExcelSheetTemplate`, sulla classe del template.
- **Esempio:** una classe template con un campo annotato con `@ExcelColumn`, dichiarato sulla classe o ereditato da una superclasse.
- **Messaggio:** `[V-25] com.example.CorporateReport.@ExcelSheetTemplate: a template cannot have fields annotated with @ExcelColumn (found: [amount]): columns belong to the sheet classes`
- **Correzione:** spostare le colonne nelle classi sheet. Un template contiene solo configurazione.

### 13.4 Errori di generazione

Una `SheetsmithGenerationException` viene lanciata mentre si scrive un foglio. Il suo messaggio termina con la posizione: `(sheet 'S', row N, field 'f')`, dove la riga e il campo compaiono solo quando pertinenti.

| Causa | Messaggio | Riga | Campo | Causa allegata |
| --- | --- | --- | --- | --- |
| Elemento null nella lista dei dati | `null element in the data list (sheet 'Orders', row 7)` | sì | no | no |
| Getter, accessor o lettura di campo che lancia un'eccezione | `cannot read the value (method getTotal()): java.lang.IllegalStateException: ... (sheet 'Orders', row 7, field 'total')` | sì | sì | sì |
| Converter che lancia un'eccezione | `converter failed: java.lang.IllegalArgumentException: ... (sheet 'Orders', row 7, field 'total')` | sì | sì | sì |
| Converter che restituisce null | `converter returned null; return CellValue.blank() for an empty cell (sheet 'Orders', row 7, field 'total')` | sì | sì | no |
| Testo più lungo di 32.767 caratteri | `text of 40000 characters exceeds the Excel limit of 32767 (sheet 'Orders', row 7, field 'notes')` | sì | sì | no |
| Troppe righe per un foglio | `the sheet needs 1048580 rows, more than the Excel limit of 1048576 (sheet 'Orders')` | no (0) | no | no |
| Più di 65.530 collegamenti in un foglio | `hyperlink 65531 exceeds the Excel limit of 65530 hyperlinks in a sheet (sheet 'Orders', row 65531, field 'document')` | sì | sì | no |
| Un collegamento che Apache POI non riesce ad aggiungere alla cella | `cannot add the hyperlink https://...: ... (sheet 'Orders', row 7, field 'document')` | sì | sì | sì |

La descrizione dell'accessor nel messaggio è `method getX()` quando è stato usato un getter, oppure `field x` quando il campo è stato letto direttamente. L'indice di riga è la posizione, a partire da 1, nella lista dei dati, quindi `row 7` è `rows.get(6)`. Il limite di righe conta il titolo e l'intestazione, ed è verificato prima che il foglio venga scritto. Il limite dei collegamenti conta i collegamenti di ciascun foglio, su tutte le colonne, nell'ordine di scrittura, ed è verificato mentre il foglio viene scritto, perché sono i converter a decidere quali celle sono collegamenti. Il testo di un collegamento, la sua descrizione o il suo indirizzo, segue il limite di 32.767 caratteri di ogni testo.

Le eccezioni checked lanciate da un getter senza dichiarazione (ad esempio tramite tecniche di "sneaky throw") vengono incapsulate in `java.lang.reflect.UndeclaredThrowableException` e poi segnalate come qualsiasi altro errore di un getter. Gli `Error` (come `OutOfMemoryError` o `StackOverflowError`) non vengono incapsulati.

### 13.5 Errori di infrastruttura

| Errore | Quando | Note |
| --- | --- | --- |
| `java.io.UncheckedIOException` | La serializzazione della cartella di lavoro fallisce, compreso un guasto dello stream del chiamante (connessione chiusa, disco pieno) | Non è un'eccezione di sheetsmith, di proposito. L'`IOException` originale è la causa. Con il metodo con stream, potrebbe essere stato scritto contenuto parziale. |
| `NullPointerException` | Un argomento null: `sheets`, un elemento di `sheets`, `out`, `type`, o un componente null dei record pubblici | Errore di programmazione. |
| `OutOfMemoryError` | La cartella di lavoro non sta nell'heap | Vedere la [sezione 14.3](#143-esportazioni-molto-grandi). |

### 13.6 Errori al di fuori della generazione

| Origine | Eccezione | Messaggio |
| --- | --- | --- |
| `Builder.converter` chiamato due volte per lo stesso tipo | `IllegalArgumentException` | `a converter is already registered for type X` |
| `SheetsmithDefaults` con valori non validi | `IllegalArgumentException` | `dateFormat must not be blank`, `dateTimeFormat must not be blank`, `preset must not be INHERIT`, `accentColor 'X' is not a valid colour: ...` |
| Due bean converter per lo stesso tipo (Spring) | `IllegalStateException` all'avvio | `converter beans 'a' and 'b' both handle type X; keep only one of them` |
| Bean converter con un tipo non determinabile (Spring) | `IllegalStateException` all'avvio | `cannot resolve the type handled by converter bean 'x'; ...` |
| Proprietà `sheetsmith.*` non valida (Spring) | errore di binding o `IllegalArgumentException` all'avvio | come sopra |
| Fallimento della validazione all'avvio (Spring) | `SheetsmithConfigurationException` all'avvio | l'elenco completo degli errori |
| `Hyperlink` con un indirizzo che non è un URI, non è assoluto, è senza host o ha uno schema diverso da `http`, `https` e `mailto` | `IllegalArgumentException`, nel codice che crea l'`Hyperlink` | vedi [sezione 11.5.1](#1151-il-tipo-hyperlink) |
| `Hyperlink` con un indirizzo null | `NullPointerException` | `address` |

### 13.7 Testare le classi sheet

```java
class SheetClassesTest {

    private final Sheetsmith sheetsmith = Sheetsmith.builder()
            .converter(Money.class, new MoneyConverter())     // configure like production
            .build();

    @ParameterizedTest
    @ValueSource(classes = {CustomerRow.class, InvoiceLine.class, OrderRow.class, CorporateReport.class})
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

Anche i template, come `CorporateReport` qui sopra, vengono validati allo stesso modo, da soli. In un test Spring Boot, iniettare il bean `Sheetsmith` per validare con i converter reali, oppure affidarsi alla validazione all'avvio, che fa fallire il contesto di test.

---

## 14. Limiti e comportamenti noti

Questa sezione elenca ogni limite noto e ogni comportamento che può sorprendere, compresi quelli lasciati deliberatamente così come sono e documentati invece di essere trasformati in errori.

### 14.1 Limiti di Excel

| Caso | Cosa succede | Cosa fare |
| --- | --- | --- |
| Data o data e ora precedente al 1900-01-01 | Excel non può rappresentarla: la cella contiene `-1` e viene visualizzata come `#####`. Non viene sollevato alcun errore. | Convertire tali valori in testo con un converter. |
| Numero `NaN` o infinito | La cella diventa un errore di Excel: `#NUM!` per `NaN`, `#DIV/0!` per l'infinito. Non viene sollevato alcun errore. Un `BigInteger` o `BigDecimal` troppo grande per un `double` diventa infinito. | Mapparli, ad esempio a `CellValue.blank()`. |
| Numero con più di 15 cifre significative | Si perde precisione: Excel memorizza numeri in virgola mobile a 64 bit. Un `long` oltre 2^53 o un `BigDecimal` grande o molto preciso viene arrotondato. Non viene sollevato alcun errore. | Scrivere gli identificatori e i decimali esatti come testo. |
| Testo più lungo di 32.767 caratteri | Excel non può memorizzarlo: `SheetsmithGenerationException`. Il limite vale anche per il testo mostrato da un collegamento. | Accorciare il testo prima di scriverlo. |
| Più di 65.530 collegamenti in un foglio | Excel non può aprire il foglio senza riparare il file, e la riparazione rimuove tutti i collegamenti del foglio: `SheetsmithGenerationException` al 65.531° collegamento. Il limite è per foglio. | Dividere i dati su più fogli, oppure scrivere come testo i collegamenti meno importanti. |
| Più di 1.048.576 righe in un foglio, titolo e intestazione inclusi | `SheetsmithGenerationException` prima che il foglio venga scritto. | Suddividere i dati su più fogli. |
| Foglio chiamato `History` | Excel riserva il nome al rilevamento delle modifiche e può rifiutare o riparare il file. Non viene rifiutato da sheetsmith. | Scegliere un altro nome di foglio. |
| Regole sul nome del foglio | Applicate da V-19 e V-20. | Ripulire i nomi costruiti a partire da dati. |
| Più di 16.384 colonne | Oltre il limite di Excel; non controllato da sheetsmith e non realistico per una classe annotata. | Nessuna. |
| Stili di cella (circa 64.000 per file) | Non è un limite pratico: gli stili uguali sono condivisi, quindi il numero di stili dipende dal numero di stili distinti, non dal numero di celle. | Nessuna. |

### 14.2 Conversione dei valori

| Comportamento | Spiegazione | Cosa fare |
| --- | --- | --- |
| I valori `float` mostrano cifre in più | I numeri vengono scritti tramite `doubleValue()`; un `float` come `0.1f` diventa `0.10000000149011612`, visibile con il formato Generale. | Usare `double` o `BigDecimal`, oppure impostare un formato numerico come `0.00`. |
| La scala di `BigDecimal` non viene preservata | `2.50` viene scritto come il numero `2.5`; gli zeri finali sono una questione di visualizzazione. | Impostare un formato, ad esempio `0.00`. |
| Le enum vengono scritte con `name()` | Gli override di `toString()` vengono ignorati. | Registrare un converter ([sezione 11.10](#1110-esempi)). |
| Frazioni di secondo | Excel memorizza gli orari con una precisione di circa un millisecondo; la precisione più fine di `LocalDateTime` va persa. | Nessuna, oppure scrivere come testo. |
| Testo che sembra un numero o una formula | I valori di testo vengono sempre scritti come celle di testo: `"00123"` mantiene gli zeri, `"=SUM(A1:A2)"` non è una formula. | Nessuna: è voluto. |
| Un getter con tipo di ritorno non corrispondente | Il getter viene ignorato e il campo viene letto direttamente ([sezione 6.2.1](#621-accesso-al-valore)). | Allineare il tipo di ritorno del getter al tipo del campo. |
| Formati predefiniti per le celle vuote | Le celle vuote (valori null o `CellValue.blank()`) non ricevono alcun formato predefinito, solo i formati impostati dagli stili. | Nessuna. |
| `numberFormat` si applica anche agli interi | Un `#,##0.00` predefinito mostra decimali nelle colonne di interi. | Dare alle colonne di interi `format = "0"` oppure `"#,##0"`. |
| `Year` è un numero | Segue il formato numerico della cella: con un valore predefinito di `#,##0.00`, 2026 viene mostrato come `2,026.00`. | Dare alla colonna `format = "0"`. |
| `java.sql.Timestamp` e ora legale | Il valore viene convertito nel fuso orario predefinito della JVM, come fa JDBC: un timestamp nell'ora saltata da un cambio dell'ora legale viene spostato di un'ora. | Memorizzare gli orari come `LocalDateTime`, oppure impostare il fuso orario della JVM. |
| I millisecondi non vengono mostrati | I millisecondi di un `Timestamp` o di un `LocalDateTime` sono conservati nel file, ma formati come `hh:mm` o `hh:mm:ss` non li mostrano. | Usare un formato come `hh:mm:ss.000` quando contano. |
| I percorsi `File` dipendono dal sistema | `File` viene scritto con il separatore del sistema operativo che genera il file. | Scrivere i percorsi con un converter quando il separatore conta. |

### 14.3 Esportazioni molto grandi

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
2. Per i fogli di grandi dimensioni, impostare `autoSizeColumns = Toggle.FALSE` e dare a ogni colonna un `width` esplicito.
3. Scrivere su uno stream invece di restituire un `byte[]` non riduce in modo significativo la memoria: la cartella di lavoro, non il file, ne occupa la maggior parte.
4. Le esportazioni grandi concorrenti si sommano: limitarne la concorrenza (ad esempio con un executor limitato o un semaforo) sui servizi con memoria limitata.
5. Suddividere i dataset molto grandi su più cartelle di lavoro piuttosto che su più fogli di una stessa cartella di lavoro, poiché tutti i fogli di una cartella di lavoro stanno in memoria insieme.

Una modalità streaming per volumi molto grandi non fa parte della versione 1.1.0: vedere la [sezione 17](#17-lavori-in-corso).

### 14.4 Dimensionamento automatico delle colonne

| Comportamento | Spiegazione |
| --- | --- |
| Dipende dai font installati | Apache POI misura il testo con i font Java AWT. Su server o container senza font o senza le librerie native di AWT, la misurazione fallisce e sheetsmith ripiega su una stima basata sul numero di caratteri dei valori visualizzati, più 2, con un massimo di 255. La stima non tiene conto di font proporzionali, testo in grassetto o dimensioni del font, quindi le colonne possono risultare leggermente più larghe o più strette rispetto a una misura esatta. |
| Titolo escluso, con un'eccezione | Il titolo unito non allarga mai le sue colonne. Con **una sola colonna e un titolo**, tuttavia, non c'è nulla da unire: la misurazione esatta di Apache POI include allora il testo del titolo, e la colonna diventa larga quanto il titolo, mentre la stima di ripiego ignora il titolo. Impostare un `width` esplicito sulla colonna quando la cosa conta. |
| Costo | Il dimensionamento legge ogni cella della colonna; sui fogli grandi domina il tempo di generazione. |
| Limite di larghezza | La larghezza massima è di 255 caratteri. |

Per rendere disponibile la misurazione esatta sui container Linux, installare nell'immagine un pacchetto di font e fontconfig (ad esempio `fontconfig` e un pacchetto di font DejaVu o Liberation), ed eseguire la JVM con `-Djava.awt.headless=true`.

### 14.5 Layout e stili

| Comportamento | Spiegazione |
| --- | --- |
| Le altezze delle righe non sono impostate | Le righe con testo a capo mantengono l'altezza predefinita finché l'applicazione di fogli di calcolo non le regola. |
| `locked` e `hidden` non hanno effetto visibile | Si applicano solo ai fogli protetti, e sheetsmith non protegge i fogli. |
| I colori indicizzati variano | Dipendono dalla tavolozza dell'applicazione che apre il file. Preferire i colori esadecimali. |
| Disponibilità dei font | Un nome di font non installato sulla macchina di chi legge viene sostituito dall'applicazione di fogli di calcolo. |
| Visualizzazione regionale | I separatori delle migliaia e dei decimali, e i nomi dei mesi e dei giorni, seguono le impostazioni regionali di chi legge. |
| I formati dei dati non sono validati | Un codice di formato non valido viene scritto così com'è; Excel può ignorarlo o segnalare che il file richiede una riparazione. |
| Lista di dati vuota | Il foglio ha il titolo (se presente) e l'intestazione; il filtro automatico copre solo l'intestazione; la cornice esterna si chiude sotto l'intestazione. |
| Collegamenti in LibreOffice | LibreOffice Calc mostra i collegamenti con i propri colori, blu e sottolineati, e ignora il colore del carattere e la sottolineatura della cella. I colori dichiarati e il carattere bianco del preset `DARK` sono visibili solo in Excel. Il file è corretto. |
| Colore della cornice e accento | Un colore della cornice dichiarato in un template resta lo stesso quando una classe sheet cambia il colore di accento: ogni attributo viene preso separatamente ([sezione 10.10](#1010-che-cosa-prende-una-classe-sheet-dal-suo-template)). |
| Stili e preset si fondono attributo per attributo | Uno stile che imposta una linea del bordo senza un colore prende il colore che il preset dà a quel bordo, se c'è: lo stesso stile può apparire leggermente diverso sotto preset diversi. Impostare il colore nello stile quando conta. |

### 14.6 Validazione e cache

| Comportamento | Spiegazione |
| --- | --- |
| Le classi non valide vengono rivalidate a ogni chiamata | Non vengono messe in cache, quindi il costo della validazione si paga di nuovo finché la classe non viene corretta. |
| Un template viene validato con ogni classe sheet | Il template viene ricontrollato per ogni classe sheet che lo referenzia; gli errori vengono segnalati una sola volta. |
| Classi compilate con una versione precedente | Una classe sheet compilata con la 1.0.0 che imposta `freezeHeader`, `autoFilter` o `autoSizeColumns` fallisce a runtime con `AnnotationTypeMismatchException` finché non viene ricompilata ([sezione 2.3](#23-ricompilare-ogni-classe-sheet)). |
| La creazione di un converter di campo che fallisce viene ritentata | Non viene memorizzata come fallita; viene tentata di nuovo a ogni validazione o generazione. |
| La validazione all'avvio usa il bean del contesto | Una classe sheet valida solo con un converter registrato altrove (ad esempio su un generatore diverso) viene segnalata. |
| La cache dei metadati è condivisa | Tutti i generatori dello stesso class loader condividono la cache dei metadati; le associazioni dei converter sono per generatore. |

---

## 15. Ricette

Casi d'uso completi e autosufficienti. Le dichiarazioni di package e gli import sono omessi dove ovvio. Tutti i nomi e i dati sono di fantasia.

### 15.1 Esportazione minima

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

### 15.2 Più fogli con classi diverse

```java
List<SheetData<?>> sheets = List.of(
        SheetData.of("Summary", SummaryRow.class, List.of(summary)),
        SheetData.of("Customers", CustomerRow.class, customers),
        SheetData.of("Orders", OrderRow.class, orders));

byte[] file = sheetsmith.generate(sheets);
```

I fogli compaiono nell'ordine della lista. Tutte e tre le classi vengono validate prima che venga scritto qualsiasi dato, e i loro errori, se presenti, vengono segnalati insieme.

### 15.3 Una classe, più fogli

```java
Map<YearMonth, List<OrderRow>> byMonth = orders.stream()
        .collect(Collectors.groupingBy(order -> YearMonth.from(order.date()), TreeMap::new, Collectors.toList()));

List<SheetData<?>> sheets = byMonth.entrySet().stream()
        .<SheetData<?>>map(e -> SheetData.of(e.getKey().toString(), OrderRow.class, e.getValue()))
        .toList();

byte[] file = sheetsmith.generate(sheets);
```

`YearMonth.toString()` produce nomi come `2026-09`, che sono nomi di foglio validi. I metadati di `OrderRow` vengono calcolati una sola volta.

### 15.4 Riga dei totali

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

### 15.5 Righe alternate senza preset

```java
@ExcelSheet(header = @HeaderStyles(base = "header"), body = @BodyStyles(even = "zebra"))
@ExcelStyle(name = "header", bold = Toggle.TRUE, borderBottom = Border.THIN)
@ExcelStyle(name = "zebra", fillColor = "#F2F2F2")
public record LogRow(
        @ExcelColumn(header = "When", order = 10, format = "dd/mm/yyyy hh:mm:ss") LocalDateTime when,
        @ExcelColumn(header = "Message", order = 20, width = 80) String message) {
}
```

### 15.6 Evidenziare una colonna chiave e allineare i numeri a destra

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

### 15.7 Tabella incorniciata

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

### 15.8 Report aziendale con un foglio di stile condiviso

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
        autoFilter = Toggle.TRUE)
public record SupplierBalanceRow(
        @ExcelColumn(header = "Supplier", order = 10, width = 40) String supplier,
        @ExcelColumn(header = "Balance", order = 20, styles = @ColumnStyles(base = "corp-money")) BigDecimal balance) {
}
```

Ogni report che referenzia `CorporateStyles` ottiene gli stessi font e formati; il preset `LIGHT` con l'accento aziendale fornisce linee e righe alternate. Quando molti report ripetono questa configurazione, dichiararla una sola volta in un template: vedi [sezione 15.19](#1519-molti-report-con-un-unico-aspetto-aziendale).

### 15.9 Value object e importi

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
        @ExcelColumn(header = "Currency", order = 30) Currency currency) {
}
```

La colonna `Currency` non ha bisogno di un converter: viene scritta come codice ISO, come `EUR`.

### 15.10 Date e ore con fusi orari

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

### 15.11 Codici e identificatori come testo

CAP, codici prodotto, IBAN e identificatori numerici lunghi non devono diventare numeri: gli zeri iniziali scomparirebbero e le cifre oltre la quindicesima andrebbero perse.

```java
@ExcelSheet
public record AccountRow(
        @ExcelColumn(header = "Postal code", order = 10) String postalCode,         // String: already text
        @ExcelColumn(header = "Reference", order = 20, converter = LongAsText.class) long reference) {
}
```

Mantenere tali valori come `String` nella classe sheet ogni volta che è possibile.

### 15.12 Scrivere su file e allegare a un'e-mail

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

### 15.13 Download da una servlet semplice

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

Per l'equivalente con Spring MVC vedere la [sezione 4.3](#43-download-da-un-controller-spring-mvc).

### 15.14 Validazione all'avvio e nei test

```yaml
sheetsmith:
  validation:
    packages: com.example.export
```

Ogni tipo `@ExcelSheet` sotto `com.example.export` viene validato all'avvio dell'applicazione; un errore impedisce l'avvio con l'elenco completo degli errori. Per i test, vedere la [sezione 13.7](#137-testare-le-classi-sheet).

### 15.15 Nomi di foglio costruiti da dati

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

### 15.16 Java semplice con un container di dependency injection

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

### 15.17 Esportazioni grandi

```java
@ExcelSheet(autoSizeColumns = Toggle.FALSE)
public record MovementRow(
        @ExcelColumn(header = "Id", order = 10, width = 12) long id,
        @ExcelColumn(header = "Date", order = 20, width = 12, format = "dd/mm/yyyy") LocalDate date,
        @ExcelColumn(header = "Description", order = 30, width = 50) String description,
        @ExcelColumn(header = "Amount", order = 40, width = 14, format = "#,##0.00") BigDecimal amount) {
}
```

Larghezze esplicite e nessun dimensionamento automatico; un heap dimensionato in base alle misure della [sezione 14.3](#143-esportazioni-molto-grandi); concorrenza limitata; dati suddivisi su più file oltre qualche centinaio di migliaia di righe.

### 15.18 Colonne ereditate da una classe base

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

### 15.19 Molti report con un unico aspetto aziendale

Un'applicazione produce molti report, ciascuno con le proprie colonne, tutti nello stile aziendale. Dichiarare gli stili una sola volta in un foglio di stile, la configurazione una sola volta in un template, e ridurre le classi sheet al loro titolo e alle loro colonne.

```java
@ExcelStyleSheet
@ExcelStyle(name = "corp-title", fontSize = 14, bold = Toggle.TRUE)
@ExcelStyle(name = "corp-header", bold = Toggle.TRUE, align = Align.CENTER)
@ExcelStyle(name = "corp-total", bold = Toggle.TRUE, borderTop = Border.DOUBLE)
public final class CorporateStyles {
    private CorporateStyles() {
    }
}

@ExcelSheetTemplate(
        preset = TablePreset.MEDIUM,
        accentColor = "#1F4E79",
        styleSheets = CorporateStyles.class,
        titleStyle = "corp-title",
        autoFilter = Toggle.TRUE,
        outerBorder = Border.MEDIUM,
        header = @HeaderStyles(base = "corp-header"),
        body = @BodyStyles(lastRow = "corp-total"))
public final class CorporateReport {
    private CorporateReport() {
    }
}

@ExcelSheet(title = "Invoices Q3", template = CorporateReport.class)
public record InvoiceLine(
        @ExcelColumn(header = "Number", order = 10) String number,
        @ExcelColumn(header = "Issued", order = 20) LocalDate issued,
        @ExcelColumn(header = "Amount", order = 30, format = "#,##0.00") BigDecimal amount) {
}

@ExcelSheet(title = "Purchases Q3", template = CorporateReport.class, accentColor = "#375623")
public record PurchaseLine(
        @ExcelColumn(header = "Supplier", order = 10) String supplier,
        @ExcelColumn(header = "Ordered", order = 20) LocalDate ordered,
        @ExcelColumn(header = "Amount", order = 30, format = "#,##0.00") BigDecimal amount) {
}
```

Ogni report riceve il preset `MEDIUM`, l'intestazione in grassetto e centrata, il titolo in 14 punti, il filtro automatico, la cornice media e il totale con doppia linea sull'ultima riga. Il report degli acquisti mantiene tutto questo in verde. La lista dei dati di ogni report termina con la sua riga di totale, che prende lo stile dello slot `lastRow`. Per condividere l'aspetto tra applicazioni, vedi [sezione 10.14](#1014-distribuire-lo-stile-aziendale).

### 15.20 Collegamenti alle pagine di un altro sistema

Un report elenca degli ordini, e ogni numero d'ordine deve aprire la pagina dell'ordine nel negozio online. Il numero d'ordine è un tipo di dominio; un converter di applicazione trasforma ogni colonna di quel tipo in un collegamento.

```java
public record OrderNumber(String value) { }

@Component
public class OrderNumberConverter implements CellConverter<OrderNumber> {

    @Override
    public CellValue convert(OrderNumber value, ConversionContext context) {
        String path = URLEncoder.encode(value.value(), StandardCharsets.UTF_8);
        return CellValue.link(Hyperlink.of("https://shop.example.com/orders/" + path, value.value()));
    }
}

@ExcelSheet(title = "Orders to ship")
public record ShipmentRow(
        @ExcelColumn(header = "Order", order = 10) OrderNumber order,
        @ExcelColumn(header = "Customer", order = 20) String customer,
        @ExcelColumn(header = "Ship by", order = 30, format = "dd/mm/yyyy") LocalDate shipBy) {
}
```

La cella mostra il numero d'ordine e apre la sua pagina. Codificare il numero mantiene l'indirizzo valido qualunque carattere contenga il numero. Quando solo una colonna deve essere un collegamento, dichiarare il converter su quel campo con `@ExcelColumn(converter = OrderNumberConverter.class)` e non farne un bean ([sezione 11.9](#119-bean-spring-come-converter-implicazioni)).

### 15.21 Collegamenti e-mail

```java
@ExcelSheet(title = "Suppliers")
public record SupplierRow(
        @ExcelColumn(header = "Supplier", order = 10) String name,
        @ExcelColumn(header = "Contact", order = 20) Hyperlink contact) {

    static SupplierRow of(String name, String email) {
        String subject = URLEncoder.encode("Order confirmation", StandardCharsets.UTF_8).replace("+", "%20");
        return new SupplierRow(name, Hyperlink.of("mailto:" + email + "?subject=" + subject, email));
    }
}
```

Il clic sulla cella apre il client di posta con destinatario e oggetto compilati. La cella mostra l'indirizzo. `URLEncoder` codifica gli spazi come `+`, che i client di posta mostrano letteralmente nell'oggetto: sostituirli con `%20`.

### 15.22 Esempio completo: report mensile di gestione delle pratiche

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
        autoFilter = Toggle.TRUE,
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

Cosa vede chi legge: un titolo nel font aziendale; un'intestazione con testo in grassetto, una linea di accento scuro e etichette con testo a capo; righe alternate chiare separate da linee sottili; numeri di pratica in grassetto; date centrate in `dd/mm/yyyy`; etichette di stato invece dei nomi delle costanti; importi allineati a destra con due decimali; un filtro automatico su ogni colonna; le proprietà del file che mostrano "Example Services Ltd" e "Case Reporting". Lo stile che dipende dal valore di una cella, come le pratiche scadute in rosso, non fa parte della versione 1.1.0: gli stili dipendono dalla posizione della cella, mai dal suo contenuto.

---

## 16. FAQ e risoluzione dei problemi

**La colonna generata è nella posizione sbagliata.**
Le colonne seguono `order` in ordine crescente, non l'ordine di dichiarazione. Controllare i valori di `order`, colonne ereditate comprese.

**Un campo non compare nel foglio.**
Vengono esportati solo i campi con `@ExcelColumn`. Controllare che l'annotazione sia sul campo (o sul componente del record), che sia l'annotazione di sheetsmith (`cloud.baldilorenzo.sheetsmith.annotation.ExcelColumn`) e che `SheetData` usi la classe prevista.

**Il mio getter non viene chiamato.**
Il getter deve essere pubblico, non static, senza argomenti, chiamato `getX` (o `isX` per `boolean`/`Boolean`), e il suo tipo di ritorno deve essere assegnabile al tipo del campo. Un'incongruenza tra primitivo e wrapper fa sì che sheetsmith legga direttamente il campo ([sezione 6.2.1](#621-accesso-al-valore)).

**Le date vengono mostrate come numeri.**
Excel memorizza le date come numeri; il formato le fa apparire come date. I valori data integrati ricevono sempre il formato data predefinito quando non è impostato alcun formato. Se uno stile o una colonna imposta un formato numerico su una colonna di date, quel formato vince. Se il valore è stato convertito con `CellValue.number`, usare invece `CellValue.date` o `CellValue.dateTime`.

**Il mio formato data mostra i minuti al posto dei mesi (o viceversa).**
Il formato usa la sintassi di Excel: `mm` è il mese a meno che segua un codice dell'ora o precede un codice dei secondi. Scrivere `dd/mm/yyyy` per le date e `hh:mm` per gli orari.

**I numeri mostrano troppi decimali.**
Impostare un formato sulla colonna, su uno stile o come `sheetsmith.formats.number`. I campi `float` mostrano artefatti binari: preferire `double` o `BigDecimal`.

**Gli zeri iniziali scompaiono.**
Il valore è numerico. Mantenerlo come `String` oppure convertirlo con `CellValue.text`.

**L'applicazione non si avvia con l'errore "both handle type".**
Due bean converter gestiscono lo stesso tipo. Tenerne uno, oppure trasformare quello specifico di una colonna in un converter di campo che non sia un bean ([sezione 11.9](#119-bean-spring-come-converter-implicazioni)).

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
Sul server mancano i font e la larghezza ripiega su una stima. Installare i font nell'immagine, oppure impostare larghezze esplicite ([sezione 14.4](#144-dimensionamento-automatico-delle-colonne)).

**L'unica colonna di un foglio con titolo è larga quanto il titolo.**
Comportamento noto ([sezione 14.4](#144-dimensionamento-automatico-delle-colonne)): impostare un `width` esplicito.

**Excel dice che il file richiede una riparazione.**
Le cause abituali sono un codice di formato dei dati non valido (i formati non vengono validati) oppure un foglio chiamato `History`. Troppi collegamenti in un foglio non possono esserne la causa: sheetsmith interrompe prima la generazione.

**La generazione è lenta o esaurisce la memoria.**
Vedere la [sezione 14.3](#143-esportazioni-molto-grandi): disattivare il dimensionamento automatico, impostare le larghezze, dimensionare l'heap, limitare la concorrenza.

**Posso scrivere formule, immagini, commenti, formattazione condizionale o validazione dei dati?**
Non nella versione 1.1.0. Un testo che inizia con `=` viene scritto come testo, non come formula.

**Posso tradurre le intestazioni?**
Le intestazioni vengono scritte come dichiarate. La localizzazione è lasciata all'applicazione, ad esempio preparando classi sheet diverse o con una post-elaborazione.

**Posso usare sheetsmith al di fuori di Spring?**
Sì: importare `sheetsmith-core` e usare `Sheetsmith.builder()`.

**Dopo l'aggiornamento, l'applicazione fallisce con `AnnotationTypeMismatchException` su `ExcelSheet.autoFilter()` (o `freezeHeader()`, `autoSizeColumns()`).**
Le classi sheet sono state compilate con la versione precedente della libreria e non sono state ricompilate: ricompilare da zero (`mvn clean verify`, oppure il comando di ricompilazione completa dell'IDE), compresi i jar che contengono classi sheet ([sezione 2.3](#23-ricompilare-ogni-classe-sheet)).

**Il compilatore segnala `boolean cannot be converted to cloud.baldilorenzo.sheetsmith.style.Toggle`.**
`freezeHeader`, `autoFilter` e `autoSizeColumns` sono `Toggle`: scrivere `Toggle.TRUE` o `Toggle.FALSE` ([sezione 2.2](#22-opzioni-di-layout-di-excelsheet)).

**Una classe sheet che usa un template segnala V-22.**
Il preset lo sceglie solo il template. Rimuovere `preset` dalla classe sheet, oppure usare un altro template.

**Il mio template segnala insieme V-24 e V-06.**
Il template dichiara stili con nome, cosa non ammessa, e i suoi slot li usano. Spostare gli stili in un foglio di stile e referenziarlo con `styleSheets`: entrambi gli errori scompaiono.

**Ho cambiato il colore di accento di un report, ma la sua cornice mantiene il colore del template.**
Il template imposta `outerBorderColor`, e ogni attributo viene preso separatamente. Impostare `outerBorderColor` anche sulla classe sheet, oppure lasciarlo non impostato nel template ([sezione 10.10](#1010-che-cosa-prende-una-classe-sheet-dal-suo-template)).

**Uno slot del mio template usa lo stile sbagliato in un report.**
La classe sheet, o uno dei suoi fogli di stile, dichiara uno stile con lo stesso nome, che vince sui fogli di stile del template ([sezione 10.11](#1011-stili-disponibili-a-una-classe-sheet-con-un-template)). Rinominarne uno, salvo che la sostituzione sia voluta.

**I miei collegamenti non sono blu, o non sono sottolineati.**
Uno stile della cella, o il preset, imposta il colore del carattere o la sottolineatura: l'aspetto del collegamento riempie solo ciò che gli stili lasciano non impostato ([sezione 11.5.4](#1154-aspetto)).

**I miei collegamenti appaiono diversi in LibreOffice.**
LibreOffice Calc mostra i collegamenti con i propri colori e ignora il colore e la sottolineatura della cella. Il file è corretto: verificarlo in Excel.

**Una colonna di tipo `Hyperlink` mostra l'indirizzo come semplice testo, senza collegamento.**
Un converter registrato per quella colonna, o per un supertipo come `Record`, restituisce `CellValue.text`. Restituire `CellValue.link` dal converter, oppure rimuoverlo.

**La generazione fallisce con `converter failed: java.lang.IllegalArgumentException: invalid hyperlink address`.**
Un converter costruisce un indirizzo a partire da dati che contengono caratteri non ammessi in un URI, come gli spazi. Codificare i valori inseriti nell'indirizzo, per esempio con `URLEncoder` ([sezione 11.5.3](#1153-collegamenti-prodotti-dai-converter)).

**La generazione fallisce con `hyperlink 65531 exceeds the Excel limit of 65530 hyperlinks in a sheet`.**
Excel non può aprire un foglio con più collegamenti senza ripararlo, e la riparazione li rimuove tutti. Dividere i dati su più fogli, oppure scrivere come testo i collegamenti meno importanti.

**Posso usare le classi in `cloud.baldilorenzo.sheetsmith.internal`?**
No. Sono dettagli di implementazione, esclusi dal Javadoc pubblicato e soggetti a modifiche senza preavviso ([Appendice A](#appendice-a-censimento-delle-classi)).

---

## 17. Lavori in corso

Questa sezione elenca le evoluzioni in valutazione. Nulla di quanto riportato qui è disponibile nella versione 1.1.0, e nulla costituisce un impegno su contenuti o date.

| Argomento | Stato | Descrizione |
| --- | --- | --- |
| Catalogo di template predefiniti | In valutazione | Un catalogo di template di foglio pronti, forniti dalla libreria, simile alla galleria degli stili di tabella di Excel. |
| Modalità streaming per volumi molto grandi | In valutazione | Una modalità che scrive le righe progressivamente invece di costruire l'intera cartella di lavoro in memoria, per esportazioni oltre i volumi indicati nella [sezione 14.3](#143-esportazioni-molto-grandi). Verrebbe aggiunta come estensione compatibile, con un nuovo tipo di input per i dati in streaming. |
| Limitazione dell'accesso alle classi interne | In valutazione | Impedire alle applicazioni di dipendere dai package `internal`, che oggi sono pubblici per ragioni tecniche. |
| Assistente per la documentazione | In valutazione, dopo che la libreria sarà stabile in produzione | Un assistente sul sito della documentazione che riceve una classe Java e una descrizione della tabella desiderata e restituisce la classe con le annotazioni di sheetsmith applicate, con una breve spiegazione. |

Sono **fuori ambito** e non pianificati: la lettura di file Excel, il formato `.xls`, le tabelle Excel native (sheetsmith mantiene il proprio modello di stile) e la traduzione dei testi di intestazione.

**Idee e suggerimenti sono benvenuti.** Proponili nella [categoria Ideas di GitHub Discussions](https://github.com/BaldiLore/sheetsmith/discussions/categories/ideas), oppure apri una richiesta di funzionalità dai [modelli di issue](https://github.com/BaldiLore/sheetsmith/issues/new/choose) del repository. Le domande vanno nella [categoria Q&A](https://github.com/BaldiLore/sheetsmith/discussions/categories/q-a), i bug in una segnalazione di bug.

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
| `ExcelSheetTemplate` | stesso | annotazione | template di foglio |
| `ExcelSheetTemplate.None` | stesso | classe final | marcatore che significa nessun template, mai usato direttamente |
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
| `CellValue.Text`, `Numeric`, `Bool`, `Date`, `DateTime`, `Link` | stesso | record | forme di `CellValue` |
| `CellValue.Blank` | stesso | classe final | la cella vuota, singleton |
| `ConversionContext` | stesso | interfaccia | dove viene scritto un valore |
| `Hyperlink` | `cloud.baldilorenzo.sheetsmith.value` | record | un collegamento da scrivere in una cella |

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
| `internal.convert` | `BuiltInConverters`, `SqlConverters`, `ConverterRegistry`, `ConverterTypes`, `ConverterBinder`, `ReflectiveConverterFactory`, `SheetBinding` | converter integrati, risoluzione, associazione dei converter alle colonne, factory predefinita |
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

`Toggle` è usato dagli attributi sì o no di `@ExcelStyle` e dalle opzioni di layout `freezeHeader`, `autoFilter` e `autoSizeColumns` di `@ExcelSheet` e di `@ExcelSheetTemplate`. Per le opzioni di layout, `INHERIT` significa la scelta del template, poi il valore predefinito della libreria: intestazione bloccata, nessun filtro automatico, dimensionamento automatico.

### B.8 `TablePreset`

| Costante | Significato |
| --- | --- |
| `INHERIT` | Usa il preset del template, poi il preset predefinito dell'applicazione. Valido solo su una classe sheet o su un template (valore predefinito di `@ExcelSheet.preset` e di `@ExcelSheetTemplate.preset`). |
| `NONE` | Nessun preset. Valore predefinito dell'applicazione. |
| `LIGHT` | Tabella chiara ([sezione 9.2](#92-i-preset)). |
| `MEDIUM` | Tabella media. |
| `DARK` | Tabella scura. |

Le enum rispecchiate (`Align`, `VerticalAlign`, `Border`, `Fill`, `Underline`) contengono `INHERIT` più esattamente una costante per ciascuna costante della corrispondente enum di Apache POI, con nomi identici. Un test della libreria verifica la corrispondenza, così una versione futura di POI con nuove costanti viene rilevata quando la libreria viene compilata.

### B.9 Nomi di `IndexedColors`

I nomi accettati come colori sono le costanti di `org.apache.poi.ss.usermodel.IndexedColors` nella versione di Apache POI usata da sheetsmith (5.5.1 per sheetsmith 1.1.0):

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
| Template | nessuno |
| Titolo | nessuno |
| Intestazione bloccata | sì |
| Filtro automatico | no |
| Dimensionamento automatico delle colonne | sì |
| Cornice esterna | nessuna |
| Preset | `INHERIT` sulla classe e sul template, `NONE` per l'applicazione |
| Colore di accento | predefinito dell'applicazione, `#4472C4` |
| Formato data | `yyyy-mm-dd` |
| Formato data e ora | `yyyy-mm-dd hh:mm:ss` |
| Formato numerico | "Generale" di Excel |
| Autore e applicazione del documento | `sheetsmith` |
| Validazione all'avvio | disabilitata |
| Aspetto dei collegamenti | sottolineatura singola e colore `#0563C1`, dove gli stili non impostano né l'una né l'altro |
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
| Collegamento ipertestuale | Un collegamento scritto in una cella: un valore `Hyperlink`, oppure qualsiasi `CellValue.Link` restituito da un converter. |
| Aspetto del collegamento | La sottolineatura e il colore dati alle celle con collegamento dove i loro stili non impostano né l'una né l'altro. |
| Stile con nome | Un insieme di attributi di formattazione dichiarato con `@ExcelStyle` e identificato dal suo nome. |
| Preset | Uno stile di tabella già pronto generato a partire da un colore di accento. |
| Ruolo | La posizione di una cella nella tabella (riga dispari o pari, prima o ultima riga, prima o ultima colonna), che seleziona gli slot da applicare. |
| Classe sheet | Una classe annotata con `@ExcelSheet`, che descrive una tabella. |
| Slot | Un punto in cui uno stile con nome viene applicato, per nome. |
| Template di foglio | Una classe annotata con `@ExcelSheetTemplate` che dichiara una configurazione di foglio condivisa da più classi sheet. |
| Foglio di stile | Una classe annotata con `@ExcelStyleSheet` che contiene stili con nome condivisi. |
| Non impostato | Il valore predefinito di un attributo di stile, che non sovrascrive nulla. |
