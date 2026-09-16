package com.flashcards.agent;

import java.io.IOException;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.common.ApiException;

@Service
public class PdfTextExtractor {

    private static final byte[] PDF_MAGIC = { '%', 'P', 'D', 'F', '-' };

    private final AgentProperties properties;

    public PdfTextExtractor(AgentProperties properties) {
        this.properties = properties;
    }

    public PdfExtractedText extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String filename = safeFilename(file.getOriginalFilename());
        if (!filename.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a PDF file");
        }
        if (file.getSize() > properties.maxPdfBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PDF must be 8 MB or smaller");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read PDF");
        }
        if (bytes.length > properties.maxPdfBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PDF must be 8 MB or smaller");
        }
        if (!startsWithPdfMagic(bytes)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a PDF file");
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
            boolean truncated = pageCount > pagesUsed || text.length() > properties.maxPdfChars();
            if (text.length() > properties.maxPdfChars()) {
                text = clipAtWord(text, properties.maxPdfChars());
            }
            return new PdfExtractedText(filename, text, pageCount, pagesUsed, truncated);
        } catch (InvalidPasswordException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This PDF is password protected");
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read PDF");
        }
    }

    private static boolean startsWithPdfMagic(byte[] bytes) {
        if (bytes.length < PDF_MAGIC.length) {
            return false;
        }
        for (int i = 0; i < PDF_MAGIC.length; i++) {
            if (bytes[i] != PDF_MAGIC[i]) {
                return false;
            }
        }
        return true;
    }

    private static String safeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "document.pdf";
        }
        String name = original.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[\\r\\n\\t]", " ").trim();
        if (name.isEmpty()) {
            return "document.pdf";
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
