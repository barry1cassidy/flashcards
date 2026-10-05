package com.flashcards.agent;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.common.ApiException;

@Service
public class DocumentTextExtractor {

    private static final byte[] PDF_MAGIC = { '%', 'P', 'D', 'F', '-' };
    private static final byte[] ZIP_MAGIC = { 'P', 'K' };

    private final AgentProperties properties;

    public DocumentTextExtractor(AgentProperties properties) {
        this.properties = properties;
    }

    public PdfExtractedText extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String filename = safeFilename(file.getOriginalFilename());
        String lower = filename.toLowerCase(Locale.ROOT);
        byte[] bytes = readBytes(file);
        if (bytes.length > properties.maxPdfBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File must be 8 MB or smaller");
        }
        if (lower.endsWith(".pdf")) {
            return extractPdf(filename, bytes);
        }
        if (lower.endsWith(".docx")) {
            return extractDocx(filename, bytes);
        }
        if (lower.endsWith(".txt") || lower.endsWith(".text")) {
            return extractText(filename, bytes);
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a PDF, Word (.docx), or text file");
    }

    private PdfExtractedText extractPdf(String filename, byte[] bytes) {
        if (!startsWith(bytes, PDF_MAGIC)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a PDF, Word (.docx), or text file");
        }
        try (RandomAccessReadBuffer reader = new RandomAccessReadBuffer(bytes);
                PDDocument document = Loader.loadPDF(reader)) {
            int pageCount = document.getNumberOfPages();
            if (pageCount < 1) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "This PDF has no selectable text");
            }
            int pagesUsed = Math.min(pageCount, properties.maxPdfPages());
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setStartPage(1);
            stripper.setEndPage(pagesUsed);
            String text = collapse(stripper.getText(document));
            if (text.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "This PDF has no selectable text");
            }
            return clipped(filename, text, pageCount, pagesUsed);
        } catch (InvalidPasswordException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This PDF is password protected");
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read PDF");
        }
    }

    private PdfExtractedText extractDocx(String filename, byte[] bytes) {
        if (!startsWith(bytes, ZIP_MAGIC)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a PDF, Word (.docx), or text file");
        }
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
                XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = collapse(extractor.getText());
            if (text.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "This Word file has no selectable text");
            }
            return clipped(filename, text, 1, 1);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read Word file");
        }
    }

    private PdfExtractedText extractText(String filename, byte[] bytes) {
        Charset charset = detectCharset(bytes);
        String text = collapse(new String(bytes, charset));
        if (text.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This text file is empty");
        }
        return clipped(filename, text, 1, 1);
    }

    private PdfExtractedText clipped(String filename, String text, int pageCount, int pagesUsed) {
        boolean truncated = pageCount > pagesUsed || text.length() > properties.maxPdfChars();
        if (text.length() > properties.maxPdfChars()) {
            text = clipAtWord(text, properties.maxPdfChars());
        }
        return new PdfExtractedText(filename, text, pageCount, pagesUsed, truncated);
    }

    private byte[] readBytes(MultipartFile file) {
        if (file.getSize() > properties.maxPdfBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File must be 8 MB or smaller");
        }
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read file");
        }
    }

    private static Charset detectCharset(byte[] bytes) {
        if (bytes.length >= 3
                && (bytes[0] & 0xff) == 0xef
                && (bytes[1] & 0xff) == 0xbb
                && (bytes[2] & 0xff) == 0xbf) {
            return StandardCharsets.UTF_8;
        }
        return StandardCharsets.UTF_8;
    }

    private static boolean startsWith(byte[] bytes, byte[] magic) {
        if (bytes.length < magic.length) {
            return false;
        }
        for (int i = 0; i < magic.length; i++) {
            if (bytes[i] != magic[i]) {
                return false;
            }
        }
        return true;
    }

    private static String safeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "document.txt";
        }
        String name = original.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[\\r\\n\\t]", " ").trim();
        if (name.isEmpty()) {
            return "document.txt";
        }
        return name.length() <= 80 ? name : name.substring(0, 80);
    }

    private static String collapse(String value) {
        if (value == null) {
            return "";
        }
        return value.replace('\u0000', ' ').replaceAll("[ \\t]+", " ").replaceAll("\\n{3,}", "\n\n").trim();
    }

    private static String clipAtWord(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        String cut = value.substring(0, max);
        int space = cut.lastIndexOf(' ');
        if (space >= max / 2) {
            cut = cut.substring(0, space);
        }
        return cut.trim();
    }
}
