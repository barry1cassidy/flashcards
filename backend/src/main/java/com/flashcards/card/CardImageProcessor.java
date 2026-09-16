package com.flashcards.card;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
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
