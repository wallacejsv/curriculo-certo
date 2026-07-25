import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Contact, CoverLetter } from "@/lib/schema";

// Mesma paleta sóbria do currículo, para os dois PDFs lerem como um conjunto.
const ACCENT = "#22364a";
const INK = "#1a1a1a";
const FAINT = "#6b7785";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 56,
    paddingHorizontal: 60,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.55,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
    borderBottomStyle: "solid",
    paddingBottom: 8,
    marginBottom: 20,
  },
  name: { fontSize: 15, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 0.3 },
  contact: { fontSize: 8.5, color: FAINT, marginTop: 4, letterSpacing: 0.2 },
  date: { fontSize: 9.5, color: FAINT, textAlign: "right", marginBottom: 18 },
  greeting: { marginBottom: 13 },
  paragraph: { marginBottom: 12, textAlign: "justify" },
  closing: { marginTop: 10 },
  signature: { marginTop: 4, fontFamily: "Helvetica-Bold", color: ACCENT },
});

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatDate(language: "pt" | "en"): string {
  const now = new Date();
  if (language === "pt") {
    return `${now.getDate()} de ${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;
  }
  return now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CoverLetterDocument({
  coverLetter,
  contact,
  language,
}: {
  coverLetter: CoverLetter;
  contact: Contact;
  language: "pt" | "en";
}) {
  const contactLine = [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .join("  •  ");

  return (
    <Document
      title={`${contact.name} — ${
        language === "pt" ? "Carta de Apresentação" : "Cover Letter"
      }`}
      author={contact.name}
      language={language}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{contact.name}</Text>
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        <Text style={styles.date}>{formatDate(language)}</Text>

        <Text style={styles.greeting}>{coverLetter.greeting}</Text>

        {coverLetter.paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.closing}>
          <Text>{coverLetter.closing}</Text>
          <Text style={styles.signature}>{contact.name}</Text>
        </View>
      </Page>
    </Document>
  );
}
