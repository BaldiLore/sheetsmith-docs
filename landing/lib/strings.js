// Texts of the landing page, in every language of the site.
// The landing page is published at the root of the site: English at "/", Italian at "/it/".
// The headline is the motto of the library and stays in English in every language.
// The code samples are not translated: they are the same Java code in every language.
const STRINGS = {
	en: {
		'meta.title': 'sheetsmith: styled Excel files from annotated Java classes',
		'meta.description':
			'Annotation-driven Excel generation for Spring Boot, built on Apache POI. Describe a table once, pass a list of objects, get an .xlsx file back.',
		'nav.home': 'sheetsmith home',
		'nav.version': 'Latest release',
		'hero.eyebrow': 'Spring Boot · Apache POI · Java 17+',
		'hero.headline': 'Spreadsheets, forged in Java.',
		'hero.lead':
			'Describe a table once with annotations, pass a list of objects, get an .xlsx file back: title, header, rows, styles, presets and formats included.',
		'cta.docs': 'Read the docs',
		'cta.javadoc': 'Javadoc',
		'cta.maven': 'Maven Central',
		'cta.github': 'GitHub',
		'copy.label': 'Copy the dependency',
		'copy.idle': 'Copy',
		'copy.done': 'Copied',
		'showcase.title': 'What you write, and what your users open',
		'showcase.hint':
			'Hover an annotation to see what it controls. Pick a preset and an accent colour to see the result.',
		'showcase.preset': 'Preset',
		'showcase.accent': 'Accent',
		'showcase.sheetLabel': 'Excel sheet generated from the InvoiceRow class',
		'region.title': 'title adds a row above the header, merged across all the columns.',
		'region.preset': 'preset applies a ready-made table style: LIGHT, MEDIUM or DARK.',
		'region.accent':
			'accentColor is the colour every tone is derived from. Text on fills turns white or black, whichever reads better.',
		'region.filter': 'autoFilter adds Excel filters from the header to the last data row.',
		'region.colA': 'header labels the column, order sets its position.',
		'region.colB': 'Only fields annotated with @ExcelColumn become columns.',
		'region.colC': 'format applies an Excel date pattern to the column.',
		'region.colD': 'format applies an Excel number pattern to the column.',
		'region.tab': 'The sheet name comes from SheetData, so one class can fill many tabs.',
		'accent.#1F4E79': 'Dark blue',
		'accent.#4472C4': 'Default blue',
		'accent.#70AD47': 'Green',
		'accent.#C00000': 'Red',
		'features.title': 'Everything a report needs, declared where the data lives.',
		'f1.label': '01 · OUTPUT',
		'f1.title': 'One call. Bytes or a stream.',
		'f1.text':
			'Pass as many sheets as the workbook needs, each with its own class. Get the file back as a byte array, or write it straight to an output stream such as an HTTP response.',
		'f2.label': '02 · COMPANY STYLE',
		'f2.title': 'Define your style once. Use it in every report.',
		'f2.text':
			'Collect named styles in a style sheet class, then reference it from any sheet class. A style declared on the sheet class wins over one with the same name from the style sheet.',
		'f3.label': '03 · CONVERTERS',
		'f3.title': 'Any type, written the way you need.',
		'f3.text':
			'Text, numbers, booleans, enums, LocalDate and LocalDateTime work out of the box. For any other type, write a converter. Declared as a bean, it covers every column of that type. Declared on a field, it covers that column only.',
		'f4.label': '04 · SETUP',
		'f4.title': 'Spring Boot native. Plain Java welcome.',
		'f4.text':
			'With the starter, a ready-to-use Sheetsmith bean is auto-configured: you only inject it. Application-wide defaults, such as preset and accent colour, go in your properties. Without Spring, the core module gives you the same generator through a builder.',
		'f4.plain': 'Plain Java',
		'steps.title': 'Up and running in three steps.',
		's1.title': 'Add the starter',
		's1.text': 'One dependency, auto-configured. No platform assumptions.',
		's2.title': 'Annotate your class',
		's2.text': 'Classes, records and inherited fields. Only annotated fields are exported.',
		's3.title': 'Call generate',
		's3.text': 'Pass one or more sheets, get the workbook back.',
		'steps.cta': 'Read the user guide',
		'footer.license': 'Apache License 2.0',
		'footer.docs': 'Docs',
	},
	it: {
		'meta.title': 'sheetsmith: file Excel formattati da classi Java annotate',
		'meta.description':
			'Generazione di file Excel guidata dalle annotazioni per Spring Boot, basata su Apache POI. Descrivi la tabella una volta, passa una lista di oggetti, ricevi il file .xlsx.',
		'nav.home': 'Home di sheetsmith',
		'nav.version': 'Ultima release',
		'hero.lead':
			'Descrivi la tabella una volta sola con le annotazioni, passa una lista di oggetti e ricevi il file .xlsx: titolo, intestazione, righe, stili, preset e formati compresi.',
		'cta.docs': 'Leggi la documentazione',
		'copy.label': 'Copia la dipendenza',
		'copy.idle': 'Copia',
		'copy.done': 'Copiato',
		'showcase.title': 'Quello che scrivi e quello che aprono i tuoi utenti',
		'showcase.hint':
			"Passa su un'annotazione per vedere che cosa controlla. Scegli un preset e un colore di accento per vedere il risultato.",
		'showcase.accent': 'Accento',
		'showcase.sheetLabel': 'Foglio Excel generato dalla classe InvoiceRow',
		'region.title': "title aggiunge una riga sopra l'intestazione, unita su tutte le colonne.",
		'region.preset': 'preset applica uno stile di tabella pronto: LIGHT, MEDIUM o DARK.',
		'region.accent':
			'accentColor è il colore da cui derivano tutte le tonalità. Il testo sui riempimenti diventa bianco o nero, quello che si legge meglio.',
		'region.filter': "autoFilter aggiunge i filtri di Excel dall'intestazione all'ultima riga di dati.",
		'region.colA': "header è l'etichetta della colonna, order ne fissa la posizione.",
		'region.colB': 'Diventano colonne solo i campi annotati con @ExcelColumn.',
		'region.colC': 'format applica alla colonna un formato data di Excel.',
		'region.colD': 'format applica alla colonna un formato numerico di Excel.',
		'region.tab': 'Il nome del foglio arriva da SheetData: la stessa classe può riempire più fogli.',
		'accent.#1F4E79': 'Blu scuro',
		'accent.#4472C4': 'Blu predefinito',
		'accent.#70AD47': 'Verde',
		'accent.#C00000': 'Rosso',
		'features.title': 'Tutto quello che serve a un report, dichiarato dove vivono i dati.',
		'f1.title': 'Una chiamata. Byte o stream.',
		'f1.text':
			'Passa tutti i fogli che servono al workbook, ognuno con la sua classe. Ricevi il file come array di byte, oppure scrivilo direttamente su uno stream di output, come una risposta HTTP.',
		'f2.label': '02 · STILE AZIENDALE',
		'f2.title': 'Definisci lo stile una volta. Usalo in ogni report.',
		'f2.text':
			'Raccogli gli stili con nome in una classe style sheet e richiamala da qualsiasi classe foglio. Uno stile dichiarato sulla classe foglio vince su quello con lo stesso nome dello style sheet.',
		'f3.label': '03 · CONVERTER',
		'f3.title': 'Qualsiasi tipo, scritto come serve a te.',
		'f3.text':
			'Testo, numeri, booleani, enum, LocalDate e LocalDateTime funzionano subito. Per ogni altro tipo scrivi un converter. Dichiarato come bean, copre tutte le colonne di quel tipo. Dichiarato su un campo, copre solo quella colonna.',
		'f4.label': '04 · CONFIGURAZIONE',
		'f4.title': 'Nativo per Spring Boot. Anche in Java puro.',
		'f4.text':
			"Con lo starter, un bean Sheetsmith pronto all'uso viene configurato in automatico: basta iniettarlo. I valori predefiniti dell'applicazione, come preset e colore di accento, stanno nelle proprietà. Senza Spring, il modulo core offre lo stesso generatore tramite un builder.",
		'f4.plain': 'Java puro',
		'steps.title': 'Operativo in tre passi.',
		's1.title': 'Aggiungi lo starter',
		's1.text': 'Una dipendenza, configurata in automatico. Nessun presupposto sulla piattaforma.',
		's2.title': 'Annota la classe',
		's2.text': 'Classi, record e campi ereditati. Vengono esportati solo i campi annotati.',
		's3.title': 'Chiama generate',
		's3.text': 'Passa uno o più fogli, ricevi il workbook.',
		'steps.cta': 'Leggi la guida utente',
		'footer.docs': 'Documentazione',
	},
};

/** Returns the text for `key` in `lang`, falling back to English. */
export function t(lang, key) {
	return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Every text of one language, English where a translation is missing. */
export function strings(lang) {
	return { ...STRINGS.en, ...STRINGS[lang] };
}
