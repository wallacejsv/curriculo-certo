import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Resume } from "@/lib/schema";

const LABELS = {
  pt: {
    summary: "Resumo Profissional",
    experience: "Experiência Profissional",
    skills: "Competências",
    education: "Formação Acadêmica",
    certifications: "Certificações",
    languages: "Idiomas",
  },
  en: {
    summary: "Professional Summary",
    experience: "Professional Experience",
    skills: "Skills",
    education: "Education",
    certifications: "Certifications",
    languages: "Languages",
  },
} as const;

// Paleta sóbria: um único acento (navy profundo) + tons de tinta/cinza.
const ACCENT = "#22364a"; // navy profundo — nome, títulos, réguas
const INK = "#1a1a1a"; // texto principal
const MUTED = "#3d4b5a"; // texto secundário (empresa, headline)
const FAINT = "#6b7785"; // texto terciário (períodos, contato)
const RULE = "#d7dde3"; // réguas finas

const styles = StyleSheet.create({
  page: {
    paddingVertical: 38,
    paddingHorizontal: 46,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
    borderBottomStyle: "solid",
    paddingBottom: 9,
  },
  name: { fontSize: 21, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 0.3 },
  headline: { fontSize: 11, marginTop: 3, color: MUTED },
  contact: { fontSize: 8.5, marginTop: 6, color: FAINT, letterSpacing: 0.2 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    color: ACCENT,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
    borderBottomStyle: "solid",
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  summaryText: { textAlign: "justify", color: INK },
  jobBlock: { marginBottom: 11 },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  role: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: INK },
  company: { color: MUTED, fontFamily: "Helvetica" },
  period: { fontSize: 9, color: FAINT },
  bulletRow: { flexDirection: "row", marginTop: 2.5, paddingLeft: 1 },
  bulletDot: { width: 10, color: ACCENT, fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1, color: INK },
  skillsText: { color: INK },
  eduBlock: { marginBottom: 5 },
  eduDegree: { fontFamily: "Helvetica-Bold", color: INK },
});

export function ResumeDocument({ resume }: { resume: Resume }) {
  const t = LABELS[resume.language];
  const c = resume.contact;
  const contactLine = [c.email, c.phone, c.location, c.linkedin, c.website]
    .filter(Boolean)
    .join("  •  ");

  return (
    <Document
      title={`${c.name} — ${resume.headline}`}
      author={c.name}
      language={resume.language}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.headline}>{resume.headline}</Text>
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.summary}</Text>
          <Text style={styles.summaryText}>{resume.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.experience}</Text>
          {resume.experience.map((exp, i) => (
            <View key={i} style={styles.jobBlock} wrap={false}>
              <View style={styles.jobHeader}>
                <Text style={styles.role}>
                  {exp.role}
                  <Text style={styles.company}>
                    {"  —  "}
                    {exp.company}
                    {exp.location ? `, ${exp.location}` : ""}
                  </Text>
                </Text>
                <Text style={styles.period}>{exp.period}</Text>
              </View>
              {exp.bullets.map((b, j) => (
                <View key={j} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>–</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.skills}</Text>
            <Text style={styles.skillsText}>{resume.skills.join("  •  ")}</Text>
          </View>
        )}

        {resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.education}</Text>
            {resume.education.map((ed, i) => (
              <View key={i} style={styles.eduBlock}>
                <Text>
                  <Text style={styles.eduDegree}>{ed.degree}</Text>
                  {"  —  "}
                  {ed.institution}
                  {ed.year ? `  (${ed.year})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {resume.certifications && resume.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.certifications}</Text>
            {resume.certifications.map((cert, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {resume.languages && resume.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.languages}</Text>
            <Text>
              {resume.languages
                .map((l) => `${l.name} (${l.level})`)
                .join("  •  ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
