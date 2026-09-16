package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import com.flashcards.common.ApiException;

class PdfTextExtractorTest {

    private final PdfTextExtractor extractor =
            new PdfTextExtractor(new AgentProperties("", "", "", 40, 40, 40, 90, 2000, 8 * 1024 * 1024, 1, 40));

    @Test
    void extractsSelectableText() throws Exception {
        byte[] pdf = pdfWithPages("Madrid travel phrases");
        PdfExtractedText extracted = extractor.extract(pdfFile("notes.pdf", pdf));
        assertTrue(extracted.text().contains("Madrid travel phrases"));
        assertEquals("notes.pdf", extracted.filename());
        assertEquals(1, extracted.pageCount());
        assertFalse(extracted.truncated());
    }

    @Test
    void rejectsNonPdf() {
        ApiException ex = assertThrows(
                ApiException.class,
                () -> extractor.extract(new MockMultipartFile("file", "notes.docx", "application/pdf", "hello".getBytes())));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Upload a PDF file", ex.getMessage());
    }

    @Test
    void rejectsEmptyTextPdf() throws Exception {
        byte[] pdf = emptyPdf();
        ApiException ex = assertThrows(ApiException.class, () -> extractor.extract(pdfFile("blank.pdf", pdf)));
        assertEquals("This PDF has no selectable text", ex.getMessage());
    }

    @Test
    void rejectsPasswordProtectedPdf() throws Exception {
        byte[] pdf = passwordPdf("secret text");
        ApiException ex = assertThrows(ApiException.class, () -> extractor.extract(pdfFile("locked.pdf", pdf)));
        assertEquals("This PDF is password protected", ex.getMessage());
    }

    @Test
    void truncatesExtraPages() throws Exception {
        byte[] pdf = pdfWithPages("page one", "page two should be dropped");
        PdfExtractedText extracted = extractor.extract(pdfFile("long.pdf", pdf));
        assertTrue(extracted.truncated());
        assertEquals(2, extracted.pageCount());
        assertEquals(1, extracted.pagesUsed());
        assertTrue(extracted.text().contains("page one"));
        assertFalse(extracted.text().contains("dropped"));
    }

    private static MockMultipartFile pdfFile(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/pdf", bytes);
    }

    private static byte[] pdfWithPages(String... lines) throws IOException {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (String line : lines) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(50, 700);
                    stream.showText(line);
                    stream.endText();
                }
            }
            document.save(out);
            return out.toByteArray();
        }
    }

    private static byte[] emptyPdf() throws IOException {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.save(out);
            return out.toByteArray();
        }
    }

    private static byte[] passwordPdf(String line) throws IOException {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                stream.newLineAtOffset(50, 700);
                stream.showText(line);
                stream.endText();
            }
            StandardProtectionPolicy policy = new StandardProtectionPolicy("owner", "user", new AccessPermission());
            document.protect(policy);
            document.save(out);
            return out.toByteArray();
        }
    }
}
