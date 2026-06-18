import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const INER = {
  green: "#044245",
  gray: "#707070",
  amber: "#FFA700",
  amberLight: "#fff6e5",
  ok: "#2f8f46",
  okLight: "#e9f5ec",
};

export interface ItemNo {
  seccion: string;
  numero: string;
  texto: string;
  observacion: string;
}

export interface InspeccionEmailProps {
  pilotoNombre: string;
  parqueNombre: string;
  equipoRPA: string;
  fechaTexto: string;
  estado: "COMPLETA_SI" | "CON_OBSERVACIONES";
  itemsNo: ItemNo[];
  totalSi: number;
  totalNo: number;
  totalNa: number;
  total: number;
  logoUrl: string;
}

export function InspeccionEmail({
  pilotoNombre,
  parqueNombre,
  equipoRPA,
  fechaTexto,
  estado,
  itemsNo,
  totalSi,
  totalNo,
  totalNa,
  total,
  logoUrl,
}: InspeccionEmailProps) {
  const conforme = estado === "COMPLETA_SI";
  const preview = conforme
    ? `Checklist conforme — ${parqueNombre} · ${pilotoNombre}`
    : `Checklist CON OBSERVACIONES (${totalNo}) — ${parqueNombre} · ${pilotoNombre}`;

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={logoUrl} alt="INER" height={40} style={{ margin: "0 auto" }} />
            <Text style={styles.headerTitle}>CHECKLIST INSPECCIONES EXTERNAS</Text>
            <Text style={styles.headerSub}>Inspección RPA · OPE-PR-01</Text>
          </Section>

          {conforme ? (
            <Section style={{ ...styles.banner, ...styles.bannerOk }}>
              <Text style={styles.bannerTextOk}>
                ✓ Checklist completado — todas las casillas en SÍ
              </Text>
            </Section>
          ) : (
            <Section style={{ ...styles.banner, ...styles.bannerWarn }}>
              <Text style={styles.bannerTextWarn}>
                ⚠ Inspección con observaciones — {totalNo}{" "}
                {totalNo === 1 ? "ítem marcado" : "ítems marcados"} en NO
              </Text>
            </Section>
          )}

          <Section style={styles.datos}>
            <Text style={styles.dato}>
              <strong>Piloto:</strong> {pilotoNombre}
            </Text>
            <Text style={styles.dato}>
              <strong>Parque:</strong> {parqueNombre}
            </Text>
            <Text style={styles.dato}>
              <strong>Equipo / RPA:</strong> {equipoRPA}
            </Text>
            <Text style={styles.dato}>
              <strong>Fecha:</strong> {fechaTexto}
            </Text>
            <Text style={styles.resumen}>
              {totalSi} SÍ · {totalNo} NO · {totalNa} N/A &nbsp;(de {total} ítems)
            </Text>
          </Section>

          {!conforme && (
            <Section style={styles.tablaWrap}>
              <Heading as="h2" style={styles.h2}>
                Ítems marcados en NO
              </Heading>
              <table style={styles.tabla} cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sección</th>
                    <th style={styles.th}>Ítem</th>
                    <th style={styles.th}>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsNo.map((it, i) => (
                    <tr key={i}>
                      <td style={styles.td}>
                        <strong>{it.numero}.</strong> {it.seccion}
                      </td>
                      <td style={styles.td}>{it.texto}</td>
                      <td style={styles.tdObs}>{it.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            Se adjunta el formato completo en PDF con las casillas marcadas.
            <br />
            INER — Ingeniería en Energías Renovables · Documento generado digitalmente.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default InspeccionEmail;

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#eef1f1",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    maxWidth: "600px",
    margin: "0 auto",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e0e4e4",
  },
  header: {
    backgroundColor: INER.green,
    padding: "22px 24px 18px",
    textAlign: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    margin: "12px 0 2px",
  },
  headerSub: { color: "#bcd2d2", fontSize: "12px", margin: 0 },
  banner: { padding: "12px 24px", textAlign: "center" },
  bannerOk: { backgroundColor: INER.okLight },
  bannerWarn: { backgroundColor: INER.amberLight },
  bannerTextOk: { color: INER.ok, fontWeight: "bold", fontSize: "15px", margin: 0 },
  bannerTextWarn: { color: "#9a6200", fontWeight: "bold", fontSize: "15px", margin: 0 },
  datos: { padding: "16px 24px 4px" },
  dato: { fontSize: "13px", color: "#1a1f1f", margin: "2px 0" },
  resumen: {
    fontSize: "12px",
    color: INER.gray,
    margin: "10px 0 0",
    fontWeight: "bold",
  },
  tablaWrap: { padding: "8px 24px 0" },
  h2: { fontSize: "14px", color: INER.green, margin: "8px 0" },
  tabla: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: {
    backgroundColor: INER.green,
    color: "#fff",
    textAlign: "left",
    padding: "7px 9px",
    fontSize: "11px",
  },
  td: {
    border: "1px solid #e0e4e4",
    padding: "7px 9px",
    verticalAlign: "top",
    color: "#1a1f1f",
  },
  tdObs: {
    border: "1px solid #e0e4e4",
    padding: "7px 9px",
    verticalAlign: "top",
    backgroundColor: INER.amberLight,
    color: "#1a1f1f",
  },
  hr: { borderColor: "#e0e4e4", margin: "20px 24px" },
  footer: {
    fontSize: "11px",
    color: INER.gray,
    padding: "0 24px 20px",
    textAlign: "center",
    lineHeight: "1.5",
  },
};
