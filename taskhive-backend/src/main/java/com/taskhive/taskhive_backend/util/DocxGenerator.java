package com.taskhive.taskhive_backend.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Generates an authentic, valid Microsoft Word .docx binary from document HTML/plain text.
 * A .docx file is an Open Packaging Conventions (OPC) zip container holding WordprocessingML XML files.
 */
public class DocxGenerator {

    public static byte[] generateDocx(String title, String htmlOrText) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            // 1. [Content_Types].xml
            addZipEntry(zos, "[Content_Types].xml", getContentTypesXml());

            // 2. _rels/.rels
            addZipEntry(zos, "_rels/.rels", getRelsXml());

            // 3. word/_rels/document.xml.rels
            addZipEntry(zos, "word/_rels/document.xml.rels", getDocRelsXml());

            // 4. word/styles.xml
            addZipEntry(zos, "word/styles.xml", getStylesXml());

            // 5. word/document.xml
            addZipEntry(zos, "word/document.xml", buildDocumentXml(title, htmlOrText));
        }
        return baos.toByteArray();
    }

    private static void addZipEntry(ZipOutputStream zos, String path, String content) throws IOException {
        ZipEntry entry = new ZipEntry(path);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private static String getContentTypesXml() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
                "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">\n" +
                "  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>\n" +
                "  <Default Extension=\"xml\" ContentType=\"application/xml\"/>\n" +
                "  <Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>\n" +
                "  <Override PartName=\"/word/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml\"/>\n" +
                "</Types>";
    }

    private static String getRelsXml() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
                "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n" +
                "  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>\n" +
                "</Relationships>";
    }

    private static String getDocRelsXml() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
                "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n" +
                "  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>\n" +
                "</Relationships>";
    }

    private static String getStylesXml() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
                "<w:styles xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\n" +
                "  <w:docDefaults>\n" +
                "    <w:rPrDefault>\n" +
                "      <w:rPr>\n" +
                "        <w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\" w:cs=\"Calibri\"/>\n" +
                "        <w:sz w:val=\"22\"/>\n" +
                "        <w:color w:val=\"222222\"/>\n" +
                "      </w:rPr>\n" +
                "    </w:rPrDefault>\n" +
                "  </w:docDefaults>\n" +
                "  <w:style w:type=\"paragraph\" w:default=\"1\" w:styleId=\"Normal\">\n" +
                "    <w:name w:val=\"Normal\"/>\n" +
                "    <w:pPr><w:spacing w:after=\"160\" w:line=\"276\" w:lineRule=\"auto\"/></w:pPr>\n" +
                "  </w:style>\n" +
                "  <w:style w:type=\"paragraph\" w:styleId=\"Heading1\">\n" +
                "    <w:name w:val=\"heading 1\"/>\n" +
                "    <w:pPr><w:spacing w:before=\"280\" w:after=\"120\"/></w:pPr>\n" +
                "    <w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/><w:b/><w:sz w:val=\"36\"/><w:color w:val=\"111827\"/></w:rPr>\n" +
                "  </w:style>\n" +
                "  <w:style w:type=\"paragraph\" w:styleId=\"Heading2\">\n" +
                "    <w:name w:val=\"heading 2\"/>\n" +
                "    <w:pPr><w:spacing w:before=\"240\" w:after=\"80\"/></w:pPr>\n" +
                "    <w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/><w:b/><w:sz w:val=\"28\"/><w:color w:val=\"1F2937\"/></w:rPr>\n" +
                "  </w:style>\n" +
                "  <w:style w:type=\"paragraph\" w:styleId=\"Heading3\">\n" +
                "    <w:name w:val=\"heading 3\"/>\n" +
                "    <w:pPr><w:spacing w:before=\"200\" w:after=\"60\"/></w:pPr>\n" +
                "    <w:rPr><w:rFonts w:ascii=\"Calibri\" w:hAnsi=\"Calibri\"/><w:b/><w:sz w:val=\"24\"/><w:color w:val=\"374151\"/></w:rPr>\n" +
                "  </w:style>\n" +
                "</w:styles>";
    }

    private static String buildDocumentXml(String title, String htmlOrText) {
        StringBuilder body = new StringBuilder();

        // Title paragraph
        if (title != null && !title.isBlank()) {
            body.append("<w:p>\n")
                .append("  <w:pPr><w:pStyle w:val=\"Heading1\"/><w:spacing w:after=\"200\"/></w:pPr>\n")
                .append("  <w:r><w:rPr><w:b/><w:sz w:val=\"40\"/><w:color w:val=\"111827\"/></w:rPr><w:t>")
                .append(escapeXml(title))
                .append("</w:t></w:r>\n")
                .append("</w:p>\n");
        }

        if (htmlOrText != null && !htmlOrText.isBlank()) {
            // Convert standard HTML paragraphs, breaks, headings to OpenXML
            String normalized = htmlOrText
                    .replaceAll("(?i)<br\\s*/?>", "\n")
                    .replaceAll("(?i)</div>", "\n")
                    .replaceAll("(?i)</p>", "\n")
                    .replaceAll("(?i)</h1>", "\n")
                    .replaceAll("(?i)</h2>", "\n")
                    .replaceAll("(?i)</h3>", "\n")
                    .replaceAll("(?i)</li>", "\n");

            // Split into paragraph blocks
            String[] lines = normalized.split("\n+");
            for (String line : lines) {
                String clean = line.replaceAll("<[^>]+>", "").trim();
                if (!clean.isEmpty()) {
                    body.append("<w:p>\n")
                        .append("  <w:r><w:t xml:space=\"preserve\">")
                        .append(escapeXml(clean))
                        .append("</w:t></w:r>\n")
                        .append("</w:p>\n");
                }
            }
        }

        // Section properties (standard Letter / A4 with 1-inch margins)
        body.append("<w:sectPr>\n")
            .append("  <w:pgSz w:w=\"12240\" w:h=\"15840\"/>\n")
            .append("  <w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/>\n")
            .append("</w:sectPr>\n");

        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
                "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\n" +
                "  <w:body>\n" +
                body.toString() +
                "  </w:body>\n" +
                "</w:document>";
    }

    private static String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}
