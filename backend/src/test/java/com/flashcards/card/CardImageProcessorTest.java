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
