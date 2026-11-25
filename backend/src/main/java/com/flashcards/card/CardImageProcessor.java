package com.flashcards.card;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

final class CardImageProcessor {

    private CardImageProcessor() {
    }

    static byte[] toJpeg(byte[] input, int maxEdge) {
        BufferedImage source;
        try (ByteArrayInputStream in = new ByteArrayInputStream(input)) {
            source = ImageIO.read(in);
        } catch (IOException ex) {
            throw unreadable();
        }
        if (source == null || source.getWidth() <= 0 || source.getHeight() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a JPG, PNG, or GIF image");
        }
        // iPhone photos often keep pixels sideways and store rotation in EXIF. ImageIO ignores
        // that tag, so bake orientation into the pixels before we scale and re-encode.
        source = applyExifOrientation(source, jpegOrientation(input));
        BufferedImage scaled = scale(source, maxEdge);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (!ImageIO.write(scaled, "jpg", out)) {
                throw unreadable();
            }
            byte[] jpeg = out.toByteArray();
            if (jpeg.length == 0) {
                throw unreadable();
            }
            return jpeg;
        } catch (IOException ex) {
            throw unreadable();
        }
    }

    /** EXIF Orientation (1–8), or 1 when missing / not a JPEG with EXIF. */
    static int jpegOrientation(byte[] jpeg) {
        if (jpeg == null || jpeg.length < 4 || (jpeg[0] & 0xFF) != 0xFF || (jpeg[1] & 0xFF) != 0xD8) {
            return 1;
        }
        int offset = 2;
        while (offset + 4 <= jpeg.length && (jpeg[offset] & 0xFF) == 0xFF) {
            int marker = jpeg[offset + 1] & 0xFF;
            if (marker == 0xFF) {
                offset++;
                continue;
            }
            if (marker == 0xD8 || marker == 0x01) {
                offset += 2;
                continue;
            }
            if (marker == 0xD9 || marker == 0xDA) {
                break;
            }
            int length = pack(jpeg, offset + 2, 2, false);
            if (length < 2 || offset + 2 + length > jpeg.length) {
                return 1;
            }
            if (marker == 0xE1
                    && length >= 8
                    && pack(jpeg, offset + 4, 4, false) == 0x45786966
                    && pack(jpeg, offset + 8, 2, false) == 0) {
                return readOrientationFromExif(jpeg, offset + 10, length - 8);
            }
            offset += 2 + length;
        }
        return 1;
    }

    static BufferedImage applyExifOrientation(BufferedImage image, int orientation) {
        if (image == null || orientation <= 1 || orientation > 8) {
            return image;
        }
        int width = image.getWidth();
        int height = image.getHeight();
        AffineTransform transform = new AffineTransform();
        int destWidth = width;
        int destHeight = height;
        switch (orientation) {
            case 2 -> {
                transform.scale(-1.0, 1.0);
                transform.translate(-width, 0);
            }
            case 3 -> {
                transform.translate(width, height);
                transform.rotate(Math.PI);
            }
            case 4 -> {
                transform.scale(1.0, -1.0);
                transform.translate(0, -height);
            }
            case 5 -> {
                transform.rotate(-Math.PI / 2);
                transform.scale(-1.0, 1.0);
                destWidth = height;
                destHeight = width;
            }
            case 6 -> {
                transform.translate(height, 0);
                transform.rotate(Math.PI / 2);
                destWidth = height;
                destHeight = width;
            }
            case 7 -> {
                transform.scale(-1.0, 1.0);
                transform.translate(-height, 0);
                transform.translate(0, width);
                transform.rotate(3 * Math.PI / 2);
                destWidth = height;
                destHeight = width;
            }
            case 8 -> {
                transform.translate(0, width);
                transform.rotate(3 * Math.PI / 2);
                destWidth = height;
                destHeight = width;
            }
            default -> {
                return image;
            }
        }
        BufferedImage dest = new BufferedImage(destWidth, destHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = dest.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, destWidth, destHeight);
            graphics.drawImage(image, transform, null);
        } finally {
            graphics.dispose();
        }
        return dest;
    }

    private static int readOrientationFromExif(byte[] jpeg, int offset, int length) {
        if (length < 8) {
            return 1;
        }
        int tag = pack(jpeg, offset, 4, false);
        if (tag != 0x49492A00 && tag != 0x4D4D002A) {
            return 1;
        }
        boolean littleEndian = tag == 0x49492A00;
        int ifdOffset = pack(jpeg, offset + 4, 4, littleEndian);
        if (ifdOffset < 8 || ifdOffset + 2 > length) {
            return 1;
        }
        int entryCount = pack(jpeg, offset + ifdOffset, 2, littleEndian);
        int entryOffset = offset + ifdOffset + 2;
        for (int i = 0; i < entryCount; i++) {
            if (entryOffset + 12 > offset + length) {
                break;
            }
            if (pack(jpeg, entryOffset, 2, littleEndian) == 0x0112) {
                int orientation = pack(jpeg, entryOffset + 8, 2, littleEndian);
                return orientation >= 1 && orientation <= 8 ? orientation : 1;
            }
            entryOffset += 12;
        }
        return 1;
    }

    private static int pack(byte[] bytes, int offset, int length, boolean littleEndian) {
        int start = offset;
        int step = 1;
        if (littleEndian) {
            start = offset + length - 1;
            step = -1;
        }
        int value = 0;
        for (int i = 0; i < length; i++) {
            value = (value << 8) | (bytes[start] & 0xFF);
            start += step;
        }
        return value;
    }

    private static BufferedImage scale(BufferedImage source, int maxEdge) {
        int width = source.getWidth();
        int height = source.getHeight();
        int edge = Math.max(width, height);
        int nextWidth = width;
        int nextHeight = height;
        if (edge > maxEdge) {
            double scale = maxEdge / (double) edge;
            nextWidth = Math.max(1, (int) Math.round(width * scale));
            nextHeight = Math.max(1, (int) Math.round(height * scale));
        }
        BufferedImage dest = new BufferedImage(nextWidth, nextHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = dest.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, nextWidth, nextHeight);
            graphics.drawImage(source, 0, 0, nextWidth, nextHeight, null);
        } finally {
            graphics.dispose();
        }
        return dest;
    }

    private static ApiException unreadable() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Could not read image");
    }
}
