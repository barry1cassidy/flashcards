package com.flashcards.card;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

class CardImageProcessorTest {

    @Test
    void convertsPngToJpeg() throws Exception {
        byte[] jpeg = CardImageProcessor.toJpeg(png(40, 30), 1600);
        assertTrue(jpeg.length > 0);
        assertEquals((byte) 0xFF, jpeg[0]);
        assertEquals((byte) 0xD8, jpeg[1]);
    }

    @Test
    void scalesDownLargeImages() throws Exception {
        byte[] jpeg = CardImageProcessor.toJpeg(png(2000, 1000), 400);
        var image = ImageIO.read(new java.io.ByteArrayInputStream(jpeg));
        assertEquals(400, image.getWidth());
        assertEquals(200, image.getHeight());
    }

    @Test
    void rejectsGarbage() {
        ApiException ex = assertThrows(ApiException.class, () -> CardImageProcessor.toJpeg("not-an-image".getBytes(), 1600));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Upload a JPG, PNG, or GIF image", ex.getMessage());
    }

    @Test
    void readsJpegExifOrientation() {
        assertEquals(6, CardImageProcessor.jpegOrientation(jpegWithOrientation(6)));
        assertEquals(1, CardImageProcessor.jpegOrientation(jpegWithOrientation(1)));
        assertEquals(1, CardImageProcessor.jpegOrientation(new byte[] {(byte) 0xFF, (byte) 0xD8, 0, 1}));
    }

    @Test
    void rotatesPixelsForExifOrientation6() throws Exception {
        BufferedImage source = new BufferedImage(40, 20, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = source.createGraphics();
        graphics.setColor(Color.RED);
        graphics.fillRect(0, 0, 40, 20);
        graphics.dispose();
        BufferedImage rotated = CardImageProcessor.applyExifOrientation(source, 6);
        assertEquals(20, rotated.getWidth());
        assertEquals(40, rotated.getHeight());
    }

    /** Minimal JPEG with an APP1 Exif IFD0 Orientation tag. */
    static byte[] jpegWithOrientation(int orientation) {
        // SOI
        // APP1 length = 2 + 6 ("Exif\0\0") + 8 (TIFF header) + 2 (count) + 12 (orientation entry) + 4 (next IFD)
        // = 34 data bytes after marker, length field = 2 + 34? Standard: length includes length bytes themselves.
        // Segment content after marker: length(2) + payload
        // payload = Exif\0\0 (6) + TIFF
        // TIFF LE: II * \0 + IFD0 offset 8 + IFD0: count 1 + entry Orientation + next IFD 0
        byte[] app1Payload = new byte[] {
                'E', 'x', 'i', 'f', 0, 0,
                'I', 'I', 42, 0,
                8, 0, 0, 0,
                1, 0,
                0x12, 0x01,
                3, 0,
                1, 0, 0, 0,
                (byte) orientation, 0, 0, 0,
                0, 0, 0, 0
        };
        int length = app1Payload.length + 2;
        byte[] jpeg = new byte[2 + 2 + 2 + app1Payload.length + 2];
        int i = 0;
        jpeg[i++] = (byte) 0xFF;
        jpeg[i++] = (byte) 0xD8;
        jpeg[i++] = (byte) 0xFF;
        jpeg[i++] = (byte) 0xE1;
        jpeg[i++] = (byte) ((length >> 8) & 0xFF);
        jpeg[i++] = (byte) (length & 0xFF);
        System.arraycopy(app1Payload, 0, jpeg, i, app1Payload.length);
        i += app1Payload.length;
        jpeg[i++] = (byte) 0xFF;
        jpeg[i++] = (byte) 0xD9;
        return jpeg;
    }

    static byte[] png(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, width, height);
        graphics.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
